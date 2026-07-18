import { describe, expect, it } from 'vitest';
import { evalWhen, whenRefs, unknownWhenOperators } from '../src/index.js';
import type { WhenCondition } from '../src/index.js';

describe('evalWhen (conditional control visibility)', () => {
  it('undefined condition → always visible', () => {
    expect(evalWhen(undefined, {})).toBe(true);
    expect(evalWhen(undefined, { a: 1 })).toBe(true);
  });

  it('scalar clause = equality', () => {
    expect(evalWhen({ customCurrency: true }, { customCurrency: true })).toBe(true);
    expect(evalWhen({ customCurrency: true }, { customCurrency: false })).toBe(false);
    expect(evalWhen({ variant: 'outline' }, { variant: 'outline' })).toBe(true);
    expect(evalWhen({ variant: 'outline' }, { variant: 'solid' })).toBe(false);
  });

  it('missing value → scalar eq fails', () => {
    expect(evalWhen({ customCurrency: true }, {})).toBe(false);
    expect(evalWhen({ customCurrency: undefined }, {})).toBe(true); // clause undefined = skipped
  });

  it('array clause = one-of (in)', () => {
    expect(evalWhen({ currency: ['USD', 'EUR'] }, { currency: 'EUR' })).toBe(true);
    expect(evalWhen({ currency: ['USD', 'EUR'] }, { currency: 'VND' })).toBe(false);
  });

  it('operator: ne', () => {
    expect(evalWhen({ variant: { ne: 'text' } }, { variant: 'solid' })).toBe(true);
    expect(evalWhen({ variant: { ne: 'text' } }, { variant: 'text' })).toBe(false);
  });

  it('operator: in / nin', () => {
    expect(evalWhen({ size: { in: ['md', 'lg'] } }, { size: 'md' })).toBe(true);
    expect(evalWhen({ size: { in: ['md', 'lg'] } }, { size: 'sm' })).toBe(false);
    expect(evalWhen({ size: { nin: ['sm'] } }, { size: 'md' })).toBe(true);
    expect(evalWhen({ size: { nin: ['sm'] } }, { size: 'sm' })).toBe(false);
  });

  it('operator: numeric gt/gte/lt/lte', () => {
    expect(evalWhen({ price: { gt: 100 } }, { price: 101 })).toBe(true);
    expect(evalWhen({ price: { gt: 100 } }, { price: 100 })).toBe(false);
    expect(evalWhen({ price: { gte: 100 } }, { price: 100 })).toBe(true);
    expect(evalWhen({ price: { lt: 100 } }, { price: 99 })).toBe(true);
    expect(evalWhen({ price: { lte: 100 } }, { price: 100 })).toBe(true);
    expect(evalWhen({ price: { lte: 100 } }, { price: 101 })).toBe(false);
  });

  it('numeric operator against a non-number value → fails', () => {
    expect(evalWhen({ price: { gt: 100 } }, { price: 'lots' })).toBe(false);
    expect(evalWhen({ price: { gt: 100 } }, {})).toBe(false);
  });

  it('operator: truthy true/false', () => {
    expect(evalWhen({ note: { truthy: true } }, { note: 'hi' })).toBe(true);
    expect(evalWhen({ note: { truthy: true } }, { note: '' })).toBe(false);
    expect(evalWhen({ note: { truthy: false } }, { note: '' })).toBe(true);
    expect(evalWhen({ note: { truthy: false } }, { note: 'hi' })).toBe(false);
  });

  it('multiple operators in one clause = AND', () => {
    const cond: WhenCondition = { price: { gte: 10, lte: 100 } };
    expect(evalWhen(cond, { price: 50 })).toBe(true);
    expect(evalWhen(cond, { price: 5 })).toBe(false);
    expect(evalWhen(cond, { price: 200 })).toBe(false);
  });

  it('multiple keys = AND', () => {
    const cond: WhenCondition = { variant: { ne: 'text' }, size: { in: ['md', 'lg'] } };
    expect(evalWhen(cond, { variant: 'solid', size: 'lg' })).toBe(true);
    expect(evalWhen(cond, { variant: 'text', size: 'lg' })).toBe(false);
    expect(evalWhen(cond, { variant: 'solid', size: 'sm' })).toBe(false);
  });

  it('any = OR group', () => {
    const cond: WhenCondition = { any: [{ plan: 'pro' }, { featured: true }] };
    expect(evalWhen(cond, { plan: 'pro', featured: false })).toBe(true);
    expect(evalWhen(cond, { plan: 'free', featured: true })).toBe(true);
    expect(evalWhen(cond, { plan: 'free', featured: false })).toBe(false);
  });

  it('empty any group → false', () => {
    expect(evalWhen({ any: [] }, {})).toBe(false);
  });

  it('any AND with a sibling key', () => {
    const cond: WhenCondition = { enabled: true, any: [{ plan: 'pro' }, { featured: true }] };
    expect(evalWhen(cond, { enabled: true, plan: 'pro' })).toBe(true);
    expect(evalWhen(cond, { enabled: false, plan: 'pro' })).toBe(false);
    expect(evalWhen(cond, { enabled: true, plan: 'free', featured: false })).toBe(false);
  });

  it('deep equality for array / object values', () => {
    expect(evalWhen({ tags: { eq: ['a', 'b'] } }, { tags: ['a', 'b'] })).toBe(true);
    expect(evalWhen({ tags: { eq: ['a', 'b'] } }, { tags: ['a', 'c'] })).toBe(false);
    expect(evalWhen({ meta: { eq: { x: 1 } } }, { meta: { x: 1 } })).toBe(true);
    expect(evalWhen({ meta: { eq: { x: 1 } } }, { meta: { x: 2 } })).toBe(false);
  });
});

describe('whenRefs / unknownWhenOperators', () => {
  it('collects sibling refs, recursing into any', () => {
    expect(whenRefs({ a: 1, b: { gt: 2 } }).sort()).toEqual(['a', 'b']);
    expect(whenRefs({ any: [{ plan: 'pro' }, { featured: true }] }).sort()).toEqual([
      'featured',
      'plan',
    ]);
    expect(whenRefs(undefined)).toEqual([]);
  });

  it('flags unknown operator keys (typos), recursing into any', () => {
    expect(unknownWhenOperators({ a: { gth: 2 } })).toEqual(['gth']);
    expect(unknownWhenOperators({ a: { gt: 2 } })).toEqual([]);
    expect(unknownWhenOperators({ any: [{ a: { nope: 1 } }] })).toEqual(['nope']);
    // arrays and scalars are not operator clauses → no false positives
    expect(unknownWhenOperators({ a: ['x'], b: 'y' })).toEqual([]);
  });
});
