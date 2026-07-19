/**
 * U13-E messages-track handlers (doc 15 §4 — conversations + chat messages,
 * flow B5). OWNED by the messages track; no other track edits this file
 * (doc 15 §5). Every handler cites its doc 09 §2.14 endpoint, uses
 * `const BASE = '/v1'`, and stays deterministic (ulid from './ids', fixed ISO
 * timestamps from `MESSAGES_NOW`).
 *
 * Conversation state is module-scoped and reseeded via `registerReset` from
 * './db' so the seeded threads restore between sessions. Fixtures reference real
 * order/listing/store ids (data.messages.ts), so system event cards deep-link
 * to real screens. Posting a message appends to the thread and bumps its
 * `updatedAt`; a locked conversation rejects sends with 409.
 */
import { http, HttpResponse, delay, type HttpHandler } from 'msw';
import { page } from './data';
import {
  CONVERSATIONS,
  MESSAGES,
  MESSAGES_NOW,
  type ConversationRecord,
  type MessageRecord,
} from './data.messages';
import { registerReset } from './db';
import { ulid } from './ids';

const BASE = '/v1';

/* --------------------------------------------------------- module state */

/** Live conversation rows (mutated in place; reseeded on reset). */
let conversations: ConversationRecord[] = CONVERSATIONS.map((c) => ({ ...c }));
/** Live message log across every thread (appended on POST; reseeded on reset). */
let messages: MessageRecord[] = MESSAGES.map((m) => ({ ...m }));

/** Restore the seeded threads — hooked into `resetDb` (doc 15 §3 item 1). */
registerReset(() => {
  conversations = CONVERSATIONS.map((c) => ({ ...c }));
  messages = MESSAGES.map((m) => ({ ...m }));
});

const conversationById = (id: string): ConversationRecord | undefined =>
  conversations.find((c) => c.id === id);

/** Messages for a thread, oldest → newest (the screen renders ascending). */
const messagesFor = (conversationId: string): MessageRecord[] =>
  messages
    .filter((m) => m.conversationId === conversationId)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));

/* ------------------------------------------------------------- handlers */

export const messagesHandlers: HttpHandler[] = [
  /* ---- Conversations list (doc 09 §2.14) — Messages list pane ---------- */
  http.get(`${BASE}/conversations`, async ({ request }) => {
    await delay(150);
    const url = new URL(request.url);
    const filter = url.searchParams.get('filter') ?? 'all';
    const subjectType = url.searchParams.get('subjectType');
    const subjectId = url.searchParams.get('subjectId');
    let data = [...conversations].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    if (subjectType) data = data.filter((c) => c.subject.kind === subjectType);
    if (subjectId) data = data.filter((c) => c.subject.id === subjectId);
    if (filter === 'unread') data = data.filter((c) => c.buyerUnread > 0 || c.sellerUnread > 0);
    return HttpResponse.json(page(data, data.length));
  }),

  /* ---- Single conversation (doc 09 §2.14) ----------------------------- */
  http.get(`${BASE}/conversations/:id`, ({ params }) => {
    const conversation = conversationById(String(params.id));
    return conversation
      ? HttpResponse.json(conversation)
      : new HttpResponse(null, { status: 404 });
  }),

  /* ---- Messages in a conversation (doc 09 §2.14) — chat pane ----------- */
  http.get(`${BASE}/conversations/:id/messages`, async ({ params }) => {
    await delay(180);
    const conversation = conversationById(String(params.id));
    if (!conversation) return new HttpResponse(null, { status: 404 });
    return HttpResponse.json(page(messagesFor(conversation.id)));
  }),

  /* ---- Send a message (doc 09 §2.14) — composer POST ------------------ */
  http.post(`${BASE}/conversations/:id/messages`, async ({ params, request }) => {
    await delay(220);
    const conversation = conversationById(String(params.id));
    if (!conversation) return new HttpResponse(null, { status: 404 });
    if (conversation.locked) {
      return HttpResponse.json(
        {
          error: {
            code: 'conversation_locked',
            message: conversation.locked,
            requestId: `req_${ulid()}`,
          },
        },
        { status: 409 },
      );
    }
    const body = (await request.json()) as { body: string; sender?: 'buyer' | 'seller' };
    const sender = body.sender === 'seller' ? 'seller' : 'buyer';
    const created: MessageRecord = {
      id: ulid(),
      conversationId: conversation.id,
      sender,
      body: body.body,
      createdAt: MESSAGES_NOW,
    };
    messages.push(created);
    conversation.updatedAt = MESSAGES_NOW;
    // The party that just sent clears their own unread; the peer gains one.
    if (sender === 'buyer') {
      conversation.buyerUnread = 0;
      conversation.sellerUnread += 1;
    } else {
      conversation.sellerUnread = 0;
      conversation.buyerUnread += 1;
    }
    return HttpResponse.json(created, { status: 201 });
  }),

  /* ---- Mark read (doc 09 §2.14) — clears unread on select ------------- */
  http.post(`${BASE}/conversations/:id/read`, async ({ params, request }) => {
    const conversation = conversationById(String(params.id));
    if (!conversation) return new HttpResponse(null, { status: 404 });
    const body = (await request.json().catch(() => ({}))) as { party?: 'buyer' | 'seller' };
    if (body.party === 'seller') conversation.sellerUnread = 0;
    else conversation.buyerUnread = 0;
    return new HttpResponse(null, { status: 204 });
  }),
];
