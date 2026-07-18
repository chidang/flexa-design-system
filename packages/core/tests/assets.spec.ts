import { describe, expect, it } from 'vitest';
import {
  ASSET_REF_PREFIX,
  assetRef,
  parseAssetRef,
  assetKeys,
  collectAssetRefs,
  applyAssetUrls,
  ElementRegistry,
  type ElementManifest,
  type FlexaNode,
} from '../src/index.js';

// --- fixtures -------------------------------------------------------------

const imageManifest = {
  type: 'test/image',
  title: 'Image',
  version: 1,
  schema: {
    src: { type: 'image', default: '' },
    alt: { type: 'text', default: '' },
  },
  template: '<img src="{{src}}">',
};

const downloadManifest = {
  type: 'test/download',
  title: 'Download',
  version: 1,
  schema: { file: { type: 'file', default: '' } },
  template: '<a>{{file}}</a>',
};

const plainManifest = {
  type: 'test/plain',
  title: 'Plain',
  version: 1,
  schema: {},
  template: '<div>{{{children}}}</div>',
};

// A gallery-like element: a top-level image (poster) plus a repeater whose entries
// carry a nested media field (`src`). Exercises repeater-nested asset refs.
const galleryManifest = {
  type: 'test/gallery',
  title: 'Gallery',
  version: 1,
  schema: {
    poster: { type: 'image', default: '' },
    images: {
      type: 'repeater',
      fields: {
        src: { type: 'image', default: '' },
        alt: { type: 'text', default: '' },
      },
      default: [],
    },
  },
  template: '<div></div>',
};

function registry(): ElementRegistry {
  const r = new ElementRegistry();
  r.registerSafe(imageManifest);
  r.registerSafe(downloadManifest);
  r.registerSafe(plainManifest);
  r.registerSafe(galleryManifest);
  return r;
}

const node = (over: Record<string, unknown> = {}): FlexaNode =>
  ({ id: 'n', type: 'test/plain', settings: {}, children: [], ...over } as unknown as FlexaNode);

/** child accessor that satisfies noUncheckedIndexedAccess */
const child = (root: FlexaNode, i: number): FlexaNode => (root.children ?? [])[i] as FlexaNode;

// --- convention -----------------------------------------------------------

describe('asset-ref convention', () => {
  it('assetRef / parseAssetRef round-trip', () => {
    expect(assetRef('hero-1')).toBe(`${ASSET_REF_PREFIX}hero-1`);
    expect(parseAssetRef(assetRef('hero-1'))).toBe('hero-1');
  });

  it('parseAssetRef returns null for real URLs, empty ids, and non-strings', () => {
    expect(parseAssetRef('https://x/y.png')).toBeNull();
    expect(parseAssetRef('asset:')).toBeNull();
    expect(parseAssetRef(42)).toBeNull();
    expect(parseAssetRef(undefined)).toBeNull();
  });
});

// --- assetKeys ------------------------------------------------------------

describe('assetKeys', () => {
  it('lists image/file controls in declaration order, excluding text', () => {
    expect(assetKeys(imageManifest as unknown as ElementManifest)).toEqual(['src']);
    expect(assetKeys(downloadManifest as unknown as ElementManifest)).toEqual(['file']);
    expect(assetKeys(plainManifest as unknown as ElementManifest)).toEqual([]);
  });

  it('lists only TOP-LEVEL media controls — a repeater key is not a media slot', () => {
    // assetKeys is the top-level media-control accessor; repeater-nested media is
    // handled by collect/apply, not surfaced here.
    expect(assetKeys(galleryManifest as unknown as ElementManifest)).toEqual(['poster']);
  });
});

// --- collectAssetRefs -----------------------------------------------------

describe('collectAssetRefs', () => {
  const tree = node({
    children: [
      node({ id: 'i1', type: 'test/image', settings: { src: 'asset:hero-1', alt: 'Hero' } }),
      node({ id: 'i2', type: 'test/image', settings: { src: 'https://cdn/x.png', alt: 'asset:not-a-ref' } }),
      node({ id: 'd1', type: 'test/download', settings: { file: 'asset:brochure' } }),
      node({ id: 'x', type: 'unknown/type', settings: { src: 'asset:skip' } }),
    ],
  });

  it('collects only asset:<id> placeholders on media slots, pre-order', () => {
    expect(collectAssetRefs(tree, registry())).toEqual([
      { id: 'hero-1', nodeId: 'i1', key: 'src' },
      { id: 'brochure', nodeId: 'd1', key: 'file' },
    ]);
  });

  it('ignores real URLs, alt-text placeholders, and unknown types', () => {
    const ids = collectAssetRefs(tree, registry()).map((u) => u.id);
    expect(ids).not.toContain('not-a-ref');
    expect(ids).not.toContain('skip');
  });
});

