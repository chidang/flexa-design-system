'use client';
/**
 * FxBulkActionsBar — the toolbar that appears when a selection exists (doc 04 §3.5).
 *
 * Standalone: it consumes the Virtual Table `'*'` select-all-matching contract
 * (a "Select all {total}" affordance) and renders ≤4 action buttons + overflow.
 * `role="toolbar"` labelled by the count; the count change announces politely and
 * the appearing bar does NOT steal focus. Destructive actions are marked `danger`
 * (the host is expected to gate them behind a Confirmation Dialog with the count
 * in the title). Async `onAction` drives a per-action busy state.
 *
 * SSR-safe: the overflow popover is gated on `open && mounted`, so no dangling
 * IDREF is emitted statically; nothing touches window/document at render time.
 */
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { FxIcon } from '../icon/FxIcon';
import type { IconName } from '../icon/map';

/** One bulk action. */
export interface BulkAction {
  id: string;
  label: string;
  icon?: IconName;
  /** `'danger'` renders the destructive treatment. */
  tone?: 'danger';
  disabled?: boolean;
}

/** i18n strings. */
export interface BulkActionsLabels {
  /** `{n}` replaced with the selected count. */
  selected: string;
  /** `{total}` replaced with the total count. */
  selectAll: string;
  clear: string;
  /** Accessible name for the toolbar. */
  toolbar: string;
  /** Overflow menu trigger label. */
  more: string;
}

export const DEFAULT_BULK_ACTIONS_LABELS: BulkActionsLabels = {
  selected: '{n} selected',
  selectAll: 'Select all {total}',
  clear: 'Clear selection',
  toolbar: 'Bulk actions',
  more: 'More actions',
};

export interface FxBulkActionsBarProps {
  /** Current selection size. The bar renders only when > 0. */
  selectedCount: number;
  /** Total matching count (enables "Select all {total}"). */
  totalCount?: number;
  /** Actions; the first 4 render inline, the rest go to an overflow menu. */
  actions: BulkAction[];
  /** Max inline buttons before overflow. Defaults to 4. */
  maxInline?: number;
  labels?: Partial<BulkActionsLabels>;
  /** Run an action; may be async (drives a busy state). */
  onAction: (id: string) => void | Promise<void>;
  onClearSelection: () => void;
  /** Virtual Table `'*'` contract: select every matching row. */
  onSelectAllMatching?: () => void;
  /** True once the whole matching set is selected (hides the affordance). */
  allMatchingSelected?: boolean;
  className?: string;
}

function fill(template: string, values: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (_, k) => values[k] ?? '');
}

export function FxBulkActionsBar({
  selectedCount,
  totalCount,
  actions,
  maxInline = 4,
  labels,
  onAction,
  onClearSelection,
  onSelectAllMatching,
  allMatchingSelected = false,
  className,
}: FxBulkActionsBarProps) {
  const l = { ...DEFAULT_BULK_ACTIONS_LABELS, ...labels };

  const [busyId, setBusyId] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const moreRef = useRef<HTMLButtonElement>(null);
  const menuId = 'fx-bulk-actions-menu';

  const run = async (id: string) => {
    setBusyId(id);
    try {
      await onAction(id);
    } finally {
      setBusyId(null);
      setMenuOpen(false);
    }
  };

  // The bar is inert with no selection (render nothing).
  if (selectedCount <= 0) return null;

  const inline = actions.slice(0, maxInline);
  const overflow = actions.slice(maxInline);

  const showSelectAll =
    onSelectAllMatching != null &&
    !allMatchingSelected &&
    totalCount != null &&
    totalCount > selectedCount;

  const rootClass = ['fx-bulk-actions-bar', className].filter(Boolean).join(' ');

  return (
    <div className={rootClass} role="toolbar" aria-label={l.toolbar}>
      <span className="fx-bulk-actions-bar-count" role="status">
        {fill(l.selected, { n: String(selectedCount) })}
      </span>

      {showSelectAll && (
        <button
          type="button"
          className="fx-bulk-actions-bar-select-all"
          onClick={onSelectAllMatching}
        >
          {fill(l.selectAll, { total: String(totalCount) })}
        </button>
      )}

      <div className="fx-bulk-actions-bar-spacer" />

      <div className="fx-bulk-actions-bar-actions">
        {inline.map((action) => (
          <button
            key={action.id}
            type="button"
            className="fx-bulk-actions-bar-action"
            data-tone={action.tone ?? undefined}
            disabled={action.disabled || busyId !== null}
            aria-busy={busyId === action.id || undefined}
            onClick={() => void run(action.id)}
          >
            {action.icon && (
              <span className="fx-bulk-actions-bar-action-icon" aria-hidden="true">
                <FxIcon name={action.icon} size={16} />
              </span>
            )}
            {action.label}
          </button>
        ))}

        {overflow.length > 0 && (
          <button
            ref={moreRef}
            type="button"
            className="fx-bulk-actions-bar-more"
            aria-label={l.more}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            aria-controls={menuOpen && mounted ? menuId : undefined}
            disabled={busyId !== null}
            onClick={() => setMenuOpen((o) => !o)}
          >
            <FxIcon name="more" size={16} />
          </button>
        )}
      </div>

      <button
        type="button"
        className="fx-bulk-actions-bar-clear"
        aria-label={l.clear}
        disabled={busyId !== null}
        onClick={onClearSelection}
      >
        <FxIcon name="close" size={16} />
      </button>

      {menuOpen &&
        mounted &&
        createPortal(
          <ul className="fx-bulk-actions-bar-menu" id={menuId} role="menu" aria-label={l.more}>
            {overflow.map((action) => (
              <li key={action.id} role="none">
                <button
                  type="button"
                  role="menuitem"
                  className="fx-bulk-actions-bar-menu-item"
                  data-tone={action.tone ?? undefined}
                  disabled={action.disabled || busyId !== null}
                  onClick={() => void run(action.id)}
                >
                  {action.icon && (
                    <span aria-hidden="true">
                      <FxIcon name={action.icon} size={16} />
                    </span>
                  )}
                  {action.label}
                </button>
              </li>
            ))}
          </ul>,
          document.body,
        )}
    </div>
  );
}
