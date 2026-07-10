/**
 * Flexa Design System — accessibility diagnostics (Track D, doc 20).
 *
 * The three gates in `contrast.ts` each answer a yes/no question and, on failure,
 * hand back a record full of numbers: `{scheme, fg, bg, ratio, min}` and friends.
 * That is enough for CI to turn red, but not enough for a person (or the Design
 * Studio, or `flexa validate`) to know WHICH standard complained, what the numbers
 * mean, and — the actionable part — which direction the fix lies. This module is
 * the "why did this fail" layer: it normalises all three failure shapes into one
 * `Diagnostic` carrying a plain-language summary and a remedy.
 *
 * Pure, deterministic, zero-dependency (INV-3), and analysis-only — it reads the
 * gate records, never emits CSS, so (like the gates it explains) it has no PHP
 * mirror / parity surface (INV-2 untouched).
 */

import {
  checkThemeContrast,
  checkThemeNonText,
  checkThemeContrastApca,
  checkBrandColorblind,
  type ContrastFailure,
  type NonTextFailure,
  type ApcaFailure,
  type CvdFailure,
} from './contrast.js';
import type { Theme } from './resolve.js';

/**
 * Which a11y standard a diagnostic came from. `wcag` and `non-text` are both WCAG 2
 * relative-luminance ratios but at different floors and over different targets (text
 * glyphs vs. UI components / graphics, §1.4.3 vs. §1.4.11), so they stay distinct.
 */
export type ContrastStandard = 'wcag' | 'non-text' | 'apca' | 'cvd';

/**
 * A normalised, human-actionable explanation of one gate failure. `measured` and
 * `required` (and therefore `shortfall`) are in the standard's own unit — compare
 * them WITHIN a standard, not across (a WCAG ratio and an APCA Lc are not the same
 * scale). `tokens` are the token ids involved so a consumer can jump straight to
 * the controls that fix it.
 */
export interface Diagnostic {
  readonly standard: ContrastStandard;
  /** `base` for the default scheme, else the mode id (e.g. `dark`). */
  readonly scheme: string;
  /** Token ids the failure is about, e.g. `['color.on-primary','color.primary']`. */
  readonly tokens: readonly string[];
  /** The value that failed, rounded: WCAG ratio, `abs(APCA Lc)`, or CIE76 ΔE. */
  readonly measured: number;
  /** The floor it had to clear. */
  readonly required: number;
  /** `max(0, required - measured)` — how far short, in the standard's own unit. */
  readonly shortfall: number;
  /** Unit of `measured` / `required`, for display. */
  readonly unit: 'ratio' | 'Lc' | 'deltaE';
  /** One-line statement of what failed and where. */
  readonly summary: string;
  /** The direction of the fix — what to change and why it works. */
  readonly remedy: string;
}

/** Round to `p` decimals as a number (no trailing-zero string artefacts). */
function round(n: number, p: number): number {
  return Number(n.toFixed(p));
}

/** Explain one WCAG 2 contrast-ratio failure. */
export function explainContrast(f: ContrastFailure): Diagnostic {
  const measured = round(f.ratio, 2);
  return {
    standard: 'wcag',
    scheme: f.scheme,
    tokens: [f.fg, f.bg],
    measured,
    required: f.min,
    shortfall: round(Math.max(0, f.min - f.ratio), 2),
    unit: 'ratio',
    summary: `WCAG 2 contrast of ${f.fg} on ${f.bg} is ${measured}:1 in the ${f.scheme} scheme — below the ${f.min}:1 floor.`,
    remedy: `Raise the luminance contrast between ${f.fg} and ${f.bg}: lighten the lighter role or darken the darker one until the ratio clears ${f.min}:1.`,
  };
}

/** Explain one WCAG 2 §1.4.11 non-text (UI component / graphic) failure. */
export function explainNonText(f: NonTextFailure): Diagnostic {
  const measured = round(f.ratio, 2);
  return {
    standard: 'non-text',
    scheme: f.scheme,
    tokens: [f.fg, f.bg],
    measured,
    required: f.min,
    shortfall: round(Math.max(0, f.min - f.ratio), 2),
    unit: 'ratio',
    summary: `Non-text contrast (WCAG 2 §1.4.11) of ${f.fg} against ${f.bg} is ${measured}:1 in the ${f.scheme} scheme — below the ${f.min}:1 floor, so the element is hard to perceive as a component.`,
    remedy: `Push ${f.fg} further from ${f.bg} in luminance until it clears ${f.min}:1 — a focus ring or solid fill must stand out from the page even though it carries no text.`,
  };
}

/** Explain one APCA (Lc) failure. */
export function explainApca(f: ApcaFailure): Diagnostic {
  const abs = round(Math.abs(f.lc), 1);
  return {
    standard: 'apca',
    scheme: f.scheme,
    tokens: [f.fg, f.bg],
    measured: abs,
    required: f.min,
    shortfall: round(Math.max(0, f.min - Math.abs(f.lc)), 1),
    unit: 'Lc',
    summary: `APCA contrast of ${f.fg} on ${f.bg} is ${abs} Lc in the ${f.scheme} scheme — below the ${f.min} Lc floor for its role.`,
    remedy: `APCA weighs bright fills more harshly than WCAG 2. Deepen the perceptual contrast of ${f.fg} against ${f.bg} — usually a darker fill or a heavier ${f.fg} — to reach ${f.min} Lc.`,
  };
}

/** Explain one colour-vision-deficiency collapse of the brand pair. */
export function explainCvd(f: CvdFailure): Diagnostic {
  const measured = round(f.deltaE, 1);
  return {
    standard: 'cvd',
    scheme: f.scheme,
    tokens: [f.a, f.b],
    measured,
    required: f.min,
    shortfall: round(Math.max(0, f.min - f.deltaE), 1),
    unit: 'deltaE',
    summary: `${f.a} and ${f.b} collapse to ΔE ${measured} under ${f.type} in the ${f.scheme} scheme — the two brand roles read as one colour (need ΔE ${f.min}).`,
    remedy: `Separate the roles by lightness, not hue: a hue rotation alone is invisible to ${f.type}. Give ${f.b} a clearly lighter or darker value than ${f.a}.`,
  };
}

/**
 * Run all three a11y gates over `theme` and return one flat, actionable list of
 * diagnostics — the single call the Design Studio / `flexa validate` / CI can render
 * to tell an author exactly what failed and how to fix it. Empty = the theme clears
 * every standard. Order is deterministic and grouped by standard (WCAG text, then
 * WCAG non-text, then APCA, then CVD), each in the gate's own scheme/pair order.
 */
export function diagnoseTheme(theme: Theme): Diagnostic[] {
  return [
    ...checkThemeContrast(theme).map(explainContrast),
    ...checkThemeNonText(theme).map(explainNonText),
    ...checkThemeContrastApca(theme).map(explainApca),
    ...checkBrandColorblind(theme).map(explainCvd),
  ];
}
