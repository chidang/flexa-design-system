'use client';
/**
 * FxSavedFilters — named, reusable filter+sort+column views (doc 04 §3.9
 * "FxSavedFilters — Saved Filters").
 *
 * A Select of saved views + a "Save current view…" action (opens a name Dialog)
 * + a per-item manage Context Menu (rename / set default / delete). Delete routes
 * through a Confirmation Dialog. Empty state reads "No saved views yet". Static
 * markup: the Select trigger + manage "⋯" button render server-side; the Dialog,
 * menu and confirm overlays are mounted-gated portals (rule 4). Every string is a
 * prop.
 */
import { useState } from 'react';
import { FxSelect, type OptionItem } from '../select/select';
import { FxContextMenu, type MenuItem } from '../context-menu/context-menu';
import { FxDialog } from '../dialog/dialog';
import { FxConfirmationDialog } from '../confirmation-dialog/confirmation-dialog';
import { FxButton } from '../button/button';
import { FxInput } from '../input/input';
import { FxIcon } from '../icon/FxIcon';
import type { FilterValue } from '../advanced-filters/advanced-filters';

/** A sort direction pair used inside a saved view. */
export interface SavedSort {
  key: string;
  dir: 'asc' | 'desc';
}

/** A named, reusable view: filters + optional sort + column set. */
export interface SavedFilter {
  id: string;
  name: string;
  filters: FilterValue[];
  sort?: SavedSort;
  columns?: string[];
  /** A system/undeletable default view. */
  default?: boolean;
  /** Team-visible (read-only unless owner/admin). */
  shared?: boolean;
}

/** Baked-in strings — every one a prop (§i18n). */
export interface SavedFiltersLabels {
  placeholder: string;
  saveCurrent: string;
  manage: string;
  rename: string;
  setDefault: string;
  delete: string;
  empty: string;
  shared: string;
  isDefault: string;
  saveTitle: string;
  nameLabel: string;
  namePlaceholder: string;
  saveConfirm: string;
  saveCancel: string;
  renameTitle: string;
  renameConfirm: string;
  deleteTitle: string;
  /** `{name}` substituted with the view being deleted. */
  deleteDescription: string;
  deleteConfirm: string;
  deleteCancel: string;
}

export const DEFAULT_SAVED_FILTERS_LABELS: SavedFiltersLabels = {
  placeholder: 'Saved views',
  saveCurrent: 'Save current view…',
  manage: 'Manage views',
  rename: 'Rename',
  setDefault: 'Set as default',
  delete: 'Delete',
  empty: 'No saved views yet',
  shared: 'Shared',
  isDefault: 'Default',
  saveTitle: 'Save current view',
  nameLabel: 'View name',
  namePlaceholder: 'e.g. Flagged this week',
  saveConfirm: 'Save view',
  saveCancel: 'Cancel',
  renameTitle: 'Rename view',
  renameConfirm: 'Rename',
  deleteTitle: 'Delete view',
  deleteDescription: 'Delete “{name}”? This cannot be undone.',
  deleteConfirm: 'Delete',
  deleteCancel: 'Cancel',
};

export interface FxSavedFiltersProps {
  /** All saved views. */
  views: SavedFilter[];
  /** Controlled active view id (§1.5). */
  activeId?: string | null;
  /** Fired when a view is applied. */
  onActiveChange?: (id: string | null) => void;
  /** Save current filters as a new named view. Omit to hide the save action
   *  (read-only surfacing). */
  onSave?: (name: string, filters: FilterValue[]) => void;
  /** The current builder filters, captured on Save. */
  currentFilters?: FilterValue[];
  onRename?: (id: string, name: string) => void;
  onDelete?: (id: string) => void;
  onSetDefault?: (id: string) => void;
  /** Whether rename / delete / set-default affordances show. */
  canManage?: boolean;
  /** Baked-in strings. Merged over the English defaults. */
  labels?: Partial<SavedFiltersLabels>;
  className?: string;
}

