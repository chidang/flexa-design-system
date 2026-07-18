'use client';
/**
 * FxMediaGrid — the file-manager tile grid (doc 04 §data-display,
 * "FxMediaGrid — Media Grid"). A responsive grid of media tiles (thumb + type
 * icon + name + meta) with an optional selection checkbox overlay and a
 * per-item context menu (Flexa Media).
 *
 * Accessibility: the grid is `role="grid"` with a SINGLE tab stop; 2-D `Arrow`
 * roving moves the focused cell, `Space` toggles selection, `Enter` opens the
 * item. Selection is controlled or uncontrolled (§1.5 `selectedKeys` /
 * `onSelectionChange`). Selection checkboxes carry an accessible name; the
 * per-item context menu (FxContextMenu) portals only after mount. SSR-safe: no
 * window/document/matchMedia touched during render; menu/portal gated on the
 * client-mount flag inside FxContextMenu.
 */
import { useCallback, useMemo, useRef, useState } from 'react';
import type { KeyboardEvent, ReactNode } from 'react';
import { FxIcon } from '../icon/FxIcon';
import type { IconName } from '../icon/map';
import { FxCheckbox } from '../checkbox/checkbox';
import { FxContextMenu, type MenuItem } from '../context-menu/context-menu';
import { FxEmptyState } from '../empty-state/empty-state';

/** Media kind — a local union (rule 6), documented in `props[]` as a type string. */
export type MediaKind = 'image' | 'video' | 'audio' | 'file';

/** One media tile. */
export interface MediaItem {
  id: string;
  name: string;
  kind: MediaKind;
  /** Optional preview image URL. */
  thumbnailUrl?: string;
  /** The resource URL (opened on Enter). */
  url: string;
  /** Byte size (formatted for the meta line). */
  size: number;
  /** ISO datetime the item was created. */
  createdAt: string;
}

/** i18n strings — every user-facing label is overridable. */
export interface MediaGridLabels {
  /** Accessible name for a tile's selection checkbox; `{name}` substituted. */
  select: string;
  /** Accessible name for a tile's context-menu trigger; `{name}` substituted. */
  actions: string;
}

export const DEFAULT_MEDIA_GRID_LABELS: MediaGridLabels = {
  select: 'Select {name}',
  actions: 'Actions for {name}',
};

export interface FxMediaGridProps {
  /** Items to display as tiles. */
  items: MediaItem[];
  /** Selection mode. Defaults to `'none'`. */
  selectable?: 'none' | 'multi';
  /** Controlled selected item ids (§1.5). */
  selectedKeys?: string[];
  /** Uncontrolled initial selection. */
  defaultSelectedKeys?: string[];
  /** Fires with the next full selection set. */
  onSelectionChange?: (keys: string[]) => void;
  /** Fires when a tile is opened (Enter / double-click). */
  onItemOpen?: (item: MediaItem) => void;
  /** Context-menu items per tile; receives the item. */
  itemActions?: (item: MediaItem) => MenuItem[];
  /** Fires when a per-item action is selected. */
  onItemAction?: (item: MediaItem, action: MenuItem) => void;
  /** Column strategy. `'auto'` fills at min tile 160px; a number fixes count. */
  columns?: 'auto' | number;
  /** Loading placeholder skeleton count (renders skeleton tiles). */
  loading?: boolean;
  /** Rendered when there are no items and not loading. */
  emptyState?: ReactNode;
  /** Overridable strings (i18n). */
  labels?: Partial<MediaGridLabels>;
  className?: string;
}

const KIND_ICON: Record<MediaKind, IconName> = {
  image: 'image',
  video: 'video',
  audio: 'music',
  file: 'file',
};

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const units = ['KB', 'MB', 'GB', 'TB'];
  let n = bytes / 1024;
  let i = 0;
  while (n >= 1024 && i < units.length - 1) {
    n /= 1024;
    i += 1;
  }
  return `${n.toFixed(n >= 10 || i === 0 ? 0 : 1)} ${units[i]}`;
}

function fill(template: string, name: string): string {
  return template.replace('{name}', name);
}

