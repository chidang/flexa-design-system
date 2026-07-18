# 08 — Flexa Screen Specifications

> Per-screen specifications for the reference product **Flexa Marketplace** (multi-vendor marketplace with escrow payments, messaging, disputes, reviews). This document owns *screen-level* decisions only: which layout, which components in which regions, what data, which states, which permissions, which analytics events.
>
> It never restates rules owned elsewhere. Layouts & components → `02-ui-kit/`. UX rules → doc 03. Component contracts → doc 04. Patterns → doc 05. Navigation model & URLs → doc 06. Flows → doc 07. Payloads → doc 09. Copy → doc 10. Accessibility → doc 11. A screen spec may never override a component contract; a component may never override a token (see README, Precedence).
>
> Screens are named by the **canonical screen inventory** in `README.md`. Every canonical screen appears here: 14 flagship screens in § 2 (full specs) and all remaining screens in § 3 (condensed specs).

---

## 1. How to read a screen spec

Every full spec uses the fields below, in this order. Condensed specs (§ 3) keep Route & access, Layout, Purpose & primary action, Regions & components, Data requirements, and States, and compress the rest.

| Field | Meaning |
|---|---|
| **Route & access** | URL (doc 06 owns the scheme), personas allowed, required permission. Personas are canonical: `Guest · Buyer · Seller · Admin`. Unauthorized access renders the permission-denied state, never a blank page. |
| **Layout** | One layout from `02-ui-kit/layouts.md`, named verbatim (e.g. Sidebar Layout, Wizard Layout). Authenticated app screens live inside App Shell; the spec names the inner layout. |
| **Purpose & primary action** | One sentence of intent + **exactly one** primary action per screen (doc 03 § Hierarchy). Everything else is secondary/ghost emphasis. |
| **Wireframe** | ASCII, desktop range (1024–1439). A mobile wireframe appears only when the structure differs (not merely stacks). |
| **Regions & components** | Table: region → canonical components (verbatim names from README inventory) → data shown. |
| **Data requirements** | API calls in doc 09 conventions (`/v1/...`, cursor pagination, camelCase, money as integer minor units + ISO-4217 `currency`). Split into *first paint* (blocking) vs *deferred* (after first paint / on interaction). |
| **States** | Loading (which regions get Skeleton Loader, in what shape), empty (named Empty State + copy pointer), error (Inline Error / Error Page / Toast per doc 03 § Feedback), permission-denied. |
| **Interactions** | Numbered behavior rules specific to this screen. Pattern mechanics are *instantiated*, not redefined ("Filtering per 05 § Filtering with fields: …"). |
| **Responsive deltas** | What changes across the 4 canonical ranges (Mobile ≤767 / Tablet 768–1023 / Desktop 1024–1439 / Wide ≥1440). Only deltas; the layout's own responsive contract is inherited. |
| **Copy pointers** | Which doc 10 tables supply headings, empty states, errors, CTAs for this screen. |
| **Analytics events** | `screen_viewed` (with `screen` property) plus key action events. All snake_case. Event payload detail lives with the analytics contract in doc 09 § Analytics. |

### 1.1 Cross-screen conventions (binding within this document)

- **Payment/escrow status vocabulary** — exactly these machine names, everywhere:
  - Payment statuses: `pending | processing | held | released | refunded | partially_refunded | failed`.
  - Escrow stages: `payment_held | delivered | approved | released | disputed`.
  - Rendered via Payment Status and Escrow Timeline components; display labels come from doc 10 § Status labels. Never invent a synonym ("in escrow", "complete") in UI code.
- **Money** — always amount + currency code (`$120.00 USD`), sourced from `{amount, currency}` minor-unit pairs (doc 09). Never a bare number.
- **List screens** — every list screen names its filter set and its Empty State (first-use vs filtered-empty are distinct, per 05 § Empty State).
- **Permissions** — actions are listed with the persona/permission that may see them. Hidden ≠ disabled: an action the persona can never have is *hidden*; an action blocked by state (e.g. escrow already `released`) is *disabled* with a tooltip (doc 03 § Feedback).
- **Skeletons** — skeleton shapes mirror the loaded layout 1:1 (doc 03 § Feedback); this doc specifies *which regions* skeleton and how many rows/cards.
- **Analytics** — every screen fires `screen_viewed` once per navigation (not per re-render). Action events fire on *success* of the action unless noted (attempt-level events are suffixed `_submitted`).

### 1.2 Permission vocabulary used in this document

This section (with 09 §1 auth scopes as the API-side counterpart) owns the permission vocabulary; the Permission Matrix *component* is specified in 02-ui-kit/admin.md § Permission Matrix. These are the permission ids screen specs reference. A permission gates *visibility* of the action (hidden when never grantable), the API enforces it again server-side (doc 09 § Auth).

| Permission | Grants | Default holders |
|---|---|---|
| `seller.access` | Seller surfaces (`/seller/*`) | Seller (onboarded) |
| `listings.read` / `listings.write` | View / create-edit own listings | Seller; team per role |
| `orders.fulfil` | Accept, decline, deliver own-store orders | Seller owner + fulfilment team |
| `payouts.read` / `payouts.manage` | View earnings / change payout method, withdraw | Seller (read: team; manage: owner) |
| `analytics.read` | Seller analytics | Seller owner + analyst team |
| `store.manage` / `store.team` | Store settings / team management | Seller owner |
| `admin.access` | Admin surfaces (`/admin/*`) | Admin |
| `users.read` / `users.manage` / `users.pii` | View users / suspend-reinstate / unmasked PII | Admin; support roles vary |
| `listings.moderate` | Approve, reject, request changes | Admin moderation role |
| `orders.read` | Platform-wide order read | Admin |
| `disputes.read` / `disputes.assign` / `disputes.resolve` | View queue & cases / assign / **refund, release, partial** | Admin; resolve restricted to senior roles |
| `payments.read` / `payments.refund` | Payment ledger / manual refunds & payout retry | Admin finance role |
| `catalog.manage` | Categories & attributes | Admin |
| `reports.read` | Admin reports | Admin |
| `audit.read` / `audit.export` | Audit log view / export | Admin (export: senior) |
| `settings.read` / `settings.manage` | System settings view / change | Admin (manage: senior) |
| `system.ops` | Queue monitor, job retry | Admin ops role |

### 1.3 Escrow stage → screen action matrix

Single source for which action appears where (05 § Escrow Flow owns the state machine; this matrix instantiates it per screen). "—" = no action, status display only.

| Escrow stage | Order Detail (buyer, § 2.5) | Order Detail (fulfil, § 2.10) | Dispute Detail (admin, § 2.13) |
|---|---|---|---|
| `payment_held` (unaccepted) | — (cancel window per policy) | **Accept order** / Decline… | — |
| `payment_held` (accepted) | — | tracking fields + **Mark as delivered** | — |
| `delivered` | **Approve delivery** / Open a dispute | — (watch auto-approve countdown) | — |
| `approved` | — (Leave a review link) | — ("Funds releasing" notice) | — |
| `released` | — (Leave a review link) | — (link to Earnings & Payouts) | — |
| `disputed` | — (link to dispute thread) | **Respond to dispute** | **Refund buyer / Release to seller / Partial refund…** (`disputes.resolve`) |

Payment status transitions rendered by Payment Status alongside: `held → released` (approve/release outcome), `held → refunded` (decline, full-refund resolution), `held → partially_refunded` (partial resolution), `pending/processing → failed` (checkout only).

---

## 2. Flagship screen specifications (full)

### 2.1 Home

- **Route & access:** `/` · Guest, Buyer, Seller, Admin · no permission.
- **Layout:** Top Navigation Layout (public shell). Signed-in users keep the public shell on `/`; the account switcher in Top Navigation links into App Shell surfaces.
- **Purpose & primary action:** Route visitors to the catalog. Primary action: **submit a search** (Search Bar).
- **Wireframe (desktop):**

```
┌──────────────────────────────────────────────────────────────┐
│ Top Navigation: logo · category menu · [Search Bar]          │
│                 Sign In · Sign Up | avatar menu (signed in)  │
├──────────────────────────────────────────────────────────────┤
│ Hero band: headline · [Search Bar, large] · trust copy       │
├──────────────────────────────────────────────────────────────┤
│ Featured categories (Chip row, horizontal scroll)            │
├──────────────────────────────────────────────────────────────┤
│ "Popular right now"     [Listing Card] x4 (grid)             │
│ "New this week"         [Listing Card] x4 (grid)             │
├──────────────────────────────────────────────────────────────┤
│ Top sellers              [Seller Card] x3                    │
├──────────────────────────────────────────────────────────────┤
│ Marketplace Statistics band · footer links                   │
└──────────────────────────────────────────────────────────────┘
```

- **Regions & components:**

| Region | Components | Data |
|---|---|---|
| Header | Top Navigation, Search Bar | categories, session, cart count |
| Hero | Search Bar (lg), Badge (trust) | static copy (10 § Home) |
| Category strip | Chip | top-level categories |
| Listing rails ×2 | Listing Card, Skeleton Loader | title, cover image, price + currency, Rating, seller name |
| Sellers rail | Seller Card | store name, Avatar, Rating, listing count |
| Stats band | Marketplace Statistics | live counts (listings, orders, sellers) |

- **Data requirements:**
  - First paint: `GET /v1/categories?level=1` · `GET /v1/listings?sort=popular&limit=8` (both rails come from one call segmented client-side, or two calls with `sort=popular|newest` — doc 09 § Listings).
  - Deferred: `GET /v1/sellers?sort=top&limit=3` · `GET /v1/stats/marketplace` (below the fold, load on scroll-near).
- **States:** Loading — hero renders immediately (static); rails show 4 Listing Card skeletons each, sellers rail 3 Seller Card skeletons. Empty — a rail with zero items collapses (no Empty State on Home). Error — failed rail collapses silently and logs; Search Bar never blocks. Permission-denied — n/a (public).
- **Interactions:**
  1. Search submit navigates to Search Results with `?q=`; typeahead per 05 § Search (recent queries for signed-in users, top categories for guests).
  2. Chip tap navigates to Search Results pre-filtered by category.
  3. Listing Card click → Listing Detail; card hover behavior per Listing Card contract (doc 04).
  4. Signed-in Buyers see a "Continue where you left off" rail (recently viewed) injected above "Popular right now" — same Listing Card grid.
- **Responsive deltas:** Mobile — rails become horizontal snap-scroll rows of 1.5 visible cards; category Chips wrap to 2 rows max then scroll; Bottom Navigation (Mobile) appears for signed-in users. Tablet — rails 2-up grid. Desktop — as wireframe (4-up). Wide — content capped at `size.container-xl`, rails stay 4-up.
- **Copy pointers:** 10 § Home (hero, rail headings), 10 § CTAs.
- **Analytics:** `screen_viewed{screen:"home"}` · `search_submitted` · `category_chip_clicked` · `listing_card_clicked{source:"home_rail"}`.

### 2.2 Search Results

- **Route & access:** `/search?q=&category=&…` · all personas · no permission.
- **Layout:** Top Navigation Layout with Content Area split: filter rail (left, 280px) + results.
- **Purpose & primary action:** Let a visitor narrow the catalog to a purchasable listing. Primary action: **open a listing** (Listing Card click).
- **Wireframe (desktop):**

```
┌──────────────────────────────────────────────────────────────┐
│ Top Navigation + [Search Bar: "q"]                           │
├──────────────┬───────────────────────────────────────────────┤
│ Advanced     │ "1,240 results for 'q'"   Sort [Select]       │
│ Filters      │ Applied filters: [Chip x] [Chip x] Clear all  │
│  Category ▾  ├───────────────────────────────────────────────┤
│  Price range │ [Listing Card] [Listing Card] [Listing Card]  │
│  Rating      │ [Listing Card] [Listing Card] [Listing Card]  │
│  Seller      │ [Listing Card] [Listing Card] [Listing Card]  │
│  Shipping    ├───────────────────────────────────────────────┤
│ [Saved       │ Pagination                                    │
│  Filters]    │                                               │
└──────────────┴───────────────────────────────────────────────┘
```

- **Regions & components:**

| Region | Components | Data |
|---|---|---|
| Header | Top Navigation, Search Bar | query echo |
| Filter rail | Advanced Filters, Saved Filters (signed-in), Checkbox, Slider, Rating, Select | facet counts |
| Results header | Select (sort), Chip (applied filters), Badge (result count) | total, applied filters |
| Results grid | Listing Card, Skeleton Loader | title, image, price + currency, Rating, seller, shipping Badge |
| Footer | Pagination | pageInfo |

- **Data requirements:**
  - First paint: `GET /v1/listings?q=&category=&priceMin=&priceMax=&ratingMin=&sellerId=&shipping=&sort=&cursor=&limit=24` — returns `{data, pageInfo, facets}` (doc 09 § Listings/Search).
  - Deferred: none; facet counts ride the same response. Saved Filters: `GET /v1/me/saved-filters?context=search` (signed-in only).
