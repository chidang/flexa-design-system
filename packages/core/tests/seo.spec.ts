import { describe, expect, it } from 'vitest';
import { ElementRegistry, collectStructuredData, emitJsonLd } from '../src/index.js';
import type { FlexaNode, Json, RenderContext } from '../src/index.js';

// Synthetic registry declaring seo.structuredData — no element pack touched.
function registry(): ElementRegistry {
  const r = new ElementRegistry();
  r.register({
    type: 'test/article',
    title: 'Article',
    version: 1,
    schema: { headline: { type: 'text', default: '' }, author: { type: 'text', default: '' } },
    template: '<article>{{headline}}</article>',
    // Declaration order (headline before author) drives JSON key order.
    seo: { structuredData: { type: 'Article', props: { headline: 'headline', author: 'author' } } },
  });
  r.register({
    type: 'test/image',
    title: 'Image',
    version: 1,
    schema: { src: { type: 'image', default: '' } },
    template: '<img src="{{src}}">',
    seo: { structuredData: { type: 'ImageObject', props: { contentUrl: 'src' } } },
  });
  r.register({
    type: 'test/plain',
    title: 'Plain',
    version: 1,
    schema: {},
    template: '<div>{{{children}}}</div>',
  });
  // Page-level composition (Slice 5): a primary Article + parts that feed properties into it.
  r.register({
    type: 'test/primary',
    title: 'Primary',
    version: 1,
    schema: { headline: { type: 'text', default: '' }, image: { type: 'image', default: '' } },
    template: '<article>{{headline}}</article>',
    seo: { structuredData: { type: 'Article', role: 'primary', props: { headline: 'headline', image: 'image' } } },
  });
  r.register({
    type: 'test/part-image',
    title: 'Part Image',
    version: 1,
    schema: { src: { type: 'image', default: '' } },
    template: '<img src="{{src}}">',
    seo: { structuredData: { role: 'part', props: { image: 'src' } } },
  });
  r.register({
    type: 'test/part-date',
    title: 'Part Date',
    version: 1,
    schema: { iso: { type: 'text', default: '' } },
    template: '<time>{{iso}}</time>',
    seo: { structuredData: { role: 'part', props: { datePublished: 'iso' } } },
  });
  // List-valued property from a repeater (E2) — BreadcrumbList/itemListElement.
  r.register({
    type: 'test/breadcrumb',
    title: 'Breadcrumb',
    version: 1,
    schema: {
      items: {
        type: 'repeater',
        fields: { label: { type: 'text', default: '' }, url: { type: 'text', default: '' } },
        default: [],
      },
    },
    template: '<nav>x</nav>',
    seo: {
      structuredData: {
        type: 'BreadcrumbList',
        props: {},
        items: {
          prop: 'itemListElement',
          setting: 'items',
          type: 'ListItem',
          props: { name: 'label', item: 'url' },
        },
      },
    },
  });
  return r;
}

const node = (
  id: string,
  type: string,
  settings: Record<string, Json> = {},
  children: FlexaNode[] = [],
): FlexaNode => ({ id, type, settings, children });

const root = (children: FlexaNode[]): FlexaNode => node('root', 'flexa/root', {}, children);

