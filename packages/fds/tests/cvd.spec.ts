import { describe, expect, it } from 'vitest';
import {
  simulateCvd,
  deltaE,
  distinguishable,
  checkBrandColorblind,
  CVD_DISTINCT_MIN,
  CVD_TYPES,
  defaultTheme,
  tokenIdToCssVar,
} from '../src/index.js';
import type { CvdType, Theme } from '../src/index.js';

/**
 * Colour-vision-deficiency axis — Track D, doc 20. A THIRD a11y standard beside the
 * WCAG 2 and APCA contrast gates (PR-4). A contrast ratio is blind to hue, so two
 * colours can each read well against the page yet be mutually indistinguishable to a
 * dichromat. These tests (a) exercise the Machado-2009 simulation's properties and
 * (b) pin the theme posture: the default palette stays distinct under every
 * deficiency, while a hue-neighbour brand pair — the shape `applyBrand`'s derived
 * secondary can take — collapses under deuteranopia even though it clears WCAG.
 */

const TYPES: readonly CvdType[] = CVD_TYPES;

describe('CVD simulation — Machado 2009 properties', () => {
  it('is deterministic', () => {
    for (const t of TYPES) expect(simulateCvd('#2fa32f', t)).toBe(simulateCvd('#2fa32f', t));
  });

  it('preserves the achromatic axis (grey, black, white unchanged)', () => {
    for (const t of TYPES) {
      expect(simulateCvd('#808080', t)).toBe('#808080');
      expect(simulateCvd('#000000', t)).toBe('#000000');
      expect(simulateCvd('#ffffff', t)).toBe('#ffffff');
    }
  });

  it('collapses red and green for red-green deficiency (deuteranopia)', () => {
    const red = '#d92626';
    const green = '#2fa32f';
    const normal = deltaE(red, green); // very different to typical vision
    const simmed = deltaE(simulateCvd(red, 'deuteranopia'), simulateCvd(green, 'deuteranopia'));
    expect(normal).toBeGreaterThan(100);
    expect(simmed).toBeLessThan(normal); // the confusion the axis exists to catch
    expect(distinguishable(red, green, 'deuteranopia')).toBe(false);
  });

  it('keeps a blue/orange pair distinct under every deficiency', () => {
    for (const t of TYPES) expect(distinguishable('#2563eb', '#ea7a17', t)).toBe(true);
  });

  it('returns hex through and ΔE 0 for invalid / non-hex input', () => {
    expect(simulateCvd('rgba(0,0,0,0.4)', 'protanopia')).toBe('rgba(0,0,0,0.4)');
    expect(deltaE('nope', '#fff')).toBe(0);
  });
});

/** Build a theme whose primary/secondary are literal hexes, no core / applyBrand import. */
function withBrand(theme: Theme, primary: string, secondary: string): Theme {
  const priVar = tokenIdToCssVar('color.primary');
  const secVar = tokenIdToCssVar('color.secondary');
  const base = theme.base.map((t) =>
    t.cssVar === priVar ? { ...t, value: primary } : t.cssVar === secVar ? { ...t, value: secondary } : t,
  );
  return { ...theme, base, modes: [] };
}

describe('checkBrandColorblind — the axis contrast ratios cannot see (PR-4)', () => {
  const theme = defaultTheme();

  it('passes the default palette: primary/secondary stay distinct under all three deficiencies', () => {
    expect(checkBrandColorblind(theme)).toEqual([]);
  });

  it('flags a normal-vision-distinct brand pair that collapses for a dichromat', () => {
    const risky = withBrand(theme, '#d92626', '#2fa32f'); // red primary, green secondary
    // The whole point: to typical vision these are wildly different colours — a
    // ΔE a contrast ratio (blind to hue) would never call a problem…
    expect(deltaE('#d92626', '#2fa32f')).toBeGreaterThan(100);
    // …yet the two roles are the same colour to a deuteranope.
    const failures = checkBrandColorblind(risky);
    expect(failures.length).toBeGreaterThan(0);
    const deutan = failures.find((f) => f.type === 'deuteranopia');
    expect(deutan).toBeDefined();
    expect(deutan?.a).toBe('color.primary');
    expect(deutan?.b).toBe('color.secondary');
    expect(deutan?.min).toBe(CVD_DISTINCT_MIN);
    expect(deutan!.deltaE).toBeLessThan(CVD_DISTINCT_MIN);
  });

  it('reports per-scheme, per-deficiency (dark-mode overrides are walked too)', () => {
    const risky = withBrand(theme, '#d92626', '#2fa32f');
    for (const f of checkBrandColorblind(risky)) {
      expect(f.scheme).toBe('base'); // withBrand clears modes, so only base
      expect(TYPES).toContain(f.type);
    }
  });
});
