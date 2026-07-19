/**
 * FxOrderCard showcase spec. `status` is the shared `OrderStatus` union
 * (doc 04 §5) → `enums: { status: ORDER_STATUSES }`. Variants sweep every
 * status × buyer/seller perspective so the different footer actions
 * (Pay / Track / Review / View / Fulfil) are all covered. The `actions` slot
 * variants show the G1/G3 overrides (inline Approve · Write-a-review CTA).
 */
import { createElement } from 'react';
import type { ShowcaseSpec } from '../showcase-types';
import { ORDER_STATUSES, type OrderStatus } from '../enums';
import { FxButton } from '../button/button';
import { FxOrderCard } from './order-card';

const usd = (amount: number) => ({ amount, currency: 'USD' });
const noop = () => undefined;

const seller = { id: 's1', name: 'Clay & Co', avatarSrc: 'https://picsum.photos/seed/clay/64', href: '#seller' };
const buyer = { id: 'b1', name: 'Ada Lovelace', href: '#buyer' };

const items = [
  { id: 'i1', title: 'Ceramic mug', imageUrl: 'https://picsum.photos/seed/mug/80', quantity: 2 },
  { id: 'i2', title: 'Tea towel', imageUrl: 'https://picsum.photos/seed/towel/80', quantity: 1 },
  { id: 'i3', title: 'Coaster set', quantity: 1 },
  { id: 'i4', title: 'Bowl', quantity: 1 },
  { id: 'i5', title: 'Plate', quantity: 1 },
];

const order = (status: OrderStatus, overrides: Record<string, unknown> = {}) => ({
  id: `o-${status}`,
  number: `#10${ORDER_STATUSES.indexOf(status) + 42}`,
  href: '#order',
  status,
  total: usd(6980),
  placedAt: 'Jul 12, 2026',
  itemCount: items.length,
  items,
  seller,
  buyer,
  ...overrides,
});

export const orderCardShowcase: ShowcaseSpec = {
  name: 'OrderCard',
  slug: 'order-card',
  category: 'commerce',
  slice: 'U8',
  status: 'ready',
  tagline: 'One order in a list — number, status, item thumbnails, status-driven action.',
  component: FxOrderCard,
  variants: [
    { label: 'buyer · created (Pay)', props: { order: order('created'), perspective: 'buyer', onAction: noop } },
    { label: 'buyer · paid (Track)', props: { order: order('paid'), perspective: 'buyer', onAction: noop } },
    { label: 'buyer · in_fulfilment (Track)', props: { order: order('in_fulfilment'), perspective: 'buyer', onAction: noop } },
    { label: 'buyer · delivered (Review)', props: { order: order('delivered'), perspective: 'buyer', onAction: noop } },
    { label: 'buyer · completed (Review)', props: { order: order('completed'), perspective: 'buyer', onAction: noop } },
    { label: 'buyer · cancelled (View)', props: { order: order('cancelled'), perspective: 'buyer', onAction: noop } },
    { label: 'seller · paid (Fulfil)', props: { order: order('paid'), perspective: 'seller', onAction: noop } },
    { label: 'seller · in_fulfilment (Fulfil)', props: { order: order('in_fulfilment'), perspective: 'seller', onAction: noop } },
    { label: 'seller · delivered (View)', props: { order: order('delivered'), perspective: 'seller', onAction: noop } },
    { label: 'seller · created (Pay)', props: { order: order('created'), perspective: 'seller', onAction: noop } },
    {
      label: 'few items (no overflow)',
      props: { order: order('paid', { items: items.slice(0, 2), itemCount: 2 }), perspective: 'buyer', onAction: noop },
    },
    {
      label: 'actions slot · inline Approve (G1)',
      props: {
        order: order('delivered'),
        perspective: 'buyer',
        actions: createElement(FxButton, { variant: 'primary', size: 'sm', onClick: noop }, 'Approve'),
      },
      note: 'Host overrides the mapped default with a stage-specific shortcut.',
    },
    {
      label: 'actions slot · Write-a-review CTA (G3)',
      props: {
        order: order('completed'),
        perspective: 'buyer',
        actions: createElement(FxButton, { variant: 'primary', size: 'sm', onClick: noop }, 'Write a review'),
      },
      note: 'A reviewable completed order surfaces its review CTA on the card.',
    },
  ],
  props: [
    { name: 'order', type: 'OrderSummary', required: true, description: 'OrderSummary = { id; number; href; status: OrderStatus; total: Money; placedAt; itemCount; items[]; buyer?; seller? }.' },
    { name: 'perspective', type: "'buyer' | 'seller'", default: "'buyer'", description: 'Flips the action set + which counterparty is shown.' },
    { name: 'onAction', type: '(action: string, order: OrderSummary) => void', description: 'Fired with the resolved action id (pay/track/review/view/fulfil).' },
    { name: 'actions', type: 'ReactNode', description: 'Overrides the status-derived footer action with host content (e.g. an inline Approve shortcut or a Write-a-review CTA). The mapped default is skipped when set.' },
    { name: 'labels', type: 'Partial<OrderCardLabels>', description: 'i18n overrides for action + date strings.' },
    { name: 'locale', type: 'string', description: 'Locale for Money formatting.' },
  ],
  events: [
    { name: 'onAction', payload: '(action: string, order: OrderSummary)', description: 'Primary footer action pressed. action ∈ pay | track | review | view | fulfil.' },
  ],
  aria: [
    { attr: 'a.fx-order-card-number', value: 'order link', note: 'Order number is a real link to the order detail (href).' },
    { attr: 'FxBadge', value: 'status text', note: 'Always renders the formatted status via statusTone + formatStatusLabel — colour never used alone.' },
  ],
  enums: { status: ORDER_STATUSES },
  contract: { doc: '04-component-bible.md', heading: 'FxOrderCard — Order Card' },
};