export function FxSavedFilters({
  views,
  activeId,
  onActiveChange,
  onSave,
  currentFilters = [],
  onRename,
  onDelete,
  onSetDefault,
  canManage = false,
  labels,
  className,
}: FxSavedFiltersProps) {
  const l = { ...DEFAULT_SAVED_FILTERS_LABELS, ...labels };

  const [saveOpen, setSaveOpen] = useState(false);
  const [saveName, setSaveName] = useState('');
  const [renameId, setRenameId] = useState<string | null>(null);
  const [renameName, setRenameName] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const activeView = views.find((v) => v.id === activeId) ?? null;

  const options: OptionItem[] = views.map((v) => ({
    value: v.id,
    label: v.name,
    description: [v.default ? l.isDefault : '', v.shared ? l.shared : ''].filter(Boolean).join(' · ') || undefined,
  }));

  const manageItems: MenuItem[] = [
    { id: 'rename', label: l.rename, icon: 'edit' },
    { id: 'set-default', label: l.setDefault, icon: 'star' },
    { id: 'delete', label: l.delete, icon: 'trash', tone: 'danger' },
  ];

  const onManageSelect = (item: MenuItem) => {
    if (!activeView) return;
    if (item.id === 'rename') {
      setRenameId(activeView.id);
      setRenameName(activeView.name);
    } else if (item.id === 'set-default') {
      onSetDefault?.(activeView.id);
    } else if (item.id === 'delete') {
      setDeleteId(activeView.id);
    }
  };

  const submitSave = () => {
    const name = saveName.trim();
    if (!name) return;
    onSave?.(name, currentFilters);
    setSaveName('');
    setSaveOpen(false);
  };

  const submitRename = () => {
    const name = renameName.trim();
    if (!name || !renameId) return;
    onRename?.(renameId, name);
    setRenameId(null);
  };

  const confirmDelete = () => {
    if (!deleteId) return;
    onDelete?.(deleteId);
    if (deleteId === activeId) onActiveChange?.(null);
    setDeleteId(null);
  };

  const deleteView = views.find((v) => v.id === deleteId) ?? null;
  const canManageActive = canManage && activeView !== null;
  const rootClass = ['fx-saved-filters', className].filter(Boolean).join(' ');

  return (
    <div className={rootClass}>
      {views.length === 0 ? (
        <span className="fx-saved-filters-empty">{l.empty}</span>
      ) : (
        <FxSelect
          className="fx-saved-filters-select"
          options={options}
          value={activeId ?? null}
          placeholder={l.placeholder}
          aria-label={l.placeholder}
          clearable
          onChange={(v) => onActiveChange?.(v)}
        />
      )}

      {/* No handler → no affordance (conditional-action convention, e.g.
          ProductCard cart/wishlist): read-only surfacings hide the save action. */}
      {onSave && (
        <FxButton
          variant="ghost"
          size="sm"
          iconStart={<FxIcon name="plus" size={16} />}
          onClick={() => setSaveOpen(true)}
        >
          {l.saveCurrent}
        </FxButton>
      )}

      {canManageActive && (
        <FxContextMenu
          items={manageItems}
          ariaLabel={l.manage}
          onSelect={onManageSelect}
          trigger={
            <button type="button" className="fx-saved-filters-manage" aria-label={l.manage}>
              <FxIcon name="more" size={16} />
            </button>
          }
        />
      )}

      <FxDialog
        open={saveOpen}
        onOpenChange={(o) => setSaveOpen(o)}
        title={l.saveTitle}
        size="sm"
        footer={
          <>
            <FxButton variant="secondary" onClick={() => setSaveOpen(false)}>
              {l.saveCancel}
            </FxButton>
            <FxButton variant="primary" onClick={submitSave} disabled={saveName.trim() === ''}>
              {l.saveConfirm}
            </FxButton>
          </>
        }
      >
        <label className="fx-saved-filters-field">
          <span className="fx-saved-filters-field-label">{l.nameLabel}</span>
          <FxInput
            value={saveName}
            placeholder={l.namePlaceholder}
            aria-label={l.nameLabel}
            onChange={(v) => setSaveName(v)}
            onEnter={submitSave}
          />
        </label>
      </FxDialog>

      <FxDialog
        open={renameId !== null}
        onOpenChange={(o) => {
          if (!o) setRenameId(null);
        }}
        title={l.renameTitle}
        size="sm"
        footer={
          <>
            <FxButton variant="secondary" onClick={() => setRenameId(null)}>
              {l.saveCancel}
            </FxButton>
            <FxButton variant="primary" onClick={submitRename} disabled={renameName.trim() === ''}>
              {l.renameConfirm}
            </FxButton>
          </>
        }
      >
        <label className="fx-saved-filters-field">
          <span className="fx-saved-filters-field-label">{l.nameLabel}</span>
          <FxInput
            value={renameName}
            placeholder={l.namePlaceholder}
            aria-label={l.nameLabel}
            onChange={(v) => setRenameName(v)}
            onEnter={submitRename}
          />
        </label>
      </FxDialog>

      <FxConfirmationDialog
        open={deleteId !== null}
        onOpenChange={(o) => {
          if (!o) setDeleteId(null);
        }}
        title={l.deleteTitle}
        description={l.deleteDescription.replace('{name}', deleteView?.name ?? '')}
        tone="danger"
        confirmLabel={l.deleteConfirm}
        cancelLabel={l.deleteCancel}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}
