import { describe, it, expect } from 'vitest';
import { emitThemeRoot, FDS_TOKENS } from 'flexa-design-system';
import {
  renderExport,
  resolvedTokens,
  toFlatTokens,
  toStyleDictionary,
  type SdGroup,
  type SdLeaf,
} from '../src/index.js';

function isLeaf(n: SdGroup | SdLeaf): n is SdLeaf {
  return '$value' in n && '$type' in n;
}

describe('resolvedTokens', () => {
  it('resolves every registry token (no danglers/cycles)', () => {
    expect(resolvedTokens().length).toBe(FDS_TOKENS.length);
  });

  it('follows the alias chain to a concrete literal', () => {
    const primary = resolvedTokens().find((t) => t.id === 'color.primary');
    const brand600 = resolvedTokens().find((t) => t.id === 'ref.brand.600');
    // color.primary -> {ref.brand.600} -> a hex; both must land on the same literal.
    expect(primary?.value).toBe(brand600?.value);
    expect(primary?.value).toMatch(/^#[0-9a-fA-F]{3,8}$/);
  });

  it('keeps typography composites as a resolved field map, not a single string', () => {
    const typo = resolvedTokens().find((t) => t.type === 'typography');
    expect(typo).toBeDefined();
    expect(typeof typo!.value).toBe('object');
    // Every sub-value is a resolved literal, no braces left.
    for (const v of Object.values(typo!.value as Record<string, string>)) {
      expect(v).not.toContain('{');
    }
  });
});

describe('toFlatTokens', () => {
  const flat = toFlatTokens();

  it('maps --fx-* to concrete literals only (no aliases, no var())', () => {
    const keys = Object.keys(flat);
    expect(keys.length).toBeGreaterThan(0);
    for (const [k, v] of Object.entries(flat)) {
      expect(k.startsWith('--fx-')).toBe(true);
      expect(v).not.toContain('{');
      expect(v).not.toContain('var(');
    }
  });

  it('typography composites appear as per-property longhands only (FDS 2.10)', () => {
    const typo = FDS_TOKENS.find((t) => t.type === 'typography')!;
    expect(flat[typo.cssVar]).toBeUndefined();
    expect(flat[`${typo.cssVar}-size`]).toBeTruthy();
    expect(flat[`${typo.cssVar}-weight`]).toBeTruthy();
    expect(flat[`${typo.cssVar}-line-height`]).toBeTruthy();
  });
});

// Dogfood: the resolver must agree with the FROZEN emitter. `emitThemeRoot`
// emits each token as either a literal or `var(--fx-other)` (aliases keep their
// indirection). Follow that var-chain to a literal and it must equal our flat
// value for every token — so this exporter can never silently drift from the CSS.
describe('dogfood — flat values match emitThemeRoot(FDS_TOKENS)', () => {
  const flat = toFlatTokens();

  // Parse `:root{--a:x;--b:var(--a);…}` into a cssVar -> raw-value map.
  const body = emitThemeRoot(FDS_TOKENS).replace(/^:root\{/, '').replace(/\}$/, '');
  const raw = new Map<string, string>();
  for (const decl of body.split(';')) {
    if (!decl) continue;
    const i = decl.indexOf(':');
    raw.set(decl.slice(0, i), decl.slice(i + 1));
  }

  const VAR_RE = /^var\((--fx-[a-z0-9-]+)\)$/;
  function follow(cssVar: string): string | undefined {
    let v = raw.get(cssVar);
    const seen = new Set<string>();
    while (v !== undefined) {
      const m = VAR_RE.exec(v);
      if (!m) return v;
      if (seen.has(m[1]!)) return undefined;
      seen.add(m[1]!);
      v = raw.get(m[1]!);
    }
    return undefined;
  }

  it('every emitted scalar token resolves to the same literal as toFlatTokens', () => {
    let checked = 0;
    for (const cssVar of raw.keys()) {
      const literal = follow(cssVar);
      // cubicBezier/shadow are single-value in emit but their raw form has commas;
      // they are still literals here. Compare directly against the flat map.
      expect(flat[cssVar]).toBe(literal);
      checked++;
    }
    expect(checked).toBeGreaterThan(0);
  });
});

describe('toStyleDictionary', () => {
  const sd = toStyleDictionary();
  const flat = toFlatTokens();

  it('nests by dot-path with { $value, $type } leaves carrying resolved values', () => {
    const color = sd['color'] as SdGroup;
    const primary = color['primary'] as SdLeaf;
    expect(isLeaf(primary)).toBe(true);
    expect(primary.$type).toBe('color');
    expect(primary.$value).toBe(flat['--fx-color-primary']);
  });

  it('nests primitives too (ref.brand.600)', () => {
    const brand = (sd['ref'] as SdGroup)['brand'] as SdGroup;
    const six = brand['600'] as SdLeaf;
    expect(isLeaf(six)).toBe(true);
    expect(six.$value).toBe(flat['--fx-ref-brand-600']);
  });
});

describe('renderExport', () => {
  it('emits valid JSON with a trailing newline for each format', () => {
    for (const fmt of ['style-dictionary', 'flat', 'json'] as const) {
      const text = renderExport(fmt);
      expect(text.endsWith('\n')).toBe(true);
      expect(() => JSON.parse(text)).not.toThrow();
    }
  });
});
