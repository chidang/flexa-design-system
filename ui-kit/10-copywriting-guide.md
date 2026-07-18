# 10 — Flexa Copywriting Guide

> The words rulebook. This document OWNS all microcopy rules: voice, terminology, CTAs, empty states, errors, confirmations, notifications, and formatting of language in the UI. Every other document defers to it for wording; it defers to 03 UX Bible for *when* a message appears and 11 Accessibility for *how* it is announced. Reference product: Flexa Marketplace (personas Guest, Buyer, Seller, Admin — README).
>
> **MUST/SHOULD/NEVER** as in 03. Examples marked ✅/❌ are normative.

---

## 1. Voice & tone

**Voice (constant):** clear, calm, professional, human. We write like a competent colleague — direct, concrete, never cute, never robotic.

- Plain words over jargon: "sign in", not "authenticate"; "money on hold", not "funds sequestered".
- Short sentences. Front-load the point. One idea per sentence.
- Active voice, present tense: ✅ "Buyer paid the order" ❌ "The order has been marked as paid by the buyer".
- Confident, not bossy. NEVER blame ("you entered an invalid email" → "enter a valid email address").

**Tone (shifts by context):**

| Context | Tone | Example |
|---|---|---|
| Success | Warm, brief | "Listing published" — not "Congratulations!!! Your amazing listing is now live!" |
| Errors | Helpful, never blaming, never alarmist | "Couldn't save your changes. Check your connection and try again." |
| Destructive | Direct, consequence-first, zero softening | "This permanently deletes the listing and its 3 drafts." |
| Payments & escrow | Precise, unambiguous, complete | "US$120.00 is held in escrow until you confirm delivery." Never approximate, never playful. |
| Empty states / onboarding | Encouraging, action-oriented | "Your first listing takes about 5 minutes." |
| AI features | Honest about uncertainty | "Suggested description — review before publishing." AI never claims certainty; confidence is stated (AI Confidence Indicator), and AI output is always labeled as such. |

The product speaks as "we" and addresses the user as "you". The product NEVER says "I" — the sole exception is the AI assistant persona inside AI Assistant Panel / Chat, which may say "I" ("I couldn't find matching orders").

Tone spectrum — the same event, wrong and right:

| Event | ❌ Off-voice | ✅ Flexa voice |
|---|---|---|
| First sale | "🎉 WOOHOO! You just made your FIRST SALE!!!" | "Your first sale — Vintage lamp, US$120.00. Funds are in escrow until delivery is confirmed." |
| Failed card | "Payment error. Transaction declined by processor (code 05)." | "Your payment didn't go through and you haven't been charged. Check your card details or try another method." |
| Dispute opened against seller | "A claim has been filed against your account." | "The buyer opened a dispute on order #1042. Respond with your side by 18 Mar." |
| Listing rejected | "Your product violated our policies." | "'Vintage lamp' wasn't approved: images don't show the actual item. Edit the photos and resubmit." |
| AI suggestion | "I've perfected your description!" | "Here's a suggested description based on your photos. Review it before publishing." |

---

## 2. Mechanics

1. **Sentence case everywhere** — buttons, titles, labels, tabs, menu items, table headers: ✅ "Release funds" ❌ "Release Funds". Proper nouns keep their capitals (Flexa Marketplace, PayPal).
2. **No exclamation marks in errors or money contexts.** At most one per screen elsewhere, and only for genuine user achievement.
3. **Oxford comma** always: "listings, orders, and payouts".
4. **Numerals for all numbers** in UI ("3 items", not "three items"), including 1–9.
5. **En-dash for ranges**, no spaces: "3–5 business days", "$10–$50".
6. **No "please" in labels, buttons, or short instructions.** Allowed sparingly in full-sentence asks where we inconvenience the user ("Please verify your email to continue" — once, not per sentence).
7. Second person: "your orders", "you'll get a notification". Avoid "the user".
8. Contractions are welcome ("can't", "you'll") except in legal/consequence lines of destructive and money dialogs, which spell it out ("cannot be undone").
9. No ALL CAPS except unavoidable acronyms. No bold-as-shouting; bold marks the key object or amount only.
10. Ellipsis (…) only for in-progress states ("Uploading…") and truncation — never for dramatic pauses.
11. Periods: full sentences get them; fragments (labels, titles, list items, tooltips ≤ 8 words) don't. Never a period on a button.
12. Abbreviations: avoid; if space-forced, use only listed ones (min, max, qty, no.) and give the full word to screen readers (11 owns the mechanism).

