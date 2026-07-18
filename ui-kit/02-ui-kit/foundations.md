# 02 · UI Kit — Foundations (Usage Guidelines)

> Part of the **Flexa UI Kit** (doc 02). This file defines *how to use* the FDS foundations — it defines **no tokens**. Token ids, values, and tiers live in [01-design-tokens.md](../01-design-tokens.md) and the FDS registry. Experience-level rules (why whitespace, error philosophy, perceived performance) live in doc 03; per-component code contracts live in doc 04; keyboard/contrast/touch rules in doc 11. When this file and 01 disagree, 01 wins.

## Design rationale

Flexa products are professional tools used for hours at a time. The foundations therefore optimize for **scan speed, low visual noise, and predictable rhythm** over decoration: one type ramp used the same way everywhere, a 4px spatial grid that makes alignment automatic, elevation earned by interaction (not painted on by default), and motion that confirms rather than entertains. Every rule below exists so that two screens built by two different teams — or by an AI following doc 12 — are indistinguishable in feel.

These guidelines are written as decision rules ("Use X when…") because that is how they are consumed: by a designer picking a heading level, by an engineer picking a gap token, by a reviewer rejecting a literal. Where a rule has a canonical number (control heights, ranges, container widths) that number lives in README or 01 — this file only tells you *which one to pick*.

Foundation hierarchy covered by this file:

1. Typography usage
2. Spacing usage & rhythm
3. Grid
4. Container usage
5. Elevation doctrine
6. Radius usage map
7. Borders
8. Interaction state recipes (cross-cutting)
9. Icons
10. Animation doctrine
11. Responsive behavior principles
12. Density modes
13. Foundations review checklist

---

## 1. Typography usage

Two families only: `font.family-heading` for `text.heading-*` composites, `font.family-base` for everything else. Never mix a third family; never hard-code sizes — the ramp is theme-driven (`Brand.fontScale`, see 01 §3), so a hard-coded size silently escapes rebranding and density.

### 1.1 Hierarchy map

| Composite | Role | Where it appears | Per screen |
|---|---|---|---|
| `text.heading-xl` | Page title | One per screen, top of Content Area (see layouts.md § Content Area) | Exactly 1 |
| `text.heading-lg` | Section title | Major section within a page; Dashboard Layout widget groups; Modal Layout title in large modals; Authentication Layout card title | 0–5 |
| `text.heading-md` | Card / panel title | Card, Metric Card, Right Drawer title, Confirmation Dialog title, Settings Layout group, Blank State Layout title | Unlimited, but one per container |
| `text.body` | Default reading text | Paragraphs, table cells, list items, descriptions, inputs | Default |
| `text.body-sm` | Secondary text | Metadata, timestamps, helper text, table cells in `compact` density, Breadcrumb, range summaries | Support only |
| `text.label` | UI labels | Form labels, Tabs, Sidebar items, Badge/Tag text, column headers, buttons | UI chrome |

Rules of use:

- **Choose by role, not size.** A card inside a section inside a page uses md → lg → xl naturally. If a screen needs a level between lg and md, the screen is over-structured — flatten it.
- **heading-xl vs heading-lg:** xl is reserved for the screen identity (matches the Breadcrumb leaf and the document title). lg answers "what is this block of the page about". If you are tempted to use xl twice, the second instance is a section — demote it.
- **heading-md** is the workhorse for containers. A Modal Layout ≤ `size.container-sm` uses heading-md for its title; larger modals may use heading-lg.
- Semantic heading order (h1→h2→h3) follows the visual hierarchy but is owned by doc 11; visually you may reuse heading-md at different DOM levels as long as the outline stays sane.
- Color: headings use `color.text`; never `color.primary` for headings — brand color signals interactivity (see 03 § Hierarchy), and a blue heading reads as a link.
- Secondary information uses `color.text-muted`; placeholders and disabled-adjacent text use `color.text-subtle` (01 §2). Do not simulate hierarchy by shrinking text below `text.body-sm` — de-emphasize with color, not size.
- Weight: composites carry their weight. Do not bold body text for emphasis blocks; bold is for inline emphasis of ≤ a few words. Never use color alone to encode meaning (01 §4 rule 3).

