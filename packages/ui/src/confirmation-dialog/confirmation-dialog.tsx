'use client';
/**
 * FxConfirmationDialog — blocking decision point (doc 04 §2.42).
 *
 * Composes the FxDialog surface primitives (same `.fx-dialog-*` parts + scrim)
 * but exposes `role="alertdialog"` and the fixed Cancel + Confirm footer. Async
 * `onConfirm` keeps the dialog open with the confirm button `loading` until the
 * returned promise settles (§1.6). SSR-safe portal gate per rule 4.
 */
import { createPortal } from 'react-dom';
import { useEffect, useState, type ReactNode } from 'react';
import { FxButton } from '../button/button';
import { FxIcon } from '../icon/FxIcon';
import { useModal } from '../dialog/use-modal';

export interface FxConfirmationDialogProps {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  title: string;
  description: ReactNode;
  tone?: 'default' | 'danger';
  confirmLabel?: string;
  cancelLabel?: string;
  closeLabel?: string;
  /** Type-to-confirm: confirm stays disabled until input matches exactly. */
  requireInput?: string;
  /** Placeholder + label for the type-to-confirm field. */
  requireInputLabel?: string;
  /**
   * Externally gate the confirm button (doc 14 §11 G7) — e.g. keep it disabled
   * until a valid refund amount is entered in `children`. Combines with the
   * `requireInput` gate (either blocks confirm).
   */
  confirmDisabled?: boolean;
  /**
   * Custom body content (G7) rendered below the description — form fields,
   * previews, anything the decision needs. Lives inside the described-by
   * region, so keep it focused on the decision at hand.
   */
  children?: ReactNode;
  /** Async ⇒ confirm button shows loading; dialog stays open until settle. */
  onConfirm?: () => void | Promise<void>;
  onCancel?: () => void;
  testId?: string;
}

export function FxConfirmationDialog({
  open: openProp,
  defaultOpen,
  onOpenChange,
  title,
  description,
  tone = 'default',
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  closeLabel = 'Close',
  requireInput,
  requireInputLabel = 'Type to confirm',
  confirmDisabled = false,
  children,
  onConfirm,
  onCancel,
  testId,
}: FxConfirmationDialogProps) {
  const modal = useModal({ open: openProp, defaultOpen, onOpenChange: (o) => onOpenChange?.(o) });
  const [busy, setBusy] = useState(false);
  const [typed, setTyped] = useState('');

  // Initial focus: the SAFE action (Cancel) for danger, Confirm otherwise (11 §3.3).
  // FxButton doesn't forward a ref, so resolve the target from the footer DOM —
  // Cancel is first, Confirm is last (confirm on the end side).
  useEffect(() => {
    if (!modal.open || !modal.mounted) return;
    const surface = modal.surfaceRef.current;
    const buttons = surface?.querySelectorAll<HTMLButtonElement>('.fx-confirmation-dialog-actions button');
    if (!buttons || buttons.length === 0) return;
    const target = tone === 'danger' ? buttons[0] : buttons[buttons.length - 1];
    // A gated confirm (requireInput / confirmDisabled) can't take focus — fall
    // back to Cancel so initial focus never lands nowhere.
    (target && !target.disabled ? target : buttons[0])?.focus();
  }, [modal.open, modal.mounted, tone, modal.surfaceRef]);

  if (!modal.open || !modal.mounted) return null;

  const cancel = () => {
    if (busy) return;
    onCancel?.();
    modal.requestClose('api');
  };

  const confirm = async () => {
    if (busy) return;
    const result = onConfirm?.();
    if (result instanceof Promise) {
      setBusy(true);
      try {
        await result;
        setBusy(false);
        modal.requestClose('api');
      } catch {
        setBusy(false); // reject keeps the dialog open — error display is the host's.
      }
    } else {
      modal.requestClose('api');
    }
  };

  const gated = requireInput !== undefined && typed !== requireInput;

  return createPortal(
    <div
      className="fx-dialog-backdrop"
      onMouseDown={(e) => {
        // Backdrop does nothing on destructive / type-to-confirm dialogs (feedback.md).
        if (e.target === e.currentTarget && tone !== 'danger' && requireInput === undefined) cancel();
      }}
    >
      <div
        ref={modal.surfaceRef}
        className="fx-dialog fx-confirmation-dialog"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={modal.titleId}
        aria-describedby={modal.descId}
        data-size="sm"
        data-tone={tone}
        tabIndex={-1}
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            e.stopPropagation();
            cancel();
            return;
          }
          modal.onKeyDown(e);
        }}
        data-testid={testId}
      >
        <div className="fx-dialog-header">
          <h2 id={modal.titleId} className="fx-dialog-title">
            {tone === 'danger' && <FxIcon name="warning" size={20} className="fx-confirmation-dialog-icon" />}
            {title}
          </h2>
          <button type="button" className="fx-dialog-close" aria-label={closeLabel} onClick={cancel}>
            <FxIcon name="close" size={20} />
          </button>
        </div>
        <div id={modal.descId} className="fx-dialog-body">
          <p className="fx-confirmation-dialog-description">{description}</p>
          {children != null && <div className="fx-confirmation-dialog-content">{children}</div>}
          {requireInput !== undefined && (
            <label className="fx-confirmation-dialog-field">
              <span className="fx-confirmation-dialog-field-label">{requireInputLabel}</span>
              <input
                className="fx-confirmation-dialog-input"
                type="text"
                value={typed}
                autoComplete="off"
                onChange={(e) => setTyped(e.target.value)}
              />
            </label>
          )}
        </div>
        <div className="fx-dialog-footer fx-confirmation-dialog-actions">
          <FxButton variant="secondary" onClick={cancel} disabled={busy}>
            {cancelLabel}
          </FxButton>
          <FxButton
            variant={tone === 'danger' ? 'danger' : 'primary'}
            onClick={confirm}
            loading={busy}
            disabled={gated || confirmDisabled}
          >
            {confirmLabel}
          </FxButton>
        </div>
      </div>
    </div>,
    document.body,
  );
}
