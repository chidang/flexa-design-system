# 14 — UI Kit Refinement Audit (2026-07-18)

> **STATUS: RESOLVED — historical record.** The full roadmap in §10 shipped the same day this
> audit was written: **R1** PR #272 (`c584cd1` typography repair + known-var gate) · **R2**
> PR #273 (`d5242f7` semantic type tier, kit off the ref ramp) · **R3** PR #276 (`98ac009`
> pressed/spinner/disabled) · **R4** PR #275 (`10e377e` focus rings, contrast, tap targets) ·
> **R5** PR #278 (`6b5afcd` calm surfaces) · **R6** PR #279 (`d459632` micro-consistency +
> ms gate) · **R7** PR #280 (doc 04 amendments + QA checklist), plus FDS 2.11.0 (PR #274) and
> 2.12.0 (PR #277). All merged to `main` 2026-07-18. Every count below describes the
> **pre-R1 state** — verified 2026-07-18 post-merge: zero dangling `var(--fx-…)` refs, zero
> `--fx-ref-*` bindings in `packages/ui`, known-var gate live in `token-discipline.spec.ts`.
> Read on for the *why* behind those slices, not for open work.

> Design-craft audit of flexa-ui (133 components, 141 dirs, `packages/ui/src`) against the FDS
> token SSOT (`packages/fds/src/fds.tokens.json`) and the kit's own contracts (docs 01/03/04/11).
> Produced by a 4-track parallel audit (typography/spacing · color/elevation/icons/hierarchy ·
> cross-component consistency · states/motion/a11y/token-gaps). **Audit only — no code changed.**
> Every count below was measured by grep/diff against the real emitted theme, not estimated.

## 1. Executive summary

The kit's *systems* are unusually disciplined — spacing is 99.4% tokenized, radius 100%, zero
color literals (CI-gated), one icon wrapper (Lucide via `FxIcon`, zero emoji), one status-tone
binding table, a pixel-perfect 32/40/48 control height ladder, one overlay elevation family, one
scrim, ARIA machinery at reference quality (dialog focus trap, roving tabindex tabs, APG
combobox), and 100% reduced-motion coverage on keyframe files.

What makes it *feel* rough is one silent Critical defect plus a tail of unconverged values:

**Critical — the typography layer does not render.** ~175 declarations across ~70 of 139 CSS
files reference CSS variables FDS never emits (`--fx-font-size-*` ×123, `font: var(--fx-text-*)`
×52, plus `--fx-font-weight-medium`, `--fx-line-height-tight`, `--fx-color-overlay`). Per CSS
spec these are invalid-at-computed-value-time → the property inherits. Result: dialog titles ≈
body text, the pricing-card price renders as plain copy, page titles (16px) smaller than card
titles (24px), 84 "small text" declarations render at 1rem. Roughly **45% of the kit ships with
no effective type scale** — the hierarchy was designed but never rendered. A further 324
declarations bind the forbidden `--fx-ref-*` tier directly (doc 01: "components never touch
refs"), so `Brand.fontScale` cannot move the kit. Three typography conventions coexist,
tracking the U1–U5 vs U6–U9 batch boundary; zero of them is the contract.

**Root cause:** `tests/token-discipline.spec.ts` validates what tokens *look like* (no hex, px
ladder) but never that a referenced `var(--fx-…)` *exists* in `emitTheme` output. Every Critical
finding passed a green CI.

Everything else is adoption drift, not missing vocabulary: FDS already ships motion, opacity,
shadow, z-index, scrim, and focus-ring tokens — the kit hand-rolls past them (`:active` styled
in 2/135 files while `*-active` tokens sit dead; 22 literal `120ms ease` transitions; 5 distinct
disabled-opacity values; 58 hand-rolled `color-mix` tints on 4 near-identical percentages).

## 2. Overall design quality score: **65 / 100**

| Track | Subscore |
|---|---|
| Typography · spacing · radius · borders | 55 (typography 22 · spacing 92 · radius 85 · borders 60) |
| Color · elevation · icons · hierarchy | 72 |
| Cross-component consistency | 64 |
| States · motion · a11y · tokens | 72 (ARIA 92 · focus 85 · pressed 25 · touch targets 20) |

With the Critical typography repair + the three S-sized behavior fixes (pressed, button spinner,
focus-ring stragglers) the kit lands at ~80; the full roadmap below targets 90+.

## 3. Strengths (protect these — do not regress)

- **Token discipline where gated**: 0 hex/rgb/hsl in 139 CSS files; 3,709 `var(--fx-*)` refs;
  spacing 99.4% tokenized (6 literal sites in the whole kit); radius 100% tokenized.
- **Icon system is the reference implementation**: one `FxIcon` wrapper, canonical name map with
  drift-lock test, hard-typed 16/20/24 ladder, `strokeWidth={2}`, `currentColor` only,
  decorative-by-default `aria-hidden`. Zero emoji as UI icons (197 call sites).
- **Status color**: one `status-tone.ts` binding table (~50 values) consumed by every commerce
  component; badge/tag/alert/toast all `data-tone` on identical vars.
- **Elevation**: every shadow in the kit is `var(--fx-shadow-sm|md|lg|xl)` — zero ad-hoc values;
  semantics consistent (sm resting / md popover / lg panel / xl modal).
- **Control heights**: 32/40/48 pixel-perfect across all 15 sized controls.
- **Overlay family**: one modal(xl/xl) → toast(lg/lg) → menu(md/md) → tooltip(sm/sm) ramp, one
  scrim var, one z ladder, shared reduced-motion handling.
- **Card chassis**: every domain card genuinely rides `FxCard`.
- **Hover grammar**: one coherent role-based language (surface-tint ×71 / border-strong ×20 /
  color ×15 / elevate ×4) with only 3 one-offs.
- **ARIA/keyboard**: dialog focus trap + restore, tabs roving tabindex, APG combobox with
  `aria-activedescendant`, tone-aware toast `role=status|alert`, 10+ `aria-live` sites.
- **Motion restraint**: no bouncy/decorative animation anywhere; loops only in progress
  indicators; `prefers-reduced-motion` guards on 100% of keyframe files.
- **Saturation restraint**: solid brand/status fills only on small elements; calm neutral
  surfaces throughout; dark scheme safe by construction (zero scheme queries in kit CSS).

## 4. Weaknesses (summary)

1. Typography layer silently dead (~175 refs) + 324 forbidden ref-tier bindings + 3 competing
   conventions + literal weights (600×22…) + off-ladder line-height 1.4 ×9.
2. No known-var gate — the entire bug class above is invisible to CI.
3. Pressed state missing kit-wide (2/135 files); button loading has no spinner; hover missing on
   checkbox/radio/switch; only 36/156 hovers guarded against disabled.
4. Touch targets: doc 11 mandates 44px; `pointer: coarse` has 0 hits; ~25 sub-44 controls.
5. Contrast: `text-subtle` (#94a3b8, 2.56:1) used ×80 in 51 files for *information* (timestamps,
   labels, placeholders); rating empty stars 1.48:1.
6. Border-heavy surfaces: `1px solid border` ×153 in 75 files; 27 files stack border+shadow
   against doc 04's "one, not both"; table = perimeter + full row grid.
7. Value drift: soft tints at 8/10/12/16% (58 `color-mix` sites); disabled opacity in 5 flavors
   vs the `--fx-opacity-disabled` token; 22 literal `120ms ease` transitions; spinners at
   240/400/600ms in 3 duplicated keyframes; 3 focus rings on the wrong token; close buttons
   3-way; tag(2px) vs chip/badge(pill) capsules side by side; dark-scheme shadows invisible.
8. Button (the template everyone copies) violates its own spec 5 ways: no spinner, ignores the
   only `--fx-c-*` component tokens FDS ships (0 uses kit-wide), `on-primary` on danger,
   `brightness(0.94)` hover one-off, stray `fx-button__label` BEM class.
9. `tokens-allowlist.ts` contains a false claim ("FDS exposes no border-width token tier" — it
   does: `--fx-border-0/1/2/4/8`, used once).

## 5. Detailed findings by category

Full per-track evidence (counts, file:line, comparison tables) lives in the four track reports;
the condensed findings:

### 5.1 Typography (22/100)
- **F-T1 Critical** — dangling vars: `--fx-font-size-sm` ×84 / `base` ×35 / `xl` ×3 / `2xl` ×1;
  `font: var(--fx-text-*)` ×52 in 19 files, of which `text.heading-sm` ×6 and `text.body-md` ×1
  don't exist even as token ids. Highest-visibility casualties: `pricing-card.css:42` (price),
  `payment-status.css:19` (amount), `dialog.css:56` (title), `content-area.css:50` (page h1),
  `button.css:13`. Zero definitions repo-wide.
- **F-T2 High** — 324 `--fx-ref-font-*` bindings in 66 files bypass theming (`Brand.fontScale`
  frozen for the kit).
- **F-T3 High** — literal weights (600×22, 500×6, 700×1 — page title is the kit's only 700 while
  dialog title is 600); line-height 1.4 ×9 (off the 1.2/1.5/1.75 ladder); tab/bottom-nav
  active-state weight jump causes label reflow.
- **F-T4 Medium** — letter-spacing ad hoc: 9 uppercase sites vs 6 tracking sites; values
  0.04em/0.02em/2px.
- **F-T5 Low** — heading font-family applied to 9 files but not page titles/drawer titles;
  monospace stack hardcoded ×3 (no `font.family-mono` token).

### 5.2 Spacing / radius / borders
- **F-S1 Low (praise)** — spacing 99.4% tokenized; 6 literal stragglers.
- **F-R1 Medium** — tag `radius-sm` (2px, near-square) vs chip/badge pills in the same row;
  `radius-sm` (0.125rem) is the kit's most-used radius (98×) mostly on inner rects where it
  reads as 0; date-picker popover `lg` vs select/autocomplete `md` (doc 04 is internally
  inconsistent here: line 587 vs 405).
- **F-B1 Medium/High** — border-on-everything (153×/75 files, 27 border+shadow stacks); worst:
  `table.css` (perimeter + row grid), `chat.css` (shell+header+composer all outlined),
  `authentication-layout.css:27` (border+shadow+xl), `calendar.css` full cell grid. `card.css`
  itself is the exemplary pattern (transparent border slot + shadow).
- **F-B2 Low** — border-width literals everywhere while `--fx-border-*` exists (used once);
  stale allowlist comment.

### 5.3 Color / elevation / icons / hierarchy
- **F-C1 Medium** — soft-tint drift: 58 `color-mix` sites; same intent at 8/10/12/16% (12% is
  the plurality); border mixes at 40% ×5.
- **F-C2 Low** — status micro-inconsistencies: notification unread dot = primary (an informal
  5th tone); ai-suggestion-card marks destructive as `warning` where the kit convention is
  `danger`.
- **F-E1 Medium** — no dark-scheme shadow overrides: `rgba(15,23,42,.08–.16)` vanishes on
  `neutral-900`; dark-mode cards (transparent border + invisible shadow) are edgeless.
- **F-H1** — hierarchy of flagship composites is ~80% a casualty of F-T1; residual:
  ai-suggestion-card container competes with its own Apply button (10% whole-card tint + accent
  bar + info sparkle + info link); notification item has 3 emphasis signals per row.
- Icons / literal discipline / saturation / dark-safety: exemplary, no action.

### 5.4 Consistency
- **F-X1 High** — control metrics contract split: button pads `space-3/4/5` per doc 04:87,
  the entire 14-strong input family pads one step tighter (`2/3/4`); button pins sm text at all
  sizes, inputs use base; date/time/range pickers skip sm/lg padding steps. Same-row
  button+input = equal heights, different rhythm.
- **F-X2 High** — Button conformance (5 spec violations, see §4.8).
- **F-X3 High** — card title 3-way: base card 24px/2xl vs domain cards' nonexistent
  `heading-sm` vs order-card `ref-base`; body gap wobbles 1/2/3/4 with no driver.
- **F-X4 Medium** — close/dismiss buttons 3-way (32px+tint / 24px+color / opacity); spinners
  4-way (240/400/600ms + button's missing one, 3 duplicated keyframes); time-picker selected
  option = solid primary while its select/autocomplete siblings use check+text (and max-height
  240px vs family 20rem); media-grid hover elevates to sm vs siblings' md.
- **F-X5 High (trivial)** — focus ring: canonical recipe ×146; 3 files on the wrong token
  (`--fx-color-primary` — breaks under HC/brand re-derive): `quick-links.css:43`,
  `recent-activity.css:17`, `activity-feed.css:115`; offset drift 0/1/3px ×4.
- **F-X6 Medium** — state encoding two-party system (`.is-selected` ×7 comps vs
  `[data-selected]` ×4; disabled 12 vs 35); badge heights in rem while chip/tag/avatar use px.
- **F-X7 Low** — chip is a shifted ladder (24/32/40 — chip lg = button md), undocumented.

### 5.5 States / motion / a11y / tokens
- **F-I1 Critical** — pressed state: `:active` in 2/135 files; `color.primary-active` used
  once, `secondary-active` never. UX bible §3 mandates <100ms pressed feedback.
- **F-I2 High** — button loading: no spinner rendered (`cursor: progress` only — fails touch);
  switch does it correctly (thumb spinner + reduced-motion fallback).
- **F-I3 High** — disabled: 5 opacity patterns (0.55 literal ×22 vs token 0.5 ×10 vs
  0.4/0.45/0.5/0.6 literals); `cursor: not-allowed` ×44 is the one consistent part.
- **F-I4 Medium** — hover gaps: checkbox/radio/switch zero `:hover`; only 36/156 hovers
  disabled-guarded.
- **F-M1 Medium** — 22 literal `120ms ease` transitions in 17 files (U1/U5 form controls) —
  value-identical to `duration.fast` today but detached from the token, and `ease` ≠
  `easing-standard`; loop durations 600/1200/1400ms off-scale.
- **F-A1 High** — touch targets: 0 `pointer: coarse` hits; sub-44 set = button md 40/sm 32,
  checkbox 20, switch 40×22, pagination 32, ~20 icon buttons (dismiss/clear/step/toggle).
- **F-A2 High** — `text-subtle` = 2.56:1 used ×80/51 files for information; placeholders same;
  rating empty stars `border-strong` = 1.48:1.
- **F-A3** — ARIA: strong (see §3); gaps: switch lacks invalid state; axe gate can't see open
  portals (known manual debt).

## 6. Priority matrix

| Priority | Items |
|---|---|
| **Critical** | F-T1 dangling typography vars · known-var gate · F-I1 pressed states |
| **High** | F-T2 ref-tier migration · F-T3 weight/line-height convergence · F-X2 button conformance · F-I2 button spinner · F-I3 disabled convergence · F-A1 touch targets · F-A2 text-subtle contrast · F-X1 control padding contract · F-X3 card title · F-X5 focus-ring stragglers · F-B1 (table/chat/auth) de-border |
| **Medium** | F-C1 tint convergence · F-E1 dark shadows · F-T4 letter-spacing · F-R1 capsule radius · F-X4 close/spinner/time-picker sweep · F-X6 state encoding · F-M1 motion literals · F-I4 hover gaps |
| **Low** | F-T5 heading family/mono · F-S1 spacing stragglers · F-B2 border-width literals + stale comment · F-C2 status micro · F-X7 chip ladder doc |

## 7. Recommended improvements — FDS Track A proposals (all additive, zero-dep, one SSOT)

The audit's most important correction to the brief: FDS already has motion/opacity/elevation/
overlay/z/focus-ring-color tokens. The genuine gaps, each backed by measured hand-rolling:

| Proposal | Replaces | Size |
|---|---|---|
| Emit semantic typography tier: `text.*` composites as `--fx-text-<name>-{size,weight,line-height}` custom properties (emitTheme addition — do NOT touch `emitBaseTypography`) | 175 dangling refs + 324 ref-tier bindings | M |
| `text.heading-sm` token (6 call sites already invented it) | nonexistent ids | S |
| `font.family-mono` | 3 hardcoded stacks | S |
| `font.tracking.wide = 0.04em` | 6 ad-hoc trackings, 9 untracked uppercase | S |
| `color.<tone>-soft` (+ `-border-soft`) derived tints @12%/40%, dark-derived | 58 `color-mix` sites | M |
| `color.danger-hover` (derive like primary-hover) | `brightness(0.94)` one-off | S |
| `focus.ring-width` / `focus.ring-offset` | 146 literal `2px/2px` repeats | S |
| `size.tap = 44px` + one `pointer: coarse` hit-area pattern | 0% touch-target compliance | S |
| `motion.duration-loop ≈ 1200ms` | 600/1200/1400ms ad-hoc loops | S |
| Dark-scheme `ref.shadow.*` overrides (higher alpha) in existing dark block | invisible dark elevation | S |
| Re-point `color.text-subtle` → `neutral.500` (#64748b, 4.76:1) — verify dark counterpart | 80 sub-AA text sites in one line | S |

Resist adding: elevation/z/overlay/opacity/motion-duration groups (exist — the work is adoption
+ gate extension, not vocabulary).

## 8. Estimated impact

- R1 alone (typography repair) visually changes ~70 components at once — it *restores the
  designed hierarchy*, the single biggest premium-feel delta available anywhere in the kit.
- R3 (pressed/spinner/disabled) is the biggest *felt* interaction delta per line of code.
- A2 contrast + touch targets convert the a11y guide's claims from aspiration to fact.
- All work is TS/CSS inside `packages/ui` + additive FDS emission — zero contact with the 4
  frozen engines, parity fixtures, PHP mirror, or `element-pack-demo`.

## 9. Risks

- **Intentional visual change at scale**: R1 changes rendered font sizes across ~70 components
  — screenshots will differ everywhere. Mitigate: land R1 as one slice, QA via kitchen-sink +
  the 4 reference screens, before any other visual slice.
- **`text-subtle` re-point** and **disabled-opacity decision** change FDS defaults — verify
  dark-scheme counterparts and run the FDS contrast gate.
- **De-bordering** is taste-level judgment per surface; do it surface-class by surface-class
  with side-by-side review, not a mechanical sweep.
- Gates must land *with* their migrations (known-var gate lands in R1; ms-literal gate in R6)
  or CI blocks unrelated work.

## 10. Roadmap (one slice = one PR, stacked; kitchen-sink QA after each)

| Slice | Content | Prio | Size |
|---|---|---|---|
| **R1** | Typography repair: mechanical rewrite of all dangling vars to working refs (`--fx-ref-font-*`, `--fx-color-scrim`; `font:` shorthands → longhand) + **known-var gate** in `token-discipline.spec.ts` (used vars ⊆ emitTheme(defaultTheme) ∪ file-local defs) + fix stale allowlist comment | Critical | S/M |
| **R2** | FDS Track A: emit `--fx-text-*` semantic tier + `text.heading-sm` + `family-mono` + `tracking.wide`; then migrate the kit off ref-tier onto semantic (kills 324 bindings; adds `var(--fx-ref-` reject rule for `packages/ui`); weight/line-height convergence (1.4 → decision; one 700 rule; kill tab weight-jump) | High | M |
| **R3** | Interaction: pressed states kit-wide via existing `*-active` tokens (~30 selectors); button conformance (spinner + loadingLabel, `--fx-c-button-*`, `on-danger`, `color.danger-hover`, label class); disabled → one token pattern; hover for checkbox/radio/switch; guard hovers | Critical/High | M |
| **R4** | A11y: `text-subtle` re-point (FDS) · 3 focus-ring token fixes + offset doc · rating stars · `size.tap` + `pointer: coarse` hit-area pattern on ~25 controls · switch invalid state | High | M |
| **R5** | Calm surfaces: de-border table/chat/auth-layout/calendar (card.css pattern; row-dividers-only tables) · dark shadow overrides · tint convergence onto `color.<tone>-soft` | Medium | M |
| **R6** | Micro-consistency: one close-button spec · one `FxSpinner` (or shared keyframes + duration var) · time-picker selected + max-height → family · media-grid shadow · capsule radius decision (tag) · letter-spacing pairing · motion literal migration + ms-literal gate · control padding contract decision (doc 04 amendment) | Medium | M |
| **R7** | Contract & docs: doc 04 amendments (control padding scale, chip ladder, state-encoding pick `data-*` for new work, date-picker popover radius) · full kitchen-sink + 4-screen visual QA pass · update doc 10 checklist | Medium | S |

Sequencing rule: R1 first and alone (it moves the most pixels); R2 before R5/R6 (they write
typography values); R3/R4 parallel-safe after R1.

## 11. U13 screen-composition gaps (consolidated from the marketplace-screens build)

> Source: the `GAPS:` blocks in `apps/ui-kitchen-sink/src/screens/{buyer,seller,admin,messages}/routes.tsx`
> + PR descriptions #289–#292 (doc 15 §6 protocol: closest component used, never a
> CSS patch or fork). These are candidate component slices — each row is additive
> API surface, none blocks the shipped screens.

| # | Component | Gap (screen / spec) | Suggested resolution |
|---|---|---|---|
| G1 | FxOrderCard | Footer action is the fixed status×perspective mapping — no per-row action slot, so the §3.6 inline "Approve" shortcut and the §3.8 "Write a review" CTA can't surface on a card | Optional `action` slot (overrides the mapped default) |
| G2 | Notification Center | FxNotificationCenter is the App-Shell bell popover only; no full-page list component (§3.7) — screen composed FxList + day groups + FxTabs | Extract a `FxNotificationList` (rows + day grouping) both surfaces share |
| G3 | Reviews | No "reviewable order" card (§3.8 asks Order Card slim + Write-review button) | Covered by G1's action slot |
| G4 | FxImageGalleryUpload | Requires real File objects (upload/reorder/cover) — a deterministic mock harness can't drive it; Listing Editor media step used Textarea + Alert placeholder (§2.9) | Accept pre-seeded `items` without File backing (fixture mode) |
| G5 | Data Management Toolbar | No tabs region — Moderation's "Pending / Reported / All" (§2.14) rendered as ordering + count Badge instead | Optional `tabs` slot between toolbar and table |
| G6 | Split View | No queue-walk affordance (J/K next/prev, §2.14 interaction 2) | Keyboard nav hook or `onNavigate` prop on the queue pane |
| G7 | Confirmation Dialog | No `confirmDisabled`, takes no children — partial-refund flow (amount input + gated confirm, §2.13) fell back to FxDialog | Add `confirmDisabled?` + content slot |
| G8 | Escrow Timeline | No inline admin-action slot on stage nodes (§2.13) — resolution Card owns the actions instead | Acceptable composition; only revisit if more surfaces need it |
| G9 | FxSegmentedControl | Missing — Messages "View as: Buyer / Seller" used FxTabs `contained` with empty panels (§2.7) | New small component: label + N options, no panel semantics |
| G10 | FxChat | `kind:'system'` rows render plain text — no `linkTo`/href for a clickable event card (§2.7); deep-link surfaced via header context link | Optional `link` on system messages |
| G11 | FxChat composer | No attachment picker in v1 (`onAttach` expects a host picker); attachment cards render from fixtures only | Defer until a media-backed harness exists (pairs with G4) |

Closed during U13-Z: the seller→admin→search ripple (approved listings now surface
in core `/v1/search`, derived from the shared moderation store; the
`sellerApprovedSearchCards()` seam in `handlers.seller.ts` remains for third-party
composition). Cross-persona behavior is drift-locked by
`packages/ui/mocks/integration.spec.ts` (3 ripple loops, msw setupServer over the
real handler array).
