/**
 * FxListingCard showcase spec. This is the one Commerce card with a shared-union
 * axis — the listing `status` (§5 `ListingStatus`) — so it declares
 * `enums: { status: LISTING_STATUSES }`. `ListingSummary` extends the
 * component-local `ProductSummary`, documented in `props` as a type string.
 */
import type { ShowcaseSpec } from '../showcase-types';
import { LISTING_STATUSES } from '../enums';
import { FxListingCard } from './listing-card';
import type { ListingSummary } from './listing-card';

const base: ListingSummary = {
  id: 'l1',
  title: 'Vintage Herman Miller Eames Chair',
  href: '#listing',
  imageUrl: 'https://picsum.photos/seed/fx-listing/480/480',
  imageAlt: 'Walnut and black leather mid-century lounge chair',
  price: { amount: 145000, currency: 'USD' },
  rating: 4.8,
  ratingCount: 42,
  seller: { id: 's9', name: 'Midtown Modern' },
  status: 'active',
  views: 1240,
  favorites: 86,
  updatedAt: '2 days ago',
};

export const listingCardShowcase: ShowcaseSpec = {
  name: 'ListingCard',
  slug: 'listing-card',
  category: 'commerce',
  slice: 'U8',
  status: 'ready',
  tagline: 'Marketplace listing tile — Product Card plus status, metrics and owner actions.',
  component: FxListingCard,
  variants: [
    { label: 'buyer — active', props: { listing: base } },
    { label: 'buyer — on sale', props: { listing: { ...base, id: 'l2', compareAtPrice: { amount: 189000, currency: 'USD' }, badgeTone: 'danger', badgeLabel: 'Sale' } } },
    { label: 'pending review', props: { listing: { ...base, id: 'l3', status: 'pending_review' } } },
    { label: 'paused', props: { listing: { ...base, id: 'l4', status: 'paused' } } },
    { label: 'suspended', props: { listing: { ...base, id: 'l5', status: 'suspended' } } },
    { label: 'owner mode', props: { listing: base, mode: 'owner' }, note: 'Adds the updated line + Edit/Pause/Delete Context Menu.' },
    { label: 'owner — bulk select', props: { listing: base, mode: 'owner', onSelect: () => {}, selected: true } },
    { label: 'with wishlist (buyer)', props: { listing: base, onWishlist: () => {} } },
    { label: 'loading', props: { listing: base, loading: true } },
  ],
  props: [
    { name: 'listing', type: 'ListingSummary', required: true, description: 'ProductSummary & { status: ListingStatus; views?: number; favorites?: number; updatedAt: string }.' },
    { name: 'mode', type: "'buyer' | 'owner'", default: "'buyer'", description: 'Owner mode adds the updated line + actions Context Menu.' },
    { name: 'menuItems', type: 'MenuItem[]', description: 'Owner action items. Defaults to Edit / Pause / Delete.' },
    { name: 'onAction', type: '(listingId, actionId) => void', description: 'Fires when an owner action is chosen.' },
    { name: 'onSelect', type: '(listingId, selected) => void', description: 'Renders a bulk-select checkbox when supplied (moderation).' },
    { name: 'selected', type: 'boolean', default: 'false', description: 'Whether the bulk-select checkbox is checked.' },
    { name: 'onWishlist', type: '(productId) => void', description: 'Passed through to FxProductCard (buyer mode).' },
    { name: 'onAddToCart', type: '(productId) => void', description: 'Passed through to FxProductCard (buyer mode).' },
    { name: 'orientation', type: "'vertical' | 'horizontal'", default: "'vertical'", description: 'Passed through to FxProductCard.' },
    { name: 'loading', type: 'boolean', default: 'false', description: 'Skeleton state (delegated to FxProductCard).' },
    { name: 'labels', type: 'Partial<ListingCardLabels>', description: 'i18n overrides: views / favorites / actions / select / updated / product.' },
  ],
  events: [
    { name: 'onAction', payload: '(listingId: string, actionId: string)', description: 'An owner action was chosen from the Context Menu.' },
    { name: 'onSelect', payload: '(listingId: string, selected: boolean)', description: 'The bulk-select checkbox toggled.' },
  ],
  aria: [
    { attr: 'FxBadge', value: 'formatStatusLabel(status)', note: 'Status Badge always renders its text; tone from statusTone(status).' },
    { attr: 'aria-label', value: 'labels.actions / labels.select', note: 'On the owner actions trigger and the bulk-select checkbox.' },
    { attr: '.fx-listing-card-sr', value: 'visually-hidden', note: 'Expands the eye/heart metric icons to "views"/"favorites".' },
  ],
  enums: { status: LISTING_STATUSES },
  contract: { doc: '04-component-bible.md', heading: 'FxListingCard — Listing Card' },
};
