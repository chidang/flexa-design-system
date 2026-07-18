/**
 * SellerCard showcase spec. The `SellerSummary` data shape is documented in
 * `props` as a type string (component-local, not a shared union). No `enums` map
 * entry — the axes are structural (compact / verified / with-actions). Actions
 * are built with `createElement` (this is a `.ts` file, no JSX).
 */
import { createElement, Fragment } from 'react';
import type { ShowcaseSpec } from '../showcase-types';
import { FxButton } from '../button/button';
import { FxSellerCard, type SellerSummary } from './seller-card';

const seller: SellerSummary = {
  id: 's1',
  name: 'Northwind Goods',
  href: '#store',
  verified: true,
  rating: 4.8,
  ratingCount: 1240,
  salesCount: 8452,
  responseTime: '< 1 hr',
  memberSince: 'Jan 2021',
};

const actions = createElement(
  Fragment,
  null,
  createElement(FxButton, { variant: 'primary', size: 'sm' }, 'Contact'),
  createElement(FxButton, { variant: 'secondary', size: 'sm' }, 'Follow'),
  createElement(FxButton, { variant: 'ghost', size: 'sm' }, 'View store'),
);

export const sellerCardShowcase: ShowcaseSpec = {
  name: 'SellerCard',
  slug: 'seller-card',
  category: 'commerce',
  slice: 'U8',
  status: 'ready',
  tagline: 'A seller identity + trust summary — name link, verification badge, and rating · sales · response stats.',
  component: FxSellerCard,
  variants: [
    { label: 'full', props: { seller } },
    { label: 'compact byline', props: { seller, compact: true } },
    { label: 'verified (role badge)', props: { seller: { ...seller, role: 'Top seller' } } },
    { label: 'with actions', props: { seller, actions } },
  ],
  props: [
    { name: 'seller', type: 'SellerSummary', required: true, description: 'The seller record (id, name, href, avatarSrc?, verified?, role?, rating?, ratingCount?, salesCount?, responseTime?, memberSince).' },
    { name: 'actions', type: 'ReactNode', description: 'Action controls (Contact / Follow / View store).' },
    { name: 'compact', type: 'boolean', default: 'false', description: 'Inline byline form for a Listing Detail sidebar.' },
    { name: 'labels', type: 'Partial<SellerCardLabels>', description: 'i18n label overrides (verified, ratingStat, salesStat, responseStat, memberSince).' },
  ],
  aria: [
    { attr: '.fx-statistic-block-sr', value: 'visually-hidden sentence', note: 'Each stat (rating/sales/response) reads as one phrase.' },
    { attr: 'role="img"', value: 'Rated {value} out of {max}', note: 'From the read-only FxRating.' },
  ],
  contract: { doc: '04-component-bible.md', heading: 'FxSellerCard — Seller Card' },
};