Quick reference — right vs wrong:

| ❌ Wrong | ✅ Right | Rule |
|---|---|---|
| "Submit" | "Publish listing" | §4 verb-first, specific |
| "Save Changes" | "Save changes" | §2.1 sentence case |
| "Invalid input!" | "Enter a valid email address" | §2.2, §6.2 |
| "Please enter your name" (label) | "Full name" | §2.6 |
| "Your payment will be processed shortly" | "Your payout of US$450.00 arrives in 1–3 business days" | §9 |
| "3 item(s) selected" | "3 items selected" | §10 pluralization |
| "Login to continue" | "Sign in to continue" | §3 terminology |
| "Are you sure?" / [Yes] [No] | "Delete listing?" / [Cancel] [Delete listing] | §7 |
| "Oops! Something went wrong :(" | "Couldn't load orders. Try again." | §6 |
| "Add New Product" | "Create listing" | §3 (create, listing) |

---

## 3. Terminology dictionary (anti-drift table)

One term per concept, product-wide. The left column is canonical; the right column is **forbidden** in UI copy. Component/screen names remain the canonical README names.

| Canonical term | Meaning | Forbidden synonyms |
|---|---|---|
| listing | what a seller offers on the marketplace | product, item, ad, post, offer |
| order | a purchase from checkout to completion | purchase, transaction (transaction = payment-ledger contexts only) |
| checkout | the pay flow (Cart → Payment → Confirm) | purchase flow, basket flow |
| cart | pre-checkout collection of listings | basket, bag |
| escrow | funds held by the platform until release conditions are met | holding, deposit |
| hold / held in escrow | state of buyer money after payment, before release | frozen, locked, pending (as a money state) |
| release funds | move escrowed money toward seller payout | disburse, unlock, free up |
| payout | money the **seller receives** from the platform | withdrawal, disbursement, payment (in seller context) |
| refund | money the **buyer receives** back | payback, reimbursement, return (money sense) |
| dispute | formal disagreement on an order | claim, complaint, ticket, case |
| evidence | files/notes attached to a dispute | proof, attachment (in dispute context) |
| conversation | a message thread between two parties | chat thread, discussion, ticket |
| message | one entry in a conversation | chat, DM, note |
| review | rating + text a buyer leaves | rating (alone), feedback, comment (for reviews) |
| rating | the numeric part of a review | score, stars (as a noun) |
| sign in / sign out | session start/end | login, log in, logout, sign off |
| sign up | account creation | register, join, create account (as CTA) |
| create | make a new object ("Create listing") | add new, new up, make |
| add | attach an existing thing to a set ("Add payment method") | create (for attach), insert |
| delete | soft-remove per 03 §5 | remove permanently, erase, destroy, trash (as verb) |
| remove | take out of a set without destroying ("Remove from cart") | delete (for set-removal) |
| archive | hide from active views, recoverable | hide, retire |
| publish / unpublish | make a listing publicly visible / not | activate, deactivate, go live |
| draft | unpublished, editable listing/content | pending listing, unpublished item |
| save | persist changes | submit (for saves), apply, update (as button) |
| cancel (an order) | terminate an order per policy | abort, void, kill |
| Cancel (button) | dismiss without acting | Close (for actions), No, Never mind |
| buyer / seller | marketplace roles | customer, vendor, merchant, shop owner |
| admin | platform operator | moderator, superuser, staff (unqualified) |
| account | the user's identity + settings | profile (profile = the public page only) |
| notification | an entry in Notification Center | alert (alert = Alert component/banner) |
| verify / verification | confirming email, identity, payout account | validate (validation = form checking only) |
| earnings | seller's accumulated sales money pre-payout | revenue, income, balance (unqualified) |
| fee | what the platform charges | commission, cut, charge (noun) |
| shipping | physical delivery leg | delivery (delivery = the completed handover event) |
| search | the query action & screen | find, lookup |
| filter | narrowing a list | refine, facet (in UI copy) |
| save (a listing) | bookmark a listing for later | favorite, wishlist, like (marketplace context) |
| report | flag content/user to admins | flag, denounce |
| category | listing taxonomy node (Categories & Attributes) | section, department, collection |
| store | a seller's public storefront | shop, boutique |

