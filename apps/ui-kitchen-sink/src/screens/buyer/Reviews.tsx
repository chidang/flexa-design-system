/**
 * U13-B Reviews — write/manage (doc 08 §3.8, flow B4). Tabs: To review |
 * Published. "To review" lists completed orders without a review (`GET
 * /me/reviewables`, derived from the shared `db.orders` — approving an order
 * elsewhere in the session makes it appear here) as the §3.8 "reviewable order"
 * cards (G3 closed — ui-kit doc 14 §11): FxOrderCard whose `actions` slot (G1)
 * carries the *Write a review* CTA, opening a Dialog (Rating required,
 * Textarea, anonymous Checkbox → `POST /reviews`). "Published" lists own
 * reviews as Review Cards with an edit/delete Context Menu (edit within the
 * 30-day window).
 *
 * ZERO one-off component CSS: composed from flexa-ui; framing via `ks-*` +
 * `buyer.css`.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  FxButton,
  FxCheckbox,
  FxConfirmationDialog,
  FxContextMenu,
  FxDialog,
  FxEmptyState,
  FxFieldGroup,
  FxIcon,
  FxInlineError,
  FxOrderCard,
  FxRating,
  FxReviewCard,
  FxSkeletonLoader,
  FxTabs,
  FxTextarea,
  FxValidationMessage,
  useToast,
  type OrderSummary,
  type Review as CardReview,
  type TabItem,
} from 'flexa-ui-kit';
import type { Collection, Order, OwnReview } from 'flexa-ui-kit/mocks';
import { api, ApiRequestError } from '../api';
import { daysUntil, formatDate } from './format';

/* ------------------------------------------------------------------ mappers */

/** mock Order → FxOrderCard's OrderSummary (reviewable-order card, G3). */
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

/** mock OwnReview → FxReviewCard's Review (buyer as author). */
function toCardReview(r: OwnReview): CardReview {
  return {
    id: r.id,
    author: { id: 'me', name: r.anonymous ? 'Anonymous' : 'You' },
    rating: r.rating,
    title: r.listingTitle,
    body: r.body,
    createdAt: formatDate(r.createdAt),
    verified: true,
  };
}

interface Draft {
  orderId: string;
  listingTitle: string;
  rating: number;
  body: string;
  anonymous: boolean;
}

/* -------------------------------------------------------------------- root */