### 1.2 Links & inline styles

- Inline links inside body text: `color.primary`, underline on hover/focus at minimum (products may choose always-underlined; fix it product-wide). Standalone action links (e.g. "View all") use `text.label` weight, `color.primary`, no underline at rest.
- Visited-link styling is disabled inside apps (it encodes nothing useful in a tool), allowed on public content surfaces.
- Inline code/ids: `font.family-base` mono stack fallback is not a token — use the Tag/Badge or code-span treatment (`color.surface-alt` background, `radius.sm`, `space.1` padding) instead of introducing a family.

### 1.3 Numbers & data

- Tabular figures (fixed-width digits) for any column of numbers, timers, and Metric Card values — misaligned digits destroy scanability.
- Money: never truncate, never wrap between amount and currency; formatting rules (minor units, ISO-4217) come from doc 09; display composition (grouping, currency placement) from doc 10.
- Timestamps: relative ("2h ago") in feeds/lists with absolute on hover/focus tooltip; absolute in tables, Audit Log, Invoice Card. `text.body-sm` `color.text-muted`.

### 1.4 Line length & alignment

- Optimal measure: **45–75 characters** for reading text. Inside `size.container-xl` this means body copy blocks cap at ~`size.container-md` width even when the container is wider; forms cap at `size.container-sm`. Data tables are exempt.
- Left-align everything in LTR locales (mirror for RTL — doc 11). Center alignment only for: Blank State Layout content, Authentication Layout, Success/Error Page hero blocks. Never justify.
- Numeric table columns right-align; their headers right-align with them.
- Line-height comes from the composites; never override to cram rows — switch to `compact` density instead (§12).

### 1.5 Truncation rules

| Content | Rule |
|---|---|
| Single-line UI text (Sidebar item, table cell, Tab, Breadcrumb segment) | CSS ellipsis at 1 line; full value in a tooltip on hover/focus (`z.tooltip`) |
| Card titles, list item titles | Clamp at 2 lines, ellipsis; no tooltip needed if a detail view exists |
| Descriptions in cards/feeds | Clamp at 3 lines + explicit "Show more" when the full text matters (comments, disputes) |
| Never truncate | Error messages, amounts of money, legal/consent text, Validation Message |
| IDs & hashes | Middle-truncate (`ab12…9f3e`) with copy-to-clipboard action |

Truncation is a layout tool, not an information-hiding tool: if users routinely need the hidden part, redesign the column/card instead.

---

## 2. Spacing usage

All spacing comes from the `space.*` ramp (13 steps, 4px base — 01 §2). No margins/paddings outside the ramp; density mode rescales the ramp globally, so hand-tuned literals break density (01 §2). Spacing is the **first** tool of visual grouping — reach for it before backgrounds, borders, or shadows (§5).

### 2.1 Gap defaults per context

| Context | Token | Used for |
|---|---|---|
| Icon ↔ its text label | `space.2` | Buttons, Sidebar items, Badge with icon |
| Related controls in a cluster | `space.2` | Segmented controls, Chip rows, button groups |
| Between a form label and its control | `space.1` | All form fields |
| Between control and its helper/error text | `space.1` | Validation Message placement |
| Between form fields | `space.4` | Vertical stack inside a Field Group |
| Between Field Groups / form sections | `space.8` | Settings Layout, Wizard Layout steps |
| Card internal padding | `space.4` (compact) / `space.6` (comfortable) | Card, Metric Card, panels, drawer/modal bodies |
| Between sibling cards / grid gutter | `space.4` (Mobile) / `space.6` (Desktop+) | Dashboard Layout, Media Grid |
| Between page sections | `space.8` … `space.12` | Content Area vertical rhythm |
| Page padding (Content Area inset) | `space.4` (Mobile) / `space.6` (Tablet) / `space.8` (Desktop+) | All layouts |
| Table cell padding | `space.3` × `space.4` (comfortable) / `space.2` × `space.3` (compact) | Table, Data Grid |
| Menu/list item padding | `space.2` × `space.3` | Context Menu, dropdown items |
| Toast/Alert internal padding | `space.4` | Feedback surfaces |

