# 02 — UI Kit · Commerce Components

> Part of the Flexa UI Kit catalog (doc 02). 14 canonical commerce components: Product Card, Listing Card, Pricing Card, Order Card, Invoice Card, Cart Summary, Checkout Summary, Payment Status, Shipping Timeline, Escrow Timeline, Review Card, Seller Card, Buyer Card, Marketplace Statistics.
> Engineering contracts (props/events/ARIA) live in doc 04. Flow-level orchestration (Checkout, Escrow Flow, Dispute Flow, Review Flow) lives in doc 05. Payloads in 09. Microcopy in 10.

## Design rationale

Commerce UIs succeed or fail on **trust and scannability**. Every component in this section is built around three convictions:

1. **Money is sacred.** Amounts are never truncated, never ellipsized, never rounded for display without an explicit label. Currency is always shown. Amounts arrive as integer minor units + ISO-4217 code (see 09) and are formatted per the locale rules in 10 § Money. When a total does not fit, the *layout* yields (wraps, grows) — the number never does.
2. **Status is a system, not a color.** Every commerce state (payment, shipping, escrow, order) maps onto the shared tone vocabulary `neutral | info | success | warning | danger` and renders through Badge (see Data display). Tone is always paired with a text label and/or icon — never color alone (see 11).
3. **The escrow lifecycle is the product.** In a marketplace with held payments, the buyer's central question is "where is my money?" and the seller's is "when do I get paid?". Escrow Timeline is the flagship component that answers both, and Payment Status is its compact echo everywhere else.

### Component hierarchy

```
Commerce
├─ Catalog surfaces ────── Product Card · Listing Card · Pricing Card
├─ Transaction records ─── Order Card · Invoice Card
├─ Purchase funnel ─────── Cart Summary · Checkout Summary
├─ Money & fulfilment ──── Payment Status · Shipping Timeline · Escrow Timeline
├─ Trust & identity ────── Review Card · Seller Card · Buyer Card
└─ Aggregates ──────────── Marketplace Statistics
```

Composition rules: Order Card embeds Payment Status; Order Detail (screen, see 08) composes Order Card + Escrow Timeline + Shipping Timeline; Checkout Summary embeds Cart Summary line logic; Seller Card embeds Rating + Badge. Cards in this section are specializations of the generic Card (Data display) — same padding (`space.4`/`space.6`), radius (`radius.lg`), elevation (`shadow.sm`, `shadow.md` on hover where interactive).

---

## Product Card

**Purpose.** Compact, image-led representation of a purchasable product in grids: catalog pages, search results, recommendation rails.

**When to use.** Browsing/discovery contexts where the user compares many items visually; homepage rails; "related products".

**When NOT to use.** Marketplace listings with seller identity and marketplace metadata — use Listing Card. Subscription plans — use Pricing Card. A single product's detail view — that is a screen (see 08 § Listing Detail), not a card.

**Variants.**

| Variant (`data-variant`) | Use |
|---|---|
| `default` | Image top, content below — grids |
| `horizontal` | Image left, content right — dense lists, sidebars |
| `minimal` | Image + name + price only — rails, cross-sell strips |

**Properties (design-facing; see 04 for the full contract).**

| Property | Type | Notes |
|---|---|---|
| `image` | media ref | Aspect ratio fixed 4:3 (`radius.md` top corners); missing image → neutral placeholder on `color.surface-alt` |
| `title` | text | Max 2 lines, ellipsis; full title in tooltip/detail |
| `price` | money | Minor units + currency; formatted per 10 § Money |
| `compareAtPrice` | money? | Struck-through, `color.text-subtle`; renders discount Badge (tone `success`) |
| `rating` | number? | Rating component, `text.body-sm` |
| `badge` | tone + label? | e.g. "New", "Sale", "Out of stock" |
| `href` / `onSelect` | link/action | Whole card is one interactive target |

**States.** `default` (surface `color.surface`, `shadow.sm`) · `hover` (elevate to `shadow.md`, title `color.primary`; transition `motion.duration-fast`) · `focus` (outline `color.focus-ring`, whole-card focus ring) · `active` (pressed: elevation back to `shadow.sm`) · `disabled`/out-of-stock (image at `opacity.disabled`, "Out of stock" Badge tone `neutral`, price kept visible) · `loading` (Skeleton Loader: image block + 2 text lines) · `empty` (n/a per-card; grid-level Empty State) · `error` (image load failure → placeholder, never broken-image glyph).

**Responsive.**

| Range | Behavior |
|---|---|
| Mobile ≤767 | 2-up grid, gap `space.3`; `minimal` content density |
| Tablet 768–1023 | 3-up grid, gap `space.4` |
| Desktop 1024–1439 | 4-up grid |
| Wide ≥1440 | 4–5-up inside `size.container-xl`; never stretch cards beyond ~360px content width |

**Best practices.** One price, one CTA affordance (the card itself). Keep metadata to ≤3 lines below title. Use `compareAtPrice` + Badge for discounts rather than red price text.

