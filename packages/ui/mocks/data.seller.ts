/**
 * U13-C seller-track fixtures (doc 15 §4/§5) — OWNED by the seller track
 * (seller identity, payout history, earnings ledger, sales trend). Deterministic
 * only: `ulid()` from './ids', fixed ISO-8601 UTC timestamps, Money = integer
 * minor units. Import shared primitives (`usd`, `page`, LISTINGS, STORES…) from
 * './data'; never edit that file. Re-exported from the mocks barrel.
 *
 * The active seller persona is the first store (Studio Mai) — most fulfilment
 * orders in the shared db belong to it, so the ripple loop (buyer pays → seller
 * fulfils → buyer approves → earnings grow) exercises real shared state.
 */
import { STORES, usd, type Money } from './data';
import { ulid } from './ids';

/** The store the seller screens act as (owner of the fulfilment orders). */
export const SELLER_STORE = STORES[0]!;
/** The store id every seller endpoint scopes to. */
export const SELLER_STORE_ID = SELLER_STORE.id;

/* --------------------------------------------------------------- balance */

/** Lifetime "paid out" baseline (doc 09 §2.11) — available/held/pending are
 *  computed live from escrow states in the handler, not fixed here. */
export const LIFETIME_PAID_OUT: Money = usd(1_832_000);

/* --------------------------------------------------------------- payouts */

export type PayoutStatus = 'requested' | 'processing' | 'sent' | 'failed';

/** Payout batch (doc 09 §2.11 Payout shape, masked destination). */
export interface Payout {
  id: string;
  storeId: string;
  amount: Money;
  status: PayoutStatus;
  destinationLast4: string;
  failureCode: string | null;
  requestedAt: string;
  sentAt: string | null;
}

interface PayoutSeed {
  amount: number;
  status: PayoutStatus;
  failureCode: string | null;
  requestedAt: string;
  sentAt: string | null;
}

const PAYOUT_SEEDS: PayoutSeed[] = [
  { amount: 54_000, status: 'sent', failureCode: null, requestedAt: '2026-06-02T09:00:00.000Z', sentAt: '2026-06-03T14:20:00.000Z' },
  { amount: 128_000, status: 'sent', failureCode: null, requestedAt: '2026-06-16T09:00:00.000Z', sentAt: '2026-06-17T14:20:00.000Z' },
  { amount: 41_000, status: 'processing', failureCode: null, requestedAt: '2026-07-01T09:00:00.000Z', sentAt: null },
  { amount: 22_500, status: 'failed', failureCode: 'bank_rejected', requestedAt: '2026-07-08T09:00:00.000Z', sentAt: null },
];

/** Seeded payout history. Handlers copy this into mutable per-session state and
 *  prepend new requests, so the list is authored oldest-first here. */
export const PAYOUT_HISTORY: Payout[] = PAYOUT_SEEDS.map((s) => ({
  id: ulid(),
  storeId: SELLER_STORE_ID,
  amount: usd(s.amount),
  status: s.status,
  destinationLast4: '6789',
  failureCode: s.failureCode,
  requestedAt: s.requestedAt,
  sentAt: s.sentAt,
}));

/* -------------------------------------------------------- payout method */

/** Masked payout account (doc 09 §2.10 payout-account, `verified`). */
export interface PayoutMethod {
  type: 'bank_account';
  accountHolder: string;
  accountNumberLast4: string;
  countryCode: string;
  currency: string;
  status: 'missing' | 'pending' | 'verified' | 'rejected';
}

export const PAYOUT_METHOD: PayoutMethod = {
  type: 'bank_account',
  accountHolder: 'Studio Mai SARL',
  accountNumberLast4: '6789',
  countryCode: 'FR',
  currency: 'USD',
  status: 'verified',
};

/* ---------------------------------------------------------- transactions */

export type TransactionType = 'sale' | 'fee' | 'refund' | 'payout';
export type TransactionStatus =
  | 'released'
  | 'held'
  | 'refunded'
  | 'processing'
  | 'sent'
  | 'failed';

/** A single ledger entry (doc 09 §2.11 transactions). `amount` is signed: sales
 *  credit (+); fees, payouts and refunds debit (−). */
export interface SellerTransaction {
  id: string;
  type: TransactionType;
  orderNumber: string | null;
  amount: Money; // signed minor units
  status: TransactionStatus;
  createdAt: string;
}

interface TxnSeed {
  type: TransactionType;
  orderNumber: string | null;
  amount: number; // signed
  status: TransactionStatus;
  createdAt: string;
}

const TXN_SEEDS: TxnSeed[] = [
  { type: 'sale', orderNumber: 'FX-2026-003990', amount: 14_805, status: 'released', createdAt: '2026-06-28T11:05:00.000Z' },
  { type: 'fee', orderNumber: 'FX-2026-003990', amount: -740, status: 'released', createdAt: '2026-06-28T11:05:00.000Z' },
  { type: 'payout', orderNumber: null, amount: -128_000, status: 'sent', createdAt: '2026-06-16T09:00:00.000Z' },
  { type: 'sale', orderNumber: 'FX-2026-004213', amount: 20_265, status: 'held', createdAt: '2026-07-10T14:25:00.000Z' },
  { type: 'fee', orderNumber: 'FX-2026-004213', amount: -1_013, status: 'held', createdAt: '2026-07-10T14:25:00.000Z' },
  { type: 'refund', orderNumber: 'FX-2026-004050', amount: -8_800, status: 'refunded', createdAt: '2026-07-15T13:00:00.000Z' },
  { type: 'payout', orderNumber: null, amount: -41_000, status: 'processing', createdAt: '2026-07-01T09:00:00.000Z' },
];

/** Seeded ledger — the handler sorts newest-first and filters by type/status. */
export const SELLER_TRANSACTIONS: SellerTransaction[] = TXN_SEEDS.map((s) => ({
  id: ulid(),
  type: s.type,
  orderNumber: s.orderNumber,
  amount: usd(s.amount),
  status: s.status,
  createdAt: s.createdAt,
}));

/* -------------------------------------------------- sales trend (30d chart) */

/** Deterministic 30-day daily-sales series (minor units) for the dashboard
 *  Charts Container sparkline — hand-authored, no randomness. */
export const SALES_TREND_30D: number[] = [
  4200, 3900, 5100, 4800, 6200, 5500, 4900, 6800, 7100, 6400,
  5800, 6900, 7400, 8100, 7600, 6900, 7200, 8300, 7900, 8600,
  9100, 8400, 7800, 8900, 9400, 8700, 9200, 9800, 9300, 10_100,
];
