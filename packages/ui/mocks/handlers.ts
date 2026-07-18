/**
 * MSW request handlers for the U11 reference screens (doc 13 D-4). Every handler
 * cites the doc 09 §2 section it mocks. Responses are the exact §-shapes from
 * {@link ./data}; collections use the §1.7 envelope. Only the endpoints the four
 * flagship screens (doc 08 §2.2–2.5) touch are implemented — grow on demand.
 *
 * A tiny in-memory `db` holds the mutable cart and the orders map so cart edits
 * and order creation persist within a session; {@link resetDb} restores the
 * seeded state (called on worker start for reproducibility).
 */
import { http, HttpResponse, delay } from 'msw';
import {
  buildCart,
  ORDERS,
  LISTINGS,
  SEARCH_CARDS,
  FACETS,
  SAVED_SEARCHES,
  STORES,
  ADDRESSES,
  PAYMENT_METHODS,
  WALLET,
  attributesForCategory,
  reviewsForListing,
  listingById,
  storeById,
  orderById,
  escrowEventsForOrder,
  shipmentForOrder,
  activityForOrder,
  shippingOptionsForCart,
  toSearchCard,
  page,
  usd,
  sumMoney,
  type Cart,
  type Order,
} from './data';
import { ulid } from './ids';

interface Db {
  cart: Cart;
  orders: Map<string, Order>;
}

function seed(): Db {
  return { cart: buildCart(), orders: new Map(ORDERS.map((o) => [o.id, o])) };
}

let db = seed();

/** Restore the seeded dataset — call before mounting the worker. */
export function resetDb(): void {
  db = seed();
}

/** Recompute cart totals after a mutation. */
function recomputeCart(): void {
  for (const g of db.cart.groups) {
    for (const it of g.items) it.lineTotal = usd(it.unitPrice.amount * it.quantity);
    g.subtotal = sumMoney(g.items.map((it) => it.lineTotal));
  }
  db.cart.groups = db.cart.groups.filter((g) => g.items.length > 0);
  db.cart.itemCount = db.cart.groups.reduce(
    (n, g) => n + g.items.reduce((k, it) => k + it.quantity, 0),
    0,
  );
  db.cart.total = sumMoney(db.cart.groups.map((g) => g.subtotal));
}

const BASE = '/v1';

