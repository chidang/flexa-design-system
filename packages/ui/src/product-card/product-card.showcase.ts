/**
 * FxProductCard showcase spec. `ProductSummary` and `ProductCardLabels` are
 * component-local shapes (documented in `props` as type strings) — there is no
 * shared-union axis here, so no `enums` map entry (contrast ListingCard, which
 * has `status: LISTING_STATUSES`).
 */
import type { ShowcaseSpec } from '../showcase-types';
import { FxProductCard } from './product-card';
import type { ProductSummary } from './product-card';

const base: ProductSummary = {
  id: 'p1',
  title: 'Handwoven Wool Throw Blanket',
  href: '#product',
  imageUrl: 'https://picsum.photos/seed/fx-product/480/480',
  imageAlt: 'Grey handwoven wool throw blanket folded on a bench',
  price: { amount: 8900, currency: 'USD' },
  rating: 4.6,
  ratingCount: 128,
  seller: { id: 's1', name: 'Northern Loom Co.' },
};

const sale: ProductSummary = {
  ...base,
  id: 'p2',
  title: 'Ceramic Pour-Over Coffee Set',
  imageUrl: 'https://picsum.photos/seed/fx-product-sale/480/480',
  imageAlt: 'White ceramic pour-over coffee dripper and carafe',
  price: { amount: 5400, currency: 'USD' },
  compareAtPrice: { amount: 7200, currency: 'USD' },
  badgeTone: 'danger',
  badgeLabel: 'Sale',
};

const minimal: ProductSummary = {
  id: 'p3',
  title: 'Linen Table Runner',
  href: '#product',
  imageUrl: 'https://picsum.photos/seed/fx-product-min/480/480',
  imageAlt: 'Natural linen table runner on a wooden table',
  price: { amount: 3200, currency: 'USD' },
};

export const productCardShowcase: ShowcaseSpec = {
  name: 'ProductCard',
  slug: 'product-card',
  category: 'commerce',
  slice: 'U8',
  status: 'ready',
  tagline: 'Storefront product tile — image, title link, price, rating and wishlist.',
  component: FxProductCard,
  variants: [
    { label: 'default', props: { product: base } },
    { label: 'on sale (compareAt)', props: { product: sale }, note: 'Original price in a <del> with visually-hidden "Sale price".' },
    { label: 'with wishlist', props: { product: base, onWishlist: () => {} } },
    { label: 'with add-to-cart', props: { product: base, onAddToCart: () => {} } },
    { label: 'no rating / no seller', props: { product: minimal, showRating: false, showSeller: false } },
    { label: 'new badge', props: { product: { ...base, badgeTone: 'success', badgeLabel: 'New' } } },
    { label: 'horizontal', props: { product: base, orientation: 'horizontal' } },
    { label: 'loading', props: { product: base, loading: true } },
  ],
  props: [
    { name: 'product', type: 'ProductSummary', required: true, description: 'The product to render: id, title, href, imageUrl, imageAlt, price (Money), compareAtPrice?, rating?, ratingCount?, seller?, badgeTone?, badgeLabel?.' },
    { name: 'onAddToCart', type: '(productId: string) => void', description: 'Renders an add-to-cart button in the footer when supplied.' },
    { name: 'onWishlist', type: '(productId: string) => void', description: 'Renders a wishlist icon-button in the media corner when supplied.' },
    { name: 'orientation', type: "'vertical' | 'horizontal'", default: "'vertical'", description: 'Media on top vs. media beside the body.' },
    { name: 'showSeller', type: 'boolean', default: 'true', description: 'Show the seller line under the price.' },
    { name: 'showRating', type: 'boolean', default: 'true', description: 'Show the read-only rating row.' },
    { name: 'loading', type: 'boolean', default: 'false', description: 'Skeleton with stable dimensions.' },
    { name: 'locale', type: 'string', description: 'Locale for Money formatting.' },
    { name: 'labels', type: 'Partial<ProductCardLabels>', description: 'i18n overrides: wishlist / addToCart / originalPrice / salePrice.' },
  ],
  events: [
    { name: 'onAddToCart', payload: 'productId: string', description: 'Fired when the add-to-cart button is activated.' },
    { name: 'onWishlist', payload: 'productId: string', description: 'Fired when the wishlist button is activated.' },
  ],
  aria: [
    { attr: 'alt', value: 'product.imageAlt', note: 'Required accessible name on the product image.' },
    { attr: 'aria-label', value: 'labels.wishlist', note: 'On the icon-only wishlist button.' },
    { attr: '.fx-product-card-sr', value: 'visually-hidden', note: '"Sale price" / "Original price" precede the two prices so <del> is never strike-only (§1.7.7).' },
  ],
  contract: { doc: '04-component-bible.md', heading: 'FxProductCard — Product Card' },
};
