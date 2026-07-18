import { describe, expect, it } from 'vitest';
import { ElementRegistry, recipeToSpec, renderDocument } from '../src/index.js';
import type { ElementManifest, FlexaNode, Recipe } from '../src/index.js';

// A small but structurally-real Button recipe: `tone` sets custom properties,
// `variant` consumes them (so tone × variant does NOT explode into N×M options),
// and one compound variant gives outline+danger a bespoke pairing.
const recipe: Recipe = {
  base: { '.btn': { display: 'inline-flex', 'border-radius': 'radius.md', border: '1px solid transparent' } },
  variants: {
    variant: {
      primary: { '.btn': { 'background-color': 'var(--btn-bg)', color: 'var(--btn-fg)', '@hover': { 'background-color': 'var(--btn-bg-hover)' } } },
      outline: { '.btn': { 'background-color': 'transparent', color: 'var(--btn-bg)', 'border-color': 'var(--btn-bg)', '@hover': { 'background-color': 'var(--btn-bg)', color: 'var(--btn-fg)' } } },
    },
    size: {
      sm: { '.btn': { padding: 'space.1 space.3' } },
      md: { '.btn': { padding: 'space.2 space.5' } },
    },
    tone: {
      brand: { '.btn': { '--btn-bg': 'color.primary', '--btn-fg': 'color.on-primary', '--btn-bg-hover': 'color.primary-hover' } },
      danger: { '.btn': { '--btn-bg': 'color.danger', '--btn-fg': 'color.on-danger', '--btn-bg-hover': 'color.danger' } },
    },
  },
  compound: [
    { when: { variant: 'outline', tone: 'danger' }, style: { '.btn': { 'border-width': 2, '@hover': { 'background-color': 'color.danger', color: 'color.on-danger' } } } },
  ],
  default: { variant: 'primary', size: 'md', tone: 'brand' },
};

describe('recipeToSpec — option selection', () => {
  it('falls back to defaults for every unset dimension', () => {
    const spec = recipeToSpec(recipe, {});
    const btn = spec!['.btn']!;
    // default primary → consumes var(--btn-bg); default brand → sets it to color.primary.
    expect(btn['background-color']).toBe('var(--btn-bg)');
    expect(btn['--btn-bg']).toBe('color.primary');
    expect(btn['padding']).toBe('space.2 space.5'); // default size md
  });

  it('applies an explicit option over the default', () => {
    const btn = recipeToSpec(recipe, { variant: 'outline', size: 'sm' })!['.btn']!;
    expect(btn['background-color']).toBe('transparent'); // outline structure
    expect(btn['border-color']).toBe('var(--btn-bg)');
    expect(btn['padding']).toBe('space.1 space.3'); // size sm
    expect(btn['--btn-bg']).toBe('color.primary'); // tone still default brand
  });

  it('falls back to the default when an option value is unknown', () => {
    const btn = recipeToSpec(recipe, { variant: 'bogus' })!['.btn']!;
    // Unknown variant → default primary (fill), not a crash or an empty spec.
    expect(btn['background-color']).toBe('var(--btn-bg)');
  });

  it('coerces a non-string option value before lookup', () => {
    // A numeric setting shouldn't match a string option; it degrades to the default.
    const btn = recipeToSpec(recipe, { variant: 2 })!['.btn']!;
    expect(btn['background-color']).toBe('var(--btn-bg)'); // default primary
  });
});

describe('recipeToSpec — compound variants + merge', () => {
  it('applies the compound fragment only when every `when` prop matches', () => {
    const btn = recipeToSpec(recipe, { variant: 'outline', tone: 'danger' })!['.btn']!;
    expect(btn['border-width']).toBe(2); // compound applied
    expect(btn['--btn-bg']).toBe('color.danger'); // tone danger
    // Deep-merge: outline's @hover overridden by the compound's @hover, in place.
    expect(btn['@hover']).toEqual({ 'background-color': 'color.danger', color: 'color.on-danger' });
  });

  it('does not apply the compound when only one condition matches', () => {
    const btn = recipeToSpec(recipe, { variant: 'primary', tone: 'danger' })!['.btn']!;
    expect(btn['border-width']).toBeUndefined();
    // primary @hover keeps its own value (not the compound's).
    expect(btn['@hover']).toEqual({ 'background-color': 'var(--btn-bg-hover)' });
  });

  it('later fragments win at the declaration level, preserving key order', () => {
    const btn = recipeToSpec(recipe, { variant: 'outline', tone: 'danger' })!['.btn']!;
    const keys = Object.keys(btn);
    // base keys come first; overrides keep their original slot, new keys append.
    expect(keys.slice(0, 3)).toEqual(['display', 'border-radius', 'border']);
    expect(keys[keys.length - 1]).toBe('border-width');
  });

  it('returns null when the recipe contributes nothing', () => {
    expect(recipeToSpec({}, {})).toBeNull();
    expect(recipeToSpec({ variants: { size: { sm: { '.btn': { padding: '1px' } } } } }, {})).toBeNull();
  });

  it('does not mutate the source recipe', () => {
    const snapshot = JSON.stringify(recipe);
    recipeToSpec(recipe, { variant: 'outline', tone: 'danger' });
    expect(JSON.stringify(recipe)).toBe(snapshot);
  });
});

describe('recipe in the render pipeline', () => {
  const manifest: ElementManifest = {
    type: 'demo/btn',
    title: 'Btn',
    tier: 'declarative',
    version: 1,
    schema: {
      variant: { type: 'select', options: ['primary', 'outline'], default: 'primary' },
      tone: { type: 'select', options: ['brand', 'danger'], default: 'brand' },
      size: { type: 'select', options: ['sm', 'md'], default: 'md' },
    },
    template: '<a class="btn">x</a>',
    recipe,
  };

  const node = (id: string, settings: Record<string, string>): FlexaNode => ({
    id,
    type: 'demo/btn',
    settings,
    children: [],
  });

  function css(settings: Record<string, string>): string {
    const registry = new ElementRegistry();
    registry.register(manifest);
    const root: FlexaNode = { id: 'root', type: 'flexa/root', settings: {}, children: [node('b', settings)] };
    return renderDocument(root, registry).css;
  }

  it('compiles the recipe scoped per node with tokens resolved to var(--fx-*)', () => {
    const out = css({ variant: 'outline', tone: 'danger' });
    expect(out).toContain('[data-fx="b"] .btn{');
    expect(out).toContain('border-radius:var(--fx-radius-md)');
    expect(out).toContain('--btn-bg:var(--fx-color-danger)');
    expect(out).toContain('border-width:2px'); // compound
    expect(out).toContain('[data-fx="b"] .btn:hover{background-color:var(--fx-color-danger)');
  });

  it('uses schema defaults when the node omits variant props', () => {
    const out = css({});
    expect(out).toContain('--btn-bg:var(--fx-color-primary)'); // default brand
    expect(out).not.toContain('border-width'); // no compound
  });
});
