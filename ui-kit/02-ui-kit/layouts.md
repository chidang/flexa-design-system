# 02 · UI Kit — Layouts

> Part of the **Flexa UI Kit** (doc 02). The 13 canonical layouts every Flexa screen is built from. Foundations (spacing, grid, containers, elevation) are in [foundations.md](foundations.md); navigation components that populate these layouts are in [navigation.md](navigation.md); which screen uses which layout is owned by doc 06 (IA) and doc 08 (screen specs); code-facing region contracts by doc 04.

## Design rationale

A screen is never designed from a blank page: it is one of these 13 layouts with regions filled in. Fixed chrome dimensions are deliberately few and canonical — **top bar 56px, Sidebar 240px expanded / 64px collapsed rail, Right Drawer 400px, Content Area max width `size.container-xl`** — so that muscle memory transfers across every Flexa product. Layouts compose by containment (§ Composition rules at the end): App Shell provides chrome, one primary layout fills its Content Area, and transient layouts (Right Drawer, Modal Layout) stack above via `z.*` tokens.

Layout hierarchy:

1. App Shell — the outermost frame
2. Sidebar Layout — shell variant with left navigation
3. Top Navigation Layout — shell variant with horizontal navigation
4. Bottom Navigation (Mobile) — shell variant for Mobile range
5. Content Area — the scrollable work region inside any shell
6. Right Drawer — transient side panel
7. Split View — two persistent panes
8. Modal Layout — blocking overlay
9. Wizard Layout — linear multi-step
10. Settings Layout — categorized forms
11. Authentication Layout — centered single card
12. Dashboard Layout — widget grid
13. Blank State Layout — first-run / empty screen

Canonical measurements (single source for all documents):

| Region | Value |
|---|---|
| Top bar height | 56px |
| Sidebar expanded | 240px |
| Sidebar collapsed rail | 64px |
| Right Drawer width | 400px (Desktop/Wide); ≤ 480px absolute max via doc-08 exception |
| Content Area max width | `size.container-xl`, centered at Wide |
| Bottom Navigation (Mobile) height | 56px + safe-area inset |

---

## 1. App Shell

**Purpose.** The invariant outer frame of an authenticated product: navigation chrome + one Content Area. Owns global concerns: skip-link target, Toast region, Command Palette invocation, Offline State banner slot.

**Use when** the user is signed in and inside a product. **Do NOT use** for Authentication Layout screens, standalone public pages (marketing, shared invoice links), or embedded/iframe surfaces — those render Content Area–only.

```
┌────────────────────────────────────────────────────┐
│ Top bar (56px)  [logo] [search]        [🔔] [👤]   │ ← z.sticky
├──────────┬─────────────────────────────────────────┤
│ Sidebar  │  Content Area                           │
│ 240px    │  (scrolls)                              │
│ (fixed)  │                                         │
│          │                                         │
├──────────┴─────────────────────────────────────────┤
│ (Mobile only: Bottom Navigation 56px)               │ ← z.fixed
└────────────────────────────────────────────────────┘
```

**Regions.** Top bar (56px, `color.surface`, bottom `border.1` `color.border` or `shadow.sm` once content has scrolled — never both); navigation region (Sidebar *or* Top Navigation second row *or* Bottom Navigation (Mobile)); Content Area; overlay slots (Toast stack top-right at `z.tooltip`−, Command Palette at `z.modal`).

**Responsive.** Wide/Desktop: top bar + Sidebar 240px. Tablet: Sidebar collapses to 64px rail. Mobile: Sidebar removed → Bottom Navigation (Mobile) + hamburger opening the Sidebar as a temporary drawer over `color.scrim`. Top bar persists in all ranges (it carries search, notifications, account).

**Scroll.** Only the Content Area scrolls. Top bar, Sidebar, Bottom Navigation are fixed. Never nest a second page-level scrollbar (inner regions may scroll only inside bounded components — tables, panes, drawers).

