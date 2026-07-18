# 02 — UI Kit · Forms

> Design-facing catalog for all 29 form components. Props/events/ARIA contracts live in 04; accessibility detail in 11; microcopy (labels, errors, helper text wording) in 10; interaction thresholds and autosave policy in 03. Tokens by FDS id only (see 01).

## Design rationale

Forms are where SaaS products earn or lose trust. The Flexa doctrine: **one obvious path through every form** — always-visible labels, one column, validation that speaks at the right moment (on blur, not on keystroke), and errors that tell the user what to do next, not what they did wrong. Every text-like control shares one anatomy and one sizing scale so that a form composed of ten different components still reads as one instrument. Whitespace over borders: fields separate by `space.6` rhythm, not by boxes around boxes.

## Component hierarchy

```
Form
└── Form Wizard (multi-step container)
    └── Field Group (fieldset: related fields, one legend)
        └── Field (anatomy below)
            ├── text-like: Input, Textarea, Number/Password/Email/Phone/URL/Currency Input
            ├── temporal:  Date Picker, Time Picker, Date Range Picker
            ├── choice:    Select, Autocomplete, Tag Input, Checkbox, Radio Group, Switch
            ├── numeric:   Slider, Stepper
            ├── media:     Color Picker, File Upload, Drag & Drop Upload, Avatar Upload, Image Gallery Upload
            ├── rich:      Rich Text Editor, Markdown Editor
            └── Validation Message (attached to any of the above)
```

---

## Cross-cutting rules (binding for every form component)

### Field anatomy

```
Label *                          ← text.label, color.text; required mark color.danger
[ control                      ] ← height per size; radius.md; border.1 color.border
Help text                        ← text.body-sm, color.text-muted
Error message                    ← text.body-sm, color.danger + icon (replaces help text)
```

- **Error replaces help text — never show both.** One message slot below the control; error wins. Restore help text when the error clears.
- Label → control gap `space.1`; control → message gap `space.1`; field → field gap `space.6` (compact density: `space.4`).
- Required mark: `*` after the label in `color.danger`. If most fields are required, mark the *optional* ones with "(optional)" instead — pick one convention per form, never mix.

### Label rules

- **Every control has a visible label.** Placeholder is never the label — it disappears on input and fails recall. Placeholder is optional example content in `color.text-subtle` ("e.g. jane@acme.com").
- Labels above the control (single column default). Side labels only in dense admin/settings tables on Desktop+, aligned to a fixed label column.
- Sentence case, no trailing colon, no colon-plus-asterisk stacking. Wording rules: see 10.

### Validation doctrine

1. **Validate on blur** (first exit of the field). Never on first keystroke.
2. After a field has errored once, **re-validate on change** so the error clears the moment input becomes valid.
3. **Submit gathers all errors:** validate every field, render each Inline/Validation Message, and show an **error summary** (Alert, tone `danger`, see `feedback.md`) at the top of the form listing each errored field as a link that moves focus to it (see 11 for focus contract).
4. Async validation (username taken, coupon valid) shows the field's `loading` state and must not block typing.
5. Success ticks (`color.success` icon inside the control) are reserved for high-stakes async confirmations (verified domain, valid VAT id) — not for every filled field.

### Sizing

| Size | Control height | Use |
|---|---|---|
| `sm` | 32px | dense admin tables, toolbars, inline edit |
| `md` | 40px | default everywhere |
| `lg` | 48px | marketing/auth pages, mobile-first checkout |

Text always `text.body` (sm may use `text.body-sm`); padding-x `space.3` (sm: `space.2`, lg: `space.4`). Touch target ≥ 44×44 on Mobile regardless of visual size (11 owns the rule).

### Input groups & addons

A text-like control may carry: **leading/trailing icon** (inside, `color.text-muted`), **prefix/suffix addon** (attached segment, `color.surface-alt` background, e.g. `https://`, `.com`, currency code), or **attached button** (trailing, `secondary` variant, e.g. Copy, Search). Group renders as one visual control: one `radius.md` outline around the whole group, inner separators `border.1 color.border`, and one shared focus ring `color.focus-ring` when any part is focused. Addons are non-interactive text unless explicitly a button.

### Form layout

- **Single column is the default and the strong recommendation.** Max form width `size.container-sm` (640px); wider forms measurably increase completion errors.
- Two columns allowed only for pairs the user perceives as one fact — first/last name, city/postal code, card expiry/CVC — and collapse to one column on Mobile.
- Primary action bottom-left of the form (LTR), `primary` variant; secondary/cancel beside it as `ghost`. Sticky action bar only in full-page editors and Form Wizard.
- Destructive actions never sit adjacent to submit.

### Autosave vs explicit save

Settings-style screens may autosave per field (with per-field saved indicator); document-style editors use explicit Save with dirty-state guard. Decision table, debounce timing, and unsaved-changes dialog: **see 03 § Save models**.

---

