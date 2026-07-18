'use client';
/**
 * FxDragDropUpload — Drag & Drop Upload (doc 04 §3.4).
 *
 * = FxFileUpload (§2.17) whose trigger is a full dropzone. The zone is a labelled
 * `<button>` (Enter/Space opens the file dialog) — drag is an enhancement, never
 * the only path (a11y delta). Everything else (file list, per-file progress,
 * validation, controlled/uncontrolled) comes from the composed base; only the
 * trigger surface is replaced via `renderTrigger`.
 */
import { useEffect } from 'react';
import {
  FxFileUpload,
  type FxFileUploadProps,
  type FileUploadLabels,
  type FileUploadTriggerApi,
} from '../file-upload/file-upload';
import { FxIcon } from '../icon/FxIcon';

export interface FxDragDropUploadProps extends Omit<FxFileUploadProps, 'renderTrigger'> {
  /** Accessible name for the dropzone button. i18n. Defaults to the drop hint. */
  zoneLabel?: string;
  /** Accept clipboard paste of files/images while the zone is mounted. Defaults to `false`. */
  pasteTarget?: boolean;
}

export function FxDragDropUpload({
  zoneLabel,
  pasteTarget = false,
  labels,
  ...rest
}: FxDragDropUploadProps) {
  return (
    <FxFileUpload
      {...rest}
      labels={labels}
      className={['fx-drag-drop-upload', rest.className].filter(Boolean).join(' ')}
      renderTrigger={(api) => {
        const hint = resolveLabels(labels).dropHint;
        return (
          <DragDropZone
            api={api}
            label={zoneLabel ?? hint}
            hint={hint}
            browse={resolveLabels(labels).browse}
            pasteTarget={pasteTarget}
          />
        );
      }}
    />
  );
}

function resolveLabels(labels: Partial<FileUploadLabels> | undefined): {
  dropHint: string;
  browse: string;
} {
  return {
    dropHint: labels?.dropHint ?? 'Drag files here or browse',
    browse: labels?.browse ?? 'Browse files',
  };
}

interface ZoneProps {
  api: FileUploadTriggerApi;
  label: string;
  hint: string;
  browse: string;
  pasteTarget: boolean;
}

function DragDropZone({ api, label, hint, browse, pasteTarget }: ZoneProps) {
  // Clipboard paste of files is an optional enhancement; the button path always works.
  useEffect(() => {
    if (!pasteTarget || api.disabled) return;
    const onPaste = (e: ClipboardEvent) => {
      const files = e.clipboardData?.files;
      if (files && files.length > 0) api.ingest(files);
    };
    window.addEventListener('paste', onPaste);
    return () => window.removeEventListener('paste', onPaste);
  }, [pasteTarget, api]);

  return (
    <button
      type="button"
      className="fx-drag-drop-upload-zone"
      data-dragover={api.dragover || undefined}
      aria-label={label}
      aria-controls={api.inputId}
      disabled={api.disabled}
      onClick={api.open}
      {...api.dragProps}
    >
      <span className="fx-drag-drop-upload-zone-icon" aria-hidden="true">
        <FxIcon name="upload" size={24} />
      </span>
      <span className="fx-drag-drop-upload-zone-hint">{hint}</span>
      <span className="fx-drag-drop-upload-zone-browse">{browse}</span>
    </button>
  );
}
