/**
 * U11 Order Detail (buyer) reference screen with the Escrow Timeline
 * (doc 08 §2.5). Composes flexa-ui end to end against the MSW mock backend
 * (`flexa-ui-kit/mocks` via {@link ./api}): breadcrumb + header (Payment Status)
 * over two columns — the Escrow Timeline + stage-gated actions + items +
 * address + activity on the left, and a meta rail (Seller Card, totals,
 * Invoice Card, Shipping Timeline) on the right.
 *
 * The primary action is stage-dependent (§2.5 interaction 1): only a
 * `delivered` escrow exposes *Approve delivery* (a Confirmation Dialog →
 * `POST /approve` → the timeline reflects `released` after refetching events),
 * plus *Open a dispute* (a Dialog collecting a reason → `POST /disputes`).
 *
 * ZERO one-off component CSS: every visual is a flexa-ui component; layout is
 * the `ks-*` harness utilities in screens.css and inline `var(--fx-*)` tokens.
 *
 * NOTE ON TOAST: `useToast()` requires a mounted `<FxToastRegion>`, and the
 * kitchen-sink App does not mount one. To stay within this single file (App is
 * off-limits) the screen mounts its own region and calls `useToast()` from an
 * inner component rendered under it — see the report.
 */
import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  FxActivityTimeline,
  FxAlert,
  FxBreadcrumb,
  FxButton,
  FxConfirmationDialog,
  FxDescriptionList,
  FxDialog,
  FxErrorPage,
  FxEscrowTimeline,
  FxFieldGroup,
  FxInvoiceCard,
  FxOrderCard,
  FxPaymentStatus,
  FxRadioGroup,
  FxSellerCard,
  FxShippingTimeline,
  FxSkeletonLoader,
  FxTextarea,
  useToast,
  type ActivityItem as TimelineActivityItem,
  type BreadcrumbItem,
  type DescriptionListItem,
  type EscrowEvent as TimelineEscrowEvent,
  type InvoiceSummary,
  type OrderSummary,
  type PaymentInfo,
  type RadioOption,
  type SellerSummary,
  type Shipment as TimelineShipment,
  type ShipmentStatus,
} from 'flexa-ui-kit';
import type {
  ActivityItem,
  Collection,
  EscrowEvent,
  EscrowStage,
  Money,
  Order,
  Shipment,
} from 'flexa-ui-kit/mocks';
import { api, ApiRequestError } from './api';

/* ------------------------------------------------------------------ helpers */

/** Money → `$xx.xx` (minor units in). Currency-agnostic display per the mock. */
function formatMoney(money: Money): string {
  return `$${(money.amount / 100).toFixed(2)}`;
}

/** ISO → a short readable date; timeline components take ISO/verbatim strings. */
function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/** Whole-day countdown to an ISO instant, floored at 0. */
function daysUntil(iso: string): number {
  const ms = new Date(iso).getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / 86_400_000));
}

/* --------- mock EscrowEvent → FxEscrowTimeline's EscrowEvent (§2.5) -------- */

/**
 * Map a mock escrow-event `type` onto the timeline's canonical `EscrowStage`.
 * `auto_release_scheduled` is policy metadata (it drives the countdown Alert,
 * not a stage node) and returns null so it is dropped from the timeline.
 */
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

/**
 * Project the ascending mock event log onto the timeline's per-stage events.
 * Every recorded stage reads `complete`; the component itself promotes the
 * current stage and renders the remaining canonical stages as `upcoming`.
 * `disputed` (a terminal branch) is marked `failed` so it never reads success.
 */
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

/** mock PaymentIntent → FxPaymentStatus' PaymentInfo. */
function toPaymentInfo(order: Order): PaymentInfo {
  return {
    id: order.payment.id,
    status: order.payment.status,
    amount: order.payment.amount,
    // PaymentInfo.processedAt renders verbatim — format before passing.
    processedAt: order.paidAt != null ? formatDate(order.paidAt) : undefined,
    failureReason: order.payment.failureCode ?? undefined,
  };
}

/** mock Order line → FxOrderCard's single-line OrderSummary (buyer view). */
function toOrderSummary(order: Order, ix: number): OrderSummary {
  const item = order.items[ix]!;
  return {
    id: `${order.id}-${ix}`,
    number: order.number,
    href: `#/screens/orders/${order.id}`,
    status: order.status,
    total: item.lineTotal,
    placedAt: formatDate(order.createdAt),
    itemCount: item.quantity,
    items: [{ id: item.listingId, title: item.title, imageUrl: item.coverUrl, quantity: item.quantity }],
    seller: { id: order.sellerId, name: order.sellerName },
  };
}

