'use client';
/**
 * FxFileUpload — button-triggered upload with a managed file list (doc 04 §2.17).
 *
 * The base upload contract every dropzone/gallery/avatar surface composes. House
 * style: root `.fx-file-upload`, `.is-*` state hooks, per-file `data-status`,
 * token-only CSS, every user-facing string a `labels.*` prop (i18n; error
 * templates take `{name}` / `{max}`). Controlled/uncontrolled per §1.5 (presence
 * of `value` selects controlled). A host-provided `upload` transport drives
 * per-file progress; absent ⇒ the component only collects picks (form-post mode).
 */
import { useId, useRef, useState } from 'react';
import type { DragEvent, ReactNode } from 'react';
import { FxButton } from '../button/button';
import { FxIcon } from '../icon/FxIcon';
import { FxProgress } from '../progress/progress';

/** One tracked file in the list (doc 04 §2.17). */
export interface UploadFile {
  id: string;
  name: string;
  size: number;
  type: string;
  status: 'queued' | 'uploading' | 'success' | 'error';
  /** 0–100 while `uploading`. */
  progress?: number;
  /** Resolved URL once `success`. */
  url?: string;
  /** Per-file error message when `error`. */
  error?: string;
}

/** Host transport: resolve with the persisted id + url, report progress, honour abort. */
export type UploadTransport = (
  file: File,
  onProgress: (pct: number) => void,
  signal: AbortSignal,
) => Promise<{ id: string; url: string }>;

/** `{ source }` meta accompanying every value change (doc 04 §1.6). */
export interface FileUploadChangeMeta {
  source: 'add' | 'remove' | 'progress' | 'success' | 'error' | 'retry';
}

/** Every user-facing string — English defaults, override for i18n. */
export interface FileUploadLabels {
  browse: string;
  dropHint: string;
  retry: string;
  remove: string;
  /** Template — receives `{name}`. */
  tooLarge: string;
  /** Template — receives `{name}`. */
  wrongType: string;
  /** Template — receives `{max}`. */
  tooMany: string;
}

export const DEFAULT_FILE_UPLOAD_LABELS: FileUploadLabels = {
  browse: 'Browse files',
  dropHint: 'Drag files here or browse',
  retry: 'Retry',
  remove: 'Remove',
  tooLarge: '{name} is too large',
  wrongType: '{name} is not an accepted type',
  tooMany: 'You can upload at most {max} files',
};

export interface FxFileUploadProps {
  /** Controlled list (§1.5). */
  value?: UploadFile[];
  /** Uncontrolled initial list. */
  defaultValue?: UploadFile[];
  /** MIME/extension list; rejected picks surface a per-file error, never silently dropped. */
  accept?: string;
  /** Allow multiple picks. Defaults to `false`. */
  multiple?: boolean;
  /** Max bytes per file. */
  maxSize?: number;
  /** Max total files. */
  maxFiles?: number;
  /** Host transport. Absent ⇒ collect-only (form-post mode). */
  upload?: UploadTransport;
  /** i18n strings. Merged over the English defaults. */
  labels?: Partial<FileUploadLabels>;
  /** Disable the trigger + actions. */
  disabled?: boolean;
  /** Called on every list mutation. */
  onChange?: (files: UploadFile[], meta: FileUploadChangeMeta) => void;
  /** Accepted native picks (before upload). */
  onUpload?: (files: File[]) => void;
  /** A file was removed. */
  onRemove?: (fileId: string) => void;
  /** A failed file's retry was requested. */
  onRetry?: (fileId: string) => void;
  className?: string;
  /** Render prop for the trigger — Drag & Drop / gallery override it with a zone. */
  renderTrigger?: (api: FileUploadTriggerApi) => ReactNode;
  /** Hide the built-in list (composing surfaces render their own). */
  hideList?: boolean;
}

