/**
 * BuyerCard showcase spec. The `BuyerSummary` data shape is documented in `props`
 * as a type string (component-local, not a shared union). No `enums` map entry —
 * the `perspective` axis is structural. `disputeRate` only renders in the admin
 * perspective.
 */
import type { ShowcaseSpec } from '../showcase-types';
import { FxBuyerCard, type BuyerSummary } from './buyer-card';

const buyer: BuyerSummary = {
  id: 'b1',
  name: 'Alex Chen',
  memberSince: 'Mar 2022',
  orderCount: 128,
  verified: true,
  disputeRate: 1.4,
};

export const buyerCardShowcase: ShowcaseSpec = {
  name: 'BuyerCard',
  slug: 'buyer-card',
  category: 'commerce',
  slice: 'U8',
  status: 'ready',
  tagline: 'A buyer identity + activity summary — orders and (admin) dispute rate, with no store link.',
  component: FxBuyerCard,
  variants: [
    { label: 'default', props: { buyer } },
    { label: 'admin (with disputeRate)', props: { buyer, perspective: 'admin' }, note: 'Dispute rate only renders in the admin perspective.' },
  ],
  props: [
    { name: 'buyer', type: 'BuyerSummary', required: true, description: 'The buyer record (id, name, avatarSrc?, memberSince, orderCount?, verified?, disputeRate?).' },
    { name: 'actions', type: 'ReactNode', description: 'Action controls (Message / View orders).' },
    { name: 'compact', type: 'boolean', default: 'false', description: 'Inline byline form for a compact Order Detail row.' },
    { name: 'perspective', type: "'default' | 'admin'", default: "'default'", description: 'admin unlocks the dispute-rate stat.' },
    { name: 'labels', type: 'Partial<BuyerCardLabels>', description: 'i18n label overrides (verified, ordersStat, disputeStat, memberSince).' },
  ],
  aria: [
    { attr: '.fx-statistic-block-sr', value: 'visually-hidden sentence', note: 'Each stat (orders / dispute rate) reads as one phrase.' },
  ],
  contract: { doc: '04-component-bible.md', heading: 'FxBuyerCard — Buyer Card' },
};
