'use client';
/**
 * FxNotificationCenter — the bell + non-modal notification popover (doc 04
 * §3.8 "FxNotificationCenter — Notification Center").
 *
 * A bell trigger (native icon-only `<button>` + a count Badge) opens a non-modal
 * dialog panel: header (title + "Mark all read" + a settings link), All/Unread
 * Tabs, an FxList of notification rows (tone icon + text + relative time + an
 * unread dot), and a "View all" footer. The panel is non-modal per the contract
 * — `Esc` closes it, but it does NOT trap focus and the page stays interactive;
 * a new-notification announcement is the host's live-region decision, not ours.
 *
 * The panel body only mounts client-side (guarded behind a `mounted` flag) so the
 * static a11y snapshot carries no `aria-controls` IDREF pointing at an absent
 * panel — mirroring how the overlay components gate their portals. The bell's
 * `aria-label` spells the unread count; state lives in TEXT (an unread dot pairs
 * a visually-hidden word), never colour alone.
 */
import { useEffect, useId, useState } from 'react';
import type { Tone } from '../enums';
import type { PartyRef } from '../escrow-timeline/escrow-timeline';
import { FxBadge } from '../badge/badge';
import { FxTabs } from '../tabs/tabs';
import { FxList, type ListItem } from '../list/list';
import { FxIcon } from '../icon/FxIcon';
import type { IconName } from '../icon/map';

/** One notification row. `kind` is a doc-09 webhook event name (`order.paid`). */
export interface NotificationItem {
  id: string;
  /** Event name, e.g. `order.paid`, `message.created` (doc 09). */
  kind: string;
  title: string;
  body?: string;
  /** ISO 8601 timestamp. */
  at: string;
  read: boolean;
  href?: string;
  /** Tint + glyph hint; defaults to `neutral`. */
  tone?: Tone;
  actor?: PartyRef;
}

/** Baked-in strings — every one a prop (§i18n). */
export interface NotificationCenterLabels {
  title: string;
  markAllRead: string;
  viewAll: string;
  empty: string;
  settings: string;
  all: string;
  unread: string;
  showMore: string;
  /** `{count}` is substituted with the unread total for the bell name. */
  bell: string;
  /** Visually-hidden word appended to unread rows (state-in-text). */
  unreadState: string;
}

export const DEFAULT_NOTIFICATION_CENTER_LABELS: NotificationCenterLabels = {
  title: 'Notifications',
  markAllRead: 'Mark all read',
  viewAll: 'View all',
  empty: 'You’re all caught up.',
  settings: 'Notification settings',
  all: 'All',
  unread: 'Unread',
  showMore: 'Show more',
  bell: '{count} unread notifications',
  unreadState: 'Unread',
};

