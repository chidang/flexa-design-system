/**
 * U13-E messages-track fixture drift-lock (doc 15 §4). Mirrors `mocks.spec.ts`
 * style: guards that the conversation/message fixtures stay coherent so the
 * two-pane Messages screen is a faithful proof — deterministic Crockford ids,
 * ISO-8601 UTC timestamps ordered within a thread, subjects that reference REAL
 * order/listing/store ids from `data.ts`, and a locked disputed-order thread.
 */
import { describe, it, expect } from 'vitest';
import { LISTINGS, ORDERS, STORES } from './data';
import {
  CONVERSATIONS,
  MESSAGES,
  MESSAGE_BUYER,
  type ConversationRecord,
} from './data.messages';

const CROCKFORD = /^[0-9A-HJKMNP-TV-Z]{26}$/;
const ISO_UTC = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;

const orderIds = new Set(ORDERS.map((o) => o.id));
const listingIds = new Set(LISTINGS.map((l) => l.id));
const storeOwnerIds = new Set(STORES.map((s) => s.ownerId));

describe('messages fixtures — ids', () => {
  it('mints 26-char Crockford ULIDs for conversations & messages', () => {
    for (const c of CONVERSATIONS) expect(c.id).toMatch(CROCKFORD);
    for (const m of MESSAGES) expect(m.id).toMatch(CROCKFORD);
    expect(MESSAGE_BUYER.id).toMatch(CROCKFORD);
  });

  it('gives every conversation a unique id', () => {
    const ids = CONVERSATIONS.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('messages fixtures — real cross-references (doc 15 §4)', () => {
  it('pins every subject to a real order or listing id from data.ts', () => {
    for (const c of CONVERSATIONS) {
      if (c.subject.kind === 'order') expect(orderIds.has(c.subject.id)).toBe(true);
      else expect(listingIds.has(c.subject.id)).toBe(true);
    }
  });

  it('links every system event card to a real order or listing id', () => {
    for (const m of MESSAGES) {
      if (m.linkTo == null) continue;
      expect(m.sender).toBe('system');
      if (m.linkTo.kind === 'order') expect(orderIds.has(m.linkTo.id)).toBe(true);
      else expect(listingIds.has(m.linkTo.id)).toBe(true);
    }
  });

  it('maps every seller party onto a real store owner id', () => {
    for (const c of CONVERSATIONS) expect(storeOwnerIds.has(c.seller.id)).toBe(true);
  });

  it('gives every message a real parent conversation', () => {
    const convIds = new Set(CONVERSATIONS.map((c) => c.id));
    for (const m of MESSAGES) expect(convIds.has(m.conversationId)).toBe(true);
  });
});

describe('messages fixtures — timestamps & ordering', () => {
  it('emits ISO-8601 UTC timestamps ending in Z', () => {
    for (const c of CONVERSATIONS) expect(c.updatedAt).toMatch(ISO_UTC);
    for (const m of MESSAGES) expect(m.createdAt).toMatch(ISO_UTC);
  });

  it('orders messages ascending within every thread', () => {
    const byThread = new Map<string, ConversationRecord>(
      CONVERSATIONS.map((c) => [c.id, c]),
    );
    for (const c of byThread.values()) {
      const times = MESSAGES.filter((m) => m.conversationId === c.id).map((m) => m.createdAt);
      expect([...times].sort()).toEqual(times);
    }
  });

  it('sets a conversation updatedAt no earlier than its newest message', () => {
    for (const c of CONVERSATIONS) {
      const times = MESSAGES.filter((m) => m.conversationId === c.id).map((m) => m.createdAt);
      const newest = times.sort()[times.length - 1];
      if (newest) expect(c.updatedAt >= newest).toBe(true);
    }
  });
});

describe('messages fixtures — thread states (two-sides demo)', () => {
  it('spans buyer/seller/system senders across the dataset', () => {
    const senders = new Set(MESSAGES.map((m) => m.sender));
    for (const s of ['buyer', 'seller', 'system']) expect(senders.has(s as never)).toBe(true);
  });

  it('locks exactly the disputed-order thread', () => {
    const locked = CONVERSATIONS.filter((c) => c.locked != null);
    expect(locked.length).toBe(1);
    const disputedOrderIds = new Set(
      ORDERS.filter((o) => o.escrow.stage === 'disputed').map((o) => o.id),
    );
    expect(locked[0]!.subject.kind).toBe('order');
    expect(disputedOrderIds.has(locked[0]!.subject.id)).toBe(true);
  });

  it('carries at least one attachment fixture (doc 08 §2.7 Thread → Card)', () => {
    const withAttachments = MESSAGES.filter((m) => (m.attachments?.length ?? 0) > 0);
    expect(withAttachments.length).toBeGreaterThan(0);
  });
});
