/**
 * Deterministic fixture dataset for the U11 reference screens — shapes are a
 * transcription of doc 09 §2 (Listings, Search, Carts, Orders, Payments &
 * Escrow, Sellers, Reviews), field rules per §1.4, Money as integer minor
 * units, timestamps ISO-8601 UTC. Coherence per P10 (doc 12): escrow stage,
 * payment status and order status are always a legal combination, and the
 * dataset spans the closed enums (payment_held / delivered / released /
 * disputed + refunded). Where doc 09 leaves a support shape unpinned (saved
 * filters, wallet, shipping options), the mock uses the smallest coherent
 * shape and says so in a comment.
 *
 * Hand-authored constants keep the data reproducible without randomness; ids
 * come from the monotonic {@link ulid} minter so a sort by id matches creation
 * order like real ULIDs.
 */
import { ulid } from './ids';

/* ---------------------------------------------------------------- primitives */

export interface Money {
  amount: number; // integer minor units (cents)
  currency: string; // ISO-4217, uppercase
}

/** Money constructor — cents in, `{amount, currency}` out. */
export const usd = (amount: number): Money => ({ amount, currency: 'USD' });

/** Sum a list of Money (same currency by construction here). */
export const sumMoney = (parts: Money[]): Money =>
  usd(parts.reduce((n, m) => n + m.amount, 0));

export interface Collection<T> {
  data: T[];
  pageInfo: { nextCursor: string | null; hasMore: boolean; totalCount?: number };
}

/** Wrap a full array as a terminal single-page collection (§1.7). */
export const page = <T>(data: T[], totalCount?: number): Collection<T> => ({
  data,
  pageInfo: { nextCursor: null, hasMore: false, ...(totalCount != null ? { totalCount } : {}) },
});

/* -------------------------------------------------------------------- stores */

export interface Store {
  id: string;
  ownerId: string;
  name: string;
  slug: string;
  description: string | null;
  logoUrl: string | null;
  bannerUrl: string | null;
  rating: number | null;
  reviewCount: number;
  status: 'active' | 'suspended';
  responseTime: string; // human phrase (doc 08 Seller Card) — support field
  createdAt: string;
  updatedAt: string;
}

const store = (
  name: string,
  slug: string,
  rating: number,
  reviewCount: number,
  responseTime: string,
): Store => ({
  id: ulid(),
  ownerId: ulid(),
  name,
  slug,
  description: `${name} — independent maker on the Flexa marketplace.`,
  logoUrl: null,
  bannerUrl: null,
  rating,
  reviewCount,
  status: 'active',
  responseTime,
  createdAt: '2025-11-02T08:00:00.000Z',
  updatedAt: '2026-06-30T08:00:00.000Z',
});

export const STORES: Store[] = [
  store('Studio Mai', 'studio-mai', 4.8, 132, 'within a few hours'),
  store('Nordic Prints', 'nordic-prints', 4.6, 74, 'within a day'),
  store('Atelier Sud', 'atelier-sud', 4.9, 210, 'within an hour'),
];

export const storeById = (id: string): Store | undefined => STORES.find((s) => s.id === id);
export const storeBySlug = (slug: string): Store | undefined =>
  STORES.find((s) => s.slug === slug);

/* -------------------------------------------------------- categories & facets */

export interface Category {
  id: string;
  parentId: string | null;
  name: string;
  slug: string;
  isLeaf: boolean;
  listingCount: number;
}

const CAT_ART = ulid();
const CAT_POSTERS = ulid();
const CAT_FRAMES = ulid();
const CAT_HOME = ulid();
const CAT_LIGHTING = ulid();

export const CATEGORIES: Category[] = [
  { id: CAT_ART, parentId: null, name: 'Art & prints', slug: 'art-prints', isLeaf: false, listingCount: 340 },
  { id: CAT_POSTERS, parentId: CAT_ART, name: 'Posters', slug: 'posters', isLeaf: true, listingCount: 210 },
  { id: CAT_FRAMES, parentId: CAT_ART, name: 'Frames', slug: 'frames', isLeaf: true, listingCount: 130 },
  { id: CAT_HOME, parentId: null, name: 'Home & living', slug: 'home-living', isLeaf: false, listingCount: 190 },
  { id: CAT_LIGHTING, parentId: CAT_HOME, name: 'Lighting', slug: 'lighting', isLeaf: true, listingCount: 88 },
];