/** Handed to `renderTrigger` so composing surfaces reuse the exact open/drop plumbing. */
export interface FileUploadTriggerApi {
  /** Open the native file dialog. */
  open: () => void;
  /** id of the hidden input — wire `aria-controls` / `htmlFor` to it. */
  inputId: string;
  /** True while a file is dragged over the window/zone. */
  dragover: boolean;
  /** Ingest a `FileList` (drop / paste). */
  ingest: (files: FileList | File[]) => void;
  disabled: boolean;
  dragProps: {
    onDragOver: (e: DragEvent) => void;
    onDragLeave: (e: DragEvent) => void;
    onDrop: (e: DragEvent) => void;
  };
}

const STATUS_ICON = { success: 'success', error: 'error' } as const;

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const units = ['KB', 'MB', 'GB', 'TB'];
  let value = bytes / 1024;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  return `${value < 10 ? value.toFixed(1) : Math.round(value)} ${units[unit]}`;
}

function fill(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, k: string) => String(vars[k] ?? `{${k}}`));
}

function acceptsFile(accept: string | undefined, file: File): boolean {
  if (!accept) return true;
  const name = file.name.toLowerCase();
  const type = file.type.toLowerCase();
  return accept
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean)
    .some((rule) => {
      if (rule.startsWith('.')) return name.endsWith(rule);
      if (rule.endsWith('/*')) return type.startsWith(rule.slice(0, -1));
      return type === rule;
    });
}

let uid = 0;
const nextId = (): string => `fx-file-${(uid += 1)}`;

