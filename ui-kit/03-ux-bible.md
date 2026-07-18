# 03 — Flexa UX Bible

> The experience rulebook for every Flexa product. This document OWNS experience rules: hierarchy, feedback, motion use, error philosophy, and productivity. Component contracts (04), patterns (05), screens (08), and copy (10) defer to the rules here. Precedence: FDS tokens (01) → Accessibility Guide (11) → **this document** → Component Bible (04) → UI Kit (02) → Pattern Library (05) → the rest.
>
> Language: **MUST** = binding, violation is a defect. **SHOULD** = default, deviation requires a documented reason. **NEVER** = forbidden without exception.

---

## 1. The five principles, made testable

The origin spec names five principles: Consistency, Simplicity, Productivity, Accessibility, Mobile-first. Aspirations are useless; here each becomes rules you can verify in review.

### 1.1 Consistency

- C1. The same concept MUST use the same component everywhere. Order status is always Payment Status; escrow progress is always Escrow Timeline; a person is always Avatar + name. Never re-invent per screen.
- C2. The same action MUST use the same label, position, and shortcut across all screens. "Save" is always the right-most primary action in a form footer; destructive actions always sit apart from safe ones.
- C3. Canonical names (README inventory) MUST be used verbatim in specs, code identifiers (`Fx*`), and design files. A "Popup" or "Dialog2" in a spec is a defect.
- C4. Status meaning MUST come only from the tone system (`neutral | info | success | warning | danger`) mapped to FDS `color.*`/`on-*` pairs (01 §2). NEVER invent a new status color.
- C5. Every list screen MUST offer the same core anatomy: Search Bar, Advanced Filters, sort, Pagination (or documented infinite scroll per 05), Bulk Actions Bar when rows are selectable, and Empty State.
- C6. Iconography: one icon per concept, product-wide. If "delete" is a trash can on one screen, it is a trash can everywhere.
- C7. Spacing and sizing come only from tokens (`space.*`, control heights sm 32 / md 40 / lg 48). A one-off 6px gap is a defect (01 §4).
- C8. Cross-product: a user moving from Flexa Marketplace to Flexa CRM MUST be able to reuse muscle memory — App Shell, Sidebar, Command Palette, Notification Center, and Settings Layout behave identically.

### 1.2 Simplicity

- S1. One primary action per view (see §2). Everything else is secondary, ghost, or relegated to menus.
- S2. Whitespace over borders: separate regions with `space.*` and surface color (`color.surface` vs `color.surface-alt`), not boxes inside boxes. A border (`color.border`) is allowed only where whitespace alone fails (dense tables, input fields).
- S3. Progressive disclosure: show the 20% of options that serve 80% of cases; hide the rest behind "Advanced" sections, Accordion, or a secondary step. NEVER show every field a power user might someday need.
- S4. Maximum two levels of visual nesting inside Content Area (e.g. Card → List). A third nested container is a design smell; restructure instead.
- S5. Every element on a screen MUST answer "what task does this serve?" Decorative chrome, redundant titles, and repeated logos are removed.
- S6. Text hierarchy uses only `text.*` composites (heading-xl/lg/md, body, body-sm, label). If you need a seventh size, the layout is wrong.
- S7. Default states are quiet: no more than one `warning`/`danger` tone element visible on a healthy screen. Alarm colors are reserved for actual problems.
- S8. Settings screens list at most 7 ± 2 groups per page; beyond that, split into Settings Layout sections with their own nav.

### 1.3 Productivity

- P1. Every core object (listing, order, user, dispute) MUST be reachable in ≤ 3 interactions from the dashboard: nav → list → item, or Command Palette → item.
- P2. The Command Palette MUST exist in every authenticated product surface and index navigation, actions, and records (see §14).
- P3. Any action available through the UI on ≥ 5 items SHOULD be available as a bulk operation (Bulk Actions Bar).
- P4. Forms remember: sensible defaults from the user's last choice (currency, category, shipping option) MUST be prefilled where safe. Never prefill anything payment-affecting.
- P5. Lists preserve state: filters, sort, page/cursor, and density survive navigation away and back, and are shareable via URL (see §8).
- P6. Frequent flows get accelerators: inline edit for single fields, Quick Actions on hover/focus of rows, keyboard shortcuts (11 owns the key map).
- P7. NEVER require a full page navigation for an edit that touches ≤ 3 fields — use inline edit, popover, or Right Drawer (see §7).
- P8. Confirmation friction is budgeted: reversible actions get zero dialogs (undo instead); only the safety ladder (§5) adds friction, and only proportionally.
- P9. Nothing blocks the user that doesn't have to: long operations run in the background (Background Jobs Panel) and report back via Notification Center (§3, §12).

### 1.4 Accessibility

Doc 11 owns the full contract; these are the experience-level minimums every design MUST satisfy before it reaches 11's review:

- A1. Every interactive element is keyboard-reachable and keyboard-operable, in a focus order matching the visual order.
- A2. Focus is always visible (`color.focus-ring`), never suppressed. Focus is trapped in modals and returned to the invoking element on close.
- A3. Color is never the only channel for meaning: pair tone with icon and/or text (01 §4.3).
- A4. Touch targets ≥ 44×44px on all pointer-capable surfaces, not just mobile.
- A5. Every async state change (loading complete, toast, validation error) MUST be announced to assistive tech (live region semantics — 11 owns the ARIA detail).
- A6. Time limits: no user-facing timeout under 60s without a visible countdown and an extend option. Undo windows (§5) are exempt but must also be ≥ 5s.
- A7. Motion honors `prefers-reduced-motion` (§11).

### 1.5 Mobile-first

- M1. Every screen spec (08) MUST define its Mobile (≤ 767px) layout, not just note "responsive".
- M2. On Mobile, primary navigation moves to Bottom Navigation (Mobile); the Sidebar is not merely shrunk (see §14).
- M3. Popovers, Context Menu, and small modals become bottom sheets on Mobile (§14).
- M4. The one primary action per view MUST sit in the thumb zone (bottom third) on Mobile.
- M5. Data density is reduced by disclosure, not by shrinking: tables collapse to Card lists with the 2–3 most important fields, detail behind tap.
- M6. Nothing depends on hover. Every hover affordance has a focus/tap equivalent.

---

## 2. Visual hierarchy & density

### 2.1 Canonical page anatomy

Every standard screen inside App Shell composes top-down; omit rows you don't need, never reorder them:

```
┌──────────────────────────────────────────────────────────┐
│ Breadcrumb (if depth > 2)                                │
│ Page title (text.heading-lg)              [Primary CTA]  │
│ Contextual description — one line max (text.body-sm)     │
├──────────────────────────────────────────────────────────┤
│ Search Bar · Advanced Filters · view controls · density  │
├──────────────────────────────────────────────────────────┤
│ Content (Table / Cards / detail…)                        │
│   Bulk Actions Bar appears here on selection             │
├──────────────────────────────────────────────────────────┤
│ Pagination / load-more                                   │
└──────────────────────────────────────────────────────────┘
```

- The primary CTA lives in the title row, right-aligned (Desktop) or as the bottom thumb-zone action (Mobile, §14).
- The description line is optional and never wraps to a paragraph — long explanations belong in docs or a dismissible hint.
- Detail screens replace the filter row with Tabs; the anatomy above/below stays identical.

### 2.2 Hierarchy rules

- **One primary action per view.** Exactly one `primary`-emphasis button may be visible in a given view (screen, modal, drawer, or wizard step — each counts as its own view). All other actions are `secondary`, `ghost`, or `danger`. If a screen seems to need two primaries, it is two screens or the second action is secondary.
- **The primary action answers "why is the user here?"** On Listing Editor it is "Publish listing"; on Checkout Payment step it is "Pay …". If you can't name it, the screen lacks a purpose.
- **Whitespace over borders** (inherits 01 §2): elevation via `shadow.*` + surface tokens. Cards on `color.bg` need no border; inputs and table cells may use `color.border`.
- **Scan patterns.** Layout for F-pattern reading on data-heavy screens: page title and primary action top, key filters directly under, the most decision-relevant column first (left) in tables. Landing/empty surfaces may use Z-pattern with the CTA at the terminal point.
- **Above the fold:** page identity (Breadcrumb + title), the primary action, and the first row of real content MUST be visible without scrolling at Desktop 1024×768.
- **Density modes:** `comfortable` is default everywhere; `compact` is allowed only in Table, Virtual Table, Data Grid and admin surfaces, is user-switchable, and the choice persists (§14).
- **Grouping:** related controls are grouped with `space.2`–`space.4`; unrelated groups separated by `space.6`–`space.10`. Distance encodes relationship; boxes don't.
- **Numbers users compare** (Metric Card, tables of amounts) MUST be right-aligned in tabular figures; labels left-aligned.

---

## 3. Feedback & response time doctrine

Every user action gets acknowledgment. The form of acknowledgment is dictated by latency, not by developer taste:

| Latency | Required feedback |
|---|---|
| < 100ms | Instant state change (pressed state, toggle flips, row highlights). No spinner — a spinner here is noise. |
| 100–300ms | No indicator needed. The result simply appears. NEVER flash a spinner for < 300ms (use a 300ms delay before showing any spinner). |
| 300ms – 1s | Inline spinner **in place** — inside the button (label stays visible, button disabled), next to the field, in the row. Never a full-screen Loading Overlay. |
| 1s – 10s | Skeleton Loader that mirrors the final layout (same card/table shape, same column count). Content MUST NOT reflow when real data arrives. Buttons that triggered it show loading state. |
| > 10s (expected) | Determinate Progress where possible, elapsed/remaining estimate, and a Cancel control. The user MUST be able to leave the screen without killing the job if the job is server-side. |
| Long jobs (imports, exports, bulk ops, report generation) | Run as background jobs from the start: acknowledge immediately ("Export started"), track in Background Jobs Panel, notify via Notification Center (and toast if the user is still in-app) on completion or failure. NEVER hold a modal open for minutes. |

