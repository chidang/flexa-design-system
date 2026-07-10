import { describe, it, expect } from 'vitest';
import { resolvedTokens } from 'flexa-fds-export';
import { hasToken } from 'flexa-design-system';
import {
  completeToken,
  describeToken,
  diagnoseToken,
  suggestTokens,
  tokenInfos,
} from '../src/index.js';

describe('completeToken', () => {
  it('ranks whole-id prefixes ahead of segment prefixes and substrings', () => {
    const rows = completeToken('color.pri');
    expect(rows.length).toBeGreaterThan(0);
    // every hit must actually match, and ranks must be sorted ascending
    for (const r of rows) expect(r.id.toLowerCase()).toContain('color.pri');
    const ranks = rows.map((r) => r.rank);
    expect([...ranks].sort((a, b) => a - b)).toEqual(ranks);
    expect(rows[0]!.rank).toBe(0);
    expect(rows.some((r) => r.id === 'color.primary')).toBe(true);
  });

  it('is case-insensitive and trims the query', () => {
    const a = completeToken('  COLOR.Primary  ');
    expect(a.some((r) => r.id === 'color.primary')).toBe(true);
  });

  it('matches a bare segment (rank 1) — e.g. "primary" finds color.primary', () => {
    const rows = completeToken('primary');
    const primary = rows.find((r) => r.id === 'color.primary');
    expect(primary).toBeDefined();
    expect(primary!.rank).toBe(1);
  });

  it('empty query returns every token at rank 0 (capped by limit)', () => {
    const all = completeToken('', 5000);
    expect(all.length).toBe(tokenInfos().length);
    expect(all.every((r) => r.rank === 0)).toBe(true);
    expect(completeToken('', 3).length).toBe(3);
  });

  it('carries the resolved literal and mapped type on each completion', () => {
    const resolved = new Map(resolvedTokens().map((t) => [t.id, t]));
    for (const c of completeToken('', 5000)) {
      const r = resolved.get(c.id)!;
      const expected = typeof r.value === 'string' ? r.value : JSON.stringify(r.value);
      expect(c.value).toBe(expected);
      expect(c.type).toBe(r.type);
    }
  });
});

describe('describeToken', () => {
  it('returns facts for a known token and null otherwise', () => {
    const info = describeToken('color.primary');
    expect(info).not.toBeNull();
    expect(info!.cssVar).toBe('--fx-color-primary');
    expect(info!.type).toBe('color');
    expect(info!.value).toMatch(/^#[0-9a-fA-F]{3,8}$/);
    expect(describeToken('color.nope')).toBeNull();
    expect(describeToken('1rem')).toBeNull();
  });

  it('never surfaces an unresolved alias or var() in a value (dogfood)', () => {
    // A composite (typography) value is legitimate one-line JSON; the thing that
    // must never survive is a DTCG `{ref.brand.600}` reference or a CSS var().
    for (const info of tokenInfos()) {
      expect(info.value).not.toMatch(/\{[a-z0-9.-]+\}/);
      expect(info.value).not.toContain('var(');
    }
  });
});

describe('suggestTokens', () => {
  it('repairs a typo within the same namespace, best first', () => {
    const s = suggestTokens('color.primry');
    expect(s[0]).toBe('color.primary');
    expect(s.every((id) => id.startsWith('color.'))).toBe(true);
    expect(s.length).toBeLessThanOrEqual(5);
  });

  it('stays inside the queried namespace (no cross-namespace bleed)', () => {
    for (const id of suggestTokens('space.a-lot')) expect(id.startsWith('space')).toBe(true);
  });
});

describe('diagnoseToken', () => {
  it('passes a real token', () => {
    expect(diagnoseToken('color.primary')).toBeNull();
    expect(diagnoseToken('space.4')).toBeNull();
  });

  it('ignores plain literals outside every reserved namespace', () => {
    expect(diagnoseToken('#ffffff')).toBeNull();
    expect(diagnoseToken('1rem')).toBeNull();
    expect(diagnoseToken('myplugin.brand')).toBeNull();
  });

  it('flags an off-system id in a reserved namespace with repair suggestions', () => {
    const d = diagnoseToken('color.primry');
    expect(d).not.toBeNull();
    expect(d!.severity).toBe('error');
    expect(d!.message).toContain('reserved namespace "color"');
    expect(d!.message).toContain('color.primary');
    expect(d!.suggestions[0]).toBe('color.primary');
  });

  it('flags a bogus primitive under ref.* too', () => {
    const d = diagnoseToken('ref.brand.999');
    expect(d).not.toBeNull();
    expect(hasToken('ref.brand.999')).toBe(false);
  });
});
