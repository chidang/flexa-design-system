/**
 * U11 Search Results reference screen (doc 08 §2.2). Composed entirely from
 * flexa-ui against the mock backend (`flexa-ui-kit/mocks` via {@link ./api}). The
 * filter rail + sort + applied-filter chips drive a URL query string
 * (`useSearchParams`) so back/forward restores the exact result set
 * (§2.2 interactions 1–2); every fetch runs against `/v1/search`, and the
 * grid degrades to skeletons (loading), an Empty State (filtered-empty) and an
 * Inline Error with Retry (failure) per the §2.2 state table.
 *
 * ZERO one-off component CSS: visuals are flexa-ui components, layout comes from
 * the `ks-*` harness utilities in screens.css and inline `var(--fx-*)` tokens.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  FxBadge,
  FxButton,
  FxChip,
  FxCheckbox,
  FxEmptyState,
  FxInlineError,
  FxListingCard,
  FxPagination,
  FxRating,
  FxSavedFilters,
  FxSelect,
  FxSkeletonLoader,
  FxSlider,
  type OptionItem,
  type SavedFilter,
  type SliderValue,
} from 'flexa-ui-kit';
import type { Facet, Money, SearchCard, SavedSearch } from 'flexa-ui-kit/mocks';
import { api } from './api';

/* --------------------------------------------------------------- constants */

/** Sort vocabulary per doc 09 § Search (relevance is the default with `q`). */
const SORT_OPTIONS: OptionItem[] = [
  { value: 'relevance', label: 'Relevance' },
  { value: '-price', label: 'Price: high to low' },
  { value: 'price', label: 'Price: low to high' },
  { value: 'rating', label: 'Top rated' },
];

/** Price slider bounds in minor units — the seeded catalog tops out at $129. */
const PRICE_MIN = 0;
const PRICE_MAX = 15000;

const money = (m: Money): string => `$${(m.amount / 100).toFixed(2)}`;
const dollars = (cents: number): string => `$${(cents / 100).toFixed(0)}`;

interface SearchResponse {
  data: SearchCard[];
  pageInfo: { nextCursor: string | null; hasMore: boolean; totalCount?: number };
  facets: Facet[];
}

/* -------------------------------------------------------------- URL <-> state */

/** The filter fields that live in the query string. */
interface FilterState {
  q: string;
  categoryId: string;
  sellerId: string;
  shipping: boolean;
  priceMin: number;
  priceMax: number;
  ratingMin: number;
  sort: string;
  page: number;
}

function readFilters(params: URLSearchParams): FilterState {
  const num = (key: string, fallback: number): number => {
    const raw = params.get(key);
    if (raw == null || raw === '') return fallback;
    const n = Number(raw);
    return Number.isFinite(n) ? n : fallback;
  };
  return {
    q: params.get('q') ?? '',
    categoryId: params.get('categoryId') ?? '',
    sellerId: params.get('sellerId') ?? '',
    shipping: params.get('shipping') === 'free',
    priceMin: num('priceMin', PRICE_MIN),
    priceMax: num('priceMax', PRICE_MAX),
    ratingMin: num('ratingMin', 0),
    sort: params.get('sort') ?? 'relevance',
    page: num('page', 1),
  };
}

/** Serialize non-default filter fields back into a URLSearchParams (shareable). */
function writeFilters(f: FilterState): URLSearchParams {
  const p = new URLSearchParams();
  if (f.q) p.set('q', f.q);
  if (f.categoryId) p.set('categoryId', f.categoryId);
  if (f.sellerId) p.set('sellerId', f.sellerId);
  if (f.shipping) p.set('shipping', 'free');
  if (f.priceMin > PRICE_MIN) p.set('priceMin', String(f.priceMin));
  if (f.priceMax < PRICE_MAX) p.set('priceMax', String(f.priceMax));
  if (f.ratingMin > 0) p.set('ratingMin', String(f.ratingMin));
  if (f.sort && f.sort !== 'relevance') p.set('sort', f.sort);
  if (f.page > 1) p.set('page', String(f.page));
  return p;
}