**Common mistakes.** Multiple buttons inside the card (kills the single tap target); truncating price to fit; variable image aspect ratios causing masonry jitter; using danger tone for "Sale".

---

## Listing Card

**Purpose.** Marketplace listing representation: a product/service *offered by a seller*, carrying seller identity, marketplace status, and trust signals. The workhorse of Flexa Marketplace search results and seller listing management.

**When to use.** Search Results, category browse, Seller Dashboard listings tab, Admin listings moderation queue.

**When NOT to use.** Pure catalog products without seller context (Product Card). Order history (Order Card).

**Variants.**

| Variant | Use |
|---|---|
| `buyer` | Public browse: image, title, price, seller chip, rating |
| `seller` | Owner view: adds status Badge (draft/pending_review/active/paused — "Sold" is a derived badge (inventory zero / one-off sold), not a status), stats (views, orders), Quick Actions |
| `moderation` | Admin view: adds flag reasons, submitted date, approve/reject actions (see admin.md § Bulk Actions Bar for batch mode) |

**Properties.** `image`, `title`, `price`, `seller` (avatar + name → Seller Card popover on hover, Desktop+ only), `rating`, `location?`, `status` (seller/moderation variants; tone-mapped Badge), `stats?` (views/orders, `text.body-sm` `color.text-muted`), `actions?` (Quick Actions, seller/moderation only), `selected?` (moderation batch mode).

**ASCII wireframe (`buyer`, default variant).**

```
┌────────────────────────────────────────────┐
│ ┌────────────────────────────────────────┐ │
│ │                                        │ │  image 4:3, radius.md
│ │              [ image ]                 │ │  badge top-left (tone)
│ │  ◤ Featured ◢                          │ │
│ └────────────────────────────────────────┘ │
│  Handcrafted walnut desk organizer         │  title — text.body, 2-line max
│  $84.00                        ★ 4.8 (127) │  price — text.heading-md · rating
│  ⊙ Atelier Norr   ·  Ships from Portland   │  seller chip — text.body-sm, muted
└────────────────────────────────────────────┘
   padding space.4 · gap space.2 · radius.lg · shadow.sm
```

`seller` variant appends a footer row: `[● Active]   1.2k views · 34 orders          [⋯]` — status Badge left, stats center (`color.text-muted`), Quick Actions right.

**States.** As Product Card, plus: `warning` (moderation: flagged listing — `color.warning` left border `border.4` + Badge) · `error` (moderation: rejected — tone `danger` Badge, reason line) · `success` (just published — transient tone `success` Badge, auto-clears). Seller variant `disabled` = paused listing: image `opacity.disabled`, status Badge tone `neutral`, actions remain enabled (owner must be able to un-pause).

**Responsive.** Mobile: full-width single column, `horizontal` internal layout (image left 96px, content right) for list density; seller stats collapse into "1.2k · 34". Tablet: 2-up grid. Desktop: 3-up (browse) or single-column rows (management tables prefer Table — see admin.md § Data Management Toolbar). Wide: 4-up browse.

**Best practices.** Seller chip always links to Seller Profile. Status Badge is the *only* place listing status is encoded — no colored borders as sole signal. In moderation variant, surface the flag reason as text, not just tone.

**Common mistakes.** Mixing buyer and seller metadata in one variant (owners don't need their own avatar; buyers don't need view counts); hiding price on hover-reveal; using the card in checkout (that's Cart Summary's line items).

---

## Pricing Card

**Purpose.** Present a purchasable plan/tier (subscription, package, service level) for comparison and selection.

**When to use.** Plan selection pages, upgrade dialogs, seller subscription tiers, service packages on a listing.

**When NOT to use.** Physical/product prices (Product/Listing Card). Invoices or totals (Invoice Card, Checkout Summary).

**Variants.** `default` · `featured` (recommended plan: `color.primary` top border `border.2` or filled header, "Most popular" Badge tone `info`, slight scale on Desktop only) · `compact` (in-dialog upgrade prompts: no feature list, link "See all features").

**Properties.** `name` (`text.heading-md`), `price` (money) + `interval` (`/mo`, `/yr` — `text.body-sm` `color.text-muted`), `intervalToggle?` (monthly/yearly, controlled at group level, savings Badge tone `success`), `description`, `features[]` (checkmark list, included = `color.success` check, excluded = `color.text-subtle` dash), `cta` (Button; `featured` gets emphasis `primary`, others `secondary`), `currentPlan?` (replaces CTA with "Current plan" Badge tone `neutral`, card `disabled`-styled but readable).

**States.** `default` · `hover` (interactive selection contexts only: `shadow.md`) · `focus` (ring on CTA, or whole card when cards are radio-selectable) · `active`/selected (border `color.primary` `border.2` + check indicator) · `disabled` (`currentPlan`, or unavailable tier: `opacity.disabled` on content, keep price legible) · `loading` (CTA Button loading state during plan change — never spinner over the whole card) · `error` (plan-change failure → Inline Error below CTA, card stays interactive).

