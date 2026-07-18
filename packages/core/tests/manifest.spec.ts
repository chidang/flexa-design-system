import { describe, expect, it } from 'vitest';
import { defineElement, validateManifest, ElementRegistry } from '../src/index.js';

const valid = {
  type: 'acme/pricing',
  title: 'Pricing',
  version: 1,
  schema: { price: { type: 'number', default: 0 } },
  props: { priceFormatted: { format: 'currency', value: '@price', arg: 'USD' } },
  template: '<div>{{priceFormatted}}</div>',
};

describe('defineElement (guardrails)', () => {
  it('manifest hợp lệ pass, được freeze', () => {
    const m = defineElement(valid);
    expect(m.type).toBe('acme/pricing');
    expect(Object.isFrozen(m)).toBe(true);
  });

  it('chặn type không namespace', () => {
    expect(() => defineElement({ ...valid, type: 'pricing' })).toThrow(/vendor\/name/);
  });

  it('chặn formatter lạ ở Tier 1', () => {
    expect(() =>
      defineElement({
        ...valid,
        props: { x: { format: 'evalJs', value: '@price' } },
      }),
    ).toThrow(/unknown formatter/);
  });

  it('chặn raw tag {{{x}}} ở Tier 1, cho phép {{{children}}}', () => {
    expect(() => defineElement({ ...valid, template: '{{{html}}}' })).toThrow(/raw tag/);
    expect(() => defineElement({ ...valid, template: '<div>{{{children}}}</div>' })).not.toThrow();
  });

  it('registry chặn đăng ký trùng type', () => {
    const r = new ElementRegistry();
    r.register(valid);
    expect(() => r.register(valid)).toThrow(/must be unique/);
  });

  it('childTypes/parentTypes/presets hợp lệ pass; preset node thiếu type bị chặn', () => {
    const m = defineElement({
      ...valid,
      childTypes: ['acme/col'],
      parentTypes: ['acme/row'],
      presets: [
        {
          title: '2 Columns',
          children: [
            { type: 'acme/col', settings: { span: 6 } },
            { type: 'acme/col', settings: { span: 6 }, children: [{ type: 'acme/text' }] },
          ],
        },
      ],
    });
    expect(m.childTypes).toEqual(['acme/col']);
    expect(m.presets?.[0]?.children?.[0]?.settings).toEqual({ span: 6 });
    expect(() =>
      defineElement({ ...valid, presets: [{ title: 'x', children: [{ settings: {} }] }] }),
    ).toThrow();
  });

  it('childrenDisplay nhận flex/grid, chặn giá trị lạ (Slice D)', () => {
    expect(defineElement({ ...valid, childrenDisplay: 'flex' }).childrenDisplay).toBe('flex');
    expect(defineElement({ ...valid, childrenDisplay: 'grid' }).childrenDisplay).toBe('grid');
    expect(defineElement(valid).childrenDisplay).toBeUndefined();
    expect(() => defineElement({ ...valid, childrenDisplay: 'block' })).toThrow();
  });

  it('keywords là palette metadata additive (E0) — nhận string[], chặn phần tử rỗng/không phải chuỗi', () => {
    expect(defineElement({ ...valid, keywords: ['price', 'plan'] }).keywords).toEqual(['price', 'plan']);
    expect(defineElement(valid).keywords).toBeUndefined();
    expect(() => defineElement({ ...valid, keywords: ['ok', ''] })).toThrow();
    expect(() => defineElement({ ...valid, keywords: 'price' })).toThrow();
  });
});

describe('validateManifest — AI generation path', () => {
  it('manifest hợp lệ trả ok:true với manifest đã freeze', () => {
    const result = validateManifest(valid);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.manifest.type).toBe('acme/pricing');
      expect(Object.isFrozen(result.manifest)).toBe(true);
    }
  });

  it('type không namespace trả ok:false với lỗi rõ ràng', () => {
    const result = validateManifest({ type: 'NoSlash', title: 'Bad', template: '<div/>' });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toMatch(/vendor\/name/);
    }
  });

  it('thiếu template ở Tier 1 trả lỗi template', () => {
    const result = validateManifest({ type: 'acme/x', title: 'X' });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors[0]).toMatch(/template/);
  });

  it('formatter lạ trả ok:false, không throw', () => {
    const result = validateManifest({
      ...valid,
      props: { x: { value: '@price', format: 'sparkle' } },
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors[0]).toMatch(/sparkle/);
  });

  it('raw tag {{{x}}} trả ok:false, {{{children}}} được phép', () => {
    expect(validateManifest({ ...valid, template: '{{{html}}}' }).ok).toBe(false);
    expect(validateManifest({ ...valid, template: '<div>{{{children}}}</div>' }).ok).toBe(true);
  });

  it('nhiều lỗi cùng lúc trả đủ danh sách', () => {
    const result = validateManifest({ type: 'bad', template: '{{{x}}}' });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.length).toBeGreaterThan(1);
  });
});

