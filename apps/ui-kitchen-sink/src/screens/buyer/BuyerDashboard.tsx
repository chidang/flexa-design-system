/**
 * U13-B Buyer Dashboard (doc 08 §2.6) — "what needs attention now" for the
 * buyer. Composes flexa-ui end to end against the MSW mock backend
 * (`flexa-ui-kit/mocks` via ../api): attention Alerts (delivered orders awaiting
 * approval + open disputes), three Metric Cards (active orders, held in escrow,
 * unread notifications), a recent Order Card list, a Recent Activity feed and
 * Quick Links.
 *
 * Flow: entry point for B2 (track → approve) and the account surfaces
 * (B4 reviews, B6 wallet). Read-mostly (doc 08 §2.6 interaction 4) — every
 * action deep-links to a screen that owns the mutation.
 *
 * Data is aggregated client-side from `GET /orders`, `GET /notifications` and
 * `GET /wallet` (the spec's `GET /me/dashboard` is a server aggregate; the mock
 * keeps its resources granular, so per-region failures degrade independently).
 *
 * ZERO one-off component CSS: every visual is a flexa-ui component; page framing
 * is the `ks-*` harness utilities + `buyer.css`.
 */
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FxAlert,
  FxButton,
  FxEmptyState,
  FxInlineError,
  FxMetricCard,
  FxOrderCard,
  FxQuickLinks,
  FxRecentActivity,
  FxSkeletonLoader,
  type ActivityItem as FeedItem,
  type OrderSummary,
  type QuickLink,
} from 'flexa-ui-kit';
import type { BuyerNotification, Collection, Order, Wallet } from 'flexa-ui-kit/mocks';
import { api, ApiRequestError } from '../api';
import { formatDate, formatMoney } from './format';

/* ------------------------------------------------------------------ mappers */

/** mock Order → FxOrderCard's buyer-view OrderSummary. */
function toOrderSummary(order: Order): OrderSummary {
  return {
    id: order.id,
    number: order.number,
    href: `#/screens/orders/${order.id}`,
    status: order.status,
    total: order.total,
    placedAt: formatDate(order.createdAt),
    itemCount: order.items.reduce((n, it) => n + it.quantity, 0),
    items: order.items.map((it) => ({
      id: it.listingId,
      title: it.title,
      imageUrl: it.coverUrl,
      quantity: it.quantity,
    })),
    seller: { id: order.sellerId, name: order.sellerName },
  };
}

/** mock Notification → Recent Activity feed item. */
function toFeedItem(n: BuyerNotification): FeedItem {
  return {
    id: n.id,
    actor: { name: 'Flexa' },
    verb: n.title,
    target: { label: 'Open', href: n.linkUrl },
    at: formatDate(n.createdAt),
  };
}

/* -------------------------------------------------------------------- root */

const QUICK_LINKS: QuickLink[] = [
  { label: 'All orders', href: '#/screens/buyer/orders', icon: 'package' },
  { label: 'Reviews to write', href: '#/screens/buyer/reviews', icon: 'star' },
  { label: 'Wallet & payment methods', href: '#/screens/buyer/wallet', icon: 'wallet' },
  { label: 'Notifications', href: '#/screens/buyer/notifications', icon: 'bell' },
];

