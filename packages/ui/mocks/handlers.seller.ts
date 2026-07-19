/**
 * U13-C seller-track handlers (doc 15 §4 — Seller Dashboard §2.8, Listings
 * §3.12, Listing Editor §2.9, Order fulfil §2.10, Earnings & Payouts §2.11).
 * OWNED by the seller track; no other track edits this file (doc 15 §5).
 *
 * Shared mutable state (the ripple engine): `db.orders` from './db' — the fulfil
 * endpoints mutate the SAME order the buyer sees, so mark-shipped / mark-delivered
 * ripple into the buyer Order Detail timeline. Track-local state (payouts, seller
 * listing rows, per-order tracking) lives module-scoped here and reseeds via
 * `registerReset`. Listing submits write into the shared moderation store
 * (`submitListing` from './moderation') that the admin track consumes.
 *
 * Every handler cites its doc 09 §. Deterministic: `ulid()` from './ids', fixed
 * ISO timestamps — never `Date.now()` / `Math.random()`. Money = integer minor
 * units. Escrow × payment pairs stay legal per doc 07 §0.3:
 *   - mark-shipped:   order `paid` → `in_fulfilment`, escrow `payment_held`, payment `held`.
 *   - mark-delivered: order `in_fulfilment` → `delivered`, escrow `payment_held` → `delivered`.
 */
import { http, HttpResponse, delay, type HttpHandler } from 'msw';
import {
  LISTINGS,
  CATEGORIES,
  usd,
  page,
  storeById,
  toSearchCard,
  type Money,
  type Order,
  type SearchCard,
} from './data';
import {
  SELLER_STORE_ID,
  LIFETIME_PAID_OUT,
  PAYOUT_HISTORY,
  PAYOUT_METHOD,
  SELLER_TRANSACTIONS,
  SALES_TREND_30D,
  type Payout,
  type SellerTransaction,
} from './data.seller';
import { db, registerReset } from './db';
import { submitListing } from './moderation';
import { ulid } from './ids';

const BASE = '/v1';

/* --------------------------------------------- track-local mutable state */

type SellerListingStatus =
  | 'active'
  | 'draft'
  | 'pending_review'
  | 'rejected'
  | 'archived';

/** A seller-owned listing row (doc 09 §3.12). */
interface SellerListingRow {
  id: string;
  title: string;
  price: Money;
  coverUrl: string;
  imageAlt: string;
  stock: number;
  status: SellerListingStatus;
  moderationNote: string | null;
  views: number;
  updatedAt: string;
}

/** Per-order tracking recorded at ship time (doc 09 §2.10) — kept out of the
 *  shared Order shape (which the buyer/core handlers own) so we never mutate a
 *  cross-track type; keyed by order id, reseeded with the rest of track state. */
interface TrackingInfo {
  carrier: string;
  trackingNumber: string;
  shippedAt: string;
}

let sellerListings: SellerListingRow[] = [];
let sellerPayouts: Payout[] = [];
let sellerTransactions: SellerTransaction[] = [];
const tracking = new Map<string, TrackingInfo>();
/** Approved-this-session search cards (integration seam — see bottom of file). */
let approvedThisSession: SearchCard[] = [];
let availableCents = 0;
let heldCents = 0;

/** Seed seller-owned rows from the shared LISTINGS + a draft + a rejected row so
 *  every status tab has content. */
function ownRows(): SellerListingRow[] {
  const owned = LISTINGS.filter((l) => l.sellerId === SELLER_STORE_ID);
  const rows: SellerListingRow[] = owned.map((l, i) => ({
    id: l.id,
    title: l.title,
    price: l.price,
    coverUrl: l.media[0]!.url,
    imageAlt: l.media[0]!.alt,
    stock: l.quantity ?? 0,
    status: 'active',
    moderationNote: null,
    views: 120 + i * 37,
    updatedAt: l.updatedAt,
  }));
  const cover = owned[0]?.media[0]!.url ?? '';
  rows.push({
    id: ulid(),
    title: 'Brass wall sconce (draft)',
    price: usd(7400),
    coverUrl: cover,
    imageAlt: 'Brass wall sconce — draft cover',
    stock: 0,
    status: 'draft',
    moderationNote: null,
    views: 0,
    updatedAt: '2026-07-14T09:00:00.000Z',
  });
  rows.push({
    id: ulid(),
    title: 'Neon sign — Open',
    price: usd(15900),
    coverUrl: owned[1]?.media[0]!.url ?? cover,
    imageAlt: 'Neon Open sign — rejected cover',
    stock: 3,
    status: 'rejected',
    moderationNote: 'Electrical goods need a safety certificate. Add certification, then resubmit.',
    views: 42,
    updatedAt: '2026-07-13T09:00:00.000Z',
  });
  return rows;
}