export function FxFileUpload({
  value,
  defaultValue = [],
  accept,
  multiple = false,
  maxSize,
  maxFiles,
  upload,
  labels,
  disabled = false,
  onChange,
  onUpload,
  onRemove,
  onRetry,
  className,
  renderTrigger,
  hideList = false,
}: FxFileUploadProps) {
  const autoId = useId();
  const inputId = `${autoId}-input`;
  const liveId = `${autoId}-live`;
  const inputRef = useRef<HTMLInputElement>(null);
  const [internal, setInternal] = useState<UploadFile[]>(defaultValue);
  const [dragover, setDragover] = useState(false);
  const [announce, setAnnounce] = useState('');

  const t = { ...DEFAULT_FILE_UPLOAD_LABELS, ...labels };
  const controlled = value !== undefined;
  const files = controlled ? value : internal;

  const setFiles = (next: UploadFile[], meta: FileUploadChangeMeta) => {
    if (!controlled) setInternal(next);
    onChange?.(next, meta);
  };

  const open = () => {
    if (!disabled) inputRef.current?.click();
  };

  const ingest = (picked: FileList | File[]) => {
    if (disabled) return;
    const list = Array.from(picked);
    if (list.length === 0) return;

    const accepted: File[] = [];
    const rejected: UploadFile[] = [];
    for (const file of list) {
      if (!acceptsFile(accept, file)) {
        rejected.push(rejectedEntry(file, fill(t.wrongType, { name: file.name })));
      } else if (maxSize !== undefined && file.size > maxSize) {
        rejected.push(rejectedEntry(file, fill(t.tooLarge, { name: file.name })));
      } else {
        accepted.push(file);
      }
    }

    const base = files;
    if (maxFiles !== undefined) {
      const room = Math.max(0, maxFiles - base.length);
      if (accepted.length > room) {
        accepted.length = room;
        rejected.push(rejectedEntry(new File([], ''), fill(t.tooMany, { max: maxFiles })));
      }
    }

    const added: UploadFile[] = accepted.map((file) => ({
      id: nextId(),
      name: file.name,
      size: file.size,
      type: file.type,
      status: upload ? 'uploading' : 'queued',
      ...(upload ? { progress: 0 } : {}),
    }));

    const next = multiple ? [...base, ...added, ...rejected] : [...added, ...rejected].slice(0, 1);
    setFiles(next, { source: 'add' });
    if (accepted.length > 0) onUpload?.(accepted);
    setAnnounce(added.map((f) => f.name).join(', '));
  };

  const remove = (id: string) => {
    setFiles(files.filter((f) => f.id !== id), { source: 'remove' });
    onRemove?.(id);
  };

  const retry = (id: string) => onRetry?.(id);

  const rootClass = [
    'fx-file-upload',
    disabled ? 'is-disabled' : '',
    dragover ? 'is-dragover' : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ');

  const dragProps = {
    onDragOver: (e: DragEvent) => {
      e.preventDefault();
      if (!disabled) setDragover(true);
    },
    onDragLeave: (e: DragEvent) => {
      e.preventDefault();
      setDragover(false);
    },
    onDrop: (e: DragEvent) => {
      e.preventDefault();
      setDragover(false);
      ingest(e.dataTransfer.files);
    },
  };

  const triggerApi: FileUploadTriggerApi = {
    open,
    inputId,
    dragover,
    ingest,
    disabled,
    dragProps,
  };

  return (
    <div className={rootClass} data-disabled={disabled || undefined}>
      <input
        ref={inputRef}
        id={inputId}
        className="fx-file-upload-input"
        type="file"
        accept={accept}
        multiple={multiple}
        disabled={disabled}
        aria-label={t.browse}
        tabIndex={-1}
        onChange={(e) => {
          if (e.target.files) ingest(e.target.files);
          e.target.value = '';
        }}
      />

      {renderTrigger ? (
        renderTrigger(triggerApi)
      ) : (
        <div className="fx-file-upload-trigger" {...dragProps}>
          <FxButton
            variant="secondary"
            iconStart={<FxIcon name="upload" size={16} />}
            disabled={disabled}
            onClick={open}
            aria-controls={inputId}
          >
            {t.browse}
          </FxButton>
          <span className="fx-file-upload-hint">{t.dropHint}</span>
        </div>
      )}

      {!hideList && files.length > 0 && (
        <ul className="fx-file-upload-list" role="list">
          {files.map((file) => (
            <li key={file.id} className="fx-file-upload-item" data-status={file.status}>
              <span className="fx-file-upload-item-icon" aria-hidden="true">
                <FxIcon
                  name={file.status in STATUS_ICON ? STATUS_ICON[file.status as 'success' | 'error'] : 'file'}
                  size={20}
                />
              </span>
              <span className="fx-file-upload-item-body">
                <span className="fx-file-upload-item-name">{file.name}</span>
                {file.size > 0 && (
                  <span className="fx-file-upload-item-size">{formatBytes(file.size)}</span>
                )}
                {file.status === 'uploading' && (
                  <span className="fx-file-upload-item-progress">
                    <FxProgress value={file.progress ?? 0} size="sm" label={file.name} />
                  </span>
                )}
                {file.status === 'error' && file.error && (
                  <span className="fx-file-upload-item-error">{file.error}</span>
                )}
              </span>
              <span className="fx-file-upload-item-actions">
                {file.status === 'error' && (
                  <button
                    type="button"
                    className="fx-file-upload-item-action"
                    aria-label={`${t.retry}: ${file.name}`}
                    disabled={disabled}
                    onClick={() => retry(file.id)}
                  >
                    <FxIcon name="refresh" size={16} />
                  </button>
                )}
                <button
                  type="button"
                  className="fx-file-upload-item-action"
                  aria-label={`${t.remove}: ${file.name}`}
                  disabled={disabled}
                  onKeyDown={(e) => {
                    if (e.key === 'Delete' || e.key === 'Backspace') remove(file.id);
                  }}
                  onClick={() => remove(file.id)}
                >
                  <FxIcon name="close" size={16} />
                </button>
              </span>
            </li>
          ))}
        </ul>
      )}

      <span id={liveId} className="fx-file-upload-sr" role="status" aria-live="polite">
        {announce}
      </span>
    </div>
  );
}

function rejectedEntry(file: File, error: string): UploadFile {
  return {
    id: nextId(),
    name: file.name || error,
    size: file.size,
    type: file.type,
    status: 'error',
    error,
  };
}
