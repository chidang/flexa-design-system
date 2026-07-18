/**
 * Gate: the showcase registry is coherent — unique slugs, every `enums` entry is
 * one of the shared canonical unions (never a re-typed literal), and every
 * `contract.heading` resolves to a real heading in the SSOT markdown.
 */
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { FLEXA_UI_COMPONENTS, UI_CATEGORIES } from '../src/registry';
import {
  SHOWCASE_GRID_COLS,
  SHOWCASE_LAUNCH,
  SHOWCASE_READABLE,
  SHOWCASE_WIDE,
} from '../src/showcase-layout';
import * as ENUMS from '../src/enums';

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const CANON_UNIONS = Object.values(ENUMS).filter(Array.isArray) as unknown as readonly string[][];
const CATEGORY_IDS = new Set(UI_CATEGORIES.map((c) => c.id));

function isSharedUnion(values: readonly string[]): boolean {
  return CANON_UNIONS.some(
    (u) => u.length === values.length && u.every((v, i) => v === values[i]),
  );
}

/** Heading lines of a doc under ui-kit/. */
function headings(doc: string): string[] {
  const md = readFileSync(join(REPO_ROOT, 'ui-kit', doc), 'utf8');
  return md.split('\n').filter((l) => /^#{1,6}\s/.test(l));
}

describe('showcase-registry', () => {
  it('slugs are unique', () => {
    const slugs = FLEXA_UI_COMPONENTS.map((c) => c.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it('every component sits in a known category', () => {
    for (const c of FLEXA_UI_COMPONENTS) expect(CATEGORY_IDS).toContain(c.category);
  });

  it('every enum in a spec is a shared canonical union', () => {
    for (const c of FLEXA_UI_COMPONENTS) {
      for (const [name, values] of Object.entries(c.enums ?? {})) {
        expect(isSharedUnion(values), `${c.slug}.${name} is not a shared enum union`).toBe(true);
      }
    }
  });

  it('every contract heading resolves in its SSOT doc', () => {
    for (const c of FLEXA_UI_COMPONENTS) {
      if (!c.contract) continue;
      const found = headings(c.contract.doc).some((h) => h.includes(c.contract!.heading));
      expect(found, `${c.slug}: heading "${c.contract.heading}" not in ${c.contract.doc}`).toBe(true);
    }
  });

  it('has at least the seed component', () => {
    expect(FLEXA_UI_COMPONENTS.length).toBeGreaterThan(0);
  });

  it('every showcase-layout slug exists in the registry', () => {
    const slugs = new Set(FLEXA_UI_COMPONENTS.map((c) => c.slug));
    const referenced = [
      ...SHOWCASE_LAUNCH,
      ...SHOWCASE_WIDE,
      ...SHOWCASE_READABLE,
      ...SHOWCASE_GRID_COLS.keys(),
    ];
    for (const slug of referenced) {
      expect(slugs.has(slug), `showcase-layout references unknown slug "${slug}"`).toBe(true);
    }
  });

  it('wide and readable placements are disjoint', () => {
    for (const slug of SHOWCASE_WIDE) {
      expect(SHOWCASE_READABLE.has(slug), `"${slug}" is both wide and readable`).toBe(false);
    }
  });
});
