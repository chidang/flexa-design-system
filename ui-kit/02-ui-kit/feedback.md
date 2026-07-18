# 02 — UI Kit · Feedback

> Design-facing catalog for the 10 feedback components. Props/events/ARIA in 04; live-region and focus contracts in 11; message wording in 10; timing thresholds (when to show spinners, how long is "slow") in 03. Tokens by FDS id only (see 01).

## Design rationale

Feedback is a contract: every user action gets an acknowledgment proportionate to its weight, in a channel matched to its scope. The Flexa doctrine assigns each message exactly one home — **field-scoped** feedback lives at the field (Validation Message, see `forms.md`), **region-scoped** in the region (Inline Error, Alert), **action-result** in a Toast, **decision-required** in a Confirmation Dialog, **page-scoped** on a full page (Error/Success Page), **environment-scoped** in a banner (Warning/Maintenance/Offline). Choosing the channel *is* the design decision; a message in the wrong channel is a bug — a validation error in a Toast disappears while the broken field sits unmarked; a routine save on a Success Page inflates ceremony until users stop reading.

Severity is a ladder — `info < success < warning < danger` — and every rung is paired icon + text + tone, **never color alone** (see 11). When in doubt, understate: `danger` is reserved for loss of data, money, or access. Severity inflation is the fastest way to train users to ignore the one alert that matters.

### Tone → token mapping (all feedback components)

| Tone | Surface treatment (soft, default) | Solid treatment (high alert only) | Icon color |
|---|---|---|---|
| neutral | `color.surface` + `border.1 color.border` | — | `color.text-muted` |
| info | `color.info` tint on surface | `color.info` bg + `color.on-info` text | `color.info` |
| success | `color.success` tint | `color.success` + `color.on-success` | `color.success` |
| warning | `color.warning` tint | `color.warning` + `color.on-warning` | `color.warning` |
| danger | `color.danger` tint | `color.danger` + `color.on-danger` | `color.danger` |

Soft is the default everywhere; solid is reserved for `danger` Toasts and the rare critical banner. Tinted surfaces are derived within FDS pairs — never invent new combinations outside the contrast-gated set (see 01 § hard rules).

## Component hierarchy & channel decision

```
Scope of the message                      → Component
├── one field / group                     → Validation Message (forms.md)
├── a region / form top / list section    → Alert · Inline Error
├── result of a completed action          → Toast (transient)
├── a decision blocking an action         → Confirmation Dialog
├── a region or screen busy               → Loading Overlay (last resort)
├── a whole route / navigation dead-end   → Error Page · Success Page
└── the whole environment / session       → Warning Banner · Maintenance Banner · Offline State
```

Second axis — **persistence**: transient (Toast) · condition-bound (banners, error summaries — clear when the condition clears) · user-dismissed (advisory Alerts) · flow-bound (dialogs, pages). A message's persistence must match its truth: a condition the user dismissed but that still holds will resurface consequences with no warning attached.

---

## Toast

- **Purpose.** Transient, non-blocking confirmation or notice about a completed (or failed) action: "Listing published", "Copied", "Couldn't save — Retry".
- **Use when** the user acted, the action finished, and the evidence is *not* fully visible in place; also for background results (export ready, sync finished) and undo windows after cheap-to-reverse destructive actions.
- **Not when** the user must decide (Confirmation Dialog), the error belongs to a field/form (Validation Message / Alert error summary), the state is ongoing (banner), or the content must be re-readable later (Notification Center — collaboration section of 02; a toast may *mirror* a notification, never replace it).

### Toast doctrine (binding)

