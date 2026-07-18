/**
 * Flexa Design System — the default theme (Phase 5.5 Slice 3).
 *
 * A Theme (see `resolve.ts`) is pure DATA: a base token set plus alternate schemes.
 * The DEFAULT theme's base is the whole canonical registry (`FDS_TOKENS`, the light
 * mode). Its `dark` mode RE-POINTS the semantic color tokens to different primitive
 * steps — same names, so elements never learn the scheme (§3.3). `reducedMotion`
 * zeroes the motion durations under `prefers-reduced-motion` (§4).
 *
 * This is the SSOT assembler consumed by `emitTheme` at build time to produce the
 * cached theme stylesheet (`assets/flexa-theme.css`, cache-to-file per Phase 4).
 * It is TS-only: the PHP side serves the cached CSS (parity of `emitTheme` itself
 * is locked by fixtures, so a host that re-emits at runtime stays identical).
 *
 * The dark palette is contrast-checked in CI (`contrast.ts`) — every foreground /
 * background pair must clear WCAG 2.2 AA AND APCA (Lc ≥ 60 for UI labels) in BOTH
 * modes, plus non-text 3:1 and the colour-vision axis, or the build goes red.
 */

import { FDS_TOKENS, tokenIdToCssVar } from './index.js';
import type { EmitToken, Theme, ThemeMode } from './resolve.js';

/**
 * Dark-mode overrides: semantic color id -> the primitive it re-points to in dark.
 * Only names that differ from light appear; everything else inherits the base. Each
 * pair is designed to clear WCAG AA *and* APCA UI Lc ≥ 60 (enforced together by
 * `checkThemeContrast` + `checkThemeContrastApca`).
 *
 * Two families, two treatments — because each family has different steps available:
 *
 *  - Brand + slate go LIGHTER on dark with DARK ink (the Material/Carbon "tonal"
 *    approach). At `.400` the fill sat in the mid-luminance dead zone where NEITHER
 *    ink cleared APCA-60 (dark 54, white 55); moving one step lighter to `.300` lets
 *    the dark ink reach Lc 70 (brand) / 81 (slate) — a barely-perceptible shift that
 *    closes the finding.
 *  - Status fills go DARKER to `.600` with WHITE ink. The status ramps have no step
 *    lighter than `.500`, and `.500` is itself dead-zone (dark ink 44–45 Lc, white
 *    ink clears APCA but drops WCAG to ~3.2). `.600` escapes both ways: white ink
 *    reaches Lc 79–82 and WCAG ≥ 5:1. Danger already used white on `.500` and stays.
 */
export const DARK_MODE_OVERRIDES: Readonly<Record<string, string>> = {
  'color.bg': '{ref.neutral.950}',
  'color.surface': '{ref.neutral.900}',
  'color.surface-alt': '{ref.neutral.800}',
  'color.text': '{ref.neutral.50}',
  'color.text-muted': '{ref.neutral.300}',
  // text-subtle mirrors light's AA re-point (FDS 2.11): one step lighter than the
  // light value so it clears 4.5:1 on neutral.950/900 the way neutral.500 does on white.
  'color.text-subtle': '{ref.neutral.400}',
  'color.primary': '{ref.brand.300}',
  'color.on-primary': '{ref.neutral.950}',
  'color.primary-hover': '{ref.brand.200}',
  'color.primary-active': '{ref.brand.100}',
  // Secondary (FDS 2.1) — the slate accent mirrors the primary treatment: lighter on
  // dark (neutral.300) with dark ink, clearing WCAG AA and APCA UI Lc 81.
  'color.secondary': '{ref.neutral.300}',
  'color.on-secondary': '{ref.neutral.950}',
  'color.secondary-hover': '{ref.neutral.200}',
  'color.secondary-active': '{ref.neutral.100}',
  'color.border': '{ref.neutral.700}',
  'color.border-strong': '{ref.neutral.600}',
  'color.focus-ring': '{ref.brand.400}',
  // Status fills → the deeper `.600` step with white ink so the label clears APCA-60
  // (Lc ~80) while keeping WCAG ≥ 5:1 — `.500` was in the dead zone for both inks.
  'color.success': '{ref.success.600}',
  'color.on-success': '{ref.neutral.0}',
  'color.warning': '{ref.warning.600}',
  'color.on-warning': '{ref.neutral.0}',
  'color.danger': '{ref.danger.500}',
  'color.on-danger': '{ref.neutral.0}',
  // Danger interaction ramp (FDS 2.11): dark's danger is a dark fill with white ink,
  // so hover/active step DOWN the ramp from the dark base (.500), mirroring light.
  'color.danger-hover': '{ref.danger.600}',
  'color.danger-active': '{ref.danger.700}',
  'color.info': '{ref.info.600}',
  'color.on-info': '{ref.neutral.0}',
  // Soft tints (FDS 2.12): the dark tone mixed 12% (fill) / 40% (border) into the
  // dark surface (neutral.900) — literal hexes, not re-points, because the mixes
  // have no primitive step (same scrim-style precedent as the light values).
  'color.primary-soft': '#1f2c43',
  'color.primary-border-soft': '#445d7e',
  'color.success-soft': '#10242c',
  'color.success-border-soft': '#114132',
  'color.warning-soft': '#231e26',
  'color.warning-border-soft': '#512f1d',
  'color.danger-soft': '#28192a',
  'color.danger-border-soft': '#611d28',
  'color.info-soft': '#0f2236',
  'color.info-border-soft': '#0f3c53',
};

