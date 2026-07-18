import { describe, expect, it } from 'vitest';
import {
  diagnoseTheme,
  explainContrast,
  explainApca,
  explainCvd,
  defaultTheme,
  tokenIdToCssVar,
} from '../src/index.js';
import type { ContrastFailure, ApcaFailure, CvdFailure, Theme } from '../src/index.js';

/**
 * Accessibility diagnostics — Track D, doc 20. The three gates each hand back raw
 * failure records; this layer turns them into one actionable `Diagnostic` (which
 * standard, the numbers in that standard's unit, and a remedy pointing the fix).
 * These tests cover the per-record explainers over synthetic inputs and the
 * `diagnoseTheme` aggregate over real themes — including that the shipped default
 * theme now reports NOTHING (every standard clears after the 2.8.2 dark-accent
 * re-tune), while a synthetic broken theme still surfaces grouped diagnostics.
 */

describe('explainers — one failure record → one actionable Diagnostic', () => {
  it('explains a WCAG ratio failure with the ratio unit and a contrast remedy', () => {
    const f: ContrastFailure = {
      scheme: 'dark',
      fg: 'color.text',
      bg: 'color.surface',
      ratio: 3.2,
      min: 4.5,
    };
    const d = explainContrast(f);
    expect(d.standard).toBe('wcag');
    expect(d.scheme).toBe('dark');
    expect(d.tokens).toEqual(['color.text', 'color.surface']);
    expect(d.unit).toBe('ratio');
    expect(d.measured).toBe(3.2);
    expect(d.required).toBe(4.5);
    expect(d.shortfall).toBeCloseTo(1.3, 5); // required - measured, in ratio units
    expect(d.summary).toContain('WCAG 2');
    expect(d.remedy).toContain('color.text');
    expect(d.remedy).toContain('color.surface');
  });

  it('explains an APCA failure with the Lc unit, absolute measure, and APCA-aware remedy', () => {
    const f: ApcaFailure = {
      scheme: 'dark',
      fg: 'color.on-primary',
      bg: 'color.primary',
      lc: -54.3, // polarity preserved by the gate; the diagnostic reports abs
      min: 60,
    };
    const d = explainApca(f);
    expect(d.standard).toBe('apca');
    expect(d.unit).toBe('Lc');
    expect(d.measured).toBe(54.3); // abs of the signed Lc
    expect(d.required).toBe(60);
    expect(d.shortfall).toBeCloseTo(5.7, 5);
    expect(d.summary).toContain('APCA');
    expect(d.remedy).toContain('APCA');
  });

  it('explains a CVD collapse with the ΔE unit and a lightness-not-hue remedy', () => {
    const f: CvdFailure = {
      scheme: 'base',
      a: 'color.primary',
      b: 'color.secondary',
      type: 'deuteranopia',
      deltaE: 8.8,
      min: 15,
    };
    const d = explainCvd(f);
    expect(d.standard).toBe('cvd');
    expect(d.unit).toBe('deltaE');
    expect(d.measured).toBe(8.8);
    expect(d.required).toBe(15);
    expect(d.shortfall).toBeCloseTo(6.2, 5);
    expect(d.tokens).toEqual(['color.primary', 'color.secondary']);
    expect(d.summary).toContain('deuteranopia');
    // The actionable insight: hue rotation alone is invisible; separate by lightness.
    expect(d.remedy).toContain('lightness');
    expect(d.remedy).toContain('deuteranopia');
  });

  it('never reports a negative shortfall (clamped at 0)', () => {
    const passing: ContrastFailure = { scheme: 'base', fg: 'a', bg: 'b', ratio: 5, min: 4.5 };
    expect(explainContrast(passing).shortfall).toBe(0);
  });
});

/** Set arbitrary token literals by id, base scheme only — no core / applyBrand import. */
function setTokens(theme: Theme, overrides: Record<string, string>): Theme {
  const byVar = new Map(Object.entries(overrides).map(([id, v]) => [tokenIdToCssVar(id), v] as const));
  const base = theme.base.map((t) => (byVar.has(t.cssVar) ? { ...t, value: byVar.get(t.cssVar) as string } : t));
  return { ...theme, base, modes: [] };
}

describe('diagnoseTheme — one call, every standard, actionable', () => {
  it('reports nothing for the shipped default theme — every standard clears', () => {
    // After the 2.8.2 dark-accent re-tune, all four standards (WCAG text + non-text,
    // APCA, CVD) pass in every scheme, so the aggregate is empty. "Nothing to report"
    // is the point of gating; a regression on any standard turns this red.
    const diags = diagnoseTheme(defaultTheme());
    expect(diags).toEqual([]);
  });

  it('collects failures from all three standards in grouped order (WCAG, APCA, CVD)', () => {
    const bad = setTokens(defaultTheme(), {
      'color.primary': '#d92626', // red …
      'color.secondary': '#2fa32f', // … green: collapses under deuteranopia (CVD)
      'color.on-primary': '#d0d0d0', // low contrast on the red fill (WCAG + APCA)
    });
    const diags = diagnoseTheme(bad);
    const standards = diags.map((d) => d.standard);
    expect(new Set(standards)).toEqual(new Set(['wcag', 'apca', 'cvd']));
    // Deterministic grouping: WCAG text, then non-text, then APCA, then CVD.
    const order = ['wcag', 'non-text', 'apca', 'cvd'] as const;
    const rank = (s: string): number => order.indexOf(s as (typeof order)[number]);
    for (let i = 1; i < standards.length; i += 1) {
      expect(rank(standards[i] as string)).toBeGreaterThanOrEqual(rank(standards[i - 1] as string));
    }
  });

  it('is deterministic', () => {
    const t = defaultTheme();
    expect(diagnoseTheme(t)).toEqual(diagnoseTheme(t));
  });
});