- **States:** Loading — results grid shows 12 Listing Card skeletons; filter rail renders from cache immediately, facet counts fade in. Filtered-empty — Empty State "No results match your filters" with *Clear all filters* action (copy 10 § Search). No-query empty — redirect to Home. Error — Inline Error replacing grid with *Retry*; filters stay usable. Permission-denied — n/a.
- **Interactions:**
  1. Filtering per 05 § Filtering with fields: **category (Tree-style Checkbox), price range (Slider + Currency Input pair), rating minimum (Rating), seller (Autocomplete), shipping (Checkbox)**. Filters sync to URL query; back/forward restores them.
  2. Applied filters render as dismissible Chips; *Clear all* resets to `q` only.
  3. Sort per 05 § Search: relevance (default with `q`), newest, price asc/desc, rating.
  4. Pagination is cursor-based; page controls per Pagination contract. Infinite scroll is NOT used here (shareable URLs win — doc 03 § Productivity).
  5. Signed-in users may save the current filter set (Saved Filters, per 05 § Filtering).
- **Responsive deltas:** Mobile — filter rail becomes a full-height sheet opened by a *Filters (n)* button; results 1-col; sort in the same sheet. Tablet — filter rail collapses to Right Drawer trigger; results 2-col. Desktop — as wireframe, 3-col. Wide — 4-col grid.
- **Copy pointers:** 10 § Search (result count phrasing, empty states), 10 § Filters.
- **Analytics:** `screen_viewed{screen:"search_results"}` · `search_filter_applied{field}` · `search_sorted{sort}` · `search_filter_saved` · `listing_card_clicked{source:"search"}`.

### 2.3 Listing Detail

- **Route & access:** `/listings/{slug}` · all personas · no permission. Draft/removed listings: owner Seller and Admin only (others get not-found state).
- **Layout:** Top Navigation Layout; Content Area two-column (gallery+content 2fr / buy box 1fr, buy box sticky).
- **Purpose & primary action:** Convince and convert. Primary action: **Add to cart** (Buyers/Guests; Guests are routed through Sign In per 07 § Guest Purchase).
- **Wireframe (desktop):**

```
┌──────────────────────────────────────────────────────────────┐
│ Top Navigation                                               │
│ Breadcrumb: Home / Category / Subcategory                    │
├──────────────────────────────┬───────────────────────────────┤
│ Gallery (Media Grid + zoom)  │ Buy box (sticky Card):        │
│                              │  Title · Rating (count)       │
│ Title + Badge (condition)    │  Price $120.00 USD            │
│ Description (rich text)      │  Variant [Select] Qty [Stepper]│
│ Attributes (Description List)│  [ Add to cart ]  ← primary   │
│ Shipping & returns (Accordion)│ [ Message seller ] (ghost)   │
├──────────────────────────────┤  Escrow trust note            │
│ Seller Card (rating, response│  Shipping estimate            │
│  time, [Visit store])        │                               │
├──────────────────────────────┴───────────────────────────────┤
│ Reviews: summary (Rating histogram) + Review Card list       │
│ Pagination                                                   │
├──────────────────────────────────────────────────────────────┤
│ "More from this seller" [Listing Card] x4                    │
└──────────────────────────────────────────────────────────────┘
```

- **Wireframe (mobile, structurally different — buy box is not sticky; a pinned bottom action bar carries price + primary):**

```
┌──────────────────────────┐
│ ← back    ⋯ (share/report)│
│ [Gallery, swipe, 1:1]    │
│ Title · Rating (312)     │
│ $120.00 USD              │
│ Variant [Select]  Qty [-1+]│
│ Description ▾ (Accordion)│
│ Attributes ▾ · Shipping ▾│
│ Seller Card              │
│ Reviews …                │
├──────────────────────────┤
│ $120.00 USD [Add to cart]│  ← pinned bottom bar
└──────────────────────────┘
```

- **Regions & components:**

| Region | Components | Data |
|---|---|---|
| Path | Breadcrumb | category ancestry |
| Gallery | Media Grid, Gallery | images/video |
| Content | Badge, Description List, Accordion, Rich Text (rendered) | description, attributes, shipping policy |
| Buy box | Card, Rating, Select, Stepper, Currency display, Button, Alert (low stock) | price + currency, variants, stock |
| Seller | Seller Card | store name, Rating, response time |
| Reviews | Rating (histogram), Review Card, Pagination | reviews, breakdown |
| Related | Listing Card ×4 | same-seller listings |

- **Data requirements:**
  - First paint: `GET /v1/listings/{id}` (includes variants, attributes, seller summary, rating summary).
  - Deferred: `GET /v1/listings/{id}/reviews?cursor=&limit=10` (on scroll-near) · `GET /v1/sellers/{id}/listings?limit=4` · availability re-check `GET /v1/listings/{id}/availability` on variant change.
- **States:** Loading — gallery block + buy box skeleton (title line, price line, button block); reviews section skeletons 3 Review Cards. Empty — zero reviews: Empty State "No reviews yet" (10 § Reviews); zero related: section collapses. Error — full-fetch failure renders Error Page (not-found vs server error per doc 03). Out of stock — buy box swaps primary to disabled *Out of stock* + *Message seller* becomes prominent secondary. Permission-denied — draft listing for non-owner renders not-found (no existence leak).
- **Interactions:**
  1. Add to cart per 05 § Checkout entry: optimistic cart badge increment + Toast with *View cart*; failure rolls back with error Toast.
  2. Variant Select re-prices the buy box and re-checks availability; Qty Stepper clamps to stock.
  3. *Message seller* opens Messages with a draft conversation contextualized to this listing (per 05 § Messaging Flow); Guests → Sign In first.
  4. Gallery keyboard/zoom behavior per Media Grid contract (doc 04).
  5. Review list sort: most recent (default), highest, lowest. Report review via Context Menu (all signed-in personas).
  6. Seller viewing own listing sees an *Edit listing* ghost button (→ Listing Editor) instead of Add to cart; Admin sees *Moderate* (→ Admin Listings Moderation detail drawer).
- **Responsive deltas:** Mobile — single column: gallery → buy box (not sticky; a bottom action bar pins *Add to cart* + price) → content → reviews. Tablet — two columns, buy box not sticky. Desktop — as wireframe. Wide — gallery grows, content max `size.container-xl`.
- **Copy pointers:** 10 § Listing (trust note, stock, shipping), 10 § Reviews.
- **Analytics:** `screen_viewed{screen:"listing_detail"}` · `add_to_cart` · `variant_selected` · `message_seller_started` · `review_reported`.

### 2.4 Checkout (Cart → Payment → Confirm)

Checkout is one Wizard Layout instance with four steps: **cart → details → payment → review/confirm** (05 § Checkout owns the pattern; this spec instantiates it). Canonical screen name per README: *Checkout (Cart → Payment → Confirm)*.

- **Route & access:** `/checkout` (steps `/checkout/cart · /checkout/details · /checkout/payment · /checkout/review`) · Buyer (Guest is redirected to Sign In with return URL, per 07 § Guest Purchase) · no extra permission.
- **Layout:** Wizard Layout (linear, numbered steps, persistent Checkout Summary rail). Top Navigation reduced to logo + secure badge (no nav-away temptations; escape = *Back to cart / marketplace* link).
- **Purpose & primary action:** Complete payment into escrow. Primary action per step: **Continue** (steps 1–3) / **Pay now** (step 4).
- **Wireframe (desktop, step 3 shown):**

```
┌──────────────────────────────────────────────────────────────┐
│ logo · Secure checkout 🔒            (1)Cart (2)Details      │
│                                      (3)Payment (4)Review    │
├───────────────────────────────────┬──────────────────────────┤
│ STEP 3 — Payment                  │ Checkout Summary (sticky)│
│  Payment method (Radio Group):    │  3 items · 2 sellers     │
│   (•) Saved card •••• 4242        │  Items subtotal          │
│   ( ) New card  [Card fields]     │  Shipping                │
│   ( ) Wallet balance $50.00 USD   │  Fees                    │
│  Billing address (Field Group)    │  ───────────────         │
│  Alert: "Payment is held in       │  Total $263.40 USD       │
│   escrow until you approve        │  Escrow note             │
│   delivery."                      │  [ Continue ]            │
│  [ Back ]            [ Continue ] │                          │
└───────────────────────────────────┴──────────────────────────┘
```

- **Wireframe (desktop, steps 1 and 4 compact):**

```
STEP 1 — Cart                          STEP 4 — Review & confirm
┌─────────────────────────┬────────┐   ┌─────────────────────────┬────────┐
│ Seller: Nordic Prints   │Summary │   │ Ship to: Dana R., …  ✎ │Summary │
│  [thumb] Poster A1      │(rail)  │   │ Payment: card 4242   ✎ │(full)  │
│   $40.00 USD  Qty [-2+] │        │   │ Order group 1 — Nordic │        │
│  [thumb] Frame          │        │   │  2 items · ships in 3d │Alert:  │
│   $25.00 USD  Qty [-1+] │        │   │ Order group 2 — Atelier│escrow  │
│ Seller: Atelier Sud     │        │   │  1 item · ships in 5d  │note    │
│  [thumb] Print B2 …     │        │   │ Payment Status preview │[Pay    │
│ [Continue] →            │        │   │  → will be: held       │ now]   │
└─────────────────────────┴────────┘   └─────────────────────────┴────────┘
```

- **Wireframe (mobile, structurally different — summary becomes a collapsed Accordion, primary action pins to a bottom bar):**

```
┌──────────────────────────┐
│ logo · Secure checkout 🔒│
│ ●●○○  Step 3 of 4        │
├──────────────────────────┤
│ Total $263.40 USD      ▾ │  ← Checkout Summary (Accordion)
├──────────────────────────┤
│ Payment method           │
│ (•) Saved card •••• 4242 │
│ ( ) New card             │
│ ( ) Wallet $50.00 USD    │
│ Billing address …        │
│ Alert: escrow note       │
├──────────────────────────┤
│ [       Continue       ] │  ← pinned bottom bar
└──────────────────────────┘
```

- **Regions & components (all steps):**

| Step | Components | Data |
|---|---|---|
| 1 Cart | Cart Summary, List (grouped by seller), Stepper (qty), Currency display, Empty State | cart lines, per-seller subtotals |
| 2 Details | Field Group (shipping address), Select (saved addresses), Input/Phone Input, Radio Group (shipping method per seller), Validation Message | addresses, shipping options + prices |
| 3 Payment | Radio Group (method), Currency Input–style card fields, Checkbox (save card), Alert (escrow), Validation Message | saved methods, wallet balance + currency |
| 4 Review | Checkout Summary (full), Description List (address, method), Payment Status, Confirmation copy | assembled order draft |
| Rail (all) | Checkout Summary | totals recomputed server-side each step |

- **Data requirements:**
  - Step entry: `GET /v1/cart` (step 1) · `GET /v1/me/addresses` + `GET /v1/cart/shipping-options` (step 2) · `GET /v1/me/payment-methods` + `GET /v1/wallet` (step 3).
  - Mutations: `PATCH /v1/cart/items/{id}` (qty) · `POST /v1/checkout/draft` (steps persist server-side, resumable) · **`POST /v1/orders` with `Idempotency-Key`** (step 4 → creates order(s), initiates payment; response carries `payment.status`).
  - Payment result: `pending`/`processing` → poll `GET /v1/payments/{id}` or await webhook-backed push; terminal `held` → confirmation; `failed` → step 3 with Inline Error.
- **States:** Loading — each step body skeletons its form groups; Checkout Summary skeletons 4 lines. Empty cart — Blank State Layout with Empty State "Your cart is empty" + *Browse listings* (10 § Checkout). Error — field errors inline (Validation Message); price/stock drift on step 4 renders Warning Banner "Prices changed — review before paying" and re-renders totals; payment `failed` → Alert with retry, method preserved. Permission-denied — n/a (auth redirect).
- **Interactions:**
  1. Wizard mechanics per 05 § Wizard: steps validate on Continue; completed steps are revisitable via stepper header; forward-jumping past an invalid step is blocked.
  2. Multi-seller carts produce one order per seller under one payment (doc 09 § Orders); step 4 lists each order group with its own Shipping Timeline estimate.
  3. *Pay now* disables + Loading Overlay on the rail until payment reaches a terminal status; double-submit prevented by Idempotency-Key.
  4. On `held`: Success Page state at `/checkout/confirmation` — Payment Status (`held`), Escrow Timeline at `payment_held`, order links, *Go to your orders*.
  5. Cart edits (remove line, qty) recompute totals server-side; removing the last item returns to empty state.
  6. Wallet method allowed only when balance ≥ total, else Radio option disabled with reason tooltip.
- **Responsive deltas:** Mobile — Checkout Summary collapses to a top Accordion ("Total $263.40 USD ▾"); steps full-width; primary action pinned in bottom bar. Tablet — rail below content on details/payment. Desktop/Wide — as wireframe; Wide caps at `size.container-lg` for form ergonomics.
- **Copy pointers:** 10 § Checkout (step titles, escrow note, drift warning, confirmation), 10 § Errors (payment).
- **Analytics:** `screen_viewed{screen:"checkout_cart|checkout_details|checkout_payment|checkout_review"}` · `checkout_started` · `checkout_step_completed{step}` · `payment_submitted` · `order_placed{orders,valueMinor,currency}` · `payment_failed{code}`.

### 2.5 Order Detail (with Escrow Timeline) — buyer view

