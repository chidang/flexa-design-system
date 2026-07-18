/**
 * FxActivityFeed — chronological activity stream (doc 04 §FxActivityFeed).
 *
 * A `role="feed"` of `role="article"` rows: each is FxAvatar + a rich sentence
 * ("{actor} {verb} {target}") + a relative `<time>`. New items announce politely
 * via a visually-hidden `role="status"` region. Every article carries an
 * `aria-label` = the plain-text sentence plus `aria-posinset`/`aria-setsize`.
 * Load-more is always a real `<button>` (never infinite-scroll-only). Optional
 * day grouping renders sticky calendar-day headers.
 *
 * Pure presentational (no hooks) → renders as an RSC in docs.
 */
import type { Tone } from '../enums';
import { FxAvatar } from '../avatar/avatar';
import { FxBadge } from '../badge/badge';
import { FxEmptyState } from '../empty-state/empty-state';
import type { IconName } from '../icon/map';

export interface ActivityItem {
  id: string;
  actor: { name: string; avatarSrc?: string };
  verb: string;
  target?: { label: string; href?: string };
  /** ISO 8601 timestamp. */
  at: string;
  icon?: IconName;
  tone?: Tone;
}

export interface ActivityEmptyState {
  title: string;
  description?: string;
  icon?: IconName;
}

export interface FxActivityFeedProps {
  /** Items to render, newest first (as supplied). */
  items: ActivityItem[];
  /** Show a loading affordance instead of the empty state. */
  loading?: boolean;
  /** Rendered (via FxEmptyState) when there are no items and not loading. */
  emptyState?: ActivityEmptyState;
  /** Load-more handler — pairs with `hasMore`. */
  onLoadMore?: () => void;
  /** Whether more items exist beyond the current page. */
  hasMore?: boolean;
  /** Group items under sticky calendar-day headers. Defaults to `true`. */
  groupByDay?: boolean;
  /** Load-more button text. Defaults to `'Show more'`. */
  moreLabel?: string;
  /** BCP-47 locale for date/time formatting. */
  locale?: string;
  /** Accessible name for the feed region. Defaults to `'Activity'`. */
  label?: string;
  className?: string;
}

/** Plain, dependency-free relative-time label ("2h ago", "3d ago", or a date). */
export function formatRelative(iso: string, locale?: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return iso;
  const diffMs = Date.now() - then;
  const sec = Math.round(diffMs / 1000);
  const abs = Math.abs(sec);
  const rtf =
    typeof Intl !== 'undefined' && 'RelativeTimeFormat' in Intl
      ? new Intl.RelativeTimeFormat(locale, { numeric: 'auto', style: 'short' })
      : null;
  const fmt = (v: number, unit: Intl.RelativeTimeFormatUnit): string =>
    rtf ? rtf.format(v, unit) : `${v} ${unit}`;
  const sign = sec >= 0 ? -1 : 1;
  if (abs < 60) return fmt(sign * abs, 'second');
  if (abs < 3600) return fmt(sign * Math.round(abs / 60), 'minute');
  if (abs < 86400) return fmt(sign * Math.round(abs / 3600), 'hour');
  if (abs < 604800) return fmt(sign * Math.round(abs / 86400), 'day');
  return new Date(iso).toLocaleDateString(locale, { year: 'numeric', month: 'short', day: 'numeric' });
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

/** Plain-text sentence for the article's accessible name. */
function sentenceOf(item: ActivityItem): string {
  const parts = [item.actor.name, item.verb];
  if (item.target) parts.push(item.target.label);
  return parts.join(' ');
}

function ActivityRow({
  item,
  posinset,
  setsize,
  locale,
}: {
  item: ActivityItem;
  posinset: number;
  setsize: number;
  locale?: string;
}) {
  const sentence = sentenceOf(item);
  return (
    <article
      className="fx-activity-feed-item"
      role="article"
      aria-posinset={posinset}
      aria-setsize={setsize}
      aria-label={sentence}
    >
      <div className="fx-activity-feed-avatar" aria-hidden="true">
        <FxAvatar size="sm" name={item.actor.name} src={item.actor.avatarSrc} alt="" />
      </div>
      <div className="fx-activity-feed-body">
        <p className="fx-activity-feed-sentence" aria-hidden="true">
          <span className="fx-activity-feed-actor">{item.actor.name}</span> {item.verb}{' '}
          {item.target &&
            (item.target.href ? (
              <a className="fx-activity-feed-target" href={item.target.href}>
                {item.target.label}
              </a>
            ) : (
              <span className="fx-activity-feed-target">{item.target.label}</span>
            ))}
          {item.tone && item.icon && (
            <FxBadge tone={item.tone} appearance="subtle" size="sm" icon={item.icon} srLabel={item.tone} />
          )}
        </p>
        <time className="fx-activity-feed-time" dateTime={item.at}>
          {formatRelative(item.at, locale)}
        </time>
      </div>
    </article>
  );
}

export function FxActivityFeed({
  items,
  loading = false,
  emptyState,
  onLoadMore,
  hasMore = false,
  groupByDay = true,
  moreLabel = 'Show more',
  locale,
  label = 'Activity',
  className,
}: FxActivityFeedProps) {
  const rootClass = className ? `fx-activity-feed ${className}` : 'fx-activity-feed';

  if (!loading && items.length === 0) {
    return (
      <div className={rootClass}>
        <FxEmptyState
          size="sm"
          title={emptyState?.title ?? 'No activity yet'}
          description={emptyState?.description}
          icon={emptyState?.icon ?? 'activity'}
        />
      </div>
    );
  }

  const setsize = items.length;

  // Build the feed's rows sharing one continuous posinset sequence. Day headers
  // (when grouping) live in presentational wrappers so the feed only OWNS the
  // articles — `role="feed"` requires its children to be `role="article"`.
  let pos = 0;
  const feedChildren: JSX.Element[] = [];
  if (groupByDay) {
    let lastKey = '';
    let group: JSX.Element[] = [];
    let groupHeading = '';
    let groupIso = '';
    const flush = () => {
      if (group.length === 0) return;
      feedChildren.push(
        <div className="fx-activity-feed-group" role="none" key={`grp-${groupIso}`}>
          <div className="fx-activity-feed-day" aria-hidden="true">
            {groupHeading}
          </div>
          {group}
        </div>,
      );
      group = [];
    };
    items.forEach((item) => {
      const k = dayKey(item.at);
      if (k !== lastKey) {
        flush();
        lastKey = k;
        groupIso = k;
        groupHeading = dayHeading(item.at, locale);
      }
      pos += 1;
      group.push(
        <ActivityRow key={item.id} item={item} posinset={pos} setsize={setsize} locale={locale} />,
      );
    });
    flush();
  } else {
    items.forEach((item) => {
      pos += 1;
      feedChildren.push(
        <ActivityRow key={item.id} item={item} posinset={pos} setsize={setsize} locale={locale} />,
      );
    });
  }

  return (
    <div className={rootClass}>
      {/* Polite live region — new items announce without stealing focus. */}
      <div className="fx-activity-feed-status" role="status" aria-live="polite" />
      <div className="fx-activity-feed-feed" role="feed" aria-busy={loading || undefined} aria-label={label}>
        {feedChildren}
      </div>
      {loading && (
        <p className="fx-activity-feed-loading" role="status">
          Loading…
        </p>
      )}
      {hasMore && onLoadMore && (
        <div className="fx-activity-feed-more">
          <button type="button" className="fx-activity-feed-more-btn" onClick={onLoadMore}>
            {moreLabel}
          </button>
        </div>
      )}
    </div>
  );
}