Enforcement: any PR/spec introducing a right-column word for the left-column concept is a copy defect. New concepts get ONE term added here before they ship.

---

## 4. CTA rules

- **Verb-first and specific.** The button says what happens: ✅ "Publish listing", "Send message", "Release funds" ❌ "Submit", "OK", "Continue" (Continue is allowed only mid-wizard where the step title carries the meaning), ❌ "Click here".
- **One primary per view** (03 §2). The primary CTA restates the screen's purpose.
- **Destructive CTAs name the object:** "Delete listing", "Cancel order", "Remove payment method". Bare "Delete" is allowed only inline in a row whose object is unambiguous, never in dialogs.
- **Primary/secondary pairs:** primary = the action verb; secondary = "Cancel" (dismiss) or a real alternative ("Save draft"). The safe path is the visually calmer one; the primary is never the destructive option's neighbor (03 §5).
- **NEVER "Yes" / "No" buttons.** Dialog buttons repeat the verb: "Delete listing" / "Cancel". (Anti-pattern 15, 03 §15.)
- Money CTAs carry the amount when known: "Pay US$120.00", "Refund US$45.00".
- Length: 1–3 words (money CTAs may go to 4). If a button needs more, the surrounding copy is doing too little.
- Loading state keeps the verb: "Publishing…" not a bare spinner label swap to "Loading…".
- Links navigate, buttons act. Link text names the destination ("View order"), never "here".

Canonical label bank (use these exact labels for these actions everywhere):

| Action | Label | Loading label |
|---|---|---|
| Persist form changes | Save changes | Saving… |
| Create + publish a listing | Publish listing | Publishing… |
| Save without publishing | Save draft | Saving… |
| Pay in checkout | Pay {amount} | Processing payment… |
| Confirm delivery (buyer) | Confirm delivery | Confirming… |
| Release escrow (admin/buyer per policy) | Release {amount} | Releasing… |
| Issue a refund | Refund {amount} | Refunding… |
| Start a dispute | Open dispute | Opening… |
| Send a message | Send | Sending… |
| Reply to a review | Reply | Sending… |
| Start seller onboarding | Start selling | — |
| Export data | Export CSV / Export PDF | Export started (toast) |
| Retry a failed action | Try again | Retrying… |
| Dismiss without acting | Cancel | — |
| Close a passive panel | Close | — |

---

## 5. Empty states

Formula (03 §9): **what this is → why it's empty → what to do next (+ one CTA)**. Max 2 short sentences + CTA. First-run and filtered-empty are different states — filtered-empty says "No results" and offers to clear.

Canonical copy (Flexa Marketplace screens; adapt object names per product, keep the formula):

