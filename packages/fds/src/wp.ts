/**
 * Flexa Design System — WordPress theme.json bridge (Phase 5.5 Slice 4).
 *
 * The ⭐ WordPress integration point (§9). FDS stands ABOVE `theme.json`, not
 * beside it — two artifacts wire the two together:
 *
 *   1. `emitWpTheme(theme)` — the frontend `:root` stylesheet, but every color /
 *      spacing PRIMITIVE (`ref.<hue>.<step>`, `ref.space.<n>`) is emitted as
 *      `var(--wp--preset--…, <literal>)` instead of a bare literal. So the host
 *      theme's palette (which WP exposes as `--wp--preset--*`) drives every FDS
 *      color, while the inlined literal is a fallback for classic themes / tokens
 *      the host hasn't overridden. Semantics keep pointing at `--fx-ref-*`, so they
 *      inherit transitively and elements that reference a primitive directly still
 *      work. This is the ONLY difference from `emitTheme` (Slice 3) — every other
 *      token is byte-identical, so the two stay comparable.
 *
 *   2. `wpThemeJson()` — a `theme.json` settings fragment registering the FDS scales
 *      as WP presets: `ref.*` palette -> `settings.color.palette`, `space.*` ->
 *      `settings.spacing.spacingSizes`, `text.*` -> `settings.typography.fontSizes`,
 *      `size.container.*` -> `settings.layout.contentSize/wideSize`. Injected into WP
 *      so the Site Editor shows the host palette with NO double control, and WP
 *      generates the `--wp--preset--*` vars the stylesheet above references.
 *
 * `emitWpTheme` is parity-locked (mirror `Tokens::emitWpTheme`, fixtures
 * `tokens/wp-theme-*`); `wpThemeJson` is a TS-only build artifact (like the manifest
 * exports) that PHP reads and injects — it configures WP's own preset CSS, not the
 * Flexa render pipeline, so it needs no runtime mirror.
 */

import { FDS_TOKENS, getToken, tokenIdToCssVar, type TokenType, type TokenValue } from './index.js';
import { resolveTokenRefs, AUTO_MEDIA, type EmitToken, type Theme } from './resolve.js';

// ---------------------------------------------------------------------------
// ref.* primitive  ->  WP preset var
// ---------------------------------------------------------------------------

/** Color hue namespaces whose ramps become the WP color palette. */
const COLOR_HUES = 'neutral|brand|success|warning|danger|info';

/** `--fx-ref-<hue>-<step>` -> `--wp--preset--color--<hue>-<step>`. */
const REF_COLOR_RE = new RegExp(`^--fx-ref-(${COLOR_HUES})-([a-z0-9]+)$`);
/** `--fx-ref-space-<n>` -> `--wp--preset--spacing--<n>`. */
const REF_SPACE_RE = /^--fx-ref-space-([a-z0-9]+)$/;

/**
 * Map a primitive's `--fx-ref-*` custom property to the WordPress preset var WP
 * generates from `wpThemeJson()`, or null when the primitive has no WP counterpart
 * (radius, shadow, motion, z, … stay pure FDS). Pure, deterministic. Mirror:
 * Tokens::wpPresetVar.
 */
export function wpPresetVar(cssVar: string): string | null {
  const color = REF_COLOR_RE.exec(cssVar);
  if (color) return `--wp--preset--color--${color[1]}-${color[2]}`;
  const space = REF_SPACE_RE.exec(cssVar);
  if (space) return `--wp--preset--spacing--${space[1]}`;
  return null;
}

// ---------------------------------------------------------------------------
// emitWpTheme — the WP-aliased :root stylesheet
// ---------------------------------------------------------------------------

/** True when a value is ENTIRELY one `{token.id}` reference. Mirror: resolve.ts. */
const ALIAS_RE = /^\{[a-z0-9]+(?:-[a-z0-9]+)*(?:\.[a-z0-9]+(?:-[a-z0-9]+)*)*\}$/;

/**
 * Emit a whole theme as a deterministic stylesheet, WP-flavoured: identical block
 * structure to `emitTheme` (base `:root`/`[data-fx-theme]`, per-mode
 * `[data-fx-scheme]`, `prefers-color-scheme`/`prefers-contrast`,
 * `prefers-reduced-motion`), but each
 * color/spacing primitive literal is wrapped as `var(--wp--preset--…, <literal>)`.
 * Blocks concatenate with no whitespace. Mirror: Tokens::emitWpTheme.
 */
export function emitWpTheme(theme: Theme): string {
  const root = theme.name === '' || theme.name === 'default';
  const baseSel = root ? ':root' : `[data-fx-theme="${theme.name}"]`;
  const modes = theme.modes ?? [];

  let css = `${baseSel}{${emitWpDecls(theme.base)}}`;
  for (const mode of modes) {
    css += `${baseSel}[data-fx-scheme="${mode.scheme}"]{${emitWpDecls(mode.tokens)}}`;
  }
  if (theme.autoScheme) {
    for (const mode of modes) {
      const media = AUTO_MEDIA.get(mode.scheme);
      if (!media) continue;
      css += `@media ${media}{${baseSel}:not([data-fx-scheme]){${emitWpDecls(mode.tokens)}}}`;
    }
  }
  if (theme.reducedMotion && theme.reducedMotion.length > 0) {
    css += `@media (prefers-reduced-motion:reduce){${baseSel}{${emitWpDecls(theme.reducedMotion)}}}`;
  }
  return css;
}