Additional rules:

- Feedback appears **where the user is looking**: the click point or its immediate container. A toast in the corner is not feedback for a button in the center (§12).
- Only one loading treatment per region. A skeleton inside a spinner inside an overlay is a defect.
- Loading Overlay is reserved for operations that make the *entire* current view invalid (e.g. switching workspace). It MUST show within 300ms rules and never stack.
- Every spinner MUST have an owner and an exit: a timeout (default 30s) after which it resolves to an error state with retry. The "Infinite spinner" (§15) is banned.
- Perceived performance beats real performance: paginate/stream the first screenful, defer below-the-fold data, and prefetch the next likely navigation.

### 3.1 Per-surface application

| Surface | Loading treatment |
|---|---|
| Table / Virtual Table / Data Grid | Skeleton rows (same column widths); keep header + toolbar interactive. Refresh-in-place uses a subtle top progress bar, never re-skeletons existing rows. |
| Dashboard Layout | Each Widget/Metric Card skeletons independently; shell, nav, and title render immediately. |
| Detail screens (Order Detail, Listing Detail) | Skeleton the identity block first (title, status, amount), then sections; above-the-fold identity ≤ 1s or show cached data with a refresh indicator. |
| Buttons / row actions | Inline spinner inside the control, control disabled, label preserved (§3 table). |
| Search Bar / Autocomplete | Inline spinner in the field after 300ms; stale results dim, never blank, while new ones load. |
| Chat / Conversation List | Optimistic-pending message bubbles (§4); history loads upward with a top spinner, scroll anchored. |
| File Upload / Image Gallery Upload | Per-file determinate Progress with cancel; whole-form submit stays enabled for everything already uploaded. |
| Wizard steps | Next-step data prefetches during the current step; step transition never shows a blank frame. |

### 3.2 Freshness & reconnection

- Data that can silently go stale (order status, escrow state, dispute deadlines) SHOULD refresh on window refocus and reconnect; visible changes swap with a fade (§11), never a full re-skeleton.
- If the screen shows cached-but-possibly-stale money state, mark it ("Updated 2h ago") rather than pretending it is live.
- After Offline State recovery, queued mutations replay in order and report results per §9 partial-failure rules.

---

## 4. Optimistic UI

Apply the change in the UI immediately and reconcile with the server in the background — but only where failure is cheap.

**Allowed (and SHOULD be default) when ALL of these hold:**

1. The operation is reversible by the user in one step.
2. Server success rate is high and failure is not costly (no money, no legal state, no third parties notified).
3. The client can render the true result without server-computed data.

Canonical optimistic cases: Switch/Checkbox toggles, favoriting/liking, marking notifications or messages read, drag-to-reorder (Kanban Board, lists), renaming, tag add/remove, collapsing/pinning UI.

**Forbidden — the pessimistic list. NEVER apply optimistically:**

- Payments, checkout, refunds, and **anything touching escrow** (release funds, payouts). Money state renders only what the server confirmed.
- Destructive operations (delete, cancel order, close dispute) — these follow the safety ladder (§5), not optimism.
- Anything requiring server-side validation or allocation to be true: checkout stock/price confirmation, coupon application, username/slug uniqueness, permission changes, publishing that triggers moderation.
- Anything that notifies other people (sending a message *appears* optimistic in Chat but MUST show a pending indicator until acknowledged, with visible failed-state + retry).

**Failure handling for optimistic ops:** revert the UI to the pre-action state, announce the failure at the point of change (Inline Error or toast with the object named), and offer one-tap retry. NEVER leave the UI showing a state the server rejected.

**Reconciliation rules:**

- Optimistic state MUST be visually indistinguishable from confirmed state *except* where the user might act on it externally (a "sent" message shows a pending tick until acknowledged).
- Concurrent edits: if the server returns a different result than predicted (e.g. reorder landed elsewhere because someone else moved items), apply the server truth with an animated correction (§11 causality) — never both states, never a modal about it.
- Queue depth: at most one un-acknowledged optimistic mutation per object; further edits to the same object coalesce client-side rather than racing.
- If the user navigates away before confirmation, the mutation continues in the background; failure then reports through Notification Center, not a toast into the void.

---

## 5. Destructive actions & the safety ladder

Friction must be proportional to blast radius. Choose the *lowest* rung that fits; escalating everything to a dialog trains users to click through.

