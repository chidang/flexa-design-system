/**
 * Flexa Design System — token contract (Phase 5.5 Slice 0).
 *
 * Loads the canonical DTCG source (`fds.tokens.json`), validates it, and flattens
 * it into a registry that is the single source of truth for:
 *   - the list of valid token ids (for the builder picker + `flexa validate` gate),
 *   - each token's DTCG `$type` (drives which control renders / where it may be used),
 *   - the deterministic dot-path -> CSS `--fx-*` grammar.
 *
 * This module is DATA + PURE GRAMMAR only. It does NOT touch the four frozen
 * engines and does NOT resolve tokens into final values — per FDS QĐ-0, token
 * references become `var(--fx-*)` strings via a separate parity-locked pipeline
 * (Slice 1), and `:root` emission happens there too. Keeping resolution out of
 * this file is what lets the engines stay frozen.
 */

import rawTokens from './fds.tokens.json';

/** DTCG `$type` values used by FDS. Composite types carry an object `$value`. */
export type TokenType =
  | 'color'
  | 'dimension'
  | 'fontFamily'
  | 'fontWeight'
  | 'number'
  | 'duration'
  | 'cubicBezier'
  | 'shadow'
  | 'typography';

const KNOWN_TYPES: ReadonlySet<string> = new Set<TokenType>([
  'color',
  'dimension',
  'fontFamily',
  'fontWeight',
  'number',
  'duration',
  'cubicBezier',
  'shadow',
  'typography',
]);

const COMPOSITE_TYPES: ReadonlySet<string> = new Set<TokenType>(['shadow', 'typography']);

/** One resolved entry in the flattened token registry. */
export interface TokenEntry {
  /** Public dot-path id, e.g. `color.on-primary`, `space.4`, `ref.brand.600`. */
  readonly id: string;
  /** Tier derived from the first segment: `ref` = primitive, `c` = component, else semantic. */
  readonly tier: 'primitive' | 'semantic' | 'component';
  /** DTCG type (inherited from the nearest ancestor group when omitted on the token). */
  readonly type: TokenType;
  /** CSS custom property this token owns, e.g. `--fx-color-on-primary`. */
  readonly cssVar: string;
  /** Raw `$value` (literal, `{alias}` string, or composite object) — NOT resolved. */
  readonly value: TokenValue;
  /** Token ids this token references (top-level alias and/or composite field aliases). */
  readonly refs: readonly string[];
  readonly description?: string;
}

export type TokenValue = string | number | readonly number[] | { readonly [k: string]: TokenValue };

/** Thrown when the token source is malformed — a build-time invariant. */
export class TokenError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TokenError';
  }
}

const SEGMENT_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const ALIAS_RE = /^\{([a-z0-9-]+(?:\.[a-z0-9-]+)*)\}$/;

/** `color.on-primary` -> `--fx-color-on-primary`. Pure, deterministic. */
export function tokenIdToCssVar(id: string): string {
  return `--fx-${id.split('.').join('-')}`;
}

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

/** Extract every `{token.id}` alias appearing as a full string value, recursively. */
function collectRefs(value: unknown, out: Set<string>): void {
  if (typeof value === 'string') {
    const m = ALIAS_RE.exec(value);
    if (m && m[1]) out.add(m[1]);
  } else if (Array.isArray(value)) {
    for (const item of value) collectRefs(item, out);
  } else if (isPlainObject(value)) {
    for (const item of Object.values(value)) collectRefs(item, out);
  }
}

/** Recursively walk the DTCG tree, inheriting `$type`, emitting one entry per token. */
function walk(node: unknown, path: string[], inheritedType: string | undefined, entries: TokenEntry[]): void {
  if (!isPlainObject(node)) {
    throw new TokenError(`Token node at "${path.join('.')}" must be an object`);
  }
  const ownType = node['$type'];
  if (ownType !== undefined && !KNOWN_TYPES.has(ownType as string)) {
    throw new TokenError(`Unknown $type "${String(ownType)}" at "${path.join('.')}"`);
  }
  const type = (ownType as string | undefined) ?? inheritedType;

  if ('$value' in node) {
    // This is a token (leaf).
    const id = path.join('.');
    if (!id) throw new TokenError('A token cannot live at the document root');
    for (const seg of path) {
      if (!SEGMENT_RE.test(seg)) {
        throw new TokenError(`Invalid segment "${seg}" in token id "${id}" — must match ${SEGMENT_RE.source}`);
      }
    }
    if (type === undefined) throw new TokenError(`Token "${id}" has no $type (and none inherited)`);
    const rawValue = node['$value'];
    const isAlias = typeof rawValue === 'string' && ALIAS_RE.test(rawValue);
    // A composite token holds an object $value, UNLESS it merely aliases another
    // composite token (an alias string is always allowed).
    if (COMPOSITE_TYPES.has(type) && !isAlias && !isPlainObject(rawValue)) {
      throw new TokenError(`Composite token "${id}" ($type ${type}) must have an object or alias $value`);
    }
    const refs = new Set<string>();
    collectRefs(node['$value'], refs);
    const first = path[0] as string;
    entries.push({
      id,
      tier: first === 'ref' ? 'primitive' : first === 'c' ? 'component' : 'semantic',
      type: type as TokenType,
      cssVar: tokenIdToCssVar(id),
      value: node['$value'] as TokenValue,
      refs: [...refs],
      description: typeof node['$description'] === 'string' ? node['$description'] : undefined,
    });
    return;
  }

  // Group: recurse into non-`$` children.
  for (const [key, child] of Object.entries(node)) {
    if (key.startsWith('$')) continue;
    if (!SEGMENT_RE.test(key)) {
      throw new TokenError(`Invalid group segment "${key}" under "${path.join('.') || '(root)'}"`);
    }
    walk(child, [...path, key], type, entries);
  }
}

