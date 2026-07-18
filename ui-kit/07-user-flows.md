# 07 — Flexa User Flows

> **Owns:** end-to-end flows for Guest, Buyer, Seller, Admin on the reference product **Flexa Marketplace**.
> **Does not own:** screen internals (see 08), the reusable patterns each flow instantiates (see 05), endpoint payloads (see 09), microcopy (see 10).
> Screens are named verbatim from the canonical inventory (README); URLs from 06.

## Conventions used by every flow

- **Template:** Persona · Trigger · Preconditions · Flow diagram · Step table (`# / Screen / User action / System response / API call / Emitted events`) · Branches & error paths · Success criteria · Related.
- **API calls** follow README conventions: `/v1`, plural kebab-case resources, cursor pagination, error envelope `{error:{code,message,details[]}}`, **Idempotency-Key header on payment-affecting POSTs**, money in integer minor units + `currency`.
- **Canonical payment statuses:** `pending · processing · held · released · refunded · partially_refunded · failed`.
- **Canonical escrow stages (Escrow Timeline):** `payment_held → delivered → approved → released`, with `disputed` as a branch stage. Docs 05 (§ Escrow Flow), 08, and 09 must use these names; no synonyms.
- **Feedback defaults (see 03):** every mutating action gets optimistic or explicit pending state, success Toast, and inline error recovery; destructive/money-moving actions get a Confirmation Dialog.
- Failed API calls surface the error envelope's `message` inline (Inline Error / Alert), keep user input, and offer retry — flows below only note error handling that goes beyond this default.

## 0. Shared state model (referenced by every money flow)

Three coupled state machines drive B1–B3, S3–S4, S6, A2. Flows reference this section instead of re-defining transitions. The Escrow Timeline component (see 04) renders the escrow stages; Payment Status renders the payment status.

### 0.1 Payment status (money truth)

```
pending ──▶ processing ──▶ held ──────────────▶ released
                │            │ dispute decision  ▲
                ▼            ├──▶ refunded       │ approve / auto-release / admin release
              failed         └──▶ partially_refunded
             (retry ⇒ pending)
```

`released`, `refunded`, `partially_refunded` are terminal. `failed` is retryable (B1 branch F). Money moves on exactly one transition out of `held`.

### 0.2 Escrow stage (buyer/seller-facing narrative)

```
payment_held ──▶ delivered ──▶ approved ──▶ released
      │              │
      └──────────────┴──▶ disputed ──▶ (resolution ⇒ released | refunded | partially_refunded outcome recorded, stage closes)
```

`disputed` is enterable from `payment_held` (non-delivery) or `delivered` (quality) and freezes the auto-release timer (B2/B3).

### 0.3 Order status × payment status × escrow stage per flow moment

| Flow moment | Order status | Payment status | Escrow stage |
|---|---|---|---|
| B1 step 5 (order placed) | `created` | `pending` → `processing` | — |
| B1 step 6 (payment succeeded) | `paid` | `held` | `payment_held` |
| B1 branch F (declined) | `created` | `failed` | — |
| S3 step 2 (seller accepts) | `in_fulfilment` | `held` | `payment_held` |
| S3 step 4 (delivered) | `delivered` | `held` | `delivered` |
| B2 step 3 / auto-release | `completed` | `released` | `approved` → `released` |
| S3 decline branch | `cancelled` | `refunded` | closed (`payment_held` annotated refunded) |
| B3 step 2 (dispute opened) | unchanged (`paid`/`in_fulfilment`/`delivered`) | `held` (frozen) | `disputed` |
| A2 step 4 — refund | `cancelled` | `refunded` | closed with decision |
| A2 step 4 — release | `completed` | `released` | closed with decision |
| A2 step 4 — partial | `completed` | `partially_refunded` | closed with decision |

Doc 09 owns the API representation of these fields; doc 08 owns how each screen renders them. Any flow step below that names a status uses these exact strings.

---

## G1 — Browse & search → view Listing Detail

**Persona:** Guest (identical for signed-in personas browsing).
**Trigger:** lands on Home (direct, SEO, ad).
**Preconditions:** none.

```
Home ──(type in Search Bar)──▶ Search Results ──(filter/sort)──▶ Search Results*
  │                                   │
  └──(featured Listing Card)──────────┴──(Listing Card click)──▶ Listing Detail
                                                                    ├─▶ ?tab=reviews
                                                                    └─▶ Seller Profile (public)
```

| # | Screen | User action | System response | API call | Events |
|---|---|---|---|---|---|
| 1 | Home | Types query in Search Bar, submits | Navigate to Search Results `?q=` | `GET /v1/search/listings?q=oak+desk` | — |
| 2 | Search Results | Applies filters / sort | Results update; URL gains `filter[...]`, `sort`; `cursor` resets (06 §5.3) | `GET /v1/search/listings?q=…&filter[category]=furniture&sort=-createdAt` | — |
| 3 | Search Results | Scrolls to end of page | Next page appended | `GET …&cursor={nextCursor}` | — |
| 4 | Search Results | Clicks a Listing Card | Navigate to canonical URL | `GET /v1/listings/{slug}` | — |
| 5 | Listing Detail | Reads; opens reviews tab | Tab swap, URL `?tab=reviews` | `GET /v1/listings/{id}/reviews?cursor=` | — |
| 6 | Listing Detail | Clicks seller name | Navigate to Seller Profile (public) | `GET /v1/sellers/{handle}` | — |

**Branches & errors:** zero results → Empty State with query relaxation suggestions (see 10). Stale/changed slug → server 301 to current slug. Listing unpublished/removed → Error Page 404 with search back-link.
**Success:** Guest reaches a Listing Detail whose URL is shareable and restores identical state (filters, tab) on revisit.
**Related:** 05 § Search, § Filtering · 08 § Home, § Search Results, § Listing Detail.

