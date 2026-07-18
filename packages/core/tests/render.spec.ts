import { describe, expect, it } from 'vitest';
import { ElementRegistry, renderDocument, type FlexaNode } from '../src/index.js';

function makeRegistry(): ElementRegistry {
  const r = new ElementRegistry();
  r.register({
    type: 'flexa/section',
    title: 'Section',
    version: 1,
    schema: { bg: { type: 'color', default: '' } },
    template: '<section class="s">{{{children}}}</section>',
    style: { '&': { 'background-color': '@bg' } },
  });
  r.register({
    type: 'flexa/hello',
    title: 'Hello',
    version: 1,
    schema: {
      name: { type: 'text', default: 'world' },
      pad: { type: 'number', default: 10 },
    },
    props: { shout: { format: 'uppercase', value: '@name' } },
    template: '<p class="hello">Hello {{shout}}!</p>',
    style: { '.hello': { padding: '@pad' } },
    init: 'flexa/hello',
    assets: { js: ['hello.js'] },
  });
  return r;
}

const tree: FlexaNode = {
  id: 'n_root',
  type: 'flexa/section',
  settings: { bg: '#fff' },
  children: [{ id: 'n_hello', type: 'flexa/hello', settings: { name: 'Chi' }, children: [] }],
};

describe('renderDocument (Phase 0 exit: hello element)', () => {
  it('render đúng HTML + CSS scoped + defaults + assets + init', () => {
    const { html, css, assets } = renderDocument(tree, makeRegistry());
    expect(html).toBe(
      '<div class="fx" data-fx="n_root" data-fx-type="flexa/section">' +
        '<section class="s">' +
        '<div class="fx" data-fx="n_hello" data-fx-type="flexa/hello" data-fx-init="flexa/hello">' +
        '<p class="hello">Hello CHI!</p>' +
        '</div>' +
        '</section>' +
        '</div>',
    );
    expect(css).toContain('[data-fx="n_root"]{background-color:#fff}');
    expect(css).toContain('[data-fx="n_hello"] .hello{padding:10px}'); // default áp dụng
    expect(assets.js).toEqual(['hello.js']);
    expect(assets.init).toEqual([{ nodeId: 'n_hello', init: 'flexa/hello' }]);
  });

  it('element chưa đăng ký → placeholder, không vỡ trang', () => {
    const { html } = renderDocument(
      { id: 'n_x', type: 'ghost/unknown', settings: {}, children: [] },
      makeRegistry(),
    );
    expect(html).toBe('<div class="fx fx--missing" data-fx="n_x" data-fx-missing="ghost/unknown"></div>');
  });

  it('dynamic data từ provider ghi đè props tĩnh', () => {
    const { html } = renderDocument(tree, makeRegistry(), {
      data: { n_hello: { shout: 'DYNAMIC' } },
    });
    expect(html).toContain('Hello DYNAMIC!');
  });

  it('render là hàm thuần: cùng input → cùng output', () => {
    const r = makeRegistry();
    expect(renderDocument(tree, r)).toEqual(renderDocument(tree, r));
  });
});

