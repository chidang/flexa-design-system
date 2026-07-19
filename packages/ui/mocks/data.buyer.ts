/**
 * U13-B buyer-track fixtures (doc 15 §4/§5) — OWNED by the buyer track
 * (notifications, wallet transactions, own payment methods & reviews).
 * Deterministic only: `ulid()` from './ids', fixed ISO-8601 UTC timestamps,
 * Money = integer minor units. Import shared primitives (`usd`, `ORDERS`,
 * LISTINGS…) from './data'; never edit that file. Re-exported from the mocks
 * barrel (index.ts).
 *
 * Notifications, wallet transactions, own reviews and own payment methods all
 * reference real ids from `./data` (order/listing), so their deep-links and
 * ledger rows resolve to the same records the reference screens render. The
 * mutable session state (notification read flags, own reviews, payment-method
 * add/remove/default) lives in `./handlers.buyer.ts` next to its `registerReset`
 * hook — this file only ships the immutable seed data those handlers copy.
 */
import {
  ORDERS,
  PAYMENT_METHODS,
  type Money,
  type Order,
  type PaymentMethod,
} from './data';
import { ulid } from './ids';

/* ------------------------------------------------------------ notifications */

/**
 * Notification (doc 09 §2.15): `type` mirrors the webhook event names, `linkUrl`
 * is an in-app route (doc 06 URL scheme, mapped onto the kitchen-sink hash
 * routes so a row deep-links to the real screen). `readAt` is null until read.
 */
export interface BuyerNotification {
  id: string;
  type: string;
  title: string;
  body: string;
  linkUrl: string;
  readAt: string | null;
  createdAt: string;
}

/** The order records notifications deep-link to (stable ids from ./data). */
const DELIVERED = ORDERS.find((o) => o.escrow.stage === 'delivered')!;
const DISPUTED = ORDERS.find((o) => o.escrow.stage === 'disputed')!;
const RELEASED = ORDERS.find((o) => o.escrow.stage === 'released')!;
const HELD = ORDERS.find((o) => o.escrow.stage === 'payment_held')!;

const orderLink = (o: Order): string => `#/screens/orders/${o.id}`;

/**
 * Seed feed — newest first. One row per notable event across the dataset so the
 * Tabs (All / Unread / Orders / Messages / System) each have content. The two
 * unread rows (delivered approval + dispute update) are the attention drivers
 * the Buyer Dashboard also surfaces.
 */
export const BUYER_NOTIFICATIONS_SEED: BuyerNotification[] = [
  {
    id: ulid(),
    type: 'order.delivered',
    title: `Order ${DELIVERED.number} was delivered`,
    body: 'Approve delivery to release the funds, or open a dispute if something is wrong.',
    linkUrl: orderLink(DELIVERED),
    readAt: null,
    createdAt: '2026-07-14T09:05:00.000Z',
  },
  {
    id: ulid(),
    type: 'dispute.opened',
    title: `Dispute opened on order ${DISPUTED.number}`,
    body: 'We notified the seller. Track the conversation and evidence in the dispute thread.',
    linkUrl: orderLink(DISPUTED),
    readAt: null,
    createdAt: '2026-07-15T12:02:00.000Z',
  },
  {
    id: ulid(),
    type: 'message.created',
    title: `New message from ${DELIVERED.sellerName}`,
    body: 'Thanks for your order — let me know if you have any questions about the finish.',
    linkUrl: '#/screens/messages',
    readAt: '2026-07-13T18:00:00.000Z',
    createdAt: '2026-07-13T17:40:00.000Z',
  },
  {
    id: ulid(),
    type: 'escrow.released',
    title: `Funds released for order ${RELEASED.number}`,
    body: 'You approved delivery and the funds were released to the seller. Thanks!',
    linkUrl: orderLink(RELEASED),
    readAt: '2026-07-16T10:05:00.000Z',
    createdAt: '2026-07-16T10:02:11.000Z',
  },
  {
    id: ulid(),
    type: 'order.paid',
    title: `Payment held in escrow for order ${HELD.number}`,
    body: 'Your payment is safely held until you approve delivery.',
    linkUrl: orderLink(HELD),
    readAt: '2026-07-12T09:10:00.000Z',
    createdAt: '2026-07-12T09:05:30.000Z',
  },
  {
    id: ulid(),
    type: 'system.welcome',
    title: 'Welcome to Flexa',
    body: 'Your account is ready. Explore the marketplace and buy with escrow protection.',
    linkUrl: '#/screens/search',
    readAt: '2026-07-01T08:15:00.000Z',
    createdAt: '2026-07-01T08:00:00.000Z',
  },
];

