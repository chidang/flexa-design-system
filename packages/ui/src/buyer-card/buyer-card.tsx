/**
 * FxBuyerCard — a buyer's identity + activity summary (doc 04 §commerce,
 * "FxBuyerCard — Buyer Card"). Composes FxCard + FxAvatar + FxBadge +
 * FxStatisticBlock. Authored independently of FxSellerCard to keep the
 * perspectives clean — it is the Seller Card contract minus the store link, with
 * buyer-relevant stats.
 *
 * Pure presentational (no hooks) → renders as an RSC in docs. Use it on a seller's
 * Order Detail ("who bought") and on an admin User Detail summary. Buyer-relevant
 * stats: `orderCount` (always) and `disputeRate` (admin perspective only, gated by
 * `perspective='admin'`). There is NO store link (a buyer has no storefront). Each
 * stat is an FxStatisticBlock so the ARIA-sentence rule holds. Every baked string
 * is a `labels` prop with an English default (i18n); `memberSince` renders
 * verbatim.
 */
import type { ReactNode } from 'react';
import { FxCard } from '../card/card';
import { FxAvatar } from '../avatar/avatar';
import { FxBadge } from '../badge/badge';
import { FxStatisticBlock } from '../statistic-block/statistic-block';

/** A buyer's activity summary. */
export interface BuyerSummary {
  id: string;
  name: string;
  avatarSrc?: string;
  memberSince: string;
  orderCount?: number;
  verified?: boolean;
  /** Dispute rate as a percentage — admin perspective only. */
  disputeRate?: number;
}

/** i18n strings — every user-facing label is overridable. */
export interface BuyerCardLabels {
  verified: string;
  ordersStat: string;
  disputeStat: string;
  memberSince: string;
}

export const DEFAULT_BUYER_CARD_LABELS: BuyerCardLabels = {
  verified: 'Verified buyer',
  ordersStat: 'Orders',
  disputeStat: 'Dispute rate',
  memberSince: 'Member since',
};

export interface FxBuyerCardProps {
  /** The buyer record. */
  buyer: BuyerSummary;
  /** Action controls (Message / View orders). */
  actions?: ReactNode;
  /** Inline byline form for a compact Order Detail row. */
  compact?: boolean;
  /** `admin` unlocks the dispute-rate stat. Defaults to `default`. */
  perspective?: 'default' | 'admin';
  /** i18n labels. */
  labels?: Partial<BuyerCardLabels>;
  className?: string;
}

export function FxBuyerCard({
  buyer,
  actions,
  compact = false,
  perspective = 'default',
  labels,
  className,
}: FxBuyerCardProps) {
  const l = { ...DEFAULT_BUYER_CARD_LABELS, ...labels };
  const rootClass = className ? `fx-buyer-card ${className}` : 'fx-buyer-card';
  const showDispute = perspective === 'admin' && buyer.disputeRate != null;

  const badge = buyer.verified && (
    <span className="fx-buyer-card-badge">
      <FxBadge tone="success" appearance="subtle" icon="shield-check">
        {l.verified}
      </FxBadge>
    </span>
  );

  const name = <span className="fx-buyer-card-name">{buyer.name}</span>;

  if (compact) {
    return (
      <div className={`${rootClass} is-compact`} data-compact="true">
        <FxAvatar src={buyer.avatarSrc} name={buyer.name} alt={buyer.name} size="sm" />
        <span className="fx-buyer-card-byline-name">
          {name}
          {badge}
        </span>
        {actions != null && <div className="fx-buyer-card-actions">{actions}</div>}
      </div>
    );
  }

  return (
    <FxCard as="article" padding="md" className={rootClass}>
      <div className="fx-buyer-card-header">
        <FxAvatar src={buyer.avatarSrc} name={buyer.name} alt={buyer.name} size="lg" />
        <div className="fx-buyer-card-identity">
          <span className="fx-buyer-card-name-row">
            {name}
            {badge}
          </span>
          <span className="fx-buyer-card-member">
            {l.memberSince} {buyer.memberSince}
          </span>
        </div>
      </div>

      <div className="fx-buyer-card-stats">
        {buyer.orderCount != null && (
          <FxStatisticBlock label={l.ordersStat} value={buyer.orderCount.toLocaleString()} />
        )}
        {showDispute && (
          <FxStatisticBlock label={l.disputeStat} value={`${buyer.disputeRate}%`} />
        )}
      </div>

      {actions != null && <div className="fx-buyer-card-actions">{actions}</div>}
    </FxCard>
  );
}
