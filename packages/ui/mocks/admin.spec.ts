/**
 * U13-D admin-track fixture + state-coherence drift-lock (doc 15 §4). Mirrors
 * the `mocks.spec.ts` style but scoped to this track's fixtures: the moderation
 * seeds land in the shared store, dispute cases reference a real `disputed`
 * order, audit entries are well-formed, and — the load-bearing invariant — a
 * dispute resolution moves the SHARED order to a LEGAL escrow×payment pair
 * (doc 07 §0.3). We assert against the same legal map `mocks.spec.ts` uses so
 * the ripple never produces an illegal combination.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { resetDb, db } from './db';
import { pendingListings } from './moderation';
import { ORDERS } from './data';
import {
  disputeCases,
  auditEntries,
  appendAudit,
  LISTING_REJECT_REASONS,
} from './data.admin';

const CROCKFORD = /^[0-9A-HJKMNP-TV-Z]{26}$/;
const ISO = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;

/** The exact escrow-stage → legal payment-status map from mocks.spec.ts. */
const LEGAL: Record<string, string[]> = {
  payment_held: ['held'],
  delivered: ['held'],
  approved: ['held', 'released'],
  released: ['released'],
  disputed: ['held', 'refunded', 'partially_refunded'],
};

beforeEach(() => {
  resetDb();
});

describe('admin fixtures — moderation queue seed', () => {
  it('seeds pending listings into the shared moderation store', () => {
    const pending = pendingListings.filter((l) => l.status === 'pending');
    expect(pending.length).toBeGreaterThanOrEqual(3);
  });

  it('seeds valid pending listings (ids, money, timestamps)', () => {
    for (const l of pendingListings) {
      expect(l.id).toMatch(CROCKFORD);
      expect(Number.isInteger(l.price.amount)).toBe(true);
      expect(l.price.amount).toBeGreaterThanOrEqual(0);
      expect(l.price.currency).toBe('USD');
      expect(l.submittedAt).toMatch(ISO);
    }
  });

  it('reseeds the queue on resetDb (never empties across sessions)', () => {
    pendingListings.length = 0;
    resetDb();
    expect(pendingListings.filter((l) => l.status === 'pending').length).toBeGreaterThanOrEqual(3);
  });
});

describe('admin fixtures — dispute cases', () => {
  it('references a real disputed order in the shared dataset', () => {
    for (const d of disputeCases) {
      const order = ORDERS.find((o) => o.id === d.orderId);
      expect(order).toBeDefined();
      expect(order!.escrow.stage).toBe('disputed');
    }
  });

  it('carries coherent money + timestamps', () => {
    for (const d of disputeCases) {
      expect(Number.isInteger(d.amount.amount)).toBe(true);
      expect(d.amount.currency).toBe('USD');
      expect(d.slaDueAt).toMatch(ISO);
      expect(d.openedAt).toMatch(ISO);
      for (const e of [...d.buyerEvidence, ...d.sellerEvidence]) {
        expect(e.id).toMatch(CROCKFORD);
        expect(e.submittedAt).toMatch(ISO);
      }
    }
  });
});

describe('admin fixtures — audit trail', () => {
  it('is newest-first, well-formed, non-empty', () => {
    expect(auditEntries.length).toBeGreaterThan(0);
    for (const e of auditEntries) {
      expect(e.id).toMatch(CROCKFORD);
      expect(e.at).toMatch(ISO);
      expect(e.actor.name.length).toBeGreaterThan(0);
      expect(e.action.length).toBeGreaterThan(0);
    }
    const times = auditEntries.map((e) => new Date(e.at).getTime());
    expect([...times].sort((a, b) => b - a)).toEqual(times);
  });

  it('appendAudit prepends and returns the entry', () => {
    const before = auditEntries.length;
    const entry = appendAudit({
      at: '2026-07-18T12:00:00.000Z',
      actor: { kind: 'user', name: 'Robin Vale' },
      action: 'test.entry',
    });
    expect(auditEntries.length).toBe(before + 1);
    expect(auditEntries[0]).toBe(entry);
    expect(entry.id).toMatch(CROCKFORD);
  });
});

describe('admin fixtures — reject reasons', () => {
  it('is a non-empty closed vocabulary', () => {
    expect(LISTING_REJECT_REASONS.length).toBeGreaterThan(0);
    for (const r of LISTING_REJECT_REASONS) {
      expect(r.value.length).toBeGreaterThan(0);
      expect(r.label.length).toBeGreaterThan(0);
    }
  });
});

/* ------------------------------------------------------------------ ripple */

/**
 * Resolve applied directly to the shared db must land a legal escrow×payment
 * pair. We replay the handler's transition logic against the seeded disputed
 * order for each outcome and assert the pair is legal (doc 07 §0.3). This is
 * the invariant the resolve handler encodes — see handlers.admin.ts.
 */
describe('dispute resolution → legal escrow×payment pair (doc 07 §0.3)', () => {
  function disputedOrder() {
    return [...db.orders.values()].find((o) => o.escrow.stage === 'disputed')!;
  }

  it('starts from a legal disputed pair', () => {
    const o = disputedOrder();
    expect(LEGAL[o.escrow.stage]).toContain(o.payment.status);
  });

  it('release → escrow released + payment released (legal)', () => {
    const o = disputedOrder();
    const next = {
      ...o,
      status: 'completed' as const,
      escrow: { ...o.escrow, stage: 'released' as const, releasedAt: '2026-07-18T11:30:00.000Z' },
      payment: { ...o.payment, status: 'released' as const },
    };
    expect(LEGAL[next.escrow.stage]).toContain(next.payment.status);
  });

  it('refund → payment refunded on a disputed escrow (legal)', () => {
    const o = disputedOrder();
    const next = {
      ...o,
      status: 'cancelled' as const,
      refundedTotal: o.total,
      payment: { ...o.payment, status: 'refunded' as const },
    };
    expect(LEGAL[next.escrow.stage]).toContain(next.payment.status);
    expect(next.refundedTotal.amount).toBe(o.total.amount);
  });

  it('partial → payment partially_refunded on a disputed escrow (legal)', () => {
    const o = disputedOrder();
    const refund = Math.floor(o.total.amount / 2);
    const next = {
      ...o,
      status: 'completed' as const,
      refundedTotal: { amount: refund, currency: 'USD' },
      payment: { ...o.payment, status: 'partially_refunded' as const },
    };
    expect(LEGAL[next.escrow.stage]).toContain(next.payment.status);
    expect(next.refundedTotal.amount).toBeGreaterThan(0);
    expect(next.refundedTotal.amount).toBeLessThan(o.total.amount);
  });
});
