import { describe, expect, it } from 'vitest';
import {
  validateProject,
  migrateProject,
  resolveRoute,
  projectSchema,
  PROJECT_SCHEMA_VERSION,
  defaultTheme,
} from '../src/index.js';

// --- fixtures -------------------------------------------------------------

const node = (over: Record<string, unknown> = {}): Record<string, unknown> => ({
  id: 'n1',
  type: 'acme/section',
  settings: {},
  children: [],
  ...over,
});

const doc = (over: Record<string, unknown> = {}): Record<string, unknown> => ({
  id: 'home',
  kind: 'page',
  title: 'Home',
  version: 0,
  tree: node(),
  ...over,
});

const project = (over: Record<string, unknown> = {}): Record<string, unknown> => ({
  id: 'site-1',
  name: 'My Site',
  documents: [doc()],
  ...over,
});

// A valid Tier-1 manifest that declares an h1 landmark — used to exercise the
// a11y gate composition through a project dependency pack.
const headingManifest = {
  type: 'acme/heading',
  title: 'Heading',
  template: '<h1>{{{children}}}</h1>',
  a11y: { heading: { level: 1 } },
};

const elementPack = (elements: unknown[]): Record<string, unknown> => ({
  kind: 'element',
  name: 'Acme Kit',
  vendor: 'acme',
  fdsVersion: '2.0.0',
  elements,
});

// --- envelope -------------------------------------------------------------

describe('validateProject — envelope (Slice A1)', () => {
  it('accepts a minimal valid project', () => {
    const r = validateProject(project());
    expect(r.ok).toBe(true);
  });

  it('rejects a malformed envelope (documents not an array)', () => {
    const r = validateProject({ id: 'x', name: 'X', documents: 'nope' });
    expect(r.ok).toBe(false);
  });

  it('rejects a missing id', () => {
    const r = validateProject({ name: 'X', documents: [doc()] });
    expect(r.ok).toBe(false);
  });

  it('validates each document envelope via documentSchema (bad kind rejected)', () => {
    const r = validateProject(project({ documents: [doc({ kind: 'widget' })] }));
    expect(r.ok).toBe(false);
  });

  it('rejects a schemaVersion newer than this build', () => {
    const r = validateProject(project({ schemaVersion: 99 }));
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors.join()).toMatch(/newer than this build/);
  });

  it('rejects duplicate document ids', () => {
    const r = validateProject(project({ documents: [doc(), doc()] }));
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors.join()).toMatch(/duplicate document id/);
  });
});

// --- dependencies ---------------------------------------------------------

describe('validateProject — dependencies (Slice A1)', () => {
  it('accepts a valid element pack dependency', () => {
    const r = validateProject(project({ dependencies: [elementPack([headingManifest])] }));
    expect(r.ok).toBe(true);
  });

  it('rejects a non-element dependency pack', () => {
    const r = validateProject(
      project({ dependencies: [{ kind: 'theme', name: 'T', vendor: 'acme', fdsVersion: '2.0.0', theme: defaultTheme() }] }),
    );
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors.join()).toMatch(/must be an element pack/);
  });

  it('bubbles a dependency pack error with an index prefix', () => {
    const r = validateProject(
      project({ dependencies: [elementPack([{ type: 'acme/x', title: 'X', tier: 'imperative' }])] }),
    );
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors.join()).toMatch(/dependencies\[0\]:/);
  });
});

// --- a11y gate composition ------------------------------------------------

describe('validateProject — document a11y gate (Slice A1)', () => {
  it('rejects a document with two h1 landmarks (multiple-h1) via the dependency registry', () => {
    const twoH1 = doc({
      tree: node({
        children: [
          { id: 'a', type: 'acme/heading', settings: {}, children: [] },
          { id: 'b', type: 'acme/heading', settings: {}, children: [] },
        ],
      }),
    });
    const r = validateProject(project({ documents: [twoH1], dependencies: [elementPack([headingManifest])] }));
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors.join()).toMatch(/multiple-h1/);
  });

  it('does not flag a11y for element types with no manifest (unresolved types skipped)', () => {
    const r = validateProject(project()); // acme/section has no manifest → skipped
    expect(r.ok).toBe(true);
  });
});

// --- theme ----------------------------------------------------------------

