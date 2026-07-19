/**
 * U13-D Dispute Detail (doc 08 §2.13, flow A2) — decide the case. Composes
 * flexa-ui end to end against the MSW mock backend (`GET /v1/admin/disputes/:id`
 * → case + order snapshot; `POST /v1/admin/disputes/:id/resolve` → decision).
 *
 * Layout: a case header (Breadcrumb + status Badge + SLA Alert + Escrow
 * Timeline, admin perspective), a Split View of buyer vs. seller evidence
 * (statement + Media Grid), an order + escrow Description List, and a resolution
 * Card with three money-moving actions — Refund buyer / Release to seller /
 * Partial refund (Currency Input, validated 0 < x < total). A resolution is
 * terminal: it mutates the SHARED order's escrow + payment to a LEGAL final pair
 * (doc 07 §0.3) so the buyer's Order Detail reflects the outcome; an audit entry
 * is appended server-side. Every outcome requires a mandatory note and a
 * Confirmation Dialog restating the money movement.
 *
 * States trio (doc 15 §4): skeleton, Inline Error + retry, Empty State (a party
 * with no evidence shows an Empty State in its pane).
 *
 * ZERO one-off component CSS: framing is `ks-*` (shared) + this track's
 * admin.css; every visual is a flexa-ui component.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  FxAlert,
  FxBadge,
  FxBreadcrumb,
  FxButton,
  FxConfirmationDialog,
  FxCurrencyInput,
  FxDescriptionList,
  FxDialog,
  FxEmptyState,
  FxEscrowTimeline,
  FxFieldGroup,
  FxInlineError,
  FxMediaGrid,
  FxSkeletonLoader,
  FxSplitView,
  FxTextarea,
  useToast,
  type BreadcrumbItem,
  type DescriptionListItem,
  type EscrowEvent as TimelineEscrowEvent,
  type MediaItem as GridMediaItem,
  type Tone,
} from 'flexa-ui-kit';
import type {
  DisputeCase,
  DisputeEvidence,
  DisputeOutcome,
  Money,
  Order,
} from 'flexa-ui-kit/mocks';
import { api, ApiRequestError } from '../api';

interface DetailResponse {
  dispute: DisputeCase;
  order: Order;
}

function formatMoney(money: Money): string {
  return `$${(money.amount / 100).toFixed(2)}`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

function hoursUntil(iso: string): number {
  return Math.ceil((new Date(iso).getTime() - Date.now()) / 3_600_000);
}

const STATUS_TONE: Record<string, Tone> = {
  open: 'warning',
  seller_responded: 'info',
  under_review: 'info',
  resolved: 'success',
};

/** Build the admin-perspective escrow timeline from the order's stage. The
 * dispute is a terminal branch; a resolved order reads `released`. */
function timelineEvents(order: Order): TimelineEscrowEvent[] {
  const events: TimelineEscrowEvent[] = [
    { id: `${order.id}-held`, stage: 'payment_held', status: 'complete', at: order.paidAt ? formatDate(order.paidAt) : undefined },
  ];
  if (order.escrow.deliveredAt) {
    events.push({ id: `${order.id}-delivered`, stage: 'delivered', status: 'complete', at: formatDate(order.escrow.deliveredAt) });
  }
  if (order.escrow.stage === 'released') {
    events.push({ id: `${order.id}-released`, stage: 'released', status: 'current', at: order.escrow.releasedAt ? formatDate(order.escrow.releasedAt) : undefined });
  } else {
    events.push({ id: `${order.id}-disputed`, stage: 'disputed', status: 'current', note: 'In dispute' });
  }
  return events;
}

/** mock evidence → FxMediaGrid MediaItem. */
function toGridItems(evidence: DisputeEvidence[]): GridMediaItem[] {
  return evidence.map((e) => ({
    id: e.id,
    name: e.name,
    kind: e.kind === 'image' ? 'image' : 'file',
    url: e.url,
    thumbnailUrl: e.url,
    size: 0,
    createdAt: e.submittedAt,
  }));
}

