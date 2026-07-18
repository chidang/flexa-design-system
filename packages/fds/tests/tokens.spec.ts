import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  FDS_TOKENS,
  TOKEN_IDS,
  TOKEN_NAMESPACES,
  emitThemeRoot,
  findUnknownStyleTokens,
  getToken,
  hasToken,
  isTokenNamespace,
  resolveStyleTokenValue,
  resolveStyleTokens,
  resolveTokenRefs,
  tokenIdToCssVar,
  tokenType,
} from '../src/index.js';

describe('token contract — source loads & validates (Slice 0)', () => {
  it('flattens into a non-empty, id-sorted registry', () => {
    expect(FDS_TOKENS.length).toBeGreaterThan(0);
    const ids = FDS_TOKENS.map((e) => e.id);
    expect(ids).toEqual([...ids].sort());
    expect(TOKEN_IDS).toEqual(ids);
  });

  it('every token id + cssVar is unique (injective grammar)', () => {
    expect(new Set(TOKEN_IDS).size).toBe(TOKEN_IDS.length);
    const vars = FDS_TOKENS.map((e) => e.cssVar);
    expect(new Set(vars).size).toBe(vars.length);
  });

  it('classifies tiers from the first segment', () => {
    expect(getToken('ref.brand.600')!.tier).toBe('primitive');
    expect(getToken('color.primary')!.tier).toBe('semantic');
    expect(getToken('c.button.radius')!.tier).toBe('component');
  });
});

describe('token grammar — dot-path <-> --fx-*', () => {
  it('maps dot ids to prefixed kebab CSS vars', () => {
    expect(tokenIdToCssVar('color.on-primary')).toBe('--fx-color-on-primary');
    expect(tokenIdToCssVar('space.4')).toBe('--fx-space-4');
    expect(tokenIdToCssVar('ref.font-size.2xl')).toBe('--fx-ref-font-size-2xl');
    expect(tokenIdToCssVar('c.button.radius')).toBe('--fx-c-button-radius');
  });

  it('registry cssVar matches the grammar', () => {
    for (const e of FDS_TOKENS) expect(e.cssVar).toBe(tokenIdToCssVar(e.id));
  });
});

describe('token lookup + $type (drives picker + validate gate)', () => {
  it('hasToken only for known ids', () => {
    expect(hasToken('color.primary')).toBe(true);
    expect(hasToken('color.on-primary')).toBe(true);
    expect(hasToken('color.nope')).toBe(false);
    expect(hasToken('#2563eb')).toBe(false);
  });

  it('reports DTCG $type, inherited from the group', () => {
    expect(tokenType('color.primary')).toBe('color'); // inherited from `color` group
    expect(tokenType('space.4')).toBe('dimension');
    expect(tokenType('ref.font-weight.bold')).toBe('fontWeight');
    expect(tokenType('shadow.md')).toBe('shadow');
    expect(tokenType('text.body')).toBe('typography');
    expect(tokenType('ref.easing.standard')).toBe('cubicBezier');
  });

  it('semantic fg/bg pairs both exist (a11y pairing invariant)', () => {
    for (const base of ['primary', 'secondary', 'success', 'warning', 'danger', 'info']) {
      expect(hasToken(`color.${base}`)).toBe(true);
      expect(hasToken(`color.on-${base}`)).toBe(true);
    }
  });
});

describe('token aliasing — refs resolved, no dangling / cycles', () => {
  it('semantic color aliases a primitive (recorded ref)', () => {
    const primary = getToken('color.primary')!;
    expect(primary.refs).toContain('ref.brand.600');
  });

  it('every recorded ref points at a real token', () => {
    for (const e of FDS_TOKENS) {
      for (const ref of e.refs) expect(hasToken(ref)).toBe(true);
    }
  });

  it('composite typography records its field aliases', () => {
    const body = getToken('text.body')!;
    expect(body.type).toBe('typography');
    expect(body.refs).toContain('ref.font-size.base');
    expect(body.refs).toContain('font.family-base');
  });
});

describe('resolveTokenRefs — refs become var(--fx-*) (Slice 1, QĐ-0)', () => {
  it('rewrites a whole-value alias', () => {
    expect(resolveTokenRefs('{ref.brand.600}')).toBe('var(--fx-ref-brand-600)');
  });

  it('rewrites refs embedded in a compound value', () => {
    expect(resolveTokenRefs('1px solid {color.border}')).toBe('1px solid var(--fx-color-border)');
    expect(resolveTokenRefs('{space.2} {space.4}')).toBe(
      'var(--fx-space-2) var(--fx-space-4)',
    );
  });

  it('leaves non-refs (and non-matching braces) untouched', () => {
    expect(resolveTokenRefs('#ffffff')).toBe('#ffffff');
    expect(resolveTokenRefs('{NotAToken}')).toBe('{NotAToken}');
  });

  it('passes numbers through unchanged', () => {
    expect(resolveTokenRefs(0)).toBe(0);
    expect(resolveTokenRefs(1.5)).toBe(1.5);
  });

  it('rewrite is purely syntactic — no existence check (validate is Slice 7)', () => {
    expect(hasToken('color.ghost')).toBe(false);
    expect(resolveTokenRefs('{color.ghost}')).toBe('var(--fx-color-ghost)');
  });
});