### 2.2 Section rhythm

Vertical rhythm on a page is a descending ramp: page padding (`space.8`) > between sections (`space.8–12`) > heading-to-content (`space.4`) > within content (`space.2–4`). **Space communicates grouping**: elements separated by less space than their neighbors are read as one group — prefer widening the outer gap over adding a border or background.

Ownership rule: spacing between siblings belongs to the **parent** (gap), not to the children (margin). A component's outermost element carries no external margin — this is what makes components composable across layouts without spacing bugs.

Anti-patterns: `space.1` used as a general gap (it is for label↔control and tight icon alignment only); mixing `space.5` into a stack that otherwise uses the 4/8 rhythm (5 exists for control-height math, not rhythm); equalizing all gaps (uniform space = no grouping information); compensating density with custom margins.

---

## 3. Grid

- **12-column fluid grid** inside the Content Area. Columns are fractional; only gutters and margins are tokens.
- Gutter: `space.6` Desktop/Wide, `space.4` Tablet and Mobile (where >1 column exists at all).
- Column spans snap to the canonical splits: 12 (full), 8+4 (main + rail — the Split View ratio), 6+6, 4+4+4, 3×4, 3+3+3+3. Odd spans (5+7 etc.) require a documented reason in the screen spec (doc 08).
- Row behavior: items in a grid row top-align; cards in one row stretch to equal height only when they are the same component type (a KPI row), never mixed types.
- Forms do not use the grid for field layout; they use single-column stacks capped at `size.container-sm` (fields in a row only for tightly-coupled pairs like city/postcode, split 8+4 or 6+6). Multi-column forms measurably slow completion — see 03.
- The grid nests one level at most (an 8-col main region may itself split 6+6). Deeper nesting means the screen needs a different layout — usually Split View or Tabs (layouts.md).
- Breaking the grid is allowed only for full-bleed work surfaces (`size.container-full` cases, §4) and App Shell chrome.

## 4. Container usage

| Token | Use for |
|---|---|
| `size.container-sm` | Authentication Layout card, forms, Confirmation Dialog, Command Palette, focused single-task pages, Blank State Layout content block |
| `size.container-md` | Wizard Layout step body, reading-heavy pages, default Modal Layout |
| `size.container-lg` | Settings Layout, detail pages without a side rail, large Modal Layout |
| `size.container-xl` | Default Content Area max width — dashboards, tables, lists (the canonical page cap, see layouts.md) |
| `size.container-full` | Data Grid / Kanban Board / Calendar work surfaces that earn edge-to-edge width |

Containers center within the remaining viewport (after Sidebar) at Wide range; below that they are fluid with the page padding of §2.1. A screen picks **one** container for its Content Area; individual blocks inside may be narrower (see line-length rule §1.4) but never wider. Never chain containers (a `container-md` block inside a `container-lg` page is fine; a page that switches containers between sections is not — split the screen).

## 5. Elevation doctrine

Order of preference for separating things — always try the earlier tool first:

1. **Whitespace** (§2 rhythm) — the default group separator.
2. **Surface shift** — `color.surface` on `color.bg`, or `color.surface-alt` for insets (code blocks, table header rows, wells, hover highlights).
3. **Border** — `border.1` + `color.border` only when scanning demands a hard edge (table rows, input fields, dividers between unrelated dense regions).
4. **Shadow** — reserved for things that **float above the page**, never for static grouping.

| Level | Token | Reserved for |
|---|---|---|
| Resting | none | Cards, panels, wells — flat by default; a resting card is surface + whitespace, optionally `border.1` |
| Raised | `shadow.sm` | Hover-lift on interactive cards (Product Card, Listing Card), sticky headers once scrolled, Quick Actions bar, Authentication Layout card |
| Overlay | `shadow.md` | Dropdowns, Select menus, Context Menu, Autocomplete, popovers, tooltips |
| Modal | `shadow.lg` | Modal Layout, Right Drawer, Command Palette, sheets, Floating Action Button |
| Peak | `shadow.xl` | Rare: drag ghost during drag-and-drop, spotlight onboarding. One per screen at most |

