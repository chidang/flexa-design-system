/**
 * Status → tone, the single mapping every domain component shares (doc 04 §5
 * "Status → tone mapping (binding)"). The U2 exit criteria promised this table
 * "exported as code (single source for all later domain components)"; U8 —
 * Commerce is its first consumer (Payment Status, Order Card, Invoice Card,
 * Listing Card, Shipping/Escrow Timeline all colour a Badge from a §5 status).
 *
 * The doc keys the table by *value class*, not by enum — so one value→tone map
 * covers every §5 enum, because a value like `delivered` reads `success`
 * wherever it appears. The only context-sensitive value is `refunded`: `neutral`
 * in buyer-facing order history (a completed outcome), `danger` in
 * payments/admin reconciliation (the default here). Colour is never used alone —
 * callers pair the tone with the status text/icon (§1.7.7).
 */
import type { Tone } from './enums';

/** Where a status is being shown — flips the one context-sensitive mapping. */
export type StatusToneContext = 'default' | 'buyer-history';

/**
 * The §5 binding table, value → tone. Every distinct value across all §5 enums
 * (PaymentStatus, EscrowStage, OrderStatus, ShipmentStatus, InvoiceStatus,
 * ListingStatus, DisputeStatus, PayoutStatus, JobStatus, LogLevel, AiStatus…)
 * is classified here so a component never re-derives a tone locally.
 */
const STATUS_TONE: Record<string, Tone> = {
  // neutral — inert / not-yet-started / archived
  pending: 'neutral',
  queued: 'neutral',
  draft: 'neutral',
  scheduled: 'neutral',
  idle: 'neutral',
  label_created: 'neutral',
  archived: 'neutral',
  // info — actively in progress / under review / normal hold
  processing: 'info',
  in_transit: 'info',
  running: 'info',
  generating: 'info',
  open: 'info',
  under_review: 'info',
  seller_responded: 'info',
  in_fulfilment: 'info',
  out_for_delivery: 'info',
  held: 'info',
  payment_held: 'info',
  // success — positive terminal / active / delivered
  paid: 'success',
  released: 'success',
  delivered: 'success',
  completed: 'success',
  active: 'success',
  succeeded: 'success',
  approved: 'success',
  resolved: 'success',
  online: 'success',
  // warning — awaiting attention / degraded but recoverable
  created: 'warning', // order awaiting payment (§5)
  on_hold: 'warning',
  paused: 'warning',
  delayed: 'warning',
  overdue: 'warning',
  partially_refunded: 'warning',
  retrying: 'warning',
  pending_review: 'warning', // listing awaiting moderation
  returned: 'warning',
  // danger — negative terminal / failure / admin-suspended
  failed: 'danger',
  cancelled: 'danger',
  rejected: 'danger',
  disputed: 'danger',
  void: 'danger',
  refunded: 'danger', // reconciliation default; buyer-history flips to neutral
  suspended: 'danger',
  critical: 'danger',
  error: 'danger',
};

/**
 * Tone for a §5 status value. Unknown values fall back to `neutral` (never
 * throws — a forward-compatible status appended to the doc renders inertly until
 * classified). Pass `'buyer-history'` for the buyer order-history view, where a
 * `refunded` outcome reads `neutral` rather than `danger` (§5 note).
 */
export function statusTone(status: string, context: StatusToneContext = 'default'): Tone {
  if (status === 'refunded' && context === 'buyer-history') return 'neutral';
  return STATUS_TONE[status] ?? 'neutral';
}

/**
 * Human label for a snake_case status: underscores → spaces, first letter
 * capitalised (`in_fulfilment` → `In fulfilment`, `out_for_delivery` → `Out for
 * delivery`). Components accept an explicit label override for i18n; this is the
 * sensible English default.
 */
export function formatStatusLabel(status: string): string {
  const spaced = status.replace(/_/g, ' ');
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}