function build(): {
  entries: readonly TokenEntry[];
  byId: ReadonlyMap<string, TokenEntry>;
  byCssVar: ReadonlyMap<string, TokenEntry>;
} {
  const entries: TokenEntry[] = [];
  walk(rawTokens, [], undefined, entries);
  entries.sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));

  const byId = new Map<string, TokenEntry>();
  const byCssVar = new Map<string, TokenEntry>();
  for (const e of entries) {
    if (byId.has(e.id)) throw new TokenError(`Duplicate token id "${e.id}"`);
    if (byCssVar.has(e.cssVar)) {
      throw new TokenError(`CSS var collision "${e.cssVar}" (ids map non-injectively)`);
    }
    byId.set(e.id, e);
    byCssVar.set(e.cssVar, e);
  }

  // Every alias must resolve to a real token; detect reference cycles.
  for (const e of entries) {
    for (const ref of e.refs) {
      if (!byId.has(ref)) {
        throw new TokenError(`Token "${e.id}" references unknown token "${ref}"`);
      }
    }
  }
  detectCycles(byId);

  return { entries, byId, byCssVar };
}

function detectCycles(byId: ReadonlyMap<string, TokenEntry>): void {
  const state = new Map<string, 0 | 1 | 2>(); // 0 visiting, 2 done
  const stack: string[] = [];
  const visit = (id: string): void => {
    const s = state.get(id);
    if (s === 2) return;
    if (s === 0) {
      const from = stack.indexOf(id);
      throw new TokenError(`Reference cycle: ${[...stack.slice(from), id].join(' -> ')}`);
    }
    state.set(id, 0);
    stack.push(id);
    for (const ref of byId.get(id)?.refs ?? []) visit(ref);
    stack.pop();
    state.set(id, 2);
  };
  for (const id of byId.keys()) visit(id);
}

const REGISTRY = build();

/** All token entries, sorted by id. */
export const FDS_TOKENS: readonly TokenEntry[] = REGISTRY.entries;

/** Sorted list of every valid public token id — the vocabulary for pickers + `flexa validate`. */
export const TOKEN_IDS: readonly string[] = REGISTRY.entries.map((e) => e.id);

/**
 * The semver of the design-system contract this build speaks (Slice 8). A
 * distribution pack (`fdsVersion`) is compatible when it shares this major and
 * is no newer in minor/patch. Bump rules (§15): adding a token = minor, renaming
 * or removing a semantic token = major.
 *
 * 2.1.0 — added the `color.secondary` family (secondary / on-secondary /
 * secondary-hover / secondary-active) for Design Packs' second brand accent. A
 * minor bump: purely additive, so every 2.0 pack still loads on this host.
 *
 * 2.2.0 — added the `opacity` group: the `ref.opacity` ramp plus semantic
 * `opacity.disabled` / `opacity.muted` for interaction & emphasis states.
 * Purely additive, so every 2.0/2.1 pack still loads on this host.
 *
 * 2.3.0 — added the semantic `color.scrim`: the translucent backdrop behind
 * modals / drawers / offcanvas (replaces the element packs' `rgba(0,0,0,0.4)`
 * literal). Purely additive, so every 2.0/2.1/2.2 pack still loads on this host.
 *
 * 2.4.0 — added the APCA (WCAG 3 candidate) contrast API alongside WCAG 2
 * (`apcaContrast` / `checkThemeContrastApca`). A backward-compatible feature
 * addition — NO token changed, so the token contract is unaffected and every
 * 2.x pack still loads; the bump signals the new public API surface.
 *
 * 2.5.0 — added a colour-vision-deficiency axis (`simulateCvd` / `deltaE` /
 * `checkBrandColorblind`): a third a11y standard beside the two contrast gates
 * that flags when the brand primary/secondary collapse for a dichromat. Again
 * additive, NO token changed — the bump signals the new public API surface.
 *
 * 2.6.0 — added the accessibility diagnostics layer (`diagnoseTheme` +
 * `explainContrast` / `explainApca` / `explainCvd`): normalises the three gates'
 * raw failure records into one actionable `Diagnostic` (summary + remedy). Again
 * additive, NO token changed — the bump signals the new public API surface.
 *
 * 2.7.0 — added the WCAG 2 §1.4.11 non-text contrast gate (`checkThemeNonText` +
 * `explainNonText`): the focus ring and every solid semantic fill must clear 3:1
 * against the page, a target the 4.5:1 text gate never inspects. Again additive,
 * NO token changed — the bump signals the new public API surface.
 *
 * 2.8.0 — added a high-contrast theme mode (`HC_MODE_OVERRIDES` + the `hc` mode on
 * `defaultTheme`): `emitTheme` now auto-applies an `hc` scheme under
 * `@media (prefers-contrast: more) and (prefers-color-scheme: light)`, re-pointing
 * neutrals/brand to WCAG-AAA (7:1). Additive behaviour + one new export, NO token
 * id changed — every 2.x pack still loads.
 */