| Rung | Use when | Mechanics |
|---|---|---|
| 1. **Undo** (preferred) | Reversible, single-object, frequent: archive, remove from list, dismiss, unpublish, move | Act immediately; toast with "Undo" action, 5–10s window (10s default; extend on hover/focus). Commit silently when the window closes. |
| 2. **Confirmation Dialog** | Hard-to-reverse or scope > the obvious: delete a draft listing, cancel an order, remove a team member | Title = verb + object question; body = concrete consequence; buttons = specific verb (`danger`) + "Cancel" (10 §7 owns copy). |
| 3. **Type-to-confirm** | Irreversible + high value or cascading: delete a published listing with order history, delete an account, purge data | Dialog additionally requires typing the object's name/identifier. Confirm button disabled until match. |
| 4. **Re-authentication** | Security-critical or money-critical, mostly Admin: issue refund above threshold, change payout account, role escalation, data export of PII | Password/passkey re-entry or 2FA, regardless of session age. May combine with rung 3. |

Binding rules:

- **Soft delete doctrine:** every user-facing "delete" is a soft delete with a recovery window (default 30 days) unless legal/privacy requires purge. UI copy says "Delete"; recovery lives in a Trash/Deleted view. Only Admin purge is a true delete, and it sits on rung 3–4.
- Undo MUST actually undo: if the action already had side effects visible to others (buyer notified, funds moved), it is not undoable — use rung 2+.
- Destructive buttons use `danger` emphasis, name the object ("Delete listing", never bare "Delete" in dialogs), and are never the default/Enter-triggered action in a dialog.
- NEVER place a destructive action adjacent to the primary action, and never as the right-most button in a dialog.
- Bulk destructive operations state the exact count ("Delete 12 listings?") and always sit at rung 2 minimum.
- Escrow/payment "actions of no return" (release funds, send payout, issue refund) are **not destructive-styled** but use the same ladder: rung 2 minimum, rung 4 above thresholds, and the dialog restates amount + currency + recipient (10 §9).

Decision tree (apply top-down, stop at first match):

```
Can the user fully reverse it themselves, and nobody else was
notified / no money moved?            → Rung 1: act + Undo toast
Does it destroy or externally commit something recoverable
only by support, or affect > 1 object? → Rung 2: Confirmation Dialog
Is it irreversible AND high-value (published history, accounts,
data purge)?                           → Rung 3: type-to-confirm
Is it security- or money-critical above policy thresholds?
                                       → Rung 4: re-authenticate (+3)
```

---

## 6. Save models

Two models. Every screen declares which one it uses; **never mix within one screen.**

**Explicit save** — default for forms, settings, and anything with validation or server allocation:

- Dirty state is tracked and visible (enabled Save button; unsaved dot in title/tab where relevant).
- Save button is disabled when the form is pristine or while saving (inline spinner in the button, label kept).
- Leaving with unsaved changes triggers the unsaved-changes guard (§8): "Discard changes?" dialog with "Keep editing" (default) and "Discard" — never save silently on exit.
- After save: success feedback per §12 (usually inline "Saved" state; toast only if the user may have navigated away).

**Autosave** — for documents, long editors (Rich Text Editor, Markdown Editor, Listing Editor drafts), and canvases:

- Save happens continuously (debounced ≤ 2s) with a persistent saved-indicator near the title: "Saving…" → "Saved". No Save button for content.
- Failures are loud: indicator flips to error tone with retry; the editor MUST buffer changes locally until reconnected (pair with Offline State).
- Autosaved ≠ published. Publishing/submitting remains an explicit action with explicit feedback.
- Autosaving surfaces SHOULD offer Version History for recovery.

Choosing: if a half-finished state is harmful or invalid (settings, payment forms, permission matrices) → explicit save. If a half-finished state is normal (drafts, documents) → autosave. Inline edit of a single field (§7) commits on Enter/blur and counts as explicit save with instant scope.

Reference assignments (08 screen specs inherit these):

| Surface | Model |
|---|---|
| Account Settings, Store Settings, System Settings, Permission Matrix | Explicit save (per section, not per page — each Settings Layout section has its own footer) |
| Listing Editor content (title, description, photos) | Autosave draft + explicit "Publish listing" |
| Checkout steps | Explicit per step; the wizard persists step state server-side so back/refresh loses nothing |
| Messages / Chat composer | Draft autosaved locally; "Send" is explicit |
| Dispute evidence forms | Autosave draft + explicit "Submit evidence" (submission notifies the other party — §4 forbidden) |
| Filters, density, view options | Neither — instant apply, no save concept, persisted as preference (§13) |

---

## 7. Modality ladder

Escalate modality only as far as the task demands. Each rung costs the user more context.