describe('validateProject — theme (Slice A1)', () => {
  it('accepts the default theme (on-system tokens only)', () => {
    const r = validateProject(project({ theme: defaultTheme() }));
    expect(r.ok).toBe(true);
  });

  it('rejects a theme that introduces an off-system vendor cssVar', () => {
    const theme = defaultTheme();
    const withVendor = {
      ...theme,
      base: [...theme.base, { cssVar: '--fx-acme-brand', type: 'color', value: '#ff0000' }],
    };
    const r = validateProject(project({ theme: withVendor }));
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors.join()).toMatch(/--fx-acme-brand/);
  });
});

// --- assets ---------------------------------------------------------------

describe('validateProject — assets (Slice A1)', () => {
  it('accepts well-formed asset refs', () => {
    const r = validateProject(
      project({ assets: [{ id: 'asset:hero-1', url: 'https://x/y.png', kind: 'image' }] }),
    );
    expect(r.ok).toBe(true);
  });

  it('rejects a duplicate asset id', () => {
    const r = validateProject(
      project({
        assets: [
          { id: 'a', url: 'https://x/1.png' },
          { id: 'a', url: 'https://x/2.png' },
        ],
      }),
    );
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors.join()).toMatch(/duplicate asset id/);
  });

  it('rejects an asset ref missing its url (schema shape)', () => {
    const r = validateProject(project({ assets: [{ id: 'a' }] }));
    expect(r.ok).toBe(false);
  });
});

// --- asset references (A3) ------------------------------------------------

// An image element whose `src` is a media slot — used to exercise the asset-ref
// integrity gate through a project dependency pack.
const imageManifest = {
  type: 'acme/image',
  title: 'Image',
  template: '<img src="{{src}}">',
  schema: { src: { type: 'image', default: '' } },
};

const imageNode = (id: string, src: string): Record<string, unknown> => ({
  id,
  type: 'acme/image',
  settings: { src },
  children: [],
});

describe('validateProject — asset references (Slice A3)', () => {
  it('accepts a document whose asset:<id> ref is declared in project.assets', () => {
    const r = validateProject(
      project({
        documents: [doc({ tree: node({ children: [imageNode('img', 'asset:hero-1')] }) })],
        dependencies: [elementPack([imageManifest])],
        assets: [{ id: 'hero-1', url: 'https://x/hero.png', kind: 'image' }],
      }),
    );
    expect(r.ok).toBe(true);
  });

  it('rejects a document referencing an undeclared asset', () => {
    const r = validateProject(
      project({
        documents: [doc({ tree: node({ children: [imageNode('img', 'asset:ghost')] }) })],
        dependencies: [elementPack([imageManifest])],
        assets: [{ id: 'hero-1', url: 'https://x/hero.png' }],
      }),
    );
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors.join()).toMatch(/references asset "ghost".*not declared/);
  });

  it('ignores real URLs and refs on element types with no manifest', () => {
    const r = validateProject(
      project({
        // acme/image not in deps → its ref is unresolved and skipped; real URL is fine.
        documents: [doc({ tree: node({ children: [imageNode('img', 'asset:ghost')] }) })],
      }),
    );
    expect(r.ok).toBe(true);
  });
});

// --- routing (A2) ---------------------------------------------------------

const templateDoc = (over: Record<string, unknown> = {}): Record<string, unknown> =>
  doc({ id: 'archive', kind: 'template', title: 'Archive', ...over });

describe('validateProject — routing cross-reference (Slice A2)', () => {
  it('accepts routing whose refs resolve to the right document kinds', () => {
    const r = validateProject(
      project({
        documents: [doc(), templateDoc()],
        routing: {
          home: 'home',
          pages: [{ path: '/about', documentId: 'home' }],
          templates: [{ documentId: 'archive', contextType: 'archive' }],
        },
      }),
    );
    expect(r.ok).toBe(true);
  });

  it('rejects a home that does not resolve to any document', () => {
    const r = validateProject(project({ routing: { home: 'ghost' } }));
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors.join()).toMatch(/routing\.home.*does not match any document/);
  });

  it('rejects a home that points at a non-page document', () => {
    const r = validateProject(
      project({ documents: [templateDoc()], routing: { home: 'archive' } }),
    );
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors.join()).toMatch(/routing\.home.*is a "template".*"page" is required/);
  });

  it('rejects a pages entry whose documentId is missing', () => {
    const r = validateProject(project({ routing: { pages: [{ path: '/x', documentId: 'nope' }] } }));
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors.join()).toMatch(/routing\.pages\[0\].*does not match/);
  });

  it('rejects duplicate page paths', () => {
    const r = validateProject(
      project({
        routing: {
          pages: [
            { path: '/x', documentId: 'home' },
            { path: '/x', documentId: 'home' },
          ],
        },
      }),
    );
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors.join()).toMatch(/duplicate path/);
  });

  it('rejects a template rule pointing at a non-template document', () => {
    const r = validateProject(
      project({ routing: { templates: [{ documentId: 'home', contextType: 'archive' }] } }),
    );
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors.join()).toMatch(/routing\.templates\[0\].*is a "page".*"template" is required/);
  });
});