describe('collectStructuredData — per-node → @graph (Phase 6)', () => {
  const r = registry();

  it('one declaring node → one object with @type + filled props', () => {
    const doc = root([node('a', 'test/article', { headline: 'Hello', author: 'Ada' })]);
    expect(collectStructuredData(doc, r)).toEqual([
      { '@type': 'Article', headline: 'Hello', author: 'Ada' },
    ]);
  });

  it('empty props are dropped, key order follows declaration order', () => {
    const doc = root([node('a', 'test/article', { headline: 'Only headline', author: '' })]);
    const graph = collectStructuredData(doc, r);
    expect(graph).toEqual([{ '@type': 'Article', headline: 'Only headline' }]);
    expect(Object.keys(graph[0]!)).toEqual(['@type', 'headline']);
  });

  it('a node whose props all resolve empty is skipped (no bare @type)', () => {
    const doc = root([node('a', 'test/article', { headline: '', author: '' })]);
    expect(collectStructuredData(doc, r)).toEqual([]);
  });

  it('multiple declaring nodes are collected in pre-order (DOM order)', () => {
    const doc = root([
      node('a', 'test/article', { headline: 'Post' }),
      node('wrap', 'test/plain', {}, [node('b', 'test/image', { src: '/x.png' })]),
    ]);
    expect(collectStructuredData(doc, r)).toEqual([
      { '@type': 'Article', headline: 'Post' },
      { '@type': 'ImageObject', contentUrl: '/x.png' },
    ]);
  });

  it('undeclared types (test/plain, unknown) contribute nothing', () => {
    const doc = root([node('a', 'test/plain'), node('b', 'other/thing', { headline: 'x' })]);
    expect(collectStructuredData(doc, r)).toEqual([]);
  });

  it('ctx.data (dynamic provider props) overrides settings', () => {
    const doc = root([node('a', 'test/article', { headline: 'from settings' })]);
    const ctx: RenderContext = { data: { a: { headline: 'from provider' } } };
    expect(collectStructuredData(doc, r, ctx)).toEqual([
      { '@type': 'Article', headline: 'from provider' },
    ]);
  });
});

describe('collectStructuredData — page-level composition via role (Slice 5)', () => {
  const r = registry();

  it('primary + parts merge into ONE Article with @id, props in fill order', () => {
    const doc = root([
      node('t', 'test/primary', { headline: 'Post' }),
      node('img', 'test/part-image', { src: '/cover.jpg' }),
      node('dt', 'test/part-date', { iso: '2026-07-04' }),
    ]);
    const graph = collectStructuredData(doc, r);
    expect(graph).toEqual([
      { '@type': 'Article', '@id': '#primary', headline: 'Post', image: '/cover.jpg', datePublished: '2026-07-04' },
    ]);
    expect(Object.keys(graph[0]!)).toEqual(['@type', '@id', 'headline', 'image', 'datePublished']);
  });

  it('a part appearing BEFORE the primary in pre-order still merges', () => {
    const doc = root([
      node('img', 'test/part-image', { src: '/cover.jpg' }),
      node('t', 'test/primary', { headline: 'Post' }),
    ]);
    expect(collectStructuredData(doc, r)).toEqual([
      { '@type': 'Article', '@id': '#primary', headline: 'Post', image: '/cover.jpg' },
    ]);
  });

  it('primary owns a property it declares — a part cannot overwrite it', () => {
    const doc = root([
      node('t', 'test/primary', { headline: 'Post', image: '/primary.jpg' }),
      node('img', 'test/part-image', { src: '/part.jpg' }),
    ]);
    expect(collectStructuredData(doc, r)).toEqual([
      { '@type': 'Article', '@id': '#primary', headline: 'Post', image: '/primary.jpg' },
    ]);
  });

  it('when two parts fill the same slot, the earlier (pre-order) wins', () => {
    const doc = root([
      node('t', 'test/primary', { headline: 'Post' }),
      node('img1', 'test/part-image', { src: '/first.jpg' }),
      node('img2', 'test/part-image', { src: '/second.jpg' }),
    ]);
    expect(collectStructuredData(doc, r)).toEqual([
      { '@type': 'Article', '@id': '#primary', headline: 'Post', image: '/first.jpg' },
    ]);
  });

  it('primary with 0 own props but parts fill it → object emitted with @id', () => {
    const doc = root([
      node('t', 'test/primary', { headline: '', image: '' }),
      node('img', 'test/part-image', { src: '/cover.jpg' }),
    ]);
    expect(collectStructuredData(doc, r)).toEqual([
      { '@type': 'Article', '@id': '#primary', image: '/cover.jpg' },
    ]);
  });

  it('primary with 0 own props and NO parts → dropped (no bare @type/@id noise)', () => {
    const doc = root([node('t', 'test/primary', { headline: '', image: '' })]);
    expect(collectStructuredData(doc, r)).toEqual([]);
  });

  it('parts with no primary on the page are inert (dropped)', () => {
    const doc = root([
      node('img', 'test/part-image', { src: '/cover.jpg' }),
      node('dt', 'test/part-date', { iso: '2026-07-04' }),
    ]);
    const graph = collectStructuredData(doc, r);
    expect(graph).toEqual([]);
    expect(emitJsonLd(doc, r)).toBe('');
  });

  it('a second primary degrades to a standalone self object', () => {
    const doc = root([
      node('t1', 'test/primary', { headline: 'First' }),
      node('t2', 'test/primary', { headline: 'Second' }),
    ]);
    expect(collectStructuredData(doc, r)).toEqual([
      { '@type': 'Article', '@id': '#primary', headline: 'First' },
      { '@type': 'Article', headline: 'Second' },
    ]);
  });

  it('back-compat: undeclared role stays self (per-node standalone, no @id)', () => {
    const doc = root([node('a', 'test/article', { headline: 'Hello' })]);
    expect(collectStructuredData(doc, r)).toEqual([{ '@type': 'Article', headline: 'Hello' }]);
  });
});