| Rung | Component | Use for | Rules |
|---|---|---|---|
| 1. **Inline edit** | in place | Single field, low validation (rename, quantity, status select) | Enter commits, Esc reverts, blur commits (or reverts — pick per pattern in 05, be consistent). Show affordance on hover/focus. |
| 2. **Popover** | anchored | 2–4 related controls, quick pick (date, filter, assignee) | Dismiss on outside click/Esc. No forms with submit buttons inside popovers. |
| 3. **Right Drawer** | side panel | **Default for edit-in-list and detail-peek**: edit a row, view order summary, reply to a message while keeping the list | Context (the list) stays visible and interactive state is preserved. Drawer holds a full form with its own save model. Width ≤ 480px Desktop; full-screen sheet on Mobile. |
| 4. **Modal** | Modal Layout | One focused decision or short task that must interrupt: confirmations (§5), a single-step create, conflict resolution | **Max one at a time. NEVER nest modals.** If a modal needs to open a modal, the flow belongs in a drawer or page. Esc + explicit close always available; closing follows unsaved guard. |
| 5. **Full page / Wizard Layout** | navigation | Complex or multi-step work: Checkout, Seller Onboarding Wizard, Listing Editor create wizard, Dispute Detail | Deep-linkable, resumable, back-button-safe (§8). |

Choosing rules:

- Prefer the lowest rung that keeps the user's context. Losing a filtered list to edit one row is a defect — that's rung 3, not 5.
- Anything the user may need to compare with background content NEVER goes in a modal (modals hide context by design).
- Confirmation Dialog is rung 4 by definition but exempt from the "no modal over drawer" concern: a confirm may appear above a drawer; a *second task modal* may not.
- Wizards: 3–7 steps, each step valid on its own, progress visible, back never loses data.

Decision tree (apply top-down, stop at first match):

```
Editing exactly one field, trivially validated?      → 1 Inline edit
Picking/adjusting ≤ 4 related controls, no submit?   → 2 Popover
Does the user need the surrounding list/context,
or is this edit/peek launched from a list?           → 3 Right Drawer
Is it one interrupting decision or a short,
self-contained create?                               → 4 Modal
Multi-step, complex, or needs a shareable URL?       → 5 Full page / Wizard
```

Reference assignments (Flexa Marketplace):

| Task | Rung |
|---|---|
| Rename a Saved Filter; change order quantity in cart | 1 Inline edit |
| Pick a Date Range, assign a dispute to an admin | 2 Popover |
| Edit a listing's price/stock from Listings; peek Order Detail from Orders List; reply from Conversation List | 3 Right Drawer |
| Confirm release funds; resolve an edit conflict; add a payment method | 4 Modal |
| Checkout; Seller Onboarding Wizard; Listing Editor create wizard; Dispute Detail | 5 Full page / Wizard |

---

## 8. Navigation & wayfinding

- **Breadcrumb** is required whenever the user is > 2 levels deep in the IA (06 owns the tree). Home level may be an icon; current page is plain text, not a link.
- **Back behavior:** the browser/OS back button MUST always work and never lose data (pairs with unsaved guard). Closing a drawer/modal is a UI state change, not a navigation — back closes it on Mobile, but on Desktop back navigates and the overlay's own close control dismisses it. In-app "Back" links go to the *logical* parent (the list), not `history.back()`, when the user deep-linked in.
- **Deep-linkable state:** filters, search query, sort, active Tabs, pagination cursor/page, and selected detail item MUST be encoded in the URL. Copying the URL reproduces the view. Ephemeral UI (open menus, hover, drawer scroll position) stays out of the URL.
- **Unsaved-changes guard:** any dirty explicit-save surface intercepts navigation (in-app route change, tab/window close via `beforeunload`-equivalent) with the discard dialog (§6). Autosave surfaces never block navigation.
- **Selected states:** the Sidebar always marks the current section; within a section, Tabs or the list marks the current item. The user can always answer "where am I?" from chrome alone.
- **No dead ends:** every screen — including Error Page, Success Page, and empty results — offers at least one onward action (§9, 10 §5).
- Titles: document/browser title mirrors on-screen title, most specific first ("Order #1042 · Orders · Flexa").

URL state contract (what belongs in the URL vs preference storage vs nowhere):

| State | Lives in |
|---|---|
| Search query, filters, sort, tab, page/cursor, selected detail id | URL (shareable, restorable) |
| Density, sidebar collapsed, column layout, last-used filter *default* | User preference storage (§13) |
| Open menus, hover, focus, drawer scroll, toast queue | Nowhere — ephemeral |
| Wizard progress, draft content | Server (resumable across devices) |

---

## 9. Loading, empty, and error states

**Every screen spec (08) MUST define all three.** A screen without a designed empty state ships an accidental one.

