/**
 * U13-C seller fixture coherence (doc 15 §4) — mirrors `mocks.spec.ts` style for
 * the seller-owned data. Guards the invariants the seller screens rely on:
 * deterministic Crockford ids, Money as integer minor units (signed only where a
 * ledger entry is a debit), ISO-8601 timestamps, legal payout statuses, and the
 * seller-scoped order slice that drives the balance derivation. Does NOT edit
 * `mocks.spec.ts`.
 */
import { describe, it, expect } from 'vitest';
import {
  PAYOUT_HISTORY,
  PAYOUT_METHOD,
  SELLER_TRANSACTIONS,
  SALES_TREND_30D,
  SELLER_STORE_ID,
  LIFETIME_PAID_OUT,
  type Payout,
  type PayoutStatus,
} from './data.seller';
import { ORDERS, STORES } from './data';

const CROCKFORD = /^[0-9A-HJKMNP-TV-Z]{26}$/;
const ISO = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
const PAYOUT_STATUSES: PayoutStatus[] = ['requested', 'processing', 'sent', 'failed'];

describe('seller fixtures — identity', () => {
  it('scopes to the first store (the fulfilment-owning persona)', () => {
    expect(SELLER_STORE_ID).toBe(STORES[0]!.id);
  });

  it('owns at least one seeded order in the shared db', () => {
    const mine = ORDERS.filter((o) => o.sellerId === SELLER_STORE_ID);
    expect(mine.length).toBeGreaterThan(0);
  });

  it('has a seeded order needing fulfilment (status paid) for the ripple loop', () => {
    // A `paid` seller order is the entry point of the buy→fulfil ripple (S3).
    const buyerCanBecomeSeller = ORDERS.some((o) => o.status === 'paid');
    expect(buyerCanBecomeSeller).toBe(true);
  });
});

describe('seller fixtures — ids & timestamps', () => {
  it('mints 26-char Crockford ids for payouts and transactions', () => {
    for (const p of PAYOUT_HISTORY) expect(p.id).toMatch(CROCKFORD);
    for (const t of SELLER_TRANSACTIONS) expect(t.id).toMatch(CROCKFORD);
  });

  it('emits ISO-8601 UTC timestamps ending in Z', () => {
    for (const p of PAYOUT_HISTORY) {
      expect(p.requestedAt).toMatch(ISO);
      if (p.sentAt !== null) expect(p.sentAt).toMatch(ISO);
    }
    for (const t of SELLER_TRANSACTIONS) expect(t.createdAt).toMatch(ISO);
  });
});

describe('seller fixtures — money', () => {
  it('keeps payout amounts positive integer minor units', () => {
    for (const p of PAYOUT_HISTORY) {
      expect(Number.isInteger(p.amount.amount)).toBe(true);
      expect(p.amount.amount).toBeGreaterThan(0);
      expect(p.amount.currency).toBe('USD');
    }
    expect(Number.isInteger(LIFETIME_PAID_OUT.amount)).toBe(true);
    expect(LIFETIME_PAID_OUT.amount).toBeGreaterThanOrEqual(0);
  });

  it('signs ledger amounts by direction: sale credits, fee/refund/payout debit', () => {
    for (const t of SELLER_TRANSACTIONS) {
      expect(Number.isInteger(t.amount.amount)).toBe(true);
      if (t.type === 'sale') expect(t.amount.amount).toBeGreaterThan(0);
      else expect(t.amount.amount).toBeLessThan(0);
    }
  });
});

describe('seller fixtures — enums & coherence', () => {
  it('uses only legal payout statuses', () => {
    for (const p of PAYOUT_HISTORY) expect(PAYOUT_STATUSES).toContain(p.status);
  });

  it('pairs a failed payout with a failure code and no sentAt', () => {
    const failed = PAYOUT_HISTORY.filter((p: Payout) => p.status === 'failed');
    for (const p of failed) {
      expect(p.failureCode).not.toBeNull();
      expect(p.sentAt).toBeNull();
    }
  });

  it('pairs a sent payout with a sentAt timestamp', () => {
    const sent = PAYOUT_HISTORY.filter((p) => p.status === 'sent');
    for (const p of sent) expect(p.sentAt).not.toBeNull();
    expect(sent.length).toBeGreaterThan(0);
  });

  it('ships a verified payout method so the withdraw flow is reachable', () => {
    expect(PAYOUT_METHOD.status).toBe('verified');
    expect(PAYOUT_METHOD.accountNumberLast4).toMatch(/^\d{4}$/);
  });
});

describe('seller fixtures — sales trend', () => {
  it('is a 30-point non-negative integer series', () => {
    expect(SALES_TREND_30D.length).toBe(30);
    for (const n of SALES_TREND_30D) {
      expect(Number.isInteger(n)).toBe(true);
      expect(n).toBeGreaterThanOrEqual(0);
    }
  });
});
