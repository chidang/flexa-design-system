/**
 * Design Packs — site-look model (Phase 6, doc 12-design-packs.md, slice D3).
 *
 * A DesignPack (see `pack.ts`, kind 'design') is the immutable UNIT OF
 * DISTRIBUTION. A `DesignState` is the mutable SITE state a host persists: the
 * theme actually emitted, the Level-2 `Brand` choices echoed back for the UI, and
 * optional site-wide component styles. Keeping the two apart means a pack can be
 * re-applied, and the site's own edits survive independently of it.
 *
 * `applyBrand(theme, brand)` is the pure bridge from the friendly Level-2 controls
 * (a primary colour, two fonts, a rounding preset…) to concrete token re-points on
 * a Theme — the same shape the editor produces by hand, but derived: hover/active
 * shades and a readable `on-*` are computed, not hand-picked.
 *
 * This module is DATA + PURE FUNCTIONS. It does NOT touch the four frozen engines
 * and adds no runtime: `applyBrand` returns a new Theme (emitted by the existing
 * `emitTheme`), and the validators compose gates that already exist
 * (`findUnknownStyleTokens`, the theme cssVar registry). Site-wide component-style
 * EMISSION into the render pipeline is a later, parity-gated slice (D7); here the
 * styles are only carried and validated as data.
 */

import { z } from 'zod';
import type { Json, StyleSpec } from './types.js';
import { findUnknownStyleTokens, tokenIdToCssVar, tokenType, type Theme } from 'flexa-design-system';
import { contrastRatio, AA_NORMAL } from 'flexa-design-system';

// ---------------------------------------------------------------------------
// Brand — the Level-2 site-identity choices, all optional (a pack may seed some).
// ---------------------------------------------------------------------------

/** Corner-rounding presets exposed on the Brand screen. */
export type RadiusPreset = 'none' | 'sm' | 'md' | 'lg' | 'xl';

export const RADIUS_PRESET_IDS: readonly RadiusPreset[] = ['none', 'sm', 'md', 'lg', 'xl'];

/**
 * Typography scale (DS3, doc 12 §13): a modular scale re-pointing the whole
 * `ref.font-size.*` ramp from two numbers — the body size in rem and the ratio
 * between steps. Both optional; defaults approximate the shipped ramp
 * (base 1rem, ratio 1.2 ≈ minor third).
 */
export interface FontScale {
  /** Body font size in rem (`ref.font-size.base`). */
  readonly base?: number;
  /** Modular-scale ratio between steps (e.g. 1.2 = minor third). */
  readonly ratio?: number;
}

export const FONT_SCALE_DEFAULTS = { base: 1, ratio: 1.2 } as const;

/**
 * Accepted `FontScale` ranges — the SINGLE source for the zod bounds below and
 * the machine-readable `capabilities().design.fontScale` (doc 13 S6).
 */
export const FONT_SCALE_BOUNDS = {
  base: [0.5, 2],
  ratio: [1, 2],
} as const;

/**
 * The `ref.font-size.*` ramp as modular-scale exponents: step value =
 * base × ratio^exp, rounded to 3 decimals, in rem. Exponents chosen so the
 * defaults land close to the shipped Tailwind-like ramp.
 */
export const FONT_SIZE_STEPS: ReadonlyArray<{ readonly id: string; readonly exp: number }> = [
  { id: 'xs', exp: -2 },
  { id: 'sm', exp: -1 },
  { id: 'base', exp: 0 },
  { id: 'lg', exp: 1 },
  { id: 'xl', exp: 2 },
  { id: '2xl', exp: 3 },
  { id: '3xl', exp: 4 },
  { id: '4xl', exp: 5 },
  { id: '5xl', exp: 6 },
];

/** One derived step value (pure — the Typography UI previews with the same math). */
export function fontScaleValue(scale: FontScale, exp: number): string {
  const base = scale.base ?? FONT_SCALE_DEFAULTS.base;
  const ratio = scale.ratio ?? FONT_SCALE_DEFAULTS.ratio;
  return `${Math.round(base * ratio ** exp * 1000) / 1000}rem`;
}

/**
 * Accepted `Brand.density` range (doc 13 S9) — the SINGLE source for the zod
 * bound below and `capabilities().design.density`, like FONT_SCALE_BOUNDS.
 * ONE multiplier, not a ramp: space is an arithmetic scale, so every step
 * shifts by the same factor (unlike the geometric font-size ramp).
 */
export const DENSITY_BOUNDS = [0.8, 1.2] as const;

export const DENSITY_DEFAULT = 1;

/**
 * The `ref.space.*` ramp's shipped rem values (fds.tokens.json at time of
 * writing — a drift-lock test compares this table against the token SSOT).
 * `space.0` is excluded: zero scales to zero, re-pointing it is noise.
 */