1. **Position: top-right on Desktop/Tablet · top full-width on Mobile.** One position product-wide, ever. Top-right keeps clear of bottom action bars, FABs, and Mobile keyboards; top placement on Mobile survives the on-screen keyboard. No component, screen, or plugin may relocate toasts.
2. **Auto-dismiss: 5s** for `info/success/neutral`. Timer pauses on hover and on keyboard focus, resumes on leave. Duration extends (never shortens) for longer text — reading-time rules in 03.
3. **Errors persist until dismissed.** `danger` toasts get an explicit ✕ and no auto-dismiss — an error the user never saw didn't happen. `warning` toasts default to 8s and may persist when they carry an action.
4. **Max 1 action button** ("Undo", "Retry", "View") — `ghost` style inside the toast. Anything needing two choices is a dialog, not a toast. The action must remain valid for the toast's whole lifetime.
5. **Queue max 3** visible, stacked newest-on-top with `space.2` gaps; further toasts wait in queue (FIFO); identical repeats collapse into one with a counter ("Copied ×3"). A danger toast entering a full stack evicts the oldest non-danger toast.
6. Announced via live region — politeness levels (`polite` for info/success, `assertive` for danger) and the full contract in 11. Toasts never take focus.

### Anatomy

```
┌──────────────────────────────────────────┐
│ ✓  Listing published            [View] ✕ │   ← icon (tone) · text · action (≤1) · dismiss
└──────────────────────────────────────────┘
┌──────────────────────────────────────────┐
│ ⬆  Exporting orders… ▓▓▓▓▓▓░░░░ 60%    ✕ │   ← progress variant (background job)
└──────────────────────────────────────────┘
```