- **Route & access:** `/account/orders/{id}` · Buyer (owner) · Admin may view read-only via Admin Orders. Non-owner Buyer/Seller → permission-denied.
- **Layout:** Sidebar Layout (buyer account sidebar) inside App Shell; Content Area main + right meta column.
- **Purpose & primary action:** Track the order through escrow and act at the decision point. Primary action is **stage-dependent**: `delivered` → **Approve delivery**; otherwise the screen has no primary (status is the content).
- **Wireframe (desktop):**

```
┌────────────┬─────────────────────────────────────────────────┐
│ Sidebar    │ Breadcrumb: Orders / #FLX-10422                 │
│ (buyer)    │ Order #FLX-10422   [Payment Status: held]       │
│            ├──────────────────────────────┬──────────────────┤
│            │ Escrow Timeline              │ Meta (Card):     │
│            │  ● payment_held  Jun 2       │  Seller Card     │
│            │  ● delivered     Jun 6       │  Total $263.40   │
│            │  ○ approved                  │   USD            │
│            │  ○ released                  │  Payment: card   │
│            │  Auto-approve in 6 days      │   •••• 4242      │
│            ├──────────────────────────────┤  Invoice Card    │
│            │ [ Approve delivery ] primary │  [Download]      │
│            │ [ Open a dispute ]  ghost    ├──────────────────┤
│            ├──────────────────────────────┤ Shipping Timeline│
│            │ Items (Order Card per line)  │  carrier, events │
│            │ Delivery address (Descr.List)│                  │
│            │ Activity Timeline            │                  │
└────────────┴──────────────────────────────┴──────────────────┘
```

- **Regions & components:**

| Region | Components | Data |
|---|---|---|
| Header | Breadcrumb, Payment Status, Badge | order number, payment status |
| Escrow | Escrow Timeline, Alert (auto-approve countdown) | stage events with timestamps |
| Actions | Button (Approve delivery), Button ghost (Open a dispute), Confirmation Dialog | allowed actions by stage |
| Items | Order Card, Currency display | lines, qty, price + currency |
| Meta | Seller Card, Invoice Card, Description List | seller, totals, payment method |
| Shipping | Shipping Timeline | carrier events |
| History | Activity Timeline | status changes, messages links |

- **Data requirements:**
  - First paint: `GET /v1/orders/{id}` (order, lines, payment summary, escrow stage) · `GET /v1/orders/{id}/escrow-events`.
  - Deferred: `GET /v1/orders/{id}/shipment` · `GET /v1/orders/{id}/activity?cursor=`.
  - Mutations: `POST /v1/orders/{id}/approve` · `POST /v1/disputes` `{orderId, …}` (opens dispute; navigates into dispute thread per 05 § Dispute Flow). Both send `Idempotency-Key`.
- **States:** Loading — header line + Escrow Timeline skeleton (5 nodes) + meta card skeleton. Error — Error Page on 404/403 variants; action failures → Toast + state refetch. Permission-denied — Error Page (403 copy, 10 § Errors). Empty — n/a (detail screen).
- **Interactions:**
  1. Action availability by escrow stage (05 § Escrow Flow instantiated): `payment_held` → no buyer actions (wait for delivery; *Open a dispute* appears only after the seller marks delivered or after the no-delivery window per policy); `delivered` → **Approve delivery** (primary) + *Open a dispute* (ghost); `approved`/`released` → no actions, *Leave a review* link appears if unreviewed; `disputed` → actions replaced by Alert linking to Dispute Detail thread.
  2. *Approve delivery* → Confirmation Dialog ("Funds will be released to the seller") → on success Escrow Timeline animates to `approved` then `released` when payment status flips `held → released` (may be async: show `approved` + Payment Status `processing` until webhook lands).
  3. Auto-approve countdown (policy-driven) renders in the Escrow Timeline as an Alert; copy 10 § Escrow.
  4. Dispute opening collects reason + description + File Upload evidence in Modal Layout, then routes to the dispute conversation.
  5. *Message seller* deep-links to the order-scoped conversation in Messages.
  6. Refund outcomes render Payment Status `refunded` or `partially_refunded` with amount + currency, and the Escrow Timeline shows the `disputed` branch resolution.
- **Responsive deltas:** Mobile — meta column stacks below actions; action buttons pin to bottom bar when `delivered`; Escrow Timeline compresses to vertical compact variant. Tablet — single column, meta as horizontal Card row. Desktop/Wide — as wireframe.
- **Copy pointers:** 10 § Escrow (stage labels, approve dialog, countdown), 10 § Orders.
- **Analytics:** `screen_viewed{screen:"order_detail_buyer"}` · `delivery_approved` · `dispute_opened{reason}` · `invoice_downloaded`.

### 2.6 Buyer Dashboard

- **Route & access:** `/account` · Buyer · no extra permission (Sellers with buyer activity also see it under their buyer context).
- **Layout:** Dashboard Layout inside App Shell (buyer Sidebar).
- **Purpose & primary action:** Orient the buyer: what needs attention now. Primary action: **open the top attention item** (usually an order awaiting approval).
- **Wireframe (desktop):**

```
┌────────────┬─────────────────────────────────────────────────┐
│ Sidebar    │ "Hi, Dana"                       [Search Bar]   │
│  Dashboard ├─────────────────────────────────────────────────┤
│  Orders    │ Needs attention (Alert list):                   │
│  Messages  │  ⚠ Order #FLX-10422 delivered — approve or      │
│  Reviews   │     dispute (6 days left)          [Review it]  │
│  Wallet    ├───────────────┬───────────────┬─────────────────┤
│  Settings  │ Metric Card   │ Metric Card   │ Metric Card     │
│            │ Active orders │ Held in escrow│ Unread messages │
│            │ 3             │ $263.40 USD   │ 5               │
│            ├───────────────┴───────────────┴─────────────────┤
│            │ Recent orders (Order Card list, 5)   [View all] │
│            ├─────────────────────────────────────────────────┤
│            │ Recent Activity  │  Quick Links (reviews due,   │
│            │ (feed)           │  saved filters, wallet)      │
└────────────┴─────────────────────────────────────────────────┘
```

- **Regions & components:**

| Region | Components | Data |
|---|---|---|
| Header | Search Bar, heading | user name |
| Attention | Alert, Button | orders in `delivered` awaiting approval, open disputes |
| Metrics | Metric Card ×3 | active orders, escrow-held total + currency, unread messages |
| Orders | Order Card, List | 5 latest orders with Payment Status |
| Feed | Recent Activity | order/message/review events |
| Shortcuts | Quick Links | pending reviews, wallet |

- **Data requirements:**
  - First paint: `GET /v1/me/dashboard` (aggregated: metrics, attention items, recent orders — one call, doc 09 § Dashboards).
  - Deferred: `GET /v1/me/activity?cursor=&limit=10`.
- **States:** Loading — 3 Metric Card skeletons, 5 Order Card row skeletons, feed 4 rows. Empty (new buyer) — metrics show zeros; orders region renders Empty State "No orders yet" + *Explore the marketplace* (10 § Dashboard); attention region hidden when empty. Error — per-region Inline Error with retry; shell never blanks. Permission-denied — n/a.
- **Interactions:**
  1. Attention Alerts deep-link to Order Detail (buyer view) with the action row focused.
  2. Metric Cards navigate: Orders List (filtered active), Wallet & Payment Methods, Messages.
  3. Recent Activity rows deep-link per event type.
  4. Dashboard is read-mostly: no bulk actions, no inline editing.
- **Responsive deltas:** Mobile — Bottom Navigation (Mobile) replaces Sidebar (Dashboard/Orders/Messages/Account); metrics 1-col stack; attention list first. Tablet — metrics 3-up, feed below orders. Desktop/Wide — as wireframe; Wide allows 4th Metric Card (reviews pending).
- **Copy pointers:** 10 § Dashboard (greeting, attention phrasing, empty states).
- **Analytics:** `screen_viewed{screen:"buyer_dashboard"}` · `attention_item_clicked{type}` · `metric_card_clicked{metric}`.

### 2.7 Messages (conversation list + chat pane)

Canonical screen for Buyer and Seller (see § 3.27 for the Seller scope delta).

- **Route & access:** `/messages` and `/messages/{conversationId}` · Buyer, Seller (own conversations) · Admin reads transcripts only inside Dispute Detail, not here.
- **Layout:** Split View inside App Shell (list pane 360px / chat pane flexible).
- **Purpose & primary action:** Continue a conversation. Primary action: **send message** (Chat composer).
- **Wireframe (desktop):**

```
┌────────────┬───────────────────┬─────────────────────────────┐
│ Sidebar    │ Conversation List │ Chat: header — Avatar,      │
│            │ [Search Bar]      │  name, listing/order Chip,  │
│            │ Tabs: All|Unread| │  [View order] link          │
│            │      Archived    ├─────────────────────────────┤
│            │ ┌───────────────┐ │  ┌─ their message ────┐     │
│            │ │● Ana — "Is it…"│ │  └────────────────────┘     │
│            │ │  2m · order    │ │       ┌─ my message ──┐     │
│            │ ├───────────────┤ │       └── ✓ read ──────┘     │
│            │ │ Ben — "Thanks!"│ │  — Jun 6 —                  │
│            │ │  1d            │ │  [attachment Card]          │
│            │ └───────────────┘ ├─────────────────────────────┤
│            │                   │ [Textarea] [attach] [Send]  │
└────────────┴───────────────────┴─────────────────────────────┘
```

- **Wireframe (mobile, structurally different — Split View becomes two stacked screens with push navigation):**

```
  /messages                      /messages/{id}
┌──────────────────────┐      ┌──────────────────────┐
│ Messages    [Search] │      │ ← Ana · order Chip   │
│ Tabs: All|Unread|Arch│      ├──────────────────────┤
├──────────────────────┤      │ ┌─ their message ─┐  │
│ ● Ana  "Is it…"   2m │ tap  │ └─────────────────┘  │
│   order #FLX-10422   │ ───► │      ┌─ mine ✓ ──┐   │
│ Ben  "Thanks!"    1d │      │      └───────────┘   │
│ …                    │      ├──────────────────────┤
│ [Bottom Navigation]  │      │ [Textarea]  [Send]   │
└──────────────────────┘      └──────────────────────┘
```

- **Regions & components:**

| Region | Components | Data |
|---|---|---|
| List pane | Conversation List, Search Bar, Tabs, Badge (unread), Avatar | conversations: peer, snippet, time, unread count, context Chip |
| Chat header | Avatar, Chip (listing/order context), Context Menu (archive, report) | peer + linked resource |
| Thread | Chat (message bubbles, day separators, read receipts), Card (attachments) | messages, attachments |
| Composer | Textarea (auto-grow), File Upload, Button | draft |

- **Data requirements:**
  - First paint: `GET /v1/conversations?filter=all&cursor=&limit=30`; if routed with id, `GET /v1/conversations/{id}/messages?cursor=&limit=50` in parallel.
  - Live: real-time channel per doc 09 § Realtime (fallback: poll 15s). Read receipts: `POST /v1/conversations/{id}/read`.
  - Mutations: `POST /v1/conversations/{id}/messages` (optimistic append) · attachments via `POST /v1/uploads` then message reference.
- **States:** Loading — list pane 8 row skeletons; chat pane skeleton bubbles (3) when deep-linked. Empty — no conversations: Empty State "No messages yet" (buyer copy: start from a listing — 10 § Messages); no selection on desktop: Blank State Layout in chat pane ("Select a conversation"). Filtered-empty (Unread/Archived/search): "Nothing here". Error — send failure marks bubble failed with *Retry/Discard*; list failure Inline Error + retry. Permission-denied — foreign conversation id → 403 Error Page.
- **Interactions:**
  1. Messaging mechanics per 05 § Messaging Flow (optimistic send, retry, receipts, day grouping); this screen adds order/listing context Chips that deep-link to Listing Detail / Order Detail.
  2. List filters: Tabs All | Unread | Archived; Search Bar matches peer name and listing title.
  3. Selecting a conversation marks it read (badge clears optimistically).
  4. Composer: Enter sends, Shift+Enter newline (doc 03 § Productivity); attachments image/pdf, max per doc 09 limits; blocked-content rules per doc 10 § Messages (no off-platform payment solicitation warning).
  5. Report conversation (Context Menu) → Modal Layout report form → flags for Admin review.
  6. Unread total syncs to App Shell badge and Buyer/Seller Dashboards.
- **Responsive deltas:** Mobile — panes become two screens: list at `/messages`, chat pushes full-screen with back button; composer pins above keyboard. Tablet — Split View kept, list 300px. Desktop/Wide — as wireframe; Wide chat max-width `size.container-md` centered bubbles.
- **Copy pointers:** 10 § Messages (empty states, safety notices, failed-send).
- **Analytics:** `screen_viewed{screen:"messages"}` · `conversation_opened{context}` · `message_sent{hasAttachment}` · `conversation_archived` · `conversation_reported`.

### 2.8 Seller Dashboard

- **Route & access:** `/seller` · Seller (onboarding complete; else redirect to Seller Onboarding Wizard) · permission `seller.access`.
- **Layout:** Dashboard Layout inside App Shell (seller Sidebar).
- **Purpose & primary action:** Show the seller what earns and what blocks money. Primary action: **fulfil the next order** (top attention item).
- **Wireframe (desktop):**

