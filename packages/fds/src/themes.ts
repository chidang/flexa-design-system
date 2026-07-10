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
 * background pair must clear WCAG 2.2 AA in BOTH modes or the build goes red.
 */

import { FDS_TOKENS, tokenIdToCssVar } from './index.js';
import type { EmitToken, Theme, ThemeMode } from './resolve.js';

/**
 * Dark-mode overrides: semantic color id -> the primitive it re-points to in dark.
 * Only names that differ from light appear; everything else inherits the base. Each
 * pair is designed to clear AA (enforced by `checkThemeContrast`). Brand goes LIGHTER
 * on dark (brand.400) with a dark `on-primary`, matching Material/Carbon dark practice.
 */
export const DARK_MODE_OVERRIDES: Readonly<Record<string, string>> = {
  'color.bg': '{ref.neutral.950}',
  'color.surface': '{ref.neutral.900}',
  'color.surface-alt': '{ref.neutral.800}',
  'color.text': '{ref.neutral.50}',
  'color.text-muted': '{ref.neutral.300}',
  'color.text-subtle': '{ref.neutral.500}',
  'color.primary': '{ref.brand.400}',
  'color.on-primary': '{ref.neutral.950}',
  'color.primary-hover': '{ref.brand.300}',
  'color.primary-active': '{ref.brand.200}',
  // Secondary (FDS 2.1) — the slate accent goes lighter on dark with dark text,
  // mirroring the primary treatment; both dark values clear AA (checkThemeContrast).
  'color.secondary': '{ref.neutral.400}',
  'color.on-secondary': '{ref.neutral.950}',
  'color.secondary-hover': '{ref.neutral.300}',
  'color.secondary-active': '{ref.neutral.200}',
  'color.border': '{ref.neutral.700}',
  'color.border-strong': '{ref.neutral.600}',
  'color.focus-ring': '{ref.brand.400}',
  'color.success': '{ref.success.500}',
  'color.on-success': '{ref.neutral.950}',
  'color.warning': '{ref.warning.500}',
  'color.on-warning': '{ref.neutral.950}',
  'color.danger': '{ref.danger.500}',
  // Danger red is darker than the other .500 tones, so it needs light text (dark
  // text only reaches 4.18:1) — the one dark-mode `on-*` that stays white.
  'color.on-danger': '{ref.neutral.0}',
  'color.info': '{ref.info.500}',
  'color.on-info': '{ref.neutral.950}',
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

/** Build the dark-scheme override token list (color re-points), preserving map order. */
function darkModeTokens(): EmitToken[] {
  return Object.entries(DARK_MODE_OVERRIDES).map(([id, value]) => ({
    cssVar: tokenIdToCssVar(id),
    type: 'color',
    value,
  }));
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
