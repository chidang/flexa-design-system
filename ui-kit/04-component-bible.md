# 04 — Flexa Component Bible

> **The engineering contract for every component in the Flexa UI Kit.** Doc 02 (UI Kit) is the design-facing catalog — rationale, wireframes, usage guidance. This document owns what code must implement: anatomy, props API, events, keyboard behavior, ARIA, and the exact FDS tokens each part consumes. A screen spec (08) may never override a contract here; a contract here may never override a token (01/FDS). For usage guidance see 02; for full a11y rationale see 11.
>
> Platform-agnostic: contracts are expressed as TypeScript-flavored prop tables and DOM/class anatomy. They bind equally to React, WordPress admin bundles, mobile web, and any future renderer. Nothing below assumes a framework.
>
> Inventory authority: `README.md § Canonical component inventory`. Every inventory component appears in this document — §2 full contracts (core), §3 condensed contracts (everything else), §4 composition rules, §5 canonical domain enums (reused verbatim by docs 08/09).

---

## 1. Contract format & global contracts

### 1.1 How to read an entry

A **full contract** (§2) has up to seven blocks:

| Block | Contains |
|---|---|
| **Anatomy** | ASCII part tree. Every line is a real DOM part with its `.fx-` class. Parts marked `?` are conditional. |
| **Props** | TypeScript-style table: `name · type · default · description`. Union literals are exhaustive — anything else is a contract violation. |
| **Events** | Emitted callbacks with payload types. Events not listed are not part of the contract. |
| **Keyboard** | Key → behavior. Follows WAI-ARIA APG for the named pattern. |
| **ARIA** | Roles/attributes per part, live-region behavior, labeling requirements. |
| **Tokens consumed** | Part × state → FDS token id. Only ids from `01-design-tokens.md` / `fds.tokens.json` may appear. |
| **Variants & sizes** | Matrix, where the component has variants/sizes beyond the global defaults. |

A **condensed contract** (§3) compresses to: one-line anatomy, key props (5–12), composition note ("composes X + Y"), the data shape it renders, and keyboard/ARIA **deltas only** — everything else is inherited from §1 and from the components it composes.

Contracts describe **observable behavior and API**, not implementation. Internal structure may differ as long as classes, data-attributes, ARIA, events, and token consumption match.

### 1.2 Naming (global)

| Thing | Rule | Example |
|---|---|---|
| Component identifier | `Fx` prefix, PascalCase | `FxButton`, `FxDataGrid`, `FxEscrowTimeline` |
| Root class | `.fx-<name>` kebab-case | `.fx-button`, `.fx-data-grid` |
| Part class | `.fx-<name>-<part>` | `.fx-button-label`, `.fx-select-listbox` |
| Part modifier | `.fx-<name>-<part>--<mod>` | `.fx-button-icon--trailing` |
| State — existing components | `.is-*` class — boolean, additive (grandfathered) | `.is-open`, `.is-loading`, `.is-selected`, `.is-invalid`, `.is-dragover`, `.is-active`, `.is-collapsed` |
| State — new work | `data-*` boolean attribute | `data-selected`, `data-open`, `data-invalid` |
| Modifier attribute | `data-variant`, `data-size`, `data-tone`, `data-density`, `data-orientation` | `data-variant="primary"`, `data-tone="danger"` |
| Test hook | `data-testid` from `testId` prop | `data-testid="checkout-submit"` |

Rules:

1. State = a state hook **and** the matching ARIA attribute; CSS keys off the hook, assistive tech off the attribute. Both are mandatory. **Amendment (2026-07-18, doc 14 F-X6):** new components and new states use `data-*` boolean attributes as the hook — one convention with the modifier attributes below, inspectable without class-list parsing. The `.is-*` classes existing components ship are grandfathered contracts: keep them, do not migrate (renames break consumers for zero user value), and when extending an existing component use whichever party it already uses.
2. Modifiers are data attributes, never extra classes (`data-size="sm"`, not `.fx-button--sm`).
3. Consumers may append classes via `className` but may never remove or rename `.fx-*` classes; styling overrides go through tokens/themes, not class surgery.
4. One root element per component. Portaled parts (menus, dialogs, toasts) carry the same `.fx-<name>-*` classes wherever they render.

### 1.3 Common props (inherited by every component)

| Prop | Type | Default | Notes |
|---|---|---|---|
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Only on components that declare a size axis. Control heights: sm 32px / md 40px / lg 48px (canonical, README). |
| `disabled` | `boolean` | `false` | See §1.7 for semantics. |
| `loading` | `boolean` | `false` | Only on components that declare a loading state. Sets `aria-busy="true"` + `.is-loading`. |
| `id` | `string` | auto-generated | Auto ids are stable per mount and used for `label[for]`/`aria-*` wiring. |
| `className` | `string` | — | Appended to the root element. |
| `testId` | `string` | — | Rendered as `data-testid` on the root. |
| `density` | `'comfortable' \| 'compact'` | inherited (`'comfortable'`) | Normally set once at layout level (`data-density` on a container); per-component override allowed on tables/grids/lists. |

Conventions:

- Ref forwarding: the component ref targets the root interactive element (the `<button>`, the `<input>`), not a wrapper.
- Unknown DOM-safe props (`aria-*`, `data-*`) pass through to the root.
- No component exposes a `style` prop for token-covered properties; layout-only overrides (e.g. `gridArea`) are the consumer's wrapper's job.

### 1.4 Token discipline

- Styles reference **only** `var(--fx-*)` variables emitted from FDS token ids. No hex, no raw px where a token exists (01 §4).
- Component tokens `c.<name>.*` are the per-component escape hatch a theme may override. **Shipped family: `c.button.radius`, `c.button.padding-x`, `c.button.padding-y` only.** Any `c.*` id in this doc not in that list is marked **(proposed)**: it must be proposed to FDS additively; until it ships, implementations alias it to the semantic token given in the same table row. Never invent a `c.*` or `--fx-*` locally.
- Baseline token map every component inherits (per-component tables list only what differs or is load-bearing):

| Concern | Token(s) |
|---|---|
| Focus outline | `color.focus-ring` — `outline: 2px solid; outline-offset: 2px` (canonical, do not restyle) |
| Disabled | `opacity.disabled` + `color.text-subtle` for text-only disabled |
| Body / small text | `text.body` / `text.body-sm` |
| Labels, table headers | `text.label` |
| Surfaces | `color.surface` on `color.bg`; alternate zones `color.surface-alt` |
| Hairline / interactive borders | `color.border` (`border.1`) / `color.border-strong` |
| State-change transitions | `motion.duration-fast` + `motion.easing-standard` |
| Overlay enter / exit | `motion.duration-normal` + `motion.easing-out` / `motion.easing-in` |
| Scrim behind modal surfaces | `color.scrim` |
| Status colors | tone → `color.<tone>` fill + `color.on-<tone>` content (see §1.9) |

- Canonical control metrics (all sized controls): height sm 32 / md 40 / lg 48px; internal gap `space.2`; radius `radius.md` (buttons: `c.button.radius`). Horizontal padding runs **two ladders by control role** (amendment 2026-07-18, doc 14 F-X1 — an intentional contract, not drift): **action controls** (buttons, segmented controls) pad `space.3/4/5` and pin `text.body-sm` at every size — a button is a label in a box, generous air, constant type; the **text-entry family** (inputs, selects, textareas, pickers) pads one step tighter at `space.2/3/4` and uses `text.body-sm` at sm / `text.body` at md+lg — the value sits close to the field edge and stays body-sized while typing. A same-row button + input therefore share height but not padding rhythm, by design; do not "fix" either toward the other.
- Anchored popover elevation runs **two tiers by surface role** (amendment 2026-07-18, doc 14 F-R1 — resolves the §2.8-vs-§2.15 split as intentional): **listbox popovers** (Select, Autocomplete, Context Menu, Command Palette) = `shadow.md` + `radius.md`; **anchored popover dialogs** (`role="dialog"` surfaces: Date/Date-Range Picker calendar, rich filter popovers) = `shadow.lg` + `radius.lg`. The tier follows the surface's role, not its trigger.
- Close/dismiss buttons are **one spec kit-wide** (amendment 2026-07-18, doc 14 F-X4): a 24px ghost icon button — transparent at rest with `color.text-muted`; hover `color.surface-alt` + `color.text`; pressed adds `color.border`; canonical focus ring. Container-scale exceptions keep the same grammar at a larger size: dialog/drawer/bulk-actions 32px, gallery lightbox 40px filled circle.
- `prefers-reduced-motion: reduce`: drop transforms, cap fades at `motion.duration-fast`, or disable animation entirely (01 § Motion). This is part of every contract that animates.

### 1.5 Controlled / uncontrolled convention

Every value-bearing component supports **both** modes:

| Mode | Props | Rule |
|---|---|---|
| Controlled | `value` + `onChange` | Component never mutates its own value; it renders `value` and reports intent via `onChange`. |
| Uncontrolled | `defaultValue` (+ optional `onChange` as notification) | Component owns state after mount. |

- Presence of `value` (not `undefined`) selects controlled mode. Switching modes after mount is a contract violation (implementations should warn in dev).
- Open/closed overlays follow the same convention with `open` / `defaultOpen` / `onOpenChange(open: boolean)`.
- Selection follows it with `selectedKeys` / `defaultSelectedKeys` / `onSelectionChange(keys)`.

### 1.6 Event naming (global vocabulary)

| Event | Signature | Used by |
|---|---|---|
| `onChange` | `(value: T, meta?: ChangeMeta) => void` | all inputs; `ChangeMeta = { source: 'input' \| 'clear' \| 'option' \| 'step' \| 'drag' \| 'paste' }` |
| `onOpenChange` | `(open: boolean) => void` | every overlay/expandable (Select, Dialog, Drawer, Accordion item, Context Menu…) |
| `onSelect` | `(item: T) => void` | menus, palettes, autocomplete option pick |
| `onDismiss` | `() => void` | toasts, alerts, banners, chips (dismissible) |
| `onConfirm` / `onCancel` | `() => void \| Promise<void>` | confirmation dialogs, destructive flows; async ⇒ confirming button shows `loading` + `aria-busy` until settle |
| `onSubmit` | `(values: Record<string, unknown>) => void \| Promise<void>` | forms, wizards, prompt inputs |
| `onPageChange` / `onPageSizeChange` | `(page: number)` / `(size: number)` | Pagination, Table, Data Grid |
| `onSortChange` | `(sort: { key: string; dir: 'asc' \| 'desc' } \| null) => void` | Table, Data Grid |
| `onSelectionChange` | `(keys: string[]) => void` | Table, Data Grid, List, Tree, Bulk Actions |
| `onFilterChange` | `(filters: FilterValue[]) => void` | Advanced Filters, toolbars |
| `onSearch` | `(query: string) => void` | Search Bar, Command Palette (debounced by `debounceMs`) |
| `onUpload` / `onRemove` | `(files: File[])` / `(fileId: string)` | upload family |
| `onRetry` | `(id?: string) => void` | error/feedback surfaces, AI status |

Handlers may be async; while a returned promise is pending the owning surface sets `aria-busy` and blocks duplicate submission. Events fire only from user intent or explicit API calls — never from prop echo (no `onChange` loop when `value` prop updates).

### 1.7 Accessibility baseline (inherited)

1. Every interactive part is keyboard reachable and operable; custom widgets follow the WAI-ARIA APG pattern named in their contract.
2. Focus visible: `outline: 2px solid var(--fx-color-focus-ring); outline-offset: 2px` on `:focus-visible`. Never `outline: none` without replacement.
3. **Disabled**: `aria-disabled="true"` + `opacity.disabled`; activation and value events suppressed. Standalone controls may also set the native `disabled` attribute (unfocusable); items inside **menus, toolbars, listboxes, and composite widgets stay focusable while disabled** (APG: discoverable, not operable).
4. **Loading**: `aria-busy="true"` on the affected region + `.is-loading`. A loading control keeps its dimensions (no layout shift).
5. Icon-only interactive elements require `aria-label` (contract-enforced: dev error when missing).
6. Live regions: passive status updates → `role="status"` (polite); errors and danger-tone toasts → `role="alert"` (assertive). Only one assertive region speaks per event.
7. Status/tone is never conveyed by color alone — every tone rendering pairs color with an icon and/or text (see 11).
8. Touch targets ≥ 44×44px on pointer-coarse media even when the visual control is smaller (hit-area extension).

### 1.8 i18n

- **Every baked-in string is a prop with a documented default.** Defaults are English; products override via props or a kit-level provider. Contracts list these under props (e.g. Pagination `labels`).
- Formatting (dates, numbers, currency) takes an explicit `locale?: string` prop defaulting to the environment locale; money renders from `Money` (§1.9) via ISO-4217, never pre-formatted strings.
- Layout uses logical properties; directional icons (chevrons, back arrows) mirror automatically under `dir="rtl"`.

### 1.9 Shared type vocabulary

```ts
type Size     = 'sm' | 'md' | 'lg';
type Variant  = 'primary' | 'secondary' | 'ghost' | 'danger';        // emphasis (actions)
type Tone     = 'neutral' | 'info' | 'success' | 'warning' | 'danger'; // status
type Density  = 'comfortable' | 'compact';
type IconName = string;               // icon registry id; rendered by FxIcon internally
type Key      = string;               // stable item identity — server ids, camelCase JSON (doc 09)
interface Money { amount: number; currency: string }   // integer minor units + ISO-4217 (doc 09)
interface OptionItem { value: string; label: string; description?: string; icon?: IconName; disabled?: boolean }
```

Tone → token mapping (used by every toned component; `neutral` uses surface/text tokens):

| Tone | Fill | Content on fill | Soft bg (subtle variant) | Soft border |
|---|---|---|---|---|
| `neutral` | `color.surface-alt` | `color.text` | `color.surface-alt` | `color.border` |
| `info` | `color.info` | `color.on-info` | `color.info-soft` | `color.info-border-soft` |
| `success` | `color.success` | `color.on-success` | `color.success-soft` | `color.success-border-soft` |
| `warning` | `color.warning` | `color.on-warning` | `color.warning-soft` | `color.warning-border-soft` |
| `danger` | `color.danger` | `color.on-danger` | `color.danger-soft` | `color.danger-border-soft` |

Tint rule (amended 2026-07-18, doc 14 F-C1): soft backgrounds are the FDS 2.12 `color.<tone>-soft`
/ `color.<tone>-border-soft` tokens — dark-aware, brand-consistent, one value per tone. The older
"≈10% `color-mix` over `color.surface`" recipe is superseded; hand-rolled `color-mix` tints remain
legal ONLY for interaction deepening (pressed/selected-hover = tone 16% over `color.surface`, one
notch past the soft base) and for neutral surface blends with no token. Primary *selection* tint
(selected rows, active nav, chosen options) uses `color.primary-soft` / `color.primary-border-soft`
the same way — wherever this doc says "primary tint (§1.9)".

Domain enums (commerce/admin/AI) are defined once in §5 and referenced by name everywhere.

---

## 2. Full contracts — core components

> Order: actions → form controls → data display → navigation → overlays & feedback → dashboard. `FxButton`, `FxIconButton`, `FxLink`, `FxTooltip` are kit primitives consumed by inventory components everywhere (doc 02 § foundations); the rest map 1:1 to inventory names.

### 2.1 FxButton — Button

**Anatomy**

```
.fx-button                          [data-variant] [data-size] [.is-loading] [.is-full-width]
├─ .fx-button-spinner?              (loading; replaces leading icon slot)
├─ .fx-button-icon?                 (leading)
├─ .fx-button-label
└─ .fx-button-icon--trailing?
```

**Props**

| Prop | Type | Default | Description |
|---|---|---|---|
| `variant` | `Variant` | `'secondary'` | Emphasis. Max one `primary` per view region (03 UX Bible). |
| `size` | `Size` | `'md'` | |
| `type` | `'button' \| 'submit' \| 'reset'` | `'button'` | Native type when rendered as `<button>`. |
| `disabled` | `boolean` | `false` | |
| `loading` | `boolean` | `false` | Shows spinner, suppresses `onClick`, locks min-width to pre-loading width. |
| `fullWidth` | `boolean` | `false` | `.is-full-width`, 100% of container. |
| `iconStart` / `iconEnd` | `IconName` | — | |
| `href` | `string` | — | Renders `<a>` with button styling; `type`/`loading` invalid with `href`. |
| `loadingLabel` | `string` | `'Loading…'` | Visually hidden text appended while loading (i18n §1.8). |

**Events** — `onClick(event)`; suppressed while `disabled` or `loading`.

**Keyboard** — native: `Enter`/`Space` activate (`Enter` only for `href` form).

**ARIA** — native `<button>`/`<a>`; no role gymnastics. Loading: `aria-busy="true"`. Label must be non-empty text; icon-only usage is a contract violation — use FxIconButton.

**Tokens consumed**

| Part × state | Token |
|---|---|
| root radius | `c.button.radius` |
| root padding | `c.button.padding-x` / `c.button.padding-y` (md; sm/lg scale per §1.4 metrics) |
| label font | `text.label` (sm: `text.body-sm`) |
| primary bg default / hover / active | `color.primary` / `color.primary-hover` / `color.primary-active` |
| primary text | `color.on-primary` |
| secondary bg / border / text | `color.surface` / `color.border-strong` / `color.text`; hover bg `color.surface-alt` |
| ghost bg / text | transparent / `color.text`; hover bg `color.surface-alt` |
| danger bg / text | `color.danger` / `color.on-danger`; hover/active `c.button.danger-hover` **(proposed — alias `color.danger` until FDS ships `color.danger-hover/active`)** |
| transition | `motion.duration-fast` + `motion.easing-standard` |

**Variants × sizes matrix** — all 4 variants × all 3 sizes are legal; `danger` + `ghost` combine as `variant="danger"` `data-subtle` is **not** a thing — use FxLink `tone="danger"` for low-emphasis destructive.

### 2.2 FxIconButton — Icon Button

**Anatomy**

```
.fx-icon-button                     [data-variant] [data-size] [.is-loading]
└─ .fx-icon-button-icon             (or .fx-icon-button-spinner while loading)
```

**Props** — as FxButton minus `fullWidth`/`iconStart`/`iconEnd`/`loadingLabel`, plus:

| Prop | Type | Default | Description |
|---|---|---|---|
| `icon` | `IconName` | required | |
| `label` | `string` | required | `aria-label`; also default tooltip content. |
| `tooltip` | `boolean \| string` | `true` | `true` = show FxTooltip with `label`; string overrides; `false` disables. |
| `shape` | `'square' \| 'circle'` | `'square'` | circle → `radius.full`. |

**Events / Keyboard / ARIA** — as FxButton; `aria-label` mandatory. Square hit target = control height (32/40/48).

**Tokens** — as FxButton; icon size 16/20/24px for sm/md/lg (canonical icon sizes, doc 02).

### 2.3 FxLink — Link

**Anatomy** — `​.fx-link` `[data-tone]` wrapping text + optional `.fx-link-icon--external?`.

**Props**

| Prop | Type | Default | Description |
|---|---|---|---|
| `href` | `string` | required | |
| `tone` | `'default' \| 'muted' \| 'danger'` | `'default'` | |
| `external` | `boolean` | `false` | Adds `target="_blank" rel="noopener noreferrer"` + external icon + visually hidden `externalLabel`. |
| `externalLabel` | `string` | `'(opens in new tab)'` | i18n. |
| `asButton` | `boolean` | `false` | Renders `<button class="fx-link">` for in-page actions styled as links. |

**ARIA** — native `<a>`; underline on default state (not hover-only — 11). **Tokens** — text `color.primary` (`default`) / `color.text-muted` (`muted`) / `color.danger`; hover `color.primary-hover`; focus baseline.

### 2.4 FxInput — Input

The root contract for the text-field family. FxTextarea, FxNumberInput, FxCurrencyInput (§2.5–2.7) and the condensed Password/Email/Phone/URL inputs (§3.4) **extend this contract** and document deltas only.

**Anatomy**

```
.fx-input                           [data-size] [.is-invalid] [.is-disabled] [.is-readonly] [.is-focused]
├─ .fx-input-affix--start?          (icon or text prefix)
├─ .fx-input-control                (native <input>)
├─ .fx-input-clear?                 (FxIconButton ghost sm, when clearable & non-empty)
└─ .fx-input-affix--end?            (icon/text suffix; loading spinner slot)
```

Label, help text and error message are **not** parts of FxInput — they belong to FxFieldGroup (§2.20). A bare FxInput requires `aria-label` or external `aria-labelledby`.

**Props**

| Prop | Type | Default | Description |
|---|---|---|---|
| `value` / `defaultValue` | `string` | — / `''` | §1.5. |
| `type` | `'text' \| 'search'` | `'text'` | Subclasses fix their own native type. |
| `placeholder` | `string` | — | Never a substitute for a label. |
| `invalid` | `boolean` | `false` | `.is-invalid` + `aria-invalid="true"`. Message rendering is FxValidationMessage's job. |
| `readOnly` | `boolean` | `false` | Focusable, value not editable. |
| `clearable` | `boolean` | `false` | Clear affordance; fires `onChange('', {source:'clear'})`. |
| `prefix` / `suffix` | `string \| IconName` | — | Static affixes, `aria-hidden`. |
| `maxLength` | `number` | — | With `showCount` renders `.fx-input-count` (in FieldGroup slot). |
| `autoComplete`, `name`, `inputMode`, `pattern` | native | — | Pass-through. |
| `clearLabel` | `string` | `'Clear'` | i18n. |

**Events** — `onChange(value, meta)` per keystroke; `onBlur`/`onFocus(event)`; `onEnter(value)` (Enter key convenience).

**Keyboard** — native text editing; `Esc` clears when `clearable` (then `Esc` propagates only if already empty).

**ARIA** — native `<input>`; `aria-invalid` when invalid; `aria-describedby` auto-wired by FxFieldGroup to help/error ids.

**Tokens consumed**

| Part × state | Token |
|---|---|
| control bg / text / placeholder | `color.surface` / `color.text` / `color.text-subtle` |
| border default / hover / focused / invalid | `color.border` / `color.border-strong` / `color.primary` (`border.2` visual, plus baseline focus outline) / `color.danger` |
| radius / padding-x | `radius.md` / §1.4 metrics |
| affix text/icon | `color.text-muted` |
| disabled | `opacity.disabled`, bg `color.surface-alt` |
| font | `text.body` (sm: `text.body-sm`) |

### 2.5 FxTextarea — Textarea

Extends FxInput. Deltas:

| Prop | Type | Default | Description |
|---|---|---|---|
| `rows` | `number` | `3` | Initial rows. |
| `autoResize` | `boolean` | `true` | Grows with content between `rows` and `maxRows`. |
| `maxRows` | `number` | `8` | |
| `resize` | `'none' \| 'vertical'` | `'vertical'` | Manual resize handle (ignored when `autoResize`). |

