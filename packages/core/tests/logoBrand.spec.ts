import { describe, expect, it } from 'vitest';
import {
  extractBrandColors,
  brandFromLogo,
  deriveSecondary,
  applyBrand,
  defaultTheme,
  checkThemeContrast,
} from '../src/index.js';

/**
 * Brand-from-logo (Track C, doc 20; was doc 13 S3) — the algorithm is
 * deterministic, so synthetic pixel arrays assert EXACT colours. Test colours sit
 * at 4-bit bucket centres (#0868c8 blue ~210°, #e88808 orange ~34°, #e80808 red
 * ~0°) so the expected hex equals the input hex.
 */

/** Build an RGBA array from [r,g,b,a,count] runs. */
function px(runs: ReadonlyArray<readonly [number, number, number, number, number]>): {
  pixels: Uint8ClampedArray;
  width: number;
  height: number;
} {
  const total = runs.reduce((n, [, , , , count]) => n + count, 0);
  const pixels = new Uint8ClampedArray(total * 4);
  let i = 0;
  for (const [r, g, b, a, count] of runs) {
    for (let k = 0; k < count; k += 1) {
      pixels[i] = r;
      pixels[i + 1] = g;
      pixels[i + 2] = b;
      pixels[i + 3] = a;
      i += 4;
    }
  }
  return { pixels, width: total, height: 1 };
}

const BLUE = [0x08, 0x68, 0xc8, 255] as const; // hue ≈ 210°
const ORANGE = [0xe8, 0x88, 0x08, 255] as const; // hue ≈ 34°
const RED = [0xe8, 0x08, 0x08, 255] as const; // hue ≈ 0°

describe('extractBrandColors', () => {
  it('a two-colour logo yields the dominant colour as primary, the hue-distant one as secondary', () => {
    const { pixels, width, height } = px([
      [...BLUE, 100],
      [...ORANGE, 50],
      [255, 255, 255, 255, 300], // white background — filtered out
    ]);
    expect(extractBrandColors(pixels, width, height)).toEqual({
      primaryColor: '#0868c8',
      secondaryColor: '#e88808',
    });
  });

  it('white / grey / transparent images have no brand colour (null)', () => {
    const { pixels, width, height } = px([
      [255, 255, 255, 255, 50], // white: luminance > 0.92
      [128, 128, 128, 255, 50], // grey: saturation < 0.15
      [10, 10, 10, 255, 50], // near black: luminance < 0.08
      [0x08, 0x68, 0xc8, 0, 50], // blue but fully transparent
    ]);
    expect(extractBrandColors(pixels, width, height)).toBeNull();
  });

  it('equal counts tie-break on the ascending bucket key (stable)', () => {
    const a = px([
      [...BLUE, 40],
      [...ORANGE, 40],
    ]);
    const b = px([
      [...ORANGE, 40],
      [...BLUE, 40],
    ]);
    // Blue's bucket key (0,6,12) sorts below orange's (14,8,0) — order of the
    // input pixels must not matter.
    expect(extractBrandColors(a.pixels, a.width, a.height)).toEqual(
      extractBrandColors(b.pixels, b.width, b.height),
    );
    expect(extractBrandColors(a.pixels, a.width, a.height)?.primaryColor).toBe('#0868c8');
  });

  it('falls back to the second-fullest bucket when no hue is > 60° away', () => {
    const { pixels, width, height } = px([
      [...RED, 100],
      [...ORANGE, 50], // ~34° from red — same family, still the best remaining pick
    ]);
    expect(extractBrandColors(pixels, width, height)).toEqual({
      primaryColor: '#e80808',
      secondaryColor: '#e88808',
    });
  });

  it('a single-colour logo returns secondaryColor null', () => {
    const { pixels, width, height } = px([[...BLUE, 80]]);
    expect(extractBrandColors(pixels, width, height)).toEqual({
      primaryColor: '#0868c8',
      secondaryColor: null,
    });
  });

  it('transparent pixels never count toward a colour', () => {
    const { pixels, width, height } = px([
      [...BLUE, 30],
      [0xe8, 0x88, 0x08, 60, 200], // orange but alpha < 128 — ignored entirely
    ]);
    expect(extractBrandColors(pixels, width, height)).toEqual({
      primaryColor: '#0868c8',
      secondaryColor: null,
    });
  });

  it('rejects empty or truncated pixel data', () => {
    expect(extractBrandColors(new Uint8ClampedArray(0), 0, 0)).toBeNull();
    expect(extractBrandColors(new Uint8ClampedArray(8), 100, 100)).toBeNull();
  });

  it('large images sample with a stride but still find the dominant colour', () => {
    // 40 000 px (> MAX_LOGO_SAMPLES) of blue with an orange stripe.
    const total = 40_000;
    const pixels = new Uint8ClampedArray(total * 4);
    for (let i = 0; i < total; i += 1) {
      const [r, g, b, a] = i < 30_000 ? BLUE : ORANGE;
      pixels[i * 4] = r;
      pixels[i * 4 + 1] = g;
      pixels[i * 4 + 2] = b;
      pixels[i * 4 + 3] = a;
    }
    expect(extractBrandColors(pixels, 200, 200)).toEqual({
      primaryColor: '#0868c8',
      secondaryColor: '#e88808',
    });
  });
});

describe('brandFromLogo — logo -> a full Brand (Track C, doc 20)', () => {
  it('a two-colour logo yields both extracted colours as the brand', () => {
    const { pixels, width, height } = px([
      [...BLUE, 100],
      [...ORANGE, 50],
    ]);
    expect(brandFromLogo(pixels, width, height)).toEqual({
      primaryColor: '#0868c8',
      secondaryColor: '#e88808',
    });
  });

  it('a single-colour logo fills the secondary via deriveSecondary (never null)', () => {
    const { pixels, width, height } = px([[...BLUE, 80]]);
    const brand = brandFromLogo(pixels, width, height);
    // "Declare least": one colour family still becomes a complete two-colour brand.
    expect(brand).toEqual({
      primaryColor: '#0868c8',
      secondaryColor: deriveSecondary('#0868c8'),
    });
    expect(brand?.secondaryColor).not.toBeNull();
  });

  it('returns null when no brand colour survives (all-white / grey / transparent)', () => {
    const { pixels, width, height } = px([
      [255, 255, 255, 255, 40],
      [128, 128, 128, 255, 40],
    ]);
    expect(brandFromLogo(pixels, width, height)).toBeNull();
  });

  it('feeds a contrast-safe pipeline — applyBrand of a logo-derived brand passes AA', () => {
    // The derivation itself does not gate contrast; applyBrand does (PR-4). Prove a
    // logo-derived brand (incl. the single-colour deriveSecondary fallback) clears
    // the theme contrast gate on both schemes, for both a two-colour and a
    // one-colour logo.
    const two = px([
      [...BLUE, 100],
      [...ORANGE, 50],
    ]);
    const one = px([[...RED, 80]]);
    for (const shot of [two, one]) {
      const brand = brandFromLogo(shot.pixels, shot.width, shot.height);
      expect(brand).not.toBeNull();
      const failures = checkThemeContrast(applyBrand(defaultTheme(), brand!));
      expect(failures).toEqual([]);
    }
  });
});
