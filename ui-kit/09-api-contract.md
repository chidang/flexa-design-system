# 09 — Flexa API Contract

> Owns: REST conventions, resource models, payloads, errors, pagination, idempotency, webhooks.
> Reference product: **Flexa Marketplace** (multi-vendor, escrow payments, messaging, disputes, reviews). Every convention in §1 and §3 is **binding for all Flexa products** (Booking, CRM, …); §2 resource models are Marketplace-specific but are the template other products copy.
> Cross-references: flows that call these endpoints → **07**; screens that render these payloads → **08**; user-facing copy for every machine error code → **10** (this document owns machine codes only, never copy).

---

## 1. Conventions (normative)

### 1.1 Base URL & versioning

| Rule | Value |
|---|---|
| Base URL | `https://api.flexa.example` (per product/deployment) |
| Version prefix | `/v1` — path-based, mandatory on every request |
| Evolution | **Additive only** within a major version: new fields, new endpoints, new enum values on *response* fields only when documented as open enums. Clients MUST ignore unknown response fields. |
| Breaking change | Requires `/v2`. Breaking = removing/renaming a field, changing a type, changing an error code's HTTP status, narrowing a request enum. |
| Deprecation | Deprecated endpoints keep working ≥ 180 days. Responses carry `Deprecation: true` and `Sunset: <HTTP-date>` headers plus `Link: <docs-url>; rel="deprecation"`. Removal only after the Sunset date. |
| Status enums | **Closed** enums (client may exhaustively switch): payment `status`, escrow `stage`, order `status`, listing `status`, dispute `status`. All other string enums are open — treat unknown values as `"unknown"` in UI (see 08 §1.1 cross-screen conventions). |

### 1.2 Authentication

| Mechanism | Use | Transport |
|---|---|---|
| **Bearer access token** | Browser/mobile apps, all persona traffic | `Authorization: Bearer <accessToken>` — JWT, TTL 15 min |
| **Refresh token** | Obtain new access token | `POST /v1/auth/refresh` — opaque, TTL 30 days, rotated on every use (reuse of a rotated token revokes the session family) |
| **API key** | Server-to-server integrations, webhook management | `Authorization: Bearer <apiKey>` — prefix `fxk_live_` / `fxk_test_`, scoped, no user context |

**Scopes.** Tokens carry `scopes[]`. Persona → default scope bundles:

| Persona (see README § Personas) | Scope bundle |
|---|---|
| Guest | *(no token — public endpoints only)* |
| Buyer | `me`, `cart`, `orders:read`, `orders:write`, `payments:write`, `disputes:write`, `reviews:write`, `messages`, `notifications` |
| Seller | Buyer bundle + `store`, `listings:write`, `payouts:read`, `payouts:write` |
| Admin | `admin:users`, `admin:listings`, `admin:orders`, `admin:disputes`, `admin:payments`, `admin:audit`, `admin:system` (support staff = subset, see 08 §1.2) |

Endpoint tables in §2 list the **minimum** scope. `public` = no auth required. Missing/expired token → `401 unauthorized`; valid token, insufficient scope or not the resource owner → `403 forbidden`.

### 1.3 Resource naming

- Plural, kebab-case path segments: `/v1/listings`, `/v1/payment-intents`, `/v1/orders/{id}/escrow-events`.
- Nesting max 2 levels; nested only when the child cannot exist without the parent (`/orders/{id}/escrow-events`), otherwise top-level with a filter (`/v1/refunds?orderId=`).
- Non-CRUD state transitions are POST verbs on the resource: `POST /v1/orders/{id}/deliver`, `POST /v1/disputes/{id}/resolve`. Never `PATCH status`.
- Singleton per-user resources hang off `/v1/me`: `/v1/me/store`, `/v1/me/notification-preferences`.

### 1.4 Field naming & common fields

| Rule | Detail |
|---|---|
| JSON keys | camelCase, always. No snake_case, no abbreviations (`quantity`, not `qty`). |
| `id` | String **ULID** (26-char Crockford base32, e.g. `"01J1F8M9V2N3P4Q5R6S7T8U9VA"`). Lexically sortable by creation time. No type prefix — type is unambiguous from the endpoint. Never expose numeric DB ids. |
| Foreign keys | `<resource>Id` — `orderId`, `sellerId`, `listingId`. |
| Timestamps | ISO-8601 UTC with `Z` and millisecond precision: `"2026-07-12T09:30:00.000Z"`. Field names end in `At` (`createdAt`, `deliveredAt`, `autoReleaseAt`). Never local time, never epoch integers. |
| Audit fields | **Every resource** carries `createdAt` and `updatedAt`. Admin-visible resources additionally carry `createdBy`/`updatedBy` (user id) where meaningful. |
| Money | Always the money object — never a bare number: `{"amount": 12900, "currency": "USD"}`. `amount` = **integer minor units** (cents), `currency` = ISO-4217 uppercase. Negative amounts never appear; direction is expressed by the field name (`refundedTotal`, not `total: -x`). |
| Booleans | Positive names: `isDefault`, `hasMore`, `twoFactorEnabled`. Never `notX`/`disabled`. |
| Nulls | `null` = "known to be absent". Omitted response fields are reserved for sparse fieldsets only (§1.8). |
| Enums | lower_snake_case string values: `"pending_review"`, `"partially_refunded"`. |

### 1.5 Requests

- Body: `Content-Type: application/json; charset=utf-8`. Anything else → `415`.
- `POST` creates / performs transitions. `PATCH` updates with **partial-merge semantics**: only present fields change; `null` explicitly clears a nullable field; absent = unchanged; arrays are replaced wholesale (no element-level patching). `PUT` is **avoided** — the only PUT endpoints are true whole-document replacements (`/v1/me/notification-preferences`, `/v1/me/store/payout-account`).
- `DELETE` is soft-delete/archive wherever the resource is referenced elsewhere; response `204 No Content`.
- Request size limit 1 MB (`413 payload_too_large`); uploads never go through the JSON API (§2.17).

### 1.6 Responses

| Shape | When |
|---|---|
| Single object at top level | `GET /v1/orders/{id}`, all POST/PATCH results |
| `{ "data": [...], "pageInfo": {...} }` | Every collection endpoint, no exceptions — even when the caller received fewer than `limit` items |
| `204 No Content` | DELETE, mark-read, sign-out |

Successful creates return `201` with the full resource and `Location: /v1/<resource>/{id}`. Transitions return `200` with the updated resource (client never needs a follow-up GET).

### 1.7 Pagination (cursor)

```
GET /v1/listings?cursor=eyJrIjoiMDFKMUY4...&limit=20
```

| Param / field | Rule |
|---|---|
| `limit` | Default **20**, max **100**. Out of range → clamped, not an error. |
| `cursor` | Opaque string from a previous `pageInfo.nextCursor`. Malformed/expired → `400 invalid_cursor`. Never construct cursors client-side. |
| `pageInfo.nextCursor` | `string \| null` — `null` on the last page. |
| `pageInfo.hasMore` | `boolean`. |
| `pageInfo.totalCount` | `number` — **only** where counting is cheap (admin moderation queue, notifications badge). Absent everywhere else; UIs must not depend on it (see 08 § list screens). |

```json
{
  "data": [{ "id": "01J1F8M9V2N3P4Q5R6S7T8U9VA" }],
  "pageInfo": { "nextCursor": "eyJrIjoiMDFKMUY4TTlWMiJ9", "hasMore": true }
}
```

