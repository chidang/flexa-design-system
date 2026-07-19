/**
 * U13-C Order Detail — fulfil, seller view (doc 08 §2.10, flow S3). The
 * seller-side of a SHARED order: it reads and mutates `db.orders`, so
 * mark-shipped / mark-delivered ripple straight into the buyer's Order Detail
 * timeline within a session. Composes flexa-ui end to end against the mock
 * backend (`flexa-ui-kit/mocks` via {@link ../api}).
 *
 * The primary action is stage-dependent (§2.10): `paid` → Mark as shipped
 * (carrier + tracking Dialog) which moves the order to `in_fulfilment`;
 * `in_fulfilment` → Mark as delivered which advances escrow `payment_held →
 * delivered` and starts the buyer approval window (so the buyer approve flow
 * becomes reachable in-session); `delivered` → watch state; `disputed` → respond
 * banner. Legal escrow × payment pairs per doc 07 §0.3.
 *
 * ZERO one-off component CSS: framing is `ks-*` + seller `sl-*` utilities; every
 * visual is a flexa-ui component.
 */
import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  FxAlert,
  FxBreadcrumb,
  FxBuyerCard,
  FxButton,
  FxCard,
  FxDescriptionList,
  FxDialog,
  FxErrorPage,
  FxEscrowTimeline,
  FxFieldGroup,
  FxInput,
  FxOrderCard,
  FxPaymentStatus,
  FxSelect,
  FxSkeletonLoader,
  useToast,
  type BreadcrumbItem,
  type BuyerSummary,
  type DescriptionListItem,
  type EscrowEvent as TimelineEscrowEvent,
  type OrderSummary,
  type PaymentInfo,
} from 'flexa-ui-kit';
import type { Collection, EscrowEvent, EscrowStage, Order } from 'flexa-ui-kit/mocks';
import { api, ApiRequestError } from '../api';
import { formatDate, formatMoney } from './format';

/* ------------------------------------------------------------------ shapes */

interface SellerOrder extends Order {
  payoutPreview: { gross: Order['total']; fee: Order['fees']; net: Order['total'] };
  tracking: { carrier: string; trackingNumber: string; shippedAt: string } | null;
}

const CARRIERS = [
  { value: 'Flexa Post', label: 'Flexa Post' },
  { value: 'DHL', label: 'DHL' },
  { value: 'UPS', label: 'UPS' },
  { value: 'Colissimo', label: 'Colissimo' },
];

/* ------------------------------------------------------------------ mappers */

function stageForEventType(type: EscrowEvent['type']): EscrowStage | null {
  switch (type) {
    case 'held':
      return 'payment_held';
    case 'delivered':
      return 'delivered';
    case 'approved':
      return 'approved';
    case 'released':
    case 'auto_released':
      return 'released';
    case 'disputed':
    case 'dispute_resolved':
    case 'refunded':
      return 'disputed';
    case 'auto_release_scheduled':
      return null;
  }
}

function toTimelineEvents(events: EscrowEvent[], stage: EscrowStage): TimelineEscrowEvent[] {
  const out: TimelineEscrowEvent[] = [];
  const seen = new Set<EscrowStage>();
  for (const e of events) {
    const s = stageForEventType(e.type);
    if (s === null || seen.has(s)) continue;
    seen.add(s);
    out.push({
      id: e.id,
      stage: s,
      status: s === stage ? 'current' : s === 'disputed' ? 'failed' : 'complete',
      at: formatDate(e.createdAt),
      note: e.note ?? undefined,
      actor: { id: e.actor, name: e.actor },
    });
  }
  return out;
}

function toPaymentInfo(order: Order): PaymentInfo {
  return {
    id: order.payment.id,
    status: order.payment.status,
    amount: order.payment.amount,
    processedAt: order.paidAt != null ? formatDate(order.paidAt) : undefined,
    failureReason: order.payment.failureCode ?? undefined,
  };
}