Rules:

- Shadows imply stacking, so every shadow level pairs with the matching `z.*` token (01 §2): overlay ↔ `z.dropdown`/`z.popover`, modal ↔ `z.modal`, tooltip ↔ `z.tooltip`. A shadow without a z-token, or vice versa, is a review flag.
- Elevation is earned by interaction: a card gains `shadow.sm` because it is clickable and hovered, not because it "looks nice". Static screens should be nearly shadow-free.
- Scrims behind modal surfaces use `color.scrim`. Stacked overlays share one scrim — never two scrims at once.
- Dark scheme: shadows lose contrast on dark surfaces — components remain scheme-agnostic and the theme compensates via surface steps; never add borders "for dark mode" in component specs.

## 6. Radius usage map

| Token | Component class |
|---|---|
| `radius.none` | Full-bleed regions: App Shell bars, Sidebar, table outer frame when flush with Content Area edges, Warning/Maintenance Banner |
| `radius.sm` | Small inline chrome: Badge, Tag, Checkbox box, keyboard-key hints, code spans |
| `radius.md` | **Default interactive radius**: buttons (via `c.button.radius`), Input and all field controls, Select, Chip, pill-variant Tab items' container, Context Menu items, thumbnails |
| `radius.lg` | Containers: Card, Modal Layout, Right Drawer (leading corners), dropdown/popover surfaces, Toast, Command Palette |
| `radius.xl` | Hero containers: Blank State Layout illustration card, Authentication Layout card, marketing-adjacent panels |
| `radius.2xl` | Sheets (mobile bottom sheets — top corners only), oversized feature cards |
| `radius.full` | Avatar, circular icon buttons, Floating Action Button, pill Badge/counter, Switch track/thumb, Progress bar, pill Tabs |

Rules: children never have a larger radius than their parent container; nested radius steps down one level (Card `radius.lg` → inner media `radius.md`). Buttons read `c.button.radius` (component tier) so themes can square or round the whole product in one move — do not hard-bind buttons to `radius.md`. When a rounded element touches a container edge (drawer, sheet), only the free corners round.

## 7. Borders

- Weights: `border.1` for virtually everything; `border.2` for selected/active emphasis (selected Card, focused-within Field Group, active Tab underline renders at this weight); `border.4`/`border.8` only as accent bars (left edge of Alert, active Sidebar indicator).
- Colors: `color.border` default; `color.border-strong` for controls that must read as affordances against `color.surface` (Input, Select, Checkbox); tone colors (`color.danger` etc.) only for state (error field, destructive confirm) — never decorative.
- Divider policy: prefer whitespace (§5). Use a divider only between **unrelated** dense regions (table rows, menu groups, list items in `compact` density). Never double-separate (divider + background shift + gap); pick one.
- Focus is not a border: focus is always an outline ring in `color.focus-ring`, drawn outside the element edge so it never shifts layout, and never removed — full contract in doc 11. Selected ≠ focused: selection may use `border.2` `color.primary`; focus is always the ring; an element can be both.

## 8. Interaction state recipes (cross-cutting)

The 10-state vocabulary (README) maps to tokens the same way everywhere. Component files apply these recipes; they do not invent new ones.

| State | Generic recipe |
|---|---|
| default | Component's resting tokens |
| hover | Background step: transparent → `color.surface-alt`, or filled brand: `color.primary` → `color.primary-hover`; transition `motion.duration-fast` |
| focus | `color.focus-ring` outline outside the edge; never replaces hover styling, adds to it |
| active | Filled brand: `color.primary-active`; neutral: one surface step deeper; pressed feel may add scale ≤ 2% at `motion.duration-fast` |
| disabled | `opacity.disabled` on the whole control; no hover/active response; cursor default; keep label readable — if a disabled control needs explanation, add a tooltip (03 § error philosophy) |
| loading | Inline spinner or Skeleton Loader *within* the component's own bounds; the component keeps its size (no layout jump); sibling controls disable, they don't vanish |
| empty | Compact Empty State inside the component's content slot; the frame stays |
| success | Tone pair `color.success`/`on-success` + icon + text; transient success prefers Toast, persistent uses Badge/Alert |
| error | Tone pair `color.danger`/`on-danger`; field-level → Validation Message; region-level → Alert; never color alone |
| warning | Tone pair `color.warning`/`on-warning`; same channel rules as error |

