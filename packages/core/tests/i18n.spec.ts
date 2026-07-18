import { describe, expect, it } from 'vitest';
import {
  ElementRegistry,
  applyTranslations,
  collectStrings,
  stringName,
  translatableKeys,
} from '../src/index.js';
import type { FlexaNode } from '../src/index.js';

// Synthetic registry — mirrors adapters/wordpress/tests/run_i18n_tests.php exactly.
function registry(): ElementRegistry {
  const r = new ElementRegistry();
  r.register({
    type: 'test/heading',
    title: 'Heading',
    version: 1,
    schema: { text: { type: 'text', default: 'Heading' } },
    template: '<h2>{{text}}</h2>',
  });
  r.register({
    type: 'test/card',
    title: 'Card',
    version: 1,
    schema: {
      title: { type: 'text', default: '' },
      body: { type: 'textarea', default: '' },
      bg: { type: 'color', default: '' },
      anchor: { type: 'text', default: '', translatable: false },
    },
    template: '<div>{{title}}</div>',
  });
  r.register({
    type: 'test/plain',
    title: 'Plain',
    version: 1,
    schema: {},
    template: '<div>{{{children}}}</div>',
  });
  return r;
}

const doc: FlexaNode = {
  id: 'root',
  type: 'test/plain',
  settings: {},
  children: [
    { id: 'h', type: 'test/heading', settings: { text: 'Hello' }, children: [] },
    {
      id: 'c',
      type: 'test/card',
      settings: { title: 'Buy now', body: '', bg: '#fff', anchor: 'top' },
      children: [],
    },
    { id: 'h2', type: 'test/heading', settings: {}, children: [] },
    { id: 'x', type: 'unknown/type', settings: { text: 'skip' }, children: [] },
  ],
};

describe('i18n string translation (Phase 6, WPML/Polylang step 2)', () => {
  it('stringName is a stable node.key id', () => {
    expect(stringName('n1', 'text')).toBe('n1.text');
  });

  it('translatableKeys: text/textarea in order; color + opted-out anchor excluded', () => {
    const r = registry();
    expect(translatableKeys(r.get('test/card')!)).toEqual(['title', 'body']);
    expect(translatableKeys(r.get('test/heading')!)).toEqual(['text']);
    expect(translatableKeys(r.get('test/plain')!)).toEqual([]);
  });

  it('collectStrings: only non-empty carried text, pre-order; defaults never collected', () => {
    expect(collectStrings(doc, registry())).toEqual([
      { name: 'h.text', value: 'Hello' },
      { name: 'c.title', value: 'Buy now' },
    ]);
  });

  it('applyTranslations swaps every collected string via the translator', () => {
    const out = applyTranslations(doc, registry(), (_name, value) => `[${value}]`);
    expect(out.children[0]!.settings.text).toBe('[Hello]');
    expect(out.children[1]!.settings.title).toBe('[Buy now]');
    expect(out.children[1]!.settings.body).toBe(''); // empty left as-is
    expect(out.children[1]!.settings.bg).toBe('#fff'); // non-text untouched
    expect(out.children[1]!.settings.anchor).toBe('top'); // opted out
    expect(out.children[3]!.settings.text).toBe('skip'); // unknown type passes through
  });

  it('applyTranslations is pure — the source tree is not mutated', () => {
    applyTranslations(doc, registry(), () => 'MUT');
    expect(doc.children[0]!.settings.text).toBe('Hello');
  });

  it('applyTranslations receives the registration name', () => {
    const seen: string[] = [];
    applyTranslations(doc, registry(), (name, value) => {
      seen.push(name);
      return value;
    });
    expect(seen).toEqual(['h.text', 'c.title']);
  });
});
