/**
 * Flexa Design System — token resolution pipeline (Phase 5.5 Slice 1).
 *
 * Two pure, parity-locked functions that realise FDS QĐ-0 ("tokens resolve to
 * `var(--fx-*)`, never to final values"):
 *
 *   - `resolveTokenRefs(value)` — rewrites every `{token.id}` reference in a style
 *     value into a `var(--fx-*)` string. This is what lets the FOUR FROZEN ENGINES
 *     stay untouched: node styles keep only `var()` strings, so the CSS compiler
 *     never sees a token. It is a pure GRAMMAR rewrite — it does NOT check that the
 *     token exists (that gate lives in `flexa validate`, Slice 7).
 *   - `emitThemeRoot(tokens)` — the ONE place literal values appear: the theme
 *     stylesheet. Primitives emit their literal; aliases emit `var()` at their
 *     ref; composites map to a single CSS value where one exists (shadow) or are
 *     skipped where none does (typography — applied as a declaration bundle by the
 *     recipe layer, Slice 2/5).
 *
 * Slice 2 adds the style-pipeline side of QĐ-0:
 *
 *   - `resolveStyleTokens(spec, known)` — rewrites bare token PUBLIC IDS
 *     (`color.primary`, `space.4`) inside a StyleSpec into `var(--fx-*)` BEFORE
 *     the frozen CSS compiler runs. Unlike `resolveTokenRefs` (brace grammar,
 *     used only inside the token source file), style values are authored as bare
 *     dot-paths (§2.4), so this pass is REGISTRY-GATED: a dot-path substring is
 *     rewritten only when `known(id)` is true, leaving CSS literals that merely
 *     look like dot-paths (`rgba(…,0.08)`, `1.5px`, `url(img.png)`) untouched.
 *
 * Mirror: adapters/wordpress/src/Tokens.php — kept char-for-char via
 * tests/parity/fixtures/tokens/. Any divergence fails cross-runtime.spec.ts.
 */

import type { Json, StyleSpec } from './types.js';
import {
  getToken,
  hasToken,
  isTokenNamespace,
  tokenIdToCssVar,
  type TokenType,
  type TokenValue,
} from './index.js';

/**
 * A `{group.name}` token reference embedded anywhere in a value string. Segments
 * follow the token id grammar (lowercase `[a-z0-9]` runs, `-` inside, `.` between).
 * Global so every occurrence in a compound value is rewritten. Mirror: Tokens.php.
 */
const TOKEN_REF_RE = /\{([a-z0-9]+(?:-[a-z0-9]+)*(?:\.[a-z0-9]+(?:-[a-z0-9]+)*)*)\}/g;

/** The same grammar anchored — true when a value is ENTIRELY one token reference. */
const ALIAS_RE = /^\{[a-z0-9]+(?:-[a-z0-9]+)*(?:\.[a-z0-9]+(?:-[a-z0-9]+)*)*\}$/;

/**
 * Rewrite `{token.id}` references in a style value to `var(--fx-token-id)`.
 * Numbers (and any non-string) pass through untouched. Pure and deterministic;
 * unknown-token validation is a separate concern (Slice 7 `flexa validate`).
 */
export function resolveTokenRefs(value: string | number): string | number {
  if (typeof value !== 'string') return value;
  return value.replace(TOKEN_REF_RE, (_m, id: string) => `var(${tokenIdToCssVar(id)})`);
}

/** Minimal shape `emitThemeRoot` needs from a token — `TokenEntry` satisfies it. */
export interface EmitToken {
  readonly cssVar: string;
  readonly type: TokenType;
  readonly value: TokenValue;
}

/**
 * Typography composites have no single CSS value, but each part IS one: emit
 * `--fx-text-<name>-{size,weight,line-height}` per composite (FDS 2.10, ui-kit
 * doc 14 R2) so components can bind type roles per-property. Family is NOT
 * emitted — components bind `--fx-font-family-base/heading` directly. Fixed
 * suffix order; a missing/invalid part is skipped, not emitted empty.
 */
const TYPOGRAPHY_LONGHANDS: readonly (readonly [string, string])[] = [
  ['fontSize', 'size'],
  ['fontWeight', 'weight'],
  ['lineHeight', 'line-height'],
];

/**
 * Serialize a token set to `cssVar:value;…` declarations (no wrapping rule).
 * Declaration order follows the input order (registry order is id-sorted, so the
 * default theme is deterministic). Typography composites expand to per-property
 * declarations (FDS 2.10). Shared by `emitThemeRoot` and `emitTheme`.
 * Mirror: Tokens::emitDecls.
 */