export function FxMediaGrid({
  items,
  selectable = 'none',
  selectedKeys,
  defaultSelectedKeys = [],
  onSelectionChange,
  onItemOpen,
  itemActions,
  onItemAction,
  columns = 'auto',
  loading = false,
  emptyState,
  labels,
  className,
}: FxMediaGridProps) {
  const controlled = selectedKeys !== undefined;
  const [internal, setInternal] = useState<string[]>(defaultSelectedKeys);
  const selected = controlled ? selectedKeys : internal;
  const selectedSet = useMemo(() => new Set(selected), [selected]);

  const [focusIndex, setFocusIndex] = useState(0);
  const cellRefs = useRef<Map<number, HTMLDivElement>>(new Map());

  const l: MediaGridLabels = { ...DEFAULT_MEDIA_GRID_LABELS, ...labels };

  const colCount = typeof columns === 'number' && columns > 0 ? columns : null;

  const commitSelection = useCallback(
    (next: string[]) => {
      if (!controlled) setInternal(next);
      onSelectionChange?.(next);
    },
    [controlled, onSelectionChange],
  );

  const toggle = useCallback(
    (id: string) => {
      if (selectable === 'none') return;
      const next = selectedSet.has(id)
        ? selected.filter((k) => k !== id)
        : [...selected, id];
      commitSelection(next);
    },
    [selectable, selectedSet, selected, commitSelection],
  );

  const focusCell = (i: number) => {
    setFocusIndex(i);
    cellRefs.current.get(i)?.focus();
  };

  // Column count for 2-D roving. Fixed columns are known; 'auto' falls back to a
  // linear (1-D) roving in the keyboard model (safe under SSR — no measuring).
  const cols = colCount ?? 1;

  const onKeyDown = (e: KeyboardEvent, i: number, item: MediaItem) => {
    const last = items.length - 1;
    switch (e.key) {
      case 'ArrowRight':
        e.preventDefault();
        focusCell(Math.min(i + 1, last));
        break;
      case 'ArrowLeft':
        e.preventDefault();
        focusCell(Math.max(i - 1, 0));
        break;
      case 'ArrowDown':
        e.preventDefault();
        focusCell(Math.min(i + cols, last));
        break;
      case 'ArrowUp':
        e.preventDefault();
        focusCell(Math.max(i - cols, 0));
        break;
      case 'Home':
        e.preventDefault();
        focusCell(0);
        break;
      case 'End':
        e.preventDefault();
        focusCell(last);
        break;
      case ' ':
        if (selectable !== 'none') {
          e.preventDefault();
          toggle(item.id);
        }
        break;
      case 'Enter':
        e.preventDefault();
        onItemOpen?.(item);
        break;
      default:
        break;
    }
  };

  const rootClass = ['fx-media-grid', className].filter(Boolean).join(' ');

  const gridStyle = colCount
    ? { gridTemplateColumns: `repeat(${colCount}, minmax(0, 1fr))` }
    : undefined;

  if (loading) {
    return (
      <div className={rootClass} data-loading="true" aria-busy="true" style={gridStyle}>
        {Array.from({ length: colCount ?? 6 }).map((_, i) => (
          <div key={i} className="fx-media-grid-skeleton" aria-hidden="true" />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className={rootClass} data-empty="true">
        {emptyState ?? (
          <FxEmptyState
            icon="grid"
            title="No media yet"
            description="Uploaded files will appear here."
          />
        )}
      </div>
    );
  }

  const renderTile = (item: MediaItem, i: number) => {
    const isSelected = selectedSet.has(item.id);
    const isFocusStop = i === focusIndex;
    const actions = itemActions?.(item) ?? [];
    return (
      <div
        key={item.id}
        className={['fx-media-grid-item', isSelected ? 'is-selected' : '']
          .filter(Boolean)
          .join(' ')}
        role="gridcell"
        ref={(el) => {
          if (el) cellRefs.current.set(i, el);
          else cellRefs.current.delete(i);
        }}
        tabIndex={isFocusStop ? 0 : -1}
        aria-selected={selectable !== 'none' ? isSelected : undefined}
        data-selected={isSelected || undefined}
        onKeyDown={(e) => onKeyDown(e, i, item)}
        onFocus={() => setFocusIndex(i)}
        onDoubleClick={() => onItemOpen?.(item)}
      >
        <div className="fx-media-grid-thumb">
          {item.thumbnailUrl ? (
            <img className="fx-media-grid-thumb-image" src={item.thumbnailUrl} alt="" />
          ) : (
            <span className="fx-media-grid-thumb-icon" aria-hidden="true">
              <FxIcon name={KIND_ICON[item.kind]} size={24} />
            </span>
          )}
          {selectable !== 'none' && (
            <span className="fx-media-grid-select">
              <FxCheckbox
                checked={isSelected}
                aria-label={fill(l.select, item.name)}
                tabIndex={-1}
                onChange={() => toggle(item.id)}
              />
            </span>
          )}
        </div>
        <div className="fx-media-grid-meta">
          <span className="fx-media-grid-type-icon" aria-hidden="true">
            <FxIcon name={KIND_ICON[item.kind]} size={16} />
          </span>
          <span className="fx-media-grid-name">{item.name}</span>
          {actions.length > 0 && (
            <span className="fx-media-grid-actions">
              <FxContextMenu
                items={actions}
                ariaLabel={fill(l.actions, item.name)}
                onSelect={(action) => onItemAction?.(item, action)}
                trigger={
                  <button
                    type="button"
                    className="fx-media-grid-actions-trigger"
                    aria-label={fill(l.actions, item.name)}
                    tabIndex={-1}
                  >
                    <FxIcon name="more" size={16} />
                  </button>
                }
              />
            </span>
          )}
        </div>
        <span className="fx-media-grid-size">{formatSize(item.size)}</span>
      </div>
    );
  };

  // Chunk into `role="row"` groups so the grid tree is grid > row > gridcell
  // (axe requires the row parent). Rows are `display:contents`, so the CSS grid
  // still lays out the cells directly. Fixed columns chunk by count; 'auto' uses
  // one row per tile (matches the 1-D keyboard model when width is unmeasured).
  const rowSize = colCount ?? 1;
  const rows: MediaItem[][] = [];
  for (let i = 0; i < items.length; i += rowSize) {
    rows.push(items.slice(i, i + rowSize));
  }

  return (
    <div
      className={rootClass}
      role="grid"
      aria-label="Media library"
      data-selectable={selectable}
      style={gridStyle}
    >
      {rows.map((row, r) => (
        <div key={r} className="fx-media-grid-row" role="row">
          {row.map((item, c) => renderTile(item, r * rowSize + c))}
        </div>
      ))}
    </div>
  );
}
