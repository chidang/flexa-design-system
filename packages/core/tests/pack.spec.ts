import { describe, expect, it } from 'vitest';
import {
  validatePack,
  parseSemver,
  isCompatible,
  defaultTheme,
  FDS_VERSION,
} from '../src/index.js';

const el = (over: Record<string, unknown> = {}): Record<string, unknown> => ({
  type: 'acme/card',
  title: 'Card',
  template: '<div>{{{children}}}</div>',
  style: { '@self': { color: 'color.primary', padding: 'space.4' } },
  ...over,
});

const envelope = { name: 'Acme Kit', vendor: 'acme', fdsVersion: '2.0.0' };

describe('semver (Slice 8)', () => {
  it('parses major.minor.patch, rejects malformed', () => {
    expect(parseSemver('2.3.1')).toEqual({ major: 2, minor: 3, patch: 1 });
    expect(parseSemver('2.0')).toBeNull();
    expect(parseSemver('v2.0.0')).toBeNull();
    expect(parseSemver('abc')).toBeNull();
  });

  it('is compatible only within the same major, host at least as new', () => {
    expect(isCompatible('2.0.0', '2.0.0')).toBe(true);
    expect(isCompatible('2.0.0', '2.3.1')).toBe(true); // host newer minor
    expect(isCompatible('2.1.0', '2.0.0')).toBe(false); // host too old
    expect(isCompatible('2.0.5', '2.0.3')).toBe(false); // host too old patch
    expect(isCompatible('3.0.0', '2.0.0')).toBe(false); // major mismatch
    expect(isCompatible('bad', '2.0.0')).toBe(false);
  });

  it('FDS_VERSION is a valid semver', () => {
    expect(parseSemver(FDS_VERSION)).not.toBeNull();
  });
});

describe('validatePack — envelope (Slice 8)', () => {
  it('rejects a bad vendor namespace', () => {
    for (const vendor of ['Acme', '1x', '', 'ac-me']) {
      const r = validatePack({ ...envelope, vendor, kind: 'element', elements: [el()] });
      expect(r.ok).toBe(false);
    }
  });

  it('rejects a malformed fdsVersion', () => {
    for (const fdsVersion of ['2.0', 'v2', '2.0.0-beta', 'latest']) {
      const r = validatePack({ ...envelope, fdsVersion, kind: 'element', elements: [el()] });
      expect(r.ok).toBe(false);
    }
  });

  it('rejects an incompatible FDS major/minor against the host', () => {
    const bad = validatePack({ ...envelope, fdsVersion: '3.0.0', kind: 'element', elements: [el()] }, '2.0.0');
    expect(bad.ok).toBe(false);
    if (!bad.ok) expect(bad.errors.join()).toMatch(/incompatible/);

    const tooNew = validatePack({ ...envelope, fdsVersion: '2.1.0', kind: 'element', elements: [el()] }, '2.0.0');
    expect(tooNew.ok).toBe(false);

    const okPack = validatePack({ ...envelope, fdsVersion: '2.0.0', kind: 'element', elements: [el()] }, '2.3.1');
    expect(okPack.ok).toBe(true);
  });

  it('rejects an unknown kind', () => {
    const r = validatePack({ ...envelope, kind: 'widget', elements: [el()] });
    expect(r.ok).toBe(false);
  });
});