describe('node.advanced (node-level, 02 §A)', () => {
  const node = (advanced: FlexaNode['advanced']): FlexaNode => ({
    id: 'n_a',
    type: 'flexa/hello',
    settings: {},
    children: [],
    advanced,
  });

  it('class nối vào wrapper, được escape + trim', () => {
    const { html } = renderDocument(node({ class: '  my-hero dark ' }), makeRegistry());
    expect(html).toContain('<div class="fx my-hero dark" data-fx="n_a"');
    const evil = renderDocument(node({ class: 'a"><script>' }), makeRegistry());
    expect(evil.html).toContain('class="fx a&quot;&gt;&lt;script&gt;"');
  });

  it('class rỗng/chỉ khoảng trắng → wrapper giữ nguyên "fx"', () => {
    const { html } = renderDocument(node({ class: '   ' }), makeRegistry());
    expect(html).toContain('<div class="fx" data-fx="n_a"');
  });

  it('hideOn từng breakpoint → media query đúng dải (max-width như CSS compiler)', () => {
    const { css } = renderDocument(node({ hideOn: ['mobile'] }), makeRegistry());
    expect(css).toContain('@media (max-width:767px){[data-fx="n_a"]{display:none}}');
    const t = renderDocument(node({ hideOn: ['tablet'] }), makeRegistry());
    expect(t.css).toContain(
      '@media (min-width:768px) and (max-width:1024px){[data-fx="n_a"]{display:none}}',
    );
    const d = renderDocument(node({ hideOn: ['desktop'] }), makeRegistry());
    expect(d.css).toContain('@media (min-width:1025px){[data-fx="n_a"]{display:none}}');
  });

  it('hideOn đủ cả 3 → MỘT rule thường, không media', () => {
    const { css } = renderDocument(
      node({ hideOn: ['desktop', 'tablet', 'mobile'] }),
      makeRegistry(),
    );
    expect(css).toContain('[data-fx="n_a"]{display:none}');
    expect(css).not.toContain('@media (max-width:767px){[data-fx="n_a"]{display:none}}');
  });

  it('hideOn dải laptop/wide MỚI — legacy desktop = union, byte-identical', () => {
    const lap = renderDocument(node({ hideOn: ['laptop'] }), makeRegistry());
    expect(lap.css).toContain(
      '@media (min-width:1025px) and (max-width:1440px){[data-fx="n_a"]{display:none}}',
    );
    const wide = renderDocument(node({ hideOn: ['wide'] }), makeRegistry());
    expect(wide.css).toContain('@media (min-width:1441px){[data-fx="n_a"]{display:none}}');
    // wide+laptop cùng bật gộp về ĐÚNG MỘT rule >tablet = rule legacy 'desktop'
    const both = renderDocument(node({ hideOn: ['wide', 'laptop'] }), makeRegistry());
    const legacy = renderDocument(node({ hideOn: ['desktop'] }), makeRegistry());
    expect(both.css).toBe(legacy.css);
    expect(both.css).toContain('@media (min-width:1025px){[data-fx="n_a"]{display:none}}');
    expect(both.css).not.toContain('1441');
    // phủ kín trục qua token mới cũng về MỘT rule thường như bộ legacy đủ-3
    const all = renderDocument(node({ hideOn: ['wide', 'laptop', 'tablet', 'mobile'] }), makeRegistry());
    expect(all.css).toBe(
      renderDocument(node({ hideOn: ['desktop', 'tablet', 'mobile'] }), makeRegistry()).css,
    );
  });

  it('hideOn theo breakpoints custom từ context', () => {
    const { css } = renderDocument(node({ hideOn: ['mobile'] }), makeRegistry(), {
      breakpoints: { tablet: 900, mobile: 600 },
    });
    expect(css).toContain('@media (max-width:600px){[data-fx="n_a"]{display:none}}');
  });

  it('không có advanced → output y hệt trước (không CSS thừa)', () => {
    const { html, css } = renderDocument(
      { id: 'n_a', type: 'flexa/hello', settings: {}, children: [] },
      makeRegistry(),
    );
    expect(html).toContain('<div class="fx" data-fx="n_a"');
    expect(css).not.toContain('display:none');
  });
});