/** Build the `/v1/search` query — the API takes the facet keys as params. */
function searchQuery(f: FilterState): string {
  const p = new URLSearchParams();
  if (f.q) p.set('q', f.q);
  if (f.categoryId) p.set('categoryId', f.categoryId);
  if (f.sellerId) p.set('sellerId', f.sellerId);
  if (f.shipping) p.set('shipping', 'free');
  if (f.priceMin > PRICE_MIN) p.set('priceMin', String(f.priceMin));
  if (f.priceMax < PRICE_MAX) p.set('priceMax', String(f.priceMax));
  p.set('sort', f.sort);
  return p.toString();
}

/* --------------------------------------------------------------- projection */

/**
 * Map a SearchCard to the `ListingSummary` FxListingCard renders. The mock's
 * search projection carries only active listings, so `status` is `active`; free
 * shipping surfaces as the card's corner Badge.
 */
function toListing(card: SearchCard): Parameters<typeof FxListingCard>[0]['listing'] {
  return {
    id: card.id,
    title: card.title,
    // Hash href — the card renders its own <a> (title link); under the
    // HashRouter a hash URL navigates in-app without a Link wrapper (which
    // would nest <a> inside <a> — invalid HTML, console error).
    href: `#/screens/listings/${card.id}`,
    imageUrl: card.coverUrl,
    imageAlt: card.title,
    price: card.price,
    rating: card.rating,
    ratingCount: card.reviewCount,
    seller: { id: card.sellerId, name: card.sellerName },
    status: 'active',
    updatedAt: '',
    ...(card.freeShipping ? { badgeTone: 'success' as const, badgeLabel: 'Free shipping' } : {}),
  };
}

/* ------------------------------------------------------------------- screen */