```
┌────────────┬─────────────────────────────────────────────────┐
│ Sidebar    │ "Store: Nordic Prints"        [+ New listing]   │
│  Dashboard ├─────────────────────────────────────────────────┤
│  Listings  │ Needs attention:                                │
│  Orders    │  ⚠ 2 orders awaiting shipment      [Fulfil]     │
│  Earnings  │  ⚠ 1 dispute needs your response   [Respond]    │
│  Reviews   ├──────────┬──────────┬──────────┬────────────────┤
│  Analytics │ Metric   │ Metric   │ Metric   │ Metric Card    │
│  Messages  │ Sales 30d│ Held     │ Available│ Store rating   │
│  Settings  │ $4,210.00│ $980.00  │ $1,540.00│ 4.8 ★ (312)    │
│            │  USD     │  USD     │  USD     │                │
│            ├──────────┴──────────┴──────────┴────────────────┤
│            │ Charts Container: sales trend (30d)             │
│            ├───────────────────────────┬─────────────────────┤
│            │ Recent orders (Order Card)│ Recent Activity     │
│            │ status per row [View all] │ (reviews, messages) │
└────────────┴───────────────────────────┴─────────────────────┘
```

- **Regions & components:**

| Region | Components | Data |
|---|---|---|
| Header | Button (+ New listing), heading | store name |
| Attention | Alert, Button | orders in `payment_held` awaiting fulfilment, disputes awaiting seller response |
| Metrics | Metric Card ×4 | 30d sales, escrow held, available balance (all + currency), Rating |
| Trend | Charts Container | daily sales series |
| Orders | Order Card, Badge (escrow stage) | 5 latest |
| Feed | Recent Activity | reviews, messages, payouts |

- **Data requirements:**
  - First paint: `GET /v1/seller/dashboard` (metrics, attention, recent orders).
  - Deferred: `GET /v1/seller/analytics/sales?range=30d` (chart) · `GET /v1/seller/activity?cursor=`.
- **States:** Loading — 4 Metric Card skeletons, chart block skeleton, 5 order rows. Empty (new seller) — attention hidden; chart region shows Empty State "Sales will appear here once you get your first order"; orders Empty State + *Create your first listing* (primary shifts to + New listing). Error — per-region Inline Error; metrics degrade independently. Permission-denied — non-seller hits Error Page 403 with *Become a seller* CTA (→ onboarding).
- **Interactions:**
  1. Attention items deep-link: fulfilment → Seller Order Detail; dispute → the dispute thread (seller view of Dispute Detail evidence form).
  2. *+ New listing* → Listing Editor (create wizard).
  3. Metric Cards navigate: Orders List (seller, filtered), Earnings & Payouts (held/available), Reviews (seller respond).
  4. Chart range Select: 7d / 30d / 90d — refetches series only.
- **Responsive deltas:** Mobile — Bottom Navigation (Mobile): Dashboard/Orders/Listings/Messages; metrics 2×2 grid; chart full-width simplified (sparkline mode per Charts Container contract). Tablet — metrics 2×2, chart full-width. Desktop/Wide — as wireframe; Wide adds conversion Metric Card (5th) if analytics enabled.
- **Copy pointers:** 10 § Dashboard (seller variants), 10 § Escrow (held/available definitions shown as tooltips).
- **Analytics:** `screen_viewed{screen:"seller_dashboard"}` · `attention_item_clicked{type}` · `new_listing_clicked` · `chart_range_changed{range}`.

### 2.9 Listing Editor (create wizard / edit)

- **Route & access:** `/seller/listings/new` (wizard) · `/seller/listings/{id}/edit` (tabbed edit of the same sections) · Seller (owner) · permission `listings.write`. Admin edits go through moderation tooling, not here.
- **Layout:** Wizard Layout (create) / Settings Layout with the same section list (edit). Steps: **basics → details/media → pricing → shipping → review**.
- **Purpose & primary action:** Publish a sellable listing. Primary action: **Continue** per step; **Publish listing** on review step (or **Save changes** in edit mode).
- **Wireframe (desktop, step 2 shown):**

```
┌──────────────────────────────────────────────────────────────┐
│ ← Back to listings      New listing            [Save draft]  │
│ (1)Basics (2)Details & media (3)Pricing (4)Shipping (5)Review│
├───────────────────────────────────┬──────────────────────────┤
│ STEP 2 — Details & media          │ Live preview (Card):     │
│  Description (Rich Text Editor)   │  Listing Card as it will │
│  Attributes (Field Group from     │  appear in search        │
│   category schema: Select/Input)  │                          │
│  Photos (Image Gallery Upload,    │ Checklist (Progress      │
│   drag to reorder, cover star)    │  Summary): title ✓,      │
│  Video URL (URL Input, optional)  │  photos 3/1 min ✓,       │
│                                   │  price ✗ …               │
│  [ Back ]             [ Continue ]│                          │
└───────────────────────────────────┴──────────────────────────┘
```

- **Regions & components (per step):**

| Step | Components | Data |
|---|---|---|
| 1 Basics | Input (title), Select/Tree (category), Tag Input (tags), Radio Group (condition) | category tree |
| 2 Details & media | Rich Text Editor, Field Group (category attributes), Image Gallery Upload, URL Input | attribute schema per category |
| 3 Pricing | Currency Input (price, compare-at), Number Input (stock), Field Group (variants: option name + values, matrix Table) | currencies allowed |
| 4 Shipping | Radio Group (shipping profile), Currency Input (flat rate), Select (handling time), Checkbox (regions) | seller shipping profiles |
| 5 Review | Description List (all sections + edit links), Listing Card (final preview), Alert (moderation notice) | assembled draft |
| Rail (all) | Card (live preview), Progress Summary (publish checklist) | draft state |

- **Data requirements:**
  - Entry: `GET /v1/categories?tree=1` · edit mode: `GET /v1/listings/{id}`.
  - On category pick: `GET /v1/categories/{id}/attributes` (drives step 2 Field Group).
  - Autosave: `PATCH /v1/seller/listings/{id}` (draft created lazily on first change via `POST /v1/seller/listings`), debounced; per 05 § Wizard autosave rule.
  - Media: `POST /v1/uploads` per file (progress per File Upload contract).
  - Publish: `POST /v1/seller/listings/{id}/publish` → returns `status: active | pending_review` (moderation-gated categories).
- **States:** Loading — edit mode skeletons the active section form; create mode renders instantly. Error — Validation Message per field on Continue; publish failure → Alert atop review step listing blocking fields with jump links. Upload errors per-file (retry/remove). Draft conflict (edited elsewhere) → Warning Banner with *Reload draft*. Permission-denied — non-owner → 403 Error Page. Empty — n/a.
- **Interactions:**
  1. Wizard per 05 § Wizard: linear on create; every step revisitable once visited; *Save draft* always available (header, ghost).
  2. Live preview rail re-renders the Listing Card on every field commit (blur/debounce, not per keystroke).
  3. Publish checklist (Progress Summary) tracks hard requirements: title, category, ≥1 photo, price, stock, shipping. Publish disabled until all pass — each unmet item is a jump link.
  4. Variant matrix: adding options regenerates the price/stock Table preserving entered cells; per-variant price overrides base price.
  5. Category change after attributes were filled → Confirmation Dialog warning attribute data loss.
  6. Edit mode of an `active` listing publishes changes immediately on Save; price/shipping edits show Alert "Existing orders are unaffected". Moderation-sensitive edits may return `pending_review` (Alert explains, copy 10 § Listings).
- **Responsive deltas:** Mobile — preview rail hidden behind a *Preview* Tab; checklist becomes collapsed Accordion above the primary button; wizard steps as top Progress dots. Tablet — rail below the form. Desktop/Wide — as wireframe.
- **Copy pointers:** 10 § Listings (step titles, checklist, moderation notices), 10 § Validation.
- **Analytics:** `screen_viewed{screen:"listing_editor"}` · `listing_draft_created` · `listing_step_completed{step}` · `listing_media_uploaded{count}` · `listing_published{status}` · `listing_updated`.

### 2.10 Order Detail (fulfil) — seller view

- **Route & access:** `/seller/orders/{id}` · Seller (owner store) · permission `orders.fulfil`. Others → 403.
- **Layout:** Sidebar Layout (seller) inside App Shell; Content Area main + right meta column.
- **Purpose & primary action:** Move the order forward: **accept → deliver → track approval**. Primary action is stage-dependent: `payment_held` (new) → **Accept order**; accepted → **Mark as delivered** (with tracking); `delivered` → none (watch approval); `disputed` → **Respond to dispute**.
- **Wireframe (desktop):**

```
┌────────────┬─────────────────────────────────────────────────┐
│ Sidebar    │ Breadcrumb: Orders / #FLX-10422                 │
│ (seller)   │ #FLX-10422  [Payment Status: held]              │
│            │ [Badge: escrow stage payment_held]              │
│            ├──────────────────────────────┬──────────────────┤
│            │ Escrow Timeline              │ Buyer Card       │
│            │  ● payment_held  Jun 2       │  (name, history) │
│            │  ○ delivered                 │ [Message buyer]  │
│            │  ○ approved   ○ released     ├──────────────────┤
│            ├──────────────────────────────┤ Payout preview   │
│            │ Fulfilment (Card):           │  Item total      │
│            │  [ Accept order ] primary    │  − Platform fee  │
│            │  [ Decline… ] ghost/danger   │  = Net $233.10   │
│            │  — after accept —            │    USD (on       │
│            │  Tracking no. [Input]        │    release)      │
│            │  Carrier [Select]            ├──────────────────┤
│            │  [ Mark as delivered ]       │ Shipping address │
│            ├──────────────────────────────┤ (Description     │
│            │ Items (Order Card lines)     │  List) [Print]   │
│            │ Activity Timeline            │                  │
└────────────┴──────────────────────────────┴──────────────────┘
```

- **Regions & components:**

| Region | Components | Data |
|---|---|---|
| Header | Breadcrumb, Payment Status, Badge (stage) | order number, statuses |
| Escrow | Escrow Timeline | stage events |
| Fulfilment | Card, Button, Input, Select, Confirmation Dialog | acceptance window, tracking fields |
| Items | Order Card | lines with variant, qty |
| Buyer | Buyer Card, Button ghost | buyer name, order count |
| Payout | Description List, Currency display | gross, fee, net + currency |
| Address | Description List, Button ghost (print) | shipping address |
| History | Activity Timeline | events |

- **Data requirements:**
  - First paint: `GET /v1/seller/orders/{id}` (includes escrow stage, payout preview) · `GET /v1/orders/{id}/escrow-events`.
  - Deferred: `GET /v1/orders/{id}/activity?cursor=`.
  - Mutations (all with `Idempotency-Key`): `POST /v1/seller/orders/{id}/accept` · `POST /v1/seller/orders/{id}/decline {reason}` (→ payment `refunded`) · `POST /v1/seller/orders/{id}/deliver {carrier, trackingNumber}`.
- **States:** Loading — mirror of buyer Order Detail skeleton plan. Error — action failure Toast + refetch; stale-stage conflict (409) → Warning Banner "Order changed — refreshed" and state reload. Permission-denied — 403 Error Page. Empty — n/a.
- **Interactions:**
  1. `payment_held`, unaccepted: **Accept order** (primary) starts fulfilment SLA; *Decline…* opens Confirmation Dialog with reason Select — declining refunds the buyer (payment → `refunded`) and cannot be undone.
  2. Accepted: tracking Field Group appears; **Mark as delivered** requires carrier + tracking number (Validation Message otherwise); on success escrow stage → `delivered`, buyer approval window starts, and the payout preview shows expected release date.
  3. `delivered`: read-only watch state — Escrow Timeline shows auto-approve countdown; the only affordance is *Message buyer*.
  4. `approved`/`released`: Success Alert "Funds released" links to Earnings & Payouts; payment status `released`.
  5. `disputed`: fulfilment card replaced by danger Alert + **Respond to dispute** primary → seller evidence view of the dispute (07 § Dispute Flow).
  6. Escrow stage semantics and transition rules per 05 § Escrow Flow — this screen only exposes seller-side transitions (`accept`, `deliver`).
- **Responsive deltas:** Mobile — meta column stacks; current-stage action pins to bottom bar; print address hidden. Tablet — single column. Desktop/Wide — as wireframe.
- **Copy pointers:** 10 § Escrow (seller stage copy, decline dialog), 10 § Orders.
- **Analytics:** `screen_viewed{screen:"order_detail_seller"}` · `order_accepted` · `order_declined{reason}` · `order_delivered` · `dispute_response_started`.

### 2.11 Earnings & Payouts

- **Route & access:** `/seller/earnings` · Seller · permission `payouts.read` (payout method changes require `payouts.manage`, default granted to the store owner only).
- **Layout:** Sidebar Layout (seller) inside App Shell; Content Area with Tabs.
- **Purpose & primary action:** Understand money position and get paid. Primary action: **Withdraw available balance** (when above minimum and a payout method exists).
- **Wireframe (desktop):**

