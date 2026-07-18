# 02 — UI Kit · AI Components

> Part of the Flexa UI Kit catalog (doc 02). 8 canonical AI components: AI Assistant Panel, Prompt Input, AI Suggestion Card, AI Generation Status, AI Confidence Indicator, AI Diff Viewer, Approve/Reject Panel, AI Activity History.
> Engineering contracts in 04. Approval Flow pattern in 05 § Approval Flow. Generation/streaming payloads and AI event types in 09. AI microcopy (attribution labels, error phrasing, confidence wording) in 10 § AI. Accessibility of live/streaming regions in 11.

## Design rationale — the Flexa AI doctrine (binding)

AI features earn trust by being **reviewable, attributed, honest, and reversible**. Every AI component in the kit enforces these five rules; product teams may not opt out of them (precedence: this doctrine sits with the UX Bible layer — see 03):

1. **Reviewable before it mutates.** AI output is always staged as a *suggestion* the user approves or rejects before it touches real data. There is no "AI silently edited your listing". The suggestion → approve/reject loop (AI Suggestion Card + Approve/Reject Panel) is the only path from generation to mutation. Bulk AI operations stage per-item results the same way (Approve/Reject Panel batch mode).
2. **Attributed, never fake-human.** AI-generated content is visually marked with a subtle, consistent attribution: the AI badge — sparkle glyph + "AI" label, Badge anatomy, tone `info` at subtle strength, `text.body-sm`. AI never impersonates a person: no human avatars, no human names, no "typing…" theater in non-chat contexts. In Chat-like surfaces the assistant has a distinct non-human avatar glyph and is labeled per 10 § AI.
3. **Streaming states are canonical.** Every generation renders the same lifecycle: `queued → generating → ready → error` (plus user-invoked `cancelled`). AI Generation Status owns this vocabulary; other components embed it rather than reinventing it. Payload/event contract in 09.
4. **Confidence is qualitative.** Model confidence renders as bands — `low | medium | high` — via AI Confidence Indicator. Never numeric percentages ("87% confident") — the numbers are not calibrated for users and manufacture false precision. Band thresholds are set server-side (09) and reviewed with model changes.
5. **Undoable after apply.** Applying an AI change produces a normal, user-visible history entry: one undo step (editor contexts) or a restorable version (Version History — see collaboration.md). The user can always get back to the pre-AI state, and AI Activity History links every applied change to its restore path.

### Component hierarchy

```
AI
├─ Conversation surface ── AI Assistant Panel
│                            └─ contains → Prompt Input · AI Generation Status
├─ Proposal & review ───── AI Suggestion Card → AI Diff Viewer → Approve/Reject Panel
│                            └─ carries  → AI Confidence Indicator
├─ Lifecycle display ───── AI Generation Status (embedded everywhere)
└─ Accountability ──────── AI Activity History (links to Version History / undo)
```

Tone grammar for AI: the accent is `color.primary` for interactive affordances, tone `info` for attribution/neutral AI framing, `success`/`danger` strictly for diff add/remove and approve/reject outcomes, `warning` for low-confidence and destructive-suggestion caution. No dedicated "AI purple" — FDS owns color; AI identity comes from the sparkle glyph + labels, not a new hue.

---

## AI Assistant Panel

**Purpose.** The conversational AI workspace: a docked panel where users ask, iterate, and receive suggestions that flow into the review loop. The container for Prompt Input, streamed responses, and suggestion hand-offs.

**When to use.** Product-level assistant (Right Drawer in App Shell), contextual helpers scoped to a record ("Ask AI about this order"), authoring aids beside editors.

**When NOT to use.** One-shot inline generation (a "✨ Generate" Button + AI Suggestion Card is lighter); human support chat (Chat — never blend the two in one thread); fully automated pipelines with no conversation (AI Activity History covers accountability).

**Variants.** `drawer` (Right Drawer, 400px, `z.fixed`, full conversation) · `docked` (bottom-right floating pill → expands to 360×520 card, `shadow.lg`, `radius.xl` — mirrors the flexa-builder chat affordance) · `contextual` (embedded in a screen section, pre-scoped to the current object; scope chip in header).

