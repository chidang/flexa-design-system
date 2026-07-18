/**
 * FxRecentActivity — a dashboard card wrapping a compact FxActivityFeed
 * (doc 04 §FxRecentActivity). Shows the latest ≤5 items (no day grouping) with a
 * "View all" link footer.
 *
 * Pure presentational (no hooks) → renders as an RSC in docs.
 */
import { FxCard } from '../card/card';
import { FxActivityFeed, type ActivityItem, type ActivityEmptyState } from '../activity-feed/activity-feed';

export type { ActivityItem, ActivityEmptyState } from '../activity-feed/activity-feed';

export interface FxRecentActivityProps {
  /** Activity items (sliced to `limit`). */
  items: ActivityItem[];
  /** Max items to show. Defaults to `5`. */
  limit?: number;
  /** Card title. Defaults to `'Recent activity'`. */
  title?: string;
  /** "View all" link target. Omit to hide the footer. */
  viewAllHref?: string;
  /** "View all" link text. Defaults to `'View all activity'`. */
  viewAllLabel?: string;
  /** Forwarded to the feed's loading state. */
  loading?: boolean;
  /** Forwarded to the feed's empty state. */
  emptyState?: ActivityEmptyState;
  /** BCP-47 locale for date/time formatting. */
  locale?: string;
  className?: string;
}

export function FxRecentActivity({
  items,
  limit = 5,
  title = 'Recent activity',
  viewAllHref,
  viewAllLabel = 'View all activity',
  loading = false,
  emptyState,
  locale,
  className,
}: FxRecentActivityProps) {
  const rootClass = className ? `fx-recent-activity ${className}` : 'fx-recent-activity';
  const shown = items.slice(0, limit);
  const footer = viewAllHref ? (
    <a className="fx-recent-activity-view-all" href={viewAllHref}>
      {viewAllLabel}
    </a>
  ) : undefined;

  return (
    <FxCard className={rootClass} title={title} footer={footer}>
      <FxActivityFeed
        items={shown}
        loading={loading}
        emptyState={emptyState}
        groupByDay={false}
        locale={locale}
        label={title}
      />
    </FxCard>
  );
}
