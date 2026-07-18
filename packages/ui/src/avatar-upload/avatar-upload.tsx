'use client';
/**
 * FxAvatarUpload — Avatar Upload (doc 04 §3.4).
 *
 * Composes FxAvatar (`xl` preview) + an overlay edit button + a hidden file input
 * transport, with an optional minimal crop dialog whose zoom control is a plain
 * native `<input type="range">` (no cross-cluster Slider import). The crop dialog
 * uses `useModal` for the SSR-safe mount gate + focus trap. Every user-facing
 * string is a `labels.*` prop (i18n). `value` (url) is controlled per §1.5.
 */
import { useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { FxAvatar } from '../avatar/avatar';
import { FxButton } from '../button/button';
import { FxIcon } from '../icon/FxIcon';
import { useModal } from '../dialog/use-modal';

/** Every user-facing string — English defaults, override for i18n. */
export interface AvatarUploadLabels {
  change: string;
  remove: string;
  cropTitle: string;
  zoom: string;
  cropCancel: string;
  cropConfirm: string;
}

export const DEFAULT_AVATAR_UPLOAD_LABELS: AvatarUploadLabels = {
  change: 'Change profile photo',
  remove: 'Remove photo',
  cropTitle: 'Crop photo',
  zoom: 'Zoom',
  cropCancel: 'Cancel',
  cropConfirm: 'Save',
};

export interface FxAvatarUploadProps {
  /** Current image url (controlled, §1.5). `null` ⇒ initials/icon fallback. */
  value?: string | null;
  /** Name — drives the initials fallback when there is no image. */
  name?: string;
  /** Host transport for a freshly picked file. */
  onUpload?: (file: File) => Promise<{ url: string }>;
  /** Remove the current image. */
  onRemove?: () => void;
  /** Report a resolved url after upload (for uncontrolled callers). */
  onChange?: (url: string | null) => void;
  /** Show the crop-zoom dialog after picking. Defaults to `true`. */
  crop?: boolean;
  /** Accepted image types. Defaults to `image/*`. */
  accept?: string;
  /** Max bytes. */
  maxSize?: number;
  /** i18n strings. Merged over the English defaults. */
  labels?: Partial<AvatarUploadLabels>;
  disabled?: boolean;
  className?: string;
}

export function FxAvatarUpload({
  value = null,
  name,
  onUpload,
  onRemove,
  onChange,
  crop = true,
  accept = 'image/*',
  maxSize,
  labels,
  disabled = false,
  className,
}: FxAvatarUploadProps) {
  const t = { ...DEFAULT_AVATAR_UPLOAD_LABELS, ...labels };
  const inputRef = useRef<HTMLInputElement>(null);
  const [cropOpen, setCropOpen] = useState(false);
  const [pendingUrl, setPendingUrl] = useState<string | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [zoom, setZoom] = useState(100);
  const [busy, setBusy] = useState(false);

  // useModal drives the SSR-safe mount gate + focus trap + stable title id; open
  // state is local because the dialog is opened programmatically after a pick.
  const modal = useModal({ open: cropOpen });

  const openPicker = () => {
    if (!disabled) inputRef.current?.click();
  };

  const commit = async (file: File) => {
    if (!onUpload) return;
    setBusy(true);
    try {
      const { url } = await onUpload(file);
      onChange?.(url);
    } finally {
      setBusy(false);
    }
  };

  const onPick = (file: File | undefined) => {
    if (!file) return;
    if (maxSize !== undefined && file.size > maxSize) return;
    if (crop) {
      setPendingFile(file);
      setPendingUrl(URL.createObjectURL(file));
      setZoom(100);
      setCropOpen(true);
    } else {
      void commit(file);
    }
  };

  const confirmCrop = () => {
    if (pendingFile) void commit(pendingFile);
    closeCrop();
  };

  const closeCrop = () => {
    if (pendingUrl) URL.revokeObjectURL(pendingUrl);
    setPendingUrl(null);
    setPendingFile(null);
    setCropOpen(false);
  };

  const remove = () => {
    onRemove?.();
    onChange?.(null);
  };

  const rootClass = ['fx-avatar-upload', className].filter(Boolean).join(' ');

  return (
    <div className={rootClass} data-disabled={disabled || undefined}>
      <input
        ref={inputRef}
        className="fx-avatar-upload-input"
        type="file"
        accept={accept}
        aria-label={t.change}
        tabIndex={-1}
        disabled={disabled}
        onChange={(e) => {
          onPick(e.target.files?.[0]);
          e.target.value = '';
        }}
      />

      <span className="fx-avatar-upload-preview">
        <FxAvatar src={value ?? undefined} name={name} alt={name ?? ''} size="xl" />
        <button
          type="button"
          className="fx-avatar-upload-edit"
          aria-label={t.change}
          aria-busy={busy || undefined}
          disabled={disabled || busy}
          onClick={openPicker}
        >
          <FxIcon name="edit" size={16} />
        </button>
      </span>

      <span className="fx-avatar-upload-actions">
        <FxButton variant="secondary" size="sm" disabled={disabled || busy} onClick={openPicker}>
          {t.change}
        </FxButton>
        {value != null && (
          <FxButton variant="ghost" size="sm" disabled={disabled} onClick={remove}>
            {t.remove}
          </FxButton>
        )}
      </span>

      {crop && modal.open && modal.mounted && pendingUrl &&
        createPortal(
          <div
            className="fx-avatar-upload-crop-backdrop"
            onMouseDown={(e) => {
              if (e.target === e.currentTarget) closeCrop();
            }}
          >
            <div
              ref={modal.surfaceRef}
              className="fx-avatar-upload-crop"
              role="dialog"
              aria-modal="true"
              aria-labelledby={modal.titleId}
              tabIndex={-1}
              onKeyDown={(e) => {
                if (e.key === 'Escape') closeCrop();
                else modal.onKeyDown(e);
              }}
            >
              <h2 id={modal.titleId} className="fx-avatar-upload-crop-title">
                {t.cropTitle}
              </h2>
              <div className="fx-avatar-upload-crop-frame">
                <img
                  className="fx-avatar-upload-crop-image"
                  src={pendingUrl}
                  alt=""
                  style={{ transform: `scale(${zoom / 100})` }}
                />
              </div>
              <label className="fx-avatar-upload-crop-zoom-row">
                <span className="fx-avatar-upload-crop-zoom-label">{t.zoom}</span>
                <input
                  type="range"
                  className="fx-avatar-upload-zoom"
                  min={100}
                  max={300}
                  value={zoom}
                  aria-label={t.zoom}
                  onChange={(e) => setZoom(Number(e.target.value))}
                />
              </label>
              <div className="fx-avatar-upload-crop-footer">
                <FxButton variant="ghost" size="sm" onClick={closeCrop}>
                  {t.cropCancel}
                </FxButton>
                <FxButton variant="primary" size="sm" onClick={confirmCrop}>
                  {t.cropConfirm}
                </FxButton>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
