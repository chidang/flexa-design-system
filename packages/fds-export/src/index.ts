/**
 * flexa-fds-export — resolved token export for external build pipelines.
 *
 * The `flexa-design-system` package publishes two views of its tokens:
 *   - the RAW registry (`FDS_TOKENS`), whose semantic values are still `{alias}`
 *     references (`color.primary` -> `{ref.brand.600}`), and
 *   - CSS (`emitTheme`), where those aliases stay as `var(--fx-*)` so themes can
 *     re-point them at runtime.
 *
 * Neither is what a Style-Dictionary build, a native-mobile theme, or a Tailwind
 * config wants: a machine-readable set of tokens whose values are CONCRETE
 * LITERALS (the alias chain already followed). This package fills that gap. It is
 * a pure transform over the registry — it never touches the four frozen engines,
 * and (per the FDS distribution rule) it lives OUTSIDE the zero-dependency fds
 * package, consuming the registry the same way the linter does.
 *
 * Value formatting mirrors the frozen emitter (`resolve.ts` `emitTokenValue`):
 * scalars via `String()`, shadows as `offsetX offsetY blur spread color`,
 * cubic-beziers as `cubic-bezier(a, b, c, d)`. The `export.spec.ts` dogfood test
 * follows `emitThemeRoot(FDS_TOKENS)`'s own `var()` chain and asserts every flat
 * value agrees — so this resolver can never silently drift from the canonical CSS.
 */

import {
  FDS_TOKENS,
  FDS_VERSION,
  getToken,
  type TokenEntry,
  type TokenType,
  type TokenValue,
} from 'flexa-design-system';

export { FDS_VERSION };

/** A registry token with its alias chain fully resolved to concrete value(s). */
export interface ResolvedToken {
  /** Public dot-path id, e.g. `color.primary`, `space.4`. */
  readonly id: string;
  /** CSS custom property this token owns, e.g. `--fx-color-primary`. */
  readonly cssVar: string;
  /** DTCG type. */
  readonly type: TokenType;
  /**
   * Concrete resolved value: a CSS literal string for scalar/shadow/cubicBezier
   * tokens, or a field map for `typography` composites (no single CSS value).
   */
  readonly value: string | Readonly<Record<string, string>>;
}

/** `{group.name}` reference anywhere in a value string (mirror: Tokens.php grammar). */
const TOKEN_REF_RE = /\{([a-z0-9]+(?:-[a-z0-9]+)*(?:\.[a-z0-9]+(?:-[a-z0-9]+)*)*)\}/g;
/** True when a value is ENTIRELY one reference. */
const ALIAS_RE = /^\{[a-z0-9]+(?:-[a-z0-9]+)*(?:\.[a-z0-9]+(?:-[a-z0-9]+)*)*\}$/;

function isRecord(v: unknown): v is Record<string, TokenValue> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

/** JS `String()` for scalars — matches the frozen CSS engine's number formatting. */
function scalarToCss(v: TokenValue | undefined): string {
  return typeof v === 'number' ? String(v) : String(v ?? '');
}

/**
 * Resolve a raw scalar/composite value to a concrete CSS string, following any
 * `{alias}` references to their literals. Returns `undefined` for a value that
 * has no single CSS form (a typography composite) or a dangling reference.
 */
function resolveScalar(value: TokenValue, seen: ReadonlySet<string>): string | undefined {
  if (typeof value === 'number') return String(value);
  if (typeof value === 'string') {
    if (ALIAS_RE.test(value)) {
      const id = value.slice(1, -1);
      const r = resolveId(id, seen);
      return typeof r?.value === 'string' ? r.value : undefined;
    }
    // Partial references inside a compound value (e.g. a shadow color `{ref…}`).
    return value.replace(TOKEN_REF_RE, (_m, id: string) => {
      const r = resolveId(id, seen);
      return typeof r?.value === 'string' ? r.value : _m;
    });
  }
  if (Array.isArray(value)) {
    // DTCG cubicBezier [x1,y1,x2,y2] -> cubic-bezier(x1, y1, x2, y2).
    return `cubic-bezier(${value.map(scalarToCss).join(', ')})`;
  }
  return undefined;
}

/** DTCG shadow object -> `offsetX offsetY blur spread color` (mirror: shadowToCss). */
function resolveShadow(v: Record<string, TokenValue>, seen: ReadonlySet<string>): string {
  return (['offsetX', 'offsetY', 'blur', 'spread', 'color'] as const)
    .map((k) => (v[k] === undefined ? '' : resolveScalar(v[k]!, seen) ?? scalarToCss(v[k])))
    .join(' ');
}