describe('validatePack — element pack (Slice 8)', () => {
  it('accepts valid Tier-1 manifests', () => {
    const r = validatePack({ ...envelope, kind: 'element', elements: [el(), el({ type: 'acme/hero' })] });
    expect(r.ok).toBe(true);
  });

  it('delegates the Slice-7 token gate — off-system token is rejected', () => {
    const r = validatePack({
      ...envelope,
      kind: 'element',
      elements: [el({ style: { '@self': { color: 'color.brand-999' } } })],
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors.join()).toMatch(/color\.brand-999/);
  });

  it('rejects a duplicate element type within the pack', () => {
    const r = validatePack({ ...envelope, kind: 'element', elements: [el(), el()] });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors.join()).toMatch(/duplicate element type/);
  });

  it('rejects a Tier-2 imperative element', () => {
    const r = validatePack({
      ...envelope,
      kind: 'element',
      elements: [el({ tier: 'imperative', cache: { cacheable: true } })],
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors.join()).toMatch(/imperative/);
  });
});

describe('validatePack — theme pack (Slice 8)', () => {
  it('accepts the default theme (on-system tokens only)', () => {
    const r = validatePack({ ...envelope, kind: 'theme', theme: defaultTheme() });
    expect(r.ok).toBe(true);
  });

  it('rejects a theme that introduces an off-system vendor cssVar (deferred to Phase 6)', () => {
    const theme = defaultTheme();
    const withVendor = {
      ...theme,
      base: [...theme.base, { cssVar: '--fx-acme-brand', type: 'color', value: '#ff0000' }],
    };
    const r = validatePack({ ...envelope, kind: 'theme', theme: withVendor });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors.join()).toMatch(/--fx-acme-brand/);
  });

  it('rejects a theme missing base', () => {
    const r = validatePack({ ...envelope, kind: 'theme', theme: { name: 'x' } });
    expect(r.ok).toBe(false);
  });
});

describe('validatePack — preset pack (Slice 8)', () => {
  it('accepts a well-formed node tree', () => {
    const r = validatePack({
      ...envelope,
      kind: 'preset',
      presets: [
        { title: 'Hero', tree: { type: 'acme/section', children: [{ type: 'acme/text', settings: { text: 'hi' } }] } },
      ],
    });
    expect(r.ok).toBe(true);
  });

  it('rejects a node with a malformed type', () => {
    const r = validatePack({
      ...envelope,
      kind: 'preset',
      presets: [{ title: 'Bad', tree: { type: 'not-a-valid-type' } }],
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors.join()).toMatch(/vendor\/name/);
  });

  it('accepts the chrome role marker and keeps it on the validated pack (doc 17 HF6)', () => {
    const input = {
      ...envelope,
      kind: 'preset',
      presets: [
        { title: 'Header', tree: { type: 'acme/section' }, role: 'header' },
        { title: 'Footer', tree: { type: 'acme/section' }, role: 'footer' },
        { title: 'Hero', tree: { type: 'acme/section' } }, // ordinary pattern — role stays optional
      ],
    };
    const r = validatePack(input);
    expect(r.ok).toBe(true);
    if (r.ok && r.pack.kind === 'preset') {
      expect(r.pack.presets.map((p) => p.role)).toEqual(['header', 'footer', undefined]);
    }
  });

  it('rejects a role outside the header/footer vocabulary', () => {
    const r = validatePack({
      ...envelope,
      kind: 'preset',
      presets: [{ title: 'Bad', tree: { type: 'acme/section' }, role: 'sidebar' }],
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors.join()).toMatch(/role/);
  });

  // doc 22 EX1 — a preset carries the author's node.style + rename.
  it('accepts a node carrying an on-system style and label', () => {
    const r = validatePack({
      ...envelope,
      kind: 'preset',
      presets: [
        {
          title: 'Styled',
          tree: {
            type: 'acme/section',
            label: 'My hero',
            style: { background: { color: 'color.primary' }, spacing: { padding: 'space.4' } },
            children: [{ type: 'acme/text', style: { typography: { color: 'color.text' } } }],
          },
        },
      ],
    });
    expect(r.ok).toBe(true);
  });

  it('runs the on-system token gate on preset node.style — off-system token rejected', () => {
    const r = validatePack({
      ...envelope,
      kind: 'preset',
      presets: [{ title: 'Bad', tree: { type: 'acme/section', style: { background: { color: 'color.brand-999' } } } }],
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors.join()).toMatch(/color\.brand-999/);
  });

  it('accepts a CSS literal in node.style (advanced mode is legal)', () => {
    const r = validatePack({
      ...envelope,
      kind: 'preset',
      presets: [{ title: 'Literal', tree: { type: 'acme/section', style: { spacing: { padding: '13px' } } } }],
    });
    expect(r.ok).toBe(true);
  });

  it('rejects a non-string label and a non-object style', () => {
    const badLabel = validatePack({
      ...envelope,
      kind: 'preset',
      presets: [{ title: 'Bad', tree: { type: 'acme/section', label: 42 } }],
    });
    expect(badLabel.ok).toBe(false);
    if (!badLabel.ok) expect(badLabel.errors.join()).toMatch(/label/);

    const badStyle = validatePack({
      ...envelope,
      kind: 'preset',
      presets: [{ title: 'Bad', tree: { type: 'acme/section', style: 'oops' } }],
    });
    expect(badStyle.ok).toBe(false);
    if (!badStyle.ok) expect(badStyle.errors.join()).toMatch(/style/);
  });
});

describe('validatePack — design pack (kind design, Phase 6 D3)', () => {
  const design = (over: Record<string, unknown> = {}): Record<string, unknown> => ({
    ...envelope,
    kind: 'design',
    theme: defaultTheme(),
    ...over,
  });

  it('accepts a design pack with just a valid theme', () => {
    expect(validatePack(design()).ok).toBe(true);
  });

  it('accepts optional on-system component styles + brand + preview', () => {
    const r = validatePack(
      design({
        componentStyles: { 'acme/button': { '&': { color: 'color.primary', padding: 'space.4' } } },
        brand: { primaryColor: '#6366f1', radius: 'lg' },
        preview: { colors: ['#6366f1'], thumbnail: 'x.png' },
      }),
    );
    expect(r.ok, JSON.stringify(r)).toBe(true);
  });

  it('rejects a theme that re-values an off-system cssVar', () => {
    const r = validatePack(
      design({ theme: { name: 't', base: [{ cssVar: '--fx-not-a-token', type: 'color', value: '#fff' }] } }),
    );
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors.join()).toMatch(/off-system/);
  });

  it('rejects component styles with a bad type key or off-system token', () => {
    const r = validatePack(design({ componentStyles: { Button: { '&': { color: 'color.nope' } } } }));
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.errors.join()).toMatch(/valid element type/);
      expect(r.errors.join()).toMatch(/color\.nope/);
    }
  });

  it('rejects a non-hex brand colour in the envelope', () => {
    const r = validatePack(design({ brand: { primaryColor: 'blue' } }));
    expect(r.ok).toBe(false);
  });
});