export const SPACE_STEPS: ReadonlyArray<{ readonly id: string; readonly rem: number }> = [
  { id: '1', rem: 0.25 },
  { id: '2', rem: 0.5 },
  { id: '3', rem: 0.75 },
  { id: '4', rem: 1 },
  { id: '5', rem: 1.25 },
  { id: '6', rem: 1.5 },
  { id: '8', rem: 2 },
  { id: '10', rem: 2.5 },
  { id: '12', rem: 3 },
  { id: '16', rem: 4 },
  { id: '20', rem: 5 },
  { id: '24', rem: 6 },
];

/** One densified step value (pure — the Brand UI previews with the same math). */
export function densityValue(density: number, rem: number): string {
  return `${Math.round(rem * density * 1000) / 1000}rem`;
}

// ---------------------------------------------------------------------------
// Line-height maturity (Track C, doc 20) — leading is where a *type* scale
// (fontScale) and *spacing* rhythm (density) meet. Deriving it completes both:
// a steeper type ratio tightens HEADING leading; a looser density breathes BODY
// leading — but never below the WCAG floor. Both are identity at the defaults.
// ---------------------------------------------------------------------------

/**
 * The shipped `ref.line-height.*` ramp (fds.tokens.json at time of writing — a
 * drift-lock test compares this against the token SSOT). `tight` is heading
 * leading, `normal`/`relaxed` are body/reading leading.
 */
export const LINE_HEIGHTS = { tight: 1.2, normal: 1.5, relaxed: 1.75 } as const;

/**
 * WCAG 1.4.12 (Text Spacing) floor for body line-height: at least 1.5× the font
 * size. Density may LOOSEN body leading but is never allowed to tighten it under
 * this — an accessibility gate the derivation cannot slip past (Track C, PR-4).
 */
export const BODY_LEADING_FLOOR = 1.5;

/** How sharply heading leading tightens per unit of ratio, plus its display bounds. */
export const HEADING_LEADING = { min: 1.05, max: 1.35, k: 0.5 } as const;

/** How much body leading breathes with density (per unit of `density - 1`). */
export const BODY_LEADING_K = 0.5;

function round3(n: number): number {
  return Math.round(n * 1000) / 1000;
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n));
}

/**
 * Derive the heading leading (`ref.line-height.tight`) from the fontScale ratio: a
 * steeper ratio makes headings larger relative to body, so they want TIGHTER
 * leading; a gentler ratio loosens it. The default ratio (1.2) reproduces the
 * shipped 1.2 exactly (identity), and the result is clamped to a sane display
 * range. Pure — the Typography UI previews with the same math.
 */
export function headingLeading(scale: FontScale): number {
  const ratio = scale.ratio ?? FONT_SCALE_DEFAULTS.ratio;
  return round3(
    clamp(
      LINE_HEIGHTS.tight - (ratio - FONT_SCALE_DEFAULTS.ratio) * HEADING_LEADING.k,
      HEADING_LEADING.min,
      HEADING_LEADING.max,
    ),
  );
}

/**
 * Derive a body leading from density: airy density breathes it looser, compact
 * density tightens it — but never below `BODY_LEADING_FLOOR` (WCAG 1.4.12). Density
 * 1 reproduces the shipped value exactly (identity). `shipped` is the ramp value
 * being densified (`LINE_HEIGHTS.normal` / `.relaxed`). Pure.
 */
export function bodyLeading(density: number, shipped: number): number {
  return round3(Math.max(BODY_LEADING_FLOOR, shipped * (1 + (density - 1) * BODY_LEADING_K)));
}

/**
 * The friendly Level-2 controls. Colours are hex; fonts are CSS font-family stacks
 * (webfont *loading* is a host concern — deferred). Every field is optional so a
 * partial Brand re-points only what it names.
 */
export interface Brand {
  /** Primary brand colour (hex). Also derives hover/active + a readable on-primary. */
  readonly primaryColor?: string;
  /** Secondary brand accent (hex) — FDS 2.1 `color.secondary` family. */
  readonly secondaryColor?: string;
  /** Heading font-family stack -> `font.family-heading`. */
  readonly headingFont?: string;
  /** Body font-family stack -> `font.family-base`. */
  readonly bodyFont?: string;
  /** Corner-rounding preset -> the `radius.*` scale. */
  readonly radius?: RadiusPreset;
  /** Site container width (CSS length) -> `size.container-lg`. */
  readonly containerWidth?: string;
  /** Typography scale -> the whole `ref.font-size.*` ramp (DS3). */
  readonly fontScale?: FontScale;
  /** Spacing density multiplier -> the whole `ref.space.*` ramp except 0 (S9). */
  readonly density?: number;
}

