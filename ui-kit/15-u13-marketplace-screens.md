# 15 — U13: Marketplace Workflow Screens (parallel build plan)

> Status: **BUILT ✅ (2026-07-19).** Executed exactly as planned: U13-0 infra
> (PR #288) → four parallel tracks in isolated worktrees (B #292 · C #291 ·
> D #290 · E #289, zero cross-track conflicts) → U13-Z integration (core search
> now reads the moderation store; the three §0 ripple loops are drift-locked by
> `packages/ui/mocks/integration.spec.ts`; gaps consolidated in doc 14 §11).
> Kept as the reference for how to parallelize screen work on this codebase.
> Read `README.md` (binding contract), doc 07 (flows), doc 08 (screen specs),
> doc 09 (API shapes) before writing code. Code/UI/commits: English.

## 0. Goal & thesis

U11 proved the kit composes the four flagship **buyer purchase** screens
(Search → Listing → Checkout → Order Detail) against the MSW mock backend with
zero one-off component CSS. U13 extends `/screens` into the **full marketplace
loop across three personas** — Buyer, Seller, Admin — proving the rest of the
inventory (U7 dashboards, U8 commerce, U9 collaboration, U10 admin & AI)
composes into real workflow screens.

The kicker: all personas share **one in-memory mock db** (session-scoped).
Actions ripple across screens within a session:

- Buyer pays (existing Checkout) → the order appears in **Seller › Fulfil** →
  seller marks shipped → **Buyer › Order Detail** timeline advances → buyer
  approves → escrow released → **Seller › Earnings** balance grows (flow B1→B2→S3→S6).
- Buyer opens a dispute (existing) → **Admin › Dispute Detail** resolves it →
  buyer's order updates (flow B3 + A2).
- Seller submits a listing (Listing Editor) → **Admin › Moderation** approves →
  it appears in **Search Results** (flow S2 + A1).

That ripple is the demo. Do not fake it with static fixtures where a db
mutation is cheap.

## 1. Current state (do not rebuild)

- Kitchen-sink shell: `apps/ui-kitchen-sink/src/App.tsx` — HashRouter, two
  surfaces (`/` workbench, `/screens/*`), one live ThemeBar
  (`[data-fx-theme="kitchen"]`), app-wide `FxToastRegion`.
- Screens (buyer purchase, doc 08 §2.2–2.5): `src/screens/{SearchResults,ListingDetail,Checkout,OrderDetail}.tsx`
  + `checkout/*`. These stay at their current routes.
- Mock backend: `packages/ui/mocks/` (`flexa-ui-kit/mocks` + `/mocks/browser`),
  handlers transcribed from doc 09 §2, deterministic fixtures (Crockford ULID
  minter, no `Math.random`/`Date.now`), coherence drift-lock `mocks.spec.ts`.
- Typed client: `src/screens/api.ts` (`api.get/post/patch/del`, Idempotency-Key).
- Page framing: token-based `ks-*` utilities in `screens/screens.css` only.

## 2. Slice map

| Slice | Owner | Content | Depends on |
|---|---|---|---|
| **U13-0 Infra** | ONE agent, lands first | Route-group + mocks seams, persona ScreensIndex, empty stubs for every track | — |
| **U13-B Buyer** | agent B | Buyer Dashboard §2.6 · Orders List §3.6 · Notifications §3.7 · Wallet & Payment Methods §3.9 · Write Review §3.8 (flow B4) | U13-0 |
| **U13-C Seller** | agent C | Seller Dashboard §2.8 · Listings (seller list) §3.12 · Listing Editor wizard §2.9 (flow S2) · Order Detail fulfil §2.10 (flow S3) · Earnings & Payouts §2.11 (flow S6) | U13-0 |
| **U13-D Admin** | agent D | Admin Dashboard §3.17 · Listings Moderation §2.14 (flow A1) · Disputes Queue §2.12 · Dispute Detail §2.13 (flow A2) | U13-0 |
| **U13-E Messages** | agent E | Messages §2.7 (+ seller side §3.27, flow B5): conversation list + chat pane on U9 Chat/ConversationList; MSW conversation fixtures (deferred since U9) | U13-0 |
| **U13-Z Integration** | ONE agent, lands last | Cross-persona smoke pass of the three ripple loops (§0), gap consolidation, roadmap/slice-log entries, public-repo mirror sync | B–E merged |

Tracks B–E are fully independent of each other: they create only files they
own (§5) and fill stubs U13-0 created. Any merge order works.

## 3. U13-0 Infra spec (the seam — build exactly this)

**Mocks (`packages/ui/mocks/`).** Keep the published surface
(`flexa-ui-kit/mocks`, `/mocks/browser`) unchanged.

