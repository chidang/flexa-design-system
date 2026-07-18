# 02 — UI Kit · Data Display (+ Dashboard)

> Design-facing catalog for the 22 data display components and the 9 Dashboard components. Props/events/ARIA contracts in 04; accessibility detail in 11; microcopy (empty states, counts, relative time) in 10; loading thresholds and perceived-performance rules in 03. Tokens by FDS id only (see 01).

## Design rationale

Data display is where professional users spend their day; density and scanability beat decoration. The Flexa doctrine: **the data is the interface** — chrome recedes (whitespace over borders, `shadow.sm` over outlines), alignment does the work (numbers right, text left, one baseline grid), and every collection component ships with its loading (Skeleton Loader), empty (Empty State), and error stories designed up front, because a table that only works when full is half a component. Status is always tone + icon/text, never color alone.

## Component hierarchy

```
Collections            Structure           Atoms                 System states
├── Table              ├── Accordion       ├── Badge / Tag / Chip├── Skeleton Loader
├── Virtual Table      ├── Tree            ├── Avatar            └── Empty State
├── Data Grid          ├── Description List├── Progress
├── List               └── Timeline        ├── Rating
├── Kanban Board                           └── Statistic Block
├── Calendar
├── Gallery / Media Grid

Dashboard (composed of the above)
└── Widget ⊃ Metric Card · Statistics Card · Charts Container · Activity Feed
            · Timeline · Recent Activity · Progress Summary · Quick Links
```

---

## Table

- **Purpose.** The workhorse: records as rows, attributes as columns, with sorting, selection, and row actions. Reference for every tabular surface in Flexa products.
- **Use when** users compare records across consistent attributes, or operate on many records (admin lists, orders, users).
- **Not when** records are heterogeneous or media-led (Card grid / List), the set exceeds ~100 visible rows unpaged (Virtual Table), or cells are edited in place at spreadsheet intensity (Data Grid).
- **Variants.** Default (comfortable) · compact density · striped (long reference tables only) · with selection column · with expandable rows (chevron reveals detail panel) · with sticky header · with footer summary row (totals, `color.surface-alt`).

### Column types

| Type | Alignment | Content rules |
|---|---|---|
| Text | left | primary column may stack a `text.body-sm color.text-muted` secondary line; truncate with ellipsis + full value on hover/tooltip |
| Number | **right** | tabular numerals; consistent precision per column; units in the header, not per cell |
| Date | left | absolute short format; relative ("2h ago") only in activity contexts, with absolute on hover (see 10) |
| Status | left | Badge with tone (`neutral/info/success/warning/danger`); text label always present, never dot-only |
| Actions | right, last | hover-revealed icon buttons (max 2) + "⋯" overflow Context Menu for the rest; column header empty |

### Anatomy

```
┌ Data Management Toolbar (search · filters · view options)   see admin section of 02 ┐
├──┬───────────────────────┬───────────┬────────────┬──────────┬─────────┤
│☐ │ Customer ▲            │ Orders    │ Total      │ Status   │         │  ← sticky header
├──┼───────────────────────┼───────────┼────────────┼──────────┼─────────┤
│☐ │ Jane Cooper           │        12 │    $482.00 │ ●Active  │  ✎ ⋯    │  ← actions on hover
│  │ jane@acme.com         │           │            │          │         │
│☑ │ Wade Warren           │         3 │     $96.50 │ ●Paused  │  ✎ ⋯    │  ← selected: color.surface-alt
├──┴───────────────────────┴───────────┴────────────┴──────────┴─────────┤
│ [Bulk Actions Bar appears when ≥1 selected — see admin section of 02]  │
│ 1–25 of 312           Rows: [25 ▾]                 [←] 1 2 3 … 13 [→]  │  ← pagination footer
└─────────────────────────────────────────────────────────────────────────┘
```

- **Sortable headers.** Sortable columns show ▲/▼ on the active sort, a muted sort affordance on hover for the rest. One sort column at a time (multi-sort is a Data Grid capability). Clicking cycles asc → desc → (optional) none. Sort state persists per view (see 03 § state persistence).
- **Selection.** Leading checkbox column (Checkbox component; header checkbox = select page, indeterminate when partial). Selecting ≥1 row summons the **Bulk Actions Bar** (see admin section of 02) — selection count + actions; "Select all 312 across pages" link when page-select is used on a filtered set.
- **Sticky header** whenever the table scrolls within its container or the page (`z.sticky`); sticky first column allowed on wide tables with horizontal scroll.
- **Row density.** Comfortable row ≥ 52px (default) / compact 40px — density is a user/view toggle in the toolbar, persisted. Cell padding `space.4`/`space.2`.
- **Row actions.** Idle rows hide action icons (reduce noise); reveal on row hover *and* row focus-within (keyboard parity, see 11). Max 2 inline icon actions + overflow "⋯". Whole-row click opens the record only when a visible primary link exists in the row too.
- **Loading.** First load: 5–8 skeleton rows mirroring column widths (see Skeleton Loader). Subsequent loads (sort/filter/page): keep current rows at `opacity.disabled` with a thin Progress bar under the header — never flash back to skeleton.
- **Empty inside table.** Header row stays; body renders Empty State (icon + title + body + action). Filtered-empty uses the filtered variant ("No results match your filters" + Clear filters).
- **Pagination footer.** Range label + page-size Select + Pagination (navigation component). Cursor-based data uses Prev/Next only. Infinite scroll is reserved for feeds, never for admin tables (position/recall matters).
- **States.** Row: default · hover (`color.surface-alt`) · focus (ring inset) · selected · disabled (row-level, rare) · error (row-level failure after a bulk op: leading `color.danger` icon + message column). Table: loading · empty · error (inline Alert above rows with Retry — table chrome stays).
- **Responsive.**
  - Wide/Desktop: all columns.
  - Tablet: drop `priority: low` columns (each column declares priority high/medium/low in the screen spec, see 08).
  - Mobile: **card list transformation** — each row becomes a Card: primary text + status Badge on line 1, key figures as label/value pairs, actions in "⋯". Column-order = field-order. Selection via long-press or edit mode.
