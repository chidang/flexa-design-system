/**
 * FxListingCard — marketplace listing tile (doc 04 §2.49). Wraps the
 * FxProductCard primitive and overlays the listing chrome a storefront tile
 * lacks: a `ListingStatus` Badge, a metrics strip (views · favourites), and —
 * in owner mode — a Context Menu of listing actions (Edit / Pause / Delete).
 *
 * FxProductCard stays the inner primitive: the `ProductSummary` subset is passed
 * straight through, so the media/title/price/rating rules live in one place. The
 * status Badge tone comes from the shared `statusTone` §5 table (never re-derived
 * here) and always renders its status text (§1.7.7). The metrics reuse the
 * `eye`/`heart` icons with visually-hidden labels. Buyer mode is the default;
 * owner mode adds the actions menu (and an optional select checkbox for bulk
 * moderation contexts).
 *
 * Pure presentational shell (no hooks) → renders as an RSC in docs; the nested
 * Context Menu is the only client island and only mounts in owner mode.
 */
import { FxProductCard } from '../product-card/product-card';
import type { ProductSummary, ProductCardLabels } from '../product-card/product-card';
import { FxBadge } from '../badge/badge';
import { FxIcon } from '../icon/FxIcon';
import { FxContextMenu, type MenuItem } from '../context-menu/context-menu';
import { statusTone, formatStatusLabel } from '../status-tone';
import type { ListingStatus } from '../enums';

/** A marketplace listing — a `ProductSummary` plus listing-only fields. */
export interface ListingSummary extends ProductSummary {
  /** Moderation/lifecycle status (§5). Drives the status Badge tone. */
  status: ListingStatus;
  /** View count for the metrics strip. */
  views?: number;
  /** Favourite count for the metrics strip. */
  favorites?: number;
  /** ISO timestamp of the last edit (shown in owner mode). */
  updatedAt: string;
}

/** Baked-in strings, overridable for i18n (labels pattern, §1.4). */
export interface ListingCardLabels {
  /** Visually-hidden expansion for the views metric. */
  views: string;
  /** Visually-hidden expansion for the favourites metric. */
  favorites: string;
  /** Accessible name for the owner actions menu. */
  actions: string;
  /** Accessible name for the bulk-select checkbox. */
  select: string;
  /** Prefix for the "last updated" line, e.g. "Updated". */
  updated: string;
  /** Passed through to FxProductCard. */
  product?: Partial<ProductCardLabels>;
}

export const DEFAULT_LISTING_CARD_LABELS: ListingCardLabels = {
  views: 'views',
  favorites: 'favorites',
  actions: 'Listing actions',
  select: 'Select listing',
  updated: 'Updated',
};

/** Default owner actions when the caller doesn't supply `menuItems`. */
const DEFAULT_MENU_ITEMS: MenuItem[] = [
  { id: 'edit', label: 'Edit', icon: 'edit' },
  { id: 'pause', label: 'Pause', icon: 'minus' },
  { id: 'delete', label: 'Delete', icon: 'close', tone: 'danger' },
];

export interface FxListingCardProps {
  /** The listing to render (required). */
  listing: ListingSummary;
  /** `owner` adds the actions menu + updated line. Defaults to `buyer`. */
  mode?: 'buyer' | 'owner';
  /** Owner action items. Defaults to Edit / Pause / Delete. */
  menuItems?: MenuItem[];
  /** Fires when an owner action is chosen. */
  onAction?: (listingId: string, actionId: string) => void;
  /** Bulk-select toggle; renders a checkbox when supplied (moderation). */
  onSelect?: (listingId: string, selected: boolean) => void;
  /** Whether the bulk-select checkbox is checked. */
  selected?: boolean;
  /** Passed through to FxProductCard. */
  onWishlist?: (productId: string) => void;
  /** Passed through to FxProductCard. */
  onAddToCart?: (productId: string) => void;
  /** Passed through to FxProductCard. */
  orientation?: 'vertical' | 'horizontal';
  /** Passed through to FxProductCard. */
  showSeller?: boolean;
  /** Passed through to FxProductCard. */
  showRating?: boolean;
  /** Skeleton state (delegated to FxProductCard). */
  loading?: boolean;
  /** Locale for Money formatting (passed through). */
  locale?: string;
  /** i18n labels. */
  labels?: Partial<ListingCardLabels>;
  className?: string;
}

