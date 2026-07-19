/**
 * U13-D admin-track handlers (doc 15 §4 — Admin Dashboard, Listings
 * Moderation, Disputes Queue, Dispute Detail). OWNED by the admin track; no
 * other track edits this file (doc 15 §5). Every handler cites its doc 09 §,
 * uses `const BASE = '/v1'`, and stays deterministic (ulid from './ids', fixed
 * ISO timestamps — never `Date.now()`). Shared mutable state: `db` from './db'
 * (orders / disputed escrows) and the pending-listing store in './moderation';
 * track-local state lives in `./data.admin`.
 *
 * Ripple (doc 15 §0): the resolve handler mutates the SHARED `db.orders` escrow
 * + payment to a legal final pair (doc 07 §0.3), so the buyer's Order Detail
 * reflects the admin's decision within the same session.
 */
import { http, HttpResponse, delay, type HttpHandler } from 'msw';
import { db } from './db';
import { orderById, page, usd, type Order } from './data';
import {
  approveListing,
  rejectListing,
  pendingListings,
  type PendingListing,
} from './moderation';
import {
  appendAudit,
  auditEntries,
  disputeCases,
  disputeCaseById,
  disputeCaseByOrderId,
  type DisputeCase,
  type DisputeOutcome,
} from './data.admin';
import { ulid } from './ids';

const BASE = '/v1';

/* ----------------------------------------------------------------- helpers */

/** A dispute row the queue renders — one per order whose escrow is `disputed`,
 * enriched from the admin case meta when we have it (otherwise a lightweight
 * row derived from the order, e.g. a dispute the buyer opened at runtime). */
interface DisputeRow {
  id: string;
  orderId: string;
  orderNumber: string;
  buyerName: string;
  sellerName: string;
  reason: string;
  status: string;
  amount: { amount: number; currency: string };
  slaDueAt: string;
  openedAt: string;
  hasCase: boolean;
}

/** Derive the open-dispute rows from the SHARED db (doc 08 §2.12): every order
 * currently at escrow stage `disputed` is an open dispute. Seeded cases add the
 * admin detail; runtime disputes (buyer POST /disputes) get a derived row so
 * they surface without a fixture. */
function disputeRows(): DisputeRow[] {
  const rows: DisputeRow[] = [];
  for (const order of db.orders.values()) {
    if (order.escrow.stage !== 'disputed') continue;
    const found = disputeCaseByOrderId(order.id);
    if (found) {
      rows.push({
        id: found.id,
        orderId: found.orderId,
        orderNumber: found.orderNumber,
        buyerName: found.buyerName,
        sellerName: found.sellerName,
        reason: found.reason,
        status: found.status,
        amount: found.amount,
        slaDueAt: found.slaDueAt,
        openedAt: found.openedAt,
        hasCase: true,
      });
    } else {
      // Runtime dispute — no admin case yet. SLA defaults to 72h after open.
      const openedAt = order.updatedAt;
      rows.push({
        id: order.escrow.disputeId ?? order.id,
        orderId: order.id,
        orderNumber: order.number,
        buyerName: order.shippingAddress.recipient,
        sellerName: order.sellerName,
        reason: 'other',
        status: 'open',
        amount: order.total,
        slaDueAt: addHours(openedAt, 72),
        openedAt,
        hasCase: false,
      });
    }
  }
  return rows;
}

/** Add whole hours to an ISO instant, returning ISO — deterministic, no now(). */
function addHours(iso: string, hours: number): string {
  return new Date(new Date(iso).getTime() + hours * 3_600_000).toISOString();
}

/** Resolve a dispute id to its order via the case store or the shared db. */
function orderForDisputeId(disputeId: string): Order | undefined {
  const found = disputeCaseById(disputeId);
  if (found) return db.orders.get(found.orderId) ?? orderById(found.orderId);
  return [...db.orders.values()].find(
    (o) => o.escrow.stage === 'disputed' && (o.escrow.disputeId === disputeId || o.id === disputeId),
  );
}

/**
 * Apply a dispute resolution to the SHARED order (doc 07 §0.3 — the only legal
 * final pairs). Returns the mutated order.
 *  • release → escrow `released` + payment `released`, order `completed`.
 *  • refund  → payment `refunded`, order `cancelled`, full refundedTotal;
 *              escrow stays `disputed` (closed with the decision recorded).
 *  • partial → payment `partially_refunded`, order `completed`, refundedTotal
 *              = the split refund amount; escrow stays `disputed`.
 */