describe('node.style (node-level, 02 §A / 07 §2)', () => {
  const node = (style: FlexaNode['style'], extra: Partial<FlexaNode> = {}): FlexaNode => ({
    id: 'n_s',
    type: 'flexa/hello',
    settings: {},
    children: [],
    style,
    ...extra,
  });

  it('base groups compile to one scoped rule (deterministic order)', () => {
    const { css } = renderDocument(
      node({
        spacing: { margin: '0 auto', padding: '24px 16px' },
        background: { color: '#f5f5f5' },
        size: { maxWidth: '960px' },
        opacity: 0.9,
      }),
      makeRegistry(),
    );
    expect(css).toContain(
      '[data-fx="n_s"]{margin:0 auto;padding:24px 16px;background-color:#f5f5f5;max-width:960px;opacity:0.9}',
    );
  });

  it('tablet/mobile overrides → media queries in descending width order', () => {
    const { css } = renderDocument(
      node({
        spacing: { padding: '48px' },
        tablet: { spacing: { padding: '32px' } },
        mobile: { spacing: { padding: '16px' } },
      }),
      makeRegistry(),
    );
    const tablet = css.indexOf('@media (max-width:1024px){[data-fx="n_s"]{padding:32px}}');
    const mobile = css.indexOf('@media (max-width:767px){[data-fx="n_s"]{padding:16px}}');
    expect(css).toContain('[data-fx="n_s"]{padding:48px}');
    expect(tablet).toBeGreaterThan(-1);
    expect(mobile).toBeGreaterThan(tablet);
  });

  it('custom breakpoints from context apply to node style', () => {
    const { css } = renderDocument(
      node({ mobile: { spacing: { padding: '8px' } } }),
      makeRegistry(),
      { breakpoints: { tablet: 900, mobile: 600 } },
    );
    expect(css).toContain('@media (max-width:600px){[data-fx="n_s"]{padding:8px}}');
  });

  it('hover page → :hover rule via the frozen compiler', () => {
    const { css } = renderDocument(
      node({
        background: { color: '#fff' },
        hover: { background: { color: '#eef2ff' }, opacity: 1 },
      }),
      makeRegistry(),
    );
    expect(css).toContain('[data-fx="n_s"]{background-color:#fff}');
    expect(css).toContain('[data-fx="n_s"]:hover{background-color:#eef2ff;opacity:1}');
  });

  it('transition emits only with duration; easing defaults to ease', () => {
    const { css } = renderDocument(
      node({ background: { color: '#fff' }, transition: { duration: 300 } }),
      makeRegistry(),
    );
    expect(css).toContain('transition:all 300ms ease');
    const custom = renderDocument(
      node({ background: { color: '#fff' }, transition: { duration: 150, easing: 'ease-in-out' } }),
      makeRegistry(),
    );
    expect(custom.css).toContain('transition:all 150ms ease-in-out');
    const noDuration = renderDocument(
      node({ background: { color: '#fff' }, transition: { easing: 'linear' } }),
      makeRegistry(),
    );
    expect(noDuration.css).not.toContain('transition');
  });

  it('node style wins over manifest rule by source order (same specificity)', () => {
    const { css } = renderDocument(
      {
        id: 'n_s',
        type: 'flexa/section',
        settings: { bg: '#ffffff' },
        children: [],
        style: { background: { color: '#000000' } },
      },
      makeRegistry(),
    );
    const manifest = css.indexOf('[data-fx="n_s"]{background-color:#ffffff}');
    const nodeStyle = css.indexOf('[data-fx="n_s"]{background-color:#000000}');
    expect(manifest).toBeGreaterThan(-1);
    expect(nodeStyle).toBeGreaterThan(manifest);
  });

  it('per-node CSS order is manifest → node.style → hideOn', () => {
    const { css } = renderDocument(
      node(
        { background: { color: '#000' } },
        { type: 'flexa/section', settings: { bg: '#fff' }, advanced: { hideOn: ['mobile'] } },
      ),
      makeRegistry(),
    );
    const manifest = css.indexOf('background-color:#fff');
    const style = css.indexOf('background-color:#000');
    const hide = css.indexOf('display:none');
    expect(manifest).toBeGreaterThan(-1);
    expect(style).toBeGreaterThan(manifest);
    expect(hide).toBeGreaterThan(style);
  });

  it("literal values only: user '@…' strings are dropped, not resolved", () => {
    const { css } = renderDocument(
      node({ spacing: { margin: '@pad' }, background: { color: '#abc' } }),
      makeRegistry(),
    );
    expect(css).toContain('[data-fx="n_s"]{background-color:#abc}');
    expect(css).not.toContain('margin');
  });

  it('unit rules follow the compiler: opacity/line-height unitless, sizes px', () => {
    const { css } = renderDocument(
      node({ typography: { size: 18, weight: 600, lineHeight: 1.5, letterSpacing: 0.5 }, opacity: 0.8 }),
      makeRegistry(),
    );
    expect(css).toContain('font-size:18px');
    expect(css).toContain('font-weight:600');
    expect(css).toContain('line-height:1.5');
    expect(css).toContain('letter-spacing:0.5px');
    expect(css).toContain('opacity:0.8');
  });

  it('shadow composes one deterministic box-shadow; no color → group skipped', () => {
    const { css } = renderDocument(
      node({ shadow: { y: 4, blur: 12, color: 'rgba(0,0,0,0.15)', inset: true } }),
      makeRegistry(),
    );
    expect(css).toContain('box-shadow:inset 0px 4px 12px 0px rgba(0,0,0,0.15)');
    const noColor = renderDocument(node({ shadow: { x: 2, y: 2, blur: 8 } }), makeRegistry());
    expect(noColor.css).not.toContain('box-shadow');
  });

  it('no style / empty style → output identical to before (no extra CSS)', () => {
    const registry = makeRegistry();
    const plain = renderDocument(
      { id: 'n_s', type: 'flexa/hello', settings: {}, children: [] },
      registry,
    );
    const empty = renderDocument(node({}), registry);
    expect(empty).toEqual(plain);
  });
});