const HEX = z
  .string()
  .regex(/^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, 'must be a hex colour (#rgb or #rrggbb)');

/** Zod schema for a `Brand` — reused by the DesignPack envelope and DesignState. */
export const brandSchema = z
  .object({
    primaryColor: HEX.optional(),
    secondaryColor: HEX.optional(),
    headingFont: z.string().min(1).optional(),
    bodyFont: z.string().min(1).optional(),
    radius: z.enum(['none', 'sm', 'md', 'lg', 'xl']).optional(),
    containerWidth: z.string().min(1).optional(),
    fontScale: z
      .object({
        base: z.number().min(FONT_SCALE_BOUNDS.base[0]).max(FONT_SCALE_BOUNDS.base[1]).optional(),
        ratio: z.number().min(FONT_SCALE_BOUNDS.ratio[0]).max(FONT_SCALE_BOUNDS.ratio[1]).optional(),
      })
      .strict()
      .optional(),
    density: z.number().min(DENSITY_BOUNDS[0]).max(DENSITY_BOUNDS[1]).optional(),
  })
  .strict();

// ---------------------------------------------------------------------------
// applyBrand — Brand -> Theme (pure token re-points).
// ---------------------------------------------------------------------------

/**
 * Radius preset -> the `radius.*` semantic scale it re-values. `c.button.radius`
 * is left as its `{radius.md}` alias so the button corner tracks the preset's md
 * step automatically (no literal decoupling). `md` restores the canonical shipped
 * scale, so applying it is the identity for rounding.
 */
export const RADIUS_PRESETS: Readonly<Record<RadiusPreset, Readonly<Record<string, string>>>> = {
  none: { 'radius.sm': '0px', 'radius.md': '0px', 'radius.lg': '0px', 'radius.xl': '0px', 'radius.2xl': '0px' },
  sm: { 'radius.sm': '2px', 'radius.md': '3px', 'radius.lg': '4px', 'radius.xl': '6px', 'radius.2xl': '8px' },
  md: { 'radius.sm': '0.125rem', 'radius.md': '0.375rem', 'radius.lg': '0.5rem', 'radius.xl': '0.75rem', 'radius.2xl': '1rem' },
  lg: { 'radius.sm': '6px', 'radius.md': '10px', 'radius.lg': '14px', 'radius.xl': '20px', 'radius.2xl': '28px' },
  xl: { 'radius.sm': '10px', 'radius.md': '16px', 'radius.lg': '22px', 'radius.xl': '28px', 'radius.2xl': '36px' },
};

/** How far hover/active darken the brand colour toward black (deterministic). */
const HOVER_MIX = 0.12;
const ACTIVE_MIX = 0.24;

/**
 * Dark-scheme re-tint (Track C, doc 20): a brand goes LIGHTER on a dark ground —
 * a base lift toward white (`DARK_MIX`), then hover/active lift further from that
 * base (the light scheme's darken, reversed). Echoes the default theme's dark
 * treatment (brand.500 -> brand.400/300/200). `DARK_STEP` is the extra nudge
 * `darkTint` applies until the accent clears AA (see there).
 */
const DARK_MIX = 0.26;
const DARK_STEP = 0.06;
const DARK_HOVER_STEP = 0.14;
const DARK_ACTIVE_STEP = 0.28;

/** The scheme applyBrand re-tints when a theme carries it (else it is a no-op). */
const DARK_SCHEME = 'dark';

/** The two candidate `on-*` colours — white, or the default dark text (ref.neutral.900). */
const ON_LIGHT = '#ffffff';
const ON_DARK = '#0f172a';

/**
 * Apply Level-2 brand choices to a Theme's tokens, returning a NEW Theme (never
 * mutated). Only the named fields change; an empty Brand returns the theme
 * unchanged. A brand colour flows into BOTH schemes: the light base is re-pointed
 * directly, and — when the theme carries a `dark` scheme — that scheme is auto
 * re-tinted from the same hex (`tuneDark`), so declaring one brand colour yields a
 * coherent light AND dark treatment. A light-only theme (no dark mode) stays
 * light-only.
 */
