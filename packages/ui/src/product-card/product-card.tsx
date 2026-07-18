/**
 * FxProductCard — storefront product tile (doc 04 §2.48). Composes FxCard
 * (media top) + FxRating (read-only) + FxBadge, over a `ProductSummary`.
 *
 * Pure presentational (no hooks) → renders as an RSC in docs. The accessible
 * action is the **title link** (FxCard rules §2.23) — the card wrapper stays a
 * non-interactive container so the wishlist button and title link don't nest.
 * Sale pricing is never strike-only: the original price sits in a `<del>` beside
 * visually-hidden "Original price"/"Sale price" text (§1.7.7). The wishlist
 * control is an icon-only `<button aria-label>`; rating is read-only.
 */
import type { ReactNode } from 'react';
import { FxCard } from '../card/card';
import { FxRating } from '../rating/rating';
import { FxBadge } from '../badge/badge';
import { FxIcon } from '../icon/FxIcon';
import type { Money } from '../currency-input/currency-input';
import type { Tone } from '../enums';

/** A seller reference shown beneath the price. */
export interface ProductSeller {
  id: string;
  name: string;
}

/**
 * The data a product tile renders — the shared shape ListingCard extends
 * (`ListingSummary = ProductSummary & { … }`). `imageAlt` is required so the
 * media always has an accessible name.
 */
export interface ProductSummary {
  id: string;
  /** Product name — becomes the title link text. */
  title: string;
  /** Product detail target for the title link. */
  href: string;
  /** Product image src. */
  imageUrl: string;
  /** Product image alt — required. */
  imageAlt: string;
  /** Current price (§1.9 minor units). */
  price: Money;
  /** Strikethrough "was" price for a sale; renders in a `<del>`. */
  compareAtPrice?: Money;
  /** Read-only star rating, 0–5. */
  rating?: number;
  /** Review count shown beside the rating, e.g. "(128)". */
  ratingCount?: number;
  /** Seller reference shown under the price. */
  seller?: ProductSeller;
  /** Tone for the corner badge (pairs with `badgeLabel`). */
  badgeTone?: Tone;
  /** Corner badge label, e.g. "New", "Sale". */
  badgeLabel?: string;
}

/** Baked-in strings, overridable for i18n (labels pattern, §1.4). */
export interface ProductCardLabels {
  /** Accessible name for the wishlist button. */
  wishlist: string;
  /** Accessible name for the add-to-cart button. */
  addToCart: string;
  /** Visually-hidden prefix for the struck original price. */
  originalPrice: string;
  /** Visually-hidden prefix for the current (sale) price. */
  salePrice: string;
}

export const DEFAULT_PRODUCT_CARD_LABELS: ProductCardLabels = {
  wishlist: 'Add to wishlist',
  addToCart: 'Add to cart',
  originalPrice: 'Original price',
  salePrice: 'Sale price',
};

export interface FxProductCardProps {
  /** The product to render (required). */
  product: ProductSummary;
  /** Renders an add-to-cart button in the footer when supplied. */
  onAddToCart?: (productId: string) => void;
  /** Renders a wishlist icon-button in the media corner when supplied. */
  onWishlist?: (productId: string) => void;
  /** Layout. `horizontal` puts the media beside the body. Defaults to `vertical`. */
  orientation?: 'vertical' | 'horizontal';
  /** Show the seller line. Defaults to `true`. */
  showSeller?: boolean;
  /** Show the rating row. Defaults to `true`. */
  showRating?: boolean;
  /** Skeleton with stable dimensions. */
  loading?: boolean;
  /** Locale for `Money` formatting. Defaults to the runtime env locale. */
  locale?: string;
  /** i18n labels. */
  labels?: Partial<ProductCardLabels>;
  /**
   * Extra rows rendered INSIDE the card surface, after the body/actions —
   * e.g. FxListingCard's metrics strip and owner row. Without this slot such
   * chrome would sit outside the card border, visually detached from the tile.
   * Not rendered in the loading skeleton.
   */
  footer?: ReactNode;
  /**
   * Extra badges stacked ABOVE the built-in corner badge in the media's
   * top-start stack (e.g. FxListingCard's status Badge). One shared stack —
   * a second absolute overlay would collide with the corner badge instead of
   * stacking with the `space.2` gap. Not rendered in the loading skeleton.
   */
  mediaOverlay?: ReactNode;
  className?: string;
}

