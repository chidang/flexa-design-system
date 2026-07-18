'use client';
/**
 * FxDataManagementToolbar — the command strip above every admin collection
 * (doc 04 §3.9 "FxDataManagementToolbar — Data Management Toolbar").
 *
 * `.fx-data-toolbar[role=toolbar]`: one tab stop, `Arrow` roving between the
 * controls (APG toolbar). Composes Search Bar + Advanced Filters + Saved Filters
 * + a column-visibility Context Menu (checkable) + a density toggle + export /
 * refresh buttons + a primary create Button slot (`actions`). An optional result
 * count line sits below. Every user-facing string is a prop; presentation is
 * token-only.
 */
import { useRef } from 'react';
import type { KeyboardEvent, ReactNode } from 'react';
import type { Density } from '../enums';
import { FxSearchBar } from '../search-bar/search-bar';
import { FxContextMenu, type MenuItem } from '../context-menu/context-menu';
import { FxIcon } from '../icon/FxIcon';
import { FxAdvancedFilters, type FilterField, type FilterValue } from '../advanced-filters/advanced-filters';
import { FxSavedFilters, type SavedFilter } from '../saved-filters/saved-filters';

/** One toggleable table column. */
export interface ToolbarColumn {
  key: string;
  label: string;
  visible: boolean;
}

/** Baked-in strings — every one a prop (§i18n). */
export interface DataManagementToolbarLabels {
  toolbar: string;
  columns: string;
  columnsHeading: string;
  density: string;
  densityComfortable: string;
  densityCompact: string;
  export: string;
  refresh: string;
  /** `{count}` substituted with the result total. */
  resultCount: string;
}

export const DEFAULT_DATA_MANAGEMENT_TOOLBAR_LABELS: DataManagementToolbarLabels = {
  toolbar: 'List controls',
  columns: 'Columns',
  columnsHeading: 'Visible columns',
  density: 'Density',
  densityComfortable: 'Comfortable',
  densityCompact: 'Compact',
  export: 'Export',
  refresh: 'Refresh',
  resultCount: '{count} results',
};

export interface FxDataManagementToolbarProps {
  /** Controlled search query, passed to FxSearchBar. */
  search?: string;
  onSearch?: (query: string) => void;
  searchPlaceholder?: string;
  /** Advanced-filters field catalog; enables the filter region when set. */
  filterFields?: FilterField[];
  /** Applied filter conditions (controlled). */
  filters?: FilterValue[];
  onFilterChange?: (filters: FilterValue[]) => void;
  /** Saved views; enables the Saved Filters region when set. */
  savedFilters?: SavedFilter[];
  activeSavedId?: string | null;
  onActiveSavedChange?: (id: string | null) => void;
  onSaveView?: (name: string, filters: FilterValue[]) => void;
  canManageViews?: boolean;
  /** Column-visibility set; enables the columns menu when set. */
  columns?: ToolbarColumn[];
  onColumnsChange?: (columns: ToolbarColumn[]) => void;
  /** Density toggle. Omit `onDensityChange` to hide the toggle. */
  density?: Density;
  onDensityChange?: (density: Density) => void;
  /** Export current (filtered) results. */
  onExport?: () => void;
  /** Refresh / refetch. */
  onRefresh?: () => void;
  /** Result total for the count line; omit to hide it. */
  resultCount?: number;
  /** Primary create Button slot (rightmost; at most one). */
  actions?: ReactNode;
  /** Baked-in strings. Merged over the English defaults. */
  labels?: Partial<DataManagementToolbarLabels>;
  className?: string;
}

