import { describe, expect, it } from 'vitest';
import {
  apcaContrast,
  apcaLuminance,
  APCA_BODY_MIN,
  APCA_UI_MIN,
  checkThemeContrast,
  checkThemeContrastApca,
  contrastRatio,
  CONTRAST_PAIRS,
  defaultTheme,
} from '../src/index.js';

/**
 * APCA (WCAG 3 candidate) — Track D, doc 20. Added ALONGSIDE the WCAG 2 ratio, never
 * replacing it (PR-4). These tests (a) prove the algorithm against the published
 * APCA-W3 0.1.9 reference anchors, and (b) pin the default theme's two-standard
 * posture: after the dark-accent re-tune (FDS 2.8.2) every guaranteed pair clears
 * BOTH gates in every scheme, while a synthetic pair still proves APCA is the stricter
 * standard — it can flag a fill WCAG 2 waves through.
 */

describe('APCA algorithm — reference vectors', () => {
  it('reproduces the canonical APCA-W3 reference contrasts', () => {
    // The two published anchors of the sRGB algorithm.
    expect(apcaContrast('#000000', '#ffffff')).toBeCloseTo(106.04, 1); // black text on white
    expect(apcaContrast('#ffffff', '#000000')).toBeCloseTo(-107.88, 1); // white text on black
  });

  it('is polarity-signed and asymmetric (text vs background are not interchangeable)', () => {
    const a = apcaContrast('#0f172a', '#ffffff'); // dark text on white → positive
    const b = apcaContrast('#ffffff', '#0f172a'); // white text on dark → negative
    expect(a).toBeGreaterThan(0);
    expect(b).toBeLessThan(0);
    // Swapping is NOT mere negation — the WCAG-2 symmetry APCA deliberately drops.
    expect(Math.abs(a)).not.toBeCloseTo(Math.abs(b), 1);
  });

  it('returns 0 for equal colours and below the perceptual noise floor', () => {
    expect(apcaContrast('#777777', '#777777')).toBe(0);
    expect(apcaContrast('#000000', '#010101')).toBe(0); // sub-deltaYmin difference
  });

  it('returns 0 for invalid / non-hex input (rgba, keywords) rather than NaN', () => {
    expect(apcaContrast('rgba(0,0,0,0.4)', '#ffffff')).toBe(0);
    expect(apcaContrast('#fff', 'transparent')).toBe(0);
    expect(Number.isNaN(apcaLuminance('nope'))).toBe(true);
  });

  it('is monotonic: darker text on white raises |Lc|', () => {
    const light = Math.abs(apcaContrast('#aaaaaa', '#ffffff'));
    const mid = Math.abs(apcaContrast('#777777', '#ffffff'));
    const dark = Math.abs(apcaContrast('#333333', '#ffffff'));
    expect(mid).toBeGreaterThan(light);
    expect(dark).toBeGreaterThan(mid);
  });

  it('luminance follows the sRGB channel weights (green ≫ red ≫ blue)', () => {
    expect(apcaLuminance('#00ff00')).toBeGreaterThan(apcaLuminance('#ff0000'));
    expect(apcaLuminance('#ff0000')).toBeGreaterThan(apcaLuminance('#0000ff'));
    expect(apcaLuminance('#000000')).toBe(0);
  });
});

describe('APCA theme gate — a second standard beside WCAG 2 (PR-4)', () => {
  const theme = defaultTheme();

  it('every guaranteed pair carries both a WCAG and an APCA floor', () => {
    expect(
      CONTRAST_PAIRS.every(
        (p) => p.min >= 4.5 && (p.apcaMin === APCA_BODY_MIN || p.apcaMin === APCA_UI_MIN),
      ),
    ).toBe(true);
  });

  it('body-text pairs clear APCA Lc ≥ 75 in EVERY scheme (the hard guarantee)', () => {
    const bodyFailures = checkThemeContrastApca(theme).filter((f) => f.min === APCA_BODY_MIN);
    expect(bodyFailures).toEqual([]);
  });

  it('clears BOTH gates on every guaranteed pair in every scheme (the 2.8.2 re-tune)', () => {
    // The default theme passes WCAG AA everywhere…
    expect(checkThemeContrast(theme)).toEqual([]);
    // …and, after re-tuning the dark-mode accent fills, APCA too — the last deferred
    // Track D finding (dark `on-*` labels below Lc 60) is closed. No colours pinned:
    // the guarantee is "zero failures", so a future regression turns CI red.
    expect(checkThemeContrastApca(theme)).toEqual([]);
  });

  it('remains the stricter standard: it flags a UI label WCAG 2 passes', () => {
    // Dark ink on the old dark-mode primary (brand.400) — the exact pair the re-tune
    // fixed. WCAG reads it as a comfortable ~7.9:1 (well past AA), but APCA scores the
    // light fill far more harshly (Lc ≈ 54 < 60). This is why APCA sits beside WCAG 2.
    const darkInk = '#020617'; // ref.neutral.950
    const lightFill = '#60a5fa'; // ref.brand.400 (the pre-2.8.2 dark primary)
    expect(contrastRatio(darkInk, lightFill)).toBeGreaterThan(4.5);
    expect(Math.abs(apcaContrast(darkInk, lightFill))).toBeLessThan(APCA_UI_MIN);
  });
});
