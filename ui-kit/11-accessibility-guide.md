# 11 — Flexa Accessibility Guide

> **Normative.** This document owns every accessibility rule in the Flexa UI Kit ecosystem.
> Precedence: only FDS tokens outrank this guide (see `README.md`). A component contract (04),
> a pattern (05), or a screen spec (08) MUST NOT ship anything that violates a rule here.
> This guide owns the **rules and rationale**; 04 Component Bible instantiates them as
> per-component ARIA/keyboard tables. When 04 and 11 disagree, 11 wins.
>
> Language: MUST / MUST NOT / SHOULD / SHOULD NOT / NEVER / MAY per RFC-2119 intent.

---

## 1. Baseline & scope

### 1.1 Conformance baseline

- **WCAG 2.2 Level AA is the mandatory baseline** for every Flexa product and every
  component in the canonical inventory — web, mobile (native and hybrid), and WordPress
  plugin admin UIs. There is no "internal tool" exemption: admin dashboards, Queue Monitor,
  System Logs, and Background Jobs Panel are held to the same bar as public checkout.
- A component that cannot meet AA in any of its documented states (`default · hover ·
  focus · active · disabled · loading · empty · success · error · warning`) MUST NOT be
  added to the inventory. A screen that composes only conformant components but breaks
  conformance at the page level (heading order, landmark duplication, focus order) fails
  release — composition is audited, not just parts (§11).

### 1.2 AAA aspirations

The following AAA criteria are **targets, not gates**. Meet them when the cost is low;
document the reason when you do not:

- **1.4.6 Contrast (Enhanced)** — 7:1 body text where the theme allows.
- **2.4.9 Link Purpose (Link Only)** — link text meaningful without surrounding context.
- **2.5.5 Target Size (Enhanced)** — our 44×44px rule (§7) already satisfies this on touch surfaces.
- **3.3.9 Accessible Authentication (Enhanced)** — no object-recognition CAPTCHA at all.
- **2.3.3 Animation from Interactions** — all non-essential motion removable (§8 makes this effectively mandatory).

### 1.3 Platform scope

| Surface | Baseline | Notes |
|---|---|---|
| Web (Next.js/React, SaaS) | WCAG 2.2 AA | Primary target of this guide. |
| WordPress admin UIs | WCAG 2.2 AA | Flexa components MUST NOT rely on WP-core styling for conformance; our tokens and contracts apply inside `.fx-` roots. |
| Mobile (native/hybrid) | WCAG 2.2 AA + platform guidance | Map contracts to platform APIs: `aria-label` → `accessibilityLabel`/`contentDescription`; live regions → announcements API; focus order → accessibility traversal order. The *rules* here are platform-agnostic; the *mechanisms* map per platform. |

### 1.4 Assistive technology support matrix

Test against (minimum): **NVDA + Chromium** and **VoiceOver + Safari** on desktop;
**VoiceOver (iOS)** and **TalkBack (Android)** on mobile. JAWS SHOULD be smoke-tested for
Admin products. Keyboard-only (no SR) is a separate mandatory pass (§11).

---

## 2. Keyboard navigation

### 2.1 Universal rules

- **Everything operable by pointer MUST be operable by keyboard** (WCAG 2.1.1), with no
  timing-dependent keystrokes (2.1.2 no keyboard trap, except dialogs per §3.4).
- Interactive elements MUST be reachable in a **logical Tab order that matches visual order** (§3.2).
- A composite widget (menu, listbox, grid, tree, tabs) occupies **one Tab stop**; internal
  navigation uses arrow keys (§2.3). NEVER make every option/row/cell a Tab stop.
- `Enter` activates the focused control; `Space` additionally activates buttons, toggles
  checkboxes/switches, and (in grids/listboxes) toggles selection. Links activate with
  `Enter` only.
- Keyboard operation MUST produce the same outcome as pointer operation — no
  keyboard-only dead ends, no pointer-only affordances (§7.4 hover-revealed actions).

### 2.2 Canonical key map per widget class

These key maps follow the **WAI-ARIA Authoring Practices Guide (APG)** and are the
contracts 04 instantiates per component. 04 MUST NOT invent alternative bindings; it MAY
add product-specific extras that do not conflict with the maps below.

#### Button / Link
| Key | Action |
|---|---|
| `Enter` | Activate |
| `Space` | Activate (button only; NEVER links) |

Applies to: every `primary | secondary | ghost | danger` action, Floating Action Button,
Quick Actions, icon-only buttons.

#### Menus (Context Menu, dropdown menus, Bulk Actions Bar overflow)
| Key | Action |
|---|---|
| `Enter` / `Space` / `↓` | Open menu from trigger; focus first item |
| `↑` (on trigger) | Open menu; focus last item |
| `↓` / `↑` | Next / previous item (wrap allowed) |
| `→` / `←` | Open / close submenu |
| `Home` / `End` | First / last item |
| `Esc` | Close menu; focus returns to trigger |
| Printable char | Typeahead to matching item |

Context Menu additionally: `Shift+F10` or the `Menu` key opens it on the focused element.

#### Dialogs (Modal Layout, Confirmation Dialog, Right Drawer when modal)
| Key | Action |
|---|---|
| `Tab` / `Shift+Tab` | Cycle within the dialog (trapped, §3.4) |
| `Esc` | Close (MUST NOT be disabled; destructive dialogs confirm on activation, never on Esc) |
| `Enter` | Activate focused control; in Confirmation Dialog it MUST NOT default to the destructive action |

#### Tabs
| Key | Action |
|---|---|
| `→` / `←` | Next / previous tab (horizontal); `↓`/`↑` for vertical tab lists |
| `Home` / `End` | First / last tab |
| `Enter` / `Space` | Activate tab (when using manual activation) |
| `Tab` | Leave the tab list into the active panel |

