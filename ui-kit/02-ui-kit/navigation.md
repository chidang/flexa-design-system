# 02 · UI Kit — Navigation Components

> Part of the **Flexa UI Kit** (doc 02). The 11 navigation components. This file is the design catalog (rationale, variants, states, responsive, wireframes); props/events/ARIA contracts live in doc 04; which navigation model each product/persona uses lives in doc 06; keyboard rules in doc 11; microcopy in doc 10. Layout regions these components occupy: [layouts.md](layouts.md). Foundations (tokens usage, icons, motion): [foundations.md](foundations.md).

## Design rationale

Navigation is the highest-frequency UI in a productivity suite — users touch it hundreds of times a day, so it must be boring in the best sense: identical placement across products, instant state legibility (where am I, what changed), and a keyboard-first escape hatch (Command Palette) that makes every destination and action reachable without a pointer. Wayfinding is redundant by design: Sidebar says *section*, Breadcrumb says *path*, Tabs say *facet*, page title confirms — a user dropped onto any deep URL can orient in one glance.

Component hierarchy (structural → utility → contextual):

1. Sidebar — primary vertical navigation
2. Nested Sidebar — second-level tree within Sidebar
3. Top Navigation — primary horizontal navigation
4. Tabs — same-page facet switching
5. Breadcrumb — hierarchy trail
6. Pagination — collection traversal
7. Search Bar — query entry
8. Command Palette — keyboard-first everything
9. Context Menu — right-click / long-press actions
10. Quick Actions — promoted contextual actions
11. Floating Action Button — single promoted creation action (mobile-leaning)

Shared state rules (apply to every item-bearing component here): current/active item is marked by **more than color alone** (indicator bar, fill, or underline + `aria-current`, doc 11); hover `motion.duration-fast`; focus always visible `color.focus-ring`; disabled items use `opacity.disabled` and stay focusable-skipped per doc 04.

---

## 1. Sidebar

**Purpose.** Persistent vertical primary navigation of the Sidebar Layout: sectioned destinations with icons, labels, and badge counts; the product's backbone.

**When to use.** ≥ 5 destinations, grouped/badged, admin/seller/buyer productivity surfaces (see layouts.md § Sidebar Layout for the shell decision).