function toOrderSummary(order: Order, ix: number): OrderSummary {
  const item = order.items[ix]!;
  return {
    id: `${order.id}-${ix}`,
    number: order.number,
    href: `#/screens/seller/orders/${order.id}`,
    status: order.status,
    total: item.lineTotal,
    placedAt: formatDate(order.createdAt),
    itemCount: item.quantity,
    items: [{ id: item.listingId, title: item.title, imageUrl: item.coverUrl, quantity: item.quantity }],
    seller: { id: order.sellerId, name: order.sellerName },
  };
}

function toBuyerSummary(order: Order): BuyerSummary {
  return {
    id: order.buyerId,
    name: order.shippingAddress.recipient,
    memberSince: formatDate(order.createdAt),
    orderCount: 1,
    verified: true,
  };
}

/* -------------------------------------------------------------------- view */

export function SellerOrderDetail() {
  const { id } = useParams();
  const toast = useToast();

  const [order, setOrder] = useState<SellerOrder | null>(null);
  const [events, setEvents] = useState<EscrowEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ApiRequestError | null>(null);

  const [shipOpen, setShipOpen] = useState(false);
  const [carrier, setCarrier] = useState(CARRIERS[0]!.value);
  const [trackingNumber, setTrackingNumber] = useState('');
  const [busy, setBusy] = useState(false);

  const refetchEvents = useCallback(async (orderId: string) => {
    const res = await api.get<Collection<EscrowEvent>>(`/v1/orders/${orderId}/escrow-events`);
    setEvents(res.data);
  }, []);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const [o, ev] = await Promise.all([
        api.get<SellerOrder>(`/v1/seller/orders/${id}`),
        api.get<Collection<EscrowEvent>>(`/v1/orders/${id}/escrow-events`),
      ]);
      setOrder(o);
      setEvents(ev.data);
    } catch (e) {
      setError(e instanceof ApiRequestError ? e : new ApiRequestError(500, null));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  const ship = useCallback(async () => {
    if (!order) return;
    setBusy(true);
    try {
      const next = await api.post<SellerOrder>(`/v1/seller/orders/${order.id}/ship`, {
        carrier,
        trackingNumber: trackingNumber.trim(),
      });
      setOrder(next);
      await refetchEvents(next.id);
      setShipOpen(false);
      setTrackingNumber('');
      toast.show({
        tone: 'success',
        title: 'Marked as shipped',
        description: `Tracking ${next.tracking?.trackingNumber ?? ''} via ${next.tracking?.carrier ?? ''}.`,
      });
    } catch (e) {
      const code = e instanceof ApiRequestError ? e.body?.code : undefined;
      toast.show({
        tone: 'danger',
        title: 'Could not mark as shipped',
        description:
          code === 'state_conflict'
            ? 'This order changed. We refreshed its status.'
            : 'Please try again in a moment.',
      });
      await load();
    } finally {
      setBusy(false);
    }
  }, [order, carrier, trackingNumber, refetchEvents, load, toast]);

  const markDelivered = useCallback(async () => {
    if (!order) return;
    setBusy(true);
    try {
      const next = await api.post<SellerOrder>(`/v1/seller/orders/${order.id}/deliver`, {});
      setOrder(next);
      await refetchEvents(next.id);
      toast.show({
        tone: 'success',
        title: 'Marked as delivered',
        description: 'The buyer can now approve delivery to release your funds.',
      });
    } catch {
      toast.show({ tone: 'danger', title: 'Could not mark as delivered', description: 'Please try again.' });
      await load();
    } finally {
      setBusy(false);
    }
  }, [order, refetchEvents, load, toast]);

  /* -------------------------------------------------------------- render */

  if (error) {
    const code = error.status === 403 ? 403 : error.status === 404 ? 404 : 500;
    return (
      <div className="ks-screen">
        <FxErrorPage
          code={code}
          requestId={error.body?.requestId}
          actions={
            <Link to="/screens/seller/orders">
              <FxButton variant="secondary">Back to orders</FxButton>
            </Link>
          }
        />
      </div>
    );
  }

  if (loading || !order) {
    return (
      <div className="ks-screen">
        <FxSkeletonLoader shape="text" width="18rem" />
        <div className="sl-fulfil-cols">
          <div className="ks-stack" style={{ ['--ks-gap' as string]: 'var(--fx-space-4)' }}>
            <FxSkeletonLoader shape="rect" height="16rem" />
            <FxSkeletonLoader shape="rect" lines={5} />
          </div>
          <div className="ks-rail">
            <FxSkeletonLoader shape="rect" height="12rem" />
          </div>
        </div>
      </div>
    );
  }

  const stage = order.escrow.stage;
  const breadcrumb: BreadcrumbItem[] = [
    { label: 'Orders', href: '#/screens/seller/orders' },
    { label: `#${order.number}` },
  ];

  const addressItems: DescriptionListItem[] = [
    { term: 'Recipient', detail: order.shippingAddress.recipient },
    { term: 'Address', detail: order.shippingAddress.line1 },
    {
      term: 'City',
      detail: `${order.shippingAddress.postalCode} ${order.shippingAddress.city}, ${order.shippingAddress.countryCode}`,
    },
    { term: 'Phone', detail: order.shippingAddress.phone },
  ];

  const payoutItems: DescriptionListItem[] = [
    { term: 'Item total', detail: formatMoney(order.payoutPreview.gross) },
    { term: 'Platform fee', detail: `−${formatMoney(order.payoutPreview.fee)}` },
    { term: 'Net on release', detail: formatMoney(order.payoutPreview.net) },
  ];

  const timelineEvents = toTimelineEvents(events, stage);

  return (
    <div className="ks-screen">
      <FxBreadcrumb items={breadcrumb} />

      <div className="ks-row ks-row-between">
        <div className="ks-stack" style={{ ['--ks-gap' as string]: 'var(--fx-space-1)' }}>
          <h1 className="ks-page-title">Order #{order.number}</h1>
          <span className="ks-muted">Placed {formatDate(order.createdAt)}</span>
        </div>
        <FxPaymentStatus payment={toPaymentInfo(order)} />
      </div>

      <div className="sl-fulfil-cols">
        {/* Left: escrow + fulfilment card + items. */}
        <div className="ks-stack" style={{ ['--ks-gap' as string]: 'var(--fx-space-6)' }}>
          <FxEscrowTimeline
            events={timelineEvents}
            stage={stage}
            amount={order.escrow.amount}
            perspective="seller"
            releaseNote="Funds release to your balance once the buyer approves delivery."
          />

          {/* Stage-gated fulfilment card (§2.10 interaction 1–5). */}
          <FxCard>
            <div className="ks-stack" style={{ ['--ks-gap' as string]: 'var(--fx-space-3)' }}>
              <h2 className="ks-page-title" style={{ fontSize: '1.1rem' }}>
                Fulfilment
              </h2>

              {stage === 'disputed' ? (
                <FxAlert
                  tone="danger"
                  title="This order is in dispute"
                  description="Release is blocked until the dispute is resolved. Respond with your evidence."
                  actions={
                    <Link to={`/screens/seller/orders/${order.id}`}>
                      <FxButton variant="secondary" size="sm">
                        Respond to dispute
                      </FxButton>
                    </Link>
                  }
                />
              ) : order.status === 'paid' ? (
                <>
                  <span className="ks-muted">
                    Payment is held in escrow. Ship the order, then mark it delivered.
                  </span>
                  <div className="ks-row" style={{ ['--ks-gap' as string]: 'var(--fx-space-3)' }}>
                    <FxButton variant="primary" onClick={() => setShipOpen(true)}>
                      Mark as shipped
                    </FxButton>
                  </div>
                </>
              ) : order.status === 'in_fulfilment' ? (
                <>
                  {order.tracking && (
                    <FxAlert
                      tone="info"
                      title="Shipped"
                      description={`Tracking ${order.tracking.trackingNumber} via ${order.tracking.carrier}.`}
                    />
                  )}
                  <div className="ks-row" style={{ ['--ks-gap' as string]: 'var(--fx-space-3)' }}>
                    <FxButton variant="primary" onClick={markDelivered} loading={busy}>
                      Mark as delivered
                    </FxButton>
                  </div>
                </>
              ) : stage === 'delivered' ? (
                <FxAlert
                  tone="info"
                  title="Delivered — awaiting buyer approval"
                  description={
                    order.escrow.autoReleaseAt
                      ? `Funds auto-release on ${formatDate(order.escrow.autoReleaseAt)} if the buyer takes no action.`
                      : 'The buyer can approve delivery to release your funds.'
                  }
                />
              ) : (
                <FxAlert
                  tone="success"
                  title="Funds released"
                  description="This order is complete and the payout is on its way to your balance."
                  actions={
                    <Link to="/screens/seller/earnings">
                      <FxButton variant="secondary" size="sm">
                        View earnings
                      </FxButton>
                    </Link>
                  }
                />
              )}
            </div>
          </FxCard>

          {/* Items (§2.10 Items). */}
          <div className="ks-stack" style={{ ['--ks-gap' as string]: 'var(--fx-space-3)' }}>
            {order.items.map((_, ix) => (
              <FxOrderCard key={ix} order={toOrderSummary(order, ix)} perspective="seller" />
            ))}
          </div>
        </div>

        {/* Right rail: buyer, payout preview, address. */}
        <div className="ks-rail">
          <FxBuyerCard
            buyer={toBuyerSummary(order)}
            actions={
              <FxButton variant="ghost" size="sm" disabled>
                Message buyer
              </FxButton>
            }
          />
          <FxCard>
            <div className="ks-stack" style={{ ['--ks-gap' as string]: 'var(--fx-space-3)' }}>
              <h2 className="ks-page-title" style={{ fontSize: '1rem' }}>
                Payout preview
              </h2>
              <FxDescriptionList items={payoutItems} layout="horizontal" divided />
            </div>
          </FxCard>
          <FxCard>
            <div className="ks-stack" style={{ ['--ks-gap' as string]: 'var(--fx-space-3)' }}>
              <h2 className="ks-page-title" style={{ fontSize: '1rem' }}>
                Shipping address
              </h2>
              <FxDescriptionList items={addressItems} layout="horizontal" />
            </div>
          </FxCard>
        </div>
      </div>

      {/* Mark-as-shipped Dialog (carrier + tracking, §2.10 interaction 2). */}
      <FxDialog
        open={shipOpen}
        onOpenChange={setShipOpen}
        title="Mark as shipped"
        footer={
          <>
            <FxButton variant="secondary" onClick={() => setShipOpen(false)} disabled={busy}>
              Cancel
            </FxButton>
            <FxButton variant="primary" onClick={ship} loading={busy}>
              Confirm shipment
            </FxButton>
          </>
        }
      >
        <div className="ks-stack" style={{ ['--ks-gap' as string]: 'var(--fx-space-4)' }}>
          <FxFieldGroup label="Carrier">
            <FxSelect options={CARRIERS} value={carrier} onChange={(v) => setCarrier(v ?? CARRIERS[0]!.value)} />
          </FxFieldGroup>
          <FxFieldGroup label="Tracking number" help="Optional — we'll generate one if you leave it blank.">
            <FxInput
              value={trackingNumber}
              onChange={(v) => setTrackingNumber(v)}
              placeholder="e.g. FP4213"
            />
          </FxFieldGroup>
        </div>
      </FxDialog>
    </div>
  );
}
