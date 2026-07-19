/**
 * U13-D admin-track fixtures (doc 15 §4/§5) — OWNED by the admin track
 * (dispute records/evidence, audit entries, queue seeds). Deterministic only:
 * `ulid()` from './ids', fixed ISO-8601 UTC timestamps, Money = integer minor
 * units. Import shared primitives (`page`, ORDERS, STORES…) from './data' and
 * seed the neutral moderation store via './moderation'; never edit those files.
 * Re-exported from the mocks barrel (index.ts).
 *
 * The mocks package is self-contained (tsconfig rootDir = `mocks/`), so audit
 * entries use a local shape here — the screen maps it onto flexa-ui's
 * `AuditEntry` when rendering the Audit Log / Timeline.
 *
 * Cross-persona ripple (doc 15 §0):
 *  • Moderation — the seller track submits into `pendingListings`; this track
 *    reads/decides. We SEED a few pending listings here (fixed timestamps) so
 *    the admin queue is never empty even before the seller track runs.
 *  • Disputes — the shared `disputed` order in `ORDERS` (and any runtime
 *    dispute the buyer opens via `POST /disputes`, which flips an order's
 *    escrow to `disputed`) surfaces in the queue; the seeded DISPUTE_SEEDS
 *    below carry the admin-only case detail (reason, statements, evidence, SLA).
 */
import { ulid } from './ids';
import { registerReset } from './db';
import { ORDERS, STORES, usd, type Money, type Order } from './data';
import { submitListing, type PendingListing } from './moderation';

/* --------------------------------------------------------------- svg helper */

/** A token-free inline SVG cover (mirrors data.ts `cover`) so nothing binary
 * ships and queue thumbnails / evidence render offline. */
