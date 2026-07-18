'use client';
/**
 * FxDataGrid — spreadsheet-class grid (doc 04 §2.22, APG grid pattern).
 *
 * Distinct role from FxTable: `role="grid"` with keyboard cell navigation
 * (single tab stop + roving focus), inline editing, and virtualization-ready
 * ARIA (`aria-rowcount`/`aria-colcount` = totals; `aria-rowindex`/`aria-colindex`
 * on rows/cells). Reuses TableColumn/selection concepts but is a separate
 * implementation. Use FxTable unless cell navigation/editing is needed.
 *
 * SSR-safe: no window/document at render; the roving focus + editor mount live
 * in effects/handlers. The editor popover is gated on `open && mounted` so no
 * dangling `aria-activedescendant`/IDREF is emitted statically. A `role="status"`
 * region announces selection count + edit commit/failure.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { KeyboardEvent, ReactNode } from 'react';
import type { Density } from '../enums';
import type { Key, TableSort } from '../table/table';
import { nextSort } from '../table/table';

/** Inline editor kind for an editable column. */
export type GridEditorType = 'text' | 'number' | 'select' | 'date';

/** Option for a `select` editor. */
export interface GridOption {
  value: string;
  label: string;
}

/** Column definition — TableColumn concepts + grid-only editing/layout flags. */
export interface GridColumn<T> {
  key: string;
  header: string;
  sortable?: boolean;
  align?: 'start' | 'end' | 'center';
  width?: string;
  /** Pin to an edge. */
  pinned?: 'start' | 'end';
  render?: (row: T) => ReactNode;
  /** Editable cell: `true` = text, or a typed editor spec. */
  editable?: boolean | { editor: GridEditorType; options?: GridOption[] };
  resizable?: boolean;
  reorderable?: boolean;
  pinnable?: boolean;
}

/** One cell coordinate. */
export interface CellPos {
  row: number;
  col: number;
}

/** i18n strings. */
export interface DataGridLabels {
  selectAll: string;
  /** `{label}` replaced with the row caption. */
  selectRow: string;
  /** `{n}` replaced with the selection count. */
  selectionStatus: string;
  editCommitted: string;
  editFailed: string;
}

export const DEFAULT_DATA_GRID_LABELS: DataGridLabels = {
  selectAll: 'Select all rows',
  selectRow: 'Select row {label}',
  selectionStatus: '{n} selected',
  editCommitted: 'Cell updated',
  editFailed: 'Update failed, value reverted',
};

export interface CellEdit {
  rowKey: Key;
  columnKey: string;
  value: unknown;
  previous: unknown;
}

export interface ColumnState {
  order: string[];
  widths: Record<string, number>;
  pinned: Record<string, 'start' | 'end'>;
}

export interface FxDataGridProps<T> {
  columns: GridColumn<T>[];
  rows: T[];
  rowKey: (row: T) => Key;
  sort?: TableSort | null;
  defaultSort?: TableSort | null;
  selectable?: 'none' | 'multi' | 'single';
  selectedKeys?: Key[];
  defaultSelectedKeys?: Key[];
  rowLabel?: (row: T) => string;
  density?: Density;
  loading?: boolean;
  caption: string;
  emptyState: ReactNode;
  labels?: Partial<DataGridLabels>;
  onSortChange?: (sort: TableSort | null) => void;
  onSelectionChange?: (keys: Key[]) => void;
  /** Commit a cell edit; throw/reject to revert + announce the failure. */
  onCellEdit?: (edit: CellEdit) => void | Promise<void>;
  className?: string;
}

const ariaSort = (s: TableSort | null, key: string): 'ascending' | 'descending' | 'none' => {
  if (!s || s.key !== key) return 'none';
  return s.dir === 'asc' ? 'ascending' : 'descending';
};

function fill(template: string, values: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (_, k) => values[k] ?? '');
}

function editorOf<T>(col: GridColumn<T>): { editor: GridEditorType; options?: GridOption[] } | null {
  if (!col.editable) return null;
  if (col.editable === true) return { editor: 'text' };
  return col.editable;
}

