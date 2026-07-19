// @vitest-environment jsdom
/**
 * P-G — a11y audit of the composed kitchen-sink reference screens (doc 16 §1).
 *
 * REPORT-ONLY drift lock: axe runs over every screen route, fully loaded
 * against the real msw handler set (`flexa-ui-kit/mocks` + `setupServer`,
 * mirroring `packages/ui/mocks/integration.spec.ts`). Recorded violations per
 * screen live in `EXPECTED_VIOLATIONS` below and are catalogued (rule ×
 * impact × count × suggested owner track) in `ui-kit/a11y-screens-findings.md`.
 * The suite stays green on the recorded baseline:
 *
 *   • a NEW axe rule id on a screen fails the suite (regressions are caught);
 *   • recorded rule ids keep passing (fixes are wave-2 work — doc 16 §4 —
 *     because they touch screens owned by the E-tracks this wave);
 *   • screens with an empty allowlist assert ZERO violations;
 *   • a FIXED rule id does not fail the suite (subset assertion), so E-track
 *     fixes never collide with this gate — prune the allowlist + findings doc
 *     when a fix lands.
 *
 * Method mirrors the kit's per-component axe gate (packages/ui/tests/
 * a11y.spec.ts): same jest-axe, same disabled `color-contrast` rule (jsdom has
 * no layout — real contrast is covered by the FDS contrast gate). Unlike the
 * component gate this one MOUNTS the full App under a MemoryRouter and waits
 * for each screen's data to load (skeletons/aria-busy gone + DOM stable +
 * a fixture-derived ready marker), so composed, data-bound DOM is what axe
 * sees. Axe scope = the `.ks-screen-root` subtree (the screen itself, not the
 * workbench topbar/ThemeBar harness chrome).
 */
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { createRoot, type Root } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { setupServer } from 'msw/node';
import { axe } from 'jest-axe';
import { handlers, resetDb, type Collection, type Order, type SearchCard } from 'flexa-ui-kit/mocks';
import { App } from '../App';

/* ------------------------------------------------------------------ msw -- */

/** jsdom default origin (vitest) — msw relative `/v1/...` predicates resolve here. */
const ORIGIN = 'http://localhost:3000';
const server = setupServer(...handlers);

/**
 * The screens fetch with relative paths (`fetch('/v1/...')`) exactly as in the
 * browser, but Node's fetch (which msw instruments) rejects relative URLs.
 * Wrap the ALREADY-INSTRUMENTED fetch so relative requests resolve against the
 * jsdom origin and still pass through msw. Captured after `server.listen()`.
 */
let realFetch: typeof fetch;

beforeAll(() => {
  server.listen({ onUnhandledRequest: 'error' });
  realFetch = globalThis.fetch;
  globalThis.fetch = ((input: RequestInfo | URL, init?: RequestInit) =>
    typeof input === 'string' && input.startsWith('/')
      ? realFetch(`${ORIGIN}${input}`, init)
      : realFetch(input, init)) as typeof fetch;
});

afterAll(() => {
  globalThis.fetch = realFetch;
  server.close();
});

beforeEach(() => resetDb());

// jsdom has no matchMedia; components that probe it must not crash the audit
// (same shim as the kit's component axe gate).
if (!window.matchMedia) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (window as any).matchMedia = (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  });
}

/* -------------------------------------------------------------- harness -- */

const AXE_OPTS = { rules: { 'color-contrast': { enabled: false } } };

/** Loading markers the screens render while fetching (kit conventions). */
const BUSY_SELECTOR = '.fx-skeleton, [aria-busy="true"], .fx-metric-card-loading';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`${path} → ${res.status}`);
  return (await res.json()) as T;
}

let root: Root | null = null;
let host: HTMLElement | null = null;

afterEach(() => {
  root?.unmount();
  host?.remove();
  root = null;
  host = null;
});

