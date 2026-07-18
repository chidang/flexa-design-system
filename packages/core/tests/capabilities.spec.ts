import { describe, expect, it } from 'vitest';
import {
  brandSchema,
  capabilities,
  CONTROL_TYPES,
  DESIGN_LIVE_SECTIONS,
  DESIGN_STATE_VERSION,
  DENSITY_BOUNDS,
  FONT_SCALE_BOUNDS,
  RADIUS_PRESET_IDS,
  ElementRegistry,
  FDS_TOKENS,
  FDS_VERSION,
  FORMATTER_NAMES,
} from '../src/index.js';

describe('capabilities() — AI-readiness capability catalog (§1a)', () => {
  it('reports the FDS version, control kinds, formatters, and every token', () => {
    const snap = capabilities(new ElementRegistry());
    expect(snap.fdsVersion).toBe(FDS_VERSION);
    expect(snap.controlTypes).toEqual([...CONTROL_TYPES].sort());
    expect(snap.formatters).toEqual([...FORMATTER_NAMES].sort());
    expect(snap.tokens).toHaveLength(FDS_TOKENS.length);
    // Tokens expose only the resolution-free public facts.
    expect(Object.keys(snap.tokens[0] ?? {}).sort()).toEqual(['cssVar', 'id', 'tier', 'type']);
  });

  it('includes the built-in root / block-ref types and any registered elements', () => {
    const registry = new ElementRegistry();
    registry.register({
      type: 'test/widget',
      title: 'Widget',
      tier: 'declarative',
      version: 1,
      schema: {},
      template: '<div></div>',
    });
    const types = capabilities(registry).elements.map((e) => e.type);
    expect(types).toContain('flexa/root');
    expect(types).toContain('flexa/block-ref');
    expect(types).toContain('test/widget');
  });

  it('is deterministic: elements are sorted by type, stable across calls', () => {
    const build = () => {
      const r = new ElementRegistry();
      r.register({ type: 'z/last', title: 'Z', tier: 'declarative', version: 1, schema: {}, template: '<i></i>' });
      r.register({ type: 'a/first', title: 'A', tier: 'declarative', version: 1, schema: {}, template: '<i></i>' });
      return capabilities(r);
    };
    const a = JSON.stringify(build());
    const b = JSON.stringify(build());
    expect(a).toBe(b);
    const types = JSON.parse(a).elements.map((e: { type: string }) => e.type);
    expect(types).toEqual([...types].sort());
  });
});

describe('capabilities().design — the design-generation surface (doc 13 S6)', () => {
  it('exposes the Brand fields, presets, bounds and the live-section catalog', () => {
    const design = capabilities(new ElementRegistry()).design;
    expect(design).toBeDefined();
    if (!design) return;
    expect(design.designStateVersion).toBe(DESIGN_STATE_VERSION);
    // Derived from the zod schema — a new Brand field appears here automatically.
    expect(design.brandFields).toEqual(
      [
        'primaryColor',
        'secondaryColor',
        'headingFont',
        'bodyFont',
        'radius',
        'containerWidth',
        'fontScale',
        'density',
      ].sort(),
    );
    expect(design.radiusPresets).toEqual([...RADIUS_PRESET_IDS]);
    expect(design.fontScale).toEqual({
      base: [...FONT_SCALE_BOUNDS.base],
      ratio: [...FONT_SCALE_BOUNDS.ratio],
    });
    expect(design.density).toEqual([...DENSITY_BOUNDS]);
    expect(design.liveSections).toBe(DESIGN_LIVE_SECTIONS);
    // JSON-pure and deterministic (the snapshot contract).
    expect(JSON.stringify(design)).toBe(JSON.stringify(capabilities(new ElementRegistry()).design));
  });

  it('the fontScale bounds match what the zod schema actually accepts', () => {
    const [min, max] = FONT_SCALE_BOUNDS.base;
    expect(brandSchema.safeParse({ fontScale: { base: min } }).success).toBe(true);
    expect(brandSchema.safeParse({ fontScale: { base: max } }).success).toBe(true);
    expect(brandSchema.safeParse({ fontScale: { base: min - 0.01 } }).success).toBe(false);
    expect(brandSchema.safeParse({ fontScale: { base: max + 0.01 } }).success).toBe(false);
  });

  it('the density bounds match what the zod schema actually accepts (S9)', () => {
    const [min, max] = DENSITY_BOUNDS;
    expect(brandSchema.safeParse({ density: min }).success).toBe(true);
    expect(brandSchema.safeParse({ density: max }).success).toBe(true);
    expect(brandSchema.safeParse({ density: min - 0.01 }).success).toBe(false);
    expect(brandSchema.safeParse({ density: max + 0.01 }).success).toBe(false);
  });
});
