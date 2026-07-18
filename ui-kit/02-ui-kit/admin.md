# 02 — UI Kit · Admin Components

> Part of the Flexa UI Kit catalog (doc 02). 10 canonical admin components: Data Management Toolbar, Bulk Actions Bar, Advanced Filters, Saved Filters, Role Badge, Permission Matrix, Audit Timeline, System Logs, Queue Monitor, Background Jobs Panel.
> Engineering contracts in 04. CRUD/Search/Bulk patterns in 05. Admin screens (Users, Disputes Queue, Queue Monitor…) in 08. Payloads/enums in 09. Microcopy in 10. Persona: `Admin` (platform operator; support staff = restricted Admins — see README personas).

## Design rationale

Admin surfaces are operated for hours a day by professional users. This section optimizes for **throughput with guardrails**:

1. **Density is a feature, safety is a contract.** Admin defaults to `compact` density, keyboard-first operation, and batch actions — but every destructive or privilege-changing action passes an explicit gate (Confirmation Dialog with typed confirmation for irreversible ops; pending-change staging in Permission Matrix). Speed never removes the gate; it shortens the path *to* the gate.
2. **State lives in the URL.** Filters, saved views, sort, pagination, and selection-independent context are URL-persisted (06 § URL scheme) so operators can share exactly what they see. "Send me the link" must always work.
3. **Operations components tell the truth.** Queue Monitor, Background Jobs Panel, and System Logs render real system state with honest freshness ("Updated 12s ago"), degraded modes, and no fake precision. An ops component that hides staleness causes wrong decisions.

### Component hierarchy

```
Admin
├─ List operation layer ── Data Management Toolbar
│                            ├─ swaps to → Bulk Actions Bar (on selection)
│                            ├─ contains → Advanced Filters (chips + builder)
│                            └─ contains → Saved Filters (named filter sets)
├─ Access control ───────── Role Badge · Permission Matrix
├─ Forensics ────────────── Audit Timeline · System Logs
└─ Operations ───────────── Queue Monitor · Background Jobs Panel
```

The first four form one system around Table/Data Grid: Toolbar owns search/filter/sort/view; Bulk Actions Bar replaces it during selection; Advanced Filters and Saved Filters plug into the Toolbar's filter region. Access-control and ops components stand alone but reuse the shared tone system and the timestamp grammar from collaboration.md.

---

## Data Management Toolbar

**Purpose.** The command strip above every admin collection view: search, filters, saved views, sort, density/column controls, primary create action. One anatomy for Users, Listings Moderation, Orders, Disputes Queue, and every future collection (05 § CRUD).

**When to use.** Above any Table / Virtual Table / Data Grid / card collection that supports query operations.

