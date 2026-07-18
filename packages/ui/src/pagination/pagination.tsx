/**
 * FxPagination — traverse a long collection in pages (doc 04 §2.36).
 *
 * Pure/RSC: renders prev/windowed-numbers/next as buttons and reports intent via
 * `onPageChange` — it owns no state (the host holds `page`). Cursor mode
 * (`hasMore`, no `pageCount`) renders prev/next only. Every visible string is a
 * prop (`labels`) with an English default.
 */
import { FxIcon } from '../icon/FxIcon';

export interface PaginationLabels {
  nav: string;
  prev: string;
  next: string;
  /** `{n}` is replaced with the page number. */
  page: string;
  /** `{n}` is replaced with the page number. */
  gotoPage: string;
  /** `{from}`, `{to}`, `{total}` are replaced. */
  summary: string;
  perPage: string;
}

export const DEFAULT_PAGINATION_LABELS: PaginationLabels = {
  nav: 'Pagination',
  prev: 'Previous',
  next: 'Next',
  page: 'Page {n}',
  gotoPage: 'Go to page {n}',
  summary: '{from}–{to} of {total}',
  perPage: 'Per page',
};

export interface FxPaginationProps {
  /** 1-based current page. */
  page: number;
  /** Total page count (offset mode). Omit + set `hasMore` for cursor mode. */
  pageCount?: number;
  /** Cursor mode: whether a next page exists. */
  hasMore?: boolean;
  /** Pages adjacent to current shown before collapsing to a gap. */
  siblingCount?: number;
  /** Enables the range summary line (with `pageSize`). */
  total?: number;
  /** Items per page (drives the summary math). */
  pageSize?: number;
  labels?: Partial<PaginationLabels>;
  onPageChange?: (page: number) => void;
  className?: string;
}

type PageEntry = number | 'gap';

/** Windowed page list: first + last always shown, current±siblingCount, gaps as '…'. */
export function pageWindow(page: number, pageCount: number, siblingCount: number): PageEntry[] {
  if (pageCount <= 1) return [1];
  const first = 1;
  const last = pageCount;
  const start = Math.max(first, page - siblingCount);
  const end = Math.min(last, page + siblingCount);
  const entries: PageEntry[] = [];

  entries.push(first);
  if (start > first + 1) entries.push('gap');
  for (let p = Math.max(first + 1, start); p <= Math.min(last - 1, end); p += 1) {
    entries.push(p);
  }
  if (end < last - 1) entries.push('gap');
  if (last !== first) entries.push(last);
  return entries;
}

function fill(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, k) => String(values[k] ?? ''));
}

export function FxPagination({
  page,
  pageCount,
  hasMore,
  siblingCount = 1,
  total,
  pageSize,
  labels,
  onPageChange,
  className,
}: FxPaginationProps) {
  const l = { ...DEFAULT_PAGINATION_LABELS, ...labels };
  const cursorMode = pageCount === undefined;
  const prevDisabled = page <= 1;
  const nextDisabled = cursorMode ? hasMore === false : page >= (pageCount ?? 1);

  const go = (target: number) => {
    if (target < 1 || (pageCount !== undefined && target > pageCount)) return;
    onPageChange?.(target);
  };

  const showSummary = total !== undefined && pageSize !== undefined;
  const from = showSummary ? (page - 1) * pageSize + 1 : 0;
  const to = showSummary ? Math.min(page * pageSize, total) : 0;

  return (
    <nav className={className ? `fx-pagination ${className}` : 'fx-pagination'} aria-label={l.nav}>
      {showSummary && (
        <p className="fx-pagination-summary">
          {fill(l.summary, { from, to, total })}
        </p>
      )}
      <ul className="fx-pagination-pages">
        <li>
          <button
            type="button"
            className="fx-pagination-prev"
            aria-label={l.prev}
            aria-disabled={prevDisabled || undefined}
            disabled={prevDisabled}
            onClick={() => go(page - 1)}
          >
            <FxIcon name="chevron" size={16} className="fx-pagination-icon--prev" />
          </button>
        </li>

        {!cursorMode &&
          pageWindow(page, pageCount ?? 1, siblingCount).map((entry, i) =>
            entry === 'gap' ? (
              <li key={`gap-${i}`}>
                <span className="fx-pagination-gap" aria-hidden="true">
                  {'…'}
                </span>
              </li>
            ) : (
              <li key={entry}>
                <button
                  type="button"
                  className="fx-pagination-page"
                  data-current={entry === page || undefined}
                  aria-current={entry === page ? 'page' : undefined}
                  aria-label={fill(entry === page ? l.page : l.gotoPage, { n: entry })}
                  onClick={() => go(entry)}
                >
                  {entry}
                </button>
              </li>
            ),
          )}

        <li>
          <button
            type="button"
            className="fx-pagination-next"
            aria-label={l.next}
            aria-disabled={nextDisabled || undefined}
            disabled={nextDisabled}
            onClick={() => go(page + 1)}
          >
            <FxIcon name="chevron" size={16} className="fx-pagination-icon--next" />
          </button>
        </li>
      </ul>
    </nav>
  );
}