function emitDecls(tokens: readonly EmitToken[]): string {
  const decls: string[] = [];
  for (const t of tokens) {
    if (t.type === 'typography') {
      if (!isRecord(t.value)) continue;
      for (const [prop, suffix] of TYPOGRAPHY_LONGHANDS) {
        const part = t.value[prop];
        if (typeof part === 'string') {
          decls.push(`${t.cssVar}-${suffix}:${resolveTokenRefs(part) as string}`);
        } else if (typeof part === 'number') {
          decls.push(`${t.cssVar}-${suffix}:${scalarToCss(part)}`);
        }
      }
      continue;
    }
    const value = emitTokenValue(t.type, t.value);
    if (value !== null) decls.push(`${t.cssVar}:${value}`);
  }
  return decls.join(';');
}

/**
 * Emit a set of tokens as a single `:root{…}` rule — the theme stylesheet.
 * Mirror: Tokens::emitThemeRoot. (Slice 1 contract; FDS 2.10 adds the
 * typography per-property expansion — additive declarations only.)
 */
export function emitThemeRoot(tokens: readonly EmitToken[]): string {
  return `:root{${emitDecls(tokens)}}`;
}

/** Render one token's `$value` as a CSS custom-property value, or null to skip it. */
function emitTokenValue(type: TokenType, value: TokenValue): string | null {
  // An alias (any type) becomes a `var()` at its referenced token — QĐ-0.
  if (typeof value === 'string' && ALIAS_RE.test(value)) {
    return resolveTokenRefs(value) as string;
  }
  switch (type) {
    // Multi-property bundle — no single custom-property value; the recipe layer
    // expands it into declarations (Slice 2/5). Not emitted into :root.
    case 'typography':
      return null;
    // DTCG shadow -> CSS box-shadow value: offsetX offsetY blur spread color.
    case 'shadow':
      return isRecord(value) ? shadowToCss(value) : null;
    // DTCG cubicBezier [x1,y1,x2,y2] -> cubic-bezier(x1, y1, x2, y2).
    case 'cubicBezier':
      return Array.isArray(value) ? `cubic-bezier(${value.map(scalarToCss).join(', ')})` : null;
    default:
      // color / dimension / duration / fontFamily / fontWeight / number.
      return typeof value === 'string' || typeof value === 'number' ? scalarToCss(value) : null;
  }
}

function shadowToCss(s: Record<string, TokenValue>): string {
  return [s['offsetX'], s['offsetY'], s['blur'], s['spread'], s['color']].map(scalarToCss).join(' ');
}

/** JS `String()` for scalars — mirrors the frozen CSS engine's number formatting. */
function scalarToCss(v: TokenValue | undefined): string {
  return typeof v === 'number' ? String(v) : String(v ?? '');
}

function isRecord(v: unknown): v is Record<string, TokenValue> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

// ---------------------------------------------------------------------------
// Slice 2 — bare-public-id resolution over a StyleSpec (registry-gated).
// ---------------------------------------------------------------------------

/**
 * A bare token public id embedded in a style value: a dot-path with AT LEAST one
 * dot (`color.primary`, `space.4`, `ref.brand.600`, `c.button.radius`). The
 * mandatory dot is what excludes bare CSS keywords (`solid`, `auto`) and lengths
 * (`1px`); values that still match the shape but are not tokens (`0.08`, `1.5px`,
 * `img.png`) are filtered by the `known` gate below. Global — every occurrence in
 * a compound value (`1px solid color.border`) is considered. Mirror: Tokens.php.
 */
const STYLE_TOKEN_RE = /[a-z0-9]+(?:-[a-z0-9]+)*(?:\.[a-z0-9]+(?:-[a-z0-9]+)*)+/g;

/**
 * Rewrite bare token public ids in a single style value to `var(--fx-*)`, gated
 * by `known` (the ambient registry in the pipeline; an explicit set in parity
 * fixtures). Non-strings pass through; dot-path substrings that are not known
 * tokens are left exactly as written — this gate is why real CSS is never
 * corrupted. Pure and deterministic.
 */
export function resolveStyleTokenValue(
  value: Json,
  known: (id: string) => boolean = hasToken,
): Json {
  if (typeof value !== 'string') return value;
  return value.replace(STYLE_TOKEN_RE, (id) => (known(id) ? `var(${tokenIdToCssVar(id)})` : id));
}

/**
 * Resolve every bare token public id inside a StyleSpec, returning a new spec
 * with `var(--fx-*)` in place of known tokens. Runs in the render pipeline BEFORE
 * `compileCss`, so the frozen CSS engine only ever sees `var()` strings (QĐ-0).
 * Keys and structure are preserved; only string leaves are rewritten. Mirror:
 * Tokens::resolveStyleTokens.
 */
export function resolveStyleTokens(
  spec: StyleSpec,
  known: (id: string) => boolean = hasToken,
): StyleSpec {
  return walkStyle(spec, known) as StyleSpec;
}

