/**
 * FxCartSummary showcase spec. `CartItem`/`CartTotals` are structural unions
 * (component-local, documented in `props` as type strings) — no `enums` entry.
 * Money amounts are integer minor units (§1.9).
 */
import type { ShowcaseSpec } from '../showcase-types';
import { FxCartSummary } from './cart-summary';

const usd = (amount: number) => ({ amount, currency: 'USD' });

const items = [
  {
    id: 'l1',
    listingId: 'listing-1',
    title: 'Handmade ceramic mug',
    imageUrl: 'https://picsum.photos/seed/mug/96',
    quantity: 2,
    unitPrice: usd(1800),
    lineTotal: usd(3600),
    maxQuantity: 10,
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

const totalsWithPromo = {
  subtotal: usd(6000),
  shipping: usd(500),
  tax: usd(430),
  discount: usd(600),
  total: usd(6330),
};

const noop = () => undefined;
const applyPromo = () => Promise.resolve();

export const cartSummaryShowcase: ShowcaseSpec = {
  name: 'CartSummary',
  slug: 'cart-summary',
  category: 'commerce',
  slice: 'U8',
  status: 'ready',
  interactive: true,
  tagline: 'Cart line items + totals + checkout — quantity in, callbacks out.',
  component: FxCartSummary,
  variants: [
    { label: 'empty cart', props: { items: [], totals: { subtotal: usd(0), total: usd(0) } } },
    { label: 'items', props: { items, totals } },
    {
      label: 'with promo',
      props: { items, totals: totalsWithPromo, onApplyPromo: applyPromo },
      note: 'Discount row renders in success tone; promo field applies asynchronously.',
    },
    {
      label: 'read-only (non-editable)',
      props: { items, totals, editable: false },
      note: 'Static ×quantity, no remove/checkout/promo — what CheckoutSummary reuses.',
    },
    {
      label: 'full checkout',
      props: { items, totals, onCheckout: noop, onRemove: noop, onQuantityChange: noop, onApplyPromo: applyPromo },
    },
  ],
  props: [
    { name: 'items', type: 'CartItem[]', required: true, description: 'Cart lines. CartItem = { id; listingId; title; imageUrl?; quantity; unitPrice: Money; lineTotal: Money; maxQuantity? }.' },
    { name: 'totals', type: 'CartTotals', required: true, description: 'CartTotals = { subtotal: Money; shipping?; tax?; discount?; total: Money }.' },
    { name: 'onQuantityChange', type: '(itemId: string, qty: number) => void', description: 'A line quantity changed via its stepper.' },
    { name: 'onRemove', type: '(itemId: string) => void', description: 'A line was removed.' },
    { name: 'onCheckout', type: '() => void', description: 'Checkout button pressed.' },
    { name: 'onApplyPromo', type: '(code: string) => Promise<void>', description: 'Promo code submitted; resolves when applied/rejected. Omit to hide the promo field.' },
    { name: 'editable', type: 'boolean', default: 'true', description: 'When false: static quantities, no remove/checkout/promo (read-only mode).' },
    { name: 'removeConfirmThreshold', type: 'number', default: '0', description: 'Hint for host confirm-on-remove; component removes directly in v1.' },
    { name: 'emptyLabel', type: 'ReactNode', default: "'Your cart is empty.'", description: 'Shown when items is empty.' },
    { name: 'labels', type: 'Partial<CartSummaryLabels>', description: 'i18n overrides: checkout, promo, apply, remove, subtotal, shipping, tax, discount, total.' },
    { name: 'locale', type: 'string', description: 'Locale for Money formatting.' },
  ],
  events: [
    { name: 'onQuantityChange', payload: '(itemId: string, qty: number)', description: 'Stepper committed a new quantity.' },
    { name: 'onRemove', payload: '(itemId: string)', description: 'Remove button pressed for a line.' },
    { name: 'onCheckout', payload: '()', description: 'Proceed-to-checkout pressed.' },
    { name: 'onApplyPromo', payload: '(code: string) => Promise<void>', description: 'Promo submitted; button shows a busy state until it resolves.' },
  ],
  aria: [
    { attr: '.fx-cart-summary-sr', value: 'role="status"', note: 'Visually-hidden, announces "Subtotal {amount}" politely on quantity/removal changes.' },
    { attr: 'aria-label', value: '"Remove {title}"', note: 'On each line remove button.' },
  ],
  contract: { doc: '04-component-bible.md', heading: 'FxCartSummary — Cart Summary' },
};