```
┌────────────┬─────────────────────────────────────────────────┐
│ Sidebar    │ Earnings & Payouts                              │
│            ├──────────────┬──────────────┬───────────────────┤
│            │ Statistic    │ Statistic    │ Statistic Block   │
│            │ Available    │ Held in      │ Paid out (total)  │
│            │ $1,540.00 USD│ escrow       │ $18,320.00 USD    │
│            │ [ Withdraw ] │ $980.00 USD  │                   │
│            ├──────────────┴──────────────┴───────────────────┤
│            │ Tabs: Transactions | Payouts | Method           │
│            ├─────────────────────────────────────────────────┤
│            │ Transactions (Table):                           │
│            │  Date · Order · Type (sale/fee/refund/payout)   │
│            │  · Amount ±$ USD · Payment Status Badge         │
│            │  Advanced Filters: date range, type, status     │
│            │  Pagination                                     │
└────────────┴─────────────────────────────────────────────────┘
```

- **Regions & components:**

| Region | Components | Data |
|---|---|---|
| Balances | Statistic Block ×3, Button (Withdraw) | available, held, lifetime paid (all + currency) |
| Tabs | Tabs | — |
| Transactions | Table, Advanced Filters, Badge (Payment Status), Pagination | ledger entries |
| Payouts | Table, Payment Status, Invoice Card (statement download) | payout batches with status `pending | processing | released | failed` |
| Method | Field Group, Description List, Confirmation Dialog | payout account (masked) |

- **Data requirements:**
  - First paint: `GET /v1/seller/balance` · `GET /v1/seller/transactions?type=&status=&from=&to=&cursor=&limit=25` (active tab).
  - Tab switch: `GET /v1/seller/payouts?cursor=` · `GET /v1/seller/payout-method`.
  - Mutations: `POST /v1/seller/payouts {amountMinor, currency}` with `Idempotency-Key` · `PUT /v1/seller/payout-method`.
- **States:** Loading — 3 Statistic Block skeletons + 8 Table row skeletons. Empty — transactions: "No transactions yet — they appear with your first sale"; payouts: "No payouts yet"; both 10 § Earnings. Filtered-empty distinct copy. Error — table Inline Error + retry; withdraw failure → Alert with machine code mapped copy (`payout_method_missing`, `below_minimum`). Permission-denied — staff without `payouts.read` sees 403 region within the shell.
- **Interactions:**
  1. **Withdraw** opens Modal Layout: amount (Currency Input, prefilled max), payout method summary, fee note → Confirmation Dialog → creates payout with status `pending`; balances update optimistically and reconcile on webhook.
  2. Held-in-escrow Statistic Block tooltip explains release rules (copy 10 § Escrow); clicking filters Transactions to escrow-held sales.
  3. Transactions filters per 05 § Filtering with fields: **date range (Date Range Picker), type (Select: sale/fee/refund/payout), status (Select of payment statuses)**. Export CSV via Data Management Toolbar (deferred generation, Toast when ready).
  4. Refund rows show negative amounts with `refunded`/`partially_refunded` Badge and link to the order.
  5. Method tab: replacing a payout account requires re-auth (per 05 § Authentication step-up) and Confirmation Dialog; changes are audit-logged.
- **Responsive deltas:** Mobile — Statistic Blocks stack; Table collapses to List of Card rows (date, type, amount); filters in sheet. Tablet — 3 blocks in a row, table horizontal-scrolls. Desktop/Wide — as wireframe.
- **Copy pointers:** 10 § Earnings, 10 § Escrow (held explainer), 10 § Errors (payout codes).
- **Analytics:** `screen_viewed{screen:"earnings_payouts"}` · `withdraw_submitted{amountMinor,currency}` · `payout_created` · `transactions_exported` · `payout_method_updated`.

### 2.12 Disputes Queue (admin)

- **Route & access:** `/admin/disputes` · Admin · permission `disputes.read` (assignment requires `disputes.assign`; resolution actions live in Dispute Detail and require `disputes.resolve`).
- **Layout:** Sidebar Layout (admin) inside App Shell; full-width Content Area.
- **Purpose & primary action:** Triage disputes by urgency. Primary action: **open a dispute** (row click → Dispute Detail).
- **Wireframe (desktop):**

```
┌────────────┬─────────────────────────────────────────────────┐
│ Admin      │ Disputes Queue                                  │
│ Sidebar    │ Metric Card: Open 24 · Awaiting seller 9 ·      │
│            │  Overdue SLA 3 · Resolved 7d 41                 │
│            ├─────────────────────────────────────────────────┤
│            │ Data Management Toolbar: [Search Bar]           │
│            │  Advanced Filters: status, reason, age,         │
│            │  assignee, amount range | Saved Filters         │
│            ├─────────────────────────────────────────────────┤
│            │ Table (sortable):                               │
│            │ ▢ | ID | Order | Buyer | Seller | Reason |      │
│            │   Amount $ USD | Age/SLA ⏱ | Status Badge |     │
│            │   Assignee Avatar                               │
│            │ ▢ selected → Bulk Actions Bar: [Assign to…]     │
│            │ Pagination                                      │
└────────────┴─────────────────────────────────────────────────┘
```

- **Regions & components:**

| Region | Components | Data |
|---|---|---|
| KPIs | Metric Card ×4 | open, awaiting-seller, SLA-overdue, resolved-7d counts |
| Toolbar | Data Management Toolbar, Search Bar, Advanced Filters, Saved Filters | filter state |
| Queue | Table, Badge (dispute status), Avatar (assignee), Bulk Actions Bar, Pagination | dispute rows |

- **Data requirements:**
  - First paint: `GET /v1/admin/disputes?status=open&sort=slaAsc&cursor=&limit=25` · `GET /v1/admin/disputes/metrics`.
  - Mutations: `POST /v1/admin/disputes/bulk-assign {ids, assigneeId}` (requires `disputes.assign`).
- **States:** Loading — 4 Metric Card skeletons + 10 row skeletons. Empty — "No open disputes 🎉" (10 § Admin); filtered-empty "No disputes match your filters" + clear. Error — Table Inline Error + retry. Permission-denied — 403 Error Page; Admins lacking `disputes.assign` see no checkboxes/Bulk Actions Bar.
- **Interactions:**
  1. Default sort: SLA time remaining ascending (most urgent first); overdue rows carry a danger Badge.
  2. Filtering per 05 § Filtering with fields: **status (open / seller_responded / under_review / resolved), reason (Select), age (Select buckets), assignee (Autocomplete), amount range (Currency Input pair)**.
  3. Dispute statuses here are workflow statuses; the underlying order stays escrow stage `disputed` until resolution (05 § Dispute Flow).
  4. Row click → Dispute Detail. Middle-click/cmd-click opens new tab (real links, doc 03 § Productivity).
  5. Bulk assign per 05 § Bulk Actions: select → Bulk Actions Bar → assignee Autocomplete → Toast with undo (within 10s).
  6. Search matches dispute id, order number, buyer/seller name.
- **Responsive deltas:** Mobile — admin screens are desktop-first: table collapses to Card list (id, reason, SLA, status), bulk actions unavailable; KPIs horizontal scroll. Tablet — table with sticky first column. Desktop/Wide — as wireframe; Wide shows an inline preview Right Drawer on row hover-intent (optional per Data Grid contract).
- **Copy pointers:** 10 § Admin (queue empty, SLA labels), 10 § Disputes.
- **Analytics:** `screen_viewed{screen:"admin_disputes_queue"}` · `dispute_opened_from_queue` · `disputes_bulk_assigned{count}` · `queue_filter_applied{field}`.

### 2.13 Dispute Detail (admin)

- **Route & access:** `/admin/disputes/{id}` · Admin · permission `disputes.read` to view; **resolution actions (refund / release / partial) render only for Admins with `disputes.resolve`**.
- **Layout:** Sidebar Layout (admin); Content Area three-zone: case header, evidence Split View, resolution rail.
- **Purpose & primary action:** Decide the case. Primary action: **Resolve dispute** (opens resolution Modal Layout).
- **Wireframe (desktop):**

```
┌────────────┬─────────────────────────────────────────────────┐
│ Admin      │ Breadcrumb: Disputes / DSP-311                  │
│ Sidebar    │ DSP-311 · Order #FLX-10422 · $263.40 USD        │
│            │ [Badge: under_review] [SLA: 14h left]           │
│            │ Escrow Timeline: … ● disputed                   │
│            ├───────────────────────┬─────────────────────────┤
│            │ BUYER'S CASE          │ SELLER'S CASE           │
│            │ reason: not_as_descr. │ response: item as shown │
│            │ statement (text)      │ statement (text)        │
│            │ Evidence: [Media Grid]│ Evidence: [Media Grid]  │
│            │ photos, files         │ tracking: TRK123 ✓ dlvd │
│            ├───────────────────────┴─────────────────────────┤
│            │ Conversation transcript (Chat, read-only)       │
│            │ Comment Thread (internal admin notes 🔒)        │
│            ├─────────────────────────────────────────────────┤
│            │ Resolution (Card, requires disputes.resolve):   │
│            │ [ Refund buyer ] [ Release to seller ]          │
│            │ [ Partial refund… ]        [ Request more info ]│
│            ├─────────────────────────────────────────────────┤
│            │ Audit Timeline: opened → assigned → evidence →  │
│            │  every admin action, actor + timestamp          │
└────────────┴─────────────────────────────────────────────────┘
```

- **Regions & components:**

| Region | Components | Data |
|---|---|---|
| Case header | Breadcrumb, Badge (status), Alert (SLA), Escrow Timeline, Currency display | dispute meta, disputed amount + currency |
| Evidence | Split View, Media Grid, Description List, Shipping Timeline (seller tracking proof) | both parties' statements, files, tracking |
| Transcript | Chat (read-only) | buyer–seller conversation |
| Internal notes | Comment Thread | admin-only notes |
| Resolution | Card, Button ×2 + danger, Modal Layout, Currency Input (partial), Confirmation Dialog | allowed outcomes |
| Audit | Audit Timeline | full case history |

- **Data requirements:**
  - First paint: `GET /v1/admin/disputes/{id}` (case, parties, evidence manifests, order + escrow snapshot).
  - Deferred: `GET /v1/conversations/{id}/messages?scope=dispute` (transcript) · `GET /v1/admin/disputes/{id}/notes` · `GET /v1/admin/disputes/{id}/audit`.
  - Mutations (all `Idempotency-Key`, all require `disputes.resolve` except notes/info-request): `POST /v1/admin/disputes/{id}/resolve {outcome: refund | release | partial, amountMinor?, currency?, note}` · `POST /v1/admin/disputes/{id}/request-info {party}` · `POST /v1/admin/disputes/{id}/notes`.
- **States:** Loading — header + two evidence pane skeletons + timeline skeleton. Error — resolve failure → Alert with code (`already_resolved` → refresh case). Empty — a party with no evidence shows Empty State "No evidence submitted" in its pane. Permission-denied — no `disputes.read` → 403; with read but without `disputes.resolve`, resolution Card renders a read-only notice "You don't have permission to resolve disputes".
- **Interactions:**
  1. Resolution per 05 § Dispute Flow, instantiated: **Refund buyer** → payment `refunded`, escrow ends from `disputed`; **Release to seller** → payment `released`; **Partial refund…** → Modal Layout with Currency Input (validated 0 < x < total) + split preview (buyer gets / seller gets) → payment `partially_refunded`. Every outcome requires a mandatory note and a typed-confirmation Confirmation Dialog ("resolve") for amounts over the policy threshold.
  2. Outcomes are terminal: after resolution the resolution Card collapses into a Description List of the decision, and the Escrow Timeline + Payment Status update.
  3. *Request more info* pauses SLA, sets status back to `open` (info requested from the seller) or `seller_responded` (info requested from the buyer), and posts a templated message into the conversation (copy 10 § Disputes).
  4. Internal notes are never visible to buyer/seller; UI marks the region with a lock Badge.
  5. Every action (view is exempt) writes to the Audit Timeline; entries link actor → User Detail.
  6. Keyboard: `R` focus resolution card, `[`/`]` switch evidence panes (Command Palette exposes the same actions).
- **Responsive deltas:** Mobile/Tablet — evidence panes become Tabs (Buyer / Seller); resolution card sticks to bottom. Desktop/Wide — as wireframe; Wide keeps transcript and notes side-by-side.
- **Copy pointers:** 10 § Disputes (outcome dialogs, info-request templates), 10 § Admin.
- **Analytics:** `screen_viewed{screen:"admin_dispute_detail"}` · `dispute_resolved{outcome,amountMinor,currency}` · `dispute_info_requested{party}` · `dispute_note_added`.

### 2.14 Listings Moderation (admin)

- **Route & access:** `/admin/listings` · Admin · permission `listings.moderate` for actions; `listings.read` to view.
- **Layout:** Sidebar Layout (admin); Content Area table + Right Drawer for review.
- **Purpose & primary action:** Keep the catalog clean. Primary action: **review the next pending listing** (open drawer).
- **Wireframe (desktop):**