| Screen / area | Title | Body | CTA |
|---|---|---|---|
| Orders List (buyer, first-run) | No orders yet | When you buy something, your orders and their status show up here. | Browse listings |
| Orders List (seller, first-run) | No orders yet | Orders appear here as soon as a buyer checks out one of your listings. | View my listings |
| Orders List (filtered) | No orders match these filters | — | Clear filters |
| Listings (seller, first-run) | No listings yet | Your first listing takes about 5 minutes to create. | Create listing |
| Listings Moderation (admin) | Nothing to moderate | New and edited listings appear here for approval. | — |
| Messages / Conversation List | No messages yet | Conversations with buyers and sellers appear here. | — (Buyer variant CTA: Browse listings) |
| Notifications | You're all caught up | New activity on your orders, messages, and listings shows up here. | — |
| Disputes Queue (admin) | No open disputes | New disputes land here, oldest first. | — |
| Disputes (buyer/seller) | No disputes | If a problem with an order can't be solved in messages, you can open a dispute from the order page. | — |
| Search Results (no results) | No results for "{query}" | Check the spelling, or try a broader search. | Clear search |
| Reviews (buyer, write/manage) | No reviews yet | After an order is delivered, you can review it here. | View orders |
| Reviews (seller, respond) | No reviews yet | Reviews from your buyers appear here — you can reply to each one. | — |
| Earnings & Payouts (seller) | No payouts yet | Once you make your first sale and funds are released, payouts appear here. | Set up payout account *(if unset)* |
| Wallet & Payment Methods (buyer) | No payment methods | Add a card or account to check out faster. | Add payment method |
| Saved Filters | No saved filters | Save a set of filters to reuse it in one click. | — |
| Audit Log (admin, filtered) | No entries match these filters | — | Clear filters |
| Analytics (seller, no data) | Not enough data yet | Analytics appear after your listings get their first views. | — |
| Cart Summary (empty) | Your cart is empty | Listings you add appear here, ready for checkout. | Browse listings |
| Background Jobs Panel | No jobs running | Exports and bulk operations show their progress here. | — |
| Queue Monitor (admin) | All queues clear | Pending jobs appear here with their status and retries. | — |
| Version History | No versions yet | Every saved change creates a version you can restore. | — |

Rules: never blame the user for emptiness; never use "Oops"; the CTA must be performable *now* by this persona (no "Create listing" for a Guest — show "Sign up to start selling" instead).

---

## 6. Error messages

Formula: **what happened + why (if known) + how to recover. ≤ 2 sentences.** Never blame, never joke, never "Oops"/"Something went wrong!" as the entire message, never exclamation marks (§2).

**Never expose machine internals to end users:** no error codes, stack traces, request ids, or raw API messages in Buyer/Seller/Guest surfaces. Admin surfaces MAY append the machine code and request id in a muted, copyable line ("Code: payment_failed · Request: req_8f2…") for support.

### 6.1 API error code → user-facing copy

Codes per README API conventions / 09. These are templates; insert object names.

| Code / condition | User-facing copy | Notes |
|---|---|---|
| `validation_failed` | "Some fields need attention." | Summary line; per-field details render at fields (§6.2). Focus first invalid field (03 §10). |
| `not_found` | "This {listing} is no longer available. It may have been removed." | On navigation → Error Page 404: "We can't find that page. It may have moved or been deleted." + link home/back. |
| `forbidden` | "You don't have permission to do this. Contact an admin if you think you should." | Never reveal whether the object exists beyond necessity. |
| `unauthorized` / session expired | "Your session ended. Sign in again to continue." | Preserve in-progress input (03 §9). |
| `rate_limited` | "Too many attempts. Try again in {n} minutes." | Give a concrete time whenever the API provides one. |
| `conflict` (edit collision) | "Someone else changed this {listing} while you were editing. Review the latest version before saving." | Offer "View latest" — never overwrite silently. |
| `payment_failed` | "Your payment didn't go through and you haven't been charged. Check your card details or try another method." | ALWAYS state whether money moved. Never guess a reason the processor didn't give. |
| `payout_failed` (seller) | "We couldn't send your payout of {amount}. Check your payout account details — we'll retry automatically." | Money + next step + who acts. |
| network offline | "You're offline. We'll retry when your connection is back." | Pair with Offline State; queued actions say "Waiting for connection…". |
| server error (5xx) | "Something went wrong on our side. Your data is safe — try again in a moment." | The one place "something went wrong" is allowed — with ownership ("on our side") and recovery. |
| timeout | "This is taking longer than expected. Try again, or check back in a few minutes." | From 03 §3 spinner timeout. |
| file too large / wrong type | "This file is too large. Maximum size is {n} MB." / "This file type isn't supported. Use {list}." | State the limit, always. |

### 6.2 Field-level validation copy patterns