describe('validatePack — site pack (EP-1 realized: payload is a FlexaProject)', () => {
  const pageDoc = { id: 'home', kind: 'page', title: 'Home', version: 1, tree: { id: 'r', type: 'flexa/root', settings: {}, children: [] } };
  const project = { schemaVersion: 1, id: 'acme-site', name: 'Acme Site', documents: [pageDoc] };

  it('deep-validates the payload project through validateProject and accepts a valid one', () => {
    const r = validatePack({ ...envelope, kind: 'site', project });
    expect(r.ok).toBe(true);
  });

  it('surfaces project-level failures under a `site.project` prefix (gate not loosened, SG-3)', () => {
    // Two documents with the same id → validateProject rejects; the site pack
    // must reject too, prefixed so the source is unambiguous.
    const dup = { ...project, documents: [pageDoc, pageDoc] };
    const r = validatePack({ ...envelope, kind: 'site', project: dup });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors.join()).toMatch(/site\.project:/);
  });

  it('rejects a missing / garbage project payload through the project gate', () => {
    const missing = validatePack({ ...envelope, kind: 'site' });
    expect(missing.ok).toBe(false);
    if (!missing.ok) expect(missing.errors.join()).toMatch(/site\.project:/);
  });

  it('still enforces envelope-level checks (vendor, semver compat) first', () => {
    const badVendor = validatePack({ ...envelope, vendor: 'Acme', kind: 'site', project });
    expect(badVendor.ok).toBe(false);
    if (!badVendor.ok) expect(badVendor.errors.join()).toMatch(/vendor/);

    const incompatible = validatePack({ ...envelope, fdsVersion: '3.0.0', kind: 'site', project }, '2.0.0');
    expect(incompatible.ok).toBe(false);
    if (!incompatible.ok) expect(incompatible.errors.join()).toMatch(/incompatible/);
  });
});