**Responsive.** Mobile: cards stack vertically, `featured` first; interval toggle sticky above the stack. Tablet: 2-up. Desktop/Wide: 3–4 across, equal height, feature rows top-aligned so features align horizontally across cards.

**Best practices.** Exactly one `featured` card per group. Yearly savings expressed as Badge ("Save 20%"), computed server-side (09). Feature parity in ordering across cards so rows compare.

**Common mistakes.** More than 7 feature bullets (use a comparison table); hiding the real price behind "Contact us" styling identical to priced tiers; making the whole card clickable *and* having a CTA (pick one activation model per group).

---

## Order Card

**Purpose.** Summary of a single order in lists: order number, items preview, total, status, primary next action.

**When to use.** Buyer Orders List, Seller Orders List, dashboard "recent orders" rails.

**When NOT to use.** Full order detail (screen 08 § Order Detail composes richer components); invoices (Invoice Card); line-item math (Cart/Checkout Summary).

**Variants.** `buyer` (shows seller, escrow-aware Payment Status, buyer actions: "Track", "Approve delivery", "Open dispute") · `seller` (shows buyer, payout-facing status, seller actions: "Fulfil", "Add tracking") · `compact` (dashboard rail: number, total, status only).

**Properties.** `orderNumber` (monospace-styled via `font.family-base` tabular numerals, copyable), `placedAt` (timestamp, see 10 § Dates), `items[]` (thumbnail strip, max 3 + "+N"), `total` (money, `text.heading-md`), `status` (order status Badge — tone map in table below), `paymentStatus` (embedded Payment Status, compact), `counterparty` (seller or buyer chip), `primaryAction?` (single Button, emphasis `secondary`; the card body links to Order Detail).

Order status → tone (enum per 09 § Orders): `created`=warning (awaiting payment) · `paid`=info · `in_fulfilment`=info · `delivered`=success (awaiting approval: warning for the buyer variant — action needed) · `completed`=success · `cancelled`=neutral. Dispute and refund are **not** order statuses — render a "Disputed" Badge (`danger`) from escrow stage `disputed`, and "Refunded" (`neutral`) from payment status `refunded`/`partially_refunded`.

**States.** `default` · `hover` (`shadow.md`, whole card links to detail) · `focus` (card ring) · `active` · `disabled` (n/a) · `loading` (Skeleton: number line, thumb strip, total) · `empty` (list-level Empty State: "No orders yet" — copy in 10) · `warning` (action required for the viewer: left border `color.warning` `border.4` + explicit action Button — e.g. buyer must approve delivery) · `error`/`disputed` (left border `color.danger`, "Disputed" Badge) · `success` (completed).

**Responsive.** Mobile: full-width; thumbnail strip and total on one row, status row below; primary action full-width Button size `lg` touch target. Tablet+: two-column internal grid (meta left, money/status right). Wide: unchanged; lists cap at `size.container-lg` for readable line length.

**Best practices.** One primary action maximum — everything else lives in Order Detail. The action shown must match the escrow stage (see Escrow Timeline). Show relative time ("2 days ago") with absolute on hover (10 § Dates).

**Common mistakes.** Duplicating the full escrow timeline inside a list card; two different statuses (order + payment) rendered with identical Badge prominence — order status leads, Payment Status is secondary; truncating the total.

---

## Invoice Card

**Purpose.** Reference to a financial document: invoice/receipt number, amount, issue/due dates, payment state, download.

**When to use.** Billing settings, Earnings & Payouts (seller), Admin Payments & Refunds, order detail "documents" section.

**When NOT to use.** As the invoice itself (that is a generated document/PDF); order summaries (Order Card).

**Variants.** `default` · `row` (table-row density for billing lists, `compact` density tokens).

**Properties.** `invoiceNumber` (copyable), `issuedAt`, `dueAt?` (overdue → tone `danger` text + Badge), `amount` (money), `status` (`draft`=neutral · `open`=info · `paid`=success · `overdue`=danger · `void`=neutral), `downloadAction` (icon Button, ghost — PDF), `payAction?` (open invoices, emphasis `primary`).

**States.** `default` · `hover` (row highlight `color.surface-alt`) · `focus` · `active` · `disabled` (void: content `opacity.disabled`, download stays enabled) · `loading` (download in-flight: spinner on icon Button only) · `empty` (list-level) · `error` (generation failed: tone `danger` inline message + retry) · `warning` (due within 3 days: `dueAt` in `color.warning`).

**Responsive.** Mobile: stacked card, number + amount prominent, dates on second line. Tablet+: `row` variant preferred inside Table.

**Best practices.** Amount and status are the visual anchors. Keep download one click, no dialog. Overdue is a Badge + date color, not a red card.