function cover(label: string, hue: number): string {
  const svg =
    `<svg xmlns='http://www.w3.org/2000/svg' width='400' height='300'>` +
    `<rect width='400' height='300' fill='hsl(${hue} 45% 88%)'/>` +
    `<text x='50%' y='50%' font-family='sans-serif' font-size='20' fill='hsl(${hue} 40% 35%)' ` +
    `text-anchor='middle' dominant-baseline='middle'>${label}</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

/* ------------------------------------------------------ moderation queue seed */

interface ModerationSeed {
  title: string;
  description: string;
  categoryId: string;
  storeIx: number;
  price: number;
  hue: number;
  submittedAt: string;
}

const MODERATION_SEEDS: ModerationSeed[] = [
  {
    title: 'Hand-thrown stoneware mug set',
    description: 'Set of four wheel-thrown mugs, reactive glaze. Dishwasher safe.',
    categoryId: 'home-living',
    storeIx: 0,
    price: 6800,
    hue: 30,
    submittedAt: '2026-07-16T08:15:00.000Z',
  },
  {
    title: 'Screen-printed tea towel — Meadow',
    description: '100% linen tea towel, water-based inks, printed to order.',
    categoryId: 'home-living',
    storeIx: 1,
    price: 2400,
    hue: 110,
    submittedAt: '2026-07-16T10:40:00.000Z',
  },
  {
    title: 'Brass reading lamp — Halcyon',
    description: 'Adjustable desk lamp, solid brass, dimmable warm LED.',
    categoryId: 'lighting',
    storeIx: 2,
    price: 15900,
    hue: 38,
    submittedAt: '2026-07-17T09:05:00.000Z',
  },
];

/**
 * Push the seeds into the shared moderation store. Runs once at import and again
 * on every {@link resetDb} (via `registerReset`) so the demo starts coherent.
 * The seller track's runtime submissions append to the same store — no conflict.
 */
function seedModerationQueue(): void {
  for (const s of MODERATION_SEEDS) {
    const seller = STORES[s.storeIx]!;
    submitListing({
      title: s.title,
      description: s.description,
      categoryId: s.categoryId,
      sellerId: seller.id,
      sellerName: seller.name,
      price: usd(s.price),
      coverUrl: cover(s.title.split(' ')[0]!, s.hue),
      submittedAt: s.submittedAt,
    });
  }
}

seedModerationQueue();
registerReset(seedModerationQueue);

/* ---------------------------------------------------------- dispute case meta */

/** Dispute workflow status (doc 08 §2.12 / doc 09 §2.12) — distinct from the
 * order's escrow stage, which stays `disputed` until resolution. */
export type DisputeStatus = 'open' | 'seller_responded' | 'under_review' | 'resolved';
export type DisputeReason = 'not_delivered' | 'not_as_described' | 'damaged' | 'other';
export type DisputeOutcome = 'refund' | 'release' | 'partial';

export interface DisputeEvidence {
  id: string;
  name: string;
  kind: 'image' | 'file';
  url: string;
  note: string | null;
  submittedAt: string;
}

export interface DisputeResolution {
  outcome: DisputeOutcome;
  refundAmount: Money | null;
  releaseAmount: Money | null;
  note: string;
}

/** One admin-visible dispute case (doc 09 §2.12 Dispute + the admin extras the
 * queue/detail screens render: SLA deadline, both statements, both parties'
 * evidence). Money is integer minor units. */
export interface DisputeCase {
  id: string;
  orderId: string;
  orderNumber: string;
  buyerName: string;
  sellerId: string;
  sellerName: string;
  reason: DisputeReason;
  status: DisputeStatus;
  amount: Money;
  /** SLA deadline for a first admin decision — drives the queue countdown. */
  slaDueAt: string;
  buyerStatement: string;
  sellerStatement: string | null;
  buyerEvidence: DisputeEvidence[];
  sellerEvidence: DisputeEvidence[];
  resolution: DisputeResolution | null;
  openedAt: string;
  resolvedAt: string | null;
}

function evidenceImage(label: string, hue: number, note: string, at: string): DisputeEvidence {
  return { id: ulid(), name: `${label}.png`, kind: 'image', url: cover(label, hue), note, submittedAt: at };
}

interface DisputeSeed {
  /** Index into shared ORDERS — MUST reference a `disputed`-stage order. */
  orderIx: number;
  reason: DisputeReason;
  status: DisputeStatus;
  slaDueAt: string;
  buyerStatement: string;
  sellerStatement: string | null;
  openedAt: string;
}

/** ORDERS[3] is the seeded `disputed` order (data.ts ORDER_SEEDS). We attach the
 * admin case detail to it; the queue derives its list from `db.orders` at
 * request time so runtime disputes show up too (see handlers.admin.ts). */
const DISPUTE_SEEDS: DisputeSeed[] = [
  {
    orderIx: 3,
    reason: 'not_as_described',
    status: 'under_review',
    slaDueAt: '2026-07-20T16:30:00.000Z',
    buyerStatement:
      'The lamp arrived with a visible dent on the base and the finish is much darker than the listing photos. I would like a refund.',
    sellerStatement:
      'The item shipped in perfect condition and matches the studio photos. Tracking shows it was handled once; any damage happened in transit.',
    openedAt: '2026-07-15T12:00:00.000Z',
  },
];

/** Build the admin case meta for a seeded dispute. Amount is the order total;
 * buyer/seller names come from the shared order so deep-links resolve. */
function buildDisputeCase(seed: DisputeSeed): DisputeCase {
  const order: Order = ORDERS[seed.orderIx]!;
  return {
    id: order.escrow.disputeId ?? ulid(),
    orderId: order.id,
    orderNumber: order.number,
    buyerName: order.shippingAddress.recipient,
    sellerId: order.sellerId,
    sellerName: order.sellerName,
    reason: seed.reason,
    status: seed.status,
    amount: order.total,
    slaDueAt: seed.slaDueAt,
    buyerStatement: seed.buyerStatement,
    sellerStatement: seed.sellerStatement,
    buyerEvidence: [
      evidenceImage('dent-closeup', 4, 'Dent on the lamp base.', '2026-07-15T12:01:00.000Z'),
      evidenceImage('colour-compare', 40, 'Listing photo vs. what arrived.', '2026-07-15T12:02:00.000Z'),
    ],
    sellerEvidence: seed.sellerStatement
      ? [evidenceImage('studio-shot', 42, 'Original studio photo before shipping.', '2026-07-16T09:00:00.000Z')]
      : [],
    resolution: null,
    openedAt: seed.openedAt,
    resolvedAt: null,
  };
}

/**
 * Live dispute-case store — starts from the seeds each session and is mutated in
 * place by the resolve handler (records the resolution, flips status). Runtime
 * disputes (buyer POSTs to /disputes) don't create a case here; the queue
 * derives a lightweight row for them straight from `db.orders` instead.
 */
export let disputeCases: DisputeCase[] = DISPUTE_SEEDS.map(buildDisputeCase);

/** Look up an admin dispute case by its id or by the order it belongs to. */
export const disputeCaseById = (id: string): DisputeCase | undefined =>
  disputeCases.find((d) => d.id === id);
export const disputeCaseByOrderId = (orderId: string): DisputeCase | undefined =>
  disputeCases.find((d) => d.orderId === orderId);

/* ------------------------------------------------------------------ audit log */

/** Audit actor (mirrors flexa-ui `AuditActor` structurally). */
export interface AdminAuditActor {
  kind: 'user' | 'system' | 'api';
  id?: string;
  name: string;
}

/** One admin audit entry (doc 08 §2.13 Audit Timeline / §3.17 recent activity).
 * Shape mirrors flexa-ui `AuditEntry` so the screen renders it 1:1. Money-moving
 * decisions carry the amounts in `changes` for the drawer detail. */
export interface AdminAuditEntry {
  id: string;
  at: string;
  actor: AdminAuditActor;
  action: string;
  target?: { kind: string; id: string; label: string; href?: string };
  changes?: { field: string; before: unknown; after: unknown }[];
}

/**
 * Admin audit trail. Newest first. `appendAudit` is the ONLY writer (moderation
 * & dispute decisions call it) and is deterministic — the caller passes the
 * timestamp, never `Date.now()`.
 */
export let auditEntries: AdminAuditEntry[] = seedAudit();

function seedAudit(): AdminAuditEntry[] {
  return [
    {
      id: ulid(),
      at: '2026-07-15T12:00:05.000Z',
      actor: { kind: 'system', name: 'Escrow service' },
      action: 'escrow.disputed',
      target: { kind: 'order', id: ORDERS[3]!.id, label: `#${ORDERS[3]!.number}` },
    },
    {
      id: ulid(),
      at: '2026-07-14T09:12:00.000Z',
      actor: { kind: 'user', id: 'admin-1', name: 'Robin Vale' },
      action: 'listing.approved',
      target: { kind: 'listing', id: ulid(), label: 'Ceramic table lamp — sand' },
    },
  ];
}

/** Append an audit entry (newest first) and return it. */
export function appendAudit(entry: Omit<AdminAuditEntry, 'id'> & { id?: string }): AdminAuditEntry {
  const full: AdminAuditEntry = { ...entry, id: entry.id ?? ulid() };
  auditEntries = [full, ...auditEntries];
  return full;
}

/* ------------------------------------------------------------ session resets */

/** Reset dispute cases + audit trail to seed on {@link resetDb}. The moderation
 * queue reset is wired separately above (it lives in the neutral store). */
registerReset(() => {
  disputeCases = DISPUTE_SEEDS.map(buildDisputeCase);
  auditEntries = seedAudit();
});

/* ------------------------------------------------------- reject-reason vocab */

/** Structured reject reasons (doc 08 §2.14 interaction 1 / doc 09 §2.17). */
export const LISTING_REJECT_REASONS: { value: string; label: string }[] = [
  { value: 'prohibited_item', label: 'Prohibited item' },
  { value: 'misleading', label: 'Misleading content' },
  { value: 'ip_violation', label: 'Intellectual-property violation' },
  { value: 'quality', label: 'Poor listing quality' },
  { value: 'other', label: 'Other' },
];

export type { PendingListing };