---

## G2 — Sign up (email verify) → role choice

**Persona:** Guest.
**Trigger:** "Sign Up" in Top Navigation, or auth wall redirect (G3, B1 step 2).
**Preconditions:** none.

```
Sign Up ──▶ [account created, unverified] ──▶ Email Verification ──(link clicked)──▶ verified
                                                                                        │
                                              ┌─────────────── role choice ────────────┤
                                              ▼                                        ▼
                                    "I'm here to buy" ──▶ /account (or ?next=)   "I want to sell" ──▶ Seller Onboarding Wizard (S1)
```

| # | Screen | User action | System response | API call | Events |
|---|---|---|---|---|---|
| 1 | Sign Up | Enters email + password, accepts terms, submits | Validation; account created unverified; session started | `POST /v1/auth/sign-up` | `user.created` |
| 2 | Email Verification | — (screen instructs to check inbox; resend available) | Verification email sent | `POST /v1/auth/verification-emails` (resend) | — |
| 3 | (email client) | Clicks verification link | Token consumed; redirected to Email Verification success state | `POST /v1/auth/verify-email` `{token}` | `user.verified` |
| 4 | Email Verification | Picks role: "Start buying" or "Become a seller" | Buyer → `/account` (Buyer Dashboard) or honored `?next=`; Seller intent → Seller Onboarding Wizard (S1) | — | — |

**Branches & errors:** email already registered → inline error linking Sign In + Forgot Password. Expired/used token → Email Verification error state with resend. Unverified users may browse but hit the verify wall on checkout, messaging, and selling (Warning Banner in shell). Role choice is not exclusive — every account is a Buyer; selling is added via S1 anytime (account menu, 06 §2.7).
**Success:** verified account; user lands in Buyer Dashboard or Seller Onboarding Wizard; `?next=` honored.
**Related:** 05 § Authentication · 08 § Sign Up, § Email Verification · 10 § verification copy.

---

## G3 — Guest contacts seller (auth wall)