export function DisputeDetail() {
  const { id } = useParams();
  const toast = useToast();
  const [data, setData] = useState<DetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ApiRequestError | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const [note, setNote] = useState('');
  const [partialOpen, setPartialOpen] = useState(false);
  const [partialAmount, setPartialAmount] = useState<Money | null>(null);
  const [confirm, setConfirm] = useState<DisputeOutcome | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      setData(await api.get<DetailResponse>(`/v1/admin/disputes/${id}`));
    } catch (e) {
      setError(e instanceof ApiRequestError ? e : new ApiRequestError(500, null));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load, reloadKey]);

  const resolve = useCallback(
    async (outcome: DisputeOutcome, refundAmount?: Money) => {
      if (!data) return;
      setBusy(true);
      try {
        const next = await api.post<DetailResponse>(
          `/v1/admin/disputes/${data.dispute.id}/resolve`,
          { outcome, refundAmount, note: note.trim() },
          `resolve-${data.dispute.id}`,
        );
        setData(next);
        setPartialOpen(false);
        toast.show({
          tone: 'success',
          title: 'Dispute resolved',
          description:
            outcome === 'refund'
              ? 'The buyer was refunded in full.'
              : outcome === 'release'
                ? 'Funds were released to the seller.'
                : 'A partial refund was issued; the remainder released to the seller.',
        });
      } catch (e) {
        const code = e instanceof ApiRequestError ? e.body?.code : undefined;
        toast.show({
          tone: 'danger',
          title: 'Could not resolve the dispute',
          description:
            code === 'already_resolved'
              ? 'This dispute was already resolved. We refreshed the case.'
              : code === 'validation_failed'
                ? (e instanceof ApiRequestError ? e.body?.message : undefined) ?? 'Check the amount and note.'
                : 'Please try again in a moment.',
        });
        await load();
        throw e; // keep the Confirmation Dialog from resolving as success
      } finally {
        setBusy(false);
      }
    },
    [data, note, toast, load],
  );

  const order = data?.order;
  const dispute = data?.dispute;
  const total = order?.total ?? null;

  const partialValid = useMemo(() => {
    if (!partialAmount || !total) return false;
    return partialAmount.amount > 0 && partialAmount.amount < total.amount;
  }, [partialAmount, total]);

  if (error) {
    return (
      <div className="ks-screen">
        <h1 className="ks-page-title">Dispute</h1>
        <FxInlineError
          message="Couldn't load this dispute."
          retryLabel="Retry"
          onRetry={() => setReloadKey((k) => k + 1)}
        />
      </div>
    );
  }

  if (loading || !data || !order || !dispute) {
    return (
      <div className="ks-screen">
        <FxSkeletonLoader shape="text" width="18rem" />
        <FxSkeletonLoader shape="rect" height="10rem" />
        <div className="ks-cols">
          <FxSkeletonLoader shape="rect" height="14rem" />
          <FxSkeletonLoader shape="rect" height="14rem" />
        </div>
      </div>
    );
  }

  const resolved = dispute.status === 'resolved';
  const breadcrumb: BreadcrumbItem[] = [
    { label: 'Disputes', href: '#/screens/admin/disputes' },
    { label: `#${order.number}` },
  ];
  const sla = hoursUntil(dispute.slaDueAt);

  const orderItems: DescriptionListItem[] = [
    { term: 'Order', detail: `#${order.number}` },
    { term: 'Buyer', detail: dispute.buyerName },
    { term: 'Seller', detail: dispute.sellerName },
    { term: 'Amount held', detail: formatMoney(dispute.amount) },
    { term: 'Payment', detail: `${order.payment.provider} · ${order.payment.status}` },
    { term: 'Escrow stage', detail: order.escrow.stage },
    ...(order.refundedTotal.amount > 0
      ? [{ term: 'Refunded', detail: formatMoney(order.refundedTotal) } as DescriptionListItem]
      : []),
  ];

  const evidencePane = (party: 'buyer' | 'seller') => {
    const statement = party === 'buyer' ? dispute.buyerStatement : dispute.sellerStatement;
    const evidence = party === 'buyer' ? dispute.buyerEvidence : dispute.sellerEvidence;
    return (
      <div className="ks-admin-evidence">
        <h2 className="ks-page-title" style={{ fontSize: '1.05rem' }}>
          {party === 'buyer' ? "Buyer's case" : "Seller's case"}
        </h2>
        {statement ? (
          <p className="ks-muted" style={{ margin: 0 }}>
            {statement}
          </p>
        ) : (
          <FxEmptyState title="No response submitted" description="This party has not responded yet." size="sm" />
        )}
        {evidence.length > 0 ? (
          <FxMediaGrid items={toGridItems(evidence)} columns={2} />
        ) : (
          <FxEmptyState title="No evidence submitted" size="sm" />
        )}
      </div>
    );
  };

  return (
    <div className="ks-screen">
      <FxBreadcrumb items={breadcrumb} />

      {/* Case header. */}
      <div className="ks-row ks-row-between">
        <div className="ks-stack" style={{ ['--ks-gap' as string]: 'var(--fx-space-1)' }}>
          <h1 className="ks-page-title">
            Dispute · Order #{order.number} · {formatMoney(dispute.amount)}
          </h1>
          <span className="ks-muted">
            {dispute.reason.replace(/_/g, ' ')} · opened {formatDate(dispute.openedAt)}
          </span>
        </div>
        <FxBadge tone={STATUS_TONE[dispute.status] ?? 'neutral'}>{dispute.status.replace(/_/g, ' ')}</FxBadge>
      </div>

      {!resolved && (
        <FxAlert
          tone={sla < 0 ? 'danger' : 'info'}
          title={sla < 0 ? 'SLA breached' : 'SLA countdown'}
          description={sla < 0 ? `${-sla}h overdue for a first decision.` : `${sla}h left to decide.`}
        />
      )}

      <FxEscrowTimeline
        events={timelineEvents(order)}
        stage={order.escrow.stage}
        amount={dispute.amount}
        perspective="admin"
        disputed={order.escrow.stage === 'disputed'}
      />

      {/* Evidence split view. */}
      <FxSplitView list={evidencePane('buyer')} detail={evidencePane('seller')} defaultListWidth={520} />

      {/* Order + escrow summary. */}
      <section className="ks-stack" style={{ ['--ks-gap' as string]: 'var(--fx-space-3)' }} aria-label="Order & escrow">
        <h2 className="ks-page-title" style={{ fontSize: '1.1rem' }}>
          Order & escrow
        </h2>
        <FxDescriptionList items={orderItems} layout="horizontal" divided />
      </section>

      {/* Resolution. */}
      <section className="ks-stack" style={{ ['--ks-gap' as string]: 'var(--fx-space-4)' }} aria-label="Resolution">
        <h2 className="ks-page-title" style={{ fontSize: '1.1rem' }}>
          Resolution
        </h2>
        {resolved && dispute.resolution ? (
          <FxDescriptionList
            items={[
              { term: 'Outcome', detail: <FxBadge tone="success">{dispute.resolution.outcome}</FxBadge> },
              ...(dispute.resolution.refundAmount
                ? [{ term: 'Refunded to buyer', detail: formatMoney(dispute.resolution.refundAmount) } as DescriptionListItem]
                : []),
              ...(dispute.resolution.releaseAmount
                ? [{ term: 'Released to seller', detail: formatMoney(dispute.resolution.releaseAmount) } as DescriptionListItem]
                : []),
              { term: 'Rationale', detail: dispute.resolution.note, span: 2 },
              ...(dispute.resolvedAt ? [{ term: 'Resolved', detail: formatDate(dispute.resolvedAt) } as DescriptionListItem] : []),
            ]}
            layout="horizontal"
            divided
          />
        ) : (
          <>
            <FxFieldGroup label="Rationale" help="Required — visible to both parties.">
              <FxTextarea
                value={note}
                onChange={(v) => setNote(v)}
                rows={3}
                placeholder="Explain your decision…"
              />
            </FxFieldGroup>
            <div className="ks-row" style={{ ['--ks-gap' as string]: 'var(--fx-space-3)' }}>
              <FxButton variant="primary" disabled={!note.trim() || busy} onClick={() => setConfirm('refund')}>
                Refund buyer
              </FxButton>
              <FxButton variant="secondary" disabled={!note.trim() || busy} onClick={() => setConfirm('release')}>
                Release to seller
              </FxButton>
              <FxButton variant="ghost" disabled={!note.trim() || busy} onClick={() => setPartialOpen(true)}>
                Partial refund…
              </FxButton>
            </div>
          </>
        )}
      </section>

      {resolved && (
        <Link to={`/screens/orders/${order.id}`}>
          <FxButton variant="secondary" size="sm">
            View the buyer's order
          </FxButton>
        </Link>
      )}

      {/* Full refund / release confirmation. */}
      <FxConfirmationDialog
        open={confirm === 'refund' || confirm === 'release'}
        onOpenChange={(o) => !o && setConfirm(null)}
        tone={confirm === 'refund' ? 'danger' : 'default'}
        title={confirm === 'refund' ? 'Refund the buyer in full?' : 'Release funds to the seller?'}
        description={
          confirm === 'refund'
            ? `${formatMoney(dispute.amount)} will be refunded to ${dispute.buyerName}. This is final.`
            : `${formatMoney(dispute.amount)} will be released to ${dispute.sellerName}. This is final.`
        }
        confirmLabel={confirm === 'refund' ? 'Refund buyer' : 'Release funds'}
        onConfirm={async () => {
          // Capture the outcome before the dialog closes itself on success; the
          // dialog keeps open + shows the error via the toast if resolve throws.
          const outcome = confirm!;
          await resolve(outcome);
        }}
      />

      {/* Partial refund dialog with split preview. */}
      <FxDialog
        open={partialOpen}
        onOpenChange={(o) => setPartialOpen(o)}
        title="Partial refund"
        footer={
          <>
            <FxButton variant="secondary" onClick={() => setPartialOpen(false)} disabled={busy}>
              Cancel
            </FxButton>
            <FxButton
              variant="primary"
              disabled={!partialValid}
              loading={busy}
              onClick={() => {
                if (partialAmount) void resolve('partial', partialAmount).catch(() => {});
              }}
            >
              Issue partial refund
            </FxButton>
          </>
        }
      >
        <div className="ks-stack" style={{ ['--ks-gap' as string]: 'var(--fx-space-4)' }}>
          <p className="ks-muted" style={{ margin: 0 }}>
            Refund part of the order to the buyer; the remainder is released to the seller.
          </p>
          <FxFieldGroup label="Refund amount" help={`Between $0.01 and ${formatMoney(dispute.amount)}.`}>
            <FxCurrencyInput
              currency={dispute.amount.currency}
              value={partialAmount}
              onChange={(v) => setPartialAmount(v)}
              invalid={partialAmount != null && !partialValid}
            />
          </FxFieldGroup>
          {partialValid && total && partialAmount && (
            <FxDescriptionList
              items={[
                { term: 'Buyer gets', detail: formatMoney(partialAmount) },
                { term: 'Seller gets', detail: formatMoney({ amount: total.amount - partialAmount.amount, currency: total.currency }) },
              ]}
              layout="horizontal"
              divided
            />
          )}
        </div>
      </FxDialog>
    </div>
  );
}