export function BuyerDashboard() {
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [notifications, setNotifications] = useState<BuyerNotification[]>([]);
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ApiRequestError | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let live = true;
    setLoading(true);
    setError(null);
    (async () => {
      try {
        const list = await api.get<Collection<Order>>('/v1/orders');
        if (!live) return;
        setOrders(list.data);
        setLoading(false);
        // Deferred, non-blocking regions — failures leave them empty.
        void api
          .get<Collection<BuyerNotification>>('/v1/notifications')
          .then((n) => live && setNotifications(n.data))
          .catch(() => {});
        void api
          .get<Wallet>('/v1/wallet')
          .then((w) => live && setWallet(w))
          .catch(() => {});
      } catch (e) {
        if (!live) return;
        setError(e instanceof ApiRequestError ? e : new ApiRequestError(500, null));
        setLoading(false);
      }
    })();
    return () => {
      live = false;
    };
  }, [reloadKey]);

  if (loading) {
    return (
      <div className="ks-screen">
        <FxSkeletonLoader shape="text" width="14rem" />
        <div className="bx-metrics">
          <FxSkeletonLoader shape="rect" height="7rem" />
          <FxSkeletonLoader shape="rect" height="7rem" />
          <FxSkeletonLoader shape="rect" height="7rem" />
        </div>
        <FxSkeletonLoader shape="rect" lines={4} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="ks-screen">
        <h1 className="ks-page-title">Hi, Dana</h1>
        <FxInlineError
          message="We couldn't load your dashboard."
          detail={error.body?.requestId}
          onRetry={() => setReloadKey((k) => k + 1)}
        />
      </div>
    );
  }

  const all = orders ?? [];
  const attentionApprove = all.filter((o) => o.escrow.stage === 'delivered');
  const disputes = all.filter((o) => o.escrow.stage === 'disputed');
  const activeOrders = all.filter((o) =>
    ['payment_held', 'delivered'].includes(o.escrow.stage),
  );
  const heldTotal = activeOrders.reduce((n, o) => n + o.escrow.amount.amount, 0);
  const unread = notifications.filter((n) => n.readAt == null).length;
  const recent = [...all]
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
    .slice(0, 5);

  return (
    <div className="ks-screen">
      <h1 className="ks-page-title">Hi, Dana</h1>

      {/* Attention: delivered orders awaiting approval + open disputes. */}
      {(attentionApprove.length > 0 || disputes.length > 0) && (
        <section
          className="ks-stack"
          style={{ ['--ks-gap' as string]: 'var(--fx-space-3)' }}
          aria-label="Needs attention"
        >
          {attentionApprove.map((o) => (
            <FxAlert
              key={o.id}
              tone="warning"
              title={`Order ${o.number} was delivered`}
              description="Approve delivery to release the funds, or open a dispute if something is wrong."
              actions={
                <Link to={`/screens/orders/${o.id}`}>
                  <FxButton variant="secondary" size="sm">
                    Review it
                  </FxButton>
                </Link>
              }
            />
          ))}
          {disputes.map((o) => (
            <FxAlert
              key={o.id}
              tone="danger"
              title={`Order ${o.number} is in dispute`}
              description="Track the conversation and evidence while we work with the seller."
              actions={
                <Link to={`/screens/orders/${o.id}`}>
                  <FxButton variant="secondary" size="sm">
                    View dispute
                  </FxButton>
                </Link>
              }
            />
          ))}
        </section>
      )}

      {/* Metrics — each drills into the relevant screen (doc 08 §2.6 #2). */}
      <div className="bx-metrics">
        <FxMetricCard label="Active orders" value={activeOrders.length} href="#/screens/buyer/orders" />
        <FxMetricCard
          label="Held in escrow"
          value={{ amount: heldTotal, currency: 'USD' }}
          caption="Released when you approve delivery"
        />
        <FxMetricCard label="Unread notifications" value={unread} href="#/screens/buyer/notifications" />
      </div>

      {/* Recent orders + side rail (activity feed, quick links). */}
      <div className="ks-cols">
        <section className="ks-stack" style={{ ['--ks-gap' as string]: 'var(--fx-space-3)' }} aria-label="Recent orders">
          <div className="ks-row ks-row-between">
            <h2 className="ks-page-title" style={{ fontSize: '1.1rem' }}>
              Recent orders
            </h2>
            <Link to="/screens/buyer/orders">
              <FxButton variant="ghost" size="sm">
                View all
              </FxButton>
            </Link>
          </div>
          {recent.length > 0 ? (
            recent.map((o) => <FxOrderCard key={o.id} order={toOrderSummary(o)} perspective="buyer" />)
          ) : (
            <FxEmptyState
              title="No orders yet"
              description="When you buy something, it shows up here with escrow protection."
              icon="package"
              actions={
                <Link to="/screens/search">
                  <FxButton variant="primary">Explore the marketplace</FxButton>
                </Link>
              }
            />
          )}
        </section>

        <div className="ks-rail">
          <FxRecentActivity
            items={notifications.map(toFeedItem)}
            limit={5}
            viewAllHref="#/screens/buyer/notifications"
            emptyState={{ title: 'No recent activity', icon: 'bell' }}
          />
          <FxQuickLinks links={QUICK_LINKS} />
        </div>
      </div>
    </div>
  );
}
