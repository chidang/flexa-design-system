# 02 — UI Kit · Collaboration Components

> Part of the Flexa UI Kit catalog (doc 02). 8 canonical collaboration components: Chat, Conversation List, Comment Thread, Mention, Notification Center, Activity Timeline, Audit Log, Version History.
> Engineering contracts in 04. Messaging/Notifications flow patterns in 05 (§ Messaging Flow, § Notifications). Payloads in 09 (`/v1/conversations`, `/v1/notifications`, webhook `message.created`…). Microcopy in 10.

## Design rationale

Collaboration surfaces are where the platform *talks* — between buyer and seller, between team members, and from the system to the user. Three convictions drive this section:

1. **Conversation is context.** A marketplace chat is not a social messenger: messages coexist with orders, offers, and disputes. System events ("Order #123 created") render *inside* the conversation as first-class inline cards, so the negotiation and its outcomes share one timeline.
2. **Attention is budgeted.** Notification Center, unread markers, and Mention exist to route scarce attention. Every unread indicator must be earnable-to-zero: mark-all, per-item read on open, and read-state sync across devices. A notification that cannot be resolved (no deep-link, no dismissal) is a design defect.
3. **History is truthful.** Activity Timeline, Audit Log, and Version History are progressively stricter renderings of the same idea — "what happened". Activity is friendly and summarized; Audit is complete and immutable; Versions are restorable. They share row anatomy (actor · action · object · time) so users learn the grammar once.

### Component hierarchy

```
Collaboration
├─ Messaging ──────────── Chat  ⇦ composes → Conversation List (master/detail)
├─ Contextual discussion ─ Comment Thread · Mention (used inside Chat, Comments, editors)
├─ Attention routing ───── Notification Center
└─ History ────────────── Activity Timeline → Audit Log → Version History
                           (friendly)          (forensic)   (restorable)
```

Shared anatomy: all history rows and message rows use Avatar (`sm`), `text.body` content, `text.body-sm` `color.text-muted` metadata, vertical rhythm `space.3`–`space.4`. Timestamps follow 10 § Dates: relative when < 7 days ("2h ago"), absolute otherwise, absolute-on-hover always, `<time>` semantics per 11.

---

## Chat

**Purpose.** Real-time 1:1 (buyer ↔ seller) and support conversations with message history, attachments, inline system events, and a composer. The primary human channel of Flexa Marketplace (flow: see 05 § Messaging Flow).

**When to use.** Messages screen (buyer & seller), contact-seller entry points, order-scoped conversations, admin support consoles.

**When NOT to use.** Public discussion under a listing (Comment Thread). One-way announcements (Notification Center / Warning Banner). Internal team notes on an admin record (Comment Thread in admin context).

**Variants.** `full` (Messages screen: pairs with Conversation List in Split View) · `panel` (Right Drawer scoped to an order/listing: header carries the context object) · `support` (admin: adds internal-note composer tab — notes render on `color.surface-alt` with "Internal" Badge tone `warning`, invisible to the customer).

**Properties (design-facing; see 04).**

| Property | Type | Notes |
|---|---|---|
| `conversation` | ref | Header: counterparty (Seller Card / Buyer Card `inline`), context chip (order/listing link) |
| `messages[]` | list | Ordered oldest→newest, virtualized beyond ~100 (Virtual Table internals) |
| `composer` | config | Attachments allowed types/size (09), max length, disabled reason |
| `typing` | presence | Counterparty typing indicator |
| `readState` | receipts | Per-message delivered/read markers (own messages only) |
| `viewer` | persona | Drives alignment, receipts, allowed actions |

### Message bubbles — own vs other

| Aspect | Own messages | Other party |
|---|---|---|
| Alignment | Right | Left, with Avatar `sm` at group start |
| Background | `color.primary` | `color.surface-alt` |
| Text | `color.on-primary` | `color.text` |
| Radius | `radius.lg`, reduced corner toward the rail (`radius.sm`) on the last bubble of a group | mirror |
| Max width | 72% of the message area (65% Desktop) | same |

Links inside own bubbles must remain legible on `color.primary` — underline + `color.on-primary`, never a second link color (contrast gate, see 11).

