/**
 * U13-D Listings Moderation (doc 08 §2.14, flow A1) — keep the catalog clean.
 * Composes flexa-ui end to end against the MSW mock backend: a Data Management
 * Toolbar (search + density + result count + Pending/All view tabs, G5) over a
 * queue Table of listings from the SHARED `moderation.ts` store (the seller
 * track submits into it; this track consumes it). Selecting a row opens it for
 * review and exposes the Approve-Reject Panel (reject requires a reason); each
 * decision appends an audit entry server-side. J/K (and the Split View's
 * Previous/Next pair, G6) walk the queue without leaving the review pane.
 *
 * States trio (doc 15 §4): skeleton while loading, Inline Error + retry on
 * failure, Empty State when the queue is clear.
 *
 * ZERO one-off component CSS: page framing is `ks-*` (shared) + this track's
 * admin.css; every visual is a flexa-ui component.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  FxApproveRejectPanel,
  FxBadge,
  FxDataManagementToolbar,
  FxDescriptionList,
  FxEmptyState,
  FxFieldGroup,
  FxInlineError,
  FxSelect,
  FxSkeletonLoader,
  FxSplitView,
  FxTable,
  FxTabs,
  FxTag,
  useToast,
  type Density,
  type OptionItem,
  type TabItem,
  type TableColumn,
  type Tone,
} from 'flexa-ui-kit';
import type { Collection, Money, PendingListing } from 'flexa-ui-kit/mocks';
import { LISTING_REJECT_REASONS } from 'flexa-ui-kit/mocks';
import { api, ApiRequestError } from '../api';

interface QueueResponse extends Collection<PendingListing> {
  counts: { pending: number; all: number };
}

function formatMoney(money: Money): string {
  return `$${(money.amount / 100).toFixed(2)}`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

/** Moderation status → Badge tone. */
const STATUS_TONE: Record<PendingListing['status'], Tone> = {
  pending: 'warning',
  approved: 'success',
  rejected: 'danger',
};

const REASON_OPTIONS: OptionItem[] = LISTING_REJECT_REASONS.map((r) => ({ value: r.value, label: r.label }));