**Properties.** `context` (scope chip: "Listing: Walnut desk organizer" — removable where global scope is allowed), `messages[]` (user turns right-aligned per Chat bubble rules; assistant turns left, `color.surface-alt`, AI badge at group start, **no human avatar**), `suggestions[]` (assistant turns that propose changes embed AI Suggestion Cards inline), `status` (AI Generation Status inline while streaming), `promptInput` (Prompt Input docked at bottom), `capabilities` (what this assistant may propose — drives empty-state hints), `history` (link to AI Activity History).

**ASCII wireframe (`drawer`, Desktop).**

```
┌──────────────────────────────────────┐
│ ✦ AI Assistant   ⟨Listing: Walnut…⟩ ✕│  header: AI badge + scope chip
├──────────────────────────────────────┤
│            ┌───────────────────────┐ │
│            │ Make the description  │ │  user turn — right, primary bg
│            │ warmer and shorter    │ │
│            └───────────────────────┘ │
│ ✦ ┌────────────────────────────────┐ │
│   │ Here's a warmer take:          │ │  assistant turn — left,
│   │ ┌────────────────────────────┐ │ │  surface-alt, AI badge
│   │ │ ✦ AI suggestion · Rewrite  │ │ │
│   │ │ description  [●● Medium]   │ │ │  embedded AI Suggestion Card
│   │ │ "Handcrafted from solid…"  │ │ │
│   │ │ [✓ Apply] [✎ Edit] [✕]     │ │ │
│   │ └────────────────────────────┘ │ │
│   └────────────────────────────────┘ │
│ ✦ Generating… ▌            [■ Stop]  │  AI Generation Status inline
├──────────────────────────────────────┤
│ [📎] Ask about this listing… [ ✦ ➤ ] │  Prompt Input, sticky bottom
└──────────────────────────────────────┘
  drawer 400px · z.fixed · history link in header overflow
```

**States.** `default` · `hover`/`focus`/`active` (per control; Esc collapses `docked` variant, focus returns to invoker — 11) · `disabled` (AI unavailable for role/plan: entry points hidden, not teased) · `loading` (assistant turn streams: text renders incrementally with a caret shimmer; layout reserves space — no jumping; reduced-motion: chunked appearance, no shimmer) · `empty` (first open: capability hints as 3–4 example prompt chips, copy 10 § AI; never an empty void) · `error` (generation failed: assistant turn becomes error row — tone `danger` icon + "Something went wrong generating this" + Retry ghost Button; prompt preserved) · `warning` (context too large / truncated: notice chip "Using the 20 most recent items") · `success` (suggestion applied from within the panel: confirmation row linking to the change).

**Responsive.** Mobile: full-screen sheet (as Chat); prompt input sticky above keyboard; suggestion cards full-width. Tablet: drawer 360px. Desktop/Wide: drawer 400px or docked card; panel never overlaps the content it is editing when a suggestion is under review (review happens in Approve/Reject Panel positioned near the target).

**Best practices.** Keep the panel scoped — a contextual assistant states its scope and stays in it. Every actionable proposal goes through AI Suggestion Card, even mid-conversation; never "I've gone ahead and updated…". Preserve conversation per context object across sessions (09).

**Common mistakes.** Human persona ("Hi, I'm Max 👋" with a face); blending support chat and AI assistant in one thread; auto-applying "small" edits from conversation; streaming into a container that grows and shoves the page; losing the user's prompt on error.

---

## Prompt Input

**Purpose.** The specialized input for instructing AI: multiline prompt, context attachments, model/action hints, submit with streaming awareness. The composer of every AI surface.

**When to use.** Inside AI Assistant Panel; standalone above generative features ("Describe the listing you want"); refine bars under AI Suggestion Cards ("Tell AI what to change").

**When NOT to use.** Human messaging (Chat composer); plain search (Search Bar / Command Palette); structured forms that happen to feed AI (use normal form components, then a generate Button).