/** mock Order → FxSellerCard's SellerSummary (only fields the mock carries). */
function toSellerSummary(order: Order): SellerSummary {
  return {
    id: order.sellerId,
    name: order.sellerName,
    href: `#/screens/orders/${order.id}`,
    verified: true,
    memberSince: formatDate(order.createdAt),
  };
}

/** mock Order → FxInvoiceCard's InvoiceSummary (order acts as the invoice). */
function toInvoiceSummary(order: Order): InvoiceSummary {
  return {
    id: order.id,
    number: order.number,
    status: order.status === 'completed' ? 'paid' : 'open',
    issuedAt: order.paidAt ?? order.createdAt,
    subtotal: order.subtotal,
    tax: { amount: 0, currency: order.total.currency },
    fees: order.fees,
    total: order.total,
    downloadUrl: `#/screens/orders/${order.id}`,
  };
}

/** mock Shipment → FxShippingTimeline's Shipment (carrier events). */
function toTimelineShipment(shipment: Shipment): TimelineShipment {
  const statusOf = (status: string): ShipmentStatus => {
    const s = status.toLowerCase();
    if (s.includes('deliver')) return 'delivered';
    if (s.includes('transit')) return 'in_transit';
    if (s.includes('out for')) return 'out_for_delivery';
    return 'label_created';
  };
  const events = shipment.events.map((e) => ({
    id: e.id,
    status: statusOf(e.status),
    description: e.status,
    location: e.location,
    at: formatDate(e.at),
  }));
  return {
    id: shipment.orderId,
    carrier: shipment.carrier,
    trackingNumber: shipment.trackingNumber,
    trackingUrl: shipment.trackingUrl,
    status: events[events.length - 1]?.status ?? 'label_created',
    events,
  };
}

/** mock ActivityItem → FxActivityTimeline's ActivityItem shape. */
function toActivityItems(items: ActivityItem[]): TimelineActivityItem[] {
  return items.map((it) => ({
    id: it.id,
    actor: { name: it.actor },
    verb: it.message,
    at: formatDate(it.createdAt),
  }));
}

/* --------------------------------------------------------- dispute reasons */

const DISPUTE_REASONS: RadioOption[] = [
  { value: 'not_as_described', label: 'Item not as described' },
  { value: 'not_received', label: 'Item not received' },
  { value: 'damaged', label: 'Arrived damaged' },
  { value: 'other', label: 'Other reason' },
];

/* -------------------------------------------------------------------- root */