/** Reseed track-local state; escrow-derived balances recompute from db.orders. */
function seedSellerState(): void {
  sellerListings = ownRows();
  sellerPayouts = PAYOUT_HISTORY.map((p) => ({ ...p }));
  sellerTransactions = SELLER_TRANSACTIONS.map((t) => ({ ...t }));
  tracking.clear();
  approvedThisSession = [];
  recomputeBalances();
}

/**
 * Balances are DERIVED from the shared order db (doc 09 §2.11): released escrows
 * for this seller sum into `available`; held/delivered escrows into `inEscrow`.
 * This is what makes Earnings grow after the buyer approves (ripple loop S6).
 */
function recomputeBalances(): void {
  const mine = [...db.orders.values()].filter((o) => o.sellerId === SELLER_STORE_ID);
  const netOf = (o: Order): number => o.total.amount - o.fees.amount;
  availableCents = mine
    .filter((o) => o.escrow.stage === 'released')
    .reduce((n, o) => n + netOf(o), 0);
  heldCents = mine
    .filter((o) => o.escrow.stage === 'payment_held' || o.escrow.stage === 'delivered')
    .reduce((n, o) => n + netOf(o), 0);
}

seedSellerState();
registerReset(seedSellerState);

/* -------------------------------------------------------------- projections */

/** Seller-scoped orders from the shared db (excludes idempotency dedupe rows). */
function sellerOrders(): Order[] {
  return [...db.orders.values()].filter(
    (o) => o.sellerId === SELLER_STORE_ID && !o.number.startsWith('IDEM-'),
  );
}

/** 30-day gross sales (minor units) — sum of every seller order total. */
function grossSales30d(): number {
  return sellerOrders().reduce((n, o) => n + o.total.amount, 0);
}

function statusCounts(): Record<SellerListingStatus, number> {
  return sellerListings.reduce(
    (acc, r) => {
      acc[r.status] += 1;
      return acc;
    },
    { active: 0, draft: 0, pending_review: 0, rejected: 0, archived: 0 } as Record<
      SellerListingStatus,
      number
    >,
  );
}

const conflict = (message: string) =>
  HttpResponse.json(
    { error: { code: 'state_conflict', message, requestId: `req_${ulid()}` } },
    { status: 409 },
  );

/* ------------------------------------------------------------------ handlers */

