/**
 * Guards the fixture invariants D-4 / P10 (doc 12) require: deterministic ids,
 * Money as non-negative integer minor units, ISO-8601 timestamps, legal
 * enum combinations (escrow stage ↔ payment status), and the §1.7 collection
 * envelope. If a fixture drifts off these rules the reference screens stop being
 * a faithful proof, so this is the fixture's drift-lock.
 */
import { describe, it, expect } from 'vitest';
import {
  ORDERS,
  LISTINGS,
  SEARCH_CARDS,
  page,
  type Money,
  type Order,
} from './data';
import { ulid, resetIds } from './ids';

const CROCKFORD = /^[0-9A-HJKMNP-TV-Z]{26}$/;

function allMoney(o: Order): Money[] {
  return [o.subtotal, o.fees, o.total, o.refundedTotal, o.escrow.amount, o.payment.amount, ...o.items.map((i) => i.lineTotal), ...o.items.map((i) => i.unitPrice)];
}

describe('fixtures — ids', () => {
  it('mints 26-char Crockford ULIDs', () => {
    resetIds();
    const ids = Array.from({ length: 50 }, () => ulid());
    for (const id of ids) expect(id).toMatch(CROCKFORD);
  });

  it('mints lexically increasing (creation-ordered) ids', () => {
    resetIds();
    const ids = Array.from({ length: 50 }, () => ulid());
    expect([...ids].sort()).toEqual(ids);
  });
});

describe('fixtures — money', () => {
  it('is always a non-negative integer minor-unit object', () => {
    for (const o of ORDERS) {
      for (const m of allMoney(o)) {
        expect(Number.isInteger(m.amount)).toBe(true);
        expect(m.amount).toBeGreaterThanOrEqual(0);
        expect(m.currency).toBe('USD');
      }
    }
    for (const l of LISTINGS) expect(Number.isInteger(l.price.amount)).toBe(true);
  });

  it('keeps order totals coherent (total = subtotal + fees)', () => {
    for (const o of ORDERS) expect(o.total.amount).toBe(o.subtotal.amount + o.fees.amount);
  });
});

describe('fixtures — enum coherence (P10)', () => {
  const legal: Record<string, string[]> = {
    payment_held: ['held'],
    delivered: ['held'],
    approved: ['held', 'released'],
    released: ['released'],
    disputed: ['held', 'refunded', 'partially_refunded'],
  };

  it('pairs every escrow stage with a legal payment status', () => {
    for (const o of ORDERS) {
      expect(legal[o.escrow.stage]).toContain(o.payment.status);
    }
  });

  it('spans the escrow enum across the dataset', () => {
    const stages = new Set(ORDERS.map((o) => o.escrow.stage));
    for (const s of ['payment_held', 'delivered', 'released', 'disputed']) {
      expect(stages.has(s as Order['escrow']['stage'])).toBe(true);
    }
  });
});

describe('fixtures — timestamps & collections', () => {
  it('emits ISO-8601 UTC timestamps ending in Z', () => {
    for (const o of ORDERS) {
      expect(o.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    }
  });

  it('wraps collections with a terminal cursor (§1.7)', () => {
    const p = page(SEARCH_CARDS, SEARCH_CARDS.length);
    expect(p.pageInfo.nextCursor).toBeNull();
    expect(p.pageInfo.hasMore).toBe(false);
    expect(p.data.length).toBe(SEARCH_CARDS.length);
  });
});