function walkStyle(node: Json, known: (id: string) => boolean): Json {
  if (typeof node === 'string') return resolveStyleTokenValue(node, known);
  if (Array.isArray(node)) return node.map((n) => walkStyle(n, known));
  if (typeof node === 'object' && node !== null) {
    const out: Record<string, Json> = {};
    for (const [key, val] of Object.entries(node)) out[key] = walkStyle(val, known);
    return out;
  }
  return node;
}

/**
 * Collect every OFF-SYSTEM token reference in a StyleSpec — a dot-path whose
 * namespace is reserved for tokens (`isNamespace(first)`) but which is not a
 * known token (`!known(id)`). This is the Slice 7 gate: `flexa validate` and the
 * host's manifest loader reject style/recipe that reference tokens outside the
 * standard set, so AI output is on-system by construction. Real CSS literals
 * (`1.5px`, `url(a.png)`, `rgba(…,0.08)`) live in non-token namespaces and are
 * ignored, so the gate never flags valid CSS. Brace aliases (`{color.nope}`) are
 * caught too, since the inner dot-path still matches. `known`/`isNamespace`
 * default to the ambient FDS registry; parity/tests pass explicit sets. Returns
 * each offending id once, sorted. Mirror: Tokens::findUnknownStyleTokens.
 */
export function findUnknownStyleTokens(
  spec: StyleSpec,
  known: (id: string) => boolean = hasToken,
  isNamespace: (segment: string) => boolean = isTokenNamespace,
): string[] {
  const bad = new Set<string>();
  const scan = (node: Json): void => {
    if (typeof node === 'string') {
      for (const m of node.matchAll(STYLE_TOKEN_RE)) {
        const id = m[0];
        const at = m.index ?? 0;
        // Skip `@`-prefixed setting bindings (`@font.family`) — those are resolved
        // by the frozen resolver engine, not the token pipeline, and their paths
        // may legitimately collide with a reserved namespace.
        if (at > 0 && node[at - 1] === '@') continue;
        const first = id.split('.')[0] as string;
        if (isNamespace(first) && !known(id)) bad.add(id);
      }
    } else if (Array.isArray(node)) {
      for (const n of node) scan(n);
    } else if (typeof node === 'object' && node !== null) {
      for (const v of Object.values(node)) scan(v);
    }
  };
  scan(spec);
  return [...bad].sort();
}

// ---------------------------------------------------------------------------
// Slice 3 — theme model + multi-mode emission.
// ---------------------------------------------------------------------------

/**
 * One alternate color-scheme within a theme (`dark`, `hc`). Its tokens OVERRIDE a
 * subset of the base set by `cssVar` — the same names, re-pointed (§3.3), so
 * elements never learn which scheme is active.
 */
export interface ThemeMode {
  /** Scheme id — the `data-fx-scheme` value and, for `light`/`dark`, the media query. */
  readonly scheme: string;
  /** Tokens whose values change in this scheme (a subset of `base`, matched by cssVar). */
  readonly tokens: readonly EmitToken[];
}

/**
 * A theme = a default (no-scheme) token set + optional alternate schemes, plus an
 * optional reduced-motion override. The default theme (name `''`/`default`) emits
 * at `:root`; any other name emits scoped to `[data-fx-theme="name"]`, so themes
 * NEST — a subtree carrying that attribute re-declares the vars for its branch
 * (§5, Carbon `Layer`/Radix `<Theme>`). Still QĐ-0: only `var()`/literals appear.
 */
export interface Theme {
  readonly name: string;
  readonly base: readonly EmitToken[];
  readonly modes?: readonly ThemeMode[];
  /** When true, each `light`/`dark` mode is ALSO applied via `prefers-color-scheme`. */
  readonly autoScheme?: boolean;
  /** Custom properties forced to a reduced value under `prefers-reduced-motion` (§4). */
  readonly reducedMotion?: readonly EmitToken[];
}

/**
 * Media query each auto-applied scheme fires under. `light`/`dark` follow the user's
 * `prefers-color-scheme`; `hc` follows `prefers-contrast: more` AND `prefers-color-scheme:
 * light` — the high-contrast overrides re-point over the LIGHT base, so scoping the
 * auto rule to light keeps a dark-scheme viewer on their (already high-contrast) dark
 * mode instead of layering light values onto a dark background. A scheme absent from
 * this map (a bespoke `[data-fx-scheme="x"]`) only ever applies on explicit opt-in.
 */
export const AUTO_MEDIA: ReadonlyMap<string, string> = new Map([
  ['light', '(prefers-color-scheme:light)'],
  ['dark', '(prefers-color-scheme:dark)'],
  ['hc', '(prefers-contrast:more) and (prefers-color-scheme:light)'],
]);

