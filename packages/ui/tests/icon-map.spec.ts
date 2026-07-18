/**
 * Gate: every canonical icon name seeded from docs 02/06/08 exists in the map,
 * and every mapped name resolves to a real glyph. A missing name is a build
 * error (doc 13 D-3), never a silent fallback. SEED is the verbatim doc set.
 */
import { describe, expect, it } from 'vitest';
import { ICON_MAP, ICON_NAMES } from '../src/icon/map';

const SEED = [
  'activity', 'back', 'bank', 'bell', 'card', 'chart', 'chat', 'check', 'chevron',
  'close', 'download', 'edit', 'external-link', 'filter', 'grid', 'history', 'home',
  'inherit', 'lock', 'menu', 'more', 'package', 'plus', 'refresh', 'scale', 'search',
  'settings', 'shield-check', 'star', 'tag', 'upload', 'users', 'wallet',
] as const;

describe('icon-map', () => {
  it.each(SEED)('canonical name "%s" is mapped', (name) => {
    expect(ICON_NAMES).toContain(name);
  });

  it('every mapped name resolves to a glyph component', () => {
    for (const name of ICON_NAMES) {
      const glyph = ICON_MAP[name];
      expect(glyph, `icon "${name}" has no glyph`).toBeTruthy();
      expect(['function', 'object']).toContain(typeof glyph);
    }
  });

  it('names are lowercase kebab-case', () => {
    for (const name of ICON_NAMES) expect(name).toMatch(/^[a-z][a-z-]*[a-z]$/);
  });
});
