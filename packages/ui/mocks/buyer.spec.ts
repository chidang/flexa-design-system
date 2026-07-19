/**
 * Buyer-track fixture drift-lock (U13-B, doc 15 §4). Mirrors `mocks.spec.ts`:
 * guards the invariants the buyer reference screens depend on — deterministic
 * Crockford ids, ISO-8601 UTC timestamps, integer minor-unit Money, legal
 * payment statuses (doc 07 §0.1) on the wallet ledger, and coherent references
 * from notifications / transactions / reviews back to real order ids in ./data.
 */
import { describe, it, expect } from 'vitest';
import { ORDERS } from './data';
import {
  BUYER_NOTIFICATIONS_SEED,
  WALLET_TRANSACTIONS_SEED,
  OWN_REVIEWS_SEED,
  buyerPaymentMethodsSeed,
  notificationGroup,
  reviewablePredicate,
} from './data.buyer';

const CROCKFORD = /^[0-9A-HJKMNP-TV-Z]{26}$/;
const ISO = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
const ORDER_IDS = new Set(ORDERS.map((o) => o.id));

describe('buyer fixtures — notifications', () => {
  it('mints Crockford ids and ISO-8601 UTC timestamps', () => {
    for (const n of BUYER_NOTIFICATIONS_SEED) {
      expect(n.id).toMatch(CROCKFORD);
      expect(n.createdAt).toMatch(ISO);
      if (n.readAt != null) expect(n.readAt).toMatch(ISO);
    }
  });

  it('has unread rows to drive the attention surfaces', () => {
    expect(BUYER_NOTIFICATIONS_SEED.some((n) => n.readAt == null)).toBe(true);
  });

  it('classifies every type into a real tab group', () => {
    for (const n of BUYER_NOTIFICATIONS_SEED) {
      expect(['orders', 'messages', 'system']).toContain(notificationGroup(n.type));
    }
  });

  it('deep-links order events to real order ids', () => {
    for (const n of BUYER_NOTIFICATIONS_SEED) {
      const match = n.linkUrl.match(/#\/screens\/orders\/(.+)$/);
      if (match) expect(ORDER_IDS.has(match[1]!)).toBe(true);
    }
  });
});

describe('buyer fixtures — wallet', () => {
  it('is integer minor-unit Money with a legal payment status', () => {
    const legal = ['released', 'refunded', 'partially_refunded'];
    for (const t of WALLET_TRANSACTIONS_SEED) {
      expect(Number.isInteger(t.amount.amount)).toBe(true);
      expect(t.amount.currency).toBe('USD');
      expect(legal).toContain(t.status);
    }
  });

  it('signs charges negative and credits positive', () => {
    const charges = WALLET_TRANSACTIONS_SEED.filter((t) => t.status === 'released');
    const credits = WALLET_TRANSACTIONS_SEED.filter((t) => t.status === 'refunded');
    for (const c of charges) expect(c.amount.amount).toBeLessThan(0);
    for (const c of credits) expect(c.amount.amount).toBeGreaterThan(0);
  });

  it('links ledger rows to real orders', () => {
    for (const t of WALLET_TRANSACTIONS_SEED) {
      if (t.orderId != null) expect(ORDER_IDS.has(t.orderId)).toBe(true);
    }
  });

  it('seeds fresh payment methods with exactly one default', () => {
    const methods = buyerPaymentMethodsSeed();
    expect(methods.length).toBeGreaterThan(0);
    expect(methods.filter((m) => m.isDefault)).toHaveLength(1);
    // Fresh copies — mutating one seed does not bleed into the next.
    methods[0]!.isDefault = false;
    expect(buyerPaymentMethodsSeed().filter((m) => m.isDefault)).toHaveLength(1);
  });
});

describe('buyer fixtures — reviews', () => {
  it('mints ids/timestamps and clamps rating to 1–5', () => {
    for (const r of OWN_REVIEWS_SEED) {
      expect(r.id).toMatch(CROCKFORD);
      expect(r.createdAt).toMatch(ISO);
      expect(r.editableUntil).toMatch(ISO);
      expect(r.rating).toBeGreaterThanOrEqual(1);
      expect(r.rating).toBeLessThanOrEqual(5);
    }
  });

  it('only reviews orders that pass the reviewable predicate', () => {
    const byId = new Map(ORDERS.map((o) => [o.id, o]));
    for (const r of OWN_REVIEWS_SEED) {
      const order = byId.get(r.orderId);
      expect(order).toBeDefined();
      expect(reviewablePredicate(order!)).toBe(true);
    }
  });

  it('keeps at most one review per order', () => {
    const ids = OWN_REVIEWS_SEED.map((r) => r.orderId);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