- State the requirement, not the failure: ✅ "Enter a valid email address" ❌ "Invalid email".
- Include the constraint: "Password must be at least 12 characters", "Price must be at least US$1.00", "Title can't be longer than 80 characters".
- Required: "Enter a {field}" / "Select a {field}" / "Choose at least one {thing}" — not "This field is required" when the field name fits.
- Uniqueness: "This {store name} is already taken. Try another." — offer alternatives when cheap.
- One message per field, the most important first. No stacking.
- Success confirmation on a field only where it resolves anxiety (username available, card recognized): "Available" / card brand icon — not a green tick on every valid field.

### 6.3 Error Page copy (screen-level)

| Page | Title | Body | Actions |
|---|---|---|---|
| 404 | Page not found | We can't find that page. It may have moved or been deleted. | Go to dashboard · Back |
| 403 | You don't have access | This page is restricted. If you think you should have access, contact an admin. | Go to dashboard |
| 500 | Something went wrong on our side | Your data is safe. We've been notified — try again in a moment. | Try again · Go to dashboard |
| Maintenance Banner / page | Scheduled maintenance | Flexa is briefly down for maintenance. Back by {time} ({timezone}). | — |
| Offline State | You're offline | Changes you make will sync when your connection is back. | — |

Error Pages never show cartoon despair or long apologies; one calm sentence of ownership + a way forward (03 §8 no dead ends).

---

## 7. Confirmation dialogs

Structure (03 §5 owns *when*; this owns the words):

- **Title** = verb + object, as a question: "Delete listing?", "Cancel this order?", "Release funds to {seller}?"
- **Body** = the concrete consequence, numbers included: "This permanently deletes 'Vintage lamp' and its 3 drafts. Buyers can no longer see it. You can restore it from Trash for 30 days."
- **Buttons** = the verb (danger tone if destructive) + "Cancel": [Cancel] [Delete listing]. Never "Yes"/"No"/"OK"/"Confirm".

Examples:

> **Delete listing?**
> This deletes "Vintage lamp". It disappears from search immediately. You can restore it from Trash for 30 days.
> [Cancel] [Delete listing]

> **Release funds to Anna's Ceramics?**
> US$120.00 will be released from escrow and included in the seller's next payout. This cannot be undone.
> [Cancel] [Release US$120.00]

Type-to-confirm variant (03 §5 rung 3): body adds the instruction with the exact string highlighted —

> **Delete your account?**
> This permanently deletes your account, 14 listings, and all conversations after a 30-day recovery period. Type **anna-ceramics** to confirm.
> [Cancel] [Delete account] *(disabled until match)*

Rules: undo-able actions get NO dialog (03 §5 rung 1); a dialog body must add information the user doesn't already have — a dialog that only repeats the button is a defect ("Naked 'Are you sure?'", 03 §15.14).

---

## 8. Toasts & notifications

**Toast:** ≤ 60 characters, object named, one clause. Verb in past tense for done ("Listing published"), progressive for started ("Export started — we'll notify you"). Undo toasts: "{Object} deleted · Undo".

**Notification Center entries:** actor + event + object, deep-linked (03 §12). Timestamps relative < 7 days ("2h ago"), absolute after (§10).

Templates per webhook event name (README API conventions — `domain.event`):