export function SearchResults() {
  const [params, setParams] = useSearchParams();
  const filters = useMemo(() => readFilters(params), [params]);

  const [response, setResponse] = useState<SearchResponse | null>(null);
  const [saved, setSaved] = useState<SavedSearch[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [reloadKey, setReloadKey] = useState(0);

  /** Commit a filter patch → new URL → refetch. Any filter edit resets page. */
  const patch = useCallback(
    (next: Partial<FilterState>) => {
      const merged: FilterState = { ...filters, page: 1, ...next };
      setParams(writeFilters(merged), { replace: false });
    },
    [filters, setParams],
  );

  const clearAll = useCallback(() => {
    // Reset to `q` only (§2.2 interaction 2).
    const p = new URLSearchParams();
    if (filters.q) p.set('q', filters.q);
    setParams(p);
  }, [filters.q, setParams]);

  // Saved filters ride a one-shot fetch (signed-in context; never blocks the grid).
  useEffect(() => {
    let live = true;
    api
      .get<{ data: SavedSearch[] }>('/v1/me/saved-filters?context=search')
      .then((r) => live && setSaved(r.data))
      .catch(() => live && setSaved([]));
    return () => {
      live = false;
    };
  }, []);

  // Results fetch — re-runs on any filter/sort/page change and on Retry.
  useEffect(() => {
    let live = true;
    setStatus('loading');
    api
      .get<SearchResponse>(`/v1/search?${searchQuery(filters)}`)
      .then((r) => {
        if (!live) return;
        setResponse(r);
        setStatus('ready');
      })
      .catch(() => {
        if (!live) return;
        setStatus('error');
      });
    return () => {
      live = false;
    };
  }, [filters, reloadKey]);

  const facetOf = (key: string): Facet | undefined =>
    response?.facets.find((f) => f.key === key);
  const categoryFacet = facetOf('categoryId');
  const sellerFacet = facetOf('sellerId');
  const shippingFacet = facetOf('shipping');

  const total = response?.pageInfo.totalCount ?? response?.data.length ?? 0;

  /* ---- Applied-filter chips (dismissible; each clears its own field) ------ */
  const chips: { key: string; label: string; clear: () => void }[] = [];
  if (filters.categoryId) {
    const v = categoryFacet?.values.find((x) => x.value === filters.categoryId);
    chips.push({
      key: 'categoryId',
      label: `Category: ${v?.label ?? filters.categoryId}`,
      clear: () => patch({ categoryId: '' }),
    });
  }
  if (filters.sellerId) {
    const v = sellerFacet?.values.find((x) => x.value === filters.sellerId);
    chips.push({
      key: 'sellerId',
      label: `Seller: ${v?.label ?? filters.sellerId}`,
      clear: () => patch({ sellerId: '' }),
    });
  }
  if (filters.shipping) {
    chips.push({ key: 'shipping', label: 'Free shipping', clear: () => patch({ shipping: false }) });
  }
  if (filters.ratingMin > 0) {
    chips.push({
      key: 'ratingMin',
      label: `${filters.ratingMin}★ & up`,
      clear: () => patch({ ratingMin: 0 }),
    });
  }
  if (filters.priceMin > PRICE_MIN || filters.priceMax < PRICE_MAX) {
    chips.push({
      key: 'price',
      label: `${dollars(filters.priceMin)} – ${dollars(filters.priceMax)}`,
      clear: () => patch({ priceMin: PRICE_MIN, priceMax: PRICE_MAX }),
    });
  }

  // Saved filters, projected to the FxSavedFilters view shape (read-only here —
  // applying a saved search would drive `?q=`; we surface them as named views).
  const savedViews: SavedFilter[] = saved.map((s) => ({
    id: s.id,
    name: s.name,
    filters: [],
  }));

  const priceValue: SliderValue = [filters.priceMin, filters.priceMax];

  return (
    <div className="ks-screen">
      <div className="ks-sidebar-cols">
        {/* ---------------------------------------------------- filter rail */}
        <aside
          className="ks-stack"
          aria-label="Filters"
          style={{ ['--ks-gap' as string]: 'var(--fx-space-5)' }}
        >
          {savedViews.length > 0 && (
            <section className="ks-stack" style={{ ['--ks-gap' as string]: 'var(--fx-space-2)' }}>
              <strong className="ks-group-title">Saved searches</strong>
              <FxSavedFilters views={savedViews} canManage={false} />
            </section>
          )}

          {categoryFacet && (
            <fieldset
              className="ks-stack"
              style={{ ['--ks-gap' as string]: 'var(--fx-space-2)', border: 'none', padding: 0, margin: 0 }}
            >
              <legend className="ks-group-title">{categoryFacet.label}</legend>
              {categoryFacet.values.map((v) => (
                <FxCheckbox
                  key={v.value}
                  label={`${v.label} (${v.count})`}
                  checked={filters.categoryId === v.value}
                  onChange={(checked) => patch({ categoryId: checked ? v.value : '' })}
                />
              ))}
            </fieldset>
          )}

          {sellerFacet && (
            <fieldset
              className="ks-stack"
              style={{ ['--ks-gap' as string]: 'var(--fx-space-2)', border: 'none', padding: 0, margin: 0 }}
            >
              <legend className="ks-group-title">{sellerFacet.label}</legend>
              {sellerFacet.values.map((v) => (
                <FxCheckbox
                  key={v.value}
                  label={`${v.label} (${v.count})`}
                  checked={filters.sellerId === v.value}
                  onChange={(checked) => patch({ sellerId: checked ? v.value : '' })}
                />
              ))}
            </fieldset>
          )}

          {shippingFacet && (
            <fieldset
              className="ks-stack"
              style={{ ['--ks-gap' as string]: 'var(--fx-space-2)', border: 'none', padding: 0, margin: 0 }}
            >
              <legend className="ks-group-title">{shippingFacet.label}</legend>
              {shippingFacet.values.map((v) => (
                <FxCheckbox
                  key={v.value}
                  label={`${v.label} (${v.count})`}
                  checked={filters.shipping}
                  onChange={(checked) => patch({ shipping: checked })}
                />
              ))}
            </fieldset>
          )}

          <section className="ks-stack" style={{ ['--ks-gap' as string]: 'var(--fx-space-2)' }}>
            <strong className="ks-group-title">Price range</strong>
            <FxSlider
              value={priceValue}
              min={PRICE_MIN}
              max={PRICE_MAX}
              step={500}
              thumbLabels={['Minimum price', 'Maximum price']}
              formatValue={(v) => dollars(v)}
              onChangeEnd={(v) => {
                const [lo, hi] = Array.isArray(v) ? v : [PRICE_MIN, v];
                patch({ priceMin: lo, priceMax: hi });
              }}
            />
          </section>

          <section className="ks-stack" style={{ ['--ks-gap' as string]: 'var(--fx-space-2)' }}>
            <strong className="ks-group-title">Minimum rating</strong>
            <FxRating
              readOnly={false}
              value={filters.ratingMin}
              onChange={(v) => patch({ ratingMin: v })}
            />
          </section>
        </aside>

        {/* ------------------------------------------------------- results */}
        <section className="ks-stack" aria-label="Results" style={{ ['--ks-gap' as string]: 'var(--fx-space-4)' }}>
          {/* Header: count badge + sort */}
          <div className="ks-row ks-row-between">
            <span className="ks-row" style={{ ['--ks-gap' as string]: 'var(--fx-space-2)' }}>
              <FxBadge tone="neutral" appearance="subtle">
                {`${total} result${total === 1 ? '' : 's'}`}
              </FxBadge>
              {filters.q && <span className="ks-muted">for “{filters.q}”</span>}
            </span>
            <span className="ks-row" style={{ ['--ks-gap' as string]: 'var(--fx-space-2)' }}>
              <span className="ks-muted">Sort</span>
              <FxSelect
                options={SORT_OPTIONS}
                value={filters.sort}
                aria-label="Sort results"
                onChange={(v) => patch({ sort: v ?? 'relevance' })}
              />
            </span>
          </div>

          {/* Applied filters + clear all */}
          {chips.length > 0 && (
            <div className="ks-row" style={{ flexWrap: 'wrap', ['--ks-gap' as string]: 'var(--fx-space-2)' }}>
              {chips.map((c) => (
                <FxChip key={c.key} label={c.label} dismissible onDismiss={c.clear} />
              ))}
              <FxButton variant="ghost" size="sm" onClick={clearAll}>
                Clear all
              </FxButton>
            </div>
          )}

          {/* Grid: loading → skeletons, error → inline error, empty → empty state */}
          {status === 'loading' && (
            <div className="ks-grid-cards" aria-busy="true">
              {Array.from({ length: 12 }, (_, i) => (
                <FxSkeletonLoader key={i} shape="rect" height="var(--fx-space-14, 18rem)" />
              ))}
            </div>
          )}

          {status === 'error' && (
            <FxInlineError
              message="We couldn't load these results."
              detail="Check your connection and try again."
              retryLabel="Retry"
              onRetry={() => setReloadKey((k) => k + 1)}
            />
          )}

          {status === 'ready' && response && response.data.length === 0 && (
            <FxEmptyState
              icon="search"
              title="No results match your filters"
              description="Try widening the price range or removing a filter."
              actions={
                <FxButton variant="primary" onClick={clearAll}>
                  Clear all filters
                </FxButton>
              }
            />
          )}

          {status === 'ready' && response && response.data.length > 0 && (
            <>
              <div className="ks-grid-cards">
                {response.data.map((card) => (
                  <FxListingCard key={card.id} listing={toListing(card)} />
                ))}
              </div>

              {/* The mock returns a single terminal page; the control is still
                  wired to page state so a paginated backend would just work. */}
              <FxPagination
                page={filters.page}
                pageCount={1}
                total={total}
                pageSize={Math.max(response.data.length, 1)}
                onPageChange={(p) => patch({ page: p })}
              />
            </>
          )}
        </section>
      </div>
    </div>
  );
}
