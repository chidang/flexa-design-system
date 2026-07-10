import { describe, it, expect } from 'vitest';
import { resolvedTokens } from 'flexa-fds-export';
import {
  renderTokensStudio,
  toTokensStudio,
  tokensStudioType,
  type TokensStudioGroup,
  type TokensStudioLeaf,
} from '../src/index.js';

function isLeaf(n: TokensStudioGroup | TokensStudioLeaf): n is TokensStudioLeaf {
  return 'value' in n && 'type' in n;
}

/** Walk the nested set and collect every leaf keyed by its dot-path id. */
function leaves(set: TokensStudioGroup): Map<string, TokensStudioLeaf> {
  const out = new Map<string, TokensStudioLeaf>();
  const visit = (node: TokensStudioGroup, path: string[]): void => {
    for (const [seg, child] of Object.entries(node)) {
      const next = [...path, seg];
      if (isLeaf(child)) out.set(next.join('.'), child);
      else visit(child, next);
    }
  };
  visit(set, []);
  return out;
}

describe('tokensStudioType — DTCG type -> Tokens Studio type', () => {
  it('maps direct DTCG types', () => {
    expect(tokensStudioType('color.primary', 'color')).toBe('color');
    expect(tokensStudioType('font.family-base', 'fontFamily')).toBe('fontFamilies');
    expect(tokensStudioType('ref.font-weight.bold', 'fontWeight')).toBe('fontWeights');
    expect(tokensStudioType('shadow.md', 'shadow')).toBe('boxShadow');
    expect(tokensStudioType('text.body', 'typography')).toBe('typography');
  });

  it('keeps motion primitives importable as `other`', () => {
    expect(tokensStudioType('motion.easing-in', 'cubicBezier')).toBe('other');
    expect(tokensStudioType('motion.duration-fast', 'duration')).toBe('other');
  });

  it('infers a dimension token type from its id group (incl. ref. tier)', () => {
    expect(tokensStudioType('space.4', 'dimension')).toBe('spacing');
    expect(tokensStudioType('ref.space.4', 'dimension')).toBe('spacing');
    expect(tokensStudioType('radius.md', 'dimension')).toBe('borderRadius');
    expect(tokensStudioType('border.1', 'dimension')).toBe('borderWidth');
    expect(tokensStudioType('ref.border-width', 'dimension')).toBe('borderWidth');
    expect(tokensStudioType('ref.font-size.2xl', 'dimension')).toBe('fontSizes');
    expect(tokensStudioType('size.container-lg', 'dimension')).toBe('sizing');
    expect(tokensStudioType('bp.tablet', 'dimension')).toBe('sizing');
    expect(tokensStudioType('c.button.padding-x', 'dimension')).toBe('dimension');
  });

  it('infers a number token type from its id group', () => {
    expect(tokensStudioType('ref.line-height.normal', 'number')).toBe('lineHeights');
    expect(tokensStudioType('opacity.disabled', 'number')).toBe('opacity');
    expect(tokensStudioType('z.modal', 'number')).toBe('other');
  });
});

describe('toTokensStudio', () => {
  const set = toTokensStudio();
  const leafMap = leaves(set);

  it('emits one leaf per registry token, keyed by its dot-path id', () => {
    expect(leafMap.size).toBe(resolvedTokens().length);
    for (const t of resolvedTokens()) {
      expect(leafMap.has(t.id)).toBe(true);
    }
  });

  it('carries the resolved literal as `value` and the mapped `type`', () => {
    for (const t of resolvedTokens()) {
      const leaf = leafMap.get(t.id)!;
      expect(leaf.value).toEqual(t.value);
      expect(leaf.type).toBe(tokensStudioType(t.id, t.type));
    }
  });

  it('leaves no unresolved aliases or CSS var() in string values', () => {
    for (const leaf of leafMap.values()) {
      if (typeof leaf.value === 'string') {
        expect(leaf.value).not.toContain('{');
        expect(leaf.value).not.toContain('var(');
      }
    }
  });

  it('nests semantic and primitive tiers by dot-path', () => {
    const color = set['color'] as TokensStudioGroup;
    const primary = color['primary'] as TokensStudioLeaf;
    expect(isLeaf(primary)).toBe(true);
    expect(primary.type).toBe('color');
    expect(primary.value).toMatch(/^#[0-9a-fA-F]{3,8}$/);

    const brand = (set['ref'] as TokensStudioGroup)['brand'] as TokensStudioGroup;
    const six = brand['600'] as TokensStudioLeaf;
    expect(isLeaf(six)).toBe(true);
  });

  it('keeps typography composites as an object value with plugin field keys', () => {
    const body = ((set['text'] as TokensStudioGroup)['body']) as TokensStudioLeaf;
    expect(body.type).toBe('typography');
    expect(typeof body.value).toBe('object');
    const v = body.value as Record<string, string>;
    // Tokens Studio typography keys — present ones come straight from DTCG.
    expect(v.fontFamily).toBeDefined();
    expect(v.fontSize).toBeDefined();
    for (const sub of Object.values(v)) expect(sub).not.toContain('{');
  });
});

describe('renderTokensStudio', () => {
  it('emits valid JSON with a trailing newline', () => {
    const text = renderTokensStudio();
    expect(text.endsWith('\n')).toBe(true);
    expect(() => JSON.parse(text)).not.toThrow();
    const parsed = JSON.parse(text);
    expect(parsed.color.primary.type).toBe('color');
  });
});
