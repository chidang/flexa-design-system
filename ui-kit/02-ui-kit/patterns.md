# Patterns (section index)

> **Normative content lives in [`05-pattern-library.md`](../05-pattern-library.md).** This file is the 02-ui-kit/ folder's index so the folder is self-complete per the origin spec. Each entry links to the owning pattern in doc 05; nothing here overrides it. Patterns COMPOSE canonical components (see the other 02-ui-kit sections) and inherit UX doctrine from 03.

## UX patterns (17)

- **[CRUD](../05-pattern-library.md#a1-crud)**
  Canonical list → detail → create/edit/delete lifecycle: Data Management Toolbar + Table home, Right Drawer editing by default (page for complex entities), confirmed deletes with Undo, optimistic rules per 03.
- **[Search](../05-pattern-library.md#a2-search)**
  Global (grouped results, recent queries) and scoped (per-collection) search via Search Bar: 300ms debounce, min-chars, latest-wins cancellation, explicit no-results state, URL-reflected query.
- **[Filtering](../05-pattern-library.md#a3-filtering)**
  Toolbar chips for hot filters + Advanced Filters panel for the rest; full predicate URL-persisted and shareable, Saved Filters for reuse, conjunctive with search.
- **[Bulk Actions](../05-pattern-library.md#a4-bulk-actions)**
  Selection model on Table/Data Grid summoning the Bulk Actions Bar; predicate-based "select all matching", async jobs with Progress, first-class partial-failure reporting with retry.
- **[Wizard](../05-pattern-library.md#a5-wizard)**
  Wizard Layout + Form Wizard: 3–7 labelled steps, per-step validation, server-side save-and-resume drafts, mandatory review step (Description List with edit links) before any irreversible commit.
- **[Dashboard](../05-pattern-library.md#a6-dashboard)**
  Dashboard Layout with strict metric hierarchy (≤ 4 primary Metric Cards, then charts, then queues), a global time range selector scoping all widgets, drill-down parity from every number to its filtered list.
- **[Settings](../05-pattern-library.md#a7-settings)**
  Settings Layout with grouped section nav, explicit save per section (per 03), dirty guards, re-auth for sensitive changes, and a visually separated danger zone with typed confirmation.
- **[Authentication](../05-pattern-library.md#a8-authentication)**
  Sign in/up, forgot password, email verification, 2FA, SSO slot; anti-enumeration copy; session-expiry re-auth as an overlay dialog that resumes work in place instead of destroying it.
- **[Checkout](../05-pattern-library.md#a9-checkout)**
  Cart → Details → Payment → Review → Confirm as a specialized wizard: escrow explainer before payment, never-optimistic pay action, Idempotency-Key on every payment POST, status-check recovery for ambiguous outcomes.
- **[Timeline](../05-pattern-library.md#a10-timeline)**
  Event rendering contract: actor + action + object grammar, day grouping, one sort order per surface (feeds newest-first, process timelines oldest-first), relative + absolute time.
- **[Approval Flow](../05-pattern-library.md#a11-approval-flow)**
  Generic submit → pending → approve / reject-with-required-reason → resubmit loop with reviewer queues, diffs on resubmission, and AI-assisted review via Approve/Reject Panel (human decision is the only state change). Used by listings moderation and AI review.
- **[Dispute Flow](../05-pattern-library.md#a12-dispute-flow)**
  Open with reason + evidence → time-boxed seller response window → Admin arbitration (Split View) → resolution refund / release / partial with written rationale; pauses the escrow timer for its duration.
- **[Escrow Flow](../05-pattern-library.md#a13-escrow-flow--flagship-pattern)** — *flagship*
  The canonical money state machine (PaymentStatus/EscrowStage per 04) rendered everywhere by Payment Status + Escrow Timeline: held → delivered → buyer approval → release; auto-release timer with T-72h/T-24h reminders; dispute branch pauses the timer; per-persona visibility and action rights per stage.
- **[Review Flow](../05-pattern-library.md#a14-review-flow)**
  Post-release prompt only, both-sides review with simultaneous reveal, single public seller response, report → moderation path reusing Approval Flow; server-owned aggregates.
- **[Messaging Flow](../05-pattern-library.md#a15-messaging-flow)**
  Rule-created conversations (exactly one per order + deduplicated pre-sale inquiries), inline system event cards, one unread model across Conversation List / nav badges / Notification Center, on-the-record order threads for dispute evidence.
- **[Notifications](../05-pattern-library.md#a16-notifications)**
  One event taxonomy driving an in-app + email matrix with user preferences, digest rules for low-urgency classes, never-digestible money/dispute/timer events, deep links to the exact object state.
- **[Empty State](../05-pattern-library.md#a17-empty-state)**
  Four distinct kinds with different copy + CTA each (see 10): first-use (teach + create), cleared (calm confirmation), no-results (clear filters), error (retry); deterministic kind selection, only after loading resolves.

## Interaction patterns (10)

- **[Inline Editing](../05-pattern-library.md#b1-inline-editing)**
  Click-to-edit a single value in place: Enter/blur commits, Esc always cancels, invalid values never commit, version-checked writes with explicit conflict resolution.
- **[Quick Edit](../05-pattern-library.md#b2-quick-edit)**
  Anchored popover form for 1–3 fields with explicit Save/Cancel, atomic commit, and an escape hatch to the full editor; the hard field limit is the pattern boundary.
- **[Drawer Editing](../05-pattern-library.md#b3-drawer-editing)**
  The default list-item editing surface: Right Drawer over the intact list, URL-persisted open state, sticky action footer, dirty guard on every close path, one drawer at a time.
- **[Modal Editing](../05-pattern-library.md#b4-modal-editing)**
  Modal Layout for blocking, focused decisions a drawer can't frame (resolve dispute, issue refund): consequence copy, one primary verb, no scrim-click dismissal for consequential modals, never modal-on-modal.
- **[Infinite Scroll](../05-pattern-library.md#b5-infinite-scroll)**
  Feeds only; tables always paginate. Sentinel prefetch, inline failure rows with retry, explicit end-of-feed, "Back to top", and the footer-reachability rule.
- **[Virtual Lists](../05-pattern-library.md#b6-virtual-lists)**
  Virtualize above 100 rows with fixed row heights, true `aria-rowcount/rowindex` semantics, window-change announcements, and ID-based selection that survives DOM recycling.
- **[Drag and Drop](../05-pattern-library.md#b7-drag-and-drop)**
  Reorder, kanban, and upload with a MANDATORY keyboard alternative (grab / arrow-move / drop, announced — see 11), grip handles, drop-target highlighting, snap-back on failed commits, browse-button fallback for dropzones.
- **[Keyboard Shortcuts](../05-pattern-library.md#b8-keyboard-shortcuts)**
  Global map (`Cmd/Ctrl+K` palette, `/` search, `?` help, `g`+letter chords, `Esc` closes topmost layer) plus per-context conventions; no single-letter shortcuts while focus is in an input.
- **[Command Palette](../05-pattern-library.md#b9-command-palette)**
  `Cmd/Ctrl+K` launcher over an action registry merged with navigation and entity search: context-aware ranking, permission-filtered, recent items first, confirmation dialogs never bypassed.
- **[Context Menu](../05-pattern-library.md#b10-context-menu)**
  Right-click and the visible ⋯ overflow open the same menu (strict parity), and every menu item is also reachable via visible UI; destructive items separated and confirmed; long-press on touch.

## Cross-references

- Component contracts backing these patterns: see 04. UX doctrine (optimism, feedback, motion): see 03.
- Persona flows chaining patterns end-to-end: see 07. Screens instantiating them: see 08.
- Endpoints: see 09. Copy tables: see 10. Accessibility depth: see 11.
