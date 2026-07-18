'use client';
/**
 * FxActivityTimeline — entity-scoped history on a rail (doc 04 §3.8
 * "FxActivityTimeline — Activity Timeline").
 *
 * An FxTimeline + FxActivityFeed hybrid: chronological actor events rendered on a
 * timeline rail, grouped by calendar day, with filter Chips that narrow by event
 * kind. Reuses the §3.3 `ActivityItem` shape (from FxActivityFeed) so the two are
 * interchangeable data-wise — the Feed is dashboard-wide, this Timeline is scoped
 * to one entity (this order, this listing, this user). Each rail item pairs the
 * actor's FxAvatar with the "{actor} {verb} {target}" sentence + a relative time.
 *
 * Filters are controlled or uncontrolled (§1.5): pass `activeFilters` +
 * `onFilterChange` to own them, or omit both to let the component track selection
 * internally. A load-more affordance is always a real `<button>`.
 */
import { useState } from 'react';
import type { ReactNode } from 'react';
import { FxTimeline, type TimelineItem } from '../timeline/timeline';
import { FxChip } from '../chip/chip';
import { FxAvatar } from '../avatar/avatar';
import { type ActivityItem, formatRelative } from '../activity-feed/activity-feed';

/** A filter chip — its `id` matches an item's `kind` bucket (host-defined). */
export interface ActivityFilter {
  id: string;
  label: string;
}

/** Baked-in strings — every one a prop (§i18n). */
export interface ActivityTimelineLabels {
  showMore: string;
  empty: string;
}

export const DEFAULT_ACTIVITY_TIMELINE_LABELS: ActivityTimelineLabels = {
  showMore: 'Show more',
  empty: 'No activity yet.',
};

export interface FxActivityTimelineProps {
  /** Events, newest first (§3.3 shape). */
  items: ActivityItem[];
  /** Filter chips (by event kind). Omit to hide the filter row. */
  filters?: ActivityFilter[];
  /** Controlled active filter ids (§1.5). */
  activeFilters?: string[];
  /** Uncontrolled initial active filter ids. */
  defaultActiveFilters?: string[];
  /**
   * Predicate mapping an item to a filter id (so chips can narrow the list).
   * Defaults to a no-op that keeps everything — the host owns bucketing.
   */
  filterOf?: (item: ActivityItem) => string;
  /** Fired when the active filter set changes. */
  onFilterChange?: (ids: string[]) => void;
  /** Load-more handler — pairs with `hasMore`. */
  onLoadMore?: () => void;
  /** Whether more events exist beyond the current page. */
  hasMore?: boolean;
  /** BCP-47 locale for relative-time formatting. */
  locale?: string;
  /** Accessible name for the timeline. Defaults to `'Activity'`. */
  label?: string;
  /** Baked-in strings. Merged over the English defaults. */
  labels?: Partial<ActivityTimelineLabels>;
  className?: string;
}

/** A stable calendar-day key ("2026-07-17") for grouping. */
function dayKey(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function dayHeading(iso: string, locale?: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const today = new Date();
  const k = dayKey(iso);
  if (k === dayKey(today.toISOString())) return 'Today';
  const yest = new Date(today);
  yest.setDate(today.getDate() - 1);
  if (k === dayKey(yest.toISOString())) return 'Yesterday';
  return d.toLocaleDateString(locale, { weekday: 'long', month: 'short', day: 'numeric' });
}

/** The rich "{actor} {verb} {target}" content slot for one rail item. */
function contentOf(item: ActivityItem, locale?: string): ReactNode {
  return (
    <div className="fx-activity-timeline-content">
      <span className="fx-activity-timeline-avatar" aria-hidden="true">
        <FxAvatar size="xs" name={item.actor.name} src={item.actor.avatarSrc} alt="" />
      </span>
      <span className="fx-activity-timeline-sentence">
        <span className="fx-activity-timeline-actor">{item.actor.name}</span> {item.verb}{' '}
        {item.target &&
          (item.target.href ? (
            <a className="fx-activity-timeline-target" href={item.target.href}>
              {item.target.label}
            </a>
          ) : (
            <span className="fx-activity-timeline-target">{item.target.label}</span>
          ))}
      </span>
      <time className="fx-activity-timeline-time" dateTime={item.at}>
        {formatRelative(item.at, locale)}
      </time>
    </div>
  );
}

export function FxActivityTimeline({
  items,
  filters,
  activeFilters,
  defaultActiveFilters = [],
  filterOf,
  onFilterChange,
  onLoadMore,
  hasMore = false,
  locale,
  label = 'Activity',
  labels,
  className,
}: FxActivityTimelineProps) {
  const l = { ...DEFAULT_ACTIVITY_TIMELINE_LABELS, ...labels };
  const controlled = activeFilters !== undefined;
  const [internalActive, setInternalActive] = useState<string[]>(defaultActiveFilters);
  const active = controlled ? activeFilters : internalActive;

  const commit = (next: string[]) => {
    if (!controlled) setInternalActive(next);
    onFilterChange?.(next);
  };

  const toggle = (id: string) => {
    commit(active.includes(id) ? active.filter((x) => x !== id) : [...active, id]);
  };

  // No active filters = show everything; otherwise keep items whose bucket is on.
  const visible =
    active.length === 0 || !filterOf ? items : items.filter((it) => active.includes(filterOf(it)));

  const rootClass = ['fx-activity-timeline', className].filter(Boolean).join(' ');

  // Build one FxTimeline per calendar day so each group carries a day heading.
  const groups: { key: string; heading: string; items: ActivityItem[] }[] = [];
  let lastKey = '';
  visible.forEach((it) => {
    const k = dayKey(it.at);
    if (k !== lastKey) {
      groups.push({ key: k, heading: dayHeading(it.at, locale), items: [] });
      lastKey = k;
    }
    groups[groups.length - 1]!.items.push(it);
  });

  const toTimeline = (list: ActivityItem[]): TimelineItem[] =>
    // The rich "{actor} {verb} {target}" sentence lives in the content slot; the
    // title is blank (state word is blanked too) so the rail carries no duplicate.
    list.map((it) => ({
      id: it.id,
      title: '',
      icon: it.icon,
      tone: it.tone,
      state: 'complete',
      content: contentOf(it, locale),
    }));

  return (
    <section className={rootClass} aria-label={label}>
      {filters != null && filters.length > 0 && (
        <div className="fx-activity-timeline-filters" role="group" aria-label={`${label} filters`}>
          {filters.map((f) => (
            <FxChip
              key={f.id}
              label={f.label}
              size="sm"
              selected={active.includes(f.id)}
              onChange={() => toggle(f.id)}
            />
          ))}
        </div>
      )}

      {visible.length === 0 ? (
        <div className="fx-activity-timeline-empty">{l.empty}</div>
      ) : (
        <div className="fx-activity-timeline-groups">
          {groups.map((g) => (
            <div className="fx-activity-timeline-group" key={g.key}>
              <div className="fx-activity-timeline-day">{g.heading}</div>
              <FxTimeline items={toTimeline(g.items)} labels={{ complete: '' }} dense />
            </div>
          ))}
        </div>
      )}

      {hasMore && onLoadMore && (
        <div className="fx-activity-timeline-more">
          <button type="button" className="fx-activity-timeline-more-btn" onClick={onLoadMore}>
            {l.showMore}
          </button>
        </div>
      )}
    </section>
  );
}