describe('emitJsonLd — script envelope + escaping (Phase 6)', () => {
  const r = registry();

  it('empty graph → empty string (no <script>)', () => {
    const doc = root([node('a', 'test/plain')]);
    expect(emitJsonLd(doc, r)).toBe('');
  });

  it('wraps the graph in a schema.org ld+json script', () => {
    const doc = root([node('a', 'test/article', { headline: 'Hello' })]);
    expect(emitJsonLd(doc, r)).toBe(
      '<script type="application/ld+json">' +
        '{"@context":"https://schema.org","@graph":[{"@type":"Article","headline":"Hello"}]}' +
        '</script>',
    );
  });

  it('neutralizes </script> breakout and & inside values', () => {
    const doc = root([node('a', 'test/article', { headline: '</script><b>&x' })]);
    const out = emitJsonLd(doc, r);
    // No raw closing tag / ampersand survives — all escaped to \uXXXX.
    expect(out.includes('</script><b>')).toBe(false);
    expect(out).toContain('\\u003C/script\\u003E\\u003Cb\\u003E\\u0026x');
    // The wrapper's own closing tag is still intact and is the only real one.
    expect(out.endsWith('</script>')).toBe(true);
    expect(out.match(/<\/script>/g)).toHaveLength(1);
  });
});

describe('collectStructuredData — list-valued property from a repeater (E2)', () => {
  const r = registry();

  it('repeater entries → itemListElement with 1-based positions; empty entry field dropped', () => {
    const doc = root([
      node('bc', 'test/breadcrumb', {
        items: [
          { label: 'Home', url: '/' },
          { label: 'Blog', url: '/blog' },
          { label: 'Post', url: '' }, // current page — no `item` URL
        ],
      }),
    ]);
    expect(collectStructuredData(doc, r)).toEqual([
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: '/' },
          { '@type': 'ListItem', position: 2, name: 'Blog', item: '/blog' },
          { '@type': 'ListItem', position: 3, name: 'Post' },
        ],
      },
    ]);
  });

  it('entries with zero mapped fields are skipped; positions stay contiguous', () => {
    const doc = root([
      node('bc', 'test/breadcrumb', {
        items: [{ label: 'Home', url: '/' }, { label: '', url: '' }, { label: 'Post' }],
      }),
    ]);
    expect(collectStructuredData(doc, r)).toEqual([
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: '/' },
          { '@type': 'ListItem', position: 2, name: 'Post' },
        ],
      },
    ]);
  });

  it('empty repeater → list prop not emitted → 0-prop node skipped entirely', () => {
    const doc = root([node('bc', 'test/breadcrumb', { items: [] })]);
    expect(collectStructuredData(doc, r)).toEqual([]);
    expect(emitJsonLd(doc, r)).toBe('');
  });

  it('non-array setting value is ignored (no list prop)', () => {
    const doc = root([node('bc', 'test/breadcrumb', { items: 'oops' })]);
    expect(collectStructuredData(doc, r)).toEqual([]);
  });
});
