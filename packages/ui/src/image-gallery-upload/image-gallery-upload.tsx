'use client';
/**
 * FxImageGalleryUpload — Image Gallery Upload (doc 04 §3.4).
 *
 * A reorderable grid of image items (thumb + upload progress + remove + drag
 * handle + a "Cover" badge on the first) followed by an add-tile that reuses the
 * Drag & Drop contract. Order is meaningful — index 0 is the cover image. Keyboard
 * reorder follows the APG drag protocol: `Space` lifts, `Arrow` moves, `Space`
 * drops, `Esc` cancels — every move announced politely. `UploadFile[]` value is
 * controlled/uncontrolled per §1.5.
 */
import { useId, useState } from 'react';
import type { KeyboardEvent as ReactKeyboardEvent } from 'react';
import { FxBadge } from '../badge/badge';
import { FxDragDropUpload } from '../drag-drop-upload/drag-drop-upload';
import { FxIcon } from '../icon/FxIcon';
import { FxProgress } from '../progress/progress';
import type { FxFileUploadProps, UploadFile } from '../file-upload/file-upload';

/** Every user-facing string beyond the inherited FileUpload labels. */
export interface ImageGalleryUploadLabels {
  remove: string;
  reorder: string;
  coverBadge: string;
  /** Template — receives `{name}` / `{n}` / `{total}`. */
  moved: string;
  /** Template — receives `{name}`. */
  lifted: string;
  dropped: string;
  cancelled: string;
}

export const DEFAULT_IMAGE_GALLERY_LABELS: ImageGalleryUploadLabels = {
  remove: 'Remove image',
  reorder: 'Reorder image',
  coverBadge: 'Cover',
  moved: '{name} moved to position {n} of {total}',
  lifted: '{name} lifted. Use arrow keys to move, space to drop, escape to cancel.',
  dropped: '{name} dropped.',
  cancelled: 'Reorder cancelled.',
};

export interface FxImageGalleryUploadProps
  extends Omit<FxFileUploadProps, 'renderTrigger' | 'hideList' | 'multiple'> {
  /** Max images. Defaults to `10`. */
  maxFiles?: number;
  /** Allow reordering. Defaults to `true`. */
  reorderable?: boolean;
  /** Fired after a reorder settles, with the new id order. */
  onReorder?: (ids: string[]) => void;
  /** i18n strings. Merged over the English defaults. */
  galleryLabels?: Partial<ImageGalleryUploadLabels>;
  /** Accessible name for the add-tile dropzone. */
  addLabel?: string;
  /**
   * Fixture mode (doc 14 §11 G4). When set, the add-tile becomes a plain
   * button that appends the returned pre-seeded item — URL-based `UploadFile`s
   * with no `File` backing — so deterministic fixtures/mocks can demo the full
   * add → reorder → cover flow without the OS file picker or binary assets.
   * Called with the current item count; return `null` to ignore the press
   * (e.g. the fixture source is exhausted). Additive: omit for the real
   * Drag & Drop picker.
   */
  fixtureAdd?: (index: number) => UploadFile | null;
}

function fill(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, k: string) => String(vars[k] ?? `{${k}}`));
}

