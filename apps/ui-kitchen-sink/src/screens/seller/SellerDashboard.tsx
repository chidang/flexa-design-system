/**
 * U13-C Seller Dashboard (doc 08 §2.8) — "what earns and what blocks money".
 * Composes flexa-ui end to end against the MSW mock backend
 * (`flexa-ui-kit/mocks` via {@link ../api}): an attention block (orders awaiting
 * fulfilment + disputes) over four Metric Cards, a sales-trend Charts Container,
 * and recent Order Cards beside a Recent Activity feed.
 *
 * The attention counts and the metrics come from the shared order db (paid
 * orders need fulfilment; released escrows feed the available balance), so this
 * screen reflects the buy→fulfil→approve ripple within a session.
 *
 * ZERO one-off component CSS: every visual is a flexa-ui component; framing is
 * the shared `ks-*` utilities plus the seller `sl-*` utilities in seller.css.
 */
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FxAlert,
  FxButton,
  FxChartsContainer,
  FxInlineError,
  FxMetricCard,
  FxOrderCard,
  FxRecentActivity,
  FxSkeletonLoader,
  type ActivityItem as FeedActivityItem,
  type OrderSummary,
} from 'flexa-ui-kit';
import type { Money, Order } from 'flexa-ui-kit/mocks';
import { api, ApiRequestError } from '../api';
import { formatDate } from './format';

/* ------------------------------------------------------------------ shapes */

interface DashboardData {
  store: { id: string; name: string; rating: number | null; reviewCount: number };
  metrics: {
    sales30d: Money;
    held: Money;
    available: Money;
    rating: number | null;
    ratingCount: number;
  };
  attention: {
    awaitingFulfilment: number;
    disputes: number;
    firstFulfilmentOrderId: string | null;
    firstDisputeOrderId: string | null;
  };
  recentOrders: Order[];
  salesTrend: number[];
}

/* ------------------------------------------------------------------ mappers */

