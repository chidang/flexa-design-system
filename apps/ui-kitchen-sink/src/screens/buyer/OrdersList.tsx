/**
 * U13-B Orders List — buyer (doc 08 §3.6, flow B2 entry). Filterable list over
 * `GET /orders` (core; reads the shared `db.orders`, so an approve/dispute made
 * elsewhere in the session is reflected on reload). Tabs filter by escrow stage;
 * each row is an Order Card that opens Order Detail (buyer view §2.5), where the
 * stage-gated Approve / dispute actions live.
 *
 * Inline Approve (doc 08 §3.6, G1 closed — ui-kit doc 14 §11): `delivered` rows
 * override the card footer via FxOrderCard's `actions` slot with an "Approve"
 * shortcut sharing §2.5's Confirmation Dialog copy (`POST /orders/:id/approve`,
 * optimistic list update + toast). Other rows keep the mapped default action.
 *
 * ZERO one-off component CSS: composed from flexa-ui; framing via `ks-*` +
 * `buyer.css`.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  FxButton,
  FxConfirmationDialog,
  FxEmptyState,
  FxInlineError,
  FxOrderCard,
  FxSearchBar,
  FxSkeletonLoader,
  FxTabs,
  useToast,
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
  const toast = useToast();
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ApiRequestError | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [query, setQuery] = useState('');
  const [tab, setTab] = useState<StageTab>('all');
  /** Order awaiting confirmation of the inline Approve shortcut (§3.6 / G1). */
  const [approveTarget, setApproveTarget] = useState<Order | null>(null);

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

  /** Inline Approve (shares §2.5's confirmation copy; mirrors Order Detail). */
  const approve = useCallback(async () => {
    if (!approveTarget) return;
    try {
      const next = await api.post<Order>(
        `/v1/orders/${approveTarget.id}/approve`,
        {},
        `approve-${approveTarget.id}`,
      );
      setOrders((prev) => (prev ?? []).map((o) => (o.id === next.id ? next : o)));
      toast.show({
        tone: 'success',
        title: 'Delivery approved',
        description: 'Funds have been released to the seller.',
      });
    } catch (e) {
      const code = e instanceof ApiRequestError ? e.body?.code : undefined;
      toast.show({
        tone: 'danger',
        title: 'Could not approve delivery',
        description:
          code === 'state_conflict'
            ? 'This order is no longer awaiting your approval. We refreshed the list.'
            : 'Something went wrong. Please try again in a moment.',
      });
      // Resync so the list reflects the true stage after a conflict.
      if (code === 'state_conflict') setReloadKey((k) => k + 1);
      throw e; // keep the confirmation dialog from resolving as success
    }
  }, [approveTarget, toast]);

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
          <FxOrderCard
            key={o.id}
            order={toOrderSummary(o)}
            perspective="buyer"
            // G1 closed: delivered rows surface the §3.6 inline Approve shortcut
            // through the card's `actions` slot; others keep the mapped default.
            actions={
              o.escrow.stage === 'delivered' ? (
                <FxButton variant="primary" size="sm" onClick={() => setApproveTarget(o)}>
                  Approve
                </FxButton>
              ) : undefined
            }
          />
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

      {/* Approve confirmation — same copy as Order Detail (§2.5). */}
      <FxConfirmationDialog
        open={approveTarget != null}
        onOpenChange={(o) => !o && setApproveTarget(null)}
        tone="default"
        title="Approve delivery?"
        description="Funds will be released to the seller. This cannot be undone."
        confirmLabel="Approve & release"
        onConfirm={approve}
      />
    </div>
  );
}
