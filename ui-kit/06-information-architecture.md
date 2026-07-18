# 06 — Flexa Information Architecture

> **Owns:** screen structure, navigation model, URL scheme, per-persona sitemaps, search architecture, notification taxonomy.
> **Does not own:** per-screen internals (see 08), the UX patterns flows instantiate (see 05), endpoint detail (see 09), component contracts (see 04).
> Reference product: **Flexa Marketplace**. §10 maps the same skeleton onto Flexa Booking and Flexa CRM.

---

## 1. IA principles

### 1.1 Role-scoped workspaces

Buyer, Seller, and Admin each get a **separate application shell** with its own sidebar, dashboard, and URL prefix. A workspace never mixes another role's objects into its navigation.

- **Why:** the mental model of "my purchases" and "my store" are different jobs. Mixing them produces mega-menus and permission leaks.
- **Dual-role users** (a Buyer who is also a Seller) switch workspaces through the **account menu** (§3.5). The switch is a full navigation (`/account/...` ↔ `/seller/...`), never an in-place mode toggle. Current workspace is always inferable from the URL prefix.
- **Admin** is reachable only via `/admin` and never appears in Buyer/Seller navigation. Support staff are Admins with restricted roles (permission vocabulary: 08 §1.2; auth scopes: 09 §1; Permission Matrix component: 02-ui-kit/admin.md § Permission Matrix); their sidebar hides sections their role cannot read.
- The **public site** (Guest) is not a workspace — it is the storefront every persona can browse. Signed-in users see the public site with their account menu present.

### 1.2 Object-oriented IA

Listings, orders, disputes, conversations, users, and payouts are **first-class objects**: each has one canonical URL, one detail screen, and appears in lists/queues that link to it. Navigation is organized around objects, not tasks.

- One object = one canonical URL (§5). Emails, notifications, webhooks, and search results all deep-link to the same URL.
- The same underlying order object has **two projections** — buyer's Order Detail (with Escrow Timeline) at `/account/orders/{id}` and seller's Order Detail (fulfil) at `/seller/orders/{id}`. Projection is chosen by workspace, never by query param.
- Tasks (checkout, onboarding, dispute filing) are **flows over objects** (see 07); when a flow completes it lands on the object's canonical URL.

### 1.3 Shallow depth (≤ 3 levels)

No screen sits more than three levels below its workspace root:

```
Level 0   workspace root        /seller
Level 1   section (sidebar)     /seller/orders
Level 2   object                /seller/orders/{id}
Level 3   object sub-view (tab) /seller/orders/{id}?tab=messages
```

Sub-views beyond level 2 are **Tabs or a Right Drawer**, never new URL path segments. If a section seems to need a 4th level, it is a new sidebar item or a new object type.

### 1.4 Everything deep-linkable

Every screen state a user can reach by clicking must be reachable by URL:

- Filters, sort, active tab, pagination cursor → query params (§5.4).
- Modal Layout and Right Drawer content that represents an object (e.g. quick-view) must have a canonical full-page fallback URL.
- Auth-walled URLs round-trip through Sign In with `?next=` and return to the exact URL (see 07 § G3).
- Unknown/forbidden URLs render Error Page (404/403) inside the correct shell — never a blank redirect to home.

---

## 2. Navigation model

### 2.1 Layout per workspace

| Workspace | Shell | Primary nav | Mobile |
|---|---|---|---|
| Public (Guest / any signed-in user browsing) | Top Navigation Layout | Top Navigation + Search Bar | Top bar collapses; Bottom Navigation (Mobile) for signed-in personas |
| Buyer (`/account`) | App Shell + Sidebar Layout | Sidebar | Bottom Navigation (Mobile) + "More" sheet |
| Seller (`/seller`) | App Shell + Sidebar Layout | Sidebar | Bottom Navigation (Mobile) + "More" sheet |
| Admin (`/admin`) | App Shell + Sidebar Layout (dense) | Sidebar (grouped) | Sidebar as drawer; no Bottom Navigation — admin is desktop-first |
| Auth screens | Authentication Layout | none | same |
| Checkout, Seller Onboarding Wizard, Listing Editor (create) | Wizard Layout (escape returns to origin) | Wizard progress header only — sidebar/top-nav suppressed | same, full-screen steps |

