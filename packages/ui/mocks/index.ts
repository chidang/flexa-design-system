/**
 * `flexa-ui-kit/mocks` — the deterministic mock backend (doc 13 D-4). MSW handlers
 * generated from the doc 09 resource shapes, plus the typed fixture data and id
 * helpers behind them. `msw` is an optional peer: import this only in dev
 * harnesses/tests, never from `flexa-ui` component code.
 *
 * Browser wiring (`worker`, `startMockWorker`) lives in the `./browser` subpath
 * so this entry stays Node-safe for `setupServer`-based tests.
 *
 * U13 (doc 15): handlers/data split per persona track (buyer/seller/admin/
 * messages) so parallel tracks own disjoint files; the shared mutable db lives
 * in `db.ts`, the cross-persona moderation store in `moderation.ts`.
 */
export { handlers, resetDb } from './handlers';
export { registerReset } from './db';
export { ulid, resetIds } from './ids';
export * from './data';
export * from './data.buyer';
export * from './data.seller';
export * from './data.admin';
export * from './data.messages';
export * from './moderation';