- **Best practices.** Pick 4–7 columns; everything else lives in the row's detail view. Align header text with its column's alignment. Right-align every money/count column or comparisons fail.
- **Common mistakes.** Centering everything; dot-only status; actions visible on all 50 rows at once; skeleton on every refetch; tables for 3 records (use Description List or Cards).

## Virtual Table

- **Purpose.** Table for large datasets, rendering only visible rows (windowing).
- **Use when** a single scrollable set exceeds **~100 rows** (virtualization threshold) — logs, transactions, moderation queues — and pagination would fragment the scanning task.
- **Not when** paged navigation is the mental model (orders by page), or rows have wildly variable expanded heights (virtualize only with measured rows — costly; prefer pagination).
- **Variants.** As Table (selection, sticky header) minus expandable rows by default; with infinite fetch (next page loads as the scrollbar approaches the end, threshold in 03).
- **Properties.** Fixed or measured row height; overscan rows for scroll smoothness; scrollbar reflects *total* dataset height; "Jump to top" affordance after deep scroll.
- **States.** As Table; plus fetch-ahead loading (skeleton rows appended at the bottom, never a spinner replacing the list) · error mid-stream (inline retry row at the failure point).
- **Responsive.** As Table; Mobile card-list also virtualizes.
- **Best practices.** Keep row height constant; announce total count in the toolbar ("12,482 events") since the end is far away; preserve scroll position across detail-and-back navigation (see 03).
- **Common mistakes.** Virtualizing 30 rows (complexity without benefit); losing keyboard navigation across unrendered rows (see 11); layout shift when real rows replace skeletons.

## Data Grid

- **Purpose.** Spreadsheet-grade grid: inline cell editing, multi-sort, column resize/reorder/pin, fill/copy ranges.
- **Use when** power users *edit* tabular data at volume (inventory, pricing matrices, attribute sheets).
- **Not when** read-mostly lists (Table) — Data Grid's editing chrome taxes reading.
- **Variants.** Read-only grid (analysis: multi-sort + pinning, no editing); editable grid; with grouped rows (collapsible group headers with aggregates).
- **Properties.** Cell editors reuse form components (Input, Select, Date Picker…) rendered in-cell on Enter/double-click; commit on Enter/blur, cancel on Esc; per-cell validation (invalid cell: `color.danger` outline + message on focus); column ops via header menu; frozen columns; undo/redo stack for edits.
- **States.** Cell: default · hover · focus (single ring, arrow-key navigable) · editing · error · saving (subtle per-cell spinner or dirty-dot until persisted) · success flash `motion.duration-fast`. Grid loading/empty as Table.
- **Responsive.** Desktop/Wide tool; on Tablet it degrades to read-only Table; on Mobile route users to per-record forms instead.
- **Best practices.** Autosave per cell with visible dirty/saved affordance (see 03); paste rectangular ranges from spreadsheets; keep the a11y grid contract (see 11).
- **Common mistakes.** Shipping Data Grid where Table suffices; edits lost on scroll-away; no undo for fill-down accidents.

## Card

