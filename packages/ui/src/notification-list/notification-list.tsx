/**
 * FxNotificationList — the full-page notification feed (ui-kit doc 14 §11 G2).
 *
 * The page-level sibling of FxNotificationCenter (the App-Shell bell popover):
 * both surfaces share the `NotificationItem` shape, so a host can hand the same
 * feed to either. Renders host-provided groups — a heading (day buckets like
 * "Jul 15, 2026", or "Today"/"Earlier") + an FxList of rows with a leading tone
 * icon, title/body, a `<time>` stamp and an unread dot whose state also lives
 * in TEXT (a visually-hidden word, never colour alone). Grouping/bucketing is
 * the host's call — no date maths lives here; the default row time is a
 * locale-aware hour:minute since the group heading already carries the day.
 *
 * Rows activate via `onItemClick` (host marks read + deep-links) or `href`
 * pass-through; filtering (All/Unread tabs) and page chrome (title, "Mark all
 * as read") stay host-side — this component is the list itself.
 */
import { createElement } from 'react';
import type { Tone } from '../enums';
import { FxList, type ListItem } from '../list/list';
import { FxIcon } from '../icon/FxIcon';
import type { IconName } from '../icon/map';
import type { NotificationItem } from '../notification-center/notification-center';

/** One rendered section: a heading + its rows (e.g. one day of the feed). */
export interface NotificationGroup {
  /** Section heading, e.g. `Jul 15, 2026` or `Today`. */
  label: string;
  items: NotificationItem[];
}

/** Baked-in strings — every one a prop (§i18n). */
export interface NotificationListLabels {
  empty: string;
  /** Visually-hidden word appended to unread rows (state-in-text). */
  unreadState: string;
  /** Accessible name for a group's list; `{group}` is the group label. */
  groupList: string;
}

export const DEFAULT_NOTIFICATION_LIST_LABELS: NotificationListLabels = {
  empty: 'You’re all caught up.',
  unreadState: 'Unread',
  groupList: 'Notifications from {group}',
};

export interface FxNotificationListProps {
  /** The feed, already bucketed by the host (day groups, Today/Earlier, …). */
  groups: NotificationGroup[];
  /** A row was activated (host marks read + navigates). */
  onItemClick?: (item: NotificationItem) => void;
  /** Heading element for group labels, fitting the page outline. Default 2. */
  headingLevel?: 2 | 3 | 4;
  /** Row time label. Defaults to a locale hour:minute of `item.at`. */
  formatTime?: (iso: string) => string;
  /** BCP-47 locale for the default time formatting. */
  locale?: string;
  /** Baked-in strings. Merged over the English defaults. */
  labels?: Partial<NotificationListLabels>;
  className?: string;
}

/** Default glyph per tone (mirrors the §1.9 tone → icon pairing). */
const TONE_ICON: Record<Tone, IconName> = {
  neutral: 'bell',
  info: 'info',
  success: 'success',
  warning: 'warning',
  danger: 'error',
};

/** Locale hour:minute ("9:05 AM") — the group heading already carries the day. */
function defaultTime(iso: string, locale?: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleTimeString(locale, { hour: 'numeric', minute: '2-digit' });
}

export function FxNotificationList({
  groups,
  onItemClick,
  headingLevel = 2,
  formatTime,
  locale,
  labels,
  className,
}: FxNotificationListProps) {
  const l = { ...DEFAULT_NOTIFICATION_LIST_LABELS, ...labels };
  const rootClass = ['fx-notification-list', className].filter(Boolean).join(' ');
  const timeOf = formatTime ?? ((iso: string) => defaultTime(iso, locale));

  const rowsFor = (list: NotificationItem[]): ListItem[] =>
    list.map((n) => {
      const tone = n.tone ?? 'neutral';
      return {
        key: n.id,
        href: n.href,
        media: (
          <span className="fx-notification-list-icon" data-tone={tone} aria-hidden="true">
            <FxIcon name={TONE_ICON[tone]} size={16} />
          </span>
        ),
        title: n.title,
        description: n.body,
        meta: (
          <span className="fx-notification-list-meta">
            <time className="fx-notification-list-time" dateTime={n.at}>
              {timeOf(n.at)}
            </time>
            {!n.read && (
              <span className="fx-notification-list-dot" data-tone={tone}>
                <span className="fx-notification-list-sr">{l.unreadState}</span>
              </span>
            )}
          </span>
        ),
      };
    });

  const filled = groups.filter((g) => g.items.length > 0);

  if (filled.length === 0) {
    return (
      <div className={rootClass}>
        <div className="fx-notification-list-empty">{l.empty}</div>
      </div>
    );
  }

  return (
    <div className={rootClass}>
      {filled.map((group) => (
        <section key={group.label} className="fx-notification-list-group">
          {createElement(
            `h${headingLevel}`,
            { className: 'fx-notification-list-heading' },
            group.label,
          )}
          <FxList
            items={rowsFor(group.items)}
            divided
            aria-label={l.groupList.replace('{group}', group.label)}
            onSelect={(item) => {
              const found = group.items.find((n) => n.id === item.key);
              if (found) onItemClick?.(found);
            }}
          />
        </section>
      ))}
    </div>
  );
}
