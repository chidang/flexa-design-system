/**
 * Accessibility data — measured at build time by the package's OWN a11y engine
 * (Track D), never authored. `diagnoseTheme` / `simulateCvd` / `deltaE` and the
 * standard constants are the same functions CI and `flexa validate` run, so this
 * page cannot claim a number the code does not.
 */
import {
  APCA_BODY_MIN,
  APCA_UI_MIN,
  CVD_DISTINCT_MIN,
  CVD_TYPES,
  HC_MODE_OVERRIDES,
  defaultTheme,
  deltaE,
  diagnoseTheme,
  simulateCvd,
  type CvdType,
  type Diagnostic,
} from 'flexa-design-system';
import { resolveColor } from './tokens';

/** The default theme's diagnostics, exactly as the engine reports them. */
export function diagnostics(): Diagnostic[] {
  return diagnoseTheme(defaultTheme());
}

/** Human label for a `Diagnostic.standard`. */
export const STANDARD_LABEL: Record<Diagnostic['standard'], string> = {
  wcag: 'WCAG 2 text',
  'non-text': 'WCAG 2 non-text',
  apca: 'APCA',
  cvd: 'Colour-vision',
};

/** Unit suffix for a diagnostic's measured/required values. */
export const UNIT_SUFFIX: Record<Diagnostic['unit'], string> = {
  ratio: ':1',
  Lc: ' Lc',
  deltaE: ' ΔE',
};

/** The published floors, straight from the package constants (no drift). */
export const A11Y_LIMITS = {
  apcaBody: APCA_BODY_MIN,
  apcaUi: APCA_UI_MIN,
  cvdDeltaE: CVD_DISTINCT_MIN,
  /** How many neutral/brand roles high-contrast mode re-points up to AAA. */
  hcOverrides: Object.keys(HC_MODE_OVERRIDES).length,
  /** High-contrast mode's target ratio. */
  aaa: 7,
} as const;

export interface CvdRow {
  type: CvdType;
  /** Primary/secondary as the deficiency sees them. */
  primary: string;
  secondary: string;
  deltaE: number;
  distinct: boolean;
}

export interface CvdReport {
  /** The two brand roles in the light scheme (the colours being tested). */
  basePrimary: string;
  baseSecondary: string;
  rows: CvdRow[];
}

/**
 * Simulate the brand primary/secondary under each deficiency and measure how far
 * apart they stay (CIE76 ΔE). `distinct` = clears the `CVD_DISTINCT_MIN` floor the
 * `checkBrandColorblind` gate enforces.
 */
export function cvdReport(): CvdReport | null {
  const basePrimary = resolveColor('color.primary', 'light');
  const baseSecondary = resolveColor('color.secondary', 'light');
  if (!basePrimary || !baseSecondary) return null;
  const rows = CVD_TYPES.map((type): CvdRow => {
    const primary = simulateCvd(basePrimary, type);
    const secondary = simulateCvd(baseSecondary, type);
    const d = Math.round(deltaE(primary, secondary) * 10) / 10;
    return { type, primary, secondary, deltaE: d, distinct: d >= CVD_DISTINCT_MIN };
  });
  return { basePrimary, baseSecondary, rows };
}