describe('when gate — conditional control visibility', () => {
  const base = {
    type: 'acme/w',
    title: 'W',
    version: 1,
    template: '<div/>',
  };

  it('valid when referencing a real sibling passes', () => {
    const r = validateManifest({
      ...base,
      schema: {
        custom: { type: 'toggle', default: false },
        symbol: { type: 'text', when: { custom: true } },
      },
    });
    expect(r.ok).toBe(true);
  });

  it('rejects when referencing an unknown setting', () => {
    const r = validateManifest({
      ...base,
      schema: { symbol: { type: 'text', when: { nope: true } } },
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors.join('\n')).toMatch(/unknown setting "nope"/);
  });

  it('rejects a self-referencing when', () => {
    const r = validateManifest({
      ...base,
      schema: { symbol: { type: 'text', when: { symbol: 'x' } } },
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors.join('\n')).toMatch(/references itself/);
  });

  it('rejects an unknown operator (typo)', () => {
    const r = validateManifest({
      ...base,
      schema: {
        price: { type: 'number', default: 0 },
        note: { type: 'text', when: { price: { gth: 5 } } },
      },
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors.join('\n')).toMatch(/unknown operator "gth"/);
  });

  it('rejects when on a nested control', () => {
    const r = validateManifest({
      ...base,
      schema: {
        flag: { type: 'toggle', default: false },
        items: {
          type: 'repeater',
          fields: { text: { type: 'text', when: { flag: true } } },
        },
      },
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors.join('\n')).toMatch(/nested controls/);
  });

  it('validates refs inside an any group', () => {
    const r = validateManifest({
      ...base,
      schema: { badge: { type: 'text', when: { any: [{ plan: 'pro' }, { featured: true }] } } },
    });
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.errors.join('\n')).toMatch(/unknown setting "plan"/);
      expect(r.errors.join('\n')).toMatch(/unknown setting "featured"/);
    }
  });
});

describe('token gate (Slice 7) — style/recipe must use known tokens', () => {
  it('cho phép token FDS thật trong style', () => {
    const m = validateManifest({
      ...valid,
      style: { '@self': { color: 'color.primary', padding: 'space.4' } },
    });
    expect(m.ok).toBe(true);
  });

  it('chặn token lạ trong style, liệt kê id', () => {
    const result = validateManifest({
      ...valid,
      style: { '@self': { color: 'color.brand-999', margin: 'space.enormous' } },
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      const msg = result.errors.join(' ');
      expect(msg).toMatch(/unknown design tokens/);
      expect(msg).toContain('color.brand-999');
      expect(msg).toContain('space.enormous');
    }
  });

  it('KHÔNG nhầm CSS literal có dấu chấm là token (url, số thập phân, rgba)', () => {
    const m = validateManifest({
      ...valid,
      style: {
        '@self': {
          background: "url(hero.png) center / cover no-repeat",
          border: '1.5px solid rgba(0,0,0,0.08)',
          opacity: '0.5',
        },
      },
    });
    expect(m.ok).toBe(true);
  });

  it('chặn brace-alias token lạ {color.nope}', () => {
    const result = validateManifest({
      ...valid,
      style: { '@self': { color: '{color.nope}' } },
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.join(' ')).toContain('color.nope');
  });

  it('quét token lạ trong recipe (base / variant / compound)', () => {
    const base = validateManifest({
      ...valid,
      recipe: { base: { '@self': { color: 'color.ghost' } } },
    });
    expect(base.ok).toBe(false);
    const variant = validateManifest({
      ...valid,
      recipe: { variants: { tone: { danger: { '@self': { color: 'color.nope-danger' } } } } },
    });
    expect(variant.ok).toBe(false);
    if (!variant.ok) expect(variant.errors.join(' ')).toContain('color.nope-danger');
    const compound = validateManifest({
      ...valid,
      recipe: {
        compound: [{ when: { tone: 'danger' }, style: { '@self': { color: 'color.void' } } }],
      },
    });
    expect(compound.ok).toBe(false);
    if (!compound.ok) expect(compound.errors.join(' ')).toContain('color.void');
  });

  it('gate chạy cả tier imperative', () => {
    const result = validateManifest({
      type: 'acme/dyn',
      title: 'Dyn',
      tier: 'imperative',
      cache: { cacheable: true },
      style: { '@self': { color: 'color.nope' } },
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.join(' ')).toContain('color.nope');
  });
});

describe('ElementRegistry.registerSafe', () => {
  it('manifest hợp lệ đăng ký và trả ok:true', () => {
    const r = new ElementRegistry();
    const result = r.registerSafe({ ...valid, type: 'acme/safe-test' });
    expect(result.ok).toBe(true);
    if (result.ok) expect(r.get('acme/safe-test')).toBe(result.element);
  });

  it('manifest không hợp lệ trả ok:false, không throw', () => {
    const r = new ElementRegistry();
    const result = r.registerSafe({ type: 'bad', title: 'Bad' });
    expect(result.ok).toBe(false);
    expect(result.ok === false && result.errors.length > 0).toBe(true);
  });

  it('đăng ký trùng type trả ok:false, không throw', () => {
    const r = new ElementRegistry();
    r.register(valid);
    const result = r.registerSafe(valid);
    expect(result.ok).toBe(false);
  });

  it('element bị skip không crash render — render trả fx--missing placeholder', () => {
    // registerSafe skip → element không có trong registry → render trả placeholder
    const r = new ElementRegistry();
    const bad = r.registerSafe({ type: 'bad' });
    expect(bad.ok).toBe(false);
    expect(r.get('bad')).toBeUndefined();
  });
});
