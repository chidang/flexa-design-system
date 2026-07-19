/**
 * U13-D Disputes Queue (doc 08 §2.12) — triage disputes by urgency. Composes
 * flexa-ui end to end against the MSW mock backend (`GET /v1/admin/disputes`):
 * a Metric Card KPI row, a Data Management Toolbar (search + density + count),
 * and a sortable Table. Rows come from the SHARED `db.orders` at escrow stage
 * `disputed` — including a dispute the buyer opens at runtime (their POST
 * /disputes flips an order to `disputed`), which surfaces here without a
 * fixture. Default sort is SLA time-remaining ascending (most urgent first);
 * overdue rows carry a danger Badge. Row click → Dispute Detail.
 *
 * States trio (doc 15 §4): skeleton, Inline Error + retry, Empty State.
 *
 * ZERO one-off component CSS: framing is `ks-*` (shared) + this track's
 * admin.css; every visual is a flexa-ui component.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FxBadge,
  FxDataManagementToolbar,
  FxEmptyState,
  FxInlineError,
  FxMetricCard,
  FxTable,
  type Density,
  type TableColumn,
  type Tone,
} from 'flexa-ui-kit';
import type { Money } from 'flexa-ui-kit/mocks';
import { api, ApiRequestError } from '../api';

interface DisputeRow {
  id: string;
  orderId: string;
  orderNumber: string;
  buyerName: string;
  sellerName: string;
  reason: string;
  status: string;
  amount: Money;
  slaDueAt: string;
  openedAt: string;
  hasCase: boolean;
}

interface DisputesResponse {
  data: DisputeRow[];
  metrics: { open: number; awaitingSeller: number; slaOverdue: number; resolved: number };
}

function formatMoney(money: Money): string {
  return `$${(money.amount / 100).toFixed(2)}`;
}

const STATUS_TONE: Record<string, Tone> = {
  open: 'warning',
  seller_responded: 'info',
  under_review: 'info',
  resolved: 'success',
};

/** Whole-hour countdown to an ISO instant; negative when overdue. */
function hoursUntil(iso: string): number {
  return Math.ceil((new Date(iso).getTime() - Date.now()) / 3_600_000);
}

/** Human SLA phrase — "12h left" or "6h overdue". */
function slaLabel(iso: string): { text: string; overdue: boolean } {
  const h = hoursUntil(iso);
  return h < 0 ? { text: `${-h}h overdue`, overdue: true } : { text: `${h}h left`, overdue: false };
}

export function DisputesQueue() {
  const navigate = useNavigate();
  const [res, setRes] = useState<DisputesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ApiRequestError | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [search, setSearch] = useState('');
  const [density, setDensity] = useState<Density>('comfortable');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setRes(await api.get<DisputesResponse>('/v1/admin/disputes'));
    } catch (e) {
      setError(e instanceof ApiRequestError ? e : new ApiRequestError(500, null));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load, reloadKey]);

  const rows = useMemo(() => {
    const all = res?.data ?? [];
    const q = search.trim().toLowerCase();
    const matched = !q
      ? all
      : all.filter(
          (r) =>
            r.orderNumber.toLowerCase().includes(q) ||
            r.buyerName.toLowerCase().includes(q) ||
            r.sellerName.toLowerCase().includes(q),
        );
    // Priority sort: SLA time-remaining ascending (most urgent / overdue first).
    return [...matched].sort((a, b) => new Date(a.slaDueAt).getTime() - new Date(b.slaDueAt).getTime());
  }, [res, search]);

  const columns: TableColumn<DisputeRow>[] = [
    { key: 'orderNumber', header: 'Order', render: (r) => `#${r.orderNumber}` },
    { key: 'buyerName', header: 'Buyer', render: (r) => r.buyerName },
    { key: 'sellerName', header: 'Seller', render: (r) => r.sellerName },
    { key: 'reason', header: 'Reason', render: (r) => r.reason.replace(/_/g, ' ') },
    { key: 'amount', header: 'Amount', align: 'end', render: (r) => formatMoney(r.amount) },
    {
      key: 'slaDueAt',
      header: 'SLA',
      render: (r) => {
        const sla = slaLabel(r.slaDueAt);
        return (
          <FxBadge tone={sla.overdue ? 'danger' : 'neutral'} appearance="subtle">
            {sla.text}
          </FxBadge>
        );
      },
    },
    {
      key: 'status',
      header: 'Status',
      render: (r) => (
        <FxBadge tone={STATUS_TONE[r.status] ?? 'neutral'} appearance="subtle">
          {r.status.replace(/_/g, ' ')}
        </FxBadge>
      ),
    },
  ];

  if (error) {
    return (
      <div className="ks-screen">
        <h1 className="ks-page-title">Disputes Queue</h1>
        <FxInlineError message="Couldn't load disputes." retryLabel="Retry" onRetry={() => setReloadKey((k) => k + 1)} />
      </div>
    );
  }

  const m = res?.metrics;
  return (
    <div className="ks-screen">
      <h1 className="ks-page-title">Disputes Queue</h1>

      <div className="ks-admin-stats">
        {loading || !m ? (
          <>
            <FxMetricCard label="Open" value="" loading />
            <FxMetricCard label="Awaiting seller" value="" loading />
            <FxMetricCard label="SLA overdue" value="" loading />
            <FxMetricCard label="Resolved" value="" loading />
          </>
        ) : (
          <>
            <FxMetricCard label="Open" value={m.open} />
            <FxMetricCard label="Awaiting seller" value={m.awaitingSeller} />
            <FxMetricCard label="SLA overdue" value={m.slaOverdue} caption="Past first-decision deadline" />
            <FxMetricCard label="Resolved" value={m.resolved} caption="This session" />
          </>
        )}
      </div>

      <FxDataManagementToolbar
        search={search}
        onSearch={setSearch}
        searchPlaceholder="Search order, buyer or seller…"
        density={density}
        onDensityChange={setDensity}
        onRefresh={() => setReloadKey((k) => k + 1)}
        resultCount={rows.length}
      />

      <FxTable
        columns={columns}
        rows={rows}
        rowKey={(r) => r.id}
        density={density}
        onRowClick={(r) => navigate(`/screens/admin/disputes/${r.id}`)}
        rowLabel={(r) => `Dispute for order ${r.orderNumber}`}
        caption="Open disputes, most urgent first"
        loading={loading}
        skeletonRows={5}
        emptyState={<FxEmptyState title="No open disputes 🎉" description="Every dispute has been resolved." />}
      />
    </div>
  );
}