export function applyBrand(theme: Theme, brand: Brand): Theme {
  let out = theme;

  if (brand.primaryColor) {
    out = setBaseValue(out, 'color.primary', brand.primaryColor);
    out = setBaseValue(out, 'color.focus-ring', brand.primaryColor);
    out = setBaseValue(out, 'color.primary-hover', darken(brand.primaryColor, HOVER_MIX));
    out = setBaseValue(out, 'color.primary-active', darken(brand.primaryColor, ACTIVE_MIX));
    out = setBaseValue(out, 'color.on-primary', readableOn(brand.primaryColor));
    out = tuneDark(out, 'primary', brand.primaryColor);
  }

  // Explicit secondary always wins; otherwise a primary auto-derives one (Track C
  // auto-secondary). A brand with neither leaves the theme's default secondary
  // untouched. The resolved accent is dark-tuned too (Track C dark-tune), so an
  // auto-derived secondary gets a coherent dark treatment like the primary.
  const secondaryColor =
    brand.secondaryColor ?? (brand.primaryColor ? deriveSecondary(brand.primaryColor) : undefined);
  if (secondaryColor) {
    out = setBaseValue(out, 'color.secondary', secondaryColor);
    out = setBaseValue(out, 'color.secondary-hover', darken(secondaryColor, HOVER_MIX));
    out = setBaseValue(out, 'color.secondary-active', darken(secondaryColor, ACTIVE_MIX));
    out = setBaseValue(out, 'color.on-secondary', readableOn(secondaryColor));
    out = tuneDark(out, 'secondary', secondaryColor);
  }

  if (brand.headingFont) out = setBaseValue(out, 'font.family-heading', brand.headingFont);
  if (brand.bodyFont) out = setBaseValue(out, 'font.family-base', brand.bodyFont);

  if (brand.radius) {
    for (const [id, value] of Object.entries(RADIUS_PRESETS[brand.radius])) {
      out = setBaseValue(out, id, value);
    }
  }

  if (brand.containerWidth) out = setBaseValue(out, 'size.container-lg', brand.containerWidth);

  if (brand.fontScale) {
    for (const step of FONT_SIZE_STEPS) {
      out = setBaseValue(out, `ref.font-size.${step.id}`, fontScaleValue(brand.fontScale, step.exp));
    }
    // A complete type scale owns its heading leading too — derived from the ratio,
    // not a separate control (Track C: derive, don't configure).
    out = setBaseValue(out, 'ref.line-height.tight', String(headingLeading(brand.fontScale)));
  }

  if (brand.density !== undefined) {
    for (const step of SPACE_STEPS) {
      out = setBaseValue(out, `ref.space.${step.id}`, densityValue(brand.density, step.rem));
    }
    // Vertical rhythm breathes with density, floored at the WCAG 1.4.12 body minimum.
    out = setBaseValue(out, 'ref.line-height.normal', String(bodyLeading(brand.density, LINE_HEIGHTS.normal)));
    out = setBaseValue(out, 'ref.line-height.relaxed', String(bodyLeading(brand.density, LINE_HEIGHTS.relaxed)));
  }

  return out;
}

/** Set one base token's literal value, returning a new Theme (map, or append if absent). */
function setBaseValue(theme: Theme, id: string, value: string): Theme {
  const cssVar = tokenIdToCssVar(id);
  let found = false;
  const base = theme.base.map((t) => {
    if (t.cssVar !== cssVar) return t;
    found = true;
    return { ...t, value };
  });
  if (!found) base.push({ cssVar, type: tokenType(id) ?? 'color', value });
  return { ...theme, base };
}

/**
 * Set one token's value inside a theme mode (e.g. `dark`), returning a NEW Theme.
 * A no-op — theme returned by reference — when the theme carries no such scheme, so
 * a light-only pack stays light-only. Within a present scheme the override is mapped
 * or APPENDED (append lets a brand own a colour the mode did not previously
 * re-point, rather than letting the light hex bleed into dark).
 */
function setModeValue(theme: Theme, scheme: string, id: string, value: string): Theme {
  if (!theme.modes) return theme;
  const cssVar = tokenIdToCssVar(id);
  let touched = false;
  const modes = theme.modes.map((mode) => {
    if (mode.scheme !== scheme) return mode;
    touched = true;
    let found = false;
    const tokens = mode.tokens.map((t) => {
      if (t.cssVar !== cssVar) return t;
      found = true;
      return { ...t, value };
    });
    if (!found) tokens.push({ cssVar, type: tokenType(id) ?? 'color', value });
    return { ...mode, tokens };
  });
  if (!touched) return theme;
  return { ...theme, modes };
}

/**
 * Re-tint one brand colour family (`primary`/`secondary`) in the dark scheme from
 * its light hex: a contrast-safe lighter base (`darkTint`) with a `readableOn`
 * on-colour, lighter still for hover/active (derived FROM the safe base, so they
 * stay lighter than it). For `primary`, focus-ring tracks the same base. A no-op on
 * a theme with no dark scheme (delegated to `setModeValue`).
 */
