# 01 — Design Tokens (FDS Bridge)

> **FDS already exists and is the SSOT for all tokens.** This document does not define tokens — it tells UI Kit consumers how to *use* FDS correctly. Normative sources: `flexa-design-system.md` (design doc), `packages/fds/src/fds.tokens.json` (registry, DTCG format), npm package **`flexa-design-system`** (FDS v2.9.x, 189 tokens).

## 1. The three tiers

| Tier | Prefix | Purpose | May UI Kit components reference it? |
|---|---|---|---|
| Reference | `ref.*` | Raw palette & scales (`ref.brand.500`, `ref.space.4`) | **No.** Themes re-point semantics to refs; components never touch refs. |
| Semantic | `color.* space.* radius.* shadow.* border.* font.* text.* motion.* z.* size.* bp.* opacity.*` | Meaning-bearing (`color.primary`, `space.4`, `motion.duration-fast`) | **Yes — the default.** |
| Component | `c.*` (e.g. `c.button.radius`, `c.button.padding-x`) | Per-component knobs a theme may override | Yes, for the component that owns them. |

Token id → CSS variable: `color.primary` → `var(--fx-color-primary)`, `space.4` → `var(--fx-space-4)`. Themes are emitted by `emitTheme` (TS) ≡ `Tokens.php` (PHP mirror) — char-identical, parity-locked. **Never hand-write a `--fx-*` value; never use a hex/px literal where a token exists.**

## 2. Semantic tokens you will actually use

### Color (26)

- Surfaces: `color.bg`, `color.surface`, `color.surface-alt`
- Text: `color.text`, `color.text-muted`, `color.text-subtle`
- Brand: `color.primary`, `color.on-primary`, `color.primary-hover`, `color.primary-active`; `color.secondary` + same family
- Lines & focus: `color.border`, `color.border-strong`, `color.focus-ring`, `color.scrim`
- Status pairs: `color.success/on-success`, `color.warning/on-warning`, `color.danger/on-danger`, `color.info/on-info`

Rules: text on a filled status/brand background always uses the paired `on-*` token. Focus outlines always `color.focus-ring`. Muted text is `text-muted` (secondary info) vs `text-subtle` (placeholders, disabled-adjacent). All shipped pairs pass WCAG AA — `contrast.ts` gates this in CI; a UI may not create new color combinations outside these pairs without running the same gate.

### Space (13 steps)

`space.0 1 2 3 4 5 6 8 10 12 16 20 24` — 4px base grid (`space.1` = 0.25rem … `space.24` = 6rem). Density (`Brand.density`, 0.8–1.2) rescales the whole ramp; never compensate with custom margins.

### Radius / Border / Shadow / Opacity

`radius.none sm md lg xl 2xl full` · `border.0 1 2 4 8` · `shadow.sm md lg xl` · `opacity.disabled`. Elevation is expressed with `shadow.*` + surface color, not borders (whitespace over borders — see 03 UX Bible).

### Typography

- Families: `font.family-base`, `font.family-heading`
- Composite styles: `text.heading-xl` (2.25rem/bold/tight), `text.heading-lg`, `text.heading-md`, `text.body` (1rem), `text.body-sm` (0.875rem), `text.label`
- Base typography for rendered content is emitted by `emitBaseTypography()`; app UIs consume `text.*` composites. Type scale is theme-driven (`Brand.fontScale`) — never hard-code font sizes.

### Motion

`motion.duration-fast` 120ms (hover, small fades) · `duration-normal` 240ms (drawers, dialogs, accordions) · `duration-slow` 400ms (page-level, wizard steps) · easing `motion.easing-standard | in | out | in-out`. Always honor `prefers-reduced-motion: reduce` (drop transforms, keep opacity ≤ fast, or disable).

### Z-index scale

`z.base` 0 · `z.dropdown` 1000 · `z.sticky` 1100 · `z.fixed` 1200 · `z.modal` 1300 · `z.popover` 1400 · `z.tooltip` 1500. Nothing may use a literal z-index; layering conflicts are resolved by choosing the correct token, never by +1.

### Sizing & breakpoints

Containers `size.container-sm/md/lg/xl/full` = 640/768/1024/1280px/100%. Breakpoint tokens `bp.tablet` 1024 · `bp.desktop` 1280 · `bp.wide` 1536. Canonical responsive ranges are defined in `README.md` (Mobile ≤767 / Tablet 768–1023 / Desktop 1024–1439 / Wide ≥1440).

## 3. Theming & schemes

- **Light/dark:** dark overrides ship in the default theme; scheme is toggled with `data-fx-scheme="light|dark"` on a root element (falls back to `prefers-color-scheme`). Components are scheme-agnostic by construction — they only reference semantic vars.
- **Branding:** `Brand` (primary/secondary colors, fonts, radius preset, container width, fontScale, density) → `applyBrand(theme, brand)` derives a full theme deterministically (hover/active shades, `on-*` contrast picks, focus ring). Products expose Brand knobs, not raw token editing.
- **Scoped themes:** a theme can be scoped to a subtree via `[data-fx-theme="<name>"]` — used for previews, packs, and embedding multiple looks on one page.

## 4. Hard rules (inherited by every other document)

1. No hex, no rgb(), no raw px for anything a token covers. Code review rejects literals.
2. Never reference `ref.*` from component styles. Never invent `--fx-*` names.
3. Status meaning only via the tone system (`info/success/warning/danger` + `on-*`); never color alone (pair with icon/text — see 11 Accessibility).
4. New tokens are proposed to FDS (additive, semver via `FDS_VERSION`) — the UI Kit never forks or shadows the registry.
5. Anything not covered by a token (rare, e.g. scrims over imagery) must be an explicit, documented literal with a rationale — the same discipline flexa-builder uses.