| Event | In-app notification copy | Toast (if user in-app) |
|---|---|---|
| `order.paid` | "{Buyer} paid US$120.00 for 'Vintage lamp' — funds held in escrow" | "New order · US$120.00" |
| `order.delivered` | "Your order 'Vintage lamp' was delivered — confirm to release funds" | "Order delivered — confirm receipt" |
| `order.cancelled` | "Order #1042 was cancelled. You haven't been charged" / seller: "…was cancelled before shipping" | "Order #1042 cancelled" |
| `escrow.released` | "US$120.00 released from escrow for order #1042 — included in your next payout" | "Funds released · US$120.00" |
| `payout.sent` | "Payout of US$450.00 sent to your bank account ending 4821 — arrives in 1–3 business days" | "Payout sent · US$450.00" |
| `refund.issued` | "US$45.00 refunded for order #1042 — back on your card in 5–10 business days" | "Refund issued · US$45.00" |
| `dispute.opened` | "{Buyer} opened a dispute on order #1042 — respond by 18 Mar" | "Dispute opened on order #1042" |
| `dispute.resolved` | "Dispute on order #1042 was resolved: refund of US$45.00 to the buyer" | "Dispute resolved" |
| `message.created` | "{Name}: {first ~80 chars of message…}" (collapse same-conversation: "{Name} sent 3 messages") | "New message from {Name}" |
| `listing.approved` | "'Vintage lamp' was approved and is now live" | "Listing approved — it's live" |
| `listing.rejected` | "'Vintage lamp' wasn't approved: {reason}. Edit and resubmit" | "Listing not approved" |
| `review.created` | "{Buyer} left a {n}-star review on 'Vintage lamp'" | "New review · {n} stars" |

Rules: never toast success for instant visible changes (03 §12); rejection copy always carries the reason and the recovery verb; money notifications always carry amount + currency and land in email too (03 §12 batching rules).

### 8.1 Email subjects

Subjects front-load the event and the object; ≤ 60 characters; no "Re:", no brackets, no emoji in transactional mail.

| Event | Subject |
|---|---|
| `order.paid` (to seller) | New order: Vintage lamp — US$120.00 |
| `order.delivered` (to buyer) | Your order was delivered: Vintage lamp |
| `escrow.released` (to seller) | Funds released: US$120.00 for order #1042 |
| `payout.sent` | Payout sent: US$450.00 |
| `refund.issued` | Refund issued: US$45.00 for order #1042 |
| `dispute.opened` | Dispute opened on order #1042 — respond by 18 Mar |
| `message.created` (digest) | 5 new messages on Flexa Marketplace |
| Security (new sign-in, password change) | New sign-in to your Flexa account |

Digest rules: only `message.created` and non-money activity may digest; money, dispute, and security events always send individually and immediately (03 §12). Email body repeats the full context — never assume the recipient saw the in-app notification.

---

## 9. Escrow & money language

Money copy is legally sensitive. Precision beats brevity.

- **State names match the Payment Status component** (see 02-ui-kit/commerce.md) exactly, everywhere — timeline steps, badges, notifications, emails: `Awaiting payment → Paid — in escrow → Released → Paid out` (+ terminal branches `Refunded`, `Cancelled`, `In dispute`). Never paraphrase a state ("money is on the way" ❌).
- **Always show currency** with every amount: "US$120.00", never "$120" or "120". Format per §10. Fees and totals itemized before any money CTA (Checkout Summary): price, fees, taxes, total — no surprise lines after payment.
- **Say who holds the money and what unlocks it:** "US$120.00 is held in escrow until the buyer confirms delivery (or automatically on 21 Mar)."
- **Date + time with timezone for money events:** "Released 14 Mar 2026, 09:12 (UTC+7)". Audit and Admin surfaces always show absolute timestamps.
- **NEVER "soon", "shortly", or "in a few days" for money.** Give a date or a range: "arrives in 1–3 business days", "by 21 Mar". If the platform doesn't know, say who does: "Your bank may take 5–10 business days to show the refund."
- Failed payment copy MUST state whether the user was charged (§6.1 `payment_failed`).
- Direction is explicit: payout = seller receives; refund = buyer receives (§3). "You'll receive" / "You'll be charged" — never ambiguous "the payment will be processed".
- No exclamation marks, no celebration in money copy. "Payout sent" is the whole party.

### 9.1 Payment Status states — label + one-line explanation per persona

Labels are the badge text (1–2 words, §11); explanations appear on Order Detail next to the Escrow Timeline step.

