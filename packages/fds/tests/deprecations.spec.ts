import { describe, it, expect } from 'vitest';
import {
  DEPRECATIONS,
  assertDeprecationsValid,
  renameMap,
  removalsInMajor,
  isDeprecated,
  deprecationOf,
  deprecatedRenameMap,
  DeprecationError,
  hasToken,
  type TokenDeprecation,
} from '../src/index.js';

/**
 * The deprecation registry (Track H, doc 20) — the machine-readable half of INV-6.
 * The guard's honesty is validated against synthetic lists (so the tests do not
 * depend on any token actually being deprecated), and the LIVE list is asserted to
 * pass that same guard — which today means it is empty, the only honest state.
 */

// Two real tokens to build synthetic deprecations from — read from the registry.
const OLD = 'color.secondary';
const NEW = 'color.primary';

describe('DEPRECATIONS — the live list', () => {
  it('is empty today: the design system has only ever added tokens', () => {
    expect(DEPRECATIONS).toEqual([]);
    expect(deprecatedRenameMap()).toEqual({});
    expect(isDeprecated(NEW)).toBe(false);
    expect(deprecationOf(NEW)).toBeUndefined();
  });

  it('passes its own load-time guard against the real registry', () => {
    // index.ts already runs this at import; assert it explicitly too.
    expect(() => assertDeprecationsValid(DEPRECATIONS, hasToken)).not.toThrow();
  });
});

describe('assertDeprecationsValid — keeps every entry honest', () => {
  const good: TokenDeprecation = { id: OLD, replacement: NEW, since: '2.9.0', removeIn: '3.0.0' };

  it('accepts a well-formed entry between two real tokens', () => {
    expect(() => assertDeprecationsValid([good], hasToken)).not.toThrow();
  });

  it('refuses a replacement that is not a registry token', () => {
    const bad = { ...good, replacement: 'color.does-not-exist' };
    expect(() => assertDeprecationsValid([bad], hasToken)).toThrow(DeprecationError);
    expect(() => assertDeprecationsValid([bad], hasToken)).toThrow(/not a registry token/);
  });

  it('refuses a deprecated id that is no longer in the registry (alias dropped too early)', () => {
    const bad = { ...good, id: 'color.gone' };
    expect(() => assertDeprecationsValid([bad], hasToken)).toThrow(/must stay aliased/);
  });

  it('refuses a self-referential deprecation', () => {
    const bad = { ...good, replacement: OLD };
    expect(() => assertDeprecationsValid([bad], hasToken)).toThrow(/points at itself/);
  });

  it('refuses a removeIn that is not a later major than since', () => {
    const bad = { ...good, since: '3.0.0', removeIn: '3.4.0' };
    expect(() => assertDeprecationsValid([bad], hasToken)).toThrow(/not a later major/);
  });

  it('refuses an unparseable version', () => {
    const bad = { ...good, removeIn: 'next' };
    expect(() => assertDeprecationsValid([bad], hasToken)).toThrow(/unparseable version/);
  });

  it('refuses the same id deprecated twice', () => {
    expect(() => assertDeprecationsValid([good, good], hasToken)).toThrow(/more than once/);
  });
});

describe('renameMap / removalsInMajor — feed the codemod + migration notes', () => {
  const list: TokenDeprecation[] = [
    { id: OLD, replacement: NEW, since: '2.9.0', removeIn: '3.0.0' },
    { id: 'color.on-secondary', replacement: 'color.on-primary', since: '2.9.0', removeIn: '4.0.0' },
  ];

  it('renameMap is the { oldId: replacement } shape flexa-fds-codemod consumes', () => {
    expect(renameMap(list)).toEqual({
      [OLD]: NEW,
      'color.on-secondary': 'color.on-primary',
    });
  });

  it('removalsInMajor selects only the tokens leaving in that major', () => {
    expect(removalsInMajor(list, 3).map((d) => d.id)).toEqual([OLD]);
    expect(removalsInMajor(list, 4).map((d) => d.id)).toEqual(['color.on-secondary']);
    expect(removalsInMajor(list, 5)).toEqual([]);
  });
});
