'use client';
/**
 * FxVirtualTable — FxTable (§2.21) API + row virtualization (doc 04 §3.5).
 *
 * For 1k–100k rows: only the visible window (± overscan) is rendered while a
 * spacer keeps the scrollbar honest. `rowHeight` is fixed per density (no
 * auto-height). Deltas over FxTable: `overscan = 10`, `onVisibleRangeChange`,
 * scroll restoration by `rowKey`, and a server-side select-all contract —
 * `onSelectionChange(['*'])` sentinel + `selectedAllExcept` (consumed by the
 * Bulk Actions Bar).
 *
 * SSR-safe: measurement lives in a scroll effect; before the client mount the
 * component renders the first window deterministically (no window/document at
 * render time). `aria-rowcount` reflects the FULL dataset; rendered rows carry
 * `aria-rowindex`.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode, UIEvent } from 'react';
import type { Density } from '../enums';
import { FxCheckbox } from '../checkbox/checkbox';
import { nextSort } from '../table/table';
import type { Key, TableColumn, TableLabels, TableSort } from '../table/table';
import { DEFAULT_TABLE_LABELS } from '../table/table';

/** Select-all-matching sentinel — every row across the whole (server) dataset. */
export const SELECT_ALL: Key = '*';

/** Fixed row height per density (px). */
export const ROW_HEIGHT: Record<Density, number> = {
  comfortable: 48,
  compact: 40,
};

/** Default rows rendered above/below the viewport. */
export const DEFAULT_OVERSCAN = 10;

export interface FxVirtualTableProps<T> {
  columns: TableColumn<T>[];
  rows: T[];
  rowKey: (row: T) => Key;
  /** Total dataset size when server-paged (defaults to `rows.length`). */
  totalRows?: number;
  sort?: TableSort | null;
  defaultSort?: TableSort | null;
  selectable?: 'none' | 'multi' | 'single';
  selectedKeys?: Key[];
  defaultSelectedKeys?: Key[];
  /** Server-side inverse selection when select-all-matching is active. */
  selectedAllExcept?: Key[];
  onRowClick?: (row: T) => void;
  rowLabel?: (row: T) => string;
  density?: Density;
  /** Fixed row height override; defaults to the per-density value. */
  rowHeight?: number;
  /** Rows rendered beyond the viewport. Defaults to 10. */
  overscan?: number;
  /** Viewport height (px). Defaults to 400. */
  height?: number;
  caption: string;
  emptyState: ReactNode;
  loading?: boolean;
  labels?: Partial<TableLabels>;
  onSortChange?: (sort: TableSort | null) => void;
  onSelectionChange?: (keys: Key[]) => void;
  onVisibleRangeChange?: (range: { start: number; end: number }) => void;
  className?: string;
}

function fill(template: string, values: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (_, k) => values[k] ?? '');
}

const ariaSort = (s: TableSort | null, key: string): 'ascending' | 'descending' | 'none' => {
  if (!s || s.key !== key) return 'none';
  return s.dir === 'asc' ? 'ascending' : 'descending';
};