Offset pagination is forbidden. Cursors are stable under concurrent writes (keyset on ULID).

### 1.8 Filtering, sorting, sparse fieldsets

**Filtering — one style, everywhere: flat, well-known query params per resource.** No `filter[...]` brackets, no query DSL.

```
GET /v1/orders?status=delivered&sellerId=01J1...&createdFrom=2026-07-01T00:00:00.000Z
```

- Enum filters accept comma-separated OR: `?status=paid,in_fulfilment`.
- Range filters are paired params: `createdFrom`/`createdTo`, `amountMin`/`amountMax` (minor units).
- Unknown filter params → `400 invalid_request` (fail loudly; silent ignoring hides client bugs).

**Sorting:** `?sort=-createdAt` — comma-separated fields, `-` prefix = descending. Each endpoint documents its sortable allowlist; default is `-createdAt`. Unknown sort field → `400 invalid_request`.

**Includes (compound documents):** `?include=seller,category` embeds related objects under their singular key. Per-endpoint **allowlist** (documented in §2 tables); unknown include → `400 invalid_request`. Without `include`, only the foreign key id is present. Max depth 1 (no `seller.payoutAccount`).

**Sparse fieldsets:** `?fields=id,title,price,status` — response objects contain only the listed fields plus `id`. Applies to the primary resource only.

### 1.9 Errors

One envelope for every non-2xx response:

```json
{
  "error": {
    "code": "validation_failed",
    "message": "One or more fields are invalid.",
    "details": [
      { "field": "price.amount", "code": "min", "message": "Must be at least 100." },
      { "field": "title", "code": "required", "message": "Title is required." }
    ],
    "requestId": "req_01J1F8MZX0"
  }
}
```

- `code` — stable machine code from the catalog below. **This document owns codes**; the user-facing copy per code lives in **10** (UI must map code → copy, never render `message` verbatim).
- `message` — developer-facing English, may change without notice.
- `details[]` — present only on `validation_failed`; each entry `{field, code, message}` with `field` as a dot-path into the request body.
- `requestId` — echo of the `X-Request-Id` header, for support correlation.

**Machine code catalog (closed set — additions are a minor version event announced in the changelog):**

| Code | HTTP | Meaning / canonical trigger |
|---|---|---|
| `invalid_request` | 400 | Malformed JSON, unknown filter/sort/include param |
| `invalid_cursor` | 400 | Unparseable or expired pagination cursor |
| `unauthorized` | 401 | Missing/expired/invalid token — client should refresh or re-auth (see 05 § Authentication (A8)) |
| `payment_failed` | 402 | Payment provider declined the charge (card declined, 3DS failed) |
| `insufficient_funds` | 402 | Payout/refund exceeds available balance |
| `forbidden` | 403 | Valid auth, but wrong scope, wrong owner, or action not allowed for role |
| `account_suspended` | 403 | Actor's account or store is suspended — all writes rejected |
| `not_found` | 404 | Resource doesn't exist **or** exists but caller may not know it exists |
| `method_not_allowed` | 405 | Wrong HTTP verb |
| `conflict` | 409 | Uniqueness violation (email already registered, duplicate review) |
| `idempotency_conflict` | 409 | Same `Idempotency-Key` replayed with a **different** request body |
| `state_conflict` | 409 | Transition illegal from current state — e.g. approving an order whose escrow stage is not `delivered`, submitting a listing that is not `draft`/`rejected` |
| `precondition_failed` | 412 | `If-Match` version mismatch on optimistic-concurrency PATCH |
| `payload_too_large` | 413 | Body > 1 MB or upload > declared size |
| `unsupported_media_type` | 415 | Non-JSON body on a JSON endpoint |
| `validation_failed` | 422 | Field-level validation errors, with `details[]` |
| `rate_limited` | 429 | Quota exceeded — response includes `Retry-After` seconds |
| `internal_error` | 500 | Unhandled server fault — safe to retry with backoff |
| `service_unavailable` | 503 | Maintenance/overload — retry with backoff, honor `Retry-After` |

`state_conflict` messages always name both states: `"Cannot approve: escrow stage is payment_held, expected delivered."` — the UI still renders copy from 10, but support reads `message`.

### 1.10 Idempotency

- Header `Idempotency-Key: <uuid-or-ulid>` (client-generated, ≤ 64 chars) is **required** on: `POST /v1/orders`, `POST /v1/payment-intents`, `POST /v1/refunds`, `POST /v1/payouts`. Accepted (optional) on every other POST.
- Replay window **24 h**: same key + byte-identical body → the original response is replayed (same status, body, and `Idempotent-Replayed: true` header). Same key + different body → `409 idempotency_conflict`.
- Keys are scoped per token principal — two users may use the same key value.

### 1.11 Rate limits

| Header | Meaning |
|---|---|
| `X-RateLimit-Limit` | Requests allowed in the current window |
| `X-RateLimit-Remaining` | Remaining in window |
| `X-RateLimit-Reset` | Unix seconds when the window resets |
| `Retry-After` | Seconds to wait — on `429` only |

Default buckets: 600 req/min per token (read), 120 req/min (write), 10 req/min on auth endpoints per IP. Server-to-server API keys get negotiated limits.

### 1.12 Optimistic concurrency

Admin-mutable resources (users, listings moderation, categories, system settings) carry an integer `version`, incremented on every write. Responses include `ETag: "v<version>"`. Admin `PATCH` on these resources **must** send `If-Match: "v<version>"`; mismatch → `412 precondition_failed`, client refetches and re-applies (see 08 §3.22 Categories & Attributes (admin) for the canonical admin edit screen). Non-admin resources rely on last-write-wins plus transition guards (`state_conflict`).

### 1.13 Misc

- `X-Request-Id` accepted from clients (else generated); echoed on responses and in error envelopes.
- All list responses are ordered `-createdAt` unless documented otherwise.
- CORS: browser origins allowlisted per deployment; credentials via Bearer only (no cookies on `/v1`).

---

## 2. Resource models & endpoints

Legend for endpoint tables: **Scope** = minimum required (§1.2). *(idem)* = `Idempotency-Key` required. *(If-Match)* = optimistic concurrency required.

### 2.1 Auth & Sessions

**Session** resource:

| Field | Type | Description |
|---|---|---|
| `accessToken` | string | JWT, 15 min TTL |
| `refreshToken` | string | Opaque, rotated on refresh |
| `expiresAt` | string | Access token expiry (ISO-8601) |
| `user` | User | The authenticated user (see 2.2) |

| Method | Path | Scope | Description |
|---|---|---|---|
| POST | `/v1/auth/sign-up` | public | Create account; sends verification email |
| POST | `/v1/auth/sign-in` | public | Email + password (+ `twoFactorCode` when enrolled) → Session |
| POST | `/v1/auth/refresh` | public | `{refreshToken}` → new Session (rotation) |
| POST | `/v1/auth/sign-out` | `me` | Revoke current session → 204 |
| POST | `/v1/auth/verify-email` | public | `{token}` from email link |
| POST | `/v1/auth/verify-email/resend` | `me` | Re-send verification mail |
| POST | `/v1/auth/password-reset` | public | `{email}` — always 202 (no account enumeration) |
| POST | `/v1/auth/password-reset/confirm` | public | `{token, newPassword}` |
| POST | `/v1/auth/2fa/enroll` | `me` | Begin TOTP enrollment → `{secret, otpauthUrl}` |
| POST | `/v1/auth/2fa/verify` | `me` | `{code}` — activates 2FA, returns `recoveryCodes[]` (shown once) |
| DELETE | `/v1/auth/2fa` | `me` | Disable 2FA (requires `{code}` in body) |