export function FxDataGrid<T>({
  columns,
  rows,
  rowKey,
  sort,
  defaultSort = null,
  selectable = 'none',
  selectedKeys,
  defaultSelectedKeys = [],
  rowLabel,
  density = 'comfortable',
  loading = false,
  caption,
  emptyState,
  labels,
  onSortChange,
  onSelectionChange,
  onCellEdit,
  className,
}: FxDataGridProps<T>) {
  const l = { ...DEFAULT_DATA_GRID_LABELS, ...labels };

  const sortControlled = sort !== undefined;
  const [internalSort, setInternalSort] = useState<TableSort | null>(defaultSort);
  const currentSort = sortControlled ? sort : internalSort;

  const selControlled = selectedKeys !== undefined;
  const [internalSel, setInternalSel] = useState<Key[]>(defaultSelectedKeys);
  const selection = selControlled ? selectedKeys! : internalSel;
  const selSet = useMemo(() => new Set(selection), [selection]);

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Roving focus: which cell is the single tab stop. Column 0 = select column
  // when present, else first data column.
  const hasSelectCol = selectable !== 'none';
  const dataColStart = hasSelectCol ? 1 : 0;
  const [focus, setFocus] = useState<CellPos>({ row: 0, col: dataColStart });
  const [editing, setEditing] = useState<CellPos | null>(null);
  const [draft, setDraft] = useState<string>('');
  const [statusMsg, setStatusMsg] = useState<string>('');

  const gridRef = useRef<HTMLDivElement>(null);
  const totalCols = columns.length + (hasSelectCol ? 1 : 0);

  const commitSort = (n: TableSort | null) => {
    if (!sortControlled) setInternalSort(n);
    onSortChange?.(n);
  };
  const commitSelection = (n: Key[]) => {
    if (!selControlled) setInternalSel(n);
    onSelectionChange?.(n);
    setStatusMsg(fill(l.selectionStatus, { n: String(n.length) }));
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
  const toggleAll = () => commitSelection(allSelected ? [] : allKeys);

  const clampCol = (c: number) => Math.max(dataColStart === 0 ? 0 : 0, Math.min(totalCols - 1, c));
  const rowName = (row: T): string => (rowLabel ? rowLabel(row) : String(rowKey(row)));

  const dataColIndex = (col: number) => (hasSelectCol ? col - 1 : col);

  const startEdit = useCallback(
    (pos: CellPos) => {
      const col = columns[dataColIndex(pos.col)];
      if (!col || !editorOf(col)) return;
      const row = rows[pos.row];
      if (!row) return;
      const raw = (row as Record<string, unknown>)[col.key];
      setDraft(raw == null ? '' : String(raw));
      setEditing(pos);
    },
    [columns, rows, hasSelectCol],
  );

  const cancelEdit = () => setEditing(null);

  const commitEdit = useCallback(
    async (pos: CellPos, value: string) => {
      const col = columns[dataColIndex(pos.col)];
      const row = rows[pos.row];
      setEditing(null);
      if (!col || !row) return;
      const previous = (row as Record<string, unknown>)[col.key];
      const spec = editorOf(col);
      const parsed = spec?.editor === 'number' ? Number(value) : value;
      try {
        await onCellEdit?.({ rowKey: rowKey(row), columnKey: col.key, value: parsed, previous });
        setStatusMsg(l.editCommitted);
      } catch {
        setStatusMsg(l.editFailed);
      }
    },
    [columns, rows, rowKey, onCellEdit, l.editCommitted, l.editFailed, hasSelectCol],
  );

  const move = (dRow: number, dCol: number) => {
    setFocus((f) => ({
      row: Math.max(0, Math.min(rows.length - 1, f.row + dRow)),
      col: clampCol(f.col + dCol),
    }));
  };

  const onGridKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (editing) return; // editor owns keys while open
    const key = e.key;
    if (key === 'ArrowRight') {
      e.preventDefault();
      move(0, 1);
    } else if (key === 'ArrowLeft') {
      e.preventDefault();
      move(0, -1);
    } else if (key === 'ArrowDown') {
      e.preventDefault();
      move(1, 0);
    } else if (key === 'ArrowUp') {
      e.preventDefault();
      move(-1, 0);
    } else if (key === 'Home') {
      e.preventDefault();
      if (e.ctrlKey) setFocus({ row: 0, col: dataColStart });
      else setFocus((f) => ({ ...f, col: dataColStart }));
    } else if (key === 'End') {
      e.preventDefault();
      if (e.ctrlKey) setFocus({ row: rows.length - 1, col: totalCols - 1 });
      else setFocus((f) => ({ ...f, col: totalCols - 1 }));
    } else if (key === 'Enter' || key === 'F2') {
      const col = columns[dataColIndex(focus.col)];
      if (col && editorOf(col)) {
        e.preventDefault();
        startEdit(focus);
      }
    } else if (key === ' ') {
      if (hasSelectCol && focus.col === 0) {
        e.preventDefault();
        const row = rows[focus.row];
        if (row) toggleRow(rowKey(row));
      }
    } else if (key === 'a' && (e.ctrlKey || e.metaKey) && selectable === 'multi') {
      e.preventDefault();
      toggleAll();
    }
  };

  const onEditorKeyDown = (e: KeyboardEvent<HTMLInputElement | HTMLSelectElement>, pos: CellPos) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      cancelEdit();
      setFocus(pos);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();
      void commitEdit(pos, draft);
      setFocus({ row: Math.min(rows.length - 1, pos.row + 1), col: pos.col });
    } else if (e.key === 'Tab') {
      e.preventDefault();
      e.stopPropagation();
      void commitEdit(pos, draft);
      setFocus({ row: pos.row, col: clampCol(pos.col + 1) });
    }
  };

  const isEmpty = rows.length === 0 && !loading;

  const isFocused = (r: number, c: number) => focus.row === r && focus.col === c;
  const isEditingCell = (r: number, c: number) => editing?.row === r && editing.col === c;

  const rootClass = ['fx-data-grid', className].filter(Boolean).join(' ');

  return (
    <div className={rootClass} data-density={density} data-loading={loading || undefined}>
      <div
        ref={gridRef}
        role="grid"
        className="fx-data-grid-grid"
        aria-label={caption}
        aria-rowcount={rows.length + 1}
        aria-colcount={totalCols}
        aria-busy={loading || undefined}
        onKeyDown={onGridKeyDown}
      >
        {/* Header row. */}
        <div className="fx-data-grid-header" role="row" aria-rowindex={1}>
          {hasSelectCol && (
            <div
              className="fx-data-grid-hcell fx-data-grid-select"
              role="columnheader"
              aria-colindex={1}
            >
              {selectable === 'multi' ? (
                <input
                  type="checkbox"
                  className="fx-data-grid-checkbox"
                  aria-label={l.selectAll}
                  checked={allSelected}
                  ref={(el) => {
                    if (el) el.indeterminate = someSelected;
                  }}
                  onChange={toggleAll}
                />
              ) : (
                <span className="fx-data-grid-sr">{l.selectAll}</span>
              )}
            </div>
          )}
          {columns.map((col, ci) => {
            const colIndex = ci + (hasSelectCol ? 1 : 0);
            return (
              <div
                key={col.key}
                className="fx-data-grid-hcell"
                role="columnheader"
                aria-colindex={colIndex + 1}
                data-align={col.align ?? 'start'}
                data-pinned={col.pinned ?? undefined}
                aria-sort={col.sortable ? ariaSort(currentSort, col.key) : undefined}
                style={col.width ? { width: col.width, flex: `0 0 ${col.width}` } : undefined}
              >
                {col.sortable ? (
                  <button
                    type="button"
                    className="fx-data-grid-sort-btn"
                    data-dir={ariaSort(currentSort, col.key)}
                    tabIndex={-1}
                    onClick={() => commitSort(nextSort(currentSort, col.key))}
                  >
                    <span>{col.header}</span>
                    <span className="fx-data-grid-sort-icon" aria-hidden="true" />
                  </button>
                ) : (
                  col.header
                )}
                {col.resizable !== false && (
                  <span className="fx-data-grid-resizer" aria-hidden="true" />
                )}
              </div>
            );
          })}
        </div>

        {/* Body. */}
        {isEmpty ? (
          <div className="fx-data-grid-empty" role="row">
            <div role="gridcell" aria-colindex={1} className="fx-data-grid-empty-cell">
              {emptyState}
            </div>
          </div>
        ) : (
          rows.map((row, ri) => {
            const key = rowKey(row);
            const selected = selSet.has(key);
            return (
              <div
                key={key}
                className="fx-data-grid-row"
                role="row"
                aria-rowindex={ri + 2}
                aria-selected={hasSelectCol ? selected : undefined}
                data-selected={selected || undefined}
              >
                {hasSelectCol && (
                  <div
                    className="fx-data-grid-cell fx-data-grid-select"
                    role="gridcell"
                    aria-colindex={1}
                    tabIndex={isFocused(ri, 0) ? 0 : -1}
                    data-focused={isFocused(ri, 0) || undefined}
                    onFocus={() => setFocus({ row: ri, col: 0 })}
                  >
                    <input
                      type="checkbox"
                      className="fx-data-grid-checkbox"
                      aria-label={fill(l.selectRow, { label: rowName(row) })}
                      checked={selected}
                      tabIndex={-1}
                      onChange={() => toggleRow(key)}
                    />
                  </div>
                )}
                {columns.map((col, ci) => {
                  const colIndex = ci + (hasSelectCol ? 1 : 0);
                  const focused = isFocused(ri, colIndex);
                  const cellEditing = isEditingCell(ri, colIndex);
                  const spec = editorOf(col);
                  const raw = (row as Record<string, unknown>)[col.key];
                  return (
                    <div
                      key={col.key}
                      className="fx-data-grid-cell"
                      role="gridcell"
                      aria-colindex={colIndex + 1}
                      data-align={col.align ?? 'start'}
                      data-pinned={col.pinned ?? undefined}
                      data-focused={focused || undefined}
                      data-editing={cellEditing || undefined}
                      tabIndex={focused && !cellEditing ? 0 : -1}
                      style={col.width ? { width: col.width, flex: `0 0 ${col.width}` } : undefined}
                      onFocus={() => setFocus({ row: ri, col: colIndex })}
                      onDoubleClick={spec ? () => startEdit({ row: ri, col: colIndex }) : undefined}
                    >
                      {cellEditing && mounted && spec ? (
                        <span className="fx-data-grid-editor">
                          {spec.editor === 'select' ? (
                            <select
                              className="fx-data-grid-editor-input"
                              aria-label={col.header}
                              autoFocus
                              value={draft}
                              onChange={(e) => setDraft(e.target.value)}
                              onKeyDown={(e) => onEditorKeyDown(e, { row: ri, col: colIndex })}
                              onBlur={() => void commitEdit({ row: ri, col: colIndex }, draft)}
                            >
                              {(spec.options ?? []).map((o) => (
                                <option key={o.value} value={o.value}>
                                  {o.label}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <input
                              className="fx-data-grid-editor-input"
                              aria-label={col.header}
                              type={spec.editor === 'number' ? 'number' : spec.editor === 'date' ? 'date' : 'text'}
                              autoFocus
                              value={draft}
                              onChange={(e) => setDraft(e.target.value)}
                              onKeyDown={(e) => onEditorKeyDown(e, { row: ri, col: colIndex })}
                              onBlur={() => void commitEdit({ row: ri, col: colIndex }, draft)}
                            />
                          )}
                        </span>
                      ) : col.render ? (
                        col.render(row)
                      ) : (
                        String(raw ?? '')
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })
        )}
      </div>

      <div className="fx-data-grid-status" role="status">
        {statusMsg}
      </div>
    </div>
  );
}