/** Serialize a token set, WP-flavoured (see `emitWpTokenValue`). Mirror: Tokens::emitWpDecls. */
function emitWpDecls(tokens: readonly EmitToken[]): string {
  const decls: string[] = [];
  for (const t of tokens) {
    const value = emitWpTokenValue(t);
    if (value !== null) decls.push(`${t.cssVar}:${value}`);
  }
  return decls.join(';');
}

/**
 * One token's CSS value on WP. An alias resolves exactly as in `emitTheme`
 * (`var(--fx-ref-*)`); a literal that owns a WP preset is wrapped
 * `var(<preset>,<literal>)`; every other literal is unchanged.
 */
function emitWpTokenValue(t: EmitToken): string | null {
  if (typeof t.value === 'string' && ALIAS_RE.test(t.value)) {
    return resolveTokenRefs(t.value) as string;
  }
  const literal = literalOf(t.type, t.value);
  if (literal === null) return null;
  const preset = wpPresetVar(t.cssVar);
  return preset ? `var(${preset},${literal})` : literal;
}

/**
 * Render a NON-alias `$value` as a CSS value, or null to skip (typography). Same
 * rules as resolve.ts `emitTokenValue` for the literal case; duplicated here so the
 * Slice 1/3 pipeline stays untouched. Mirror: the literal branch of Tokens.php.
 */
function literalOf(type: TokenType, value: TokenValue): string | null {
  switch (type) {
    case 'typography':
      return null;
    case 'shadow':
      return isRecord(value) ? shadowToCss(value) : null;
    case 'cubicBezier':
      return Array.isArray(value) ? `cubic-bezier(${value.map(scalarToCss).join(', ')})` : null;
    default:
      return typeof value === 'string' || typeof value === 'number' ? scalarToCss(value) : null;
  }
}

function shadowToCss(s: Record<string, TokenValue>): string {
  return [s['offsetX'], s['offsetY'], s['blur'], s['spread'], s['color']].map(scalarToCss).join(' ');
}

function scalarToCss(v: TokenValue | undefined): string {
  return typeof v === 'number' ? String(v) : String(v ?? '');
}

function isRecord(v: unknown): v is Record<string, TokenValue> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

// ---------------------------------------------------------------------------
// wpThemeJson — the theme.json settings fragment (TS-only build artifact)
// ---------------------------------------------------------------------------

/** A WP `settings.color.palette` / `spacingSizes` / `fontSizes` preset entry. */
export interface WpPreset {
  readonly slug: string;
  readonly name: string;
  readonly color?: string;
  readonly size?: string;
}

/** The generated `theme.json` settings fragment (WP theme.json v2). */
export interface WpThemeJson {
  readonly version: 2;
  readonly settings: {
    readonly color: { readonly palette: readonly WpPreset[] };
    readonly spacing: { readonly spacingSizes: readonly WpPreset[] };
    readonly typography: { readonly fontSizes: readonly WpPreset[] };
    readonly layout: { readonly contentSize: string; readonly wideSize: string };
  };
}

/** Which container tokens back WP's layout sizes. */
const CONTENT_SIZE_TOKEN = 'size.container-lg';
const WIDE_SIZE_TOKEN = 'size.container-xl';

const REF_COLOR_ID_RE = new RegExp(`^ref\\.(${COLOR_HUES})\\.([a-z0-9]+)$`);

/** `brand-600` / `heading-xl` -> `Brand 600` / `Heading Xl`. */
function titleize(slug: string): string {
  return slug
    .split('-')
    .map((w) => (w ? w[0]!.toUpperCase() + w.slice(1) : w))
    .join(' ');
}

/** Follow `{alias}` chains through the registry to the underlying literal string. */
function resolveLiteral(value: TokenValue | undefined): string {
  if (typeof value === 'string') {
    const m = ALIAS_RE.exec(value);
    if (m) return resolveLiteral(getToken(value.slice(1, -1))?.value);
    return value;
  }
  return typeof value === 'number' ? String(value) : '';
}

/**
 * Build the `theme.json` settings fragment from the token registry. Registers the
 * FDS scales as WP presets so the Site Editor picker shows the host palette (no
 * double control) and WP emits the `--wp--preset--*` vars `emitWpTheme` references.
 * TS-only (PHP reads the generated `flexa-wp-settings.json`).
 */
export function wpThemeJson(): WpThemeJson {
  const palette: WpPreset[] = [];
  const spacingSizes: WpPreset[] = [];
  const fontSizes: WpPreset[] = [];

  for (const t of FDS_TOKENS) {
    const color = REF_COLOR_ID_RE.exec(t.id);
    if (color) {
      const slug = `${color[1]}-${color[2]}`;
      palette.push({ slug, name: titleize(slug), color: resolveLiteral(t.value) });
      continue;
    }
    if (t.id.startsWith('space.')) {
      const slug = t.id.slice('space.'.length);
      spacingSizes.push({ slug, name: `Space ${slug}`, size: resolveLiteral(t.value) });
      continue;
    }
    if (t.id.startsWith('text.') && t.type === 'typography' && isRecord(t.value)) {
      const slug = t.id.slice('text.'.length);
      fontSizes.push({ slug, name: titleize(slug), size: resolveLiteral(t.value['fontSize']) });
    }
  }

  return {
    version: 2,
    settings: {
      color: { palette },
      spacing: { spacingSizes },
      typography: { fontSizes },
      layout: {
        contentSize: resolveLiteral(getToken(CONTENT_SIZE_TOKEN)?.value),
        wideSize: resolveLiteral(getToken(WIDE_SIZE_TOKEN)?.value),
      },
    },
  };
}
