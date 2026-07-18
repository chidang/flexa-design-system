/**
 * Flexa Design System — contrast gate (Phase 5.5 Slice 3).
 *
 * WCAG 2.2 relative-luminance / contrast-ratio math plus a check that walks the
 * required foreground/background pairs of a Theme in EVERY scheme (base + each
 * mode) and returns the ones that fail AA. `themes.spec.ts` runs it over the
 * default theme and asserts zero failures — "compliance by construction" (§3.2,
 * learned from USWDS): a dark palette that dips below AA turns CI red.
 *
 * Pure analysis over token DATA — not a runtime engine, so no PHP mirror is needed
 * (it never emits CSS; it only inspects resolved literals from the registry).
 */

import { getToken, tokenIdToCssVar } from './index.js';
import type { EmitToken, Theme } from './resolve.js';
import { apcaContrast, APCA_BODY_MIN, APCA_UI_MIN } from './apca.js';
import { deltaE, simulateCvd, CVD_DISTINCT_MIN, CVD_TYPES, type CvdType } from './cvd.js';

/** WCAG AA minimum for normal-size text / UI components. */
export const AA_NORMAL = 4.5;

/** WCAG 2 §1.4.11 minimum for non-text elements (UI components & graphics). */
export const AA_NON_TEXT = 3;

/** `{ref.neutral.0}` style alias anchored to a whole value. */
const ALIAS_RE = /^\{([a-z0-9-]+(?:\.[a-z0-9-]+)*)\}$/;

/**
 * A foreground/background pair the design system guarantees. `min` is the WCAG 2
 * ratio floor; `apcaMin` is the APCA Lc floor (abs) for the SAME pair — body-text
 * pairs use `APCA_BODY_MIN`, UI-label pairs (`on-X` on a fill) `APCA_UI_MIN`. Two
 * standards side by side (Track D, PR-4), never one replacing the other.
 */
export interface ContrastPair {
  readonly fg: string;
  readonly bg: string;
  readonly min: number;
  readonly apcaMin: number;
}

/**
 * The pairs enforced in CI: primary body text on its surfaces, and every `on-X`
 * text/icon colour on its `X` fill. `text-subtle` clears WCAG AA for normal text in
 * both schemes since its FDS 2.11 re-point (neutral.500 light / .400 dark) but stays
 * outside the guaranteed set: it is the tertiary role, not a body-text contract.
 */
export const CONTRAST_PAIRS: readonly ContrastPair[] = [
  { fg: 'color.text', bg: 'color.bg', min: AA_NORMAL, apcaMin: APCA_BODY_MIN },
  { fg: 'color.text', bg: 'color.surface', min: AA_NORMAL, apcaMin: APCA_BODY_MIN },
  { fg: 'color.text-muted', bg: 'color.bg', min: AA_NORMAL, apcaMin: APCA_BODY_MIN },
  { fg: 'color.text-muted', bg: 'color.surface', min: AA_NORMAL, apcaMin: APCA_BODY_MIN },
  { fg: 'color.on-primary', bg: 'color.primary', min: AA_NORMAL, apcaMin: APCA_UI_MIN },
  { fg: 'color.on-secondary', bg: 'color.secondary', min: AA_NORMAL, apcaMin: APCA_UI_MIN },
  { fg: 'color.on-success', bg: 'color.success', min: AA_NORMAL, apcaMin: APCA_UI_MIN },
  { fg: 'color.on-warning', bg: 'color.warning', min: AA_NORMAL, apcaMin: APCA_UI_MIN },
  { fg: 'color.on-danger', bg: 'color.danger', min: AA_NORMAL, apcaMin: APCA_UI_MIN },
  { fg: 'color.on-info', bg: 'color.info', min: AA_NORMAL, apcaMin: APCA_UI_MIN },
];

/** One pair that fails AA in a given scheme — the CI failure record. */
export interface ContrastFailure {
  /** `base` for the default (no-scheme) values, else the mode's scheme id. */
  readonly scheme: string;
  readonly fg: string;
  readonly bg: string;
  readonly ratio: number;
  readonly min: number;
}