export function ListingsModeration() {
  const toast = useToast();
  const [rows, setRows] = useState<PendingListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ApiRequestError | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const [search, setSearch] = useState('');
  const [density, setDensity] = useState<Density>('comfortable');
  // View-scoping tabs (G5): the shared fixtures carry no review reports, so the
  // queue renders the views the mock supports — Pending / All.
  const [view, setView] = useState<'pending' | 'all'>('pending');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [reasonCode, setReasonCode] = useState<string>(REASON_OPTIONS[0]!.value);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<QueueResponse>('/v1/admin/moderation-queue');
      setRows(res.data);
    } catch (e) {
      setError(e instanceof ApiRequestError ? e : new ApiRequestError(500, null));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let live = true;
    void (async () => {
      await load();
      if (!live) return;
    })();
    return () => {
      live = false;
    };
  }, [load, reloadKey]);

  const pending = useMemo(() => rows.filter((r) => r.status === 'pending'), [rows]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const scoped = view === 'pending' ? rows.filter((r) => r.status === 'pending') : rows;
    if (!q) return scoped;
    return scoped.filter(
      (r) => r.title.toLowerCase().includes(q) || r.sellerName.toLowerCase().includes(q),
    );
  }, [rows, search, view]);

  const selected = useMemo(() => rows.find((r) => r.id === selectedId) ?? null, [rows, selectedId]);

  // Queue-walk (G6): J/K + the Split View's Previous/Next pair step the
  // selection through the visible queue; a handler is absent at each edge.
  const selectedIndex = useMemo(
    () => (selectedId ? filtered.findIndex((r) => r.id === selectedId) : -1),
    [filtered, selectedId],
  );
  const queuePrev =
    selectedIndex > 0 ? () => setSelectedId(filtered[selectedIndex - 1]!.id) : undefined;
  const queueNext =
    filtered.length > 0 && selectedIndex < filtered.length - 1
      ? () => setSelectedId(filtered[selectedIndex + 1]!.id)
      : undefined;

  const decide = useCallback(
    async (action: 'approve' | 'reject', reason?: string) => {
      if (!selected) return;
      setBusy(true);
      try {
        if (action === 'approve') {
          await api.post(`/v1/admin/listings/${selected.id}/approve`);
          toast.show({ tone: 'success', title: 'Listing approved', description: `${selected.title} is now live.` });
        } else {
          await api.post(`/v1/admin/listings/${selected.id}/reject`, { reasonCode, note: reason ?? '' });
          toast.show({ tone: 'info', title: 'Listing rejected', description: `The seller was notified with your reason.` });
        }
        setSelectedId(null);
        await load();
      } catch (e) {
        const code = e instanceof ApiRequestError ? e.body?.code : undefined;
        toast.show({
          tone: 'danger',
          title: 'Could not save your decision',
          description:
            code === 'state_conflict'
              ? 'This listing was already moderated. We refreshed the queue.'
              : 'Please try again in a moment.',
        });
        await load();
      } finally {
        setBusy(false);
      }
    },
    [selected, reasonCode, toast, load],
  );

  const columns: TableColumn<PendingListing>[] = [
    {
      key: 'title',
      header: 'Listing',
      render: (r) => (
        <div className="ks-row" style={{ ['--ks-gap' as string]: 'var(--fx-space-3)' }}>
          <img
            src={r.coverUrl}
            alt=""
            width={48}
            height={36}
            style={{ borderRadius: 'var(--fx-radius-sm)', objectFit: 'cover' }}
          />
          <strong>{r.title}</strong>
        </div>
      ),
    },
    { key: 'sellerName', header: 'Seller', render: (r) => r.sellerName },
    { key: 'price', header: 'Price', align: 'end', render: (r) => formatMoney(r.price) },
    { key: 'submittedAt', header: 'Submitted', sortable: true, render: (r) => formatDate(r.submittedAt) },
    {
      key: 'status',
      header: 'Status',
      render: (r) => (
        <FxBadge tone={STATUS_TONE[r.status]} appearance="subtle">
          {r.status}
        </FxBadge>
      ),
    },
  ];

  if (error) {
    return (
      <div className="ks-screen">
        <h1 className="ks-page-title">Listings Moderation</h1>
        <FxInlineError
          message="Couldn't load the moderation queue."
          retryLabel="Retry"
          onRetry={() => setReloadKey((k) => k + 1)}
        />
      </div>
    );
  }

  // Toolbar tabs slot (G5) — Pending / All view tabs; the table below is the
  // effective panel, so the items carry no panel content.
  const viewTabs: TabItem[] = [
    { id: 'pending', label: 'Pending', badge: pending.length, content: null },
    { id: 'all', label: 'All', badge: rows.length, content: null },
  ];

  const queueTable = (
    <div className="ks-stack">
      <FxDataManagementToolbar
        search={search}
        onSearch={setSearch}
        searchPlaceholder="Search title or seller…"
        density={density}
        onDensityChange={setDensity}
        onRefresh={() => setReloadKey((k) => k + 1)}
        resultCount={filtered.length}
        tabs={
          <FxTabs
            items={viewTabs}
            value={view}
            onChange={(id) => setView(id as 'pending' | 'all')}
          />
        }
      />
      <FxTable
        columns={columns}
        rows={filtered}
        rowKey={(r) => r.id}
        density={density}
        selectable="single"
        selectedKeys={selectedId ? [selectedId] : []}
        onSelectionChange={(keys) => setSelectedId(keys.length ? String(keys[0]) : null)}
        onRowClick={(r) => setSelectedId(r.id)}
        rowLabel={(r) => r.title}
        caption="Listings pending moderation"
        loading={loading}
        skeletonRows={6}
        emptyState={
          pending.length === 0 && !loading ? (
            <FxEmptyState title="Moderation queue is clear 🎉" description="No listings are waiting for review." />
          ) : (
            <FxEmptyState title="No listings match your search" description="Try a different title or seller." />
          )
        }
      />
    </div>
  );

  const reviewPane = selected ? (
    <div className="ks-admin-evidence">
      <h2 className="ks-page-title" style={{ fontSize: '1.1rem' }}>
        {selected.title}
      </h2>
      <img
        src={selected.coverUrl}
        alt={`${selected.title} cover`}
        style={{ width: '100%', borderRadius: 'var(--fx-radius-md)', objectFit: 'cover' }}
      />
      <FxDescriptionList
        items={[
          { term: 'Seller', detail: selected.sellerName },
          { term: 'Price', detail: formatMoney(selected.price) },
          { term: 'Category', detail: <FxTag>{selected.categoryId}</FxTag> },
          { term: 'Submitted', detail: formatDate(selected.submittedAt) },
          { term: 'Status', detail: <FxBadge tone={STATUS_TONE[selected.status]}>{selected.status}</FxBadge> },
          { term: 'Description', detail: selected.description, span: 2 },
        ]}
        layout="horizontal"
        divided
      />
      {selected.status === 'pending' ? (
        <>
          <FxFieldGroup label="Reject reason (required if rejecting)">
            <FxSelect
              options={REASON_OPTIONS}
              value={reasonCode}
              onChange={(v) => setReasonCode(v ?? REASON_OPTIONS[0]!.value)}
            />
          </FxFieldGroup>
          <FxApproveRejectPanel
            summary={`Decide on "${selected.title}"`}
            requireRejectReason
            busy={busy}
            approveLabel="Approve listing"
            rejectLabel="Reject listing"
            onApprove={() => decide('approve')}
            onReject={(reason) => decide('reject', reason)}
          />
        </>
      ) : selected.status === 'rejected' ? (
        <FxDescriptionList items={[{ term: 'Rejection reason', detail: selected.rejectReason ?? '—', span: 2 }]} />
      ) : (
        <FxBadge tone="success">Approved — now live</FxBadge>
      )}
    </div>
  ) : (
    <div className="ks-admin-evidence">
      <FxEmptyState
        title="Select a listing to review"
        description="Pick a row to see its full details and approve or reject it."
      />
    </div>
  );

  return (
    <div className="ks-screen">
      <div className="ks-row ks-row-between">
        <h1 className="ks-page-title">Listings Moderation</h1>
        <FxBadge tone={pending.length > 0 ? 'warning' : 'neutral'} count={pending.length}>
          pending
        </FxBadge>
      </div>
      {loading && rows.length === 0 ? (
        <FxSkeletonLoader shape="rect" height="20rem" />
      ) : (
        <FxSplitView
          list={queueTable}
          detail={reviewPane}
          defaultListWidth={560}
          onQueuePrev={queuePrev}
          onQueueNext={queueNext}
          queueNavLabel="Moderation queue"
        />
      )}
    </div>
  );
}
