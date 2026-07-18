'use client';
/**
 * FxTable — semantic data table (doc 04 §2.21).
 *
 * Native `<table>` semantics: sortable `<th aria-sort>`, per-row select
 * checkboxes, sticky header, pagination slot. NOT keyboard-grid-navigable and
 * NOT cell-editable — that is FxDataGrid (§2.22). Server-driven datasets work
 * controlled: sort / selection are controlled + uncontrolled per §1.5. Every
 * user-facing string is a prop with an English default (`labels`). `caption`
 * and `emptyState` are required — a table without them is a contract violation.
 *
 * SSR-safe: no window/document access during render; the scroll container is
 * `tabindex=0` and the loading overlay sets `aria-busy`.
 */
import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { Density } from '../enums';
import { FxCheckbox } from '../checkbox/checkbox';
import { FxSkeletonLoader } from '../skeleton/skeleton';

/** React key type (row identity / selection key). */
export type Key = string | number;

/** Sort state: which column, which direction. */
export interface TableSort {
  key: string;
  dir: 'asc' | 'desc';
}

/** Column selection mode. */
export type TableSelectable = 'none' | 'multi' | 'single';

/** One column definition. */
export interface TableColumn<T> {
  /** Stable column id (matches sort key). */
  key: string;
  /** Header cell text. */
  header: string;
  /** Enables the sort button in the header. */
  sortable?: boolean;
  /** Text alignment; numeric cells use `end`. */
  align?: 'start' | 'end' | 'center';
  /** CSS width (e.g. `'12rem'`, `'20%'`). */
  width?: string;
  /** Pins the column to an edge (sticky). */
  sticky?: 'start' | 'end';
  /** Custom cell renderer; defaults to `String(row[key])`. */
  render?: (row: T) => ReactNode;
}

/** i18n strings. */
export interface TableLabels {
  /** Select-all header checkbox label. */
  selectAll: string;
  /** Per-row checkbox label; `{label}` is replaced with the row caption. */
  selectRow: string;
  /** Sort-to-ascending action hint. */
  sortAsc: string;
  /** Sort-to-descending action hint. */
  sortDesc: string;
  /** Clear-sort action hint. */
  clearSort: string;
  /** `role=status` loading announcement. */
  loading: string;
}

export const DEFAULT_TABLE_LABELS: TableLabels = {
  selectAll: 'Select all rows',
  selectRow: 'Select row {label}',
  sortAsc: 'Sort ascending',
  sortDesc: 'Sort descending',
  clearSort: 'Clear sort',
  loading: 'Loading…',
};

export interface FxTableProps<T> {
  /** Column definitions. */
  columns: TableColumn<T>[];
  /** Row data. */
  rows: T[];
  /** Stable per-row identity. */
  rowKey: (row: T) => Key;
  /** Controlled sort (§1.5). */
  sort?: TableSort | null;
  /** Uncontrolled initial sort. */
  defaultSort?: TableSort | null;
  /** Selection mode. `multi` adds a select-all header (indeterminate when partial). */
  selectable?: TableSelectable;
  /** Controlled selection (§1.5). */
  selectedKeys?: Key[];
  /** Uncontrolled initial selection. */
  defaultSelectedKeys?: Key[];
  /** Rows become clickable; the primary cell should also hold a real link. */
  onRowClick?: (row: T) => void;
  /** Human label for a row, used in the per-row checkbox name. */
  rowLabel?: (row: T) => string;
  /** Sticky header. Defaults to `true`. */
  stickyHeader?: boolean;
  /** Row density. */
  density?: Density;
  /** Loading: skeleton on first load, overlay + `aria-busy` afterwards. */
  loading?: boolean;
  /** Skeleton row count used while loading with no rows. */
  skeletonRows?: number;
  /** Shown when `rows=[]` and not loading (required — a11y contract). */
  emptyState: ReactNode;
  /** `<caption>` naming the table (required; visually hidden allowed). */
  caption: string;
  /** Pagination slot (FxPagination). */
  pagination?: ReactNode;
  /** Table footer row content. */
  footer?: ReactNode;
  labels?: Partial<TableLabels>;
  onSortChange?: (sort: TableSort | null) => void;
  onSelectionChange?: (keys: Key[]) => void;
  className?: string;
}

/** Cycle asc → desc → null for a header sort button. */
export function nextSort(current: TableSort | null, key: string): TableSort | null {
  if (!current || current.key !== key) return { key, dir: 'asc' };
  if (current.dir === 'asc') return { key, dir: 'desc' };
  return null;
}

function fill(template: string, values: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (_, k) => values[k] ?? '');
}

const ariaSort = (s: TableSort | null, key: string): 'ascending' | 'descending' | 'none' => {
  if (!s || s.key !== key) return 'none';
  return s.dir === 'asc' ? 'ascending' : 'descending';
};