/** Mount the real App at a route and wait until the screen has settled. */
async function renderSettled(route: string, ready?: string): Promise<HTMLElement> {
  host = document.createElement('div');
  document.body.appendChild(host);
  root = createRoot(host);
  root.render(
    <MemoryRouter initialEntries={[route]}>
      <App />
    </MemoryRouter>,
  );

  // Settled = no loading markers + ready marker present + DOM stable across
  // two consecutive polls (multi-request screens hydrate in phases).
  const deadline = Date.now() + 15_000;
  let last = '';
  for (;;) {
    await sleep(40);
    const busy = host.querySelector(BUSY_SELECTOR) != null;
    const text = host.textContent ?? '';
    const readyOk = ready === undefined || text.includes(ready);
    const html = host.innerHTML;
    if (!busy && readyOk && text.trim().length > 0 && html === last) break;
    last = html;
    if (Date.now() > deadline) {
      throw new Error(
        `screen at ${route} did not settle (busy=${String(busy)}, ready=${String(readyOk)})`,
      );
    }
  }
  return host.querySelector<HTMLElement>('.ks-screen-root') ?? host;
}

/** Sorted unique axe rule ids + per-rule node counts for reporting. */
function summarize(violations: Awaited<ReturnType<typeof axe>>['violations']) {
  return violations
    .map((v) => ({
      rule: v.id,
      impact: v.impact ?? 'unknown',
      nodes: v.nodes.length,
      // First offending node, for the findings doc (report only — not asserted).
      sample: v.nodes[0]?.html ?? '',
    }))
    .sort((a, b) => (a.rule < b.rule ? -1 : 1));
}

/* ---------------------------------------------------- recorded baseline -- */

/**
 * Drift-lock allowlist — the CURRENT violations per screen, recorded 2026-07-19
 * (axe-core via jest-axe 9, color-contrast excluded). Full table incl. impact,
 * node counts and suggested owner track: `ui-kit/a11y-screens-findings.md`.
 * Screens absent from a rule list assert zero. Prune entries as wave-2 fixes land.
 */
const EXPECTED_VIOLATIONS: Record<string, string[]> = {
  'search-results': [],
  // Shipping FxAccordion header renders h3 directly under the h1 (no h2).
  'listing-detail': ['heading-order'],
  'checkout-cart': [],
  // Wrapper <section aria-label="Order activity"> duplicates the identically
  // labelled region FxActivityTimeline renders itself.
  'order-detail': ['landmark-unique'],
  'buyer-dashboard': [],
  'buyer-orders': [],
  'buyer-notifications': [],
  'buyer-wallet': [],
  'buyer-reviews': [],
  'seller-dashboard': [],
  // FxProductCard title is a fixed h3 directly under the h1 (no h2).
  'seller-listings': ['heading-order'],
  // Category FxSelect combobox trigger has no axe-recognized accessible name
  // (FxFieldGroup wires label[for] only; no aria-labelledby on the trigger).
  'seller-listing-editor': ['button-name'],
  'seller-orders': [],
  'seller-order-detail': [],
  'seller-earnings': [],
  'admin-dashboard': [],
  'admin-moderation': [],
  'admin-disputes': [],
  'admin-dispute-detail': [],
  'messages': [],
};

/* ---------------------------------------------------------------- cases -- */

interface ScreenCase {
  /** Stable key into EXPECTED_VIOLATIONS + the findings doc. */
  id: string;
  /** Route (or a resolver that derives a fixture id from the mock API). */
  route: string | (() => Promise<string>);
  /** Loaded-only text marker (or a resolver against the mock API). */
  ready?: string | (() => Promise<string>);
}

const firstSearchTitle = async () =>
  (await apiGet<Collection<SearchCard>>('/v1/search')).data[0]!.title;

const deliveredOrderNumber = async () => {
  const list = await apiGet<Collection<Order>>('/v1/orders');
  const picked = list.data.find((o) => o.escrow.stage === 'delivered') ?? list.data[0]!;
  return `Order #${picked.number}`;
};

/** All screen routes under `/screens/*` (doc 15 §4 — the 18 headline screens
 * plus the two reachable support routes: seller orders list §3.13 and the
 * seller order-fulfil detail deep link). */
