/**
 * U11 Listing Detail reference screen (doc 08 §2.3). Composes flexa-ui end to
 * end against the MSW mock backend: breadcrumb → two columns (gallery + content
 * / sticky buy box) → reviews → "More from this seller". No one-off component
 * CSS — layout is the `ks-*` harness utilities + FDS `var(--fx-*)` tokens only.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  FxAccordion,
  FxAlert,
  FxBadge,
  FxBreadcrumb,
  FxButton,
  FxCard,
  FxDescriptionList,
  FxEmptyState,
  FxErrorPage,
  FxGallery,
  FxListingCard,
  FxRating,
  FxReviewCard,
  FxSelect,
  FxSellerCard,
  FxSkeletonLoader,
  FxStepper,
  useToast,
  type GalleryImage,
  type OptionItem,
  type Review as ReviewCardData,
} from 'flexa-ui-kit';
import type {
  Attribute,
  Cart,
  Collection,
  Listing,
  Money,
  Review,
  SearchCard,
  Store,
} from 'flexa-ui-kit/mocks';
import { api } from './api';
import { ApiRequestError } from './api';

/** Full listing detail response — the listing with its embedded seller (§2.4). */
type ListingDetailResponse = Listing & { seller: Store };

/** `{amount, currency}` in integer minor units → display string (screen brief). */
function formatMoney(money: Money): string {
  return `$${(money.amount / 100).toFixed(2)}`;
}

/** ISO → a short readable date; card components render date strings verbatim. */
function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/** Low-stock threshold for the buy-box alert (copy pointer: 10 § Listing). */
const LOW_STOCK = 5;