1. `db.ts` NEW — move the `Db` interface, `seed()`, module `db`, `resetDb()`
   and cart recompute out of `handlers.ts`. Add a reset-hook registry so tracks
   never edit this file again:
   ```ts
   const resetHooks: Array<() => void> = [];
   export function registerReset(fn: () => void): void { resetHooks.push(fn); }
   export function resetDb(): void { db = seed(); for (const fn of resetHooks) fn(); }
   ```
   Tracks keep their own module-scoped mutable state and call
   `registerReset(...)` at module top level.
2. `handlers.core.ts` NEW — the current handler array moves here verbatim
   (imports from `db.ts`).
3. `handlers.buyer.ts` / `handlers.seller.ts` / `handlers.admin.ts` /
   `handlers.messages.ts` NEW stubs — each `export const <track>Handlers: HttpHandler[] = [];`
4. `handlers.ts` becomes the barrel:
   `export const handlers = [...coreHandlers, ...buyerHandlers, ...sellerHandlers, ...adminHandlers, ...messagesHandlers];`
   re-export `resetDb` from `db.ts`.
5. `data.buyer.ts` / `data.seller.ts` / `data.admin.ts` / `data.messages.ts`
   NEW empty stubs (`export {}` placeholder comment); `index.ts` adds
   `export * from './data.<track>'` for all four **now** (so tracks never touch
   the barrel).
6. `moderation.ts` NEW — the one neutral cross-persona store (pending-listing
   queue): `pendingListings: PendingListing[]` + `submitListing` /
   `approveListing` / `rejectListing` mutators + `registerReset` wiring. Ships
   with types + empty store only; Track C writes into it (Listing Editor
   submit), Track D reads/mutates it (Moderation queue). This is the ONLY
   sanctioned cross-track state besides `db.ts`.
7. `tsconfig.mocks.json` already compiles the whole `mocks/` dir — verify new
   files land in `dist/mocks/` and the artifact spec still passes.

**Kitchen-sink (`apps/ui-kitchen-sink/src/screens/`).**

8. Per-track route modules NEW: `buyer/routes.tsx`, `seller/routes.tsx`,
   `admin/routes.tsx`, `messages/routes.tsx`. Each exports:
   ```tsx
   export interface ScreenLink { to: string; title: string; doc: string; blurb: string }
   export const buyerLinks: ScreenLink[] = [];
   export function BuyerRoutes() { return <Routes>{/* track fills */}</Routes>; }
   ```
   (`ScreenLink` + `TrackPlaceholder` live once in `src/screens/shared.tsx`,
   infra-owned, so track modules avoid a runtime import cycle with the index.)
9. `App.tsx` — wire once, never touched again:
   ```tsx
   <Route path="buyer/*" element={<BuyerRoutes />} />
   <Route path="seller/*" element={<SellerRoutes />} />
   <Route path="admin/*" element={<AdminRoutes />} />
   <Route path="messages/*" element={<MessagesRoutes />} />
   ```
   Existing four routes stay put.
10. `ScreensIndex.tsx` — regroup into persona sections: **Buyer** (the existing
   four links + `buyerLinks`), **Seller** (`sellerLinks`), **Admin**
   (`adminLinks`), **Messages** (`messagesLinks`). Add a short "Workflow tours"
   intro block describing the three ripple loops from §0 (copy only, no logic).

DoD U13-0: typecheck + `pnpm --filter flexa-ui-kit test` + kitchen-sink
`vite build` green; mock surface byte-compatible (same endpoints respond);
empty persona sections render.

## 4. Track specs

Common to every track (binding):

- **Screens are compositions, not components.** Zero one-off component CSS —
  every visual is a flexa-ui component; page framing only via existing `ks-*`
  utilities or new ones added to `screens/screens.css`? **No** — `screens.css`
  is shared; if you need a new framing utility, put a `<track>.css` file in
  your own directory and import it from your routes module. Token-based
  (`var(--fx-*)`) only, no hex/px literals beyond the existing allowlist.
- Component doesn't fit? Use the **closest** component and log the gap (§6) —
  never patch with CSS, never fork the component.
- Every screen file header cites its doc 08 § and doc 07 flow. Every handler
  cites its doc 09 §.
- Endpoints/fixtures: only in **your** `handlers.<track>.ts` /
  `data.<track>.ts`. Read (import) freely from `data.ts` (LISTINGS, ORDERS,
  STORES, WALLET, `usd`, `page`, …) and mutate the shared `db` from `db.ts` —
  that's how the ripple works. Deterministic: `ulid()` from `mocks/ids`, fixed
  ISO timestamps, no `Math.random`/`Date.now` in fixtures.
- Escrow/payment/order states must be legal pairs per doc 07 §0.3. Money =
  integer minor units.
