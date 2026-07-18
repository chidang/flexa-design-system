import { describe, expect, it } from 'vitest';
import { ElementRegistry, validateDocument } from '../src/index.js';
import type { FlexaNode, Json } from '../src/index.js';

// Synthetic registry — declares a11y semantics without touching any element pack.
function registry(): ElementRegistry {
  const r = new ElementRegistry();
  r.register({
    type: 'test/heading',
    title: 'Heading',
    version: 1,
    schema: { level: { type: 'select', options: ['h1', 'h2', 'h3', 'h4'], default: 'h2' } },
    template: '<h2>{{text}}</h2>',
    a11y: { heading: { levelFrom: 'level' } },
  });
  r.register({
    type: 'test/fixed-h2',
    title: 'Fixed H2',
    version: 1,
    schema: {},
    template: '<h2>x</h2>',
    a11y: { heading: { level: 2 } },
  });
  r.register({
    type: 'test/image',
    title: 'Image',
    version: 1,
    schema: { src: { type: 'image', default: '' }, alt: { type: 'text', default: '' } },
    template: '<img src="{{src}}" alt="{{alt}}">',
    a11y: { image: { srcSetting: 'src', altSetting: 'alt' } },
  });
  // Repeater images (mirror flexa/gallery) — alt gated per entry.
  r.register({
    type: 'test/gallery',
    title: 'Gallery',
    version: 1,
    schema: {
      images: {
        type: 'repeater',
        fields: { src: { type: 'image', default: '' }, alt: { type: 'text', default: '' } },
        default: [],
      },
    },
    template: '<div>{{#images}}<img src="{{src}}" alt="{{alt}}">{{/images}}</div>',
    a11y: { imageItems: { setting: 'images', srcField: 'src', altField: 'alt' } },
  });
  r.register({
    type: 'test/legacy-image',
    title: 'Legacy Image',
    version: 1,
    schema: { src: { type: 'image', default: '' }, alt: { type: 'text', default: '' } },
    template: '<img src="{{src}}" alt="{{alt}}">',
    a11y: { requiresAlt: true },
  });
  r.register({
    type: 'test/main',
    title: 'Main',
    version: 1,
    schema: {},
    template: '<main>{{{children}}}</main>',
    a11y: { landmark: 'main' },
  });
  r.register({
    type: 'test/nav',
    title: 'Nav',
    version: 1,
    schema: {},
    template: '<nav>{{{children}}}</nav>',
    a11y: { landmark: 'nav' },
  });
  // Landmark role from a SETTING (E2 — mirror of heading.levelFrom).
  r.register({
    type: 'test/section',
    title: 'Section',
    version: 1,
    schema: {
      landmark: { type: 'select', options: ['', 'banner', 'main', 'contentinfo'], default: '' },
    },
    template: '<section>{{{children}}}</section>',
    a11y: { landmarkFrom: 'landmark' },
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

describe('validateDocument — a11y gate (Phase 6)', () => {
  const r = registry();

  it('single h1 + proper hierarchy → no findings', () => {
    const doc = root([
      node('a', 'test/heading', { level: 'h1' }),
      node('b', 'test/heading', { level: 'h2' }),
      node('c', 'test/fixed-h2'),
    ]);
    expect(validateDocument(doc, r)).toEqual([]);
  });

  it('two h1 → multiple-h1 error on the second h1', () => {
    const doc = root([
      node('a', 'test/heading', { level: 'h1' }),
      node('b', 'test/heading', { level: 'h1' }),
    ]);
    const f = validateDocument(doc, r);
    expect(f).toHaveLength(1);
    expect(f[0]).toMatchObject({ code: 'multiple-h1', severity: 'error', nodeId: 'b' });
  });

  it('h1 → h3 → heading-skip warning', () => {
    const doc = root([
      node('a', 'test/heading', { level: 'h1' }),
      node('b', 'test/heading', { level: 'h3' }),
    ]);
    const f = validateDocument(doc, r);
    expect(f).toHaveLength(1);
    expect(f[0]).toMatchObject({ code: 'heading-skip', severity: 'warning', nodeId: 'b' });
  });

  it('numeric level setting resolves too (2 → h2)', () => {
    const doc = root([node('a', 'test/heading', { level: 1 }), node('b', 'test/heading', { level: 2 })]);
    expect(validateDocument(doc, r)).toEqual([]);
  });

  it('image with src but empty alt → missing-alt error; with alt → clean', () => {
    const bad = root([node('a', 'test/image', { src: '/x.png', alt: '' })]);
    const f = validateDocument(bad, r);
    expect(f).toHaveLength(1);
    expect(f[0]).toMatchObject({ code: 'missing-alt', severity: 'error', nodeId: 'a' });

    const ok = root([node('a', 'test/image', { src: '/x.png', alt: 'A cat' })]);
    expect(validateDocument(ok, r)).toEqual([]);
  });

  it('no src → alt not required', () => {
    const doc = root([node('a', 'test/image', { src: '', alt: '' })]);
    expect(validateDocument(doc, r)).toEqual([]);
  });

  it('repeater images: each entry with src but empty alt → one missing-alt per entry', () => {
    const bad = root([
      node('g', 'test/gallery', {
        images: [
          { src: '/a.png', alt: 'first' }, // ok
          { src: '/b.png', alt: '' }, // #2 missing
          { src: '', alt: '' }, // no src → not required
          { src: '/d.png', alt: '' }, // #4 missing
        ],
      }),
    ]);
    const f = validateDocument(bad, r);
    expect(f).toHaveLength(2);
    expect(f[0]).toMatchObject({ code: 'missing-alt', severity: 'error', nodeId: 'g' });
    expect(f[0]!.message).toContain('image #2 in "images"');
    expect(f[1]!.message).toContain('image #4 in "images"');
  });

  it('repeater images: all entries with alt → clean; non-array/malformed → skipped', () => {
    const ok = root([
      node('g', 'test/gallery', { images: [{ src: '/a.png', alt: 'x' }] }),
    ]);
    expect(validateDocument(ok, r)).toEqual([]);
    // Malformed: setting not an array, and a non-object entry — both ignored, no throw.
    const junk = root([
      node('g', 'test/gallery', { images: 'nope' as unknown as Json }),
      node('h', 'test/gallery', { images: ['string-entry' as unknown as Json] }),
    ]);
    expect(validateDocument(junk, r)).toEqual([]);
  });

  it('legacy requiresAlt uses default src/alt fields', () => {
    const doc = root([node('a', 'test/legacy-image', { src: '/x.png', alt: '' })]);
    const f = validateDocument(doc, r);
    expect(f).toHaveLength(1);
    expect(f[0]).toMatchObject({ code: 'missing-alt', nodeId: 'a' });
  });

  it('undeclared element types are skipped (gate only bites what is declared)', () => {
    const doc = root([node('a', 'other/thing', { src: '/x.png' }), node('b', 'other/heading', {})]);
    expect(validateDocument(doc, r)).toEqual([]);
  });

  it('walks nested children in document order', () => {
    const doc = root([
      node('sec', 'flexa/root', {}, [
        node('a', 'test/heading', { level: 'h1' }),
        node('b', 'test/heading', { level: 'h1' }),
      ]),
    ]);
    const f = validateDocument(doc, r);
    expect(f).toHaveLength(1);
    expect(f[0]).toMatchObject({ code: 'multiple-h1', nodeId: 'b' });
  });

  it('headings but no h1 → missing-h1 warning on the first heading', () => {
    const doc = root([
      node('a', 'test/heading', { level: 'h2' }),
      node('b', 'test/heading', { level: 'h3' }),
    ]);
    const f = validateDocument(doc, r);
    expect(f).toHaveLength(1);
    expect(f[0]).toMatchObject({ code: 'missing-h1', severity: 'warning', nodeId: 'a' });
  });

  it('no heading elements at all → missing-h1 is NOT raised (theme may supply the h1)', () => {
    const doc = root([node('a', 'test/image', { src: '/x.png', alt: 'A cat' })]);
    expect(validateDocument(doc, r)).toEqual([]);
  });

  it('duplicate unique landmark → multiple-landmark warning on the second', () => {
    const doc = root([
      node('a', 'test/heading', { level: 'h1' }),
      node('m1', 'test/main'),
      node('m2', 'test/main'),
    ]);
    const f = validateDocument(doc, r);
    expect(f).toHaveLength(1);
    expect(f[0]).toMatchObject({ code: 'multiple-landmark', severity: 'warning', nodeId: 'm2' });
    expect(f[0]!.message).toContain('"main"');
  });

  it('repeated non-unique landmark (nav) is allowed → no finding', () => {
    const doc = root([
      node('a', 'test/heading', { level: 'h1' }),
      node('n1', 'test/nav'),
      node('n2', 'test/nav'),
    ]);
    expect(validateDocument(doc, r)).toEqual([]);
  });

  it('landmarkFrom (E2): duplicate role from settings → multiple-landmark on the second', () => {
    const doc = root([
      node('a', 'test/heading', { level: 'h1' }),
      node('s1', 'test/section', { landmark: 'banner' }),
      node('s2', 'test/section', { landmark: 'banner' }),
    ]);
    const f = validateDocument(doc, r);
    expect(f).toHaveLength(1);
    expect(f[0]).toMatchObject({ code: 'multiple-landmark', severity: 'warning', nodeId: 's2' });
    expect(f[0]!.message).toContain('"banner"');
  });

  it('landmarkFrom: empty setting = not a landmark; distinct unique roles → clean', () => {
    const doc = root([
      node('a', 'test/heading', { level: 'h1' }),
      node('s1', 'test/section', { landmark: '' }),
      node('s2', 'test/section', { landmark: 'banner' }),
      node('s3', 'test/section', { landmark: 'contentinfo' }),
    ]);
    expect(validateDocument(doc, r)).toEqual([]);
  });

  it('landmarkFrom: mixes with statically declared landmarks in the uniqueness gate', () => {
    const doc = root([
      node('a', 'test/heading', { level: 'h1' }),
      node('m1', 'test/main'),
      node('s1', 'test/section', { landmark: 'main' }),
    ]);
    const f = validateDocument(doc, r);
    expect(f).toHaveLength(1);
    expect(f[0]).toMatchObject({ code: 'multiple-landmark', nodeId: 's1' });
  });
});