describe('resolveRoute (Slice A2)', () => {
  const routing = { home: 'home', pages: [{ path: '/about', documentId: 'about' }] };

  it('resolves an explicit static path', () => {
    expect(resolveRoute(routing, '/about')).toBe('about');
  });

  it('resolves "/" to home', () => {
    expect(resolveRoute(routing, '/')).toBe('home');
  });

  it('prefers an explicit pages entry over home for "/"', () => {
    expect(resolveRoute({ home: 'home', pages: [{ path: '/', documentId: 'landing' }] }, '/')).toBe('landing');
  });

  it('returns null for an unknown path', () => {
    expect(resolveRoute(routing, '/missing')).toBeNull();
  });

  it('returns null when there is no routing', () => {
    expect(resolveRoute(undefined, '/')).toBeNull();
  });
});

// --- migrate --------------------------------------------------------------

describe('migrateProject (Slice A1)', () => {
  it('stamps schemaVersion when absent', () => {
    const out = migrateProject({ id: 'p', name: 'P', documents: [] });
    expect(out.schemaVersion).toBe(PROJECT_SCHEMA_VERSION);
  });

  it('is a no-op when already at the current version', () => {
    const input = { id: 'p', name: 'P', documents: [], schemaVersion: PROJECT_SCHEMA_VERSION };
    expect(migrateProject(input)).toBe(input);
  });

  it('throws on a version newer than this build', () => {
    expect(() => migrateProject({ id: 'p', name: 'P', documents: [], schemaVersion: 99 })).toThrow(
      /newer than this build/,
    );
  });
});

// --- schema publish -------------------------------------------------------

describe('projectSchema (Slice A1)', () => {
  it('parses a valid project envelope', () => {
    expect(projectSchema.safeParse(project()).success).toBe(true);
  });

  it('is the SSOT the CLI publishes as JSON Schema', () => {
    // Routing + assets are part of the published contract even though their
    // semantic validation (routing cross-ref) is deferred to A2.
    const withRouting = project({
      routing: { home: 'home', pages: [{ path: '/', documentId: 'home' }] },
    });
    expect(projectSchema.safeParse(withRouting).success).toBe(true);
  });
});

// --- block-ref integrity (W8, step 9) ---------------------------------------

describe('validateProject — block-ref integrity (doc 14 §4b W8)', () => {
  const refNode = (blockId: string): Record<string, unknown> =>
    node({ id: 'ref1', type: 'flexa/block-ref', settings: { blockId } });
  const blockDoc = (id: string): Record<string, unknown> =>
    doc({ id, kind: 'block', title: 'Header' });

  it('accepts a page referencing a block document carried by the project', () => {
    const r = validateProject(
      project({
        documents: [
          blockDoc('chrome-header'),
          doc({ tree: node({ children: [refNode('chrome-header')] }) }),
        ],
      }),
    );
    expect(r.ok, r.ok ? '' : r.errors.join('\n')).toBe(true);
  });

  it('rejects a ref to a missing document and a ref to a non-block document', () => {
    const missing = validateProject(
      project({ documents: [doc({ tree: node({ children: [refNode('ghost')] }) })] }),
    );
    expect(missing.ok).toBe(false);
    if (!missing.ok) {
      expect(
        missing.errors.some((e) =>
          e.includes('block-ref "ghost" does not match any document'),
        ),
      ).toBe(true);
    }

    const wrongKind = validateProject(
      project({
        documents: [
          doc({ id: 'other', kind: 'page' }),
          doc({ tree: node({ children: [refNode('other')] }) }),
        ],
      }),
    );
    expect(wrongKind.ok).toBe(false);
    if (!wrongKind.ok) {
      expect(
        wrongKind.errors.some((e) => e.includes('is a "page" document but a "block" is required')),
      ).toBe(true);
    }
  });
});
