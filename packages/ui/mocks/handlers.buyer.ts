/**
 * U13-B buyer-track handlers (doc 15 §4 — Buyer Dashboard, Orders List,
 * Notifications, Wallet, Reviews). OWNED by the buyer track; no other track
 * edits this file (doc 15 §5). Every handler cites its doc 09 §, uses
 * `const BASE = '/v1'`, and stays deterministic (ulid from './ids', fixed ISO
 * timestamps). Mutable track state: module-scoped + `registerReset` from './db'.
 *
 * The Buyer Dashboard (doc 08 §2.6) and Orders List (doc 08 §3.6) compose from
 * endpoints the core already serves (`GET /orders` reads the shared `db.orders`,
 * so approve/dispute mutations ripple here). This file adds only the buyer
 * account surfaces doc 15 §4 lists as NEW: notifications list/mark-read, wallet
 * transactions, payment-method create/delete/default, and reviews create/list.
 */
import { http, HttpResponse, delay, type HttpHandler } from 'msw';
import { page, type PaymentMethod, type Order } from './data';
import {
  BUYER_NOTIFICATIONS_SEED,
  WALLET_TRANSACTIONS_SEED,
  OWN_REVIEWS_SEED,
  buyerPaymentMethodsSeed,
  reviewablePredicate,
  type BuyerNotification,
  type WalletTransaction,
  type OwnReview,
} from './data.buyer';
import { db, registerReset } from './db';
import { ulid } from './ids';

const BASE = '/v1';

/* --------------------------------------------------------- mutable track state
 * Session-scoped stores the buyer handlers read AND mutate. Seeded from the
 * immutable fixtures on load, reseeded by `registerReset` (called from
 * `resetDb()` before the worker mounts) so a fresh session starts clean. */

let notifications: BuyerNotification[] = BUYER_NOTIFICATIONS_SEED.map((n) => ({ ...n }));
let transactions: WalletTransaction[] = WALLET_TRANSACTIONS_SEED.map((t) => ({ ...t }));
let paymentMethods: PaymentMethod[] = buyerPaymentMethodsSeed();
let ownReviews: OwnReview[] = OWN_REVIEWS_SEED.map((r) => ({ ...r }));

registerReset(() => {
  notifications = BUYER_NOTIFICATIONS_SEED.map((n) => ({ ...n }));
  transactions = WALLET_TRANSACTIONS_SEED.map((t) => ({ ...t }));
  paymentMethods = buyerPaymentMethodsSeed();
  ownReviews = OWN_REVIEWS_SEED.map((r) => ({ ...r }));
});

/** Orders reviewable now: released/approved and not yet reviewed (doc 08 §3.8).
 * Reads `db.orders` so an in-session approval makes an order reviewable. */
function reviewableOrders(): Order[] {
  const reviewed = new Set(ownReviews.map((r) => r.orderId));
  return [...db.orders.values()].filter(
    (o) => !o.number.startsWith('IDEM-') && reviewablePredicate(o) && !reviewed.has(o.id),
  );
}

/* -------------------------------------------------------------------- errors */

const conflict = (code: string, message: string) =>
  HttpResponse.json(
    { error: { code, message, requestId: `req_${ulid()}` } },
    { status: 409 },
  );