export function ListingDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [listing, setListing] = useState<ListingDetailResponse | null>(null);
  const [attributes, setAttributes] = useState<Attribute[]>([]);
  const [reviews, setReviews] = useState<Review[] | null>(null);
  const [related, setRelated] = useState<SearchCard[]>([]);
  const [error, setError] = useState<ApiRequestError | null>(null);

  const [variant, setVariant] = useState<string | null>(null);
  const [qty, setQty] = useState(1);
  const [adding, setAdding] = useState(false);

  // First paint: resolve the listing id (fall back to the first search card so
  // the screen always renders, per the routing brief), then fetch the listing +
  // its category attributes + same-seller related listings.
  useEffect(() => {
    let cancelled = false;
    setError(null);
    setListing(null);
    setReviews(null);
    setRelated([]);

    (async () => {
      try {
        const listingId =
          id ??
          (await api.get<Collection<SearchCard>>('/v1/search')).data[0]?.id;
        if (listingId == null) {
          throw new ApiRequestError(404, null);
        }
        const detail = await api.get<ListingDetailResponse>(`/v1/listings/${listingId}`);
        if (cancelled) return;
        setListing(detail);
        setQty(1);

        const attrs = await api.get<Collection<Attribute>>(
          `/v1/categories/${detail.categoryId}/attributes`,
        );
        if (cancelled) return;
        const selectAttrs = attrs.data.filter((a) => a.type === 'select');
        setAttributes(selectAttrs);
        const first = selectAttrs[0];
        setVariant(first?.options[0]?.value ?? null);

        const rel = await api.get<Collection<SearchCard>>(
          `/v1/stores/${detail.sellerId}/listings`,
        );
        if (cancelled) return;
        setRelated(rel.data.filter((c) => c.id !== detail.id).slice(0, 4));

        // Deferred: reviews on mount (brief allows on-mount).
        const rev = await api.get<Collection<Review>>(`/v1/listings/${listingId}/reviews`);
        if (cancelled) return;
        setReviews(rev.data);
      } catch (e) {
        if (cancelled) return;
        setError(
          e instanceof ApiRequestError ? e : new ApiRequestError(500, null),
        );
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [id]);

  // The buy-box Variant Select is derived from the first `select` attribute's
  // options (e.g. size) — never an invented variants field.
  const variantAttr = attributes[0];
  const variantOptions: OptionItem[] = useMemo(
    () => (variantAttr?.options ?? []).map((o) => ({ value: o.value, label: o.label })),
    [variantAttr],
  );

  const stock = listing?.quantity ?? null; // null = unlimited
  const outOfStock = stock === 0;
  const lowStock = stock != null && stock > 0 && stock <= LOW_STOCK;
  const maxQty = stock != null && stock > 0 ? stock : undefined;

  const onAddToCart = useCallback(async () => {
    if (!listing || outOfStock) return;
    setAdding(true);
    try {
      await api.post<Cart>('/v1/cart/items', { listingId: listing.id, quantity: qty });
      toast.show({
        tone: 'success',
        title: 'Added to cart',
        description: `${qty} × ${listing.title}`,
        action: { label: 'View cart', onClick: () => navigate('/screens/checkout/cart') },
      });
    } catch (e) {
      toast.show({
        tone: 'danger',
        title: "Couldn't add to cart",
        description:
          e instanceof ApiRequestError ? e.message : 'Please try again in a moment.',
      });
    } finally {
      setAdding(false);
    }
  }, [listing, outOfStock, qty, toast, navigate]);

  if (error) {
    const code = error.status === 404 ? 404 : error.status === 403 ? 403 : 500;
    return (
      <div className="ks-screen">
        <FxErrorPage
          code={code}
          requestId={error.body?.requestId}
          actions={
            <FxButton variant="secondary" onClick={() => navigate('/screens/search')}>
              Back to search
            </FxButton>
          }
        />
      </div>
    );
  }

  /* ------------------------------------------------------------- loading */
  if (!listing) {
    return (
      <div className="ks-screen">
        <FxSkeletonLoader shape="text" width="40%" />
        <div className="ks-cols">
          <div className="ks-stack" style={{ ['--ks-gap' as string]: 'var(--fx-space-4)' }}>
            <FxSkeletonLoader shape="rect" height="360px" />
            <FxSkeletonLoader shape="text" lines={3} />
          </div>
          <div className="ks-rail">
            <FxCard padding="lg">
              <div className="ks-stack">
                <FxSkeletonLoader shape="text" width="70%" />
                <FxSkeletonLoader shape="text" width="30%" />
                <FxSkeletonLoader shape="rect" height="40px" />
                <FxSkeletonLoader shape="rect" height="40px" />
              </div>
            </FxCard>
          </div>
        </div>
      </div>
    );
  }

  const { seller } = listing;

  const galleryImages: GalleryImage[] = listing.media.map((m) => ({
    id: m.id,
    src: m.url,
    alt: m.alt,
  }));

  // Attributes description list: the listing's declared attribute values,
  // labelled via the category attribute definitions where available.
  const attrItems = Object.entries(listing.attributes).map(([key, value]) => {
    const def = attributes.find((a) => a.key === key);
    const option = def?.options.find((o) => o.value === String(value));
    return { term: def?.label ?? key, detail: option?.label ?? String(value) };
  });

  const reviewSummaryCount = listing.reviewCount;

  return (
    <div className="ks-screen">
      <FxBreadcrumb
        items={[
          { label: 'Home', href: '#/screens' },
          { label: 'Category', href: '#/screens/search' },
          { label: 'Subcategory', href: '#/screens/search' },
          { label: listing.title },
        ]}
      />

      <div className="ks-cols">
        {/* -------- left column: gallery + content -------- */}
        <div className="ks-stack" style={{ ['--ks-gap' as string]: 'var(--fx-space-5)' }}>
          <FxGallery images={galleryImages} />

          <div className="ks-stack" style={{ ['--ks-gap' as string]: 'var(--fx-space-2)' }}>
            <div className="ks-row">
              <h1 className="ks-page-title">{listing.title}</h1>
              <FxBadge tone="success" appearance="subtle">
                New condition
              </FxBadge>
            </div>
            <p className="ks-muted">{listing.description}</p>
          </div>

          {attrItems.length > 0 && (
            <FxDescriptionList items={attrItems} columns={2} divided />
          )}

          <FxAccordion
            items={[
              {
                id: 'shipping',
                title: 'Shipping & returns',
                content: (
                  <p className="ks-muted" style={{ margin: 0 }}>
                    Ships protected within 2–3 business days. Returns accepted within
                    30 days of delivery. Funds are held in escrow until you approve.
                  </p>
                ),
              },
            ]}
          />

          <FxSellerCard
            seller={{
              id: seller.id,
              name: seller.name,
              href: `#/screens/search?sellerId=${seller.id}`,
              rating: seller.rating ?? undefined,
              ratingCount: seller.reviewCount,
              responseTime: seller.responseTime,
              memberSince: formatDate(seller.createdAt),
            }}
            actions={
              <Link to="/screens/search">
                <FxButton variant="secondary" size="sm">
                  Visit store
                </FxButton>
              </Link>
            }
          />
        </div>

        {/* -------- right column: sticky buy box -------- */}
        <div className="ks-rail">
          <FxCard padding="lg">
            <div className="ks-stack">
              <h2 className="ks-page-title" style={{ fontSize: '1.15rem' }}>
                {listing.title}
              </h2>

              <FxRating value={listing.rating} readOnly showValue count={reviewSummaryCount} />

              <div style={{ fontSize: '1.5rem', fontWeight: 600 }}>
                {formatMoney(listing.price)}{' '}
                <span className="ks-muted" style={{ fontSize: '0.9rem', fontWeight: 400 }}>
                  {listing.price.currency}
                </span>
              </div>

              {variantOptions.length > 0 && (
                <label className="ks-stack" style={{ ['--ks-gap' as string]: 'var(--fx-space-1)' }}>
                  <span className="ks-muted" style={{ fontSize: '0.85rem' }}>
                    {variantAttr?.label ?? 'Variant'}
                  </span>
                  <FxSelect
                    options={variantOptions}
                    value={variant}
                    onChange={(v) => setVariant(v)}
                    placeholder="Choose an option"
                  />
                </label>
              )}

              <div className="ks-row">
                <span className="ks-muted" style={{ fontSize: '0.85rem' }}>
                  Quantity
                </span>
                <FxStepper
                  value={qty}
                  min={1}
                  max={maxQty}
                  onChange={(v) => setQty(v)}
                  disabled={outOfStock}
                  ariaLabel="Quantity"
                />
              </div>

              {lowStock && (
                <FxAlert
                  tone="warning"
                  description={`Only ${stock} left in stock — order soon.`}
                />
              )}

              <FxButton
                variant="primary"
                loading={adding}
                disabled={outOfStock}
                onClick={onAddToCart}
              >
                {outOfStock ? 'Out of stock' : 'Add to cart'}
              </FxButton>

              <FxButton variant="ghost" onClick={() => navigate('/screens/search')}>
                Message seller
              </FxButton>
            </div>
          </FxCard>
        </div>
      </div>

      {/* -------- reviews -------- */}
      <section className="ks-stack" aria-label="Reviews">
        <div className="ks-row ks-row-between">
          <h2 className="ks-page-title" style={{ fontSize: '1.25rem' }}>
            Reviews
          </h2>
          <FxRating value={listing.rating} readOnly showValue count={reviewSummaryCount} />
        </div>

        {reviews == null ? (
          <div className="ks-stack">
            {[0, 1, 2].map((i) => (
              <FxSkeletonLoader key={i} shape="text" lines={3} />
            ))}
          </div>
        ) : reviews.length === 0 ? (
          <FxEmptyState icon="star" title="No reviews yet" description="Be the first to review this listing." />
        ) : (
          <div className="ks-stack">
            {reviews.map((r) => {
              const data: ReviewCardData = {
                id: r.id,
                author: { id: r.id, name: r.authorName },
                rating: r.rating,
                title: r.title,
                body: r.body,
                createdAt: formatDate(r.createdAt),
              };
              return <FxReviewCard key={r.id} review={data} />;
            })}
          </div>
        )}
      </section>

      {/* -------- more from this seller -------- */}
      {related.length > 0 && (
        <section className="ks-stack" aria-label="More from this seller">
          <h2 className="ks-page-title" style={{ fontSize: '1.25rem' }}>
            More from {seller.name}
          </h2>
          <div className="ks-grid-cards">
            {/* No Link wrapper — the card renders its own <a> (hash href works
                under the HashRouter); nesting it in a Link is invalid HTML. */}
            {related.map((c) => (
              <FxListingCard
                key={c.id}
                listing={{
                  id: c.id,
                  title: c.title,
                  href: `#/screens/listings/${c.id}`,
                  imageUrl: c.coverUrl,
                  imageAlt: c.title,
                  price: c.price,
                  rating: c.rating,
                  ratingCount: c.reviewCount,
                  seller: { id: c.sellerId, name: c.sellerName },
                  status: 'active',
                  updatedAt: new Date().toISOString(),
                }}
                mode="buyer"
                showSeller
                showRating
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
