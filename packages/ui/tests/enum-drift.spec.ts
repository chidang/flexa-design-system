/**
 * Gate: code enums never drift from doc 04 §5 (`04-component-bible.md`). The
 * CANONICAL map below is an independent, verbatim transcription of the doc; the
 * `src/enums.ts` arrays are the code the components import. They must match
 * exactly (order + casing). Update this map ONLY when the doc changes.
 */
import { describe, expect, it } from 'vitest';
import * as ENUMS from '../src/enums';

const CANONICAL: Record<string, readonly string[]> = {
  // doc 04 §1.9 — control vocabulary (kebab-case)
  SIZES: ['sm', 'md', 'lg'],
  VARIANTS: ['primary', 'secondary', 'ghost', 'danger'],
  TONES: ['neutral', 'info', 'success', 'warning', 'danger'],
  DENSITIES: ['comfortable', 'compact'],
  // doc 04 §5 — domain statuses (snake_case)
  PAYMENT_STATUSES: ['pending', 'processing', 'held', 'released', 'refunded', 'partially_refunded', 'failed'],
  ESCROW_STAGES: ['payment_held', 'delivered', 'approved', 'released', 'disputed'],
  ORDER_STATUSES: ['created', 'paid', 'in_fulfilment', 'delivered', 'completed', 'cancelled'],
  SHIPMENT_STATUSES: ['label_created', 'in_transit', 'out_for_delivery', 'delivered', 'delayed', 'returned', 'failed'],
  INVOICE_STATUSES: ['draft', 'open', 'paid', 'overdue', 'void', 'refunded'],
  LISTING_STATUSES: ['draft', 'pending_review', 'active', 'paused', 'rejected', 'suspended', 'archived'],
  DISPUTE_STATUSES: ['open', 'seller_responded', 'under_review', 'resolved'],
  PAYOUT_STATUSES: ['scheduled', 'processing', 'paid', 'failed', 'on_hold'],
  USER_ROLES: ['guest', 'buyer', 'seller', 'admin', 'support', 'moderator'],
  JOB_STATUSES: ['queued', 'running', 'succeeded', 'failed', 'retrying', 'cancelled'],
  LOG_LEVELS: ['debug', 'info', 'warning', 'error', 'critical'],
  AI_STATUSES: ['idle', 'queued', 'generating', 'succeeded', 'failed', 'cancelled'],
  AI_DECISIONS: ['approved', 'rejected', 'undone'],
};

describe('enum-drift', () => {
  it.each(Object.keys(CANONICAL))('%s matches doc 04 verbatim', (key) => {
    const code = (ENUMS as Record<string, unknown>)[key];
    expect(code, `${key} is not exported from src/enums.ts`).toBeDefined();
    expect(code).toEqual(CANONICAL[key]);
  });

  it('exports no enum the doc does not know about', () => {
    const codeArrays = Object.keys(ENUMS).filter((k) =>
      Array.isArray((ENUMS as Record<string, unknown>)[k]),
    );
    for (const k of codeArrays) expect(CANONICAL).toHaveProperty(k);
  });
});
