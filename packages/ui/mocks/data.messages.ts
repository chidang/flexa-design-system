/**
 * U13-E messages-track fixtures (doc 15 §4/§5) — OWNED by the messages track
 * (conversations, chat messages, system event cards). Deterministic only:
 * `ulid()` from './ids', fixed ISO-8601 UTC timestamps. Every conversation
 * references real order/listing/store ids from './data' so system event cards
 * deep-link to real screens; never edit that file. Re-exported from the mocks
 * barrel (index.ts).
 *
 * Shapes transcribe doc 09 §2.14 (Conversation + Message) with the smallest
 * coherent extras the two-pane screen needs: a `party` per side (buyer/seller),
 * a `subject` that pins a real order/listing, per-message `sender`
 * ('buyer' | 'seller' | 'system') so the screen can flip which side is
 * `data-self` when "View as" toggles, and an optional `locked` reason on the
 * disputed-order thread.
 */
import { ulid } from './ids';
import { LISTINGS, ORDERS, STORES } from './data';

/* --------------------------------------------------------------- parties */

/** A conversation participant projection (doc 09 §2.14 participantIds). */
export interface MessageParty {
  id: string;
  name: string;
}

/** The buyer side is one fixed persona across every thread (single-session). */
export const MESSAGE_BUYER: MessageParty = { id: ulid(), name: 'Dana Rivera' };

/** Each seller party mirrors a real store (doc 09 §2.14 participant). */
function sellerParty(storeIx: number): MessageParty {
  const store = STORES[storeIx]!;
  return { id: store.ownerId, name: store.name };
}

/* --------------------------------------------------------------- messages */

/** Who authored a row — drives the `data-self` flip under the View-as toggle. */
export type MessageSender = 'buyer' | 'seller' | 'system';

/** Attachment on a message (doc 09 §2.14 attachments[]). */
export interface MessageAttachment {
  id: string;
  fileName: string;
  url: string;
  /** Coarse kind → attachment-card icon in FxChat. */
  kind: 'image' | 'file';
}

/**
 * One message (doc 09 §2.14 Message). `system` rows are order-milestone event
 * cards; their `linkTo` deep-links to a real screen (order/listing). Regular
 * rows carry `sender` so the screen resolves `data-self` per View-as party.
 */
export interface MessageRecord {
  id: string;
  conversationId: string;
  sender: MessageSender;
  body: string;
  createdAt: string;
  /** System event cards deep-link to a real order/listing screen. */
  linkTo?: { kind: 'order' | 'listing'; id: string; label: string };
  /** Attachment card fixture (doc 08 §2.7 Thread → Card). */
  attachments?: MessageAttachment[];
}

/* ------------------------------------------------------------ conversations */

/** A conversation (doc 09 §2.14) pinned to a real order or listing subject. */
export interface ConversationRecord {
  id: string;
  buyer: MessageParty;
  seller: MessageParty;
  /** What the thread is about — a real order/listing id + a deep-link label. */
  subject: { kind: 'order' | 'listing'; id: string; label: string };
  /** Unread count from the buyer's perspective. */
  buyerUnread: number;
  /** Unread count from the seller's perspective. */
  sellerUnread: number;
  /** Non-null when the conversation is read-only (disputed order under review). */
  locked: string | null;
  updatedAt: string;
}

/* -------------------------------------------------------------- fixtures */

/**
 * Three seeded threads spanning the closed states the screen must show:
 * a pre-sale listing inquiry (flow B5), an order-scoped fulfilment thread with
 * system milestone cards, and a locked thread on the disputed order.
 */

const listing0 = LISTINGS[0]!; // Studio Mai — Vintage brass desk lamp
const listingDisputed = LISTINGS[4]!; // Atelier-adjacent — Ceramic table lamp
const order0 = ORDERS[0]!; // FX-2026-004213 · Studio Mai · delivered
const orderDisputed = ORDERS[3]!; // FX-2026-004050 · Studio Mai · disputed

const CONV_INQUIRY = ulid();
const CONV_ORDER = ulid();
const CONV_DISPUTED = ulid();