function tuneDark(theme: Theme, family: 'primary' | 'secondary', color: string): Theme {
  const darkBase = darkTint(color);
  let out = setModeValue(theme, DARK_SCHEME, `color.${family}`, darkBase);
  out = setModeValue(out, DARK_SCHEME, `color.on-${family}`, readableOn(darkBase));
  out = setModeValue(out, DARK_SCHEME, `color.${family}-hover`, lighten(darkBase, DARK_HOVER_STEP));
  out = setModeValue(out, DARK_SCHEME, `color.${family}-active`, lighten(darkBase, DARK_ACTIVE_STEP));
  if (family === 'primary') out = setModeValue(out, DARK_SCHEME, 'color.focus-ring', darkBase);
  return out;
}

const HEX_RE = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

function parseHex(hex: string): readonly [number, number, number] | null {
  if (!HEX_RE.test(hex)) return null;
  const h = hex.slice(1);
  const full = h.length === 3 ? h.replace(/./g, (c) => c + c) : h;
  return [parseInt(full.slice(0, 2), 16), parseInt(full.slice(2, 4), 16), parseInt(full.slice(4, 6), 16)];
}

function toHex(rgb: readonly [number, number, number]): string {
  return (
    '#' +
    rgb.map((c) => Math.max(0, Math.min(255, Math.round(c))).toString(16).padStart(2, '0')).join('')
  );
}

/** Darken a hex colour by mixing it toward black; a non-hex value passes through. */
function darken(hex: string, amount: number): string {
  const rgb = parseHex(hex);
  if (!rgb) return hex;
  return toHex([rgb[0] * (1 - amount), rgb[1] * (1 - amount), rgb[2] * (1 - amount)]);
}

/** Lighten a hex colour by mixing it toward white; a non-hex value passes through. */
function lighten(hex: string, amount: number): string {
  const rgb = parseHex(hex);
  if (!rgb) return hex;
  return toHex([
    rgb[0] + (255 - rgb[0]) * amount,
    rgb[1] + (255 - rgb[1]) * amount,
    rgb[2] + (255 - rgb[2]) * amount,
  ]);
}

/**
 * Lighten toward white until the accent is light enough that its `readableOn`
 * on-colour clears AA. A FIXED lift alone can strand a mid-luminance colour in the
 * WCAG "dead zone" (~0.18 luminance, where the best achievable contrast is ~4.48 <
 * 4.5); lightening monotonically raises luminance, so a few bounded steps always
 * exit the zone upward. This makes the dark accent AA-safe for ANY brand, not just
 * the sampled ones — accessibility stays a gate the derivation cannot slip past.
 */
function darkTint(color: string): string {
  let out = lighten(color, DARK_MIX);
  for (let i = 0; i < 12 && contrastRatio(readableOn(out), out) < AA_NORMAL; i += 1) {
    out = lighten(out, DARK_STEP);
  }
  return out;
}

/** Pick whichever of white / dark text has the higher WCAG contrast on `bg`. */
export function readableOn(bg: string): string {
  return contrastRatio(ON_DARK, bg) > contrastRatio(ON_LIGHT, bg) ? ON_DARK : ON_LIGHT;
}

// ---------------------------------------------------------------------------
// Secondary derivation (Track C, doc 20) — one primary -> a harmonised accent.
// ---------------------------------------------------------------------------

/**
 * How far the secondary accent rotates from the primary on the colour wheel.
 * 150° (split-complementary) is distinct enough to read as a *second* colour yet
 * stays harmonious — a controlled, tunable constant, not a free choice for callers.
 */
export const SECONDARY_HUE_SHIFT = 150;

/** RGB (0–255) -> HSL (h in [0,360), s/l in [0,1]). Pure, deterministic. */
function rgbToHsl(rgb: readonly [number, number, number]): [number, number, number] {
  const rn = rgb[0] / 255;
  const gn = rgb[1] / 255;
  const bn = rgb[2] / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const d = max - min;
  const l = (max + min) / 2;
  if (d === 0) return [0, 0, l];
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h: number;
  if (max === rn) h = (gn - bn) / d + (gn < bn ? 6 : 0);
  else if (max === gn) h = (bn - rn) / d + 2;
  else h = (rn - gn) / d + 4;
  return [h * 60, s, l];
}

/** HSL -> RGB (0–255). Pure, deterministic; hue wraps into [0,360). */
function hslToRgb(hsl: readonly [number, number, number]): [number, number, number] {
  const h = (((hsl[0] % 360) + 360) % 360) / 360;
  const s = hsl[1];
  const l = hsl[2];
  if (s === 0) return [l * 255, l * 255, l * 255];
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const channel = (t: number): number => {
    let tn = t;
    if (tn < 0) tn += 1;
    if (tn > 1) tn -= 1;
    if (tn < 1 / 6) return p + (q - p) * 6 * tn;
    if (tn < 1 / 2) return q;
    if (tn < 2 / 3) return p + (q - p) * (2 / 3 - tn) * 6;
    return p;
  };
  return [channel(h + 1 / 3) * 255, channel(h) * 255, channel(h - 1 / 3) * 255];
}