export function FxImageGalleryUpload({
  value,
  defaultValue = [],
  accept = 'image/*',
  maxFiles = 10,
  reorderable = true,
  onChange,
  onReorder,
  galleryLabels,
  addLabel,
  fixtureAdd,
  disabled = false,
  className,
  ...rest
}: FxImageGalleryUploadProps) {
  const autoId = useId();
  const liveId = `${autoId}-live`;
  const t = { ...DEFAULT_IMAGE_GALLERY_LABELS, ...galleryLabels };
  const [internal, setInternal] = useState<UploadFile[]>(defaultValue);
  const [lifted, setLifted] = useState<string | null>(null);
  const [announce, setAnnounce] = useState('');

  const controlled = value !== undefined;
  const files = controlled ? value : internal;

  const setFiles = (next: UploadFile[]) => {
    if (!controlled) setInternal(next);
  };

  const remove = (id: string) => {
    const next = files.filter((f) => f.id !== id);
    setFiles(next);
    onChange?.(next, { source: 'remove' });
  };

  const reorder = (id: string, delta: number) => {
    const from = files.findIndex((f) => f.id === id);
    const to = from + delta;
    if (from < 0 || to < 0 || to >= files.length) return;
    const next = [...files];
    const [moved] = next.splice(from, 1);
    if (!moved) return;
    next.splice(to, 0, moved);
    setFiles(next);
    onChange?.(next, { source: 'add' });
    onReorder?.(next.map((f) => f.id));
    setAnnounce(fill(t.moved, { name: moved.name, n: to + 1, total: next.length }));
  };

  const onHandleKeyDown = (id: string, name: string) => (e: ReactKeyboardEvent) => {
    if (!reorderable) return;
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      if (lifted === id) {
        setLifted(null);
        setAnnounce(fill(t.dropped, { name }));
      } else {
        setLifted(id);
        setAnnounce(fill(t.lifted, { name }));
      }
      return;
    }
    if (e.key === 'Escape' && lifted === id) {
      e.preventDefault();
      setLifted(null);
      setAnnounce(t.cancelled);
      return;
    }
    if (lifted === id) {
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        reorder(id, -1);
      } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        reorder(id, 1);
      }
    }
  };

  const atMax = files.length >= maxFiles;
  const rootClass = ['fx-image-gallery-upload', disabled ? 'is-disabled' : '', className ?? '']
    .filter(Boolean)
    .join(' ');

  return (
    <div className={rootClass} data-disabled={disabled || undefined}>
      <ul className="fx-image-gallery-upload-grid" role="list">
        {files.map((file, index) => (
          <li
            key={file.id}
            className="fx-image-gallery-upload-item"
            data-status={file.status}
            data-lifted={lifted === file.id || undefined}
          >
            <span className="fx-image-gallery-upload-thumb">
              {file.url ? (
                <img className="fx-image-gallery-upload-image" src={file.url} alt={file.name} />
              ) : (
                <span className="fx-image-gallery-upload-placeholder" aria-hidden="true">
                  <FxIcon name="image" size={24} />
                </span>
              )}
              {index === 0 && (
                <span className="fx-image-gallery-upload-cover">
                  <FxBadge tone="info" appearance="solid" size="sm">
                    {t.coverBadge}
                  </FxBadge>
                </span>
              )}
              {file.status === 'uploading' && (
                <span className="fx-image-gallery-upload-progress">
                  <FxProgress value={file.progress ?? 0} size="sm" label={file.name} />
                </span>
              )}
            </span>

            <span className="fx-image-gallery-upload-actions">
              {reorderable && (
                <button
                  type="button"
                  className="fx-image-gallery-upload-handle"
                  aria-label={`${t.reorder}: ${file.name}`}
                  aria-pressed={lifted === file.id || undefined}
                  disabled={disabled}
                  onKeyDown={onHandleKeyDown(file.id, file.name)}
                >
                  <FxIcon name="grip" size={16} />
                </button>
              )}
              <button
                type="button"
                className="fx-image-gallery-upload-remove"
                aria-label={`${t.remove}: ${file.name}`}
                disabled={disabled}
                onClick={() => remove(file.id)}
              >
                <FxIcon name="close" size={16} />
              </button>
            </span>
          </li>
        ))}

        {!atMax && (
          <li className="fx-image-gallery-upload-add">
            {fixtureAdd ? (
              <button
                type="button"
                className="fx-image-gallery-upload-fixture"
                disabled={disabled}
                onClick={() => {
                  const item = fixtureAdd(files.length);
                  if (!item) return;
                  const next = [...files, item];
                  setFiles(next);
                  onChange?.(next, { source: 'add' });
                }}
              >
                <FxIcon name="plus" size={24} />
                <span className="fx-image-gallery-upload-fixture-label">{addLabel ?? 'Add images'}</span>
              </button>
            ) : (
              <FxDragDropUpload
                {...rest}
                accept={accept}
                multiple
                maxFiles={maxFiles}
                disabled={disabled}
                zoneLabel={addLabel ?? 'Add images'}
                value={files}
                hideList
                onChange={(next, meta) => {
                  setFiles(next);
                  onChange?.(next, meta);
                }}
              />
            )}
          </li>
        )}
      </ul>

      <span id={liveId} className="fx-image-gallery-upload-sr" role="status" aria-live="polite">
        {announce}
      </span>
    </div>
  );
}