**Variants.** `default` (multiline, auto-grow to 6 lines) · `bar` (single-line inline refine bar, expands on focus) · `hero` (large empty-state prompt, `text.heading-md` placeholder — onboarding/generative landing sections).

**Properties.** `placeholder` (task-specific, copy 10 § AI: "Describe what to write…", never "Type here"), `attachments?` (context chips: current selection, uploaded image/file — removable; kinds gated per product, 09), `examples?` (suggestion chips below when empty, click-to-fill), `maxLength` (counter at 90%), `submit` (send Button, emphasis `primary`, sparkle icon; **Enter submits, Shift+Enter newline** — same law as Chat), `stopAffordance` (while generating, the submit Button becomes **Stop** — square glyph, emphasis `secondary`; stopping keeps partial output marked "stopped early").

**States.** `default` · `hover` · `focus` (ring `color.focus-ring`; auto-focus only in `hero` and panel-open contexts) · `active` · `disabled` (quota exhausted / AI off: input disabled *with* reason line + link, never silently) · `loading` (= generating: input remains editable for the *next* prompt but submit is replaced by Stop; a queued prompt indicator appears if the user submits again) · `empty` (examples visible) · `error` (rejected prompt — policy/size: Inline Error below, input content preserved) · `warning` (approaching quota: "2 generations left today" note) · `success` (n/a — success belongs to the output).

**Responsive.** Mobile: sticky bottom, full-width, attachments as horizontal chip scroller; examples become a horizontal scroller. Desktop: inline width capped `size.container-md` in hero contexts.

**Best practices.** Prompts are never lost — preserve across navigation, error, and stop. Show cost/quota *before* an expensive generation, not after. Attach context explicitly (visible chips), not implicitly — users must see what the AI sees.

