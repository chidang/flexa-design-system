/**
 * U13-C Listings — seller list (doc 08 §3.12). Owner Listing Cards with a
 * moderation-status Badge and `updatedAt`, grouped by status Tabs (the U11
 * ListingCard status/updatedAt gap is now the feature). Composes flexa-ui end to
 * end against the mock backend (`flexa-ui-kit/mocks` via {@link ../api}).
 *
 * A Data Management Toolbar drives the search; the status Tabs carry count
 * Badges; each tab filters `GET /v1/seller/listings?status=`. Rejected rows show
 * the moderation feedback note inline so the resubmit loop (flow S2 step 6') is
 * legible. Row actions route to the editor / a mock toast.
 *
 * ZERO one-off component CSS: framing is `ks-*` utilities; every visual is a
 * flexa-ui component.
 */
import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FxAlert,
  FxBlankStateLayout,
  FxButton,
  FxDataManagementToolbar,
  FxEmptyState,
  FxInlineError,
  FxListingCard,
  FxSkeletonLoader,
  FxTabs,
  useToast,
  type ListingSummary,
  type TabItem,
} from 'flexa-ui-kit';
import type { Collection, Money } from 'flexa-ui-kit/mocks';
import { api, ApiRequestError } from '../api';

/* ------------------------------------------------------------------ shapes */

type SellerListingStatus = 'active' | 'draft' | 'pending_review' | 'rejected' | 'archived';

interface SellerListingRow {
  id: string;
  title: string;
  price: Money;
  coverUrl: string;
  imageAlt: string;
  stock: number;
  status: SellerListingStatus;
  moderationNote: string | null;
  views: number;
  updatedAt: string;
}

interface ListingsResponse extends Collection<SellerListingRow> {
  counts: Record<SellerListingStatus, number>;
}

/* --------------------------------------------------------------- tab config */

const TAB_ORDER: { id: SellerListingStatus; label: string }[] = [
  { id: 'active', label: 'Active' },
  { id: 'draft', label: 'Draft' },
  { id: 'pending_review', label: 'Pending review' },
  { id: 'rejected', label: 'Rejected' },
  { id: 'archived', label: 'Archived' },
];

/** Row → FxListingCard's ListingSummary (owner mode). */
function toSummary(row: SellerListingRow): ListingSummary {
  return {
    id: row.id,
    title: row.title,
    href: `#/screens/seller/listings/${row.id}/edit`,
    imageUrl: row.coverUrl,
    imageAlt: row.imageAlt,
    price: row.price,
    status: row.status,
    views: row.views,
    updatedAt: row.updatedAt,
  };
}

/* -------------------------------------------------------------------- view */

export function SellerListings() {
  const navigate = useNavigate();
  const toast = useToast();

  const [rows, setRows] = useState<SellerListingRow[] | null>(null);
  const [counts, setCounts] = useState<Record<SellerListingStatus, number> | null>(null);
  const [status, setStatus] = useState<SellerListingStatus>('active');
  const [query, setQuery] = useState('');
  const [error, setError] = useState<ApiRequestError | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let live = true;
    setRows(null);
    setError(null);
    const params = new URLSearchParams({ status });
    if (query.trim()) params.set('q', query.trim());
    void api
      .get<ListingsResponse>(`/v1/seller/listings?${params.toString()}`)
      .then((res) => {
        if (!live) return;
        setRows(res.data);
        setCounts(res.counts);
      })
      .catch((e) => live && setError(e instanceof ApiRequestError ? e : new ApiRequestError(500, null)));
    return () => {
      live = false;
    };
  }, [status, query, reloadKey]);

  const onAction = useCallback(
    (listingId: string, actionId: string) => {
      if (actionId === 'edit') {
        navigate(`/screens/seller/listings/${listingId}/edit`);
        return;
      }
      toast.show({
        tone: 'info',
        title: actionId === 'delete' ? 'Listing deleted' : 'Listing updated',
        description: 'This is a mock action — no data leaves the browser.',
      });
    },
    [navigate, toast],
  );

  const grid = (body: React.ReactNode) => (
    <div className="ks-stack" style={{ ['--ks-gap' as string]: 'var(--fx-space-4)' }}>
      {status === 'rejected' && rows && rows.length > 0 && (
        <FxAlert
          tone="warning"
          title="Some listings were rejected"
          description="Open a rejected listing to see the reviewer's note, fix it, then resubmit for review."
        />
      )}
      {body}
    </div>
  );

  const tabBody = (() => {
    if (error) {
      return (
        <FxInlineError
          message="We couldn't load your listings."
          detail={error.body?.requestId}
          onRetry={() => setReloadKey((k) => k + 1)}
        />
      );
    }
    if (!rows) {
      return (
        <div className="ks-grid-cards">
          {Array.from({ length: 6 }, (_, i) => (
            <FxSkeletonLoader key={i} shape="rect" height="16rem" />
          ))}
        </div>
      );
    }
    if (rows.length === 0) {
      // First-use empty for the primary Active tab, filtered-empty otherwise.
      if (status === 'active' && !query.trim()) {
        return (
          <FxBlankStateLayout
            title="Create your first listing"
            description="List an item to start selling. You can save a draft and come back any time."
            icon="package"
            actions={
              <Link to="/screens/seller/listings/new">
                <FxButton variant="primary">+ New listing</FxButton>
              </Link>
            }
          />
        );
      }
      return (
        <FxEmptyState
          title={query.trim() ? 'No listings match your search' : 'Nothing here yet'}
          description={
            query.trim()
              ? 'Try a different search term or clear the filter.'
              : 'Listings in this status will appear here.'
          }
          icon="search"
        />
      );
    }
    return (
      <div className="ks-stack" style={{ ['--ks-gap' as string]: 'var(--fx-space-4)' }}>
        <div className="ks-grid-cards">
          {rows.map((row) => (
            <FxListingCard
              key={row.id}
              listing={toSummary(row)}
              mode="owner"
              onAction={onAction}
              showRating={false}
            />
          ))}
        </div>
        {/* Rejected feedback notes, surfaced inline for the resubmit loop. */}
        {status === 'rejected' &&
          rows
            .filter((r) => r.moderationNote)
            .map((r) => (
              <FxAlert
                key={`${r.id}-note`}
                tone="danger"
                title={`Why "${r.title}" was rejected`}
                description={r.moderationNote ?? ''}
                actions={
                  <Link to={`/screens/seller/listings/${r.id}/edit`}>
                    <FxButton variant="secondary" size="sm">
                      Fix & resubmit
                    </FxButton>
                  </Link>
                }
              />
            ))}
      </div>
    );
  })();

  const tabs: TabItem[] = TAB_ORDER.map((t) => ({
    id: t.id,
    label: t.label,
    badge: counts?.[t.id] ?? undefined,
    content: grid(tabBody),
  }));

  return (
    <div className="ks-screen">
      <div className="ks-row ks-row-between">
        <h1 className="ks-page-title">Listings</h1>
        <Link to="/screens/seller/listings/new">
          <FxButton variant="primary">+ New listing</FxButton>
        </Link>
      </div>

      <FxDataManagementToolbar
        search={query}
        onSearch={setQuery}
        searchPlaceholder="Search your listings…"
      />

      <FxTabs
        items={tabs}
        value={status}
        onChange={(id) => setStatus(id as SellerListingStatus)}
      />
    </div>
  );
}