**Z-tokens.** Top bar `z.sticky` · Bottom Navigation `z.fixed` · mobile Sidebar drawer `z.modal` over `color.scrim`.

**Composition.** App Shell contains exactly one of {Sidebar Layout, Top Navigation Layout}; its Content Area hosts any of layouts 5–13 except Authentication Layout.

---

## 2. Sidebar Layout

**Purpose.** The default shell for productivity surfaces: persistent vertical navigation (the Sidebar component — see navigation.md § Sidebar) beside the Content Area. Scales to many destinations, supports Nested Sidebar grouping.

**Use when** the product has ≥ 5 primary destinations, or destinations need grouping/badging (all Flexa admin/seller/buyer dashboards). **Do NOT use** for content-first public surfaces (marketplace storefront → Top Navigation Layout) or ≤ 4-destination lightweight tools.

```
Desktop                                Tablet (rail)        Mobile
┌────┬────────────────────┐  ┌──┬──────────────┐  ┌──────────────┐
│Side│ Content Area       │  │▣ │ Content      │  │ Top bar   ☰  │
│bar │                    │  │▣ │ Area         │  ├──────────────┤
│240 │                    │  │▣ │              │  │ Content Area │
│    │                    │  │64│              │  ├──────────────┤
└────┴────────────────────┘  └──┴──────────────┘  │ ⌂  ▤  ＋  ✉ 👤│
                                                   └──────────────┘
```

**Regions.** Sidebar: 240px expanded, 64px collapsed rail (icons + tooltips, badges become dots), user-toggleable at Desktop+ (persisted per user); Content Area fills the rest. Optional Nested Sidebar (second level, see navigation.md) adds an inner 240px pane — combined chrome never exceeds 240 + 240; at Desktop the first level auto-collapses to the rail when a Nested Sidebar is open.

**Responsive.** Wide: expanded, content centered at `size.container-xl`. Desktop: expanded (collapsible). Tablet: rail by default, expands as temporary overlay (`z.modal`, scrim) on demand. Mobile: becomes Bottom Navigation (Mobile) for top destinations + drawer for the full tree.

**Scroll.** Sidebar scrolls independently when its items overflow (header/footer pinned inside it); Content Area scrolls separately.

**Z-tokens.** Sidebar itself `z.base` (in-flow); overlay/expanded-over-content states `z.modal`.

**Composition.** Lives only inside App Shell. Content Area may host Dashboard Layout, Settings Layout, Split View, Wizard Layout, Blank State Layout.

---

## 3. Top Navigation Layout

**Purpose.** Horizontal navigation in the 56px top bar (Top Navigation component) with a full-width Content Area below. Maximizes content width; suits few destinations.

**Use when** ≤ 5–6 primary destinations, content-first or public-facing surfaces (Marketplace storefront: Home, Search Results, Listing Detail), or landing/guest experiences where a sidebar feels administrative. **Do NOT use** when destinations need nesting/badging at scale, or for data-dense admin (sidebar wins).

```
┌─────────────────────────────────────────────────┐
│ [logo]  Home  Browse  Sell  Pricing   [🔍][👤]  │ 56px, z.sticky
├─────────────────────────────────────────────────┤
│                Content Area                     │
│        (max size.container-xl, centered)        │
└─────────────────────────────────────────────────┘
```

**Regions.** Single 56px bar: logo · inline destinations (`text.label`) · trailing utilities (Search Bar trigger, notifications, account). Optional second contextual row (Tabs or category bar) 48px, also sticky, `border.1` bottom.

**Responsive.** Wide/Desktop: inline links. Tablet: overflow beyond 4–5 links into a "More" menu (`z.dropdown`). Mobile: links collapse into hamburger drawer (`z.modal` + scrim); utilities stay in the bar; may pair with Bottom Navigation (Mobile) for app-like products.

**Scroll.** Bar is sticky (`z.sticky`); gains `shadow.sm` after scroll begins (foundations §5). Content Area scrolls.

**Composition.** Alternative to Sidebar Layout inside App Shell — a product picks one per persona surface (doc 06); never both simultaneously except Sidebar Layout products that keep the top bar for utilities (that bar carries no destinations then).