Tone usage is exclusive to meaning: `info/success/warning/danger` communicate status, never decoration or brand accents (01 §4).

## 9. Icons

- Sizes: **16px** inline with `text.body-sm`/`text.label` (table cells, Badge, input affixes) · **20px** default UI size (buttons, Sidebar, Tabs, menu items) · **24px** standalone/touch contexts (Top Navigation actions, Bottom Navigation (Mobile), Empty State, FAB glyph). Nothing between or beyond without a doc-08 exception.
- Style: single stroke family, consistent stroke weight across the set, filled variants only to signal the *active* state of the same glyph (Bottom Navigation, Sidebar active item may use filled). Never mix icon families in one product; never scale an icon to a non-canonical size to "fit".
- Pairing with text: icon precedes label at `space.2` gap; icon inherits `currentColor` from the text; icon size pairs with the text size per the table above; icon optically centers against the text's cap height. Trailing icons only for direction/disclosure (chevron, external-link).
- **Icon-only controls must have an accessible name** (aria-label per doc 04) **and** a tooltip on hover/focus. Icon-only is allowed only for universally understood glyphs (close ✕, search, settings, more "⋯"); anything domain-specific gets a visible label.
- Decorative icons (Empty State illustration, section markers) are hidden from assistive tech (doc 11) and use `color.text-subtle` or the illustration palette — never tone colors unless the state itself is a status.
- Meaning: icons decorate, tone communicates — a status icon always pairs with the tone system and, where space permits, a text label (01 §4 rule 3).

## 10. Animation doctrine

Motion confirms causality and preserves context; it never blocks input and never plays for decoration. Durations/easings are the three FDS steps only (01 §2 Motion):

| Interaction class | Duration | Easing | Examples |
|---|---|---|---|
| Micro-feedback | `motion.duration-fast` | `motion.easing-standard` | Hover/active color shifts, Checkbox/Switch toggle, focus ring appearance, tooltip fade, icon swaps, badge count change |
| Spatial change | `motion.duration-normal` | `motion.easing-out` (enter) / `motion.easing-in` (exit) | Right Drawer, Modal Layout, Accordion, dropdowns/Context Menu, Toast enter, Sidebar collapse |
| Page-level | `motion.duration-slow` | `motion.easing-in-out` | Wizard Layout step transition, route-level content swap, Kanban column reflow |

Rules:

- Enter animations may translate ≤ `space.2` + fade; exits are faster than or equal to enters (use `duration-fast` exits for `duration-normal` enters where snappiness matters). Overlays scale from 98%, not from 0.
- Choreography: when several items enter together (dashboard widgets, list items), stagger ≤ 3 items at `motion.duration-fast` intervals or don't stagger at all — long cascades read as slowness.
- Nothing animates the layout of *other* elements except accordions/drawers whose purpose is reflow; never animate width/height of text containers during typing.
- Loading: Skeleton Loader for structure known in advance; spinners only for indeterminate sub-second-to-few-seconds waits; Progress for measurable jobs. No skeleton for waits <300ms — a flash of skeleton is worse than none (perceived-performance thresholds live in 03).
- Attention: at most one attention-seeking motion per screen (a pulsing badge on a critical alert); it stops after one cycle or on first interaction.
- **`prefers-reduced-motion: reduce`** is mandatory: drop all transforms/translations, keep opacity fades ≤ `motion.duration-fast`, or disable entirely. Parallax, auto-playing motion, and looping decorative animation are banned outright.

## 11. Responsive behavior principles

Mobile-first CSS; the four canonical ranges are defined in README (Mobile ≤767 / Tablet 768–1023 / Desktop 1024–1439 / Wide ≥1440) and never re-derived per screen.

- **Content parity**: smaller ranges reorganize, they do not remove capability. Anything cut from a range must remain reachable (overflow menu, "More" screen, drill-in).
- **One transformation per boundary**: a component defines how it changes at each range once, in its own spec — screens do not invent per-screen responsive behavior for shared components (that drift is what doc 04 review catches).