### Grouping & timestamps

- **Grouping:** consecutive messages from the same author within 3 minutes form a group: avatar and author name once (at top for other-party; own messages show neither), bubbles stacked with `space.1` gaps, `space.4` between groups.
- **Timestamps:** one per group, `text.body-sm` `color.text-subtle`, at group end; every bubble has absolute time on hover/long-press. **Day dividers** (centered rule + "Today", "Yesterday", "Jun 12, 2026") whenever the calendar day changes.
- **Unread marker:** a single "New" divider line (`color.primary` rule + label) sits above the first unread message on open; scroll position starts there, not at bottom, when unread exist. Marker clears once the messages have been in view.

### Attachments, receipts, typing, system messages

- **Attachment previews:** images → thumbnail grid inside the bubble (max 4 visible, "+N", lightbox); files → chip with file-type icon, name (middle-ellipsis), size, download. Upload in progress: Progress bar in-bubble + cancel; failure: bubble `error` state (tone `danger` border + "Failed — retry / remove").
- **Read receipts:** own messages only — "Sending" (clock glyph) → "Sent" (single check, `color.text-subtle`) → "Read" (double check, `color.info`). Shown on the *last* own message of a group only. Never show other-party read activity to third parties.
- **Typing indicator:** left-aligned pseudo-bubble with 3-dot animation (`motion.duration-normal` loop; static "typing…" text under `prefers-reduced-motion`). Disappears after 6s without signal.
- **System messages / inline event cards:** platform events render centered or full-width as compact cards, not bubbles — e.g. `[📦 Order #123 created · $132.42 · View order]`, "Dispute opened", "Offer accepted". Anatomy: icon + one-line summary + deep-link, background `color.surface-alt`, `radius.md`, tone accent matching the event (order created = `info`, dispute = `danger`). These come from 09 webhook-mirrored events; the client never fabricates them.

### Composer (input area)

- Single-line auto-growing textarea (max ~6 lines then internal scroll), placeholder from 10.
- **Enter sends. Shift+Enter inserts newline.** (Mobile: the on-screen return key inserts newline; the send Button sends.) Send Button emphasis `primary`, disabled when empty/over-limit — with character counter appearing at 90% of limit.
- Attachment Button (ghost, paperclip) → File Upload; drag-and-drop onto the message area highlights a drop zone (`color.primary` dashed border).
- Mention support (`@` — see Mention) in support/team variants.
- Disabled composer states carry a reason line: "Conversation closed", "You can no longer message this seller" (copy 10).

**ASCII wireframe (`full`, Desktop, inside Split View).**

```
┌──────────────────────────────────────────────────────────────┐
│ ⊙ Atelier Norr   · Verified   │ re: Order #123  [View order] │  header: counterparty + context
├──────────────────────────────────────────────────────────────┤
│                    ── Jun 12, 2026 ──                         │  day divider
│ ⊙ ┌─────────────────────────────┐                             │
│   │ Hi! The organizer ships     │                             │  other: left, surface-alt
│   │ tomorrow morning.           │                             │
│   └─────────────────────────────┘ 09:14                       │  group timestamp
│                                                               │
│        ┌──────────────────────────────────────┐               │
│        │ Perfect — could you add gift wrap?   │  own: right,  │
│        └──────────────────────────────────────┘  primary bg   │
│        ┌───────────────┐                                      │
│        │ 🖼 photo.jpg   │                                      │  attachment bubble
│        └───────────────┘ 09:16 ✓✓                             │  read receipt on last own
│                                                               │
│         ┌───────────────────────────────────────┐             │
│         │ 📦 Order #123 shipped · UPS 1Z…44      │             │  inline system event card
│         │    [Track shipment]                    │             │
│         └───────────────────────────────────────┘             │
│ ────────────────  New  ────────────────                       │  unread marker
│ ⊙ ┌──────────────────────────────┐                            │
│   │ Gift wrap added, no charge 🎁 │                           │
│   └──────────────────────────────┘ 11:02                      │
│ ⊙ ● ● ●                                                       │  typing indicator
├──────────────────────────────────────────────────────────────┤
│ [📎]  Write a message…                             [ Send ]   │  composer
└──────────────────────────────────────────────────────────────┘
   message area scrolls; header & composer fixed · gaps space.1/space.4
```

