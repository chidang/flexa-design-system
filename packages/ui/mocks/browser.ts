/**
 * Browser Service Worker wiring for the mock API (doc 13 D-4). The consuming app
 * copies `mockServiceWorker.js` into its public root (via `msw init`) and calls
 * {@link startMockWorker} before rendering. Kept out of {@link ./index} so the
 * handlers/fixtures stay importable in Node (tests via `setupServer`) without
 * pulling in the browser-only `msw/browser` entry.
 */
import { setupWorker } from 'msw/browser';
import { handlers, resetDb } from './handlers';

export const worker = setupWorker(...handlers);

/** Reset seeded state and start intercepting. `onUnhandledRequest: 'bypass'` so
 * real asset/HMR requests pass through untouched. The worker URL is RELATIVE by
 * default (resolves against the page, not the origin root), so an app mounted
 * at a subpath — e.g. the workbench served under fds.sitebefy.com/kitchen-sink/
 * — registers /kitchen-sink/mockServiceWorker.js instead of 404ing at /. */
export async function startMockWorker(options?: { serviceWorkerUrl?: string }): Promise<void> {
  resetDb();
  await worker.start({
    onUnhandledRequest: 'bypass',
    quiet: true,
    serviceWorker: { url: options?.serviceWorkerUrl ?? 'mockServiceWorker.js' },
  });
}