/** Toasts flow through the app-wide `<FxToastRegion>` mounted in App. */
export function OrderDetail() {
  const { id } = useParams();
  const toast = useToast();

  const [order, setOrder] = useState<Order | null>(null);
  const [events, setEvents] = useState<EscrowEvent[]>([]);
  const [shipment, setShipment] = useState<Shipment | null>(null);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ApiRequestError | null>(null);

  const [approveOpen, setApproveOpen] = useState(false);
  const [disputeOpen, setDisputeOpen] = useState(false);
  const [disputeReason, setDisputeReason] = useState<string>(DISPUTE_REASONS[0]!.value);
  const [disputeNote, setDisputeNote] = useState('');
  const [disputeBusy, setDisputeBusy] = useState(false);

  /** Resolve the order id — explicit `:id`, else the flagship `delivered` order. */
  const resolveOrderId = useCallback(async (): Promise<string> => {
    if (id) return id;
    const list = await api.get<Collection<Order>>('/v1/orders');
    const delivered = list.data.find((o) => o.escrow.stage === 'delivered');
    const picked = delivered ?? list.data[0];
    if (!picked) throw new ApiRequestError(404, null);
    return picked.id;
  }, [id]);

  /** Re-pull the escrow event log (after approve / dispute mutations). */
  const refetchEvents = useCallback(async (orderId: string) => {
    const res = await api.get<Collection<EscrowEvent>>(`/v1/orders/${orderId}/escrow-events`);
    setEvents(res.data);
  }, []);

  useEffect(() => {
    let live = true;
    setLoading(true);
    setError(null);
    (async () => {
      try {
        const orderId = await resolveOrderId();
        const [o, ev] = await Promise.all([
          api.get<Order>(`/v1/orders/${orderId}`),
          api.get<Collection<EscrowEvent>>(`/v1/orders/${orderId}/escrow-events`),
        ]);
        if (!live) return;
        setOrder(o);
        setEvents(ev.data);
        setLoading(false);
        // Deferred meta — non-blocking; failures leave those regions empty.
        void api
          .get<Shipment>(`/v1/orders/${orderId}/shipment`)
          .then((s) => live && setShipment(s))
          .catch(() => {});
        void api
          .get<Collection<ActivityItem>>(`/v1/orders/${orderId}/activity`)
          .then((a) => live && setActivity(a.data))
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
  }, [resolveOrderId]);

  const approve = useCallback(async () => {
    if (!order) return;
    try {
      const next = await api.post<Order>(`/v1/orders/${order.id}/approve`, {}, `approve-${order.id}`);
      setOrder(next);
      await refetchEvents(next.id);
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
            ? 'This order is no longer awaiting your approval. We refreshed its status.'
            : 'Something went wrong. Please try again in a moment.',
      });
      // Resync so the UI reflects the true stage after a conflict.
      try {
        const fresh = await api.get<Order>(`/v1/orders/${order.id}`);
        setOrder(fresh);
        await refetchEvents(fresh.id);
      } catch {
        /* keep current view */
      }
      throw e; // keep the confirmation dialog's confirm button from resolving as success
    }
  }, [order, refetchEvents, toast]);

  const submitDispute = useCallback(async () => {
    if (!order) return;
    setDisputeBusy(true);
    try {
      const reason = disputeNote.trim()
        ? `${disputeReason}: ${disputeNote.trim()}`
        : disputeReason;
      await api.post('/v1/disputes', { orderId: order.id, reason });
      const [fresh] = await Promise.all([api.get<Order>(`/v1/orders/${order.id}`)]);
      setOrder(fresh);
      await refetchEvents(fresh.id);
      setDisputeOpen(false);
      setDisputeNote('');
      toast.show({
        tone: 'info',
        title: 'Dispute opened',
        description: 'We notified the seller. Track it from your dispute thread.',
      });
    } catch {
      toast.show({
        tone: 'danger',
        title: 'Could not open the dispute',
        description: 'Please try again in a moment.',
      });
    } finally {
      setDisputeBusy(false);
    }
  }, [order, disputeReason, disputeNote, refetchEvents, toast]);

  /* -------------------------------------------------------------- render */

  if (error) {
    const code = error.status === 403 ? 403 : error.status === 404 ? 404 : 500;
    return (
      <div className="ks-screen">
        <FxErrorPage
          code={code}
          requestId={error.body?.requestId}
          actions={
            <Link to="/screens/orders">
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
        <div className="ks-cols">
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
    { label: 'Orders', href: '#/screens/orders' },
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

  const totalsItems: DescriptionListItem[] = [
    { term: 'Subtotal', detail: formatMoney(order.subtotal) },
    { term: 'Fees', detail: formatMoney(order.fees) },
    { term: 'Total', detail: formatMoney(order.total) },
    { term: 'Payment', detail: `${order.payment.provider} · ${order.payment.status}` },
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

      <div className="ks-cols">
        {/* Left column: escrow + actions + items + address + activity. */}
        <div className="ks-stack" style={{ ['--ks-gap' as string]: 'var(--fx-space-6)' }}>
          <FxEscrowTimeline
            events={timelineEvents}
            stage={stage}
            amount={order.escrow.amount}
            perspective="buyer"
            releaseNote="Funds are held in escrow until you approve delivery."
          />

          {order.escrow.autoReleaseAt && (stage === 'delivered' || stage === 'approved') && (
            <FxAlert
              tone="info"
              title="Auto-approve scheduled"
              description={`Delivery auto-approves in ${daysUntil(order.escrow.autoReleaseAt)} days if you take no action.`}
            />
          )}

          {/* Stage-gated actions (§2.5 interaction 1). */}
          {stage === 'delivered' && (
            <div className="ks-row" style={{ ['--ks-gap' as string]: 'var(--fx-space-3)' }}>
              <FxButton variant="primary" onClick={() => setApproveOpen(true)}>
                Approve delivery
              </FxButton>
              <FxButton variant="ghost" onClick={() => setDisputeOpen(true)}>
                Open a dispute
              </FxButton>
            </div>
          )}

          {(stage === 'approved' || stage === 'released') && (
            <div className="ks-row">
              <span className="ks-muted">This order is complete.</span>
              {/* U13-B link-only edit (doc 15 §4): the review CTA points to the
                  buyer Reviews screen (write/manage), flow B4. */}
              <Link to="/screens/buyer/reviews">
                <FxButton variant="secondary" size="sm">
                  Leave a review
                </FxButton>
              </Link>
            </div>
          )}

          {stage === 'disputed' && (
            <FxAlert
              tone="warning"
              title="This order is in dispute"
              description="A dispute is open for this order. Track the conversation and evidence in the dispute thread."
              actions={
                <Link to={`/screens/orders/${order.id}`}>
                  <FxButton variant="secondary" size="sm">
                    View dispute
                  </FxButton>
                </Link>
              }
            />
          )}

          {/* Items — one Order Card per line (buyer perspective). */}
          <div className="ks-stack" style={{ ['--ks-gap' as string]: 'var(--fx-space-3)' }}>
            {order.items.map((_, ix) => (
              <FxOrderCard key={ix} order={toOrderSummary(order, ix)} perspective="buyer" />
            ))}
          </div>

          <section
            className="ks-stack"
            style={{ ['--ks-gap' as string]: 'var(--fx-space-3)' }}
            aria-label="Delivery address"
          >
            <h2 className="ks-page-title" style={{ fontSize: '1.1rem' }}>
              Delivery address
            </h2>
            <FxDescriptionList items={addressItems} layout="horizontal" />
          </section>

          <section
            className="ks-stack"
            style={{ ['--ks-gap' as string]: 'var(--fx-space-3)' }}
            aria-label="Order activity"
          >
            <h2 className="ks-page-title" style={{ fontSize: '1.1rem' }}>
              Activity
            </h2>
            <FxActivityTimeline items={toActivityItems(activity)} label="Order activity" />
          </section>
        </div>

        {/* Right rail: seller, totals, invoice, shipping. */}
        <div className="ks-rail">
          <FxSellerCard seller={toSellerSummary(order)} />
          <FxDescriptionList items={totalsItems} layout="horizontal" divided />
          <FxInvoiceCard
            invoice={toInvoiceSummary(order)}
            formatDate={formatDate}
            onDownload={() =>
              toast.show({
                tone: 'success',
                title: 'Invoice ready',
                description: `Invoice ${order.number} download started.`,
              })
            }
          />
          {shipment && shipment.events.length > 0 && (
            <FxShippingTimeline shipment={toTimelineShipment(shipment)} />
          )}
        </div>
      </div>

      {/* Approve-delivery confirmation (§2.5 interaction 2). */}
      <FxConfirmationDialog
        open={approveOpen}
        onOpenChange={setApproveOpen}
        tone="default"
        title="Approve delivery?"
        description="Funds will be released to the seller. This cannot be undone."
        confirmLabel="Approve & release"
        onConfirm={approve}
      />

      {/* Open-a-dispute reason collection (§2.5 interaction 4). */}
      <FxDialog
        open={disputeOpen}
        onOpenChange={(o) => setDisputeOpen(o)}
        title="Open a dispute"
        footer={
          <>
            <FxButton variant="secondary" onClick={() => setDisputeOpen(false)} disabled={disputeBusy}>
              Cancel
            </FxButton>
            <FxButton variant="primary" onClick={submitDispute} loading={disputeBusy}>
              Submit dispute
            </FxButton>
          </>
        }
      >
        <div className="ks-stack" style={{ ['--ks-gap' as string]: 'var(--fx-space-4)' }}>
          <FxFieldGroup label="What went wrong?">
            <FxRadioGroup
              options={DISPUTE_REASONS}
              value={disputeReason}
              onChange={(v) => setDisputeReason(v)}
            />
          </FxFieldGroup>
          <FxFieldGroup label="Add a note" help="Optional — describe the issue for the seller.">
            <FxTextarea
              value={disputeNote}
              onChange={(v) => setDisputeNote(v)}
              rows={3}
              placeholder="Tell us more…"
            />
          </FxFieldGroup>
        </div>
      </FxDialog>
    </div>
  );
}