- **Variants.** Tones `neutral | info | success | warning | danger` on soft surface (`color.surface`, `shadow.lg`, leading tone icon) — solid (`color.danger` + `color.on-danger`) reserved for danger. With action; with progress (determinate Progress inside for multi-step background jobs); undo toast (success tone + "Undo" action, window stated where non-obvious, per 10).
- **Properties (design-level).** Width 360px Desktop (exact contract in 04), text `text.body-sm`, `radius.lg`, padding `space.3` `space.4`; enter slide+fade from the top edge `motion.duration-normal` `motion.easing-out`, exit fade `motion.duration-fast`; reduced-motion: fade only, no translate. Layer above modal scrims (a toast may confirm a modal's action — exact layer table in 04). Dismiss ✕ hit area ≥ 24px visual / 44px effective on touch.
- **States.**

| State | Treatment |
|---|---|
| entering | slide+fade in; queue shifts down |
| visible | timer running (auto-dismiss tones) |
| hover/focus | timer paused; ✕ emphasized |
| action-running | action button shows its loading state; toast persists until result |
| exiting | fade out; stack collapses `motion.duration-fast` |

- **Responsive.** Mobile: full-width strip below the status bar/safe area, max 2 stacked, swipe-up dismisses; action stays inline right.
- **Best practices.** Verb-first past-tense copy ("Listing published" — see 10); prefer act-immediately + Undo toast over pre-confirmation for cheap reversals; when a toast reports on an off-screen object, include the "View" action; never put the *only* record of important information in a toast.
- **Common mistakes.** Toasting validation errors; success toast + success Alert + inline highlight for the same save (pick one channel); auto-dismissing errors; toast novels (wraps past 3 lines → wrong channel); toasts stealing focus; per-feature toast positions.

## Alert

- **Purpose.** Persistent inline callout bound to a region: form error summary, contextual notice, degraded-feature warning inside a panel.
- **Use when** the message concerns the content it sits above/within and must remain readable while the user works. The form-top **error summary** required by the validation doctrine (see `forms.md`) is an Alert `danger`.
- **Not when** transient action feedback (Toast), a single field (Validation Message), or app-wide conditions (banners). An Alert inside a Card comments on that card; an app-wide condition in an Alert gets scrolled away.
- **Variants.** Tones `info | success | warning | danger`, soft tinted surface + tone icon + leading `border.2` tone bar (or full `border.1` tinted edge — one style per product). Title + body; body-only; with actions (max 2, `ghost`, inline links or right-aligned); dismissible (✕ — advisory content only; condition-bound alerts like error summaries are not dismissible, they clear when the condition clears).

### Anatomy

```
┌▌─────────────────────────────────────────────────┐
│▌ ⚠  Payouts are paused                            │  ← title, text.body semibold
│▌    Verify your bank account to resume payouts.   │  ← body, text.body-sm
│▌    [Verify account]  [Learn more]                │  ← ≤2 actions
└▌─────────────────────────────────────────────────┘
 ▌= border.2 tone bar

Error summary specialization (form top):
┌▌─────────────────────────────────────────────────┐
│▌ ✕  Fix 3 errors to continue                      │
│▌    • Price — enter an amount of at least $1      │  ← each row focuses its field
│▌    • Photos — add at least 1 photo               │
│▌    • Category — select a category                │
└▌─────────────────────────────────────────────────┘
```

- **Properties.** `radius.md`, padding `space.4`, icon top-aligned to the first text line, `space.3` gap; error-summary rows are links that move focus to the field (contract in 11); summary appears above the form's first field and receives focus after a failed submit.
- **States.** static per tone · entering (fade `motion.duration-fast` when appearing in response to an event) · updating (error summary re-renders as errors clear; removes itself at zero) · dismissed (removed; "don't show again" persistence per 03 § preference persistence).
- **Responsive.** Full width of its container at all ranges; actions wrap below the body on Mobile; the tone bar stays.
- **Best practices.** Place directly above the content it modifies; one Alert per region — merge messages rather than stacking three; keep dismissible advisory alerts rare and their dismissal remembered (re-showing a dismissed tip every sign-in trains banner-blindness).
- **Common mistakes.** Alert walls at page top disconnected from context; `danger` for mild notices; dismissible error summaries; alerts styled so close to cards they read as content; icon-only alerts.

## Confirmation Dialog

- **Purpose.** Modal interruption demanding an explicit decision before a consequential action proceeds.
- **Use when** the action is destructive, irreversible, costly, or affects other people/money: delete listing, cancel order, issue refund, revoke access, leave-with-unsaved-changes (dirty-state guard, see 03 § save models).
- **Not when** the action is cheap and reversible — prefer act-immediately + Undo Toast; not for information (Alert/Toast); not for complex input (that is a form in Modal Layout — see layouts file — not a confirmation).

### Choosing the protection level

| Action profile | Protection |
|---|---|
| Reversible in one step (archive, remove tag) | No dialog — act + Undo Toast |
| Destructive, recoverable with effort (delete draft) | Standard confirm, `danger` button |
| Destructive, irreversible, scoped (delete listing + its reviews) | Confirm + consequence body, `danger` |
| Irreversible, high blast radius (delete org, wipe data, mass refund) | **Type-to-confirm** |

### Rules (binding)

- **Destructive = `danger` confirm button + explicit noun in the title.** "Delete 'Vintage lamp'?" — never "Are you sure?". The confirm button repeats the verb: **Delete listing**, never "OK"/"Yes"/"Confirm" (wording per 10). Cancel is `ghost`/`secondary` and is the safe default.
- **Type-to-confirm for irreversible, high-blast-radius actions:** an Input requiring the resource name (or a stated keyword); confirm stays disabled until the text matches exactly. Reserve for the truly irreversible — friction inflation breeds copy-paste reflexes that defeat the guard.
- Body states the **consequence**, not a re-question: what is lost, whom it affects, whether it can be undone ("This removes the listing and its 12 reviews. This can't be undone.").
- Initial focus lands on the **safe** action for destructive dialogs (Cancel), on confirm for benign ones; Esc = cancel; backdrop click cancels benign dialogs and does nothing on destructive/type-to-confirm ones; focus is trapped and returns to the trigger on close (full contract in 11).

```
┌────────────────────────────────────────────┐
│ Delete "Vintage lamp"?                     │  ← text.heading-md, explicit noun
│                                            │
│ This removes the listing and its 12        │
│ reviews. This can't be undone.             │  ← consequence, text.body
│                                            │
│ Type the listing name to confirm:          │
│ [                                        ] │  ← type-to-confirm (irreversible only)
│                                            │
│                 [Cancel]  [Delete listing] │  ← ghost · danger (disabled until match)
└────────────────────────────────────────────┘
```

- **Variants.** Standard (title/body/2 buttons) · destructive (`danger` confirm) · type-to-confirm · with consequence detail (short count/list of affected records — "14 listings, 3 with open orders"; a full manifest belongs in a review step, not a dialog) · with one bundled sub-decision max (Checkbox: "Also cancel pending orders").
- **Properties.** Width ≤ 440px; backdrop `color.scrim`; `z.modal`; enter scale(0.96→1)+fade `motion.duration-normal`, exit fade `motion.duration-fast`, reduced-motion: fade only; buttons right-aligned (LTR), confirm outermost; title `text.heading-md`, body `text.body`.
- **States.**

| State | Treatment |
|---|---|
| open | focus per rules above |
| confirm-loading | confirm button spinner + both buttons disabled; dialog stays until result |
| success | dialog closes; result confirmed by Toast or visible change |
| failure | dialog **stays open**, inline Alert `danger` above the buttons, confirm re-enabled — retry in place |
| type-mismatch | confirm disabled; no error styling while typing (it's a gate, not a validation) |

- **Responsive.** Centered dialog Desktop/Tablet; Mobile: bottom sheet, full-width stacked buttons, confirm on top, safe-area padding.
- **Best practices.** Ask once — never chain two confirmations; count the objects in bulk operations ("Delete 14 listings?"); if a frequent action keeps hitting a dialog, redesign toward undo; keep body ≤ 2 sentences.
- **Common mistakes.** "Are you sure?" titles; Yes/No buttons; `danger` styling on benign confirms; closing destructive dialogs on backdrop click; performing the action optimistically behind the still-open dialog; burying the consequence in a third paragraph nobody reads.

## Loading Overlay

- **Purpose.** Scrim + indicator covering a region (or, rarely, the screen) while its content is unusable during an operation.
- **Use when** an in-place operation invalidates an entire region and interaction meanwhile would corrupt state: applying a bulk action to a table, recalculating a checkout total, submitting a Modal Layout form.
- **Not when — the default answer.** **Avoid full-screen overlays when a local spinner suffices.** Escalate only as far as truth requires:

| Ladder step | Treatment | Typical case |
|---|---|---|
| 1. Button-level | spinner in the acting Button, page alive | almost every submit |
| 2. Component-level | Table stale-content refetch, Skeleton Loader on first load (see `data-display.md`) | fetches |
| 3. Region overlay | scrim + spinner over one container | bulk apply, recalc |
| 4. Full-screen | `z.modal` scrim + spinner + label | auth transition, app-critical write — needs a documented justification in 08 |

  Never for initial content loads (skeletons own that — see `data-display.md` § Skeleton Loader).
- **Variants.** Region overlay (positioned over its container: `color.scrim` at reduced strength, centered spinner + one-line label) · full-screen · with progress (determinate Progress + % the moment a % is knowable) · with cancel (operations longer than a few seconds must offer Cancel where the backend supports abort — thresholds in 03).

```
┌ Orders ──────────────────────────────────┐
│ ░░░░░░░░░░░░░░░ scrim ░░░░░░░░░░░░░░░░░░ │
│ ░░░░░░░░   ◌  Applying to 14 items… ░░░░ │   ← spinner + label, centered
│ ░░░░░░░░░░░░░░░░░ [Cancel] ░░░░░░░░░░░░░ │   ← when abortable
└──────────────────────────────────────────┘
```

- **Properties.** Spinner `color.primary`; label `text.body-sm` states what is happening ("Applying to 14 items…" — see 10); **show-delay and minimum-visible-duration are owned by 03 § perceived performance** (never flash an overlay for a fast op; once shown, hold it long enough not to strobe); blocks pointer/keyboard/scroll of the covered region only — surrounding UI stays interactive (focus handling in 11).
- **States.** hidden (sub-threshold) · visible-indeterminate · visible-determinate · long-running (past the slow threshold in 03: add reassurance copy, or convert to a background job + progress Toast) · error (overlay is removed; the error surfaces in the region's own channel — Alert or dialog — never *on* the overlay) · success (overlay lifts `motion.duration-fast`; the result is its own feedback) · canceled (overlay lifts; region returns to prior state + neutral Toast "Canceled").
- **Responsive.** Region overlays cover exactly their region at all ranges; full-screen respects Mobile safe areas; spinner size steps down with region size.
- **Best practices.** Scope as tightly as truth allows — if the sidebar still works, don't cover it; anything expected >10s becomes a background job with notify-on-complete rather than any overlay (pattern in 03/05); one overlay at a time per region.
- **Common mistakes.** Full-screen scrim for a 300ms save; overlay with no label; spinner flicker on fast ops; uncancelable multi-minute overlays; overlay left behind after an error; two stacked overlays fighting.

## Inline Error

- **Purpose.** Contextual failure notice rendered *in the place the content failed to appear or the action failed to apply* — the region-scoped error primitive (an Alert `danger` specialization plus placement doctrine).
- **Use when** a panel/widget/section fails to load, a row-level operation fails, or a retryable fetch breaks inside an otherwise healthy screen.
- **Not when** a field fails validation (Validation Message), the entire route fails (Error Page), or the failure is transient action feedback with the content intact (danger Toast).
- **Variants.** Region replacement (icon + one-line title + optional detail + **Retry**, centered in the failed container — the widget-frame error in `data-display.md` § Widget is this) · compact strip (list/table section failure: one line + Retry link) · row-level (leading `color.danger` icon + short reason on the affected row, e.g. after a partial bulk-action failure).

```
┌ Payouts ─────────────────────────────┐
│              ⚠                       │
│      Couldn't load payouts          │   ← impact, not internals
│   Check your connection and retry.  │
│            [Retry]                  │   ← retries only this unit
│         Details ▸                   │   ← collapsed: error/correlation id
└──────────────────────────────────────┘
```

- **Properties.** Icon `color.danger`; title states impact ("Couldn't load payouts"), never a raw status code — codes live behind the collapsed "Details" affordance for support (wording per 10); **Retry is present whenever retrying can help** and re-runs only the failed unit; after N failed retries escalate copy and suggest support (N owned by 03); the failure never removes surrounding chrome (headers, toolbars stay for orientation).
- **States.** visible · retrying (Retry button loading; region otherwise unchanged) · escalated (post-N copy + support link) · resolved (error swaps for content, fade `motion.duration-fast`).
- **Responsive.** Fills its failed container at all ranges; row-level reasons wrap under the row's primary text on Mobile.
- **Best practices.** Contain the blast radius — one failed widget must never blank its siblings; distinguish load-failure (this component) from absence (Empty State) religiously; log the correlation id behind "Details" and make it copyable.
- **Common mistakes.** Empty State shown for a *failed* load (lying about absence — see `data-display.md` § Empty State doctrine); whole-page error for one dead panel; "Error: undefined"; Retry that reloads the entire app; error text in `color.danger` on a `color.danger` tint without the paired contrast check.

## Error Page

- **Purpose.** Full-route replacement when the requested screen cannot render at all: bad URL, forbidden resource, server failure, planned lockout, no connectivity on cold navigation.
- **Use when** navigation dead-ends — nothing meaningful from the intended screen can be shown.
- **Not when** any part of the screen is salvageable (Inline Error inside the layout) or the condition is a temporary environment state with the app alive (banners / Offline State).
- **Layout.** Rendered inside App Shell chrome when the shell is healthy (403/404 — navigation must survive so the user can leave); bare Blank State Layout when nothing can be trusted (500, maintenance lockout, cold offline). Structure = Empty State anatomy at page scale: restrained status glyph/code (`color.text-subtle`) + title + one-sentence body + recovery actions (1 primary + ≤2 secondary).

### Catalog

| Page | Shell | Title intent (wording in 10) | Recovery actions | Notes |
|---|---|---|---|---|
| **403 Forbidden** | in-shell | "You don't have access to this page" | Request access (primary, where a flow exists) · Back · Switch account | For private resources whose *existence* is sensitive, return 404 instead — decision table in 09/06 |
| **404 Not Found** | in-shell | "We can't find that page" | Go to Dashboard (primary) · Search · Back | If the id looks like a deleted record, say so ("This listing was removed") |
| **500 Server error** | bare | "Something went wrong on our end" | Retry (primary) · Go to Dashboard · Status page | Copyable error/correlation id line; own the fault, never blame input |
| **Maintenance** | bare | "We'll be right back" | Status page (primary) | Expected-back time with timezone; pairs with Maintenance Banner pre-window |
| **Offline** | bare | "You're offline" | Retry (primary) | States what still works; hands over to Offline State once the shell loads |

```
┌───────────────────────────────────────────────┐
│ [App Shell top nav — alive for 403/404]       │
│                                               │
│                   404                         │  ← glyph/code, color.text-subtle
│         We can't find that page               │  ← text.heading-lg
│    It may have been moved or deleted.         │  ← one sentence, text.body
│                                               │
│      [Go to Dashboard]   [Search]             │  ← primary + ≤2 secondary
│                                               │
│  500 variant appends:                         │
│  Error id: 8f3c-22a1 (Copy) · Status page     │
└───────────────────────────────────────────────┘
```

- **States.** Static per code; 500's Retry shows button-loading, then either navigates or re-renders with escalated copy (second consecutive failure: "Still having trouble — check the status page"). Maintenance auto-retries on window end where the client can know it.
- **Responsive.** Centered content, max ~48ch; actions stack full-width on Mobile; glyph scales down before text does.
- **Best practices.** Never dead-end without at least one working exit; keep tone calm and ownership honest — no jokes on 500 when money is involved (see 10); make the error id one tap to copy (support tickets live on it).
- **Common mistakes.** Blaming the user; bare-layout 404 that strands navigation; giant illustration dwarfing recovery actions; raw stack traces; a Retry that re-submits a payment (idempotency rules in 09).

## Success Page

- **Purpose.** Full-page confirmation closing a major flow: order placed, onboarding complete, payout configured.
- **Use when** a multi-step or high-stakes flow ends and the user needs closure plus clear next steps — checkout confirmation, Form Wizard completion (see 05 § Checkout / Wizard).
- **Not when** the action was routine (Toast) or the user stays in working context (inline success Alert). Page-level success is earned by flow weight; sprinkled everywhere it becomes noise users click through blind.
- **Variants.** Standard (success glyph `color.success` + title + summary + next actions) · with receipt/summary block (Description List of the created record: order number, amount, ETA — see `data-display.md`) · with progress-into-next (Progress Summary teaser: "Next: add your first product") · with share/secondary path (public listing link + Copy).

```
┌───────────────────────────────────────────────┐
│                    ✓                          │  ← color.success glyph, restrained
│        Order #1042 confirmed                  │
│   We emailed a receipt to jane@acme.com.      │
│                                               │
│  ┌ Summary ────────────────────────────────┐  │
│  │ Items         3                         │  │  ← Description List
│  │ Total         $96.50                    │  │
│  │ Arriving      Thu, Jul 16               │  │
│  │ Order id      ORD-1042  (Copy)          │  │
│  └─────────────────────────────────────────┘  │
│                                               │
│     [View order]      [Continue shopping]     │  ← 1 primary + ≤2 secondary
└───────────────────────────────────────────────┘
```

- **Properties.** One primary next action + ≤2 secondary; reference identifiers copyable and also delivered out-of-band (email) where they matter; celebratory motion at most one pass of `motion.duration-slow`, honoring reduced motion; title answers *what happened*, body *what happens next*.
- **States.** default · summary-loading (page renders immediately, skeleton in the summary block — never a blank wait after a payment) · partial-success (order placed but receipt email failed → success page + inline `warning` Alert; partial success is still success, never downgraded to an error page).
- **Responsive.** Centered, max ~48ch text; summary card full-width; actions stack full-width on Mobile with primary on top.
- **Best practices.** The primary action continues the *user's* journey, not the product's funnel; state the concrete next event with a time where one exists ("arriving Thu"); keep the page reachable afterwards (order detail carries the same facts).
- **Common mistakes.** Success page for saving a setting; dead-end with no next action; upsell wall before the confirmation details; reference numbers that are neither copyable nor emailed; confetti storms that ignore `prefers-reduced-motion`.

## Warning Banner

- **Purpose.** Persistent environment/account-level caution strip at the top of the app: payment method failing, plan limit approaching, degraded third-party service, expiring credential.
- **Use when** a *condition* (not an event) affects the whole session and needs awareness or action before it worsens.
- **Not when** scoped to one region (Alert), a one-time event (Toast), or marketing (promo surfaces are a product concern, never this component).
- **Variants.** Tones `warning` (default) · `info` (advisory: upcoming change) · `danger` (critical: payment suspended — at most one danger banner ever). With one action ("Update payment method") · dismissible (advisory only; condition-bound banners clear only when the condition clears) · with countdown ("Trial ends in 3 days").

```
┌────────────────────────────────────────────────────────────────┐
│ ⚠ Your payment method expires soon.   [Update payment method] ✕│  ← one line, one action
└────────────────────────────────────────────────────────────────┘
│ [Top Navigation]                                               │
```

- **Properties.** Full-width strip above (or directly below — one slot per product) Top Navigation, `z.sticky`; soft tone background + tone icon + `text.body-sm`; one line preferred — truncate with a "Details" link over wrapping; **max 2 banners stacked**, most severe first; a third pending banner collapses the stack to the most severe + "View all notices".
- **States.** visible · action-loading (banner button spinner) · dismissed (advisory; dismissal persistence per 03) · resolved (slides away `motion.duration-normal` when the condition clears) · escalated (a warning whose deadline nears may re-render as `danger`; this overrides any prior dismissal).
- **Responsive.** Full-width at all ranges; the action may wrap to a second line on Mobile; never overlaps the Bottom Navigation; countdown shortens to compact form ("3d").
- **Best practices.** Every banner names its resolution path; re-evaluate the condition on each load — stale banners train blindness; reserve `danger` for "money or access is breaking now"; log banner impressions vs. action-taken to catch blindness (measurement note in 03).
- **Common mistakes.** Banner as a marketing channel; permanent un-dismissable nags for minor issues; dismissible critical warnings; three banners stacked like sediment; banner actions that open a page which doesn't resolve the condition.

## Maintenance Banner

- **Purpose.** Scheduled-downtime notice: forewarn (pre-window) and inform (in-window) about planned maintenance.
- **Use when** maintenance is scheduled that will interrupt or degrade service; show from a reasonable lead time before the window (lead-time guidance in 03).
- **Not when** unplanned outage (Warning Banner `danger` or Error Page 500) or the work is invisible to users — then say nothing.
- **Variants.** Pre-window (`info`: "Scheduled maintenance Sun 02:00–03:00 UTC — [Details]", dismissible per occurrence) · imminent (`warning`, final hours — overrides earlier dismissal) · in-window degraded (`warning`: "Maintenance in progress — payouts paused until 03:00 UTC", not dismissible while active) · full lockout → route to the Maintenance **page** (see Error Page catalog); the banner covers partial availability only.
- **Properties.** Inherits the Warning Banner frame; always states the **time window in the user's local time with the zone label** (formatting per 10) and **what is affected** — and, where meaningful, what keeps working; countdown flips to "in progress" automatically at window start; complete → banner clears itself (optional one-time "Maintenance complete" info Toast).
- **States.** upcoming (info) · imminent (warning) · active (warning, locked) · complete (removed).
- **Responsive.** As Warning Banner.
- **Best practices.** Pair with status-page links on API/webhook products (integrators need machine-readable notice too — see 09 § webhooks); scope the message to affected features rather than blanket doom ("payouts paused", not "the app will be down") when true.
- **Common mistakes.** Ambiguous times ("tonight", no timezone); banner lingering after maintenance ends; the first notice appearing mid-window; using it for unplanned incidents (dishonest framing users learn to distrust).

## Offline State

- **Purpose.** Detect and communicate lost connectivity, protect unsaved work, and recover gracefully — a system state with two faces: a banner (app still browsable) and a region/page state (content unreachable).
- **Use when** the client loses network or the API is unreachable while the shell is already loaded.
- **Not when** a single request failed on a healthy connection (Inline Error / danger Toast) or the *server* is down for maintenance (Maintenance Banner/page — be honest about whose side the problem is on).
- **Variants.** Offline banner (`warning` or neutral strip: "You're offline — changes will sync when you reconnect" where queueing exists, else "You're offline — some features are unavailable") · region offline (unloadable views render an offline block: cloud-off glyph + "You're offline" + Retry — Empty State anatomy, offline semantics) · full offline page (cold navigation while offline — see Error Page catalog) · reconnected (`success` Toast "Back online", auto-dismiss; banner slides away).

```
┌────────────────────────────────────────────────────────────┐
│ ☁⃠ You're offline — changes will sync when you reconnect.  │  ← banner, z.sticky
├────────────────────────────────────────────────────────────┤
│ …app remains browsable; cached views render…               │
│                                                            │
│  Listing editor:   Title [ Vintage lamp      ]             │
│                    [ Save ]  ⏳ Pending sync                │  ← per-item queued marker
└────────────────────────────────────────────────────────────┘
```

- **Properties.** Detection = connectivity events corroborated by failed requests (a request heartbeat, not the browser flag alone — contract in 04); actions while offline either **disable clearly** or **queue with visible per-item pending markers** (Badge `warning` "Pending sync") — the policy is chosen per product and documented in 08; input is never silently dropped; drafts persist locally where the product supports it (see 03 § save models).
- **States.**

| State | Treatment |
|---|---|
| online | nothing rendered |
| offline | banner appears; affected regions degrade to their offline block; queued items marked |
| reconnecting | banner: "Reconnecting…" + spinner; retry backoff per 03 |
| restored | success Toast; queued changes sync with per-item results — failures surface as persistent danger Toasts or a sync-report Alert, never silently |
| conflict | a queued change collides with server state → resolution surface (pattern in 05); never auto-overwrite either side silently |

- **Responsive.** Banner as Warning Banner; Mobile is the primary offline audience — verify coexistence with Bottom Navigation and the keyboard; Retry targets ≥ 44px.
- **Best practices.** Preserve everything typed — offline must never eat a form; make pending state visible *per item*, not only globally; distinguish "you're offline" from "we're down" honestly; test the tunnel scenario (30s dropout) — it should produce one banner and zero data loss, not a toast storm.
- **Common mistakes.** Infinite silent spinners while offline; panic-`danger` tones for a commute tunnel; "Back online" persisting as a stale banner; a submit failing into the void with no queue and no preserved input; treating every fetch error as "offline".