export const buyerHandlers: HttpHandler[] = [
  /* ---- Notifications (doc 09 §2.15) — Notifications screen -------------- */
  http.get(`${BASE}/notifications`, async ({ request }) => {
    await delay(150);
    const url = new URL(request.url);
    const list = url.searchParams.get('unread') === 'true'
      ? notifications.filter((n) => n.readAt == null)
      : notifications;
    const unread = notifications.filter((n) => n.readAt == null).length;
    // §2.15: totalCount present here (cheap badge count).
    return HttpResponse.json(page(list, unread));
  }),
  http.post(`${BASE}/notifications/mark-read`, async ({ request }) => {
    await delay(120);
    const body = (await request.json().catch(() => ({}))) as { ids?: string[]; all?: boolean };
    const at = '2026-07-18T10:00:00.000Z';
    if (body.all) {
      notifications = notifications.map((n) => (n.readAt ? n : { ...n, readAt: at }));
    } else if (Array.isArray(body.ids)) {
      const ids = new Set(body.ids);
      notifications = notifications.map((n) => (ids.has(n.id) && !n.readAt ? { ...n, readAt: at } : n));
    }
    return new HttpResponse(null, { status: 204 });
  }),

  /* ---- Wallet transactions (doc 09 §2.11 balance/ledger shape; doc 08 §3.9
   *      activity table). The wallet balance itself is the core GET /wallet. -- */
  http.get(`${BASE}/wallet/transactions`, async () => {
    await delay(150);
    return HttpResponse.json(page(transactions, transactions.length));
  }),

  /* ---- Payment methods (doc 08 §3.9; doc 09 §2.9 hosted-fields note). The
   *      list GET stays with the core handler (Checkout also reads it); these
   *      mutate the buyer-local store and return the result the screen applies
   *      optimistically. --------------------------------------------------- */
  http.post(`${BASE}/me/payment-methods`, async ({ request }) => {
    await delay(300);
    // Provider-hosted tokenization in real life (doc 09 §Payments): here the
    // body carries the presentational card facts a hosted field would return.
    const body = (await request.json().catch(() => ({}))) as {
      brand?: string;
      last4?: string;
      expiry?: string;
    };
    const method: PaymentMethod = {
      id: ulid(),
      brand: body.brand ?? 'Visa',
      last4: (body.last4 ?? '0000').slice(-4),
      expiry: body.expiry ?? '01/30',
      isDefault: paymentMethods.length === 0,
    };
    paymentMethods = [...paymentMethods, method];
    return HttpResponse.json(method, { status: 201 });
  }),
  http.patch(`${BASE}/me/payment-methods/:id`, async ({ params, request }) => {
    await delay(150);
    const id = String(params.id);
    const body = (await request.json().catch(() => ({}))) as { isDefault?: boolean };
    if (!paymentMethods.some((m) => m.id === id)) return new HttpResponse(null, { status: 404 });
    if (body.isDefault) {
      paymentMethods = paymentMethods.map((m) => ({ ...m, isDefault: m.id === id }));
    }
    return HttpResponse.json(paymentMethods.find((m) => m.id === id));
  }),
  http.delete(`${BASE}/me/payment-methods/:id`, async ({ params }) => {
    await delay(150);
    const id = String(params.id);
    const target = paymentMethods.find((m) => m.id === id);
    if (!target) return new HttpResponse(null, { status: 404 });
    // Removing the last default is blocked until another default is set
    // (doc 08 §3.9). A single remaining method can always be removed.
    if (target.isDefault && paymentMethods.length > 1) {
      return conflict(
        'state_conflict',
        'Set another card as default before removing this one.',
      );
    }
    paymentMethods = paymentMethods.filter((m) => m.id !== id);
    return new HttpResponse(null, { status: 204 });
  }),

  /* ---- Reviews (doc 09 §2.13, flow B4) — Reviews screen ---------------- */
  http.get(`${BASE}/me/reviewables`, async () => {
    await delay(150);
    // Slim Order Card projection for the "To review" tab.
    return HttpResponse.json(page(reviewableOrders()));
  }),
  http.get(`${BASE}/me/reviews`, async () => {
    await delay(150);
    return HttpResponse.json(page(ownReviews));
  }),
  http.post(`${BASE}/reviews`, async ({ request }) => {
    await delay(400);
    const body = (await request.json().catch(() => ({}))) as {
      orderId?: string;
      rating?: number;
      body?: string;
      anonymous?: boolean;
    };
    const order = body.orderId ? db.orders.get(body.orderId) : undefined;
    if (!order) return new HttpResponse(null, { status: 404 });
    // Order must be completed/released (doc 09 §2.13 state_conflict).
    if (!reviewablePredicate(order)) {
      return conflict('state_conflict', 'Only completed orders can be reviewed.');
    }
    // One review per order (doc 09 §2.13 conflict).
    if (ownReviews.some((r) => r.orderId === order.id)) {
      return conflict('conflict', 'You already reviewed this order.');
    }
    const rating = Math.min(5, Math.max(1, Math.round(body.rating ?? 0)));
    const item = order.items[0]!;
    const review: OwnReview = {
      id: ulid(),
      orderId: order.id,
      listingId: item.listingId,
      listingTitle: item.title,
      coverUrl: item.coverUrl,
      sellerName: order.sellerName,
      rating,
      body: (body.body ?? '').trim(),
      anonymous: body.anonymous === true,
      createdAt: '2026-07-18T10:00:00.000Z',
      editableUntil: '2026-08-17T10:00:00.000Z',
    };
    ownReviews = [review, ...ownReviews];
    return HttpResponse.json(review, { status: 201 });
  }),
  http.patch(`${BASE}/reviews/:id`, async ({ params, request }) => {
    await delay(250);
    const id = String(params.id);
    const body = (await request.json().catch(() => ({}))) as { rating?: number; body?: string };
    const review = ownReviews.find((r) => r.id === id);
    if (!review) return new HttpResponse(null, { status: 404 });
    if (body.rating != null) review.rating = Math.min(5, Math.max(1, Math.round(body.rating)));
    if (body.body != null) review.body = body.body.trim();
    return HttpResponse.json(review);
  }),
  http.delete(`${BASE}/reviews/:id`, async ({ params }) => {
    await delay(200);
    const id = String(params.id);
    if (!ownReviews.some((r) => r.id === id)) return new HttpResponse(null, { status: 404 });
    ownReviews = ownReviews.filter((r) => r.id !== id);
    return new HttpResponse(null, { status: 204 });
  }),
];