export const handlers = [
  /* ---- Search (doc 09 §2.6) — Search Results screen -------------------- */
  http.get(`${BASE}/search`, async ({ request }) => {
    await delay(150);
    const url = new URL(request.url);
    const q = (url.searchParams.get('q') ?? '').toLowerCase();
    const categoryId = url.searchParams.get('categoryId');
    const sellerId = url.searchParams.get('sellerId');
    const shipping = url.searchParams.get('shipping');
    const priceMin = Number(url.searchParams.get('priceMin') ?? '0');
    const priceMax = Number(url.searchParams.get('priceMax') ?? String(Number.MAX_SAFE_INTEGER));
    const sort = url.searchParams.get('sort') ?? 'relevance';

    let data = SEARCH_CARDS.filter(
      (c) =>
        (!q || c.title.toLowerCase().includes(q)) &&
        (!categoryId || c.categoryId === categoryId) &&
        (!sellerId || c.sellerId === sellerId) &&
        (shipping !== 'free' || c.freeShipping) &&
        c.price.amount >= priceMin &&
        c.price.amount <= priceMax,
    );
    if (sort === 'price') data = [...data].sort((a, b) => a.price.amount - b.price.amount);
    else if (sort === '-price') data = [...data].sort((a, b) => b.price.amount - a.price.amount);
    else if (sort === 'rating') data = [...data].sort((a, b) => b.rating - a.rating);

    return HttpResponse.json({ ...page(data, data.length), facets: FACETS });
  }),

  /* ---- Saved filters (doc 09 §2, me/saved-filters) --------------------- */
  http.get(`${BASE}/me/saved-filters`, () => HttpResponse.json(page(SAVED_SEARCHES))),

  /* ---- Listing detail (doc 09 §2.4) — Listing Detail screen ------------ */
  http.get(`${BASE}/listings/:id`, async ({ params }) => {
    await delay(200);
    const listing = listingById(String(params.id)) ?? LISTINGS[0]!;
    const seller = storeById(listing.sellerId)!;
    return HttpResponse.json({ ...listing, seller });
  }),
  http.get(`${BASE}/categories/:id/attributes`, ({ params }) =>
    HttpResponse.json(page(attributesForCategory(String(params.id)))),
  ),
  http.get(`${BASE}/listings/:id/reviews`, ({ params }) =>
    HttpResponse.json(page(reviewsForListing(String(params.id)))),
  ),
  http.get(`${BASE}/stores/:id`, ({ params }) => {
    const s = storeById(String(params.id));
    return s ? HttpResponse.json(s) : new HttpResponse(null, { status: 404 });
  }),
  http.get(`${BASE}/stores/:id/listings`, ({ params }) => {
    const related = LISTINGS.filter((l) => l.sellerId === String(params.id)).slice(0, 4);
    return HttpResponse.json(page(related.map(toSearchCard)));
  }),

  /* ---- Cart (doc 09 §2.7) — Listing Detail + Checkout ------------------ */
  http.get(`${BASE}/cart`, () => HttpResponse.json(db.cart)),
  http.post(`${BASE}/cart/items`, async ({ request }) => {
    await delay(120);
    const body = (await request.json()) as { listingId: string; quantity?: number };
    const listing = listingById(body.listingId);
    if (!listing) return new HttpResponse(null, { status: 404 });
    const quantity = body.quantity ?? 1;
    const seller = storeById(listing.sellerId)!;
    let group = db.cart.groups.find((g) => g.sellerId === listing.sellerId);
    if (!group) {
      group = { sellerId: seller.id, sellerName: seller.name, items: [], subtotal: usd(0) };
      db.cart.groups.push(group);
    }
    const existing = group.items.find((it) => it.listingId === listing.id);
    if (existing) existing.quantity += quantity;
    else
      group.items.push({
        id: ulid(),
        listingId: listing.id,
        title: listing.title,
        coverUrl: listing.media[0]!.url,
        unitPrice: listing.price,
        quantity,
        lineTotal: usd(listing.price.amount * quantity),
        isAvailable: true,
      });
    recomputeCart();
    return HttpResponse.json(db.cart, { status: 201 });
  }),
  http.patch(`${BASE}/cart/items/:id`, async ({ params, request }) => {
    const body = (await request.json()) as { quantity: number };
    for (const g of db.cart.groups) {
      const it = g.items.find((x) => x.id === String(params.id));
      if (it) it.quantity = Math.max(1, body.quantity);
    }
    recomputeCart();
    return HttpResponse.json(db.cart);
  }),
  http.delete(`${BASE}/cart/items/:id`, ({ params }) => {
    for (const g of db.cart.groups) g.items = g.items.filter((x) => x.id !== String(params.id));
    recomputeCart();
    return HttpResponse.json(db.cart);
  }),

  /* ---- Checkout support (doc 09 §2.7/§checkout) ------------------------ */
  http.get(`${BASE}/me/addresses`, () => HttpResponse.json(page(ADDRESSES))),
  http.get(`${BASE}/cart/shipping-options`, () =>
    HttpResponse.json(page(shippingOptionsForCart(db.cart))),
  ),
  http.get(`${BASE}/me/payment-methods`, () => HttpResponse.json(page(PAYMENT_METHODS))),
  http.get(`${BASE}/wallet`, () => HttpResponse.json(WALLET)),

  /* ---- Orders & payments (doc 09 §2.8/§2.9) — Checkout + Order Detail -- */
  http.post(`${BASE}/orders`, async ({ request }) => {
    await delay(600); // payment settling into escrow
    const idem = request.headers.get('Idempotency-Key');
    // One order per seller group (doc 09 §2.8). Idempotency-Key dedupes retries.
    if (idem) {
      const prior = [...db.orders.values()].find((o) => o.number === `IDEM-${idem}`);
      if (prior) return HttpResponse.json(prior);
    }
    const created: Order[] = db.cart.groups.map((g, gi) => {
      const subtotal = g.subtotal;
      const fees = usd(Math.round(subtotal.amount * 0.05));
      const total = usd(subtotal.amount + fees.amount);
      const orderId = ulid();
      const now = '2026-07-18T10:00:00.000Z';
      return {
        id: orderId,
        number: idem && gi === 0 ? `IDEM-${idem}` : `FX-2026-00${5000 + db.orders.size + gi}`,
        buyerId: db.cart.buyerId,
        sellerId: g.sellerId,
        sellerName: g.sellerName,
        items: g.items.map((it) => ({
          listingId: it.listingId,
          title: it.title,
          coverUrl: it.coverUrl,
          unitPrice: it.unitPrice,
          quantity: it.quantity,
          lineTotal: it.lineTotal,
        })),
        subtotal,
        fees,
        total,
        refundedTotal: usd(0),
        status: 'paid' as const,
        escrow: {
          id: ulid(),
          orderId,
          stage: 'payment_held' as const,
          amount: total,
          autoReleaseAt: null,
          disputeId: null,
          heldAt: now,
          deliveredAt: null,
          releasedAt: null,
        },
        payment: {
          id: ulid(),
          orderId,
          amount: total,
          status: 'held' as const,
          provider: 'stripe',
          failureCode: null,
        },
        shippingAddress: ADDRESSES[0]!,
        paidAt: now,
        deliveredAt: null,
        completedAt: null,
        createdAt: now,
        updatedAt: now,
      };
    });
    for (const o of created) db.orders.set(o.id, o);
    return HttpResponse.json({ orders: created }, { status: 201 });
  }),
  http.get(`${BASE}/orders`, () =>
    HttpResponse.json(page([...db.orders.values()].filter((o) => !o.number.startsWith('IDEM-')))),
  ),
  http.get(`${BASE}/orders/:id`, async ({ params }) => {
    await delay(180);
    const order = db.orders.get(String(params.id)) ?? orderById(String(params.id));
    return order ? HttpResponse.json(order) : new HttpResponse(null, { status: 404 });
  }),
  http.get(`${BASE}/orders/:id/escrow-events`, ({ params }) => {
    const order = db.orders.get(String(params.id)) ?? orderById(String(params.id));
    return order
      ? HttpResponse.json(page(escrowEventsForOrder(order)))
      : new HttpResponse(null, { status: 404 });
  }),
  http.get(`${BASE}/orders/:id/shipment`, ({ params }) => {
    const order = db.orders.get(String(params.id)) ?? orderById(String(params.id));
    return order
      ? HttpResponse.json(shipmentForOrder(order))
      : new HttpResponse(null, { status: 404 });
  }),
  http.get(`${BASE}/orders/:id/activity`, ({ params }) => {
    const order = db.orders.get(String(params.id)) ?? orderById(String(params.id));
    return order
      ? HttpResponse.json(page(activityForOrder(order)))
      : new HttpResponse(null, { status: 404 });
  }),
  http.post(`${BASE}/orders/:id/approve`, async ({ params }) => {
    await delay(500);
    const order = db.orders.get(String(params.id)) ?? orderById(String(params.id));
    if (!order) return new HttpResponse(null, { status: 404 });
    if (order.escrow.stage !== 'delivered') {
      return HttpResponse.json(
        {
          error: {
            code: 'state_conflict',
            message: `Cannot approve: escrow stage is ${order.escrow.stage}, expected delivered.`,
            requestId: `req_${ulid()}`,
          },
        },
        { status: 409 },
      );
    }
    const released = '2026-07-18T10:02:11.000Z';
    const next: Order = {
      ...order,
      status: 'completed',
      completedAt: released,
      updatedAt: released,
      escrow: { ...order.escrow, stage: 'released', autoReleaseAt: null, releasedAt: released },
      payment: { ...order.payment, status: 'released' },
    };
    db.orders.set(next.id, next);
    return HttpResponse.json(next);
  }),
  http.get(`${BASE}/payment-intents/:id`, ({ params }) => {
    const order = [...db.orders.values()].find((o) => o.payment.id === String(params.id));
    return order ? HttpResponse.json(order.payment) : new HttpResponse(null, { status: 404 });
  }),

  /* ---- Disputes (doc 09 §2.12) — Order Detail -------------------------- */
  http.post(`${BASE}/disputes`, async ({ request }) => {
    await delay(400);
    const body = (await request.json()) as { orderId: string; reason: string };
    const order = db.orders.get(body.orderId) ?? orderById(body.orderId);
    if (!order) return new HttpResponse(null, { status: 404 });
    const disputeId = ulid();
    db.orders.set(order.id, {
      ...order,
      escrow: { ...order.escrow, stage: 'disputed', disputeId },
    });
    return HttpResponse.json({ id: disputeId, orderId: order.id, reason: body.reason, status: 'open' }, { status: 201 });
  }),
];
