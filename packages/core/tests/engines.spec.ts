import { afterEach, describe, expect, it } from 'vitest';
import {
  FORMATTERS,
  clearCustomFormatters,
  getFormatter,
  hasFormatter,
  listFormatters,
  registerFormatter,
} from '../src/engines/formatters.js';
import { resolveProps, resolveRef } from '../src/engines/resolver.js';
import { compileCss } from '../src/engines/css.js';
import { renderTemplate } from '../src/engines/template.js';
import { validateManifest } from '../src/manifest.js';

describe('formatters (frozen)', () => {
  const f = FORMATTERS;

  it('currency USD âm có ngăn nghìn', () => {
    expect(f['currency']!(-1234.5, 'USD')).toBe('-$1,234.50');
  });
  it('currency VND không thập phân, symbol sau', () => {
    expect(f['currency']!(1234567, 'VND')).toBe('1.234.567 ₫');
  });
  it('currency 0', () => {
    expect(f['currency']!(0, 'USD')).toBe('$0.00');
  });
  it('number precision half-up', () => {
    expect(f['number']!(2.345, 2)).toBe('2.35');
    expect(f['number']!(-2.345, 2)).toBe('-2.35');
  });
  it('date ISO → UTC tokens', () => {
    expect(f['date']!('2026-07-02T09:30:00Z', 'DD/MM/YYYY HH:mm')).toBe('02/07/2026 09:30');
  });
  it('truncate char + word + đa byte', () => {
    expect(f['truncate']!('hello world', 5)).toBe('hello…');
    expect(f['truncate']!('hello world', { length: 8, mode: 'word' })).toBe('hello…');
    expect(f['truncate']!('ngắn', 100)).toBe('ngắn');
  });
});

describe('custom formatters (gated extension point)', () => {
  afterEach(() => clearCustomFormatters());

  it('register + get/has; unknown chưa đăng ký thì không có', () => {
    expect(hasFormatter('shout')).toBe(false);
    registerFormatter('shout', (v) => `${String(v)}!`);
    expect(hasFormatter('shout')).toBe(true);
    expect(getFormatter('shout')!('hi')).toBe('hi!');
    expect(listFormatters()).toContain('shout');
  });

  it('không cho ghi đè built-in (frozen set bất khả xâm phạm)', () => {
    expect(() => registerFormatter('currency', (v) => String(v))).toThrow(/built-in/);
    // built-in vẫn nguyên hành vi
    expect(getFormatter('currency')).toBe(FORMATTERS['currency']);
  });

  it('không cho đăng ký trùng tên', () => {
    registerFormatter('twice', (v) => String(v));
    expect(() => registerFormatter('twice', (v) => String(v))).toThrow(/already registered/);
  });

  it('chặn tên không hợp lệ', () => {
    expect(() => registerFormatter('has-dash', (v) => String(v))).toThrow(/Invalid formatter name/);
    expect(() => registerFormatter('9lead', (v) => String(v))).toThrow(/Invalid formatter name/);
  });

  it('resolveProps áp custom formatter đã đăng ký', () => {
    registerFormatter('initials', (v) =>
      String(v ?? '')
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .map((w) => w[0] ?? '')
        .join('')
        .toUpperCase(),
    );
    const props = resolveProps({ ini: { format: 'initials', value: '@name' } }, { name: 'jane doe' });
    expect(props['ini']).toBe('JD');
  });

  it('validateManifest chấp nhận custom formatter khi đã đăng ký, chặn khi chưa', () => {
    const withCustom = {
      type: 'acme/badge',
      title: 'Badge',
      props: { ini: { format: 'initials', value: '@name' } },
      template: '<span>{{ini}}</span>',
    };
    // Chưa đăng ký → CLI/AI path chỉ thấy frozen set → chặn.
    const before = validateManifest(withCustom);
    expect(before.ok).toBe(false);
    if (!before.ok) expect(before.errors[0]).toMatch(/initials/);

    registerFormatter('initials', (v) => String(v ?? '').toUpperCase());
    expect(validateManifest(withCustom).ok).toBe(true);
  });
});

describe('prop resolver (frozen)', () => {
  it('resolve @ref và dotted ref; ref thiếu → null', () => {
    expect(resolveRef('@price', { price: 19 })).toBe(19);
    expect(resolveRef('@a.b', { a: { b: 'x' } })).toBe('x');
    expect(resolveRef('@missing.deep', {})).toBe(null);
    expect(resolveRef('literal', {})).toBe('literal');
  });

  it('format + classIf', () => {
    const props = resolveProps(
      {
        priceFormatted: { format: 'currency', value: '@price', arg: '@currency' },
        cardClass: { classIf: { '@featured': 'is-featured', '@missing': 'never' } },
      },
      { price: 19, currency: 'USD', featured: true },
    );
    expect(props).toEqual({ priceFormatted: '$19.00', cardClass: 'is-featured' });
  });

  it('classIf falsy: 0/""/false/[] không thêm class', () => {
    const props = resolveProps(
      { c: { classIf: { '@a': 'x', '@b': 'y', '@c': 'z', '@d': 'w' } } },
      { a: 0, b: '', c: false, d: [] },
    );
    expect(props['c']).toBe('');
  });
});