/** Conversation rows (newest activity first). */
export const CONVERSATIONS: ConversationRecord[] = [
  {
    id: CONV_DISPUTED,
    buyer: MESSAGE_BUYER,
    seller: sellerParty(0),
    subject: { kind: 'order', id: orderDisputed.id, label: `Order ${orderDisputed.number}` },
    buyerUnread: 0,
    sellerUnread: 0,
    locked: 'This conversation is locked while the dispute is under review by our team.',
    updatedAt: '2026-07-15T12:05:00.000Z',
  },
  {
    id: CONV_ORDER,
    buyer: MESSAGE_BUYER,
    seller: sellerParty(0),
    subject: { kind: 'order', id: order0.id, label: `Order ${order0.number}` },
    buyerUnread: 1,
    sellerUnread: 0,
    locked: null,
    updatedAt: '2026-07-14T09:12:00.000Z',
  },
  {
    id: CONV_INQUIRY,
    buyer: MESSAGE_BUYER,
    seller: sellerParty(0),
    subject: { kind: 'listing', id: listing0.id, label: listing0.title },
    buyerUnread: 0,
    sellerUnread: 2,
    locked: null,
    updatedAt: '2026-07-11T15:40:00.000Z',
  },
];

/** Build the seeded message log for every conversation (ascending per thread). */
function seedMessages(): MessageRecord[] {
  const inquiry: MessageRecord[] = [
    {
      id: ulid(),
      conversationId: CONV_INQUIRY,
      sender: 'buyer',
      body: `Hi! Is the ${listing0.title} still available in the taller size?`,
      createdAt: '2026-07-11T15:30:00.000Z',
    },
    {
      id: ulid(),
      conversationId: CONV_INQUIRY,
      sender: 'seller',
      body: 'It is — I have three left. Happy to hold one for you if you like.',
      createdAt: '2026-07-11T15:38:00.000Z',
    },
    {
      id: ulid(),
      conversationId: CONV_INQUIRY,
      sender: 'buyer',
      body: 'Perfect, thank you. I will place the order today.',
      createdAt: '2026-07-11T15:40:00.000Z',
    },
  ];

  const orderThread: MessageRecord[] = [
    {
      id: ulid(),
      conversationId: CONV_ORDER,
      sender: 'system',
      body: `Order ${order0.number} paid — payment is held in escrow.`,
      createdAt: '2026-07-10T14:20:30.000Z',
      linkTo: { kind: 'order', id: order0.id, label: `View ${order0.number}` },
    },
    {
      id: ulid(),
      conversationId: CONV_ORDER,
      sender: 'buyer',
      body: 'Thanks for confirming! When do you expect to ship?',
      createdAt: '2026-07-10T14:25:00.000Z',
    },
    {
      id: ulid(),
      conversationId: CONV_ORDER,
      sender: 'seller',
      body: 'Packing it up now — I will hand it to the carrier tomorrow morning.',
      createdAt: '2026-07-11T09:02:00.000Z',
      attachments: [
        {
          id: ulid(),
          fileName: 'packing-slip.pdf',
          url: `#/screens/orders/${order0.id}`,
          kind: 'file',
        },
      ],
    },
    {
      id: ulid(),
      conversationId: CONV_ORDER,
      sender: 'system',
      body: `Order ${order0.number} marked shipped by the seller.`,
      createdAt: '2026-07-14T09:00:00.000Z',
      linkTo: { kind: 'order', id: order0.id, label: `Track ${order0.number}` },
    },
    {
      id: ulid(),
      conversationId: CONV_ORDER,
      sender: 'seller',
      body: 'On its way! Let me know once it arrives.',
      createdAt: '2026-07-14T09:12:00.000Z',
    },
  ];

  const disputed: MessageRecord[] = [
    {
      id: ulid(),
      conversationId: CONV_DISPUTED,
      sender: 'buyer',
      body: `The ${listingDisputed.title} arrived with a chip on the base — can we sort this out?`,
      createdAt: '2026-07-15T11:50:00.000Z',
    },
    {
      id: ulid(),
      conversationId: CONV_DISPUTED,
      sender: 'seller',
      body: 'So sorry to hear that. Could you share a photo of the damage?',
      createdAt: '2026-07-15T11:58:00.000Z',
    },
    {
      id: ulid(),
      conversationId: CONV_DISPUTED,
      sender: 'system',
      body: `A dispute was opened on order ${orderDisputed.number}.`,
      createdAt: '2026-07-15T12:05:00.000Z',
      linkTo: { kind: 'order', id: orderDisputed.id, label: `View ${orderDisputed.number}` },
    },
  ];

  return [...inquiry, ...orderThread, ...disputed];
}

/** All seeded messages across the three threads (used to reseed the store). */
export const MESSAGES: MessageRecord[] = seedMessages();

/** Deterministic UTC clock the message handlers stamp appended rows with. */
export const MESSAGES_NOW = '2026-07-18T10:00:00.000Z';