```
┌────────────┬─────────────────────────────────────────────────┐
│ Admin      │ Listings Moderation                             │
│ Sidebar    │ Tabs: Pending (12) | Reported (4) | All         │
│            │ Data Management Toolbar: [Search Bar]           │
│            │  Advanced Filters: category, seller, flag       │
│            │  reason, date | Saved Filters                   │
│            ├──────────────────────────────┬──────────────────┤
│            │ Table:                       │ Right Drawer     │
│            │ ▢ | Thumb | Title | Seller | │ (on row click):  │
│            │ Category | Flags Badge |     │  Gallery, full   │
│            │ Submitted ⏱ | Status         │  fields, policy  │
│            │                              │  checklist,      │
│            │ Bulk Actions Bar (approve/   │  report reasons, │
│            │  reject) when selected       │  [Approve]       │
│            │ Pagination                   │  [Reject…]       │
│            │                              │  [Request        │
│            │                              │   changes…]      │
└────────────┴──────────────────────────────┴──────────────────┘
```

- **Regions & components:**

| Region | Components | Data |
|---|---|---|
| Tabs | Tabs, Badge (counts) | pending / reported / all |
| Toolbar | Data Management Toolbar, Search Bar, Advanced Filters, Saved Filters | filter state |
| Queue | Table, Badge (flags/status), Bulk Actions Bar, Pagination | listing rows |
| Review | Right Drawer, Gallery, Description List, Checkbox list (policy checklist), Alert (reports), Button (Approve / Reject… / Request changes…) | full listing snapshot + reports |

- **Data requirements:**
  - First paint: `GET /v1/admin/listings?status=pending_review&cursor=&limit=25` + tab counts `GET /v1/admin/listings/metrics`.
  - Drawer: `GET /v1/admin/listings/{id}` (full snapshot + reports + seller history).
  - Mutations: `POST /v1/admin/listings/{id}/approve` · `POST /v1/admin/listings/{id}/reject {reasonCode, note}` · `POST /v1/admin/listings/{id}/request-changes {reasonCode, note}` · bulk actions are repeated per-id calls (no bulk endpoint in v1, 09 § Admin).
- **States:** Loading — 10 row skeletons; drawer skeleton (gallery block + 6 lines). Empty — Pending: "Moderation queue is clear 🎉"; Reported: "No reported listings"; filtered-empty variant. Error — action failure Toast + row refetch; conflict (already moderated) → row updates with info Toast. Permission-denied — read-only Admins see the queue without action buttons or checkboxes.
- **Interactions:**
  1. Approval flow per 05 § Approval Flow instantiated for listings: Approve (immediate, listing → `active`), **Reject…** requires reason Select (`prohibited_item`, `misleading`, `ip_violation`, `quality`, `other`) + note → seller notified (copy 10 § Moderation); **Request changes…** returns listing to seller draft with note.
  2. Drawer supports queue-walk: `J`/`K` or drawer arrows move next/previous without closing (doc 03 § Productivity).
  3. Bulk approve/reject per 05 § Bulk Actions — reject in bulk requires one shared reason; mixed-state selections disable incompatible actions.
  4. Reported tab rows show report count Badge + reasons in drawer; resolving a report (dismiss/act) is logged.
  5. Every moderation action writes to the Audit Log with before/after status.
  6. Seller identity links to User Detail; repeat-offender Alert appears when seller has ≥3 rejections in 90 days.
- **Responsive deltas:** Mobile — queue as Card list; drawer becomes full-screen Modal Layout; bulk unavailable. Tablet — drawer overlays table. Desktop/Wide — as wireframe; Wide pins drawer as persistent right pane (Split View behavior).
- **Copy pointers:** 10 § Moderation (reject reasons, seller notifications), 10 § Admin.
- **Analytics:** `screen_viewed{screen:"admin_listings_moderation"}` · `listing_approved` · `listing_rejected{reasonCode}` · `listing_changes_requested` · `listings_bulk_moderated{action,count}`.

---

## 3. Condensed screen specifications

Format: Route & access · Layout · Purpose & primary action · Regions & components · Data · States (+ filters for list screens) · notable interactions/permissions · analytics.

### 3.1 Seller Profile (public)

- **Route & access:** `/sellers/{slug}` · all personas · no permission.
- **Layout:** Top Navigation Layout; Content Area with store header + listing grid.
- **Purpose & primary action:** Evaluate the store; primary: **open a listing**.
- **Regions:** header — Seller Card (hero variant: Avatar, store name, Rating, member-since, response time), *Message seller* ghost, *Report store* in Context Menu; body — Tabs (Listings | Reviews | About); listings tab = Listing Card grid + Pagination + category Chip filter; reviews tab = Rating histogram + Review Card list; about = Description List (policies, shipping).
- **Data:** `GET /v1/sellers/{id}` first paint; `GET /v1/sellers/{id}/listings?cursor=` per tab; reviews deferred.
- **States:** grid 8 card skeletons; empty listings "This store has no active listings yet"; suspended store → Blank State Layout "This store is unavailable" (no listing leak); filters: category, sort (newest/price/rating).
- **Notes:** *Message seller* requires sign-in (redirect + return). Seller viewing own profile sees *Edit store* → Store Settings. Admin sees *Moderate store* link.
- **Analytics:** `screen_viewed{screen:"seller_profile"}` · `listing_card_clicked{source:"seller_profile"}` · `message_seller_started`.

### 3.2 Sign In

- **Route & access:** `/signin` · Guest (signed-in users are redirected to their default dashboard) · none.
- **Layout:** Authentication Layout (centered card, logo, minimal chrome).
- **Purpose & primary action:** Authenticate; primary: **Sign in**.
- **Regions:** Card — Email Input, Password Input (show/hide per contract), Checkbox (remember), Button primary, links *Forgot password?* / *Create account*; SSO buttons (secondary) if enabled; Alert region for auth errors.
- **Data:** `POST /v1/auth/sessions`; rate-limit + lockout codes per doc 09 § Auth. Redirect honors `?next=` (validated allowlist).
- **States:** submit → button loading state; error — single Alert "Email or password is incorrect" (no field attribution — doc 10 § Auth); locked → Alert with cooldown; unverified email → Alert with *Resend verification* (→ Email Verification).
- **Notes:** Authentication pattern per 05 § Authentication (step-up, MFA challenge screen inserted when required). No permission-denied state (public).
- **Analytics:** `screen_viewed{screen:"sign_in"}` · `sign_in_submitted` · `sign_in_succeeded` · `sign_in_failed{code}`.

### 3.3 Sign Up

- **Route & access:** `/signup` · Guest · none.
- **Layout:** Authentication Layout.
- **Purpose & primary action:** Create an account; primary: **Create account**.
- **Regions:** Card — Input (name), Email Input, Password Input with strength Progress, Checkbox (terms, required), Button primary; link *Sign in instead*; Validation Message per field.
- **Data:** `POST /v1/users` → session + verification email queued; duplicate email → `validation_failed` detail mapped to field.
- **States:** field-level inline validation on blur; success routes to Email Verification pending screen; error Alert for non-field failures.
- **Notes:** Buyer is the default role; selling starts later via Seller Onboarding Wizard (no role picker here — 07 § Onboarding). Terms checkbox unchecked disables primary with tooltip.
- **Analytics:** `screen_viewed{screen:"sign_up"}` · `sign_up_submitted` · `account_created`.

### 3.4 Forgot Password

- **Route & access:** `/forgot-password` (+ `/reset-password?token=`) · Guest · none.
- **Layout:** Authentication Layout.
- **Purpose & primary action:** Recover access; primary: **Send reset link** (step 1) / **Set new password** (step 2).
- **Regions:** step 1 — Email Input + Button; step 2 (token route) — Password Input ×2 with strength Progress + Button; Alert region.
- **Data:** `POST /v1/auth/password-resets` (always returns success — no account enumeration) · `PUT /v1/auth/password-resets/{token}`.
- **States:** step 1 success — static confirmation "If an account exists, we sent a link" (10 § Auth); expired/invalid token — Alert + *Request a new link*; success — Success Page state + *Sign in*.
- **Notes:** Reset invalidates other sessions (notice shown). Rate limited with cooldown copy.
- **Analytics:** `screen_viewed{screen:"forgot_password"}` · `password_reset_requested` · `password_reset_completed`.

### 3.5 Email Verification

- **Route & access:** `/verify-email` (pending) + `/verify-email?token=` (confirm) · signed-in unverified users, or token link · none.
- **Layout:** Authentication Layout.
- **Purpose & primary action:** Confirm the address; primary: **Resend email** (pending) — token route auto-verifies.
- **Regions:** pending — icon, explanation, masked email, Button secondary (resend, 60s cooldown Stepper-style countdown), *Change email* link; confirm — Loading Overlay → Success Page state or error Alert.
- **Data:** `POST /v1/auth/verifications` (resend) · `PUT /v1/auth/verifications/{token}`.
- **States:** verifying (spinner), success (→ continue to intended destination), expired token (Alert + resend), already-verified (info Alert + continue).
- **Notes:** Unverified users may browse but not check out or message (gates enforced at those actions, copy 10 § Auth).
- **Analytics:** `screen_viewed{screen:"email_verification"}` · `verification_resent` · `email_verified`.

### 3.6 Orders List (buyer)

- **Route & access:** `/account/orders` · Buyer · none.
- **Layout:** Sidebar Layout (buyer) inside App Shell.
- **Purpose & primary action:** Find an order; primary: **open an order** (→ Order Detail buyer view § 2.5).
- **Regions:** header + Search Bar (order no., listing title); Tabs by escrow stage: All | In progress (`payment_held`/`delivered`) | Completed (`approved`/`released`) | Disputed | Cancelled/Refunded; list of Order Card rows (thumbnail, title, seller, total + currency, Payment Status Badge, stage Badge, date); Pagination.
- **Data:** `GET /v1/orders?stage=&q=&cursor=&limit=20`.
- **States:** 6 Order Card skeletons; first-use empty "No orders yet" + *Explore the marketplace*; filtered-empty "No orders match"; error Inline Error + retry. Filters: tab (stage), search, date range (Date Range Picker in Advanced Filters).
- **Notes:** Rows in `delivered` show inline **Approve** shortcut (same Confirmation Dialog as § 2.5). Everything else navigates.
- **Analytics:** `screen_viewed{screen:"orders_list_buyer"}` · `order_opened` · `delivery_approved{source:"list"}`.

### 3.7 Notifications

- **Route & access:** `/account/notifications` · Buyer, Seller (role-scoped feed) · none. (Bell popover in App Shell is the Notification Center component; this is the full screen.)
- **Layout:** Sidebar Layout inside App Shell; single column list.
- **Purpose & primary action:** Catch up; primary: **open a notification's target**.
- **Regions:** header with *Mark all as read* ghost; Tabs: All | Unread | Orders | Messages | System; List grouped by day — each row: tone icon (Badge), title, snippet, time, unread dot; Pagination (cursor "Load more").
- **Data:** `GET /v1/me/notifications?filter=&cursor=&limit=30` · `POST /v1/me/notifications/read {ids|all}`.
- **States:** 8 row skeletons; empty "You're all caught up 🎉" (10 § Notifications); error Inline Error. Filters = the Tabs.
- **Notes:** Row click marks read + deep-links (order → Order Detail, message → Messages, dispute → dispute view, payout → Earnings & Payouts). Preferences link → Account Settings (Notifications tab). Real-time badge sync with App Shell.
- **Analytics:** `screen_viewed{screen:"notifications"}` · `notification_opened{type}` · `notifications_marked_read{count}`.

### 3.8 Reviews (write/manage) — buyer

- **Route & access:** `/account/reviews` · Buyer · none.
- **Layout:** Sidebar Layout (buyer); Tabs: To review | Published.
- **Purpose & primary action:** Review received orders; primary: **Write a review** on the top pending item.
- **Regions:** To review — List of eligible orders (Order Card slim + Button *Write a review*); write form in Modal Layout: Rating (required), Textarea, Image Gallery Upload (optional), Checkbox (anonymous); Published — Review Card list with *Edit* (within edit window) / *Delete* Context Menu.
- **Data:** `GET /v1/me/reviewables?cursor=` · `GET /v1/me/reviews?cursor=` · `POST /v1/listings/{id}/reviews` · `PATCH/DELETE /v1/reviews/{id}`.
- **States:** 4 row skeletons per tab; To-review empty "Nothing to review right now"; Published empty "Your reviews will appear here"; validation — Rating required (Validation Message).
- **Notes:** Eligibility = escrow stage `approved`/`released` orders without a review (05 § Review Flow). Seller replies render read-only beneath the Review Card. Edit window per policy (badge shows days left).
- **Analytics:** `screen_viewed{screen:"reviews_buyer"}` · `review_submitted{rating}` · `review_edited` · `review_deleted`.

### 3.9 Wallet & Payment Methods

- **Route & access:** `/account/wallet` · Buyer · none (step-up auth required for method changes).
- **Layout:** Sidebar Layout (buyer); balance header + Tabs: Payment methods | Wallet activity.
- **Purpose & primary action:** Manage payment instruments; primary: **Add payment method**.
- **Regions:** header — Statistic Block wallet balance + currency (credits from refunds); methods — List of Card rows (brand icon, •••• 4242, expiry, default Badge, Context Menu: make default / remove); *Add payment method* opens Modal Layout (provider-hosted card fields); activity — Table: date, description, amount ± + currency, Payment Status Badge (`refunded`, `released` for credits spent, etc.), linked order.
- **Data:** `GET /v1/me/payment-methods` · `GET /v1/wallet` + `GET /v1/wallet/transactions?cursor=` · `POST/DELETE /v1/me/payment-methods` · default via `PATCH`.
- **States:** methods 2 row skeletons; empty methods "No saved payment methods" + add CTA; empty activity "No wallet activity yet"; remove-default blocked with tooltip until another default is set.
- **Notes:** Card data never touches Flexa servers (hosted fields, doc 09 § Payments). Removal requires Confirmation Dialog; step-up auth per 05 § Authentication.
- **Analytics:** `screen_viewed{screen:"wallet"}` · `payment_method_added` · `payment_method_removed` · `payment_method_set_default`.