export interface FxNotificationCenterProps {
  notifications: NotificationItem[];
  /** Unread total — drives the bell Badge + accessible name. */
  unreadCount: number;
  /** Fired when the panel opens or closes. */
  onOpenChange?: (open: boolean) => void;
  /** A row was activated (host navigates + marks read). */
  onItemClick?: (item: NotificationItem) => void;
  /** "Mark all read" pressed. */
  onMarkAllRead?: () => void;
  /** "View all" footer link target. */
  viewAllHref?: string;
  /** Settings link target. */
  settingsHref?: string;
  /** Load-more handler — pairs with `hasMore`. */
  onLoadMore?: () => void;
  /** Whether more notifications exist beyond the current page. */
  hasMore?: boolean;
  /** BCP-47 locale for relative-time formatting. */
  locale?: string;
  /** Baked-in strings. Merged over the English defaults. */
  labels?: Partial<NotificationCenterLabels>;
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

/** Plain, dependency-free relative-time label ("2h ago", "3d ago", or a date). */
function formatRelative(iso: string, locale?: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return iso;
  const sec = Math.round((Date.now() - then) / 1000);
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

export function FxNotificationCenter({
  notifications,
  unreadCount,
  onOpenChange,
  onItemClick,
  onMarkAllRead,
  viewAllHref,
  settingsHref,
  onLoadMore,
  hasMore = false,
  locale,
  labels,
  className,
}: FxNotificationCenterProps) {
  const l = { ...DEFAULT_NOTIFICATION_CENTER_LABELS, ...labels };
  const baseId = useId();
  const panelId = `${baseId}-panel`;
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const rootClass = ['fx-notification-center', className].filter(Boolean).join(' ');

  const setOpenState = (next: boolean) => {
    setOpen(next);
    onOpenChange?.(next);
  };

  // Only expose the aria-controls IDREF once the panel can actually mount, so the
  // static a11y snapshot never carries a dangling reference.
  const panelAvailable = mounted && open;

  const rowsFor = (list: NotificationItem[]): ListItem[] =>
    list.map((n) => {
      const tone = n.tone ?? 'neutral';
      return {
        key: n.id,
        href: n.href,
        media: (
          <span className="fx-notification-center-icon" data-tone={tone} aria-hidden="true">
            <FxIcon name={TONE_ICON[tone]} size={16} />
          </span>
        ),
        title: n.title,
        description: n.body,
        meta: (
          <span className="fx-notification-center-meta">
            <time className="fx-notification-center-time" dateTime={n.at}>
              {formatRelative(n.at, locale)}
            </time>
            {!n.read && (
              <span className="fx-notification-center-dot" data-tone={tone}>
                <span className="fx-notification-center-sr">{l.unreadState}</span>
              </span>
            )}
          </span>
        ),
      };
    });

  const listFor = (list: NotificationItem[], ariaLabel: string) =>
    list.length === 0 ? (
      <div className="fx-notification-center-empty">{l.empty}</div>
    ) : (
      <>
        <FxList
          items={rowsFor(list)}
          divided
          aria-label={ariaLabel}
          onSelect={(item) => {
            const found = notifications.find((n) => n.id === item.key);
            if (found) onItemClick?.(found);
          }}
        />
        {hasMore && onLoadMore && (
          <div className="fx-notification-center-more">
            <button type="button" className="fx-notification-center-more-btn" onClick={onLoadMore}>
              {l.showMore}
            </button>
          </div>
        )}
      </>
    );

  const unread = notifications.filter((n) => !n.read);

  const tabs = [
    { id: 'all', label: l.all, content: listFor(notifications, l.all) },
    { id: 'unread', label: l.unread, badge: unreadCount || undefined, content: listFor(unread, l.unread) },
  ];

  return (
    <div className={rootClass}>
      <button
        type="button"
        className="fx-notification-center-bell"
        aria-label={l.bell.replace('{count}', String(unreadCount))}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={panelAvailable ? panelId : undefined}
        data-open={open || undefined}
        onClick={() => setOpenState(!open)}
      >
        <FxIcon name="bell" size={20} />
        {unreadCount > 0 && (
          <span className="fx-notification-center-count">
            <FxBadge tone="danger" appearance="solid" size="sm" count={unreadCount} srLabel={l.unreadState} />
          </span>
        )}
      </button>

      {panelAvailable && (
        <div
          className="fx-notification-center-panel"
          id={panelId}
          role="dialog"
          aria-label={l.title}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              e.stopPropagation();
              setOpenState(false);
            }
          }}
        >
          <div className="fx-notification-center-header">
            <h2 className="fx-notification-center-title">{l.title}</h2>
            <div className="fx-notification-center-header-actions">
              {onMarkAllRead && (
                <button
                  type="button"
                  className="fx-notification-center-mark"
                  onClick={onMarkAllRead}
                  disabled={unreadCount === 0}
                >
                  {l.markAllRead}
                </button>
              )}
              {settingsHref != null && (
                <a className="fx-notification-center-settings" href={settingsHref} aria-label={l.settings}>
                  <FxIcon name="settings" size={16} />
                </a>
              )}
            </div>
          </div>

          <FxTabs items={tabs} />

          {viewAllHref != null && (
            <div className="fx-notification-center-footer">
              <a className="fx-notification-center-view-all" href={viewAllHref}>
                {l.viewAll}
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