- Add `mocks/<track>.spec.ts` covering your fixtures' coherence (mirror
  `mocks.spec.ts` style). Do not edit `mocks.spec.ts`.
- Loading = skeletons, failure = Inline Error + retry, empty = Empty/Blank
  State — same trio U11 used. All copy per doc 10 voice.

### U13-B — Buyer

Routes under `/screens/buyer/*`:

| Route | Screen | Spec | Notes |
|---|---|---|---|
| `/screens/buyer` | Buyer Dashboard | 08 §2.6 | Stat cards (orders in escrow, awaiting approval, unread messages), recent orders (Order Cards → existing order route), notifications preview. U7 dashboard components. |
| `/screens/buyer/orders` | Orders List | 08 §3.6 | Filterable table/list over `GET /orders` (exists); status Tags, escrow stage chips; row → `/screens/orders/:id`. |
| `/screens/buyer/notifications` | Notifications | 08 §3.7 | Notification Center full-page list; mark-read mutates track state (registerReset). |
| `/screens/buyer/wallet` | Wallet & Payment Methods | 08 §3.9 | `GET /wallet` + `/me/payment-methods` (exist); transactions list fixture NEW; add/remove method (mock POST/DELETE). |
| `/screens/buyer/reviews` | Reviews (write/manage) | 08 §3.8, flow B4 | Write review for a completed order (rating + text → POST NEW); list own reviews. Link from Order Detail's existing review CTA if trivial (OrderDetail.tsx is otherwise owned by no track — small link-only edit allowed). |

New endpoints (all in `handlers.buyer.ts`): notifications list/mark-read,
wallet transactions, payment-method create/delete, reviews create/list-mine.

### U13-C — Seller

Routes under `/screens/seller/*`:

| Route | Screen | Spec | Notes |
|---|---|---|---|
| `/screens/seller` | Seller Dashboard | 08 §2.8 | Sales stats, orders needing fulfilment (from shared `db.orders` where `status='paid'`), listing health, latest reviews. |
| `/screens/seller/listings` | Listings (seller list) | 08 §3.12 | Owner Listing Cards (`status`/`updatedAt` — the U11 gap becomes the feature), moderation status Badges, row actions. |
| `/screens/seller/listings/new` (+`/:id/edit`) | Listing Editor | 08 §2.9, flow S2 | Create wizard (details → media → pricing/shipping → review) on FxFormWizard; submit → POST NEW listing with `moderation: 'pending'` into shared state so Admin Moderation sees it; approved → appears in `/v1/search` (core handler reads `SEARCH_CARDS` — expose an append seam via your own module + have your handler push into a mutable copy; if the core search handler can't see it without edits, log as an integration item for U13-Z rather than editing `handlers.core.ts`). |
| `/screens/seller/orders/:id` | Order Detail (fulfil) | 08 §2.10, flow S3 | Seller view of a shared order: mark-shipped Dialog (carrier + tracking) → POST NEW mutates `db.orders` (`paid`→`shipped`, escrow event appended) → buyer Order Detail reflects it; mark-delivered (mock shortcut button) advances to `delivered` so the buyer approve flow becomes reachable in-session. |
| `/screens/seller/earnings` | Earnings & Payouts | 08 §2.11, flow S6 | Available/pending balance derived from released escrows in `db.orders`; payout request → POST NEW with processing state; payout history fixture. |

### U13-D — Admin

Routes under `/screens/admin/*`:

| Route | Screen | Spec | Notes |
|---|---|---|---|
| `/screens/admin` | Admin Dashboard | 08 §3.17 | Queue depth stat cards (pending moderation, open disputes), recent audit entries. U10 components. |
| `/screens/admin/moderation` | Listings Moderation | 08 §2.14, flow A1 | Data Management Toolbar + queue table of `moderation:'pending'` listings from the shared `mocks/moderation.ts` store (§3 item 6 — Track C submits into it, this track consumes it; direct cross-track imports stay forbidden). Approve/Reject via Approve-Reject Panel (reject requires reason) → audit entry appended. |
| `/screens/admin/disputes` | Disputes Queue | 08 §2.12 | Table of disputes (open ones come from shared `db` — buyer's open-dispute POST already flips escrow to `disputed`; your handlers surface them), SLA countdown, priority sort. |
| `/screens/admin/disputes/:id` | Dispute Detail | 08 §2.13, flow A2 | Evidence panes (buyer/seller), order + escrow summary, resolve actions (refund buyer / release seller / partial) → mutates `db.orders` escrow accordingly → buyer Order Detail reflects resolution; audit log entry. |

### U13-E — Messages

Route `/screens/messages/*`:

| Route | Screen | Spec | Notes |
|---|---|---|---|
| `/screens/messages` (+`/:conversationId`) | Messages | 08 §2.7 + §3.27, flow B5 | Two-pane: U9 Conversation List + Chat pane (bubbles, day separators, system event cards for order milestones, typing indicator, attachment card fixture). A segmented "View as: Buyer / Seller" control flips `data-self` on the SAME conversation — the two-sides demo. Composer POST appends to conversation state (registerReset); locked-conversation banner on a disputed order's thread. |

Conversation fixtures reference real ids from `data.ts` (orders/listings/
stores) so system event cards deep-link to real screens. This closes the
"MSW conversation fixtures deferred" note from U9/U11.

## 5. File-ownership matrix (conflict-free by construction)

| Path | U13-0 | B | C | D | E |
|---|---|---|---|---|---|
| `mocks/db.ts`, `handlers.ts`, `handlers.core.ts`, `index.ts`, `moderation.ts` | create/edit | read-only | read-only | read-only | read-only |
| `mocks/handlers.<t>.ts`, `data.<t>.ts`, `<t>.spec.ts` | create stubs | own buyer | own seller | own admin | own messages |
| `src/App.tsx`, `ScreensIndex.tsx`, `screens.css`, `api.ts` | edit once | ❌ | ❌ | ❌ | ❌ |
| `src/screens/<t>/**` | create stub routes.tsx | own buyer/ | own seller/ | own admin/ | own messages/ |
| `src/screens/{SearchResults,ListingDetail,Checkout,OrderDetail}.tsx` | — | link-only edits (B: OrderDetail review link) | ❌ | ❌ | link-only (E: contact-seller entry on ListingDetail, optional) |
| `mocks/mocks.spec.ts`, `data.ts`, `ids.ts`, `browser.ts` | ❌ | ❌ | ❌ | ❌ | ❌ |
| roadmap 13 / slice-log / this doc | — | ❌ (log in PR desc) | ❌ | ❌ | ❌ (U13-Z writes) |

Never import from another track's module. Shared mutable state lives only in
`db.ts` (orders/cart) and `moderation.ts` (pending listings). If two tracks
seem to need a new shared module, stop and escalate — that's a U13-0 follow-up,
not a track edit.

## 6. Component-gap protocol

Same as U11: use the closest component, never CSS-patch. Record each gap as a
`GAPS:` block comment at the top of your `routes.tsx` **and** in the PR
description (component, missing prop/behavior, what you did instead). U13-Z
consolidates all gaps into doc 14 for future component slices.

## 7. Branches, PRs, gates

- Branch off main: `feat/ui-kit-u13-infra` → PR first.
- Tracks: `feat/ui-kit-u13-{buyer,seller,admin,messages}` branched **off the
  infra branch**, PRs stacked on it; retarget main after infra merges.
- Integration: `feat/ui-kit-u13-integration` after B–E merge.
- Gates per PR (all must be green): repo `pnpm typecheck` ·
  `pnpm exec vitest run packages/ui` from the repo root (there is NO per-package
  test script; this runs all ui + mocks specs incl. your new one) ·
  `pnpm --filter @flexa/ui-kitchen-sink build` ·
  `pnpm --filter @flexa/fds-docs build` (docs embed the workbench) ·
  zero engine/PHP/core changes · no edits outside your ownership column.
- Commit trailer per repo convention.

## 8. U13-Z Integration slice

1. Manually drive the three §0 loops in one session; fix ripple breaks (this
   is the only slice allowed to touch `handlers.core.ts`, e.g. making search
   read approved listings from `moderation.ts`).
2. Consolidate GAPS into doc 14; write roadmap 13 U13 entry + slice-log.
3. Mirror sync to `flexa-design-system-public` (packages/ui + apps/ui-kitchen-sink),
   one PR — Vercel auto-deploys fds.sitebefy.com/kitchen-sink/ (the fds-docs
   build script is self-contained; no workflow edits needed).

## 9. Agent prompt template (per track)

> You are building slice **U13-<X>** of the Flexa UI kitchen-sink. Read, in
> order: `ui-kit/15-u13-marketplace-screens.md` (this plan — your track spec
> §4, ownership matrix §5, gap protocol §6, gates §7), `ui-kit/README.md`,
> doc 08 sections for your screens, doc 07 flows, doc 09 for endpoint shapes,
> then skim `apps/ui-kitchen-sink/src/screens/OrderDetail.tsx` and
> `packages/ui/mocks/handlers.core.ts` as style references. Build every screen
> in your track end-to-end against the mock backend. You may only create/edit
> files in your ownership column. Zero one-off component CSS; log gaps per §6.
> Work on branch `feat/ui-kit-u13-<track>` off `feat/ui-kit-u13-infra`; finish
> with all §7 gates green and open a stacked PR.