**States.** `default` · `hover` (message actions appear: copy, report — ghost icons at bubble edge) · `focus` (composer ring; roving focus through messages for keyboard users, 11) · `active` · `disabled` (composer disabled with reason; history stays readable) · `loading` (history: skeleton bubbles alternating alignment; pagination: top spinner on scroll-up) · **`empty` (empty conversation):** Empty State in the message area — counterparty avatar + name, "Say hello to Atelier Norr" + context hint ("You're asking about *Walnut desk organizer*"), composer focused (copy 10) · `error` (send failed: per-bubble retry, offline: Warning Banner "Reconnecting…" + composer queues) · `warning` (counterparty response-time notice; content-policy pre-send warning) · `success` (n/a beyond receipts).

**Responsive.**

| Range | Behavior |
|---|---|
| Mobile ≤767 | **Full-screen takeover:** Conversation List and Chat are separate screens (push navigation, back arrow in header). Composer sticky bottom (`z.sticky`), avoids on-screen keyboard. Attachment previews max 2-up. Bubbles max-width 80%. |
| Tablet 768–1023 | Split View: list 320px + chat; list collapsible |
| Desktop 1024–1439 | Split View: list 360px + chat; message max-width 65% |
| Wide ≥1440 | Chat column capped `size.container-md`, centered in pane |

**Best practices.** Preserve draft text per conversation (survives navigation). Scroll anchoring: incoming messages must not yank the view when the user has scrolled up — show a "↓ New messages" pill (`z.sticky`) instead. Every order/dispute lifecycle event that affects this conversation appears as an inline system card. Report/block actions available on every counterparty message via overflow.

**Common mistakes.** Timestamps on every bubble (noise — group them); read receipts on other people's messages; system events as fake user messages ("Flexa Bot says…"); Enter inserting newline on desktop (breaks the universal expectation); losing composer draft on tab switch; auto-scrolling to bottom when unread marker should anchor the view.

---

## Conversation List

**Purpose.** Master list of conversations: counterparty, snippet, time, unread state. The navigator for Chat.

**When to use.** Left pane of Messages (Split View), messages drop-down preview in Top Navigation.