Anatomy: `.fx-textarea` root, `.fx-textarea-control` = native `<textarea>`. No affixes, no `clearable`. `Enter` inserts newline (never submits); counters via FieldGroup as FxInput.

### 2.6 FxNumberInput — Number Input

Extends FxInput (`value: number | null`). Anatomy adds stepper group:

```
.fx-number-input … (FxInput anatomy)
└─ .fx-number-input-steppers        (end slot)
   ├─ .fx-number-input-step--up     (FxIconButton ghost)
   └─ .fx-number-input-step--down
```

| Prop | Type | Default | Description |
|---|---|---|---|
| `value` / `defaultValue` | `number \| null` | — / `null` | `null` = empty. |
| `min` / `max` | `number` | — | Clamped on commit (blur/Enter/step), not per keystroke. |
| `step` | `number` | `1` | |
| `precision` | `number` | — | Decimal places; formats on blur. |
| `showSteppers` | `boolean` | `true` | |
| `incrementLabel` / `decrementLabel` | `string` | `'Increase'` / `'Decrease'` | i18n. |

**Keyboard** — `ArrowUp/Down` ±`step` · `PageUp/Down` ±`step×10` · `Home/End` min/max (when bounded). **ARIA** — native `<input inputmode="decimal">` with `role="spinbutton"` semantics via `aria-valuemin/max/now` when steppers shown. `onChange(value: number | null, meta)` fires with parsed number on commit and per keystroke with best-effort parse (`meta.source: 'input' | 'step'`).

### 2.7 FxCurrencyInput — Currency Input

Extends FxNumberInput; value is **Money** (integer minor units — §1.9, doc 09).

| Prop | Type | Default | Description |
|---|---|---|---|
| `value` / `defaultValue` | `Money \| null` | — / `null` | |
| `currency` | `string` | required | ISO-4217; drives symbol affix + minor-unit precision (e.g. JPY = 0). |
| `currencyDisplay` | `'symbol' \| 'code'` | `'symbol'` | Rendered as start affix, `aria-hidden` (currency is announced via field label). |
| `locale` | `string` | env | Grouping/decimal formatting on blur. |
| `allowNegative` | `boolean` | `false` | |

No steppers by default (`showSteppers: false`). `onChange(money: Money | null, meta)` — `amount` always integer minor units; the component owns the display↔minor-units conversion. Paste of formatted strings (`"1,234.50"`, `"$1 234,50"`) is parsed locale-aware; unparseable paste is rejected (input unchanged, `.is-invalid` flash not set — silent).

### 2.8 FxSelect — Select

APG **combobox + listbox** pattern (custom trigger; native `<select>` fallback is an implementation choice on mobile, contract unchanged).

**Anatomy**

```
.fx-select                          [data-size] [.is-open] [.is-invalid] [.is-disabled]
├─ .fx-select-trigger               role=combobox
│  ├─ .fx-select-value              (or .fx-select-placeholder)
│  ├─ .fx-select-clear?             (clearable & has value)
│  └─ .fx-select-chevron
└─ .fx-select-popover               (portal, z.dropdown)
   └─ .fx-select-listbox            role=listbox
      ├─ .fx-select-group?          role=group + .fx-select-group-label
      ├─ .fx-select-option*         role=option  [.is-selected] [.is-active] [aria-disabled]
      │  ├─ .fx-select-option-icon?
      │  ├─ .fx-select-option-label (+ .fx-select-option-description?)
      │  └─ .fx-select-option-check (selected only)
      └─ .fx-select-empty?          (no options)
```

**Props**

| Prop | Type | Default | Description |
|---|---|---|---|
| `options` | `OptionItem[] \| OptionGroup[]` | required | `OptionGroup = { label: string; options: OptionItem[] }`. |
| `value` / `defaultValue` | `string \| null` | — / `null` | Single select. Multi-select is FxTagInput / listbox in FxAdvancedFilters. |
| `open` / `defaultOpen` | `boolean` | — / `false` | §1.5. |
| `placeholder` | `string` | `'Select…'` | |
| `clearable` | `boolean` | `false` | |
| `invalid`, `disabled`, `size` | — | — | As FxInput. |
| `emptyLabel` | `string` | `'No options'` | i18n. |
| `renderOption` | `(item: OptionItem) => Node` | — | Custom option content; label/description still required for typeahead & a11y. |

**Events** — `onChange(value: string | null, meta)`, `onOpenChange(open)`.

**Keyboard**

| Key | Behavior |
|---|---|
| `Enter` / `Space` / `ArrowDown` / `ArrowUp` (closed) | Open; active option = selected or first. |
| `ArrowDown` / `ArrowUp` (open) | Move active option (no wrap). |
| `Home` / `End` | First / last option. |
| printable chars | Typeahead on label (500ms buffer). |
| `Enter` | Select active, close, return focus to trigger. |
| `Esc` | Close without selecting. |
| `Tab` | Close, commit nothing, move focus. |

**ARIA** — trigger `role="combobox" aria-haspopup="listbox" aria-expanded aria-controls=<listbox id>`; active option via `aria-activedescendant` (focus stays on trigger); options `role="option" aria-selected`; disabled options focusable-by-activedescendant but not selectable (§1.7). Popover flips/repositions; max-height 320px with internal scroll; active option kept scrolled into view.

**Tokens** — trigger = FxInput tokens; popover bg `color.surface`, border `color.border`, shadow `shadow.md`, radius `radius.md`, z `z.dropdown`; option hover/active bg `color.surface-alt`; option selected text `color.primary`; group label `text.label` + `color.text-muted`; open/close `motion.duration-fast`.

### 2.9 FxAutocomplete — Autocomplete

APG **editable combobox with list autocomplete**. Anatomy = FxInput anatomy + FxSelect popover/listbox (classes `.fx-autocomplete-*`), plus `.fx-autocomplete-loading?` row (async) and highlighted match `<mark class="fx-autocomplete-match">`.

**Props** — FxInput text props, plus:

| Prop | Type | Default | Description |
|---|---|---|---|
| `options` | `OptionItem[]` | — | Static source. Mutually exclusive with `loadOptions`. |
| `loadOptions` | `(query: string) => Promise<OptionItem[]>` | — | Async source; debounced by `debounceMs`; stale responses discarded (last-write-wins). |
| `debounceMs` | `number` | `300` | Doctrine default — 05 § Search. |
| `minChars` | `number` | `1` | Below threshold the listbox stays closed. |
| `freeSolo` | `boolean` | `false` | `true`: any typed text is a committable value; `false`: value must be a picked option. |
| `value` / `defaultValue` | `string \| null` | — | Committed value (option `value`, or raw text when `freeSolo`). |
| `loadingLabel` / `emptyLabel` | `string` | `'Searching…'` / `'No results'` | i18n. |

**Events** — `onChange(value, meta)` (commit), `onSearch(query)` (debounced input), `onSelect(item)` (option pick, before `onChange`), `onOpenChange(open)`.

**Keyboard** — as FxSelect open-state plus: input keeps normal editing; `ArrowDown` from input moves active descendant into list; `Esc` first closes list, second clears (if `clearable`); `Enter` with no active option commits raw text only when `freeSolo`.

**ARIA** — input `role="combobox" aria-autocomplete="list" aria-expanded aria-controls`; results count changes announced via `role="status"` polite region (`"{n} results"` — `resultsLabel` prop, default `'{count} results'`). Async pending: `aria-busy` on listbox.

### 2.10 FxTagInput — Tag Input

Multi-value input: committed values render as FxChip row inside the field.

**Anatomy**

```
.fx-tag-input                       [data-size] [.is-invalid] [.is-disabled]
├─ .fx-tag-input-chips              (FxChip* dismissible, .is-active on keyboard-focused chip)
├─ .fx-tag-input-control            (inline <input>, combobox when suggestions on)
└─ .fx-tag-input-popover?           (suggestions — FxAutocomplete listbox contract)
```

**Props**

| Prop | Type | Default | Description |
|---|---|---|---|
| `value` / `defaultValue` | `string[]` | — / `[]` | Ordered, unique. |
| `suggestions` / `loadSuggestions` | as FxAutocomplete `options`/`loadOptions` | — | Optional. |
| `delimiter` | `RegExp \| string` | `/[,\n]/` | Typing/pasting a delimiter commits the pending text. |
| `maxTags` | `number` | — | At limit: input disabled with `maxTagsLabel` announced. |
| `validateTag` | `(raw: string) => string \| null` | — | Return normalized tag or `null` to reject (rejection flashes `.is-invalid`, no event). |
| `allowDuplicates` | `boolean` | `false` | |
| `removeLabel` | `string` | `'Remove {tag}'` | i18n, per-chip `aria-label`. |

**Events** — `onChange(values: string[], meta)`; `onAdd(tag)` / `onRemove(tag)` fire before the consolidated `onChange`.

**Keyboard** — `Enter`/delimiter commit pending text · `Backspace` in empty input focuses last chip; second `Backspace` removes it · `ArrowLeft/Right` traverse chips ↔ input · `Delete` removes focused chip · suggestion navigation = FxAutocomplete.

**ARIA** — chips container `role="listbox" aria-label` (from FieldGroup label) with chips `role="option"`; roving tabindex between input and chips (one tab stop total). Additions/removals announced via polite live region (`'{tag} added' / '{tag} removed'`).

**Tokens** — field chrome = FxInput; chips = FxChip tokens; gap `space.2`; field grows vertically, min-height = control height.

### 2.11 FxCheckbox — Checkbox

**Anatomy**

```
.fx-checkbox                        [data-size] [.is-checked] [.is-indeterminate] [.is-invalid] [.is-disabled]
├─ .fx-checkbox-box                 (visual box; native <input type=checkbox> visually-hidden inside)
│  └─ .fx-checkbox-mark             (check / dash icon)
└─ .fx-checkbox-label?              (+ .fx-checkbox-description?)
```

**Props**

| Prop | Type | Default | Description |
|---|---|---|---|
| `checked` / `defaultChecked` | `boolean` | — / `false` | §1.5. |
| `indeterminate` | `boolean` | `false` | Visual + `aria-checked="mixed"`; cleared by user interaction (next click → checked). |
| `label` | `string \| Node` | — | Clicking label toggles. Bare checkbox (table row select) requires `aria-label`. |
| `description` | `string` | — | Secondary line, wired to `aria-describedby`. |
| `value`, `name` | `string` | — | Form participation. |

**Events** — `onChange(checked: boolean, meta)`. **Keyboard** — `Space` toggles. **ARIA** — native input carries semantics; `aria-checked="mixed"` when indeterminate.

**Tokens** — box border `color.border-strong`, radius `radius.sm`, size 16/18/20px (sm/md/lg); checked bg `color.primary` + mark `color.on-primary`; invalid border `color.danger`; label `text.body` / description `text.body-sm` + `color.text-muted`; transition `motion.duration-fast`.

### 2.12 FxRadioGroup — Radio Group

**Anatomy**

```
.fx-radio-group                     role=radiogroup  [data-orientation=vertical|horizontal]
└─ .fx-radio*                       [.is-checked] [.is-disabled]
   ├─ .fx-radio-dot                 (native <input type=radio> hidden inside)
   └─ .fx-radio-label (+ .fx-radio-description?)
```

**Props**

| Prop | Type | Default | Description |
|---|---|---|---|
| `options` | `OptionItem[]` | required | `description` renders secondary line. |
| `value` / `defaultValue` | `string \| null` | — / `null` | |
| `orientation` | `'vertical' \| 'horizontal'` | `'vertical'` | |
| `name` | `string` | auto | Shared native name. |
| `disabled` | `boolean` | `false` | Whole group; per-option via `OptionItem.disabled`. |

**Events** — `onChange(value: string, meta)`. **Keyboard** — APG radio: `ArrowDown/Right` next + select, `ArrowUp/Left` previous + select (wraps, skips disabled); `Space` selects focused unchecked; one tab stop (checked or first enabled). **ARIA** — `role="radiogroup"` labelled by FieldGroup label; native radios inside. **Tokens** — as FxCheckbox with `radius.full` dot; checked dot fill `color.primary`.

### 2.13 FxSwitch — Switch

**Anatomy** — `.fx-switch` `[.is-checked]` → `.fx-switch-track` + `.fx-switch-thumb` + `.fx-switch-label?`.

**Props** — `checked`/`defaultChecked`, `label`, `disabled`, `size` (`sm` 32×18 / `md` 40×22 track), `loading` (async settings toggle: thumb spinner, input inert, `aria-busy`).

**Events** — `onChange(checked, meta)`. **Keyboard** — `Space`/`Enter` toggle. **ARIA** — `role="switch" aria-checked` (native checkbox + role). Semantics: switch = immediate effect; checkbox = form value (02 owns the usage rule; the contract difference is the role + immediacy expectation).

**Tokens** — track off `color.border-strong`, on `color.primary`; thumb `color.surface` + `shadow.sm`; radius `radius.full`; motion `motion.duration-fast` + `motion.easing-standard`.

### 2.14 FxSlider — Slider

**Anatomy**

```
.fx-slider                          [data-orientation] [.is-disabled] [data-range]
├─ .fx-slider-track
│  └─ .fx-slider-fill
├─ .fx-slider-thumb*                role=slider (1 or 2)
├─ .fx-slider-marks?                (.fx-slider-mark* + labels)
└─ .fx-slider-tooltip?              (value bubble on drag/focus, z.tooltip)
```

**Props**

| Prop | Type | Default | Description |
|---|---|---|---|
| `value` / `defaultValue` | `number \| [number, number]` | — | Tuple = range slider (two thumbs, `data-range`). |
| `min` / `max` / `step` | `number` | `0` / `100` / `1` | |
| `marks` | `{ value: number; label?: string }[]` | — | |
| `orientation` | `'horizontal' \| 'vertical'` | `'horizontal'` | |
| `showTooltip` | `'auto' \| 'always' \| 'never'` | `'auto'` | auto = while dragging/focused. |
| `formatValue` | `(v: number) => string` | `String` | Drives tooltip + `aria-valuetext`. |
| `label` / `thumbLabels` | `string` / `[string, string]` | — | Range sliders must label each thumb (e.g. `['Minimum price','Maximum price']`). |

**Events** — `onChange(value, {source:'drag'|'step'})` live during drag; `onChangeEnd(value)` on release/commit (server calls belong here).

**Keyboard** (per thumb) — `Arrow` ±step · `PageUp/Down` ±step×10 · `Home/End` min/max; range thumbs cannot cross (they clamp at each other).

**ARIA** — each thumb `role="slider" tabindex=0 aria-valuemin/max/now/valuetext aria-orientation`; thumbs individually labelled.

**Tokens** — track `color.surface-alt` (height 4px), fill `color.primary`, thumb `color.surface` border `color.primary` `shadow.sm` `radius.full` (16/20/24px per size); marks `color.text-subtle` + `text.body-sm`.

### 2.15 FxDatePicker — Date Picker

Text field + calendar popover. Dates cross the API as **ISO-8601 strings** (`'2026-07-11'`, date-only local; doc 09) — never `Date` objects in the public contract.

**Anatomy**

```
.fx-date-picker                     [data-size] [.is-open] [.is-invalid]
├─ (FxInput anatomy, calendar icon end-affix = trigger)
└─ .fx-date-picker-popover          (portal, z.popover)
   └─ .fx-calendar
      ├─ .fx-calendar-header        (.fx-calendar-prev / .fx-calendar-title (month+year selects) / .fx-calendar-next)
      ├─ .fx-calendar-grid          role=grid  (7-col; .fx-calendar-weekday* / .fx-calendar-day* [.is-today] [.is-selected] [.is-outside] [aria-disabled])
      └─ .fx-calendar-footer?       (.fx-calendar-today-btn / .fx-calendar-clear-btn)
```

**Props**

| Prop | Type | Default | Description |
|---|---|---|---|
| `value` / `defaultValue` | `string \| null` (ISO date) | — / `null` | |
| `min` / `max` | `string` (ISO date) | — | Out-of-range days `aria-disabled`. |
| `isDateDisabled` | `(iso: string) => boolean` | — | Business rules (weekends, blackout). |
| `locale` / `weekStartsOn` | `string` / `0–6` | env / locale | Display format + grid layout. |
| `open` / `defaultOpen` | `boolean` | — | §1.5. |
| `allowInput` | `boolean` | `true` | Typed entry parsed on blur/Enter; unparseable → `.is-invalid` + value unchanged. |
| `labels` | `{ openCalendar; prevMonth; nextMonth; today; clear }` | English set | i18n. |

**Events** — `onChange(iso: string | null, meta)`, `onOpenChange(open)`, `onMonthChange(isoMonth: string)`.

**Keyboard** (calendar grid, APG date grid) — `Arrow` ±1 day/row · `Home/End` week start/end · `PageUp/Down` ±1 month · `Shift+PageUp/Down` ±1 year · `Enter/Space` select + close · `Esc` close, restore focus to input. Focus moves into grid when opened via trigger button; typed input keeps focus in field.

**ARIA** — grid `role="grid"` with `aria-label` month/year; day cells `role="gridcell"` (button inside), `aria-selected`, `aria-current="date"` on today; month title `aria-live="polite"`. Trigger: `aria-haspopup="dialog"`; popover `role="dialog" aria-modal="false"`.

**Tokens** — popover: `color.surface` `shadow.lg` `radius.lg` `z.popover`; day hover `color.surface-alt`; selected bg `color.primary` text `color.on-primary`; today ring `color.primary` (`border.1`); outside-month/disabled `color.text-subtle`; weekday header `text.label` `color.text-muted`.

### 2.16 FxDateRangePicker — Date Range Picker

Extends FxDatePicker. Value is `{ start: string | null; end: string | null }` (ISO). Deltas:

| Prop | Type | Default | Description |
|---|---|---|---|
| `value` / `defaultValue` | `DateRange` | — | `DateRange = { start: string \| null; end: string \| null }`. |
| `presets` | `{ label: string; range: DateRange }[]` | — | Rendered as `.fx-date-range-presets` list beside calendar (e.g. "Last 30 days"). |
| `months` | `1 \| 2` | `2` (desktop), `1` (mobile) | Side-by-side calendars. |
| `minDays` / `maxDays` | `number` | — | Range length constraints; violating end-picks disabled. |

Interaction: first pick sets `start`, second sets `end` (auto-swap if earlier); hover/focus paints `.is-in-range` on intermediate days; `onChange` fires only when the pair is complete or cleared (intermediate = `onPartialChange(range)`). ARIA: selection state announced via polite live region (`'Start date {date} selected. Choose end date.'` — `labels.startSelected`). Tokens delta: in-range day bg = tint of `color.primary` per §1.9 tint rule; endpoint days = selected tokens.

### 2.17 FxFileUpload — File Upload

Button-triggered upload with managed file list. (Dropzone surface = Drag & Drop Upload §3.4, which composes this contract.)

**Anatomy**

```
.fx-file-upload                     [.is-disabled] [.is-dragover]
├─ .fx-file-upload-trigger          (FxButton secondary + hidden <input type=file>)
├─ .fx-file-upload-hint?            (accept/size copy)
└─ .fx-file-upload-list             role=list
   └─ .fx-file-upload-item*        [data-status=queued|uploading|success|error]
      ├─ .fx-file-upload-item-icon / -name / -size
      ├─ .fx-file-upload-item-progress?   (FxProgress sm while uploading)
      ├─ .fx-file-upload-item-error?      (FxValidationMessage)
      └─ .fx-file-upload-item-actions     (retry? / remove — FxIconButton ghost sm)
```

**Props**

| Prop | Type | Default | Description |
|---|---|---|---|
| `value` / `defaultValue` | `UploadFile[]` | — / `[]` | `UploadFile = { id: string; name: string; size: number; type: string; status: 'queued' \| 'uploading' \| 'success' \| 'error'; progress?: number; url?: string; error?: string }`. |
| `accept` | `string` | — | MIME/extension list; rejected files surface per-file error, never silently dropped. |
| `multiple` | `boolean` | `false` | |
| `maxSize` | `number` (bytes) | — | |
| `maxFiles` | `number` | — | |
| `upload` | `(file: File, onProgress: (pct: number) => void, signal: AbortSignal) => Promise<{ id: string; url: string }>` | — | Host-provided transport. Absent ⇒ component only collects files (form-post mode). |
| `labels` | `{ browse; dropHint; retry; remove; tooLarge; wrongType; tooMany }` | English set | i18n; error templates take `{name}` `{max}`. |

**Events** — `onChange(files: UploadFile[], meta)`, `onUpload(files: File[])` (accepted picks), `onRemove(fileId)`, `onRetry(fileId)`.

**Keyboard** — trigger = button; list items: `Tab` reaches item actions; `Delete` on focused item removes. **ARIA** — hidden input labelled by trigger; per-file progress `role="progressbar" aria-valuenow`; status transitions announced polite (`'{name} uploaded' / '{name} failed: {error}'`); the list is `role="list"`.

**Tokens** — item row bg `color.surface`, border `color.border`, radius `radius.md`, padding `space.3`; success icon `color.success`; error text/icon `color.danger`; size text `color.text-muted` `text.body-sm`; dragover ring `color.primary` (`border.2` dashed).

### 2.18 FxFormWizard — Form Wizard

Multi-step form orchestrator (renders inside Wizard Layout §3.1 or Modal). APG-relevant parts: step list = navigation, panels = standard form regions.

**Anatomy**

```
.fx-form-wizard                     [data-orientation=horizontal|vertical]
├─ .fx-form-wizard-steps            <nav> aria-label
│  └─ .fx-form-wizard-step*         [data-state=complete|current|upcoming|error] (button when navigable)
│     ├─ .fx-form-wizard-step-indicator   (number / check / error icon)
│     └─ .fx-form-wizard-step-label (+ -description?)
├─ .fx-form-wizard-panel            role=group aria-labelledby=<current step label>
└─ .fx-form-wizard-footer           (.fx-form-wizard-back / .fx-form-wizard-next / .fx-form-wizard-submit)
```

**Props**

| Prop | Type | Default | Description |
|---|---|---|---|
| `steps` | `WizardStep[]` | required | `WizardStep = { id: string; label: string; description?: string; optional?: boolean; validate?: () => Promise<ValidationResult> \| ValidationResult }`; `ValidationResult = { valid: boolean; errors?: FieldError[] }`. |
| `activeStep` / `defaultActiveStep` | `string` (step id) | — / first | §1.5. |
| `linear` | `boolean` | `true` | `true`: steps unlock sequentially; `false`: completed/visited steps clickable. |
| `labels` | `{ back; next; submit; optional; stepStatus }` | `'Back' / 'Next' / 'Submit' / 'Optional' / 'Step {n} of {total}'` | i18n. |