- **Loading:** per the latency doctrine (§3). List screens use Skeleton Loader rows matching final geometry; dashboards skeleton each Widget independently — never block the whole shell.
- **Empty** (Empty State / Blank State Layout): must *teach and advance*, not merely announce. Formula (copy owned by 10 §5): what this area is → why it's empty → the one next action as CTA. First-run empties may include a short illustration/hint; filtered-to-empty results instead say "No results for …" and offer "Clear filters". These are two different empty states — design both.
- **Error:** distinguish scope —
  - Field-level → Validation Message at the field (§10);
  - Region-level → Inline Error replacing the failed region with message + Retry, rest of the screen stays alive;
  - Screen-level → Error Page (404/403/500) with orientation + a way home;
  - Connectivity → Offline State banner; queue what can be queued, disable what can't, auto-retry on reconnect.
- Errors always keep the user's input. Destroying a typed form because a request failed is a critical defect.
- Retry is idempotent-safe: payment-affecting retries go through idempotency keys (09 owns the API rule); the UI MUST disable duplicate submission while in flight.
- Partial failure (3 of 10 bulk items failed) reports per-item results, never a bare "Something went wrong" (10 §6).

State matrix every screen spec fills in (08 uses this table verbatim):

| State | Question the spec must answer |
|---|---|
| Loading | Which skeleton geometry? What renders immediately (chrome, cached identity)? |
| Empty (first-run) | What does it teach? What is the one CTA? (copy per 10 §5) |
| Empty (filtered) | "No results" message + clear-filters affordance |
| Error (region) | What survives? Where is Retry? |
| Error (screen) | Which Error Page? Where does the user go next? |
| Offline | What is queued, what is disabled? |
| Partial data | Can the screen render with some sections failed? (It SHOULD.) |

---

## 10. Forms UX (philosophy)

Detailed control behavior lives in `02-ui-kit/forms.md`; this section owns the philosophy it implements.

- **Single column.** Multi-column field grids harm completion and scanning. Exception: tightly-bound micro-groups (city/zip, min/max) may share a row as one Field Group.
- **Labels above fields**, always visible. NEVER use placeholder text as the label (placeholders are examples — 10 §11). Label position does not change on Mobile.
- **Validation timing — "reward early, punish late":**
  - Validate a field on **blur**, not per keystroke, for error display;
  - Switch to per-keystroke revalidation only *after* a field has shown an error (so fixing clears instantly);
  - Format/availability checks that need the server show a subtle inline pending indicator, never a modal;
  - On submit, validate everything, focus the first invalid field, and show an error summary if > 1 error on a long form.
- Never disable the submit button as the only signal of invalidity on long forms — allow submit and show where the problems are. (Short atomic forms like sign-in may disable while pristine.)
- Mark **optional** fields, not required ones, when most fields are required (the common case); the reverse on mostly-optional forms. Pick one convention per form.
- Destructive/no-return form actions restate consequences at the point of submit (Checkout Summary shows exactly what will be charged).
- Group with Field Group + whitespace; a form > ~8 fields SHOULD be sectioned or become a Form Wizard.
- Persist in-progress form state against accidental loss (see save models §6, unsaved guard §8).

---

## 11. Motion doctrine

Motion is purpose-driven only. Every animation MUST serve one of three jobs; decorative motion is banned.

1. **Orientation** — where did this come from / go? (drawer slides from its edge, sheet rises from bottom, deleted row collapses)
2. **Causality** — what did my action do? (button press state, toggle travel, item flies to its new position on reorder)
3. **Continuity** — shared element carries identity across a change (card expands into detail, tab indicator slides).

Mapping to FDS motion tokens (01 §2):

| Motion | Duration | Easing |
|---|---|---|
| Hover/press, small fades, toggles | `motion.duration-fast` (120ms) | `motion.easing-standard` |
| Drawers, dialogs, accordions, sheets, toasts in/out | `motion.duration-normal` (240ms) | enter `motion.easing-out`, exit `motion.easing-in` |
| Page-level transitions, wizard steps, large layout shifts | `motion.duration-slow` (400ms) | `motion.easing-in-out` |

Rules:

- NEVER exceed 400ms for any interface transition. Longer sequences (celebrations on Success Page) are skippable and once-only.
- Nothing may *block input* while animating: interruptible and cancelable by the next user action.
- No motion on initial page load except content fade-in ≤ `duration-fast`. No looping/idle animation outside genuine progress indicators.
- `prefers-reduced-motion: reduce`: drop transforms (slides, scales, parallax), keep opacity fades ≤ `duration-fast` or disable entirely; progress indicators switch to non-animated determinate forms where possible (01 §2 Motion).
- List reordering and insertion/removal SHOULD animate position changes (causality) — but batch updates (poll refresh) MUST NOT ripple-animate; they swap with a fade at most.

---

## 12. Notification etiquette

Channel is chosen by *the user's need to know*, not by the developer's pride in the feature.