/**
 * Derive a secondary brand accent from the primary by rotating the hue
 * `SECONDARY_HUE_SHIFT`° while preserving saturation and lightness. Preserving S/L
 * keeps the accent the same visual "weight" as the primary, so its readable
 * on-colour is picked the same way (`readableOn`) and carries the same contrast
 * standing — auto-deriving never introduces a failure the primary did not already
 * have. Deterministic (PR-5); a non-hex input passes through unchanged, and a
 * greyscale primary (no saturation) yields a matching grey. This is the machine
 * half of "declare one primary, receive a full brand system" (doc 20 H2).
 */
export function deriveSecondary(primary: string): string {
  const rgb = parseHex(primary);
  if (!rgb) return primary;
  const hsl = rgbToHsl(rgb);
  return toHex(hslToRgb([hsl[0] + SECONDARY_HUE_SHIFT, hsl[1], hsl[2]]));
}

// ---------------------------------------------------------------------------
// Brand from logo (Track C, doc 20; lifted from editor S3) — derive brand colours
// from a logo's pixels, DETERMINISTICALLY (no k-means, no randomness): a fixed
// stride into a 4-bit-per-channel histogram with background / near-black / grey
// filtered out, so the same image always yields the same colours. Pure — it sees
// only an RGBA byte array (reading a file into ImageData is the host's DOM glue).
// Kept in core beside deriveSecondary so "a logo -> a full brand" is a first-party,
// testable derivation; `Brand` stays in core (QĐ-19.6).
// ---------------------------------------------------------------------------

/** Extracted brand colours; `secondaryColor` is null when only one family survives. */
export interface LogoBrandColors {
  readonly primaryColor: string;
  readonly secondaryColor: string | null;
}

/** A colour observed with a weight — one pixel (weight 1) or a painted area. */
export interface WeightedColor {
  readonly r: number;
  readonly g: number;
  readonly b: number;
  readonly weight: number;
}

/** Max sampled points — the stride is chosen so we never read more than this. */
const MAX_LOGO_SAMPLES = 10_000;
/** Pixels more transparent than this are ignored. */
const MIN_ALPHA = 128;
/** Relative-luminance cutoffs: above = background white, below = near black. */
const MAX_LOGO_LUMINANCE = 0.92;
const MIN_LOGO_LUMINANCE = 0.08;
/** HSV-saturation cutoff: below = grey (no usable hue). */
const MIN_LOGO_SATURATION = 0.15;
/** Two colours count as distinct families when their hues differ by more than this. */
const MIN_HUE_DISTANCE = 60;

interface ColorBucket {
  readonly key: number;
  readonly count: number;
}

/**
 * Rank weighted colours into a primary/secondary pair — the shared core of the
 * logo pixel scan and the F4 computed-style scan (editor htmlObserve). Applies the
 * SAME background / near-black / grey filters and 4-bit quantization, so a colour
 * ranks identically however it was observed. Deterministic: greater weight wins,
 * ties break on the ascending bucket key. Returns null when nothing survives.
 */
export function pickBrandColors(colors: Iterable<WeightedColor>): LogoBrandColors | null {
  const counts = new Map<number, number>();
  for (const { r, g, b, weight } of colors) {
    if (weight <= 0) continue;

    const luminance = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
    if (luminance > MAX_LOGO_LUMINANCE || luminance < MIN_LOGO_LUMINANCE) continue;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    if (max === 0 || (max - min) / max < MIN_LOGO_SATURATION) continue;

    const key = ((r >> 4) << 8) | ((g >> 4) << 4) | (b >> 4);
    counts.set(key, (counts.get(key) ?? 0) + weight);
  }

  if (counts.size === 0) return null;

  const buckets: ColorBucket[] = [...counts.entries()]
    .map(([key, count]) => ({ key, count }))
    .sort((a, b) => b.count - a.count || a.key - b.key);

  const primary = buckets[0];
  if (!primary) return null;
  const primaryHue = bucketHue(primary.key);

  const rest = buckets.slice(1);
  const secondary =
    rest.find((bucket) => hueDistance(bucketHue(bucket.key), primaryHue) > MIN_HUE_DISTANCE) ??
    rest[0] ??
    null;

  return {
    primaryColor: bucketHex(primary.key),
    secondaryColor: secondary ? bucketHex(secondary.key) : null,
  };
}

/**
 * Extract `{ primaryColor, secondaryColor }` from RGBA pixel data (the layout of
 * `ImageData.data`). Samples with a fixed stride (≤ 10 000 points), drops
 * transparent / white-background / near-black / grey pixels, quantizes survivors
 * to 4 bits/channel, and ranks buckets (fullest = primary; the fullest > 60° away
 * = secondary, else the next-fullest, else null). Deterministic; lowercase
 * `#rrggbb` bucket centres. Null when nothing survives (all-white / grey / empty).
 */
