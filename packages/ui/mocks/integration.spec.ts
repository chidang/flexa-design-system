// @vitest-environment jsdom
/**
 * U13-Z cross-persona integration smoke (doc 15 §0/§8). Drives the three
 * workflow ripple loops end-to-end through the REAL handler set (msw
 * setupServer over the same `handlers` array the browser worker mounts),
 * proving that actions in one persona's screens surface in another's within a
 * session:
 *
 *   1. Buy & fulfil — buyer pays → seller ships → seller marks delivered →
 *      buyer approves → escrow released → seller balance grows.
 *   2. Dispute — buyer opens a dispute → it surfaces in the admin queue →
 *      admin resolves (refund) → the buyer's order reflects a legal
 *      escrow×payment pair (doc 07 §0.3).
 *   3. Moderation — seller submits a listing → it sits in the admin queue →
 *      admin approves → it appears in core `/v1/search`.
 *
 * jsdom env so msw's relative `/v1/...` predicates resolve against
 * location.origin; requests use the same absolute origin.
 */
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { setupServer } from 'msw/node';
import { handlers, resetDb } from './handlers';
import { SELLER_STORE_ID } from './data.seller';
import type { Order } from './data';

const ORIGIN = 'http://localhost:3000';
const server = setupServer(...handlers);

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
beforeEach(() => resetDb());
afterAll(() => server.close());

async function json<T>(res: Response): Promise<T> {
  expect(res.ok, `${res.url} → ${res.status}`).toBe(true);
  return (await res.json()) as T;
}