Sign-in example — `POST /v1/auth/sign-in`:

```json
{ "email": "mai@example.com", "password": "s3cret-passphrase", "twoFactorCode": "492013" }
```

`200 OK`:

```json
{
  "accessToken": "eyJhbGciOiJFUzI1NiIs...",
  "refreshToken": "rt_9f2c1c0b7a5e4d3c",
  "expiresAt": "2026-07-12T09:45:00.000Z",
  "user": {
    "id": "01J1F8M9V2N3P4Q5R6S7T8U9VA",
    "email": "mai@example.com",
    "displayName": "Mai Tran",
    "roles": ["buyer", "seller"],
    "emailVerifiedAt": "2026-06-01T08:00:00.000Z",
    "twoFactorEnabled": true,
    "createdAt": "2026-05-30T10:12:00.000Z",
    "updatedAt": "2026-07-01T11:00:00.000Z"
  }
}
```

Wrong credentials and wrong 2FA code both return `401 unauthorized` (copy in 10 distinguishes via a `details`-free generic line — no enumeration). Sign-up/sign-in flows: see 07 § G2 — Sign up and 05 § Authentication (A8).

### 2.2 Users & Profiles

**User**:

| Field | Type | Description |
|---|---|---|
| `id` | string (ULID) | |
| `email` | string | Unique; change triggers re-verification |
| `displayName` | string | Public name |
| `avatarUrl` | string \| null | From Uploads (2.17) |
| `roles` | string[] | `buyer` \| `seller` \| `admin` (additive — a seller is also a buyer) |
| `emailVerifiedAt` | string \| null | |
| `twoFactorEnabled` | boolean | |
| `status` | string | `active` \| `suspended` |
| `createdAt` / `updatedAt` | string | |

**Address**: `id`, `label`, `recipient`, `line1`, `line2?`, `city`, `region`, `postalCode`, `countryCode` (ISO-3166-1 alpha-2), `isDefault`, audit fields.

| Method | Path | Scope | Description |
|---|---|---|---|
| GET | `/v1/me` | `me` | Current user |
| PATCH | `/v1/me` | `me` | Update `displayName`, `avatarUrl` (partial merge) |
| POST | `/v1/me/email-change` | `me` | `{newEmail, password}` → verification mail |
| POST | `/v1/me/password-change` | `me` | `{currentPassword, newPassword}` |
| GET | `/v1/me/addresses` | `me` | List (no pagination — hard cap 20) |
| POST | `/v1/me/addresses` | `me` | Create |
| PATCH | `/v1/me/addresses/{id}` | `me` | Update; `isDefault: true` demotes previous default |
| DELETE | `/v1/me/addresses/{id}` | `me` | 204 |

### 2.3 Sellers & Stores

**Store**:

| Field | Type | Description |
|---|---|---|
| `id` | string | |
| `ownerId` | string | User id |
| `name` | string | Public store name |
| `slug` | string | URL slug, unique |
| `description` | string \| null | |
| `logoUrl` / `bannerUrl` | string \| null | |
| `onboardingStatus` | string | `not_started` \| `in_progress` \| `pending_verification` \| `complete` |
| `payoutAccountStatus` | string | `missing` \| `pending` \| `verified` \| `rejected` |
| `rating` | number \| null | Average 1–5, 1 decimal; null until 3 reviews |
| `reviewCount` | number | |
| `status` | string | `active` \| `suspended` |
| `createdAt` / `updatedAt` | string | |

| Method | Path | Scope | Description |
|---|---|---|---|
| POST | `/v1/stores` | `me` | Create store — starts Seller Onboarding Wizard (see 07 § Seller onboarding); grants `seller` role |
| GET | `/v1/me/store` | `store` | Own store (404 if none) |
| PATCH | `/v1/me/store` | `store` | Update profile fields |
| GET | `/v1/stores/{id}` | public | Public store profile (public field subset: no payout/onboarding fields) |
| GET | `/v1/stores/{id}/listings` | public | Active listings of a store (paginated) |
| PUT | `/v1/me/store/payout-account` | `payouts:write` | Whole-document replace: `{type: "bank_account", countryCode, currency, accountHolder, iban?, accountNumber?, routingNumber?}` → status `pending` until verified |
| GET | `/v1/me/store/payout-account` | `payouts:read` | Masked view (`accountNumberLast4`) |

Onboarding is **derived**, not set: `complete` requires verified email + store profile + `payoutAccountStatus=verified`. Listings cannot be submitted for review until `onboardingStatus=complete` (`state_conflict` otherwise).

### 2.4 Listings

**Listing**:

| Field | Type | Description |
|---|---|---|
| `id` | string | |
| `sellerId` | string | Store id |
| `title` | string | ≤ 140 chars |
| `slug` | string | Generated, unique |
| `description` | string | Markdown subset (see 10 § seller content) |
| `categoryId` | string | Leaf category required |
| `attributes` | object | Map `attributeKey → value`, validated against category attributes (2.5) |
| `price` | Money | |
| `quantity` | number \| null | null = unlimited (digital/service) |
| `media` | MediaItem[] | `{id, url, thumbnailUrl, alt, position}` — first item is the cover |
| `status` | string | **`draft` \| `pending_review` \| `active` \| `paused` \| `rejected` \| `suspended` \| `archived`** — `paused` = seller-set visibility off; `suspended` = admin-set |
| `rejectionReason` | string \| null | Set by moderation on `rejected` |
| `publishedAt` | string \| null | First time `active` |
| `version` | number | Optimistic concurrency (admin moderation) |
| `createdAt` / `updatedAt` | string | |

**Status machine** (moderation — actions in parentheses):

```
draft ──(submit)──▶ pending_review ──(admin approve)──▶ active
  ▲                        │(admin reject)                │(admin suspend)
  │                        ▼                              ▼
  └──(edit)──────────── rejected                      suspended ──(admin reinstate)──▶ active
active ──(seller pause)──▶ paused ──(seller unpause)──▶ active   (visibility only — no re-review)
any of draft|active|paused|rejected ──(archive)──▶ archived   (terminal for seller; unarchive → draft)
```

Editing an `active` listing's *moderated* fields (title, description, media, category) moves it back to `pending_review`; price/quantity edits keep it `active`.

| Method | Path | Scope | Description |
|---|---|---|---|
| GET | `/v1/listings` | public | Active listings. Filters: `categoryId`, `sellerId`, `priceMin`, `priceMax`, `q` (simple match — full search is 2.6). Include allowlist: `seller,category` |
| GET | `/v1/listings/{id}` | public | 404 unless `active` — owner/admin see all statuses |
| POST | `/v1/listings` | `listings:write` | Create as `draft` |
| PATCH | `/v1/listings/{id}` | `listings:write` | Owner edit (partial merge; see re-review rule above) |
| DELETE | `/v1/listings/{id}` | `listings:write` | Archive (soft) → 204 |
| POST | `/v1/listings/{id}/media` | `listings:write` | Attach `{uploadId, alt, position}` (upload flow 2.17) |
| DELETE | `/v1/listings/{id}/media/{mediaId}` | `listings:write` | Detach → 204 |
| POST | `/v1/listings/{id}/submit` | `listings:write` | `draft`/`rejected` → `pending_review`; else `state_conflict` |
| POST | `/v1/listings/{id}/pause` | `listings:write` | `active` → `paused` (seller-set visibility off; no re-review on unpause) |
| POST | `/v1/listings/{id}/unpause` | `listings:write` | `paused` → `active` |
| POST | `/v1/listings/{id}/unarchive` | `listings:write` | `archived` → `draft` |

