/**
 * flexa-fds-figma — export the Flexa Design System registry to Tokens Studio
 * (the "Figma Tokens" / Tokens Studio for Figma plugin) JSON.
 *
 * Designers who want the design system inside Figma import a Tokens Studio JSON
 * set: a nested object of `{ value, type }` leaves, where `type` is one of the
 * plugin's own token-type names (`color`, `spacing`, `borderRadius`,
 * `boxShadow`, `typography`, …). This package produces exactly that shape from
 * the FDS registry, with every `{alias}` already RESOLVED to a concrete literal
 * (via `flexa-fds-export`) so the set imports without depending on the plugin's
 * own reference resolver.
 *
 * Per the FDS distribution rule, tooling lives OUTSIDE the zero-dependency
 * `flexa-design-system` package — this consumes the registry, it never grows it.
 * It touches no frozen engine and mutates nothing; it is a pure transform.
 *
 * v1 emits RESOLVED literals (robust, plugin-resolver-independent). Preserving
 * the FDS alias graph as editable Tokens Studio references (`{ref.brand.600}`)
 * is a deferred enhancement — see README.
 */

import { resolvedTokens, type ResolvedToken } from 'flexa-fds-export';
import { FDS_VERSION, type TokenType } from 'flexa-design-system';

export { FDS_VERSION };
export type { ResolvedToken };

/**
 * A Tokens Studio token-type name. Not every DTCG type has a native Tokens
 * Studio equivalent; unmapped scalars fall back to `other` so the set always
 * imports cleanly (the designer can retype them in-plugin if they wish).
 */
export type TokensStudioType =
  | 'color'
  | 'spacing'
  | 'sizing'
  | 'borderRadius'
  | 'borderWidth'
  | 'fontSizes'
  | 'fontFamilies'
  | 'fontWeights'
  | 'lineHeights'
  | 'opacity'
  | 'boxShadow'
  | 'typography'
  | 'dimension'
  | 'other';

/** A Tokens Studio leaf: a concrete resolved value + the plugin's type name. */
export interface TokensStudioLeaf {
  readonly value: string | Readonly<Record<string, string>>;
  readonly type: TokensStudioType;
}
/** A Tokens Studio group node, nested by dot-path segment. */
export interface TokensStudioGroup {
  readonly [segment: string]: TokensStudioGroup | TokensStudioLeaf;
}

/**
 * Map an FDS token to its Tokens Studio type. DTCG `dimension`/`number` tokens
 * carry no unit-of-meaning, so their Tokens Studio type is inferred from the id
 * group (`space.*` -> spacing, `radius.*` -> borderRadius, …) — the same
 * grouping the CSS layer uses. Exported for testing/inspection.
 */
export function tokensStudioType(id: string, dtcg: TokenType): TokensStudioType {
  switch (dtcg) {
    case 'color':
      return 'color';
    case 'fontFamily':
      return 'fontFamilies';
    case 'fontWeight':
      return 'fontWeights';
    case 'shadow':
      return 'boxShadow';
    case 'typography':
      return 'typography';
    case 'cubicBezier':
    case 'duration':
      // Tokens Studio has no motion primitives — keep them importable as `other`.
      return 'other';
    case 'number':
      return numberType(id);
    case 'dimension':
      return dimensionType(id);
    default:
      return 'other';
  }
}

/** Leading `ref.` is the primitive tier — strip it before reading the group. */
function group(id: string): string {
  const key = id.startsWith('ref.') ? id.slice(4) : id;
  return key.split('.')[0] ?? key;
}

function numberType(id: string): TokensStudioType {
  const g = group(id);
  if (g === 'line-height') return 'lineHeights';
  if (g === 'opacity') return 'opacity';
  // z-index and other bare numbers have no Tokens Studio primitive.
  return 'other';
}

function dimensionType(id: string): TokensStudioType {
  switch (group(id)) {
    case 'space':
      return 'spacing';
    case 'radius':
      return 'borderRadius';
    case 'border':
    case 'border-width':
      return 'borderWidth';
    case 'font-size':
      return 'fontSizes';
    case 'size':
    case 'bp':
    case 'breakpoint':
      return 'sizing';
    default:
      // Component tokens (`c.button.*`) and anything else: a generic dimension.
      return 'dimension';
  }
}

/**
 * The registry as a Tokens Studio single-set object: groups nested by the FDS
 * dot-path (`color.primary`, `space.4`), each leaf `{ value, type }` with the
 * alias chain already resolved. Directly importable via the plugin's "Load from
 * file/JSON". Registry order is preserved for stable, diff-friendly output.
 */
export function toTokensStudio(): TokensStudioGroup {
  const root: Record<string, unknown> = {};
  for (const t of resolvedTokens()) {
    const segs = t.id.split('.');
    let node = root;
    for (let i = 0; i < segs.length - 1; i++) {
      const seg = segs[i]!;
      const child = node[seg];
      if (typeof child !== 'object' || child === null || Array.isArray(child)) {
        node[seg] = {};
      }
      node = node[seg] as Record<string, unknown>;
    }
    node[segs[segs.length - 1]!] = { value: t.value, type: tokensStudioType(t.id, t.type) };
  }
  return root as TokensStudioGroup;
}

/**
 * Serialize the Tokens Studio set to a JSON string (2-space indent, trailing
 * newline) — the file you load into the plugin.
 */
export function renderTokensStudio(): string {
  return `${JSON.stringify(toTokensStudio(), null, 2)}\n`;
}