const get = (path: string) => fetch(`${ORIGIN}${path}`);
const post = (path: string, body?: unknown) =>
  fetch(`${ORIGIN}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body ?? {}),
  });

/** Checkout the seeded cart; returns the created orders (one per seller group). */
async function checkout(): Promise<Order[]> {
  const { orders } = await json<{ orders: Order[] }>(await post('/v1/orders'));
  expect(orders.length).toBeGreaterThanOrEqual(2); // seeded cart has 2 seller groups
  return orders;
}

describe('ripple loop 1 — buy → fulfil → approve → earnings', () => {
  it('walks the full escrow lifecycle across buyer and seller screens', async () => {
    const before = await json<{ available: { amount: number } }>(
      await get('/v1/me/store/balance'),
    );

    const orders = await checkout();
    const mine = orders.find((o) => o.sellerId === SELLER_STORE_ID)!;
    expect(mine.status).toBe('paid');
    expect(mine.escrow.stage).toBe('payment_held');

    // Seller ships (paid → in_fulfilment; escrow still payment_held — §0.3).
    const shipped = await json<Order>(
      await post(`/v1/seller/orders/${mine.id}/ship`, { carrier: 'Flexa Post', trackingNumber: 'FP1' }),
    );
    expect(shipped.status).toBe('in_fulfilment');
    expect(shipped.escrow.stage).toBe('payment_held');

    // Seller marks delivered → the buyer approve flow becomes reachable.
    const delivered = await json<Order>(await post(`/v1/seller/orders/${mine.id}/deliver`));
    expect(delivered.status).toBe('delivered');
    expect(delivered.escrow.stage).toBe('delivered');

    // Buyer approves → escrow released, payment released, order completed.
    const approved = await json<Order>(await post(`/v1/orders/${mine.id}/approve`));
    expect(approved.status).toBe('completed');
    expect(approved.escrow.stage).toBe('released');
    expect(approved.payment.status).toBe('released');

    // Seller earnings reflect the released escrow (derived live from db.orders).
    const after = await json<{ available: { amount: number } }>(
      await get('/v1/me/store/balance'),
    );
    expect(after.available.amount).toBeGreaterThan(before.available.amount);
  });

  it('rejects approve before delivery with a 409 state_conflict', async () => {
    const orders = await checkout();
    const mine = orders.find((o) => o.sellerId === SELLER_STORE_ID)!;
    const res = await post(`/v1/orders/${mine.id}/approve`);
    expect(res.status).toBe(409);
    const body = (await res.json()) as { error: { code: string } };
    expect(body.error.code).toBe('state_conflict');
  });
});

describe('ripple loop 2 — dispute → admin resolve → buyer order updates', () => {
  it('surfaces a buyer-opened dispute in the admin queue and resolves it legally', async () => {
    const orders = await checkout();
    const target = orders[0]!;

    // Buyer opens the dispute (escrow → disputed).
    const dispute = await json<{ id: string; orderId: string }>(
      await post('/v1/disputes', { orderId: target.id, reason: 'not_as_described' }),
    );

    // Admin queue derives from db.orders — the runtime dispute is visible.
    const queue = await json<{ data: Array<{ orderId: string }> }>(
      await get('/v1/admin/disputes'),
    );
    expect(queue.data.some((d) => d.orderId === target.id)).toBe(true);

    // Admin refunds the buyer.
    const resolved = await json<{ order: Order }>(
      await post(`/v1/admin/disputes/${dispute.id}/resolve`, {
        outcome: 'refund',
        note: 'Item not as described — full refund to buyer.',
      }),
    );
    expect(resolved.order.payment.status).toBe('refunded');

    // The buyer's order reflects the resolution with a LEGAL pair (doc 07 §0.3):
    // the legal map used by mocks.spec.ts pairs each escrow stage with payment.
    const legal: Record<string, string[]> = {
      payment_held: ['held'],
      delivered: ['held'],
      approved: ['held', 'released'],
      released: ['released'],
      disputed: ['held', 'refunded', 'partially_refunded'],
    };
    const buyerView = await json<Order>(await get(`/v1/orders/${target.id}`));
    expect(buyerView.payment.status).toBe('refunded');
    expect(legal[buyerView.escrow.stage]).toContain(buyerView.payment.status);
  });
});

describe('ripple loop 3 — seller submits → admin approves → search shows it', () => {
  it('walks a listing from the editor through moderation into core search', async () => {
    const title = 'Integration walnut side table';

    // Seller submits from the Listing Editor (flow S2).
    const pending = await json<{ id: string; status: string }>(
      await post('/v1/seller/listings', {
        title,
        description: 'Solid walnut, oiled finish.',
        price: { amount: 24900, currency: 'USD' },
      }),
    );
    expect(pending.status).toBe('pending');

    // Not in search while pending.
    const preSearch = await json<{ data: Array<{ title: string }> }>(
      await get(`/v1/search?q=${encodeURIComponent('Integration walnut')}`),
    );
    expect(preSearch.data.some((c) => c.title === title)).toBe(false);

    // It sits in the admin moderation queue (flow A1) …
    const queue = await json<{ data: Array<{ id: string }> }>(
      await get('/v1/admin/moderation-queue'),
    );
    expect(queue.data.some((l) => l.id === pending.id)).toBe(true);

    // … admin approves …
    await json(await post(`/v1/admin/listings/${pending.id}/approve`));

    // … and core search now returns it (U13-Z wiring in handlers.core.ts).
    const postSearch = await json<{ data: Array<{ id: string; title: string }> }>(
      await get(`/v1/search?q=${encodeURIComponent('Integration walnut')}`),
    );
    expect(postSearch.data.some((c) => c.id === pending.id && c.title === title)).toBe(true);
  });

  it('keeps rejected listings out of search and requires a reason', async () => {
    const pending = await json<{ id: string }>(
      await post('/v1/seller/listings', {
        title: 'Integration rejected stool',
        price: { amount: 9900, currency: 'USD' },
      }),
    );

    // Reject without a reason → 422.
    const noReason = await post(`/v1/admin/listings/${pending.id}/reject`, {});
    expect(noReason.status).toBe(422);

    await json(await post(`/v1/admin/listings/${pending.id}/reject`, { reasonCode: 'quality', note: 'Blurry photos' }));
    const search = await json<{ data: Array<{ id: string }> }>(
      await get(`/v1/search?q=${encodeURIComponent('Integration rejected')}`),
    );
    expect(search.data.some((c) => c.id === pending.id)).toBe(false);
  });
});