/** Format a `Money` value into a locale-aware currency string (§1.8). */
function formatMoney(money: Money, locale?: string): string {
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: money.currency,
    }).format(money.amount / 100);
  } catch {
    return String(money.amount);
  }
}

export function FxProductCard({
  product,
  onAddToCart,
  onWishlist,
  orientation = 'vertical',
  showSeller = true,
  showRating = true,
  loading = false,
  locale,
  labels,
  footer,
  mediaOverlay,
  className,
}: FxProductCardProps) {
  const l = { ...DEFAULT_PRODUCT_CARD_LABELS, ...labels };
  const cardClass = className ? `fx-product-card ${className}` : 'fx-product-card';

  if (loading) {
    return (
      <FxCard padding="md" className={cardClass}>
        <div className="fx-product-card-layout" data-orientation={orientation} data-loading="true" aria-hidden="true">
          <div className="fx-product-card-media">
            <span className="fx-product-card-skeleton fx-product-card-skeleton-image" />
          </div>
          <div className="fx-product-card-body">
            <span className="fx-product-card-skeleton fx-product-card-skeleton-title" />
            <span className="fx-product-card-skeleton fx-product-card-skeleton-price" />
          </div>
        </div>
      </FxCard>
    );
  }

  const onSale = product.compareAtPrice != null;

  return (
    <FxCard padding="md" className={cardClass}>
      <div className="fx-product-card-layout" data-orientation={orientation}>
        <div className="fx-product-card-media">
          <img
            className="fx-product-card-image"
            src={product.imageUrl}
            alt={product.imageAlt}
          />
          {(mediaOverlay != null || product.badgeLabel != null) && (
            <span className="fx-product-card-badges">
              {mediaOverlay}
              {product.badgeLabel != null && (
                /* Subtle, not solid — a saturated fill over the photo shouts
                   (doc 14 R5 calm surfaces); the soft tint stays legible. */
                <FxBadge tone={product.badgeTone ?? 'neutral'} appearance="subtle" size="sm">
                  {product.badgeLabel}
                </FxBadge>
              )}
            </span>
          )}
          {onWishlist != null && (
            <button
              type="button"
              className="fx-product-card-wishlist"
              aria-label={l.wishlist}
              onClick={() => onWishlist(product.id)}
            >
              <FxIcon name="heart" size={20} />
            </button>
          )}
        </div>

        <div className="fx-product-card-body">
          <h3 className="fx-product-card-title">
            <a className="fx-product-card-link" href={product.href}>
              {product.title}
            </a>
          </h3>

          <p className="fx-product-card-price">
            <span className="fx-product-card-price-current">
              {onSale && <span className="fx-product-card-sr">{l.salePrice}: </span>}
              {formatMoney(product.price, locale)}
            </span>
            {onSale && (
              <del className="fx-product-card-price-original">
                <span className="fx-product-card-sr">{l.originalPrice}: </span>
                {formatMoney(product.compareAtPrice as Money, locale)}
              </del>
            )}
          </p>

          {showRating && product.rating != null && (
            <div className="fx-product-card-rating">
              <FxRating
                value={product.rating}
                readOnly
                showValue
                count={product.ratingCount}
                size={16}
              />
            </div>
          )}

          {showSeller && product.seller != null && (
            <p className="fx-product-card-seller">{product.seller.name}</p>
          )}
        </div>
      </div>

      {onAddToCart != null && (
        <div className="fx-product-card-actions">
          <button
            type="button"
            className="fx-product-card-cart"
            aria-label={l.addToCart}
            onClick={() => onAddToCart(product.id)}
          >
            <FxIcon name="plus" size={20} />
            <span className="fx-product-card-cart-label">{l.addToCart}</span>
          </button>
        </div>
      )}

      {footer}
    </FxCard>
  );
}