Automatic activation (select on arrow) MAY be used when panels render instantly;
manual activation MUST be used when switching triggers network fetches.

#### Combobox / Autocomplete (Select, Autocomplete, Tag Input, Search Bar suggestions, Command Palette)
| Key | Action |
|---|---|
| `↓` / `↑` | Open popup / move through suggestions (`aria-activedescendant`, §2.4) |
| `Enter` | Commit highlighted option |
| `Esc` | Close popup; second `Esc` clears input (Command Palette: first `Esc` closes) |
| `Alt+↓` / `Alt+↑` | Open / close popup without moving selection |
| `Backspace` (Tag Input, empty input) | Remove last tag; `←`/`→` traverse tags, `Delete` removes focused tag |

#### Listbox (Select popup, Conversation List when list-selection, transfer lists)
| Key | Action |
|---|---|
| `↓` / `↑` | Next / previous option |
| `Home` / `End` | First / last option |
| `Space` | Toggle selection (multi-select) |
| `Shift+↓/↑` | Extend selection; `Ctrl/Cmd+A` select all (multi-select) |
| Printable char | Typeahead |

#### Grid / Table (Table, Virtual Table, Data Grid, Calendar, Permission Matrix)
| Key | Action |
|---|---|
| `→ ← ↑ ↓` | Move cell focus |
| `Home` / `End` | First / last cell in row; `Ctrl+Home/End` first / last cell of grid |
| `PageUp` / `PageDown` | Scroll by page (Virtual Table MUST support this) |
| `Enter` | Activate cell content / enter edit mode (inline editing) |
| `Esc` | Exit edit mode, revert; focus stays on the cell |
| `Space` | Toggle row selection (selection column) |
| `Tab` | Leave the grid (one Tab stop for the whole grid) |

Static data Table (no interactive cells) is a reading structure, not a grid — it takes no
`role="grid"` and no arrow-key model; only its interactive children are Tab stops.

#### Tree (Tree, Nested Sidebar)
| Key | Action |
|---|---|
| `↓` / `↑` | Next / previous visible node |
| `→` | Expand closed node / move to first child |
| `←` | Collapse open node / move to parent |
| `Home` / `End` | First / last visible node |
| `Enter` | Activate node (navigate / select) |
| `*` | Expand all siblings (SHOULD) |

#### Slider (Slider, Stepper counterpart)
| Key | Action |
|---|---|
| `→` / `↑` | Increase by step; `←`/`↓` decrease |
| `PageUp` / `PageDown` | Increase / decrease by large step (10× step or documented) |
| `Home` / `End` | Minimum / maximum |

Stepper: `↑`/`↓` increment/decrement in the input; the +/− buttons are ordinary buttons.

#### Drag & drop — keyboard alternative (Kanban Board, sortable lists, Image Gallery Upload ordering, Drag & Drop Upload)
Every drag interaction MUST have a keyboard-equivalent **grab → move → drop** cycle:

| Key | Action |
|---|---|
| `Space` / `Enter` on item | **Grab** — item enters "lifted" state, announced via live region ("Grabbed *Invoice #341*, position 2 of 8") |
| `↑ ↓ ← →` | Move within/between lists; each move announced ("Moved to *In Review*, position 1 of 3") |
| `Space` / `Enter` | **Drop** — commit; announce final position |
| `Esc` | Cancel — return to original position; announce cancellation |