**When NOT to use.** Notification streams (Notification Center). Support ticket queues with SLA metadata (that's a Table-based admin screen, 08).

**Variants.** `default` · `compact` (drop-down preview: 5 most recent + "View all") · `filtered` (tabs: All / Unread / Archived).

**Properties.** `conversations[]` — each: avatar (+ presence dot `color.success`, if enabled), counterparty name, context chip (order # / listing, `text.body-sm`), snippet (last message, 1 line ellipsis; prefix "You: " for own; attachment → "📎 Photo"), timestamp (relative), unread count Badge (tone `info`, count caps at "99+"), muted icon?; `activeId` (selected row); `search` (filter by name/order).

**ASCII wireframe (`default`, Desktop pane).**

```
┌──────────────────────────────────┐
│ Messages            [🔍] [All ▾] │  header: search + filter tabs
├──────────────────────────────────┤
│ ⊙● Atelier Norr           2m  ③  │  unread: bold name · badge ③
│    re: Order #123                │  context chip line
│    Gift wrap added, no charge    │  snippet, 1 line ellipsis
├──────────────────────────────────┤
│ ⊙  Brightline Studio       1d    │  read row — muted snippet
│    You: Thanks, received!        │  own-message "You:" prefix
├──────────────────────────────────┤
│ ⊙  Flexa Support          3d  🔇 │  muted conversation icon
│    📎 refund-receipt.pdf         │  attachment snippet
└──────────────────────────────────┘
  active row: primary left rail border.2 + surface-alt bg
```

**States.** `default` · `hover` (row `color.surface-alt`) · `focus` (row ring; arrow-key navigation) · `active` (selected: `color.surface-alt` + `color.primary` left rail `border.2`) · `disabled` (n/a) · `loading` (skeleton rows: avatar + 2 lines ×8) · `empty` ("No messages yet" Empty State + hint to contact sellers from listings) · `error` (load failure + retry) · `warning` (n/a) · `success` (n/a). **Unread rows:** name + snippet in `text.label` weight, unread Badge right; read rows use `color.text-muted` snippet.

**Responsive.** Mobile: full-screen list (see Chat); swipe actions — archive (leading), mute (trailing). Tablet+: fixed pane; overflow menu replaces swipe.

**Best practices.** Sort by last activity; pin disputes-related conversations with a tone `danger` dot + label. Unread count in the list must equal the sum shown on the nav badge (single source, 09).

**Common mistakes.** Snippet rendering raw markdown/HTML; unread badge that survives opening the conversation; hiding the order context chip (conversations become unidentifiable at scale).

---

## Comment Thread

**Purpose.** Asynchronous, object-anchored discussion: comments with replies, edit/delete, reactions — attached to a listing, task, document, or admin record.

**When to use.** Q&A under a Listing Detail, internal notes on admin records, review responses beyond one level (products other than Marketplace), Booking/CRM record discussions.

**When NOT to use.** Real-time negotiation (Chat). Immutable history (Audit Log). Single seller response on a review (Review Card `withResponse`).

**Variants.** `flat` (no nesting — announcements Q&A) · `threaded` (one reply level: root + replies, replies indent `space.8` with connector rail `color.border`) · `internal` (admin notes: `color.surface-alt` container + "Internal" Badge tone `warning`).

**Properties.** `comments[]` (author avatar/name/role Badge?, body — rich-text limited set per 09, createdAt, edited flag "(edited)" with hover original-date), `composer` (top or bottom per context; Mention-enabled), `sort` (newest/oldest/top), `permissions` (edit own ≤ X min, delete own, moderate).

**States.** `default` · `hover` (action bar reveal: reply, react, ⋯) · `focus` · `active` (deep-linked comment: temporary `color.surface-alt` highlight fading over `motion.duration-slow`) · `disabled` (locked thread: composer replaced by "Comments are closed" note) · `loading` (skeleton comment rows; "Load more replies (12)" expanders) · `empty` ("No comments yet — start the discussion") · `error` (post failed: composer keeps text + Inline Error) · `warning` (pending moderation: own comment at `opacity.disabled` + Badge tone `neutral` "Pending") · `success` (n/a).

**Responsive.** Mobile: reply indent reduced to `space.4`, action bar always visible (no hover); composer full-width. Desktop: hover-revealed actions, max measure `size.container-md`.

**Best practices.** One nesting level only — deeper discussion links out to its own thread. Optimistic post with reconcile. Deleted comments with replies leave a tombstone ("Comment deleted") to preserve reply context.

**Common mistakes.** Infinite nesting; losing composer content on failed submit; edit without "(edited)" marker; using Comment Thread as a chat (no real-time affordances here by design).

---

## Mention

**Purpose.** Inline reference to a person/role/object (`@maria`, `@support-team`, `#order-123`) with autocomplete at input time and an interactive chip at render time.

**When to use.** Inside Chat (support/team variants), Comment Thread, admin note fields, dispute case discussion.

**When NOT to use.** Plain links to objects in body copy (use a normal link); tagging for categorization (Tag / Tag Input).

**Variants.** `user` (`@` trigger) · `object` (`#` trigger: orders, listings, tickets — product-configured per 09 search endpoints).

**Properties.** Input-time: trigger char, async suggestion list (Autocomplete anatomy: avatar/icon + name + secondary line; keyboard ↑↓/Enter/Esc per 11), max suggestions 6. Render-time: chip — `color.primary` text on `color.surface-alt`, `radius.sm`, `space.1` padding; hover → mini profile popover (Seller/Buyer Card `popover`, Desktop) or object preview; click → navigate; self-mention renders with `color.warning` accent background for visibility.

**States.** `default` · `hover` (popover intent) · `focus` (chip focusable, Enter opens) · `active` · `disabled` (deactivated user: chip degrades to plain text + tooltip "User no longer active") · `loading` (suggestion list spinner row) · `empty` (suggestions: "No matches") · `error` (resolution failure → plain text, never broken chip) · `warning`/`success` (n/a).

**Responsive.** Mobile: suggestion list renders as a docked sheet above the keyboard, not a floating popover; popovers replaced by tap-through navigation.

**Best practices.** Mention triggers a notification (Notification Center type `mention`) — that contract is the point of the component; suggestions are permission-filtered server-side (never leak members the author can't see).

**Common mistakes.** Client-side user search over a full dump; chips that break on rename (store id, render current display name per 09); mention styling identical to links (users must distinguish "notified" from "referenced").

---

## Notification Center

**Purpose.** The single inbox for everything the platform wants the user to know: order events, messages, escrow actions, mentions, system notices — grouped, readable, and resolvable.

**When to use.** Bell entry in Top Navigation (popover panel Desktop, full screen Mobile), Notifications screen (canonical list, see 08).

**When NOT to use.** Transient confirmations (Toast). Blocking problems (Alert / Confirmation Dialog). Marketing content (never — see 03).

**Variants.** `panel` (popover, `z.popover`, width 400px, max-height 70vh, latest ~20 + "View all") · `page` (full history, filter tabs by type, date pagination) · `badge-only` (the bell + unread count Badge tone `danger`, caps "99+").

**Properties.** `notifications[]` — each: type icon + tone, title (`text.body`, unread in `text.label` weight), body (1–2 lines), timestamp (relative), read flag, deep-link, optional inline actions (max 2: e.g. "Approve delivery" — action fires without leaving the panel, then the row shows its `success` state); `groups` (by day); `unreadCount`; `markAllRead`; `preferencesLink` (→ Account Settings § Notifications).

**Per-type icon & tone mapping (extend via 09 § notification types; copy in 10).**

| Type | Icon | Tone |
|---|---|---|
| `order.paid` / `order.fulfilment_started` / `order.delivered` | package | `info` |
| `escrow.auto_release_scheduled` (approve delivery) / `dispute.seller_responded` (review response) | shield | `warning` |
| `escrow.released` / `payout.sent` | check-circle | `success` |
| `dispute.opened` / `dispute.escalated` | alert-triangle | `danger` |
| `message.created` | chat | `neutral` |
| `mention` | at-sign | `info` |
| `review.created` | star | `neutral` |
| `system` (policy, maintenance) | info-circle | `info` |

**Grouping & read model.** Rows grouped under day headers ("Today", "Yesterday", "Jun 12"); within a day, newest first. Unread rows: `color.surface-alt` background + `color.primary` dot at left; opening (click/Enter) marks read *and* deep-links to the object — the deep-link is mandatory (a notification without a destination may not ship). "Mark all as read" (ghost Button, panel header) clears the badge immediately (optimistic, reconciled per 09). Read-state syncs across devices/sessions.

**ASCII wireframe (`panel`).**

```
┌────────────────────────────────────────────┐
│ Notifications              [Mark all read] │
├────────────────────────────────────────────┤
│ Today                                      │  day group header
│ ● 🛡 Approve delivery for Order #123       │  unread · warning tone icon
│      Auto-releases in 5 days        2h ago │
│      [Approve]  [View order]               │  inline actions
│ ● 💬 New message from Atelier Norr         │  unread · neutral
│      "Gift wrap added, no charge"   4h ago │
├────────────────────────────────────────────┤
│ Yesterday                                  │
│   ✓ Payment released for Order #118        │  read · success
│                                     1d ago │
│   ★ New review on "Walnut desk…"    1d ago │
├────────────────────────────────────────────┤
│ [ View all notifications ]     [⚙ Prefs]   │
└────────────────────────────────────────────┘
  unread: surface-alt bg + primary dot · rows space.3 padding
```

**States.** `default` · `hover` (row `color.surface-alt`) · `focus` (roving row focus; Esc closes panel returning focus to bell, 11) · `active` · `disabled` (n/a) · `loading` (skeleton rows) · **`empty`** ("You're all caught up" + subdued illustration; filtered tabs get type-specific empties — copy 10) · `error` (load failure + retry; badge shows last-known count, never fabricates) · `warning` (n/a at component level) · `success` (inline action completed: row action area → tone `success` check + label).

**Responsive.** Mobile: full-screen sheet from the bell (no popover); inline actions become full-width row buttons; pull-to-refresh. Tablet/Desktop: popover panel; page variant for history. Wide: unchanged.

**Best practices.** Coalesce bursts ("3 new messages from Atelier Norr" as one row that expands) — coalescing rules per type live in 09. Every row resolvable: deep-link plus optional inline action. Respect user preferences (channel + type mute) — muted types never appear, rather than appearing pre-read.

**Common mistakes.** Toasting *and* notifying *and* emailing identical low-value events (budget attention — see 03); notifications that mark read on panel-open (user loses the unread map); badge counting already-read items; inline destructive actions (disputes must deep-link, never one-tap from a popover).

---

## Activity Timeline

**Purpose.** Friendly chronological feed of what happened around an object or workspace: status changes, comments, uploads, assignments — summarized for humans.

**When to use.** Order Detail side column ("activity"), CRM record history, Booking event history, dashboard Activity Feed backing component.

**When NOT to use.** Compliance/forensic review (Audit Log). Money-stage visualization (Escrow Timeline). Document restore (Version History).

**Variants.** `default` (icon rail + rows) · `grouped` (day headers, as Notification Center) · `condensed` (dashboard: last 5 + "View all").

**Properties.** `events[]` — each: icon (per event type, tone-mapped as Notification Center table), summary sentence with actor first ("**Maria** shipped the order"), object links inline, timestamp, optional detail block (collapsed: comment excerpt, field old→new); `filters?` (by event family); `loadMore` (cursor per 09).

**States.** `default` · `hover` (row link affordances) · `focus` · `active` (deep-linked event highlight, fades `motion.duration-slow`) · `disabled` (n/a) · `loading` (skeleton rows with rail) · `empty` ("No activity yet") · `error` (retry) · `warning`/`success` (event-level tones only — the component itself stays neutral).

**Responsive.** Mobile: rail tightens to `space.4`, detail blocks default-collapsed. Desktop: measure capped `size.container-md`.

**Best practices.** Summaries are sentences, not key-value dumps; collapse same-actor bursts ("Maria updated 4 fields" expandable). Timestamps relative <7d, absolute after (10 § Dates).

**Common mistakes.** Duplicating every audit event verbatim (activity is curated, audit is complete); putting actions in the timeline (it's a record, not a queue); technical actor names ("system-cron-7") instead of "System".

---

## Audit Log

**Purpose.** Complete, immutable, filterable record of security- and data-relevant actions: who did what, to what, from where, when. Forensic counterpart to Activity Timeline.

**When to use.** Admin Audit Log screen (08), User Detail security tab, compliance export flows.

**When NOT to use.** End-user object history (Activity Timeline). App/system diagnostics (System Logs — see admin.md). Content rollback (Version History).

**Variants.** `table` (canonical: Table-based with Data Management Toolbar — see admin.md) · `embedded` (record-scoped subset, last 10 + link to filtered full log).

**Properties.** Row: `timestamp` (absolute always, seconds precision, UTC toggle), `actor` (user + Role Badge; "System"/"API key {name}"), `action` (verb code from 09 enum + human label), `target` (object type + link when live; tombstone id when deleted), `source` (IP, user-agent summary — admin-only column), `changes?` (expandable old→new diff: removed `color.danger` strike / added `color.success`, mirroring AI Diff Viewer tones — see ai.md); toolbar: date range, actor, action-type filters (Advanced Filters — admin.md), export (CSV per 09).

**States.** `default` · `hover` (row highlight) · `focus` · `active` (expanded change row) · `disabled` (n/a — log rows are never disabled) · `loading` (table skeleton) · `empty` (filters: "No events match" + clear-filters action; true-empty: "No audit events yet") · `error` (load/export failure + retry) · `warning` (retention notice: "Events older than 90 days are archived") · `success` (export completed Toast).

**Responsive.** Mobile: rows collapse to stacked cards (time + actor + action; expand for target/source); export hidden behind overflow. Desktop: full table, `compact` density default.

**Best practices.** Absolute timestamps only — relative time is banned here. No delete/edit affordances anywhere near log rows (immutability is a UI message too). Filters are shareable (URL-persisted, 06 § URL scheme).

**Common mistakes.** Truncating actor or action to fit (wrap instead); friendly-summarizing ("Maria made changes") — audit rows must state the exact action; forgetting tombstones for deleted targets, breaking investigations.

---

## Version History

**Purpose.** List of saved versions of a document/record with author, time, change summary, preview/compare, and **restore** — history you can act on.

**When to use.** Listing Editor drafts, Rich Text/Markdown Editor documents, CRM templates, settings with versioned payloads.

**When NOT to use.** Non-restorable event trails (Activity Timeline / Audit Log). Code-style diffs of AI output (AI Diff Viewer — though Compare may embed the same diff anatomy).

**Variants.** `panel` (Right Drawer beside the editor: version list + inline preview) · `dialog` (Modal Layout: list left, preview/compare right — Split View anatomy).

**Properties.** `versions[]` — each: version label ("v12" or timestamp title), author (avatar + name), savedAt, summary?, badges: "Current" (tone `info`), "Published" (tone `success`), "Autosave" (`color.text-subtle` label); actions per row: Preview · Compare with current · Restore; `compare` (two-version diff view: added `color.success` bg / removed `color.danger` strike — same tone grammar as AI Diff Viewer, ai.md); `restore` (requires Confirmation Dialog: "Restore v12? Current state is saved as a new version." — restore is non-destructive by contract, 09).

**ASCII wireframe (`dialog` variant, Desktop).**

```
┌───────────────────────────────────────────────────────────────┐
│ Version history — "Walnut desk organizer"                  ✕  │
├──────────────────────────┬────────────────────────────────────┤
│ ● v14 · Current [Info]   │  Preview: v12                      │
│   Maria · 2h ago         │ ┌────────────────────────────────┐ │
│ ○ v13 · Published [Succ] │ │ Handcrafted walnut organizer   │ │
│   Maria · Yesterday      │ │ with felt-lined compartments…  │ │
│ ◉ v12  ← selected        │ │                                │ │
│   Jonas · Jun 12         │ └────────────────────────────────┘ │
│   "Rewrote description"  │  [Compare with current]            │
│ ▸ Autosaves (6)          │  [Restore this version]            │
├──────────────────────────┴────────────────────────────────────┤
│                                        [Close]                │
└───────────────────────────────────────────────────────────────┘
  list 320px · selected rail color.primary · autosaves collapsed
```

**States.** `default` · `hover` (row actions reveal) · `focus` · `active` (selected version, `color.primary` rail) · `disabled` (restore disabled on the current version, with tooltip) · `loading` (list skeleton; preview pane spinner; restore in-flight: Button loading + list frozen) · `empty` ("No versions yet — versions are saved when you publish") · `error` (preview/restore failure + retry) · `warning` (restoring an old version over unpublished changes: warning line in the confirm dialog) · `success` (restored: Toast + list re-heads with new current).

**Responsive.** Mobile: full-screen sheet; preview replaces list (back to return); Compare stacks the two versions vertically (side-by-side needs ≥ Tablet). Desktop: `dialog` variant, list 320px + preview.

**Best practices.** Restore always snapshots the current state first — say so in the confirm copy (10). Group autosaves under an expandable "Autosaves" cluster so meaningful versions stay scannable. Show *what changed* (summary or field count), not just when.

**Common mistakes.** Hard-replacing current on restore (irreversible = contract violation); rendering every autosave as a peer version (noise); Compare without tone-consistent add/remove marking; hiding the author (versions are collaboration data, not just backups).

---

## Cross-cutting rules (all 8 components)

- **Timestamp grammar (binding):** relative < 7 days, absolute after; absolute always available on hover/long-press; Audit Log absolute-only. Formatting owned by 10 § Dates; semantics (`<time>`) by 11.
- **Actor grammar:** actor first in every history sentence; "System" for platform automation; role visible where it matters (Role Badge — admin.md).
- **Unread/attention state** is server-owned and cross-device (09); components render it, never invent it.
- **Real-time updates** never steal scroll position or focus; new content announces via polite live regions (11) and "new items" pills, not layout jumps.
- **Empty states** are onboarding moments: every list-shaped component above defines specific copy in 10, never a bare "No data".