---

## 4. Bottom Navigation (Mobile)

**Purpose.** Thumb-reachable primary navigation for the Mobile range: 3–5 top destinations pinned to the bottom edge.

**Use when** Mobile range of any shell whose Sidebar/Top Navigation carries ≥ 3 primary destinations used frequently. **Do NOT use** on Tablet+ (never), inside modals/wizards (focused flows suppress it), or for fewer than 3 destinations.

```
┌──────────────────────────────┐
│         Content Area         │
│                              │
├──────────────────────────────┤
│   ⌂      ▤      ✉      👤    │ 56px + safe-area, z.fixed
│ Home  Orders  Inbox  Account │
└──────────────────────────────┘
```

**Regions.** 56px + safe-area bottom inset; `color.surface`, top `border.1` `color.border`. 3–5 items: 24px icon + `text.label` caption; active item `color.primary` (filled glyph allowed — foundations §8), inactive `color.text-muted`. Badge counts as pill `radius.full` (navigation.md § Sidebar badge rules apply).

**Responsive.** Exists only ≤ 767px. The 5th slot is "More" when the destination count exceeds 5 — opening the full Sidebar tree as a sheet.

**Scroll.** Never scrolls; content scrolls beneath. May auto-hide on scroll-down / reappear on scroll-up (`motion.duration-normal`) — disable under reduced motion.

**Z-tokens.** `z.fixed`. Sheets and modals cover it (`z.modal`); Toast stacks above it with bottom offset.

**Composition.** Mobile-range companion of Sidebar Layout / Top Navigation Layout inside App Shell. A screen shows at most one bottom bar — when Quick Actions or Bulk Actions Bar must appear, they replace it contextually.

---

## 5. Content Area

**Purpose.** The scrollable work region every shell provides: page header (Breadcrumb, `text.heading-xl` title, page-level actions) + body on the 12-col grid.

**Use when** always — every screen has exactly one. **Do NOT** nest Content Areas; embedded surfaces render one standalone.

```
┌──────────────────────────────────────────────┐
│ Breadcrumb › path › leaf                     │
│ Page title (heading-xl)          [Action] [⋯]│  ← page header
│ Tabs (optional) ─────────────────────────────│
│                                              │
│  body — 12-col grid, max size.container-xl   │
│                                              │
└──────────────────────────────────────────────┘
```

**Regions.** Padding `space.8` Desktop+ / `space.6` Tablet / `space.4` Mobile (foundations §2). Header: Breadcrumb (Desktop+ only) above title; one primary + max one secondary action right-aligned, rest in "⋯" (see 03 § action budget); optional Tabs below. Header may be sticky on long pages (`z.sticky`, condensing to title + actions at `shadow.sm`).

**Responsive.** Max width `size.container-xl` centered at Wide; fluid below. Mobile: Breadcrumb hidden (back affordance instead), actions collapse to "⋯" or a bottom Quick Actions bar.

**Scroll.** The page scroll container. Scroll restoration on back-navigation is mandatory; deep-linkable Tabs (doc 06 URL scheme).

**Z-tokens.** `z.base`; sticky header `z.sticky` (below the App Shell top bar, which shares the token but wins by DOM order).

**Composition.** Hosts every non-shell layout (6–13). Blank State Layout replaces the body — never the header.

---

## 6. Right Drawer

**Purpose.** Transient detail/edit panel sliding from the right edge, preserving list context behind it. The default surface for "inspect/edit one item from a collection" (see 05 § Drawer Editing).