/** Attribute definition (doc 09 §2.5) — the Listing Detail buy-box variant
 * Select is derived from a `select` attribute's options, not an invented field. */
export interface Attribute {
  id: string;
  categoryId: string;
  key: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'multi_select' | 'boolean';
  options: { value: string; label: string }[];
  isRequired: boolean;
  isFacet: boolean;
  unit: string | null;
}

export const ATTRIBUTES: Attribute[] = [
  {
    id: ulid(),
    categoryId: CAT_POSTERS,
    key: 'size',
    label: 'Size',
    type: 'select',
    options: [
      { value: 'a3', label: 'A3 — 30×42 cm' },
      { value: 'a2', label: 'A2 — 42×59 cm' },
      { value: 'a1', label: 'A1 — 59×84 cm' },
    ],
    isRequired: true,
    isFacet: true,
    unit: null,
  },
  {
    id: ulid(),
    categoryId: CAT_POSTERS,
    key: 'finish',
    label: 'Finish',
    type: 'select',
    options: [
      { value: 'matte', label: 'Matte' },
      { value: 'satin', label: 'Satin' },
    ],
    isRequired: false,
    isFacet: false,
    unit: null,
  },
];

export const attributesForCategory = (categoryId: string): Attribute[] =>
  ATTRIBUTES.filter((a) => a.categoryId === categoryId);

/* --------------------------------------------------------------- media items */

export interface MediaItem {
  id: string;
  url: string;
  thumbnailUrl: string;
  alt: string;
  position: number;
}

/** A tiny inline SVG data-URL cover so screens render offline with no network
 * images — the mock never ships binary assets. Colour comes from a token-free
 * hue index so covers stay visually distinct. */