// --- applyAssetUrls -------------------------------------------------------

describe('applyAssetUrls', () => {
  const tree = node({
    children: [
      node({ id: 'i1', type: 'test/image', settings: { src: 'asset:hero-1', alt: 'Hero' } }),
      node({ id: 'i2', type: 'test/image', settings: { src: 'https://cdn/x.png' } }),
      node({ id: 'd1', type: 'test/download', settings: { file: 'asset:brochure' } }),
    ],
  });

  const resolve = (id: string): string | null =>
    id === 'hero-1' ? 'https://media/ingested.png' : null;

  it('rewrites resolved placeholders, leaves unresolved + real URLs, does not mutate input', () => {
    const out = applyAssetUrls(tree, registry(), resolve);
    expect(child(out, 0).settings.src).toBe('https://media/ingested.png');
    expect(child(out, 0).settings.alt).toBe('Hero'); // non-media untouched
    expect(child(out, 1).settings.src).toBe('https://cdn/x.png'); // real URL untouched
    expect(child(out, 2).settings.file).toBe('asset:brochure'); // unresolved left in place
    // input tree is pure
    expect(child(tree, 0).settings.src).toBe('asset:hero-1');
  });

  it('empty-string resolution leaves the placeholder in place', () => {
    const out = applyAssetUrls(tree, registry(), () => '');
    expect(child(out, 0).settings.src).toBe('asset:hero-1');
  });
});

// --- repeater-nested media (e.g. a gallery's images[].src) ----------------

describe('repeater-nested asset refs', () => {
  const galleryNode = (over: Record<string, unknown> = {}): FlexaNode =>
    node({
      id: 'g1',
      type: 'test/gallery',
      settings: {
        poster: 'asset:poster-1',
        images: [
          { src: 'asset:g-1', alt: 'One' },
          { src: 'https://cdn/real.png', alt: 'Real' }, // already ingested — skipped
          { src: 'asset:g-3', alt: 'Three' },
        ],
      },
      ...over,
    });

  it('collects top-level AND nested refs with entry index + field, pre-order', () => {
    const tree = node({ children: [galleryNode()] });
    expect(collectAssetRefs(tree, registry())).toEqual([
      { id: 'poster-1', nodeId: 'g1', key: 'poster' },
      { id: 'g-1', nodeId: 'g1', key: 'images', index: 0, field: 'src' },
      { id: 'g-3', nodeId: 'g1', key: 'images', index: 2, field: 'src' },
    ]);
  });

  it('applyAssetUrls rewrites nested entry fields, leaves unresolved, keeps input pure', () => {
    const tree = node({ children: [galleryNode()] });
    const resolve = (id: string): string | null =>
      id === 'g-1' ? 'https://media/g1.png' : id === 'poster-1' ? 'https://media/p.png' : null;
    const out = applyAssetUrls(tree, registry(), resolve);
    const g = child(out, 0);
    const images = g.settings.images as Array<Record<string, string>>;
    expect(g.settings.poster).toBe('https://media/p.png');
    expect(images[0]!.src).toBe('https://media/g1.png'); // resolved
    expect(images[0]!.alt).toBe('One'); // sibling field untouched
    expect(images[1]!.src).toBe('https://cdn/real.png'); // real URL untouched
    expect(images[2]!.src).toBe('asset:g-3'); // unresolved left in place
    // input tree pure — original placeholders + entry objects untouched
    const src = child(tree, 0).settings.images as Array<Record<string, string>>;
    expect(src[0]!.src).toBe('asset:g-1');
    expect(child(tree, 0).settings.poster).toBe('asset:poster-1');
  });

  it('ignores non-array and malformed repeater entries', () => {
    const bad = node({
      children: [
        node({ id: 'a', type: 'test/gallery', settings: { images: 'not-an-array' } }),
        node({ id: 'b', type: 'test/gallery', settings: { images: [null, 'str', { src: 'asset:ok' }] } }),
      ],
    });
    expect(collectAssetRefs(bad, registry())).toEqual([
      { id: 'ok', nodeId: 'b', key: 'images', index: 2, field: 'src' },
    ]);
    // apply over the same tree does not throw and rewrites the one good entry.
    const out = applyAssetUrls(bad, registry(), () => 'https://x/y.png');
    const imgs = child(out, 1).settings.images as Array<Record<string, string> | unknown>;
    expect((imgs[2] as Record<string, string>).src).toBe('https://x/y.png');
  });
});