**Persona:** Guest.
**Trigger:** "Contact seller" on Listing Detail or Seller Profile (public).
**Preconditions:** none (that's the point).

```
Listing Detail ──("Contact seller")──▶ Sign In (?next=/listings/{slug}?intent=contact)
      ▲                                     │ existing account ─ sign in ─┐
      │                                     └ new user ─▶ Sign Up ─▶ Email Verification ─┘
      └──────────(return, composer auto-opened)◀─────────────────────────┘ → continues as B5
```

| # | Screen | User action | System response | API call | Events |
|---|---|---|---|---|---|
| 1 | Listing Detail | Clicks "Contact seller" | No session → redirect to Sign In with `?next=` carrying return URL + `intent=contact` | — | — |
| 2 | Sign In | Signs in (or via Sign Up → Email Verification, G2) | Session created | `POST /v1/auth/sign-in` | — |
| 3 | Listing Detail | — (returned automatically) | Original URL restored; message composer opens because of `intent=contact` | `GET /v1/listings/{slug}` | — |
| 4 | → B5 | Sends first message | Continues as B5 step 2 | | |

**Branches & errors:** user abandons at Sign In → nothing persisted. `next` must be same-origin path (06 §5.3) — anything else falls back to `/`.
**Success:** exactly one auth interruption; user resumes the original intent without re-navigating.
**Related:** 05 § Authentication, § Messaging Flow · 08 § Sign In.

---

## B1 — Purchase end-to-end (flagship)

**Persona:** Buyer.
**Trigger:** "Buy now" / "Add to cart" on Listing Detail.
**Preconditions:** signed in + email verified (else G2/G3 wall first); listing `active`.

```
Listing Detail ──▶ Checkout (Cart → Payment → Confirm)  [Wizard Layout]
                     ?step=cart ─▶ ?step=details ─▶ ?step=payment ─▶ ?step=review
                                                        │  ▲                │
                                                 failed ┘  └ retry         ▼ Place order
                                                                    payment processing
                                                                           │ succeeded
                                                                           ▼
                                                  Order Detail (with Escrow Timeline)  [order paid, escrow payment_held]
```

| # | Screen | User action | System response | API call | Events |
|---|---|---|---|---|---|
| 1 | Listing Detail | "Buy now" | Item added; navigate `/checkout?step=cart` | `POST /v1/carts/items` | — |
| 2 | Checkout — cart | Reviews Cart Summary, adjusts qty, "Continue" | Totals recomputed server-side; step → details | `PATCH /v1/carts/items/{id}` | — |
| 3 | Checkout — details | Enters/confirms delivery contact & requirements | Draft order data validated per-field | `PATCH /v1/carts` | — |
| 4 | Checkout — payment | Selects saved method (Wallet & Payment Methods) or adds card | Method tokenized by payment provider; never raw PAN to our API | `POST /v1/payment-methods` (if new) | — |
| 5 | Checkout — review | Reviews Checkout Summary incl. escrow explainer, "Place order" | Button → loading; order created; payment intent status `pending` | `POST /v1/orders` `{cartId, paymentMethodId}` + **`Idempotency-Key`** | `order.created` |
| 6 | Checkout — review | — (waits; Payment Status component) | Payment status `processing`; on success order `paid`, funds escrowed: payment status **`held`**, Escrow Timeline stage **`payment_held`**; redirect | `GET /v1/orders/{id}` (poll) or `order.paid` push | `order.paid`, `escrow.held` |
| 7 | Order Detail (with Escrow Timeline) | Sees confirmation state | Escrow Timeline: `payment_held` active; next steps copy (see 10) | `GET /v1/orders/{id}` | — |

**Idempotency note (normative):** step 5's `POST /v1/orders` carries an `Idempotency-Key` generated when the review step mounts and **reused for every retry of the same attempt** (double-click, network timeout, retry button). The server replays the original result for a known key — the buyer can never be double-charged by retrying. A *new* attempt after an explicit failure (step F below) generates a new key.

**Branches & errors:**
- **F — payment failed:** provider declines → payment status **`failed`**, order remains `created`. Buyer returns to `?step=payment` with Inline Error naming the reason (mapped code, see 09/10), original inputs intact. Retry with same method (same key, if same attempt semantics allow) or new method (new key). `payment.failed` emitted; notification per 06 §7.
- Cart item became unavailable at step 5 → `validation_failed` with `details[]` pointing at the line item; cart step re-opened with the item flagged.
- Price changed since cart → review step shows Warning Banner diff; explicit re-confirm required before `POST`.
- Abandon mid-wizard → Checkout state is client-held; leaving warns (06 §5.4); cart persists server-side.
- 3-D Secure / SCA challenge → provider modal between steps 5–6; cancel = failed branch F.

**Success:** order `paid`; payment status `held`; Escrow Timeline shows `payment_held`; buyer on Order Detail (with Escrow Timeline); seller notified (S3 starts).
**Related:** 05 § Checkout, § Escrow Flow · 08 § Checkout (Cart → Payment → Confirm), § Order Detail (with Escrow Timeline) · 09 § orders, payments, idempotency.

---

## B2 — Track order → approve delivery → funds released

**Persona:** Buyer.
**Trigger:** `order.delivered` notification, or visits Orders List.
**Preconditions:** order paid, escrow `payment_held`; seller has delivered (S3).

```
Notifications ─▶ Order Detail (with Escrow Timeline)  [stage: delivered]
                     │ "Approve delivery" ──▶ Confirmation Dialog ──▶ approved ──▶ released
                     │                                                    (funds to seller)
                     ├ "Open dispute" ─────▶ B3
                     └ (no action) ── auto-release timer expires ──▶ approved(auto) ──▶ released
```

| # | Screen | User action | System response | API call | Events |
|---|---|---|---|---|---|
| 1 | Notifications | Clicks `order.delivered` item | Deep link `?tab=timeline` | `GET /v1/orders/{id}` | — |
| 2 | Order Detail (with Escrow Timeline) | Reviews delivery (files/proof per listing type); stage **`delivered`** active, auto-release countdown visible | Escrow Timeline shows deadline (e.g. "Auto-approves in 6 days") | `GET /v1/orders/{id}/escrow-events` | — |
| 3 | same | "Approve delivery" → Confirmation Dialog (money-moving) → confirm | Stage → **`approved`**, then **`released`**; payment status **`released`**; Toast | `POST /v1/orders/{id}/approve` + `Idempotency-Key` | `order.completed`, `escrow.released` |
| 4 | same | — | Escrow Timeline complete; review prompt appears (B4) | — | — |

**Branches & errors:**
- **Auto-release:** no approval or dispute before the deadline → system approves: same `approved → released` transitions, `escrow.released` with `reason: auto`, both parties notified. The countdown and its consequence are always visible on the Escrow Timeline from the moment stage `delivered` starts (no silent timers — see 03).
- **Dispute instead:** "Open dispute" (available `delivered` and, for non-delivery, `payment_held`) → B3; timer pauses.
- Approval API fails → status unchanged, inline retry; idempotent by key.

**Success:** escrow stages read `payment_held → delivered → approved → released`; payment status `released`; seller payout eligible (S6).
**Related:** 05 § Escrow Flow, § Approval Flow · 08 § Order Detail (with Escrow Timeline) · 09 § escrow-events.

---

## B3 — Open dispute → resolution

**Persona:** Buyer (opens); Seller responds (S4); Admin decides (A2).
**Trigger:** "Open dispute" on Order Detail (with Escrow Timeline).
**Preconditions:** order in `payment_held` (non-delivery) or `delivered` (quality) stage; dispute window open.

```
Order Detail ─▶ Open dispute (reason + evidence) ─▶ stage: disputed ── escrow frozen
                                                         │ seller responds (S4)
                          ┌─ offer accepted by buyer ◀───┤
                          ▼                              ▼ no agreement / escalated
                    resolved (agreed)              Admin resolution (A2)
                          │                              │
              ┌───────────┼──────────────┬───────────────┤
              ▼           ▼              ▼               ▼
         refunded    released      partially_refunded   (all: stage disputed → closed, audit-logged)
```

| # | Screen | User action | System response | API call | Events |
|---|---|---|---|---|---|
| 1 | Order Detail (with Escrow Timeline) | "Open dispute" | Dispute form (Modal Layout → full screen on Mobile): reason category, description, evidence upload | — | — |
| 2 | same, `?tab=dispute` | Submits reason + evidence (File Upload) | Dispute created `open`; escrow stage → **`disputed`**; auto-release timer frozen; Escrow Timeline branch shown | `POST /v1/disputes` `{orderId, reason, description, evidenceIds}` | `dispute.opened` |
| 3 | same | Waits; sees seller response when posted (S4) | Dispute thread updates (Comment Thread) | `GET /v1/disputes/{id}` | `dispute.seller_responded` |
| 4a | same | Accepts seller's proposed resolution (e.g. partial refund offer) | Agreed resolution executes without admin | `POST /v1/disputes/{id}/accept-response` + `Idempotency-Key` | `dispute.resolved`, `escrow.partially_refunded` (or per offer) |
| 4b | same | No agreement → escalates (or timer escalates) | Dispute status `under_review`; enters Disputes Queue (A2) | `POST /v1/disputes/{id}/escalate` | `dispute.escalated` |
| 5 | same | — (admin decides, A2) | Outcome reflected: payment status **`refunded`**, **`released`**, or **`partially_refunded`**; dispute `resolved`; timeline annotated with decision + reason | `GET /v1/disputes/{id}` | `dispute.resolved` + matching `escrow.*` |

**Branches & errors:** dispute window closed → entry point disabled with explanation (not hidden — see 03). Buyer may withdraw before decision → escrow returns to prior stage, timer resumes. Evidence upload failures keep the draft locally.
**Success:** funds move exactly once to a terminal payment status (`refunded` / `released` / `partially_refunded`); both parties see identical, audit-backed history on their own projections.
**Related:** 05 § Dispute Flow, § Escrow Flow · 08 § Order Detail `?tab=dispute`, § Dispute Detail · 09 § disputes · A2, S4.

---

## B4 — Write review after completion

**Persona:** Buyer.
**Trigger:** review prompt on released order (B2 step 4), notification, or Reviews (write/manage) `?tab=pending`.
**Preconditions:** order `released` (only completed orders reviewable); no existing review for the order.

| # | Screen | User action | System response | API call | Events |
|---|---|---|---|---|---|
| 1 | Reviews (write/manage) | Opens pending tab, picks order | Review form: Rating (required) + text (optional, min-length if provided) | — | — |
| 2 | same | Submits | Review published, linked to verified order; Toast | `POST /v1/reviews` `{orderId, rating, body}` | `review.created` |
| 3 | same, `?tab=published` | May edit within edit window; sees seller response when posted (S5) | Review Card shows response beneath | `PATCH /v1/reviews/{id}` | — |

**Branches & errors:** already reviewed → `409 conflict` → UI navigates to the existing review. Review window expired → pending item shows expired state, no form. Content policy rejection → `validation_failed` with reason inline.
**Success:** one review per order, visibly "verified purchase" on Listing Detail; seller notified to respond.
**Related:** 05 § Review Flow · 08 § Reviews (write/manage), § Listing Detail reviews tab.

---

## B5 — Message seller (pre-sale inquiry) → conversation

**Persona:** Buyer (or authenticated Guest post-G3).
**Trigger:** "Contact seller" on Listing Detail / Seller Profile (public).
**Preconditions:** signed in + verified.

```
Listing Detail ─("Contact seller")─▶ composer (listing context attached) ─▶ send
                                                                             │
Messages (Split View) ◀── conversation created, both sides ──────────────────┘
   └ replies flow in-thread; unread badges per 06 §7
```

| # | Screen | User action | System response | API call | Events |
|---|---|---|---|---|---|
| 1 | Listing Detail | "Contact seller" | Composer opens (Right Drawer desktop / sheet mobile) with Listing Card context pinned | `GET /v1/conversations?filter[listingId]=` (reuse existing) | — |
| 2 | same | Writes and sends | Conversation created (or appended); optimistic send; navigate offer "View conversation" | `POST /v1/conversations` `{listingId, sellerId, message}` | `message.created` |
| 3 | Messages | Continues thread | Split View: Conversation List + Chat; read receipts; counterpart typing per capability | `GET /v1/conversations/{id}/messages?cursor=` · `POST …/messages` | `message.created` |

**Branches & errors:** existing conversation for the same listing pair → append, never duplicate threads. Seller suspended → composer disabled with explanation. Send failure → message marked failed in-thread with retry (kept locally). Order-scoped messages (post-purchase) live on the order's `?tab=messages` but are the same conversation object, cross-linked.
**Success:** one durable conversation per buyer-seller-listing context; unread counts consistent across sidebar/bell/bottom nav.
**Related:** 05 § Messaging Flow · 08 § Messages · 09 § conversations.

---

## B6 — Manage wallet & payment methods

**Persona:** Buyer.
**Trigger:** Wallet & Payment Methods in sidebar; or "add method" escape hatch from Checkout step 4 / failed payment notification.
**Preconditions:** signed in.

| # | Screen | User action | System response | API call | Events |
|---|---|---|---|---|---|
| 1 | Wallet & Payment Methods | Opens `?tab=methods` | Saved methods listed (brand, last4, expiry, default marker) | `GET /v1/payment-methods` | — |
| 2 | same | Adds method | Provider-hosted tokenization (iframe/SDK); on success method appears | `POST /v1/payment-methods` `{providerToken}` | — |
| 3 | same | Sets default / removes (Confirmation Dialog) | Default switched; removal blocked if method backs an active `held` order | `PATCH /v1/payment-methods/{id}` · `DELETE /v1/payment-methods/{id}` | — |
| 4 | same | Opens `?tab=transactions` | Ledger: charges, refunds (`refunded`/`partially_refunded`), wallet credits; cursor-paginated | `GET /v1/wallet/transactions?cursor=` | — |

**Branches & errors:** expired card flagged with `warning` tone + renew CTA. Delete-in-use → `409 conflict` explained inline (which order blocks it, linked).
**Success:** buyer can always reach a working payment method in ≤ 2 clicks from any payment failure.
**Related:** 05 § Settings, § CRUD · 08 § Wallet & Payment Methods.

---

## S1 — Seller onboarding

**Persona:** Buyer becoming Seller (or fresh sign-up with sell intent, G2).
**Trigger:** "Become a seller" (account menu / sidebar footer / G2 role choice).
**Preconditions:** verified account.

```
Seller Onboarding Wizard  ?step=account ─▶ ?step=store ─▶ ?step=payout ─▶ ?step=first-listing
      (identity/KYC)          (store profile)   (payout method)      ├ "Create first listing" ─▶ S2
      server-persisted per step — resumable (06 §5.4)                └ "Later" ─▶ Seller Dashboard
```

| # | Screen | User action | System response | API call | Events |
|---|---|---|---|---|---|
| 1 | Seller Onboarding Wizard — account | Confirms legal name, country, accepts seller terms; KYC per provider | Seller account created `onboarding` | `POST /v1/sellers` | `user.created` (sign-up entry path only) |
| 2 | — store | Store name, handle, logo (Avatar Upload), description | Handle uniqueness validated live; step saved | `PATCH /v1/sellers/{id}` | — |
| 3 | — payout | Connects payout method (bank / provider onboarding) | Payout status `pending` until provider verifies; wizard may proceed | `POST /v1/sellers/{id}/payout-methods` | — |
| 4 | — first-listing | "Create your first listing" or "Later" | Seller account `active` (listing publish still gated on payout verification); route to S2 or Seller Dashboard | `POST /v1/sellers/{id}/activation` | `seller.activated` |

**Branches & errors:** KYC deferred/failed → wizard step shows provider status; seller can browse `/seller` read-only with Warning Banner "Finish verification to publish". Handle taken → inline suggestion. Abandon → resume at earliest incomplete step from Seller Dashboard banner.
**Success:** `/seller` workspace unlocked; Seller Dashboard shows setup checklist (Progress Summary) until payout verified + first listing live.
**Related:** 05 § Wizard · 08 § Seller Onboarding Wizard, § Seller Dashboard.

---

## S2 — Create listing → moderation → approved / rejected + resubmit

**Persona:** Seller.
**Trigger:** "New listing" (Listings (list) toolbar / FAB / Command Palette / S1 step 4).
**Preconditions:** seller `active`.

```
Listing Editor (create wizard): basics ─▶ media ─▶ pricing ─▶ preview ─▶ Submit for review
                                                                    │ (draft saved throughout)
                             pending_review ◀───────────────────────┘
                              │ A1 decides
              ┌───────────────┴───────────────┐
              ▼                               ▼
         approved → active              rejected(reason) ─▶ edit ─▶ resubmit ─▶ pending_review
```

| # | Screen | User action | System response | API call | Events |
|---|---|---|---|---|---|
| 1 | Listing Editor (create wizard) | Fills basics (title, category, attributes from Categories & Attributes) | Draft created on first save; autosave per step | `POST /v1/listings` `{status:"draft"}` · `PATCH /v1/listings/{id}` | — |
| 2 | same | Uploads media (Image Gallery Upload) | Progressive upload, reorder, cover pick | `POST /v1/listings/{id}/media` | — |
| 3 | same | Sets pricing (Currency Input), delivery terms | Fees preview (Checkout Summary math, seller view) | `PATCH /v1/listings/{id}` | — |
| 4 | same | Preview step → "Submit for review" | Status `pending_review`; enters Listings Moderation queue (A1); listing read-only while queued | `POST /v1/listings/{id}/submit` | `listing.submitted` |
| 5 | Listings (list) | Watches status Badge (`draft / pending_review / active / rejected`) | On `listing.approved` → `active`, public at `/listings/{slug}` | `GET /v1/listings?filter[status]=` | `listing.approved` |
| 6' | Listing Editor (edit) | If `rejected`: opens from rejection notification; sees reason (Alert, verbatim from A1) | Fixes flagged fields; resubmits → back to step 4 | `PATCH /v1/listings/{id}` · `POST /v1/listings/{id}/submit` | `listing.submitted` |

**Branches & errors:** validation failures listed per-step with jump links (Form Wizard contract, see 04). Editing an `active` listing with material changes (price/media) may re-queue moderation per System Settings policy — UI states this before save. Draft never lost: leaving mid-wizard keeps `draft` in Listings (list).
**Success:** listing `active` and publicly reachable; rejection loop converges without data re-entry.
**Related:** 05 § Wizard, § CRUD, § Approval Flow · 08 § Listing Editor (create wizard / edit), § Listings (list) · A1.

---

## S3 — Fulfil order

**Persona:** Seller.
**Trigger:** `order.paid` notification ("New order").
**Preconditions:** order `paid`, escrow `payment_held`.

```
Notifications ─▶ Order Detail (fulfil) [needs action]
                    │ Accept ─▶ in_fulfilment ─▶ Deliver (files/proof/tracking) ─▶ stage: delivered
                    │                                                              │
                    └ Decline(reason) ─▶ order cancelled, escrow refunded          ▼
                                                        buyer approves (B2) / auto-release ─▶ approved ─▶ released ─▶ payout (S6)
```

| # | Screen | User action | System response | API call | Events |
|---|---|---|---|---|---|
| 1 | Seller Dashboard / Notifications | Opens new order | Order Detail (fulfil): buyer requirements, deadline, escrow state `payment_held` | `GET /v1/orders/{id}` | — |
| 2 | Order Detail (fulfil) | "Accept order" (or auto-accept per Store Settings) | Order `in_fulfilment`; deadline clock starts | `POST /v1/orders/{id}/start-fulfilment` | `order.fulfilment_started` |
| 3 | same | Works; optionally messages buyer (`?tab=messages`) | Same conversation object as B5 | `POST /v1/conversations/{id}/messages` | `message.created` |
| 4 | same | "Deliver": uploads deliverables / proof / tracking + note | Escrow stage → **`delivered`**; buyer auto-release timer starts; order awaits approval | `POST /v1/orders/{id}/deliver` `{assetIds, note, tracking?}` | `order.delivered` |
| 5 | same | — (buyer approves in B2, or auto-release) | Stage `approved → released`; payment status **`released`**; Earnings & Payouts balance updates | — | `order.completed`, `escrow.released` |

**Branches & errors:**
- **Decline** at step 2 (can't fulfil) → Confirmation Dialog with reason → order `cancelled`, payment status **`refunded`**, buyer notified. `order.cancelled`, `escrow.refunded`.
- Deadline overrun → order flagged `overdue` (warning tone) in both projections; repeated overruns feed seller metrics (Analytics).
- Buyer disputes instead of approving → B3/S4; stage `disputed`, release blocked.
- Delivery upload failure → files retry individually; partial delivery is never submitted implicitly.

**Success:** funds `released` to seller balance exactly once; timeline consistent across buyer/seller/admin projections.
**Related:** 05 § Escrow Flow · 08 § Order Detail (fulfil) · 09 § orders, escrow-events.

---

## S4 — Respond to dispute with evidence

**Persona:** Seller.
**Trigger:** `dispute.opened` notification.
**Preconditions:** dispute `open` on seller's order; response window running.

| # | Screen | User action | System response | API call | Events |
|---|---|---|---|---|---|
| 1 | Order Detail (fulfil) `?tab=dispute` | Opens dispute from notification | Buyer's claim + evidence visible; response deadline countdown | `GET /v1/disputes/{id}` | — |
| 2 | same | Writes response, uploads counter-evidence | Draft kept locally until submit | `POST /v1/disputes/{id}/responses` `{body, evidenceIds}` | `dispute.seller_responded` |
| 3 | same | Optionally proposes resolution (full/partial refund offer, redelivery) | Offer shown to buyer (B3 step 4a); amounts validated ≤ order total | `POST /v1/disputes/{id}/offers` `{type, amount?}` | — |
| 4 | same | — (buyer accepts, or escalation → A2) | Outcome per B3 step 5 reflected on seller projection | — | `dispute.resolved` |

**Branches & errors:** response window expires with no response → dispute auto-escalates to `under_review` (admins weigh silence accordingly); seller UI shows the missed deadline honestly. Offer withdrawal allowed until acceptance.
**Success:** seller's side of the record is complete before admin review; agreed offers resolve without admin at all.
**Related:** 05 § Dispute Flow · 08 § Order Detail (fulfil) `?tab=dispute` · B3, A2.

---

## S5 — Respond to review

**Persona:** Seller.
**Trigger:** `review.created` notification; Reviews (respond) badge (unanswered count).
**Preconditions:** published review on seller's order, no response yet.

| # | Screen | User action | System response | API call | Events |
|---|---|---|---|---|---|
| 1 | Reviews (respond) | Opens unanswered review | Review Card + order context + single response composer | `GET /v1/reviews?filter[unanswered]=true` | — |
| 2 | same | Writes public response, submits | Response published beneath review everywhere it renders (Listing Detail, buyer's Reviews) | `POST /v1/reviews/{id}/responses` | `review.response_created` |
| 3 | same | (If review violates policy) "Report review" | Flag goes to Admin moderation, review stays visible pending decision | `POST /v1/reviews/{id}/flags` `{reason}` | `review.flagged` |

**Branches & errors:** one response per review — edit within window, never delete-and-hide. Reported review outcome notifies seller either way.
**Success:** response visible with the review; unanswered badge decrements.
**Related:** 05 § Review Flow · 08 § Reviews (respond).

---

## S6 — Request payout / view earnings

**Persona:** Seller.
**Trigger:** Earnings & Payouts; or `escrow.released` notification.
**Preconditions:** payout method verified (S1); available balance > 0.

```
Earnings & Payouts ?tab=overview ─▶ balances: pending clearance | available | paid out
        │ "Request payout" (or auto-payout schedule per Store Settings)
        ▼
Confirmation Dialog (amount, method, fees, ETA) ─▶ payout processing ─▶ paid
                                                        └ failed ─▶ fix method ─▶ retry
```

| # | Screen | User action | System response | API call | Events |
|---|---|---|---|---|---|
| 1 | Earnings & Payouts | Reviews balances; ledger of `released` orders, fees, refund deductions | Statistic Block row + cursor-paginated Table; statement export | `GET /v1/sellers/{id}/earnings` · `GET /v1/sellers/{id}/transactions?cursor=` | — |
| 2 | same | "Request payout" → amount (≤ available) → confirm | Payout `processing`; balance moves available → in-transit | `POST /v1/payouts` `{amount, payoutMethodId}` + **`Idempotency-Key`** | — |
| 3 | same, `?tab=payouts` | Tracks payout | On provider settlement → `paid` with reference | `GET /v1/payouts/{id}` | `payout.sent` |

**Branches & errors:** payout `failed` (bank rejected) → funds return to available, Earnings dot badge + notification with provider reason and "Update payout method" CTA → retry (new Idempotency-Key — distinct attempt). Minimum payout threshold and fee shown before confirm, never discovered after.
**Success:** ledger always reconciles: escrow `released` sums − fees − refunds = payouts + balance.
**Related:** 05 § Escrow Flow (payout leg) · 08 § Earnings & Payouts · 09 § payouts.

---

## A1 — Moderate listings queue

**Persona:** Admin (moderation role).
**Trigger:** Listings Moderation badge (pending count) / daily queue routine.
**Preconditions:** listings in `pending_review`.

```
Listings Moderation ?tab=pending ─▶ open item (Right Drawer) ─▶ review content/media/policy
                                          │ Approve ─▶ active, seller notified
                                          └ Reject(structured reason, required) ─▶ rejected → S2 step 6'
```

| # | Screen | User action | System response | API call | Events |
|---|---|---|---|---|---|
| 1 | Listings Moderation | Opens queue, oldest-first | Queue list; keyboard j/k navigation (see 11); item opens in Right Drawer with full preview | `GET /v1/admin/listings?filter[status]=pending_review&sort=createdAt&cursor=` | — |
| 2 | same | **Approve** | Listing `active`; drawer advances to next item (queue momentum) | `POST /v1/admin/listings/{id}/approve` | `listing.approved`, audit entry |
| 3' | same | **Reject** → structured reason (category + verbatim note shown to seller, required) | Listing `rejected`; seller sees the exact reason in S2 step 6' | `POST /v1/admin/listings/{id}/reject` `{reasonCode, note}` | `listing.rejected`, audit entry |
| 4 | same | (Edge) escalate/flag for senior review | Item moves to `?tab=flagged` with note | `POST /v1/admin/listings/{id}/flags` | audit entry (internal — no webhook) |

**Branches & errors:** two admins open the same item → soft lock ("Being reviewed by {admin}"); decisions are last-write-rejected with `409 conflict`, not silently overwritten. Bulk approve exists only for trusted-seller re-submissions (Bulk Actions Bar) and still writes one audit entry per listing.
**Success:** queue reaches zero; every decision has actor + reason in Audit Log; sellers never receive a reason-less rejection.
**Related:** 05 § Approval Flow, § Bulk Actions · 08 § Listings Moderation · S2.

---

## A2 — Resolve dispute

**Persona:** Admin (disputes role).
**Trigger:** Disputes Queue badge; dispute `under_review` (B3 step 4b / S4 auto-escalation).
**Preconditions:** dispute escalated; both sides' submissions closed or windows expired.

```
Disputes Queue ─▶ Dispute Detail (Split View: buyer evidence | seller evidence)
                     │ reads order history, Escrow Timeline, conversation, prior disputes
                     ▼ Decision (Confirmation Dialog, money-moving, reason required)
     ┌───────────────┼──────────────────────┐
     ▼               ▼                      ▼
 Refund buyer    Release to seller    Partial refund (split amount)
 (refunded)      (released)           (partially_refunded)
     └───────────────┴──────────────────────┘
              escrow moves funds once · dispute resolved · both parties notified · Audit Log entry
```

| # | Screen | User action | System response | API call | Events |
|---|---|---|---|---|---|
| 1 | Disputes Queue | Opens dispute (oldest / SLA-breach first) | Dispute Detail: Split View evidence panes, full order + escrow context, decision panel | `GET /v1/admin/disputes/{id}` | — |
| 2 | Dispute Detail | Reviews both sides; may request more info | Dispute returns to `open` (seller asked) or `seller_responded` (buyer asked), clock pauses, party notified | `POST /v1/admin/disputes/{id}/info-requests` `{party, message}` | — |
| 3 | same | Picks decision: **refund / release / partial** (+ amount) + written rationale (required) | Confirmation Dialog restates money movement precisely | — | — |
| 4 | same | Confirms | Escrow executes exactly one transition: payment status → **`refunded`** \| **`released`** \| **`partially_refunded`**; dispute `resolved`; decision + rationale visible to both parties on their projections; immutable Audit Log entry (actor, decision, amounts, rationale) | `POST /v1/admin/disputes/{id}/resolution` `{decision, amount?, rationale}` + **`Idempotency-Key`** | `dispute.resolved`, `escrow.refunded` \| `escrow.released` \| `escrow.partially_refunded`, audit entry |

**Branches & errors:** partial amount validated `0 < amount < order total` — else `validation_failed`. Payment provider failure during execution → decision recorded `pending_execution`, surfaced in Payments & Refunds (dot badge) for retry — never re-decided, only re-executed (same Idempotency-Key). Assignment prevents two admins deciding: unassigned queue → assign-on-open.
**Success:** one decision, one funds movement, full audit trail; both parties can read *why*.
**Related:** 05 § Dispute Flow, § Approval Flow · 08 § Disputes Queue, § Dispute Detail, § Audit Log · 09 § admin disputes.

---

## A3 — Suspend user

**Persona:** Admin (trust & safety role).
**Trigger:** policy violation found via Users, a dispute pattern (A2), flagged reviews/listings, or report.
**Preconditions:** target user exists and is not already suspended; admin role permits suspension (Permission Matrix).

| # | Screen | User action | System response | API call | Events |
|---|---|---|---|---|---|
| 1 | Users | Searches user (`q` = name/email/handle), opens | User Detail: profile, orders, listings, activity tabs, prior enforcement history | `GET /v1/admin/users?q=` · `GET /v1/admin/users/{id}` | — |
| 2 | User Detail | "Suspend user" → form: reason category, internal note, user-facing message, duration (temporary/indefinite) | Confirmation Dialog spells consequences (sessions revoked, listings unpublished, payouts frozen, open orders continue under supervision) | — | — |
| 3 | same | Confirms | User `suspended`: sessions revoked; seller listings → `suspended` (delisted, not deleted); new orders/messages blocked; in-flight escrow untouched but flagged for review; user emailed with reason + appeal path; immutable Audit Log entry | `POST /v1/admin/users/{id}/suspension` `{reasonCode, message, note, until?}` | `user.suspended`, `listing.suspended`×n, audit entry |
| 4 | same | (Later) "Lift suspension" | Reverse transitions; listings restored to prior status; audit entry | `DELETE /v1/admin/users/{id}/suspension` | `user.reinstated`, audit entry |

**Branches & errors:** suspending a seller with `held` escrow → dialog lists affected orders; funds NEVER auto-move — each open order resolves via normal escrow/dispute flows (B2/B3/A2) under supervision. Suspended user signing in → dedicated suspension screen with reason + appeal (Error Page 403 variant, see 08/10) — never a silent sign-in failure. Support-role admins without suspension permission see the action disabled with the required role named (see 03).
**Success:** user's ability to transact halted immediately and reversibly; money integrity preserved; complete audit trail; user knows why and how to appeal.
**Related:** 05 § CRUD (enforcement variant) · 08 § Users, § User Detail, § Audit Log · 09 § admin users.

---

## Cross-flow invariants

Guarantees that hold across every flow above; a change to any single flow may not break them.

1. **Money moves once.** Exactly one transition out of payment status `held` per order (§0.1). Retries are re-executions under the same Idempotency-Key, never second decisions (B1, B2, A2, S6).
2. **No silent timers.** Every deadline that changes state (auto-release B2, dispute response window S4, fulfilment deadline S3, review/edit windows B4/S5) is visible on the owning screen from the moment it starts, with its consequence stated.
3. **Symmetric records.** Buyer, Seller, and Admin projections of the same order/dispute render the same event history (Escrow Timeline / Audit Log) — projections differ in actions offered, never in facts shown.
4. **Reason required.** Every adverse decision (reject A1, resolve A2, suspend A3, decline S3) carries a structured reason delivered verbatim to the affected party. No reason-less rejections anywhere.
5. **Resumability.** Multi-step flows survive interruption: wizards resume at the earliest incomplete step (06 §5.4); auth walls round-trip via `?next=` (G3); drafts and failed messages persist (S2, B5).
6. **Interrupted ≠ lost.** A failed step keeps user input and offers retry in place; navigation away from an unsaved money step warns first (B1).
7. **Notification honesty.** Every state change a party must act on emits an event mapped in 06 §7 — and every such flow is also reachable without notifications (entry-point coverage below).
8. **Audit completeness.** Every admin decision (A1–A3) and every escrow transition writes an immutable Audit Log entry with actor, action, and rationale.

## Flow entry-point coverage

Every flow must be reachable from all of its legitimate entry points — a flow reachable only from a notification is broken for users with notifications off. QA checks each cell.

| Flow | Sidebar / nav | Notification (06 §7) | Deep link / email | In-context CTA |
|---|---|---|---|---|
| G1 | Top Navigation Search Bar | — | `/search?q=`, `/listings/{slug}` | Home sections, category nav |
| G2 | Sign Up (top nav) | — | invite/verify email links | auth walls (G3, B1) |
| G3 | — | — | shared listing URL | "Contact seller" on Listing Detail / Seller Profile (public) |
| B1 | — | `payment.failed` (retry) | listing URL → buy | "Buy now" on Listing Detail; cart icon |
| B2 | Orders List badge | `order.delivered` | order email → `/account/orders/{id}?tab=timeline` | Buyer Dashboard activity |
| B3 | — | `dispute.seller_responded`, `dispute.resolved` | dispute email | "Open dispute" on Order Detail (with Escrow Timeline) |
| B4 | Reviews (write/manage) badge | review prompt after `escrow.released` | email nudge | prompt on completed Order Detail |
| B5 | Messages badge | `message.created` | conversation URL | "Contact seller" on Listing Detail |
| B6 | Wallet & Payment Methods | `payment.failed` | — | Checkout step 4 "add method" |
| S1 | account menu "Become a seller" | — | onboarding resume email | G2 role choice; sidebar footer |
| S2 | Listings (list) "New listing" | `listing.rejected` (resubmit) | draft resume link | S1 step 4; FAB (Mobile); Command Palette |
| S3 | Orders List badge (needs action) | `order.paid` | order email | Seller Dashboard queue widget |
| S4 | Orders List badge | `dispute.opened` | dispute email | Order Detail (fulfil) `?tab=dispute` |
| S5 | Reviews (respond) badge | `review.created` | — | Seller Dashboard |
| S6 | Earnings & Payouts | `escrow.released`, `payout.failed` | payout email | Seller Dashboard balance Metric Card |
| A1 | Listings Moderation badge | `listing.submitted` (digest) | queue URL `?tab=pending` | Admin Dashboard queue widget |
| A2 | Disputes Queue badge | `dispute.escalated` | dispute URL | Admin Dashboard SLA widget |
| A3 | Users → User Detail | report/flag digests | user URL from any admin surface | flags on reviews/listings/disputes |

## Flow → pattern index

| Flow | Primary patterns (05) |
|---|---|
| G1 | Search, Filtering |
| G2, G3 | Authentication |
| B1 | Checkout, Escrow Flow |
| B2 | Escrow Flow, Approval Flow, Timeline |
| B3, S4, A2 | Dispute Flow, Escrow Flow, Approval Flow |
| B4, S5 | Review Flow |
| B5 | Messaging Flow, Notifications |
| B6 | Settings, CRUD |
| S1 | Wizard |
| S2, A1 | Wizard, CRUD, Approval Flow |
| S3 | Escrow Flow, Timeline |
| S6 | Escrow Flow, Dashboard |
| A3 | CRUD, Audit (Approval Flow inverse) |

## Adding a new flow (checklist)

A new flow PR to this document must:

1. Use the template verbatim (Persona · Trigger · Preconditions · diagram · step table · branches · success · related).
2. Name screens/components from the canonical inventories; URLs from 06; statuses from §0 — no synonyms.
3. Map every emitted event into 06 §7 (badge + category + deep link) in the same change.
4. Prove all four entry-point columns (or mark N/A with a reason) in the coverage table.
5. Not violate a cross-flow invariant; if one must bend, amend the invariant explicitly first.
6. Add the flow to the pattern index and point 08 at any new screen states it requires.

---

*Cross-references: screens 08 · patterns 05 · endpoints/events/idempotency 09 · IA & URLs 06 · microcopy for every state named here 10.*