### 3.10 Account Settings (Profile / Security / Notifications)

- **Route & access:** `/account/settings/{profile|security|notifications}` · Buyer, Seller (same screen, personal scope) · none.
- **Layout:** Settings Layout (section nav left, form right) inside App Shell.
- **Purpose & primary action:** Keep account correct; primary: **Save changes** per section.
- **Regions:** Profile — Avatar Upload, Input (name), Email Input (change triggers re-verification flow → Email Verification), Phone Input, Select (language, timezone); Security — Password change Field Group, MFA setup (Switch + QR Modal Layout), active sessions Table with *Revoke*; Notifications — Permission-Matrix-style grid of Switches: channel (email/push/in-app) × category (orders, messages, reviews, marketing).
- **Data:** `GET /v1/me` · `PATCH /v1/me` · `PUT /v1/me/password` · `GET/DELETE /v1/me/sessions` · `PUT /v1/me/notification-preferences`.
- **States:** section form skeleton on load; dirty-state guard on nav away (Confirmation Dialog per 05 § Settings); success Toast "Saved"; field errors inline.
- **Notes:** Settings pattern per 05 § Settings (per-section save, not global). Security changes require current password; session revoke-all signs out elsewhere with notice.
- **Analytics:** `screen_viewed{screen:"account_settings_{section}"}` · `profile_updated` · `password_changed` · `mfa_enabled` · `notification_prefs_updated`.

### 3.11 Seller Onboarding Wizard

- **Route & access:** `/seller/onboarding` · Buyer becoming Seller (signed-in, verified email) · none; incomplete Sellers are redirected here from `/seller/*`.
- **Layout:** Wizard Layout. Steps: store basics → identity/KYC → payout method → review & agree.
- **Purpose & primary action:** Become sellable; primary: **Continue** / final **Open my store**.
- **Regions:** step 1 — Input (store name, checked live for uniqueness), Avatar Upload (logo), Textarea (about), Select (country); step 2 — File Upload (identity document via provider), status Badge (`pending`/`verified`/`failed`); step 3 — payout account Field Group (mirrors § 2.11 Method tab); step 4 — Description List summary + Checkbox (seller agreement) + Button primary.
- **Data:** `POST /v1/seller/onboarding` draft · `PATCH` per step (resumable) · KYC status polled `GET /v1/seller/onboarding/kyc` · finish `POST /v1/seller/onboarding/complete`.
- **States:** resumable — reopening lands on first incomplete step; KYC `pending` allows continuing with Warning Banner "You can prepare your store; payouts unlock after verification"; KYC `failed` → Alert + re-upload; completion → Success Page → Seller Dashboard.
- **Notes:** Wizard per 05 § Wizard. Store name uniqueness validated server-side debounce. Agreement checkbox gates the final button.
- **Analytics:** `screen_viewed{screen:"seller_onboarding"}` · `onboarding_step_completed{step}` · `kyc_submitted` · `store_opened`.

### 3.12 Listings (seller list)

- **Route & access:** `/seller/listings` · Seller · permission `listings.write` for actions, `listings.read` to view.
- **Layout:** Sidebar Layout (seller); Content Area full-width table.
- **Purpose & primary action:** Manage inventory; primary: **+ New listing** (→ Listing Editor).
- **Regions:** header + Button primary; Tabs by status: Active | Draft | Pending review | Rejected | Archived (count Badges); Data Management Toolbar — Search Bar, Advanced Filters (category, stock level, price range), Saved Filters; Table: ▢, thumb, title, price + currency, stock (low-stock warning Badge), status Badge, views 30d, updated; row Context Menu: Edit / Duplicate / Archive / Delete (draft only); Bulk Actions Bar: archive, adjust stock; Pagination.
- **Data:** `GET /v1/seller/listings?status=&q=&cursor=&limit=25` · bulk `POST /v1/seller/listings/bulk`.
- **States:** 8 row skeletons; first-use empty (Blank State Layout) "Create your first listing" + primary; filtered-empty; rejected rows link to moderation feedback note. Filters as listed.
- **Notes:** Inline stock quick-edit per 05 § Inline Editing (Number Input in cell, Enter commits). Duplicate opens Listing Editor prefilled as draft. Delete only for drafts (Confirmation Dialog); active listings archive instead.
- **Analytics:** `screen_viewed{screen:"seller_listings"}` · `listing_duplicated` · `listing_archived` · `stock_quick_edited` · `listings_bulk_action{action,count}`.

### 3.13 Orders List (seller)

- **Route & access:** `/seller/orders` · Seller · permission `orders.fulfil`.
- **Layout:** Sidebar Layout (seller); full-width table.
- **Purpose & primary action:** Work the fulfilment queue; primary: **open the oldest unfulfilled order** (→ § 2.10).
- **Regions:** Tabs by workflow: Needs action (`payment_held` unaccepted + accepted-unshipped) | Shipped (`delivered`) | Completed (`approved`/`released`) | Disputed | Declined/Refunded; Data Management Toolbar — Search Bar (order no., buyer), Advanced Filters (date range, amount range); Table: order no., items summary, buyer, total + currency, Payment Status Badge, escrow stage Badge, SLA ⏱ (needs-action tab), date; Pagination.
- **Data:** `GET /v1/seller/orders?stage=&q=&cursor=&limit=25`.
- **States:** 8 row skeletons; Needs-action empty "You're all caught up"; other tabs "No orders here yet"; SLA-overdue rows danger Badge. Filters as listed.
- **Notes:** Needs-action default tab, sorted oldest-first (SLA). Row inline shortcut *Accept* on unaccepted rows (same mutation as § 2.10). Export CSV via toolbar.
- **Analytics:** `screen_viewed{screen:"orders_list_seller"}` · `order_opened{source:"seller_list"}` · `order_accepted{source:"list"}` · `orders_exported`.

### 3.14 Reviews (respond) — seller

- **Route & access:** `/seller/reviews` · Seller · permission `seller.access`.
- **Layout:** Sidebar Layout (seller).
- **Purpose & primary action:** Protect reputation; primary: **Reply** to the newest unanswered review.
- **Regions:** header — Rating summary (average + histogram, Statistic Block); Tabs: Needs reply | All; List of Review Card (buyer name/Avatar, Rating, text, listing Chip, date) with inline reply Textarea + Button (one reply per review, edit window); Context Menu: *Report review* (abuse → Admin queue); Pagination.
- **Data:** `GET /v1/seller/reviews?filter=&cursor=` · `POST /v1/reviews/{id}/reply` · `PATCH /v1/reviews/{id}/reply`.
- **States:** 4 Review Card skeletons; Needs-reply empty "No reviews waiting for a reply"; All empty "Reviews appear after buyers rate completed orders"; reply optimistic with failure retry.
- **Notes:** Replies are public (notice above composer, copy 10 § Reviews). Low-rating (≤2★) rows carry warning Badge and sort first in Needs reply.
- **Analytics:** `screen_viewed{screen:"reviews_seller"}` · `review_reply_posted` · `review_reported{by:"seller"}`.

### 3.15 Analytics (seller)

- **Route & access:** `/seller/analytics` · Seller · permission `analytics.read`.
- **Layout:** Dashboard Layout (seller Sidebar).
- **Purpose & primary action:** Understand performance; primary: **change date range** (Date Range Picker) — the screen is read-only.
- **Regions:** header — Date Range Picker + compare Switch (vs previous period); Metric Card row: revenue + currency, orders, conversion, avg order value + currency (delta Badges); Charts Container ×2: revenue over time, orders by category; Table: top listings (views, orders, revenue + currency, conversion); funnel Progress Summary (views → carts → orders).
- **Data:** `GET /v1/seller/analytics/summary?from=&to=&compare=` · `GET /v1/seller/analytics/series?metric=` · `GET /v1/seller/analytics/top-listings?limit=10`.
- **States:** metric + chart skeletons; empty (no data in range) "No data for this period — try a wider range"; new store empty state with explainer; per-widget Inline Error (widgets degrade independently).
- **Notes:** All aggregates server-computed (doc 09 § Analytics); charts follow Charts Container contract (tooltips, keyboard access). Export CSV per widget via Context Menu.
- **Analytics:** `screen_viewed{screen:"seller_analytics"}` · `analytics_range_changed{range}` · `analytics_exported{widget}`.

### 3.16 Store Settings

- **Route & access:** `/seller/settings/{store|shipping|policies|team}` · Seller owner (team members per role) · permission `store.manage` (team tab: `store.team`).
- **Layout:** Settings Layout (seller scope).
- **Purpose & primary action:** Configure the store; primary: **Save changes** per section.
- **Regions:** Store — Avatar Upload (logo), Input (store name), Textarea (about), vacation-mode Switch (pauses listings with Warning Banner site-wide on Seller Profile); Shipping — shipping profiles List (name, regions, rate + currency) with drawer editing (Right Drawer per 05 § Drawer Editing); Policies — Rich Text Editor ×2 (returns, custom policies) with template starting points; Team — Table of members (Avatar, email, Role Badge, status) + *Invite member* Modal Layout (email + role Select).
- **Data:** `GET/PATCH /v1/seller/store` · CRUD `/v1/seller/shipping-profiles` · `GET/POST/DELETE /v1/seller/team-members`.
- **States:** section skeletons; dirty guard; team empty "Just you so far" + invite CTA; invite pending Badge until accepted.
- **Notes:** Vacation mode requires Confirmation Dialog (explains listing visibility). Deleting a shipping profile in use is blocked with count tooltip. Team roles map to seller permissions (`orders.fulfil`, `listings.write`, `payouts.read`) — matrix reference doc 06 § Permission Matrix.
- **Analytics:** `screen_viewed{screen:"store_settings_{section}"}` · `store_updated` · `vacation_mode_toggled{on}` · `team_member_invited{role}`.

### 3.17 Admin Dashboard

- **Route & access:** `/admin` · Admin · permission `admin.access`.
- **Layout:** Dashboard Layout (admin Sidebar).
- **Purpose & primary action:** Platform health at a glance; primary: **open the most urgent queue** (disputes SLA / moderation backlog card).
- **Regions:** Metric Card row: GMV today + currency, orders today, active disputes, moderation backlog, signups today; Alert strip — SLA breaches, payment provider incidents (links to Queue Monitor / System Settings status); Charts Container: GMV 30d, orders 30d; queues summary — Quick Links with count Badges (Disputes Queue, Listings Moderation, Payments & Refunds review); Recent Activity — admin Audit Log tail (5 entries).
- **Data:** `GET /v1/admin/dashboard` (aggregate) · deferred `GET /v1/admin/metrics/series?metric=gmv&range=30d`.
- **States:** metric + chart skeletons; error per region; restricted-role Admins see only the cards their permissions allow (regions hidden, not disabled).
- **Notes:** Read-only screen — all actions navigate. Currency on GMV always displayed with code; multi-currency platforms show the reporting currency (doc 09 § Money).
- **Analytics:** `screen_viewed{screen:"admin_dashboard"}` · `admin_queue_opened{queue}`.

### 3.18 Users (admin)

- **Route & access:** `/admin/users` · Admin · permission `users.read` (actions `users.manage`).
- **Layout:** Sidebar Layout (admin); full-width table.
- **Purpose & primary action:** Locate an account; primary: **open a user** (→ User Detail).
- **Regions:** Data Management Toolbar — Search Bar (name, email, id), Advanced Filters (role, status active/suspended, verification, signup date range, has-store), Saved Filters; Table: ▢, Avatar + name, email, Role Badge(s), status Badge, orders/sales counts, joined; Bulk Actions Bar (suspend — `users.manage` only); Pagination.
- **Data:** `GET /v1/admin/users?q=&role=&status=&cursor=&limit=25`.
- **States:** 10 row skeletons; empty only when filtered — "No users match" (a marketplace always has users); error Inline Error + retry. Filters as listed.
- **Notes:** Row click → User Detail. Suspension (single or bulk) requires reason + Confirmation Dialog, is audit-logged, and takes effect on next request. Email column masked for support-role Admins without `users.pii`.
- **Analytics:** `screen_viewed{screen:"admin_users"}` · `user_opened` · `users_bulk_suspended{count}`.

### 3.19 User Detail (admin)