/** Which Tab a notification type falls under (doc 08 §3.7 tabs). */
export function notificationGroup(type: string): 'orders' | 'messages' | 'system' {
  if (type.startsWith('message.')) return 'messages';
  if (type.startsWith('order.') || type.startsWith('escrow.') || type.startsWith('dispute.'))
    return 'orders';
  return 'system';
}

/* -------------------------------------------------------- wallet transactions */

/**
 * Wallet ledger row (doc 08 §3.9 activity table; doc 09 leaves the exact shape
 * unpinned so this is the smallest coherent shape). `amount` is signed integer
 * minor units — negative = charge, positive = credit/refund. `status` reuses the
 * canonical payment statuses (doc 07 §0.1) so the Payment Status badge is legal.
 */
export interface WalletTransaction {
  id: string;
  description: string;
  amount: Money; // Money.amount may be negative for a charge
  status: 'released' | 'refunded' | 'partially_refunded';
  orderId: string | null;
  orderNumber: string | null;
  createdAt: string;
}

/** Signed Money — negative amounts are legal here (a debit), unlike order Money. */
const signed = (amount: number): Money => ({ amount, currency: 'USD' });

/**
 * Seed ledger — a charge for each paid order plus the refund credit that the
 * disputed order will resolve into. Newest first.
 */
export const WALLET_TRANSACTIONS_SEED: WalletTransaction[] = [
  {
    id: ulid(),
    description: `Refund credit — order ${DISPUTED.number}`,
    amount: signed(DISPUTED.total.amount),
    status: 'refunded',
    orderId: DISPUTED.id,
    orderNumber: DISPUTED.number,
    createdAt: '2026-07-16T14:30:00.000Z',
  },
  {
    id: ulid(),
    description: `Payment — order ${DELIVERED.number}`,
    amount: signed(-DELIVERED.total.amount),
    status: 'released',
    orderId: DELIVERED.id,
    orderNumber: DELIVERED.number,
    createdAt: DELIVERED.createdAt,
  },
  {
    id: ulid(),
    description: `Payment — order ${HELD.number}`,
    amount: signed(-HELD.total.amount),
    status: 'released',
    orderId: HELD.id,
    orderNumber: HELD.number,
    createdAt: HELD.createdAt,
  },
  {
    id: ulid(),
    description: `Payment — order ${RELEASED.number}`,
    amount: signed(-RELEASED.total.amount),
    status: 'released',
    orderId: RELEASED.id,
    orderNumber: RELEASED.number,
    createdAt: RELEASED.createdAt,
  },
];

/* ---------------------------------------------------------- payment methods */

/** A fresh copy of the seed methods so buyer add/remove/default never mutates
 * the shared `PAYMENT_METHODS` fixture (which the core GET + Checkout read). */
export const buyerPaymentMethodsSeed = (): PaymentMethod[] =>
  PAYMENT_METHODS.map((m) => ({ ...m }));

/** Brands the mock "add payment method" form offers (provider-hosted in real
 * life; here a deterministic card is minted per submit — doc 08 §3.9 note). */
export const ADD_METHOD_BRANDS = ['Visa', 'Mastercard', 'Amex'] as const;

/* ------------------------------------------------------------- own reviews */

/**
 * Own review (doc 09 §2.13 Review projected to the buyer's "my reviews" view).
 * `orderId` ties it to a completed order (one review per order, flow B4).
 */
export interface OwnReview {
  id: string;
  orderId: string;
  listingId: string;
  listingTitle: string;
  coverUrl: string;
  sellerName: string;
  rating: number;
  body: string;
  anonymous: boolean;
  createdAt: string;
  editableUntil: string; // 30-day edit window (doc 09 §2.13)
}

/** One already-published review — for the released order's first item. */
export const OWN_REVIEWS_SEED: OwnReview[] = [
  {
    id: ulid(),
    orderId: RELEASED.id,
    listingId: RELEASED.items[0]!.listingId,
    listingTitle: RELEASED.items[0]!.title,
    coverUrl: RELEASED.items[0]!.coverUrl,
    sellerName: RELEASED.sellerName,
    rating: 5,
    body: 'Beautifully made and shipped fast. Exactly as pictured — would buy again.',
    anonymous: false,
    createdAt: '2026-07-17T09:00:00.000Z',
    editableUntil: '2026-08-16T09:00:00.000Z',
  },
];

/**
 * A completed order without a review is "reviewable" (doc 08 §3.8: eligibility =
 * escrow `approved`/`released` orders without a review). The reviewable list is
 * derived at request time from `db.orders` minus the own-reviews' order ids —
 * see `handlers.buyer.ts` — so approving an order in-session makes it reviewable.
 */
export const reviewablePredicate = (order: Order): boolean =>
  order.escrow.stage === 'released' || order.escrow.stage === 'approved';