/** Narrow a `ListingSummary` back to the `ProductSummary` subset FxProductCard needs. */
function toProduct(listing: ListingSummary): ProductSummary {
  return {
    id: listing.id,
    title: listing.title,
    href: listing.href,
    imageUrl: listing.imageUrl,
    imageAlt: listing.imageAlt,
    price: listing.price,
    compareAtPrice: listing.compareAtPrice,
    rating: listing.rating,
    ratingCount: listing.ratingCount,
    seller: listing.seller,
    badgeTone: listing.badgeTone,
    badgeLabel: listing.badgeLabel,
  };
}

export function FxListingCard({
  listing,
  mode = 'buyer',
  menuItems,
  onAction,
  onSelect,
  selected = false,
  onWishlist,
  onAddToCart,
  orientation = 'vertical',
  showSeller = true,
  showRating = true,
  loading = false,
  locale,
  labels,
  className,
}: FxListingCardProps) {
  const l = { ...DEFAULT_LISTING_CARD_LABELS, ...labels };
  const rootClass = className ? `fx-listing-card ${className}` : 'fx-listing-card';
  const items = menuItems ?? DEFAULT_MENU_ITEMS;
  const isOwner = mode === 'owner';

  const hasMetrics = listing.views != null || listing.favorites != null;

  // Status Badge — always carries its text; tone from the §5 table. Joins the
  // media's badge stack (above the corner badge) so the two align with a
  // space.2 gap instead of two absolute overlays colliding.
  const statusBadge = !loading ? (
    <span className="fx-listing-card-status">
      <FxBadge tone={statusTone(listing.status)} appearance="subtle" size="sm">
        {formatStatusLabel(listing.status)}
      </FxBadge>
    </span>
  ) : undefined;

  // Rendered INSIDE the card surface via FxProductCard's footer slot — as
  // siblings after the card these rows sat detached below its border.
  const footer =
    !loading && (hasMetrics || isOwner) ? (
      <>
        {/* Metrics strip — icon pairs with a visually-hidden label. */}
        {hasMetrics && (
          <div className="fx-listing-card-metrics">
            {listing.views != null && (
              <span className="fx-listing-card-metric">
                <FxIcon name="eye" size={16} />
                <span className="fx-listing-card-metric-value">{listing.views}</span>
                <span className="fx-listing-card-sr">{l.views}</span>
              </span>
            )}
            {listing.favorites != null && (
              <span className="fx-listing-card-metric">
                <FxIcon name="heart" size={16} />
                <span className="fx-listing-card-metric-value">{listing.favorites}</span>
                <span className="fx-listing-card-sr">{l.favorites}</span>
              </span>
            )}
          </div>
        )}

        {/* Owner chrome: updated line + actions menu. */}
        {isOwner && (
          <div className="fx-listing-card-owner">
            <span className="fx-listing-card-updated">
              {l.updated} {listing.updatedAt}
            </span>
            <span className="fx-listing-card-actions">
              <FxContextMenu
                items={items}
                ariaLabel={l.actions}
                onSelect={(item) => onAction?.(listing.id, item.id)}
                trigger={
                  <button
                    type="button"
                    className="fx-listing-card-actions-trigger"
                    aria-label={l.actions}
                  >
                    <FxIcon name="more" size={20} />
                  </button>
                }
              />
            </span>
          </div>
        )}
      </>
    ) : undefined;

  return (
    <div className={rootClass} data-mode={mode}>
      {/* Inner storefront primitive — one place owns media/title/price/rating. */}
      <FxProductCard
        product={toProduct(listing)}
        onWishlist={isOwner ? undefined : onWishlist}
        onAddToCart={isOwner ? undefined : onAddToCart}
        orientation={orientation}
        showSeller={showSeller}
        showRating={showRating}
        loading={loading}
        locale={locale}
        labels={l.product}
        footer={footer}
        mediaOverlay={statusBadge}
      />

      {/* Bulk-select checkbox (moderation contexts) — bottom media corner,
          clear of the badge stack. */}
      {!loading && onSelect != null && (
        <span className="fx-listing-card-select">
          <input
            type="checkbox"
            aria-label={l.select}
            checked={selected}
            onChange={(e) => onSelect(listing.id, e.currentTarget.checked)}
          />
        </span>
      )}
    </div>
  );
}