**When NOT to use.** Above read-only embedded lists (< ~10 rows, no query needs); inside dialogs (use a plain Search Bar); as a page header (that's Content Area anatomy).

**Variants.** `full` (search + filters + saved views + sort + view options + create) · `lite` (search + filters only — embedded collections) · `sticky` (pins under the page header on scroll, `z.sticky`, gains `shadow.sm`).

**Properties.**

| Region | Contents | Notes |
|---|---|---|
| Search | Search Bar, `md`, debounced server query (09) | `/` focuses (keyboard map, 11); scoped placeholder ("Search users…") |
| Filters | Advanced Filters trigger + active filter chips | Chip row wraps; "Clear all" appears at ≥2 chips |
| Saved views | Saved Filters control | See § Saved Filters |
| Sort | Select ("Newest", "Highest value"…) | Mirrors sortable column headers; single source |
| View options | Density toggle (comfortable/compact), column visibility, export | Overflow ⋯ menu on narrow widths |
| Primary action | Button emphasis `primary` ("Add user", "New listing") | Rightmost; at most one |

Layout: single row, `space.3` gaps, background `color.surface`, bottom border `color.border`; result count line ("128 results", `text.body-sm` `color.text-muted`) below when filters active.

**ASCII wireframe (`full`, Desktop).**

```
┌────────────────────────────────────────────────────────────────────────┐
│ [🔍 Search users…    ]  [⚑ Filter] [View: Flagged ▾] [Sort ▾] [⋯] [+ Add user] │
│ ┌ Status: is Active ✕ ┐ ┌ Created: last 30 days ✕ ┐   Clear all        │
│ 128 results                                                            │
└────────────────────────────────────────────────────────────────────────┘
  chips wrap below the control row · result count text.body-sm muted
```

**States.** `default` · `hover`/`focus`/`active` (per control) · `disabled` (bulk-incompatible controls disabled while Bulk Actions Bar is shown — but the Toolbar is normally *replaced*, see below) · `loading` (search/filter in-flight: subtle progress bar `border.2` `color.primary` along the toolbar's bottom edge; controls stay interactive — queries cancel-and-replace) · `empty` (collection empty *with* filters: toolbar remains, table shows "No results — clear filters" Empty State; true-empty collection: toolbar hides filters/sort, keeps create action) · `error` (query failed: Inline Error below toolbar + retry; last good results stay visible, dimmed) · `warning`/`success` (n/a).

**Responsive.** Mobile: search full-width row; everything else collapses into a "Filter & sort" Button that opens a bottom sheet (filters, sort, view options as stacked sections); create action becomes Floating Action Button or sticky footer Button. Tablet: two rows (search+create / filters+sort). Desktop/Wide: single row.

**Best practices.** Debounce 300ms, cancel stale queries, keep focus in the search box across result refreshes. Every control's state serializes to URL. Export respects current filters and says so ("Export 128 filtered results").

**Common mistakes.** Two primary actions; filters that reset on navigation (URL-persist!); a client-side search over a paginated server collection (lies about scope); hiding the result count when filters are active.

---

## Bulk Actions Bar

**Purpose.** Contextual action bar for multi-select operations. **Appears when ≥1 row is selected, replacing the Data Management Toolbar in the same position** — selection mode is a mode, and the UI says so.

**When to use.** Any collection whose rows expose checkbox selection (moderation queues, users, orders, logs export).

**When NOT to use.** Single-row actions (row-level Quick Actions / Context Menu); collections where no action is meaningfully batchable.

**Variants.** `replace` (default: swaps in where the Toolbar was, crossfade `motion.duration-fast`) · `floating` (docked bottom-center over long virtualized lists, `z.sticky`, `shadow.lg`, `radius.lg`) — pick one per screen, never both.

**Anatomy & properties.**

```
┌──────────────────────────────────────────────────────────────────┐
│ ☑ 12 selected · Select all 128    [Approve] [Export] [⋯] │ ✕ Clear │
└──────────────────────────────────────────────────────────────────┘
  bg color.surface-alt · border color.border-strong · radius.md (floating)
```

- **Count** ("12 selected", `text.label`) + **select-all escalation**: when page-selection < result-set, offer "Select all 128 matching" link; once escalated, show "All 128 selected · Clear".
- **Actions:** 2–3 primary Buttons (emphasis `secondary`; destructive uses emphasis `danger`) + overflow ⋯ for the rest. Action set is permission-filtered (Role Badge context) and *capability-filtered by selection* — an action that applies to only some selected rows shows "Approve (9 of 12 eligible)" and acts on the eligible subset with a result summary.
- **Destructive actions** always route through Confirmation Dialog with explicit counts ("Delete 12 users? This cannot be undone.") — dialog contract in Feedback section; copy in 10 § Destructive actions. Irreversible + high-blast-radius (>25 items or privilege-affecting) requires typed confirmation.
- **Clear** (✕, ghost) exits selection mode and restores the Toolbar. Esc also clears (11 keyboard map).

**States.** `default` · `hover`/`focus`/`active` (per Button) · `disabled` (action disabled when 0 eligible rows — with tooltip reason) · `loading` (bulk op in-flight: bar shows Progress "Approving 12… (7/12)" + cancel where the op is cancelable; rows update as they complete) · `empty` (n/a — bar exists only with selection) · `error` (partial failure: bar turns to result mode "9 approved · 3 failed [Review failures]" tone `warning`; failures listed with reasons) · `warning` (mixed-eligibility notice) · `success` (all done: tone `success` summary, auto-restores Toolbar after Toast).

**Responsive.** Mobile: `floating` bottom bar, full-width, actions collapse to count + one primary + ⋯ sheet; Tablet+: `replace` default.

**Best practices.** Report partial results honestly — never silently skip ineligible rows. Keep selection stable across pagination (selection is by id, 09). Announce mode change to screen readers ("Selection mode, 12 selected" — 11 live region).

**Common mistakes.** Bar overlaying (hiding) the column headers users need to verify selection; "select all" that only selects the visible page while claiming the full set; destructive bulk action with a single-click path; losing selection on sort change.

---

## Advanced Filters

**Purpose.** Structured query building: active filters as removable chips + a builder popover for composing field/operator/value conditions. Powers every "show me exactly these records" moment.

**When to use.** Inside Data Management Toolbar on any queryable collection; Audit Log; Reports.

**When NOT to use.** Single-facet toggles (a Select or Tabs is enough); free-text search (Search Bar); end-user shopping facets (that's the public Search pattern, 05 § Search, with its own faceted UI).

**Variants.** `chips+popover` (default) · `panel` (persistent left rail for filter-heavy screens like Reports, ≥ Desktop only) · `sheet` (Mobile: full bottom sheet).

**Anatomy & properties.**

- **Filter chips row:** each active condition renders as a Chip — `field: operator value` ("Status: is Active", "Created: after Jun 1") — with ✕ to remove; click chip re-opens the builder pre-loaded for editing. Overflow: "+3 more" chip expands. "Clear all" ghost Button at ≥2 chips.
- **Builder popover** (`z.popover`, width 360px): three-part row — **Field** (Select, grouped by category, searchable), **Operator** (Select, field-type-aware: text → is/contains/starts with; number/money → =, >, <, between; date → before/after/between/relative "last 30 days"; enum → is/is any of; boolean → is), **Value** (input matched to field type: Select for enums, Date Picker/Range, Currency Input for money…). "+ Add condition" appends rows.
- **Semantics: AND across conditions is the default and the only v1 combinator.** The builder states it inline ("Matches ALL of the following"). OR/nesting is deferred to advanced-report tooling — do not fake it with chips.
- **Apply model:** builder edits are staged; "Apply" commits (chips update, query fires, URL updates); Esc/outside-click discards staged edits with no query churn.
- Field & operator catalog comes from the collection's schema (09 § filterable fields) — never hardcoded per screen.

**ASCII wireframe (builder popover).**

```
┌───────────────────────────────────────────────┐
│ Filters                 Matches ALL of these  │  AND semantics, stated
├───────────────────────────────────────────────┤
│ [Status      ▾] [is        ▾] [Active     ▾] ✕│  field · operator · value
│ [Created     ▾] [after     ▾] [Jun 1, 2026 📅] ✕│
│ [Order total ▾] [between   ▾] [$50]–[$500  ] ✕│  money → Currency Input
│                                               │
│ + Add condition                               │
├───────────────────────────────────────────────┤
│                        [Clear]     [ Apply ]  │  staged until Apply
└───────────────────────────────────────────────┘
  width 360px · z.popover · shadow.lg · radius.lg
```

**States.** `default` · `hover` · `focus` (full keyboard: chip row is arrow-navigable; builder rows Tab-ordered) · `active` (chip being edited: `color.primary` border) · `disabled` (field unavailable for current role: hidden, not disabled) · `loading` (value suggestions loading in Selects) · `empty` (no active filters: only the "Filter" trigger Button shows) · `error` (invalid combination: Inline Error in the builder row, Apply disabled) · `warning` (filter references a deleted saved value: chip tone `warning` + fix affordance) · `success` (n/a).

**Responsive.** Mobile: `sheet` variant — conditions stack as cards, Apply/Clear sticky at sheet bottom; chips row horizontally scrollable with edge fade. Desktop: popover anchored to the Filter trigger.

**Best practices.** Human-readable chip labels (localized operator words, formatted values per 10). Relative date operators ("last 30 days") serialize relatively so saved filters stay evergreen. Chips reflect the *applied* state only — staged edits live in the builder.

**Common mistakes.** Auto-applying on every keystroke in the builder (query storms + jumpy results); cryptic chips ("created_at gte 2026-06-01"); mixing OR semantics into an AND chip row without explicit grouping UI; unbounded enum Selects without search.

---

## Saved Filters

**Purpose.** Name, save, reapply, and share filter+sort+column configurations — turning Advanced Filters output into durable views ("Flagged this week", "High-value disputes").

**When to use.** Toolbar of collections where operators repeat queries (moderation, disputes, orders, audit).

**When NOT to use.** One-shot filters; per-user *preferences* like density (those persist automatically, not as named views).

**Variants.** `select` (default: a Select-like control in the Toolbar listing views) · `tabs` (≤5 pinned views render as Tabs above the table — high-frequency queues like Disputes).

**Properties.** `views[]` (name, owner, shared flag, definition = filters+sort+columns), `activeView`, actions: Save current ("Save as view…" — Modal with name + "Share with team" Switch), Update (own views, when current state diverges: control shows "Flagged this week*" + "Update view / Save as new"), Rename/Delete (own; delete = Confirmation Dialog), Pin (to tabs variant). Shared views are team-visible read-only unless owner/admin; system-provided defaults ("All", "Needs review") are undeletable.

**States.** `default` · `hover` · `focus` · `active` (current view highlighted) · `disabled` (n/a) · `loading` (views list fetch) · `empty` ("No saved views yet — filter, then Save as view") · `error` (save/delete failure + retry) · `warning` (dirty indicator `*` when live state diverges from the active view) · `success` (saved Toast).

**Responsive.** Mobile: views appear as the first section of the filter sheet. Desktop: inline control / tabs.

**Best practices.** A view captures filters, sort, and column set — say so in the save dialog. Applying a view replaces current filters (confirm if unsaved dirty state exists). URL of an applied view = shareable deep link (06).

**Common mistakes.** Saving pagination cursor into a view; silent overwrite of shared views; unbounded personal view lists with no management UI (provide rename/delete inline).

---

## Role Badge

**Purpose.** Compact, consistent display of a user's role/privilege level: Admin, Support, Seller, Buyer, plus product-defined roles. The visual anchor of "who can do what".

**When to use.** User rows and cards, Audit rows, Permission Matrix headers, comment/message headers in admin contexts, session "you are acting as" indicators.

**When NOT to use.** Status (account active/banned — that's a tone Badge); marketing labels ("Pro plan" — plan Badge); self-standing permission editing (Permission Matrix).

**Variants.** `default` (label) · `withIcon` (role glyph + label) · `compact` (icon-only + tooltip — table cells at `compact` density).

**Role → tone mapping (canonical; roles enum in 09 § roles).**

| Role | Tone | Rationale |
|---|---|---|
| Admin | `danger` | Highest privilege — visually loud on purpose |
| Support | `warning` | Elevated, restricted |
| Seller | `info` | Counterparty role |
| Buyer | `neutral` | Baseline |
| Custom roles | `info` (default) | Product may map, documented in its 08 annex |

Rendered via Badge anatomy: `radius.sm`, `text.body-sm`, tone background at subtle strength with `on-*`-safe text per FDS pairs.

**States.** Display component — interactive states apply only when it opens role detail (`hover` underline, `focus` ring, click → Permission Matrix filtered to that role). `disabled` n/a; `loading` = skeleton chip; multiple roles → primary role badge + "+1" overflow with tooltip listing all.

**Responsive.** `compact` variant below Desktop in dense tables; never truncate the role label elsewhere.

**Best practices.** One privilege vocabulary — roles here, account status separately; never merge ("Banned admin" is two badges). Icon+color+label together (11: not color alone).

**Common mistakes.** Ad-hoc tone picks per screen (the table above is binding); showing role where identity suffices (buyer-facing UIs never show "Buyer" badges to buyers themselves).

---

## Permission Matrix

**Purpose.** Roles × capabilities grid for viewing and editing what each role may do — with inheritance made visible and changes staged behind an explicit save.

**When to use.** Admin System Settings § Roles & Permissions; role detail views; support-tier configuration.

**When NOT to use.** Per-user overrides at scale (list-based exception UI); feature flags (separate system); consumer-facing privacy settings.

**Variants.** `edit` (full grid, staged changes) · `readonly` (audit/review contexts; support staff see this) · `single-role` (one role's capabilities as a grouped checklist — role detail).

**Anatomy & properties.**

```
┌───────────────────────────┬─────────┬─────────┬─────────┬────────┐
│ Capability                │ Admin   │ Support │ Seller  │ Buyer  │  Role Badge headers
├───────────────────────────┼─────────┼─────────┼─────────┼────────┤
│ ▸ Orders                  │         │         │         │        │  group row (collapsible)
│   View orders             │   ✓     │   ✓     │  ✓ own  │ ✓ own  │  scope note text.body-sm
│   Refund orders           │   ✓     │   ✓●    │   —     │   —    │  ● = staged change
│   Release escrow manually │   ✓     │   ⇡     │   —     │   —    │  ⇡ = inherited (from Admin
│ ▸ Users                   │         │         │         │        │      template), tooltip
│   Suspend users           │   ✓     │   —     │   —     │   —    │
└───────────────────────────┴─────────┴─────────┴─────────┴────────┘
│ 2 unsaved changes                    [Discard]  [Review & save]  │  sticky change bar
└───────────────────────────────────────────────────────────────────┘
```

- **Grid:** capabilities grouped by domain (rows, collapsible via Accordion), roles as columns (header = Role Badge). Cell control: Checkbox (or `✓ own / ✓ all / —` tri-scope Select where the capability is scoped — scopes enum in 09).
- **Inheritance display:** a cell inheriting from a parent role/template shows the inherit glyph (⇡) and muted check `color.text-muted`; tooltip: "Inherited from Admin template". Explicitly overriding an inherited value renders solid + an "overridden" dot; a "Reset to inherited" action appears in the cell menu.
- **Pending-change highlight + explicit save:** edits are **staged, never live**. A staged cell gets `color.warning` background wash + dot marker (●); the sticky change bar counts staged changes and offers Discard / **Review & save**. Review opens a Confirmation Dialog listing every change ("Support: + Refund orders", "Support: − Suspend users") — privilege escalation lines flagged tone `danger`. Save is one atomic commit (09), logged to Audit Log.
- Locked cells (platform-mandated, e.g. Admin's own admin capability) render a lock glyph + tooltip and are non-editable — prevents self-lockout.

**States.** `default` · `hover` (cell affordance + row/column crosshair highlight `color.surface-alt`) · `focus` (grid keyboard nav: arrows move cells, Space toggles — 11 grid pattern) · `active` (cell menu open) · `disabled` (readonly variant; locked cells) · `loading` (grid skeleton; save in-flight freezes grid with Progress) · `empty` (no custom roles yet: default columns + "Add role" ghost column) · `error` (save failed: staged changes retained, Alert tone `danger`) · `warning` (staged cells; escalation warnings in review) · `success` (saved Toast + staging clears).

**Responsive.** Mobile/Tablet: matrix does not shrink — switch to `single-role` variant with a role switcher Select on top (grid needs ≥ Desktop). Desktop: full grid, first column sticky. Wide: all roles visible without horizontal scroll up to ~8 columns; beyond, horizontal scroll with sticky capability column.

**Best practices.** Always name the diff in the review dialog — never "Save 12 changes?" without the list. Show scope ("own"/"all") wherever a capability is scoped; unscoped checkmarks on scoped capabilities are ambiguous. Deep-link cells (`?role=support&cap=orders.refund`) for audit follow-ups.

**Common mistakes.** Live-toggling permissions (a mis-click revokes access platform-wide); hiding inheritance (operators can't predict the effect of template edits); letting the last admin remove their own admin capability; rendering the grid on mobile as a pinch-zoom artifact.

---

## Audit Timeline

**Purpose.** Chronological, vertical rendering of audit events for **one subject** (a user, an order, a role): what happened to this thing, in forensic detail. The subject-scoped sibling of the table-based Audit Log (collaboration.md).

**When to use.** User Detail § Security ("all admin actions on this account"), Dispute Detail evidence trail, role change history under Permission Matrix.

**When NOT to use.** Cross-subject investigation (Audit Log table with filters); friendly product history (Activity Timeline); escrow stages (Escrow Timeline).

**Variants.** `default` (vertical rail, day-grouped) · `embedded` (last 5 + "View full audit log" link that opens Audit Log pre-filtered to this subject).

**Properties.** `events[]` — each row: absolute timestamp (seconds, UTC toggle inherited from Audit Log), actor (name + Role Badge), action label (from the 09 verb enum), detail block (old→new changes, expandable; tone grammar: removed `color.danger`, added `color.success`), source (IP/user-agent, collapsed by default); `subject` (fixed — this component never mixes subjects); day group headers.

**States.** `default` · `hover` (expand affordance) · `focus` · `active` (expanded row) · `disabled` (n/a) · `loading` (rail skeleton) · `empty` ("No audit events for this {subject}") · `error` (retry) · `warning` (retention boundary row: "Older events archived — request export") · `success` (n/a).

**Responsive.** Mobile: rail `space.4`, source line hidden behind expand. Desktop: measure `size.container-md`.

**Best practices.** Inherit every Audit Log rule: absolute timestamps only, no mutation affordances, tombstones for deleted references. Cross-link each row to the same event in the full Audit Log (shared event id, 09).

**Common mistakes.** Re-implementing a second event vocabulary (Audit Timeline and Audit Log render the *same* events, one filtered view); relative timestamps; summarizing multiple events into one row (forensic = 1 event : 1 row).

---

## System Logs

**Purpose.** High-volume technical log viewer for operators: application/webhook/integration logs with level filtering, live tail, search, and detail expansion. Diagnostics, not audit.

**When to use.** Admin System Settings § Logs, integration debugging (webhook deliveries), support escalation tooling.

**When NOT to use.** Compliance trails of human actions (Audit Log); user-facing error reporting (Error Page / Inline Error); metrics (Queue Monitor / Marketplace Statistics).

**Variants.** `viewer` (full screen: Virtual Table + toolbar) · `panel` (embedded tail, e.g. under a webhook endpoint's detail: last 50 + link) · `tail` (live-follow mode toggle within either).

**Properties.** Row: timestamp (absolute, ms precision, monospaced tabular), level Badge (`debug`=neutral · `info`=info · `warn`=warning · `error`=danger · `fatal`=danger+filled), source/channel chip, message (single line, expandable to full detail: structured context as Description List + raw JSON block with copy), correlationId (link: filters to related rows). Toolbar: level multi-select, channel filter, time range, text search, **Live tail** Switch, export. Virtualized rows (Virtual Table) — logs are unbounded.

**States.** `default` · `hover` (row highlight) · `focus` (row expand on Enter) · `active` (expanded) · `disabled` (n/a) · `loading` (initial skeleton; tail mode shows "streaming" pulse dot `color.success`) · `empty` (level/time filters yield nothing: "No log entries match" + widen-range hint) · `error` (stream disconnected: Warning Banner "Live tail paused — reconnecting", buffered rows flush on reconnect) · `warning` (high error-rate notice header when errors/min exceeds threshold) · `success` (n/a).

**Responsive.** Mobile: read-only triage — level + message rows, expand for detail; live tail off by default. Desktop: full viewer, `compact` density, keyboard j/k row navigation (11 keyboard map).

**Best practices.** Live tail auto-pauses on scroll-up ("Paused — 214 new entries ↓ Resume"); never yank scroll. Level colors always pair with level text. correlationId is the primary investigation affordance — make it prominent and clickable.

**Common mistakes.** Rendering unbounded logs without virtualization; word-wrapping every row by default (kills scannability — wrap only expanded); mixing audit events into system logs (different truth contracts); timestamps without ms in a debugging tool.

---

## Queue Monitor

**Purpose.** Operational health dashboard for work queues (emails, webhooks, media processing, payouts): depth, throughput, failures, oldest-job age — the "is the platform digesting?" view.

**When to use.** Admin Queue Monitor screen (08), ops status wall, embedded health widget on Admin Dashboard.

**When NOT to use.** Individual job inspection/retry (Background Jobs Panel — Queue Monitor links into it); business KPIs (Marketplace Statistics); logs (System Logs).

**Variants.** `dashboard` (grid of per-queue cards) · `row` (table density: one row per queue) · `widget` (Admin Dashboard: worst-3 queues by health).

**Properties.** Per queue: name + channel icon, **health Badge** (`healthy`=success · `degraded`=warning · `failing`=danger · `paused`=neutral — computed server-side per 09 thresholds), depth (pending count), throughput (jobs/min, with sparkline `color.primary`), failure rate (last hour, `invertDelta` semantics — up is bad), oldest pending age (escalates to `color.warning` text past SLA), actions: Pause/Resume (Confirmation Dialog — pausing payouts is consequential), "View jobs" (→ Background Jobs Panel filtered). Header: global freshness stamp ("Updated 12s ago", auto-refresh interval visible).

**ASCII wireframe (`dashboard`, one card).**

```
┌───────────────────────────────────┐
│ ✉ email-outbound      [Degraded]  │  name + health Badge (warning)
├───────────────────────────────────┤
│ Depth      1,204   ▁▂▄▆█▅▃        │  depth + throughput sparkline
│ Throughput 38/min                 │
│ Failures   4.2% ↑  (last hour)    │  invertDelta: up = bad → danger
│ Oldest     19m  ⚠ past 10m SLA    │  color.warning past SLA
├───────────────────────────────────┤
│ [Pause]              [View jobs →]│  → Background Jobs Panel
└───────────────────────────────────┘
  worst-health cards sort first · freshness stamp in section header
```

**States.** `default` · `hover` (card lift when drillable) · `focus` · `active` · `disabled` (paused queue: content readable, tone `neutral` Badge "Paused by {actor}") · `loading` (skeleton cards; refresh: freshness stamp pulses, values crossfade `motion.duration-fast`) · `empty` (no queues registered — setup hint) · `error` (metrics unavailable: card shows "—" + "metrics unreachable" tone `danger` note; never stale numbers presented as fresh) · `warning` (degraded queues sort to top automatically) · `success` (all healthy summary strip).

**Responsive.** Mobile: `row` list, health + depth + age only; actions behind row tap. Tablet: 2-up cards. Desktop/Wide: 3–4-up grid, auto-sorted worst-first.

**Best practices.** Freshness is always visible; when auto-refresh fails, say so rather than freezing values. Health thresholds are server-defined and documented (09) — the UI never invents "degraded". Pause/resume actions are audit-logged and show the pausing actor.

**Common mistakes.** Red/green dots without labels; showing raw depth without age (a deep-but-fast queue is fine; a shallow-but-stuck one is not); client-side health computation; refresh that resets scroll or focus.

---

## Background Jobs Panel

**Purpose.** Inspect and act on individual background jobs: status, attempts, payload, error, retry/cancel — the job-level drill-down beneath Queue Monitor.

**When to use.** "View jobs" from Queue Monitor; job status surfaces on records ("Import running…"); admin troubleshooting of a specific failed job.

**When NOT to use.** Aggregate queue health (Queue Monitor); long-running *user-facing* task progress in product UIs (use Progress + Toast patterns, 05); scheduled-job configuration (System Settings).

**Variants.** `table` (full: Virtual Table + Data Management Toolbar + Bulk Actions Bar — retry/cancel are batchable) · `drawer` (single job detail in Right Drawer) · `inline` (record-scoped status strip: "Export queued · position 4" with cancel).

**Properties.** Job row: id (copyable), type, queue chip, **status Badge** (`queued`=neutral · `running`=info (+ indeterminate Progress) · `succeeded`=success · `failed`=danger · `cancelled`=neutral · `retrying`=warning), attempts ("2/5"), enqueued/started/finished timestamps, duration, next retry ETA (failed-retrying). Detail drawer: payload (JSON block, copy, secrets redacted server-side per 09), error message + stack (collapsed), attempt history (mini Audit Timeline anatomy), actions: **Retry** (failed/cancelled; re-enqueues, disabled with reason when the job is non-retryable), **Cancel** (queued/running where supported; Confirmation Dialog), "View logs" (→ System Logs filtered by correlationId).

**States.** `default` · `hover` · `focus` · `active` (drawer open row highlighted) · `disabled` (non-retryable Retry with tooltip reason) · `loading` (table skeleton; running jobs live-update status without scroll jump) · `empty` (filtered: "No jobs match"; healthy-empty: "No failed jobs 🎉" for the failed tab — copy 10) · `error` (job detail fetch failure + retry) · `warning` (retrying rows; "next attempt in 4m") · `success` (retry accepted Toast; row transitions to `queued`).

**Responsive.** Mobile: card rows (type + status + time), detail as full-screen sheet; bulk actions limited to retry. Desktop: full table, `compact` density.

**Best practices.** Retry is idempotent by contract (09 Idempotency-Key discipline) — the UI may offer it freely on failed jobs. Redact payload secrets server-side; the panel never receives them. Failed tab is the default landing tab (operators come here for failures).

**Common mistakes.** Payloads with live credentials in the DOM; retry buttons on succeeded jobs; per-second table re-render that destroys selection; conflating "cancelled" with "failed" tone (cancelled is neutral — someone chose it).

---

## Cross-cutting rules (all 10 components)

- **Density:** admin surfaces default to `compact`; the density toggle (Data Management Toolbar) is respected by every component on the screen.
- **Destructive gates:** any bulk, privilege, or ops-mutating action → Confirmation Dialog naming counts/diffs; irreversible + high-blast-radius → typed confirmation. Copy owned by 10; dialog contract by 04.
- **URL persistence:** filters, saved views, sort, tabs, and drill-down context serialize to the URL (06). Selection does not.
- **Truth in ops:** freshness stamps on live data, honest degraded/error modes, server-computed health/eligibility — the client renders state, never invents it (same doctrine as 09's server-owned enums).
- **Keyboard:** `/` search focus, Esc exits selection/sheets, arrow-key grids and j/k lists per 11's keyboard map. Admin users live on keyboards; every component above names its keys in 04.
