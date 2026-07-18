import { describe, expect, it } from 'vitest';
import { documentSchema } from '../src/index.js';

const base = {
  id: 'd1',
  kind: 'page',
  title: 'T',
  version: 1,
  tree: { id: 'r', type: 'flexa/root', settings: {}, children: [] },
};

describe('documentSchema — envelope + node structure (§1b/§1c)', () => {
  it('accepts a well-formed document with a nested tree', () => {
    const r = documentSchema.safeParse({
      ...base,
      tree: {
        id: 'r',
        type: 'flexa/root',
        settings: {},
        children: [{ id: 'c', type: 'acme/x', settings: { text: 'hi' }, children: [] }],
      },
    });
    expect(r.success).toBe(true);
  });

  it('accepts an optional positive-integer schemaVersion, rejects zero', () => {
    expect(documentSchema.safeParse({ ...base, schemaVersion: 1 }).success).toBe(true);
    expect(documentSchema.safeParse({ ...base }).success).toBe(true); // absent is fine
    expect(documentSchema.safeParse({ ...base, schemaVersion: 0 }).success).toBe(false);
  });

  it('accepts an optional node-level meta object (EP-2 provenance), rejects non-object', () => {
    const withMeta = {
      ...base,
      tree: {
        id: 'r',
        type: 'flexa/root',
        settings: {},
        children: [
          {
            id: 'c',
            type: 'acme/x',
            settings: {},
            children: [],
            meta: { source: 'figma', layerId: '1:2', confidence: 0.9, tags: ['a'] },
          },
        ],
      },
    };
    const r = documentSchema.safeParse(withMeta);
    expect(r.success).toBe(true);
    // Declared passthrough survives the parse verbatim (not stripped).
    if (r.success) {
      const child = (r.data.tree as { children: { meta?: unknown }[] }).children[0];
      expect(child?.meta).toEqual({ source: 'figma', layerId: '1:2', confidence: 0.9, tags: ['a'] });
    }
    const badMeta = { ...withMeta, tree: { ...withMeta.tree, children: [{ id: 'c', type: 'acme/x', settings: {}, children: [], meta: 'nope' }] } };
    expect(documentSchema.safeParse(badMeta).success).toBe(false);
  });

  it('rejects an unknown kind and a node missing children', () => {
    expect(documentSchema.safeParse({ ...base, kind: 'widget' }).success).toBe(false);
    expect(
      documentSchema.safeParse({ ...base, tree: { id: 'r', type: 'x', settings: {} } }).success,
    ).toBe(false);
  });
});