export const sellerHandlers: HttpHandler[] = [
  /* ---- Seller dashboard (doc 09 §2.8 — composed first-paint payload) ---- */
  http.get(`${BASE}/seller/dashboard`, async () => {
    await delay(200);
    recomputeBalances();
    const orders = sellerOrders();
    const needsFulfilment = orders.filter((o) => o.status === 'paid');
    const disputes = orders.filter((o) => o.escrow.stage === 'disputed');
    const store = storeById(SELLER_STORE_ID)!;
    return HttpResponse.json({
      store: { id: store.id, name: store.name, rating: store.rating, reviewCount: store.reviewCount },
      metrics: {
        sales30d: usd(grossSales30d()),
        held: usd(heldCents),
        available: usd(availableCents),
        rating: store.rating,
        ratingCount: store.reviewCount,
      },
      attention: {
        awaitingFulfilment: needsFulfilment.length,
        disputes: disputes.length,
        firstFulfilmentOrderId: needsFulfilment[0]?.id ?? null,
        firstDisputeOrderId: disputes[0]?.id ?? null,
      },
      recentOrders: orders.slice(0, 5),
      salesTrend: SALES_TREND_30D,
    });
  }),

  /* ---- Seller listings (doc 09 §3.12) ---------------------------------- */
  http.get(`${BASE}/seller/listings`, async ({ request }) => {
    await delay(180);
    const url = new URL(request.url);
    const status = url.searchParams.get('status');
    const q = (url.searchParams.get('q') ?? '').toLowerCase();
    let rows = sellerListings;
    if (status) rows = rows.filter((r) => r.status === status);
    if (q) rows = rows.filter((r) => r.title.toLowerCase().includes(q));
    return HttpResponse.json({ ...page(rows, rows.length), counts: statusCounts() });
  }),

  /* ---- Publish a new listing → moderation queue (doc 09 §2.9, flow S2) - */
  http.post(`${BASE}/seller/listings`, async ({ request }) => {
    await delay(400);
    const body = (await request.json().catch(() => ({}))) as {
      title?: string;
      description?: string;
      categoryId?: string;
      price?: Money;
      stock?: number;
      coverUrl?: string;
    };
    const title = (body.title ?? '').trim();
    const price = body.price ?? null;
    if (!title || !price || price.amount <= 0) {
      return HttpResponse.json(
        {
          error: {
            code: 'invalid_request',
            message: 'A listing needs a title and a price above zero.',
            requestId: `req_${ulid()}`,
          },
        },
        { status: 422 },
      );
    }
    const store = storeById(SELLER_STORE_ID)!;
    const cover =
      body.coverUrl || LISTINGS.find((l) => l.sellerId === SELLER_STORE_ID)?.media[0]!.url || '';
    // Write into the shared moderation store the admin track consumes (flow S2).
    const pending = submitListing({
      title,
      description: (body.description ?? '').trim() || `${title} — new listing by ${store.name}.`,
      categoryId: body.categoryId || CATEGORIES[0]!.id,
      sellerId: SELLER_STORE_ID,
      sellerName: store.name,
      price,
      coverUrl: cover,
      submittedAt: '2026-07-18T11:00:00.000Z',
    });
    // Surface it in the seller list immediately as pending_review (flow S2 step 5).
    sellerListings = [
      {
        id: pending.id,
        title,
        price,
        coverUrl: cover,
        imageAlt: `${title} cover`,
        stock: body.stock ?? 1,
        status: 'pending_review',
        moderationNote: null,
        views: 0,
        updatedAt: pending.submittedAt,
      },
      ...sellerListings,
    ];
    return HttpResponse.json(pending, { status: 201 });
  }),

  /* ---- Seller order detail — fulfil view (doc 09 §2.10, flow S3) ------- */
  http.get(`${BASE}/seller/orders/:id`, async ({ params }) => {
    await delay(180);
    const order = db.orders.get(String(params.id));
    if (!order || order.sellerId !== SELLER_STORE_ID) return new HttpResponse(null, { status: 404 });
    const payoutPreview = {
      gross: order.total,
      fee: order.fees,
      net: usd(order.total.amount - order.fees.amount),
    };
    const info = tracking.get(order.id) ?? null;
    return HttpResponse.json({ ...order, payoutPreview, tracking: info });
  }),

  /* ---- Mark shipped: paid → in_fulfilment (doc 09 §2.10, flow S3 step 2/3) */
  http.post(`${BASE}/seller/orders/:id/ship`, async ({ params, request }) => {
    await delay(500);
    const order = db.orders.get(String(params.id));
    if (!order || order.sellerId !== SELLER_STORE_ID) return new HttpResponse(null, { status: 404 });
    if (order.status !== 'paid') {
      return conflict(`Cannot ship: order status is ${order.status}, expected paid.`);
    }
    const body = (await request.json().catch(() => ({}))) as {
      carrier?: string;
      trackingNumber?: string;
    };
    const at = '2026-07-18T12:00:00.000Z';
    // Escrow stays payment_held (nothing delivered yet) — legal pair per §0.3.
    const next: Order = { ...order, status: 'in_fulfilment', updatedAt: at };
    db.orders.set(next.id, next);
    tracking.set(next.id, {
      carrier: (body.carrier ?? '').trim() || 'Flexa Post',
      trackingNumber:
        (body.trackingNumber ?? '').trim() || `FP${order.number.replace(/[^0-9]/g, '')}`,
      shippedAt: at,
    });
    // Same fulfil-view shape as the GET — SellerOrderDetail re-renders from this
    // response, so payoutPreview must ride along (P-D e2e finding, doc 16).
    const shippedPreview = {
      gross: next.total,
      fee: next.fees,
      net: usd(next.total.amount - next.fees.amount),
    };
    return HttpResponse.json({
      ...next,
      payoutPreview: shippedPreview,
      tracking: tracking.get(next.id),
    });
  }),

  /* ---- Mark delivered: → delivered (doc 09 §2.10, flow S3 step 4) ------ */
  http.post(`${BASE}/seller/orders/:id/deliver`, async ({ params }) => {
    await delay(500);
    const order = db.orders.get(String(params.id));
    if (!order || order.sellerId !== SELLER_STORE_ID) return new HttpResponse(null, { status: 404 });
    if (order.status !== 'in_fulfilment' && order.status !== 'paid') {
      return conflict(`Cannot mark delivered: order status is ${order.status}.`);
    }
    const at = '2026-07-18T13:00:00.000Z';
    // Escrow payment_held → delivered; buyer approve flow becomes reachable.
    const next: Order = {
      ...order,
      status: 'delivered',
      deliveredAt: at,
      updatedAt: at,
      escrow: {
        ...order.escrow,
        stage: 'delivered',
        deliveredAt: at,
        autoReleaseAt: '2026-07-25T13:00:00.000Z',
      },
    };
    db.orders.set(next.id, next);
    recomputeBalances();
    // Fulfil-view shape, as the GET (P-D e2e finding, doc 16).
    const deliveredPreview = {
      gross: next.total,
      fee: next.fees,
      net: usd(next.total.amount - next.fees.amount),
    };
    return HttpResponse.json({
      ...next,
      payoutPreview: deliveredPreview,
      tracking: tracking.get(next.id) ?? null,
    });
  }),

  /* ---- Balance snapshot (doc 09 §2.11) --------------------------------- */
  http.get(`${BASE}/me/store/balance`, async () => {
    await delay(150);
    recomputeBalances();
    return HttpResponse.json({
      available: usd(availableCents),
      pending: usd(0),
      inEscrow: usd(heldCents),
      lifetimePaidOut: LIFETIME_PAID_OUT,
      currency: 'USD',
    });
  }),

  /* ---- Transactions ledger (doc 09 §2.11) ------------------------------ */
  http.get(`${BASE}/seller/transactions`, async ({ request }) => {
    await delay(180);
    const url = new URL(request.url);
    const type = url.searchParams.get('type');
    const status = url.searchParams.get('status');
    let rows = [...sellerTransactions].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
    if (type) rows = rows.filter((r) => r.type === type);
    if (status) rows = rows.filter((r) => r.status === status);
    return HttpResponse.json(page(rows, rows.length));
  }),

  /* ---- Payout history (doc 09 §2.11) ----------------------------------- */
  http.get(`${BASE}/payouts`, async ({ request }) => {
    await delay(160);
    const url = new URL(request.url);
    const status = url.searchParams.get('status');
    let rows = [...sellerPayouts].sort((a, b) => (a.requestedAt < b.requestedAt ? 1 : -1));
    if (status) rows = rows.filter((r) => r.status === status);
    return HttpResponse.json(page(rows, rows.length));
  }),

  http.get(`${BASE}/me/store/payout-method`, () => HttpResponse.json(PAYOUT_METHOD)),

  /* ---- Request a payout (doc 09 §2.11, flow S6) ------------------------ */
  http.post(`${BASE}/payouts`, async ({ request }) => {
    await delay(500);
    recomputeBalances();
    if (PAYOUT_METHOD.status !== 'verified') {
      return conflict('Add a verified payout account before requesting a payout.');
    }
    const body = (await request.json().catch(() => ({}))) as { amount?: Money };
    const amount = body.amount ?? usd(availableCents);
    if (amount.amount <= 0 || amount.amount > availableCents) {
      return HttpResponse.json(
        {
          error: {
            code: 'insufficient_funds',
            message: 'Payout exceeds your available balance.',
            requestId: `req_${ulid()}`,
          },
        },
        { status: 402 },
      );
    }
    const requestedAt = '2026-07-18T14:00:00.000Z';
    const payout: Payout = {
      id: ulid(),
      storeId: SELLER_STORE_ID,
      amount,
      status: 'processing',
      destinationLast4: PAYOUT_METHOD.accountNumberLast4,
      failureCode: null,
      requestedAt,
      sentAt: null,
    };
    sellerPayouts = [payout, ...sellerPayouts];
    sellerTransactions = [
      {
        id: ulid(),
        type: 'payout',
        orderNumber: null,
        amount: usd(-amount.amount),
        status: 'processing',
        createdAt: requestedAt,
      },
      ...sellerTransactions,
    ];
    // Optimistically move funds out of available (reconciles on webhook).
    availableCents = Math.max(0, availableCents - amount.amount);
    return HttpResponse.json(payout, { status: 201 });
  }),
];

/* --------------------------------- integration seam (see PR GAPS / U13-Z) --- */

/**
 * The core `/v1/search` handler reads the static SEARCH_CARDS array and cannot
 * see listings approved in-session without editing `handlers.core.ts` (forbidden
 * for this track — doc 15 §5). These exports let the U13-Z integration slice,
 * which owns the core search wiring, splice approved listings into search.
 */
export function sellerApprovedSearchCards(): SearchCard[] {
  return approvedThisSession;
}

/** Record an approved listing (called by the moderation→search integration). */
export function recordApprovedListing(card: SearchCard): void {
  approvedThisSession = [card, ...approvedThisSession];
}

/** Project a seeded listing to a search card (helper for the integration seam). */
export function searchCardForListing(listingId: string): SearchCard | null {
  const l = LISTINGS.find((x) => x.id === listingId);
  return l ? toSearchCard(l) : null;
}
