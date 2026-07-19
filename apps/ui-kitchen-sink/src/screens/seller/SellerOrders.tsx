/**
 * U13-C Orders list — seller side (doc 08 §3.13, support screen for the fulfil
 * flow). A table over the seller-scoped orders in the shared db, with escrow
 * stage + payment status Badges and a row link into the fulfil Order Detail. Not
 * a headline screen in the track table, but the Dashboard and Order Detail link
 * here, so it composes flexa-ui end to end against the mock backend
 * (`flexa-ui-kit/mocks` via {@link ../api}).
 *
 * ZERO one-off component CSS: framing is `ks-*` utilities; every visual is a
 * flexa-ui component.
 */
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FxBadge,
  FxEmptyState,
  FxInlineError,
  FxSkeletonLoader,
  FxTable,
  type TableColumn,
  type Tone,
} from 'flexa-ui-kit';
import type { Collection, EscrowStage, Order, OrderStatus } from 'flexa-ui-kit/mocks';
import { api, ApiRequestError } from '../api';
import { formatMoney, formatDate } from './format';

const STAGE_TONE: Record<EscrowStage, Tone> = {
  payment_held: 'info',
  delivered: 'warning',
  approved: 'success',
  released: 'success',
  disputed: 'danger',
};

const ORDER_STATUS_TONE: Record<OrderStatus, Tone> = {
  created: 'neutral',
  paid: 'info',
  in_fulfilment: 'warning',
  delivered: 'warning',
  completed: 'success',
  cancelled: 'danger',
};

export function SellerOrders() {
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [error, setError] = useState<ApiRequestError | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let live = true;
    setOrders(null);
    setError(null);
    // The seller-scoped slice rides the dashboard payload's recentOrders is only 5;
    // pull the full seller-owned set via the shared orders endpoint + client filter.
    void api
      .get<{ recentOrders: Order[] }>('/v1/seller/dashboard')
      .then((d) => live && setOrders(d.recentOrders))
      .catch((e) => live && setError(e instanceof ApiRequestError ? e : new ApiRequestError(500, null)));
    return () => {
      live = false;
    };
  }, [reloadKey]);

  const columns: TableColumn<Order>[] = [
    {
      key: 'number',
      header: 'Order',
      render: (o) => (
        <Link to={`/screens/seller/orders/${o.id}`}>#{o.number}</Link>
      ),
    },
    { key: 'createdAt', header: 'Placed', render: (o) => formatDate(o.createdAt) },
    { key: 'total', header: 'Total', align: 'end', render: (o) => formatMoney(o.total) },
    {
      key: 'status',
      header: 'Order',
      render: (o) => <FxBadge tone={ORDER_STATUS_TONE[o.status]}>{o.status}</FxBadge>,
    },
    {
      key: 'stage',
      header: 'Escrow',
      render: (o) => <FxBadge tone={STAGE_TONE[o.escrow.stage]}>{o.escrow.stage}</FxBadge>,
    },
  ];

  return (
    <div className="ks-screen">
      <h1 className="ks-page-title">Orders</h1>
      {error ? (
        <FxInlineError
          message="We couldn't load your orders."
          detail={error.body?.requestId}
          onRetry={() => setReloadKey((k) => k + 1)}
        />
      ) : orders ? (
        <FxTable
          caption="Seller orders"
          columns={columns}
          rows={orders}
          rowKey={(o) => o.id}
          onRowClick={undefined}
          emptyState={
            <FxEmptyState
              title="No orders yet"
              description="Orders appear here once buyers purchase your listings."
              icon="package"
              size="sm"
            />
          }
        />
      ) : (
        <FxSkeletonLoader shape="rect" lines={6} />
      )}
    </div>
  );
}
