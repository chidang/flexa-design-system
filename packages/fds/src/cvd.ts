/**
 * Flexa Design System — colour-vision-deficiency (CVD) simulation + perceptual
 * distance. Track D, doc 20: a contrast RATIO cannot see the failure mode where
 * two hues carry good luminance contrast against the page yet collapse into the
 * same colour for a red-green– or blue-yellow–blind viewer. This module adds that
 * missing axis so `checkBrandColorblind` (in contrast.ts) can gate the primary /
 * secondary pair — including the hue-shifted secondary that `applyBrand` derives.
 *
 * Pure, deterministic, zero-dependency (INV-3): dichromat simulation via the
 * Machado, Oliveira & Fernandes (2009) severity-1.0 matrices — the same matrices
 * Chrome DevTools uses to emulate vision deficiencies — applied in linear-light
 * sRGB, and CIE76 ΔE over CIELAB for "are these two still telling apart?".
 *
 * Analysis only — never emits CSS, so (like contrast.ts) no PHP mirror / parity
 * surface (INV-2 untouched).
 */

export type CvdType = 'deuteranopia' | 'protanopia' | 'tritanopia';

/**
 * Machado et al. (2009) dichromacy matrices at severity 1.0, row-major, operating
 * on linear-light RGB. Deuteranopia (no green cone) and protanopia (no red cone)
 * are the two red-green deficiencies; tritanopia (no blue cone) is blue-yellow.
 */
type Mat = readonly [
  number, number, number,
  number, number, number,
  number, number, number,
];

const CVD_MATRICES: Readonly<Record<CvdType, Mat>> = {
  protanopia: [
    0.152286, 1.052583, -0.204868, 0.114503, 0.786281, 0.099216, -0.003882,
    -0.048116, 1.051998,
  ],
  deuteranopia: [
    0.367322, 0.860646, -0.227968, 0.28009, 0.672501, 0.047409, -0.01182, 0.04294,
    0.968881,
  ],
  tritanopia: [
    1.255528, -0.076749, -0.178779, -0.078411, 0.930809, 0.147602, 0.004733,
    0.691367, 0.3039,
  ],
};

/**
 * Minimum CIE76 ΔE between the simulated primary and secondary for the pair to
 * count as "distinguishable" under a given deficiency. Well above the ~2.3 just-
 * noticeable threshold: two brand roles must read as clearly different colours, not
 * merely non-identical. Locked by behaviour tests, not by a magic exact value.
 */
export const CVD_DISTINCT_MIN = 15;

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

/** sRGB 0…255 → linear-light 0…1. */
function toLinear(c: number): number {
  const s = c / 255;
  return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
}

/** linear-light 0…1 → sRGB 0…255 (clamped, rounded). */
function toSrgb(l: number): number {
  const c = l <= 0.0031308 ? l * 12.92 : 1.055 * l ** (1 / 2.4) - 0.055;
  return Math.max(0, Math.min(255, Math.round(c * 255)));
}

function toHex(rgb: readonly [number, number, number]): string {
  return `#${rgb.map((c) => c.toString(16).padStart(2, '0')).join('')}`;
}

/**
 * Simulate how `hex` appears to a viewer with the given dichromacy. Returns a hex
 * string (invalid / non-hex input passes through unchanged, mirroring apca.ts's
 * graceful degradation).
 */
export function simulateCvd(hex: string, type: CvdType): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  const [r, g, b] = [toLinear(rgb[0]), toLinear(rgb[1]), toLinear(rgb[2])];
  const m = CVD_MATRICES[type];
  return toHex([
    toSrgb(m[0] * r + m[1] * g + m[2] * b),
    toSrgb(m[3] * r + m[4] * g + m[5] * b),
    toSrgb(m[6] * r + m[7] * g + m[8] * b),
  ]);
}

/** sRGB hex → CIELAB (D65). Returns null for invalid input. */
function rgbToLab(hex: string): readonly [number, number, number] | null {
  const rgb = hexToRgb(hex);
  if (!rgb) return null;
  const [R, G, B] = [toLinear(rgb[0]), toLinear(rgb[1]), toLinear(rgb[2])];
  // linear sRGB → XYZ (D65), then normalise by the D65 white point.
  let x = (R * 0.4124 + G * 0.3576 + B * 0.1805) / 0.95047;
  const y = R * 0.2126 + G * 0.7152 + B * 0.0722;
  let z = (R * 0.0193 + G * 0.1192 + B * 0.9505) / 1.08883;
  const f = (t: number): number => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
  const fx = f(x);
  const fy = f(y);
  const fz = f(z);
  return [116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)];
}

/** CIE76 ΔE (Euclidean CIELAB distance) between two sRGB hex colours; 0 if invalid. */
export function deltaE(a: string, b: string): number {
  const la = rgbToLab(a);
  const lb = rgbToLab(b);
  if (!la || !lb) return 0;
  return Math.sqrt((la[0] - lb[0]) ** 2 + (la[1] - lb[1]) ** 2 + (la[2] - lb[2]) ** 2);
}

/**
 * Are `a` and `b` still clearly different colours to a viewer with `type`? Simulate
 * both, then require CIE76 ΔE ≥ `CVD_DISTINCT_MIN`.
 */
export function distinguishable(a: string, b: string, type: CvdType): boolean {
  return deltaE(simulateCvd(a, type), simulateCvd(b, type)) >= CVD_DISTINCT_MIN;
}

/** The three deficiencies the brand gate walks. */
export const CVD_TYPES: readonly CvdType[] = ['deuteranopia', 'protanopia', 'tritanopia'];