Create example — `POST /v1/listings`:

```json
{
  "title": "Custom logo design — 3 concepts",
  "description": "Three original concepts, two revision rounds, all source files.",
  "categoryId": "01J1F00CATLOGO0000000000AA",
  "attributes": { "deliveryDays": 5, "revisions": 2 },
  "price": { "amount": 12900, "currency": "USD" },
  "quantity": null
}
```

`201 Created` — `Location: /v1/listings/01J1F9AAAABBBBCCCCDDDDEEEE`:

```json
{
  "id": "01J1F9AAAABBBBCCCCDDDDEEEE",
  "sellerId": "01J1F8STORE000000000000001",
  "title": "Custom logo design — 3 concepts",
  "slug": "custom-logo-design-3-concepts",
  "description": "Three original concepts, two revision rounds, all source files.",
  "categoryId": "01J1F00CATLOGO0000000000AA",
  "attributes": { "deliveryDays": 5, "revisions": 2 },
  "price": { "amount": 12900, "currency": "USD" },
  "quantity": null,
  "media": [],
  "status": "draft",
  "rejectionReason": null,
  "publishedAt": null,
  "version": 1,
  "createdAt": "2026-07-12T09:30:00.000Z",
  "updatedAt": "2026-07-12T09:30:00.000Z"
}
```

### 2.5 Categories & Attributes

**Category**: `id`, `parentId` (null = root), `name`, `slug`, `position`, `isLeaf`, `listingCount`, `version`, audit fields.
**Attribute**: `id`, `categoryId`, `key` (camelCase), `label`, `type` (`text` \| `number` \| `select` \| `multi_select` \| `boolean`), `options[]` (for selects), `isRequired`, `isFacet` (drives search facets), `unit?`.

| Method | Path | Scope | Description |
|---|---|---|---|
| GET | `/v1/categories` | public | Full tree (flat list with `parentId`; cached, ETag) |
| GET | `/v1/categories/{id}` | public | Single node |
| GET | `/v1/categories/{id}/attributes` | public | Attribute definitions for the leaf |
| POST | `/v1/admin/categories` | `admin:listings` | Create |
| PATCH | `/v1/admin/categories/{id}` | `admin:listings` | *(If-Match)* Rename/move/reorder |
| DELETE | `/v1/admin/categories/{id}` | `admin:listings` | Only when `listingCount = 0` → else `state_conflict` |
| POST | `/v1/admin/categories/{id}/attributes` | `admin:listings` | Add attribute |
| PATCH | `/v1/admin/attributes/{id}` | `admin:listings` | *(If-Match)* Edit (type immutable) |

### 2.6 Search

| Method | Path | Scope | Description |
|---|---|---|---|
| GET | `/v1/search` | public | `?q=&scope=listings\|sellers&categoryId=&priceMin=&priceMax=&attr.<key>=&sort=relevance\|-createdAt\|price\|-price&cursor=&limit=` |

Response = collection envelope **plus** `facets`:

`GET /v1/search?q=logo&scope=listings&categoryId=01J1F00CATLOGO0000000000AA`:

```json
{
  "data": [
    {
      "id": "01J1F9AAAABBBBCCCCDDDDEEEE",
      "title": "Custom logo design — 3 concepts",
      "price": { "amount": 12900, "currency": "USD" },
      "coverUrl": "https://cdn.flexa.example/m/01J1F9M1.webp",
      "sellerId": "01J1F8STORE000000000000001",
      "sellerName": "Studio Mai",
      "rating": 4.8,
      "reviewCount": 132
    }
  ],
  "pageInfo": { "nextCursor": null, "hasMore": false },
  "facets": [
    {
      "key": "categoryId",
      "label": "Category",
      "values": [ { "value": "01J1F00CATLOGO0000000000AA", "label": "Logo design", "count": 42 } ]
    },
    {
      "key": "attr.deliveryDays",
      "label": "Delivery time",
      "values": [ { "value": "3", "label": "Up to 3 days", "count": 12 } ]
    }
  ]
}
```

Facet keys are reused verbatim as filter params. Search results are denormalized card projections (not full Listings) — the Search Results screen (08) renders them directly.

### 2.7 Carts

One cart per buyer (implicit singleton). Items group by seller; checkout creates **one order per seller group** (see 07 § B1 — Purchase end-to-end).

**Cart**: `id`, `buyerId`, `groups[]` (`{sellerId, sellerName, items[], subtotal}`), `itemCount`, `total` (Money, sum across groups), audit fields.
**CartItem**: `id`, `listingId`, `title`, `coverUrl`, `unitPrice` (Money), `quantity`, `lineTotal` (Money), `isAvailable` (false when listing went inactive — blocks checkout).

| Method | Path | Scope | Description |
|---|---|---|---|
| GET | `/v1/cart` | `cart` | Current cart (creates empty lazily) |
| POST | `/v1/cart/items` | `cart` | `{listingId, quantity}` — merges quantity when already present |
| PATCH | `/v1/cart/items/{id}` | `cart` | `{quantity}` |
| DELETE | `/v1/cart/items/{id}` | `cart` | 204 |
| DELETE | `/v1/cart` | `cart` | Empty the cart → 204 |

### 2.8 Orders

**Order**:

| Field | Type | Description |
|---|---|---|
| `id` | string | |
| `number` | string | Human-facing, e.g. `"FX-2026-004213"` (display only — API keys on `id`) |
| `buyerId` / `sellerId` | string | |
| `items` | OrderItem[] | Frozen snapshot: `{listingId, title, unitPrice, quantity, lineTotal}` |
| `subtotal` / `fees` / `total` | Money | `total = subtotal + fees` |
| `refundedTotal` | Money | Accumulated refunds (zero-amount object when none) |
| `status` | string | **`created` \| `paid` \| `in_fulfilment` \| `delivered` \| `completed` \| `cancelled`** |
| `escrow` | Escrow \| null | Embedded summary (2.9); null until paid |
| `paymentIntentId` | string \| null | |
| `shippingAddress` | Address \| null | Physical goods only |
| `cancelledReason` | string \| null | |
| `paidAt` / `deliveredAt` / `completedAt` / `cancelledAt` | string \| null | Milestones |
| `createdAt` / `updatedAt` | string | |

**Lifecycle and its relation to escrow.** The order status tracks *fulfilment*; the escrow stage tracks *the money*. They advance together but are distinct state machines:

| Order status | Escrow stage (2.9) | Trigger |
|---|---|---|
| `created` | — (no escrow yet) | `POST /v1/orders` |
| `paid` | `payment_held` | Payment intent succeeds — funds held in escrow, seller notified |
| `in_fulfilment` | `payment_held` | Seller `POST .../start-fulfilment` (optional explicit step; sellers may deliver directly) |
| `delivered` | `delivered` | Seller `POST .../deliver` — starts `autoReleaseAt` timer |
| `completed` | `approved` → `released` | Buyer `POST .../approve` (or auto-release) — funds released to seller balance |
| `cancelled` | refund path (2.10) | Buyer/seller/admin cancel before `delivered`; held funds refunded |