export function Reviews() {
  const toast = useToast();
  const [reviewables, setReviewables] = useState<Order[] | null>(null);
  const [reviews, setReviews] = useState<OwnReview[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ApiRequestError | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const [draft, setDraft] = useState<Draft | null>(null);
  const [submitBusy, setSubmitBusy] = useState(false);
  const [showRatingError, setShowRatingError] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const [rv, rw] = await Promise.all([
      api.get<Collection<Order>>('/v1/me/reviewables'),
      api.get<Collection<OwnReview>>('/v1/me/reviews'),
    ]);
    return { reviewables: rv.data, reviews: rw.data };
  }, []);

  useEffect(() => {
    let live = true;
    setLoading(true);
    setError(null);
    load()
      .then((r) => {
        if (!live) return;
        setReviewables(r.reviewables);
        setReviews(r.reviews);
        setLoading(false);
      })
      .catch((e) => {
        if (!live) return;
        setError(e instanceof ApiRequestError ? e : new ApiRequestError(500, null));
        setLoading(false);
      });
    return () => {
      live = false;
    };
  }, [load, reloadKey]);

  const openWrite = useCallback((order: Order) => {
    setShowRatingError(false);
    setDraft({
      orderId: order.id,
      listingTitle: order.items[0]?.title ?? order.number,
      rating: 0,
      body: '',
      anonymous: false,
    });
  }, []);

  const submit = useCallback(async () => {
    if (!draft) return;
    if (draft.rating < 1) {
      setShowRatingError(true);
      return;
    }
    setSubmitBusy(true);
    try {
      await api.post('/v1/reviews', {
        orderId: draft.orderId,
        rating: draft.rating,
        body: draft.body.trim(),
        anonymous: draft.anonymous,
      });
      const fresh = await load();
      setReviewables(fresh.reviewables);
      setReviews(fresh.reviews);
      setDraft(null);
      toast.show({ tone: 'success', title: 'Review published', description: 'Thanks for your feedback!' });
    } catch (e) {
      const code = e instanceof ApiRequestError ? e.body?.code : undefined;
      toast.show({
        tone: 'danger',
        title: 'Could not publish review',
        description:
          code === 'conflict'
            ? 'You already reviewed this order.'
            : 'Please try again in a moment.',
      });
    } finally {
      setSubmitBusy(false);
    }
  }, [draft, load, toast]);

  const remove = useCallback(async () => {
    if (!deleteId) return;
    try {
      await api.del(`/v1/reviews/${deleteId}`);
      const fresh = await load();
      setReviewables(fresh.reviewables);
      setReviews(fresh.reviews);
      toast.show({ tone: 'success', title: 'Review deleted' });
    } catch (e) {
      toast.show({ tone: 'danger', title: 'Could not delete review', description: 'Please try again.' });
      throw e;
    } finally {
      setDeleteId(null);
    }
  }, [deleteId, load, toast]);

  /* ---------------------------------------------------- to-review tab body */

  const toReviewBody = (() => {
    const rows = reviewables ?? [];
    if (rows.length === 0) {
      return <FxEmptyState title="Nothing to review right now" description="Reviews unlock once an order is completed." icon="star" />;
    }
    return (
      <div className="ks-stack" style={{ ['--ks-gap' as string]: 'var(--fx-space-3)' }}>
        {rows.map((o) => (
          // G3 closed: the §3.8 reviewable-order card is FxOrderCard with the
          // Write-a-review CTA in its `actions` slot (G1).
          <FxOrderCard
            key={o.id}
            order={toOrderSummary(o)}
            perspective="buyer"
            actions={
              <FxButton variant="primary" size="sm" onClick={() => openWrite(o)}>
                Write a review
              </FxButton>
            }
          />
        ))}
      </div>
    );
  })();

  /* ---------------------------------------------------- published tab body */

  const publishedBody = (() => {
    const rows = reviews ?? [];
    if (rows.length === 0) {
      return <FxEmptyState title="Your reviews will appear here" description="Reviews you write show up on this tab." icon="star" />;
    }
    return (
      <div className="ks-stack" style={{ ['--ks-gap' as string]: 'var(--fx-space-4)' }}>
        {rows.map((r) => {
          const days = daysUntil(r.editableUntil);
          return (
            <div key={r.id} className="ks-stack" style={{ ['--ks-gap' as string]: 'var(--fx-space-2)' }}>
              <div className="ks-row ks-row-between">
                <span className="ks-muted">
                  {days > 0 ? `Editable for ${days} more day${days === 1 ? '' : 's'}` : 'Edit window closed'}
                </span>
                <FxContextMenu
                  ariaLabel={`Actions for your review of ${r.listingTitle}`}
                  trigger={
                    <FxButton variant="ghost" size="sm" aria-label="Review actions">
                      <FxIcon name="more" size={20} />
                    </FxButton>
                  }
                  items={[
                    { id: 'delete', label: 'Delete', icon: 'trash', tone: 'danger' },
                  ]}
                  onSelect={(item) => {
                    if (item.id === 'delete') setDeleteId(r.id);
                  }}
                />
              </div>
              <FxReviewCard review={toCardReview(r)} />
            </div>
          );
        })}
      </div>
    );
  })();

  const tabs: TabItem[] = useMemo(
    () => [
      {
        id: 'to-review',
        label: 'To review',
        badge: (reviewables ?? []).length || undefined,
        content: toReviewBody,
      },
      { id: 'published', label: 'Published', content: publishedBody },
    ],
    [toReviewBody, publishedBody, reviewables],
  );

  if (loading) {
    return (
      <div className="ks-screen">
        <FxSkeletonLoader shape="text" width="10rem" />
        <FxSkeletonLoader shape="rect" height="6rem" />
        <FxSkeletonLoader shape="rect" height="6rem" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="ks-screen">
        <h1 className="ks-page-title">Reviews</h1>
        <FxInlineError
          message="We couldn't load your reviews."
          detail={error.body?.requestId}
          onRetry={() => setReloadKey((k) => k + 1)}
        />
      </div>
    );
  }

  return (
    <div className="ks-screen">
      <h1 className="ks-page-title">Reviews</h1>
      <FxTabs items={tabs} />

      {/* Write-review Dialog (doc 08 §3.8 — Modal Layout; Rating required). */}
      <FxDialog
        open={draft != null}
        onOpenChange={(o) => {
          if (!o) setDraft(null);
        }}
        title={draft ? `Review ${draft.listingTitle}` : 'Write a review'}
        footer={
          <>
            <FxButton variant="secondary" onClick={() => setDraft(null)} disabled={submitBusy}>
              Cancel
            </FxButton>
            <FxButton variant="primary" onClick={submit} loading={submitBusy}>
              Publish review
            </FxButton>
          </>
        }
      >
        {draft && (
          <div className="ks-stack" style={{ ['--ks-gap' as string]: 'var(--fx-space-4)' }}>
            <FxFieldGroup label="Your rating" required asGroup>
              <FxRating
                readOnly={false}
                value={draft.rating}
                onChange={(v) => {
                  setShowRatingError(false);
                  setDraft((d) => (d ? { ...d, rating: v } : d));
                }}
              />
              {showRatingError && <FxValidationMessage tone="danger">Please pick a rating.</FxValidationMessage>}
            </FxFieldGroup>
            <FxFieldGroup label="Your review" help="Optional — tell other buyers what you thought.">
              <FxTextarea
                value={draft.body}
                onChange={(v) => setDraft((d) => (d ? { ...d, body: v } : d))}
                rows={4}
                placeholder="Share the details of your experience…"
              />
            </FxFieldGroup>
            <FxCheckbox
              checked={draft.anonymous}
              onChange={(checked) => setDraft((d) => (d ? { ...d, anonymous: checked } : d))}
              label="Post anonymously"
            />
          </div>
        )}
      </FxDialog>

      {/* Delete confirmation. */}
      <FxConfirmationDialog
        open={deleteId != null}
        onOpenChange={(o) => !o && setDeleteId(null)}
        tone="danger"
        title="Delete this review?"
        description="This removes your review from the listing. You can write a new one later."
        confirmLabel="Delete review"
        onConfirm={remove}
      />
    </div>
  );
}