| State label | Buyer sees | Seller sees |
|---|---|---|
| Awaiting payment | Complete checkout to place this order. | The buyer hasn't completed payment yet. |
| Paid — in escrow | We're holding your US$120.00 until you confirm delivery (or automatically on {date}). | The buyer paid. US$120.00 is held in escrow until delivery is confirmed. |
| Released | Funds were released to the seller on {date}. | US$120.00 was released on {date} — it's included in your next payout. |
| Paid out | — | US$120.00 was paid out on {date} to the account ending {last4}. |
| Refunded | US$45.00 was refunded on {date}. Your bank may take 5–10 business days to show it. | US$45.00 was refunded to the buyer on {date}. |
| In dispute | Funds stay in escrow while the dispute is open. | Funds stay in escrow while the dispute is open. Respond by {date}. |
| Cancelled | This order was cancelled on {date}. You haven't been charged / You were refunded {amount}. *(pick the true one)* | This order was cancelled on {date}. |

Rule: the explanation always names the amount, the holder ("we're holding"), and the unlock condition or date — the three questions users actually have about escrow.

---

## 10. Dates, numbers, currency, truncation, i18n

**Dates & times**

- Relative for recency ("just now", "5m ago", "2h ago", "yesterday") up to 7 days, absolute after: "14 Mar 2026". Hovering/focusing a relative time reveals the absolute one.
- Absolute format: `D MMM YYYY`, add time `HH:mm` (24h default, locale-driven) when it matters; timezone shown for money, deadlines, and audit events (§9).
- Deadlines are absolute + relative together: "Respond by 18 Mar (3 days left)".
- Never numeric-only dates like 03/04/2026 (ambiguous across locales).

**Numbers**

- Thousands separators per locale ("12,480"). Compact only in dashboards/Metric Card ("12.4K") with the exact value on hover/focus; never compact money.
- Units with a space and abbreviated: "2.4 MB", "3 km". Percent tight: "85%".

**Currency**

- API money = integer minor units + ISO-4217 (README); UI always formats to the currency's decimals with symbol/code disambiguated where multiple dollar currencies can appear ("US$", "CA$"). Always two decimals for decimal currencies even when zero: "US$120.00".
- Negative amounts as "−US$45.00", tone `danger` only in ledger contexts.

**Truncation**

- Truncate with a single ellipsis; full value available via tooltip/focus (11 owns announcement). Middle-truncate identifiers where the ending disambiguates ("inv_84…f2"). Never truncate: amounts, dates, status labels, or button labels — redesign instead.
- Line clamp: titles ≤ 2 lines, descriptions in cards ≤ 3 lines.

**i18n**

- **No concatenated sentences.** Never build copy from fragments + variables glued in code order — grammar breaks in translation. One complete template string per message.
- **Named variables** in placeholders: `{buyerName} paid {amount} for {listingTitle}` — never positional `%s`/`{0}`.
- Design for **+30% text length** (German test): buttons, badges, tabs, and nav must not break at +30%; truncation rules above are the safety valve, not the plan.
- Pluralization via proper plural rules ("1 item" / "2 items" — and languages with more forms), never "item(s)".
- Don't embed direction- or word-order-dependent punctuation in code; the full string lives in the translation layer, including its punctuation.

---

## 11. Microcopy miscellany

- **Placeholders are examples, not instructions:** ✅ `e.g. Vintage ceramic table lamp` ❌ `Enter your title here`. Placeholders never carry required information (they vanish on input) and never act as labels (03 §10).
- **Help text** sits under the field, one sentence, only where a real question exists: "Buyers see this name on your public profile." Constraints go in help text *before* the user errs ("Up to 10 photos, 5 MB each"), not only in the error.
- **Tooltips ≤ 8 words**, fragments, no periods: "Copy listing link". Tooltips clarify controls; they never hide essential instructions or errors (mystery meat, 03 §15.1).
- **Badges & status labels: 1–2 words**, sentence case, noun or past participle: "Draft", "In escrow", "Paid out", "Action needed". Never sentences in badges.
- **Section titles**: noun phrases ("Payout account"), no verbs, no colons.
- **Checkbox/switch labels** state the ON meaning positively: ✅ "Email me about new orders" ❌ "Don't send emails". A switch's label never changes with its state.
- **Loading labels** name the work when > 1s: "Loading orders…", "Generating report…" — bare "Loading…" only for whole-view loads.
- **AI microcopy:** label outputs ("AI-suggested"), verbs are proposals ("Suggest", "Draft", never "Fix"), uncertainty stated plainly ("This may be inaccurate — review before sending"), and human confirmation verbs on Approve/Reject Panel are "Apply" / "Dismiss" (not "Accept the AI").
- **Character counters** appear at 80% of the limit: "12 characters left".
- **Authentication microcopy** (Sign In / Sign Up / Forgot Password / Email Verification screens):