/** Shared db order → FxOrderCard summary (seller perspective, first line). */
function toOrderSummary(order: Order): OrderSummary {
  const item = order.items[0]!;
  return {
    id: order.id,
    number: order.number,
    href: `#/screens/seller/orders/${order.id}`,
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

/** Derive a small activity feed from the recent orders (no extra endpoint). */
function toActivity(orders: Order[]): FeedActivityItem[] {
  return orders.slice(0, 5).map((o) => {
    const verb =
      o.escrow.stage === 'released'
        ? 'released funds for'
        : o.escrow.stage === 'disputed'
          ? 'opened a dispute on'
          : o.status === 'paid'
            ? 'paid for'
            : 'updated';
    return {
      id: o.id,
      actor: { name: o.status === 'paid' ? 'Buyer' : 'System' },
      verb,
      target: { label: `#${o.number}`, href: `#/screens/seller/orders/${o.id}` },
      at: formatDate(o.updatedAt),
      icon: o.escrow.stage === 'disputed' ? 'warning' : 'package',
    };
  });
}

/* -------------------------------------------------------------------- view */

export function SellerDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<ApiRequestError | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let live = true;
    setError(null);
    setData(null);
    void api
      .get<DashboardData>('/v1/seller/dashboard')
      .then((d) => live && setData(d))
      .catch((e) => live && setError(e instanceof ApiRequestError ? e : new ApiRequestError(500, null)));
    return () => {
      live = false;
    };
  }, [reloadKey]);

  if (error) {
    return (
      <div className="ks-screen">
        <h1 className="ks-page-title">Seller dashboard</h1>
        <FxInlineError
          message="We couldn't load your dashboard."
          detail={error.body?.requestId}
          onRetry={() => setReloadKey((k) => k + 1)}
        />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="ks-screen">
        <FxSkeletonLoader shape="text" width="16rem" />
        <div className="sl-metric-row">
          {Array.from({ length: 4 }, (_, i) => (
            <FxSkeletonLoader key={i} shape="rect" height="7rem" />
          ))}
        </div>
        <FxSkeletonLoader shape="rect" height="12rem" />
        <div className="ks-cols">
          <FxSkeletonLoader shape="rect" lines={5} />
          <div className="ks-rail">
            <FxSkeletonLoader shape="rect" height="12rem" />
          </div>
        </div>
      </div>
    );
  }

  const { metrics, attention, recentOrders, salesTrend } = data;
  const ratingLabel = metrics.rating != null ? `${metrics.rating.toFixed(1)} ★` : '—';

  return (
    <div className="ks-screen">
      <div className="ks-row ks-row-between">
        <div className="ks-stack" style={{ ['--ks-gap' as string]: 'var(--fx-space-1)' }}>
          <h1 className="ks-page-title">Store: {data.store.name}</h1>
          <span className="ks-muted">Sell, fulfil and get paid — all from one place.</span>
        </div>
        <Link to="/screens/seller/listings/new">
          <FxButton variant="primary">+ New listing</FxButton>
        </Link>
      </div>

      {/* Needs-attention block (§2.8 Attention). */}
      {(attention.awaitingFulfilment > 0 || attention.disputes > 0) && (
        <div className="ks-stack" style={{ ['--ks-gap' as string]: 'var(--fx-space-3)' }}>
          {attention.awaitingFulfilment > 0 && (
            <FxAlert
              tone="warning"
              title={`${attention.awaitingFulfilment} order${attention.awaitingFulfilment === 1 ? '' : 's'} awaiting shipment`}
              description="Buyers are waiting — ship to keep your fulfilment on track."
              actions={
                attention.firstFulfilmentOrderId ? (
                  <Link to={`/screens/seller/orders/${attention.firstFulfilmentOrderId}`}>
                    <FxButton variant="secondary" size="sm">
                      Fulfil
                    </FxButton>
                  </Link>
                ) : undefined
              }
            />
          )}
          {attention.disputes > 0 && (
            <FxAlert
              tone="danger"
              title={`${attention.disputes} dispute${attention.disputes === 1 ? '' : 's'} need${attention.disputes === 1 ? 's' : ''} your response`}
              description="Respond promptly to keep funds moving and protect your rating."
              actions={
                attention.firstDisputeOrderId ? (
                  <Link to={`/screens/seller/orders/${attention.firstDisputeOrderId}`}>
                    <FxButton variant="secondary" size="sm">
                      Respond
                    </FxButton>
                  </Link>
                ) : undefined
              }
            />
          )}
        </div>
      )}

      {/* Metric Cards ×4 (§2.8 Metrics). */}
      <div className="sl-metric-row">
        <FxMetricCard
          label="Sales (30 days)"
          value={metrics.sales30d}
          href="#/screens/seller/orders"
          info="Gross value of orders in the last 30 days."
        />
        <FxMetricCard
          label="Held in escrow"
          value={metrics.held}
          href="#/screens/seller/earnings"
          info="Funds captured but not yet released to your balance."
        />
        <FxMetricCard
          label="Available"
          value={metrics.available}
          href="#/screens/seller/earnings"
          info="Released funds you can withdraw now."
        />
        <FxMetricCard label="Store rating" value={ratingLabel} caption={`${metrics.ratingCount} reviews`} />
      </div>

      {/* Sales trend (§2.8 Trend). */}
      <FxChartsContainer
        title="Sales trend"
        description="Daily gross sales, last 30 days"
        canvasLabel={`Daily sales over the last 30 days, from ${salesTrend[0]! / 100} to ${salesTrend[salesTrend.length - 1]! / 100} dollars.`}
      >
        <FxMetricCard label="30-day sales" value={data.metrics.sales30d} sparkline={salesTrend} size="sm" />
      </FxChartsContainer>

      {/* Recent orders + activity (§2.8 Orders / Feed). */}
      <div className="ks-cols">
        <section
          className="ks-stack"
          style={{ ['--ks-gap' as string]: 'var(--fx-space-3)' }}
          aria-label="Recent orders"
        >
          <div className="ks-row ks-row-between">
            <h2 className="ks-page-title" style={{ fontSize: '1.1rem' }}>
              Recent orders
            </h2>
            <Link to="/screens/seller/orders">
              <FxButton variant="ghost" size="sm">
                View all
              </FxButton>
            </Link>
          </div>
          {recentOrders.length > 0 ? (
            recentOrders.map((o) => (
              <FxOrderCard key={o.id} order={toOrderSummary(o)} perspective="seller" />
            ))
          ) : (
            <p className="ks-muted">No orders yet — they appear here once you get your first sale.</p>
          )}
        </section>
        <div className="ks-rail">
          <FxRecentActivity
            items={toActivity(recentOrders)}
            title="Recent activity"
            emptyState={{ title: 'Nothing yet', description: 'Reviews, messages and payouts show up here.' }}
          />
        </div>
      </div>
    </div>
  );
}