- **Purpose.** Self-contained summary of one record: media/header/body/footer on a `color.surface` block.
- **Use when** records are media-led or heterogeneous, browsing beats comparing, or as a Mobile transformation target for Table rows.
- **Not when** dense attribute comparison across many records (Table) or pure text lists (List).
- **Variants.** Default (`radius.lg`, `shadow.sm`) · outlined (`border.1 color.border`, no shadow — dense grids) · interactive (whole card clickable: hover raises to `shadow.md`, `motion.duration-fast`) · horizontal (thumb left, Mobile lists) · with media (fixed aspect ratio top) · with footer actions.
- **Properties.** Slots: media · header (title `text.heading-md`/`text.body` + meta) · body · footer (actions right, meta left). One primary action per card; extra actions behind "⋯".
- **States.** default · hover (interactive only) · focus (ring) · disabled · loading (skeleton card mirroring slots) · selected (`border.2 color.primary`, selectable grids) · error (per-card failure: tone strip + retry).
- **Responsive.** Grid: 1-up Mobile / 2-up Tablet / 3–4-up Desktop+ with `space.6` gutters; horizontal variant preferred inside Mobile lists.
- **Best practices.** Fixed media aspect per grid (crop, don't letterbox); line-clamp titles at 2 lines so rows align; a card is a summary — link to detail, don't cram.
- **Common mistakes.** Nested cards; five buttons per card; clickable card *and* clickable title going different places; shadow + border together.

## List

- **Purpose.** Vertical stack of homogeneous items with leading/trailing slots — the simplest collection.
- **Use when** single-dimension scanning: settings rows, results, pickers, notification lists.
- **Not when** multi-attribute comparison (Table) or visual browsing (Card/Gallery).
- **Variants.** Plain · interactive rows (hover `color.surface-alt`) · with leading Avatar/icon · with trailing meta/action/chevron · two-line (title + `text.body-sm color.text-muted` description) · sectioned (sticky section headers) · with dividers (`border.1 color.border`) or spacing-separated (default — whitespace over borders).
- **Properties.** Row height ≥ 44px; slots: leading · content (1–2 lines) · trailing. Reorderable lists add a ⠿ handle (keyboard contract in 11).
- **States.** Row: default · hover · focus · active/selected (leading `border.2 color.primary` edge or `color.surface-alt`) · disabled · loading (skeleton rows) · empty (Empty State) · error (inline Alert).
- **Responsive.** Full-width at all ranges; trailing meta may drop to a second line on Mobile.
- **Best practices.** One line of primary + one of secondary max — more means the record needs a Card or detail view; keep trailing affordances consistent across rows.
- **Common mistakes.** Lists that are secretly tables (4+ facts per row, misaligned); mixed row heights; chevrons on non-navigating rows.

## Accordion

- **Purpose.** Vertically stacked expandable sections revealing one content panel each.
- **Use when** content is secondary and scanning headers first helps: FAQs, advanced settings, order sub-sections.
- **Not when** users need multiple sections simultaneously visible for a task (plain sections) or as primary navigation (Tabs/Sidebar).
- **Variants.** Single-open (opening one closes others — FAQs) · multi-open (independent — settings) · flush (borderless, divider-separated) · contained (each item on `color.surface` card).
- **Properties.** Header row = title + optional meta/Badge + chevron (rotates 180°, `motion.duration-normal`); panel animates height with `motion.easing-standard`; honors `prefers-reduced-motion` (snap, no animation).
- **States.** Header: default · hover · focus (ring) · disabled; item: collapsed/expanded; loading (panel skeleton when content is lazy).
- **Responsive.** Full width; on Mobile, Accordion is the standard collapse target for what was a Desktop multi-column section.
- **Best practices.** Headers are questions/nouns that stand alone; count/status Badge on the header when the panel carries actionable state ("Payouts ⚠ 2 issues").
- **Common mistakes.** Hiding critical content (price, errors) behind collapse; whole-header click area reduced to just the chevron; deep-linking that opens the page but not the relevant panel.

## Tree

- **Purpose.** Hierarchical parent/child structure with expand/collapse: folders, categories, org units.
- **Use when** depth is meaningful and users navigate or manage the hierarchy itself.
- **Not when** hierarchy is ≤2 levels (sectioned List) or it's really a value picker (cascading Selects).
- **Variants.** Navigation tree (single-select, drives a detail pane — Split View) · checkbox tree (multi-select with tri-state parents: parent indeterminate when children mixed) · editable tree (drag to re-parent ⠿, inline rename, "＋" add-child on hover).
- **Properties.** Indent `space.4`/level (guide lines optional, `color.border`); node = chevron (leaf: none, space preserved) + icon + label + optional count Badge; lazy children show an in-node spinner on first expand; keyboard: ↑↓ traverse, ←→ collapse/expand, typeahead (see 11).
- **States.** Node: default · hover · focus · selected (`color.surface-alt` + `border.2 color.primary` edge) · disabled · loading (children fetching) · drop-target (editable: insertion line `color.primary`) · error (failed branch: inline retry node).
- **Responsive.** Desktop-first; on Mobile prefer drill-down navigation (one level per screen, Breadcrumb back) over a squeezed tree.
- **Best practices.** Persist expansion state per user; auto-expand the path to a selected/deep-linked node; virtualize beyond ~100 visible nodes (same threshold as Virtual Table).
- **Common mistakes.** Expand only via the tiny chevron (row click should expand navigation-less parents); unbounded depth without horizontal management; mixing selection models in one tree.

## Kanban Board

- **Purpose.** Cards in status columns, moved by drag to change state: pipelines, order fulfilment, moderation stages.
- **Use when** items flow through 3–6 stages and *seeing the flow* is the job.
- **Not when** stages exceed ~6 (use Table + status filter), volume per column is huge (Virtual Table), or transitions have strict rules better served by explicit actions.
- **Variants.** Basic · with WIP limits (column count `4/5`; exceeding renders header `color.warning` treatment) · with swimlanes (horizontal grouping rows, e.g. per assignee) · with column add/reorder (board-builder contexts).
- **Properties.** Column = header (title + count Badge + "⋯" menu) + scrollable card stack + optional "＋ Add" footer; card = compact Card variant (title, meta chips, Avatar, due date); drag: lifted card `shadow.lg` slight scale, placeholder slot in source, insertion indicator in target (`color.primary` line); columns scroll horizontally as a set; keyboard alternative: card "⋯" → "Move to → column" (mandatory, see 11); invalid target columns dim (`opacity.disabled`) during drag.
- **States.** Card: default · hover · focus · dragging · drop-preview · saving (subtle spinner after drop until persisted; on failure card returns animated + error Toast) · disabled. Column: default · drag-over (`color.surface-alt` fill) · WIP-exceeded (warning) · empty (dashed slot: "No items — drag here or Add") · loading (2–3 skeleton cards).
- **Responsive.** Desktop/Wide: all columns, horizontal scroll beyond viewport. Tablet: narrower columns, snap-scroll. Mobile: **one column per screen** with swipe/Tabs between columns; move via the explicit "Move to" menu, not drag.
- **Best practices.** Optimistic move + revert-on-fail; column count visible always; empty columns keep their drop zone.
- **Common mistakes.** Drag as the only transition path; columns as categories rather than sequential states; cards so tall only two fit per column.

## Calendar

- **Purpose.** Time-grid display of events/availability: month, week, day views.
- **Use when** date relationships are the point — bookings, schedules, content calendars.
- **Not when** picking a date (Date Picker) or a chronological list suffices (Timeline/List — most "calendars" of sparse events read better as lists).
- **Variants.** Month (cells with up to N event chips + "+3 more" overflow popover) · Week/Day (hour rows, positioned event blocks, current-time line `color.danger`) · availability/slot grid (booking: tappable free/busy slots) · mini calendar (navigation aid — reuses Date Picker's calendar).
- **Properties.** Header: view switcher (Tabs sm: Month/Week/Day) + Today button + ←/→ period nav + period title; event chip: category color *token-mapped* + title, truncated; drag to move / edge-drag to resize where editing is allowed (keyboard alternative via event detail, see 11); all-day row in Week/Day.
- **States.** Cell/slot: default · hover · today (outline) · selected · disabled (out of month `color.text-subtle`, blocked slots hatched) · drag-over. Event: default · hover (`shadow.sm` lift) · focus · dragging · saving · error (revert + Toast). View: loading (skeleton grid, header intact) · empty (Week/Day with nothing: centered Empty State "No events this week" + primary "New event").
- **Responsive.** Desktop: all views. Tablet: month cells shrink to dot-density (chips → dots + count). Mobile: default to **Day/Agenda view** (chronological list per day); Month becomes a dot-grid date selector feeding the agenda below.
- **Best practices.** Never encode event meaning by color alone (icon/text in the chip, see 11); respect locale week start; keep "Today" one tap away always.
- **Common mistakes.** Month view crammed on Mobile; hidden overflow events with no "+N more"; timezone ambiguity on cross-tz scheduling (label the tz).

## Timeline

- **Purpose.** Chronological sequence of dated events on a vertical spine: order history, escrow milestones, audit trails.
- **Use when** *order and time between events* carries the meaning.
- **Not when** items are unordered (List) or represent process *stages* ahead (Form Wizard stepper / Shipping Timeline — see commerce section of 02).
- **Variants.** Basic (dot + line + content) · with tone icons per event (success ✓ / warning ⚠ / danger ✕ markers in tone colors + `on-*` pairs) · grouped by day (sticky date headers) · alternating sides (marketing only — never in app UIs) · compact (dense audit feeds).
- **Properties.** Event = marker + title + timestamp (`text.body-sm color.text-muted`; relative + absolute on hover, see 10) + optional body/attachment card; spine `border.1 color.border`; newest-first for activity, oldest-first for process narratives — one direction per context, stated in 08.
- **States.** default · hover (interactive events) · focus · pending future event (hollow marker, `color.text-subtle` dashed spine segment) · current (pulsing marker — respect reduced motion) · error event (danger marker) · loading (3 skeleton events) · empty ("No activity yet").
- **Responsive.** Single left-aligned spine at all ranges; alternating collapses to left.
- **Best practices.** Batch bursts ("3 items updated" expandable) instead of 40 identical rows; every event answers who/what/when.
- **Common mistakes.** Mixing directions across screens; timestamps without hover-absolute; using Timeline for future plans (that's a stepper).

## Gallery

- **Purpose.** Browse-first grid of images with lightbox viewing.
- **Use when** images are the content: listing photos, portfolios, evidence attachments.
- **Not when** managing/uploading (Image Gallery Upload) or mixed media administration (Media Grid).
- **Variants.** Uniform grid (fixed aspect, default) · masonry (editorial only) · with lightbox (full-screen viewer: `color.scrim` backdrop, ←/→ nav, zoom, caption, counter "3/12", `z.modal`) · with thumbnails strip in lightbox.
- **Properties.** Cell `radius.md`, gap `space.2`; lazy-load with skeleton shimmer per cell; alt text required per image (see 11); click → lightbox at that index; Esc closes and returns focus to origin cell.
- **States.** Cell: default · hover (slight zoom `motion.duration-fast` — reduced-motion: none) · focus · loading (skeleton) · error (broken image → neutral placeholder icon on `color.surface-alt`, never the browser broken glyph) · empty (Empty State).
- **Responsive.** 2-up Mobile / 3-up Tablet / 4–5-up Desktop+; lightbox swipe on touch.
- **Best practices.** Fixed aspect ratio per grid; preload lightbox neighbors; keep the count visible in the lightbox.
- **Common mistakes.** Masonry in app UIs (scan order breaks); lightbox trapping focus incorrectly (see 11); full-res thumbnails.

## Media Grid

- **Purpose.** Manage mixed media assets (images, video, documents) in a selectable grid — the library surface.
- **Use when** users organize, select, and act on assets: media library, attachment picker.
- **Not when** pure image browsing (Gallery) or file rows suit better (Table with file columns).
- **Variants.** Browse grid · picker mode (single/multi-select, confirm bar with count) · with detail sidebar (selected asset's metadata in a Right Drawer/side panel).
- **Properties.** Tile = thumbnail (type-appropriate: video shows duration Badge, documents show type icon on `color.surface-alt`) + name (truncate middle) + optional meta; selection: checkbox on hover/focus at tile corner, selected tile `border.2 color.primary`; toolbar above: search + type filter + upload (Drag & Drop Upload integrated — dropping anywhere on the grid uploads).
- **States.** Tile: default · hover · focus · selected · uploading (Progress overlay) · processing (spinner Badge "Processing…" for video transcode) · error (retry) · disabled (unsupported type in picker mode). Grid: loading (skeleton tiles) · empty ("No media yet" + Upload action) · filtered-empty.
- **Responsive.** 2-up Mobile / 3–4 Tablet / 5–6 Desktop+; detail sidebar becomes a bottom sheet on Mobile.
- **Best practices.** Show selection count and the confirm action persistently in picker mode; infinite scroll acceptable here (browsing, not auditing) with virtualization past ~100 tiles.
- **Common mistakes.** No type distinction on thumbnails; selection only via long-press with no visible affordance; upload divorced from the grid it fills.

## Statistic Block

- **Purpose.** Atom for one number + label (+ optional delta): the unit inside Metric Cards, summaries, and headers.
- **Use when** displaying a single computed figure anywhere outside a dashboard card.
- **Not when** it needs its own card chrome and trend on a dashboard (Metric Card).
- **Variants.** Value + label · with delta (▲/▼ + % in `color.success`/`color.danger`, direction *and* sign — never color alone) · with icon · inline row of blocks (order header: "Items 3 · Total $96 · Status Paid").
- **Properties.** Value `text.heading-lg` tabular numerals; label `text.label color.text-muted`; formatting per 10 (thousands separators, compact "12.4k" only where space demands, full value on hover).
- **States.** default · loading (skeleton bar in value position, label stays) · empty/no-data ("—" + muted label, never "0" when the truth is unknown) · error ("—" + retry affordance at the container level).
- **Responsive.** Rows of blocks wrap 2-up on Mobile.
- **Best practices.** Label answers "of what, over when" ("Revenue · 30d"); align blocks in a row to one baseline.
- **Common mistakes.** Deltas without a comparison basis; red/green as the only delta signal; fake precision ($1,234.5678).

## Badge

- **Purpose.** Small non-interactive status/label token bound to another element.
- **Use when** communicating state (order status, role, plan) or counts (unread dot/number on nav items).
- **Not when** user-removable (Chip), a content descriptor (Tag), or interactive at all.
- **Variants.** Tone badges — `neutral | info | success | warning | danger` mapping to FDS `color.*/on-*` pairs; soft (tinted background, tone-colored text — default in dense UIs) vs solid (tone bg + `on-*` text — high alert only); count badge (numeric, "99+" cap); dot badge (presence/attention, must have an accessible label — see 11).
- **Properties.** `radius.full`; `text.body-sm` or smaller per 04; optional leading icon; text label mandatory for status meaning.
- **States.** Static by definition — tone *is* the state; loading contexts skeleton the badge's slot.
- **Responsive.** Unchanged; may drop to dot form in the tightest Mobile navs (with a11y label).
- **Best practices.** One badge per element; consistent status→tone mapping product-wide (define once in 08's status table).
- **Common mistakes.** Badges as buttons; rainbow custom colors off the tone system; count badges that never clear.

## Tag

- **Purpose.** Content descriptor/keyword attached to a record; optionally navigates to filtered views.
- **Use when** categorizing content (topics, categories, attributes) — descriptive, not stateful.
- **Not when** status (Badge) or user-editable selection tokens (Chip).
- **Variants.** Static (neutral surface `color.surface-alt`, `radius.sm`) · linked (hover underline/raise; navigates to the tag's filter) · with count ("design 24") · colored by *category* only via tone-mapped tokens.
- **States.** default · hover/focus (linked only) · disabled.
- **Responsive.** Wrap rows; "+N" overflow beyond 2 lines with popover.
- **Best practices.** Lowercase-consistent casing; truncate long tags at ~24ch with title tooltip.
- **Common mistakes.** Tag/Badge/Chip used interchangeably (status crept into Tags); tags styled like buttons.

## Chip

- **Purpose.** Interactive compact token: removable selections, toggleable filters, input tokens.
- **Use when** the user *manipulates* the token — Tag Input values, active filter chips, quick-filter toggles.
- **Not when** static description (Tag) or status (Badge).
- **Variants.** Removable (trailing ✕, ≥24px hit area; Backspace removes when focused) · filter chip (toggleable: selected = `color.primary` tint + leading ✓) · choice chip row (single-select, Radio semantics) · with Avatar/icon leading (people tokens).
- **States.** default · hover · focus (ring) · selected · active (pressing) · disabled · error (invalid token in Tag Input: `color.danger` treatment).
- **Responsive.** Horizontal scroll row with edge fade on Mobile (filter chips) or wrap (input chips); height ≥ 32px, touch ≥ 44px effective.
- **Best practices.** Active-filter chips always show field + value ("Status: Paused") and removing one re-runs the query immediately.
- **Common mistakes.** Remove ✕ too small; chips wrapping into a 5-line wall (collapse to "+N more"); filter chips that look identical selected/unselected.

## Avatar

- **Purpose.** Visual identity for a person/org/product: image, initials, or icon fallback.
- **Use when** attributing content, listing people, showing account context.
- **Variants.** Image · initials fallback (1–2 letters on a deterministic tone-mapped background — same entity, same color, from the token palette) · icon fallback (non-person entities) · sizes `xs 20 / sm 24 / md 32 / lg 40 / xl 64` (canonical pixel table, per 04) · with presence dot (Badge dot, bottom-right, `color.success/warning` + border ring of the surface) · Avatar group (overlapping stack, max 4 + "+N" overflow avatar).
- **States.** default · loading (skeleton circle) · broken image → automatic initials fallback (never a broken glyph) · interactive avatars add hover/focus ring.
- **Responsive.** Sizes fixed; groups collapse harder on Mobile (max 3 + N).
- **Best practices.** Alt text = entity name (see 11); circle for people, `radius.lg` square for orgs/products — one rule product-wide.
- **Common mistakes.** Random fallback colors per render; presence dot without label; avatars as the only clickable path to a profile.

## Progress

- **Purpose.** Communicate completion of a bounded process (bar/circle) or the segments of a whole.
- **Use when** progress is quantifiable: upload %, profile completeness, quota usage, wizard position.
- **Not when** duration is unknown (spinner — see Loading Overlay doctrine in `feedback.md`) or the value is a static stat (Statistic Block).
- **Variants.** Linear bar (default; track `color.surface-alt`, fill `color.primary`, `radius.full`) · circular (compact/inline) · segmented (wizard steps, checklist) · stacked/multi-segment (quota composition, tone-mapped segments + legend) · indeterminate bar (brief unknown phases only; switch to determinate the moment a % exists).
- **Properties.** Always pair with a text value or label ("62%" or "3 of 5") — the bar alone is not accessible information (see 11); tone shifts for thresholds (quota ≥90% → `color.warning`, exceeded → `color.danger`).
- **States.** determinate · indeterminate · success (fill `color.success` at completion moment) · error (fill `color.danger` + message nearby) · paused (`color.text-subtle` fill, upload contexts).
- **Responsive.** Bars full-width of container; circular for tight cells.
- **Best practices.** Never move backwards; animate fill with `motion.duration-normal`; keep sub-second operations progress-free (thresholds in 03).
- **Common mistakes.** Fake progress crawling to 90%; indeterminate forever; bar with no accessible value.

## Rating

- **Purpose.** Display or capture a 1–5 star evaluation.
- **Use when** reviews/quality scores — display in cards and summaries, input in review forms.
- **Not when** binary feedback (thumbs — a different pattern) or precise scoring (Number Input).
- **Variants.** Display (fractional fill to 0.1; size sm/md; with count "4.6 (128)") · input (whole or half stars; tap/click sets, keyboard ←/→ adjusts, see 11) · distribution summary (5 rows of label + linear Progress + count — review pages).
- **States.** Display is static. Input: default · hover-preview (stars fill to hovered position) · focus (ring around the group) · selected · disabled · error ("Select a rating" Validation Message on submit).
- **Responsive.** Input stars ≥ 44px touch on Mobile.
- **Best practices.** Always show the numeric value and count with display ratings ("★ 4.6 · 128 reviews" — see 10); star color: one dedicated accent used consistently, from the token registry — never per-theme drift.
- **Common mistakes.** Ratings without counts (a single 5★ review reads as perfection); half-star *input* when the backend stores integers; stars as the only signal (add the number).

## Skeleton Loader

- **Purpose.** Placeholder that mirrors the real layout while content loads — the default loading treatment for content areas.
- **Doctrine.** **Skeleton mirrors real layout**: same grid, same slots, same approximate text-line widths (vary widths 40–90% so it reads as text, not bars). A skeleton is a promise about layout — when content arrives it must replace the skeleton without shift. Use skeletons on *first* load of a region; on refetch, keep stale content at `opacity.disabled` with a thin progress indicator instead (thresholds and spinner-vs-skeleton decision table: see 03 § perceived performance).
- **Use when** the shape of incoming content is known: table rows, cards, detail panels, dashboards.
- **Not when** shape is unknown or the wait is sub-threshold (show nothing, per 03); never for full-app boot (that's App Shell's splash, see layouts).
- **Variants.** Text lines · heading + lines · circle (avatar) · rect (media/thumb) · composed presets per component (card, table-row ×N, list-row ×N, metric).
- **Properties.** Base `color.surface-alt`; shimmer sweep `motion.duration-slow` loop — **static (no shimmer) under `prefers-reduced-motion`**; `radius.sm` on lines, matching radius on shapes; marked busy for assistive tech (see 11).
- **States.** It *is* a state; renders 5–8 repeating units max for collections (a 50-row skeleton is noise).
- **Responsive.** Mirrors the component's own responsive layout (card skeletons stack 1-up on Mobile, etc.).
- **Best practices.** Build the skeleton from the component's real slot structure; keep timing rules centralized (03), not per-screen.
- **Common mistakes.** Skeleton shaped nothing like the content (layout jump); skeleton flash for 80ms loads; shimmer ignoring reduced motion; skeletons for user-triggered refetches.

## Empty State

- **Purpose.** Turn "nothing here" into orientation + next action — for first-run, filtered-empty, and cleared states.
- **Doctrine.** **Empty state = icon + title + body + primary action.** Icon: illustrative, `color.text-subtle`, sized ≤ 64px — decoration, not billboard. Title: what this space is ("No listings yet"). Body: one sentence of value/why ("Create your first listing to start selling."). Primary action: the single next step (`primary` Button — omit only when the user genuinely cannot act, e.g. empty audit log). Wording per 10.
- **Three kinds — always distinguish:**
  | Kind | Title pattern | Action |
  |---|---|---|
  | First-run | "No X yet" | Create/import/connect (primary) + optional "Learn more" link |
  | Filtered-empty | "No results match" | **Clear filters** / edit search (never "create" — the data exists) |
  | Cleared/done | "All caught up" / "Inbox zero" | none or a low-key suggestion — celebrate lightly |
- **Use when** any collection or region has zero items after loading completes.
- **Not when** content failed to load — that's an **error state** (Alert + Retry, see `feedback.md`), never an empty state; conflating them hides outages.
- **Variants.** Full-region (centered in the content area / Blank State Layout) · inline (inside Table body, panel, dropdown listbox — compact: smaller icon or none) · with secondary action (import vs create) · with illustration (marketing-adjacent surfaces only).
- **States.** Static; appears only post-load (never flashes before data resolves — see 03 timing).
- **Responsive.** Centered, max text width ~40ch; full-height centering within the region on Desktop, natural flow on Mobile.
- **Best practices.** Write the filtered-empty variant for every filterable surface — it is hit more often than first-run; keep the action identical to the toolbar's primary action (same label, see 10).
- **Common mistakes.** "No data found." with no action; giant illustration dwarfing the CTA; same copy for first-run and filtered-empty; empty state shown while loading.

## Description List

- **Purpose.** Label/value pairs for one record's attributes: detail panels, order summaries, settings review.
- **Use when** presenting a single entity's facts read-only.
- **Not when** comparing entities (Table) or the values are editable in place (form in read/edit mode; inline edit pattern in 03).
- **Variants.** Two-column (label left `color.text-muted` `text.body-sm`, value right — default Desktop) · stacked (label above value — Mobile and narrow panels) · multi-column grid (2×N on Wide detail pages) · with per-item actions (Copy on IDs, Edit link per row).
- **Properties.** Label column fixed-width per context; empty values render "—" (`color.text-subtle`), never blank or hidden (hidden rows make records look inconsistent); group with `text.label` sub-headings + `space.8` between groups.
- **States.** default · loading (skeleton value lines, labels visible) · value-level states (a status value renders a Badge; a failed lazy value shows inline retry).
- **Responsive.** Two-column → stacked below Tablet; grid → single column.
- **Best practices.** Order pairs by user priority, not schema order; monospace + Copy affordance for IDs/keys.
- **Common mistakes.** Table markup abused for pairs; blank cells instead of "—"; labels styled louder than values.

---

## Dashboard components

Dashboards compose the atoms above into glanceable widgets. Shared rules: every widget declares its **time range** (inherited from a dashboard-level Date Range Picker unless overridden locally — the active range is always visible); every widget designs loading (skeleton mirroring its layout), empty ("No data for this period"), and error (inline retry, never a blank box); grid = 12-col, gutters `space.6`, widgets on `color.surface` `radius.lg` `shadow.sm`.

### Metric Card

- **Purpose.** One KPI at a glance: value, label, delta, optional sparkline.
- **Use when** a number is checked repeatedly and its *trend* matters (revenue, active users, open disputes).
- **Not when** many related figures (Statistics Card) or narrative context is needed (Charts Container).
- **Variants.** Value-only · with delta (Statistic Block rules: direction + sign + basis "vs last 30d") · with sparkline (axis-less trend line) · clickable (navigates to the drill-down report; whole card interactive states per Card).
- **Properties.** Label top (`text.label color.text-muted`), value `text.heading-xl` tabular, delta + basis line under; sparkline `color.primary` stroke, no gridlines.
- **States.** default · hover (clickable) · focus · loading (skeleton value + flat sparkline shape) · empty ("—" + "No data yet") · error (retry icon-action + "Couldn't load").
- **Responsive.** 4-up Wide / 4-up Desktop / 2-up Tablet / 1–2-up Mobile (a 2×2 metric row is the Mobile dashboard header norm).
- **Best practices.** ≤5 metric cards above the fold — beyond that nothing is "key"; consistent period across the row.
- **Common mistakes.** Delta without basis; mixed periods side by side; sparkline with axes and labels (that's a chart).

### Statistics Card

- **Purpose.** A themed group of related figures in one card ("Sales: orders, revenue, AOV") with optional mini-visual.
- **Use when** 2–5 numbers belong to one story and separate Metric Cards would fragment it.
- **Not when** one number (Metric Card) or full analysis (Charts Container).
- **Variants.** Row of Statistic Blocks with dividers · primary value + supporting secondary stats · with mini bar/donut aside · with footer link ("View report →").
- **States.** As Metric Card; per-stat empty renders "—" without collapsing the row.
- **Responsive.** Internal stats wrap 2-up on Mobile; card spans full width.
- **Best practices.** One shared period and title; the card title names the story, stats stay label-short.
- **Common mistakes.** Unrelated stats boxed together; ten stats per card; duplicating the same figure across Metric and Statistics cards on one dashboard.

### Charts Container

- **Purpose.** Standard frame for any chart: header (title + period + actions), plot area, legend, and the full state set — the kit specifies the *frame and rules*, not chart internals.
- **Use when** any data visualization is embedded in a product surface.
- **Not when** a sparkline suffices (Metric Card).
- **Variants.** With type/series toggle (Tabs sm or segmented chips) · with legend (interactive: click isolates/toggles series) · with export/expand actions ("⋯": Download CSV/PNG, View full report) · comparison mode (current vs previous period, previous as dashed/muted series).
- **Properties.** Series colors from a fixed tokenized categorical ramp — order-stable, colorblind-checked (see 11), and every series distinguishable by more than hue in comparison contexts; tooltips on hover/focus follow the pointer (`z.tooltip`) with formatted values per 10; axis text `text.body-sm color.text-muted`; gridlines `color.border` minimal.
- **States.** default · hover (tooltip + point emphasis) · focus (keyboard series/point traversal — contract in 11) · loading (skeleton: title + gray plot silhouette) · empty ("No data for this period" + range hint) · error (inline retry) · single-datapoint (render dot + value, never an interpolated fake line).
- **Responsive.** Height fixed per row; Mobile trims to ≤4 x-labels, legend collapses to scrollable chips, tooltips become tap-to-pin.
- **Best practices.** Y-axis starts at 0 for bar charts (truncated axes mislead); label directly on the plot when ≤3 series instead of a legend.
- **Common mistakes.** Rainbow ad-hoc series colors; charts with no empty/error design (the blank white box); dual y-axes without extreme need.

### Activity Feed

- **Purpose.** Reverse-chronological stream of events across the system: "what's been happening".
- **Use when** ambient awareness across many actors/objects (team activity, store events).
- **Not when** one object's history (Timeline on the detail page) or actionable items needing triage (Notification Center — collaboration section of 02).
- **Variants.** Simple rows (actor Avatar + sentence + time) · grouped ("Jane updated 4 listings" expandable) · filterable by type (filter Chips header) · with day separators.
- **Properties.** Sentence structure actor-verb-object with object linked (wording per 10); relative timestamps + absolute on hover; unread marker (leading dot `color.primary`) where read-tracking exists.
- **States.** default · hover (row) · loading (skeleton rows) · empty ("No activity yet" — first-run kind) · error (inline retry) · live-update (new items slide in `motion.duration-normal`; when scrolled down, a "↑ 3 new" pill instead of yanking the scroll).
- **Responsive.** Full-width column; on dashboards typically the right column Desktop, below metrics Mobile.
- **Best practices.** Cap at ~20 items + "View all"; aggregate bursts; feeds are ambient — never the only path to critical tasks.
- **Common mistakes.** Auto-scroll hijacking on live updates; un-grouped machine spam ("cron ran" ×200); every row a different sentence shape.

### Timeline (dashboard)

- **Purpose.** The Timeline component (above) embedded as a dashboard widget: milestones for a program/project in a glanceable card.
- **Use when** upcoming + recent milestones deserve dashboard presence (launch plan, payout schedule).
- **Not when** it duplicates the Activity Feed (events stream) — Timeline here shows *planned/structural* points, the feed shows *what happened*.
- **Variants / States / Responsive.** Inherit Timeline; widget frame adds title + "View all"; compact variant default; max ~5 visible events.
- **Common mistakes.** Feed and Timeline widgets showing the same rows; cramming a full project plan into the card (link out).

### Recent Activity

- **Purpose.** Compact "last N things *you* touched / that need you" list — the personal shortcut widget, distinct from the system-wide Activity Feed.
- **Use when** returning users benefit from resuming (recent orders, drafts, conversations).
- **Not when** system-wide awareness (Activity Feed) or triage with badges/actions (Notification Center).
- **Variants.** Plain linked List rows (icon/Avatar + title + meta + time) · grouped by type · with per-row quick action (one, trailing).
- **States.** default · hover · loading (skeleton rows) · empty ("Nothing recent — your latest work shows up here") · error (retry).
- **Responsive.** List rules; ~5 rows + "View all".
- **Best practices.** Deep-link precisely (the draft's edit screen, not the drafts list); dedupe repeat touches of one object.
- **Common mistakes.** Overlapping 80% with the feed beside it; rows that aren't links.

### Progress Summary

- **Purpose.** Aggregate completion widget: onboarding checklist, profile completeness, goal tracking.
- **Use when** a multi-step goal spans sessions and nudging completion has real value.
- **Not when** one operation's progress (Progress) or a wizard is already in flight (Form Wizard owns its stepper).
- **Variants.** Checklist (rows with ✓/○ + Progress header "3 of 5 complete"; each incomplete row links to its task) · single bar + label ("Profile 80% complete") · ring + legend (multi-part composition).
- **States.** default · hover (checklist rows) · loading (skeleton) · complete (success treatment + dismiss affordance — a finished checklist must be dismissible) · error.
- **Responsive.** Full-width card Mobile; checklist rows keep ≥44px targets.
- **Best practices.** Every unchecked item is a link to complete it; order by recommended sequence; let users dismiss ("Don't show again") once value is delivered.
- **Common mistakes.** Permanent 100% widgets haunting the dashboard; items users can't act on; percentage with no path to raise it.

### Quick Links

- **Purpose.** Curated shortcuts to frequent destinations/actions — dashboard wayfinding.
- **Use when** 3–8 high-frequency destinations deserve one-click access (New listing, Payouts, Support).
- **Not when** it duplicates the Sidebar 1:1 (navigation's job) or the links are contextual actions (Quick Actions, navigation section of 02).
- **Variants.** Icon + label tile grid · vertical linked List with chevrons · action-style (some links are verbs launching flows — style as `secondary` Buttons).
- **States.** default · hover (`color.surface-alt` / raise) · focus · disabled (permission-gated, with tooltip reason — or better, hidden; see 03 § permission display rules).
- **Responsive.** Tile grid 2-up Mobile / 4-up Desktop.
- **Best practices.** Curate ruthlessly — 12 quick links are none; label with verbs for actions, nouns for places.
- **Common mistakes.** Sidebar clone; dead links kept for symmetry; icons without labels.

### Widget

- **Purpose.** The generic dashboard container contract every widget above conforms to: frame, header, states, sizing.
- **Use when** building any new dashboard module — inherit this contract instead of inventing a frame.
- **Variants.** Sizes on the 12-col grid: `1/4` (metric) · `1/3` · `1/2` (charts, feeds) · `full`; static vs user-configurable (dashboards with edit mode: drag ⠿ reorder, resize handles, remove ✕, add from a widget catalog — keyboard alternatives per 11).
- **Properties.** Frame: `color.surface`, `radius.lg`, `shadow.sm`, padding `space.6`; header: title `text.heading-md` + optional period + "⋯" menu (refresh, configure, remove); body = the widget's content; optional footer link.
- **States.** default · loading (body skeleton, header intact) · empty · error (inline retry within the frame — one broken widget never breaks the dashboard) · edit-mode (dashed outline, drag affordances) · refreshing (subtle spinner in header, stale body stays visible at full opacity).
- **Responsive.** 12-col Desktop/Wide → 2-col Tablet → single column Mobile in a curated priority order (declared per dashboard in 08) — not naive DOM order.
- **Best practices.** Widgets are self-contained: own data, own states, own refresh; header title states the content *and* period.
- **Common mistakes.** One widget's failure blanking the dashboard; unlabeled frames; edit mode with no keyboard path; Mobile order left to chance.
