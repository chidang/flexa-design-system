/**
 * Pending-listing moderation store (doc 15 §3 item 6) — the ONE sanctioned
 * cross-persona store besides `db.ts`. The seller track submits into it
 * (Listing Editor, flow S2); the admin track reads and decides (Listings
 * Moderation, flow A1). Infra-owned: tracks import, never edit.
 *
 * Determinism: mutators take timestamps as arguments — callers pass fixed ISO
 * strings (never `Date.now()`), matching the fixture rules (doc 13 D-4).
 */
import { registerReset } from './db';
import { ulid } from './ids';
import type { Money } from './data';

export type ModerationStatus = 'pending' | 'approved' | 'rejected';

export interface PendingListing {
  id: string;
  title: string;
  description: string;
  categoryId: string;
  sellerId: string;
  sellerName: string;
  price: Money;
  coverUrl: string;
  status: ModerationStatus;
  rejectReason: string | null;
  submittedAt: string;
  decidedAt: string | null;
}

/** Live store — starts empty each session; the seller track populates it. */
export const pendingListings: PendingListing[] = [];

registerReset(() => {
  pendingListings.length = 0;
});

/** Seller side (flow S2): submit a listing for review. */
export function submitListing(
  input: Omit<PendingListing, 'id' | 'status' | 'rejectReason' | 'decidedAt'>,
): PendingListing {
  const listing: PendingListing = {
    ...input,
    id: ulid(),
    status: 'pending',
    rejectReason: null,
    decidedAt: null,
  };
  pendingListings.push(listing);
  return listing;
}

/** Admin side (flow A1): approve a pending listing. */
export function approveListing(id: string, decidedAt: string): PendingListing | null {
  const listing = pendingListings.find((l) => l.id === id);
  if (!listing || listing.status !== 'pending') return null;
  listing.status = 'approved';
  listing.decidedAt = decidedAt;
  return listing;
}

/** Admin side (flow A1): reject a pending listing with a required reason. */
export function rejectListing(id: string, reason: string, decidedAt: string): PendingListing | null {
  const listing = pendingListings.find((l) => l.id === id);
  if (!listing || listing.status !== 'pending') return null;
  listing.status = 'rejected';
  listing.rejectReason = reason;
  listing.decidedAt = decidedAt;
  return listing;
}