const CASES: ScreenCase[] = [
  // U11 flagship purchase screens (doc 08 §2.2–2.5)
  { id: 'search-results', route: '/screens/search', ready: firstSearchTitle },
  { id: 'listing-detail', route: '/screens/listings', ready: firstSearchTitle },
  { id: 'checkout-cart', route: '/screens/checkout/cart', ready: 'Order summary' },
  { id: 'order-detail', route: '/screens/orders', ready: deliveredOrderNumber },
  // U13-B buyer (doc 08 §2.6, §3.6–3.9)
  { id: 'buyer-dashboard', route: '/screens/buyer' },
  { id: 'buyer-orders', route: '/screens/buyer/orders' },
  { id: 'buyer-notifications', route: '/screens/buyer/notifications' },
  { id: 'buyer-wallet', route: '/screens/buyer/wallet', ready: 'Wallet & payment methods' },
  { id: 'buyer-reviews', route: '/screens/buyer/reviews' },
  // U13-C seller (doc 08 §2.8–2.11, §3.12–3.13)
  { id: 'seller-dashboard', route: '/screens/seller' },
  { id: 'seller-listings', route: '/screens/seller/listings' },
  { id: 'seller-listing-editor', route: '/screens/seller/listings/new' },
  { id: 'seller-orders', route: '/screens/seller/orders' },
  {
    id: 'seller-order-detail',
    route: async () => {
      const dash = await apiGet<{ recentOrders: Order[] }>('/v1/seller/dashboard');
      return `/screens/seller/orders/${dash.recentOrders[0]!.id}`;
    },
    ready: 'Order #',
  },
  { id: 'seller-earnings', route: '/screens/seller/earnings', ready: 'Earnings & payouts' },
  // U13-D admin (doc 08 §2.12–2.14, §3.17)
  { id: 'admin-dashboard', route: '/screens/admin' },
  { id: 'admin-moderation', route: '/screens/admin/moderation', ready: 'Listings Moderation' },
  { id: 'admin-disputes', route: '/screens/admin/disputes', ready: 'Disputes Queue' },
  {
    id: 'admin-dispute-detail',
    route: async () => {
      const res = await apiGet<Collection<{ id: string }>>('/v1/admin/disputes');
      return `/screens/admin/disputes/${res.data[0]!.id}`;
    },
    ready: 'Dispute',
  },
  // U13-E messages (doc 08 §2.7, §3.27)
  { id: 'messages', route: '/screens/messages', ready: 'Messages' },
];

/* ----------------------------------------------------------------- spec -- */

/** Aggregate for the findings report — printed once after the run. */
const REPORT: Record<string, ReturnType<typeof summarize>> = {};

describe('screens a11y audit (axe, report-only drift lock)', () => {
  it.each(CASES)('$id', async ({ id, route, ready }) => {
    const path = typeof route === 'function' ? await route() : route;
    const marker = typeof ready === 'function' ? await ready() : ready;
    const screen = await renderSettled(path, marker);

    const results = await axe(screen, AXE_OPTS);
    const summary = summarize(results.violations);
    REPORT[id] = summary;

    const expected = EXPECTED_VIOLATIONS[id] ?? [];
    const unexpected = summary.filter((v) => !expected.includes(v.rule));
    expect(
      unexpected,
      `NEW axe violations on "${id}" (not in the recorded baseline — fix or, if this is `
        + 'a knowingly recorded regression, add to EXPECTED_VIOLATIONS + ui-kit/a11y-screens-findings.md): '
        + JSON.stringify(unexpected, null, 2),
    ).toEqual([]);
  }, 30_000);

  afterAll(() => {
    // Machine-readable aggregate for refreshing the findings doc.
    if (process.env.A11Y_REPORT) {
      // eslint-disable-next-line no-console
      console.log(`\nA11Y_SCREENS_REPORT ${JSON.stringify(REPORT)}\n`);
    }
  });
});