export function extractBrandColors(
  pixels: Uint8ClampedArray,
  width: number,
  height: number,
): LogoBrandColors | null {
  const total = width * height;
  if (total <= 0 || pixels.length < total * 4) return null;

  const stride = Math.max(1, Math.ceil(total / MAX_LOGO_SAMPLES));
  const sampled: WeightedColor[] = [];

  for (let i = 0; i < total; i += stride) {
    const o = i * 4;
    const a = pixels[o + 3] ?? 0;
    if (a < MIN_ALPHA) continue;
    sampled.push({ r: pixels[o] ?? 0, g: pixels[o + 1] ?? 0, b: pixels[o + 2] ?? 0, weight: 1 });
  }

  return pickBrandColors(sampled);
}

/**
 * Derive a full `Brand` from a logo's pixels — the "declare least, derive most"
 * apex of Track C (doc 20 H2): hand in an image, receive a complete two-colour
 * brand. Runs the deterministic `extractBrandColors` scan, then when the logo
 * offers only ONE colour family fills the secondary via `deriveSecondary` (the
 * same hue-shift derivation) so a single-colour mark still yields a harmonised
 * accent. Returns null only when no brand colour survives (all-white / grey /
 * transparent). Contrast is NOT gated here: the Brand feeds `applyBrand`, whose
 * `readableOn` / `tuneDark` make every emitted pairing AA-safe (PR-4) — the gate
 * stays where the Theme is owned, not duplicated at each derivation source.
 */
export function brandFromLogo(
  pixels: Uint8ClampedArray,
  width: number,
  height: number,
): Brand | null {
  const colors = extractBrandColors(pixels, width, height);
  if (!colors) return null;
  return {
    primaryColor: colors.primaryColor,
    secondaryColor: colors.secondaryColor ?? deriveSecondary(colors.primaryColor),
  };
}

/** Centre of a 4-bit bucket back to an 8-bit channel (bucket n covers n*16 … n*16+15). */
function bucketChannels(key: number): readonly [number, number, number] {
  return [(((key >> 8) & 0xf) << 4) | 8, (((key >> 4) & 0xf) << 4) | 8, ((key & 0xf) << 4) | 8];
}

function bucketHex(key: number): string {
  return '#' + bucketChannels(key).map((c) => c.toString(16).padStart(2, '0')).join('');
}

/** Hue (0–360°) of a bucket centre, via the shared `rgbToHsl` (hue is scale-invariant). */
function bucketHue(key: number): number {
  return rgbToHsl(bucketChannels(key))[0];
}

/** Circular hue distance in degrees (0–180). */
function hueDistance(a: number, b: number): number {
  const d = Math.abs(a - b) % 360;
  return d > 180 ? 360 - d : d;
}

// ---------------------------------------------------------------------------
// DesignState — the persisted site look, with a no-throw validator.
// ---------------------------------------------------------------------------

export const DESIGN_STATE_VERSION = 1 as const;

/** Provenance: which pack a DesignState was seeded from (informational). */
export interface PackRef {
  readonly vendor: string;
  readonly name: string;
  readonly version?: string;
}

/**
 * The site's design state — what a host persists and the editor boots from. `theme`
 * is the SOLE emission source (pack theme + brand + advanced edits already merged);
 * `brand` is the echo of the Level-2 choices so the UI can show them again;
 * `componentStyles` maps an element type to a site-wide StyleSpec (emitted in D7).
 */
export interface DesignState {
  readonly schemaVersion: 1;
  readonly packRef?: PackRef;
  readonly theme: Theme;
  readonly brand?: Brand;
  readonly componentStyles?: Readonly<Record<string, StyleSpec>>;
}

export type DesignStateValidation =
  | { ok: true; state: DesignState }
  | { ok: false; errors: string[] };

// ---------------------------------------------------------------------------
// Migration — the upgrade seam for persisted design artifacts (doc 13, S2).
// ---------------------------------------------------------------------------

/** Upgrades one design-state envelope from version `from` to `from + 1`. */
export type DesignStateMigration = (state: Record<string, unknown>) => Record<string, unknown>;

/**
 * Ordered envelope migrations, keyed by the version they upgrade FROM — the exact
 * `DOCUMENT_MIGRATIONS` pattern (migrate.ts), laid before it is needed. Empty at
 * v1: a future envelope change ships as one entry here, not a new mechanism.
 */
const DESIGN_STATE_MIGRATIONS: ReadonlyMap<number, DesignStateMigration> = new Map();