export function FxTable<T>({
  columns,
  rows,
  rowKey,
  sort,
  defaultSort = null,
  selectable = 'none',
  selectedKeys,
  defaultSelectedKeys = [],
  onRowClick,
  rowLabel,
  stickyHeader = true,
  density = 'comfortable',
  loading = false,
  skeletonRows = 5,
  emptyState,
  caption,
  pagination,
  footer,
  labels,
  onSortChange,
  onSelectionChange,
  className,
}: FxTableProps<T>) {
  const l = { ...DEFAULT_TABLE_LABELS, ...labels };

  const sortControlled = sort !== undefined;
  const [internalSort, setInternalSort] = useState<TableSort | null>(defaultSort);
  const currentSort = sortControlled ? sort : internalSort;

  const selControlled = selectedKeys !== undefined;
  const [internalSel, setInternalSel] = useState<Key[]>(defaultSelectedKeys);
  const selection = selControlled ? selectedKeys! : internalSel;
  const selSet = useMemo(() => new Set(selection), [selection]);

  const commitSort = (next: TableSort | null) => {
    if (!sortControlled) setInternalSort(next);
    onSortChange?.(next);
  };

  const commitSelection = (next: Key[]) => {
    if (!selControlled) setInternalSel(next);
    onSelectionChange?.(next);
  };

  const toggleRow = (key: Key) => {
    if (selectable === 'single') {
      commitSelection(selSet.has(key) ? [] : [key]);
      return;
    }
    const next = new Set(selSet);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    commitSelection([...next]);
  };

  const allKeys = rows.map(rowKey);
  const selectedCount = allKeys.filter((k) => selSet.has(k)).length;
  const allSelected = rows.length > 0 && selectedCount === rows.length;
  const someSelected = selectedCount > 0 && !allSelected;

  const toggleAll = () => {
    if (allSelected) commitSelection([]);
    else commitSelection(allKeys);
  };

  const colSpan = columns.length + (selectable !== 'none' ? 1 : 0);
  const isEmpty = rows.length === 0 && !loading;
  const showSkeleton = loading && rows.length === 0;
  const overlay = loading && rows.length > 0;

  const rowName = (row: T): string => (rowLabel ? rowLabel(row) : String(rowKey(row)));

  const rootClass = ['fx-table-container', className].filter(Boolean).join(' ');

  return (
    <div
      className={rootClass}
      data-density={density}
      data-loading={overlay || undefined}
      aria-busy={overlay || undefined}
      tabIndex={0}
    >
      <table className="fx-table">
        <caption className="fx-table-caption">{caption}</caption>
        <thead className="fx-table-head" data-sticky={stickyHeader || undefined}>
          <tr>
            {selectable !== 'none' && (
              <th className="fx-table-select" scope="col">
                {selectable === 'multi' ? (
                  <FxCheckbox
                    aria-label={l.selectAll}
                    checked={allSelected}
                    indeterminate={someSelected}
                    disabled={rows.length === 0 || overlay}
                    onChange={toggleAll}
                  />
                ) : (
                  <span className="fx-table-sr">{l.selectAll}</span>
                )}
              </th>
            )}
            {columns.map((col) => {
              const sortState = ariaSort(currentSort, col.key);
              return (
                <th
                  key={col.key}
                  className="fx-table-th"
                  scope="col"
                  data-align={col.align ?? 'start'}
                  data-sticky={col.sticky ?? undefined}
                  style={col.width ? { width: col.width } : undefined}
                  aria-sort={col.sortable ? sortState : undefined}
                >
                  {col.sortable ? (
                    <button
                      type="button"
                      className="fx-table-sort-btn"
                      data-dir={sortState}
                      onClick={() => commitSort(nextSort(currentSort, col.key))}
                    >
                      <span className="fx-table-sort-label">{col.header}</span>
                      <span className="fx-table-sort-icon" aria-hidden="true" />
                    </button>
                  ) : (
                    col.header
                  )}
                </th>
              );
            })}
          </tr>
        </thead>

        <tbody className="fx-table-body">
          {showSkeleton
            ? Array.from({ length: skeletonRows }, (_, r) => (
                <tr key={`sk-${r}`} className="fx-table-skeleton-row" aria-hidden="true">
                  {selectable !== 'none' && (
                    <td className="fx-table-select">
                      <FxSkeletonLoader shape="rect" width="16px" height="16px" />
                    </td>
                  )}
                  {columns.map((col) => (
                    <td key={col.key} className="fx-table-td" data-align={col.align ?? 'start'}>
                      <FxSkeletonLoader shape="text" />
                    </td>
                  ))}
                </tr>
              ))
            : rows.map((row) => {
                const key = rowKey(row);
                const selected = selSet.has(key);
                return (
                  <tr
                    key={key}
                    className="fx-table-row"
                    data-selected={selected || undefined}
                    data-clickable={onRowClick ? true : undefined}
                    aria-selected={selectable !== 'none' ? selected : undefined}
                    onClick={onRowClick ? () => onRowClick(row) : undefined}
                  >
                    {selectable !== 'none' && (
                      <td
                        className="fx-table-select"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <FxCheckbox
                          aria-label={fill(l.selectRow, { label: rowName(row) })}
                          checked={selected}
                          disabled={overlay}
                          onChange={() => toggleRow(key)}
                        />
                      </td>
                    )}
                    {columns.map((col) => (
                      <td
                        key={col.key}
                        className="fx-table-td"
                        data-align={col.align ?? 'start'}
                        data-sticky={col.sticky ?? undefined}
                      >
                        {col.render
                          ? col.render(row)
                          : String((row as Record<string, unknown>)[col.key] ?? '')}
                      </td>
                    ))}
                  </tr>
                );
              })}
        </tbody>

        {footer != null && (
          <tfoot className="fx-table-foot">
            <tr>
              <td colSpan={colSpan}>{footer}</td>
            </tr>
          </tfoot>
        )}
      </table>

      {isEmpty && <div className="fx-table-empty">{emptyState}</div>}

      {overlay && (
        <div className="fx-table-overlay" aria-hidden="true">
          <span className="fx-table-shimmer" />
        </div>
      )}
      {loading && (
        <span className="fx-table-status" role="status">
          {l.loading}
        </span>
      )}

      {pagination != null && <div className="fx-table-pagination">{pagination}</div>}
    </div>
  );
}