- **Route & access:** `/admin/users/{id}` · Admin · `users.read` (+ `users.manage` for actions, `users.pii` for unmasked PII).
- **Layout:** Sidebar Layout (admin); header card + Tabs.
- **Purpose & primary action:** Understand and act on one account; primary: contextual — usually **Suspend / Reinstate** (with `users.manage`).
- **Regions:** header — Avatar, name, email, Role Badge(s), status Badge, joined, Quick Actions (Suspend/Reinstate, Force sign-out, Resend verification, Reset MFA — each Confirmation Dialog + reason); Tabs: Overview (Description List profile + Statistic Blocks: orders, GMV + currency, disputes) | Orders (Order Card list linking to admin order view) | Listings (if seller; links to Listings Moderation filtered) | Disputes (list) | Notes (Comment Thread, admin-only) | Audit (Audit Timeline of actions on/by this user).
- **Data:** `GET /v1/admin/users/{id}` first paint; each tab lazy (`/orders`, `/listings`, `/disputes`, `/notes`, `/audit` subresources, cursor-paged).
- **States:** header + active tab skeleton; suspended account renders danger Warning Banner atop; tab-level empties ("No disputes for this user").
- **Notes:** Suspending a Seller cascades: listings hidden, payouts frozen — the Confirmation Dialog enumerates effects (copy 10 § Admin). All actions audit-logged with actor.
- **Analytics:** `screen_viewed{screen:"admin_user_detail"}` · `user_suspended{reason}` · `user_reinstated` · `user_note_added`.

### 3.20 Orders (admin)

- **Route & access:** `/admin/orders` (+ `/admin/orders/{id}` read-only detail) · Admin · permission `orders.read`.
- **Layout:** Sidebar Layout (admin); full-width table; detail reuses the Order Detail composition (§ 2.5) read-only with both parties visible.
- **Purpose & primary action:** Investigate orders platform-wide; primary: **open an order**.
- **Regions:** Data Management Toolbar — Search Bar (order no., buyer, seller), Advanced Filters (payment status `pending|processing|held|released|refunded|partially_refunded|failed`, escrow stage `payment_held|delivered|approved|released|disputed`, date range, amount range, seller), Saved Filters; Table: order no., buyer, seller, total + currency, Payment Status Badge, stage Badge, date; Pagination.
- **Data:** `GET /v1/admin/orders?…&cursor=&limit=25`; detail `GET /v1/admin/orders/{id}` (full: both parties, payment ledger, escrow events).
- **States:** 10 row skeletons; filtered-empty; error Inline Error. Filters as listed (the two status vocabularies are the canonical filter enums).
- **Notes:** Admin order detail is read-only: money movement happens only via Dispute Detail resolution or Payments & Refunds (deep links provided). Escrow Timeline + Audit Timeline shown side by side.
- **Analytics:** `screen_viewed{screen:"admin_orders"}` · `admin_order_opened` · `admin_orders_filtered{field}`.

### 3.21 Payments & Refunds (admin)

- **Route & access:** `/admin/payments` · Admin · `payments.read`; refund execution requires `payments.refund`.
- **Layout:** Sidebar Layout (admin); Tabs: Payments | Refunds | Payouts.
- **Purpose & primary action:** Reconcile money; primary: **open a payment record** (Right Drawer).
- **Regions:** Metric Card row: volume today + currency, `failed` count 24h, refunds pending; per tab a Table — Payments: id, order, buyer, amount + currency, Payment Status Badge, provider ref, date; Refunds: id, order, amount + currency, `refunded|partially_refunded` Badge, initiator (dispute/admin), status; Payouts: batch id, seller, amount + currency, status `pending|processing|released|failed`; Advanced Filters (status, date range, amount range, provider); Right Drawer per row: full ledger, provider payload link, Audit Timeline, and (with `payments.refund`) **Issue refund…** action (Currency Input ≤ remaining, reason, Confirmation Dialog → `refunded`/`partially_refunded`).
- **Data:** `GET /v1/admin/payments?…` / `/refunds` / `/payouts` (cursor) · `POST /v1/admin/payments/{id}/refunds` with `Idempotency-Key`.
- **States:** 10 row skeletons per tab; `failed` rows danger Badge with provider error code; empty per tab ("No refunds in this period"); drawer skeleton.
- **Notes:** Manual refunds outside disputes are exceptional and double-confirmed; every refund writes Audit Log + buyer notification. Failed payouts expose *Retry payout* (`payments.refund` holders).
- **Analytics:** `screen_viewed{screen:"admin_payments"}` · `refund_issued{amountMinor,currency,source:"admin"}` · `payout_retried`.

### 3.22 Categories & Attributes (admin)

- **Route & access:** `/admin/categories` · Admin · permission `catalog.manage`.
- **Layout:** Sidebar Layout (admin); Split View — category Tree left, editor right.
- **Purpose & primary action:** Maintain taxonomy; primary: **save the edited category**.
- **Regions:** left — Tree (drag to reorder/re-parent per 05 § Drag and Drop), Search Bar, *+ Add category*; right — Field Group (name, slug, parent Select, visibility Switch, image File Upload) + attributes section: Table of attributes (name, type Select: text/number/select/boolean, required Switch, options Tag Input for selects) with add/remove + drag order.
- **Data:** `GET /v1/categories?tree=1&includeHidden=1` · CRUD `/v1/admin/categories` · attributes nested `PUT /v1/admin/categories/{id}/attributes`.
- **States:** tree skeleton (8 nodes); no-selection Blank State Layout "Select a category to edit"; delete blocked when listings exist (tooltip with count; offer *Move listings…* Modal Layout); reorder optimistic with failure rollback Toast.
- **Notes:** Attribute changes affect the Listing Editor step-2 schema — a Warning Banner states "Changes apply to new and edited listings" (existing listings keep stored values). Slug edits warn about URL impact.
- **Analytics:** `screen_viewed{screen:"admin_categories"}` · `category_created` · `category_moved` · `attribute_updated{categoryId}`.

### 3.23 Reports & Analytics (admin)

- **Route & access:** `/admin/reports` · Admin · permission `reports.read`.
- **Layout:** Dashboard Layout (admin); report picker + canvas.
- **Purpose & primary action:** Answer a business question; primary: **run a report** (range + dimensions → results).
- **Regions:** header — report Select (GMV, take rate, disputes rate, seller growth, category performance, cohort retention), Date Range Picker, compare Switch, *Export*; canvas — Charts Container (primary viz) + Statistic Block summary row + Table (drill rows, e.g. per category / per seller with revenue + currency); Saved Filters for report configs.
- **Data:** `GET /v1/admin/reports/{key}?from=&to=&compare=&groupBy=&cursor=` — heavy reports return `202` + job id, polled via `GET /v1/admin/reports/jobs/{id}` (Queue-backed; see Queue Monitor).
- **States:** canvas skeleton; long-running → Progress with "Preparing report…" (cancellable); empty range "No data for this period"; export ready → Toast with download link.
- **Notes:** All money aggregates in reporting currency with code. Table drill rows deep-link (seller → User Detail, category → Categories & Attributes). Report definitions are fixed v1 — no custom query builder.
- **Analytics:** `screen_viewed{screen:"admin_reports"}` · `report_run{key,range}` · `report_exported{key}`.

### 3.24 Audit Log (admin)

- **Route & access:** `/admin/audit-log` · Admin · permission `audit.read` (no write actions exist).
- **Layout:** Sidebar Layout (admin); full-width table.
- **Purpose & primary action:** Reconstruct who did what; primary: **filter to the relevant actor/resource**.
- **Regions:** Data Management Toolbar — Search Bar (actor, resource id), Advanced Filters (actor Autocomplete, action type Select — `dispute.resolved`, `listing.rejected`, `user.suspended`, `refund.issued`, `settings.changed`…, resource type, date range), Saved Filters; Table (Audit Log component): timestamp UTC, actor (Avatar + Role Badge), action, resource link, summary; Right Drawer per row: full before/after diff (Description List), request metadata; Pagination.
- **Data:** `GET /v1/admin/audit-events?actorId=&action=&resourceType=&from=&to=&cursor=&limit=50` (append-only, doc 09 § Audit).
- **States:** 12 row skeletons; filtered-empty "No events match"; error Inline Error. Filters as listed.
- **Notes:** Immutable: no edit/delete anywhere. Rows deep-link to their resource (dispute, listing, user, payment). Export requires `audit.export` and is itself audit-logged.
- **Analytics:** `screen_viewed{screen:"admin_audit_log"}` · `audit_filtered{field}` · `audit_exported`.

### 3.25 System Settings (admin)

- **Route & access:** `/admin/settings/{general|payments|escrow|moderation|notifications|api}` · Admin · permission `settings.manage` (view with `settings.read`).
- **Layout:** Settings Layout (admin scope).
- **Purpose & primary action:** Configure platform policy; primary: **Save changes** per section.
- **Regions:** General — platform name, support email, locales, maintenance-mode Switch (raises Maintenance Banner platform-wide, double Confirmation Dialog); Payments — provider keys (masked Input + *Reveal* step-up), platform fee % (Number Input), reporting currency Select; Escrow — auto-approve window days (Number Input), payout minimum (Currency Input + currency), dispute SLA hours; Moderation — pre-publish review Switch per category (Tree + Switches), banned keywords Tag Input; Notifications — platform email templates List → Right Drawer editor; API — webhook endpoints Table (URL, events, status, secret rotate), API keys management.
- **Data:** `GET/PUT /v1/admin/settings/{section}` · webhook CRUD `/v1/admin/webhooks`.
- **States:** section skeleton; dirty guard; validation inline; every save writes Audit Log + success Toast; `settings.read`-only renders all controls disabled with a header notice.
- **Notes:** Escrow/payment changes affect *future* orders only (Warning Banner states this). Webhook rows show delivery health Badge, linking to Queue Monitor.
- **Analytics:** `screen_viewed{screen:"admin_settings_{section}"}` · `settings_saved{section}` · `maintenance_mode_toggled{on}` · `webhook_updated`.

### 3.26 Queue Monitor (admin)

- **Route & access:** `/admin/queues` · Admin · permission `system.ops`.
- **Layout:** Sidebar Layout (admin); Content Area with the Queue Monitor + Background Jobs Panel components.
- **Purpose & primary action:** Keep async work healthy; primary: **retry failed jobs**.
- **Regions:** summary — Metric Card row per queue (emails, webhooks, payouts, reports, media): depth, throughput, failed count with tone Badges; Queue Monitor component — per-queue Table of jobs: id, type, status (`queued`/`processing`/`failed`/`done`), attempts, last error (truncated, Tooltip full), enqueued at; Advanced Filters (queue, status, type, date); Bulk Actions Bar: *Retry selected*, *Discard selected* (Confirmation Dialog); Background Jobs Panel — scheduled/cron jobs with last-run status; auto-refresh Switch (10s).
- **Data:** `GET /v1/admin/queues` (summary) · `GET /v1/admin/queues/{name}/jobs?status=&cursor=` · `POST /v1/admin/queues/jobs/bulk {action, ids}`.
- **States:** summary + table skeletons; healthy-empty "No failed jobs 🎉" on failed filter; degraded queue raises danger Alert pinned above summary; auto-refresh pauses while a row drawer is open.
- **Notes:** Job payloads shown redacted (no PII) unless `users.pii`. Retry/discard audit-logged. Payment-affecting job retries warn about idempotency (safe by design, doc 09).
- **Analytics:** `screen_viewed{screen:"admin_queue_monitor"}` · `jobs_retried{count,queue}` · `jobs_discarded{count,queue}`.

### 3.27 Messages (seller)

- **Route & access:** `/seller/messages` (or `/messages` under seller context) · Seller · permission `seller.access`.
- **Layout / spec:** **Reuses the Messages spec (§ 2.7) verbatim** — same Split View, components, data contracts, states, interactions, analytics.
- **Scope deltas only:**
  1. Conversation List is scoped to the seller's store; context Chips reference *incoming* orders and the seller's listings.
  2. Chat header shows Buyer Card summary (order count with this store) instead of Seller Card context.
  3. Quick-reply saved templates (Select in composer) are seller-only, managed in Store Settings.
  4. Attention integration: unanswered buyer questions older than the response-time SLA surface on Seller Dashboard.
  5. Empty state copy is the seller variant ("Buyer questions appear here" — 10 § Messages).
- **Analytics:** same events with `screen_viewed{screen:"messages_seller"}`.

---

## 4. Coverage checklist (traceability to README canonical inventory)

| Inventory group | Screens | Where |
|---|---|---|
| Public/Guest | Home · Search Results · Listing Detail · Seller Profile (public) · Sign In · Sign Up · Forgot Password · Email Verification | § 2.1–2.3, § 3.1–3.5 |
| Buyer | Buyer Dashboard · Checkout (Cart → Payment → Confirm) · Orders List · Order Detail (with Escrow Timeline) · Messages · Notifications · Reviews (write/manage) · Wallet & Payment Methods · Account Settings (Profile / Security / Notifications) | § 2.4–2.7, § 3.6–3.10 |
| Seller | Seller Onboarding Wizard · Seller Dashboard · Listings (list) · Listing Editor (create wizard / edit) · Orders List · Order Detail (fulfil) · Earnings & Payouts · Reviews (respond) · Messages · Analytics · Store Settings | § 2.8–2.11, § 3.11–3.16, § 3.27 |
| Admin | Admin Dashboard · Users · User Detail · Listings Moderation · Orders · Disputes Queue · Dispute Detail · Payments & Refunds · Categories & Attributes · Reports & Analytics · Audit Log · System Settings · Queue Monitor | § 2.12–2.14, § 3.17–3.26 |

Status vocabularies used throughout: payment `pending | processing | held | released | refunded | partially_refunded | failed`; escrow `payment_held | delivered | approved | released | disputed`. Any new screen must adopt this template (§ 1) and register in the README inventory first.
