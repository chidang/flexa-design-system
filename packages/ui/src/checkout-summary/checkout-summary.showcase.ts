/**
 * FxCheckoutSummary showcase spec. Reuses FxCartSummary's structural
 * `CartItem`/`CartTotals` unions (documented in `props`) — no `enums` entry.
 * `placeOrder`/`sections[].summary` are host-rendered ReactNodes; showcase
 * variants pass plain strings so the static a11y pass stays effect-free.
 */
import type { ShowcaseSpec } from '../showcase-types';
import { FxCheckoutSummary } from './checkout-summary';

const usd = (amount: number) => ({ amount, currency: 'USD' });
const noop = () => undefined;

const items = [
  {
    id: 'l1',
    listingId: 'listing-1',
    title: 'Handmade ceramic mug',
    imageUrl: 'https://picsum.photos/seed/mug/96',
    quantity: 2,
    unitPrice: usd(1800),
    lineTotal: usd(3600),
  },
  {
    id: 'l2',
    listingId: 'listing-2',
    title: 'Linen tea towel set',
    quantity: 1,
    unitPrice: usd(2400),
    lineTotal: usd(2400),
  },
];

const totals = {
  subtotal: usd(6000),
  shipping: usd(500),
  tax: usd(480),
  total: usd(6980),
};

const sections = [
  { id: 'shipping', label: 'Ship to', summary: 'Ada Lovelace, 12 Analytical Ave, London', onEdit: noop },
  { id: 'payment', label: 'Pay with', summary: 'Visa ending 4242', onEdit: noop },
];

export const checkoutSummaryShowcase: ShowcaseSpec = {
  name: 'CheckoutSummary',
  slug: 'checkout-summary',
  category: 'commerce',
  slice: 'U8',
  status: 'ready',
  interactive: true,
  tagline: 'Read-only order recap at checkout — sticky aside, host renders the pay button.',
  component: FxCheckoutSummary,
  variants: [
    { label: 'recap only', props: { items, totals } },
    {
      label: 'with edit sections',
      props: { items, totals, sections },
      note: 'Shipping/payment recap rows each jump back to their wizard step.',
    },
    {
      label: 'with place-order slot',
      props: {
        items,
        totals,
        sections,
        termsNote: 'By placing your order you agree to the Terms.',
        placeOrder: 'Place order — $69.80',
      },
      note: 'placeOrder is host-rendered (payment-SDK territory); shown here as text.',
    },
  ],
  props: [
    { name: 'items', type: 'CartItem[]', required: true, description: 'Cart lines, rendered read-only via FxCartSummary.' },
    { name: 'totals', type: 'CartTotals', required: true, description: 'Totals block (read-only).' },
    { name: 'sections', type: 'CheckoutSection[]', description: 'Recap sections. CheckoutSection = { id; label; summary: ReactNode; onEdit(): void }.' },
    { name: 'placeOrder', type: 'ReactNode', description: 'Host-rendered pay button (payment-SDK territory).' },
    { name: 'termsNote', type: 'ReactNode', description: 'Legal / terms note above the pay button.' },
    { name: 'labels', type: 'Partial<CheckoutSummaryLabels>', description: 'i18n overrides: title, edit, and a nested cart labels object.' },
    { name: 'locale', type: 'string', description: 'Locale for Money formatting.' },
  ],
  events: [
    { name: 'sections[].onEdit', payload: '()', description: 'A recap section Edit link jumps back to its wizard step.' },
  ],
  aria: [
    { attr: '<details>', value: 'native disclosure', note: 'Mobile: collapsible above the form (open by default). Desktop >=1024px: forced open, sticky aside.' },
  ],
  contract: { doc: '04-component-bible.md', heading: 'FxCheckoutSummary — Checkout Summary' },
};
