import { describe, expect, it } from 'vitest';
import {
  checkThemeNonText,
  explainNonText,
  diagnoseTheme,
  defaultTheme,
  tokenIdToCssVar,
  NON_TEXT_PAIRS,
  AA_NON_TEXT,
} from '../src/index.js';
import type { NonTextFailure, Theme } from '../src/index.js';

/**
 * WCAG 2 §1.4.11 Non-text Contrast — Track D, doc 20. A fourth a11y check beside the
 * text ratio, APCA and CVD gates (PR-4: add standards, never replace). It guarantees
 * the focus ring and every solid semantic fill clear 3:1 against the page — targets
 * the 4.5:1 text gate never inspects (a fill carries `on-X` text, not page text). The
 * default theme must pass by construction; a pale-brand override must be caught.
 */

/** Set arbitrary token literals by id, base scheme only — no core / applyBrand import. */
function setTokens(theme: Theme, overrides: Record<string, string>): Theme {
  const byVar = new Map(Object.entries(overrides).map(([id, v]) => [tokenIdToCssVar(id), v] as const));
  const base = theme.base.map((t) => (byVar.has(t.cssVar) ? { ...t, value: byVar.get(t.cssVar) as string } : t));
  return { ...theme, base, modes: [] };
}

describe('checkThemeNonText — WCAG 2 §1.4.11 gate over guaranteed non-text pairs', () => {
  it('the default theme clears 3:1 for every non-text pair in every scheme', () => {
    const failures = checkThemeNonText(defaultTheme());
    expect(failures, JSON.stringify(failures)).toEqual([]);
  });

  it('guarantees the focus ring and the solid fills, not the decorative borders', () => {
    const fgs = new Set(NON_TEXT_PAIRS.map((p) => p.fg));
    expect(fgs.has('color.focus-ring')).toBe(true);
    expect(fgs.has('color.primary')).toBe(true);
    expect(fgs.has('color.danger')).toBe(true);
    // Hairline dividers are decorative — surfaces are told apart by fill, not border.
    expect(fgs.has('color.border')).toBe(false);
    expect(fgs.has('color.border-strong')).toBe(false);
    expect(NON_TEXT_PAIRS.every((p) => p.min === AA_NON_TEXT)).toBe(true);
    expect(AA_NON_TEXT).toBe(3);
  });

  it('flags a pale focus ring that vanishes against the page', () => {
    const bad = setTokens(defaultTheme(), { 'color.focus-ring': '#f5f7fa' }); // near-white on white
    const failures = checkThemeNonText(bad);
    expect(failures.some((f) => f.fg === 'color.focus-ring' && f.bg === 'color.bg')).toBe(true);
    for (const f of failures) expect(f.ratio).toBeLessThan(AA_NON_TEXT);
  });

  it('flags a pale solid fill whose button shape is imperceptible', () => {
    const bad = setTokens(defaultTheme(), { 'color.primary': '#dbe4ff' }); // pale blue on white
    const failures = checkThemeNonText(bad);
    expect(failures.some((f) => f.fg === 'color.primary')).toBe(true);
  });

  it('is deterministic', () => {
    const t = defaultTheme();
    expect(checkThemeNonText(t)).toEqual(checkThemeNonText(t));
  });
});

describe('explainNonText — one non-text record → one actionable Diagnostic', () => {
  it('reports the ratio unit and a perceive-as-component remedy', () => {
    const f: NonTextFailure = {
      scheme: 'dark',
      fg: 'color.focus-ring',
      bg: 'color.bg',
      ratio: 2.1,
      min: 3,
    };
    const d = explainNonText(f);
    expect(d.standard).toBe('non-text');
    expect(d.scheme).toBe('dark');
    expect(d.unit).toBe('ratio');
    expect(d.measured).toBe(2.1);
    expect(d.required).toBe(3);
    expect(d.shortfall).toBeCloseTo(0.9, 5);
    expect(d.tokens).toEqual(['color.focus-ring', 'color.bg']);
    expect(d.summary).toContain('1.4.11');
    expect(d.remedy).toContain('color.focus-ring');
    expect(d.remedy).toContain('color.bg');
  });

  it('never reports a negative shortfall (clamped at 0)', () => {
    const passing: NonTextFailure = { scheme: 'base', fg: 'a', bg: 'b', ratio: 4, min: 3 };
    expect(explainNonText(passing).shortfall).toBe(0);
  });
});

describe('diagnoseTheme — non-text sits between the text gate and APCA', () => {
  it('surfaces a non-text failure grouped after WCAG text and before APCA/CVD', () => {
    const bad = setTokens(defaultTheme(), {
      'color.focus-ring': '#f5f7fa', // non-text: vanishes on white
    });
    const diags = diagnoseTheme(bad);
    expect(diags.some((d) => d.standard === 'non-text')).toBe(true);
    const order = ['wcag', 'non-text', 'apca', 'cvd'] as const;
    const rank = (s: string): number => order.indexOf(s as (typeof order)[number]);
    const standards = diags.map((d) => d.standard);
    for (let i = 1; i < standards.length; i += 1) {
      expect(rank(standards[i] as string)).toBeGreaterThanOrEqual(rank(standards[i - 1] as string));
    }
  });
});
