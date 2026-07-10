/**
 * APCA (Accessible Perceptual Contrast Algorithm) — the WCAG 3 candidate contrast
 * method, added ALONGSIDE the WCAG 2 ratio in `contrast.ts` (Track D, doc 20). It is
 * NEVER a replacement (PR-4: add a standard, don't loosen the old one). Where WCAG 2
 * gives a symmetric 1…21 ratio, APCA gives a signed "lightness contrast" Lc
 * (≈ -108 … +106): polarity matters (dark-on-light is positive, light-on-dark
 * negative) and text vs background are NOT interchangeable. Gate on `abs(Lc)` against
 * a role-based minimum (see `APCA_BODY_MIN` / `APCA_UI_MIN`).
 *
 * Pure, deterministic, zero-dependency (INV-3): the exact APCA-W3 0.1.9 constants for
 * the sRGB colour space, implemented from the specification. Not a runtime engine —
 * analysis over token data, so no PHP mirror / parity surface (same boundary as the
 * WCAG functions in contrast.ts).
 *
 * Reference values this reproduces exactly: black `#000` text on white `#fff` bg →
 * Lc 106.04; white text on black bg → Lc -107.88.
 */

// APCA-W3 0.1.9 constants (sRGB, transfer exponent 2.4). Do not tune — these are the
// published algorithm; changing them silently would break the "proven a11y" promise.
const MAIN_TRC = 2.4;
const S_RCO = 0.2126729;
const S_GCO = 0.7151522;
const S_BCO = 0.072175;
const NORM_BG = 0.56;
const NORM_TXT = 0.57;
const REV_TXT = 0.62;
const REV_BG = 0.65;
const BLK_THRS = 0.022;
const BLK_CLMP = 1.414;
const SCALE_BOW = 1.14;
const SCALE_WOB = 1.14;
const LO_BOW_OFFSET = 0.027;
const LO_WOB_OFFSET = 0.027;
const DELTA_Y_MIN = 0.0005;
const LO_CLIP = 0.1;

/**
 * Role-based APCA Lc minimums (absolute value), from the APCA readability guidance:
 * body-sized text needs Lc ≥ 75; UI label text sitting on a fill (bolder/larger by
 * convention — button/badge captions) needs Lc ≥ 60. These are the published
 * per-role minimums, not arbitrary bars.
 */
export const APCA_BODY_MIN = 75;
export const APCA_UI_MIN = 60;

/** Parse `#rgb` / `#rrggbb` to 0–255 channels; null for anything else (rgba/keywords). */
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

/** Screen luminance Y of an sRGB hex colour under APCA's linearization (exp 2.4). */
export function apcaLuminance(hex: string): number {
  const rgb = hexToRgb(hex);
  if (!rgb) return NaN;
  const lin = (c: number): number => (c / 255) ** MAIN_TRC;
  return S_RCO * lin(rgb[0]) + S_GCO * lin(rgb[1]) + S_BCO * lin(rgb[2]);
}

/** APCA black soft-clamp: lift near-black luminance so deep colours behave. */
function softClamp(y: number): number {
  return y > BLK_THRS ? y : y + (BLK_THRS - y) ** BLK_CLMP;
}

/**
 * APCA lightness contrast Lc between `textHex` and its `bgHex` (both sRGB hex).
 * Signed: positive = dark text on light bg, negative = light text on dark bg.
 * Returns 0 for invalid input or below the perceptual noise floor. ORDER MATTERS —
 * text first, background second (APCA is asymmetric).
 */
export function apcaContrast(textHex: string, bgHex: string): number {
  let txtY = apcaLuminance(textHex);
  let bgY = apcaLuminance(bgHex);
  if (Number.isNaN(txtY) || Number.isNaN(bgY)) return 0;

  txtY = softClamp(txtY);
  bgY = softClamp(bgY);
  if (Math.abs(bgY - txtY) < DELTA_Y_MIN) return 0;

  let sapc: number;
  let output: number;
  if (bgY > txtY) {
    // Normal polarity — dark text on a lighter background.
    sapc = (bgY ** NORM_BG - txtY ** NORM_TXT) * SCALE_BOW;
    output = sapc < LO_CLIP ? 0 : sapc - LO_BOW_OFFSET;
  } else {
    // Reverse polarity — light text on a darker background.
    sapc = (bgY ** REV_BG - txtY ** REV_TXT) * SCALE_WOB;
    output = sapc > -LO_CLIP ? 0 : sapc + LO_WOB_OFFSET;
  }
  return output * 100;
}