describe('emitThemeRoot — token set -> :root{} (Slice 1)', () => {
  it('emits primitive literals and aliases, keeping input order', () => {
    const css = emitThemeRoot([
      { cssVar: '--fx-ref-brand-600', type: 'color', value: '#2563eb' },
      { cssVar: '--fx-color-primary', type: 'color', value: '{ref.brand.600}' },
      { cssVar: '--fx-ref-font-weight-bold', type: 'fontWeight', value: 700 },
    ]);
    expect(css).toBe(
      ':root{--fx-ref-brand-600:#2563eb;--fx-color-primary:var(--fx-ref-brand-600);--fx-ref-font-weight-bold:700}',
    );
  });

  it('maps shadow objects and cubic-bezier arrays to single CSS values', () => {
    expect(
      emitThemeRoot([
        {
          cssVar: '--fx-ref-shadow-sm',
          type: 'shadow',
          value: { color: 'rgba(15,23,42,0.08)', offsetX: '0', offsetY: '1px', blur: '2px', spread: '0' },
        },
      ]),
    ).toBe(':root{--fx-ref-shadow-sm:0 1px 2px 0 rgba(15,23,42,0.08)}');
    expect(
      emitThemeRoot([{ cssVar: '--fx-ref-easing-standard', type: 'cubicBezier', value: [0.2, 0, 0, 1] }]),
    ).toBe(':root{--fx-ref-easing-standard:cubic-bezier(0.2, 0, 0, 1)}');
  });

  it('expands typography per-property — size/weight/line-height, family omitted (FDS 2.10)', () => {
    const css = emitThemeRoot([
      {
        cssVar: '--fx-text-body',
        type: 'typography',
        value: {
          fontFamily: '{font.family-base}',
          fontSize: '{ref.font-size.base}',
          fontWeight: '{ref.font-weight.regular}',
          lineHeight: '{ref.line-height.normal}',
        },
      },
      { cssVar: '--fx-color-text', type: 'color', value: '{ref.neutral.900}' },
    ]);
    expect(css).toBe(
      ':root{--fx-text-body-size:var(--fx-ref-font-size-base);' +
        '--fx-text-body-weight:var(--fx-ref-font-weight-regular);' +
        '--fx-text-body-line-height:var(--fx-ref-line-height-normal);' +
        '--fx-color-text:var(--fx-ref-neutral-900)}',
    );
  });

  it('typography: literal parts pass through, missing parts are skipped (FDS 2.10)', () => {
    const css = emitThemeRoot([
      { cssVar: '--fx-text-custom', type: 'typography', value: { fontSize: '1.25rem', lineHeight: 1.2 } },
    ]);
    expect(css).toBe(':root{--fx-text-custom-size:1.25rem;--fx-text-custom-line-height:1.2}');
  });

  it('emits the full default theme deterministically', () => {
    const css = emitThemeRoot(FDS_TOKENS);
    expect(css.startsWith(':root{')).toBe(true);
    expect(css.endsWith('}')).toBe(true);
    // Every primitive color literal + every semantic alias is present; typography
    // composites appear as per-property vars only (FDS 2.10) — never bare.
    expect(css).toContain('--fx-ref-brand-600:#2563eb');
    expect(css).toContain('--fx-color-primary:var(--fx-ref-brand-600)');
    expect(css).toContain('--fx-text-body-size:var(--fx-ref-font-size-base)');
    expect(css).not.toContain('--fx-text-body:');
  });
});

describe('resolveStyleTokenValue — bare public ids -> var(--fx-*), registry-gated (Slice 2)', () => {
  it('rewrites a known bare token id (ambient registry)', () => {
    expect(resolveStyleTokenValue('color.primary')).toBe('var(--fx-color-primary)');
    expect(resolveStyleTokenValue('space.4')).toBe('var(--fx-space-4)');
  });

  it('rewrites known tokens embedded in a compound value', () => {
    expect(resolveStyleTokenValue('1px solid color.border')).toBe('1px solid var(--fx-color-border)');
    expect(resolveStyleTokenValue('space.4 space.2')).toBe('var(--fx-space-4) var(--fx-space-2)');
  });

  it('leaves an unknown dot-path untouched — this is the registry gate', () => {
    expect(hasToken('color.ghost')).toBe(false);
    expect(resolveStyleTokenValue('color.ghost')).toBe('color.ghost');
  });

  it('never corrupts CSS literals that merely look like dot-paths', () => {
    expect(resolveStyleTokenValue('rgba(15,23,42,0.08)')).toBe('rgba(15,23,42,0.08)');
    expect(resolveStyleTokenValue('1.5px')).toBe('1.5px');
    expect(resolveStyleTokenValue('url(img.png)')).toBe('url(img.png)');
    expect(resolveStyleTokenValue('16/9')).toBe('16/9');
  });

  it('passes numbers (and non-strings) through unchanged', () => {
    expect(resolveStyleTokenValue(0.9)).toBe(0.9);
    expect(resolveStyleTokenValue(600)).toBe(600);
  });

  it('honours an explicit known-set instead of the ambient registry', () => {
    const known = (id: string): boolean => id === 'brand.custom';
    expect(resolveStyleTokenValue('brand.custom', known)).toBe('var(--fx-brand-custom)');
    // color.primary is a real token but not in this explicit set -> left as-is.
    expect(resolveStyleTokenValue('color.primary', known)).toBe('color.primary');
  });
});