function hexToRgb(hex: string): readonly [number, number, number] | null {
  const h = hex.trim().replace(/^#/, '');
  const full = h.length === 3 ? h.replace(/./g, (c) => c + c) : h;
  if (!/^[0-9a-fA-F]{6}$/.test(full)) return null;
  return [
    parseInt(full.slice(0, 2), 16),
    parseInt(full.slice(2, 4), 16),
    parseInt(full.slice(4, 6), 16),
  ];
}

/** WCAG relative luminance of an sRGB hex colour (0 = black, 1 = white). */
export function relativeLuminance(hex: string): number {
  const rgb = hexToRgb(hex);
  if (!rgb) return NaN;
  const lin = (c: number): number => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * lin(rgb[0]) + 0.7152 * lin(rgb[1]) + 0.0722 * lin(rgb[2]);
}

/** WCAG contrast ratio between two sRGB hex colours (1 … 21). */
export function contrastRatio(a: string, b: string): number {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  const hi = Math.max(la, lb);
  const lo = Math.min(la, lb);
  return (hi + 0.05) / (lo + 0.05);
}

/** Follow `{alias}` values through the registry down to a literal (hex) value. */
function resolveToHex(value: unknown): string | null {
  let v = value;
  for (let guard = 0; guard < 16; guard += 1) {
    if (typeof v !== 'string') return null;
    const m = ALIAS_RE.exec(v);
    if (!m || !m[1]) return v;
    const entry = getToken(m[1]);
    if (!entry) return null;
    v = entry.value;
  }
  return null;
}

/** Effective value (by cssVar) for a scheme: base overlaid with the mode's overrides. */
function effectiveValues(base: readonly EmitToken[], overrides: readonly EmitToken[]): Map<string, unknown> {
  const map = new Map<string, unknown>();
  for (const t of base) map.set(t.cssVar, t.value);
  for (const t of overrides) map.set(t.cssVar, t.value);
  return map;
}

function checkScheme(scheme: string, values: Map<string, unknown>): ContrastFailure[] {
  const failures: ContrastFailure[] = [];
  for (const pair of CONTRAST_PAIRS) {
    const fgHex = resolveToHex(values.get(tokenIdToCssVar(pair.fg)));
    const bgHex = resolveToHex(values.get(tokenIdToCssVar(pair.bg)));
    if (fgHex === null || bgHex === null) continue;
    const ratio = contrastRatio(fgHex, bgHex);
    if (!(ratio >= pair.min)) {
      failures.push({ scheme, fg: pair.fg, bg: pair.bg, ratio, min: pair.min });
    }
  }
  return failures;
}

/**
 * Check every guaranteed pair of `theme` in the base scheme and each mode; return
 * the failures (empty = all AA-clear). This is the CI contrast gate.
 */
export function checkThemeContrast(theme: Theme): ContrastFailure[] {
  const failures = checkScheme('base', effectiveValues(theme.base, []));
  for (const mode of theme.modes ?? []) {
    failures.push(...checkScheme(mode.scheme, effectiveValues(theme.base, mode.tokens)));
  }
  return failures;
}

/** One pair that falls below its APCA Lc floor in a given scheme. */
export interface ApcaFailure {
  readonly scheme: string;
  readonly fg: string;
  readonly bg: string;
  /** Signed APCA Lc (polarity preserved); gate compares `abs(lc)` to `min`. */
  readonly lc: number;
  readonly min: number;
}

function checkSchemeApca(scheme: string, values: Map<string, unknown>): ApcaFailure[] {
  const failures: ApcaFailure[] = [];
  for (const pair of CONTRAST_PAIRS) {
    const fgHex = resolveToHex(values.get(tokenIdToCssVar(pair.fg)));
    const bgHex = resolveToHex(values.get(tokenIdToCssVar(pair.bg)));
    if (fgHex === null || bgHex === null) continue;
    const lc = apcaContrast(fgHex, bgHex);
    if (!(Math.abs(lc) >= pair.apcaMin)) {
      failures.push({ scheme, fg: pair.fg, bg: pair.bg, lc, min: pair.apcaMin });
    }
  }
  return failures;
}

/**
 * The APCA counterpart of `checkThemeContrast`: walk the same guaranteed pairs in
 * every scheme and return the ones whose APCA Lc falls below their role floor. Runs
 * ALONGSIDE the WCAG 2 gate (Track D / PR-4) — a second, perceptual standard, not a
 * replacement. APCA is stricter than WCAG 2 for bright accent fills, so this can flag
 * pairs the WCAG gate passes; that is the point of adding the standard.
 */
export function checkThemeContrastApca(theme: Theme): ApcaFailure[] {
  const failures = checkSchemeApca('base', effectiveValues(theme.base, []));
  for (const mode of theme.modes ?? []) {
    failures.push(...checkSchemeApca(mode.scheme, effectiveValues(theme.base, mode.tokens)));
  }
  return failures;
}

/** The brand `primary`/`secondary` pair collapses for one deficiency in one scheme. */
export interface CvdFailure {
  readonly scheme: string;
  /** Always `color.primary`. */
  readonly a: string;
  /** Always `color.secondary`. */
  readonly b: string;
  readonly type: CvdType;
  /** CIE76 ΔE between the two colours AS SIMULATED for `type`. */
  readonly deltaE: number;
  /** `CVD_DISTINCT_MIN` — the floor the pair fell below. */
  readonly min: number;
}

function checkSchemeCvd(scheme: string, values: Map<string, unknown>): CvdFailure[] {
  const primary = resolveToHex(values.get(tokenIdToCssVar('color.primary')));
  const secondary = resolveToHex(values.get(tokenIdToCssVar('color.secondary')));
  if (primary === null || secondary === null) return [];
  const failures: CvdFailure[] = [];
  for (const type of CVD_TYPES) {
    const de = deltaE(simulateCvd(primary, type), simulateCvd(secondary, type));
    if (!(de >= CVD_DISTINCT_MIN)) {
      failures.push({
        scheme,
        a: 'color.primary',
        b: 'color.secondary',
        type,
        deltaE: de,
        min: CVD_DISTINCT_MIN,
      });
    }
  }
  return failures;
}

/**
 * A THIRD a11y axis beside the two contrast gates (Track D / PR-4): walk the brand
 * `primary`/`secondary` pair in every scheme and flag where the two roles collapse
 * into the same colour for a red-green– or blue-yellow–blind viewer. A contrast
 * ratio is polarity-blind to hue, so two colours can each read well against the page
 * yet be mutually indistinguishable to a dichromat — most easily when `applyBrand`
 * derives the secondary by a fixed hue rotation. Empty = the pair stays distinct
 * under deuteranopia, protanopia and tritanopia.
 */
export function checkBrandColorblind(theme: Theme): CvdFailure[] {
  const failures = checkSchemeCvd('base', effectiveValues(theme.base, []));
  for (const mode of theme.modes ?? []) {
    failures.push(...checkSchemeCvd(mode.scheme, effectiveValues(theme.base, mode.tokens)));
  }
  return failures;
}

/**
 * A non-text element and the adjacent surface it must stand out from. `min` is the
 * WCAG 2 §1.4.11 floor (`AA_NON_TEXT`, 3:1) — same relative-luminance ratio as the
 * text gate, a lower floor because the target is a shape/indicator, not glyphs.
 */
export interface NonTextPair {
  /** The graphical element: a focus indicator, or a solid component fill. */
  readonly fg: string;
  /** The page/container colour it sits against. */
  readonly bg: string;
  readonly min: number;
}

/**
 * The non-text pairs guaranteed at 3:1: the focus ring against the two page
 * backgrounds (the canonical §1.4.11 / §2.4.11 indicator — it MUST be perceivable),
 * and every solid semantic fill against the page (a button/badge/status chip is a UI
 * component whose shape is identified by its fill boundary against `bg`). Excluded on
 * purpose — mirroring the decorative `text-subtle` exclusion above — are `color.border`
 * / `color.border-strong`: they are hairline dividers, not the sole means of
 * identifying a component (surfaces are told apart by their fill), so §1.4.11 does not
 * require them to clear 3:1.
 */
export const NON_TEXT_PAIRS: readonly NonTextPair[] = [
  { fg: 'color.focus-ring', bg: 'color.bg', min: AA_NON_TEXT },
  { fg: 'color.focus-ring', bg: 'color.surface', min: AA_NON_TEXT },
  { fg: 'color.primary', bg: 'color.bg', min: AA_NON_TEXT },
  { fg: 'color.secondary', bg: 'color.bg', min: AA_NON_TEXT },
  { fg: 'color.success', bg: 'color.bg', min: AA_NON_TEXT },
  { fg: 'color.warning', bg: 'color.bg', min: AA_NON_TEXT },
  { fg: 'color.danger', bg: 'color.bg', min: AA_NON_TEXT },
  { fg: 'color.info', bg: 'color.bg', min: AA_NON_TEXT },
];

/** One non-text pair that falls below its 3:1 floor in a given scheme. */
export interface NonTextFailure {
  readonly scheme: string;
  readonly fg: string;
  readonly bg: string;
  readonly ratio: number;
  readonly min: number;
}

function checkSchemeNonText(scheme: string, values: Map<string, unknown>): NonTextFailure[] {
  const failures: NonTextFailure[] = [];
  for (const pair of NON_TEXT_PAIRS) {
    const fgHex = resolveToHex(values.get(tokenIdToCssVar(pair.fg)));
    const bgHex = resolveToHex(values.get(tokenIdToCssVar(pair.bg)));
    if (fgHex === null || bgHex === null) continue;
    const ratio = contrastRatio(fgHex, bgHex);
    if (!(ratio >= pair.min)) {
      failures.push({ scheme, fg: pair.fg, bg: pair.bg, ratio, min: pair.min });
    }
  }
  return failures;
}

/**
 * WCAG 2 §1.4.11 Non-text Contrast, added beside the text gates (Track D / PR-4):
 * walk the guaranteed non-text pairs (focus ring + solid fills against the page) in
 * every scheme and return the ones below 3:1. This is the same WCAG 2 ratio as
 * `checkThemeContrast` at a lower, non-text floor — it catches a brand override that
 * leaves a focus ring or a pale button imperceptible against its background, which
 * the 4.5:1 text gate never inspects (fills carry `on-X` text, not page text).
 */
export function checkThemeNonText(theme: Theme): NonTextFailure[] {
  const failures = checkSchemeNonText('base', effectiveValues(theme.base, []));
  for (const mode of theme.modes ?? []) {
    failures.push(...checkSchemeNonText(mode.scheme, effectiveValues(theme.base, mode.tokens)));
  }
  return failures;
}