| Channel | Use for | Rules |
|---|---|---|
| **Inline / in-place state** | Result of the user's own action, visible where they act | Default. If the change is visible on screen (toggle flipped, row updated), that visibility IS the feedback. **Never toast success for an instant visible change.** |
| **Toast** | Result of the user's own action when the evidence is off-screen or delayed: "Export started", "Listing published", undo carriers (§5), background job completion while in-app | Max 3 visible, stacked (queue the rest, collapse duplicates — 02-ui-kit/feedback.md). Auto-dismiss info/success 5s; errors persist until dismissed. Never require a toast be clicked to continue a flow. Copy ≤ 60 chars (10 §8). |
| **Notification Center** | Things that happened while the user wasn't looking or weren't caused by them: order.paid, message.created, dispute.opened, listing.approved, payout.sent | Everything toasted about *other actors' events* also lands here (toasts are ephemeral; the center is the record). Unread count on the bell; mark-read is optimistic (§4). |
| **Warning Banner / Maintenance Banner** | Ambient, persistent conditions: degraded service, unverified email, payout account missing | One banner max; dismissible unless action-required; never covers content. |
| **Email / push** | Money events, disputes, security, and anything the user must know when offline | Batching: non-urgent same-type events digest (e.g. "5 new messages"), money and security events send immediately and individually. Respect per-category preferences (Account Settings › Notifications). |

- Every notification is actionable: tapping it deep-links to the object (§8).
- Batch in-app too: 20 rows imported = one toast, not twenty. Same-conversation messages collapse.
- NEVER notify the actor about their own action through the Notification Center ("You published a listing" is noise).
- Critical failures never rely on toast alone — pair with persistent Inline Error or banner.

---

## 13. Productivity mechanics

- **Keyboard-first:** every flow completable mouse-free. Doc 11 owns the key map and shortcut conventions; this bible mandates that list navigation, selection, primary action, and Command Palette invocation are keyboardable on every screen.
- **Command Palette everywhere:** available on all authenticated screens via a single global shortcut; indexes navigation ("Go to Orders"), actions in context ("Publish listing"), and records (search listings/orders/users by name/id). Recent items first; results grouped by type.
- **Bulk operations:** selectable lists get header checkbox (page scope) + "select all N matching" affordance; Bulk Actions Bar appears on selection with count; per-item results on partial failure (§9); bulk destructive per §5.
- **Sensible defaults:** every form field SHOULD have the most likely value preselected; every filter defaults to the most useful view (e.g. Orders → "Active"), with "All" one click away.
- **Remember user choices:** the following persist per user per product; resetting to defaults is always possible in one place (Account Settings):

| Preference | Scope |
|---|---|
| Density mode (`comfortable`/`compact`) | Per list surface |
| Sidebar collapsed/expanded | Global per product |
| Table column visibility, order, widths | Per table |
| Last-used filters (offered as default — distinct from URL state, §8) | Per list |
| Saved Filters | Per list, named, shareable where the product allows |
| Dismissed hints, banners, onboarding steps | Global |
| Preferred landing tab on multi-tab screens | Per screen |
| Notification preferences | Global (Account Settings › Notifications) |

- Zero-training rule for accelerators: shortcuts and quick actions are *additive* — the UI never requires them, and discoverable equivalents always exist in menus.
- Undo depth: content editors (Rich Text Editor, Markdown Editor, builders) provide multi-step undo/redo within the session; single mutations elsewhere rely on the §5 undo toast.
- Search everywhere responds to partial matches and ids: pasting an order id, listing title fragment, or email into the Command Palette or a list Search Bar finds the object.

---

## 14. Mobile adaptations

Component mapping (Desktop → Mobile ≤ 767px). Component specs in 02 implement these; screens in 08 may not deviate:

| Desktop | Mobile |
|---|---|
| Sidebar | Bottom Navigation (Mobile) + "More" sheet |
| Right Drawer | Full-screen sheet (slide up), back gesture closes |
| Popover / Context Menu | Bottom sheet |
| Modal (task) | Full-screen sheet; Confirmation Dialog stays a centered dialog |
| Tabs (> 4) | Scrollable tabs or segmented "More" |
| Table | Stacked Card list, 2–3 key fields, sort/filter behind one sheet |
| Hover Quick Actions | Explicit "…" menu per row |
| Tooltip | Long-press or visible helper text (hover doesn't exist) |
| Command Palette | Available via search affordance in the top bar |

- **Bottom Navigation (Mobile)** replaces the Sidebar: 3–5 top destinations + "More". The Floating Action Button, when used, carries the screen's primary action and never covers list content it acts on.
- **Sheets replace popovers and menus:** Popover, Context Menu, Select dropdowns with > ~6 options, and small modals become bottom sheets with drag-to-dismiss + Esc/back equivalence.
- **Thumb zone:** primary actions, confirmation buttons, and FAB live in the bottom third. Destructive options inside sheets sit *top-most* of the sheet (farthest from the resting thumb), tone `danger`.
- **Disclosure over density:** collapse table columns into stacked Card rows showing 2–3 key fields; detail on tap (drawer becomes full-screen sheet). Never present horizontally-scrolling tables as the primary mobile pattern (allowed only for genuinely comparative Data Grid use with sticky first column).
- Sticky elements budget: at most one sticky header + bottom nav; content is never squeezed below 60% of viewport height by chrome.
- Touch replaces hover entirely (M6): row actions appear via explicit "…" Quick Actions, not hover reveal.
- Wizards on Mobile: one decision per screen; progress indicator compact (step x of n).

---

## 15. Anti-patterns catalog

Named so reviews can cite them. Each entry: what it is → the rule it violates.

1. **Mystery meat icons** — icon-only controls without label/tooltip for non-universal concepts. Violates C6, 11 (labels); only universally-learned icons (search, close, settings) may stand alone, and even they carry accessible names.
2. **Confirm-shaming** — guilt-tripping decline copy ("No, I hate saving money"). Violates 10 §1 voice; buttons are neutral verbs.
3. **Infinite spinner** — loading state with no timeout or exit. Violates §3 (30s timeout → error + retry).
4. **Modal on modal** — stacking task modals. Violates §7 rung 4 (max one; only a Confirmation Dialog may sit above).
5. **Toast for everything** — success toast for visible instant changes; multiple simultaneous toasts. Violates §12.
6. **Spinner flash** — indicator for sub-300ms operations. Violates §3 (300ms delay rule).
7. **Skeleton mismatch** — skeleton shaped nothing like the final layout, causing reflow. Violates §3.
8. **Dead-end error** — error state with no retry/onward action. Violates §9, §8 (no dead ends).
9. **Placeholder-as-label** — placeholder text is the only field label. Violates §10, 10 §11.
10. **Premature validation** — shouting errors on first keystroke or on focus. Violates §10 timing.
11. **Silent save / silent discard** — leaving a dirty form auto-saves or drops changes without asking. Violates §6, §8 guard.
12. **Optimistic money** — showing payment/escrow/payout success before server confirmation. Violates §4 forbidden list.
13. **Everything-is-a-dialog** — confirmation dialogs on reversible actions instead of undo. Violates §5 (lowest rung) and P8; trains click-through blindness.
14. **Naked "Are you sure?"** — confirmation without object or consequence. Violates §5, 10 §7.
15. **Yes/No buttons** — dialog buttons that don't state the action. Violates 10 §4.
16. **Hover-only affordance** — actions reachable only via mouse hover. Violates A1, M6.
17. **Lost list syndrome** — full-page navigation for a row edit, destroying filter/scroll context. Violates P7, §7 rung 3.
18. **URL amnesia** — filters/tabs/pagination not in the URL; refresh or share loses the view. Violates §8.
19. **Two primaries** — competing primary buttons in one view. Violates §2.
20. **Border fencing** — boxes around every group instead of whitespace. Violates S2.
21. **Undead delete** — "Undo" offered on an action that already had external side effects. Violates §5 (undo must truly undo).
22. **Decorative motion** — animation serving none of orientation/causality/continuity, or ignoring reduced-motion. Violates §11.

---

## 16. Review checklist

Run before any screen spec (08) or component contract (04) is approved. Every "no" is a blocking finding citing the section:

1. Exactly one primary action, and it answers the screen's purpose? (§2)
2. All three of loading/empty/error designed, including filtered-empty and partial failure? (§9)
3. Latency budget assigned and matching the feedback table? No possible infinite spinner? (§3)
4. Optimistic vs pessimistic decided per operation; nothing money/destructive/validated is optimistic? (§4)
5. Every destructive or no-return action placed on the correct safety-ladder rung, soft delete honored? (§5)
6. One save model per screen, dirty state + leave guard (explicit) or saved-indicator (autosave)? (§6)
7. Lowest sufficient modality rung; no modal nesting; list context preserved for row edits? (§7)
8. Breadcrumb depth rule, back-safety, and URL state contract satisfied? (§8)
9. Form philosophy: single column, labels above, blur-then-keystroke validation, input never destroyed? (§10)
10. Motion mapped to `motion.*` tokens, purpose named, reduced-motion behavior stated? (§11)
11. Every message routed to the correct channel; no success toast for visible changes? (§12)
12. Keyboard path, Command Palette entries, bulk operations, and persisted preferences specified? (§13)
13. Mobile layout explicitly designed per the component mapping, primary action in thumb zone? (§14)
14. Zero matches against the anti-patterns catalog? (§15)
15. All copy delegated to or consistent with 10; all ARIA/keys delegated to 11?

---

*Owned rules end here. Words for all of the above — labels, errors, empty states, notifications — are owned by 10 Copywriting Guide. Keyboard specifics and ARIA by 11. Component-level anatomy by 04.*
