# 05 — Flexa Pattern Library

> Reusable UX solution templates for every Flexa product. A **pattern** is a problem→solution contract that screens (see 08) instantiate and flows (see 07) chain together. Patterns COMPOSE components from the canonical inventory (see 02-ui-kit/* for component detail, 04 for engineering contracts) and inherit all experience doctrine from the UX Bible (see 03). Copy for every state lives in 10; accessibility depth lives in 11; endpoint detail lives in 09.
>
> **This document is normative for behavior across screens.** A screen spec may tighten a pattern, never contradict it.

## How to read a pattern

Every pattern uses the same template:

- **Problem** — the recurring situation.
- **Solution overview** — the shape of the answer.
- **Anatomy** — structure, ASCII where useful.
- **Components used** — canonical component names, verbatim.
- **Behavior spec** — numbered, testable rules, including loading / empty / error states.
- **Variations** — sanctioned deviations.
- **API interaction shape** — verbs + endpoint style per README conventions (doc 09 owns the actual contract).
- **Accessibility notes** — pattern-level obligations (detail: see 11).
- **Anti-patterns** — what reviewers reject.

Shared vocabulary: personas `Guest · Buyer · Seller · Admin`; tones `neutral | info | success | warning | danger`; motion tokens `motion.duration-fast/normal/slow`; layers by `z.*` tokens only.

---

# Part A — UX Patterns

## A1. CRUD

**Problem.** Every entity (listings, users, categories, payout accounts…) needs a consistent list → detail → create/edit/delete lifecycle; ad-hoc lifecycles multiply UI and API drift.

**Solution overview.** One canonical lifecycle: a filterable list is the home of the entity; row click opens detail; create/edit happen in a Right Drawer by default, on a dedicated page only when the entity is complex (multi-section, media-heavy, wizard-worthy — e.g. Listing Editor); delete is always confirmed and reversible where the domain allows.

**Anatomy.**

```
┌ Data Management Toolbar ──────────────────────────────┐
│ [Search Bar] [Advanced Filters] [Saved Filters] [+New]│
├ Table ────────────────────────────────────────────────┤
│ ☐ | Name        | Status  | Updated   | ⋯             │
│ ☐ | Row …       | Badge   | date      | Context Menu  │
├───────────────────────────────────────────────────────┤
│ Pagination                                            │
└───────────────────────────────────────────────────────┘
Row click → Right Drawer (view/edit) or detail page.
```

**Components used.** Data Management Toolbar, Search Bar, Advanced Filters, Saved Filters, Table, Badge, Context Menu, Right Drawer, Modal Layout, Confirmation Dialog, Toast, Empty State, Skeleton Loader, Pagination.

**Behavior spec.**
1. List loads with Skeleton Loader rows (never a spinner-only page); first load ≤ 5 skeleton rows.
2. Empty list with no filters → first-use Empty State (see A17); empty with filters → no-results Empty State with "Clear filters" CTA.
3. Create: `+ New` opens Right Drawer (simple entities) or navigates to editor page (complex). Drawer submits via primary Button; success closes drawer, prepends/refreshes list, fires Toast with link to the new item.
4. Edit: default is Drawer Editing (see B3). Fields ≤ 3 may use Quick Edit (B2); single field may use Inline Editing (B1).
5. Optimistic updates follow doc 03: allowed for low-risk, reversible mutations (rename, toggle, tag); **never** for money, permissions, publish/moderation state, or anything escrow-adjacent — those wait for the server and show explicit pending state.
6. Delete: always a Confirmation Dialog naming the object ("Delete *Blue Widget*?"); destructive Button uses `danger` emphasis. Soft-deletable entities offer Undo in the success Toast (window ≥ 5s); hard deletes require typing confirmation only for high-blast-radius objects (Admin only).
7. Errors: mutation failure keeps the drawer/dialog open, shows Inline Error at form top + field-level Validation Message from `error.details[]`; the list never silently loses user input.
8. Concurrency: stale write (server `conflict` code) → non-destructive prompt to reload or overwrite; never auto-overwrite.
9. List state (filters, sort, cursor, selected view) persists in the URL (see A3).

**Variations.** Read-only CRUD (Audit Log, System Logs) drops create/edit/delete; page-based editing for complex entities; Kanban Board as an alternate list projection with identical toolbar.

**API interaction shape.** `GET /v1/{resources}?cursor=&limit=&q=&filter…` → `{data, pageInfo}`; `POST /v1/{resources}`; `GET/PATCH/DELETE /v1/{resources}/{id}`. Partial update via `PATCH` with changed fields only. Errors in the standard envelope.

**Accessibility notes.** Table semantics with row headers; drawer receives focus on open and restores it on close; delete confirmation is a focus-trapped dialog. See 11.

**Anti-patterns.** Editing in-place on the list for multi-field entities; delete without confirmation; optimistic publish/moderation; modal-inside-drawer stacks deeper than one level; list state stored only in memory.

---

## A2. Search

**Problem.** Users must find entities fast without knowing exact names, across contexts with very different corpora (global vs a single table).

**Solution overview.** Two scopes: **global search** (Search Bar in Top Navigation / Command Palette) across major entity types with grouped results, and **scoped search** (Search Bar inside a Data Management Toolbar) filtering one collection. Both debounce, both have explicit no-results states, global search remembers recent queries.

**Anatomy.**

```
[🔍 Search…            ⌘K]
┌ results ────────────────┐
│ RECENT  (before typing) │
│ LISTINGS  ▸ item ▸ item │
│ ORDERS    ▸ item        │
│ SELLERS   ▸ item        │
│ "View all results for…" │
└─────────────────────────┘
```

**Components used.** Search Bar, Command Palette, Autocomplete, Tag (result-type labels), Empty State, Skeleton Loader, List.

**Behavior spec.**
1. Debounce keystrokes **300ms**; in-flight request is cancelled by the next one (latest-wins; stale responses are discarded).
2. Minimum query length: 2 characters for global search; scoped table search may fire from 1. Below minimum, show recent searches (global) or do nothing (scoped).
3. Results group by entity type, max 5 per group, ordered by relevance then recency; a final "View all results" row navigates to the Search Results screen.
4. Loading state: inline spinner in the field + Skeleton Loader rows in the popover; never blank the previous results while typing.
5. No results → no-results Empty State inside the popover with the literal query echoed ("No results for “blu widgt”") and, where supported, a "did you mean" suggestion.
6. Recent searches: last 5 per user per scope, deletable individually, cleared on sign-out of shared devices.
7. Query is reflected as `?q=` in the URL on the results screen; back button restores it.
8. Matching text in results is highlighted (semantic `<mark>`, styled with `color.primary` at reduced opacity — never color alone).
9. Scoped search combines with active filters as AND (see A3 rule 6).

**Variations.** Autocomplete-only search (pick an entity as a form value); search-as-command (Command Palette merges search + actions, see B9); mobile: full-screen search sheet instead of popover.

**API interaction shape.** `GET /v1/search?q=&types=listing,order&limit=` → grouped `{data:{listings:[],orders:[]}}`; scoped: `GET /v1/{resources}?q=&cursor=`. Server owns relevance; client never re-sorts.

**Accessibility notes.** Combobox ARIA pattern (`role=combobox` + listbox); result count announced via live region; `/` focuses search (B8). See 11.

**Anti-patterns.** Debounce < 300ms hammering the API; blanking results while loading; client-side fuzzy search over paginated server data; unbounded "recent searches"; search that loses the query on navigation.

---

## A3. Filtering

**Problem.** Collections are large; users need to narrow them precisely, share the narrowed view, and return to it later.

**Solution overview.** Progressive disclosure: 0–3 high-traffic filters surface as chips/selects on the toolbar; everything else lives in an Advanced Filters panel. The full filter state is URL-persisted and composable with search. Frequently reused combinations become Saved Filters.

**Anatomy.**

```
[Search] [Status ▾] [Category ▾] [+ Filters] [Saved ▾]
Active: (status: Active ✕) (price ≤ $50 ✕)  [Clear all]
```

**Components used.** Advanced Filters, Saved Filters, Chip, Select, Date Range Picker, Tag Input, Search Bar, Table, Empty State.

**Behavior spec.**
1. Every active filter renders as a dismissible Chip below the toolbar; ✕ removes exactly that predicate. "Clear all" appears when ≥ 2 chips.
2. Advanced Filters opens as a popover (desktop) / sheet (mobile); applying commits all predicates atomically with an "Apply" action — no per-field refetch storm.
3. Full filter state serializes to the URL (`?status=active&priceMax=5000`); deep links reproduce the exact view; browser back steps through filter history.
4. Result count updates in the toolbar ("128 results"); count change is announced politely (see 11).
5. Filtered-to-empty → no-results Empty State with "Clear filters" CTA — never a blank table.
6. Search (`q`) AND filters combine conjunctively; chips and query display together so the user can audit the whole predicate.
7. Saved Filters store name + serialized predicate per user (Admin may publish shared ones); applying one replaces current filter state after a dirty-check.
8. Filters validate client-side (e.g. min ≤ max) before request; invalid combinations disable Apply with a Validation Message.
9. Loading during refetch keeps current rows visible under a subtle Loading Overlay on the table region (no full-page skeleton after first load).

**Variations.** Faceted filtering with live counts per option (search results); segmented "views" as Tabs (All / Active / Archived) that are just canned filters; column-header filtering in Data Grid for Admin density.

**API interaction shape.** Filters map to query params on collection `GET`s; multi-value = repeated params or comma lists per doc 09; Saved Filters: `GET/POST/DELETE /v1/saved-filters` scoped by resource type.

**Accessibility notes.** Chips are buttons with accessible names ("Remove filter: status Active"); filter panel is a labelled region; result-count live region. See 11.

**Anti-patterns.** Filters that apply on every keystroke of every field; filter state lost on refresh; hiding *which* filters are active; "smart" default filters the user can't see or remove; mixing OR/AND semantics silently.

---

## A4. Bulk Actions

**Problem.** Operating on items one-by-one doesn't scale for Sellers and Admins (approve 40 listings, archive 200 orders).

**Solution overview.** A selection model on Table/Data Grid rows summons a persistent Bulk Actions Bar with the selected count and the actions valid for the whole selection; execution reports per-item outcomes, never all-or-nothing silence.

**Anatomy.**

```
┌ Bulk Actions Bar (sticky, z.sticky) ───────────────────┐
│ 12 selected · [Select all 240] | Approve  Archive  ⋯ ✕ │
└────────────────────────────────────────────────────────┘
```

**Components used.** Bulk Actions Bar, Table / Data Grid, Checkbox, Confirmation Dialog, Toast, Progress, Alert.

**Behavior spec.**
1. Selection: row Checkbox; header Checkbox selects the page; when a full page is selected, offer "Select all N matching" (cross-page selection is by predicate, not by ID list).
2. Bar appears on first selection (slide-in, `motion.duration-fast`), sticky above content, shows live count, ✕ clears selection. Esc clears selection when focus is in the table.
3. Only actions valid for **every** selected item are enabled; invalid ones are disabled with a reason tooltip ("2 selected listings are already approved").
4. Destructive or irreversible bulk actions require a Confirmation Dialog stating scope ("Archive 240 listings matching current filters?").
5. Execution ≥ ~25 items or predicate-scoped runs async: show Progress with running counts; the user may navigate away — completion arrives via Notifications (A16).
6. **Partial failure is first-class:** result reports `succeeded / failed` with per-item reasons; the UI offers "Retry failed" and keeps failed rows selected. Never report generic success when any item failed.
7. Selection survives sort/filter changes only for explicitly selected rows still visible; predicate selections ("all matching") recompute server-side at execution time and say so.
8. Optimistic UI is forbidden for bulk mutations; rows show pending state until confirmed.

**Variations.** Kanban multi-drag (B7) reuses the same selection + report model; inline bulk edit (set one field across selection) via Modal Editing.

**API interaction shape.** `POST /v1/{resources}/bulk` with `{action, ids[] | filter{}, params{}}` → `202 {jobId}` for async or `200 {results:[{id,status,error?}]}` for sync; job polling `GET /v1/jobs/{id}`. Idempotency-Key on the POST.

**Accessibility notes.** Bar is a live-announced region ("12 items selected"); all bar actions keyboard-reachable; selection state exposed via `aria-selected`. See 11.

**Anti-patterns.** Silent partial failure; selecting "all" by fetching every ID to the client; bulk bar covering the last table row with no scroll allowance; destructive bulk action with single-item copy ("Delete item?" for 200 items).

---

## A5. Wizard

**Problem.** Long or high-stakes tasks (seller onboarding, listing creation, checkout) overwhelm users when presented as one giant form and are error-prone without staged validation.

**Solution overview.** Wizard Layout + Form Wizard split the task into 3–7 labelled steps with per-step validation, persistent progress, save-and-resume, and a mandatory review step before any irreversible commit.

**Anatomy.**

```
● Details ── ● Media ── ○ Pricing ── ○ Review
┌ step content ──────────────────────────────┐
│ Field Group…                               │
└────────────────────────────────────────────┘
[← Back]                    [Save draft] [Continue →]
```

**Components used.** Wizard Layout, Form Wizard, Field Group, Validation Message, Stepper (numeric inputs), Progress, Confirmation Dialog, Toast, Description List (review step).

**Behavior spec.**
1. Steps are labelled by outcome nouns ("Pricing", not "Step 3"); count visible up front; 3–7 steps, else restructure.
2. Continue validates **only the current step**; errors focus the first invalid field with Validation Message. Cross-step consistency is re-checked at Review.
3. Back never destroys entered data; step state is kept for the session even if invalid.
4. Save-and-resume: draft persists server-side on every step transition (and on explicit "Save draft"); returning users land on the first incomplete step with a "Resumed draft" notice.
5. Completed steps are revisitable via the step header; future steps are locked until prerequisites pass.
6. Review step renders every answer as a Description List with per-section "Edit" links jumping to the owning step; the commit CTA states the consequence ("Publish listing", "Pay $120.00").
7. Commit is never optimistic; the CTA shows loading state and disables double-submit; failures return the user to Review with an Inline Error and preserved data.
8. Abandoning with unsaved changes triggers a dirty guard Confirmation Dialog (Keep editing / Save draft / Discard).
9. Step transitions animate `motion.duration-slow` (respect `prefers-reduced-motion`).

**Variations.** Branching steps (choices skip irrelevant steps — skipped steps hidden, not greyed); single-page "accordion wizard" on mobile; Checkout (A9) is a specialized wizard with stricter rules.

**API interaction shape.** Draft: `POST /v1/{resources}` (status `draft`) then `PATCH /v1/{resources}/{id}` per step; commit: `POST /v1/{resources}/{id}/submit` (or domain verb). Server returns per-field errors mapped to steps.

**Accessibility notes.** Steps are an ARIA `list` with current step `aria-current="step"`; focus moves to the step heading on transition; errors announced assertively. See 11.

**Anti-patterns.** Validating the whole form on step 1; losing data on Back; a Review step that is just "Are you sure?"; unlabeled progress ("Step 3 of 9"); auto-advancing steps on field completion.

---

## A6. Dashboard

**Problem.** Buyers, Sellers, and Admins each need an at-a-glance answer to "what changed, what needs me, how am I doing" without hunting through lists.

**Solution overview.** Dashboard Layout with a strict metric hierarchy: primary KPIs first (Metric Card row), then trends (Charts Container), then actionable queues (Activity Feed / tables). A global time range selector scopes everything; every number drills down to the filtered list that explains it.

**Anatomy.**

```
[Time range: Last 30 days ▾]                [Customize]
┌Metric┐ ┌Metric┐ ┌Metric┐ ┌Metric┐   ← ≤ 4 primary KPIs
├ Charts Container ──────────┬ Activity Feed ──────────┤
│ revenue trend              │ needs-attention queue   │
└────────────────────────────┴─────────────────────────┘
```

**Components used.** Dashboard Layout, Metric Card, Statistics Card, Charts Container, Activity Feed, Recent Activity, Progress Summary, Quick Links, Widget, Skeleton Loader, Empty State.

**Behavior spec.**
1. Hierarchy: ≤ 4 primary Metric Cards above the fold; secondary Statistics Cards and charts below; queues ("Disputes awaiting response") outrank vanity metrics.
2. Time range selector (presets: Today / 7d / 30d / 90d / Custom via Date Range Picker) scopes all widgets simultaneously and persists in the URL.
3. Each Metric Card shows value, delta vs previous equal period (▲/▼ + tone color + sign — never color alone), and sparkline where meaningful.
4. Drill-down: clicking a metric or chart segment navigates to the owning list pre-filtered to match the number exactly (count parity is a testable contract).
5. Widgets load independently with Skeleton Loader; one failed widget shows an inline retry card, never breaking the page.
6. Empty account (no data yet) → each widget renders its first-use Empty State with setup CTA; the dashboard doubles as onboarding checklist.
7. Data freshness is labelled ("Updated 2 min ago"); manual refresh available; no auto-refresh faster than 60s.
8. Currency/number formatting follows locale; money from integer minor units per README.

**Variations.** Persona dashboards (Buyer = orders & messages; Seller = sales, queue, payouts; Admin = platform health, moderation & Disputes Queue, Queue Monitor); customizable widget grid (drag to reorder, see B7) for power users.

**API interaction shape.** `GET /v1/metrics?keys=revenue,orders&from=&to=&granularity=` → series + totals; queue widgets reuse collection endpoints with canned filters. No dashboard-only aggregates that a drill-down list can't reproduce.

**Accessibility notes.** Charts require text equivalents (data table toggle or summary); deltas readable without color. See 11.

**Anti-patterns.** Metrics with no drill-down; mixed time ranges across widgets without labels; > 4 primary KPIs; auto-refresh that yanks scroll position; charts as the only representation of data.

---

## A7. Settings

**Problem.** Configuration accumulates; dumping it in one page makes options undiscoverable and risky changes indistinguishable from safe ones.

**Solution overview.** Settings Layout: grouped left nav of setting sections, each section a page of Field Groups with **explicit save per section** (doc 03: settings are never implicitly saved), and a visually separated danger zone for destructive account-level operations.

**Anatomy.**

```
┌ nav ─────────┬ section ───────────────────────────────┐
│ Profile      │ Notifications                          │
│ Security     │ ┌ Field Group ┐ ┌ Field Group ┐        │
│ Notifications│ …                                      │
│ Billing      │ [Save changes]  (sticky when dirty)    │
│ ──────────── │ ─ Danger zone ─────────────────────    │
│ Advanced     │ [Delete account]                       │
└──────────────┴────────────────────────────────────────┘
```

**Components used.** Settings Layout, Sidebar (section nav), Field Group, Switch, Select, Input, Validation Message, Confirmation Dialog, Toast, Alert, Warning Banner.

**Behavior spec.**
1. Sections are nouns grouped by mental model (Profile / Security / Notifications / Billing / Advanced), not by backend module.
2. Explicit save: each section has one "Save changes" primary Button, disabled until dirty, sticky at the section bottom when dirty. Exception: single Switch toggles with immediate, reversible effect MAY commit instantly with a Toast + Undo — the section must say so ("Saved automatically").
3. Dirty guard on navigation away from an unsaved section (Confirmation Dialog: Stay / Discard).
4. Save success → Toast; failure → Inline Error at section top + field Validation Messages; entered values never cleared.
5. Danger zone: visually separated (last, `color.danger` accents), each action gets its own Confirmation Dialog with typed confirmation for irreversible operations (delete account, revoke all sessions).
6. Security-sensitive changes (email, password, payout account) require re-authentication (see A8 rule 8) and emit a notification to the account owner.
7. Search within settings (scoped Search, A2) once section count > 6.
8. Loading: per-section Skeleton Loader; a failed section load shows inline retry, nav stays usable.

**Variations.** Product settings vs account settings use the same layout at different URL roots; Admin System Settings adds Permission Matrix and environment-labelled Warning Banner ("Production").

**API interaction shape.** `GET /v1/settings/{section}`; `PATCH /v1/settings/{section}` with changed keys; danger zone verbs are explicit (`POST /v1/account/delete-request`). Notification prefs are a matrix resource (see A16).

**Accessibility notes.** Section nav is a labelled navigation landmark; dirty state announced; typed-confirmation inputs have explicit labels. See 11.

**Anti-patterns.** Global "Save all" across sections; auto-save of multi-field forms without saying so; danger actions inline among safe ones; settings that silently require signing in again later.

---

## A8. Authentication

**Problem.** Sign-in friction loses users; sloppy auth flows leak information and break mid-task recovery.

**Solution overview.** Authentication Layout hosts a small family of single-purpose screens — Sign In, Sign Up, Forgot Password, Email Verification, 2FA challenge — plus an SSO slot, and a session-expiry re-auth dialog that never destroys in-progress work.

**Anatomy.** Centered card ≤ `size.container-sm`, logo, one form, one primary action, secondary links below. SSO buttons above or below the form separated by an "or" divider.

**Components used.** Authentication Layout, Input, Email Input, Password Input, Checkbox, Validation Message, Alert, Toast, Modal Layout (re-auth), Success Page.

**Behavior spec.**
1. Sign in: email + password, submit on Enter; generic failure copy ("Email or password is incorrect") — never reveal which field, never reveal account existence.
2. Sign up: minimum viable fields (email, password, name); password strength meter with requirements listed up front; ToS consent checkbox where required. Success → Email Verification screen.
3. Forgot password: always responds "If an account exists, we sent a link" (anti-enumeration); link expiry stated; reset form re-validates strength.
4. Email verification: instruction screen + "Resend" with cooldown (60s, visible countdown); verifying via link lands on Success Page → onward CTA per persona.
5. 2FA: after primary credentials, code challenge screen (TOTP or SMS); input auto-advances, paste-friendly; recovery-code path always linked.
6. Rate limiting: after repeated failures, show `warning` Alert with retry-after; CAPTCHA slot if the platform enables it.
7. **Session expiry re-auth:** expired session during activity → Modal Layout re-auth dialog *over* the current screen; successful re-auth resumes exactly where the user was, replaying the failed request where safe (GET always; mutations only if idempotent). Full redirect to Sign In only from cold entry.
8. Step-up re-auth: sensitive operations (A7 rule 6, payout changes) reuse the same re-auth dialog even with a live session.
9. SSO slot: provider buttons are configuration-driven; SSO errors return to Sign In with a specific `info` Alert, not a dead end.
10. Loading: single submit button shows loading state; the whole form disables during submit; no double-submit.

**Variations.** Invite-accept flow (token pre-fills email, locked); magic-link sign-in as SSO-slot member; embedded auth (WordPress admin) may delegate to host and skip screens — the re-auth dialog contract still applies.

**API interaction shape.** `POST /v1/auth/sign-in | sign-up | password-reset-request | password-reset | verify-email | two-factor`; session via secure cookie or token per doc 09; `401` with code `session_expired` triggers rule 7 globally.

**Accessibility notes.** One `h1` per screen; errors tied to fields via `aria-describedby`; countdowns announced; focus lands on first field. See 11.

**Anti-patterns.** "No account with this email" copy; disabling paste in password/code fields; expiring a session by hard redirect that loses a half-written form; 2FA with no recovery path; infinite verification-resend.

---

## A9. Checkout

**Problem.** Payment is the highest-stakes flow: any ambiguity, data loss, or double charge destroys trust — and Flexa checkout must also explain escrow to first-time buyers.

**Solution overview.** A specialized Wizard (A5) with fixed stages — Cart → Address/Details → Payment → Review → Confirm — an escrow explainer step surfaced before payment, **never-optimistic** mutations, idempotent submission, and explicit failure recovery at every stage.

**Anatomy.**

```
Cart ─ Details ─ Payment ─ Review ─ ✓
┌ stage content ───────────┬ Checkout Summary (sticky) ┐
│ …                        │ items, fees, escrow note, │
│                          │ total                     │
└──────────────────────────┴───────────────────────────┘
```

**Components used.** Wizard Layout, Cart Summary, Checkout Summary, Payment Status, Escrow Timeline (preview), Field Group, Currency Input, Alert, Confirmation Dialog, Inline Error, Success Page.

**Behavior spec.**
1. Cart: line items editable (quantity, remove) with server-recalculated totals; price changes since adding are flagged with an `info` Alert, never silently applied.
2. Details: address/contact with inline validation; supports saved addresses (Select) + "new address" branch.
3. **Escrow explainer:** before payment entry, a concise panel states how escrow works ("Your payment is held by Flexa and released to the seller only after you approve delivery"), with a link to full terms and a mini Escrow Timeline preview of the stages (see A13). First purchase: expanded; thereafter: collapsed but present.
4. Payment: method selection + entry; card fields tokenize via provider — raw PAN never touches Flexa API. Validation errors are field-level and retryable.
5. Review: full Description List of items, address, method (masked), fee breakdown, total, escrow terms; commit CTA is "Pay {amount}" — exact, formatted, no surprises after this click.
6. **Never optimistic:** the pay action shows a blocking pending state (Loading Overlay on the stage, CTA disabled) until the server answers. Navigation away is guarded while payment is in flight.
7. **Idempotency:** every payment-affecting POST carries an Idempotency-Key generated at Review render; retries (network failure, user retry) reuse the same key, making double-submit harmless.
8. Failure recovery: declined → return to Payment with reason and preserved state; ambiguous/timeout → status-check screen polling `GET /v1/orders/{id}` before allowing retry ("Confirming your payment…") — never "try again" while the outcome is unknown.
9. Success: Confirm screen (Success Page) with order number, Payment Status = `held`, Escrow Timeline at stage `payment_held`, and next-step CTAs (View order, Message seller).
10. Cart persistence: server-side per user; Guest checkout (if enabled) converts to account at Details.

**Variations.** Single-item express checkout collapses Cart into Review; subscription checkout adds recurrence terms to Review; mobile: Checkout Summary collapses to an expandable footer bar.

**API interaction shape.** `GET/PATCH /v1/cart`; `POST /v1/orders` (from cart, Idempotency-Key) → order `created`; `POST /v1/orders/{id}/pay` (Idempotency-Key) → `held` or failure envelope; `GET /v1/orders/{id}` for recovery polling.

**Accessibility notes.** Totals changes announced; the pay button's accessible name includes the amount; timeout/recovery states focus their heading. See 11.

**Anti-patterns.** Optimistic "Payment successful!"; totals that change between Review and receipt; retry buttons during unknown payment state without status check; hiding escrow terms until after payment; storing card data in Flexa fields.

---

## A10. Timeline

**Problem.** Users need to reconstruct "what happened, when, by whom" for orders, disputes, audits — raw event lists are unreadable.

**Solution overview.** A vertical Timeline of events ordered newest-first (activity feeds) or oldest-first (process timelines like escrow), grouped by day, each entry following the **actor + action + object** grammar with relative + absolute time.

**Anatomy.**

```
── Today ─────────────────────────
●  Anna (Buyer) approved delivery        2:14 PM
│    "Looks great, thanks!"
●  System sent auto-release reminder     9:00 AM
── Mar 3 ─────────────────────────
●  Minh (Seller) marked order delivered  6:40 PM
```

**Components used.** Timeline, Activity Timeline, Activity Feed, Audit Timeline, Avatar, Badge, Card (attached payloads), Skeleton Loader, Empty State.

**Behavior spec.**
1. Ordering: feeds/audit = newest-first; process timelines (Escrow Timeline, Shipping Timeline) = oldest-first showing progression toward completion. One order per surface — never mixed.
2. Group headers by day (Today / Yesterday / date); sticky while scrolling within the group.
3. Entry grammar: **actor** (name + persona Badge, or "System") + **action** (past-tense verb) + **object** (linked entity), then optional payload (comment, attachment, diff). Copy rules: see 10.
4. Time: relative for < 24h ("2h ago") with absolute ISO-local timestamp on hover/expansion; absolute beyond 24h.
5. Event types are visually distinguished by icon + tone (status changes `info`/`success`/`danger`), never color alone.
6. Long timelines load incrementally (cursor "Show earlier events"); feeds may use Infinite Scroll (B5).
7. Empty: process timelines always render their full expected stages (future stages muted); feeds show a first-use Empty State.
8. System events are visually quieter than human events; money-affecting events are visually strongest.

**Variations.** Compact mode inside cards (no avatars); Audit Log adds actor IP/role and immutable export; Comment Thread interleaved with events on Dispute Detail.

**API interaction shape.** `GET /v1/{resources}/{id}/events?cursor=` → `{data:[{id,type,actor{},object{},payload{},createdAt}]}`; events are append-only, server-ordered.

**Accessibility notes.** Timeline is a list; day headers are headings; relative times carry absolute `datetime`. See 11.

**Anti-patterns.** Mixed sort orders in one view; "Updated" events without saying what changed; client-side clock for grouping (use server time); truncating actor identity on audit surfaces.

---

## A11. Approval Flow

**Problem.** Content and actions that carry platform risk (listings, AI-generated output, payouts) need human/system review with a transparent lifecycle for the submitter.

**Solution overview.** A generic submit → `pending` → approve / reject-with-reason → resubmit loop. Reviewers work a queue; submitters always see current state, the reason for rejection, and exactly what to fix. Used by listings moderation and AI review (Approve/Reject Panel), among others.

**Anatomy.**

```
Submitter:  [Submit for review] → Badge: Pending review
Reviewer queue:  item ▸ [View] → Approve | Reject (reason required)
Submitter after reject:  danger Alert + reason → [Edit & resubmit]
```

**Components used.** Badge, Alert, Approve/Reject Panel, AI Confidence Indicator (AI review), Table (queue), Right Drawer (review detail), Confirmation Dialog, Toast, Timeline (decision history), Textarea (reason).

**Behavior spec.**
1. States: `draft → pending → approved | rejected → (edit) → pending…`. Current state is always visible on the object as a Badge with tone (`pending`=info, `approved`=success, `rejected`=danger).
2. Submitting locks the object from edits while `pending` (or clearly marks edits as creating a new revision — one rule per product, stated in the UI).
3. Reject **requires a reason**: structured category (Select) + free text; reason is shown verbatim to the submitter and stored in the decision Timeline.
4. Approve may be one click from the queue for low-risk items; high-risk approvals (payouts) require Confirmation Dialog and are audit-logged.
5. Resubmit: submitter edits and resubmits; the reviewer sees a diff or change summary against the rejected revision.
6. Queue: reviewers see oldest-first by default with SLA aging indicators; claiming an item locks it against double review.
7. AI-assisted review: AI verdict renders as an AI Suggestion Card with AI Confidence Indicator; the human decision is the only one that changes state — AI never auto-approves above the platform's configured risk line.
8. Notifications (A16) fire to the submitter on every state change.
9. Loading/empty/error: queue behaves as CRUD list (A1); decision submit failures keep the panel open with Inline Error.

**Variations.** Multi-stage approval (chained reviewers, each stage on the Timeline); auto-approval rules with post-hoc sampling; moderation escalation into Dispute-style arbitration.

**API interaction shape.** `POST /v1/{resources}/{id}/submit`; `POST /v1/{resources}/{id}/approve | reject {reasonCode, note}`; queue = `GET /v1/moderation/queue?type=&cursor=`. Decisions append to `/events`.

**Accessibility notes.** State changes announced; reason field labelled and required-marked; queue keyboard-navigable. See 11.

**Anti-patterns.** Rejection without reason; editable-while-pending ambiguity; reviewer seeing no diff on resubmission; AI verdicts styled like human decisions; approve/reject buttons adjacent with identical styling.

---

## A12. Dispute Flow

**Problem.** When a transaction goes wrong, buyer and seller need a structured, time-boxed, evidence-based path to resolution that pauses money movement and keeps both sides informed.

**Solution overview.** Buyer opens a dispute with a reason + evidence; the seller gets a bounded response window; unresolved disputes escalate to Admin arbitration; resolution is one of **refund / release / partial split**. The dispute pauses the escrow auto-release timer (A13) for its whole duration.

**Anatomy.**

```
[Open dispute] → reason + evidence upload
   ↓
Seller response window (5-day countdown shown to both)
   ├─ seller resolves (refund offer accepted) → resolved
   ├─ parties settle in Messages → either closes dispute
   └─ window ends / buyer escalates → Admin arbitration
        → decision: refund | release | partial + rationale
```

**Components used.** Right Drawer or Wizard Layout (open form), File Upload / Drag & Drop Upload (evidence), Alert, Badge, Timeline (dispute history), Chat / Comment Thread, Countdown via Progress, Confirmation Dialog, Approve/Reject Panel (admin decision), Payment Status.

**Behavior spec.**
1. Eligibility: "Open dispute" is available on Order Detail from `payment_held`/`delivered` until release; ineligible states explain why (tooltip/Alert), the button never just disappears.
2. Opening requires: reason category (Select, closed vocabulary), description, ≥ 0 evidence attachments (images/files with type+size limits shown up front). Submission is confirmed (Confirmation Dialog stating the consequence: "This pauses payment to the seller").
3. On open: order `EscrowStage → disputed`; auto-release timer pauses immediately and visibly (A13 rule 6); both parties notified.
4. Seller response window: 5 days default (platform-configurable) with a countdown visible to both sides; seller may respond with explanation + counter-evidence, offer partial/full refund, or accept.
5. Buyer may accept a seller offer at any time → resolution executes without Admin.
6. Escalation: automatic at window expiry without resolution, or manual by either party after first response. Escalated disputes enter the Admin Disputes Queue (oldest-first, SLA-aged).
7. Admin arbitration: Admin sees both submissions side-by-side (Split View), full order + message Timeline, and decides **refund | release | partial** (partial = amount split entry validated against order total). Decision requires a written rationale, shown to both parties.
8. Resolution executes atomically against escrow: `refunded`, `released`, or `partially_refunded` (see A13 state machine); dispute Badge → `resolved`; Timeline records everything.
9. All dispute communication is in-thread (Messaging, A15) and on the record; the UI states that Admin can read the order conversation during arbitration.
10. Loading/error: evidence uploads show per-file Progress and retry; a failed decision submit never half-applies (server-side transaction; client shows Inline Error and re-polls state).

**Variations.** Seller-opened disputes (non-payment edge cases) mirror the flow with roles swapped; platform-initiated freezes (fraud) skip the response window and go straight to arbitration with an `info` Alert to both parties.

**API interaction shape.** `POST /v1/orders/{id}/disputes {reasonCode, description}` + `POST /v1/disputes/{id}/evidence`; `POST /v1/disputes/{id}/respond | offer | accept-response | escalate`; Admin: `POST /v1/disputes/{id}/resolve {outcome: refund|release|partial, amounts{}, rationale}` (Idempotency-Key — money-affecting). Webhooks `dispute.opened`, `dispute.resolved`.

**Accessibility notes.** Countdowns have text equivalents and don't rely on animation; evidence upload errors are per-file and specific; arbitration Split View keyboard-traversable. See 11.

**Anti-patterns.** Hiding the dispute option to reduce dispute rates; letting the auto-release timer run during a dispute; Admin decisions without rationale; free-text-only reasons (unreportable); resolving without notifying both sides.

---

## A13. Escrow Flow — *flagship pattern*

**Problem.** Escrow is Flexa Marketplace's trust core: money is held between strangers. Buyers fear losing money; sellers fear never being paid; both fear opaque process. The UI must make the state of the money unambiguous to every persona at every moment.

**Solution overview.** One canonical state machine rendered everywhere by the same components: Payment Status (the money) + Escrow Timeline (the process). Happy path: payment held → delivery → buyer approval → release. An auto-release timer protects sellers from unresponsive buyers, with reminders to the buyer; a dispute branch pauses the timer. Every stage defines who sees what and who can act.

**Anatomy — state machine (canonical enums per 04 §5 / 09 § Payments & Escrow: PaymentStatus `pending|processing|held|released|refunded|partially_refunded|failed`, EscrowStage `payment_held|delivered|approved|released|disputed`):**

```
                    PaymentStatus: pending → processing
                       │  buyer pays (A9)
                       ▼
              ┌─────────────────────┐
              │ PaymentStatus: held │  EscrowStage: payment_held
              └─────────┬───────────┘
            seller marks│delivered
                       ▼
              ┌─────────────────────┐   auto-release timer runs
              │ PaymentStatus: held │   (default 7d; reminders
              │ EscrowStage:        │    at T-72h and T-24h)
              │   delivered         │
              └───┬───────────┬─────┘
   buyer approves │           │ timer expires
   (EscrowStage:  │           │ (auto-release)
    approved)     ▼           ▼
              ┌──────────────────────────┐
              │ PaymentStatus: released  │  EscrowStage: released
              └──────────────────────────┘  → seller payout balance
        ─────────────────────────────────────────────
        Dispute branch (from payment_held or delivered):
        dispute opened → EscrowStage: disputed
        (auto-release timer PAUSED; PaymentStatus stays held)
        resolution: refund  → PaymentStatus: refunded
                    release → PaymentStatus: released
                    partial → PaymentStatus: partially_refunded
        Cancel before payment → order `cancelled` (no payment held)
        Payment failure at A9 → PaymentStatus: failed (retryable)
```

**Components used.** Escrow Timeline, Payment Status, Order Card, Order Detail composition (Timeline A10, oldest-first), Alert, Badge, Progress (timer), Confirmation Dialog, Toast, Notification Center, Chat (order thread).

**Behavior spec.**
1. **Single source of truth rendering:** Payment Status and Escrow Timeline read the same order state; no screen may compute its own escrow interpretation. The Escrow Timeline always renders all stages — completed (solid), current (highlighted, `color.primary`), future (muted), so users see the whole road.
2. **Stage copy is persona-specific** (copy tables: see 10). Same state, different framing: at `payment_held`, Buyer sees "Your payment is protected — the seller has been notified to deliver"; Seller sees "Payment secured. Deliver the order to get paid."
3. Delivery: Seller marks delivered with optional proof (files, tracking, links) — proof attaches to the order Timeline. This starts the **auto-release timer** (default 7 days, platform-configurable; exact deadline timestamp displayed, not just a countdown).
4. Buyer approval: primary CTA "Approve & release payment" with Confirmation Dialog stating finality ("This releases {amount} to {seller}. This can't be undone."). Never optimistic; Payment Status flips only on server confirmation.
5. **Auto-release reminders:** Buyer is notified at T-72h and T-24h ("Review your delivery — payment releases automatically on {date}") via A16; the order surfaces a `warning`-tone Alert in the same window. Timer expiry releases automatically and both parties are notified with the reason ("auto-released after approval window").
6. **Dispute pause:** opening a dispute (A12) pauses the timer instantly; the timeline shows a `disputed` node inserted at the pause point, the timer chip renders "Paused — dispute in progress". Resolution either resumes to a terminal state or (rare, seller-remedy agreements) restarts the timer — restart is explicit on the Timeline.
7. **Who sees what / who can act, per stage:**
   - `payment_held`: Buyer sees protection copy + Cancel-request option; Seller sees deliver CTA; Admin sees held funds in Payments.
   - `delivered`: Buyer sees Approve CTA + dispute option + deadline; Seller sees "awaiting buyer approval" + deadline (no release action for sellers, ever); Admin read-only unless disputed.
   - `disputed`: both see dispute surface (A12); escrow CTAs disabled with explanation.
   - `released / refunded / partially_refunded`: terminal receipts for both; Seller sees payout linkage ("in your next payout"); Admin sees the ledger entry.
   - Guests never see escrow internals; amounts are visible only to the transaction's parties and Admin.
8. Money display: always integer-minor-unit-accurate, formatted with currency; fee breakdown (platform fee vs seller net) visible to Seller at every stage.
9. Failure states: payment `failed` → recovery per A9 rule 8; release/refund execution failure shows Payment Status `warning` chip "processing issue — we're on it" and opens an Admin queue item automatically; users are never shown a raw error for money movement.
10. Every transition appends an order event (A10) and fires notifications (A16) to both parties; webhooks `order.paid`, `order.delivered`, `order.released`, `order.refunded`.

**Variations.** Milestone escrow (multi-deliverable orders: each milestone runs its own mini state machine, one Escrow Timeline lane per milestone); services vs goods differ only in delivery-proof affordances; instant-release categories (digital goods with preview) shorten the timer — never remove approval.

**API interaction shape.** State transitions are explicit verbs, all Idempotency-Keyed: `POST /v1/orders/{id}/deliver`, `POST /v1/orders/{id}/approve`, `POST /v1/orders/{id}/cancel`; state reads: `GET /v1/orders/{id}` (embeds `paymentStatus`, `escrowStage`, `autoReleaseAt`, `timerPaused`) + `GET /v1/orders/{id}/escrow-events`. Server owns the timer; clients render `autoReleaseAt`, never compute it.

**Accessibility notes.** The Escrow Timeline is an ordered list with current stage `aria-current="step"`; timer deadline exposed as absolute text; approve dialog focuses the confirmation. See 11.

**Anti-patterns.** Any client-computed escrow state; optimistic release; countdown-only deadlines (always show the date); seller-visible "release now" actions; hiding the dispute branch while the timer runs; different screens disagreeing on the current stage; euphemisms in money copy ("processing" when funds are actually held — see 10).

---

## A14. Review Flow

**Problem.** Reviews drive marketplace trust, but unprompted reviews skew negative, one-sided reviews enable retaliation, and unmoderated reviews invite abuse.

**Solution overview.** Post-completion prompt (only after `released`), both-sides review with simultaneous-reveal, seller public response, and a report → moderation path reusing Approval Flow (A11).

**Anatomy.** Prompt (Toast + order CTA + notification) → Rating (stars) + structured aspects + text → hidden until both submit or window ends → published Review Card → optional seller Response → ⋯ Report.

**Components used.** Review Card, Rating, Textarea, Form Wizard (multi-aspect review), Toast, Alert, Badge, Context Menu (report), Confirmation Dialog, Empty State.

**Behavior spec.**
1. Eligibility: review opens only after escrow reaches a terminal paid state (`released` / `partially_refunded`); one review per side per order; editable for 30 days after submission, locked as soon as the counterparty responds.
2. Prompt: non-blocking — notification + "Leave a review" CTA on the order; at most one reminder (T+3d). Never gate other actions behind reviewing.
3. **Simultaneous reveal:** neither party sees the other's review until both submit or the review window (14d default) closes — stated in the composer ("The seller won't see this until they've reviewed you").
4. Composer: overall Rating (required) + per-aspect ratings (communication, quality, timeliness — product-configured) + free text (min/max lengths shown); draft persists locally until submitted.
5. Response: Seller may publish exactly one public response per review; response is flagged as "Seller response", timestamped, and cannot alter the rating.
6. Report/moderation: any party may report a review (reason vocabulary); reported reviews enter the Admin moderation queue (A11); while pending, the review stays visible with no flag to the public (no weaponized "under review" badges); upheld reports hide the review with an audit trail.
7. Aggregates (Seller Profile rating) recompute server-side; the UI never averages client-side.
8. Empty states: no reviews yet on a profile → first-use Empty State ("No reviews yet — completed orders appear here"); review list paginates.
9. Errors: submit failure preserves the draft; reveal-window logic is server-owned.

**Variations.** Buyer-only review products; verified-purchase-only badges; review invitations with deep links from email.

**API interaction shape.** `POST /v1/orders/{id}/reviews {rating, aspects{}, text}`; `POST /v1/reviews/{id}/response`; `POST /v1/reviews/{id}/report {reasonCode}`; list: `GET /v1/sellers/{id}/reviews?cursor=`.

**Accessibility notes.** Star Rating operable by keyboard with radio semantics; counts and averages exposed as text. See 11.

**Anti-patterns.** Prompting before escrow release; sequential reveal (invites retaliation); editable reviews after a response; deleting reviews without audit; incentivized-review UI ("5 stars = discount").

---

## A15. Messaging Flow

**Problem.** Buyer↔seller communication must be easy enough to prevent off-platform drift, structured enough to attach to transactions, and safe enough to serve as dispute evidence.

**Solution overview.** Conversations are created by rules, not freely: **exactly one conversation per order**, plus pre-sale inquiry conversations per (buyer, listing). System event cards (order paid, delivered, dispute opened) interleave with messages in-thread. Unread state and notifications follow one model.

**Anatomy.**

```
┌ Conversation List ──┬ Chat ─────────────────────────────┐
│ ● Minh — Order #481 │ [system card: Order paid — escrow]│
│   Anna — inquiry    │ Minh: Shipping tomorrow.          │
│                     │ [system card: Marked delivered]   │
│                     │ Anna: Received, checking now.     │
│                     │ [Message…            📎] [Send]   │
└─────────────────────┴───────────────────────────────────┘
```

**Components used.** Chat, Conversation List, Avatar, Badge (unread count, persona), Card (system events), File Upload (attachments), Empty State, Notification Center, Split View.

**Behavior spec.**
1. **Creation rules:** an order conversation is auto-created at order creation (never user-created, never duplicated); a pre-sale inquiry conversation is created on first "Message seller" from a listing, deduplicated per (buyer, listing); inquiry threads link forward to the order thread if a purchase happens ("Continued in Order #481").
2. System event cards render inline at their true timestamp, visually distinct from human messages (neutral card, icon, no avatar), and deep-link to the object (order, dispute).
3. Sending: Enter sends, Shift+Enter newlines (desktop); optimistic append with pending indicator; failed sends mark the bubble `danger` with per-message Retry — never silently drop.
4. Attachments: type/size limits stated; upload Progress per file; images preview inline, files as chips.
5. **Unread model:** a conversation is unread if it has messages after the user's last-read marker; unread count badges: per-conversation (Conversation List) and aggregate (Sidebar/Top Navigation + Notification Center). Opening a conversation marks read at the newest visible message; read state syncs across devices.
6. Notifications: new message → in-app immediately; email only if unread after 10 min grace and per user preference matrix (A16); no notification for the sender's own device echoes.
7. Presence/typing indicators optional per product; delivery receipts are per-message ("Sent ✓"); read receipts only if both sides have them enabled.
8. Retention & evidence: order-thread messages are on the record for dispute arbitration (A12 rule 9) — the thread header states this; users cannot delete individual messages from order threads (edit within 5 min allowed, flagged "edited").
9. Moderation & safety: off-platform-payment solicitation triggers a platform `warning` Alert card in-thread (automated); block/report from the ⋯ Context Menu.
10. Loading/empty/error: history loads newest page first with "Show earlier" cursor; no conversations → first-use Empty State per persona; socket disconnect → Offline State banner with auto-retry, queued outbound messages.

**Variations.** Admin support threads (persona-labelled); group threads for milestone orders (buyer, seller, admin arbiter); mobile: Conversation List and Chat are separate screens (Bottom Navigation).

**API interaction shape.** `GET /v1/conversations?cursor=` · `GET /v1/conversations/{id}/messages?cursor=` · `POST /v1/conversations/{id}/messages {text|attachments}` · `POST /v1/conversations/{id}/read {messageId}`; creation only via domain triggers (`POST /v1/listings/{id}/inquiries`). Real-time via socket/webhook per doc 09.

**Accessibility notes.** New messages announced via polite live region; message list is a log role; composer labelled; unread counts as text. See 11.

**Anti-patterns.** Free-form "new conversation" buttons creating duplicate threads; system events in a separate tab away from the conversation; deletable order-thread history; unread counts that disagree between surfaces; blocking the composer while history loads.

---

## A16. Notifications

**Problem.** Users miss what needs them (dispute deadlines, payments) or drown in noise (every event, every channel) — both destroy trust.

**Solution overview.** One event taxonomy drives an **in-app + email matrix**: every notifiable event type has a default channel mix and user-adjustable preferences; low-urgency events batch into digests; urgent money/dispute events are never digestible-off.

**Anatomy.**

```
🔔(3) → Notification Center panel
┌──────────────────────────────┐
│ [All] [Unread]      [⚙ Prefs]│
│ ● Payment released — #481 2h │
│ ● New message from Anna   5h │
│   Review reminder — #472  1d │
│ [Mark all as read]           │
└──────────────────────────────┘
```

**Components used.** Notification Center, Badge (unread count), Toast (transient in-app), List, Switch (preferences matrix), Settings Layout (prefs page), Empty State.

**Behavior spec.**
1. **Event → channel matrix (defaults; user-editable per row in Settings › Notifications):**

   | Event class | In-app | Email | Digestible |
   |---|---|---|---|
   | Money (paid, released, refunded, payout) | ✔ | ✔ | never |
   | Dispute (opened, response due, resolved) | ✔ | ✔ | never |
   | Escrow timer reminders (T-72h, T-24h) | ✔ | ✔ | never |
   | Order progress (delivered, approved) | ✔ | ✔ | no |
   | Messages (unread > 10 min) | ✔ | ✔ | yes |
   | Reviews (received, response) | ✔ | opt | yes |
   | Moderation results | ✔ | ✔ | no |
   | Marketing/product news | opt | opt | always |

2. Preferences: matrix UI (event class × channel Switches); "never digestible" rows show locked Switches with explanation; changes save per A7 (explicit or instant-with-undo, stated).
3. In-app: Toast for foreground events (auto-dismiss 5s, action button where relevant); everything lands in Notification Center regardless of Toast.
4. Unread model: badge counts unseen items; opening the panel marks *seen* (badge clears), items stay visually unread until clicked; "Mark all as read" available.
5. Every notification deep-links to the exact object state that explains it (order at its stage, dispute at its step).
6. Digest: daily (default) or weekly rollup email of digestible unread events, grouped by class; digest suppressed if the user already saw everything in-app.
7. Deduplication & collapse: repeated events on one object collapse ("3 new messages from Anna"); a newer state supersedes an older pending notification of the same class+object.
8. Quiet hours (user-set) delay non-urgent channels; money/dispute events ignore quiet hours.
9. Loading/empty/error: panel loads latest 20 with cursor; empty → "You're all caught up" cleared-state Empty State; email delivery failures are invisible to users but audit-logged.

**Variations.** Push channel for mobile apps joins the matrix as a third column; Admin operational alerts (Queue Monitor thresholds) use the same machinery with a separate taxonomy; Maintenance Banner is broadcast, not per-user.

**API interaction shape.** `GET /v1/notifications?cursor=&unread=` · `POST /v1/notifications/read-all` · `POST /v1/notifications/{id}/read`; prefs: `GET/PATCH /v1/notification-preferences` (matrix resource). Emitted from webhook-grade events (`order.paid`, `dispute.opened`…).

**Accessibility notes.** Badge count has an accessible label ("3 unread notifications"); Toasts use polite live regions and never contain the only path to an action. See 11.

**Anti-patterns.** Email for every in-app event; digest-only dispute deadlines; notifications that link to a dashboard instead of the object; badge counts that never reconcile; Toast-only critical info.

---

## A17. Empty State

**Problem.** "No data" moments are where products feel broken or abandoned — yet they're also the best teaching and recovery surface. One generic "Nothing here" fails all cases.

**Solution overview.** Four distinct empty situations, each with its own copy shape and CTA (copy tables: see 10): **first-use** (never had data → teach + create), **cleared** (had data, none now → confirm calm), **no-results** (query/filter excludes everything → recover the view), **error** (couldn't load → retry path). The Empty State component renders all four via `kind`.

**Anatomy.** Icon/illustration (optional, muted) → one-line headline → one-line body → primary CTA (and secondary link where useful), centered in the content region, max width `size.container-sm`.

**Components used.** Empty State, Blank State Layout (full-page first-use), Button, Alert (error kind may embed), Skeleton Loader (precedes, never coexists).

**Behavior spec.**
1. **first-use:** explains what will live here + benefit, CTA starts the creating flow ("Create your first listing"). May include 2–3 step mini-checklist on dashboards.
2. **cleared:** neutral confirmation ("Inbox zero. Nicely done.") with low-key CTA back to a useful place; never re-onboards a user who clearly knows the feature.
3. **no-results:** echoes the predicate ("No orders match these filters"), primary CTA clears/loosens filters (A3 rule 5), secondary adjusts search; never suggests creating data as the fix for a filter.
4. **error:** says what failed in plain language, keeps user data/context, primary CTA = Retry, secondary = status/support link; error details collapse behind "Details" (code for support). Repeated failure escalates copy honestly ("Still not working — our team has been notified").
5. Choosing the kind is deterministic: load failed → error; else predicate active → no-results; else lifetime count > 0 → cleared; else first-use. Implementations must receive enough context to decide (lifetime count or `hasEverHadData`).
6. Empty states appear only after loading resolves — Skeleton Loader first, then exactly one of data / empty kind. Never flash empty before data.
7. CTAs respect permissions: a persona who cannot create sees guidance without a dead button (e.g. Buyer on an empty orders list gets "Browse listings").
8. Tone: helpful, brief, no blame, no cutesy error jokes on money surfaces (see 10).

**Variations.** Inline empty (table body region) vs full-page (Blank State Layout); widget-scale empty on dashboards (headline + CTA only); Offline State is its own component, not an Empty State kind.

**API interaction shape.** None of its own — driven by collection responses (`data: []`, `pageInfo`, error envelope) plus a lifetime-count signal (`meta.totalEver` or feature flag) per doc 09.

**Accessibility notes.** Headline is a heading; error kind announced assertively; illustration is decorative (`alt=""`). See 11.

**Anti-patterns.** One generic empty for all four cases; "No results" when the load actually failed; create-CTAs on filtered-empty views; illustration-heavy screens with no action; empty flashing before first data paint.

---

# Part B — Interaction Patterns

## B1. Inline Editing

**Problem.** Leaving a page or opening a form to change one value (a title, a price) breaks flow for power users.

**Solution overview.** Click-to-edit on the value itself: display swaps to the matching input in place, Enter/blur commits, Esc cancels, with conflict-safe writes.

**Components used.** Input / Number Input / Currency Input / Select (matching the field type), Validation Message, Toast, Skeleton Loader.

**Behavior spec.**
1. Affordance: editable values show a hover affordance (pencil icon or background tint) and are focusable; view mode is a button labelled "Edit {field}".
2. Activation: click or Enter swaps to the input pre-filled with the current value, text selected, focus inside.
3. Commit: Enter or blur commits; **Esc cancels and restores the previous value** — always, even after typing.
4. Validation runs before commit; invalid keeps edit mode with a Validation Message; blur with invalid value stays in edit mode (never commits garbage, never silently reverts).
5. Commit shows a subtle pending indicator on the value; optimistic display is allowed per doc 03 (low-risk, reversible) with rollback + Toast on failure. Money/permission fields are never inline-optimistic.
6. Conflict handling: writes send the last-known version (`If-Match`/version field); on `conflict`, show the server value and the user's value, offering "Use theirs / Keep mine" — no silent last-write-wins.
7. One inline edit active at a time per view; activating another commits-or-cancels the first by its own rules.

**Variations.** Multi-line inline (Textarea, Cmd+Enter commits); inline Select commits on choose; table cell editing is Data Grid's specialization of this contract.

**API interaction shape.** `PATCH /v1/{resources}/{id}` with the single changed field + version.

**Accessibility notes.** Edit control has an accessible name including the field; mode switch announced; Esc behavior is mandatory. See 11.

**Anti-patterns.** Blur-commits of invalid values; no Esc path; pencil icons with no keyboard activation; inline editing multi-field entities (use B2/B3); hidden save failures.

---

## B2. Quick Edit

**Problem.** Editing 1–3 related fields (status + note, price + compare-at) is too much for inline, too little for a drawer.

**Solution overview.** A popover form anchored to the trigger with the few fields, explicit Save/Cancel, and drawer escape hatch for anything more.

**Components used.** Quick Actions, Field Group, Input/Select/Switch, Validation Message, Toast.

**Behavior spec.**
1. Scope hard limit: 1–3 fields; needing more is a signal to use Drawer Editing (B3) — include an "Open full editor" link when both exist.
2. Opens from a Quick Actions button or Context Menu item; positions via `z.popover`; mobile renders as a bottom sheet.
3. Explicit Save commits all fields atomically; Cancel/Esc/outside-click discards **after** a dirty check (dirty → confirm discard inline, not a nested dialog).
4. Validation is field-level inside the popover; save failure keeps it open with Inline Error.
5. Focus moves into the first field on open and returns to the trigger on close.
6. Success closes the popover, updates the row in place, fires Toast only when the change isn't visible where the user is looking.

**Variations.** Read-only quick view (no fields, just Description List) shares the shell; bulk quick edit applies one field to a selection via Modal Editing instead.

**API interaction shape.** `PATCH /v1/{resources}/{id}` with changed fields.

**Accessibility notes.** Popover is a labelled dialog, focus-trapped while open; Esc closes per rule 3. See 11.

**Anti-patterns.** Growing past 3 fields; save-on-outside-click; nesting a popover inside a popover; no dirty guard.

---

## B3. Drawer Editing

**Problem.** Editing a list item on a separate page loses list context (scroll, filters, selection); modals are too cramped for real forms.

**Solution overview.** The **default** editing surface for list items: a Right Drawer slides over the list with the full form, keeping the list visible and untouched behind it; dirty guard on close.

**Components used.** Right Drawer, Field Group, all form components, Validation Message, Confirmation Dialog (dirty guard), Toast, Skeleton Loader, Tabs (long forms).

**Behavior spec.**
1. Width: 480–640px desktop (`size.container-sm`-ish), full-screen sheet on mobile; opens `motion.duration-normal` at `z.modal`; background list is inert but visible.
2. Deep-linkable: open drawer state is in the URL (`…?edit={id}`); refresh restores it; close cleans the URL.
3. Content loads with Skeleton Loader inside the drawer; load failure shows an error kind Empty State with Retry inside the drawer.
4. Footer: sticky action bar — primary Save, secondary Cancel; destructive actions live in a ⋯ Context Menu in the header, never next to Save.
5. **Dirty guard:** closing (✕, Esc, scrim click) with unsaved changes → Confirmation Dialog (Keep editing / Discard); Save-and-close is the primary path.
6. Save keeps the drawer open on validation errors (focus first invalid); success closes and updates the list row in place with a brief highlight (`motion.duration-fast`).
7. Prev/next navigation between list items inside the drawer is allowed (↑/↓ affordances); it respects the dirty guard per item.
8. One drawer at a time; a flow needing a second layer uses a Modal on top (max one), never a second drawer.

**Variations.** View-mode drawer with Edit toggle; create-mode drawer (A1 rule 3); wide drawer (~800px) for side-by-side compare, still not Split View.

**API interaction shape.** `GET /v1/{resources}/{id}` on open; `PATCH` on save — same endpoints as page editing; the surface is a UI choice, not an API one.

**Accessibility notes.** Drawer is `role=dialog` with accessible title, focus-trapped; Esc close (with guard); focus returns to the originating row. See 11.

**Anti-patterns.** Drawer stacked on drawer; unsaved-changes silently dropped on scrim click; forms that clearly need a page (Listing Editor) crammed into a drawer; drawer without URL state.

---

## B4. Modal Editing

**Problem.** Some decisions must interrupt: they're blocking, small, and consequential (resolve dispute, change role, confirm payout) — a drawer's "alongside" framing is wrong.

**Solution overview.** Modal Layout for focused, single-purpose decisions when a drawer is insufficient or inappropriate: short form or confirmation with consequence copy, one primary action.

**Components used.** Modal Layout, Confirmation Dialog, Field Group, Alert, Validation Message.

**Behavior spec.**
1. Use a modal only when the task is (a) blocking by nature, (b) ≤ ~6 fields, and (c) completable in one sitting; otherwise use Drawer (B3) or a page.
2. Structure: title states the decision ("Resolve dispute #92"), body carries context + fields, footer has exactly one primary action (verb + object: "Issue refund") + Cancel.
3. Destructive/irreversible modals state the consequence in body copy and may require typed confirmation (A1 rule 6).
4. Esc and Cancel are equivalent; dirty guard applies if fields were touched; scrim click does **not** close consequential modals (explicit dismiss only).
5. Submit disables the primary action with loading state; failure shows Inline Error in the modal; never close on failure.
6. Max one modal above one drawer; never modal-on-modal — a flow that wants it becomes a Wizard (A5).
7. Size: `size.container-sm` default; never full-screen on desktop (that's a page).

**Variations.** Pure Confirmation Dialog (no fields) is the degenerate case; media lightbox and command palette are modal *surfaces* but not Modal Editing.

**API interaction shape.** The verb endpoint of the decision (`POST /v1/disputes/{id}/resolve` etc.), Idempotency-Key when money-affecting.

**Accessibility notes.** `role=dialog`/`alertdialog` for destructive; focus trapped, initial focus on the least-destructive control; Esc per rule 4. See 11.

**Anti-patterns.** Modals for browsing/reference content; multi-step modals; scrim-click closing a refund form; modal chains; "OK" as a primary action label.

---

## B5. Infinite Scroll

**Problem.** Feeds (activity, search discovery, media) read as continuous streams; pagination interrupts them — but infinite scroll destroys orientation and footers when misapplied.

**Solution overview.** Infinite scroll is for **feeds only; tables always use Pagination.** A sentinel element prefetches the next page before the user hits bottom; a "Back to top" affordance and footer-reachability rule keep orientation.

**Components used.** List / Gallery / Media Grid / Activity Feed, Skeleton Loader, Empty State, Floating Action Button ("Back to top"), Alert (load failure row).

**Behavior spec.**
1. Applicability: content consumed by scanning (feeds, galleries, activity). Data worked on (tables, admin lists, anything with Bulk Actions or row comparison) uses Pagination — no exceptions.
2. Sentinel: next page loads when the sentinel enters viewport ~1 viewport-height early; loading appends Skeleton Loader items; scroll position never jumps.
3. Failure appends an inline error row with Retry — the already-loaded feed stays.
4. End of feed is explicit ("You're all caught up" terminator), not silent.
5. "Back to top" Floating Action Button appears after 2 viewports of scroll; activating it also moves focus to the top of the feed.
6. **Footer reachability:** screens with infinite feeds must not carry a load-bearing footer; footer links relocate to Sidebar/menu on those screens, or the feed is capped with "Show more" beyond N pages.
7. State restoration: back navigation restores scroll position and loaded window (cache the cursor pages); deep links use cursors, not scroll offsets.
8. Memory: beyond ~10 pages, virtualize or window the list (B6).

**Variations.** "Load more" button instead of auto-sentinel (user-controlled contexts, SEO pages); reverse infinite scroll for Chat history ("Show earlier", A15 rule 10).

**API interaction shape.** Cursor pagination per README: `GET …?cursor=&limit=` → `{data, pageInfo:{nextCursor,hasMore}}`; never offset math.

**Accessibility notes.** New items announced by count ("20 more items loaded"); sentinel loading invisible to screen readers except via that announcement; keyboard users get the same prefetch. See 11.

**Anti-patterns.** Infinite scroll on admin tables; unreachable footers; scroll hijacking; losing position on back; silent end-of-list; offset pagination behind an infinite UI.

---

## B6. Virtual Lists

**Problem.** Rendering thousands of DOM rows (Admin users table, logs) kills performance; naive virtualization breaks a11y, find-in-page, and selection.

**Solution overview.** Virtual Table / Virtual List renders only the visible window + overscan. Applied when a view regularly exceeds **100 rows**; requires fixed row height and explicit a11y announcements.

**Components used.** Virtual Table, List (virtualized), Skeleton Loader, Data Management Toolbar.

**Behavior spec.**
1. Threshold: virtualize at > 100 rendered rows; below that, render plainly (simplicity wins).
2. **Fixed row height rule:** virtualized rows have a fixed, known height (density mode sets it); variable-height content must be truncated with expansion via drawer/detail, or the view must not virtualize.
3. Scrollbar reflects total count (spacer sizing); jumping to any offset renders that window without loading every intermediate page (windowed fetch by index/cursor hybrid per doc 09).
4. Selection, keyboard navigation (↑/↓, Home/End, PageUp/Down), and Bulk Actions (A4) work identically to non-virtual tables — selection is by ID, not by DOM presence.
5. A11y: container exposes `aria-rowcount`/`aria-rowindex` (or equivalent) so assistive tech knows true position; loading window changes announce "Rows 120–160 of 4,000".
6. Find: browser find-in-page won't work — provide scoped search (A2) and say nothing misleading about Ctrl+F.
7. Loading windows show Skeleton Loader rows sized exactly to row height (no layout shift); scroll during load never blanks previously rendered rows.
8. Row focus is preserved across window recycling (focus follows the data row, not the DOM node).

**Variations.** Virtual Gallery/Media Grid (fixed cell size); log tail mode (pinned to bottom, pauses on scroll-up — System Logs, Queue Monitor).

**API interaction shape.** Windowed reads: cursor pagination with generous `limit`, or indexed window endpoint where doc 09 defines one; total count from `pageInfo` extension.

**Accessibility notes.** Row count/position semantics are mandatory, not optional; without them, don't virtualize. See 11.

**Anti-patterns.** Virtualizing 30 rows; variable-height virtual rows; selection that forgets off-screen rows; scroll-jank from unfixed heights; virtualization breaking Tab order.

---

## B7. Drag and Drop

**Problem.** Reordering (gallery images, dashboard widgets), stage-moving (Kanban), and file upload all want direct manipulation — but drag-only interfaces exclude keyboard and touch-limited users.

**Solution overview.** Three sanctioned uses: **reorder** (lists/grids), **kanban** (cards across columns), **upload** (files onto a dropzone). Every drag interaction ships with a **mandatory keyboard alternative**: grab → move with arrows → drop (see 11).

**Components used.** Kanban Board, Image Gallery Upload, Drag & Drop Upload, File Upload, Widget (dashboard grid), List, Toast.

**Behavior spec.**
1. Affordance: draggables show a grip handle (don't hijack whole-row click); cursor and lifted shadow (`shadow.lg`) during drag; drop targets highlight with `color.primary` outline; invalid targets show not-allowed state.
2. Live preview: reorder shows the insertion gap; kanban shows a placeholder in the target column; the moved item animates into place `motion.duration-fast` (skip under `prefers-reduced-motion`).
3. **Keyboard alternative (MANDATORY):** focus item → Space/Enter grabs (announced "Grabbed X, position 3 of 8") → Arrow keys move (each move announced) → Space/Enter drops, Esc cancels back to origin. Same grammar for kanban (arrows across columns) and any reorder surface. Detail: see 11.
4. Commit semantics: reorder/kanban moves PATCH on drop; failure snaps the item back with a Toast explaining why. Kanban moves that trigger domain transitions (stage change with side effects) confirm via dialog when consequential.
5. Upload dropzone: whole-region target with visible boundary on dragover; also always a "Browse files" button (click path) — drop is an accelerator, never the only way; per-file Progress, per-file errors, retry per file.
6. Scroll-during-drag: edges auto-scroll containers; long lists remain usable.
7. Touch: long-press initiates drag; provide ↑/↓ / "Move to…" Context Menu items as the touch-precision fallback.
8. Multi-drag rides the Bulk Actions selection model (A4): drag one selected item = move the whole selection, count badge on the drag ghost.

**Variations.** Cross-list drag (assign into groups); dashboard Widget grid reorder (snap-to-grid); file-manager-style move where drop target is a Tree node.

**API interaction shape.** `PATCH /v1/{resources}/{id} {position | columnId}` or `POST /v1/{resources}/reorder {orderedIds[]}` per doc 09; uploads `POST /v1/uploads` multipart → attach by reference.

**Accessibility notes.** The keyboard grammar and its live announcements are the contract; drag state must be conveyed to screen readers via live region. See 11.

**Anti-patterns.** Drag as the only path to any outcome; whole-card drag stealing click/selection; dropping with no undo/feedback on failure; kanban stage moves silently firing side effects; dropzones with no browse button.

---

## B8. Keyboard Shortcuts

**Problem.** Professional users live in these products daily; mouse-only operation caps their speed — but ad-hoc shortcuts collide, surprise, and break inputs.

**Solution overview.** One global shortcut map plus per-context conventions, discoverable via a `?` help overlay, with strict rules about when single keys are live.

**Global map (canonical):**

| Keys | Action |
|---|---|
| `Cmd/Ctrl+K` | Open Command Palette (B9) |
| `/` | Focus the primary Search Bar of the current context |
| `?` | Open shortcut help overlay |
| `g` then `d / o / l / m / n` | Navigation chords: go to Dashboard / Orders / Listings / Messages / Notifications |
| `Esc` | Close the topmost layer (tooltip → popover → drawer → modal, one per press) |
| `Cmd/Ctrl+Enter` | Submit the focused composer/form (where defined) |

**Components used.** Command Palette, Search Bar, Modal Layout (help overlay), Tag/Chip (key caps in help), Toast (chord feedback).

**Behavior spec.**
1. **No single-letter shortcuts fire while focus is in an input, textarea, contenteditable, or Select** — only `Esc` and explicitly modifier-based combos work there. This rule is absolute.
2. Chords (`g` + letter): 1.5s window; a subtle chord indicator appears ("g …"); invalid second key cancels silently.
3. `Esc` closes exactly one layer per press, topmost first, honoring dirty guards (B3 rule 5, B4 rule 4). It never navigates away from a page.
4. Per-context conventions: lists use `↑/↓` to move row focus, `Enter` to open, `x` to toggle selection, `e` to edit (drawer); Kanban and drag surfaces follow B7 rule 3; Chat follows A15 rule 3. Contexts may add shortcuts but may never rebind the global map.
5. Discoverability: `?` overlay lists global + current-context shortcuts, grouped, searchable; shortcut hints appear in tooltips and Context Menu items ("Edit ⌘E" style).
6. Platform mapping: Cmd on macOS ≡ Ctrl elsewhere; display the correct symbol per platform.
7. Shortcuts are disabled while a Confirmation Dialog is open except its own keys (Esc, Enter on focused button).
8. Custom rebinding is out of scope v1; products must not ship their own rebinding UIs ahead of the kit.

**Variations.** Admin power surfaces (Data Grid) may add spreadsheet-style keys (documented in their component contract, see 04); embedded contexts (WordPress admin) suppress chords that collide with host shortcuts and note it in the `?` overlay.

**API interaction shape.** None — shortcuts invoke existing UI actions only; anything reachable by shortcut is reachable by visible UI (parity with B10 rule 1).

**Accessibility notes.** Shortcuts complement, never replace, standard keyboard operability (Tab order, arrow patterns); the `?` overlay is itself fully accessible. Single-key handlers must not trap assistive-tech key events. See 11.

**Anti-patterns.** Single letters live inside inputs; overriding browser/OS staples (Cmd+L, Cmd+T); Esc closing multiple layers at once or discarding dirty forms without a guard; undiscoverable shortcuts; context maps that rebind `Cmd+K`.

---

## B9. Command Palette

**Problem.** As products grow, navigation depth and action count outpace menus; expert users want "type what you mean" access to everything.

**Solution overview.** `Cmd/Ctrl+K` opens the Command Palette: one input over a ranked list merging **actions** (from a registry), **navigation**, and **entity search** (A2), scoped by current context, with recent items first.

**Anatomy.**

```
┌─────────────────────────────────────┐
│ > refund…                           │
│ ACTIONS   ▸ Issue refund (order)  ↩ │
│ GO TO     ▸ Payments & Refunds      │
│ ORDERS    ▸ #481 — Anna / refunded  │
└─────────────────────────────────────┘
```

**Components used.** Command Palette, Search Bar (input), List, Tag (group labels), Skeleton Loader, Empty State, Toast.

**Behavior spec.**
1. **Action registry:** every registered command declares id, label, synonyms, required permission, context predicate, and handler. The palette is generated from the registry — no hand-curated menus that drift.
2. Context-aware: commands whose predicate matches the current screen/selection rank first ("Mark delivered" on an Order Detail); commands failing permission checks are hidden (not disabled) — the palette never advertises what a persona can't do.
3. Empty query shows: recent items (last 7 commands/entities), then context suggestions. Recency is per user, per product.
4. Ranking: exact label > prefix > synonym > fuzzy; entity search results (via A2, same 300ms debounce) appear under type-labelled groups after actions.
5. Execution: Enter runs the highlighted item; destructive commands open their normal Confirmation Dialog (the palette is a launcher, not a bypass); commands with parameters chain into a follow-up input step inside the palette (single step max — more becomes a modal/wizard).
6. Result feedback: navigation closes the palette; background actions close + Toast; failures Toast with `danger` tone.
7. Modes: `>` prefix = actions only, `?` prefix = help; plain text = merged (products may add prefixes, never remove these).
8. Loading/empty: entity groups show Skeleton Loader rows while searching; no matches → no-results Empty State with the query echoed ("No commands or results for X").
9. Layering: renders at `z.modal`, closes on Esc/outside click (it holds no dirty state).

**Variations.** Scoped palettes (within Listing Editor, `Cmd+K` scopes to editor commands with a "search everywhere" escape row); mobile surfaces the palette as search-first full-screen sheet.

**API interaction shape.** Actions run their existing endpoints; entity rows come from `GET /v1/search`. The registry itself is client-side composition — no palette-specific API.

**Accessibility notes.** Combobox + listbox semantics as A2; group labels announced; executing announces outcome. See 11.

**Anti-patterns.** Palette-only features (violates parity, B10 rule 1); showing permission-denied commands; multi-step forms inside the palette; a second, different "quick switcher" beside it; stale hand-registered commands.

---

## B10. Context Menu

**Problem.** Per-item actions clutter rows as buttons, but hiding them behind right-click alone makes them undiscoverable and untouchable (literally, on touch devices).

**Solution overview.** Right-click and the visible overflow **⋯** button open the *same* menu with the same items — strict parity — and everything in the menu is also reachable via visible UI somewhere (menu = accelerator, never sole home).

**Components used.** Context Menu, Quick Actions, Confirmation Dialog, Toast, Badge (item annotations), Tag (shortcut hints).

**Behavior spec.**
1. **Parity rule:** every Context Menu item must have a visible-UI equivalent (row button, detail-page action, toolbar). The menu may never be the only path — this is testable and reviewed.
2. Triggers: right-click on the item region; ⋯ overflow button (always visible on touch, hover-revealed allowed on desktop but focus-revealed too); `Shift+F10` / Menu key from keyboard focus.
3. Content: max ~8 items, verb-first labels, grouped by separator (primary verbs / secondary / destructive last); destructive items in `color.danger` and always followed by their Confirmation Dialog; disabled items stay visible with a reason tooltip.
4. Item set adapts to the object state and persona permissions (hide what's impossible, disable-with-reason what's temporarily blocked — the inverse of B9 rule 2, because context is already established here).
5. Submenus: one level max; more = open a dialog/drawer.
6. Positioning: at pointer for right-click, anchored for ⋯; flips to stay in viewport; `z.dropdown`; long menus scroll internally.
7. Keyboard: arrows navigate, Enter activates, Esc closes and returns focus to the trigger; typeahead by first letter.
8. Multi-select: with an active selection (A4), the menu shows bulk-applicable actions with count ("Archive 12"); mixed-validity follows A4 rule 3.
9. On touch: long-press opens the same menu (sheet-style on mobile); never rely on hover.

**Variations.** Browser-native contexts (text inputs, links) are not overridden — Flexa menus only claim item/canvas regions; table header context menu for column controls (Data Grid).

**API interaction shape.** None of its own — items invoke the same endpoints as their visible-UI equivalents.

**Accessibility notes.** `role=menu`/`menuitem` semantics, focus management on open/close, Menu-key support; shortcut hints exposed as text. See 11.

**Anti-patterns.** Right-click-only actions; menu items missing from visible UI (parity violation); destructive item adjacent to a common item with no separator; hover-only ⋯ buttons; two-level-deep submenus; different item sets for right-click vs ⋯.

---

# Appendix — Pattern → primary consumers map

| Pattern | Primary screens (see 08) / flows (see 07) |
|---|---|
| CRUD | Listings, Users, Categories & Attributes, Saved addresses |
| Search / Filtering | Search Results, all list screens, Admin queues |
| Bulk Actions | Listings Moderation, Orders (Admin), Users |
| Wizard | Seller Onboarding, Listing Editor (create), Checkout |
| Dashboard | Buyer/Seller/Admin Dashboards |
| Settings | Account Settings, Store Settings, System Settings |
| Authentication | Sign In/Up, Forgot Password, Email Verification |
| Checkout / Escrow Flow | Checkout, Order Detail (Escrow Timeline) |
| Timeline | Order Detail, Dispute Detail, Audit Log |
| Approval Flow | Listings Moderation, AI review surfaces, Payout approval |
| Dispute Flow | Disputes Queue, Dispute Detail |
| Review Flow | Reviews (write/manage/respond), Seller Profile |
| Messaging Flow | Messages, Order Detail thread |
| Notifications | Notification Center, Settings › Notifications |
| Empty State | every list, dashboard widget, and error surface |
| Interaction patterns (B1–B10) | cross-cutting; component contracts in 04 bind them per component |