**Common mistakes.** Enter inserting newline while a visible "Press Enter to submit" hint says otherwise; hidden context injection (user can't see why output references X); disabling the input during generation (blocks composing the follow-up); no Stop affordance on long generations.

---

## AI Suggestion Card

**Purpose.** The staged unit of AI output: a proposed change or generated content, attributed, confidence-labeled, previewable, and gated behind approve/reject. The atom of the review loop.

**When to use.** Wherever AI proposes something: generated listing description, suggested reply, price recommendation, categorization, bulk-edit item results, assistant-conversation proposals.

**When NOT to use.** Applied content display (once approved it becomes normal content with an attribution badge only); pure information answers with no mutation (plain assistant turn); status of the generation process (AI Generation Status).

**Variants.** `content` (generated text/media preview) · `change` (field-level edit proposal: embeds AI Diff Viewer `inline`) · `action` (proposed operation, e.g. "Archive 12 stale listings" — shows the target list, never just a sentence) · `compact` (one-line suggestion + expand, for lists of many suggestions).

**Anatomy & properties.**

```
┌──────────────────────────────────────────────────────────────┐
│ ✦ AI suggestion · Rewrite description     [● Medium confidence]│  header: AI badge + type
├──────────────────────────────────────────────────────────────┤
│ Handcrafted from solid walnut, this desk organizer keeps      │  proposal body / preview
│ your workspace tidy without hiding your style. …              │  (or AI Diff Viewer for
│                                                     [Expand ⌄]│   `change` variant)
├──────────────────────────────────────────────────────────────┤
│ Based on: listing photos, category norms                      │  rationale, text.body-sm,
│                                                               │  color.text-muted
│ [ ✓ Apply ]  [ ✎ Edit first ]  [ ✕ Dismiss ]      [↻ Retry]  │  Approve/Reject Panel row
└──────────────────────────────────────────────────────────────┘
  bg color.surface · border color.border · radius.lg · padding space.4
  left accent rail border.2 color.info (attribution, not status)
```

`suggestion` (body/diff/action target), `confidence` (AI Confidence Indicator), `rationale?` ("Based on: …" — inputs summary, builds calibrated trust), `actions` (embedded Approve/Reject Panel: Apply / Edit first / Dismiss (+ Retry where regeneration makes sense)), `attribution` (AI badge — permanent), `destructiveFlag` (action variant proposing deletion/irreversible ops: card gains tone `warning` accents and Apply routes through Confirmation Dialog — AI never shortcuts the destructive gate, see admin.md).

**States.** `default` · `hover` · `focus` (card and each action reachable; keyboard order body → actions) · `active` · `disabled` (target changed since generation: actions disabled + "The listing changed since this was generated" tone `warning` note + Regenerate) · `loading` (regenerating in place: body → AI Generation Status; previous proposal dimmed, not removed) · `empty` (n/a) · `error` (generation failed inside the card: error row + Retry) · `warning` (low confidence or destructive: caution note above actions) · `success` (applied: card collapses to a confirmation row "Applied · Undo" that lingers, then persists in AI Activity History).

**Responsive.** Mobile: full-width; actions stack full-width (Apply first); diff switches to unified/inline mode automatically. Desktop: max width `size.container-md`.

**Best practices.** "Edit first" opens the proposal in the normal editing surface pre-filled — reviewing by editing is a first-class path. Stale-target detection (09 version check) before apply, always. One suggestion = one decision; split compound proposals into multiple cards.

**Common mistakes.** Apply as the *only* action; auto-dismissing on scroll (losing proposals); hiding what an `action` variant will touch ("Fix my listings" with no target list); rationale that just restates the output; removing attribution after apply.

---

## AI Generation Status

**Purpose.** Canonical lifecycle indicator for any AI generation: one visual vocabulary for `queued → generating → ready → error` (+ `cancelled`), embeddable in panels, cards, buttons, and list rows.

**When to use.** Inside AI Assistant Panel turns, AI Suggestion Card regeneration, generate-Button feedback, bulk generation item rows, background AI jobs (bridges to Background Jobs Panel — admin.md).

**When NOT to use.** Non-AI async work (Progress / Skeleton Loader / Background Jobs Panel); confidence display (AI Confidence Indicator); result rendering (the host component owns output).

**Canonical states & rendering (binding vocabulary; event contract in 09).**

| Lifecycle state | Visual | Copy anchor (10 § AI) |
|---|---|---|
| `queued` | sparkle glyph static + "Queued…" `color.text-muted`; position shown when known ("Queued · 2 ahead") | "Queued" |
| `generating` | sparkle pulse (`motion.duration-normal` loop; static + ellipsis under reduced motion) + streamed token area; elapsed time after 5s; Stop affordance where supported | "Generating…" |
| `ready` | brief `color.success` check crossfade (`motion.duration-fast`), then the status yields to the result | "Done" (transient) |
| `error` | tone `danger` icon + human reason + Retry; partials kept and labeled | "Couldn't generate" |
| `cancelled` | neutral note "Stopped — partial result kept" when partial exists | "Stopped" |

**Variants.** `inline` (icon + label line) · `block` (reserves output area with shimmer placeholder lines — prevents layout shift) · `button` (generate Button embeds the lifecycle: label → spinner+Stop → check).

**Properties.** `state` (enum above), `progressHint?` (steps for multi-stage pipelines: "Analyzing photos → Writing copy", current step highlighted — real stages from 09, never invented), `elapsed`, `onStop?`, `onRetry?`.

**ASCII wireframe (`block` variant, multi-stage pipeline).**

```
┌──────────────────────────────────────────────┐
│ ✦ Generating…  12s                  [■ Stop] │  pulse glyph + elapsed
│   Analyzing photos ✓ → Writing copy ◉ → SEO ○│  real stages, current ◉
│ ▓▓▓▓▓▓▓▓▓░░░░░░░░░░░░░░░░░                   │  shimmer lines reserve
│ ▓▓▓▓▓▓▓▓▓▓▓▓▓░░░░░░░░░                       │  the output area —
│ ▓▓▓▓▓░░░░░░░                                 │  zero layout shift
└──────────────────────────────────────────────┘
  error swap-in: ⚠ Couldn't generate — reason · [↻ Retry]
  cancelled: "Stopped — partial result kept" (neutral note)
```

**States (component-state mapping).** The lifecycle *is* the state machine; standard vocabulary maps: `loading` = queued/generating · `success` = ready · `error` = error · `warning` = partial/cancelled-with-partial · `disabled` = n/a · `empty` = n/a. Interactive states apply to Stop/Retry controls only.

**Responsive.** No structural change; `block` shimmer respects container width; elapsed time always visible on Mobile (users background the tab — time anchors trust).

**Best practices.** Announce transitions politely to screen readers (`aria-live="polite"`, one announcement per state — 11); never announce every token. Reserve output space before streaming. Show real pipeline stages or none.

**Common mistakes.** Fake progress bars (percent with no basis — an indeterminate pulse is honest); spinner with no label; discarding partial output on stop/error; re-announcing on every streamed chunk (screen reader flooding).

---

## AI Confidence Indicator

**Purpose.** Qualitative display of how much to trust a specific AI output: `low | medium | high` bands, consistently rendered, with an explanation affordance.

**When to use.** On AI Suggestion Cards, AI-extracted fields ("VAT number — high confidence"), classification results, moderation-assist scores shown to admins.

**When NOT to use.** As a percentage or score readout (doctrine #4); as a substitute for review (high confidence still goes through approve/reject when data mutates); on non-AI heuristics (label those as rules, not confidence).

**Band mapping (binding; thresholds server-side per 09).**

| Band | Tone | Glyph | Meaning for the user |
|---|---|---|---|
| `high` | `success` | filled dot ●●● | Usually correct — quick review |
| `medium` | `info` | ●●○ | Review normally |
| `low` | `warning` | ●○○ | Verify before applying; Apply gains extra caution copy |

**Variants.** `badge` (Badge: dots + "High confidence") · `dots` (dots only + tooltip — dense tables; tooltip duplicates the label for touch per 11) · `inline` (within a sentence: "extracted with low confidence").

**Properties.** `band` (enum), `explanation?` (popover on click/focus: 1–2 sentences on what drives the band — "Based on clear product photos and an exact category match", copy 10 § AI), `size` (`sm|md`).

**States.** Display component; `hover`/`focus` open the explanation popover (`z.popover`); `loading` = skeleton chip; `disabled`/`empty`/`error` n/a (no confidence data → render nothing, never a default band).

**Responsive.** `dots` variant in table cells below Desktop; explanation popover becomes a bottom-sheet note on Mobile.

**Best practices.** Always pair dots with a text label at first mention on a screen (color/dot count alone fails 11). Low confidence changes downstream behavior (extra caution copy, never auto-preselecting Apply) — wire that, don't just paint it.

**Common mistakes.** Percentages or 7-step scales (three bands, that's the contract); band inflation ("medium" as the floor); showing confidence on trivially deterministic operations (spell-out: it erodes meaning); tooltips as the only label.

---

## AI Diff Viewer

**Purpose.** Show exactly what an AI change does to existing content before it applies: side-by-side or inline diff with canonical add/remove tones. The evidence panel of the review loop.

**When to use.** Inside AI Suggestion Card `change` variants; pre-apply review of document rewrites; Approve/Reject Panel detail view; comparing AI output against the current version (shares tone grammar with Version History compare — collaboration.md).

**When NOT to use.** Brand-new content with no predecessor (plain preview); code-review tooling (out of kit scope); audit old→new rendering (Audit Log rows use the same *tones* but their own compact layout).

**Variants & layout.**

| Variant | Layout | Use |
|---|---|---|
| `side-by-side` | Two panes: **Current** (left) · **Suggested** (right), synced scroll, pane headers labeled | Desktop/Wide default for documents |
| `inline` | Single flow: removals struck, additions highlighted, in reading order | Mobile/Tablet always; short field-level changes everywhere |
| `fields` | Per-field rows (label · current → suggested) | Structured records (price, category, tags) |

Users can toggle side-by-side ↔ inline (segmented control, top-right); the toggle persists per user.

**Tone mapping (binding).** Added: `color.success` background wash at subtle strength + `on-*`-safe text, `＋` gutter marker. Removed: `color.danger` wash + strikethrough, `−` gutter marker. Modified lines render as remove+add pairs. Unchanged: `color.text` on `color.surface`; long unchanged runs collapse ("··· 14 unchanged lines ···" expandable). Gutter markers ensure the diff reads without color (11).

**Properties.** `current` / `suggested` (text, rich-text (rendered, marks preserved), or `fields` map), `granularity` (line/word/sentence — word default for prose), `collapseUnchanged` (default on, threshold 6 lines), `stats` ("+120 −38 words" summary chip), `partialAccept?` (where supported: per-hunk checkboxes — accepted hunks feed the apply payload, 09; hidden when the host mutation is all-or-nothing).

**ASCII wireframe (`side-by-side`, Desktop).**

```
┌────────────────────────────────────────────────────────────────┐
│ Review changes      [+120 −38 words]     [Side-by-side | Inline]│
├───────────────────────────────┬────────────────────────────────┤
│ Current                       │ Suggested                      │
├───────────────────────────────┼────────────────────────────────┤
│  A walnut desk organizer.     │  Handcrafted from solid        │
│ − It has compartments and     │ ＋ walnut, this organizer      │
│ − is made of wood.            │ ＋ keeps your workspace tidy   │
│                               │ ＋ without hiding your style.  │
│  ··· 14 unchanged lines ···   │  ··· 14 unchanged lines ···    │
│  Ships within 3 days.         │  Ships within 3 days.          │
├───────────────────────────────┴────────────────────────────────┤
│ ☑ Hunk 1 of 2 accepted            [ ✕ Reject ]  [ ✓ Apply 1 ]  │  per-hunk staging →
└─────────────────────────────────────────────────────────────────┘  Approve/Reject Panel
  removed: danger wash + strike + "−" gutter · added: success wash + "＋"
  panes sync-scroll · unchanged runs collapse (threshold 6 lines)
```

**States.** `default` · `hover` (hunk highlight) · `focus` (hunk-by-hunk keyboard navigation: n/p keys per 11 map) · `active` (selected hunk) · `disabled` (diff stale — target changed: overlay note + Regenerate, mirrors AI Suggestion Card) · `loading` (panes skeleton while diff computes server-side) · `empty` (**no changes**: "AI suggests no changes" note — an honest and required outcome; never render an empty diff as broken) · `error` (diff failed: fall back to plain before/after blocks with a notice — degrade, don't block review) · `warning` (large-change notice: ">80% of the content changes" caution strip) · `success` (n/a — outcome belongs to Approve/Reject Panel).

**Responsive.** Mobile: `inline` forced, stats chip sticky top; per-hunk accept via row checkboxes. Tablet: inline default, side-by-side opt-in landscape. Desktop/Wide: side-by-side default, panes max `size.container-md` each.

**Best practices.** Word-level granularity for prose (line-level makes tiny edits look huge). Always show the stats chip — decision-makers scan magnitude first. Never mutate on hunk-check — checked hunks stage the composite for the Approve/Reject Panel commit.

**Common mistakes.** Color-only add/remove (gutter markers are mandatory); showing raw markup diffs to non-technical users (render marks); side-by-side on phones; scroll desync between panes; treating "no changes" as an error.

---

## Approve/Reject Panel

**Purpose.** The decision gate: a consistent action group that commits or discards staged AI output — single suggestions or review queues. The only component allowed to turn a suggestion into a mutation (doctrine #1).

**When to use.** Embedded in AI Suggestion Card; sticky review bar over an AI Diff Viewer; batch review queues (bulk AI edits, import mappings, moderation assists).

**When NOT to use.** Human workflow approvals (leave requests, listing moderation by admins — same anatomy lives in 05 § Approval Flow but is not this component's AI contract); confirmations of user-initiated actions (Confirmation Dialog).

**Variants.** `inline` (action row inside a card: Apply · Edit first · Dismiss) · `bar` (sticky bottom bar over a full-screen review: decision context + actions, `z.sticky`) · `queue` (batch header: "Reviewing 3 of 12" + per-item decisions + "Apply 8 approved" commit).

**Properties.** `actions` — **Apply** (emphasis `primary`; label names the mutation: "Apply to listing", "Send reply" — never bare "Approve" when the effect is concrete), **Edit first** (secondary: opens the normal editor pre-filled; on save, the edited version applies with attribution "AI-assisted"), **Dismiss/Reject** (ghost; optional reason Select where feedback loops exist — reasons enum 09), **Undo** (post-apply affordance: Toast + persistent link in AI Activity History; editor contexts bind to the standard undo stack — one AI apply = one undo step, mirroring flexa-builder's AI-edit law); `batch` (queue variant: per-item approve/reject toggles, keyboard a/r + j/k navigation per 11, running tally, single atomic commit of approved items); `destructiveGate` (Apply on destructive `action` suggestions opens Confirmation Dialog — the AI path inherits the human gate, admin.md).

**ASCII wireframe (`queue` variant — bulk AI edit review).**

```
┌────────────────────────────────────────────────────────────────┐
│ Review AI suggestions           8 approved · 1 rejected · 3 left│  running tally
├────────────────────────────────────────────────────────────────┤
│ ✓ Walnut desk organizer     — title shortened        [✓] [✕]  │  decided: check tint
│ ✕ Brass pen holder          — category change         [✓] [✕]  │  rejected: neutral
│ ▸ Ceramic vase  ← reviewing — description rewrite     [✓] [✕]  │  current row expanded
│   ┌──────────────────────────────────────────────┐             │
│   │ AI Diff Viewer (inline) …                    │             │  evidence in place
│   └──────────────────────────────────────────────┘             │
│   Linen table runner        — tags added              [✓] [✕]  │
├────────────────────────────────────────────────────────────────┤
│ [Reject remaining]              [ Apply 8 approved changes ]   │  single atomic commit
└────────────────────────────────────────────────────────────────┘
  keys: j/k next-prev · a approve · r reject (11 keyboard map)
  partial failures on commit reported per item — never silent
```

**States.** `default` · `hover`/`focus` (visible order: Apply → Edit first → Dismiss; focus lands on **Edit first** by default when confidence is `low` — deliberate friction) · `active` · `disabled` (stale target, missing permission — with reason tooltip; never silently hidden Apply) · `loading` (Apply in-flight: Button loading, sibling actions disabled; queue commit shows Progress "Applying 8… (3/8)") · `empty` (queue: "Nothing left to review" + summary of decisions) · `error` (apply failed: suggestion re-staged intact, tone `danger` Inline Error + Retry — a failed apply never half-commits, 09 idempotency) · `warning` (low-confidence or destructive caution line above actions) · `success` (applied: confirmation row "Applied · Undo" with `color.success` check; queue: per-item success ticks).

**Responsive.** Mobile: actions stack full-width, Apply on top; `bar` variant is a sticky bottom sheet edge; queue navigation via swipe + visible prev/next. Desktop: inline row right-aligned; keyboard shortcuts surfaced in tooltips.

**Best practices.** Name the blast radius on Apply ("Apply to 12 listings"). Rejection reasons feed model improvement only when the user is told so (10 § AI privacy line). After apply, keep an Undo path visible for the session and permanently via AI Activity History.

**Common mistakes.** Apply auto-focused on low-confidence suggestions; Reject destroying the suggestion with no trace (history must record it); batch commit that partially applies without a partial-failure report (mirror Bulk Actions Bar honesty rules); separate bespoke approve UIs per feature (this panel is the one gate).

---

## AI Activity History

**Purpose.** The accountability ledger of AI in the product: every generation, suggestion, decision (applied/edited/dismissed), and undo — per object and per workspace. Where "what did the AI do?" gets answered, and where undo lives after the Toast is gone.

**When to use.** "AI history" tab on records touched by AI; workspace-level AI activity screen; linked from every applied suggestion's confirmation.

**When NOT to use.** Security forensics (Audit Log — AI applies also emit audit events; this view is the user-facing lens); generic activity (Activity Timeline — AI events may *also* appear there summarized); version browsing (Version History — this component links into it).

**Variants.** `record` (scoped to one object: timeline of AI events on this listing/order) · `workspace` (all AI activity, filterable by feature, user, decision) · `embedded` (last 3 + "View all" under an AI Assistant Panel).

**Properties.** `events[]` — each row: AI badge + event type ("Description rewritten", "Reply suggested"), decision Badge (`applied`=success · `edited & applied`=success + "edited" note · `dismissed`=neutral · `undone`=warning · `failed`=danger), actor ("Suggested by AI · approved by Maria" — both halves always present; AI is never the sole actor of a mutation), timestamp (grammar per collaboration.md cross-cutting rules), links: view diff (frozen AI Diff Viewer snapshot), view version (→ Version History), **Undo/Revert** (where still applicable: restores the pre-apply version via the Version History mechanism; unavailable → disabled with reason "Superseded by later edits"); filters (feature, decision, date — Advanced Filters `lite`, admin.md).

**ASCII wireframe (`record` variant).**

```
┌──────────────────────────────────────────────────────────────┐
│ AI activity — "Walnut desk organizer"        [Filter ▾]      │
├──────────────────────────────────────────────────────────────┤
│ ✦ Description rewritten                      [Applied]       │  success Badge
│   Suggested by AI · approved by Maria · Jun 15, 14:02        │  dual actor, always
│   [View diff]  [View version]  [Undo]                        │
│ ✦ Price recommendation $79 → $84             [Edited & applied]│
│   Suggested by AI · edited by Jonas · Jun 12                 │
│   [View diff]  [View version]  [Undo — Superseded ⓘ]         │  disabled + reason
│ ✦ Category change                            [Dismissed]     │  neutral — logged too
│   Suggested by AI · dismissed by Maria · Jun 10              │
└──────────────────────────────────────────────────────────────┘
  decision Badges: applied=success · dismissed=neutral ·
  undone=warning · failed=danger — every row links to evidence
```

**States.** `default` · `hover` (row affordances) · `focus` · `active` (expanded row with frozen diff) · `disabled` (Undo no longer applicable) · `loading` (row skeletons) · `empty` ("No AI activity yet" + pointer to the assistant — copy 10) · `error` (load failure + retry) · `warning` (undone events; retention notice mirroring Audit Log) · `success` (revert completed Toast + new `undone` row appended — the revert itself is an event).

**Responsive.** Mobile: stacked rows, diff snapshots open as full-screen sheets. Desktop: measure `size.container-md`; workspace variant uses Table + Data Management Toolbar.

**Best practices.** Record dismissals and undos, not just applies — the ledger's value is completeness. Every applied event must link to a restorable state (doctrine #5 is enforced here). Show the human approver on every mutation row.

**Common mistakes.** History that only logs successes; Undo that silently no-ops when superseded (disable with reason instead); conflating this user-facing ledger with the Audit Log's forensic contract (they cross-link, one does not replace the other); purging history when a feature is disabled (the ledger outlives the feature).

---

## Cross-cutting rules (all 8 components)

- **The doctrine binds.** Reviewable-before-mutation, attributed, canonical streaming states, qualitative confidence, undoable-after-apply — every AI surface in every Flexa product, no exceptions without a 03-level amendment.
- **Attribution badge** is one component (sparkle + "AI", tone `info`, subtle) used identically everywhere; applied content keeps it permanently (metadata contract in 09).
- **AI is never the sole actor.** Every mutation row, audit event, and history entry names the approving human alongside the AI.
- **Streaming a11y:** one polite live-region announcement per lifecycle state; reserved layout space; reduced-motion variants for every pulse/shimmer (11).
- **Server owns truth:** confidence bands, lifecycle events, staleness checks, and applied-version links come from 09 contracts — the client renders, never invents.