**When NOT to use.** Content-first public surfaces (Top Navigation); inside modals, wizards, or drawers; as a filter panel (that's Advanced Filters).

**Variants.** `expanded` (240px) · `rail` (64px, icon-only) · `drawer` (Mobile temporary overlay). Same component, three presentations — never diverging trees.

**Properties (design-level).** Sections (optional `text.label` `color.text-subtle` uppercase-optional headers) · items: 20px icon + label + optional badge · slots: pinned header (product/workspace switcher) and pinned footer (user, collapse toggle) · optional Nested Sidebar per item (§2).

**States.**

| State | Treatment |
|---|---|
| default | `color.text-muted` label + icon on Sidebar surface |
| hover | background `color.surface-alt`, text → `color.text`, `motion.duration-fast` |
| focus | `color.focus-ring` outline, same background as hover |
| active (current section) | background `color.surface-alt`, text/icon `color.primary`, left indicator bar `border.4`-wide in `color.primary` (or filled glyph — one mechanism per product), `aria-current="page"` |
| active (pressed) | `color.primary-active` tint momentarily |
| disabled | `opacity.disabled`, no hover |
| loading | badge slot shows Skeleton Loader dot; items never individually spin |
| empty | (permission-filtered tree) section hidden entirely — no ghost items |

**Badge counts.** Pill `radius.full`, `text.label`; count badges (Inbox 12) use `color.surface-alt`/`color.text` neutral, attention badges (Disputes) use `color.danger`/`color.on-danger`. Cap display at `99+`. In `rail` variant badges collapse to an 8px dot in the same tone at the icon's top-right. Badges disappear at zero — never show "0".

**Collapse behavior.** Desktop+: user-toggleable expanded↔rail, persisted per user; rail items get tooltips (`z.tooltip`) with label + count. Tablet: rail default, temporary expand overlays content (`z.modal` + `color.scrim`, auto-collapse on navigate). Mobile: drawer variant from the App Shell hamburger. Collapse animation `motion.duration-normal` `motion.easing-standard`; labels fade, icons stay put (no reflow jump). Reduced motion: instant.

```
Expanded (240px)             Rail (64px)
┌────────────────────┐       ┌──────┐
│ ◈ Flexa Market   ▾ │       │  ◈   │
│────────────────────│       │──────│
│ WORKSPACE          │       │      │
│ ⌂ Dashboard        │       │  ⌂   │
│ ▤ Orders      (12) │◄active│  ▤•  │ ← dot badge
│ ▢ Listings         │       │  ▢   │
│ ✉ Messages     (3) │       │  ✉•  │
│ ⚑ Disputes    (2!) │       │  ⚑•  │
│────────────────────│       │──────│
│ ⚙ Settings         │       │  ⚙   │
│ 👤 Chi Dang      ‹ │       │  👤 › │
└────────────────────┘       └──────┘
```

**Responsive.** Wide/Desktop expanded · Tablet rail · Mobile → Bottom Navigation (Mobile) for top 3–5 + drawer for the full tree (layouts.md §2/§4).

**Best practices.** 5–9 items per section, ≤ 2 sections before a spacer; order by frequency then workflow; keep the tree identical across a persona's screens; scroll the item region independently with pinned header/footer; put the collapse toggle in the footer, not the top bar.

**Common mistakes.** Color-only active state; badges on more than ~3 items (numbness); hiding the current section under a collapsed group (auto-expand the active path); using the Sidebar for page-level actions; different item order per screen.

---

## 2. Nested Sidebar

**Purpose.** Second navigation level for items that own sub-destinations — inline expandable groups or a secondary pane — without deepening the URL wayfinding burden (Breadcrumb covers depth).

**When to use.** A section has 3–8 stable sub-destinations (Settings categories, Reports & Analytics subtypes, Categories & Attributes). Two levels maximum — this is a hard rule.

**When NOT to use.** One sub-item (promote it); >8 sub-items or dynamic/user-generated sets (in-page List/Tree); a third level (restructure the IA — doc 06).

**Variants.** `inline` (accordion group inside the 240px Sidebar — default) · `pane` (separate 240px second column; first level auto-collapses to rail — reserved for section-heavy admin, see layouts.md § Sidebar Layout).

**Properties.** Parent row gains a trailing chevron (rotates 90°, `motion.duration-fast`); children indent by `space.6`, no icons (indentation + typography differentiate); pane variant has its own `text.heading-md` header = parent name.

**States.** Parent expanded/collapsed persists per user; parent of the active child shows active *text* treatment without the indicator bar (bar belongs to the leaf); child states = Sidebar item states. Auto-expand the ancestor chain of the current URL on load; `empty` (all children permission-filtered) hides the parent too.

```
inline                        pane (rail + 240px)
│ ▾ ⚙ Settings      │        ┌──┬──────────────┐
│     Profile       │        │▣ │ Settings     │
│   ▸ Security  ◄───│active  │▣ │  Profile     │
│     Billing       │        │⚙◄│ ▸Security    │
│ ▸ ▤ Reports       │        │▣ │  Billing     │
                             └──┴──────────────┘
```

**Responsive.** Inline variant collapses with the Sidebar (rail: parent tooltip shows a mini-menu of children at `z.popover`). Pane variant: Tablet folds to inline; Mobile inherits the drawer with inline groups.

**Best practices.** Only one parent expanded at a time when space is tight (accordion mode); keep child labels short (they truncate at 1 line — foundations §1); mirror the same structure in Breadcrumb.

**Common mistakes.** Third level of nesting; icons on children (visual noise); expanding on hover (click/Enter only); pane variant on Tablet.

---

## 3. Top Navigation

**Purpose.** Horizontal primary navigation inside the 56px top bar of Top Navigation Layout — few destinations, maximum content width, public-facing tone.

**When to use / NOT.** See layouts.md § Top Navigation Layout (the shell decision owns this). Component-level: NOT as a secondary nav under a Sidebar (that's Tabs), and never scrolling horizontally.

**Variants.** `links` (plain inline destinations — default) · `with-dropdowns` (a destination opens a `z.dropdown` menu of children, `shadow.md`, `radius.lg`) · `centered` (marketing-leaning: logo left, links centered, utilities right).

**Properties.** Logo (home link) · 2–6 destinations `text.label` · trailing utilities (Search Bar trigger, notifications bell + badge, avatar menu) · optional persona switcher (Buyer ⇄ Seller — doc 06).

**States.** default `color.text-muted` · hover `color.text` underline-free background tint `color.surface-alt` `radius.md` · focus ring · active (current) `color.text` + 2px bottom indicator in `color.primary` (`border.2` weight) + `aria-current` · disabled per shared rules · dropdown-open keeps hover treatment + chevron rotated.

```
┌───────────────────────────────────────────────────────┐
│ ◈ Flexa   Home  Browse ▾  Sell  Pricing    🔍  🔔³ 👤 │
│                 ═══════ ← active indicator            │
└───────────────────────────────────────────────────────┘
```

**Responsive.** Desktop/Wide inline · Tablet: >4–5 links overflow into trailing "More ▾" (`z.dropdown`) · Mobile: links → hamburger drawer (`z.modal` + scrim), utilities remain; see layouts.md §3.

**Best practices.** Order: brand → destinations → search → notifications → account (fixed across products); dropdowns open on click, close on Esc/outside/route; keep ≤ 6 destinations or switch shells.

**Common mistakes.** Two rows of links (use Sidebar Layout instead); hover-open dropdowns (touch-hostile); hiding sign-in behind the hamburger for Guests; duplicating Sidebar destinations when both bars exist.

---

## 4. Tabs

**Purpose.** Switch between facets of the *same* entity or dataset in place — same URL family, preserved page context (Order Detail: Details / Escrow / Messages / History).

**When to use.** 2–7 peer views of one thing; sub-navigation under a page header; Settings Layout categories at Tablet.

**When NOT to use.** Different entities/sections (that's navigation → Sidebar); sequential steps (Wizard Layout); a single tab (just content); content users must compare side-by-side (Split View).

**Variants.**

| Variant | Look | Use |
|---|---|---|
| `line` (default) | Text + 2px bottom indicator `color.primary`; row bottom `border.1` `color.border` | Page-level facets under the header |
| `enclosed` | Active tab is a raised card (`color.surface`, top `radius.md`) on `color.surface-alt` strip | Container/panel-scoped tabs, editors |
| `pill` | Items are `radius.full` chips; active = `color.primary` fill + `color.on-primary` | Compact filter-like view switches (dashboard ranges: 7d/30d/90d) |

**Properties.** Label `text.label` · optional 16px leading icon · optional trailing count badge (neutral pill; `color.danger` tone only for attention counts) · optional per-tab disabled · sizes md (44px hit area) / sm (32px, `compact` surfaces).

**States.** default `color.text-muted` · hover `color.text` · focus ring on the tab (roving tabindex, arrow-key traversal — contract in doc 04/11) · active `color.text` + variant indicator + `aria-selected` · disabled `opacity.disabled` · loading: tab panel shows Skeleton Loader (tabs themselves never spin) · badge updates animate `motion.duration-fast`.

**Overflow.** When tabs exceed the container: horizontal scroll with edge fade + scroll affordance, **plus** a trailing "⋯" menu (`z.dropdown`) listing all tabs — keyboard/SR users must never depend on scroll. The active tab auto-scrolls into view on load. Never wrap to two rows; never shrink below sm.

```
line:      Details   Escrow   Messages(3)  History     ⋯
           ════════                                      ← indicator
enclosed: ┌─────────┐________________________________
          │ Details │  Escrow   Messages   History
pill:     (7d) (30d) (●90d) (1y)
```

**Responsive.** Desktop/Wide: full row. Tablet: same + overflow rules. Mobile: scrollable row is the default (thumb-friendly); ≤ 3 short tabs may render as full-width segmented pills. Tab choice is deep-linkable (doc 06 URL scheme).

**Best practices.** Nouns for facet tabs, metrics-with-counts where counts guide triage; keep the first tab the default/summary; preserve scroll position per tab within a session; lazy-load heavy panels behind Skeleton Loader.

**Common mistakes.** Tabs as primary navigation; mixing variants in one cluster; two rows; icon-only tabs without labels; resetting page state when switching back to a visited tab.

---

## 5. Breadcrumb

**Purpose.** Hierarchy trail from section root to current screen — orientation + one-click ascent, mirroring the IA (doc 06) and the URL path.

**When to use.** Any screen ≥ 2 levels deep in Desktop/Wide/Tablet ranges (Content Area page header slot — layouts.md §5).

**When NOT to use.** Top-level screens (Dashboard); Mobile range (back affordance replaces it); wizards/modals (their own headers); as a filter trail (chips do that).

**Variants.** `standard` · `collapsed` (long paths: first + "…" + last two; "…" is a `z.dropdown` menu of hidden ancestors).

**Properties.** Segments = links, `text.body-sm`; separator "›" (or "/" per product, fixed product-wide) in `color.text-subtle`; leaf = current page, `color.text`, not a link, `aria-current="page"`; leaf may carry a status Badge (e.g. order state) — the only decoration allowed.

**States.** Ancestor default `color.text-muted` · hover `color.text` underline · focus ring · leaf static · loading: segment placeholders as Skeleton Loader text · dynamic segment names (entity titles) middle-truncate at ~24ch with tooltip (foundations §1 truncation).

```
Orders › #FM-2481 › Dispute
Catalog › … › Electronics › Headphones     (collapsed)
```

**Responsive.** Desktop/Wide full · Tablet collapsed variant beyond 4 segments · Mobile hidden — replaced by "‹ Parent" back link in the page header.

**Best practices.** Segments match Sidebar/Nested Sidebar labels verbatim; every segment navigable except the leaf; breadcrumb reflects *hierarchy*, not browsing history.

**Common mistakes.** History-based trails; making the leaf a link to itself; using breadcrumb as the page title (title is separate `text.heading-xl`); showing it on Mobile.

---

## 6. Pagination

**Purpose.** Traverse a long collection in pages with position feedback. Designed **cursor-first** to match the API contract (doc 09: `?cursor=&limit=`, `pageInfo.hasMore`): Prev/Next is the primitive; numbered pages are an enhancement only when a total count is known and stable.

**When to use.** Tables and lists > 1 page (default page sizes 25/50/100 — Data Management Toolbar owns the size selector).

**When NOT to use.** Feeds and Chat (infinite scroll / reverse scroll — see 05 § Infinite Scroll); small collections (≤ 1 page: hide entirely, show only the range summary); Kanban columns.

**Variants.** `cursor` (default: Prev · Next + "Showing 1–25" range summary; page numbers impossible) · `numbered` (Prev · windowed numbers · Next — only with known totals: first + last + current±1, "…" gaps) · `compact` (icon-only ‹ › + "3 / 12", for cards/drawers/`compact` density).

**Properties.** Range summary `text.body-sm` `color.text-muted` ("Showing 26–50 of 1,204" or "Showing 26–50" cursor-mode); buttons are sm ghost buttons (32px, `radius.md`); current page number = `color.primary` fill + `color.on-primary`, `aria-current="page"`; optional jump-to-page input in `numbered` at Desktop+ when > 10 pages.

**States.** default/hover/focus per shared rules · disabled Prev on first page, Next when `hasMore=false` · loading: buttons disabled + table body shows Skeleton Loader rows (pagination itself never spins) · error: retains position, Toast owns the message · empty: component hidden, Empty State owns the body.

```
numbered:  Showing 26–50 of 1,204   ‹ Prev  1 … 4 [5] 6 … 49  Next ›
cursor:    Showing 26–50            ‹ Prev   Next ›
compact:   ‹  3 / 12  ›
```

**Responsive.** Desktop/Wide full variant · Tablet: window shrinks to current±1 · Mobile: `compact` (or Prev/Next full-width pair under the list). Position persists in the URL (`cursor` or `page` — doc 06/09).

**Best practices.** Keep pagination pinned below the table, right-aligned, with the range summary left; preserve selection semantics across pages explicitly (Bulk Actions Bar states "12 selected on this page" vs "all 1,204" — see 05 § Bulk Actions); prefetch the next page on hover/idle where cheap.

**Common mistakes.** Numbered variant on cursor-only endpoints (fake totals); resetting to page 1 after row edits; pagination *and* infinite scroll on one collection; hiding the range summary in `compact` tables where triage needs it.

---

## 7. Search Bar

**Purpose.** Query entry with suggestions — either global (top bar, searches the product) or scoped (Data Management Toolbar, filters one collection).

**When to use.** Global: every App Shell top bar. Scoped: any collection > ~20 items.

**When NOT to use.** As a filter replacement (structured criteria → Advanced Filters); when Command Palette already covers the need for power users (they coexist: Search finds *content*, palette finds *destinations and actions*).

**Variants.** `global` (top bar; expands from icon at Tablet-, full field at Desktop+; ⌘K hint chip optional when palette is absent) · `scoped` (inline field above tables/lists; placeholder names the scope: "Search orders…") · `with-suggestions` (either, + `z.dropdown` results panel).

**Properties.** Height md 40px (sm 32px in `compact` toolbars); leading 16px search icon `color.text-subtle`; placeholder `color.text-subtle`; trailing clear "✕" once text exists; suggestion panel `radius.lg` `shadow.md`: grouped results (entities by type), query echo row ("Search all for 'x'"), recent searches when empty-focused; keyboard ↑↓ + Enter, Esc clears-then-closes (full contract doc 04).

**States.** default `border.1` `color.border-strong` on `color.surface` · hover border `color.border-strong` darkened via `color.text-muted`-equivalent (theme handles) · focus `color.focus-ring` ring + panel opens · loading: inline spinner replaces the search icon after 300ms debounce · empty results: panel shows compact Empty State + "Search all" escape · error: inline retry row in panel · disabled `opacity.disabled`.

```
┌ 🔍 Search orders…                    ✕ ┐
└────────────────────────────────────────┘
  ┌──────────────────────────────────────┐
  │ RECENT                               │
  │  🕘 refund #2481                     │
  │ ORDERS                               │
  │  ▤ #FM-2481 — Wireless headphones    │
  │ SELLERS                              │
  │  👤 Aurora Audio                     │
  │ ─ Search all for "aur…"  ↵           │
  └──────────────────────────────────────┘  z.dropdown
```

**Responsive.** Desktop/Wide: persistent field (global ~240–320px, focus may expand). Tablet: global collapses to icon → expands over the bar. Mobile: icon → full-screen search sheet (`z.modal`) with its own header and cancel; scoped variant stays inline full-width.

**Best practices.** Debounce ~300ms; highlight matched substrings in results; keep suggestion groups ≤ 5 rows each with per-group "View all"; scoped search composes with active filters (AND) and shows as a chip in the filter row.

**Common mistakes.** Search-on-Enter-only with no suggestions on global search; clearing the query on blur; suggestion panel taller than the viewport; two search fields visible in one region.

---

## 8. Command Palette

**Purpose.** Keyboard-first launcher (**⌘K / Ctrl+K**) unifying navigation, actions, and entity lookup — the productivity escape hatch that makes every destination reachable in two keystrokes (03 § Productivity).

**When to use.** Every authenticated Flexa product, always mounted at App Shell level.

**When NOT to use.** Guest/public surfaces; as a replacement for visible navigation (discoverability — palette is an accelerator, not the only path); for destructive actions without their normal Confirmation Dialog.

**Variants.** `full` (navigation + actions + entities — default) · `scoped` (opened pre-filtered by an in-context trigger, e.g. "Assign to…" pickers reuse the shell).

**Properties.** Centered panel, width `size.container-sm`, top-anchored ~15vh; `radius.lg` `shadow.lg` at `z.modal` over `color.scrim`; input row (no chrome, `text.body`, placeholder "Type a command or search…"); results grouped under `text.label` `color.text-subtle` headers in canonical order: **Recent** (empty query) → **Actions** (verb-first: "Create listing", "Export orders") → **Navigation** (destinations with parent hint: "Settings › Billing") → **Entities** (orders, users, listings by id/title); each row: 16px icon · label · trailing keyboard shortcut hint or entity meta `text.body-sm`; footer hint row (↑↓ navigate · ↵ select · esc close).

**States.** open/close `motion.duration-fast` fade+scale (reduced motion: fade) · row hover/↑↓ highlight `color.surface-alt` (single highlight, mouse and keyboard share it) · loading: group-level Skeleton Loader rows for async entity search · empty: "No results for 'x'" + fallback "Search everything" row · error: inline retry row per async group · action rows may show `disabled` with reason suffix when permission-blocked (doc 06 permission matrix).

```
            ┌──────────────────────────────────────┐
            │ ⌘  refund…                           │
            │──────────────────────────────────────│
            │ ACTIONS                              │
            │ ▸ ↺ Refund order…             ⇧R    │◄ highlighted
            │ NAVIGATION                           │
            │   ▤ Payments & Refunds               │
            │ ORDERS                               │
            │   #FM-2481 — refund requested        │
            │──────────────────────────────────────│
            │ ↑↓ navigate   ↵ select   esc close   │
            └──────────────────────────────────────┘
```

**Responsive.** Desktop/Wide/Tablet: centered panel. Mobile: full-screen sheet with visible input focus and safe-area padding; reachable from a top-bar affordance (no hardware ⌘K assumption).

**Best practices.** Fuzzy match with recency boost; every Sidebar destination and every page-header action must be registered (drift check in review); executing an action closes the palette first, then runs the normal flow (including confirmations); show shortcut hints to teach the shortcut system; persist Recent per user.

**Common mistakes.** Palette-only features; skipping Confirmation Dialog because "the user typed it"; unbounded entity results (cap ~5 per group + "View all"); stealing ⌘K inside text editors without an escape.

---

## 9. Context Menu

**Purpose.** Contextual action list on right-click (pointer) / long-press (touch) / dedicated "⋯" trigger — dense surfaces' secondary-action channel (Table rows, Kanban cards, files).

**When to use.** Collections where per-item actions would clutter rows; power-user acceleration of actions that also exist elsewhere.

**When NOT to use.** As the *only* path to any action (discoverability + a11y — a visible "⋯" trigger must exist too); for navigation lists; on Mobile where a bottom sheet fits better (it converts automatically).

**Variants.** `pointer` (opens at cursor) · `trigger` (opens from a "⋯" icon button, aligned to it) · both share content.

**Properties.** Panel `radius.lg` `shadow.md` `z.popover`, min-width 180px, padding `space.1`; items 32px min height (44px touch): optional 16px icon · label `text.body-sm` · trailing shortcut hint; groups separated by `border.1` divider; destructive group last, items in `color.danger`; submenu (one level max) opens on hover-intent/→ key with chevron indicator.

**States.** item hover/↑↓ `color.surface-alt` highlight · focus follows the highlight (roving) · disabled `opacity.disabled` with tooltip reason on hover · destructive hover `color.danger` background tint with `color.on-danger`-safe text handled by tone pair · loading rows not allowed (fetch before open, or show the panel with Skeleton Loader group).

```
        ┌───────────────────┐
        │ ✎ Edit        ⏎  │
        │ ⧉ Duplicate   ⌘D │
        │ ⬇ Export…        │
        │ ▸ Move to      ▸ │──┐
        │───────────────────│  │ Submenu (1 level max)
        │ 🗑 Delete…    ⌫  │  └──────────
        └───────────────────┘
         z.popover, shadow.md
```

**Responsive.** Desktop/Wide/Tablet-with-pointer: floating panel, flip-to-fit viewport edges. Touch (Mobile + Tablet touch): converts to a bottom sheet (`z.modal`, `radius.2xl` top corners, drag-to-dismiss) with the same items at 44px height.

**Best practices.** ≤ 8 items before grouping; verbs first word; ellipsis suffix when a dialog follows ("Delete…"); mirror shortcut hints with actual bindings; close on Esc/outside/scroll; open state never survives navigation.

**Common mistakes.** Context-menu-only actions; two submenu levels; mixing navigation links into an action menu; long-press delay without visual feedback; forgetting the visible "⋯" fallback trigger.

---

## 10. Quick Actions

**Purpose.** A promoted, always-visible cluster of the 2–4 highest-value actions for the current context — page-header shortcuts, hover-revealed row actions, or a Mobile sticky action bar. Cuts clicks for the routine path (03 § Productivity).

**When to use.** Screens with one dominant recurring action set (Orders List: Fulfil / Message / Refund); table rows where the top action deserves one-click access; Mobile detail screens needing thumb-reach actions.

**When NOT to use.** More than 4 actions (that's a menu); actions used < weekly (Context Menu / "⋯"); duplicating the page's single primary CTA (one primary per screen — 03).

**Variants.** `header` (page-header cluster right of the title: 1 primary + up to 2 secondary/ghost + "⋯" overflow) · `row` (icon buttons revealed on row hover/focus-within, always-visible on touch) · `bar` (Mobile sticky bottom bar above safe-area, replacing Bottom Navigation (Mobile) contextually — layouts.md §4).

**Properties.** Buttons follow the standard emphasis vocabulary (`primary | secondary | ghost | danger`); `row` variant: 32px icon buttons, tooltip labels mandatory (icon-only rule, foundations §8); `bar` variant: up to 2 buttons, primary right, 48px lg height; overflow "⋯" opens Context Menu `trigger` variant.

**States.** Standard button states (doc 04 owns the button contract) · `row` reveal: fade-in `motion.duration-fast`, revealed also on keyboard focus-within (never hover-only) · loading: the acting button spins inline, siblings disable · permission-hidden actions collapse the cluster (no disabled ghosts unless the disabled state teaches something — 03 § error philosophy).

```
header:  Order #FM-2481            [Message] [Refund…] [Fulfil] [⋯]
row:     │ #FM-2481   Paid   $120  …hover→   ✎  ⧉  🗑  ⋯ │
bar:     ┌──────────────────────────────┐
(mobile) │ [ Message ]      [ Fulfil ▸ ]│ sticky, z.fixed
         └──────────────────────────────┘
```

**Responsive.** Desktop/Wide: header + row variants. Tablet: header cluster may drop secondary labels to icons+tooltips. Mobile: header collapses to primary + "⋯"; `bar` variant carries the rest.

**Best practices.** Choose actions from analytics/task frequency, not stakeholder wishes; keep the set identical across a collection's rows; destructive actions live behind "⋯" + Confirmation Dialog, never as a promoted row icon.

**Common mistakes.** Five-plus buttons in a header; hover-only row actions (touch/keyboard orphaned); `bar` variant coexisting with Bottom Navigation (Mobile) (one bottom bar rule); promoting Delete.

---

## 11. Floating Action Button

**Purpose.** A single circular promoted action floating above content — the screen's one dominant creation verb, primarily on Mobile where header actions are far from the thumb.

**When to use.** Mobile range of collection screens with one clear creation action (New listing, New message). Sparingly on Desktop (canvas/board surfaces like Kanban Board where the header is out of the working eye-line).

**When NOT to use.** Screens with multiple competing primary actions; alongside a Quick Actions `bar` or an already-sticky primary CTA; on forms/wizards/modals; ever more than one FAB per screen.

**Variants.** `standard` (56px circle, 24px glyph) · `extended` (pill `radius.full` with icon + label — use when the verb is ambiguous) · `with-menu` (tap fans out 2–3 labeled mini-actions — avoid unless truly needed; a full sheet is usually clearer).

**Properties.** `color.primary` fill, `color.on-primary` glyph, `radius.full`, `shadow.lg`; position bottom-right, `space.4` inset, above Bottom Navigation (Mobile) and safe-area; `z.fixed`; label mandatory for `extended`, aria-label mandatory always (icon-only rule).

**States.** default → hover `color.primary-hover` (pointer devices) → active `color.primary-active` + slight scale-down `motion.duration-fast` · focus ring `color.focus-ring` offset outside the circle · disabled: hide rather than gray (a dead floating button is noise) · loading: glyph swaps to spinner, stays put · scroll behavior: may shrink to 40px or hide on scroll-down / return on scroll-up (`motion.duration-normal`; static under reduced motion).

```
┌──────────────────────────────┐
│  list content                │
│                              │
│                       ┌────┐ │
│                       │ ＋ │ │ 56px, shadow.lg, z.fixed
│                       └────┘ │
├──────────────────────────────┤
│  ⌂     ▤     ✉     👤        │ ← FAB sits space.4 above this
└──────────────────────────────┘
```

**Responsive.** Mobile: primary habitat. Tablet: allowed on touch-first surfaces. Desktop/Wide: prefer the page-header primary action; FAB only on canvas surfaces (see above) — never both for the same verb.

**Best practices.** One verb, the obvious one; keep it stable across sibling screens of a section; pair the glyph with `extended` label until the action is learned; respect keyboard reachability (it's in the normal tab order, not last).

**Common mistakes.** FAB as a "misc actions" menu; covering list content/pagination with no scroll-past spacer; duplicating a header CTA on Desktop; tone-colored FABs (status tones are for status, not decoration — 01 §4).

---

*Sibling files: [foundations.md](foundations.md) · [layouts.md](layouts.md). Engineering contracts for all 11 components: doc 04. Keyboard & ARIA details: doc 11. Which persona sees which navigation model: doc 06.*