/**
 * Run a migration chain over a candidate design state. Unlike `migrateDocument`
 * this NEVER throws — it sits in front of `validateDesignState`/`validatePack` on
 * every read path, so anything it cannot migrate (garbage, a missing step, a
 * version newer than this build) passes through UNCHANGED for the validator to
 * reject with a proper message. A state already at the target version is returned
 * by reference (idempotent). Exported so the contract tests can drive a synthetic
 * chain; production callers use `migrateDesignState`.
 */
export function runDesignStateMigrations(
  input: unknown,
  migrations: ReadonlyMap<number, DesignStateMigration>,
  targetVersion: number = DESIGN_STATE_VERSION,
): unknown {
  if (!isObject(input)) return input;
  const from = input.schemaVersion;
  if (typeof from !== 'number' || !Number.isInteger(from) || from < 1) return input;
  if (from >= targetVersion) return input;
  let v = from;
  let out: Record<string, unknown> = input;
  while (v < targetVersion) {
    const step = migrations.get(v);
    if (!step) return input;
    out = step(out);
    v += 1;
  }
  return { ...out, schemaVersion: targetVersion };
}

/**
 * Bring a persisted design state up to `DESIGN_STATE_VERSION`. Every read choke
 * point runs this BEFORE validating (`fromDesignState` for adapter loads,
 * `parseDesignPack` for imported files), so old artifacts keep loading after a
 * schema bump. PHP stays a verbatim-keeper: `DesignController::sanitize` widens
 * its shallow version check to the accepted union when v2 exists — TS migrates on
 * read (doc 12 §10).
 */
export function migrateDesignState(input: unknown): unknown {
  return runDesignStateMigrations(input, DESIGN_STATE_MIGRATIONS);
}

const VENDOR_RE = /^[a-z][a-z0-9]*$/;
const SEMVER_RE = /^(\d+)\.(\d+)\.(\d+)$/;
const NODE_TYPE_RE = /^[a-z0-9][a-z0-9-]*\/[a-z0-9][a-z0-9-]*$/;

/** Zod for a `PackRef` — shared with the SitePlan envelope (doc 14 W2). */
export const packRefSchema = z
  .object({
    vendor: z.string().regex(VENDOR_RE, 'vendor must be lowercase alphanumeric starting with a letter'),
    name: z.string().min(1),
    version: z.string().regex(SEMVER_RE, 'version must be semver (major.minor.patch)').optional(),
  })
  .strict();

const designStateEnvelope = z.object({
  schemaVersion: z.literal(DESIGN_STATE_VERSION),
  packRef: packRefSchema.optional(),
  theme: z.unknown(),
  brand: brandSchema.optional(),
  componentStyles: z.record(z.string(), z.unknown()).optional(),
});

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

/**
 * Validate a component-styles map (element type -> StyleSpec) — SHARED by the
 * DesignPack envelope (pack.ts) and DesignState. Each key must be a `vendor/name`
 * element type and each spec must be on-system (`findUnknownStyleTokens` empty), so
 * a pack/state can never carry a typo'd or off-system token into the pipeline.
 */
export function validateComponentStyles(cs: unknown, errors: string[], where = 'componentStyles'): void {
  if (cs === undefined) return;
  if (!isObject(cs)) {
    errors.push(`${where}: must be an object mapping element type -> style spec`);
    return;
  }
  for (const [type, spec] of Object.entries(cs)) {
    if (!NODE_TYPE_RE.test(type)) {
      errors.push(`${where}: "${type}" is not a valid element type (vendor/name)`);
    }
    if (!isObject(spec)) {
      errors.push(`${where}.${type}: style spec must be an object`);
      continue;
    }
    const off = findUnknownStyleTokens(spec as StyleSpec);
    if (off.length > 0) {
      errors.push(
        `${where}.${type}: references off-system tokens ${off.join(', ')} — component styles may only use standard FDS tokens`,
      );
    }
  }
}

/**
 * Validate a DesignState — no throw, structured errors. Envelope (schemaVersion /
 * packRef / brand) is zod-checked; the theme is checked structurally (its deep
 * cssVar gate runs when the source DesignPack is imported via `validatePack`); the
 * component styles run the shared on-system gate.
 */
export function validateDesignState(input: unknown): DesignStateValidation {
  const parsed = designStateEnvelope.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      errors: parsed.error.issues.map((i) => `${i.path.join('.') || '<root>'}: ${i.message}`),
    };
  }
  const env = parsed.data;
  const errors: string[] = [];

  if (!isObject(env.theme)) {
    errors.push('theme: must be a Theme object');
  } else if (!Array.isArray((env.theme as Record<string, unknown>).base)) {
    errors.push('theme.base: must be an array of tokens');
  }

  validateComponentStyles(env.componentStyles as Json, errors);

  if (errors.length > 0) return { ok: false, errors };
  return { ok: true, state: input as DesignState };
}