Layout anatomy and responsive behavior are owned by `02-ui-kit/` (layouts). This table only assigns them.

### 2.2 Sidebar contents — Buyer (`/account`)

| Group | Item | Icon | Badge | Route |
|---|---|---|---|---|
| — | Buyer Dashboard | `home` | — | `/account` |
| Shopping | Orders List | `package` | count: orders awaiting my action (approve delivery, respond to dispute) | `/account/orders` |
| Shopping | Reviews (write/manage) | `star` | count: completed orders pending review | `/account/reviews` |
| Communication | Messages | `chat` | count: unread conversations | `/account/messages` |
| Communication | Notifications | `bell` | count: unread notifications | `/account/notifications` |
| Money | Wallet & Payment Methods | `wallet` | — | `/account/wallet` |
| — | Account Settings (Profile / Security / Notifications) | `settings` | — | `/account/settings` |

Footer of sidebar: link "Become a seller" (if no seller account) or "Switch to selling" (if dual-role).

### 2.3 Sidebar contents — Seller (`/seller`)

| Group | Item | Icon | Badge | Route |
|---|---|---|---|---|
| — | Seller Dashboard | `home` | — | `/seller` |
| Sales | Orders List | `package` | count: **needs action** (new, awaiting delivery, disputed) | `/seller/orders` |
| Sales | Listings (list) | `grid` | dot: any listing `rejected` or `changes_requested` | `/seller/listings` |
| Communication | Messages | `chat` | count: unread conversations | `/seller/messages` |
| Money | Earnings & Payouts | `bank` | dot: payout action required (e.g. failed payout, KYC) | `/seller/earnings` |
| Insights | Analytics | `chart` | — | `/seller/analytics` |
| Insights | Reviews (respond) | `star` | count: reviews without a seller response | `/seller/reviews` |
| — | Store Settings | `settings` | — | `/seller/settings` |

Footer of sidebar: "Switch to buying" → `/account`. Suspended sellers see the shell read-only with a Warning Banner (see 08).

### 2.4 Sidebar contents — Admin (`/admin`)

| Group | Item | Icon | Badge | Route |
|---|---|---|---|---|
| — | Admin Dashboard | `home` | — | `/admin` |
| Marketplace | Users | `users` | — | `/admin/users` |
| Marketplace | Listings Moderation | `shield-check` | count: pending moderation queue | `/admin/listings` |
| Marketplace | Orders | `package` | — | `/admin/orders` |
| Marketplace | Categories & Attributes | `tag` | — | `/admin/categories` |
| Trust & Money | Disputes Queue | `scale` | count: open disputes unassigned/awaiting admin | `/admin/disputes` |
| Trust & Money | Payments & Refunds | `card` | dot: failed payments/refunds needing review | `/admin/payments` |
| Insights | Reports & Analytics | `chart` | — | `/admin/reports` |
| System | Audit Log | `history` | — | `/admin/audit-log` |
| System | Queue Monitor | `activity` | dot: failed jobs > 0 | `/admin/queues` |
| System | System Settings | `settings` | — | `/admin/settings` |

