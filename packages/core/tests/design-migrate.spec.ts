import { describe, expect, it } from 'vitest';
import {
  DESIGN_STATE_VERSION,
  defaultTheme,
  migrateDesignState,
  runDesignStateMigrations,
  validateDesignState,
  type DesignStateMigration,
} from '../src/index.js';

/**
 * Contract tests for the design-state migration seam (doc 13, S2). The chain is
 * empty at v1, so `migrateDesignState` is exercised as identity and the chain
 * mechanics (order, stamping, missing-step passthrough) are locked through
 * `runDesignStateMigrations` with a synthetic chain — the same runner production
 * uses, so a future v2 step inherits tested semantics instead of inventing them.
 */
describe('migrateDesignState (v1 — identity)', () => {
  it('returns a current-version state by reference (idempotent)', () => {
    const state = { schemaVersion: DESIGN_STATE_VERSION, theme: defaultTheme() };
    expect(migrateDesignState(state)).toBe(state);
  });

  it('passes garbage through unchanged for the validator to reject', () => {
    for (const garbage of [null, undefined, 'x', 42, [], { theme: {} }, { schemaVersion: 'one' }]) {
      expect(migrateDesignState(garbage)).toBe(garbage);
    }
  });

  it('passes a NEWER version through unchanged (never downgrades)', () => {
    const future = { schemaVersion: DESIGN_STATE_VERSION + 1, theme: defaultTheme() };
    expect(migrateDesignState(future)).toBe(future);
    // …and the validator rejects it with a proper message.
    expect(validateDesignState(migrateDesignState(future)).ok).toBe(false);
  });

  it('migrate → validate round-trips a persisted v1 state', () => {
    const state = { schemaVersion: 1, theme: defaultTheme(), brand: { primaryColor: '#123456' } };
    const result = validateDesignState(migrateDesignState(state));
    expect(result.ok).toBe(true);
  });
});

describe('runDesignStateMigrations (chain mechanics)', () => {
  const step1: DesignStateMigration = (s) => ({ ...s, trail: [...((s.trail as string[]) ?? []), 'v1→v2'] });
  const step2: DesignStateMigration = (s) => ({ ...s, trail: [...((s.trail as string[]) ?? []), 'v2→v3'] });
  const chain = new Map<number, DesignStateMigration>([
    [1, step1],
    [2, step2],
  ]);

  it('applies steps in ascending order and stamps the target version', () => {
    const out = runDesignStateMigrations({ schemaVersion: 1 }, chain, 3) as Record<string, unknown>;
    expect(out.trail).toEqual(['v1→v2', 'v2→v3']);
    expect(out.schemaVersion).toBe(3);
  });

  it('starts mid-chain from the input version', () => {
    const out = runDesignStateMigrations({ schemaVersion: 2 }, chain, 3) as Record<string, unknown>;
    expect(out.trail).toEqual(['v2→v3']);
    expect(out.schemaVersion).toBe(3);
  });

  it('returns the ORIGINAL input when a step is missing (no partial upgrade)', () => {
    const gap = new Map<number, DesignStateMigration>([[2, step2]]);
    const input = { schemaVersion: 1 };
    expect(runDesignStateMigrations(input, gap, 3)).toBe(input);
  });

  it('does not mutate the input', () => {
    const input = { schemaVersion: 1, trail: ['seed'] };
    runDesignStateMigrations(input, chain, 3);
    expect(input).toEqual({ schemaVersion: 1, trail: ['seed'] });
  });
});