| Boundary | What transforms (layout specifics in layouts.md) |
|---|---|
| → Mobile | Sidebar → Bottom Navigation (Mobile) + drawer for the long tail; popovers/Context Menu → bottom sheets; Modal Layout → full-screen; multi-column grids → 1 column; tables → card lists or horizontal scroll with pinned first column; Breadcrumb → back link; hover interactions gain tap equivalents |
| → Tablet | Sidebar collapses to the 64px rail (expand on demand); grids cap at 2 columns; Split View stacks or becomes master→detail push; header action labels may drop to icons+tooltips |
| → Desktop | Full 240px Sidebar, standard density, popovers over sheets, Breadcrumb returns |
| → Wide | Content Area capped at `size.container-xl` and centered; extra columns permitted ≥ `bp.wide`; line length never grows past §1.4 limits |

- Touch targets ≥ 44×44px on Mobile/Tablet even when the visual glyph is smaller (doc 11 owns the rule; the padding trick — small glyph, big hit area — is the standard implementation).
- Hover is an enhancement, never the only path: any hover-revealed action or tooltip content needs a focus/tap equivalent.
- Breakpoints respond to the **viewport**; component-level adaptation inside resizable panes (Split View panes, drawers) is specified against pane width in doc 04 where it matters.
- Test the boundaries, not just the ranges: 767→768 and 1023→1024 transitions must not lose scroll position, focus, or entered data.

## 12. Density modes

Two modes, set per surface (not per component): **`comfortable`** (default everywhere) and **`compact`** (opt-in for data-heavy admin surfaces: Table, Data Grid, System Logs, Queue Monitor, Audit Log).

| Aspect | comfortable | compact |
|---|---|---|
| Mechanism | `Brand.density` 1.0 (ramp as shipped) | Surface-scoped density ≈0.85 — the `space.*` ramp rescales; components do **not** hand-shrink |
| Control height | md 40px default | sm 32px default |
| Table row text | `text.body` | `text.body-sm` |
| Card padding | `space.6` | `space.4` |
| Menu item height | 32px min | 28px min (pointer-only surfaces) |

Rules:

- Density is inherited by everything inside the surface — no mixed-density siblings in one region; a compact table's toolbar, pagination, and filters are compact too.
- Mobile never uses `compact` (touch targets win); a density toggle disappears at Mobile rather than disabling.
- Density changes spacing and control metrics only — type hierarchy roles (§1) and tone semantics are untouched; it is not a zoom.
- User-facing density toggles appear only on screens doc 08 marks as data-dense, live in the Data Management Toolbar, and persist per user.
- Brand-level density (`Brand.density`, 01 §3) is a *product* calibration set by theming, orthogonal to the per-surface mode; the two multiply, which is why literals are forbidden (§2).

## 13. Foundations review checklist

Reject a screen or component spec if any of these fail — each maps to a section above:

1. Any hex/px/rgb literal where a token exists (01 §4) — including "temporary" ones.
2. More than one `text.heading-xl`, or heading levels chosen by size instead of role (§1.1).
3. Gaps off the 4/8 rhythm, sibling spacing implemented as child margins (§2.2).
4. Grid spans outside the canonical splits without a doc-08 note (§3).
5. Static grouping done with shadows, or a shadow without its paired `z.*` token (§5).
6. Radius larger on a child than its parent; buttons hard-bound to `radius.md` instead of `c.button.radius` (§6).
7. Focus styled as a border, or removed; selection and focus conflated (§7, §8).
8. Icon-only control without accessible name + tooltip; icon sizes off the 16/20/24 ladder (§9).
9. Motion outside the three duration steps; missing reduced-motion behavior (§10).
10. Capability that exists at Desktop but is unreachable at Mobile (§11).
11. Mixed density within one surface, or `compact` at Mobile (§12).

---

*Next in doc 02: [layouts.md](layouts.md) (the 13 canonical layouts) · [navigation.md](navigation.md) (11 navigation components). Props & ARIA per component: doc 04. Experience rules: doc 03. Accessibility contract: doc 11.*