Admin sidebar uses group headers rendered; Buyer/Seller groups are visual spacing only (small inventories don't need labels).

### 2.5 Top Navigation — Public

`Logo · Category menu · Search Bar (center, global listing search) · [Guest: Sign In / Sign Up] [Signed-in: Notifications bell · Messages icon · Account menu avatar]`. Cart icon appears when the cart is non-empty. See 08 § Home for internals.

### 2.6 Bottom Navigation (Mobile) mapping

Max 5 slots; last slot is always **More**, which opens a sheet containing every remaining sidebar item (same labels/icons/badges).

| Persona | Slot 1 | Slot 2 | Slot 3 | Slot 4 | Slot 5 |
|---|---|---|---|---|---|
| Guest (public) | Home | Search Results (`/search`) | Sign In | — | — |
| Signed-in on public site | Home | Search | Messages ● | Notifications ● | Account (menu sheet) |
| Buyer workspace | Buyer Dashboard | Orders ● | Messages ● | Notifications ● | More (Reviews, Wallet, Settings) |
| Seller workspace | Seller Dashboard | Orders ● | Listings | Messages ● | More (Earnings, Analytics, Reviews, Settings) |
| Admin | — (sidebar becomes drawer; no bottom nav) | | | | |

● = badge-capable slot (§7). Badge counts are identical to the sidebar's — one source (§7.3).

### 2.7 Account menu (avatar, top-right in every shell)

Ordered contents; items render only when applicable:

1. Identity header — avatar, display name, email (non-interactive)
2. **Workspace switcher** — "Buying" → `/account`, "Selling" → `/seller`, "Admin" → `/admin` (current one checked; only roles the user holds)
3. Account Settings (Profile / Security / Notifications) → `/account/settings`
4. "Become a seller" → Seller Onboarding Wizard (only if user has no seller account)
5. Theme: Light / Dark / System (`data-fx-scheme`, see 01 §3)
6. Help & support
7. Sign out

### 2.8 Notification entry point

- Bell icon in every shell header (public Top Navigation + all App Shell headers) with unread-count badge.
- Click → Notification Center popover (Desktop/Tablet) or full Notifications screen (Mobile).
- "See all" in the popover → Notifications screen (`/account/notifications` — one inbox per user across workspaces; workspace-relevant items deep-link into the right workspace, §7).

---

## 3. Sitemaps per persona

Screen names are the canonical inventory (README) — verbatim.

### 3.1 Guest / Public

```
/                               Home
├── /search                     Search Results
├── /listings/{slug}            Listing Detail
│   └── ?tab=reviews|details    (tabs, same screen)
├── /sellers/{handle}           Seller Profile (public)
├── /auth/sign-in               Sign In
├── /auth/sign-up               Sign Up
├── /auth/forgot-password       Forgot Password
└── /auth/verify-email          Email Verification
```

### 3.2 Buyer

```
/account                        Buyer Dashboard
├── /account/orders             Orders List
│   └── /account/orders/{id}    Order Detail (with Escrow Timeline)
│       └── ?tab=timeline|messages|dispute|invoice
├── /checkout                   Checkout (Cart → Payment → Confirm)   [Wizard Layout; steps ?step=cart|details|payment|review]
├── /account/messages           Messages
│   └── /account/messages/{conversationId}      (Split View: list + thread)
├── /account/notifications      Notifications
├── /account/reviews            Reviews (write/manage)
│   └── ?tab=pending|published
├── /account/wallet             Wallet & Payment Methods
│   └── ?tab=balance|methods|transactions
└── /account/settings           Account Settings (Profile / Security / Notifications)
    └── /account/settings/{section}   section = profile|security|notifications
```

### 3.3 Seller

```
/seller                         Seller Dashboard
├── /seller/onboarding          Seller Onboarding Wizard   [Wizard Layout; ?step=account|store|payout|first-listing]
├── /seller/listings            Listings (list)
│   ├── /seller/listings/new    Listing Editor (create wizard)
│   └── /seller/listings/{id}/edit    Listing Editor (edit)
├── /seller/orders              Orders List
│   └── /seller/orders/{id}     Order Detail (fulfil)
│       └── ?tab=fulfilment|messages|dispute
├── /seller/earnings            Earnings & Payouts
│   └── ?tab=overview|payouts|statements
├── /seller/analytics           Analytics
├── /seller/reviews             Reviews (respond)
├── /seller/messages            Messages
│   └── /seller/messages/{conversationId}
└── /seller/settings            Store Settings
    └── /seller/settings/{section}   section = store|shipping|policies|team
```

### 3.4 Admin

```
/admin                          Admin Dashboard
├── /admin/users                Users
│   └── /admin/users/{id}       User Detail
│       └── ?tab=profile|orders|listings|activity
├── /admin/listings             Listings Moderation
│   └── ?tab=pending|flagged|rejected   (+ Right Drawer review; full fallback /admin/listings/{id})
├── /admin/orders               Orders
│   └── /admin/orders/{id}      (admin projection of Order Detail)
├── /admin/disputes             Disputes Queue
│   └── /admin/disputes/{id}    Dispute Detail
├── /admin/payments             Payments & Refunds
│   └── ?tab=payments|refunds|payouts
├── /admin/categories           Categories & Attributes
├── /admin/reports              Reports & Analytics
├── /admin/audit-log            Audit Log
├── /admin/queues               Queue Monitor
└── /admin/settings             System Settings
```

---

## 4. Screen → Layout mapping

Every canonical screen and the layout it instantiates (layouts owned by `02-ui-kit/`).

| Screen | Layout | Notes |
|---|---|---|
| Home | Top Navigation Layout | hero + Listing Card grids |
| Search Results | Top Navigation Layout | filter rail; Advanced Filters in sheet on Mobile |
| Listing Detail | Top Navigation Layout | Content Area two-column; sticky purchase card |
| Seller Profile (public) | Top Navigation Layout | |
| Sign In / Sign Up / Forgot Password / Email Verification | Authentication Layout | centered card |
| Buyer Dashboard | App Shell + Dashboard Layout | Metric Card row + Activity Feed |
| Checkout (Cart → Payment → Confirm) | Wizard Layout | Checkout Summary rail on Desktop |
| Orders List (buyer & seller) | App Shell + Content Area | Table Desktop → Order Card list Mobile |
| Order Detail (with Escrow Timeline) | App Shell + Content Area | Escrow Timeline primary; Tabs for sub-views |
| Order Detail (fulfil) | App Shell + Content Area | seller projection; action bar |
| Messages (buyer & seller) | App Shell + Split View | Conversation List + Chat; Mobile: list → thread push |
| Notifications | App Shell + Content Area | Notification Center full-page |
| Reviews (write/manage) | App Shell + Content Area | |
| Wallet & Payment Methods | App Shell + Settings Layout | tabbed |
| Account Settings (Profile / Security / Notifications) | App Shell + Settings Layout | section nav |
| Seller Onboarding Wizard | Wizard Layout | resumable (§5.4) |
| Seller Dashboard | App Shell + Dashboard Layout | |
| Listings (list) | App Shell + Content Area | Data Management Toolbar |
| Listing Editor (create wizard / edit) | Wizard Layout (create) / App Shell + Content Area (edit) | edit = tabbed form, same sections as wizard steps |
| Earnings & Payouts | App Shell + Content Area | Statistic Block row + Table |
| Reviews (respond) | App Shell + Content Area | |
| Analytics | App Shell + Dashboard Layout | Charts Container grid |
| Store Settings | App Shell + Settings Layout | |
| Admin Dashboard | App Shell + Dashboard Layout | dense |
| Users | App Shell + Content Area | Virtual Table + Advanced Filters |
| User Detail | App Shell + Content Area | Tabs |
| Listings Moderation | App Shell + Content Area + Right Drawer | queue + drawer review |
| Orders (admin) | App Shell + Content Area | |
| Disputes Queue | App Shell + Content Area | queue semantics (see 05 § Approval Flow) |
| Dispute Detail | App Shell + Split View | evidence (both sides) + decision panel |
| Payments & Refunds | App Shell + Content Area | |
| Categories & Attributes | App Shell + Content Area | Tree + detail |
| Reports & Analytics | App Shell + Dashboard Layout | |
| Audit Log | App Shell + Content Area | Audit Log component full-page |
| System Settings | App Shell + Settings Layout | |
| Queue Monitor | App Shell + Content Area | Queue Monitor + Background Jobs Panel |
| any 404 / 403 / 500 | Error Page inside current shell | Blank State Layout when shell unknown |

---

## 5. URL scheme

### 5.1 Principles

- Lowercase kebab-case paths. Resource segments plural, mirroring API resources (see 09) — `/account/orders/{id}` ↔ `GET /v1/orders/{id}`.
- Public objects use **human-readable slugs/handles** (`/listings/{slug}`, `/sellers/{handle}`); workspace objects use ids. Slugs may change — the server 301s old slugs to current.
- Workspace prefix is the role contract: `/account/*` Buyer · `/seller/*` Seller · `/admin/*` Admin · everything else public. Route guards live at the prefix.

### 5.2 Canonical routes (summary)

| Area | Pattern | Examples |
|---|---|---|
| Public | `/`, `/search`, `/listings/{slug}`, `/sellers/{handle}` | `/listings/hand-carved-oak-desk` |
| Auth | `/auth/{screen}` | `/auth/sign-in?next=/account/orders/ord_123` |
| Checkout | `/checkout?step={cart\|details\|payment\|review}` | order confirmed → redirect `/account/orders/{id}` |
| Buyer | `/account`, `/account/{section}`, `/account/{section}/{id}` | `/account/orders/ord_123?tab=timeline` |
| Seller | `/seller`, `/seller/{section}`, `/seller/{section}/{id}[/edit]` | `/seller/listings/lst_42/edit` |
| Admin | `/admin`, `/admin/{section}`, `/admin/{section}/{id}` | `/admin/disputes/dsp_7` |

### 5.3 Canonical query params

| Param | Meaning | Rules |
|---|---|---|
| `q` | search/filter text | URL-encoded; empty = absent |
| `sort` | sort key, `-` prefix for desc | `?sort=-createdAt`; one value; default omitted |
| `cursor` | pagination cursor | opaque (see 09 pagination); never `page=` numbers |
| `tab` | active tab on a detail screen | value = tab id; default tab omitted from URL |
| `step` | wizard step | wizard screens only |
| `filter[...]` | structured filters | `?filter[status]=held&filter[category]=furniture`; repeatable |
| `next` | post-auth return URL | auth screens only; same-origin paths only |

**Rules:** state that changes what data is shown lives in the URL (filters, tab, sort, cursor, search text). State that is ephemeral UI (drawer open, hover, selection for bulk actions) does not. Changing filters resets `cursor`. Back/forward must restore list state from the URL alone.

### 5.4 Wizard resumability

Wizard progress (`step`) is in the URL; entered data is server-persisted per step (Seller Onboarding Wizard, Listing Editor drafts) or client-held with an abandon warning (Checkout). Deep-linking to a step whose preconditions are unmet redirects to the earliest incomplete step.

### 5.5 Breadcrumb derivation

Breadcrumb (component, see 04) derives from the URL path, not a hand-maintained map:

```
/seller/orders/ord_123        →  Seller Dashboard / Orders / #ord_123
/admin/disputes/dsp_7         →  Admin Dashboard / Disputes / #dsp_7
/account/settings/security    →  Buyer Dashboard / Settings / Security
```

- Segment 0 (workspace root) labels as the workspace dashboard name; middle segments use sidebar labels; object ids render as the object's short title once loaded (`#ord_123` → "Oak Desk — Order #123").
- Query params never appear in breadcrumbs. Tabs are not breadcrumb levels.
- Public screens use category breadcrumbs (`Home / Furniture / Desks / Listing title`) supplied by data, not URL — the only sanctioned exception.
- Breadcrumbs render on Level ≥ 2 screens only; dashboards and top-level lists rely on the sidebar's active state.

---

## 6. Search architecture

### 6.1 Scopes per persona

| Persona / surface | Search Bar scope | Backing endpoint (see 09) |
|---|---|---|
| Public (Guest & all) | Marketplace listings — the storefront search | `GET /v1/search/listings?q=` |
| Buyer workspace | My orders, my conversations | `GET /v1/orders?q=` scoped to self |
| Seller workspace | My orders, my listings, my conversations | `GET /v1/orders?q=`, `/v1/listings?q=` scoped to seller |
| Admin workspace | Users, listings, orders, disputes (cross-entity) | `GET /v1/admin/search?q=` grouped results |

The workspace Search Bar (App Shell header) never searches the storefront; the public Search Bar never searches private objects. Submitting the public Search Bar navigates to Search Results with `?q=`.

### 6.2 Search Bar vs Command Palette

| | Search Bar | Command Palette (`⌘K` / `Ctrl+K`) |
|---|---|---|
| Answers | "find me an object" | "take me somewhere / do something" |
| Content | data results in scope (§6.1) | navigation items, actions ("Create listing", "Request payout"), then object quick-jump reusing Search Bar scope |
| Persona | all | signed-in workspaces only (Buyer/Seller/Admin); highest value in Admin |
| Result of selection | navigate to object canonical URL | run action or navigate |

Command Palette actions are drawn from the same registry as Quick Actions (see 04); it never exposes an action the current screen's permissions would deny.

### 6.3 Result → URL

Every search result (either surface) resolves to a canonical URL from §5 — search is a navigation accelerator, never a separate viewing surface. Admin grouped results deep-link into the object's admin projection.

---

## 7. Notification taxonomy

### 7.1 Event → badge → category

Events use API webhook names (`domain.event`, see 09). Categories are the Notification Center's grouping/filter chips.

| Event | Recipient | Badge location(s) | Notification Center category | Deep link |
|---|---|---|---|---|
| `order.paid` | Seller | Sidebar Orders (needs action) · bell | Orders | `/seller/orders/{id}` |
| `order.delivered` | Buyer | Sidebar Orders · bell | Orders | `/account/orders/{id}?tab=timeline` |
| `order.completed` | Seller | bell | Orders | `/seller/orders/{id}` |
| `escrow.released` | Seller | Sidebar Earnings & Payouts (dot) · bell | Payments | `/seller/earnings` |
| `escrow.refunded` / `escrow.partially_refunded` | Buyer + Seller | bell | Payments | order detail (own projection) |
| `payment.failed` | Buyer | bell | Payments | `/checkout?step=payment` or `/account/wallet` |
| `payout.sent` / `payout.failed` | Seller | Earnings dot on failure · bell | Payments | `/seller/earnings?tab=payouts` |
| `message.created` | conversation counterpart | Sidebar Messages (unread) · Bottom Nav Messages · bell (batched) | Messages | `/{ws}/messages/{conversationId}` |
| `dispute.opened` | Seller + Admin | Seller: Orders needs-action · bell / Admin: Disputes Queue count | Disputes | `/seller/orders/{id}?tab=dispute` / `/admin/disputes/{id}` |
| `dispute.seller_responded` | Buyer + Admin | bell / Disputes Queue count | Disputes | dispute view (own projection) |
| `dispute.resolved` | Buyer + Seller | bell | Disputes | order detail `?tab=dispute` |
| `review.created` | Seller | Sidebar Reviews (no-response count) · bell | Reviews | `/seller/reviews` |
| `review.response_created` | Buyer | bell | Reviews | `/account/reviews?tab=published` |
| `listing.approved` / `listing.rejected` | Seller | Listings dot on rejection · bell | Listings | `/seller/listings/{id}/edit` |
| `listing.submitted` | Admin | Listings Moderation count | Moderation | `/admin/listings?tab=pending` |
| `user.suspended` | affected user | — (email + Warning Banner in shell) | Account | `/account/settings` |
| `job.failed` (system) | Admin | Queue Monitor dot | System | `/admin/queues` |

### 7.2 Category set

`Orders · Payments · Messages · Disputes · Reviews · Listings · Moderation · Account · System`. Notification Center shows categories relevant to the user's roles; preferences (per category × channel: in-app/email/push) live in Account Settings → Notifications (see 08).

### 7.3 Badge rules

- One unread/needs-action count per concern, computed server-side, delivered on one summary endpoint (see 09 § notification counts) — sidebar, Bottom Navigation (Mobile), and bell always agree.
- **Count badges** = actionable items (unread messages, orders needing action, pending queue). **Dot badges** = "attention, go look" without a meaningful number.
- Visiting the target surface clears or decrements the badge (read/act semantics per event, see 05 § Notifications). Badges cap at `99+`.

---

## 8. Shell chrome inventory (per workspace)

Constant chrome, so 08 screens don't re-spec it:

| Chrome | Public | Buyer | Seller | Admin |
|---|---|---|---|---|
| Top Navigation (storefront) | ✓ | on public pages | on public pages | — |
| App Shell header (workspace) | — | ✓ Search Bar (scoped) · bell · account menu | ✓ same | ✓ same + environment badge |
| Sidebar | — | §2.2 | §2.3 | §2.4 |
| Bottom Navigation (Mobile) | signed-in only | ✓ | ✓ | — |
| Command Palette | — | ✓ | ✓ | ✓ |
| Floating Action Button (Mobile) | — | — | "New listing" on Listings (list) | — |
| Warning Banner slot | account states (unverified email, suspension) — all shells | | | |

---

## 9. IA anti-rules

- **No mega-menu.** Public category nav is one level; deeper taxonomy lives in Search Results filters.
- **No role toggles inside a screen.** Projection is chosen by workspace prefix, never a "view as" switch (Admin impersonation is an audited session, not IA).
- **No duplicate homes.** One dashboard per workspace; storefront Home is not a dashboard.
- **No URL-invisible state** for anything a user would bookmark, share, or expect Back to restore.
- **No 4th path level.** Reach for Tabs or Right Drawer first; new depth means a missing object type.

---

## 10. Cross-product mapping

The IA skeleton (role-scoped workspaces, object URLs, sidebar groups, notification taxonomy) is product-independent. Rename objects; keep the structure:

| IA element | Marketplace (reference) | Flexa Booking | Flexa CRM |
|---|---|---|---|
| Public catalog object | Listing (`/listings/{slug}`) | Service (`/services/{slug}`) | — (no public catalog; marketing site only) |
| Provider profile | Seller Profile (public) (`/sellers/{handle}`) | Provider profile (`/providers/{handle}`) | — |
| Demand-side workspace | Buyer `/account` | Client `/account` (bookings, not orders) | — (single workspace) |
| Supply-side workspace | Seller `/seller` | Provider `/provider` | Sales rep `/app` |
| Transaction object | Order → Order Detail (with Escrow Timeline) | Booking → Booking detail (schedule timeline) | Deal → Deal detail (pipeline stage timeline) |
| Transaction list + queue badge | Orders List (needs action) | Bookings (upcoming/pending confirm) | Deals (Kanban Board; badge: overdue tasks) |
| Money section | Wallet / Earnings & Payouts | Payments / Provider payouts | Invoices (billing per deal) |
| Dispute-class object | Disputes Queue / Dispute Detail | Cancellation & refund requests | Escalations (deal at risk) |
| Moderation queue | Listings Moderation | Provider/service verification | Data-quality review (imports) |
| Admin workspace | `/admin` (same sections) | `/admin` (services for listings) | `/admin` (workspace admin: users, pipelines, audit) |
| Notification categories | §7.2 | Bookings/Payments/Messages/Cancellations/Reviews | Deals/Tasks/Messages/Billing/System |

**Rule:** a new Flexa product adopts this document by writing only its object-name mapping table and any extra sidebar items; navigation model (§2), URL rules (§5), search split (§6), and badge rules (§7.3) apply unchanged.

---

*Cross-references: layouts `02-ui-kit/` · patterns 05 · flows 07 · screen internals 08 · endpoints & events 09 · copy for nav/empty states 10 · keyboard/focus rules for nav 11.*