export const FDS_VERSION = '2.8.0';

/** True when `id` is a known token. Basis of the AI/CLI gate (Slice 7). */
export function hasToken(id: string): boolean {
  return REGISTRY.byId.has(id);
}

/**
 * Every token id's first segment — the namespaces the design system reserves
 * (`color`, `space`, `radius`, `ref`, `c`, …). Derived from the registry so it
 * always tracks the token source.
 */
export const TOKEN_NAMESPACES: ReadonlySet<string> = new Set(
  REGISTRY.entries.map((e) => e.id.split('.')[0] as string),
);

/**
 * True when `segment` is a reserved token namespace. This is the discriminator
 * behind the Slice 7 validate gate: a dot-path in a reserved namespace that is
 * NOT a known token is an off-system token (a typo, or a custom id the host
 * would have to register) — whereas a dot-path in any other namespace
 * (`img.png`, `1.5px`) is an ordinary CSS literal and must be left alone.
 */
export function isTokenNamespace(segment: string): boolean {
  return TOKEN_NAMESPACES.has(segment);
}

/** DTCG `$type` of a token, or undefined if unknown. */
export function tokenType(id: string): TokenType | undefined {
  return REGISTRY.byId.get(id)?.type;
}

/** Full entry for a token, or undefined if unknown. */
export function getToken(id: string): TokenEntry | undefined {
  return REGISTRY.byId.get(id);
}

// Slice 1 — the parity-locked resolution pipeline (refs -> var(), token set -> :root).
export { resolveTokenRefs, emitThemeRoot, type EmitToken } from './resolve.js';
// Slice 2 — bare-public-id resolution over a StyleSpec (registry-gated), run
// before the frozen CSS compiler.
export { resolveStyleTokens, resolveStyleTokenValue } from './resolve.js';
// Slice 7 — off-system token gate for `flexa validate` + host manifest loader.
export { findUnknownStyleTokens } from './resolve.js';
// Slice 3 — theme model: multi-mode emission + the default theme + contrast gate.
export { emitTheme, type Theme, type ThemeMode } from './resolve.js';
// Design Studio S1 (doc 13 §3) — constant var()-driven element rules for Flexa content.
export { emitBaseTypography } from './resolve.js';
export { defaultTheme, DARK_MODE_OVERRIDES, HC_MODE_OVERRIDES } from './themes.js';
export {
  contrastRatio,
  relativeLuminance,
  checkThemeContrast,
  checkThemeNonText,
  checkThemeContrastApca,
  checkBrandColorblind,
  CONTRAST_PAIRS,
  NON_TEXT_PAIRS,
  AA_NORMAL,
  AA_NON_TEXT,
  type ContrastFailure,
  type ContrastPair,
  type NonTextFailure,
  type NonTextPair,
  type ApcaFailure,
  type CvdFailure,
} from './contrast.js';
// Track D (doc 20) — APCA (WCAG 3 candidate) alongside the WCAG 2 ratio, never
// replacing it: perceptual lightness contrast Lc for a second a11y standard.
export { apcaContrast, apcaLuminance, APCA_BODY_MIN, APCA_UI_MIN } from './apca.js';
// Track D (doc 20) — colour-vision-deficiency simulation + perceptual distance:
// the axis contrast ratios cannot see (hue collapse for dichromats).
export {
  simulateCvd,
  deltaE,
  distinguishable,
  CVD_DISTINCT_MIN,
  CVD_TYPES,
  type CvdType,
} from './cvd.js';
// Track D (doc 20) — the "why did this fail" layer: normalise all three gates'
// failure records into one actionable Diagnostic (summary + remedy).
export {
  diagnoseTheme,
  explainContrast,
  explainNonText,
  explainApca,
  explainCvd,
  type Diagnostic,
  type ContrastStandard,
} from './diagnostics.js';
// Slice 4 — WordPress theme.json bridge: WP-aliased emit + settings fragment.
export {
  wpPresetVar,
  emitWpTheme,
  wpThemeJson,
  type WpPreset,
  type WpThemeJson,
} from './wp.js';
// FDS standalone (doc 19) — the value shapes the pipeline operates on. Defined
// here so the package is dependency-free; `@flexa/core` re-exports them.
export type { Json, StyleDecls, StyleSpec } from './types.js';
