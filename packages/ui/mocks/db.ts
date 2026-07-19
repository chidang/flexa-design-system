/**
 * Shared in-memory mock db (doc 15 U13-0). One session-scoped store that every
 * persona's handlers read AND mutate — that shared mutation is what makes the
 * cross-persona workflow ripple (buyer pays → seller fulfils → buyer approves →
 * seller earnings) real within a session.
 *
 * Ownership (doc 15 §5): this file is infra-owned. Tracks import `db`,
 * `recomputeCart` and `registerReset`; they never edit this file. Track-local
 * mutable state lives in the track's own module and hooks into {@link resetDb}
 * via {@link registerReset} at module top level.
 */
import { buildCart, ORDERS, usd, sumMoney, type Cart, type Order } from './data';

export interface Db {
  cart: Cart;
  orders: Map<string, Order>;
}

function seed(): Db {
  return { cart: buildCart(), orders: new Map(ORDERS.map((o) => [o.id, o])) };
}

/** Live-bound module state — mutate freely, reassigned only by {@link resetDb}. */
export let db = seed();

const resetHooks: Array<() => void> = [];

/**
 * Register a track-local reset hook, called by {@link resetDb} after the core
 * db reseeds. Call once at module top level next to your mutable state.
 */
export function registerReset(fn: () => void): void {
  resetHooks.push(fn);
}

/** Restore the seeded dataset — call before mounting the worker. */
export function resetDb(): void {
  db = seed();
  for (const fn of resetHooks) fn();
}

/** Recompute cart totals after a mutation. */
export function recomputeCart(): void {
  for (const g of db.cart.groups) {
    for (const it of g.items) it.lineTotal = usd(it.unitPrice.amount * it.quantity);
    g.subtotal = sumMoney(g.items.map((it) => it.lineTotal));
  }
  db.cart.groups = db.cart.groups.filter((g) => g.items.length > 0);
  db.cart.itemCount = db.cart.groups.reduce(
    (n, g) => n + g.items.reduce((k, it) => k + it.quantity, 0),
    0,
  );
  db.cart.total = sumMoney(db.cart.groups.map((g) => g.subtotal));
}