function cover(label: string, hue: number): string {
  const svg =
    `<svg xmlns='http://www.w3.org/2000/svg' width='400' height='300'>` +
    `<rect width='400' height='300' fill='hsl(${hue} 45% 88%)'/>` +
    `<text x='50%' y='50%' font-family='sans-serif' font-size='20' fill='hsl(${hue} 40% 35%)' ` +
    `text-anchor='middle' dominant-baseline='middle'>${label}</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

const media = (label: string, hue: number, count = 3): MediaItem[] =>
  Array.from({ length: count }, (_, i) => {
    const url = cover(`${label} ${i + 1}`, hue + i * 8);
    return { id: ulid(), url, thumbnailUrl: url, alt: `${label} — view ${i + 1}`, position: i };
  });

/* ------------------------------------------------------------------ listings */

/** Search card projection (doc 09 §2.6) — denormalized, NOT a full Listing. */
export interface SearchCard {
  id: string;
  title: string;
  slug: string;
  price: Money;
  coverUrl: string;
  sellerId: string;
  sellerName: string;
  rating: number;
  reviewCount: number;
  freeShipping: boolean;
  categoryId: string;
}

/** Full Listing (doc 09 §2.4). */
export interface Listing {
  id: string;
  sellerId: string;
  title: string;
  slug: string;
  description: string;
  categoryId: string;
  attributes: Record<string, unknown>;
  price: Money;
  quantity: number | null;
  media: MediaItem[];
  status: 'active';
  rating: number;
  reviewCount: number;
  publishedAt: string;
  version: number;
  createdAt: string;
  updatedAt: string;
}

interface Seed {
  title: string;
  price: number;
  hue: number;
  rating: number;
  reviews: number;
  quantity: number | null;
  storeIx: number;
  categoryId: string;
  freeShipping: boolean;
}

const SEEDS: Seed[] = [
  { title: 'Vintage brass desk lamp', price: 12900, hue: 32, rating: 4.8, reviews: 132, quantity: 8, storeIx: 0, categoryId: CAT_LIGHTING, freeShipping: true },
  { title: 'Riso print — Coastal dawn', price: 3400, hue: 200, rating: 4.6, reviews: 74, quantity: 25, storeIx: 1, categoryId: CAT_POSTERS, freeShipping: false },
  { title: 'Oak gallery frame A2', price: 4900, hue: 28, rating: 4.9, reviews: 210, quantity: 40, storeIx: 2, categoryId: CAT_FRAMES, freeShipping: true },
  { title: 'Botanical study set of 3', price: 5600, hue: 120, rating: 4.7, reviews: 58, quantity: 12, storeIx: 0, categoryId: CAT_POSTERS, freeShipping: false },
  { title: 'Ceramic table lamp — sand', price: 8800, hue: 40, rating: 4.5, reviews: 41, quantity: 5, storeIx: 2, categoryId: CAT_LIGHTING, freeShipping: true },
  { title: 'Abstract poster — Meridian', price: 3900, hue: 280, rating: 4.4, reviews: 33, quantity: 30, storeIx: 1, categoryId: CAT_POSTERS, freeShipping: false },
  { title: 'Walnut floating shelf', price: 6400, hue: 24, rating: 4.8, reviews: 96, quantity: 18, storeIx: 0, categoryId: CAT_HOME, freeShipping: true },
  { title: 'Linen lampshade — ivory', price: 4200, hue: 44, rating: 4.3, reviews: 22, quantity: 14, storeIx: 2, categoryId: CAT_LIGHTING, freeShipping: false },
  { title: 'City map print — Lisbon', price: 3100, hue: 190, rating: 4.6, reviews: 51, quantity: 60, storeIx: 1, categoryId: CAT_POSTERS, freeShipping: true },
  { title: 'Brass picture rail hooks', price: 1900, hue: 36, rating: 4.9, reviews: 140, quantity: 100, storeIx: 2, categoryId: CAT_FRAMES, freeShipping: false },
  { title: 'Minimal line-art portrait', price: 4500, hue: 300, rating: 4.5, reviews: 29, quantity: 20, storeIx: 0, categoryId: CAT_POSTERS, freeShipping: true },
  { title: 'Terracotta pendant light', price: 9900, hue: 16, rating: 4.7, reviews: 63, quantity: 6, storeIx: 2, categoryId: CAT_LIGHTING, freeShipping: true },
];

function slugify(title: string): string {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

export const LISTINGS: Listing[] = SEEDS.map((s) => {
  const seller = STORES[s.storeIx]!;
  const slug = slugify(s.title);
  return {
    id: ulid(),
    sellerId: seller.id,
    title: s.title,
    slug,
    description:
      `${s.title}. Made to order by ${seller.name}. Ships protected; ` +
      `see the shipping & returns section for lead times and policy.`,
    categoryId: s.categoryId,
    attributes: s.categoryId === CAT_POSTERS ? { size: 'a2', finish: 'matte' } : {},
    price: usd(s.price),
    quantity: s.quantity,
    media: media(s.title.split(' ')[0]!, s.hue),
    status: 'active',
    rating: s.rating,
    reviewCount: s.reviews,
    publishedAt: '2026-05-01T08:00:00.000Z',
    version: 1,
    createdAt: '2026-05-01T08:00:00.000Z',
    updatedAt: '2026-06-01T08:00:00.000Z',
  };
});

export const listingById = (id: string): Listing | undefined =>
  LISTINGS.find((l) => l.id === id);
export const listingBySlug = (slug: string): Listing | undefined =>
  LISTINGS.find((l) => l.slug === slug);

/** Project a Listing to its search-card shape. */
export const toSearchCard = (l: Listing): SearchCard => {
  const seed = SEEDS[LISTINGS.indexOf(l)]!;
  return {
    id: l.id,
    title: l.title,
    slug: l.slug,
    price: l.price,
    coverUrl: l.media[0]!.url,
    sellerId: l.sellerId,
    sellerName: storeById(l.sellerId)!.name,
    rating: l.rating,
    reviewCount: l.reviewCount,
    freeShipping: seed.freeShipping,
    categoryId: l.categoryId,
  };
};

export const SEARCH_CARDS: SearchCard[] = LISTINGS.map(toSearchCard);

/** Facets ride the search response (doc 09 §2.6); keys reused as filter params. */
export interface Facet {
  key: string;
  label: string;
  values: { value: string; label: string; count: number }[];
}

export const FACETS: Facet[] = [
  {
    key: 'categoryId',
    label: 'Category',
    values: CATEGORIES.filter((c) => c.isLeaf).map((c) => ({
      value: c.id,
      label: c.name,
      count: SEARCH_CARDS.filter((s) => s.categoryId === c.id).length,
    })),
  },
  {
    key: 'sellerId',
    label: 'Seller',
    values: STORES.map((s) => ({
      value: s.id,
      label: s.name,
      count: SEARCH_CARDS.filter((c) => c.sellerId === s.id).length,
    })),
  },
  {
    key: 'shipping',
    label: 'Shipping',
    values: [{ value: 'free', label: 'Free shipping', count: SEARCH_CARDS.filter((c) => c.freeShipping).length }],
  },
];

/* -------------------------------------------------------------- saved filters */

/** Saved search (doc 09 hints §2 me/saved-filters; shape kept minimal). */
export interface SavedSearch {
  id: string;
  name: string;
  query: string;
}

export const SAVED_SEARCHES: SavedSearch[] = [
  { id: ulid(), name: 'Lamps under $100', query: 'lamp&priceMax=10000' },
  { id: ulid(), name: 'Free-shipping posters', query: 'poster&shipping=free' },
];

/* -------------------------------------------------------------------- reviews */

export interface Review {
  id: string;
  listingId: string;
  authorName: string;
  rating: number;
  title: string;
  body: string;
  createdAt: string;
}

const REVIEW_BODIES = [
  'Beautiful quality and it arrived faster than expected. Exactly as pictured.',
  'Great value. Packaging was thoughtful and the finish is lovely in person.',
  'Good overall — colour is a touch warmer than the photo but still gorgeous.',
  'Seller answered my questions quickly and shipped the same day. Recommend.',
];

export const reviewsForListing = (listingId: string): Review[] =>
  Array.from({ length: 4 }, (_, i) => ({
    id: ulid(),
    listingId,
    authorName: ['A. Rivera', 'J. Okafor', 'M. Lindqvist', 'S. Haddad'][i]!,
    rating: [5, 5, 4, 5][i]!,
    title: ['Stunning', 'Excellent value', 'Very good', 'Fast & friendly'][i]!,
    body: REVIEW_BODIES[i]!,
    createdAt: `2026-06-${String(10 + i).padStart(2, '0')}T10:00:00.000Z`,
  }));

/* ---------------------------------------------------------------------- cart */

export interface CartItem {
  id: string;
  listingId: string;
  title: string;
  coverUrl: string;
  unitPrice: Money;
  quantity: number;
  lineTotal: Money;
  isAvailable: boolean;
}

export interface CartGroup {
  sellerId: string;
  sellerName: string;
  items: CartItem[];
  subtotal: Money;
}

export interface Cart {
  id: string;
  buyerId: string;
  groups: CartGroup[];
  itemCount: number;
  total: Money;
}

const cartLine = (listing: Listing, quantity: number): CartItem => ({
  id: ulid(),
  listingId: listing.id,
  title: listing.title,
  coverUrl: listing.media[0]!.url,
  unitPrice: listing.price,
  quantity,
  lineTotal: usd(listing.price.amount * quantity),
  isAvailable: true,
});

/** Build the seeded two-seller cart fresh (so handler mutations start clean). */
export function buildCart(): Cart {
  const l0 = LISTINGS[1]!; // Nordic Prints — Riso print
  const l1 = LISTINGS[8]!; // Nordic Prints — Lisbon map
  const l2 = LISTINGS[0]!; // Studio Mai — brass lamp
  const groupA: CartGroup = {
    sellerId: l0.sellerId,
    sellerName: storeById(l0.sellerId)!.name,
    items: [cartLine(l0, 2), cartLine(l1, 1)],
    subtotal: usd(l0.price.amount * 2 + l1.price.amount),
  };
  const groupB: CartGroup = {
    sellerId: l2.sellerId,
    sellerName: storeById(l2.sellerId)!.name,
    items: [cartLine(l2, 1)],
    subtotal: usd(l2.price.amount),
  };
  const groups = [groupA, groupB];
  const itemCount = groups.reduce((n, g) => n + g.items.reduce((k, it) => k + it.quantity, 0), 0);
  return {
    id: ulid(),
    buyerId: ulid(),
    groups,
    itemCount,
    total: sumMoney(groups.map((g) => g.subtotal)),
  };
}

/* --------------------------------------------------- checkout support shapes */

export interface Address {
  id: string;
  label: string;
  recipient: string;
  line1: string;
  city: string;
  postalCode: string;
  countryCode: string;
  phone: string;
  isDefault: boolean;
}

export const ADDRESSES: Address[] = [
  {
    id: ulid(),
    label: 'Home',
    recipient: 'Dana Rivera',
    line1: '18 Rue des Merles',
    city: 'Lyon',
    postalCode: '69003',
    countryCode: 'FR',
    phone: '+33 6 12 34 56 78',
    isDefault: true,
  },
  {
    id: ulid(),
    label: 'Studio',
    recipient: 'Dana Rivera',
    line1: '4 Passage du Nord',
    city: 'Lyon',
    postalCode: '69001',
    countryCode: 'FR',
    phone: '+33 6 98 76 54 32',
    isDefault: false,
  },
];

/** Shipping option per seller group (doc 09 §checkout shipping-options). */
export interface ShippingOption {
  id: string;
  sellerId: string;
  label: string;
  price: Money;
  estimate: string;
}

export const shippingOptionsForCart = (cart: Cart): ShippingOption[] =>
  cart.groups.flatMap((g) => [
    { id: ulid(), sellerId: g.sellerId, label: 'Standard', price: usd(g.sellerId === cart.groups[0]?.sellerId ? 0 : 590), estimate: '3–5 business days' },
    { id: ulid(), sellerId: g.sellerId, label: 'Express', price: usd(1290), estimate: '1–2 business days' },
  ]);

export interface PaymentMethod {
  id: string;
  brand: string;
  last4: string;
  expiry: string;
  isDefault: boolean;
}

export const PAYMENT_METHODS: PaymentMethod[] = [
  { id: ulid(), brand: 'Visa', last4: '4242', expiry: '08/28', isDefault: true },
  { id: ulid(), brand: 'Mastercard', last4: '5555', expiry: '11/27', isDefault: false },
];

export interface Wallet {
  balance: Money;
}

export const WALLET: Wallet = { balance: usd(5000) };

/* -------------------------------------------------------- orders & escrow */

export type EscrowStage = 'payment_held' | 'delivered' | 'approved' | 'released' | 'disputed';
export type PaymentStatus =
  | 'pending'
  | 'processing'
  | 'held'
  | 'released'
  | 'refunded'
  | 'partially_refunded'
  | 'failed';
export type OrderStatus = 'created' | 'paid' | 'in_fulfilment' | 'delivered' | 'completed' | 'cancelled';

export interface OrderItem {
  listingId: string;
  title: string;
  coverUrl: string;
  unitPrice: Money;
  quantity: number;
  lineTotal: Money;
}

export interface Escrow {
  id: string;
  orderId: string;
  stage: EscrowStage;
  amount: Money;
  autoReleaseAt: string | null;
  disputeId: string | null;
  heldAt: string | null;
  deliveredAt: string | null;
  releasedAt: string | null;
}

export interface PaymentIntent {
  id: string;
  orderId: string;
  amount: Money;
  status: PaymentStatus;
  provider: string;
  failureCode: string | null;
}

export interface Order {
  id: string;
  number: string;
  buyerId: string;
  sellerId: string;
  sellerName: string;
  items: OrderItem[];
  subtotal: Money;
  fees: Money;
  total: Money;
  refundedTotal: Money;
  status: OrderStatus;
  escrow: Escrow;
  payment: PaymentIntent;
  shippingAddress: Address;
  paidAt: string | null;
  deliveredAt: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export type EscrowEventType =
  | 'held'
  | 'delivered'
  | 'approved'
  | 'released'
  | 'auto_release_scheduled'
  | 'auto_released'
  | 'disputed'
  | 'dispute_resolved'
  | 'refunded';

export interface EscrowEvent {
  id: string;
  escrowId: string;
  type: EscrowEventType;
  actor: 'buyer' | 'seller' | 'admin' | 'system';
  note: string | null;
  createdAt: string;
}

export interface ShipmentEvent {
  id: string;
  status: string;
  location: string;
  at: string;
}

export interface Shipment {
  orderId: string;
  carrier: string;
  trackingNumber: string;
  trackingUrl: string;
  events: ShipmentEvent[];
}

export interface ActivityItem {
  id: string;
  type: string;
  actor: 'buyer' | 'seller' | 'system';
  message: string;
  createdAt: string;
}

interface OrderSeed {
  number: string;
  storeIx: number;
  listingIxs: [number, number][]; // [listingIndex, quantity]
  status: OrderStatus;
  escrowStage: EscrowStage;
  paymentStatus: PaymentStatus;
  createdAt: string;
}

const ORDER_SEEDS: OrderSeed[] = [
  // Awaiting buyer approval — the flagship Order Detail path (Approve delivery).
  { number: 'FX-2026-004213', storeIx: 0, listingIxs: [[0, 1], [6, 1]], status: 'delivered', escrowStage: 'delivered', paymentStatus: 'held', createdAt: '2026-07-10T14:20:00.000Z' },
  // Freshly paid, held — no buyer actions yet.
  { number: 'FX-2026-004180', storeIx: 1, listingIxs: [[1, 2]], status: 'paid', escrowStage: 'payment_held', paymentStatus: 'held', createdAt: '2026-07-12T09:05:00.000Z' },
  // Completed & released.
  { number: 'FX-2026-003990', storeIx: 2, listingIxs: [[2, 1], [9, 2]], status: 'completed', escrowStage: 'released', paymentStatus: 'released', createdAt: '2026-06-28T11:00:00.000Z' },
  // In dispute.
  { number: 'FX-2026-004050', storeIx: 0, listingIxs: [[4, 1]], status: 'delivered', escrowStage: 'disputed', paymentStatus: 'held', createdAt: '2026-07-02T16:30:00.000Z' },
];

function buildOrder(seed: OrderSeed): Order {
  const seller = STORES[seed.storeIx]!;
  const items: OrderItem[] = seed.listingIxs.map(([ix, quantity]) => {
    const l = LISTINGS[ix]!;
    return {
      listingId: l.id,
      title: l.title,
      coverUrl: l.media[0]!.url,
      unitPrice: l.price,
      quantity,
      lineTotal: usd(l.price.amount * quantity),
    };
  });
  const subtotal = sumMoney(items.map((it) => it.lineTotal));
  const fees = usd(Math.round(subtotal.amount * 0.05));
  const total = usd(subtotal.amount + fees.amount);
  const orderId = ulid();
  const paidAt = seed.createdAt.replace('T', 'T').replace(/:00.000Z$/, ':30.000Z');
  const deliveredAt = seed.escrowStage === 'payment_held' ? null : '2026-07-14T09:00:00.000Z';
  const releasedAt = seed.escrowStage === 'released' ? '2026-07-16T10:02:11.000Z' : null;
  const autoReleaseAt =
    seed.escrowStage === 'delivered' ? '2026-07-21T09:00:00.000Z' : null;
  const escrow: Escrow = {
    id: ulid(),
    orderId,
    stage: seed.escrowStage,
    amount: total,
    autoReleaseAt,
    disputeId: seed.escrowStage === 'disputed' ? ulid() : null,
    heldAt: paidAt,
    deliveredAt,
    releasedAt,
  };
  const payment: PaymentIntent = {
    id: ulid(),
    orderId,
    amount: total,
    status: seed.paymentStatus,
    provider: 'stripe',
    failureCode: null,
  };
  return {
    id: orderId,
    number: seed.number,
    buyerId: ADDRESSES[0]!.id,
    sellerId: seller.id,
    sellerName: seller.name,
    items,
    subtotal,
    fees,
    total,
    refundedTotal: usd(0),
    status: seed.status,
    escrow,
    payment,
    shippingAddress: ADDRESSES[0]!,
    paidAt,
    deliveredAt,
    completedAt: seed.status === 'completed' ? releasedAt : null,
    createdAt: seed.createdAt,
    updatedAt: releasedAt ?? deliveredAt ?? paidAt,
  };
}

export const ORDERS: Order[] = ORDER_SEEDS.map(buildOrder);

export const orderById = (id: string): Order | undefined => ORDERS.find((o) => o.id === id);
export const orderByNumber = (number: string): Order | undefined =>
  ORDERS.find((o) => o.number === number);

/** Escrow event log for an order — ascending, coherent with the stage. */
export function escrowEventsForOrder(order: Order): EscrowEvent[] {
  const escrowId = order.escrow.id;
  const events: EscrowEvent[] = [
    { id: ulid(), escrowId, type: 'held', actor: 'system', note: null, createdAt: order.escrow.heldAt! },
  ];
  if (order.escrow.deliveredAt) {
    events.push({ id: ulid(), escrowId, type: 'delivered', actor: 'seller', note: 'Parcel handed to carrier.', createdAt: order.escrow.deliveredAt });
    if (order.escrow.autoReleaseAt) {
      events.push({ id: ulid(), escrowId, type: 'auto_release_scheduled', actor: 'system', note: `Auto-release on ${order.escrow.autoReleaseAt}`, createdAt: order.escrow.deliveredAt });
    }
  }
  if (order.escrow.stage === 'released') {
    events.push({ id: ulid(), escrowId, type: 'approved', actor: 'buyer', note: null, createdAt: order.escrow.releasedAt! });
    events.push({ id: ulid(), escrowId, type: 'released', actor: 'system', note: 'Funds released to seller balance.', createdAt: order.escrow.releasedAt! });
  }
  if (order.escrow.stage === 'disputed') {
    events.push({ id: ulid(), escrowId, type: 'disputed', actor: 'buyer', note: 'Item not as described.', createdAt: '2026-07-15T12:00:00.000Z' });
  }
  return events;
}

export function shipmentForOrder(order: Order): Shipment {
  return {
    orderId: order.id,
    carrier: 'Flexa Post',
    trackingNumber: `FP${order.number.replace(/[^0-9]/g, '')}`,
    trackingUrl: 'https://track.example.com',
    events: [
      { id: ulid(), status: 'Label created', location: 'Lyon, FR', at: order.escrow.heldAt! },
      { id: ulid(), status: 'In transit', location: 'Paris, FR', at: '2026-07-13T08:00:00.000Z' },
      ...(order.escrow.deliveredAt
        ? [{ id: ulid(), status: 'Delivered', location: 'Lyon, FR', at: order.escrow.deliveredAt }]
        : []),
    ],
  };
}

export function activityForOrder(order: Order): ActivityItem[] {
  const items: ActivityItem[] = [
    { id: ulid(), type: 'order_placed', actor: 'buyer', message: `Order ${order.number} placed`, createdAt: order.createdAt },
    { id: ulid(), type: 'payment_held', actor: 'system', message: 'Payment held in escrow', createdAt: order.escrow.heldAt! },
  ];
  if (order.escrow.deliveredAt) {
    items.push({ id: ulid(), type: 'delivered', actor: 'seller', message: 'Seller marked the order delivered', createdAt: order.escrow.deliveredAt });
  }
  if (order.escrow.releasedAt) {
    items.push({ id: ulid(), type: 'released', actor: 'system', message: 'Funds released to the seller', createdAt: order.escrow.releasedAt });
  }
  return items;
}
