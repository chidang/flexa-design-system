/**
 * FxSellerCard — a seller's identity + trust summary (doc 04 §commerce,
 * "FxSellerCard — Seller Card"). Composes FxCard + FxAvatar + FxBadge +
 * FxStatisticBlock + FxRating + FxButton.
 *
 * Pure presentational (no hooks) → renders as an RSC in docs. The name is always a
 * LINK to the store; a verification/role Badge carries text (never colour-only). A
 * row of FxStatisticBlocks (rating · sales · response time) keeps each stat's
 * ARIA-sentence rule intact. `compact` renders an inline byline form for a Listing
 * Detail sidebar. Actions (Contact / Follow / View store) come through an
 * `actions` slot. Every baked string is a `labels` prop with an English default
 * (i18n); `memberSince` renders verbatim.
 */
import type { ReactNode } from 'react';
import { FxCard } from '../card/card';
import { FxAvatar } from '../avatar/avatar';
import { FxBadge } from '../badge/badge';
import { FxStatisticBlock } from '../statistic-block/statistic-block';
import { FxRating } from '../rating/rating';

/** A seller's trust summary. */
export interface SellerSummary {
  id: string;
  name: string;
  href: string;
  avatarSrc?: string;
  verified?: boolean;
  /** Optional role/verification label, e.g. `'Top seller'`. */
  role?: string;
  rating?: number;
  ratingCount?: number;
  salesCount?: number;
  responseTime?: string;
  memberSince: string;
}

/** i18n strings — every user-facing label is overridable. */
export interface SellerCardLabels {
  verified: string;
  ratingStat: string;
  salesStat: string;
  responseStat: string;
  memberSince: string;
}

export const DEFAULT_SELLER_CARD_LABELS: SellerCardLabels = {
  verified: 'Verified seller',
  ratingStat: 'Rating',
  salesStat: 'Sales',
  responseStat: 'Response time',
  memberSince: 'Member since',
};

export interface FxSellerCardProps {
  /** The seller record. */
  seller: SellerSummary;
  /** Action controls (Contact / Follow / View store). */
  actions?: ReactNode;
  /** Inline byline form for a Listing Detail sidebar. */
  compact?: boolean;
  /** i18n labels. */
  labels?: Partial<SellerCardLabels>;
  className?: string;
}

export function FxSellerCard({
  seller,
  actions,
  compact = false,
  labels,
  className,
}: FxSellerCardProps) {
  const l = { ...DEFAULT_SELLER_CARD_LABELS, ...labels };
  const rootClass = className ? `fx-seller-card ${className}` : 'fx-seller-card';

  const nameLink = (
    <a className="fx-seller-card-name" href={seller.href}>
      {seller.name}
    </a>
  );

  const badge = (seller.verified || seller.role) && (
    <span className="fx-seller-card-badge">
      <FxBadge
        tone={seller.verified ? 'success' : 'info'}
        appearance="subtle"
        icon={seller.verified ? 'shield-check' : undefined}
      >
        {seller.role ?? l.verified}
      </FxBadge>
    </span>
  );

  if (compact) {
    return (
      <div className={`${rootClass} is-compact`} data-compact="true">
        <FxAvatar src={seller.avatarSrc} name={seller.name} alt={seller.name} size="sm" />
        <div className="fx-seller-card-byline">
          <span className="fx-seller-card-byline-name">
            {nameLink}
            {badge}
          </span>
          {seller.rating != null && (
            <FxRating
              value={seller.rating}
              readOnly
              size={16}
              showValue
              count={seller.ratingCount}
            />
          )}
        </div>
        {actions != null && <div className="fx-seller-card-actions">{actions}</div>}
      </div>
    );
  }

  return (
    <FxCard as="article" padding="md" className={rootClass}>
      <div className="fx-seller-card-header">
        <FxAvatar src={seller.avatarSrc} name={seller.name} alt={seller.name} size="lg" />
        <div className="fx-seller-card-identity">
          <span className="fx-seller-card-name-row">
            {nameLink}
            {badge}
          </span>
          <span className="fx-seller-card-member">
            {l.memberSince} {seller.memberSince}
          </span>
        </div>
      </div>

      <div className="fx-seller-card-stats">
        {seller.rating != null && (
          <FxStatisticBlock
            label={l.ratingStat}
            value={
              <span className="fx-seller-card-rating">
                <FxRating value={seller.rating} readOnly size={16} showValue />
              </span>
            }
          />
        )}
        {seller.salesCount != null && (
          <FxStatisticBlock label={l.salesStat} value={seller.salesCount.toLocaleString()} />
        )}
        {seller.responseTime != null && (
          <FxStatisticBlock label={l.responseStat} value={seller.responseTime} />
        )}
      </div>

      {actions != null && <div className="fx-seller-card-actions">{actions}</div>}
    </FxCard>
  );
}