**Common mistakes.** Rendering invoice line items in the card (belongs to the document); "paid" in green *text only* without Badge/icon (fails 11's no-color-alone rule).

---

## Cart Summary

**Purpose.** Itemized list of cart contents with per-line controls and running totals — the source of truth the buyer edits before checkout.

**When to use.** Cart page/drawer, mini-cart popover (compact), first step of Checkout.

**When NOT to use.** Read-only recap at payment/confirm steps (Checkout Summary — no editing affordances there). Order history (Order Card).

**Variants.** `page` (full editing) · `drawer` (Right Drawer, same features, tighter density) · `mini` (popover: lines read-only, totals, "View cart" + "Checkout" CTAs).

**Properties.** `lines[]` — each: thumbnail (56px, `radius.sm`), title (links to listing), variant/options (`text.body-sm` `color.text-muted`), unit price, quantity Stepper, line total, remove (ghost icon Button); `subtotal`, `discounts[]` (code chip + amount, negative amounts prefixed −, tone `success` text), `shippingEstimate?`, `taxEstimate?`, `total` (money, `text.heading-md`), `cta` ("Proceed to checkout", emphasis `primary`, full-width in drawer/mobile), `note?` (multi-seller carts: lines grouped by seller with Seller chip headers — escrow is per-seller, see 05 § Escrow Flow).

**ASCII wireframe (`page` variant).**

```
┌──────────────────────────────────────────────────────────────┐
│ Cart (3 items)                                               │  text.heading-lg
├──────────────────────────────────────────────────────────────┤
│ ⊙ Atelier Norr                                               │  seller group header
│ ┌────┐ Walnut desk organizer          $84.00                 │
│ │ 🖼 │ Finish: Natural                [− 1 +]   $84.00   ✕   │  line: thumb · meta ·
│ └────┘                                                       │  stepper · total · remove
│ ┌────┐ Brass pen holder              $22.00                  │
│ │ 🖼 │                                [− 2 +]   $44.00   ✕   │
│ └────┘                                                       │
├──────────────────────────────────────────────────────────────┤
│ Subtotal                                          $128.00    │  text.body
│ Discount (WELCOME10)                              −$12.80    │  color.success
│ Shipping                               calculated at checkout│  color.text-muted
│ ─────────────────────────────────────────────────────────    │  border color.border
│ Total                                             $115.20    │  text.heading-md
│                                                              │
│ [        Proceed to checkout        ]                        │  primary, full-width
└──────────────────────────────────────────────────────────────┘
   totals right-aligned, tabular numerals · padding space.6 · row gap space.4
```

**States.** `default` · `hover` (line remove/stepper affordances at full opacity; rows highlight `color.surface-alt`) · `focus` (per-control) · `active` · `disabled` (checkout CTA disabled only when cart empty or a line is invalid — with reason text, see 10) · `loading` (quantity change: line total shows inline spinner, totals block shows Skeleton on the changed rows; never block the whole summary) · `empty` (Empty State: illustration + "Your cart is empty" + "Browse listings" CTA) · `error` (line-level: "No longer available" — line collapses to warning row with remove action; totals recompute) · `warning` (price changed since added: old→new price with tone `warning` note) · `success` (discount applied: chip + tone `success` confirmation Toast, see Feedback).

**Responsive.** Mobile: lines stack (thumb + title row, stepper + total row below); totals + CTA in a **sticky bottom bar** (`z.sticky`); drawer variant becomes full-screen sheet. Tablet: two-column page (lines left, totals card right, sticky at `space.6` from top). Desktop/Wide: same, totals column fixed 320–360px.

**Best practices.** Quantity changes recompute *server-side* (09) — optimistic UI allowed, but totals reconcile. Keep remove reversible via undo Toast. Show per-seller grouping whenever >1 seller — buyers must understand they're placing multiple escrow-protected sub-orders.

**Common mistakes.** Editing affordances at payment step; recomputing tax client-side; hiding the running total behind an accordion on mobile; truncating discounts or totals; removing a line with no undo path.

---

## Checkout Summary

**Purpose.** Read-only, authoritative recap of the order at payment/confirmation steps: items, shipping, price breakdown, escrow notice. What the buyer sees *at the moment of commitment*.

**When to use.** Payment and Confirm steps of Checkout (see 05 § Checkout); order confirmation screen (post-purchase, with order number).

**When NOT to use.** Anywhere the buyer can still edit lines (Cart Summary). Post-purchase history (Order Card).

**Variants.** `sidebar` (persistent right column, Desktop) · `collapsed` (mobile: header "Order summary · $115.20 ⌄" expands via Accordion) · `confirmation` (adds order number, Payment Status, "what happens next" escrow strip).

**Properties.** `lines[]` (read-only: thumb, title, qty ×, line total), `shippingMethod` + address preview (with "Change" link that returns to the shipping step — navigation, not inline editing), `breakdown` (subtotal / discount / shipping / tax / **total**), `escrowNotice` (info strip: "Payment is held in escrow until you approve delivery" — icon + `color.info` accent, copy in 10 § Escrow), `termsNote`, `cta` (Payment step: "Pay $115.20" — total *in* the button label, emphasis `primary`).

**ASCII wireframe (`sidebar` variant, Payment step).**

```
┌──────────────────────────────┐
│ Order summary                │  text.heading-md
├──────────────────────────────┤
│ 🖼 Walnut desk organizer ×1  │
│                     $84.00   │
│ 🖼 Brass pen holder      ×2  │
│                     $44.00   │
├──────────────────────────────┤
│ Ship to: 100 Main St, PDX    │
│ Standard · 3–5 days  [Change]│  link → shipping step
├──────────────────────────────┤
│ Subtotal          $128.00    │
│ Discount          −$12.80    │
│ Shipping            $8.00    │
│ Tax                 $9.22    │
│ ──────────────────────────   │
│ Total             $132.42    │  text.heading-md, never wraps digits
├──────────────────────────────┤
│ ⓘ Payment held in escrow     │  color.info strip, radius.md,
│   until you approve delivery │  bg color.surface-alt
├──────────────────────────────┤
│ [      Pay $132.42       ]   │  primary CTA
└──────────────────────────────┘
```

**States.** `default` · `hover`/`focus`/`active` (links + CTA only) · `disabled` (CTA while payment form invalid — reason adjacent) · `loading` (CTA loading during payment intent; summary itself never skeletons at this step — data is already committed) · `empty` (n/a — checkout unreachable with empty cart) · `error` (payment failure: Alert tone `danger` above CTA; summary unchanged; see 05 § Checkout for retry) · `success` (confirmation variant: tone `success` header + order number) · `warning` (inventory changed between steps: tone `warning` Alert, force return to cart).

**Responsive.** Mobile: `collapsed` variant pinned above the payment form; total always visible in the collapsed header; CTA in sticky bottom bar (`z.sticky`). Tablet: sidebar 320px. Desktop/Wide: sidebar 360px, sticky.

**Best practices.** The breakdown must match the charge to the minor unit — it is rendered from the server's priced order (09), never client math. Escrow notice appears at Payment, not buried in terms. Total appears in the CTA label.

**Common mistakes.** "Total" differing from the button amount; editable steppers sneaking into the recap; hiding tax until confirmation; separate currencies in one breakdown without explicit conversion note.

---

## Payment Status

**Purpose.** Canonical, compact indicator of where the money is. One vocabulary across buyer, seller, and admin surfaces — rendered as a Badge (+ optional detail line).

**When to use.** Order Card, Order Detail header, Invoice Card, payments tables, payout screens, webhooks-driven admin views.

**When NOT to use.** As a replacement for Escrow Timeline on Order Detail (the timeline explains *why*; this states *what*). For order fulfilment state (order status is separate — see Order Card).

**Canonical status set & tone mapping (binding for all products; payload enum in 09).**

| Status | Badge tone | Label (10 owns final copy) | Meaning |
|---|---|---|---|
| `pending` | `neutral` | Pending | Awaiting payment authorization |
| `processing` | `info` | Processing | Payment in flight at provider |
| `held` | `info` | Held in escrow | Captured; held pending delivery + approval |
| `released` | `success` | Released | Funds released to seller |
| `refunded` | `neutral` | Refunded | Fully returned to buyer (terminal, non-error) |
| `partially_refunded` | `warning` | Partially refunded | Split outcome; amount detail required |
| `failed` | `danger` | Failed | Authorization/capture failed; retry path required |

**Variants.** `badge` (Badge only) · `detailed` (Badge + secondary line: timestamp + amount, e.g. "Released · Jun 12 · $132.42") · `withAmount` (`partially_refunded` MUST use this: "Refunded $40.00 of $132.42").

**Properties.** `status` (enum above), `amount?`, `refundedAmount?`, `timestamp?`, `size` (`sm|md`).

**States.** This component *is* a state display; interactive states apply only when it links to payment detail (`hover` underline affordance, `focus` ring). `loading` = Skeleton chip. Never animate tone changes beyond a `motion.duration-fast` crossfade.

**Responsive.** No structural change; `detailed` collapses to `badge` + tooltip on Mobile where space-constrained (tooltip content duplicated in the detail screen — 11: no hover-only critical info).

**Best practices.** Use the enum verbatim — products must not invent statuses (extend via 09 governance). Pair `partially_refunded` with amounts always. `failed` must sit next to a retry or contact-support action.

**Common mistakes.** Mapping `held` to `warning` (holding is *normal*, not a problem — warning is reserved for "action needed"); free-text status strings; color-only dots without labels.

---

## Shipping Timeline

**Purpose.** Chronological fulfilment progress: ordered → shipped → in transit → out for delivery → delivered, with carrier events.

**When to use.** Order Detail (buyer + seller), tracking drawers, delivery notifications deep-link target.

**When NOT to use.** Money movement (Escrow Timeline). Non-shipping fulfilment (digital delivery: use a simplified two-step variant or plain status).

**Variants.** `full` (all carrier scan events, collapsible under the milestone steps) · `milestones` (5 canonical steps only) · `compact` (horizontal dots + current label, for cards).

**Properties.** `steps[]` (canonical milestones; each: label, timestamp?, location?, state `done|current|upcoming`), `carrier` + `trackingNumber` (copyable, external link), `events[]?` (raw scans, `text.body-sm` `color.text-muted`), `eta?` (prominent when in transit: "Arriving Thu, Jun 18").

**States.** Step-level: `done` (filled dot `color.success`, connector solid), `current` (dot `color.info` + subtle pulse ≤ `motion.duration-slow`, honoring reduced motion), `upcoming` (hollow dot `color.border-strong`, label `color.text-subtle`). Component-level: `loading` (skeleton steps) · `empty` (not yet shipped: milestones all upcoming + "Waiting for seller to ship") · `error` (tracking sync failed: tone `warning` inline note + manual carrier link — degraded, not broken) · `warning` (delivery exception: step injected with tone `warning` icon + carrier reason).

**Responsive.** Mobile: vertical timeline (dots left rail `space.6`, content right). Tablet+: vertical in drawers, horizontal `milestones` allowed in wide headers. `compact` everywhere in cards.

**Best practices.** Always show ETA when the carrier provides one; exceptions surface as warning steps with the carrier's reason verbatim. Keep escrow implications out of this component — link the two ("Delivered — approve to release payment" belongs to Escrow Timeline / Order Detail actions).

**Common mistakes.** Inventing scan events client-side; success-toning "out for delivery" (only *delivered* is success); horizontal timelines on mobile (labels collide).

---

## Escrow Timeline — flagship

**Purpose.** The authoritative visualization of the escrow lifecycle for one order: where the money is, who acted, who must act next, and how disputes branch. This is the trust centerpiece of Flexa Marketplace (flow contract: see 05 § Escrow Flow; events payload: 09 § escrow-events; copy: 10 § Escrow).

**When to use.** Order Detail (buyer and seller — same component, viewer-aware actions), Dispute Detail (admin, read-only with dispute branch expanded), post-purchase confirmation (`compact`).

**When NOT to use.** Lists (use Payment Status). Shipping progress (Shipping Timeline — they are siblings on Order Detail, never merged). Products without held payments (direct charge: show Payment Status only).

**Canonical stages.** Four happy-path stages + one branch:

| # | Stage id | Actor | Enters when | Tone while current |
|---|---|---|---|---|
| 1 | `payment_held` | Buyer (paid) / System (holds) | Payment captured | `info` |
| 2 | `delivered` | Seller | Seller marks fulfilled / tracking added | `info`; `warning` for the *seller* viewer while pending (action needed) |
| 3 | `approved` | Buyer | Delivery confirmed/ETA reached | `warning` for the *buyer* viewer while pending (action needed); `info` otherwise. Auto-approve countdown shown when policy applies ("Auto-releases in 5 days") |
| 4 | `released` | System / Buyer approval | Approval or auto-release | `success` (terminal) |
| ⑂ | `disputed` | Buyer or Seller opens; Admin resolves | Dispute opened at stage 2–3 | `danger` until resolved; resolution re-joins as `released` (full/partial to seller) or payment status `refunded` (see Payment Status) |

Tone mapping rule (binding): **info = in progress · success = completed/released · warning = action needed by the current viewer · danger = disputed.** The same order renders different warning placement for buyer vs seller — tone follows *whose action is pending*, the data does not change.

Each stage row carries: stage label · **actor label** (`Buyer`, `Seller`, `System`, `Admin` — never personal names in the actor slot; names appear in the detail line) · timestamp (absolute, ISO-sourced, formatted per 10 § Dates; pending stages show expected trigger instead) · optional detail line (amount held, tracking ref, approval note, dispute reason) · optional action Button for the viewer whose turn it is.

**Variants.** `full` (Order Detail: all stages + detail lines + actions) · `compact` (confirmation/drawers: dots + labels, no detail lines) · `dispute` (Dispute Detail: dispute branch expanded with its own sub-events — opened, evidence added, admin decision; sub-events use Activity Timeline rows, see collaboration.md).

**Properties.** `stages[]` (server-computed from escrow events — the client never derives stage state), `currentStage`, `viewer` (`buyer|seller|admin` — drives warning placement + action visibility), `amount` (held amount, shown at stage 1 and 4), `autoReleaseAt?`, `dispute?` (status, openedBy, reason, resolution), `actions[]` (viewer-legal actions only: Approve delivery · Open dispute · Add tracking · Release now (admin)).

**ASCII wireframe (`full`, buyer viewer, stage 3 current, auto-release pending).**

```
┌────────────────────────────────────────────────────────────────────┐
│ Escrow · $132.42 held                          [Held in escrow]    │  amount + Payment Status
├────────────────────────────────────────────────────────────────────┤
│  ●  Payment held                                                   │  done — color.success
│  │    Buyer · Jun 10, 2026 14:02                                   │  actor · timestamp
│  │    $132.42 captured and held by Flexa                           │  detail, text.body-sm
│  │                                                                 │
│  ●  Seller delivered                                               │  done — color.success
│  │    Seller · Jun 12, 2026 09:15                                  │
│  │    Tracking UPS 1Z…44 added → see Shipping Timeline             │  cross-link
│  │                                                                 │
│  ◉  Your approval needed                          ⚠ action needed  │  current — color.warning
│  │    Buyer · waiting since Jun 15                                 │  (viewer = buyer)
│  │    Auto-releases in 5 days (Jun 22) if no action                │  countdown, text.body-sm
│  │    [ Approve delivery ]   [ Open dispute ]                      │  primary · ghost/danger
│  │                                                                 │
│  ○  Funds released to seller                                       │  upcoming — text-subtle
│       System · after your approval                                 │
└────────────────────────────────────────────────────────────────────┘
  rail: dots 12px, connector border.2 color.border (solid=past, dashed=future)
  row padding space.4 · dispute branch, when open, forks after the stage
  it was raised at:  ├─ ⚠ Disputed — color.danger row + sub-events
```

Dispute branch rendering: a `danger`-toned fork row ("Dispute opened · Buyer · Jun 16 · Reason: item damaged") indented under the stage where it was raised; subsequent happy-path stages gray out (`color.text-subtle`, dashed connectors) until resolution, then the resolution row re-joins the main rail ("Resolved by Admin · partial refund $40.00 → see Payment Status").

**States.** `default` · `hover`/`focus`/`active` (action Buttons + cross-links only; rows are not clickable) · `disabled` (actions outside the viewer's turn are *absent*, not disabled — least-confusion rule; admin override actions may render disabled with permission tooltip) · `loading` (initial: skeleton rail; action in-flight: Button loading, stage rows frozen) · `empty` (n/a — escrow exists once payment holds; pre-payment orders show Payment Status `pending` instead) · `error` (event fetch failed: Alert tone `danger` + retry, never a fabricated timeline) · `warning` (approval window closing < 24h: countdown line escalates to `color.warning` text + icon) · `success` (stage 4 reached: terminal banner row, tone `success`).

**Responsive.** Mobile: vertical rail, actions become full-width Buttons stacked under the current stage, sticky bottom action bar when the viewer has a pending action (`z.sticky`). Tablet/Desktop: vertical rail in the Order Detail main column (never sidebar — this is primary content). Wide: unchanged; max text measure `size.container-md`.

**Best practices.** Timestamps on every completed stage, expectation text on every future stage — no bare labels. Actor labels answer "who did/does this", not "who is this person". Countdown for auto-release is always visible at stage 3 when policy applies. Dispute entry point lives here (and only here + Order Detail header) so escalation is discoverable exactly when relevant. Amounts shown in full at hold and release.

**Common mistakes.** Deriving stage from order status client-side (stages come from escrow events, 09); showing seller-only actions to buyers as disabled buttons; success-toning "seller delivered" *globally* (it is success as a completed step, but the component's overall tone is stage-3-warning for the buyer); collapsing the dispute branch into a status chip (the branch is the point); relative-only timestamps ("3 days ago" without absolute date) on a legal-ish money trail.

---

## Review Card

**Purpose.** Display a single review: rating, author, date, body, optional seller response and helpfulness controls.

**When to use.** Listing Detail reviews section, Seller Profile, buyer "my reviews", seller "respond to reviews" queue, admin moderation.

**When NOT to use.** Aggregate scores (Rating + Marketplace Statistics). Writing a review (that's a form pattern — see 05 § Review Flow).

**Variants.** `default` · `withResponse` (nested seller reply block, indented `space.6`, `color.surface-alt` background, "Response from {seller}" header) · `moderation` (admin: report reasons + approve/remove actions) · `compact` (rating + 2-line excerpt, "Read more" expands).

**Properties.** `rating` (Rating, read-only), `author` (avatar + display name + "Verified purchase" Badge tone `success` when applicable), `createdAt`, `body` (clamp 5 lines with expand), `photos[]?` (thumb strip, lightbox), `response?`, `helpfulCount` + vote action, `reported?` (moderation).

**States.** `default` · `hover` (helpful/actions affordance) · `focus` · `active` · `disabled` (own review pending moderation: `opacity.disabled` + "Pending review" Badge tone `neutral`) · `loading` (skeleton) · `empty` (section-level Empty State: "No reviews yet — be the first", copy 10) · `error` (removed by moderation: placeholder row "Review removed", `color.text-subtle`) · `warning` (reported, moderation variant).

**Responsive.** Mobile: photos scroll horizontally; response block full-bleed indent `space.4`. Desktop: photos grid ≤4.

**Best practices.** Verified-purchase Badge only from server truth. Seller responses visibly subordinate (nested, alt surface) — never visually peer to the review. Date always visible.

**Common mistakes.** Editable rating inside display card; hiding negative reviews behind extra clicks; letting response nesting recurse (one level only).

---

## Seller Card

**Purpose.** Seller identity + trust summary: avatar, name, rating, key stats, follow/contact actions.

**When to use.** Listing Detail ("about the seller"), hover popover from seller chips (Desktop), search results seller module, Messages header context.

**When NOT to use.** Full Seller Profile (screen, 08). Seller's own dashboard identity (that's account UI).

**Variants.** `default` (vertical card) · `inline` (horizontal strip for headers) · `popover` (hover card: `z.popover`, `shadow.lg`, Desktop only — content duplicated on tap-through for touch, 11).

**Properties.** `avatar` (Avatar `lg`), `name`, `verified?` (Badge tone `info`, icon + "Verified"), `rating` + review count, `stats` (member since · orders completed · response time — max 3, Description List style), `badges[]?` ("Top seller" tone `success`), `actions` (Contact → Chat; Follow — secondary/ghost).

**States.** `default` · `hover` (card link affordance) · `focus` · `active` · `disabled` (suspended seller, admin view: `opacity.disabled` + Badge tone `danger` "Suspended") · `loading` (skeleton) · `empty` (n/a) · `error` (load failure: name-only fallback) · `warning` (on-vacation: Badge tone `warning` "Away — replies may be slow").

**Responsive.** Mobile: `inline` variant preferred; popover disabled (tap navigates to profile). Desktop: popover on seller chips after 300ms hover intent.

**Best practices.** Response time and completed orders are the highest-signal trust stats — prefer them. Contact action always routes through platform Chat (never expose email).

**Common mistakes.** Overloading with 6+ stats; popover with interactive content that traps focus (see 11 § focus); showing "Verified" from self-reported data.

---

## Buyer Card

**Purpose.** Buyer identity summary for the *seller and admin* side: who placed the order, history signals, contact entry point.

**When to use.** Seller Order Detail ("buyer" panel), Admin User Detail header, dispute views.

**When NOT to use.** Public surfaces — buyer identity is never public (privacy; see 07 personas). Buyer's own account UI.

**Variants.** `default` · `inline` · `admin` (adds account status Badge, lifetime value, flags).

**Properties.** `avatar`, `displayName`, `memberSince`, `orderCount` (with this seller / platform-wide for admin), `contact` (→ Chat), `notes?` (admin), `accountStatus?` (admin: `active`=success · `restricted`=warning · `banned`=danger).

**States.** As Seller Card. `warning` (admin: flagged account) · `error` (deleted account: "Deleted user" placeholder, `color.text-subtle`, actions removed).

**Responsive.** Mobile: `inline` in order headers; full card in drawers.

**Best practices.** Show only order-relevant data to sellers (count with *this* seller, not platform-wide). Every admin-only field is variant-gated, not permission-hidden ad hoc.

**Common mistakes.** Leaking buyer email/address into the card (address belongs to the shipping block); rendering buyer rating (buyers are not rated in Flexa Marketplace — see 07).

---

## Marketplace Statistics

**Purpose.** Aggregate commerce KPIs — GMV, orders, active listings, conversion, disputes rate — as a composed band of Metric Cards with commerce-specific formatting.

**When to use.** Admin Dashboard, Seller Dashboard (scoped to own store), Reports & Analytics headers.

**When NOT to use.** Single ad-hoc numbers (Metric Card directly). Charts (Charts Container — this band links into it).

**Variants.** `admin` (platform-wide) · `seller` (own-store scope, payout-aware: adds "Pending payout" tied to escrow releases) · `compact` (4-up strip).

**Properties.** `metrics[]` — each: label, value (money via 10 § Money; counts with thin-space grouping), delta (vs previous period: arrow + %, tone `success` up / `danger` down — *inverted* for negative-good metrics like disputes rate: mark with `invertDelta`), period selector (shared, group-level), sparkline? (optional, `color.primary` stroke), drill-down link (→ report screen).

**States.** `default` · `hover` (card lift `shadow.md` when drillable) · `focus` · `active` · `disabled` (n/a) · `loading` (skeleton number blocks — never 0 as placeholder) · `empty` (new store: zeros allowed *with* onboarding hint line, copy 10) · `error` (per-metric: "—" + retry icon, other metrics unaffected) · `warning` (data freshness: "Updated 2h ago" note when stale beyond SLA).

**Responsive.** Mobile: 2-up grid, sparkline hidden, delta kept. Tablet: 2–3-up. Desktop: 4-up. Wide: 4–6-up within `size.container-xl`.

**Best practices.** Deltas always state the comparison period ("vs last 30 days"). Money KPIs follow the same never-truncate rule — abbreviate ("$1.2M") only with the exact value in tooltip *and* accessible text (11). Disputes rate uses `invertDelta`.

**Common mistakes.** Loading placeholder "0" (reads as real data); green/red deltas without direction arrows (color alone); mixing scopes (platform GMV on a seller dashboard).

---

## Cross-cutting rules (all 14 components)

- **Money display.** Formatting (symbol position, decimals, grouping, locale) is owned by 10 § Money; payload shape (minor units + `currency`) by 09. Components render tabular numerals, right-align amounts in columns, never truncate/ellipsize/round amounts, and always render the currency. Multi-currency contexts label every amount.
- **Status.** All statuses render through Badge with the tone table of their component; new statuses require a 09 enum change, not a local label.
- **Skeletons over spinners** for card-shaped loading; Button-level spinners for in-place actions.
- **Every card links somewhere** — a commerce card with no drill-down is a dead end; wire `href`/`onSelect` or justify its absence in the screen spec (08).