describe('css compiler (frozen)', () => {
  it('scope + @ref + số trần thành px + unitless giữ nguyên', () => {
    const css = compileCss(
      { '.card': { padding: '@pad', opacity: '@op', color: 'red' } },
      { pad: 12, op: 0.5 },
      { scope: '[data-fx="n_1"]' },
    );
    expect(css).toBe('[data-fx="n_1"] .card{padding:12px;opacity:0.5;color:red}');
  });

  it('& = wrapper, @hover, @responsive theo thứ tự desktop→tablet→mobile', () => {
    const css = compileCss(
      {
        '&': {
          padding: 20,
          '@hover': { transform: 'translateY(-4px)' },
          '@responsive': { mobile: { padding: 8 }, tablet: { padding: 12 } },
        },
      },
      {},
      { scope: '[data-fx="n_2"]' },
    );
    expect(css).toBe(
      '[data-fx="n_2"]{padding:20px}\n' +
        '[data-fx="n_2"]:hover{transform:translateY(-4px)}\n' +
        '@media (max-width:1024px){[data-fx="n_2"]{padding:12px}}\n' +
        '@media (max-width:767px){[data-fx="n_2"]{padding:8px}}',
    );
  });

  it('laptop breakpoint (07 §2 amendment 2026-07-10) emit ≤1440 giữa base và tablet', () => {
    const css = compileCss(
      {
        '&': {
          padding: 20,
          '@responsive': { mobile: { padding: 8 }, laptop: { padding: 16 }, tablet: { padding: 12 } },
        },
      },
      {},
      { scope: '[data-fx="n_l"]' },
    );
    expect(css).toBe(
      '[data-fx="n_l"]{padding:20px}\n' +
        '@media (max-width:1440px){[data-fx="n_l"]{padding:16px}}\n' +
        '@media (max-width:1024px){[data-fx="n_l"]{padding:12px}}\n' +
        '@media (max-width:767px){[data-fx="n_l"]{padding:8px}}',
    );
  });

  it('giá trị rỗng/null bị bỏ, không emit rule rỗng', () => {
    expect(compileCss({ '.a': { color: '@none' } }, {}, {})).toBe('');
  });

  it('custom property (--*) nhận số thô, không gắn px', () => {
    const css = compileCss(
      { '&': { '--fx-span': '@span', 'grid-column': 'span var(--fx-span)' } },
      { span: 6 },
      { scope: '[data-fx="n_3"]' },
    );
    expect(css).toBe('[data-fx="n_3"]{--fx-span:6;grid-column:span var(--fx-span)}');
  });

  it('@container → @container (min-width), min-width tăng dần, sau @media', () => {
    const css = compileCss(
      {
        '&': {
          gap: 8,
          '@responsive': { mobile: { gap: 4 } },
          '@container': { lg: { gap: 24 }, sm: { gap: 12 }, md: { gap: 16 } },
        },
      },
      {},
      { scope: '[data-fx="n_c"]' },
    );
    expect(css).toBe(
      '[data-fx="n_c"]{gap:8px}\n' +
        '@media (max-width:767px){[data-fx="n_c"]{gap:4px}}\n' +
        '@container (min-width:640px){[data-fx="n_c"]{gap:12px}}\n' +
        '@container (min-width:768px){[data-fx="n_c"]{gap:16px}}\n' +
        '@container (min-width:1024px){[data-fx="n_c"]{gap:24px}}',
    );
  });

  it('@container: size-key lạ bị skip, block rỗng không emit', () => {
    expect(
      compileCss(
        { '&': { '@container': { xxl: { gap: 4 }, md: {} } } },
        {},
        { scope: '[data-fx="n_c"]' },
      ),
    ).toBe('');
  });

  it('@container: opts.container override ngưỡng min-width', () => {
    const css = compileCss(
      { '&': { '@container': { wide: { display: 'grid' }, narrow: { display: 'block' } } } },
      {},
      { scope: '[data-fx="n_c"]', container: { narrow: 400, wide: 900 } },
    );
    expect(css).toBe(
      '@container (min-width:400px){[data-fx="n_c"]{display:block}}\n' +
        '@container (min-width:900px){[data-fx="n_c"]{display:grid}}',
    );
  });
});

describe('template interpreter (frozen)', () => {
  it('interpolate + escape mặc định', () => {
    expect(renderTemplate('<h3>{{t}}</h3>', { t: 'A & B' })).toBe('<h3>A &amp; B</h3>');
  });
  it('section lặp {{#items}}', () => {
    expect(
      renderTemplate('<ul>{{#items}}<li>{{name}}</li>{{/items}}</ul>', {
        items: [{ name: 'a' }, { name: 'b' }],
      }),
    ).toBe('<ul><li>a</li><li>b</li></ul>');
  });
});
