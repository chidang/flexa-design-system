/**
 * FxReviewCard — a single marketplace review (doc 04 §commerce, "FxReviewCard —
 * Review Card"). Composes FxCard + FxAvatar + FxRating + FxBadge + FxGallery.
 *
 * Pure presentational (no hooks) → renders as an RSC in docs. The header pairs an
 * avatar (with the author name) + rating (read-only) + an optional verified Badge
 * (which carries text, never colour-only) + the date. The body is clamped via CSS
 * (`-webkit-line-clamp`) so the full text is always in the static markup — the
 * "Read more" affordance is an inert `<button type=button>` that a host wires up,
 * never a gate that hides content server-side. Optional images render through
 * FxGallery (every image REQUIRES `alt`). A seller `response` block and a footer
 * (helpful-count button + report Context Menu) round it out. Every baked string is
 * a `labels` prop with an English default (i18n); dates render verbatim.
 */
import type { CSSProperties } from 'react';
import { FxCard } from '../card/card';
import { FxAvatar } from '../avatar/avatar';
import { FxRating } from '../rating/rating';
import { FxBadge } from '../badge/badge';
import { FxGallery } from '../gallery/gallery';
import { FxContextMenu, type MenuItem } from '../context-menu/context-menu';
import { FxIcon } from '../icon/FxIcon';

/** A referenced party (review author, responder). */
export interface PartyRef {
  id: string;
  name: string;
  avatarSrc?: string;
  href?: string;
}

/** A seller response appended under a review. */
export interface ReviewResponse {
  body: string;
  respondedAt: string;
}

/** One review record. */
export interface Review {
  id: string;
  author: PartyRef;
  rating: number;
  title?: string;
  body: string;
  createdAt: string;
  verified?: boolean;
  images?: { id: string; src: string; alt: string }[];
  helpfulCount?: number;
  response?: ReviewResponse;
}

/** i18n strings — every user-facing label is overridable. */
export interface ReviewCardLabels {
  /** Verified-purchase badge text. */
  verified: string;
  /** Expand-body affordance. */
  readMore: string;
  /** Helpful-count button; `{count}` is substituted. */
  helpful: string;
  /** Accessible name for the report overflow menu. */
  report: string;
  /** Report menu item label. */
  reportItem: string;
  /** Seller-response heading. */
  responseTitle: string;
}

export const DEFAULT_REVIEW_CARD_LABELS: ReviewCardLabels = {
  verified: 'Verified purchase',
  readMore: 'Read more',
  helpful: 'Helpful ({count})',
  report: 'Review actions',
  reportItem: 'Report review',
  responseTitle: 'Seller response',
};

export interface FxReviewCardProps {
  /** The review record. */
  review: Review;
  /** Fires when the helpful button is clicked. */
  onHelpful?: (id: string) => void;
  /** Fires when the report menu item is selected. */
  onReport?: (id: string) => void;
  /** Fires when a seller chooses to respond (seller perspective). */
  onRespond?: (id: string) => void;
  /** Body line clamp before "Read more". Defaults to 4. */
  clampLines?: number;
  /** i18n labels. */
  labels?: Partial<ReviewCardLabels>;
  className?: string;
}

function fill(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, k: string) => String(vars[k] ?? ''));
}

export function FxReviewCard({
  review,
  onHelpful,
  onReport,
  onRespond,
  clampLines = 4,
  labels,
  className,
}: FxReviewCardProps) {
  const l = { ...DEFAULT_REVIEW_CARD_LABELS, ...labels };
  const { author, images, response } = review;

  const reportItems: MenuItem[] = [
    { id: 'report', label: l.reportItem, icon: 'warning', tone: 'danger' },
  ];

  return (
    <FxCard
      as="article"
      padding="md"
      className={className ? `fx-review-card ${className}` : 'fx-review-card'}
    >
      <div className="fx-review-card-header">
        <FxAvatar src={author.avatarSrc} name={author.name} alt={author.name} size="md" />
        <div className="fx-review-card-identity">
          <span className="fx-review-card-author">
            {author.href ? <a href={author.href}>{author.name}</a> : author.name}
          </span>
          <span className="fx-review-card-meta">
            <FxRating value={review.rating} readOnly size={16} />
            <time className="fx-review-card-date" dateTime={review.createdAt}>
              {review.createdAt}
            </time>
          </span>
        </div>
        {review.verified && (
          <span className="fx-review-card-verified">
            <FxBadge tone="success" appearance="subtle" icon="shield-check">
              {l.verified}
            </FxBadge>
          </span>
        )}
      </div>

      <div className="fx-review-card-body">
        {review.title && <p className="fx-review-card-title">{review.title}</p>}
        <p
          className="fx-review-card-text"
          style={{ '--fx-review-card-clamp': String(clampLines) } as CSSProperties}
        >
          {review.body}
        </p>
        <button type="button" className="fx-review-card-readmore">
          {l.readMore}
        </button>
      </div>

      {images && images.length > 0 && (
        <div className="fx-review-card-images">
          <FxGallery images={images} lightbox={false} />
        </div>
      )}

      {response && (
        <div className="fx-review-card-response">
          <p className="fx-review-card-response-title">{l.responseTitle}</p>
          <p className="fx-review-card-response-body">{response.body}</p>
          <time className="fx-review-card-response-date" dateTime={response.respondedAt}>
            {response.respondedAt}
          </time>
        </div>
      )}

      <div className="fx-review-card-footer">
        <button
          type="button"
          className="fx-review-card-helpful"
          onClick={onHelpful ? () => onHelpful(review.id) : undefined}
        >
          <FxIcon name="heart" size={16} />
          {fill(l.helpful, { count: review.helpfulCount ?? 0 })}
        </button>
        {onRespond && (
          <button
            type="button"
            className="fx-review-card-respond"
            onClick={() => onRespond(review.id)}
          >
            <FxIcon name="chat" size={16} />
            {l.responseTitle}
          </button>
        )}
        <FxContextMenu
          items={reportItems}
          ariaLabel={l.report}
          onSelect={onReport ? () => onReport(review.id) : undefined}
          trigger={
            <button type="button" className="fx-review-card-report" aria-label={l.report}>
              <FxIcon name="more" size={16} />
            </button>
          }
        />
      </div>
    </FxCard>
  );
}