**Events** — `onStepChange(stepId, direction: 'next' | 'back' | 'jump')` (fires **after** `validate` of the departing step resolves valid — invalid blocks with focus moved to first invalid field); `onSubmit(values)` from final step; `onCancel()`.

**Keyboard** — step list: `Tab` to reachable steps, `Enter` activates; panels manage their own form tab order; `Next` = submit-type button so `Enter` in a field advances.

**ARIA** — steps `aria-current="step"` on current; `'Step {n} of {total}'` visually-hidden per step; step change moves focus to panel heading; async validation: Next button `aria-busy`.

**Tokens** — indicator: upcoming `color.surface-alt`/`color.text-muted`, current `color.primary`/`color.on-primary`, complete `color.success`/`color.on-success`, error `color.danger`/`color.on-danger`, `radius.full`; connector line `color.border` (complete: `color.success`); step transition `motion.duration-slow` + `motion.easing-standard` (panel slide; reduced-motion: fade).

### 2.19 FxValidationMessage — Validation Message

**Anatomy** — `.fx-validation-message` `[data-tone=danger|warning|success]` → `.fx-validation-message-icon` + `.fx-validation-message-text`.

**Props**

| Prop | Type | Default | Description |
|---|---|---|---|
| `children` / `message` | `string \| Node` | required | |
| `tone` | `'danger' \| 'warning' \| 'success'` | `'danger'` | Field-level only (no info tone — help text is FieldGroup's `help`). |
| `id` | `string` | auto | Consumed by the control's `aria-describedby` (FieldGroup wires this). |

**ARIA** — the element itself is **not** a live region when statically rendered with the field; when it appears dynamically (post-submit/blur validation) FxFieldGroup mounts it inside its `role="alert"` slot so it announces once. Icon `aria-hidden` (tone conveyed by text — §1.7.7).

**Tokens** — text+icon `color.danger` / `color.warning` / `color.success`; font `text.body-sm`; gap `space.1`; margin-top `space.1`.

### 2.20 FxFieldGroup — Field Group

The labeling/description/error shell for any single control (or tight control cluster). All form examples in docs 05/08 assume fields are wrapped in FieldGroup.

**Anatomy**

```
.fx-field-group                     [.is-invalid] [.is-disabled] [.is-required]
├─ .fx-field-group-label            <label for> (+ .fx-field-group-required-mark? / .fx-field-group-optional?)
├─ .fx-field-group-help?            (persistent help text, id → aria-describedby)
├─ .fx-field-group-control          (the wrapped control; receives id / aria-describedby / aria-invalid / disabled)
├─ .fx-field-group-error-slot       role=alert (FxValidationMessage mounts here)
└─ .fx-field-group-meta?            (.fx-field-group-count? — maxLength counter)
```

**Props**

| Prop | Type | Default | Description |
|---|---|---|---|
| `label` | `string` | required | Visible label. `labelHidden` renders it visually-hidden (still wired). |
| `labelHidden` | `boolean` | `false` | |
| `help` | `string` | — | |
| `error` | `string \| false` | — | Truthy ⇒ renders FxValidationMessage in alert slot + sets child `aria-invalid`. |
| `required` | `boolean` | `false` | Asterisk + `aria-required` on control; `optionalLabel` (`'Optional'`) shown instead when the form marks optionals (product choice, 02). |
| `requiredLabel` / `optionalLabel` | `string` | `'required'` / `'Optional'` | i18n (`requiredLabel` is the asterisk's accessible text). |
| `disabled` | `boolean` | `false` | Cascades to child control. |

**Behavior contract** — FieldGroup owns id wiring: generates control id, sets `label[for]`, merges `help`/`error`/`count` ids into the control's `aria-describedby` (error id first). Group-type children (RadioGroup, TagInput, date range) get `role="group"`/`aria-labelledby` instead of `label[for]`.

**Tokens** — label `text.label` `color.text`; help `text.body-sm` `color.text-muted`; required mark `color.danger`; vertical rhythm `space.2` between parts; stacked fields separated by `space.5` (form layout rule, 02).

### 2.21 FxTable — Table

Semantic data table: sortable columns, row selection, sticky header, pagination slot. **Not** keyboard-grid-navigable and **not** cell-editable — that is FxDataGrid (§2.22). Server-driven datasets: all of sort/pagination/selection work controlled.

**Anatomy**

```
.fx-table-container                 [data-density] [.is-loading] (scroll container, focusable when scrollable)
├─ table.fx-table
│  ├─ thead.fx-table-head           [.is-sticky]
│  │  └─ th.fx-table-th*            [data-align] [aria-sort]
│  │     └─ .fx-table-sort-btn?     (button wrapping label + .fx-table-sort-icon)
│  ├─ tbody.fx-table-body
│  │  └─ tr.fx-table-row*           [.is-selected] [.is-clickable]
│  │     ├─ td.fx-table-select?     (FxCheckbox, aria-label 'Select row {label}')
│  │     ├─ td.fx-table-td*
│  │     └─ td.fx-table-actions?    (row actions: FxIconButton* / overflow Context Menu)
│  └─ tfoot.fx-table-foot?
├─ .fx-table-empty?                 (FxEmptyState when rows=[] & !loading)
├─ .fx-table-skeleton?              (FxSkeletonLoader rows while loading initial)
└─ .fx-table-pagination?            (FxPagination slot)
```

**Props**

| Prop | Type | Default | Description |
|---|---|---|---|
| `columns` | `TableColumn<T>[]` | required | `TableColumn<T> = { key: string; header: string; sortable?: boolean; align?: 'start' \| 'end' \| 'center'; width?: string; sticky?: 'start' \| 'end'; render?: (row: T) => Node }`. |
| `rows` | `T[]` | required | |
| `rowKey` | `(row: T) => Key` | required | Stable identity. |
| `sort` / `defaultSort` | `{ key: string; dir: 'asc' \| 'desc' } \| null` | — / `null` | §1.5. |
| `selectable` | `'none' \| 'multi' \| 'single'` | `'none'` | Multi adds header select-all (indeterminate when partial). |
| `selectedKeys` / `defaultSelectedKeys` | `Key[]` | — / `[]` | |
| `onRowClick` | `(row: T) => void` | — | Rows become `.is-clickable`; the row's primary cell must also contain a real link for middle-click/a11y (02). |
| `stickyHeader` | `boolean` | `true` | |
| `density` | `Density` | inherited | Compact row height 36px vs 48px comfortable. |
| `loading` | `boolean` | `false` | Initial: skeleton rows; subsequent: overlay shimmer + `aria-busy`, rows inert. |
| `emptyState` | `Node` | required-ish | FxEmptyState; a table without an empty state is a contract violation. |
| `caption` | `string` | required | `<caption>` (visually hidden allowed) — names the table for AT. |
| `labels` | `{ selectAll; selectRow; sortAsc; sortDesc; clearSort }` | English set | i18n. |

**Events** — `onSortChange(sort)` (cycle: asc → desc → null), `onSelectionChange(keys)`, `onRowClick(row)`, `onPageChange`/`onPageSizeChange` (proxied to Pagination slot).

**Keyboard** — DOM order tabbing: sort buttons, row checkboxes, row links/actions. Scrollable container `tabindex="0"` + arrow scrolling. No grid pattern (screen readers use native table navigation).

**ARIA** — native `<table>` semantics; `<caption>`; sortable `th[aria-sort="ascending|descending|none"]`; selection checkboxes individually labelled; select-all announces resulting state. Loading overlay: `aria-busy` on container.

**Tokens** — header bg `color.surface` (sticky adds `shadow.sm` when scrolled), header text `text.label` `color.text-muted`; row border `color.border` (`border.1` bottom only — whitespace over borders); row hover `color.surface-alt`; selected row = `color.primary` tint (§1.9 tint rule); cell padding `space.3`×`space.4` (compact `space.2`×`space.3`); numeric cells `align=end`.

### 2.22 FxDataGrid — Data Grid

Spreadsheet-class grid: APG **grid** pattern — keyboard cell navigation, inline editing, column resize/reorder/pin, virtualization. Use FxTable unless these are needed (02 owns the decision rule).

**Anatomy**

```
.fx-data-grid                       role=grid  [data-density] [.is-loading]
├─ .fx-data-grid-header             role=row (columnheader*, .fx-data-grid-resizer* / drag handles)
├─ .fx-data-grid-viewport           (virtualized scroll)
│  └─ .fx-data-grid-row*            role=row [.is-selected]
│     └─ .fx-data-grid-cell*        role=gridcell [.is-focused] [.is-editing] [data-align]
│        └─ .fx-data-grid-editor?   (active editor: Input/Select/… per column type)
└─ .fx-data-grid-status             role=status (selection count, async announcements)
```

**Props** — FxTable props (columns/rows/rowKey/sort/selection/density/loading/emptyState/caption), plus:

| Prop | Type | Default | Description |
|---|---|---|---|
| `columns[].editable` | `boolean \| { editor: 'text' \| 'number' \| 'select' \| 'date'; options?: OptionItem[] }` | `false` | |
| `columns[].resizable` / `reorderable` / `pinnable` | `boolean` | `true` / `false` / `false` | |
| `onCellEdit` | `(edit: { rowKey: Key; columnKey: string; value: unknown; previous: unknown }) => void \| Promise<void>` | — | Reject by throwing → cell reverts + error announced. |
| `virtualized` | `boolean` | `true` | Row virtualization; row heights fixed per density. |
| `onColumnChange` | `(state: { order: string[]; widths: Record<string, number>; pinned: Record<string, 'start' \| 'end'> }) => void` | — | Persistable column state. |

**Keyboard** (APG grid)

| Key | Behavior |
|---|---|
| `Arrow keys` | Move cell focus (single tab stop; roving focus). |
| `Home` / `End` · `Ctrl+Home/End` | Row start/end · grid start/end. |
| `PageUp` / `PageDown` | Scroll by viewport. |
| `Enter` / `F2` | Enter edit mode on editable cell; `Enter` commits + moves down, `Tab` commits + moves right. |
| `Esc` | Cancel edit, restore value, focus cell. |
| `Space` | Toggle row selection (in select column); `Ctrl+A` select all. |
| `Tab` | Leaves the grid (grid is one tab stop). |

**ARIA** — `role="grid" aria-rowcount aria-colcount` (total, not rendered — virtualization); rows `aria-rowindex`; cells `aria-colindex`; editing cell contains the editor with focus; edit commit/failure announced via `.fx-data-grid-status`. Column headers `role="columnheader" aria-sort`.

**Tokens** — as FxTable plus: focused cell ring `color.focus-ring` (inset), editing cell bg `color.surface` + border `color.primary`, pinned column edge `shadow.sm`, resizer hover `color.primary`.

### 2.23 FxCard — Card

Generic content container; the compositional base for Metric/Product/Order/… cards.

**Anatomy**

```
.fx-card                            [data-padding=none|sm|md|lg] [.is-interactive] [.is-selected]
├─ .fx-card-media?                  (full-bleed top)
├─ .fx-card-header?                 (.fx-card-title / .fx-card-subtitle? / .fx-card-header-actions?)
├─ .fx-card-body
└─ .fx-card-footer?                 (actions, divider optional)
```

**Props**

| Prop | Type | Default | Description |
|---|---|---|---|
| `padding` | `'none' \| 'sm' \| 'md' \| 'lg'` | `'md'` | `space.3` / `space.4` / `space.6`. |
| `interactive` | `boolean` | `false` | Hover elevation + pointer; requires `onClick` or a primary link in header. |
| `selected` | `boolean` | `false` | Selection ring (pairs with checkbox in bulk contexts). |
| `as` | `'div' \| 'article' \| 'section' \| 'a'` | `'div'` | Semantic element. |

**Events** — `onClick(event)` when `interactive`. **Keyboard/ARIA** — interactive card: the **title link** is the accessible action (card click is a pointer convenience); never `role="button"` on the card root; nested actions stop propagation.

**Tokens** — bg `color.surface`; border `color.border` (`border.1`) **or** `shadow.sm` (elevation mode — one, not both; 03: whitespace over borders); radius `radius.lg`; hover (interactive) `shadow.md` + `motion.duration-fast`; selected ring `color.primary` `border.2`; title `text.heading-md`; subtitle `text.body-sm` `color.text-muted`.

### 2.24 FxList — List

**Anatomy**

```
.fx-list                            role=list|listbox  [data-divided] [data-density]
└─ .fx-list-item*                   [.is-selected] [.is-active] [.is-disabled]
   ├─ .fx-list-item-media?          (icon / FxAvatar / FxCheckbox)
   ├─ .fx-list-item-content         (.fx-list-item-title / .fx-list-item-description?)
   └─ .fx-list-item-meta?           (timestamp / FxBadge / chevron / actions)
```

**Props**

| Prop | Type | Default | Description |
|---|---|---|---|
| `items` | `ListItem<T>[]` | required | `ListItem = { key: Key; title: Node; description?: Node; media?: Node; meta?: Node; disabled?: boolean; href?: string }`. |
| `selectable` | `'none' \| 'single' \| 'multi'` | `'none'` | `single/multi` ⇒ `role="listbox"` + `aria-selected`. |
| `selectedKeys` / `defaultSelectedKeys` | `Key[]` | — | |
| `divided` | `boolean` | `false` | Hairline separators. |
| `renderItem` | `(item, state) => Node` | — | Full custom row. |

**Events** — `onSelect(item)` (activation), `onSelectionChange(keys)`. **Keyboard** — plain list: DOM tab order to links/actions. Listbox mode: single tab stop, `Arrow` roving, `Space/Enter` select, `Home/End`, typeahead. **Tokens** — item padding `space.3`/`space.4`; hover `color.surface-alt`; divider `color.border`; selected = primary tint (§1.9); title `text.body`, description `text.body-sm` `color.text-muted`.

### 2.25 FxAccordion — Accordion

**Anatomy**

```
.fx-accordion                       [data-variant=default|contained]
└─ .fx-accordion-item*              [.is-open] [.is-disabled]
   ├─ h3.fx-accordion-header
   │  └─ button.fx-accordion-trigger  aria-expanded aria-controls
   │     ├─ .fx-accordion-title (+ .fx-accordion-subtitle?)
   │     └─ .fx-accordion-chevron
   └─ .fx-accordion-panel            role=region aria-labelledby
```

**Props**

| Prop | Type | Default | Description |
|---|---|---|---|
| `items` | `{ id: string; title: Node; subtitle?: Node; content: Node; disabled?: boolean }[]` | required | |
| `openIds` / `defaultOpenIds` | `string[]` | — / `[]` | §1.5. |
| `multiple` | `boolean` | `false` | `false`: opening one closes others. |
| `collapsible` | `boolean` | `true` | `false` + single mode: one item always open. |
| `headingLevel` | `2–6` | `3` | Wrapper heading level. |

**Events** — `onOpenChange(openIds: string[])`. **Keyboard** — `Enter/Space` toggle; `ArrowDown/Up` move between triggers (wrap); `Home/End` first/last. Panels hidden with `hidden` attr (searchable content: `hidden="until-found"` where supported). **ARIA** — trigger `aria-expanded aria-controls`; panel `role="region" aria-labelledby` (drop region role when >6 items). **Tokens** — trigger padding `space.4`; hover `color.surface-alt`; divider `color.border`; chevron rotate `motion.duration-fast`; panel expand `motion.duration-normal` `motion.easing-out` (reduced-motion: instant); contained variant: `color.surface` + `radius.lg` + `border.1 color.border` per item.

### 2.26 FxTree — Tree

APG **tree view** pattern. Used for category trees, file browsers, nested navigation editing.

**Anatomy**

```
.fx-tree                            role=tree  [aria-multiselectable]
└─ .fx-tree-item*                   role=treeitem  [.is-expanded] [.is-selected] [aria-level] [aria-setsize] [aria-posinset]
   ├─ .fx-tree-item-row             (indent by level × space.4)
   │  ├─ .fx-tree-item-toggle?      (chevron; leaf = spacer)
   │  ├─ .fx-tree-item-icon? / .fx-tree-item-checkbox?
   │  └─ .fx-tree-item-label
   └─ .fx-tree-children?            role=group
```

**Props**

| Prop | Type | Default | Description |
|---|---|---|---|
| `items` | `TreeNode[]` | required | `TreeNode = { key: Key; label: string; icon?: IconName; children?: TreeNode[]; disabled?: boolean; lazy?: boolean }`. |
| `expandedKeys` / `defaultExpandedKeys` | `Key[]` | — / `[]` | |
| `selectedKeys` / `defaultSelectedKeys` | `Key[]` | — / `[]` | |
| `multiSelect` | `boolean` | `false` | Checkbox mode with tri-state parents. |
| `loadChildren` | `(key: Key) => Promise<TreeNode[]>` | — | For `lazy` nodes; pending toggle shows spinner + `aria-busy`. |

**Events** — `onExpandedChange(keys)`, `onSelectionChange(keys)`, `onSelect(item)` (activation).

**Keyboard** — `ArrowDown/Up` next/previous visible node · `ArrowRight` expand / to first child · `ArrowLeft` collapse / to parent · `Enter` activate/select · `Space` toggle checkbox (multi) · `Home/End` · `*` expand all siblings · typeahead. One tab stop, roving tabindex.

**ARIA** — `role="tree" / treeitem / group`; `aria-expanded` on parents only; `aria-level/setsize/posinset` (virtualized trees must still report them); multi-select: `aria-multiselectable` + `aria-checked` tri-state.

**Tokens** — row height 32px (compact 28); hover `color.surface-alt`; selected primary tint; toggle chevron `motion.duration-fast`; guide lines (optional) `color.border`.

### 2.27 FxBadge — Badge

Status descriptor. Non-interactive, no focus.

**Anatomy** — `.fx-badge` `[data-tone] [data-appearance=solid|subtle|outline]` → `.fx-badge-dot?` + `.fx-badge-icon?` + `.fx-badge-label` + `.fx-badge-count?`.

**Props**

| Prop | Type | Default | Description |
|---|---|---|---|
| `tone` | `Tone` | `'neutral'` | |
| `appearance` | `'solid' \| 'subtle' \| 'outline'` | `'subtle'` | |
| `icon` / `dot` | `IconName` / `boolean` | — / `false` | §1.7.7: solid badges of status tones should carry icon or dot. |
| `count` | `number` | — | Numeric badge (notifications); `maxCount` (99) renders `99+`. |
| `srLabel` | `string` | — | Visually-hidden expansion (e.g. `'3 unread notifications'`) — required for bare counts. |

**Tokens** — solid: bg `color.<tone>` text `color.on-<tone>`; subtle: tone tint bg (§1.9) text `color.<tone>` (neutral: `color.text`); outline: border `color.<tone>` `border.1`; radius `radius.full`; font `text.body-sm` (600 weight via `text.label`); padding `space.1`×`space.2`. Sizes: `sm` 18px / `md` 22px tall.

### 2.28 FxTag — Tag

Categorical label; optionally interactive (filter link) — unlike FxBadge (status, inert) and FxChip (input artifact, dismissible).

**Anatomy** — `.fx-tag` `[data-tone]` `[.is-interactive]` → `.fx-tag-icon?` + `.fx-tag-label`; interactive form renders `<a>`/`<button>`.

**Props** — `tone` (`Tone`, default `neutral`), `icon`, `href`/`onClick` (interactive), `size` (`sm|md`).

**Tokens** — bg `color.surface-alt` (toned: tint per §1.9); text `color.text` / `color.<tone>`; radius `radius.full` (amended 2026-07-18, doc 14 F-R1: tag is a capsule beside badge/chip pills — the earlier `radius.sm` read near-square in the same row); padding `space.1`×`space.2`; interactive hover: border `color.border-strong`. Keyboard/ARIA: native link/button when interactive; otherwise inert `<span>`.

### 2.29 FxChip — Chip

Compact interactive token: selected filters, tag-input values, choice chips.

**Anatomy**

```
.fx-chip                            [data-size] [.is-selected] [.is-disabled] [.is-active]
├─ .fx-chip-icon? / .fx-chip-avatar?
├─ .fx-chip-label
└─ .fx-chip-remove?                 (dismissible; button with aria-label)
```

**Props**

| Prop | Type | Default | Description |
|---|---|---|---|
| `label` | `string` | required | |
| `selected` / `defaultSelected` | `boolean` | — | Choice-chip mode (toggle). |
| `dismissible` | `boolean` | `false` | Renders remove button. |
| `removeLabel` | `string` | `'Remove {label}'` | i18n. |
| `icon` / `avatar` | `IconName` / `AvatarProps` | — | |

**Events** — `onClick`, `onChange(selected)` (choice mode), `onDismiss()`. **Keyboard** — chip `Enter/Space` toggles/activates; `Delete`/`Backspace` dismisses when dismissible & focused; remove button is its own tab stop **only** outside composite widgets (inside TagInput the composite owns roving focus). **ARIA** — choice mode: `role="button" aria-pressed` (or checkbox semantics inside filter groups). **Tokens** — bg `color.surface-alt`, selected bg primary tint + text `color.primary` + border `color.primary`; radius `radius.full`; height 24/32/40 (sm/md/lg — corrected 2026-07-18, doc 14 F-X7: the chip ladder is the control ladder shifted one notch down, chip md = control sm height, chip lg = control md; chips are inline artifacts, not controls, so they sit a step below the 32/40/48 ladder); remove hover bg `color.scrim`-free — use `color.surface`. Hover (added 2026-07-18, visual QA): unselected = border `color.border-strong` + main bg `color.surface`; selected = border `color.primary-hover` + tint deepened one notch (§1.9 16% mix); `motion.duration-fast`.

### 2.30 FxAvatar — Avatar

**Anatomy** — `.fx-avatar` `[data-size=xs|sm|md|lg|xl]` `[data-shape=circle|square]` → `.fx-avatar-image?` | `.fx-avatar-initials?` | `.fx-avatar-icon?` + `.fx-avatar-status?`. Group form: `.fx-avatar-group` overlapping, `.fx-avatar-overflow` (`+3`).

**Props**

| Prop | Type | Default | Description |
|---|---|---|---|
| `src` / `alt` | `string` | — | `alt` required with `src`; decorative-in-context avatars (name shown adjacent) use `alt=""`. |
| `name` | `string` | — | Initials fallback (first+last grapheme) + deterministic bg hue from name hash (hue rotates over `color.primary`-anchored palette — implementation maps hash → the 5 tone fills; no new literals). |
| `size` | `'xs' \| 'sm' \| 'md' \| 'lg' \| 'xl'` | `'md'` | 20/24/32/40/64px. |
| `shape` | `'circle' \| 'square'` | `'circle'` | square → `radius.md`. |
| `status` | `'online' \| 'away' \| 'offline' \| null` | `null` | Dot: `color.success` / `color.warning` / `color.text-subtle`; needs `statusLabel` for AT. |
| `statusLabel` | `string` | `'Online' / 'Away' / 'Offline'` | i18n; visually hidden. |

Fallback chain: image → (load error) initials → icon. Non-interactive by itself; wrap in button/link for actions. **Tokens** — fallback bg tone fills; initials `color.on-primary`-family (`on-*` of chosen fill); border on image over media `color.surface` 2px (group overlap separator).

### 2.31 FxProgress — Progress

**Anatomy** — bar: `.fx-progress` `[data-shape=bar|circle] [data-tone] [.is-indeterminate]` → `.fx-progress-track` + `.fx-progress-fill` + `.fx-progress-label?` + `.fx-progress-value?`.

**Props**

| Prop | Type | Default | Description |
|---|---|---|---|
| `value` | `number \| null` | `null` | 0–100; `null` = indeterminate. |
| `tone` | `'neutral' \| 'success' \| 'warning' \| 'danger'` | `'neutral'` (renders `color.primary` fill) | Tone shifts fill for outcome coloring. |
| `shape` | `'bar' \| 'circle'` | `'bar'` | |
| `size` | `Size` | `'md'` | Bar heights 4/6/8px; circle Ø 16/24/40. |
| `label` | `string` | — | Accessible name (required if no visible label). |
| `showValue` | `boolean` | `false` | Renders `%` text. |
| `formatValue` | `(v: number) => string` | `'{v}%'` | Drives text + `aria-valuetext`. |

**ARIA** — `role="progressbar" aria-valuemin=0 aria-valuemax=100 aria-valuenow` (omit when indeterminate) `aria-label/labelledby`. Long-running completions announced by the **owning surface**, not the bar. **Tokens** — track `color.surface-alt`; fill `color.primary` or `color.<tone>`; radius `radius.full`; indeterminate sweep `motion.duration-slow` loop (reduced-motion: static pulse via opacity).

### 2.32 FxSkeletonLoader — Skeleton Loader

**Anatomy** — `.fx-skeleton` `[data-shape=text|rect|circle]` per placeholder; grouped in `.fx-skeleton-group aria-hidden="true"`.

**Props** — `shape` (`'text' | 'rect' | 'circle'`, default `'text'`), `width`/`height` (CSS length; text defaults to `1em` height, random-stable widths), `lines` (`number`, text shape convenience), `animated` (`boolean`, default `true`).

**Contract** — skeletons are `aria-hidden`; the replaced region carries `aria-busy="true"` and an accessible loading text (`role="status"` "Loading {what}" — provided by the surface, e.g. Table). Skeleton layout must mirror final content dimensions (no layout shift on swap). Never skeleton beyond 3 viewport-heights — paginate/virtualize instead. **Tokens** — base `color.surface-alt`; shimmer overlay gradient between `color.surface-alt` and `color.surface`; `radius.sm` (text) / `radius.md` (rect) / `radius.full` (circle); shimmer `motion.duration-loop` cycle (corrected 2026-07-18, visual QA — `duration-slow`'s 400ms strobes; the loop token is the shimmer cadence per FDS 2.12); reduced-motion: static.

### 2.33 FxEmptyState — Empty State

**Anatomy**

```
.fx-empty-state                     [data-size=sm|md|lg]
├─ .fx-empty-state-media?           (icon/illustration, aria-hidden)
├─ .fx-empty-state-title
├─ .fx-empty-state-description?
└─ .fx-empty-state-actions?         (primary FxButton + optional secondary/link)
```

**Props** — `title` (required), `description`, `icon`/`illustration`, `actions` (Node), `size` (`sm` inline/table, `md` panel, `lg` full-page). Copy rules: 10 § Empty states (title = what's true, description = what to do). **ARIA** — plain content; when replacing async-loaded content, mount inside the surface's `role="status"` context so the transition announces. **Tokens** — media `color.text-subtle`; title `text.heading-md` (sm size: `text.body` + `text.label` weight); description `text.body` `color.text-muted`; vertical gaps `space.4`; container padding `space.12` (lg) / `space.8` (md) / `space.4` (sm).

### 2.34 FxTabs — Tabs

APG **tabs** pattern.

**Anatomy**

```
.fx-tabs                            [data-variant=underline|contained] [data-size]
├─ .fx-tabs-list                    role=tablist  [aria-orientation]
│  ├─ .fx-tabs-tab*                 role=tab  [.is-active] [aria-disabled]
│  │  ├─ .fx-tabs-tab-icon? / .fx-tabs-tab-label / .fx-tabs-tab-badge?  (FxBadge count)
│  └─ .fx-tabs-indicator            (animated underline, aria-hidden)
├─ .fx-tabs-overflow?               (scroll shadows + overflow menu on narrow)
└─ .fx-tabs-panel*                  role=tabpanel  (lazy-mount per `lazy`)
```

**Props**

| Prop | Type | Default | Description |
|---|---|---|---|
| `items` | `{ id: string; label: string; icon?: IconName; badge?: number; disabled?: boolean; content: Node }[]` | required | |
| `value` / `defaultValue` | `string` | — / first enabled | Active tab id. |
| `variant` | `'underline' \| 'contained'` | `'underline'` | |
| `activation` | `'auto' \| 'manual'` | `'auto'` | auto = focus selects; manual = `Enter/Space` selects (use for expensive panels). |
| `orientation` | `'horizontal' \| 'vertical'` | `'horizontal'` | |
| `lazy` | `boolean` | `true` | Mount panel on first activation; keep mounted after. |

**Events** — `onChange(id)`. **Keyboard** — `ArrowRight/Left` (or Down/Up vertical) move focus (wrap, skip disabled); `Home/End`; `Enter/Space` activate (manual); `Tab` from tab → active panel. **ARIA** — `tab[aria-selected][aria-controls]`, `tabpanel[aria-labelledby]`, panel `tabindex=0` when it has no focusable child. URL-bound tabs (route per tab) render links but keep the tablist roles (router integration note, 06). **Tokens** — label `text.label`; inactive `color.text-muted` hover `color.text`; active `color.primary` + indicator `color.primary` 2px; contained: active tab bg `color.surface` `radius.md` on `color.surface-alt` track; indicator slide `motion.duration-fast`.

### 2.35 FxBreadcrumb — Breadcrumb

**Anatomy** — `nav.fx-breadcrumb[aria-label]` → `ol.fx-breadcrumb-list` → `li.fx-breadcrumb-item*` (link | `.fx-breadcrumb-current` | `.fx-breadcrumb-ellipsis` Context-Menu trigger) + `.fx-breadcrumb-separator` (aria-hidden).

**Props**

| Prop | Type | Default | Description |
|---|---|---|---|
| `items` | `{ label: string; href?: string; icon?: IconName }[]` | required | Last item = current page (no href needed). |
| `maxItems` | `number` | `4` | Overflow collapses middle items into ellipsis menu (first + last 2 kept). |
| `ariaLabel` | `string` | `'Breadcrumb'` | i18n. |

**ARIA** — `nav` + `aria-current="page"` on last; separators decorative. **Keyboard** — links native; ellipsis opens FxContextMenu (menu keyboard contract). **Tokens** — link `color.text-muted` hover `color.text`; current `color.text` `text.label`; separator `color.text-subtle`; font `text.body-sm`; gap `space.2`. Mobile: collapses to single "‹ Parent" back link (README responsive).

### 2.36 FxPagination — Pagination

**Anatomy**

```
nav.fx-pagination                   [aria-label]
├─ .fx-pagination-summary?          ('1–20 of 254')
├─ .fx-pagination-pages             (.fx-pagination-prev / .fx-pagination-page* [.is-current] / .fx-pagination-gap / .fx-pagination-next)
└─ .fx-pagination-size?             (FxSelect: page size)
```

**Props**

| Prop | Type | Default | Description |
|---|---|---|---|
| `page` / `defaultPage` | `number` | — / `1` | 1-based. |
| `pageCount` | `number` | required* | *Cursor mode: omit and set `hasMore` — renders prev/next only (doc 09 pagination is cursor-based; numbered pages are for offset-capable sources). |
| `hasMore` | `boolean` | — | Cursor mode. |
| `siblingCount` | `number` | `1` | Pages adjacent to current; first/last always shown, gaps = `…`. |
| `pageSize` / `pageSizeOptions` | `number` / `number[]` | — / `[10, 20, 50, 100]` | Renders size select when provided. |
| `total` | `number` | — | Enables summary line. |
| `labels` | `{ nav; prev; next; page; gotoPage; summary; perPage }` | `'Pagination' / 'Previous' / 'Next' / 'Page {n}' / 'Go to page {n}' / '{from}–{to} of {total}' / 'Per page'` | i18n. |

**Events** — `onPageChange(page)`, `onPageSizeChange(size)`. **Keyboard** — buttons/links in DOM order; current page is a non-disabled button with `aria-current="page"`. **ARIA** — `nav[aria-label]`; prev/next disabled at bounds (`aria-disabled`, stay in tab order); page changes move focus nowhere (list re-renders in place; the data region announces via its own status). **Tokens** — page button 32px min, radius `radius.md`; current bg `color.primary` text `color.on-primary`; hover `color.surface-alt`; summary `text.body-sm` `color.text-muted`. Mobile: numbered pages collapse to prev/summary/next.

### 2.37 FxSearchBar — Search Bar

FxInput specialization for query-driven surfaces (list filtering, global search entry).

**Anatomy** — `.fx-search-bar` = FxInput anatomy with search icon start-affix, `clearable` on by default, optional `.fx-search-bar-shortcut` kbd hint (`⌘K`) and `.fx-search-bar-scope?` (FxSelect for scoped search).

**Props** — FxInput props (with `type='search'`), plus:

| Prop | Type | Default | Description |
|---|---|---|---|
| `debounceMs` | `number` | `300` | Doctrine default (05 § Search); `onChange` stays per-keystroke. |
| `shortcutHint` | `string \| false` | `false` | Visual kbd hint; binding the actual shortcut is the host's job (Command Palette owns ⌘K by default). |
| `scopeOptions` / `scope` / `onScopeChange` | `OptionItem[]` / `string` / `(v)=>void` | — | Scoped search. |
| `suggestions` | FxAutocomplete source props | — | When present, whole component follows FxAutocomplete combobox contract. |

**Events** — `onSearch(query)` (debounced), `onChange`, `onEnter(query)` (immediate submit). **Keyboard** — `Esc` clears then blurs; `Enter` fires `onEnter` immediately (cancels pending debounce). **ARIA** — `role="search"` on a wrapping form landmark; input labelled (`ariaLabel` default `'Search'`). Results count announced by the results region, not the bar. **Tokens** — as FxInput; kbd hint `color.text-subtle` `text.body-sm` border `color.border` `radius.sm` padding `space.1`.

### 2.38 FxCommandPalette — Command Palette

⌘K launcher: modal combobox over a command/entity index. Composes FxDialog (§2.43) + combobox listbox.

**Anatomy**

```
.fx-command-palette                 (FxDialog surface, top-aligned, width 640px, z.modal)
├─ .fx-command-palette-input        role=combobox (search icon, no border chrome — flat field)
├─ .fx-command-palette-list         role=listbox
│  └─ .fx-command-palette-group*    role=group + -group-label   ('Navigation', 'Actions', 'Recent')
│     └─ .fx-command-palette-item*  role=option [.is-active]
│        ├─ -item-icon? / -item-label / -item-hint?  (breadcrumb path)
│        └─ -item-kbd?              (shortcut display)
├─ .fx-command-palette-empty?       ('No results for "{q}"')
└─ .fx-command-palette-footer       (kbd legend: ↑↓ navigate · ↵ select · esc close)
```

**Props**

| Prop | Type | Default | Description |
|---|---|---|---|
| `open` / `defaultOpen` / `onOpenChange` | §1.5 | — | Host binds the global shortcut (default recommendation `⌘K`/`Ctrl+K`). |
| `commands` | `Command[]` | required | `Command = { id: string; label: string; group?: string; icon?: IconName; hint?: string; kbd?: string; keywords?: string[]; disabled?: boolean; perform: () => void \| Promise<void> }`. |
| `loadCommands` | `(query: string) => Promise<Command[]>` | — | Async augmentation (entity search); merged after static matches. |
| `filter` | `(query: string, cmd: Command) => number` | fuzzy default | Score fn; ≤0 excludes. |
| `recentIds` | `string[]` | — | Renders "Recent" group on empty query. |
| `placeholder` / `emptyLabel` | `string` | `'Type a command or search…'` / `'No results'` | i18n. |

**Events** — `onSelect(command)` (fires, then `perform()`, then close — unless `perform` throws: palette stays open, error toast is host's job), `onSearch(query)`, `onOpenChange(open)`.

**Keyboard** — `ArrowDown/Up` move active (wraps); `Enter` select; `Esc` close; `Tab` **does not** leave the input (dialog trap; Tab = no-op or moves within footer links); typing always edits the query (input keeps focus, `aria-activedescendant` navigation).

**ARIA** — dialog `aria-modal="true"` labelled `'Command palette'` (`ariaLabel` prop); combobox/listbox per FxAutocomplete; group labels `role="presentation"` text with `aria-labelledby` on groups; result count polite announce.

**Tokens** — surface `color.surface` `shadow.xl` `radius.xl` `z.modal`; backdrop `color.scrim`; active option bg `color.surface-alt` + start bar `color.primary`; group label `text.label` `color.text-muted`; kbd chips as SearchBar hint tokens; open animation `motion.duration-normal` `motion.easing-out` (scale 0.98→1 + fade; reduced-motion: fade only).

### 2.39 FxContextMenu — Context Menu

APG **menu** pattern; also the engine behind overflow ("⋯") menus, dropdown action menus, and Breadcrumb ellipsis.

**Anatomy**

```
.fx-context-menu                    (portal, z.popover)
└─ .fx-context-menu-list            role=menu
   ├─ .fx-context-menu-item*        role=menuitem [data-tone=danger?] [aria-disabled]
   │  ├─ -item-icon? / -item-label / -item-kbd? / -item-submenu-arrow?
   ├─ .fx-context-menu-checkbox-item*  role=menuitemcheckbox aria-checked
   ├─ .fx-context-menu-radio-group   role=group  (+ radio items role=menuitemradio)
   ├─ .fx-context-menu-separator*    role=separator
   ├─ .fx-context-menu-group-label*  (role=presentation)
   └─ .fx-context-menu-sub*          (nested menu, opens on hover/ArrowRight)
```

**Props**

| Prop | Type | Default | Description |
|---|---|---|---|
| `items` | `MenuItem[]` | required | `MenuItem = { id: string; label: string; icon?: IconName; kbd?: string; tone?: 'danger'; disabled?: boolean; type?: 'item' \| 'checkbox' \| 'radio' \| 'separator' \| 'label'; checked?: boolean; children?: MenuItem[] }`. |
| `trigger` | `'contextmenu' \| 'click'` | `'click'` | `contextmenu` = right-click/long-press on the wrapped target; `click` = dropdown from a trigger element. |
| `open` / `defaultOpen` / `onOpenChange` | §1.5 | — | |
| `placement` | `'bottom-start' \| 'bottom-end' \| …` | `'bottom-start'` | Auto-flips on collision. |

**Events** — `onSelect(item)` (closes menu unless `checkbox/radio` item — those toggle + stay open), `onOpenChange(open)`.

**Keyboard** — open from trigger: `Enter/Space/ArrowDown` (focus first item), `ArrowUp` (focus last); in menu: `Arrow` roving (wrap), `Home/End`, typeahead, `ArrowRight` open submenu / `ArrowLeft` close submenu, `Enter/Space` activate, `Esc` close + refocus trigger; `Tab` closes and moves on. Right-click mode: menu opens at pointer, focus to first item.

**ARIA** — trigger `aria-haspopup="menu" aria-expanded`; disabled items focusable (§1.7.3); danger items are visual only — destructive still needs confirmation flows (05). **Tokens** — surface `color.surface` `shadow.md` `radius.md` `z.popover` padding `space.1`; item padding `space.2`×`space.3` radius `radius.sm`; item hover/active bg `color.surface-alt`; danger item text `color.danger`; separator `color.border`; kbd `color.text-subtle`; min-width 180px.

### 2.40 FxToast — Toast

Transient, non-blocking notification. Managed by a single per-app `.fx-toast-region`.

**Anatomy**

```
.fx-toast-region                    (fixed, top-end desktop/tablet / top full-width mobile — 02-ui-kit/feedback.md; z.popover, above modal scrims; max 3 visible, queue)
└─ .fx-toast*                       [data-tone] role=status|alert
   ├─ .fx-toast-icon                (tone icon)
   ├─ .fx-toast-content             (.fx-toast-title / .fx-toast-description?)
   ├─ .fx-toast-action?             (single FxButton ghost sm)
   └─ .fx-toast-dismiss             (FxIconButton ghost sm ×)
```

**API** — imperative: `toast.show(options) → id`, `toast.dismiss(id)`, `toast.update(id, options)` (upload-progress pattern).

**Options**

| Option | Type | Default | Description |
|---|---|---|---|
| `tone` | `Tone` | `'neutral'` | |
| `title` | `string` | required | |
| `description` | `string` | — | 1–2 lines max; longer content belongs elsewhere (02). |
| `duration` | `number \| null` | `5000` (ms) | `null` = persistent until dismissed. Danger tone defaults to `8000`. Timer pauses on hover/focus and while window unfocused. |
| `action` | `{ label: string; onClick: () => void }` | — | Exactly one; **never a form, never navigation-critical** (§4). |
| `dismissible` | `boolean` | `true` | |
| `dismissLabel` | `string` | `'Dismiss'` | i18n. |

**Events** — `onDismiss(id, reason: 'timeout' | 'user' | 'action' | 'api')` per toast.

**Keyboard/ARIA** — toasts never steal focus; region is reachable via `Tab` when a toast holds action/dismiss buttons; recommend host binds a focus-region hotkey (`F6` rotation). `role="status"` (polite) for neutral/info/success; `role="alert"` for warning/danger. Screen-reader text = `title. description`. **Tokens** — surface `color.surface` `shadow.lg` `radius.lg` border-start 3px `color.<tone>`; icon `color.<tone>`; title `text.label`; description `text.body-sm` `color.text-muted`; width 360px (mobile: full-width − `space.4`); enter/exit slide+fade `motion.duration-normal` `motion.easing-out`/`in`.

### 2.41 FxAlert — Alert

Inline, persistent contextual message (page/section-level). Not a toast (transient) and not a Validation Message (field-level).

**Anatomy**

```
.fx-alert                           [data-tone] [data-appearance=subtle|solid] role=status|alert|none
├─ .fx-alert-icon
├─ .fx-alert-content                (.fx-alert-title? / .fx-alert-description / .fx-alert-actions?)
└─ .fx-alert-dismiss?
```

**Props**

| Prop | Type | Default | Description |
|---|---|---|---|
| `tone` | `Tone` | `'info'` | |
| `title` / `description` | `string \| Node` | — / required | |
| `appearance` | `'subtle' \| 'solid'` | `'subtle'` | |
| `dismissible` | `boolean` | `false` | Dismissal is session-scoped; persistence is the host's job. |
| `actions` | `Node` | — | Ghost/secondary buttons or links only. |
| `live` | `boolean` | `false` | `true` when injected after load: danger/warning → `role="alert"`, else `role="status"`. Statically rendered alerts have no live role. |

**Events** — `onDismiss()`. **Tokens** — subtle: bg tone tint (§1.9), border-start 3px `color.<tone>`, icon `color.<tone>`, text `color.text`; solid: bg `color.<tone>` text/icon `color.on-<tone>`; radius `radius.md`; padding `space.4`; title `text.label`; description `text.body`.

### 2.42 FxConfirmationDialog — Confirmation Dialog

Blocking decision point. Composes FxDialog with a fixed contract.

**Anatomy** — FxDialog (§2.43) sized `sm` (400px) with `.fx-confirmation-dialog` root: icon? + title + description + footer = exactly **Cancel (secondary) + Confirm (primary | danger)**, confirm on the end side.

**Props**

| Prop | Type | Default | Description |
|---|---|---|---|
| `open` / `onOpenChange` | §1.5 | required | |
| `title` | `string` | required | A question, not a statement (10 § dialogs). |
| `description` | `string \| Node` | required | Consequences, named object ("Delete *Q3 report*?"). |
| `tone` | `'default' \| 'danger'` | `'default'` | danger ⇒ confirm button `variant="danger"` + tone icon. |
| `confirmLabel` / `cancelLabel` | `string` | `'Confirm'` / `'Cancel'` | i18n. **Never** "Yes"/"No" (10). |
| `requireInput` | `string` | — | Type-to-confirm (e.g. resource name) for irreversible bulk destruction; confirm disabled until exact match. |

**Events** — `onConfirm() => void | Promise<void>` (async: confirm button `loading`, dialog stays open until resolve; reject keeps dialog open — error display is host's), `onCancel()` (also fired by `Esc`/backdrop/close).

**Keyboard/ARIA** — `role="alertdialog" aria-modal aria-labelledby aria-describedby`; initial focus = **Cancel** for `danger` tone, Confirm otherwise; `Esc` cancels. Focus trap + restore per FxDialog. **Tokens** — per FxDialog + danger icon `color.danger`.

### 2.43 FxDialog — Modal Layout (Dialog)

The modal surface contract. Inventory "Modal Layout" = this component; Confirmation Dialog, Command Palette, and modal editing (05) compose it.

**Anatomy**

```
.fx-dialog-backdrop                 (color.scrim, z.modal)
└─ .fx-dialog                       role=dialog aria-modal=true  [data-size=sm|md|lg|full]
   ├─ .fx-dialog-header             (.fx-dialog-title / .fx-dialog-close (FxIconButton ghost))
   ├─ .fx-dialog-body               (scrollable; header/footer stay pinned)
   └─ .fx-dialog-footer?            (actions, end-aligned; primary last)
```

**Props**

| Prop | Type | Default | Description |
|---|---|---|---|
| `open` / `defaultOpen` / `onOpenChange` | §1.5 | — | |
| `title` | `string` | required | `aria-labelledby`; `titleHidden` allowed (Command Palette). |
| `size` | `'sm' \| 'md' \| 'lg' \| 'full'` | `'md'` | 400 / 560 / 800px / full-screen. Mobile ≤767: `md+` become full-screen sheets. |
| `dismissible` | `boolean` | `true` | `false` disables Esc/backdrop/× (forced decision — rare, needs 02 sign-off). |
| `closeOnBackdrop` | `boolean` | `true` | |
| `initialFocus` | selector \| ref | first focusable | Never a destructive control. |
| `closeLabel` | `string` | `'Close'` | i18n. |

**Events** — `onOpenChange(false, reason: 'esc' | 'backdrop' | 'close-button' | 'api')`; host confirms unsaved-changes before closing (dialog exposes `onBeforeClose?: () => boolean | Promise<boolean>` veto hook).

**Keyboard** — `Esc` close (unless vetoed/dismissible=false); `Tab`/`Shift+Tab` cycle inside (focus trap); background inert (`inert` attr / `aria-hidden` on app root). Focus restores to the invoking element on close. **ARIA** — `role="dialog" aria-modal="true" aria-labelledby` (+`aria-describedby` when body starts with prose). Only one open dialog; stacking is a contract violation except Confirmation-over-Modal (one level, §4).

**Tokens** — surface `color.surface` `radius.xl` `shadow.xl`; backdrop `color.scrim`; header/footer padding `space.5`, body `space.5`; title `text.heading-md`; z `z.modal`; enter scale 0.98→1 + fade `motion.duration-normal` `motion.easing-out`, exit `motion.easing-in` (reduced-motion: fade).

### 2.44 FxRightDrawer — Right Drawer

Slide-in panel from the inline-end edge; detail/edit context without leaving the page (drawer editing, 05). Inventory "Right Drawer" (layouts) = this component.

**Anatomy**

```
.fx-drawer-backdrop?                (modal mode only, color.scrim, z.modal)
└─ .fx-drawer                       [data-side=end] [data-size=sm|md|lg] role=dialog|complementary
   ├─ .fx-drawer-header             (.fx-drawer-title / .fx-drawer-actions? / .fx-drawer-close)
   ├─ .fx-drawer-body               (scrollable)
   └─ .fx-drawer-footer?            (pinned actions)
```

**Props**

| Prop | Type | Default | Description |
|---|---|---|---|
| `open` / `defaultOpen` / `onOpenChange` | §1.5 | — | |
| `title` | `string` | required | |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | 400 / 560 / 720px; ≤767px always full-width sheet. |
| `modal` | `boolean` | `true` | `true`: scrim + focus trap (= dialog semantics). `false`: push/overlay panel, page stays interactive, `role="complementary"`, no trap. |
| `dismissible`, `closeLabel`, `onBeforeClose` | as FxDialog | | |

**Events/Keyboard/ARIA** — modal mode: identical to FxDialog (trap, Esc, restore focus). Non-modal: `Esc` closes when focus is inside; no trap; landmark labelled by title. **Tokens** — as FxDialog surface; slide-in from inline-end `motion.duration-normal` `motion.easing-out`; divider under header `color.border`.

### 2.45 FxTooltip — Tooltip

Text-only hover/focus hint. Never contains interactive content (use Popover-style composition via Context Menu / Drawer for rich content).

**Anatomy** — `.fx-tooltip` `[data-placement]` (portal, `z.tooltip`) → text + `.fx-tooltip-arrow?`.

**Props** — `content: string` (required; **plain text only**), `placement` (`'top' | 'bottom' | 'start' | 'end'`, default `'top'`, auto-flip), `delay` (`number`, default `600`ms open / 0 close; instant within 300ms of a previous tooltip), `disabled`.

**Behavior/ARIA** — shows on hover **and** focus of the trigger; hides on `Esc`, blur, pointer-leave; trigger gets `aria-describedby` → tooltip id, tooltip `role="tooltip"`. If the trigger has no visible label (IconButton), the tooltip may **not** replace `aria-label` — both exist. Touch: long-press shows; tooltip content must never be required for operation. **Tokens** — bg `color.text` (inverse surface), text `color.bg`, `text.body-sm`, radius `radius.sm`, padding `space.1`×`space.2`, `shadow.sm`, fade `motion.duration-fast`, max-width 280px.

### 2.46 FxSidebar — Sidebar

Primary app navigation rail (inside App Shell §3.1). Inventory "Sidebar" (navigation); "Nested Sidebar" extends it (§3.2).

**Anatomy**

```
nav.fx-sidebar                      [aria-label='Main'] [.is-collapsed] [data-density]
├─ .fx-sidebar-header               (logo / workspace switcher slot)
├─ .fx-sidebar-search?              (FxSearchBar sm or ⌘K trigger)
├─ .fx-sidebar-nav                  (scrollable)
│  ├─ .fx-sidebar-section*          (.fx-sidebar-section-label?)
│  │  └─ .fx-sidebar-item*          [.is-active] (link)
│  │     ├─ -item-icon / -item-label / -item-badge?  (FxBadge count)
├─ .fx-sidebar-footer               (user menu / settings / collapse toggle)
└─ .fx-sidebar-collapse             (FxIconButton, toggles .is-collapsed)
```

**Props**

| Prop | Type | Default | Description |
|---|---|---|---|
| `items` | `SidebarItem[]` | required | `SidebarItem = { key: Key; label: string; icon: IconName; href: string; badge?: number; section?: string; exact?: boolean }` — icons mandatory (collapsed mode shows icon only). |
| `activeKey` | `Key` | derived from URL | Controlled active item. |
| `collapsed` / `defaultCollapsed` / `onCollapsedChange` | `boolean` | — / `false` | Collapsed = 64px icon rail; expanded = 256px. Persisting the preference is host's job. |
| `header` / `footer` | `Node` | — | Slots. |
| `collapseLabel` / `expandLabel` | `string` | `'Collapse sidebar'` / `'Expand sidebar'` | i18n. |

**Events** — `onNavigate(item)` (before route change; host router integrates), `onCollapsedChange(collapsed)`.

**Keyboard** — items are links in DOM order; collapse toggle is a button; collapsed items get FxTooltip with label. Skip-link "Skip to content" precedes the sidebar in the shell (11). **ARIA** — `nav[aria-label]`; active item `aria-current="page"`; badges carry `srLabel`. **Responsive** — Tablet: starts collapsed; Mobile: sidebar becomes an off-canvas modal drawer (FxDrawer semantics, hamburger in Top Navigation) or the app uses Bottom Navigation instead (README).

**Tokens** — bg `color.surface` (or `color.bg` with border-end `color.border`); item radius `radius.md` padding `space.2`×`space.3` gap `space.1`; item text `color.text-muted` hover `color.text` bg `color.surface-alt`; active text `color.primary` bg primary tint (§1.9) + `text.label` weight; section label `text.label` `color.text-subtle`; width transition `motion.duration-normal` `motion.easing-standard`.

### 2.47 FxMetricCard — Metric Card

KPI display for dashboards. Composes FxCard.

**Anatomy**

```
.fx-metric-card                     (FxCard padding=md)
├─ .fx-metric-card-header           (.fx-metric-card-label / .fx-metric-card-info?  (FxTooltip trigger))
├─ .fx-metric-card-value            (+ .fx-metric-card-unit?)
├─ .fx-metric-card-delta?           [data-trend=up|down|flat] (icon + %)
├─ .fx-metric-card-sparkline?       (aria-hidden; data described by delta text)
└─ .fx-metric-card-footer?          (comparison caption / link)
```

**Props**

| Prop | Type | Default | Description |
|---|---|---|---|
| `label` | `string` | required | Metric name. |
| `value` | `string \| number \| Money` | required | Money renders locale-formatted (§1.8). |
| `delta` | `{ value: number; direction: 'up' \| 'down' \| 'flat'; positiveIs?: 'up' \| 'down' }` | — | `positiveIs` maps direction → tone (e.g. churn: down = good). Default `'up'`. |
| `caption` | `string` | — | e.g. `'vs. last 30 days'`. |
| `sparkline` | `number[]` | — | Decorative trend; `aria-hidden`. |
| `loading` | `boolean` | `false` | Skeleton value/delta, stable dimensions. |
| `href` / `onClick` | — | — | Whole-card drill-down per FxCard interactive rules. |
| `info` | `string` | — | Definition tooltip on ⓘ. |

**ARIA** — value + delta readable as one phrase: visually-hidden text `'{label}: {value}, {delta.value}% {direction} {caption}'`. Trend never color-only (arrow icon mandatory — §1.7.7). **Tokens** — label `text.label` `color.text-muted`; value `text.heading-xl` (sm size: `heading-lg`); delta up-good `color.success`, down-bad `color.danger`, flat `color.text-muted` (mapping flipped by `positiveIs`); sparkline stroke `color.primary` (or delta tone); gaps `space.2`.

---

## 3. Condensed contracts — remaining inventory

> Format per §1.1: anatomy one-liner · key props · composition · data shape · keyboard/ARIA **deltas only**. Everything else inherits §1 globals and the contracts of composed components. Domain data shapes here are canonical for docs 08/09 (camelCase fields, enums from §5).

### 3.1 Layouts

#### FxAppShell — App Shell
- **Anatomy:** `.fx-app-shell` grid → `.fx-app-shell-sidebar` (FxSidebar) + `.fx-app-shell-topbar?` + `main.fx-app-shell-content` (Content Area) + `.fx-app-shell-toast-region`.
- **Props:** `navigation: SidebarItem[]` · `topbar?: Node` · `sidebarCollapsed/onSidebarCollapsedChange` · `density` · `skipToContentLabel = 'Skip to content'`.
- **Composes:** Sidebar + Top Navigation + Content Area + Toast region. One App Shell per app; owns the landmark structure (`banner`/`navigation`/`main`) and the skip link (first tab stop).
- **Keyboard/ARIA deltas:** `F6` cycles landmark regions (recommended host binding); exactly one `main`.
- **Tokens:** bg `color.bg`; content max-width `size.container-xl` centered ≥ `bp.wide`.

#### FxSidebarLayout — Sidebar Layout
- **Anatomy:** `.fx-sidebar-layout` → fixed-width start pane (`.fx-sidebar-layout-aside`, 256px) + fluid `.fx-sidebar-layout-main`.
- **Props:** `aside: Node` · `asideWidth: 'sm' | 'md' = 'md'` (208/256px) · `collapsible = true` · `stickyAside = true`.
- **Composes:** generic two-pane shell used by App Shell and Settings Layout; not itself a landmark (children bring roles).
- **Responsive:** Tablet: aside collapses to icon rail; Mobile: aside becomes off-canvas drawer.

#### FxTopNavigationLayout — Top Navigation Layout
- **Anatomy:** `.fx-top-nav-layout` → `header.fx-top-nav-layout-bar` (Top Navigation, `z.sticky`) + `main.fx-top-nav-layout-content`.
- **Props:** `nav: Node` · `sticky = true` · `maxWidth: 'lg' | 'xl' | 'full' = 'xl'` (container tokens).
- **Composes:** Top Navigation + Content Area. Marketing/public-facing alternative to Sidebar-first shells (02 owns the choice rule).
- **Tokens:** bar bg `color.surface`, bottom border `color.border`, height 64px, `z.sticky`.

#### FxBottomNavigation — Bottom Navigation (Mobile)
- **Anatomy:** `nav.fx-bottom-nav[aria-label='Main']` (fixed bottom, `z.fixed`) → `.fx-bottom-nav-item*` (icon + label + badge?), 3–5 items.
- **Props:** `items: { key; label; icon; href; badge? }[]` (3–5 enforced) · `activeKey` · `labels` hidden only if ≥4 items **and** product accepts icon-only (needs 02 sign-off).
- **Data:** same `SidebarItem` shape minus `section`.
- **Keyboard/ARIA deltas:** links with `aria-current="page"`; safe-area inset padding; hidden ≥768px (Sidebar takes over).
- **Tokens:** bg `color.surface`, top border `color.border`, active `color.primary`, item min 44px touch, label `text.body-sm`.

#### FxContentArea — Content Area
- **Anatomy:** `main.fx-content-area` → `.fx-content-area-header` (Breadcrumb? + `h1.fx-content-area-title` + `.fx-content-area-actions`) + `.fx-content-area-body`.
- **Props:** `title: string` (required — the page `h1`) · `breadcrumb?: BreadcrumbItem[]` · `actions?: Node` (page-level buttons; max one primary) · `maxWidth: 'md' | 'lg' | 'xl' | 'full' = 'xl'` · `padding = 'space.6'` scale.
- **Composes:** Breadcrumb + Button(s). Route changes move focus to the title (`tabindex="-1"`), announcing the page.
- **Tokens:** title `text.heading-lg`; header gap `space.4`; body top margin `space.6`.

#### FxSplitView — Split View
- **Anatomy:** `.fx-split-view` → `.fx-split-view-list` (start pane, 320–400px) + `.fx-split-view-separator[role=separator]` (draggable) + `.fx-split-view-detail`.
- **Props:** `list/detail: Node` · `listWidth/defaultListWidth/onListWidthChange` · `minListWidth = 280` · `collapsed: 'none' | 'list' | 'detail'` (mobile shows one pane, back button in detail).
- **Keyboard/ARIA deltas:** separator `role="separator" aria-orientation="vertical" aria-valuenow` + `Arrow` keys resize (16px steps), `Enter` toggles collapse. Master-detail pattern (Messages, Disputes — 05).
- **Tokens:** separator hover `color.primary`; pane divider `color.border`.

#### FxWizardLayout — Wizard Layout
- **Anatomy:** `.fx-wizard-layout` → minimal header (logo + `.fx-wizard-layout-exit` "Save & exit") + centered column (`size.container-md`) hosting FxFormWizard + progress context.
- **Props:** `onExit()` · `exitLabel = 'Save & exit'` · `showSteps = true` · `footerSlot?`.
- **Composes:** Form Wizard (§2.18) inside a distraction-free shell — no Sidebar, no Top Navigation. Used by Seller Onboarding, Listing Editor create-mode (08).
- **Keyboard/ARIA deltas:** exit requires unsaved-changes confirm (`onBeforeClose` veto, as FxDialog).

#### FxSettingsLayout — Settings Layout
- **Anatomy:** `.fx-settings-layout` = Sidebar Layout with `.fx-settings-nav` (vertical link list, section groups) + `.fx-settings-content` (stacked `.fx-settings-section*`: title + description + Card of FieldGroups) + sticky `.fx-settings-save-bar?`.
- **Props:** `sections: { id; label; icon?; href }[]` · `activeId` · `dirty` · `onSave/onDiscard` · `saveLabel/discardLabel = 'Save changes'/'Discard'`.
- **Composes:** Card + Field Group + Button; save bar appears only when `dirty` (slides up, `role="status"` announce "You have unsaved changes").
- **Responsive:** Mobile: nav becomes a page; sections are sub-pages (06 URL scheme).

#### FxAuthenticationLayout — Authentication Layout
- **Anatomy:** `.fx-auth-layout` → centered `.fx-auth-layout-card` (`size.container-sm`÷2, ≈400px) with logo slot + `h1` + form slot + `.fx-auth-layout-footer` (switch-mode links); optional `.fx-auth-layout-aside` brand panel ≥1024px.
- **Props:** `title` · `logo?` · `footer?` · `aside?`.
- **Composes:** Field Group + Input family + Button primary fullWidth + Alert (auth errors — `live`).
- **Keyboard/ARIA deltas:** single `main`; error Alert focuses on failed submit.

#### FxDashboardLayout — Dashboard Layout
- **Anatomy:** `.fx-dashboard-layout` → Content Area header + `.fx-dashboard-grid` (12-col, gap `space.5`; widgets span 3/4/6/12).
- **Props:** `columns = 12` · `gap = 'space.5'` · `editable = false` (drag-rearrange mode — optional capability) · `onLayoutChange(layout)`.
- **Composes:** Metric Card, Statistics Card, Charts Container, Activity Feed, Widget — grid children only.
- **Responsive:** Tablet 2-col (span→6), Mobile 1-col stack in DOM order (which must be priority order).

#### FxBlankStateLayout — Blank State Layout
- **Anatomy:** `.fx-blank-state-layout` → full-content-area centered FxEmptyState `size="lg"` (+ optional illustration + secondary "Learn more" link).
- **Props:** proxies FxEmptyState props (`title`, `description`, `actions`, `illustration`).
- **Composes:** Empty State; used for first-run screens (no listings yet, no orders yet — 08 per-screen copy in 10).

### 3.2 Navigation (remaining)

#### FxNestedSidebar — Nested Sidebar
- **Anatomy:** FxSidebar where items may have `children` → `.fx-sidebar-item-toggle` (disclosure chevron) + indented `.fx-sidebar-subitems[role=group]`; max 2 levels.
- **Props:** FxSidebar props with `items: SidebarItem & { children?: SidebarItem[] }` · `expandedKeys/defaultExpandedKeys/onExpandedChange` · `autoExpandActive = true`.
- **Keyboard/ARIA deltas:** parent rows are disclosure buttons (`aria-expanded`), child links plain; collapsed rail: parent click opens flyout menu (Context Menu contract) instead of inline expansion.

#### FxTopNavigation — Top Navigation
- **Anatomy:** `header.fx-top-nav[role=banner]` → logo + `nav.fx-top-nav-links` (horizontal links, overflow → "More" Context Menu) + `.fx-top-nav-search?` (Search Bar/⌘K) + `.fx-top-nav-actions` (notification bell FxIconButton + FxBadge, user FxAvatar menu).
- **Props:** `items: SidebarItem[]` · `activeKey` · `search?: boolean | 'palette'` · `user?: { name; avatarSrc? }` · `userMenuItems: MenuItem[]` · `notificationCount?`.
- **Composes:** Link + Search Bar + Context Menu + Avatar + Badge.
- **Keyboard/ARIA deltas:** links `aria-current="page"`; user/notification menus follow menu pattern; mobile: links collapse behind hamburger → Drawer.
- **Tokens:** height 64px, bg `color.surface`, border-bottom `color.border`, `z.sticky`.

#### FxQuickActions — Quick Actions
- **Anatomy:** `.fx-quick-actions` → grid/row of `.fx-quick-action*` buttons (icon + label + description?), typically 2–6.
- **Props:** `actions: { id; label; icon; description?; href?; onClick?; disabled? }[]` · `columns = 'auto'` · `size`.
- **Composes:** Card-styled buttons; dashboard entry points ("Create listing", "Withdraw funds").
- **Keyboard/ARIA deltas:** plain buttons/links; no composite widget.
- **Tokens:** tile = Card tokens + hover `shadow.md`; icon `color.primary`; label `text.label`.

#### FxFloatingActionButton — Floating Action Button
- **Anatomy:** `.fx-fab` (fixed bottom-end, offset `space.5`, `z.fixed`) = FxButton primary circular 56px, icon + optional expanding label; optional speed-dial `.fx-fab-menu` (menu pattern).
- **Props:** `icon` (required) · `label` (required, `aria-label` + expanded text) · `extended = false` · `actions?: MenuItem[]` (speed-dial) · `hideOnScroll = true`.
- **Keyboard/ARIA deltas:** speed-dial = menu pattern (`aria-haspopup`, `Esc` closes). Mobile-primary affordance; ≥1024px prefer page-header actions (02).
- **Tokens:** bg `color.primary`, icon `color.on-primary`, `shadow.lg`, `radius.full`.

### 3.3 Dashboard (remaining)

#### FxStatisticsCard — Statistics Card
- **Anatomy:** `.fx-statistics-card` (FxCard) → header (label + range FxSelect/Tabs) + primary FxMetricCard row + `.fx-statistics-card-chart` (Charts Container slot) + breakdown FxDescriptionList?.
- **Props:** `title` · `metrics: MetricCardProps[]` (1–4) · `chart?: Node` · `range/onRangeChange` · `rangeOptions: OptionItem[]` · `loading`.
- **Composes:** Card + Metric Card + Charts Container. Multi-metric analytical block vs single-KPI Metric Card.
- **Data:** metrics reuse FxMetricCard props; chart data is the host chart lib's.

#### FxChartsContainer — Charts Container
- **Anatomy:** `.fx-charts-container` (FxCard) → header (title + legend + actions: range select, export Context Menu) + `.fx-charts-container-canvas` (host-provided chart) + `.fx-charts-container-table?` (accessible data table alternative, toggleable).
- **Props:** `title` (required) · `description?` · `legend?: { label; tone? }[]` · `actions?: Node` · `loading` · `empty?: EmptyStateProps` · `tableAlternative?: TableProps` · `tableToggleLabel = 'View as table'`.
- **Contract:** the kit does **not** ship a chart engine; this container standardizes chrome, loading (skeleton rect), empty, and the a11y escape hatch: canvas `role="img" aria-label` summary + optional data-table toggle (11).
- **Tokens:** canvas min-height 240px; legend swatches use tone/series tokens `color.primary`, `color.info`, `color.success`, `color.warning`, `color.danger` in fixed series order.

#### FxActivityFeed — Activity Feed
- **Anatomy:** `.fx-activity-feed` → `.fx-activity-feed-item*` (FxAvatar + rich sentence + relative FxTimestamp + optional object link) + `.fx-activity-feed-more` (load-more button).
- **Props:** `items: ActivityItem[]` · `loading` · `emptyState` · `onLoadMore?/hasMore` · `groupByDay = true` (sticky day headers) · `moreLabel = 'Show more'`.
- **Data:** `ActivityItem = { id; actor: { name; avatarSrc? }; verb: string; target?: { label; href? }; at: string (ISO); icon?; tone?: Tone }`.
- **Composes:** Avatar + Link + Badge; new items prepend with polite announce (`'{n} new activities'` — batched, no per-item announce).
- **Keyboard/ARIA deltas:** `role="feed"` with items `role="article" aria-posinset/setsize`; load-more is a button, never infinite-scroll-only (05).

#### FxTimeline — Timeline *(shared: Dashboard + Data display inventory)*
- **Anatomy:** `.fx-timeline[data-orientation=vertical]` → `.fx-timeline-item*` [data-state=complete|current|upcoming|failed] → `.fx-timeline-marker` (dot/icon on `.fx-timeline-rail`) + `.fx-timeline-content` (title + description? + timestamp? + slot).
- **Props:** `items: TimelineItem[]` · `orientation = 'vertical'` · `interactive = false` (items expandable via Accordion contract) · `dense`.
- **Data:** `TimelineItem = { id; title: string; description?: string; at?: string (ISO); state?: 'complete' | 'current' | 'upcoming' | 'failed'; icon?: IconName; tone?: Tone; content?: Node }`.
- **Keyboard/ARIA deltas:** ordered list semantics (`ol`); state conveyed in text (visually-hidden `'{state}'`), not marker color alone.
- **Tokens:** rail `color.border` (continuous — the line runs through the row gap to the next marker); complete marker `color.success`, current `color.primary` (+ ring), upcoming `color.text-subtle`, failed `color.danger`; title `text.label`; timestamp `text.body-sm` `color.text-muted`; row gap `space.5`.
- **Tone (amended 2026-07-18, visual QA):** a `complete` item carrying a domain `tone` renders its marker as a soft tint — `color.<tone>-soft` bg + `color.<tone>-border-soft` border + `color.<tone>` glyph (neutral = `color.surface-alt`/`color.border`/`color.text-muted`) — instead of the solid success paint, so activity/audit rails don't shout one colour per §1.9's calm-surface doctrine. `current`/`upcoming`/`failed` ignore `tone`: progress semantics outrank the tint. State remains conveyed in text.
- **Specializations:** Shipping/Escrow/Audit/Activity Timelines (§3.7/3.8/3.9) compose this with domain data mapped onto `TimelineItem`.

#### FxRecentActivity — Recent Activity
- **Anatomy:** `.fx-recent-activity` (FxCard) → title + compact FxActivityFeed (≤5 items, no day grouping) + "View all" FxLink footer.
- **Props:** `items: ActivityItem[]` (sliced to `limit = 5`) · `viewAllHref` · `viewAllLabel = 'View all activity'` · `title = 'Recent activity'` · `loading/emptyState`.
- **Composes:** Card + Activity Feed (dashboard widget wrapper).

#### FxProgressSummary — Progress Summary
- **Anatomy:** `.fx-progress-summary` (FxCard) → title + `.fx-progress-summary-item*` (label + FxProgress bar + `{done}/{total}` value) + optional overall ring.
- **Props:** `title` · `items: { id; label: string; value: number; max?: number; tone?: Tone; href? }[]` · `showOverall = false` · `format = '{value}/{max}'`.
- **Composes:** Card + Progress; used for onboarding checklists, profile completeness.
- **Keyboard/ARIA deltas:** each bar labelled by its row label; linked rows are plain links.

#### FxQuickLinks — Quick Links
- **Anatomy:** `.fx-quick-links` (FxCard) → title + `ul` of FxLink rows (icon + label + chevron).
- **Props:** `title = 'Quick links'` · `links: { label; href; icon?; external? }[]` · `columns = 1`.
- **Composes:** Card + Link. Pure navigation list — no metrics, no state.

#### FxWidget — Widget
- **Anatomy:** `.fx-widget` (FxCard) → `.fx-widget-header` (title + drag handle? + Context Menu "⋯": refresh/configure/remove) + `.fx-widget-body` (any dashboard component) + error/empty/loading states built in.
- **Props:** `title` (required) · `menuItems?: MenuItem[]` · `loading` · `error?: string` (renders inline Alert danger + `onRetry`) · `draggable = false` (Dashboard Layout editable mode) · `refreshedAt?: string`.
- **Contract:** Widget is the standard chrome every dashboard block sits in; Dashboard Layout only accepts Widget children in editable mode. Drag handle `aria-roledescription="Draggable widget"` + keyboard drag per Kanban contract (§3.5).

### 3.4 Forms (remaining)

> Password/Email/Phone/URL/Time inputs extend §2.4 FxInput — deltas only.

#### FxPasswordInput — Password Input
- **Deltas:** native `type="password"`; end-affix visibility toggle `.fx-password-input-toggle` (FxIconButton, `aria-label` `showLabel/hideLabel = 'Show password'/'Hide password'`, `aria-pressed`); toggle never disabled; `autoComplete = 'current-password' | 'new-password'` required prop.
- **Props (extra):** `strengthMeter?: (value) => { score: 0–4; label: string }` → renders `.fx-password-input-strength` (FxProgress, tone danger→success) + polite announce of label.
- **A11y:** value never announced; strength label is (`role="status"`).

#### FxEmailInput — Email Input
- **Deltas:** `type="email"`, `inputMode="email"`, `autoComplete="email"`; multiple-address entry is FxTagInput with `validateTag`, not this control. Optional `domainSuggestions` ("did you mean gmail.com?") renders a dismissible inline suggestion button — `onChange(value, {source:'option'})` when accepted.

#### FxPhoneInput — Phone Input
- **Deltas:** `inputMode="tel"`, `autoComplete="tel"`; start-affix `.fx-phone-input-country` (FxSelect of `{ code: 'US'; dial: '+1'; label }`, searchable). Value = `{ country: string; number: string }` (E.164 normalized on blur via `formatOnBlur = true`).
- **Props (extra):** `countries: CountryOption[]` · `defaultCountry` · `onCountryChange`.
- **A11y:** country select individually labelled `'Country code'` (`countryLabel` prop).

#### FxUrlInput — URL Input
- **Deltas:** `type="url"`, `inputMode="url"`; optional `protocolPrefix = 'https://'` rendered as start-affix (stored value includes it); paste normalizes whitespace; validity check on blur sets `.is-invalid` only via FieldGroup `error` (component itself never renders messages).

#### FxTimePicker — Time Picker
- **Deltas from FxDatePicker:** value = `'HH:mm'` (24h ISO); popover = scrollable listbox of interval options instead of calendar grid (combobox+listbox contract per FxSelect).
- **Props:** `step = 30` (minutes) · `min/max: 'HH:mm'` · `format: '12' | '24'` = locale · `allowInput = true` (parses "9am", "14:30").
- **Keyboard:** listbox = FxSelect; typed entry parsed on blur/Enter.
- **Tokens delta (amended 2026-07-18, doc 14 F-X4):** selected option = `color.primary-soft` bg + `color.primary` text; popover max-height 20rem — family conformance with Select/Autocomplete (was solid `color.primary` + 240px).

#### FxStepper — Stepper
- **Anatomy:** `.fx-stepper` → `.fx-stepper-decrement` + `.fx-stepper-value` (read-only or editable input) + `.fx-stepper-increment`. Compact quantity control (cart, guests).
- **Props:** `value/defaultValue: number` · `min = 0` / `max` / `step = 1` · `editable = false` · `incrementLabel/decrementLabel = 'Increase'/'Decrease'` · `size`.
- **Keyboard/ARIA deltas:** `role="spinbutton"` on value with `aria-valuemin/max/now`; `Arrow Up/Down` step; buttons repeat on hold; bounds disable respective button (`aria-disabled`, focusable).
- **Tokens:** grouped border `color.border-strong`, radius `radius.md`, buttons 32/40/48 square.
- Distinct from Number Input (§2.6 form field) and Form Wizard steps.

#### FxColorPicker — Color Picker
- **Anatomy:** `.fx-color-picker` → swatch trigger button (current color + hex text) + popover (`z.popover`) with `.fx-color-picker-area` (saturation/lightness pad) + hue slider + `.fx-color-picker-input` (hex field) + `.fx-color-picker-swatches?` (preset grid).
- **Props:** `value/defaultValue: string` (hex) · `swatches?: string[]` · `allowAlpha = false` · `format: 'hex' = 'hex'` · `label` (required for AT).
- **Keyboard/ARIA deltas:** pad = 2-D slider: `role="slider"` with both `aria-valuetext` ("Saturation 40%, Lightness 60%") and `Arrow` keys (+`Shift` = ×10); hue slider standard slider; swatches = radio group.
- **Note:** the user-picked value is by definition a literal — the *component's own chrome* still uses tokens; the value is data, not style (this is the FDS-sanctioned case, cf. builder custom-prop overrides).

#### FxDragDropUpload — Drag & Drop Upload
- **Anatomy:** `.fx-drag-drop-upload` = FxFileUpload (§2.17) whose trigger is a full dropzone `.fx-drag-drop-upload-zone` (dashed border, icon, `dropHint` + browse FxLink) with `.is-dragover` highlight.
- **Props:** all FxFileUpload props + `height = 160px-class` · `pasteTarget = false` (accept clipboard paste of files/images).
- **Keyboard/ARIA deltas:** the zone is a labelled button (Enter/Space opens file dialog) — drag is an enhancement, never the only path; global drag on window highlights the zone.
- **Tokens:** zone border `color.border-strong` dashed `border.2`, radius `radius.lg`, dragover border+text `color.primary` bg primary tint (§1.9).

#### FxAvatarUpload — Avatar Upload
- **Anatomy:** `.fx-avatar-upload` → FxAvatar `xl` preview + overlay edit button + Context Menu (Upload new / Remove) + optional crop FxDialog (square/circle mask, zoom Slider).
- **Props:** `value: string | null` (url) · `onUpload(file) => Promise<{url}>` · `onRemove()` · `name` (initials fallback) · `crop = true` · `maxSize` · labels `{ change; remove; cropTitle; zoom }`.
- **Composes:** Avatar + File Upload transport + Dialog + Slider.
- **A11y:** trigger `aria-label = 'Change profile photo'`; crop dialog is a standard modal.

#### FxImageGalleryUpload — Image Gallery Upload
- **Anatomy:** `.fx-image-gallery-upload` → grid of `.fx-image-gallery-upload-item*` (thumb + progress overlay + remove + drag handle + "Cover" Badge on first) + trailing add-tile (Drag & Drop Upload contract).
- **Props:** FxFileUpload props (`accept` images, `multiple = true`) + `maxFiles = 10` · `reorderable = true` · `onReorder(ids: string[])` · `coverBadgeLabel = 'Cover'`.
- **Data:** `UploadFile[]` (§2.17) — order meaningful, index 0 = cover image (09: listing `images[]` order is canonical).
- **Keyboard/ARIA deltas:** reorder via keyboard drag protocol: `Space` lift → `Arrow` move → `Space` drop / `Esc` cancel, moves announced (`'{name} moved to position {n} of {total}'`).

#### FxRichTextEditor — Rich Text Editor
- **Anatomy:** `.fx-rich-text-editor` → `.fx-rte-toolbar[role=toolbar]` (formatting FxIconButtons, grouped, overflow menu) + `.fx-rte-content[contenteditable role=textbox aria-multiline]` + FieldGroup integration.
- **Props:** `value/defaultValue: string` (sanitized HTML — sanitization is part of the contract, allowlist: p, br, strong, em, u, s, a[href], ul, ol, li, h2–h4, blockquote, code, pre, img[src|alt]) · `features: RteFeature[]` (default `['bold','italic','link','bulletList','orderedList']`; full set adds `heading`,`quote`,`code`,`image`,`table`) · `placeholder` · `maxLength` (plain-text count) · `onChange(html, { text })`.
- **Keyboard/ARIA deltas:** toolbar = APG toolbar (one tab stop, `Arrow` roving); standard shortcuts (`⌘B/I/K`); toggle buttons `aria-pressed`; link editing via small Dialog. `Esc` from toolbar returns to content.
- **Tokens:** toolbar bg `color.surface`, border-bottom `color.border`; content min-height 160px padding `space.4` `text.body`; active toggle bg primary tint.

#### FxMarkdownEditor — Markdown Editor
- **Anatomy:** `.fx-markdown-editor` → toolbar (as RTE, emits markdown syntax) + Tabs `Write | Preview` (or side-by-side ≥1024px `split = true`) + `.fx-md-textarea` (FxTextarea, monospace) + `.fx-md-preview` (rendered, sanitized as RTE allowlist).
- **Props:** `value/defaultValue: string` (markdown) · `split = false` · `features` as RTE · `previewLabel/writeLabel = 'Preview'/'Write'` · `renderMarkdown?: (md) => html` (host override).
- **Keyboard/ARIA deltas:** textarea stays a plain textarea (no contenteditable); `Tab` inserts indentation only inside list context, otherwise moves focus (documented, 11); preview `aria-live` off (user-initiated tab switch).

### 3.5 Data display (remaining)

#### FxVirtualTable — Virtual Table
- **Contract:** FxTable (§2.21) API + row virtualization for 1k–100k rows. Deltas: `rowHeight` fixed per density (no auto-height rows) · `overscan = 10` · `onVisibleRangeChange({start, end})` · scroll restoration by `rowKey`.
- **ARIA deltas:** `aria-rowcount` = total; rendered rows carry `aria-rowindex`; select-all operates on the full dataset via `onSelectionChange(['*'])` sentinel + `selectedAllExcept?: Key[]` (server-side selection contract — Bulk Actions Bar consumes it).
- **Restrictions:** no `sticky` columns beyond 1 per edge; no expandable rows (use Data Grid or master-detail).

#### FxKanbanBoard — Kanban Board
- **Anatomy:** `.fx-kanban` → `.fx-kanban-column*` (`role=group` labelled; header = title + count Badge + column menu) → `.fx-kanban-card*` (FxCard interactive, drag handle) + column footer add-button.
- **Props:** `columns: { id; title: string; limit?: number; tone?: Tone }[]` · `cards: KanbanCard[]` · `onCardMove({ cardId, from, to, index })` · `onCardClick(card)` · `renderCard?` · `addCardLabel`.
- **Data:** `KanbanCard = { id; columnId; title: string; description?: string; assignee?: { name; avatarSrc? }; badges?: BadgeProps[]; order: number }`.
- **Keyboard/ARIA deltas:** keyboard drag protocol (`Space` lift, `Arrow` move within/between columns, `Space` drop, `Esc` cancel) with live announcements (`'{title} moved to {column}, position {n}'`); columns horizontally scrollable, `Arrow` at card level navigates cards.
- **Tokens:** column bg `color.surface-alt` radius `radius.lg` padding `space.3`; over-limit count `color.danger`; drop indicator `color.primary` 2px.

#### FxCalendar — Calendar
- **Anatomy:** `.fx-calendar-view[data-view=month|week|day]` → toolbar (prev/today/next + title + view Tabs) + grid (`role=grid`; month: day cells with event chips + "+N more"; week/day: time gutter + positioned event blocks).
- **Props:** `events: CalendarEvent[]` · `view/defaultView/onViewChange` · `date/defaultDate/onDateChange (ISO)` · `onEventClick(event)` · `onSlotClick({ date, time? })` · `renderEvent?` · `weekStartsOn` · `labels { today; prev; next; more }`.
- **Data:** `CalendarEvent = { id; title: string; start: string; end: string (ISO datetime); allDay?: boolean; tone?: Tone; href? }`.
- **Keyboard/ARIA deltas:** grid keyboard per FxDatePicker calendar; event chips are buttons/links reachable within cells; "+N more" opens day popover (dialog).
- Distinct from FxDatePicker's internal `.fx-calendar` (single-date picking); this is the scheduling surface (Flexa Booking).

#### FxGallery — Gallery
- **Anatomy:** `.fx-gallery` → main `.fx-gallery-stage` (current image + prev/next FxIconButtons + counter) + `.fx-gallery-thumbs` (thumbnail listbox) + optional fullscreen FxDialog lightbox.
- **Props:** `images: { id; src: string; alt: string; caption?: string }[]` (alt required) · `index/defaultIndex/onIndexChange` · `lightbox = true` · `loop = true` · labels `{ prev; next; fullscreen; counter = '{n} of {total}' }`.
- **Keyboard/ARIA deltas:** stage `Arrow Left/Right` navigate; thumbs = listbox (roving, `Enter` selects); lightbox = dialog with same keys + `Esc`; changes announced via counter `role="status"`.
- **Tokens:** stage bg `color.surface-alt` radius `radius.lg`; active thumb ring `color.primary` `border.2`; caption `text.body-sm` `color.text-muted`.

#### FxMediaGrid — Media Grid
- **Anatomy:** `.fx-media-grid` → responsive tile grid `.fx-media-grid-item*` (thumb + type icon + name + meta; selection checkbox overlay; Context Menu per item).
- **Props:** `items: MediaItem[]` · `selectable: 'none' | 'multi'` · `selectedKeys/onSelectionChange` · `onItemOpen(item)` · `columns = 'auto'` (min tile 160px) · `loading/emptyState`.
- **Data:** `MediaItem = { id; name: string; kind: 'image' | 'video' | 'audio' | 'file'; thumbnailUrl?: string; url: string; size: number; createdAt: string }`.
- **Keyboard/ARIA deltas:** grid navigation (`role="grid"` single tab stop, `Arrow` 2-D roving, `Space` select, `Enter` open) — the file-manager surface (Flexa Media).

#### FxStatisticBlock — Statistic Block
- **Anatomy:** `.fx-statistic-block` → inline value + label (+ delta?) — the *unstyled* stat primitive Metric Card wraps in a Card.
- **Props:** `label` · `value` · `delta?` (as FxMetricCard) · `align: 'start' | 'center'` · `size: 'md' | 'lg'`.
- **Use:** stat rows inside other cards (Seller Card "98% positive · 1.2k sales"), page headers. Same ARIA sentence rule as Metric Card.
- **Tokens:** value `text.heading-lg`/`heading-md`; label `text.body-sm` `color.text-muted`.

#### FxRating — Rating
- **Anatomy:** `.fx-rating[data-readonly?]` → 5 `.fx-rating-star*` (fractional fills allowed read-only) + `.fx-rating-value?` ("4.6") + `.fx-rating-count?` ("(128)").
- **Props:** `value: number` (0–5, 0.1 precision read-only) · `readOnly = true` · `onChange(value: 1–5)` (input mode, integers) · `showValue/count` · `max = 5` · `label = 'Rating'` · `itemLabel = '{n} of {max} stars'`.
- **Keyboard/ARIA deltas:** input mode = radio group (`Arrow` select 1–5, labels "1 star"… ); read-only = `role="img" aria-label='Rated {value} out of {max}'`; count is a plain link when `countHref`.
- **Tokens:** filled `color.warning`, empty `color.border-strong`; sizes 16/20/24.

#### FxDescriptionList — Description List
- **Anatomy:** `dl.fx-description-list[data-layout=horizontal|vertical|grid]` → `.fx-description-list-row*` (`dt.fx-description-list-term` + `dd.fx-description-list-detail`).
- **Props:** `items: { term: string; detail: Node; span?: 1 | 2 }[]` · `layout = 'horizontal'` (term column 200px) · `columns = 1 | 2` (grid) · `divided = false`.
- **Use:** detail panes, order metadata, settings review (Order Detail, Invoice). Copy-to-clipboard details wrap in FxIconButton.
- **Tokens:** term `text.label` `color.text-muted`; detail `text.body`; row gap `space.3`; divider `color.border`.

### 3.6 Feedback (remaining)

#### FxLoadingOverlay — Loading Overlay
- **Anatomy:** `.fx-loading-overlay` (absolute, covers positioned parent) → scrim (`color.surface` at ≈75% translucency via `color-mix` on vars — no invented opacity tokens) + spinner + `.fx-loading-overlay-label?`.
- **Props:** `visible: boolean` · `label = 'Loading…'` · `blur = false` · `delayMs = 150` (skip flash for fast ops).
- **A11y:** container `aria-busy`; overlay `role="status"` announces label once; underlying content `inert`. Prefer Skeletons for initial loads; overlay is for *in-place refresh/mutation* (03).
- **Tokens:** spinner `color.primary`; z within container context only (no global z token — it's positioned, not floating).

#### FxInlineError — Inline Error
- **Anatomy:** `.fx-inline-error` → tone-danger icon + message + optional retry FxLink. Section-scale failure (a widget failed) — bigger than Validation Message, smaller than Error Page.
- **Props:** `message` (required) · `detail?` · `onRetry?/retryLabel = 'Try again'` · `compact`.
- **A11y:** `role="alert"` when replacing content after a failed async op.
- **Tokens:** icon/text `color.danger`; bg danger tint (§1.9); radius `radius.md`; padding `space.3`.

#### FxErrorPage — Error Page
- **Anatomy:** `.fx-error-page` = full Content-Area FxEmptyState lg with status code slot (`.fx-error-page-code`), title, description, actions (Go home / Retry / Contact support).
- **Props:** `code: 403 | 404 | 500 | 'offline' | string` · `title/description` (defaults per code from doc 10 tables) · `actions` · `requestId?` (support correlation, rendered `text.body-sm` `color.text-subtle`).
- **A11y:** `h1` = title; document title updates; focus to `h1` on mount.

#### FxSuccessPage — Success Page
- **Anatomy:** `.fx-success-page` = centered success icon (`color.success`, 48px) + `h1` + description + summary Card slot (e.g. order recap) + actions (primary next-step + secondary).
- **Props:** `title` (required) · `description` · `summary?: Node` · `actions` · `autoAdvance?: { href; afterMs; label }` (announced countdown).
- **Use:** checkout complete, onboarding complete (07 flow terminals).

#### FxWarningBanner — Warning Banner
- **Anatomy:** `.fx-warning-banner` = full-width FxAlert `tone="warning"` pinned above Content Area (below Top Navigation), `z.sticky`; optional single action + dismiss.
- **Props:** FxAlert props constrained: `tone` fixed `'warning'` · `sticky = true` · `dismissKey?` (host persists dismissal).
- **Use:** verification nudges, payment-method expiring, plan limits (08). Max one visible; queue by priority.

#### FxMaintenanceBanner — Maintenance Banner
- **Anatomy/Props:** as FxWarningBanner with `tone: 'info' | 'warning'`, `scheduledFor?: string (ISO)` rendered locale-formatted, `dismissible = false` while active window.
- **A11y:** `role="status"` on mount (not alert — it's ambient).

#### FxOfflineState — Offline State
- **Anatomy:** `.fx-offline-state` — two modes: **banner** (auto-mounted when `navigator.onLine` false: FxAlert warning "You're offline — changes will sync when reconnected") and **page** (FxErrorPage `code='offline'` for hard failures).
- **Props:** `mode: 'banner' | 'page'` · `onRetry` · `retryingLabel/onlineLabel` (reconnect announce `'Back online'` polite, banner auto-dismiss).
- **Contract:** detection event wiring is host's; component owns presentation + announcements.

### 3.7 Commerce

> All money fields are `Money` (§1.9). All statuses use §5 enums with the tone mappings given there — docs 08/09 reuse these shapes verbatim.

#### FxProductCard — Product Card
- **Anatomy:** `.fx-product-card` (FxCard interactive, media top) → image + title link + price + Rating? + seller? + wishlist FxIconButton? + status Badge?.
- **Props:** `product: ProductSummary` · `onAddToCart?` · `onWishlist?` · `orientation: 'vertical' | 'horizontal'` · `showSeller/showRating = true` · `loading` (skeleton).
- **Data:** `ProductSummary = { id; title: string; href: string; imageUrl: string; imageAlt: string; price: Money; compareAtPrice?: Money; rating?: number; ratingCount?: number; seller?: { id; name }; badgeTone?: Tone; badgeLabel?: string }`.
- **Composes:** Card + Rating + Badge + IconButton. Title link is the accessible action (§2.23 rule); price uses `<del>` for compareAt + visually-hidden "Original price / Sale price".

#### FxListingCard — Listing Card
- **Anatomy:** Product Card + marketplace listing chrome: `ListingStatus` Badge, metrics strip (views · favorites), owner actions Context Menu (Edit / Pause / Delete) when `mode='owner'`.
- **Props:** `listing: ListingSummary` · `mode: 'buyer' | 'owner' = 'buyer'` · `menuItems?: MenuItem[]` · `onSelect?` (moderation bulk contexts add checkbox).
- **Data:** `ListingSummary = ProductSummary & { status: ListingStatus; views?: number; favorites?: number; updatedAt: string }`.
- **Composes:** Product Card + Badge (status→tone per §5) + Context Menu.

#### FxPricingCard — Pricing Card
- **Anatomy:** `.fx-pricing-card` (FxCard, `.is-featured` variant elevates + primary border) → plan name + price (`Money`/period) + feature `ul` (check icons) + CTA FxButton + footnote.
- **Props:** `plan: { id; name: string; price: Money; period: 'month' | 'year' | 'one_time'; features: { label: string; included: boolean }[]; ctaLabel: string; featured?: boolean; badge?: string }` · `onSelect(planId)` · `current = false` (renders "Current plan", CTA disabled).
- **A11y:** excluded features get visually-hidden "not included" (not strike-only).
- **Tokens:** featured ring `color.primary` `border.2` + Badge; price `text.heading-xl`.

#### FxOrderCard — Order Card
- **Anatomy:** `.fx-order-card` (FxCard) → header (order number link + placedAt + `OrderStatus` Badge) + item thumbnails row (+N overflow) + footer (total + primary action per status: Pay / Track / Review / View).
- **Props:** `order: OrderSummary` · `perspective: 'buyer' | 'seller'` (action set + counterparty display) · `onAction(action: string, order)`.
- **Data:** `OrderSummary = { id; number: string; href: string; status: OrderStatus; total: Money; placedAt: string; itemCount: number; items: { id; title; imageUrl?; quantity }[]; buyer?: PartyRef; seller?: PartyRef }`; `PartyRef = { id; name: string; avatarSrc?: string; href?: string }`.
- **Composes:** Card + Badge + Avatar + Button.

#### FxInvoiceCard — Invoice Card
- **Anatomy:** `.fx-invoice-card` (FxCard) → header (invoice number + `InvoiceStatus` Badge + issued/due dates) + Description List (subtotal / tax / fees / total) + actions (Download PDF / Pay).
- **Props:** `invoice: InvoiceSummary` · `onDownload` · `onPay?`.
- **Data:** `InvoiceSummary = { id; number: string; status: InvoiceStatus; issuedAt: string; dueAt?: string; subtotal: Money; tax: Money; fees?: Money; total: Money; downloadUrl: string }`.
- **Composes:** Card + Badge + Description List + Button.

#### FxCartSummary — Cart Summary
- **Anatomy:** `.fx-cart-summary` → line-item list (thumb + title + FxStepper qty + line total + remove) + totals Description List + checkout FxButton primary fullWidth + promo-code disclosure (Input + apply).
- **Props:** `items: CartItem[]` · `totals: CartTotals` · `onQuantityChange(itemId, qty)` · `onRemove(itemId)` · `onCheckout()` · `onApplyPromo(code) => Promise` · `editable = true` · `labels { checkout; promo; apply; remove; subtotal; shipping; tax; total }`.
- **Data:** `CartItem = { id; listingId; title: string; imageUrl?: string; quantity: number; unitPrice: Money; lineTotal: Money; maxQuantity?: number }`; `CartTotals = { subtotal: Money; shipping?: Money; tax?: Money; discount?: Money; total: Money }`.
- **A11y deltas:** quantity/removal changes announce new totals politely (`'Subtotal {amount}'`); remove confirms only ≥ threshold quantity (02).

#### FxCheckoutSummary — Checkout Summary
- **Anatomy:** read-only Cart Summary (no steppers) + shipping/payment recap rows with per-section "Edit" links (jump to wizard step) + place-order slot.
- **Props:** `items/totals` as Cart Summary (read-only) · `sections: { id; label; summary: Node; onEdit() }[]` · `placeOrder: Node` (host renders the pay button — payment SDK territory) · `termsNote?: Node`.
- **Composes:** Cart Summary (read-only mode) + Description List + Link. Sticky aside ≥1024px; collapsible disclosure above the form on mobile.

#### FxPaymentStatus — Payment Status
- **Anatomy:** `.fx-payment-status` → Badge (status→tone) + amount + method (brand icon + `•••• 4242`) + timestamp + optional failure reason + retry action.
- **Props:** `payment: PaymentInfo` · `showAmount/showMethod = true` · `onRetry?` (failed only).
- **Data:** `PaymentInfo = { id; status: PaymentStatus; amount: Money; method?: { brand: string; last4?: string; label?: string }; processedAt?: string; failureReason?: string }`. `PaymentStatus` per §5.
- **A11y:** status text always rendered (icon+color never alone); failure reason wired `aria-describedby` to the badge.

#### FxShippingTimeline — Shipping Timeline
- **Anatomy:** FxTimeline vertical with shipment stages + carrier/tracking header row (carrier name + tracking number copy button + external track Link).
- **Props:** `shipment: Shipment` · `compact` · `estimatedLabel = 'Estimated'`.
- **Data:** `Shipment = { id; carrier?: string; trackingNumber?: string; trackingUrl?: string; status: ShipmentStatus; events: ShipmentEvent[]; estimatedDeliveryAt?: string }`; `ShipmentEvent = { id; status: ShipmentStatus; description?: string; location?: string; at: string }`. `ShipmentStatus` per §5.
- **Composes:** Timeline (events → `TimelineItem`: current = latest, upcoming = projected) + Link + IconButton (copy announces `'Tracking number copied'`).

#### FxEscrowTimeline — Escrow Timeline
- **Anatomy:** FxTimeline vertical, one item per escrow stage, current stage expanded with contextual action slot (e.g. "Approve delivery" Button, "Open dispute" ghost-danger Link) + held-amount header (`Money` + release conditions note).
- **Props:** `events: EscrowEvent[]` · `stage: EscrowStage` (current) · `amount: Money` · `perspective: 'buyer' | 'seller' | 'admin'` (which actions render) · `onAction(action: EscrowAction, event?)` · `disputed` styling when stage `'disputed'`.
- **Data:** `EscrowEvent = { id; stage: EscrowStage; status: 'complete' | 'current' | 'upcoming' | 'failed'; actor?: PartyRef; at?: string; note?: string }`; `EscrowAction = 'approve' | 'release' | 'dispute' | 'refund' | 'remind'`. `EscrowStage` per §5 — the canonical escrow vocabulary for docs 05 § Escrow Flow, 08 Order Detail, 09 `/orders/{id}/escrow-events`.
- **A11y deltas:** stage change announced politely; destructive actions (dispute, refund) route through Confirmation Dialog (§4).

#### FxReviewCard — Review Card
- **Anatomy:** `.fx-review-card` (FxCard) → header (Avatar + name + verified Badge? + Rating + date) + body text (clamped, "Read more") + images? (Gallery thumbs) + seller response block? + footer (helpful count button + report Context Menu).
- **Props:** `review: Review` · `onHelpful?` · `onReport?` · `onRespond?` (seller perspective) · `clampLines = 4`.
- **Data:** `Review = { id; author: PartyRef; rating: number; title?: string; body: string; createdAt: string; verified?: boolean; images?: { id; src; alt }[]; helpfulCount?: number; response?: { body: string; respondedAt: string } }`.
- **Composes:** Card + Avatar + Rating + Badge + Gallery.

#### FxSellerCard — Seller Card
- **Anatomy:** `.fx-seller-card` (FxCard) → Avatar lg + name link + verification/role Badge + Statistic Block row (rating · sales · response time) + member-since + actions (Contact / Follow / View store).
- **Props:** `seller: SellerSummary` · `actions?: Node` · `compact` (inline byline form for Listing Detail).
- **Data:** `SellerSummary = { id; name: string; href: string; avatarSrc?: string; verified?: boolean; rating?: number; ratingCount?: number; salesCount?: number; responseTime?: string; memberSince: string }`.
- **Composes:** Card + Avatar + Badge + Statistic Block + Rating + Button.

#### FxBuyerCard — Buyer Card
- **Anatomy/Props:** Seller Card contract with buyer-relevant stats (`orderCount`, `disputeRate?` — admin perspective only) and no store link.
- **Data:** `BuyerSummary = { id; name: string; avatarSrc?: string; memberSince: string; orderCount?: number; verified?: boolean }`.
- **Use:** seller Order Detail ("who bought"), admin User Detail summary.

#### FxMarketplaceStatistics — Marketplace Statistics
- **Anatomy:** `.fx-marketplace-statistics` = Dashboard-grid band of Metric Cards (GMV, orders, active listings, take-rate…) + range selector + optional Charts Container.
- **Props:** `metrics: MetricCardProps[]` · `range/onRangeChange/rangeOptions` · `columns = 4` · `loading`.
- **Composes:** Metric Card + Statistics Card + Charts Container; admin-dashboard specialization, no new primitives.

### 3.8 Collaboration

#### FxChat — Chat
- **Anatomy:** `.fx-chat` → header (counterparty Avatar + name + context link e.g. order) + `.fx-chat-messages[role=log]` (day separators; `.fx-chat-message*` `[data-self]`: bubble + time + read receipt; attachment cards) + typing indicator + composer (Textarea autoResize + attach FxIconButton + send FxButton primary).
- **Props:** `messages: ChatMessage[]` · `self: Key` (current user id) · `onSend({ body, attachments }) => Promise` · `onLoadOlder?/hasOlder` · `typing?: PartyRef[]` · `disabled?` (locked conversation reason banner) · `labels { send; attach; typing = '{name} is typing…'; newMessages }`.
- **Data:** `ChatMessage = { id; author: PartyRef; body: string; at: string; kind?: 'message' | 'system'; status?: 'sending' | 'sent' | 'read' | 'failed'; attachments?: { id; name; url; kind }[] }`. A `kind: 'system'` row is a centered **system event card** (e.g. "Order #1024 was created", "Escrow released") — not a bubble, no read receipt, no `data-self` — narrating lifecycle events inline in the conversation.
- **Keyboard/ARIA deltas:** messages region `role="log" aria-live="polite"` (only appended messages announce); `Enter` sends / `Shift+Enter` newline (`sendOnEnter = true`); scroll pinned to bottom unless user scrolled up → "New messages ↓" jump button; failed message row gets retry.
- **Tokens:** self bubble bg `color.primary` text `color.on-primary`; other bubble `color.surface-alt` text `color.text`; radius `radius.lg`; meta `text.body-sm` `color.text-muted`.

#### FxConversationList — Conversation List
- **Anatomy:** FxList (listbox) of conversation rows: Avatar (+unread dot) + name + snippet (1-line clamp) + relative time + unread count Badge; Search Bar header; archive swipe/menu.
- **Props:** `conversations: ConversationSummary[]` · `activeKey/onSelect` · `onArchive?` · `filter: 'all' | 'unread' = 'all'` · `loading/emptyState`.
- **Data:** `ConversationSummary = { id; participant: PartyRef; lastMessage: { body: string; at: string; self: boolean }; unreadCount: number; context?: { kind: 'order' | 'listing'; label: string } }`.
- **Composes:** List + Avatar + Badge + Search Bar; pairs with FxChat in Split View (05 § Messaging Flow). Unread rows `text.label` weight; `aria-label` includes unread count.

#### FxCommentThread — Comment Thread
- **Anatomy:** `.fx-comment-thread` → comment* (Avatar + author + time + body + actions row: reply/edit/delete/react) + nested replies (1 level, indent `space.8`) + inline reply composer.
- **Props:** `comments: Comment[]` · `onReply/onEdit/onDelete` · `maxDepth = 1` · `sort: 'newest' | 'oldest' = 'oldest'` · `canModerate`.
- **Data:** `Comment = { id; author: PartyRef; body: string; createdAt: string; editedAt?: string; parentId?: Key; deleted?: boolean }` (deleted renders tombstone "Comment removed").
- **Composes:** Avatar + Link + Textarea + Mention (composer). Delete → Confirmation Dialog.

#### FxMention — Mention
- **Anatomy:** two faces: (a) **token** `.fx-mention` inline chip in rendered text (link to profile), (b) **picker** — combobox popover triggered by `@` inside Textarea/RTE/Chat composers (FxAutocomplete listbox contract, avatar + name + handle rows).
- **Props (picker):** `loadUsers(query) => Promise<MentionUser[]>` · `trigger = '@'` · `maxResults = 8`; **(token):** `user: MentionUser` · `interactive = true`.
- **Data:** `MentionUser = { id; name: string; handle: string; avatarSrc?: string }`; serialized in text as `@[name](userId)` (09 message body convention).
- **Keyboard/ARIA deltas:** picker: `Arrow` navigate, `Enter/Tab` commit, `Esc` dismiss (returns plain text); combobox wiring on the composer while active.
- **Tokens:** token bg primary tint, text `color.primary`, radius `radius.sm`.

#### FxNotificationCenter — Notification Center
- **Anatomy:** bell FxIconButton (+count Badge) → popover panel (`z.popover`; header: title + "Mark all read" + settings link; Tabs All/Unread; FxList of notification rows: tone icon + text + time + unread dot; footer "View all") — full page reuses the same list.
- **Props:** `notifications: NotificationItem[]` · `unreadCount` · `onOpenChange` · `onItemClick(item)` (navigates + marks read) · `onMarkAllRead` · `onLoadMore/hasMore` · `labels { title = 'Notifications'; markAllRead; viewAll; empty }`.
- **Data:** `NotificationItem = { id; kind: string ('order.paid', 'message.created' — 09 webhook event names); title: string; body?: string; at: string; read: boolean; href?: string; tone?: Tone; actor?: PartyRef }`.
- **Keyboard/ARIA deltas:** panel = non-modal dialog (`Esc` closes, no trap); bell `aria-label = '{count} unread notifications'`; new-notification announce is the host's toast/live-region decision, not this panel's.

#### FxActivityTimeline — Activity Timeline
- **Anatomy:** FxTimeline + FxActivityFeed hybrid: chronological actor events on a rail, day-grouped, filter Chips by event kind.
- **Props:** `items: ActivityItem[]` (§3.3 shape) · `filters?: { id; label }[]` · `activeFilters/onFilterChange` · `onLoadMore/hasMore`.
- **Use:** entity-scoped history (this order, this listing, this user) vs dashboard-wide Activity Feed. Composes Timeline + Chip + Avatar.

#### FxAuditLog — Audit Log
- **Anatomy:** FxTable specialization: columns time (absolute UTC + relative FxTooltip) / actor (Avatar+name / "System" / API key) / action code Tag / target link / IP / details expander (Right Drawer with before→after JSON diff).
- **Props:** `entries: AuditEntry[]` · Table pagination/sort props (server-driven) · `onEntryOpen(entry)` · `columns?` subset config.
- **Data:** `AuditEntry = { id; at: string; actor: { kind: 'user' | 'system' | 'api'; id?: Key; name: string }; action: string ('listing.updated' — dot verb-noun, 09); target?: { kind: string; id: Key; label: string; href?: string }; ip?: string; changes?: { field: string; before: unknown; after: unknown }[] }`.
- **Contract:** read-only, immutable — no edit/delete affordances ever; export action allowed. Composes Table + Tag + Avatar + Right Drawer.

#### FxVersionHistory — Version History
- **Anatomy:** `.fx-version-history` (Right Drawer or panel) → FxList of versions (version label + author Avatar + time + change summary + Current Badge) + per-item actions (Preview / Restore) + optional side-by-side diff slot.
- **Props:** `versions: Version[]` · `currentId` · `onPreview(id)` · `onRestore(id)` (routes through Confirmation Dialog: "Restore version {n}? Current state becomes a new version.") · `diff?: Node`.
- **Data:** `Version = { id; number: number; label?: string; author: PartyRef; createdAt: string; summary?: string }`.
- **Composes:** List + Avatar + Badge + Confirmation Dialog. (Same contract flexa-builder's revisions UI follows: restore = load + undoable, never history rewrite.)

### 3.9 Admin

#### FxDataManagementToolbar — Data Management Toolbar
- **Anatomy:** `.fx-data-toolbar[role=toolbar]` above Table/Grid → Search Bar + filter trigger (Advanced Filters) + active-filter Chips row + Saved Filters select + spacer + density toggle + column-visibility Context Menu + export/refresh + primary create Button.
- **Props:** `search/onSearch` · `filters/onFilterChange` (FilterValue[], §below) · `savedFilters?: SavedFilter[]` · `columns?: { key; label; visible }[]` + `onColumnsChange` · `density/onDensityChange` · `actions?: Node` · `onExport?/onRefresh?`.
- **Keyboard/ARIA deltas:** APG toolbar — one tab stop, `Arrow` roving between controls; chips announce removal.
- **Composes:** Search Bar + Advanced Filters + Saved Filters + Chip + Context Menu + Button. The standard header for every admin list screen (08).

#### FxBulkActionsBar — Bulk Actions Bar
- **Anatomy:** `.fx-bulk-actions-bar` (slides over toolbar when selection > 0, `z.sticky`) → count label ("{n} selected") + select-all-matching Link (Virtual Table `'*'` contract) + action Buttons (≤4 + overflow menu; destructive = danger) + clear ×.
- **Props:** `selectedCount` · `totalCount?` · `actions: { id; label; icon?; tone?: 'danger'; disabled? }[]` · `onAction(id) => Promise` · `onClearSelection` · `onSelectAllMatching?` · `labels { selected = '{n} selected'; selectAll = 'Select all {total}'; clear }`.
- **Keyboard/ARIA deltas:** `role="toolbar"` labelled by count; count changes announce politely; appearing bar does not steal focus; destructive actions require Confirmation Dialog with count in title.
- **Tokens:** bg `color.primary` tint (§1.9) or `color.surface` + `shadow.md`; slide `motion.duration-fast`.

#### FxAdvancedFilters — Advanced Filters
- **Anatomy:** popover/Drawer from toolbar trigger → filter rows (`field` FxSelect + `operator` FxSelect + value control per field type) + AND note + add-row + footer (Clear all / Apply).
- **Props:** `fields: FilterField[]` · `value/defaultValue: FilterValue[]` · `onFilterChange(FilterValue[])` (fires on Apply — draft state is internal) · `maxRows = 5`.
- **Data:** `FilterField = { key: string; label: string; type: 'text' | 'number' | 'money' | 'select' | 'multiselect' | 'date' | 'daterange' | 'boolean'; options?: OptionItem[]; operators?: FilterOperator[] }`; `FilterOperator = 'eq' | 'neq' | 'contains' | 'gt' | 'gte' | 'lt' | 'lte' | 'between' | 'in' | 'is_empty' | 'not_empty'`; `FilterValue = { field: string; operator: FilterOperator; value: unknown }` — serializes to doc 09 list-endpoint query params.
- **Composes:** Select + Input family + Date Range Picker + Button; applied state renders as Chips in the toolbar (dismiss chip = remove filter).

#### FxSavedFilters — Saved Filters
- **Anatomy:** FxSelect of saved views + "Save current view…" item (name Dialog) + manage menu per item (rename / set default / delete).
- **Props:** `views: SavedFilter[]` · `activeId/onActiveChange` · `onSave(name, filters)` · `onRename/onDelete/onSetDefault` · `canManage`.
- **Data:** `SavedFilter = { id; name: string; filters: FilterValue[]; sort?: SortState; columns?: string[]; default?: boolean; shared?: boolean }`.
- **Composes:** Select + Dialog + Context Menu + Confirmation Dialog (delete).

#### FxRoleBadge — Role Badge
- **Anatomy:** FxBadge specialization: fixed role→tone/icon mapping.
- **Props:** `role: UserRole` · `appearance = 'subtle'` · `size`.
- **Data:** `UserRole = 'guest' | 'buyer' | 'seller' | 'admin' | 'support' | 'moderator'` (README personas + restricted-admin roles). Tones: admin `danger`, support/moderator `warning`, seller `info`, buyer `neutral`, guest `neutral` outline.
- **Contract:** the *only* way to render a role — screens never hand-pick role colors (08).

#### FxPermissionMatrix — Permission Matrix
- **Anatomy:** grid table: rows = permissions (grouped by domain: Listings / Orders / Users…), columns = roles (`UserRole`), cells = FxCheckbox (editable) or check/dash icon (read-only); sticky first column + header.
- **Props:** `permissions: { id; label: string; group: string; description? }[]` · `roles: UserRole[]` · `value: Record<permissionId, UserRole[]>` · `onChange(permissionId, role, granted)` · `readOnly = false` · `inherited?: (permissionId, role) => boolean` (inherited grants render dimmed dash-check, tooltip "Inherited from {role}").
- **Keyboard/ARIA deltas:** APG grid navigation (as Data Grid); cell checkboxes labelled `'{permission} for {role}'`; group rows are row headers.
- **Composes:** Data Grid (read pattern) + Checkbox + Tooltip.

#### FxAuditTimeline — Audit Timeline
- **Anatomy:** FxTimeline rendering `AuditEntry[]` (§3.9 Audit Log shape) — vertical narrative view for a single entity ("who changed what, when") vs the Audit Log's flat table.
- **Props:** `entries: AuditEntry[]` · `onEntryOpen?` · `groupByDay = true` · `limit/onLoadMore`.
- **Composes:** Timeline + Avatar + Tag; entries map to `TimelineItem` with `tone` from action class (create=success, update=info, delete=danger).

#### FxSystemLogs — System Logs
- **Anatomy:** `.fx-system-logs` → toolbar (level multiselect Chips + service Select + time-range + live-tail Switch + search) + monospace virtualized log list (`.fx-system-logs-row*`: timestamp + level Badge + service Tag + message; expandable JSON context).
- **Props:** `entries: LogEntry[]` · `onQueryChange({ levels, service, range, search })` · `tail/onTailChange` · `onLoadOlder` · `wrap = false`.
- **Data:** `LogEntry = { id; at: string; level: LogLevel; service?: string; message: string; context?: Record<string, unknown> }`; `LogLevel = 'debug' | 'info' | 'warning' | 'error' | 'critical'` (tones: debug neutral, info info, warning warning, error/critical danger).
- **Keyboard/ARIA deltas:** live tail = `role="log"` politeness with announce throttling (level ≥ error only); tail auto-pauses on scroll-up (as Chat).
- **Tokens:** row font monospace stack (host-provided family token — proposed `font.family-mono`; alias `font.family-base` until shipped), size `text.body-sm`; row hover `color.surface-alt`.

#### FxQueueMonitor — Queue Monitor
- **Anatomy:** grid of per-queue Cards (queue name + depth Metric + throughput sparkline + oldest-job age + paused Badge) + drill-in Table of jobs.
- **Props:** `queues: QueueInfo[]` · `onQueueAction(queueId, 'pause' | 'resume' | 'drain')` (Confirmation for drain) · `onQueueOpen(queueId)` · `refreshInterval?` (auto-poll; `refreshedAt` display).
- **Data:** `QueueInfo = { id; name: string; depth: number; oldestAgeSec?: number; throughputPerMin?: number; paused: boolean; failedCount: number }`.
- **Composes:** Card + Metric Card + Badge + Table + Confirmation Dialog. Depth thresholds → tone (host-configured `warnAt/dangerAt`).

#### FxBackgroundJobsPanel — Background Jobs Panel
- **Anatomy:** Table/List of jobs: name + `JobStatus` Badge + Progress bar (running) + attempts (`2/5`) + started/duration + actions (Retry / Cancel / View payload Drawer).
- **Props:** `jobs: JobInfo[]` · `onRetry(id)` / `onCancel(id)` (Confirmation) · `onOpen(id)` · Table pagination props · `pollInterval?`.
- **Data:** `JobInfo = { id; name: string; status: JobStatus; progress?: number; attempts: number; maxAttempts: number; queuedAt: string; startedAt?: string; finishedAt?: string; error?: string }`. `JobStatus` per §5.
- **Composes:** Table + Badge + Progress + Right Drawer + Confirmation Dialog. Status transitions announce only for jobs the user acted on.

### 3.10 AI

> AI surfaces follow the platform doctrine (docs 13/18/20 flexa-builder): AI output is **proposed, gated, reversible**. Components here render proposal/review affordances — they never auto-apply.

#### FxAiAssistantPanel — AI Assistant Panel
- **Anatomy:** `.fx-ai-assistant` (Right Drawer non-modal or docked panel) → header (assistant name + model Badge? + Context Menu: clear/history) + transcript `role=log` (user turns + assistant turns; assistant turns may embed AI Suggestion Cards / Diff Viewer) + AI Generation Status row + FxPromptInput composer.
- **Props:** `messages: AiTurn[]` · `status: AiStatus` · `onSend(prompt, attachments?)` · `onStop()` · `onClear` · `suggestions?: string[]` (starter chips) · `disabled?` (+reason).
- **Data:** `AiTurn = { id; role: 'user' | 'assistant'; content: string; at: string; attachments?: …; proposal?: AiProposal }` (`AiProposal` → Approve/Reject Panel).
- **Keyboard/ARIA deltas:** transcript `role="log"` polite; streaming text announced on completion, not per-token; `Esc` in composer stops generation (`onStop`), second `Esc` closes panel.
- **Composes:** Drawer + Prompt Input + AI Generation Status + AI Suggestion Card + Approve/Reject Panel + Chip.

#### FxPromptInput — Prompt Input
- **Anatomy:** `.fx-prompt-input` → Textarea autoResize (1→6 rows) + attach FxIconButton? + mic? + send FxButton primary (⇄ stop FxIconButton while `status='generating'`) + char/token counter? + hint row ("↵ send · ⇧↵ newline").
- **Props:** `value/defaultValue` · `onSubmit(prompt)` · `onStop?` · `status: AiStatus = 'idle'` · `placeholder = 'Ask anything…'` · `maxLength` · `attachments?: boolean` + `onAttach` · `sendLabel/stopLabel = 'Send'/'Stop'`.
- **Keyboard/ARIA deltas:** `Enter` submit / `Shift+Enter` newline; submit disabled on empty/whitespace; while generating the send slot becomes Stop (`aria-label` swap announced).
- **Composes:** Textarea + IconButton + Button.

#### FxAiSuggestionCard — AI Suggestion Card
- **Anatomy:** `.fx-ai-suggestion-card` (FxCard, AI-accent border-start + sparkle icon) → suggestion content (text/preview slot) + AI Confidence Indicator? + rationale disclosure ("Why this?") + action row (Apply primary-sm / Edit / Dismiss ghost).
- **Props:** `suggestion: AiSuggestion` · `onApply() => Promise` · `onEdit?` · `onDismiss` · `applied = false` (renders Applied Badge + Undo link).
- **Data:** `AiSuggestion = { id; kind: string; title?: string; content: Node | string; confidence?: number; rationale?: string }`.
- **Contract:** Apply is always undoable (one history entry — platform rule); card announces applied state politely.
- **Tokens:** accent border `color.info` (AI accent = info family; no bespoke AI color) + info tint bg; sparkle `color.info`.

#### FxAiGenerationStatus — AI Generation Status
- **Anatomy:** `.fx-ai-generation-status[data-status]` → animated icon (pulse while generating; reduced-motion static) + status text + elapsed seconds? + progress feed slot (step lines, flexa-builder `ProgressFeed` pattern) + Stop/Retry button.
- **Props:** `status: AiStatus` · `label?` (defaults per status: 'Waiting…' / 'Generating…' / 'Done' / 'Failed' / 'Stopped') · `steps?: { id; label: string; state: 'pending' | 'active' | 'done' | 'error' }[]` · `elapsedSec?` · `onStop?/onRetry?`.
- **Data:** `AiStatus = 'idle' | 'queued' | 'generating' | 'succeeded' | 'failed' | 'cancelled'` (§5).
- **A11y:** `role="status"` — announces status *transitions* only; failure switches to `role="alert"` once.

#### FxAiConfidenceIndicator — AI Confidence Indicator
- **Anatomy:** `.fx-ai-confidence[data-band]` → mini 3-segment meter + band label ("High confidence") + info Tooltip (how computed).
- **Props:** `value: number` (0–1) · `bands = { low: <0.4; medium: <0.75; high: ≥0.75 }` (canonical thresholds — docs 08/09 reuse) · `showLabel = true` · `labels { low = 'Low confidence'; medium = 'Medium confidence'; high = 'High confidence' }`.
- **A11y:** `role="img" aria-label='{band label} ({percent}%)'`; never color-only (label or tooltip text always present).
- **Tokens:** low `color.danger`, medium `color.warning`, high `color.success`; empty segments `color.surface-alt`.

#### FxAiDiffViewer — AI Diff Viewer
- **Anatomy:** `.fx-ai-diff` → header (change summary + file/field label + view toggle unified|split) + diff body (line/word-level: `.fx-ai-diff-add` / `.fx-ai-diff-del` rows with +/− gutters) + per-hunk accept/reject? + footer totals ("+12 −4").
- **Props:** `before: string` / `after: string` (or `hunks` precomputed) · `mode: 'unified' | 'split' = 'unified'` · `granularity: 'line' | 'word'` · `perHunkActions = false` + `onHunkDecision(hunkId, 'accept' | 'reject')` · `language?` (host highlighter).
- **A11y:** additions/deletions carry visually-hidden "added"/"removed" prefixes (not color/strike alone); totals summarized in one `role="status"` line.
- **Tokens:** add bg success tint + border-start `color.success`; del bg danger tint + `color.danger`; gutter `color.text-subtle`; mono font (as System Logs note).

#### FxApproveRejectPanel — Approve/Reject Panel
- **Anatomy:** `.fx-approve-reject` (sticky footer bar or card footer) → summary line ("AI proposes {n} changes") + View diff Link (opens Diff Viewer) + Reject ghost + Approve primary (+ optional "Approve & apply next" split) + decision note Input? (required on reject when `requireRejectReason`).
- **Props:** `summary: string` · `count?: number` · `onApprove() => Promise` · `onReject(reason?) => Promise` · `requireRejectReason = false` · `disabled/busy` · `approveLabel/rejectLabel = 'Approve'/'Reject'`.
- **Contract:** the single gate through which AI proposals become real (matches curation-queue/human-review doctrine): approve = apply (undoable), reject = discard + optional reason event. Buttons async per §1.6.
- **A11y:** decision announced (`'Changes approved' / 'Changes rejected'`, polite); panel `role="group" aria-label='Review AI changes'`.

#### FxAiActivityHistory — AI Activity History
- **Anatomy:** FxTimeline/List of past AI runs: prompt excerpt + status Badge + confidence + decision (approved/rejected/undone Badge) + actor + timestamp + expand (Drawer: full prompt, diff, result).
- **Props:** `runs: AiRun[]` · `onOpen(id)` · `onRerun?(id)` · pagination props · `filters?` (status/decision).
- **Data:** `AiRun = { id; prompt: string; status: AiStatus; confidence?: number; decision?: 'approved' | 'rejected' | 'undone'; actor: PartyRef; at: string; targetLabel?: string }`.
- **Composes:** Timeline + Badge + AI Confidence Indicator + Right Drawer. Immutable record (Audit Log discipline — no edits).

---

## 4. Composition rules

Binding constraints on which components may contain which. Violations are contract bugs, not style choices.

### 4.1 Overlay containment

| Container | May contain | Must never contain |
|---|---|---|
| **Toast** | title, description, **one** action button, dismiss | forms/inputs, links required to complete a task, another overlay, images |
| **Tooltip** | plain text only | anything interactive, headings, images (rich hover content → non-modal popover/Drawer) |
| **Alert / banners** | text, ≤2 low-emphasis actions, dismiss | form fields, primary page CTAs |
| **Confirmation Dialog** | icon, title, description, `requireInput` field, Cancel+Confirm | any other form fields, tabs, tables (that's a Modal) |
| **Dialog (Modal Layout)** | forms, tabs, tables, wizard steps | another Dialog (exception: **one** Confirmation Dialog may stack above it), Drawer, Toast region |
| **Right Drawer** | forms, lists, tables, detail views, Version History | Dialog inside Drawer (open it at app level), a second Drawer |
| **Context Menu** | menu items, checkbox/radio items, separators, **one** submenu level | form fields (except menu-item checkboxes/radios), buttons other than items |
| **Command Palette** | input, grouped options, kbd hints, footer legend | multi-step flows (launch them, don't host them) |

Global overlay budget: at most one Dialog + one Confirmation-over-Dialog + Toast region concurrently. Opening a Dialog closes open Context Menus/Tooltips. A Right Drawer may host at most one **Confirmation Dialog** above it (e.g. discard-changes guard — 05 § Drawer Editing); any other Dialog closes the Drawer first.

### 4.2 Data containers

- **Table/Virtual Table cells** may contain: text, Link, Badge, Tag, Chip, Avatar (+group), Rating (read-only), Progress, Payment Status (compact), inline actions (≤2 IconButtons + overflow Context Menu). Never: nested tables, forms other than the row checkbox, Accordions, media players.
- **Data Grid cells**: as Table plus the active cell editor (one editor at a time). Never: components that trap focus.
- **Card** may contain anything non-overlay; a Card may contain Cards only via an explicit grid slot (no ad-hoc nesting >1 level).
- **List items**: media + content + meta pattern; actions ≤2 + overflow. A List never nests a Table; a Tree never nests anything interactive inside the label row except the checkbox/toggle.
- **Kanban cards**: Badge/Avatar/Tag/text only — a Kanban card is a summary, editing happens in Drawer/Modal.
- **Timeline items**: text, Badge, Link, one contextual action slot (Escrow); never forms except the current-stage action slot.

### 4.3 Forms

- Every input renders inside a **Field Group** (label ownership). Bare inputs allowed only in composite widgets that provide labeling (Table filter row, toolbar Search Bar, Chat composer, Prompt Input).
- **Form Wizard** panels contain Field Groups/Cards; a wizard never nests another wizard; a wizard inside a Dialog uses `size='lg'` minimum.
- **Validation Message** appears only in a Field Group error slot or as documented sub-part (File Upload items); free-floating error text uses Inline Error or Alert.
- Destructive actions (danger Buttons/menu items) must route through **Confirmation Dialog** unless immediately undoable via Toast action (one or the other — both is noise, neither is a violation).

### 4.4 Navigation & shell

- One **App Shell** per document; one `main`; one Toast region; one Command Palette instance.
- **Sidebar** and **Bottom Navigation** are mutually exclusive per viewport (README responsive).
- **Tabs** never nest Tabs directly (one level per region; nested navigation = Sidebar/Nested Sidebar or secondary Tabs inside a Tab's *panel* only with 02 sign-off).
- **Breadcrumb** appears only in Content Area header, max one per page.
- **FAB** excludes a page-header primary action for the same verb (one primary affordance per action).

### 4.5 Feedback & AI

- Async mutation feedback ladder (03): optimistic inline state → Toast (success) / Inline Error or Alert (failure). Loading Overlay only for blocking in-place refresh; Skeleton only for initial loads.
- One assertive announcement per user action (§1.7.6) — composed components must not each announce (the owning surface speaks).
- **AI Suggestion Card / Diff Viewer / Approve-Reject Panel** are the only surfaces that may apply AI output, always via explicit user action, always undoable. AI components never wrap Confirmation Dialog *inside* themselves — approval **is** the confirmation.

---

## 5. Canonical domain enums (shared with docs 08/09)

Enum **values** are snake_case strings on the wire (JSON, camelCase field names — doc 09); TypeScript uses the string literals verbatim. Tone mappings are the only sanctioned status colorings (§1.7.7: always paired with text/icon).

```ts
type PaymentStatus = 'pending' | 'processing' | 'held' | 'released'
                   | 'refunded' | 'partially_refunded' | 'failed';

type EscrowStage   = 'payment_held' | 'delivered' | 'approved' | 'released' | 'disputed';

type OrderStatus   = 'created' | 'paid' | 'in_fulfilment'
                   | 'delivered' | 'completed' | 'cancelled';
// Dispute and refund are NOT order statuses — render "Disputed" from escrow
// stage `disputed` and "Refunded" from payment status `refunded`/`partially_refunded`.

type ShipmentStatus = 'label_created' | 'in_transit' | 'out_for_delivery'
                    | 'delivered' | 'delayed' | 'returned' | 'failed';

type InvoiceStatus = 'draft' | 'open' | 'paid' | 'overdue' | 'void' | 'refunded';

type ListingStatus = 'draft' | 'pending_review' | 'active' | 'paused' | 'rejected' | 'suspended' | 'archived';
// `paused` = seller-set visibility off; `suspended` = admin-set (09 § Listings).

type DisputeStatus = 'open' | 'seller_responded' | 'under_review' | 'resolved';
// On `resolved`, the dispute carries `resolution: 'refund' | 'release' | 'partial'`
// (09 § Disputes) — render the outcome from `resolution`, not from extra statuses.

type PayoutStatus  = 'scheduled' | 'processing' | 'paid' | 'failed' | 'on_hold';

type UserRole      = 'guest' | 'buyer' | 'seller' | 'admin' | 'support' | 'moderator';

type JobStatus     = 'queued' | 'running' | 'succeeded' | 'failed' | 'retrying' | 'cancelled';

type LogLevel      = 'debug' | 'info' | 'warning' | 'error' | 'critical';

type AiStatus      = 'idle' | 'queued' | 'generating' | 'succeeded' | 'failed' | 'cancelled';
type AiDecision    = 'approved' | 'rejected' | 'undone';
// Confidence bands (AI Confidence Indicator): low < 0.4 ≤ medium < 0.75 ≤ high
```

### Status → tone mapping (binding)

| Enum value class | Tone |
|---|---|
| pending / queued / draft / scheduled / idle / label_created | `neutral` |
| processing / in_transit / running / generating / open / under_review / seller_responded / in_fulfilment / out_for_delivery / held (escrow — holding is *normal*: 02-ui-kit/commerce.md § Payment Status) | `info` |
| paid / released / delivered / completed / active / succeeded / approved / resolved / online | `success` |
| created (order — awaiting payment) / on_hold (payout) / paused / delayed / overdue / partially_refunded / retrying / awaiting attention / warning-class | `warning` |
| failed / cancelled / rejected / disputed / void / refunded* / critical / error | `danger` |

\* `refunded` renders `neutral` in buyer-facing order history (a completed outcome) and `danger` only in payments/admin reconciliation views — the one context-sensitive mapping; screens must state which they use (08).

---

## Amendment log

**2026-07-18 — refinement audit (ui-kit doc 14, slice R7).** Contract corrections recorded after
the R1–R6 refinement slices shipped in `flexa-ui`:

- §1.2 — state encoding: `data-*` boolean attributes for new work; `.is-*` grandfathered (F-X6).
- §1.4 — control horizontal padding is two intentional ladders: action controls `space.3/4/5`
  vs text-entry family `space.2/3/4` (F-X1); anchored popover elevation is two tiers: listbox
  `md/md` vs popover dialog `lg/lg` — resolves the §2.8 (Select) vs §2.15 (Date Picker)
  inconsistency as a role rule (F-R1); one canonical close/dismiss-button spec (F-X4).
- §1.9 — soft tints are the FDS 2.12 `color.<tone>-soft` / `color.<tone>-border-soft` tokens;
  the "≈10% color-mix" recipe is superseded (F-C1); pressed deepening stays `color-mix` at 16%.
- §2.28 FxTag — capsule `radius.full` (F-R1). §2.29 FxChip — ladder corrected to 24/32/40,
  one notch below the control ladder (F-X7).
- §3 FxTimePicker — selected option = `color.primary-soft` bg + `color.primary` text (family
  grammar with Select/Autocomplete), popover max-height 20rem (F-X4).

**2026-07-18 — kitchen-sink visual QA (doc 10 §V) fixes:**

- §3.5 FxTimeline — (a) the rail is continuous: it runs through the row gap and meets the next
  marker (was stopping at the content box, leaving a dangling stub). (b) `tone` is now
  functional on `complete` items: soft-tint marker (`color.<tone>-soft` / `-border-soft` /
  tone glyph) instead of solid success for every event — activity/audit rails carry per-event
  tones. Other states keep their state paint. See the Tone note at §3.5.
- §3.5 FxRating — read-only stars painted correctly: an input-mode-only rule
  (`:not([data-filled])` → subtle) was unscoped and repainted the fractional overlay, so every
  read-only rating read empty. Painted stars are now also solid (`fill: currentColor` — the
  glyph is a stroke-outline icon; a warning-tinted outline did not read as "filled").
- §3.5 FxGallery — the inline counter now renders inside `.fx-gallery-stage` as the anatomy
  already specified (it was a sibling of the stage; being absolutely positioned it escaped the
  gallery and floated over unrelated page content).
- Portalled popovers now anchor to their triggers via a shared `useAnchorPosition` hook
  (`src/anchor.ts`, the tooltip pattern generalised): FxSelect, FxAutocomplete, FxTagInput,
  FxTimePicker, FxDatePicker, FxDateRangePicker, FxContextMenu. They portalled to `<body>`
  with no coordinates and landed at the viewport bottom-left (context menu: pinned top-left).
  Fixed positioning below the anchor, flips above when clipped, clamps to the viewport,
  matches trigger width for select-like fields, end-aligns menus, tracks scroll/resize.
- §3.9 FxSavedFilters — (a) the root row wraps (`flex-wrap`) so narrow containers (a 280px
  filter rail) drop the save action to a second line instead of overflowing into neighbouring
  columns; (b) "Save current view…" renders only when `onSave` is supplied — no handler → no
  affordance (conditional-action convention, e.g. §2.48 cart/wishlist). Read-only surfacings
  (named views without persistence) now show just the Select.
- §2.48 FxProductCard — decorative hover lift: translateY(−2px) + shadow `sm→md` + image
  `scale(1.02)` (media clips), `motion.duration-fast` + `easing-out`, gated behind
  `prefers-reduced-motion`. Decorative by design — the tile is not a link (title link /
  wishlist / cart live inside), so no `cursor: pointer` and no border change (elevation mode,
  doc 03). Skeleton tiles don't lift. Inherited by FxListingCard (§2.49).

**2026-07-18 — checkout polish (doc 10 §V, brief assessed against post-R1–R7 reality):**

- §2.18 FxFormWizard — (a) `complete` indicators are a quiet confirmation: `color.success-soft`
  background + success-coloured check, so only `current` carries a solid fill and the active
  step is the loudest thing in the nav (`error` stays solid danger — errors shout). (b) New
  optional `hideSubmit` prop: when the final step's submit affordance lives outside the wizard
  (a checkout rail CTA), the footer shows only Back on the last step — one primary CTA per
  screen, never two "Pay now" buttons side by side.
- FxCheckoutSummary — card chrome (border/radius/surface) moved from the `<details>`
  disclosure onto a `.fx-checkout-summary-card` wrapper, and the terms + place-order block now
  renders **outside** the disclosure: collapsing the summary on mobile can never hide the pay
  CTA. The place-slot button stretches to the rail width (`inline-size: 100%`) — the same
  stretch FxCartSummary gives its checkout button, so the sibling summaries agree. Hosts
  should pass a `size="lg"` primary button as `placeOrder` (48 on the control ladder).
- FxCartSummary — editable carts (the main checkout column) breathe one spacing step
  wider (`space-4` row gap/padding); the read-only recap rail keeps its compact `space-3`
  rhythm. Scoped on `[data-editable]`.
- §3.1 FxWizardLayout — new optional `width: 'md' | 'lg' | 'xl'` (default `md`, the focused
  single-column cap). Flows that carry a persistent side rail — checkout's form + summary —
  pass `lg`: the md cap crammed the two-column grid into 768px and squeezed the rail to
  ~245px (rail now ~333px at `lg`).
- FxCartSummary — the checkout button renders only when `onCheckout` is supplied (no handler
  → no affordance, §3.9 convention). Grouped per-seller carts inside the checkout wizard were
  each showing a dead full-width "Checkout" button mid-flow.
- §3.5 FxTimeline — blank-title items no longer render the empty title paragraph (the hidden
  state word moves to a standalone span after the slot), and a `:first-child` slot drops its
  top margin. Slot-first rows — FxActivityTimeline's rich `{actor} {verb} {target}` sentences
  — were sitting ~10px below their markers (empty line box + slot margin); a 20px avatar row
  now centres on the 24px marker exactly.

**2026-07-18 — card-surface fixes (doc 10 §V, second pass):**

- §2.48 FxProductCard — new optional `footer` slot: rows rendered **inside** the card
  surface after the body/actions (not in the loading skeleton). Exists so composers like
  FxListingCard can add chrome without it falling outside the card border.
- §2.49 FxListingCard — the metrics strip and owner row now render through that `footer`
  slot. As siblings after the inner FxProductCard they sat detached below its rounded
  border, floating on the page background flush with the container edge. Buyer-mode
  metrics closing the card pad `space-4` at the bottom to match the body inset; the
  status Badge and bulk-select checkbox stay shell overlays (they anchor to the media).
- §3.10 FxAiSuggestionCard — the intended `space-3` row gap was declared on the card
  root, but every row (head/content/confidence/rationale/actions) is an FxCard **body**
  child, so nothing but line-height separated them. The flex column + gap moved onto
  `.fx-card-body`; the rows now breathe at the designed rhythm.
- §2.48 FxProductCard — the media corner badge became a **badge stack**
  (`.fx-product-card-badges` + new `mediaOverlay` slot): extra badges (FxListingCard's
  status) stack above the built-in one, left-aligned with a `space.2` gap — two absolute
  overlays previously collided at the same corner, offset and near-touching. Over a photo
  the stack calms itself: badges square to `radius.lg` (a pill at badge height reads
  noisy) and the built-in badge renders `subtle`, not `solid` — a saturated fill over
  imagery shouts (R5 calm surfaces).
- §2.49 FxListingCard — the status Badge routes through that `mediaOverlay` slot (order:
  status above the corner badge); the bulk-select checkbox moves to the top-end media
  corner, clear of the stack (owner mode renders no wishlist button there).

---

*End of Component Bible. Change management: additive edits follow the FDS discipline — new props are optional with defaults, enum additions are appended, breaking changes require a version note here and sign-off against docs 02/08/09.*