export function FxDataManagementToolbar({
  search,
  onSearch,
  searchPlaceholder,
  filterFields,
  filters,
  onFilterChange,
  savedFilters,
  activeSavedId,
  onActiveSavedChange,
  onSaveView,
  canManageViews,
  columns,
  onColumnsChange,
  density,
  onDensityChange,
  onExport,
  onRefresh,
  resultCount,
  actions,
  labels,
  className,
}: FxDataManagementToolbarProps) {
  const l = { ...DEFAULT_DATA_MANAGEMENT_TOOLBAR_LABELS, ...labels };
  const toolbarRef = useRef<HTMLDivElement>(null);

  // APG toolbar roving: arrows move focus among the focusable controls; the
  // whole strip is one tab stop. Focus management stays lightweight — we query
  // the live focusables so composed portals/overlays don't need special-casing.
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft' && e.key !== 'Home' && e.key !== 'End') return;
    const root = toolbarRef.current;
    if (!root) return;
    const focusables = Array.from(
      root.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input:not([disabled]), [role="combobox"]:not([aria-disabled="true"])',
      ),
    ).filter((el) => el.offsetParent !== null || el === document.activeElement);
    if (focusables.length === 0) return;
    const idx = focusables.indexOf(document.activeElement as HTMLElement);
    if (idx === -1) return;
    e.preventDefault();
    let next = idx;
    if (e.key === 'ArrowRight') next = (idx + 1) % focusables.length;
    else if (e.key === 'ArrowLeft') next = (idx - 1 + focusables.length) % focusables.length;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = focusables.length - 1;
    focusables[next]?.focus();
  };

  const columnItems: MenuItem[] = (columns ?? []).map((c) => ({
    id: c.key,
    label: `${c.visible ? '✓ ' : ''}${c.label}`,
  }));

  const toggleColumn = (item: MenuItem) => {
    if (!columns) return;
    onColumnsChange?.(columns.map((c) => (c.key === item.id ? { ...c, visible: !c.visible } : c)));
  };

  const nextDensity: Density = density === 'compact' ? 'comfortable' : 'compact';

  const rootClass = ['fx-data-toolbar', className].filter(Boolean).join(' ');

  return (
    <div className={rootClass}>
      <div
        className="fx-data-toolbar-row"
        role="toolbar"
        aria-label={l.toolbar}
        aria-orientation="horizontal"
        ref={toolbarRef}
        onKeyDown={onKeyDown}
      >
        <div className="fx-data-toolbar-search">
          <FxSearchBar
            value={search}
            placeholder={searchPlaceholder}
            onSearch={onSearch}
            onChange={onSearch}
          />
        </div>

        {filterFields && filterFields.length > 0 && (
          <FxAdvancedFilters
            fields={filterFields}
            value={filters}
            onFilterChange={onFilterChange}
          />
        )}

        {savedFilters && (
          <FxSavedFilters
            views={savedFilters}
            activeId={activeSavedId}
            onActiveChange={onActiveSavedChange}
            onSave={onSaveView}
            currentFilters={filters}
            canManage={canManageViews}
          />
        )}

        <div className="fx-data-toolbar-spacer" />

        {onDensityChange && (
          <button
            type="button"
            className="fx-data-toolbar-btn"
            aria-label={l.density}
            aria-pressed={density === 'compact'}
            data-density={density}
            onClick={() => onDensityChange(nextDensity)}
          >
            <FxIcon name={density === 'compact' ? 'minus' : 'grid'} size={16} />
            <span className="fx-data-toolbar-btn-label">
              {density === 'compact' ? l.densityCompact : l.densityComfortable}
            </span>
          </button>
        )}

        {columns && columns.length > 0 && (
          <FxContextMenu
            items={columnItems}
            ariaLabel={l.columnsHeading}
            onSelect={toggleColumn}
            trigger={
              <button type="button" className="fx-data-toolbar-btn" aria-label={l.columns}>
                <FxIcon name="sliders" size={16} />
                <span className="fx-data-toolbar-btn-label">{l.columns}</span>
              </button>
            }
          />
        )}

        {onExport && (
          <button type="button" className="fx-data-toolbar-icon-btn" aria-label={l.export} onClick={onExport}>
            <FxIcon name="download" size={16} />
          </button>
        )}

        {onRefresh && (
          <button type="button" className="fx-data-toolbar-icon-btn" aria-label={l.refresh} onClick={onRefresh}>
            <FxIcon name="refresh" size={16} />
          </button>
        )}

        {actions != null && <div className="fx-data-toolbar-actions">{actions}</div>}
      </div>

      {resultCount != null && (
        <p className="fx-data-toolbar-count" aria-live="polite">
          {l.resultCount.replace('{count}', String(resultCount))}
        </p>
      )}
    </div>
  );
}