/** Typography composite -> field map with every sub-value resolved. */
function resolveTypography(
  v: Record<string, TokenValue>,
  seen: ReadonlySet<string>,
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, raw] of Object.entries(v)) {
    const r = resolveScalar(raw, seen);
    if (r !== undefined) out[k] = r;
  }
  return out;
}

/**
 * Resolve one token id to concrete value(s), following its alias chain. A cycle
 * (an id already on the chain) or an unknown id yields `undefined`.
 */
function resolveId(id: string, seen: ReadonlySet<string>): ResolvedToken | undefined {
  if (seen.has(id)) return undefined;
  const entry = getToken(id);
  if (!entry) return undefined;
  const next = new Set(seen).add(id);
  const value = resolveEntryValue(entry, next);
  if (value === undefined) return undefined;
  return { id: entry.id, cssVar: entry.cssVar, type: entry.type, value };
}

function resolveEntryValue(
  entry: TokenEntry,
  seen: ReadonlySet<string>,
): string | Record<string, string> | undefined {
  const { type, value } = entry;
  // An alias of ANY type (a `shadow`/`typography` token pointing at another) —
  // follow the chain to whatever concrete form the target resolves to. Mirrors
  // the frozen emitter, which resolves a full alias before switching on type.
  if (typeof value === 'string' && ALIAS_RE.test(value)) {
    return resolveId(value.slice(1, -1), seen)?.value;
  }
  if (type === 'typography') return isRecord(value) ? resolveTypography(value, seen) : undefined;
  if (type === 'shadow') return isRecord(value) ? resolveShadow(value, seen) : undefined;
  return resolveScalar(value, seen);
}

/**
 * Every registry token resolved to its concrete value, in registry order.
 * Deterministic and theme-independent — these are the shipped default (light)
 * values (per-scheme overrides are the consuming tool's concern).
 */
export function resolvedTokens(): readonly ResolvedToken[] {
  const out: ResolvedToken[] = [];
  for (const t of FDS_TOKENS) {
    const r = resolveId(t.id, new Set());
    if (r) out.push(r);
  }
  return out;
}

/**
 * Flat `{ '--fx-*': '<literal>' }` map of every token with a single CSS value
 * (typography composites are excluded — they have no single value, matching the
 * frozen emitter). Drop-in for a Tailwind/CSS-in-JS/JSON theme config.
 */
export function toFlatTokens(): Record<string, string> {
  const out: Record<string, string> = {};
  for (const t of resolvedTokens()) {
    if (typeof t.value === 'string') out[t.cssVar] = t.value;
  }
  return out;
}

/** A Style Dictionary / DTCG token tree node (group or leaf). */
export interface SdLeaf {
  readonly $value: string | Readonly<Record<string, string>>;
  readonly $type: TokenType;
}
export interface SdGroup {
  readonly [segment: string]: SdGroup | SdLeaf;
}

/**
 * The registry as a nested Style Dictionary source object (DTCG format): groups
 * keyed by dot-path segment, each leaf `{ $value, $type }` with the alias chain
 * already RESOLVED. Point Style Dictionary v4 at this to build platform outputs
 * (SCSS, iOS, Android, JS) without needing FDS's own resolver.
 */
export function toStyleDictionary(): SdGroup {
  const root: Record<string, unknown> = {};
  for (const t of resolvedTokens()) {
    const segs = t.id.split('.');
    let node = root;
    for (let i = 0; i < segs.length - 1; i++) {
      const seg = segs[i]!;
      if (!isRecord(node[seg])) node[seg] = {};
      node = node[seg] as Record<string, unknown>;
    }
    node[segs[segs.length - 1]!] = { $value: t.value, $type: t.type };
  }
  return root as SdGroup;
}

export type ExportFormat = 'style-dictionary' | 'flat' | 'json';

/**
 * Serialize an export format to a JSON string (2-space indent, trailing newline).
 * `flat` = the `--fx-*` map; `json` = the resolved-token array; `style-dictionary`
 * = the nested DTCG tree.
 */
export function renderExport(format: ExportFormat): string {
  const data =
    format === 'flat'
      ? toFlatTokens()
      : format === 'json'
        ? resolvedTokens()
        : toStyleDictionary();
  return `${JSON.stringify(data, null, 2)}\n`;
}