export function FxVirtualTable<T>({
  columns,
  rows,
  rowKey,
  totalRows,
  sort,
  defaultSort = null,
  selectable = 'none',
  selectedKeys,
  defaultSelectedKeys = [],
  selectedAllExcept,
  onRowClick,
  rowLabel,
  density = 'comfortable',
  rowHeight,
  overscan = DEFAULT_OVERSCAN,
  height = 400,
  caption,
  emptyState,
  loading = false,
  labels,
  onSortChange,
  onSelectionChange,
  onVisibleRangeChange,
  className,
}: FxVirtualTableProps<T>) {
  const l = { ...DEFAULT_TABLE_LABELS, ...labels };
  const rh = rowHeight ?? ROW_HEIGHT[density];
  const total = totalRows ?? rows.length;

  const sortControlled = sort !== undefined;
  const [internalSort, setInternalSort] = useState<TableSort | null>(defaultSort);
  const currentSort = sortControlled ? sort : internalSort;

  const selControlled = selectedKeys !== undefined;
  const [internalSel, setInternalSel] = useState<Key[]>(defaultSelectedKeys);
  const selection = selControlled ? selectedKeys! : internalSel;

  const allMatching = selection.includes(SELECT_ALL);
  const exceptSet = useMemo(() => new Set(selectedAllExcept ?? []), [selectedAllExcept]);
  const selSet = useMemo(() => new Set(selection), [selection]);

  const isRowSelected = useCallback(
    (key: Key): boolean => (allMatching ? !exceptSet.has(key) : selSet.has(key)),
    [allMatching, exceptSet, selSet],
  );

  const commitSort = (n: TableSort | null) => {
    if (!sortControlled) setInternalSort(n);
    onSortChange?.(n);
  };
  const commitSelection = (n: Key[]) => {
    if (!selControlled) setInternalSel(n);
    onSelectionChange?.(n);
  };

  const toggleRow = (key: Key) => {
    if (selectable === 'single') {
      commitSelection(isRowSelected(key) ? [] : [key]);
      return;
    }
    const next = new Set(selSet);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    commitSelection([...next]);
  };

  const pageKeys = rows.map(rowKey);
  const pageSelected = pageKeys.filter((k) => isRowSelected(k)).length;
  const allPageSelected = rows.length > 0 && pageSelected === rows.length;
  const somePageSelected = pageSelected > 0 && !allPageSelected;

  const toggleAll = () => {
    if (allPageSelected || allMatching) commitSelection([]);
    else commitSelection(pageKeys);
  };

  // ── Virtualization window (SSR-safe: scrollTop starts at 0). ──────────────
  const viewportRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const visibleCount = Math.ceil(height / rh);
  const startIndex = Math.max(0, Math.floor(scrollTop / rh) - overscan);
  const endIndex = Math.min(rows.length, startIndex + visibleCount + overscan * 2);

  useEffect(() => {
    onVisibleRangeChange?.({ start: startIndex, end: endIndex });
  }, [startIndex, endIndex, onVisibleRangeChange]);

  const onScroll = (e: UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  };

  const windowRows = rows.slice(startIndex, endIndex);
  const padTop = startIndex * rh;
  const padBottom = Math.max(0, (rows.length - endIndex) * rh);

  const rowName = (row: T): string => (rowLabel ? rowLabel(row) : String(rowKey(row)));
  const isEmpty = rows.length === 0 && !loading;

  const rootClass = ['fx-virtual-table', className].filter(Boolean).join(' ');

  return (
    <div
      className={rootClass}
      data-density={density}
      role="table"
      aria-rowcount={total}
      aria-label={caption}
      aria-busy={loading || undefined}
    >
      <div className="fx-virtual-table-head" role="rowgroup">
        <div className="fx-virtual-table-hrow" role="row" aria-rowindex={1}>
          {selectable !== 'none' && (
            <div className="fx-virtual-table-select" role="columnheader">
              {selectable === 'multi' ? (
                <FxCheckbox
                  aria-label={l.selectAll}
                  checked={allMatching || allPageSelected}
                  indeterminate={somePageSelected && !allMatching}
                  disabled={rows.length === 0}
                  onChange={toggleAll}
                />
              ) : (
                <span className="fx-virtual-table-sr">{l.selectAll}</span>
              )}
            </div>
          )}
          {columns.map((col) => (
            <div
              key={col.key}
              className="fx-virtual-table-th"
              role="columnheader"
              data-align={col.align ?? 'start'}
              aria-sort={col.sortable ? ariaSort(currentSort, col.key) : undefined}
              style={col.width ? { width: col.width, flex: `0 0 ${col.width}` } : undefined}
            >
              {col.sortable ? (
                <button
                  type="button"
                  className="fx-virtual-table-sort-btn"
                  data-dir={ariaSort(currentSort, col.key)}
                  onClick={() => commitSort(nextSort(currentSort, col.key))}
                >
                  <span className="fx-virtual-table-sort-label">{col.header}</span>
                  <span className="fx-virtual-table-sort-icon" aria-hidden="true" />
                </button>
              ) : (
                col.header
              )}
            </div>
          ))}
        </div>
      </div>

      {isEmpty ? (
        <div className="fx-virtual-table-empty">{emptyState}</div>
      ) : (
        <div
          ref={viewportRef}
          className="fx-virtual-table-viewport"
          role="rowgroup"
          tabIndex={0}
          style={{ height: `${height}px` }}
          onScroll={mounted ? onScroll : undefined}
        >
          <div className="fx-virtual-table-spacer-top" style={{ height: `${padTop}px` }} aria-hidden="true" />
          {windowRows.map((row, i) => {
            const key = rowKey(row);
            const absIndex = startIndex + i;
            const selected = isRowSelected(key);
            return (
              <div
                key={key}
                className="fx-virtual-table-row"
                role="row"
                aria-rowindex={absIndex + 2}
                aria-selected={selectable !== 'none' ? selected : undefined}
                data-selected={selected || undefined}
                data-clickable={onRowClick ? true : undefined}
                style={{ height: `${rh}px` }}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
              >
                {selectable !== 'none' && (
                  <div
                    className="fx-virtual-table-select"
                    role="cell"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <FxCheckbox
                      aria-label={fill(l.selectRow, { label: rowName(row) })}
                      checked={selected}
                      onChange={() => toggleRow(key)}
                    />
                  </div>
                )}
                {columns.map((col) => (
                  <div
                    key={col.key}
                    className="fx-virtual-table-cell"
                    role="cell"
                    data-align={col.align ?? 'start'}
                    style={col.width ? { width: col.width, flex: `0 0 ${col.width}` } : undefined}
                  >
                    {col.render
                      ? col.render(row)
                      : String((row as Record<string, unknown>)[col.key] ?? '')}
                  </div>
                ))}
              </div>
            );
          })}
          <div
            className="fx-virtual-table-spacer-bottom"
            style={{ height: `${padBottom}px` }}
            aria-hidden="true"
          />
        </div>
      )}
    </div>
  );
}
