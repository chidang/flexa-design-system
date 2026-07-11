/**
 * Token-reference data — derived at build time from the SAME registry the
 * package exports (doc 19 FDS-3: "generate from the DTCG source, never
 * drift"). No copied values live in this app.
 */
import {
  FDS_TOKENS,
  getToken,
  defaultTheme,
  contrastRatio,
  CONTRAST_PAIRS,
  type TokenEntry,
  type TokenValue,
} from 'flexa-design-system';

export type Scheme = 'light' | 'dark';

const ALIAS_RE = /^\{([a-z0-9-]+(?:\.[a-z0-9-]+)*)\}$/;

/** Dark-mode overrides of the default theme, keyed by cssVar. */
const darkByCssVar = new Map<string, TokenValue>();
for (const t of defaultTheme().modes?.find((m) => m.scheme === 'dark')?.tokens ?? []) {
  darkByCssVar.set(t.cssVar, t.value);
}

function rawValue(id: string, scheme: Scheme): TokenValue | undefined {
  const entry = getToken(id);
  if (!entry) return undefined;
  if (scheme === 'dark') {
    const override = darkByCssVar.get(entry.cssVar);
    if (override !== undefined) return override;
  }
  return entry.value;
}

/** Follow whole-value aliases until a literal (registry is cycle-checked). */
export function resolveTokenValue(id: string, scheme: Scheme): TokenValue | undefined {
  let value = rawValue(id, scheme);
  for (let depth = 0; depth < 16 && typeof value === 'string'; depth++) {
    const m = ALIAS_RE.exec(value);
    if (!m || !m[1]) return value;
    value = rawValue(m[1], scheme);
  }
  return value;
}

/** Resolved hex for a color token, or null when it is not a plain color. */
export function resolveColor(id: string, scheme: Scheme): string | null {
  const value = resolveTokenValue(id, scheme);
  return typeof value === 'string' && value.startsWith('#') ? value : null;
}

/** Human-readable display of a token's raw (unresolved) value. */
export function displayValue(value: TokenValue): string {
  if (typeof value === 'string' || typeof value === 'number') return String(value);
  if (Array.isArray(value)) return value.join(', ');
  return Object.entries(value as Record<string, TokenValue>)
    .map(([k, v]) => `${k}: ${displayValue(v)}`)
    .join(' · ');
}

export interface TokenGroup {
  /** First id segment (semantic/component) or `ref.<scale>` (primitive). */
  key: string;
  tokens: TokenEntry[];
}

function groupBy(tokens: readonly TokenEntry[], keyOf: (t: TokenEntry) => string): TokenGroup[] {
  const groups = new Map<string, TokenEntry[]>();
  for (const t of tokens) {
    const key = keyOf(t);
    const list = groups.get(key);
    if (list) list.push(t);
    else groups.set(key, [t]);
  }
  return [...groups.entries()].map(([key, list]) => ({ key, tokens: list }));
}

/** Semantic tokens grouped by namespace (`color`, `space`, `radius`, …). */
export const SEMANTIC_GROUPS: TokenGroup[] = groupBy(
  FDS_TOKENS.filter((t) => t.tier === 'semantic'),
  (t) => t.id.split('.')[0] ?? '',
);

/** Component tokens grouped by component (`c.button`, `c.input`, …). */
export const COMPONENT_GROUPS: TokenGroup[] = groupBy(
  FDS_TOKENS.filter((t) => t.tier === 'component'),
  (t) => t.id.split('.').slice(0, 2).join('.'),
);

/** Primitive tokens grouped by scale (`ref.brand`, `ref.space`, …). */
export const PRIMITIVE_GROUPS: TokenGroup[] = groupBy(
  FDS_TOKENS.filter((t) => t.tier === 'primitive'),
  (t) => t.id.split('.').slice(0, 2).join('.'),
);

export interface ContrastRow {
  fg: string;
  bg: string;
  min: number;
  light: number;
  dark: number;
}

/** The CI-enforced pairs with their actual ratios in both schemes. */
export function contrastMatrix(): ContrastRow[] {
  return CONTRAST_PAIRS.map((pair) => {
    const ratio = (scheme: Scheme): number => {
      const fg = resolveColor(pair.fg, scheme);
      const bg = resolveColor(pair.bg, scheme);
      return fg && bg ? Math.round(contrastRatio(fg, bg) * 100) / 100 : 0;
    };
    return { fg: pair.fg, bg: pair.bg, min: pair.min, light: ratio('light'), dark: ratio('dark') };
  });
}