| Element | Copy |
|---|---|
| Sign In title | Sign in to Flexa |
| Sign In primary CTA | Sign in |
| Sign Up link under sign-in | New to Flexa? Create an account |
| Wrong credentials | "Email or password is incorrect." — one combined message; never reveal which was wrong. |
| Forgot Password link | Forgot password? |
| Reset email sent | "If an account exists for {email}, we sent a reset link. Check your inbox." — never confirm account existence. |
| Email Verification prompt | "We sent a verification link to {email}. It expires in 24 hours." + "Resend link" |
| Session expiring | "Your session ends in {n} minutes." + "Stay signed in" (03 §1.4 A6) |
- **Keyboard hints** in menus/tooltips use key symbols per 11's conventions, never prose ("Ctrl+K", not "press control and K").

---

## 12. Admin & support copy

Admin surfaces (personas Admin, restricted-role support) relax exactly two rules and nothing else:

- Machine detail is allowed in a muted, copyable line: error code, request id, webhook event name, queue/job ids (§6). End-user surfaces never show these.
- Density of language may increase: Audit Log and System Logs entries use compact actor–verb–object lines ("admin.k.tran refunded US$45.00 on order #1042").

Everything else holds: sentence case, terminology dictionary, no blame, precise money language. Admin copy about *users* stays respectful — logs and moderation notes may be read back to those users in disputes or data requests.

Moderation verdict copy (Listings Moderation, Disputes Queue) must be reason-bearing and templated, never free-form-only: "Rejected: prohibited item category" with an optional note. The reason reaches the seller verbatim (§8 `listing.rejected`) — write it to be read by them.

## 13. Words we never use

Banned in all UI copy, any persona:

- "Oops", "Uh oh", "Whoops" — errors are not cute (§6).
- "Something went wrong" as a complete message — allowed only in the 5xx template with ownership + recovery (§6.1).
- "Soon", "shortly", "in a few days" for money (§9).
- "Invalid" addressed at the user's input without the requirement (§6.2).
- "Are you sure?" as a dialog title (§7).
- "Click here", "here" as link text (§4).
- "Simply", "just", "easy", "obviously" — if it were, we wouldn't be explaining.
- "Fatal", "illegal", "abort", "kill", "execute" — violence-flavored technical jargon.
- "Fail" aimed at the user ("You failed to…") — the system failed to, or better, state the fix.
- Marketing superlatives in product UI ("amazing", "awesome", "supercharge").

## 14. Copy review checklist

Run on every screen spec and PR that adds user-facing text:

1. Every term checked against the dictionary (§3) — no forbidden synonyms?
2. Sentence case everywhere; no exclamation marks in errors/money; no banned words (§13)?
3. Every button verb-first and specific; destructive CTAs name the object; no Yes/No (§4)?
4. Empty states follow the formula with a persona-valid CTA (§5)?
5. Errors state what happened + recovery in ≤ 2 sentences; money errors state whether money moved; no codes leaked to end users (§6)?
6. Dialogs: verb+object title, consequence body, verb buttons (§7)?
7. Toasts ≤ 60 chars; notifications actor+event+object and deep-linked (§8)?
8. Money: currency always shown, states match Payment Status labels, dates absolute with timezone (§9)?
9. Formatting: dates/numbers/truncation per §10; strings are complete templates with named variables, +30% length safe?
10. Placeholders are examples; tooltips ≤ 8 words; badges 1–2 words (§11)?

---

*One term per concept, one owner per rule. If a needed word or message template is missing here, add it to this document first — never invent it in a screen spec.*