/**
 * Emit a whole theme as a deterministic stylesheet (the ONE place literals live):
 *   1. base block at `:root` (or `[data-fx-theme="name"]`),
 *   2. one `…[data-fx-scheme="scheme"]{…}` block per mode (explicit opt-in),
 *   3. when `autoScheme`, an `@media` block per auto-applied mode (light/dark via
 *      `prefers-color-scheme`, `hc` via `prefers-contrast`) that applies unless an
 *      explicit `data-fx-scheme` is set,
 *   4. when `reducedMotion`, a `@media (prefers-reduced-motion:reduce)` block.
 * Blocks are concatenated with no whitespace — char-identical across runtimes.
 * Mirror: Tokens::emitTheme, locked by tests/parity/fixtures/tokens/theme-*.
 */
export function emitTheme(theme: Theme): string {
  const root = theme.name === '' || theme.name === 'default';
  const baseSel = root ? ':root' : `[data-fx-theme="${theme.name}"]`;
  const modes = theme.modes ?? [];

  let css = `${baseSel}{${emitDecls(theme.base)}}`;
  for (const mode of modes) {
    css += `${baseSel}[data-fx-scheme="${mode.scheme}"]{${emitDecls(mode.tokens)}}`;
  }
  if (theme.autoScheme) {
    for (const mode of modes) {
      const media = AUTO_MEDIA.get(mode.scheme);
      if (!media) continue;
      css += `@media ${media}{${baseSel}:not([data-fx-scheme]){${emitDecls(mode.tokens)}}}`;
    }
  }
  if (theme.reducedMotion && theme.reducedMotion.length > 0) {
    css += `@media (prefers-reduced-motion:reduce){${baseSel}{${emitDecls(theme.reducedMotion)}}}`;
  }
  return css;
}

/** Scope of the base-typography rules — the wrapper `renderDocument` emits for the root node. */
const BASE_TYPOGRAPHY_SCOPE = '[data-fx-type="flexa/root"]';

/** One typography bundle as declarations, fixed property order, values as `var()` refs. */
function typographyDecls(family: string, size: string, weight: string, lineHeight: string): string {
  return `font-family:${family};font-size:${size};font-weight:${weight};line-height:${lineHeight}`;
}

/** A `text.*` composite's `$value` refs → `var(--fx-*)` declarations. */
function compositeDecls(id: string): string {
  const value = getToken(id)?.value as Record<string, string> | undefined;
  if (!value) return '';
  return typographyDecls(
    resolveTokenRefs(value['fontFamily'] ?? '') as string,
    resolveTokenRefs(value['fontSize'] ?? '') as string,
    resolveTokenRefs(value['fontWeight'] ?? '') as string,
    resolveTokenRefs(value['lineHeight'] ?? '') as string,
  );
}

/**
 * Base typography for Flexa content (13-design-studio-strategy.md §3-S1):
 * element rules driven entirely by theme custom properties, so ANY theme/brand
 * (fontScale included) flows through without re-emitting this block — the output
 * is a CONSTANT string of `var(--fx-*)` references.
 *
 * Scoped under the root wrapper so it styles Flexa documents only, never the
 * host page around them. Element CSS (class selectors, one attribute deeper)
 * still beats these bare-tag rules — element self-styling wins by design.
 *
 * h1–h3/root/small carry the `text.*` composites verbatim; h4–h6 have no
 * composite in FDS 2.1, so their mapping (heading family + `xl/lg/base` +
 * semibold + tight) is part of THIS contract. NOT a frozen engine; NOT part of
 * `emitTheme` (existing theme output is byte-identical without this block).
 * Mirror: Tokens::emitBaseTypography — char-identical, gated by
 * tests/base-typography.spec.ts (WP) against this function's output.
 */
export function emitBaseTypography(): string {
  const derivedHeading = (size: string): string =>
    typographyDecls(
      `var(${tokenIdToCssVar('font.family-heading')})`,
      `var(${tokenIdToCssVar(`ref.font-size.${size}`)})`,
      `var(${tokenIdToCssVar('ref.font-weight.semibold')})`,
      `var(${tokenIdToCssVar('ref.line-height.tight')})`,
    );
  const s = BASE_TYPOGRAPHY_SCOPE;
  return (
    `${s}{${compositeDecls('text.body')}}` +
    `${s} h1{${compositeDecls('text.heading-xl')}}` +
    `${s} h2{${compositeDecls('text.heading-lg')}}` +
    `${s} h3{${compositeDecls('text.heading-md')}}` +
    `${s} h4{${derivedHeading('xl')}}` +
    `${s} h5{${derivedHeading('lg')}}` +
    `${s} h6{${derivedHeading('base')}}` +
    `${s} small{${compositeDecls('text.body-sm')}}`
  );
}
