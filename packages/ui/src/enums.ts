/**
 * Canonical enums — the single source components import for their union types.
 *
 * These arrays are the CODE side of the drift-lock: `tests/enum-drift.spec.ts`
 * holds an independent, verbatim copy of doc 04 §5 (`04-component-bible.md`) and
 * asserts these match, character for character. Components MUST import their
 * unions from here (never re-type a literal union inline), so a single edit here
 * — caught by the gate against the doc — keeps the whole kit in step with the
 * SSOT. Casing is authoritative: control vocabulary is kebab-case, domain
 * statuses are snake_case (doc 04 §5).
 */

// ── Control vocabulary (doc 04 §1.9) ────────────────────────────────────────
export const SIZES = ['sm', 'md', 'lg'] as const;
export type Size = (typeof SIZES)[number];

export const VARIANTS = ['primary', 'secondary', 'ghost', 'danger'] as const;
export type Variant = (typeof VARIANTS)[number];

export const TONES = ['neutral', 'info', 'success', 'warning', 'danger'] as const;
export type Tone = (typeof TONES)[number];

export const DENSITIES = ['comfortable', 'compact'] as const;
export type Density = (typeof DENSITIES)[number];

// ── Domain status enums (doc 04 §5, shared with docs 08/09) ─────────────────
export const PAYMENT_STATUSES = [
  'pending',
  'processing',
  'held',
  'released',
  'refunded',
  'partially_refunded',
  'failed',
] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const ESCROW_STAGES = [
  'payment_held',
  'delivered',
  'approved',
  'released',
  'disputed',
] as const;
export type EscrowStage = (typeof ESCROW_STAGES)[number];

export const ORDER_STATUSES = [
  'created',
  'paid',
  'in_fulfilment',
  'delivered',
  'completed',
  'cancelled',
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const SHIPMENT_STATUSES = [
  'label_created',
  'in_transit',
  'out_for_delivery',
  'delivered',
  'delayed',
  'returned',
  'failed',
] as const;
export type ShipmentStatus = (typeof SHIPMENT_STATUSES)[number];

export const INVOICE_STATUSES = [
  'draft',
  'open',
  'paid',
  'overdue',
  'void',
  'refunded',
] as const;
export type InvoiceStatus = (typeof INVOICE_STATUSES)[number];

export const LISTING_STATUSES = [
  'draft',
  'pending_review',
  'active',
  'paused',
  'rejected',
  'suspended',
  'archived',
] as const;
export type ListingStatus = (typeof LISTING_STATUSES)[number];

export const DISPUTE_STATUSES = [
  'open',
  'seller_responded',
  'under_review',
  'resolved',
] as const;
export type DisputeStatus = (typeof DISPUTE_STATUSES)[number];

export const PAYOUT_STATUSES = [
  'scheduled',
  'processing',
  'paid',
  'failed',
  'on_hold',
] as const;
export type PayoutStatus = (typeof PAYOUT_STATUSES)[number];

export const USER_ROLES = [
  'guest',
  'buyer',
  'seller',
  'admin',
  'support',
  'moderator',
] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const JOB_STATUSES = [
  'queued',
  'running',
  'succeeded',
  'failed',
  'retrying',
  'cancelled',
] as const;
export type JobStatus = (typeof JOB_STATUSES)[number];

export const LOG_LEVELS = ['debug', 'info', 'warning', 'error', 'critical'] as const;
export type LogLevel = (typeof LOG_LEVELS)[number];

export const AI_STATUSES = [
  'idle',
  'queued',
  'generating',
  'succeeded',
  'failed',
  'cancelled',
] as const;
export type AiStatus = (typeof AI_STATUSES)[number];

export const AI_DECISIONS = ['approved', 'rejected', 'undone'] as const;
export type AiDecision = (typeof AI_DECISIONS)[number];