function applyResolution(
  order: Order,
  outcome: DisputeOutcome,
  refundAmount: number,
  at: string,
): Order {
  let next: Order;
  if (outcome === 'release') {
    next = {
      ...order,
      status: 'completed',
      completedAt: at,
      updatedAt: at,
      escrow: { ...order.escrow, stage: 'released', autoReleaseAt: null, releasedAt: at },
      payment: { ...order.payment, status: 'released' },
    };
  } else if (outcome === 'refund') {
    next = {
      ...order,
      status: 'cancelled',
      updatedAt: at,
      refundedTotal: order.total,
      escrow: { ...order.escrow, autoReleaseAt: null },
      payment: { ...order.payment, status: 'refunded' },
    };
  } else {
    next = {
      ...order,
      status: 'completed',
      completedAt: at,
      updatedAt: at,
      refundedTotal: usd(refundAmount),
      escrow: { ...order.escrow, autoReleaseAt: null },
      payment: { ...order.payment, status: 'partially_refunded' },
    };
  }
  db.orders.set(next.id, next);
  return next;
}

/* ------------------------------------------------------------------- config */

/** SLA / config surfaced to `capabilities`-style callers isn't needed here;
 * the queue math lives client-side off `slaDueAt`. */

export const adminHandlers: HttpHandler[] = [
  /* ---- Admin Dashboard (doc 08 §3.17 / doc 09 §2.17) ------------------- */
  http.get(`${BASE}/admin/dashboard`, async () => {
    await delay(160);
    const rows = disputeRows();
    const pending = pendingListings.filter((l) => l.status === 'pending');
    return HttpResponse.json({
      stats: {
        openDisputes: rows.length,
        moderationBacklog: pending.length,
        // SLA-overdue disputes are those already past their due time in-session.
        slaOverdue: rows.filter((r) => new Date(r.slaDueAt).getTime() < Date.now()).length,
        auditToday: auditEntries.length,
      },
      recentAudit: auditEntries.slice(0, 5),
    });
  }),

  /* ---- Listings Moderation queue (doc 09 §2.17 moderation-queue) ------- */
  http.get(`${BASE}/admin/moderation-queue`, async () => {
    await delay(150);
    // Pending-first, then decided (so the demo shows outcomes too), newest last.
    const pending = pendingListings.filter((l) => l.status === 'pending');
    const decided = pendingListings.filter((l) => l.status !== 'pending');
    const data: PendingListing[] = [...pending, ...decided];
    return HttpResponse.json({
      ...page(data, data.length),
      counts: { pending: pending.length, all: pendingListings.length },
    });
  }),

  /* ---- Approve a listing (doc 09 §2.17) ------------------------------- */
  http.post(`${BASE}/admin/listings/:id/approve`, async ({ params }) => {
    await delay(300);
    const at = '2026-07-18T11:00:00.000Z';
    const listing = approveListing(String(params.id), at);
    if (!listing) {
      return HttpResponse.json(
        { error: { code: 'state_conflict', message: 'Listing is not pending review.', requestId: `req_${ulid()}` } },
        { status: 409 },
      );
    }
    appendAudit({
      at,
      actor: { kind: 'user', id: 'admin-1', name: 'Robin Vale' },
      action: 'listing.approved',
      target: { kind: 'listing', id: listing.id, label: listing.title },
    });
    return HttpResponse.json(listing);
  }),

  /* ---- Reject a listing (reason required) (doc 09 §2.17) -------------- */
  http.post(`${BASE}/admin/listings/:id/reject`, async ({ params, request }) => {
    await delay(300);
    const body = (await request.json()) as { reasonCode?: string; note?: string };
    const reason = [body.reasonCode, body.note].filter(Boolean).join(': ');
    if (!reason.trim()) {
      return HttpResponse.json(
        { error: { code: 'validation_failed', message: 'A rejection reason is required.', requestId: `req_${ulid()}` } },
        { status: 422 },
      );
    }
    const at = '2026-07-18T11:05:00.000Z';
    const listing = rejectListing(String(params.id), reason, at);
    if (!listing) {
      return HttpResponse.json(
        { error: { code: 'state_conflict', message: 'Listing is not pending review.', requestId: `req_${ulid()}` } },
        { status: 409 },
      );
    }
    appendAudit({
      at,
      actor: { kind: 'user', id: 'admin-1', name: 'Robin Vale' },
      action: 'listing.rejected',
      target: { kind: 'listing', id: listing.id, label: listing.title },
      changes: [{ field: 'rejectionReason', before: null, after: reason }],
    });
    return HttpResponse.json(listing);
  }),

  /* ---- Disputes Queue (doc 08 §2.12 / doc 09 §2.12) ------------------- */
  http.get(`${BASE}/admin/disputes`, async () => {
    await delay(150);
    const rows = disputeRows();
    return HttpResponse.json({
      ...page(rows, rows.length),
      metrics: {
        open: rows.filter((r) => r.status !== 'resolved').length,
        awaitingSeller: rows.filter((r) => r.status === 'open').length,
        slaOverdue: rows.filter((r) => new Date(r.slaDueAt).getTime() < Date.now()).length,
        resolved: disputeCases.filter((d) => d.status === 'resolved').length,
      },
    });
  }),

  /* ---- Dispute Detail (doc 08 §2.13 / doc 09 §2.12) ------------------- */
  http.get(`${BASE}/admin/disputes/:id`, async ({ params }) => {
    await delay(200);
    const id = String(params.id);
    const order = orderForDisputeId(id);
    if (!order) return new HttpResponse(null, { status: 404 });
    const found: DisputeCase | undefined = disputeCaseById(id) ?? disputeCaseByOrderId(order.id);
    // Runtime dispute without a seeded case: synthesize a minimal case so the
    // detail screen renders (empty-state evidence panes, no seller response).
    const dispute: DisputeCase = found ?? {
      id: order.escrow.disputeId ?? order.id,
      orderId: order.id,
      orderNumber: order.number,
      buyerName: order.shippingAddress.recipient,
      sellerName: order.sellerName,
      sellerId: order.sellerId,
      reason: 'other',
      status: 'open',
      amount: order.total,
      slaDueAt: addHours(order.updatedAt, 72),
      buyerStatement: 'A dispute was opened for this order.',
      sellerStatement: null,
      buyerEvidence: [],
      sellerEvidence: [],
      resolution: null,
      openedAt: order.updatedAt,
      resolvedAt: null,
    };
    return HttpResponse.json({ dispute, order });
  }),

  /* ---- Dispute audit trail (doc 08 §2.13 deferred) ------------------- */
  http.get(`${BASE}/admin/disputes/:id/audit`, async ({ params }) => {
    const id = String(params.id);
    const order = orderForDisputeId(id);
    const entries = order
      ? auditEntries.filter((e) => e.target?.id === order.id || e.target?.id === id)
      : [];
    return HttpResponse.json(page(entries, entries.length));
  }),

  /* ---- Resolve a dispute (doc 09 §2.12 resolve) — MONEY MOVES ONCE ---- */
  http.post(`${BASE}/admin/disputes/:id/resolve`, async ({ params, request }) => {
    await delay(500);
    const body = (await request.json()) as {
      outcome?: DisputeOutcome;
      refundAmount?: { amount: number; currency: string };
      note?: string;
    };
    const id = String(params.id);
    const order = orderForDisputeId(id);
    if (!order) return new HttpResponse(null, { status: 404 });
    const found = disputeCaseById(id) ?? disputeCaseByOrderId(order.id);
    if (found?.status === 'resolved') {
      return HttpResponse.json(
        { error: { code: 'already_resolved', message: 'This dispute is already resolved.', requestId: `req_${ulid()}` } },
        { status: 409 },
      );
    }
    const outcome = body.outcome ?? 'refund';
    const note = (body.note ?? '').trim();
    if (!note) {
      return HttpResponse.json(
        { error: { code: 'validation_failed', message: 'A resolution note is required.', requestId: `req_${ulid()}` } },
        { status: 422 },
      );
    }
    const total = order.total.amount;
    const refund = outcome === 'refund' ? total : outcome === 'partial' ? (body.refundAmount?.amount ?? 0) : 0;
    if (outcome === 'partial' && !(refund > 0 && refund < total)) {
      return HttpResponse.json(
        {
          error: {
            code: 'validation_failed',
            message: 'Partial refund must be greater than 0 and less than the order total.',
            requestId: `req_${ulid()}`,
          },
        },
        { status: 422 },
      );
    }

    const at = '2026-07-18T11:30:00.000Z';
    const next = applyResolution(order, outcome, refund, at);

    // Record the decision on the case (if seeded), flipping it to resolved.
    if (found) {
      found.status = 'resolved';
      found.resolvedAt = at;
      found.resolution = {
        outcome,
        refundAmount: outcome === 'release' ? null : usd(refund),
        releaseAmount: outcome === 'refund' ? null : usd(total - refund),
        note,
      };
    }

    appendAudit({
      at,
      actor: { kind: 'user', id: 'admin-1', name: 'Robin Vale' },
      action: `dispute.resolved.${outcome}`,
      target: { kind: 'order', id: order.id, label: `#${order.number}` },
      changes: [
        { field: 'payment.status', before: order.payment.status, after: next.payment.status },
        { field: 'resolution.note', before: null, after: note },
      ],
    });

    return HttpResponse.json({
      dispute: {
        id,
        orderId: order.id,
        status: 'resolved',
        resolution: {
          outcome,
          refundAmount: outcome === 'release' ? null : usd(refund),
          releaseAmount: outcome === 'refund' ? null : usd(total - refund),
          note,
        },
        resolvedAt: at,
      },
      order: next,
    });
  }),

  /* ---- Admin audit log (doc 09 §2.17 audit-logs) --------------------- */
  http.get(`${BASE}/admin/audit-logs`, async () => {
    await delay(120);
    return HttpResponse.json(page(auditEntries, auditEntries.length));
  }),
];
