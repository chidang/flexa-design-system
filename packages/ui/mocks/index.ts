/**
 * `flexa-ui-kit/mocks` — the deterministic mock backend (doc 13 D-4). MSW handlers
 * generated from the doc 09 resource shapes, plus the typed fixture data and id
 * helpers behind them. `msw` is an optional peer: import this only in dev
 * harnesses/tests, never from `flexa-ui` component code.
 *
 * Browser wiring (`worker`, `startMockWorker`) lives in the `./browser` subpath
 * so this entry stays Node-safe for `setupServer`-based tests.
 */
export { handlers, resetDb } from './handlers';
export { ulid, resetIds } from './ids';
export * from './data';