/**
 * Dark-scheme shadow overrides (FDS 2.12, ui-kit doc 14 F-E1): the light shadows'
 * slate ink at 8–16% alpha is invisible on `neutral.900/950`, leaving dark cards
 * edgeless (their border slot is transparent by design). Dark re-points the SAME
 * semantic ids to pure-black ink at elevation-scaled alpha — geometry (offset/blur/
 * spread) is unchanged so light and dark share one elevation language.
 */
export const DARK_SHADOW_OVERRIDES: Readonly<
  Record<string, Record<string, string>>
> = {
  'shadow.sm': { color: 'rgba(0,0,0,0.35)', offsetX: '0', offsetY: '1px', blur: '2px', spread: '0' },
  'shadow.md': { color: 'rgba(0,0,0,0.45)', offsetX: '0', offsetY: '4px', blur: '8px', spread: '-2px' },
  'shadow.lg': { color: 'rgba(0,0,0,0.55)', offsetX: '0', offsetY: '12px', blur: '20px', spread: '-4px' },
  'shadow.xl': { color: 'rgba(0,0,0,0.65)', offsetX: '0', offsetY: '24px', blur: '40px', spread: '-8px' },
};

/**
 * High-contrast overrides (`prefers-contrast: more`, scoped to the light base): the
 * neutral/brand roles re-point to the deepest steps so every text pair and solid
 * brand fill clears WCAG AAA (7:1) — text-muted 7.6→14.6, on-primary 5.2→8.7,
 * on-secondary 7.6→14.6 — while borders and the focus ring gain a dark, fully visible
 * value. A PARTIAL delta over the light base (only names that get stronger appear);
 * everything else inherits light. The status fills (`success`/`warning`/`danger`/
 * `info`) are intentionally NOT re-pointed: the ref palette has no darker saturated
 * step, so they keep their AA `.600` colour (hue carries the meaning) — an AAA status
 * ramp would need new primitives (a token change), deferred. `checkThemeContrast`
 * still clears every pair, and none regresses below its light value.
 */
export const HC_MODE_OVERRIDES: Readonly<Record<string, string>> = {
  'color.text-muted': '{ref.neutral.800}',
  'color.text-subtle': '{ref.neutral.700}',
  'color.border': '{ref.neutral.700}',
  'color.border-strong': '{ref.neutral.900}',
  'color.primary': '{ref.brand.800}',
  'color.on-primary': '{ref.neutral.0}',
  'color.primary-hover': '{ref.brand.900}',
  'color.primary-active': '{ref.brand.900}',
  'color.focus-ring': '{ref.brand.800}',
  'color.secondary': '{ref.neutral.800}',
  'color.on-secondary': '{ref.neutral.0}',
  'color.secondary-hover': '{ref.neutral.900}',
  'color.secondary-active': '{ref.neutral.900}',
};

/** Motion duration ids zeroed out under `prefers-reduced-motion`. */
const REDUCED_MOTION_IDS: readonly string[] = [
  'motion.duration-fast',
  'motion.duration-normal',
  'motion.duration-slow',
];

/** Build the dark-scheme override token list (color re-points + shadow re-inks), preserving map order. */
function darkModeTokens(): EmitToken[] {
  const colors: EmitToken[] = Object.entries(DARK_MODE_OVERRIDES).map(([id, value]) => ({
    cssVar: tokenIdToCssVar(id),
    type: 'color',
    value,
  }));
  const shadows: EmitToken[] = Object.entries(DARK_SHADOW_OVERRIDES).map(([id, value]) => ({
    cssVar: tokenIdToCssVar(id),
    type: 'shadow',
    value,
  }));
  return [...colors, ...shadows];
}

/** Build the high-contrast override token list (color re-points), preserving map order. */
function hcModeTokens(): EmitToken[] {
  return Object.entries(HC_MODE_OVERRIDES).map(([id, value]) => ({
    cssVar: tokenIdToCssVar(id),
    type: 'color',
    value,
  }));
}

function reducedMotionTokens(): EmitToken[] {
  return REDUCED_MOTION_IDS.map((id) => ({
    cssVar: tokenIdToCssVar(id),
    type: 'duration',
    value: '0s',
  }));
}

/**
 * The canonical default theme: base = the full registry (light), `dark` mode =
 * re-pointed semantic colors, `hc` mode = high-contrast re-points (fires under
 * `prefers-contrast: more`), auto color-scheme on, reduced-motion gate on. Modes
 * emit in array order, so the `hc` media block follows `dark` — a viewer who both
 * prefers dark and prefers more contrast keeps dark (the hc auto rule is scoped to
 * the light scheme; see AUTO_MEDIA).
 */
export function defaultTheme(): Theme {
  const dark: ThemeMode = { scheme: 'dark', tokens: darkModeTokens() };
  const hc: ThemeMode = { scheme: 'hc', tokens: hcModeTokens() };
  return {
    name: 'default',
    base: FDS_TOKENS,
    modes: [dark, hc],
    autoScheme: true,
    reducedMotion: reducedMotionTokens(),
  };
}