## Components

### Input

- **Purpose.** Single-line free-text entry; the base control every text-like field inherits from.
- **Use when** the value is one short line: names, titles, search terms, identifiers.
- **Not when** the value is multi-line (Textarea), constrained to a known set (Select/Autocomplete), or typed (use the typed inputs below — they buy format, keyboard, and validation for free).
- **Variants.** Default; with leading/trailing icon; with prefix/suffix addon; with attached button; with character counter (shows at ≥80% of max, `color.text-muted` → `color.danger` when exceeded).
- **Properties (design-level).** `size sm|md|lg` · `placeholder` · `maxLength` · `clearable` (trailing ✕ appears when non-empty) · addon slots.
- **States.** default (`color.surface` bg, `border.1 color.border`) · hover (`color.border-strong`) · focus (2px `color.focus-ring` ring, border unchanged) · disabled (`opacity.disabled`, no hover, `color.text-subtle` value) · loading (trailing spinner, async validation only) · error (`color.danger` border + Validation Message) · success (trailing `color.success` tick, high-stakes only) · warning (`color.warning` border; non-blocking caution, e.g. "unusually long").
- **Responsive.** Full width of its column at all ranges; `lg` recommended on Mobile forms; font-size ≥ 1rem on Mobile to prevent zoom-on-focus.
- **Best practices.** Match width to expected content length (a ZIP field spanning 640px reads wrong — cap with intrinsic width classes). Use `clearable` on filter/search inputs only.
- **Common mistakes.** Placeholder as label; validating on keystroke; disabling paste; masking input formats the user must then fight (auto-insert, don't block).

### Textarea

- **Purpose.** Multi-line free text: descriptions, messages, notes.
- **Use when** the expected value exceeds one line or benefits from visible drafting space.
- **Not when** you need formatting (Rich Text/Markdown Editor) or the value is short (Input).
- **Variants.** Fixed rows; auto-grow (grows to `maxRows`, then scrolls); with counter.
- **Properties.** `rows` (default 3) · `maxRows` · `maxLength` + counter · resize: vertical only, never horizontal (breaks layout).
- **States.** As Input; loading state not applicable (no async textarea validation inline — validate on blur/submit).
- **Responsive.** Full width; on Mobile start at `rows=4` for message composition contexts.
- **Best practices.** Auto-grow for chat/comment composers; fixed rows for form fields. Show the counter only when a limit exists and matters.
- **Common mistakes.** Horizontal resize enabled; tiny 1-row textareas that hide the user's own text; using Textarea for structured lists (use Tag Input or repeatable Field Group).

### Number Input

- **Purpose.** Numeric entry with increment affordance.
- **Use when** the value is a number the user may type or nudge: quantities, limits, ports.
- **Not when** money (Currency Input), a bounded coarse choice (Slider), or a count adjusted only by ±1 in context (Stepper).
- **Variants.** Plain (no steppers, typing only); with stepper buttons (trailing ▲▼ or ±, stacked or split); with unit suffix addon ("kg", "%").
- **Properties.** `min/max/step` · `precision` (decimal places, formatted on blur) · locale-aware thousands/decimal separators.
- **States.** As Input; additionally stepper buttons individually disable at min/max; error when typed value out of range (clamp on blur is allowed only when announced — see 11).
- **Responsive.** Numeric keyboard on Mobile; stepper buttons grow to 44px touch targets.
- **Best practices.** Right-align the numeric value. Accept pasted formatted numbers ("1,000") and normalize.
- **Common mistakes.** Scroll-wheel changing the value while the page scrolls (disable); silently clamping; using it for phone/credit-card "numbers" (they're strings — use Phone Input/Input).

### Password Input

- **Purpose.** Masked secret entry.
- **Use when** collecting passwords, API secrets, tokens.
- **Not when** the value is not secret (masking harms accuracy) — PINs sent via SMS may use Input with `inputmode=numeric`.
- **Variants.** With visibility toggle (trailing eye button — always present for passwords); with strength meter (Progress, 4 segments mapping weak→strong to `color.danger/warning/info/success`) on *create/change* only, never on sign-in.
- **Properties.** `revealable` (default true) · strength rules pointer (rules text in help slot) · no `clearable`.
- **States.** As Input. Caps-lock warning as `warning` state help-line replacement.
- **Responsive.** No autocapitalize/autocorrect; toggle ≥44px on Mobile.
- **Best practices.** Allow paste (password managers). New-password fields state the rules *before* the first error. Sign-in forms: one generic error on the form, not per-field ("Email or password is incorrect" — see 10).
- **Common mistakes.** Blocking paste; strength meter on sign-in; revealing without explicit user action.

### Email Input

- **Purpose.** Input specialized for email addresses.
- **Use / Not.** Any email field; never as a free-text fallback.
- **Variants.** Default; with domain suggestion ("did you mean **gmail.com**?" as inline `warning`, one-tap accept).
- **Properties.** Inherits Input; email keyboard on Mobile; trims whitespace; lowercases on blur.
- **States.** As Input; format validated on blur (syntactic only — deliverability is a server concern surfaced as async error).
- **Responsive / Best practices / Mistakes.** As Input. Don't reject plus-addressing or long TLDs; don't split user/domain into two fields.

### Phone Input

- **Purpose.** Telephone entry with country context.
- **Use when** you will actually call/SMS the number (2FA, delivery).
- **Not when** it's optional decoration — drop the field instead.
- **Variants.** With country selector (leading addon: flag + dial code, searchable dropdown); national-only (single known country).
- **Properties.** Default country from locale; as-you-type national formatting (auto-insert spaces, never block digits); stores E.164 (design shows formatted).
- **States.** As Input; error on impossible number length for the selected country.
- **Responsive.** Tel keyboard on Mobile; country selector opens as sheet on Mobile, popover (`z.popover`) on Desktop.
- **Best practices.** Country selector is an addon inside the group (one focus ring). Validate length, not "looks like my country's format".
- **Common mistakes.** Two separate fields for code + number; forcing a mask that fights paste.

### URL Input

- **Purpose.** Web address entry.
- **Use when** collecting links (website, social, webhook endpoints).
- **Variants.** With `https://` prefix addon (user types the rest — recommended); plain.
- **Properties.** Inherits Input; URL keyboard on Mobile; auto-prepend scheme on blur when missing; optional favicon preview (trailing) after successful async check.
- **States.** As Input; `loading` during reachability check (only when the product actually checks).
- **Best practices / Mistakes.** Show the prefix addon rather than erroring on missing scheme. Don't require trailing slashes or reject query strings.

### Currency Input

- **Purpose.** Monetary amount entry, locale- and currency-aware.
- **Use when** any money amount: prices, budgets, payouts.
- **Not when** the value is a plain number or a percentage (Number Input).
- **Variants.** Fixed currency (suffix or prefix addon shows ISO code/symbol); selectable currency (trailing Select addon, only in genuinely multi-currency contexts).
- **Properties.** Currency (drives symbol, decimal places — 0 for JPY, 2 for USD) · formats with thousands separators on blur · stores integer minor units (API contract: see 09 conventions in README).
- **States.** As Input; error below minimum ("Minimum payout is …" — see 10 for wording); right-aligned value.
- **Responsive.** Decimal keyboard on Mobile.
- **Best practices.** Symbol as addon, never inside the editable text. Show the resolved formatted amount on blur.
- **Common mistakes.** Storing floats; letting users type the symbol; hiding which currency applies.

### Date Picker

- **Purpose.** Select a single calendar date.
- **Use when** the user picks a known-ish date (deadline, birthday, publish date).
- **Not when** a range (Date Range Picker), time only (Time Picker), or approximate period (Select of presets).
- **Variants.** Input + calendar popover (default; typing allowed, format hint as placeholder); inline calendar (always-open, embedded in filters/sheets); with preset shortcuts column ("Today", "Tomorrow", "Next Monday").
- **Properties.** `min/max` date · disabled dates/weekdays · locale (first day of week, format) · month/year fast-jump dropdowns.
- **States.** Control states as Input. Calendar cell states: default · hover (`color.surface-alt`) · focus (ring) · selected (`color.primary` bg, `color.on-primary` text) · today (outlined) · disabled (`color.text-subtle`, no hover).
- **Responsive.** Popover (`z.popover`) on Desktop/Tablet; full-width bottom sheet on Mobile. Typing remains available at all ranges.
- **Best practices.** Always allow typed entry with a visible format hint; birthdays should prefer typed entry (calendar-paging to 1987 is hostile).
- **Common mistakes.** Calendar-only entry; ambiguous formats without a hint (01/02/03); opening the popover on focus so keyboard users get trapped (open on click/↓ — see 11).

### Time Picker

- **Purpose.** Select a time of day.
- **Use when** scheduling within a day (booking slot, reminder time).
- **Not when** durations (two fields or a Number Input + unit) or timestamps down to seconds (Input with mask).
- **Variants.** Typed input with dropdown of intervals (default; 15/30-min steps); paired hour/minute selects (compact admin); 12h/24h per locale.
- **Properties.** `step` interval · `min/max` time · timezone label suffix when it matters (render the tz — never guess silently).
- **States.** As Input; unavailable slots disabled in the dropdown.
- **Responsive.** Native-feel wheel/sheet on Mobile; dropdown on Desktop.
- **Best practices.** Snap typed values to the nearest valid step on blur, announced. Pair with Date Picker as one Field Group when both are needed.
- **Common mistakes.** Second-precision UI for hour-precision decisions; hiding the timezone on cross-tz products.

### Date Range Picker

- **Purpose.** Select a start and end date as one value.
- **Use when** the range is one decision: report period, stay dates, promotion window.
- **Not when** start and end are decided at different times or by different actors (two Date Pickers).
- **Variants.** Dual-calendar popover with presets (default, Desktop); single-calendar two-tap (Mobile); with comparison toggle ("vs previous period", analytics only).
- **Properties.** `min/max` · max range length · preset list (Today, Last 7/30 days, This month, Custom) · two typed inputs (start/end) bound to the calendars.

```
┌ Presets ──┬─────────  Jun 2026  ─────────┬─────────  Jul 2026  ─────────┐
│ Today     │  M  T  W  T  F  S  S         │  M  T  W  T  F  S  S         │
│ Last 7d   │  1  2  3  4  5  6  7         │        1  2  3  4  5         │
│ Last 30d  │  8  9 [10]▓▓▓▓▓▓▓▓▓▓         │ ▓▓▓▓▓▓▓▓▓[11] 12 13          │
│ This mo   │ 15 16 17 18 19 20 21         │ 14 15 16 17 18 19 20         │
│ Custom    │ …                            │ …                            │
├───────────┴──────────────────────────────┴──────────────────────────────┤
│ [ 2026-06-10 ] → [ 2026-07-11 ]                     [Cancel]  [Apply]    │
└──────────────────────────────────────────────────────────────────────────┘
▓ = in-range fill (color.primary at low emphasis), [n] = endpoints (color.primary/on-primary)
```

- **States.** Endpoints selected (`color.primary`); in-range fill (primary-tinted `color.surface-alt` treatment); hover previews the prospective range; invalid (end before start) blocks Apply with Validation Message.
- **Responsive.** Desktop/Tablet: dual-month popover as above. Mobile: full-screen sheet, one month, vertical scroll through months, sticky Apply.
- **Best practices.** Presets first — most users want a canned period. Apply/Cancel commit model (no live-applying half-selected ranges to a dashboard).
- **Common mistakes.** No typed entry; auto-applying after the first tap; unclear whether the end date is inclusive (state it — see 10).

### Select

- **Purpose.** Choose one option from a closed list.
- **Use when** 5–15 known options and the user recognizes rather than recalls.
- **Not when** ≤4 options visible at once matters (Radio Group), >15 options (Autocomplete), or multiple choice (Tag Input / checkbox list).
- **Variants.** Default; with option descriptions (two-line options); with option icons/avatars; grouped options (labelled sections); multi-select (checkbox options + count summary in trigger — prefer Tag Input when chosen items must stay visible).
- **Properties.** `size` · `placeholder` ("Select …", `color.text-subtle`) · `clearable` (optional-value selects only) · option = label + optional description/icon/disabled.
- **States.** Trigger states as Input; open (chevron rotates, listbox on `z.dropdown`, selected option checked `color.primary`); loading (options fetching — spinner in listbox); empty (listbox shows "No options" — see Empty State doctrine in `data-display.md`); error/warning as Input.
- **Responsive.** Listbox popover Desktop/Tablet; bottom sheet on Mobile with search when >10 options.
- **Best practices.** Sensible default preselected when one exists; order options by likelihood or alphabet, never randomly; keep option labels parallel in form (see 10).
- **Common mistakes.** Select for binary choices (Switch/Checkbox); 40-option selects with no search; placeholder that looks like a selection.

### Autocomplete

- **Purpose.** Choose from a large or remote dataset by typing to filter.
- **Use when** >15 options, remote lookup (users, products, addresses), or recall-by-typing beats scanning.
- **Not when** the list is small and stable (Select) or free text is acceptable (Input — Autocomplete implies the value must match an option unless `allowCustom`).
- **Variants.** Single; multi (chips accumulate in the control — converges with Tag Input, see below); `allowCustom` ("Create '…'" row appends); with recent/suggested section before typing.
- **Properties.** `minChars` before querying (default 1–2) · debounce (see 03 § thresholds) · highlight of matched substring · option template (avatar + label + meta).
- **States.** As Input, plus: loading (spinner replaces chevron while querying) · empty ("No results for '…'" + optional create action) · error (query failed — retry row inside the listbox, never a Toast).
- **Responsive.** As Select (sheet + keyboard on Mobile).
- **Best practices.** Keep the typed text until the user picks (never auto-select first match on blur without showing it); show total-ish counts for huge sets ("Showing 20 of 400 — keep typing").
- **Common mistakes.** Searching on every keystroke with no debounce; clearing input on blur; listbox that jumps while results stream in.

### Tag Input

- **Purpose.** Enter multiple values as removable chips.
- **Use when** the value is a set: tags, emails to invite, SKUs, keywords.
- **Not when** exactly one value (Autocomplete/Select) or the set is chosen from ≤7 fixed options (checkbox list).
- **Variants.** Free entry (commit on Enter/comma/paste-split); suggestion-backed (Autocomplete-driven, optionally `allowCustom:false`); with max count; with per-tag validation (invalid tag renders `color.danger` chip, whole field errors).
- **Properties.** Delimiters · `maxTags` + counter · dedupe (silently merge, flash the existing chip) · paste splitting ("a, b; c" → 3 chips).
- **States.** As Input; each chip: default · hover (remove ✕ emphasized) · focus (keyboard: ←/→ traverse chips, Backspace removes last — see 11) · error (invalid chip).
- **Responsive.** Chips wrap; control grows vertically; comfortable chip height ≥ 28px, touch remove targets ≥44px on Mobile.
- **Best practices.** Show remaining count when `maxTags` set; validate per-chip so one bad email doesn't nuke ten good ones.
- **Common mistakes.** Losing an uncommitted trailing token on blur (commit it); chips without visible remove affordance.

### Checkbox

- **Purpose.** Independent boolean or one item in a multi-choice list.
- **Use when** an on/off fact that takes effect on *submit* (contrast Switch), or lists of independent selections.
- **Not when** mutually exclusive options (Radio Group) or instant-effect settings (Switch).
- **Variants.** Single with label; with description line; indeterminate (parent of a partially-selected list — only ever set programmatically); checkbox card (whole bordered card is the target, for weighty choices).
- **Properties.** Label right of the box (never left); optional description `text.body-sm color.text-muted`; group with select-all parent.
- **States.** unchecked/checked/indeterminate × default·hover·focus·disabled; error (group-level: "Pick at least one" as one Validation Message under the group, boxes get `color.danger` border).
- **Responsive.** Entire label row is clickable; row height ≥44px on Mobile.
- **Best practices.** Positive phrasing ("Send me updates", never "Don't not send…"); one concept per box.
- **Common mistakes.** Checkbox that saves instantly (that's a Switch); consent checkbox pre-checked; indeterminate used as a third user-selectable value.

### Radio Group

- **Purpose.** Choose exactly one of 2–6 visible, mutually exclusive options.
- **Use when** users benefit from seeing all options at once (plans, shipping speed, visibility).
- **Not when** >6 options (Select), non-exclusive (Checkbox), or binary instant toggle (Switch).
- **Variants.** Vertical list (default); horizontal (2–3 short options); with descriptions; radio cards (bordered selectable cards with title/description/price — checkout, plan pickers); segmented control style (compact, toolbar filters only).
- **Properties.** One always selected once touched; a sensible default preselected unless the choice is consequential (billing) — then start unselected and require choice.
- **States.** Per option as Checkbox; group error below the group; selected card: `border.2 color.primary`.
- **Responsive.** Horizontal collapses to vertical on Mobile; cards stack.
- **Best practices.** Order by recommendation or price; mark the recommended option with a Badge, don't just pre-select silently.
- **Common mistakes.** Radios for actions (use buttons); one lonely radio; option labels that require reading all descriptions to differ.

### Switch

- **Purpose.** Instant-effect on/off setting.
- **Use when** flipping it applies immediately (notifications on, maintenance mode) — usually with autosave (see 03).
- **Not when** the change needs Submit (Checkbox) or has heavy consequences needing confirmation (Switch + Confirmation Dialog is acceptable for destructive toggles).
- **Variants.** With label left, switch right (settings rows — default); with description; with inline loading (saving state).
- **Properties.** Label states the *thing controlled*, not the current state ("Email notifications", never "On").
- **States.** off/on × default·hover·focus·disabled; loading (brief spinner in thumb while persisting, then success flash or revert + Toast on failure); on track `color.primary`, off track `color.border-strong`.
- **Responsive.** Full settings row tappable on Mobile.
- **Best practices.** Optimistic UI: flip immediately, revert on failure with error Toast (see `feedback.md`).
- **Common mistakes.** Switch inside a submit form (silent no-op until submit = betrayal); ambiguous labels ("Disable notifications" + on = ???).

### Slider

- **Purpose.** Pick a value or range from a continuum where *relative position* matters more than the exact number.
- **Use when** bounded ranges with tolerance: price filter, volume, opacity, radius.
- **Not when** precision matters (Number Input) or the range is huge/unbounded.
- **Variants.** Single thumb; dual-thumb range; with value tooltip on drag; with tick marks/step labels; with linked Number Input (best of both).
- **Properties.** `min/max/step` · formatted value display (always show the current value as text — never position-only) · track fill `color.primary`.
- **States.** default · hover (thumb grows) · focus (ring on thumb) · active/dragging · disabled; keyboard ←/→ steps, PgUp/PgDn ×10 (see 11).
- **Responsive.** Thumb ≥44px touch target on Mobile; consider Number Input fallback for precision on small screens.
- **Best practices.** Pair with a live value label or linked input; logarithmic scale for price-like distributions.
- **Common mistakes.** Slider as the only way to enter an exact number; steps so fine the thumb can't hit them; no visible value.

### Stepper

- **Purpose.** Adjust a small integer by ±1 in context (quantity in cart, guests, seats).
- **Use when** the expected adjustment is a few steps from the current value and bounds are tight (0–20ish).
- **Not when** values may be large or typed (Number Input with steppers).
- **Variants.** `[−] 2 [+]` inline (default); with editable center value; compact `sm` for table rows.
- **Properties.** `min/max/step`; center value read-only or editable; at bounds the respective button disables.
- **States.** Buttons: default·hover·focus·active·disabled; value change animates `motion.duration-fast`; error only via group validation (rare).
- **Responsive.** Buttons ≥44px on Mobile.
- **Best practices.** Long-press to repeat on touch; at `min=0` in cart contexts, − becomes remove (with distinct icon) or disables — pick per product, document in 08.
- **Common mistakes.** Hidden bounds (button just "doesn't work" — disable visibly); using Stepper for prices/years.

### Color Picker

- **Purpose.** Choose a color value.
- **Use when** brand/theming/labels where arbitrary color is legitimate.
- **Not when** a curated palette suffices (swatch Radio Group — most cases!) or color encodes status (tones are fixed by FDS).
- **Variants.** Swatch grid only (curated); swatch + custom popover (saturation area + hue slider + hex/rgb input); with alpha; with eyedropper (where platform supports); with recent colors row.
- **Properties.** Value shown as hex Input beside a live swatch; palette slots accept product-defined swatches.
- **States.** Trigger as Input (swatch + hex); popover on `z.popover`; invalid hex → error on the text input; contrast hint (`warning` when chosen color fails AA against its intended background — mirror of FDS contrast gate, see 11).
- **Responsive.** Popover → sheet on Mobile; eyedropper hidden where unsupported.
- **Best practices.** Curated swatches first, custom behind "Custom…"; always allow paste of a hex value.
- **Common mistakes.** Free color pickers for status colors; no text entry; ignoring contrast consequences.

### File Upload

- **Purpose.** Attach one or more files via browse (and drag on capable devices).
- **Use when** documents/attachments of known types are part of the record.
- **Not when** images needing crop/preview flows (Avatar/Image Gallery Upload) or huge media needing resumable transfer (see 03 § uploads; the design contract here still applies).
- **Variants.** Button-style ("Attach file" secondary button + file list); dropzone-style (see Drag & Drop Upload — the two converge: a dropzone always also offers browse); single vs multiple.
- **Properties.** Accepted types + max size *stated up front in help text* · `multiple` + max count · per-file row: icon by type, name (truncate middle), size, status, remove/retry.

```
┌ Attachments ────────────────────────────────────────────────┐
│  [ ⬆ Attach files ]   PDF, PNG up to 10 MB · max 5 files    │
├──────────────────────────────────────────────────────────────┤
│ 📄 contract-final-v2.pdf      1.2 MB   ✓ Uploaded        ✕  │
│ 🖼 storefront.png             4.8 MB   ▓▓▓▓▓▓░░░░ 62%    ✕  │
│ 📄 receipt.pdf                12.4 MB  ⚠ Too large    Retry │
└──────────────────────────────────────────────────────────────┘
```

- **States.** idle · hover · focus · disabled · **per-file**: uploading (Progress bar + %) · success (✓ `color.success`) · error (reason + Retry — `color.danger`, never just "failed") · canceled; field-level error when required and empty on submit.
- **Responsive.** Full-width rows; browse button `lg` on Mobile (camera/file sheet is the OS's).
- **Best practices.** Validate type/size *client-side before* upload; uploads start immediately on selection (don't wait for form submit); form submit blocks while uploads are in flight, with count ("2 uploading…").
- **Common mistakes.** Constraints revealed only by the error; no per-file retry; losing the list on a full-form validation error.

### Drag & Drop Upload

- **Purpose.** Dropzone-first surface for the same contract as File Upload.
- **Use when** upload is a primary action of the screen (import CSV, add media) and users likely have files ready.
- **Not when** upload is incidental (button-style File Upload) or on touch-only contexts (drag doesn't exist — the zone degrades to a big browse button).
- **Variants.** Full-panel zone (dashed `border.2 color.border`, `radius.lg`); compact strip; whole-screen drop target (window-level overlay appears when a drag enters the viewport, `color.scrim` + "Drop files to upload").
- **Properties.** As File Upload; drop of unaccepted type shows immediate error state on the zone.
- **States.** default (dashed border, icon + "Drag files here or **browse**") · dragover (`color.primary` border, `color.surface-alt` fill — must be visually unmistakable) · rejected-hover (drag of invalid type: `color.danger` border + "File type not accepted") · uploading/success/error per File Upload rows below the zone.
- **Responsive.** Mobile/touch: renders as bordered browse card, no drag affordance language ("Tap to browse").
- **Best practices.** Keep the browse fallback inside the zone always; announce drops for screen readers (see 11).
- **Common mistakes.** "Drag files here" as the only path; dragover state identical to default; nested dropzones fighting for the same drop.

### Avatar Upload

- **Purpose.** Set a single profile/brand image with instant preview and crop.
- **Use when** user/org/product avatar — one square-ish image with a canonical crop.
- **Not when** arbitrary attachments (File Upload) or multi-image (Image Gallery Upload).
- **Variants.** Circle (people) / rounded-square `radius.lg` (orgs, products); sizes per Avatar component scale (see `data-display.md` § Avatar); with remove ("Reset to initials/default").
- **Properties.** Current avatar shown at rest with hover overlay ("Change"); opens crop dialog (zoom slider + drag reposition, fixed aspect); accepted types/size in dialog help text.
- **States.** default (current image or initials fallback) · hover (scrim + camera icon) · focus · uploading (spinner overlay on the avatar) · error (Toast + revert to previous image — the avatar itself never renders broken) · success (new image fades in `motion.duration-normal`).
- **Responsive.** Crop dialog full-screen on Mobile; tap target = whole avatar.
- **Best practices.** Optimistic local preview immediately; keep the old image until the new one is confirmed.
- **Common mistakes.** No crop step (server-center-crop surprises); broken-image state; upload button divorced from the avatar it changes.

### Image Gallery Upload

- **Purpose.** Manage an ordered set of images (product photos, listing gallery).
- **Use when** multiple images where *order matters* and one is the cover.
- **Not when** single image (Avatar Upload) or non-image files (File Upload).
- **Variants.** Grid with add-tile (default); with cover designation (first = cover, badge "Cover"); with per-image alt-text editing (required for storefronts — see 11).

```
┌ Photos (4/10) ──────────────────────────────────────────────┐
│ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌ ─ ─ ─ ─ ┐    │
│ │ IMG ★  │ │ IMG    │ │▓▓ 45%  │ │ ⚠ err  │    +          │
│ │ Cover  │ │ ⠿  ✕   │ │        │ │ Retry ✕│ │  Add    │    │
│ └────────┘ └────────┘ └────────┘ └────────┘ └ ─ ─ ─ ─ ┘    │
│  Drag ⠿ to reorder · first photo is the cover               │
└──────────────────────────────────────────────────────────────┘
```

- **Properties.** Max count + counter ("4/10") · reorder by drag (⠿ handle; keyboard: focus tile → arrow keys move, see 11) · per-tile actions on hover: reorder handle, remove, edit alt · add-tile opens browse/drop.
- **States.** Tile: default · hover (actions revealed) · focus · dragging (lifted, `shadow.lg`, drop slot placeholder) · uploading (Progress overlay) · error (Retry/remove) · empty (whole component renders as Drag & Drop Upload zone with gallery copy).
- **Responsive.** Grid 2-up Mobile / 3–4-up Tablet / 5-up Desktop; reorder via drag on touch with long-press pickup.
- **Best practices.** First position = cover, stated in plain words; upload all selected files in parallel with per-tile progress.
- **Common mistakes.** Reorder only via drag (keyboard path required); cover chosen by a hidden setting instead of position or explicit badge; deleting without undo (offer Toast undo — see `feedback.md`).

### Rich Text Editor

- **Purpose.** WYSIWYG formatted content: descriptions, articles, emails.
- **Use when** end users need formatting without knowing markup.
- **Not when** plain text suffices (Textarea), technical users prefer markup (Markdown Editor), or the output must be strictly constrained (structured fields).
- **Variants.** Full toolbar (block styles, bold/italic, lists, link, image, quote); inline/bubble toolbar (appears on selection — comments, compact contexts); minimal (bold/italic/link only).
- **Properties.** Toolbar grouped by `space.2` separators; allowed formats explicitly configured per context (an email composer has no H1); content area min-height + auto-grow; link editing via popover with URL Input.
- **States.** default · focus (ring on the whole editor frame) · disabled (read-only render, toolbar hidden) · error (frame `color.danger` + Validation Message: "Description is required") · loading (skeleton paragraph lines on content load) · toolbar buttons: default·hover·active(format applied)·disabled.
- **Responsive.** Toolbar wraps into an overflow "⋯" menu on Mobile; sticky toolbar on long content.
- **Best practices.** Fewest formats that serve the content type; paste sanitizes to the allowed set (announce "formatting removed"); autosave for long-form (see 03).
- **Common mistakes.** Full toolbar for one-paragraph fields; unsanitized paste; formatting that has no rendering on the read side.

### Markdown Editor

- **Purpose.** Markup-first editing for technical users with preview.
- **Use when** developer-adjacent products (docs, README-like content, support macros).
- **Not when** the audience doesn't know Markdown (Rich Text Editor).
- **Variants.** Write/Preview tabs (default — GitHub model); side-by-side split (Desktop wide editors); with slim formatting toolbar that inserts syntax.
- **Properties.** Monospace input (`font.family-base` mono stack per 04); supported syntax subset documented next to the editor ("Markdown supported" hint linking help); image/file paste-drop uploads and inserts the link.
- **States.** As Textarea; preview tab shows rendered output with the product's real content styles; empty preview state: "Nothing to preview".
- **Responsive.** Split view collapses to tabs below Desktop.
- **Best practices.** Tab inserts literal tab/indent only in code contexts, otherwise keep focus-move (see 11); keep write/preview scroll positions in sync in split mode.
- **Common mistakes.** Preview styled differently from final render; markdown flavor mismatch between editor hint and server.

### Form Wizard

- **Purpose.** Break a long or branching form into ordered, validated steps.
- **Use when** >2 logical stages, later steps depend on earlier answers, or completion needs a review step (onboarding, listing creation, checkout — see 05 § Wizard).
- **Not when** the form fits on one screen (steps add cost) or steps are independent (Tabs/Settings Layout).
- **Variants.** Horizontal stepper header (≤5 steps, Desktop); vertical stepper sidebar (many/nested steps, Wizard Layout — see layouts file); with review step (recommended final step summarizing all answers with per-section Edit links).

```
● Details ─── ● Pricing ─── ○ Photos ─── ○ Review          step 2 of 4
┌──────────────────────────────────────────────────────────┐
│  Pricing                                                 │
│  Price *            [ $  120.00      ] USD               │
│  Compare-at price   [                ]                   │
│  …                                                       │
└──────────────────────────────────────────────────────────┘
│ [← Back]                                  [Continue →]   │  ← sticky bar
```

- **Properties.** Step = title + status (done ✓ / current ● / upcoming ○ / error ⚠); Continue validates *current step only* (full doctrine applies within the step); Back never loses data; completed steps clickable to revisit, upcoming steps not clickable until reached; progress persisted (draft) so abandonment resumes — see 03 § Save models.
- **States.** Per-step: upcoming · current · complete · error (revisited step failing validation shows ⚠ on its indicator); wizard-level loading between steps only when a step genuinely computes (show step skeleton, not overlay).
- **Responsive.** Horizontal stepper compresses to "Step 2 of 4 — Pricing" text + thin Progress bar on Mobile; sticky Continue bar bottom.
- **Best practices.** Steps in decreasing order of certainty (easy facts first); last step = Review for consequential submissions; label the final button with the real verb ("Publish listing", not "Finish" — see 10).
- **Common mistakes.** Validating future steps' fields early; trapping users (Back disabled); steps as marketing pagination for a 6-field form; losing state on refresh.

### Field Group

- **Purpose.** Semantic grouping of related fields under one legend (fieldset).
- **Use when** fields form one concept: address block, notification channel matrix, date+time pair, repeatable rows (line items).
- **Not when** the grouping is purely visual spacing (use layout rhythm) or page-level (use sections/Settings Layout).
- **Variants.** Titled group (legend `text.label` + optional description); bordered card group (weighty/optional sections, `color.surface` + `radius.lg` + `shadow.sm`); repeatable group (rows + "Add another" ghost button + per-row remove); inline group (2–3 controls on one line reading as one value).
- **Properties.** Legend is announced with each field inside (see 11); group-level Validation Message for cross-field rules ("End must be after start") rendered once, below the group; repeatable rows keep min/max counts.
- **States.** Group error (border/legend do not turn red — only the message and the offending controls do); disabled group (all children disabled, `opacity.disabled` on the block).
- **Responsive.** Inline groups stack on Mobile; repeatable rows become stacked cards with a row header.
- **Best practices.** One legend, one idea; cross-field validation lives here, not on an arbitrary member field.
- **Common mistakes.** Nested bordered groups (box-in-box noise); repeatable rows without remove; legend styled as an H2 competing with page structure.

### Validation Message

- **Purpose.** The single message slot under a field or group: error, warning, success, or help.
- **Use when** any field-level feedback — this component *is* the anatomy's message line.
- **Not when** form-level feedback (error summary Alert — see `feedback.md`) or async operation results (Toast).
- **Variants.** error (`color.danger`, icon ⚠, replaces help text) · warning (`color.warning` + icon, coexists with valid value) · success (`color.success` + ✓, high-stakes confirmations only) · help (default informational line, `color.text-muted`, no icon).
- **Properties.** `text.body-sm`; icon leading, `space.1` gap; one message at a time per field (highest severity wins: error > warning > success > help); linked to its control for assistive tech (contract in 04/11); wording rules in 10 — say how to fix, ≤ 1 short sentence.
- **States.** Appears/clears with `motion.duration-fast` fade; error persists until the rule passes (re-validate on change after first error, per doctrine).
- **Responsive.** Wraps naturally; never truncates.
- **Best practices.** Specific beats generic ("Enter a price of at least $1" > "Invalid value"); never blame ("You entered…" → just state the fix).
- **Common mistakes.** Error and help shown together; messages that restate the label ("Name is invalid"); centering messages or floating them in tooltips.