describe('resolveStyleTokens — deep walk over a StyleSpec (Slice 2)', () => {
  it('resolves string leaves at every depth, preserving structure + numbers', () => {
    const spec = {
      '&': {
        color: 'color.primary',
        opacity: 0.9,
        '@hover': { color: 'color.border' },
        '@responsive': { tablet: { padding: 'space.2' } },
      },
    };
    expect(resolveStyleTokens(spec)).toEqual({
      '&': {
        color: 'var(--fx-color-primary)',
        opacity: 0.9,
        '@hover': { color: 'var(--fx-color-border)' },
        '@responsive': { tablet: { padding: 'var(--fx-space-2)' } },
      },
    });
  });

  it('does not mutate the input spec', () => {
    const spec = { '&': { color: 'color.primary' } };
    resolveStyleTokens(spec);
    expect(spec).toEqual({ '&': { color: 'color.primary' } });
  });

  it('reaches inside a @container block — generic walk covers container query', () => {
    const spec = {
      '.title': { '@container': { md: { color: 'color.primary', padding: 'space.2' } } },
    };
    expect(resolveStyleTokens(spec)).toEqual({
      '.title': {
        '@container': { md: { color: 'var(--fx-color-primary)', padding: 'var(--fx-space-2)' } },
      },
    });
  });
});

describe('token namespaces + off-system gate (Slice 7)', () => {
  it('TOKEN_NAMESPACES = first segment of every id; isTokenNamespace agrees', () => {
    expect(TOKEN_NAMESPACES.has('color')).toBe(true);
    expect(TOKEN_NAMESPACES.has('space')).toBe(true);
    expect(TOKEN_NAMESPACES.has('ref')).toBe(true);
    expect(isTokenNamespace('color')).toBe(true);
    // Namespaces that CSS literals live in must NOT be reserved.
    expect(isTokenNamespace('img')).toBe(false);
    expect(isTokenNamespace('url')).toBe(false);
    expect(isTokenNamespace('0')).toBe(false);
    for (const id of TOKEN_IDS) expect(TOKEN_NAMESPACES.has(id.split('.')[0]!)).toBe(true);
  });

  it('flags a dot-path in a reserved namespace that is not a real token', () => {
    expect(findUnknownStyleTokens({ '&': { color: 'color.nope' } })).toEqual(['color.nope']);
    expect(findUnknownStyleTokens({ '&': { color: 'color.primary' } })).toEqual([]);
  });

  it('ignores CSS literals whose namespace is not a token namespace', () => {
    const spec = {
      '&': {
        background: 'url(hero.png)',
        border: '1.5px solid rgba(0,0,0,0.08)',
        opacity: '0.5',
      },
    };
    expect(findUnknownStyleTokens(spec)).toEqual([]);
  });

  it('ignores @-prefixed setting bindings even when the path is a reserved namespace', () => {
    // `@font.family` is a resolver setting ref, not a token — must not be flagged.
    const spec = {
      '&': {
        'font-family': '@font.family',
        'font-size': '@font.size',
        color: '@color.custom',
      },
    };
    expect(findUnknownStyleTokens(spec)).toEqual([]);
  });

  it('scans compound values and de-dups, sorted', () => {
    const spec = {
      '&': { border: '1px solid color.zzz', outline: '2px solid color.aaa' },
      '&:hover': { color: 'color.zzz' },
    };
    expect(findUnknownStyleTokens(spec)).toEqual(['color.aaa', 'color.zzz']);
  });

  it('flags an off-system token inside a @container block (gate covers container query)', () => {
    const spec = {
      '.title': { '@container': { md: { color: 'color.nope', padding: 'space.2' } } },
    };
    expect(findUnknownStyleTokens(spec)).toEqual(['color.nope']);
  });
});

describe('flexa-token-ids.json asset stays in sync with the registry (Slice 2)', () => {
  // The canonical id list is generated PHP-side in the WordPress adapter — a
  // sibling that is absent when `fds` is checked out standalone (the public
  // design-system repo). Enforce the TS≡PHP drift-lock when the adapter is
  // present; skip when it isn't, so the package stays self-testable in isolation.
  const assetPath = join(
    dirname(fileURLToPath(import.meta.url)),
    '../../../adapters/wordpress/assets/flexa-token-ids.json',
  );
  it.skipIf(!existsSync(assetPath))('the PHP-side token id list equals the canonical TOKEN_IDS', () => {
    const ids = JSON.parse(readFileSync(assetPath, 'utf8')) as string[];
    expect(ids).toEqual([...TOKEN_IDS]);
  });
});
