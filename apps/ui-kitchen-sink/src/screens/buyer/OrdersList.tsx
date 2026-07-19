/**
 * U13-B Orders List — buyer (doc 08 §3.6, flow B2 entry). Filterable list over
 * `GET /orders` (core; reads the shared `db.orders`, so an approve/dispute made
 * elsewhere in the session is reflected on reload). Tabs filter by escrow stage;
 * each row is an Order Card that opens Order Detail (buyer view §2.5), where the
 * stage-gated Approve / dispute actions live.
 *
 * GAP (doc 15 §6): doc 08 §3.6 wants an inline Approve shortcut on `delivered`
 * rows sharing §2.5's Confirmation Dialog, but FxOrderCard's buyer action for a
 * delivered order is the documented "Review" (status × perspective mapping) and
 * there is no per-row action slot to inject an "Approve" button without a fork.
 * Closest fit: the card navigates to Order Detail, which owns Approve. Logged in
 * routes.tsx GAPS + PR.
 *
 * ZERO one-off component CSS: composed from flexa-ui; framing via `ks-*` +
 * `buyer.css`.
 */
import { useEffect, useMemo, useState } from 'react';
import {
  FxEmptyState,
  FxInlineError,
  FxOrderCard,
  FxSearchBar,
  FxSkeletonLoader,
  FxTabs,
  type OrderSummary,
  type TabItem,
} from 'flexa-ui-kit';
import type { Collection, EscrowStage, Order } from 'flexa-ui-kit/mocks';
import { api, ApiRequestError } from '../api';
import { formatDate } from './format';

/* ----------------------------------------------------------------- filters */

type StageTab = 'all' | 'in_progress' | 'completed' | 'disputed';

const STAGE_MATCH: Record<Exclude<StageTab, 'all'>, EscrowStage[]> = {
  in_progress: ['payment_held', 'delivered'],
  completed: ['approved', 'released'],
  disputed: ['disputed'],
};

function matchesTab(order: Order, tab: StageTab): boolean {
  if (tab === 'all') return true;
  return STAGE_MATCH[tab].includes(order.escrow.stage);
}

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

/* -------------------------------------------------------------------- root */

export function OrdersList() {
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ApiRequestError | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [query, setQuery] = useState('');
  const [tab, setTab] = useState<StageTab>('all');

  useEffect(() => {
    let live = true;
    setLoading(true);
    setError(null);
    api
      .get<Collection<Order>>('/v1/orders')
      .then((list) => live && (setOrders(list.data), setLoading(false)))
      .catch((e) => {
        if (!live) return;
        setError(e instanceof ApiRequestError ? e : new ApiRequestError(500, null));
        setLoading(false);
      });
    return () => {
      live = false;
    };
  }, [reloadKey]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (orders ?? [])
      .filter((o) => matchesTab(o, tab))
      .filter(
        (o) =>
          !q ||
          o.number.toLowerCase().includes(q) ||
          o.items.some((it) => it.title.toLowerCase().includes(q)),
      )
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  }, [orders, tab, query]);

  const count = (t: StageTab) => (orders ?? []).filter((o) => matchesTab(o, t)).length;

  const listBody = (() => {
    if (loading) {
      return (
        <div className="ks-stack" style={{ ['--ks-gap' as string]: 'var(--fx-space-3)' }}>
          {Array.from({ length: 4 }, (_, i) => (
            <FxSkeletonLoader key={i} shape="rect" height="6rem" />
          ))}
        </div>
      );
    }
    if (error) {
      return (
        <FxInlineError
          message="We couldn't load your orders."
          detail={error.body?.requestId}
          onRetry={() => setReloadKey((k) => k + 1)}
        />
      );
    }
    if (filtered.length === 0) {
      const isFiltered = query.trim() !== '' || tab !== 'all';
      return (
        <FxEmptyState
          title={isFiltered ? 'No orders match' : 'No orders yet'}
          description={
            isFiltered
              ? 'Try a different tab or clear your search.'
              : 'When you buy something, it shows up here with escrow protection.'
          }
          icon="package"
        />
      );
    }
    return (
      <div className="ks-stack" style={{ ['--ks-gap' as string]: 'var(--fx-space-3)' }}>
        {filtered.map((o) => (
          <FxOrderCard key={o.id} order={toOrderSummary(o)} perspective="buyer" />
        ))}
      </div>
    );
  })();

  const tabs: TabItem[] = [
    { id: 'all', label: 'All', badge: count('all') || undefined, content: listBody },
    { id: 'in_progress', label: 'In progress', badge: count('in_progress') || undefined, content: listBody },
    { id: 'completed', label: 'Completed', badge: count('completed') || undefined, content: listBody },
    { id: 'disputed', label: 'Disputed', badge: count('disputed') || undefined, content: listBody },
  ];

  return (
    <div className="ks-screen">
      <div className="ks-row ks-row-between">
        <h1 className="ks-page-title">Orders</h1>
        <div className="bx-search">
          <FxSearchBar
            value={query}
            onChange={setQuery}
            placeholder="Search by order number or item"
            ariaLabel="Search orders"
          />
        </div>
      </div>
      <FxTabs items={tabs} value={tab} onChange={(id) => setTab(id as StageTab)} />
    </div>
  );
}