**Use when** viewing/editing a record from Table/List/Kanban without losing scroll position; multi-item triage workflows (approve → next). **Do NOT use** for destructive confirmations (Confirmation Dialog), multi-step flows (Wizard Layout), or as permanent chrome (that's Split View).

```
Desktop                                  Mobile
┌───────────────────────┬─────────────┐  ┌─────────────┐
│ Content Area (dimmed  │ ✕ Title     │  │ ✕ Title     │
│ or inert behind)      │─────────────│  │─────────────│
│                       │ body        │  │ body (full  │
│                       │ (scrolls)   │  │  screen)    │
│                       │─────────────│  │─────────────│
│                       │ [Cancel][Save]  │[Cancel][Save]│
└───────────────────────┴─────────────┘  └─────────────┘
        400px, z.modal, shadow.lg
```

**Regions.** Width 400px (Desktop/Wide). Pinned header (title `text.heading-md`, close ✕, optional item actions); scrollable body (padding `space.6`); pinned footer with actions only when the drawer edits (view-only drawers have no footer). Leading corners `radius.lg`; `shadow.lg`; scrim `color.scrim` when modal — an inert-background non-scrim variant is allowed for rapid triage.

**Responsive.** Wide/Desktop: 400px overlay. Tablet: 400px overlay with scrim always. Mobile: full-screen sheet (or bottom sheet `radius.2xl` top corners for short content).

**Scroll.** Body only; header/footer pinned. Background scroll locked while scrimmed.

**Motion.** Slide-in `motion.duration-normal` `motion.easing-out`; exit `motion.easing-in`. Reduced motion: fade only.

**Z-tokens.** `z.modal` (+ scrim below it). Dropdowns inside use `z.popover`. Only one Right Drawer at a time; a drawer may open a Modal Layout above itself (confirm-discard), never a second drawer.

**Composition.** Overlays any Content Area. Unsaved-changes guard: closing with edits requires Confirmation Dialog.

---

## 7. Split View

**Purpose.** Two persistent side-by-side panes: master list + detail (Messages: Conversation List + Chat) or source + preview (editors, AI Diff Viewer).

**Use when** users move rapidly between items and the detail is the primary work (inbox pattern), or side-by-side comparison is the task. **Do NOT use** for occasional detail peeks (Right Drawer), >2 panes, or narrow content that leaves a pane starved.

```
Desktop                              Mobile (push navigation)
┌───────────┬───────────────────┐   ┌───────────┐   ┌───────────┐
│ Master    │ Detail            │   │ Master    │ → │ ‹ Detail  │
│ (4 cols)  │ (8 cols)          │   │ (full)    │   │ (full)    │
│ scrolls   │ scrolls           │   └───────────┘   └───────────┘
│ independently                 │
└───────────┴───────────────────┘
```

**Regions.** Canonical ratio 4/8 on the 12-col grid; master min 280px, max 480px; optional drag handle to resize (double-click resets; width persisted). Divider `border.1` `color.border`. Each pane has its own header; the Content Area page header may collapse into the master header for full-height inbox screens (doc 08 flags these as full-height).

**Responsive.** Wide/Desktop: side-by-side. Tablet: side-by-side if master ≥ 280px fits, else master → collapsible pane behind a toggle. Mobile: push navigation — master full-screen, selecting pushes detail full-screen with back affordance; selection state preserved.

**Scroll.** Panes scroll independently; both headers pinned within their panes. Full-height mode: the Split View owns the viewport height and the page does not scroll.

**Z-tokens.** `z.base`; in-pane sticky headers `z.sticky`.

**Composition.** Inside Content Area. Detail pane may open Right Drawer/Modal Layout; master pane hosts Conversation List, Tree, or filtered List. Do not nest Split View in Split View.

---

## 8. Modal Layout

**Purpose.** Blocking overlay for a single decision or focused sub-task that must complete or cancel before returning.

**Use when** confirmation with consequence (Confirmation Dialog is the sm preset), short create/edit (≤ ~6 fields), or a focused picker (media, user). **Do NOT use** for content that deserves a URL (detail pages), long forms (page or Wizard Layout), stacking >2 levels, or anything a non-blocking Toast/Inline Error can say.

```
        ┌──────────────────────────┐
        │ Title (heading-md)     ✕ │
        │──────────────────────────│
        │ body (scrolls if needed) │
        │──────────────────────────│
        │            [Cancel][Save]│
        └──────────────────────────┘
   centered, radius.lg, shadow.lg, z.modal
   backdrop color.scrim
```

**Regions.** Sizes: sm = `size.container-sm` (confirmations), md = `size.container-md` (forms — default), lg = `size.container-lg` (pickers/preview; rare). Pinned header + footer, scrollable body (padding `space.6`). Primary action right-most; destructive primaries use `danger` emphasis. Vertical position: centered, top-anchored at 10vh when body height varies (prevents jumping).

**Responsive.** Desktop/Wide/Tablet: centered dialog. Mobile: full-screen (md/lg) or bottom sheet (sm, `radius.2xl` top corners, drag-to-dismiss).

**Scroll.** Body only; background locked. If the body doesn't scroll at md size, content likely belongs on a page.

**Focus & keyboard.** Focus trapped; initial focus on first field or least-destructive action; Esc cancels (with unsaved-changes guard); full contract in doc 04/11.

**Z-tokens.** `z.modal`; internal popovers `z.popover`; Toast above all. Max one modal above one drawer (see § Right Drawer).

**Composition.** May be opened from any layout. Never opens a Right Drawer or another full modal from within (Confirmation Dialog on top is the one exception).

---

## 9. Wizard Layout

**Purpose.** Linear multi-step flow with progress, one decision cluster per step (Seller Onboarding Wizard, Listing Editor create mode, Checkout — see 05 § Wizard).

**Use when** ≥ 3 dependent steps, or a mandatory setup ritual. **Do NOT use** for 2 trivial steps (single form), non-linear editing (Settings Layout/Tabs), or expert repeat-flows without a "skip to review" path.

```
Desktop                                        Mobile
┌────────────────────────────────────────┐    ┌──────────────────┐
│ ● Details ── ● Pricing ── ○ Review     │    │ Step 2/3 ▓▓▓▓░░  │
│────────────────────────────────────────│    │──────────────────│
│         Step body                      │    │ Step body        │
│      (max size.container-md)           │    │                  │
│────────────────────────────────────────│    │──────────────────│
│ [‹ Back]                    [Continue ›]│    │ [‹]   [Continue ›]│
└────────────────────────────────────────┘    └──────────────────┘
```

**Regions.** Wizard progress header (numbered steps — distinct from the Stepper form control, states: complete `color.success` / current `color.primary` / upcoming `color.text-subtle`; completed steps clickable, forward jumps disabled unless valid); body centered at `size.container-md` (forms cap `size.container-sm` — foundations §4); pinned footer: Back (ghost, hidden on step 1) + Continue (primary) + optional "Save draft" (secondary, left). Suppresses shell navigation chrome (full-page takeover) or renders inside Content Area for lightweight wizards — doc 08 decides per screen.

**Responsive.** Desktop/Wide: horizontal stepper. Tablet: horizontal, labels may truncate to numbers. Mobile: stepper → "Step n/N" + Progress bar; footer sticky above safe-area.

**Scroll.** Body scrolls per step; header/footer pinned. Step transition: horizontal slide `motion.duration-slow` `motion.easing-in-out` (fade under reduced motion). Validation blocks Continue with Inline Error + focus-to-first-error.

**Z-tokens.** `z.base`; sticky footer `z.sticky`.

**Composition.** Inside Content Area or as takeover; the Form Wizard component (doc 04) implements the step machinery. Never inside Modal Layout except a 2–3-step md modal explicitly specced in doc 08.

---

## 10. Settings Layout

**Purpose.** Categorized preference/configuration surface: category navigation + one scrollable form page per category (Account Settings, Store Settings, System Settings).

**Use when** ≥ 3 categories of independent, editable configuration. **Do NOT use** for linear onboarding (Wizard Layout) or a single short form (plain Content Area).

```
Desktop                                   Mobile
┌──────────┬───────────────────────┐     ┌──────────────┐   ┌──────────────┐
│ Profile  │ Section title         │     │ Settings     │ → │ ‹ Profile    │
│ Security │ ───────────────────── │     │  Profile   › │   │ [form]       │
│ Notifi-  │ Field Group           │     │  Security  › │   │              │
│ cations  │ Field Group           │     │  Notifs    › │   └──────────────┘
│ Billing  │ [Save]                │     └──────────────┘
└──────────┴───────────────────────┘
  secondary nav (Nested Sidebar pattern)
```

**Regions.** Left category nav ~200–240px (a Nested Sidebar usage — navigation.md); form column capped at `size.container-sm`–`md` inside a `size.container-lg` Content Area. Sections = Field Groups separated by `space.8` (foundations §2). Save model: per-section save buttons *or* a sticky dirty-state save bar at the bottom (`z.sticky`) — one model per product, doc 08 fixes it; destructive zone last, separated, `danger` emphasis.

**Responsive.** Desktop/Wide: two columns. Tablet: category nav collapses to a horizontal Tabs row above the form. Mobile: master→detail push (category list screen → form screen).

**Scroll.** Form column scrolls; category nav pinned. Deep links per category + anchor (doc 06 URL scheme).

**Z-tokens.** `z.base`; sticky save bar `z.sticky`.

**Composition.** Inside Content Area of Sidebar Layout — settings categories never merge into the main Sidebar tree.

---

## 11. Authentication Layout

**Purpose.** Minimal centered single-card layout for identity flows (Sign In, Sign Up, Forgot Password, Email Verification) — no App Shell.

**Use when** the user is unauthenticated or must re-authenticate. **Do NOT use** for in-app confirmations or as a generic "centered card" (that's Blank State Layout inside a shell).

```
┌──────────────────────────────────────┐
│                                      │
│            [logo]                    │
│      ┌──────────────────┐            │
│      │ Sign in          │            │
│      │ (heading-lg)     │            │
│      │ [email        ]  │            │
│      │ [password     ]  │            │
│      │ [   Sign in   ]  │            │
│      │ SSO ─ divider ─  │            │
│      │ links (body-sm)  │            │
│      └──────────────────┘            │
│         footer links                 │
└──────────────────────────────────────┘
  card: size.container-sm, radius.xl, shadow.sm on color.bg
```

**Regions.** Card `size.container-sm`, padding `space.8`, `radius.xl` (foundations §6), `shadow.sm` or flat + `border.1`; logo above; one primary action per screen; secondary paths as text links. Optional split-brand variant: 50% brand panel (Wide/Desktop only) + 50% card column. Legal/footer links `text.body-sm` `color.text-muted`.

**Responsive.** Wide/Desktop: centered (or split-brand). Tablet: centered. Mobile: card sheds its border/shadow and becomes the page (padding `space.4`), full-width controls.

**Scroll.** Page scrolls if viewport is short; card never internally scrolls.

**Z-tokens.** `z.base`; Toast permitted (`z.tooltip` region) for e.g. "verification email sent".

**Composition.** Standalone — never inside App Shell. Copy rules for auth microcopy: doc 10.

---

## 12. Dashboard Layout

**Purpose.** Widget grid summarizing state with drill-in paths: Metric Cards row, Charts Container, Activity Feed etc. (Buyer/Seller/Admin Dashboards).

**Use when** the screen answers "how are things?" and routes to work. **Do NOT use** as a dumping ground for actions (navigation's job), or when users need one deep table (make that the screen instead).

```
Desktop (12-col)                        Mobile
┌──────┬──────┬──────┬──────┐          ┌────────────┐
│Metric│Metric│Metric│Metric│  3 each  │ Metric     │
├──────┴───┬──┴──────┴──────┤          ├────────────┤
│ Chart  8 │ Activity Feed 4│          │ Metric     │
├──────────┴────────────────┤          ├────────────┤
│ Recent Activity (12)      │          │ Chart      │
└───────────────────────────┘          ├────────────┤
  gap space.6                          │ Feed       │
                                       └────────────┘
```

**Regions.** 12-col grid, gutter `space.6` (Desktop+) / `space.4` (below); canonical spans: Metric Card 3 (4-up) or 4 (3-up), Charts Container 6/8/12, feeds 4/6. Row 1 is always the KPI row (Metric Cards). Every Widget: `text.heading-md` title, drill-in affordance, and defined `loading` (Skeleton Loader), `empty` (mini Empty State), `error` (inline retry) states — a dashboard never shows a full-page spinner.

**Responsive.** Wide: 4-up KPIs, extra columns allowed ≥ `bp.wide`. Desktop: 4-up/3-up. Tablet: 2-col. Mobile: 1-col, KPI row may become a horizontal snap-scroll strip; order = importance (doc 08 fixes per-dashboard order).

**Scroll.** Content Area scrolls; widgets never scroll internally except bounded feeds (Activity Feed max-height ~480px with inner scroll + "View all" link).

**Z-tokens.** `z.base`; chart tooltips `z.tooltip`.

**Composition.** Inside Content Area of Sidebar Layout. Widgets are the Dashboard component family (doc 02 dashboard file; contracts doc 04). Customization (drag/reorder) is a per-product opt-in — see 05 § Dashboard.

---

## 13. Blank State Layout

**Purpose.** Full-body first-run/empty/no-access composition: explain, then launch the first action. Wraps the Empty State component at page scale.

**Use when** a screen has no data yet (no listings, no orders), a search/filter yields nothing (variant with "clear filters"), or access is denied/feature not enabled (variant with request-access CTA). **Do NOT use** for partial emptiness (one empty widget among full ones → widget-level empty state) or transient loading (Skeleton Loader).

```
┌──────────────────────────────────────┐
│ Page header (title, breadcrumb)      │  ← header ALWAYS remains
│                                      │
│              (illustration)          │
│         No listings yet              │  heading-md
│   Create your first listing to      │  body, text-muted
│         start selling.               │
│        [ Create listing ]            │  primary
│        Learn more ↗                  │  ghost/link
│                                      │
└──────────────────────────────────────┘
  block centered, max size.container-sm
```

**Regions.** Centered block (max `size.container-sm`, vertically centered in remaining body height): optional illustration/icon (24px+ glyph or product illustration, decorative — no tone colors unless the state is a warning) · title `text.heading-md` · 1–2 lines `text.body` `color.text-muted` · one primary CTA · optional secondary link. Copy patterns owned by doc 10 § Empty states.

**Responsive.** All ranges: centered; Mobile reduces vertical centering to top-third placement (keyboard/scroll ergonomics).

**Scroll.** None — fits the viewport body by construction.

**Z-tokens.** `z.base`.

**Composition.** Replaces the *body* of Content Area (never the page header — users must still know where they are and reach navigation). The compact Empty State component (data-display file) handles the same need inside widgets, tables, and panes.

---

## Composition rules (summary)

| Host | May contain | Never contains |
|---|---|---|
| App Shell | Sidebar Layout *or* Top Navigation Layout (+ Bottom Navigation (Mobile) at Mobile); one Content Area; Toast/Command Palette slots | Authentication Layout; a second App Shell |
| Content Area | Dashboard Layout, Settings Layout, Split View, Wizard Layout, Blank State Layout, plain grid pages | Another Content Area |
| Split View panes | Lists, Chat, detail pages; pane may open Right Drawer / Modal Layout | Split View |
| Right Drawer | Forms, detail views; may open Modal Layout (confirm) | Another Right Drawer; Wizard Layout |
| Modal Layout | Short forms, pickers, Confirmation Dialog content | Right Drawer; another Modal Layout (except Confirmation Dialog) |
| Wizard Layout | Step forms, review summaries | Nested Wizard Layout; Settings Layout |

Stacking sanity check: at any moment the maximum overlay depth is **base page → Right Drawer → Modal Layout (confirm) → Toast/Tooltip** — matching `z.base → z.modal → z.modal(+DOM order) → z.tooltip`. If a design needs more layers, the flow is wrong (see 03 § Feedback).
