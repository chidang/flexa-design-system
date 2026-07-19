/**
 * U13-B Notifications (doc 08 §3.7, flow B2 entry). The full-page Notification
 * Center (the bell popover is a separate component per §3.7): a single-column
 * List grouped by day, filtered by Tabs (All / Unread / Orders / Messages /
 * System). Rows carry a tone Badge, title, snippet, time and an unread dot;
 * clicking a row marks it read (`POST /notifications/mark-read`, mutating the
 * buyer track state) then deep-links to its target. "Mark all as read" clears
 * the feed.
 *
 * ZERO one-off component CSS: composed from flexa-ui; framing via `ks-*` +
 * `buyer.css`.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  FxBadge,
  FxButton,
  FxEmptyState,
  FxInlineError,
  FxList,
  FxSkeletonLoader,
  FxTabs,
  statusTone,
  type ListItem,
  type TabItem,
  type Tone,
} from 'flexa-ui-kit';
import type { BuyerNotification, Collection } from 'flexa-ui-kit/mocks';
import { api, ApiRequestError } from '../api';
import { formatDate } from './format';

/* ------------------------------------------------------------------ helpers */

type FilterTab = 'all' | 'unread' | 'orders' | 'messages' | 'system';

/** Tab membership from the event `type` (mirrors data.buyer notificationGroup). */
function inTab(n: BuyerNotification, tab: FilterTab): boolean {
  if (tab === 'all') return true;
  if (tab === 'unread') return n.readAt == null;
  if (tab === 'messages') return n.type.startsWith('message.');
  if (tab === 'orders')
    return (
      n.type.startsWith('order.') || n.type.startsWith('escrow.') || n.type.startsWith('dispute.')
    );
  return !n.type.startsWith('message.') && !inTab(n, 'orders'); // system
}

/** Tone from the event family (drives the row Badge glyph + tint). */
function toneFor(type: string): Tone {
  if (type.startsWith('dispute.')) return statusTone('disputed');
  if (type.startsWith('escrow.') || type === 'order.delivered') return statusTone('released');
  if (type.startsWith('message.')) return 'info';
  return 'neutral';
}

/** Day header key for grouping (e.g. "Jul 15, 2026"). */
function dayOf(iso: string): string {
  return formatDate(iso);
}

/** Time label for the row meta (e.g. "9:05 AM"). */
function timeOf(iso: string): string {
  return new Date(iso).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

/* -------------------------------------------------------------------- root */

export function Notifications() {
  const [items, setItems] = useState<BuyerNotification[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ApiRequestError | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [tab, setTab] = useState<FilterTab>('all');

  useEffect(() => {
    let live = true;
    setLoading(true);
    setError(null);
    api
      .get<Collection<BuyerNotification>>('/v1/notifications')
      .then((res) => live && (setItems(res.data), setLoading(false)))
      .catch((e) => {
        if (!live) return;
        setError(e instanceof ApiRequestError ? e : new ApiRequestError(500, null));
        setLoading(false);
      });
    return () => {
      live = false;
    };
  }, [reloadKey]);

  const markRead = useCallback(async (ids: string[]) => {
    if (ids.length === 0) return;
    // Optimistic: flip local read state, then persist.
    setItems((prev) =>
      (prev ?? []).map((n) =>
        ids.includes(n.id) && n.readAt == null ? { ...n, readAt: 'read' } : n,
      ),
    );
    await api.post('/v1/notifications/mark-read', { ids }).catch(() => {});
  }, []);

  const markAllRead = useCallback(async () => {
    setItems((prev) => (prev ?? []).map((n) => (n.readAt ? n : { ...n, readAt: 'read' })));
    await api.post('/v1/notifications/mark-read', { all: true }).catch(() => {});
  }, []);

  const openItem = useCallback(
    (n: BuyerNotification) => {
      void markRead([n.id]);
      // linkUrl already carries the `#/screens/...` hash route.
      window.location.hash = n.linkUrl.replace(/^#/, '');
    },
    [markRead],
  );

  const filtered = useMemo(
    () => (items ?? []).filter((n) => inTab(n, tab)),
    [items, tab],
  );

  /** Group the filtered feed into day sections, newest day first. */
  const groups = useMemo(() => {
    const byDay = new Map<string, BuyerNotification[]>();
    for (const n of filtered) {
      const day = dayOf(n.createdAt);
      const bucket = byDay.get(day);
      if (bucket) bucket.push(n);
      else byDay.set(day, [n]);
    }
    return [...byDay.entries()];
  }, [filtered]);

  const unreadCount = (items ?? []).filter((n) => n.readAt == null).length;
  const tabCount = (t: FilterTab) => (items ?? []).filter((n) => inTab(n, t)).length;

  const body = (() => {
    if (loading) {
      return (
        <div className="ks-stack" style={{ ['--ks-gap' as string]: 'var(--fx-space-2)' }}>
          {Array.from({ length: 6 }, (_, i) => (
            <FxSkeletonLoader key={i} shape="rect" height="4rem" />
          ))}
        </div>
      );
    }
    if (error) {
      return (
        <FxInlineError
          message="We couldn't load your notifications."
          detail={error.body?.requestId}
          onRetry={() => setReloadKey((k) => k + 1)}
        />
      );
    }
    if (filtered.length === 0) {
      return (
        <FxEmptyState
          title="You're all caught up 🎉"
          description="New notifications about your orders, messages and disputes appear here."
          icon="bell"
        />
      );
    }
    return (
      <div className="ks-stack" style={{ ['--ks-gap' as string]: 'var(--fx-space-4)' }}>
        {groups.map(([day, rows]) => {
          const listItems: ListItem[] = rows.map((n) => ({
            key: n.id,
            title: n.title,
            description: n.body,
            media: <FxBadge tone={toneFor(n.type)} dot appearance="subtle" srLabel={n.type} />,
            meta: (
              <span className="bx-notif-meta">
                {n.readAt == null && (
                  <FxBadge tone="info" size="sm" appearance="solid" srLabel="Unread" />
                )}
                <span className="ks-muted">{timeOf(n.createdAt)}</span>
              </span>
            ),
          }));
          return (
            <section key={day} className="ks-stack" style={{ ['--ks-gap' as string]: 'var(--fx-space-2)' }}>
              <h2 className="ks-group-title">{day}</h2>
              <FxList
                items={listItems}
                divided
                aria-label={`Notifications from ${day}`}
                onSelect={(item) => {
                  const n = rows.find((r) => r.id === item.key);
                  if (n) openItem(n);
                }}
              />
            </section>
          );
        })}
      </div>
    );
  })();

  const tabs: TabItem[] = [
    { id: 'all', label: 'All', badge: tabCount('all') || undefined, content: body },
    { id: 'unread', label: 'Unread', badge: unreadCount || undefined, content: body },
    { id: 'orders', label: 'Orders', badge: tabCount('orders') || undefined, content: body },
    { id: 'messages', label: 'Messages', badge: tabCount('messages') || undefined, content: body },
    { id: 'system', label: 'System', badge: tabCount('system') || undefined, content: body },
  ];

  return (
    <div className="ks-screen">
      <div className="ks-row ks-row-between">
        <h1 className="ks-page-title">Notifications</h1>
        <FxButton variant="ghost" onClick={markAllRead} disabled={unreadCount === 0}>
          Mark all as read
        </FxButton>
      </div>
      <FxTabs items={tabs} value={tab} onChange={(id) => setTab(id as FilterTab)} />
    </div>
  );
}