A dispute (2.12) freezes both machines: escrow stage → `disputed`; order stays at its current status until resolution.

| Method | Path | Scope | Description |
|---|---|---|---|
| POST | `/v1/orders` | `orders:write` | *(idem)* Create from cart group: `{cartGroupSellerId, shippingAddressId?}` → one `created` order; returns with `paymentIntentId` null |
| GET | `/v1/orders` | `orders:read` | Own orders (buyer sees own; seller sees own store's; `?role=buyer\|seller` when both). Filters: `status`, `createdFrom/To`. Include: `escrow` |
| GET | `/v1/orders/{id}` | `orders:read` | Owner (either side) or admin |
| POST | `/v1/orders/{id}/start-fulfilment` | `orders:write` (seller) | `paid → in_fulfilment` |
| POST | `/v1/orders/{id}/deliver` | `orders:write` (seller) | `paid\|in_fulfilment → delivered`; body `{note?, attachments?: uploadId[]}`; sets `autoReleaseAt` |
| POST | `/v1/orders/{id}/approve` | `orders:write` (buyer) | `delivered → completed`; escrow `delivered → approved → released`. **This is the release endpoint.** Any other state → `state_conflict` |
| POST | `/v1/orders/{id}/cancel` | `orders:write` | Allowed until `delivered`; body `{reason}`; paid orders auto-create a full refund (2.10) |

Approve example — `POST /v1/orders/01J1FAORD0000000000000000X/approve` (empty body `{}`). `200 OK` (excerpt):

```json
{
  "id": "01J1FAORD0000000000000000X",
  "number": "FX-2026-004213",
  "status": "completed",
  "total": { "amount": 12900, "currency": "USD" },
  "escrow": {
    "id": "01J1FAESC0000000000000000E",
    "stage": "released",
    "amount": { "amount": 12900, "currency": "USD" },
    "autoReleaseAt": null,
    "releasedAt": "2026-07-12T10:02:11.000Z"
  },
  "completedAt": "2026-07-12T10:02:11.000Z",
  "createdAt": "2026-07-10T14:20:00.000Z",
  "updatedAt": "2026-07-12T10:02:11.000Z"
}
```

`409 state_conflict` — approving a non-delivered order:

```json
{
  "error": {
    "code": "state_conflict",
    "message": "Cannot approve: escrow stage is payment_held, expected delivered.",
    "requestId": "req_01J1FB0QRS"
  }
}
```

### 2.9 Payments & Escrow

**PaymentIntent**:

| Field | Type | Description |
|---|---|---|
| `id` | string | |
| `orderId` | string | |
| `amount` | Money | Equals order `total` |
| `status` | string | **`pending` \| `processing` \| `held` \| `released` \| `refunded` \| `partially_refunded` \| `failed`** |
| `provider` | string | `stripe` \| `paypal` \| ... (open enum) |
| `clientSecret` | string \| null | For provider SDK; present only on create/pending |
| `failureCode` | string \| null | Provider-normalized (`card_declined`, `three_ds_failed`, …) |
| `createdAt` / `updatedAt` | string | |

Payment status semantics: `pending` (awaiting confirmation) → `processing` (provider working) → `held` (captured into escrow) → `released` (paid out to seller balance) \| `refunded` \| `partially_refunded`. `failed` is terminal for the intent; create a new intent to retry (see 07 § B1 — Purchase end-to-end, payment step).

**Escrow**:

| Field | Type | Description |
|---|---|---|
| `id` | string | |
| `orderId` | string | |
| `stage` | string | **`payment_held` \| `delivered` \| `approved` \| `released` \| `disputed`** |
| `amount` | Money | Held amount |
| `autoReleaseAt` | string \| null | Set when stage becomes `delivered` (default now + 7 days); auto-approves + releases when it elapses without buyer action or dispute. Null once released/disputed |
| `disputeId` | string \| null | When `disputed` |
| `heldAt` / `deliveredAt` / `releasedAt` | string \| null | |
| `createdAt` / `updatedAt` | string | |

**EscrowEvent** (append-only, powers the Escrow Timeline component — see 08 § Order Detail): `id`, `escrowId`, `type` (`held` \| `delivered` \| `approved` \| `released` \| `auto_release_scheduled` \| `auto_released` \| `disputed` \| `dispute_resolved` \| `refunded`), `actor` (`buyer` \| `seller` \| `admin` \| `system`), `note?`, `createdAt`.

| Method | Path | Scope | Description |
|---|---|---|---|
| POST | `/v1/payment-intents` | `payments:write` | *(idem)* `{orderId, provider, paymentMethodId?}` — order must be `created`, else `state_conflict`. Returns `clientSecret` |
| GET | `/v1/payment-intents/{id}` | `payments:write` | Poll after provider redirect (prefer webhooks/SSE, §4.2) |
| GET | `/v1/orders/{id}/escrow` | `orders:read` | Current escrow object |
| GET | `/v1/orders/{id}/escrow-events` | `orders:read` | Timeline, ascending `createdAt` |
| POST | `/v1/orders/{id}/approve` | `orders:write` (buyer) | Release endpoint — listed in 2.8, repeated here for discoverability |
| POST | `/v1/admin/escrows/{id}/release` | `admin:payments` | Admin force-release (dispute resolution shortcut; audited) |

`GET /v1/orders/01J1FAORD0000000000000000X/escrow-events`:

```json
{
  "data": [
    { "id": "01J1FAEV01", "escrowId": "01J1FAESC0000000000000000E", "type": "held", "actor": "system", "note": null, "createdAt": "2026-07-10T14:21:03.000Z" },
    { "id": "01J1FAEV02", "escrowId": "01J1FAESC0000000000000000E", "type": "delivered", "actor": "seller", "note": "Files in attached zip.", "createdAt": "2026-07-11T09:00:00.000Z" },
    { "id": "01J1FAEV03", "escrowId": "01J1FAESC0000000000000000E", "type": "auto_release_scheduled", "actor": "system", "note": "Auto-release on 2026-07-18T09:00:00.000Z", "createdAt": "2026-07-11T09:00:00.000Z" }
  ],
  "pageInfo": { "nextCursor": null, "hasMore": false }
}
```

### 2.10 Refunds

**Refund**: `id`, `orderId`, `paymentIntentId`, `amount` (Money), `reason` (`cancelled` \| `dispute_resolution` \| `goodwill` \| `other`), `status` (`pending` \| `succeeded` \| `failed`), `initiatedBy` (`buyer` \| `seller` \| `admin` \| `system`), `note?`, audit fields.

| Method | Path | Scope | Description |
|---|---|---|---|
| POST | `/v1/refunds` | `orders:write` (seller) / `admin:payments` | *(idem)* `{orderId, amount, reason, note?}` — partial allowed; sum of refunds ≤ held amount else `insufficient_funds`. Sellers may refund only pre-release; post-release refunds are admin-only (clawback from balance) |
| GET | `/v1/refunds` | `orders:read` | Filters: `orderId`, `status` |
| GET | `/v1/refunds/{id}` | `orders:read` | |

A full refund sets payment `status=refunded`; partial sets `partially_refunded` and reduces the escrow `amount`. Refund of a fully held escrow closes the order as `cancelled` when initiated via cancel/dispute.

### 2.11 Payouts

**Balance** (computed, per store): `available` (Money), `pending` (Money — released but inside the payout hold period), `inEscrow` (Money — informational), `currency`.

**Payout**: `id`, `storeId`, `amount` (Money), `status` (`requested` \| `processing` \| `sent` \| `failed`), `destinationLast4`, `failureCode?`, `requestedAt`, `sentAt?`, audit fields.

| Method | Path | Scope | Description |
|---|---|---|---|
| GET | `/v1/me/store/balance` | `payouts:read` | Balance snapshot |
| GET | `/v1/payouts` | `payouts:read` | Own payout history. Filters: `status` |
| POST | `/v1/payouts` | `payouts:write` | *(idem)* `{amount}` — ≤ `available` else `insufficient_funds`; payout account must be `verified` else `state_conflict` |
| GET | `/v1/payouts/{id}` | `payouts:read` | |
| GET | `/v1/me/store/payout-schedule` | `payouts:read` | `{interval: "manual" \| "weekly" \| "monthly", minimumAmount: Money}` |
| PATCH | `/v1/me/store/payout-schedule` | `payouts:write` | Partial merge |

### 2.12 Disputes

**Dispute**:

| Field | Type | Description |
|---|---|---|
| `id` | string | |
| `orderId` | string | One open dispute per order (`conflict` on duplicate) |
| `openedBy` | string | `buyer` (v1: buyers open; sellers respond) |
| `reason` | string | `not_delivered` \| `not_as_described` \| `damaged` \| `other` |
| `status` | string | `open` \| `seller_responded` \| `under_review` \| `resolved` |
| `evidence` | Evidence[] | `{id, uploadId, url, note, submittedBy, createdAt}` — both parties append |
| `resolution` | object \| null | `{outcome: "refund" \| "release" \| "partial", refundAmount?: Money, releaseAmount?: Money, note}` |
| `respondBy` | string | Seller response deadline (now + 5 days; no response → auto `under_review`) |
| `resolvedAt` | string \| null | |
| `createdAt` / `updatedAt` | string | |

| Method | Path | Scope | Description |
|---|---|---|---|
| POST | `/v1/disputes` | `disputes:write` (buyer) | `{orderId, reason, message, evidence?: [{uploadId, note}]}` — order must be `paid`..`delivered` and escrow not `released`, else `state_conflict`. Escrow stage → `disputed`, auto-release timer cancelled |
| GET | `/v1/disputes` | `disputes:write` / `admin:disputes` | Own (either side) or all (admin). Filters: `status`, `orderId` |
| GET | `/v1/disputes/{id}` | party or `admin:disputes` | Include: `order` |
| POST | `/v1/disputes/{id}/respond` | seller party | `{message, evidence?: [...]}` — `open → seller_responded` |
| POST | `/v1/disputes/{id}/accept-response` | buyer party | Buyer accepts the seller's proposed remedy — `seller_responded → resolved`, `resolution` recorded from the accepted remedy (no admin involved) |
| POST | `/v1/disputes/{id}/escalate` | buyer party | Buyer escalates — `open`\|`seller_responded` → `under_review` (also fires automatically when `respondBy` passes) |
| POST | `/v1/disputes/{id}/evidence` | either party | Append evidence while not `resolved` |
| POST | `/v1/disputes/{id}/resolve` | `admin:disputes` | See below. `resolved` is terminal |

Resolve example — `POST /v1/disputes/01J1FDISP000000000000000AA/resolve`:

```json
{
  "outcome": "partial",
  "refundAmount": { "amount": 5000, "currency": "USD" },
  "releaseAmount": { "amount": 7900, "currency": "USD" },
  "note": "Two of three concepts delivered as described."
}
```

`200 OK` (excerpt):

```json
{
  "id": "01J1FDISP000000000000000AA",
  "orderId": "01J1FAORD0000000000000000X",
  "status": "resolved",
  "resolution": {
    "outcome": "partial",
    "refundAmount": { "amount": 5000, "currency": "USD" },
    "releaseAmount": { "amount": 7900, "currency": "USD" },
    "note": "Two of three concepts delivered as described."
  },
  "resolvedAt": "2026-07-12T11:30:00.000Z",
  "updatedAt": "2026-07-12T11:30:00.000Z"
}
```

Effects: `refund` → full refund (2.10) + order `cancelled`; `release` → escrow `released` + order `completed`; `partial` → refund of `refundAmount` + release of `releaseAmount` (must sum to held amount, else `validation_failed`), order `completed`, payment `partially_refunded`. Full flow: 07 § Dispute Flow.

### 2.13 Reviews

**Review**: `id`, `orderId`, `direction` (`buyer_on_seller` \| `seller_on_buyer`), `authorId`, `subjectId` (store or user), `rating` (int 1–5), `body` (≤ 2000 chars), `response` (`{body, createdAt} \| null` — subject's single reply), `status` (`published` \| `under_review` \| `removed`), audit fields.

| Method | Path | Scope | Description |
|---|---|---|---|
| POST | `/v1/reviews` | `reviews:write` | `{orderId, rating, body}` — order must be `completed` (`state_conflict`); direction inferred from caller's side; one review per direction per order (`conflict`) |
| GET | `/v1/reviews` | public | Filters: `subjectId` (public), `orderId`/`authorId` (owner/admin) |
| GET | `/v1/reviews/{id}` | public | |
| PATCH | `/v1/reviews/{id}` | author | Editable for 30 days after submission, locked as soon as the counterparty responds |
| POST | `/v1/reviews/{id}/response` | subject | `{body}` — one response, seller-respond UX (see 08 § Reviews) |
| POST | `/v1/reviews/{id}/report` | any authenticated | `{reason}` → status `under_review`, enters admin queue |
| DELETE | `/v1/admin/reviews/{id}` | `admin:listings` | Remove (status `removed`, tombstone kept) |

### 2.14 Conversations & Messages

**Conversation**: `id`, `subject` (`{type: "order" \| "listing", id}`), `participantIds[]`, `lastMessage` (denormalized preview: `{body, senderId, createdAt}`), `unreadCount` (per caller), audit fields.
**Message**: `id`, `conversationId`, `senderId`, `body` (≤ 5000 chars), `attachments[]` (`{uploadId, url, fileName, byteSize, contentType}`), `createdAt`. Messages are immutable.

| Method | Path | Scope | Description |
|---|---|---|---|
| POST | `/v1/conversations` | `messages` | `{subject: {type, id}, message: {body}}` — idempotent per (caller, subject): existing conversation is returned with `200` instead of `201` |
| GET | `/v1/conversations` | `messages` | Own, ordered by last activity. Filter: `subjectType`, `subjectId` |
| GET | `/v1/conversations/{id}` | participant | |
| GET | `/v1/conversations/{id}/messages` | participant | Cursor pages **backwards** (newest first; `nextCursor` walks older) |
| POST | `/v1/conversations/{id}/messages` | participant | `{body, attachments?: uploadId[]}` |
| POST | `/v1/conversations/{id}/read` | participant | `{lastReadMessageId}` — read marker, resets `unreadCount` → 204 |

New messages are pushed over SSE (§4.2); polling `GET /messages` is the fallback.

### 2.15 Notifications

**Notification**: `id`, `type` (mirrors webhook event names, §3.2 — e.g. `"order.delivered"`), `title`, `body`, `linkUrl` (in-app route, see 06 § URL scheme), `readAt` (string \| null), `createdAt`.

| Method | Path | Scope | Description |
|---|---|---|---|
| GET | `/v1/notifications` | `notifications` | Filters: `unread=true`. `pageInfo.totalCount` present (cheap badge count) |
| POST | `/v1/notifications/mark-read` | `notifications` | `{ids: []}` or `{all: true}` → 204 |
| GET | `/v1/me/notification-preferences` | `notifications` | Matrix below |
| PUT | `/v1/me/notification-preferences` | `notifications` | Whole-document replace |

Preferences matrix (event group × channel — groups, not individual events):

```json
{
  "channels": ["in_app", "email", "push"],
  "groups": {
    "orders":      { "in_app": true, "email": true,  "push": true  },
    "messages":    { "in_app": true, "email": false, "push": true  },
    "disputes":    { "in_app": true, "email": true,  "push": true  },
    "reviews":     { "in_app": true, "email": true,  "push": false },
    "payouts":     { "in_app": true, "email": true,  "push": false },
    "marketing":   { "in_app": false, "email": false, "push": false }
  }
}
```

`in_app` for `orders`/`disputes` cannot be disabled (transactional). The Notification Preferences screen renders this matrix directly (see 08).

### 2.16 Media / Uploads (signed upload flow)

Three steps — JSON API never carries file bytes:

1. `POST /v1/uploads` with intent → server returns a short-lived signed URL.
2. Client uploads bytes directly to `uploadUrl` (HTTP PUT, exact `headers` echoed).
3. `POST /v1/uploads/{id}/confirm` — server verifies size/type/scan, upload becomes attachable via `uploadId`.

**Upload**: `id`, `purpose` (`listing_media` \| `avatar` \| `message_attachment` \| `dispute_evidence` \| `delivery_file`), `fileName`, `contentType`, `byteSize`, `status` (`pending` \| `confirmed` \| `rejected` \| `expired`), `url` (CDN, after confirm), `expiresAt` (pending only), audit fields.

| Method | Path | Scope | Description |
|---|---|---|---|
| POST | `/v1/uploads` | any authenticated | `{purpose, fileName, contentType, byteSize}` — per-purpose type/size limits enforced here (`validation_failed`) |
| POST | `/v1/uploads/{id}/confirm` | owner | Finalize; unconfirmed uploads expire after 1 h |
| GET | `/v1/uploads/{id}` | owner | Status poll |

`POST /v1/uploads`:

```json
{ "purpose": "listing_media", "fileName": "cover.webp", "contentType": "image/webp", "byteSize": 482113 }
```

`201 Created`:

```json
{
  "id": "01J1FUPLD000000000000000AA",
  "purpose": "listing_media",
  "fileName": "cover.webp",
  "contentType": "image/webp",
  "byteSize": 482113,
  "status": "pending",
  "uploadUrl": "https://storage.flexa.example/signed/01J1FUPLD?sig=...",
  "headers": { "Content-Type": "image/webp" },
  "url": null,
  "expiresAt": "2026-07-12T10:30:00.000Z",
  "createdAt": "2026-07-12T09:30:00.000Z",
  "updatedAt": "2026-07-12T09:30:00.000Z"
}
```

### 2.17 Admin

All under `/v1/admin/*`; every mutation is written to the audit log automatically. Admin PATCH endpoints require *(If-Match)* (§1.12).

| Method | Path | Scope | Description |
|---|---|---|---|
| GET | `/v1/admin/users` | `admin:users` | `?q=` (email/name), `?status=`, `?role=`. `totalCount` present |
| GET | `/v1/admin/users/{id}` | `admin:users` | Full user incl. `status`, stores, counters |
| POST | `/v1/admin/users/{id}/suspend` | `admin:users` | `{reason}` — revokes sessions; user's writes → `403 account_suspended` |
| POST | `/v1/admin/users/{id}/reinstate` | `admin:users` | |
| GET | `/v1/admin/moderation-queue` | `admin:listings` | Listings `pending_review` + reported reviews; `totalCount` present |
| POST | `/v1/admin/listings/{id}/approve` | `admin:listings` | `pending_review → active` |
| POST | `/v1/admin/listings/{id}/reject` | `admin:listings` | `{reasonCode, note}` — required; surfaced to the seller, stored as `rejectionReason` |
| POST | `/v1/admin/listings/{id}/request-changes` | `admin:listings` | `{reasonCode, note}` — `pending_review → draft`; note surfaced to the seller |
| POST | `/v1/admin/listings/{id}/suspend` | `admin:listings` | `{reason}` — `active → suspended` |
| POST | `/v1/admin/listings/{id}/reinstate` | `admin:listings` | `suspended → active` |
| GET | `/v1/admin/orders` | `admin:orders` | All orders, full filter set |
| GET | `/v1/admin/audit-logs` | `admin:audit` | `?actorId=&action=&targetId=&from=&to=`. Entry: `{id, actorId, actorType, action, targetType, targetId, changes: {field: {from, to}}, requestId, createdAt}`. Append-only, no mutation endpoints |
| GET | `/v1/admin/queues` | `admin:system` | Queue Monitor data: `[{name, depth, oldestAgeSeconds, failedCount}]` |
| GET | `/v1/admin/jobs` | `admin:system` | `?queue=&status=failed\|pending\|completed` |
| POST | `/v1/admin/jobs/{id}/retry` | `admin:system` | Re-enqueue a failed job |

Bulk moderation (08 § Listings Moderation) is performed as repeated per-id calls — there is **no bulk moderation endpoint in v1**.

---

## 3. Webhooks

### 3.1 Delivery contract

| Aspect | Rule |
|---|---|
| Registration | `POST /v1/webhook-endpoints` `{url, events: ["order.paid", "dispute.*"]}` (API-key auth); secret returned **once** on create. Also GET/PATCH/DELETE `/v1/webhook-endpoints/{id}` |
| Transport | HTTPS POST, JSON body, `Content-Type: application/json` |
| Signature | Header `Flexa-Signature: t=<unixSeconds>,v1=<hex>` where `v1 = HMAC-SHA256(secret, "<t>.<rawBody>")`. Receivers MUST verify against the **raw** body, compare constant-time, and reject when \|now − t\| > 300 s (replay guard) |
| Success | Any 2xx within 10 s. Anything else (or timeout) = failure |
| Retries | Exponential backoff with jitter: 1 min, 5 min, 30 min, 2 h, 8 h, 24 h — then the event is dead-lettered and the endpoint flagged in the dashboard; 7 days of consecutive failure auto-disables the endpoint |
| Ordering | **Not guaranteed.** Consumers must treat events as at-least-once and out-of-order: use `id` for dedupe, fetch current resource state via API instead of trusting event sequence |
| Envelope | Below — `data` contains the full current resource (same shape as the GET endpoint), plus `previous` with changed fields on transition events |

```json
{
  "id": "evt_01J1FEVNT00000000000000AA",
  "type": "order.delivered",
  "createdAt": "2026-07-11T09:00:00.000Z",
  "data": {
    "order": {
      "id": "01J1FAORD0000000000000000X",
      "status": "delivered",
      "escrow": { "stage": "delivered", "autoReleaseAt": "2026-07-18T09:00:00.000Z" }
    },
    "previous": { "status": "in_fulfilment" }
  }
}
```

### 3.2 Event catalog (SSOT)

Event names are `domain.event`, lower_snake_case after the dot. **This table is the single source of truth** — docs 07 (flow triggers) and 10 (notification copy) reference these names verbatim; in-app `Notification.type` (2.15) reuses them.

| Event | Fired when | `data` root |
|---|---|---|
| `user.created` | Sign-up completed | `user` |
| `user.verified` | Email verification completed | `user` |
| `user.suspended` | Admin suspends a user | `user` |
| `user.reinstated` | Admin reinstates a suspended user | `user` |
| `seller.activated` | Seller account activated at onboarding-wizard completion (publishing may still be gated on payout verification) | `store` |
| `seller.onboarded` | Store `onboardingStatus → complete` | `store` |
| `listing.submitted` | Seller submits for review | `listing` |
| `listing.approved` | Moderation approves | `listing` |
| `listing.rejected` | Moderation rejects (with `rejectionReason`) | `listing` |
| `listing.suspended` | Admin suspends an active listing | `listing` |
| `order.created` | Order created from cart | `order` |
| `order.paid` | Payment succeeded | `order` |
| `order.fulfilment_started` | Seller `POST .../start-fulfilment` — `paid → in_fulfilment` | `order` |
| `order.cancelled` | Any party cancels | `order` |
| `order.delivered` | Seller marks delivered | `order` |
| `order.completed` | Buyer approves or auto-release fires | `order` |
| `payment.failed` | Payment intent → `failed` | `paymentIntent` |
| `escrow.held` | Funds captured into escrow | `escrow` |
| `escrow.auto_release_scheduled` | `autoReleaseAt` set on delivery | `escrow` |
| `escrow.released` | Funds released to seller balance (manual or auto) | `escrow` |
| `escrow.refunded` | Held funds fully refunded to the buyer (cancel or dispute `refund` outcome) | `escrow` |
| `escrow.partially_refunded` | Held funds split between refund and release (dispute `partial` outcome) | `escrow` |
| `dispute.opened` | Buyer opens a dispute | `dispute` |
| `dispute.seller_responded` | Seller responds — `open → seller_responded` | `dispute` |
| `dispute.escalated` | Dispute escalated to admin review — `→ under_review` (buyer escalate or `respondBy` expiry) | `dispute` |
| `dispute.resolved` | Resolved — buyer accepts seller remedy or admin resolves | `dispute` |
| `refund.issued` | Refund succeeded | `refund` |
| `payout.sent` | Payout `→ sent` | `payout` |
| `payout.failed` | Payout `→ failed` | `payout` |
| `message.created` | New message in a conversation | `message` |
| `review.created` | Review published | `review` |
| `review.response_created` | Subject responds to a review | `review` |
| `review.flagged` | Review reported/flagged for moderation (admin channel) | `review` |

Wildcard subscription `domain.*` is supported at registration time.

---

## 4. Client guidance

### 4.1 UI loading contract — canonical screens → endpoints

Screen names per README § Canonical screen inventory; full per-screen data specs in **08**. This table binds screen → primary calls so client and server teams share one map:

| Screen (08) | Primary endpoints | Notes |
|---|---|---|
| Home | `GET /v1/listings?sort=-createdAt`, `GET /v1/categories` | Categories cached via ETag |
| Search Results | `GET /v1/search` | Facets drive Advanced Filters component |
| Listing Detail | `GET /v1/listings/{id}?include=seller,category`, `GET /v1/reviews?subjectId=` | |
| Checkout | `GET /v1/cart` → `POST /v1/orders` → `POST /v1/payment-intents` | Both POSTs idempotent (§1.10); wizard flow in 07 |
| Orders List (buyer/seller) | `GET /v1/orders?role=` | |
| Order Detail + Escrow Timeline | `GET /v1/orders/{id}?include=escrow`, `GET /v1/orders/{id}/escrow-events` | Timeline renders EscrowEvent[] verbatim |
| Listing Editor | `POST/PATCH /v1/listings`, uploads flow (2.16), `GET /v1/categories/{id}/attributes` | Attribute defs drive dynamic form fields |
| Earnings & Payouts | `GET /v1/me/store/balance`, `GET /v1/payouts`, `POST /v1/payouts` | |
| Disputes Queue / Dispute Detail | `GET /v1/disputes`, `GET /v1/disputes/{id}?include=order` | |
| Messages | `GET /v1/conversations`, `GET /v1/conversations/{id}/messages` + SSE | |
| Notifications | `GET /v1/notifications?unread=true` | `totalCount` = badge |
| Admin Moderation | `GET /v1/admin/moderation-queue` + approve/reject actions | If-Match on PATCH |
| Admin Audit Log | `GET /v1/admin/audit-logs` | |
| Queue Monitor | `GET /v1/admin/queues`, `GET /v1/admin/jobs?status=failed` | Poll 10 s |

### 4.2 Realtime: polling vs webhooks vs SSE

| Channel | Use for | Rule |
|---|---|---|
| **SSE `GET /v1/events`** | In-app realtime: chat messages, notifications, order/escrow status changes for the *current user* | `Accept: text/event-stream`, Bearer auth. Each SSE event = the §3.1 envelope (same `type` names). Supports `Last-Event-ID` resume. Clients reconnect with backoff; on resume gap, refetch affected lists |
| **Webhooks** | Server-to-server integrations only — never browsers | §3 |
| **Polling** | Fallback when SSE unavailable; payment-intent status after provider redirect (2 s interval, max 60 s); Queue Monitor (10 s) | Always honor `X-RateLimit-*` |

Do not poll for chat or notifications when SSE is connected. Push (mobile) rides the notification preferences matrix (2.15).

### 4.3 Caching & ETag

- Read endpoints emit `ETag`; clients send `If-None-Match` → `304 Not Modified` (empty body). Prioritize for: categories tree, attribute definitions, public store profiles, `GET /v1/me`.
- List endpoints are **not** long-cacheable; rely on cursor freshness instead.
- After any mutation, prefer the returned resource body over refetching (§1.6 guarantees the full updated object).
- `Cache-Control: no-store` on everything under `/v1/me`, payments, and admin.

### 4.4 Error → UI mapping rule

1. Switch on `error.code` (never on HTTP status alone, never on `message` text). Copy per code — including per-screen overrides — is owned by **10**.
2. `validation_failed` → map `details[].field` dot-paths to form fields; entries whose field isn't rendered go to the form-level error summary (Validation Message component, see 04).
3. `unauthorized` → silent refresh once, then redirect to Sign In preserving return URL (see 05 § Authentication (A8)).
4. `state_conflict` / `precondition_failed` → refetch the resource, re-render, show the "this changed under you" pattern (see 05 § CRUD).
5. `rate_limited` / `service_unavailable` → automatic retry honoring `Retry-After`; surface a Warning Banner only after the second failure.
6. Unknown code (future addition) → render the generic failure copy from 10; log with `requestId`.

---

*End of 09 — Flexa API Contract. Machine codes (§1.9) and event names (§3.2) defined here are the SSOT; user-facing copy for both lives in 10; flows exercising the endpoints live in 07; per-screen payload usage lives in 08.*
