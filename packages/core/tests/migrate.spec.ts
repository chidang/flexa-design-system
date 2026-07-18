import { describe, expect, it } from 'vitest';
import {
  defineElement,
  DOCUMENT_SCHEMA_VERSION,
  migrateDocument,
  MigrationRegistry,
  type FlexaDocument,
  type FlexaNode,
} from '../src/index.js';

const manifestV3 = defineElement({
  type: 'acme/card',
  title: 'Card',
  version: 3,
  schema: { heading: { type: 'text', default: '' } },
  template: '<div>{{heading}}</div>',
});

describe('MigrationRegistry (khung Phase 0)', () => {
  it('migrate chuỗi v1→v2→v3', () => {
    const mig = new MigrationRegistry();
    mig.add('acme/card', 1, (s) => ({ ...s, title2: s['title'] ?? '' }));
    mig.add('acme/card', 2, (s) => {
      const { title2, ...rest } = s;
      return { ...rest, heading: title2 ?? '' };
    });

    const node: FlexaNode = { id: 'n1', type: 'acme/card', settings: { title: 'Hi' }, children: [], v: 1 };
    const out = mig.migrateNode(node, manifestV3);
    expect(out.v).toBe(3);
    expect(out.settings['heading']).toBe('Hi');
    expect(node.settings['title']).toBe('Hi'); // immutable — không sửa node cũ
  });

  it('thiếu bước migration → lỗi cứng, không âm thầm render sai', () => {
    const mig = new MigrationRegistry();
    mig.add('acme/card', 1, (s) => s);
    const node: FlexaNode = { id: 'n1', type: 'acme/card', settings: {}, children: [], v: 1 };
    expect(() => mig.migrateNode(node, manifestV3)).toThrow(/Missing migration/);
  });

  it('node cùng version → trả nguyên node', () => {
    const mig = new MigrationRegistry();
    const node: FlexaNode = { id: 'n1', type: 'acme/card', settings: {}, children: [], v: 3 };
    expect(mig.migrateNode(node, manifestV3)).toBe(node);
  });
});

describe('migrateDocument — envelope format version (AI-readiness §1c)', () => {
  const doc = (schemaVersion?: number): FlexaDocument => ({
    id: 'd1',
    kind: 'page',
    title: 'T',
    version: 1,
    schemaVersion,
    tree: { id: 'r', type: 'flexa/root', settings: {}, children: [] },
  });

  it('stamps a missing schemaVersion to the current build version (back-compat)', () => {
    const out = migrateDocument(doc());
    expect(out.schemaVersion).toBe(DOCUMENT_SCHEMA_VERSION);
  });

  it('returns the same document unchanged when already current', () => {
    const d = doc(DOCUMENT_SCHEMA_VERSION);
    expect(migrateDocument(d)).toBe(d);
  });

  it('a version newer than this build is a hard error, never a silent downgrade', () => {
    expect(() => migrateDocument(doc(DOCUMENT_SCHEMA_VERSION + 1))).toThrow(/newer than this build/);
  });
});