A visible menu alternative ("Move to…" in the item's Context Menu) SHOULD also exist —
it is more discoverable than grab-and-arrow. Drag & Drop Upload MUST have a plain
file-picker button; drag is enhancement only (§7.3).

### 2.3 Roving tabindex vs `aria-activedescendant`

Two sanctioned mechanisms for intra-widget focus; 04 declares which one per component:

- **Roving tabindex** (default): the active item has `tabindex="0"`, all siblings
  `tabindex="-1"`; arrow keys move real DOM focus. Use for Tabs, menus, Tree, Radio Group,
  toolbars, Kanban Board, Data Grid cells. Pros: real focus = free scroll-into-view,
  `:focus-visible`, correct SR context.
- **`aria-activedescendant`**: DOM focus stays on the container/input; the highlighted
  item is referenced by id. Use where focus must stay in a text input while navigating a
  popup: Autocomplete, Select's searchable popup, Command Palette, Mention suggestions,
  Tag Input suggestions.

Rules: NEVER mix both in one widget. With `aria-activedescendant`, the referenced item
MUST be scrolled into view manually and MUST get a visible highlight equal in strength to
the focus ring (§3.1). In Virtual Table / virtual lists, the active row MUST be kept
mounted while it is the activedescendant.

### 2.4 Global shortcuts — coordination with 05 § Keyboard Shortcuts

Doc 05 owns the shortcut registry (Command Palette `Ctrl/Cmd+K`, etc.). This guide owns
the safety rules the registry MUST obey:

1. **No conflicts with AT and browser keys.** NEVER bind: `Tab`, `Esc` (outside its
   widget meaning), `F6`, arrow keys at page scope, `Ctrl+Alt+…` combos VoiceOver uses,
   `Insert+…` (NVDA/JAWS modifier), or single keys that collide with SR quick-nav
   (`H`, `B`, `K`, `T`, `L`, `1–6`) while a virtual cursor may be active.
2. **Single-character shortcuts** (WCAG 2.1.4): MUST be inactive while focus is in any
   text-entry context (Input, Textarea, Rich Text Editor, Markdown Editor, contenteditable,
   Search Bar) and MUST be user-disableable or remappable via a settings surface.
3. Every registered shortcut MUST be discoverable: listed in the Command Palette and/or a
   shortcut help overlay (bound to `?` under rule 2).
4. Shortcuts are enhancements: every shortcut action MUST also be reachable through
   visible UI.

### 2.5 Skip links & bypass blocks

- Every screen using App Shell MUST render a **skip link** ("Skip to main content") as the
  first focusable element, visually hidden until focused, targeting the `main` landmark.
- Screens with heavy pre-content chrome (Sidebar + Top Navigation + filters) SHOULD offer
  additional skips ("Skip to results") — Search Results and moderation queues in particular.
- Repeated blocks (Sidebar) are also bypassed structurally via landmarks (§4.2) — skip
  links complement, not replace, landmarks.

### 2.6 No focus traps outside dialogs

Focus MUST NOT be trapped anywhere except open modal surfaces (§3.4). Widgets with
internal arrow-key models (grids, trees, menus) MUST always release focus on `Tab`.
Infinite scroll regions MUST NOT capture Tab (§5.6). Embedded third-party iframes that
trap focus fail release.

---

## 3. Focus management

### 3.1 Visible focus — always

- Every focusable element MUST show a visible focus indicator:
  **outline `2px` solid `color.focus-ring`, `outline-offset: 2px`** (component tokens MAY
  adjust offset inward for tightly packed cells, never below 1px visual separation).
- `outline: none` / `outline: 0` without an equal-or-stronger replacement is **forbidden**.
  Code review rejects it, same as raw hex (01 §4).
- Using `:focus-visible` to suppress the ring on pointer clicks is allowed and recommended
  for buttons; text inputs SHOULD show the ring on any focus.
- The indicator MUST meet **3:1 contrast** against adjacent colors in both schemes —
  `color.focus-ring` is CI-gated in FDS `contrast.ts`; custom-surface components (cards on
  imagery) MUST verify locally.
- Focus indication MUST NOT rely on color change alone; the ring is a shape change.

### 3.2 Focus order

- **Focus order = DOM order = visual order.** Achieve visual layout with CSS that
  preserves source order. Positive `tabindex` values are **banned**; only `0` and `-1`.
- CSS `order` / `flex-direction: *-reverse` / grid placement MUST NOT reorder interactive
  elements relative to DOM order. RTL mirroring via logical properties is fine (§10.4) —
  DOM order still matches the *reading* order.
- Off-screen or collapsed content (closed Accordion panels, inactive tab panels, closed
  Sidebar on mobile) MUST be removed from the tab order (`hidden`, `inert`, or unmounted).

### 3.3 Focus on open — dialogs, drawers, popovers

On opening Modal Layout, Confirmation Dialog, Right Drawer, or any modal sheet:

1. Focus moves **into** the surface: the first meaningful control, or the dialog heading
   (`tabindex="-1"`) when the content starts with prose the user should read first.
   Confirmation Dialog focuses the **safe** action (Cancel), never the destructive one.
2. Focus is **trapped** inside while open (§3.4).
3. `Esc` closes (§2.2 Dialogs). An explicit close button MUST exist and be the last or
   first Tab stop, consistently per 04.
4. On close, focus **restores to the invoking element**. If the invoker is gone (deleted
   row), fall back per §3.5.

Non-modal popovers (Context Menu, Select popup, Tooltip, hovers): no trap; `Esc` closes
and returns focus to the trigger; `Tab` closes the popover and moves on naturally.

### 3.4 Focus trap contract

- The trap cycles `Tab`/`Shift+Tab` within the modal surface only.
- Background content MUST be inert (`inert` attribute or `aria-hidden="true"` on siblings
  + pointer/scroll blocking) so SR virtual cursors cannot wander out.
- Nested modals: the trap belongs to the top-most surface; closing it restores the trap
  (and focus) to the surface below.
- Toast MUST NOT take focus (§4.5); Loading Overlay traps only if it is truly blocking,
  and MUST set focus on a status element announcing what is happening.

### 3.5 Focus on destroy — delete, dismiss, remove

When the focused element is removed (delete row, remove Tag/Chip, dismiss card):

1. Move focus to the **next sibling** in the list; if none, the **previous sibling**;
2. if the list is now empty, the **list container or its heading** (`tabindex="-1"`),
   which now renders Empty State;
3. announce the outcome via live region ("*Listing removed. 12 items remaining.*").

Focus MUST NOT silently fall to `<body>` — that strands keyboard and SR users at the top
of the page. Bulk delete (Bulk Actions Bar) focuses the Data Management Toolbar and
announces the count.

### 3.6 Focus on route change (SPA navigation)

- On client-side navigation, move focus to the new screen's **main `h1`**
  (`tabindex="-1"`) — not to `<body>`, not to the skip link — and update the document
  title first (§10.1) so the announcement is "*Orders — Flexa*, heading level 1, Orders".
- A route-level live region MAY additionally announce "Navigated to Orders" for SRs that
  miss focus moves; do not do both with different wording.
- Wizard steps (Form Wizard, Checkout, Seller Onboarding Wizard) are route changes for
  this purpose: focus the step heading on every step transition.

### 3.7 Async content — never steal focus

- Content that arrives asynchronously (feed updates, chart data, Activity Feed items,
  chat messages, AI Generation Status results) MUST NOT move focus. Announce via live
  regions (§4.5) instead.
- Exception: content the user explicitly requested *and* that opens a new modal surface
  (e.g. "Edit" fetches then opens a drawer) — the normal §3.3 rules apply once it opens.
  If the fetch takes > 400ms, show Skeleton Loader / spinner with `aria-busy` (§5.7) and
  still do not move focus until the surface opens.
- Autofocus on page load is allowed only on single-purpose screens (Sign In focuses the
  email Input; Command Palette focuses its Prompt-style input). Dashboards MUST NOT autofocus.

---

## 4. ARIA doctrine

### 4.1 First rule of ARIA

**Use native HTML first.** `<button>`, `<a href>`, `<input>`, `<select>`, `<table>`,
`<details>`, `<dialog>`, `<nav>`, `<fieldset>` come with role, state, keyboard behavior,
and AT mappings for free. ARIA is for widgets HTML has no element for (tabs, tree,
combobox listbox popups, live regions). A `<div role="button" tabindex="0">` that
reimplements `<button>` is a defect. Corollaries:

- NEVER change native semantics when a native element fits (`role="button"` on `<a>` —
  just use the right element; links navigate, buttons act).
- NEVER add redundant roles (`role="button"` on `<button>`).
- `role="presentation"` / `aria-hidden="true"` MUST NOT be applied to focusable elements.

### 4.2 Landmark structure per layout

Every layout in 02 maps to exactly this landmark skeleton; 04/08 MUST NOT deviate:

| Region | Element/role | Rule |
|---|---|---|
| App header (Top Navigation) | `<header>` → `banner` | Exactly one at page level. |
| Sidebar / Nested Sidebar | `<nav aria-label="Primary">` | Every `nav` MUST have a distinguishing `aria-label` when more than one exists (Primary, Breadcrumb, Pagination). |
| Content Area | `<main>` | **Exactly one `main` per page.** Split View: one `main`; panes are regions within it. |
| Right Drawer (non-modal), auxiliary panels | `<aside>` → `complementary` | Label it (`aria-label="Order details"`). |
| App footer | `<footer>` → `contentinfo` | Exactly one at page level. |
| Search Bar (site-level) | `role="search"` | One per header; in-page filters are not `search` landmarks. |
| Named sections (Dashboard widgets) | `section` + `aria-labelledby` → `region` | Only when the widget deserves quick-nav; do not landmark every Card. |

All page content MUST live inside some landmark — no orphan content between landmarks.

### 4.3 Heading hierarchy

- **Exactly one `h1` per screen** — the screen title (matches document title, §10.1).
- No skipped levels downward (h2 → h4 forbidden). Component headings (Card titles,
  Widget titles, dialog titles) take the level their position dictates — components
  therefore accept a heading-level property rather than hard-coding `h3` (contract for 04).
- Headings are structure, not styling. Style with `text.heading-*` composites; never pick
  an `hN` for its size. Never fake a heading with bold text.
- Modal Layout / Right Drawer content starts its own subtree at `h2` (the dialog title),
  referenced by `aria-labelledby` on the dialog.

### 4.4 Name, role, value for custom widgets

Every custom widget MUST expose:

- **Role** — the correct APG pattern role (`tablist/tab/tabpanel`, `tree/treeitem`,
  `combobox` + `listbox/option`, `grid/row/gridcell`, `switch`, `slider`, `dialog`,
  `menu/menuitem`, `radiogroup/radio`, `status`, `alert`, `log`, `progressbar`).
- **Accessible name** — from visible text where possible (`aria-labelledby` > `aria-label`).
  The accessible name MUST contain the visible label text (WCAG 2.5.3 Label in Name) —
  voice-control users say what they see.
- **Value & states** — `aria-expanded`, `aria-selected`, `aria-checked`, `aria-pressed`,
  `aria-current`, `aria-disabled`, `aria-valuenow/min/max/valuetext` (Slider, Progress),
  `aria-sort` (sortable Table headers), `aria-haspopup`, `aria-controls`, kept in sync
  with actual state on every change. State classes (`.is-open`) are styling hooks only —
  never a substitute for ARIA state.

04 owns the exact per-component table (role, required properties, state transitions) and
MUST derive each from the APG pattern named here — no invented roles, no `aria-*`
attributes outside the ARIA spec.

### 4.5 Live regions

One doctrine, four channels — 04 maps components onto these, never invents new politeness mixes:

| Channel | Mechanism | Used by | Rules |
|---|---|---|---|
| **Status (polite)** | `role="status"` (implicit `aria-live="polite"`, `aria-atomic="true"`) | Toast, Payment Status changes, autosave "Saved", filter result counts, AI Generation Status, drag-and-drop move announcements (§2.2) | MUST NOT take focus. Container mounted at app start (SRs ignore freshly-inserted live regions). One message at a time; queue, don't overwrite mid-announcement. |
| **Errors (assertive)** | `role="alert"` | Inline Error appearing on blur/submit, Warning Banner on arrival, connection loss (Offline State), destructive failures | Interrupts the user — reserve for things requiring immediate awareness. NEVER for success/info. Do not focus the alert itself; pair with §9.1 error summary focus rules on submit. |
| **Chat/log (polite, additive)** | `role="log"` | Chat message stream, Activity Feed live updates, Comment Thread live additions, System Logs tail | Announces additions only; `aria-atomic="false"`. New-message announcements MUST be throttleable (SR users can mute a busy Chat via a visible control). |
| **Busy** | `aria-busy="true"` on the updating region + completion announcement | Any region under Skeleton Loader / Loading Overlay / refetch | Set `aria-busy` while loading, clear it when done, then announce completion via the status channel ("*Orders loaded, 25 rows*"). `aria-busy` alone is not an announcement. |

### 4.6 Icon-only controls & decorative graphics

- Every icon-only control (icon Button, Quick Actions, toolbar buttons, close ×,
  Floating Action Button) MUST have an accessible name via `aria-label` or
  `aria-labelledby`. Tooltip text MAY provide it via `aria-labelledby`/`aria-describedby`,
  but the name MUST exist even when tooltips are disabled.
- Decorative icons and images (icons next to visible text, Badge glyphs whose meaning is
  in the text, avatar rings) MUST be `aria-hidden="true"` (and `focusable="false"` for SVG).
- An icon that is the sole carrier of meaning without a name is a release blocker; axe
  flags it, humans confirm it (§11).

---

## 5. Screen reader considerations

### 5.1 Reading order

The SR virtual-cursor reading order is DOM order. Everything in §3.2 applies to
non-interactive content too: visual layout (multi-column Dashboard Layout, Split View,
Card grids) MUST read coherently linearized. Test: read the page top-to-bottom with the
virtual cursor; if a Metric Card's value reads before its label, fix the DOM, not with ARIA.

### 5.2 Table semantics

- Data tables (Table, Virtual Table, Order/Invoice line items, Marketplace Statistics
  breakdowns) MUST use real `<table>` semantics: `<th scope="col">` for column headers,
  `<th scope="row">` for row headers, `<caption>` (visually-hidden allowed) naming the table.
- Complex headers (two-tier) use `headers`/`id` associations; prefer redesigning to a
  simple grid instead.
- Sortable headers: the header contains a real button; `aria-sort="ascending|descending"`
  on the `<th>`, updated on change, and the change is announced via status channel.
- Layout MUST NOT use tables; CSS grid/flex only. Card-per-row responsive collapse
  (mobile) MUST keep a programmatic association between "label" and "value"
  (Description List semantics are the sanctioned pattern).
- Data Grid (interactive) adds `role="grid"` semantics per §2.2 on top of — not instead
  of — header associations.

### 5.3 Form field association

- Every field MUST have a programmatic label: `<label for>` (preferred) or
  `aria-labelledby`. Placeholder is NEVER the label (§9.2).
- Help text and error text attach via `aria-describedby` (help id first, error id second).
  Invalid fields set `aria-invalid="true"` — only when actually invalid, never preemptively.
- Groups (Radio Group, Checkbox groups, Date Range Picker's two inputs, address blocks)
  use `<fieldset>`/`<legend>` or `role="group"` + `aria-labelledby`. The group label +
  field label together MUST form a complete question ("Notification preferences — Email").
- Required fields: `required`/`aria-required="true"` + a visible indicator that is not
  color-alone (the word "required" or an asterisk explained once per form).

### 5.4 Status is never color alone — and never unlabeled

- Badge, Tag, Chip, Payment Status, Role Badge, AI Confidence Indicator MUST carry their
  meaning as **text** (visible, or visually-hidden prefix for icon-only badges), with tone
  (`neutral | info | success | warning | danger`) as reinforcement. A red dot is not a
  status; "Overdue" in a `danger`-tone Badge is.
- Escrow Timeline / Shipping Timeline steps expose state in text ("Step 3 of 5:
  Funds held — current step"), via `aria-current="step"` on the current step.
- Charts Container: see §6.3.

### 5.5 Time, currency, and amounts

- Timestamps render human-readable text with a machine hint (`<time datetime>`).
  Relative times ("2h ago") MUST expose the absolute time (title/`aria-label` or visible
  on demand). Live-updating relative times MUST NOT re-announce on every tick — update
  silently, no live region on the clock.
- Currency (Currency Input, Cart Summary, Checkout Summary, Earnings & Payouts): the
  accessible value MUST include the currency ("1,250.00 US dollars" or "$1,250.00 USD" —
  copy per doc 10). Never encode currency by symbol position alone; ISO code accompanies
  ambiguous symbols ("$"). Amounts split across styled spans (superscript cents) MUST
  still read as one number — keep the number in one text node or provide `aria-label`
  with the full amount.
- Percentages and deltas on Metric Card / Statistics Card read direction in text
  ("up 12% vs last month"), not by arrow color/glyph alone.

### 5.6 Infinite scroll & virtual lists

- On each page/batch load, announce via status channel: "*24 more results loaded,
  96 of 210 total*". On filter change: "*38 results*".
- Virtual Table / virtual lists (windowed DOM): expose totals with `aria-rowcount` /
  `aria-setsize` and positions with `aria-rowindex` / `aria-posinset` so "row 51 of 4,000"
  reads correctly while only 20 rows are mounted.
- Infinite scroll MUST have a reachable end for keyboard users: a "Load more" button
  (auto-load MAY trigger on scroll, but the button exists and content after the list —
  footer — stays reachable). Pagination is the accessible default for Admin data (05 owns
  the choice matrix; this rule constrains it).
- Scroll position and focus MUST survive batch insertion — new items append; they never
  displace the focused element (§3.7).

### 5.7 Skeletons & loading

- Skeleton Loader is decorative: `aria-hidden="true"`, zero text, not focusable. The
  *region* it fills sets `aria-busy="true"` and, when content arrives, clears it and
  announces completion (§4.5 Busy channel).
- Loading longer than ~10s SHOULD announce progress updates at sensible intervals
  (Progress with `aria-valuetext`, or periodic status messages) — silence reads as breakage.
- Text alternatives arrive with content, not with skeletons — SRs MUST never read a
  skeleton's shimmer boxes.

---

## 6. Color & contrast

### 6.1 Inherit the FDS gates

- Text contrast: **4.5:1** normal text, **3:1** large text (≥ 24px / ≥ 18.5px bold) —
  WCAG 1.4.3. All shipped FDS pairs (`color.text` on `color.bg`/`color.surface`,
  every `on-*` on its fill, `color.focus-ring` on surfaces) pass AA and are **CI-gated by
  FDS `contrast.ts`** (`CONTRAST_PAIRS`), light and dark.
- The UI Kit inherits the guarantee **only while using shipped pairs** (01 §2). Any new
  combination (text over `color.surface-alt`, tone-on-tone) MUST be added to the same
  gate or measured in review — never eyeballed.

### 6.2 Non-text contrast (3:1)

UI component boundaries and meaningful graphics MUST hit **3:1** against adjacent colors
(WCAG 1.4.11): input borders (`color.border` on `color.surface` is gated for this),
checkbox/radio/switch outlines in every state, focus ring (§3.1), slider tracks/thumbs,
chart lines, icon-only control glyphs, Progress fills, Rating stars (both filled and
empty states must be distinguishable). Disabled controls are exempt from contrast minima
(`opacity.disabled`) but MUST still be identifiable as present.

### 6.3 Never color-alone for meaning

Restating 01 §4.3 with the enforcement details this guide owns:

- Every status pairs color with **text and/or icon**: validation (§9), Badge/Tag (§5.4),
  Escrow Timeline states (held/released/disputed each get distinct icon + label, not just
  green/amber/red), Payment Status, diff views (AI Diff Viewer adds +/− glyphs and
  ins/del semantics, not just red/green fills).
- **Charts** (Charts Container, Marketplace Statistics): series MUST be distinguishable
  without color — direct labels, distinct markers/dash patterns, or an ordered legend
  plus accessible data alternative. Every chart MUST expose its data accessibly: a
  visually-hidden or on-demand data table, or a text summary of the trend. A canvas/SVG
  with only `aria-label="Sales chart"` fails.
- Links inside prose MUST be underlined or otherwise non-color distinguished; link color
  alone is insufficient at 3:1 vs body text.

### 6.4 Dark mode

Dark scheme ships in the default theme with its own gated pairs — contrast **holds by
construction** when components use semantic tokens only (01 §3). Components MUST remain
scheme-agnostic: no scheme-conditional styles, no "dark mode fixes" with literals. A
component that needs a different token in dark mode is a theme bug — file it against FDS,
do not patch locally.

### 6.5 High contrast / forced colors

- Windows High Contrast / `forced-colors: active` strips author colors. Components MUST
  survive: focus indication via `outline` (survives; `box-shadow` rings do not — another
  reason §3.1 mandates outline), meaningful boundaries via real `border`s
  (`border-color: transparent` trick where a border exists only in forced mode is sanctioned),
  icons via `currentColor` fills, selected/checked states not conveyed by
  background-color alone (add a glyph or border change).
- Do not disable forced colors (`forced-color-adjust: none`) except for color swatches
  (Color Picker) where the color IS the content.
- Smoke-test the five most complex components (Data Grid, Kanban Board, Date Picker,
  Command Palette, Escrow Timeline) in forced-colors mode per release (§11.4).

---

## 7. Touch & pointer

### 7.1 Target size — the 44px rule (owned here)

- **Minimum interactive target: 44×44px** on touch-capable surfaces. This is *our* bar —
  deliberately above the WCAG 2.2 AA minimum of 24×24px (2.5.8) — and it is the rule
  README delegates to this guide.
- The **visual** control may be smaller (a 20px checkbox); the **hit area** must not be —
  extend with padding or pseudo-element hit zones. Control heights sm 32 / md 40 / lg 48
  (README): `sm` and `md` controls MUST extend their touch area to 44px on touch surfaces;
  `lg` complies natively. Prefer `md`/`lg` on mobile screens.
- Dense desktop-only surfaces (compact Table rows, System Logs) MAY go below 44px but
  NEVER below the WCAG 24×24px floor, and only where an equivalent action exists at
  conforming size (row action also in a detail view) or the target is inline in text (exempt).
- Inline text links within prose are exempt (WCAG exemption) — but standalone tappable
  rows, icons, chips, and pagination items are not prose.

### 7.2 Spacing between targets

Adjacent interactive targets MUST be separated by at least **`space.2`** (8px) edge-to-edge
of hit areas — undersized targets may count surrounding free space toward their 24px WCAG
floor only if no other target intrudes. Icon-button clusters (Data Management Toolbar,
message actions) use `space.2` gaps minimum; destructive actions get `space.3`+ or
positional separation from their neighbors (03 owns the layout guidance; the minimum is normative here).

### 7.3 Dragging alternatives (WCAG 2.5.7)

Every dragging operation MUST have a single-pointer, non-dragging alternative:
Kanban Board card "Move to…" menu, sortable list up/down actions or the §2.2 keyboard
cycle surfaced as buttons, Slider's direct-tap-on-track plus its keyboard model,
Drag & Drop Upload's file-picker button, Date Range Picker's two explicit date fields.
Drag is always an enhancement, never the only path.

### 7.4 Pointer cancellation & hover-revealed actions

- **Pointer cancellation** (WCAG 2.5.2): activate on **up-event**, never on down; moving
  the pointer off the target before release cancels; drag operations abort with `Esc`
  and by dropping back on origin. No component may perform destructive actions on `pointerdown`.
- **Hover-revealed actions** (row actions appearing on hover, Card overlay buttons,
  Quick Actions on hover): the same actions MUST be revealed on keyboard focus
  (`:focus-within`), MUST be reachable on touch (always visible on touch surfaces, or via
  an explicit overflow "⋯" button), and appear in the row's Context Menu. Hover-only
  functionality is a defect.
- **Hover-triggered content** (Tooltip, preview popovers) per WCAG 1.4.13: dismissible
  (`Esc`), hoverable (pointer can move onto the popover), persistent (doesn't vanish on
  a timer while hovered/focused).

---

## 8. Motion & vestibular safety

### 8.1 `prefers-reduced-motion`

- Every animation and transition MUST honor `prefers-reduced-motion: reduce`, per
  01 §2 Motion: **drop transforms** (slides, scales, parallax-y movement), **keep or
  shorten opacity fades** to ≤ `motion.duration-fast`, or disable entirely.
  Skeleton shimmer becomes a static block; drawer slide becomes a fade or instant;
  Kanban drag animations snap; auto-advancing carousels stop.
- Reduced motion MUST NOT remove *information*: if motion communicated state
  (item moved, toast arrived), the non-motion presentation (position change, live region)
  still communicates it.
- Products SHOULD additionally expose an in-app motion toggle for platforms where the OS
  preference is hard to reach; the OS preference is the default.

### 8.2 Autoplay & flashing

- Nothing auto-plays, auto-scrolls, or auto-updates visibly for more than **5 seconds**
  without a pause/stop/hide control (WCAG 2.2.2): carousels, animated Activity Feed
  tickers, Marquee-like banners, background video. Auto-rotation stops permanently on
  hover, focus, or interaction.
- **No content flashes more than 3 times per second** (WCAG 2.3.1) — no exceptions, no
  "small area" carve-out in our products. Attention-seeking is done with a single pulse
  (≤ `motion.duration-slow`) or a static Badge.
- Parallax scrolling effects are **banned** across all Flexa products. Scroll-linked
  animation beyond trivial opacity is banned with them.

---

## 9. Forms

### 9.1 Errors — summary, association, focus

- On submit with errors: render an **error summary** (Alert, `role="alert"`) at the top
  of the form listing each error as a **link to its field**; move focus to the summary.
  Single-field forms MAY skip the summary and focus the invalid field directly.
- Each invalid field: `aria-invalid="true"`, error text in a Validation Message associated
  via `aria-describedby` (§5.3), icon + `danger` tone + text (never color alone, §6.3).
- Errors are announced when they *appear* (alert channel) but MUST NOT re-announce on
  every keystroke; validate on blur/submit, clear eagerly on fix (03 owns timing philosophy;
  the announcement contract is normative here).
- Error copy per doc 10: say what's wrong and how to fix it. Never clear the user's input
  on error (§9.4).

### 9.2 Labels & placeholders

- **Error text and labels are never placeholders.** Placeholder text disappears on input,
  fails contrast by design (`color.text-subtle`), and is not a programmatic label.
  Every field has a persistent visible label (§5.3). Placeholders MAY show format
  examples only ("DD/MM/YYYY"), duplicated in help text if the format is required knowledge.
- Floating-label patterns MUST keep the label visible and associated after input.

### 9.3 Autocomplete & input purpose

- Fields collecting user data MUST carry the correct `autocomplete` token
  (WCAG 1.3.5): `name`, `email`, `tel`, `street-address`, `postal-code`, `cc-number`,
  `new-password`/`current-password`, `one-time-code`, `bday`, `country`, `organization`.
  This powers browser autofill *and* AT input personalization.
- Use the correct input types (`type="email|tel|url|number"` or `inputmode`) so mobile
  keyboards match; Currency Input uses `inputmode="decimal"`, never `type="number"`
  spinner semantics for money.

### 9.4 WCAG 2.2 form criteria

- **Timeouts (2.2.1):** sessions that expire MUST warn before expiry with an accessible
  dialog (§3.3) offering extension in ≥ 20s of decision time; checkout/escrow holds
  display remaining time as text and never silently discard entered data — restore state
  on re-authentication.
- **Redundant entry (3.3.7):** never ask for the same information twice in a flow —
  Checkout offers "billing same as shipping"; Seller Onboarding Wizard carries data
  across steps; re-shown forms are pre-populated. Confirmation fields (password ×2) are
  the sanctioned exception; email-confirm fields SHOULD be avoided.
- **Accessible authentication (3.3.8):** no cognitive-function-only test to sign in —
  no puzzle/object-recognition CAPTCHA, no transcription tasks, no memorized-secret-only
  step that blocks paste or password managers. Sanctioned: paste-enabled password +
  `autocomplete` (§9.3), magic links, OAuth, passkeys/WebAuthn, `one-time-code` autofill.
  Blocking paste in password or OTP fields is forbidden.
- **Consistent help (3.2.6):** the help affordance (support link, chat launcher) appears
  in the same location on every screen — 06 IA owns the slot; the consistency rule is normative here.

---

## 10. Content

### 10.1 Page titles

- Every screen has a unique, front-loaded `document.title`:
  `"{Screen} — {Product}"` ("Order #341 — Flexa Marketplace"), updated **before** SPA
  focus handling (§3.6) so the announcement carries the new title. Wizard steps include
  step context ("Payment (step 2 of 3) — Checkout — Flexa Marketplace").
- The `h1` and the title agree (title MAY be longer). Unsaved-state markers ("• Unsaved")
  prefix the title where documents are edited.

### 10.2 Link & button purpose

- Link/button text is meaningful in isolation: never bare "Click here", "Read more",
  "Learn more" — voice-control and SR link lists strip context. Repeated per-row actions
  ("View") get row context in the accessible name (`aria-label="View order #341"`,
  visible text stays short).
- Links navigate; buttons act (§4.1). "Links" that submit/toggle are buttons regardless
  of styling; doc 10 owns copy, this guide owns the semantics.

### 10.3 Language

- `lang` attribute on the document, always correct (`lang="en"`, `lang="vi"`).
  User-generated or mixed-language fragments (a Vietnamese listing title in an English
  admin) get `lang` on the fragment when the language is known — pronunciation depends on it.
- Direction: `dir="rtl"` at the document/root level for RTL locales; per-fragment
  `dir="auto"` for user-generated content (Chat, Comment Thread, listing titles) so mixed
  bidi text renders correctly.

### 10.4 i18n & RTL flipping rules

- Layout MUST use CSS **logical properties** (`margin-inline-start`,
  `padding-inline-end`, `inset-inline`, `border-start-start-radius`) so RTL mirrors free.
  Physical left/right properties are reserved for genuinely physical concerns.
- **Icons that flip in RTL:** directional-flow icons — back/forward arrows, chevrons in
  Breadcrumb/Accordion/Tree expanders, "next step" arrows, list indent/outdent, send
  (paper-plane), undo/redo pairs, Pagination arrows.
- **Icons that NEVER flip:** clocks and time (clockwise is universal), media playback
  (play/rewind are conventionally LTR), checkmarks, logos and brand marks, sliders'
  physical metaphors when tied to numbers rendered LTR, question marks, text-containing
  icons, physical-world images.
- Numbers, phone numbers, and code stay LTR within RTL text (`dir="ltr"` islands or
  `unicode-bidi: isolate`). Keyboard arrow semantics in RTL: `→`/`←` follow *visual*
  direction in composite widgets (APG convention) — "forward" in a Tabs list is the
  visually-next tab.
- Text expansion: UI copy areas MUST tolerate +35% length (German) without truncating
  labels that carry meaning; truncation always exposes full text (tooltip + accessible name).

---

## 11. Testing & definition of done

### 11.1 Per-component a11y checklist (gate for 04 sign-off)

A component is not "done" until every line passes in both light and dark schemes:

```
□ Keyboard: every documented function operable per §2.2 key map; one Tab stop
  for composites; no trap (§2.6); visible focus §3.1 in every state
□ Screen reader: NVDA+Chromium AND VoiceOver+Safari — name/role/value correct
  in all states (§4.4); announcements per §4.5 channels; reading order sane (§5.1)
□ Zoom & reflow: 200% zoom fully usable; 400% (= 320px width) reflows to one
  column, no 2-D scrolling, nothing clipped (WCAG 1.4.10); text-spacing
  override (1.4.12) breaks nothing
□ Contrast: every state hits §6.1/§6.2 minima in both schemes; forced-colors
  smoke for complex components (§6.5)
□ Touch: 44px targets (§7.1), spacing (§7.2), drag alternative (§7.3),
  no hover-only affordances (§7.4)
□ Reduced motion: §8.1 behavior verified with the OS preference on
□ States: all ten canonical states (README) accessible — loading announces
  (§5.7), error associates (§9.1), disabled stays perceivable (§6.2)
□ RTL: renders mirrored correctly; icon flip list respected (§10.4)
```

### 11.2 Automated testing

- **axe-core (or equivalent) clean = necessary, not sufficient.** Automated scanners
  catch ~30–40% of WCAG failures — missing names, contrast, invalid ARIA — and none of
  the interaction contracts (§2, §3). A clean axe run is the *entry ticket* to manual testing.
- CI gates: axe on every component story/state permutation; FDS `contrast.ts` pair gate
  (already CI); lint bans (`outline:none` without replacement, positive `tabindex`,
  `aria-hidden` on focusables, missing `alt`, click handlers on non-interactive elements).
- Regression: keyboard-path e2e tests for the highest-risk composites (Dialog focus
  restore, Data Grid arrow model, Combobox commit/cancel, drag-and-drop keyboard cycle).

### 11.3 Manual test script template

Every component/screen PR that touches interaction uses this script; results attach to the PR:

```
Component/Screen: ................  Scheme: light / dark   Locale: LTR / RTL
1 TAB WALK      Tab through entire surface. Record order. = visual order?
                Focus visible on every stop? Any trap or dead end?
2 WIDGET KEYS   Exercise the §2.2 map for this widget class. Every action
                keyboard-reachable? Esc behavior correct? Shortcuts conflict-free?
3 SR PASS       (NVDA, then VoiceOver) Read page top-to-bottom: landmarks,
                headings (one h1? no skips?), then operate the widget:
                name/role/value announced on every state change? Live-region
                messages correct, no double announcements?
4 FOCUS EVENTS  Open/close dialogs (§3.3–3.4), delete an item (§3.5),
                navigate a route (§3.6), trigger async load (§3.7).
                Focus lands where specified every time?
5 ZOOM          200% and 400%: reflow, no clipping, no 2-D scroll.
6 VISION        Contrast spot-checks; grayscale pass (meaning survives?);
                forced-colors if in §6.5 smoke set.
7 TOUCH         (device or emulation) 44px targets, no hover-only actions,
                drag alternatives work.
8 MOTION        prefers-reduced-motion on: transforms gone, info preserved.
PASS = all green. Any red = fix or file blocker; "known issue" needs an owner + date.
```

### 11.4 Release gate

A product release MUST NOT ship if any of the following fail:

1. **Blockers:** any WCAG 2.2 A/AA failure on a critical path (auth, checkout/escrow,
   messaging, dispute filing, payout setup) — no exceptions, no waivers.
2. **Component gate:** every new/changed component passed §11.1 and has its 04 contract updated.
3. **Screen audit:** new screens pass a §11.3 script run end-to-end, including one full
   SR task completion ("buy a listing", "respond to a dispute") per persona affected.
4. **Smoke set:** forced-colors (§6.5) and RTL smoke on the release's top five most
   complex changed surfaces.
5. **Regression:** automated suite (§11.2) green; no new lint suppressions without a
   linked issue.

Non-critical AA issues found late get a tracked issue with owner and target release —
"tracked" is not "waived": two consecutive releases MUST NOT ship the same known AA defect.

### 11.5 Ownership

- The **component owner** owns §11.1 for their component; the **feature team** owns
  §11.3/§11.4 for their screens; **this guide's owner** arbitrates interpretation disputes
  and approves any deviation (deviations are documented inline in 04 with rationale and
  expiry, mirroring the token-literal discipline of 01 §4.5).
- Accessibility bugs are triaged with functional bugs at the same severity scale.
  "SR users can't complete checkout" is a P0 outage, not a polish item.
