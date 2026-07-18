'use client';
/**
 * FxDialog — the modal surface contract (doc 04 §2.43).
 *
 * The layering primitive Confirmation Dialog, Command Palette and modal editing
 * compose. SSR-safe: the portal is gated on a client-mount flag so it renders
 * nothing under `renderToStaticMarkup` / static export (rule 4). Focus trap +
 * restore, Esc close and scrim close all live in `useModal`.
 */
import { createPortal } from 'react-dom';
import type { ReactNode } from 'react';
import { FxIcon } from '../icon/FxIcon';
import { useModal, type CloseReason } from './use-modal';

export type DialogSize = 'sm' | 'md' | 'lg' | 'full';

export interface FxDialogProps {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean, reason: CloseReason) => void;
  /** Accessible title (`aria-labelledby`). */
  title: string;
  /** Visually hide the title (still labels the dialog) — Command Palette. */
  titleHidden?: boolean;
  size?: DialogSize;
  /** `false` disables Esc / backdrop / × (forced decision). */
  dismissible?: boolean;
  /** Click on the scrim closes the dialog. */
  closeOnBackdrop?: boolean;
  /** Veto hook run before any close (unsaved-changes guard). */
  onBeforeClose?: () => boolean | Promise<boolean>;
  closeLabel?: string;
  /** Body content; footer actions go in `footer`. */
  children?: ReactNode;
  footer?: ReactNode;
  className?: string;
  /** Extra class on the surface root (used by composing components). */
  surfaceClassName?: string;
  testId?: string;
}

export function FxDialog({
  open: openProp,
  defaultOpen,
  onOpenChange,
  title,
  titleHidden = false,
  size = 'md',
  dismissible = true,
  closeOnBackdrop = true,
  onBeforeClose,
  closeLabel = 'Close',
  children,
  footer,
  className,
  surfaceClassName,
  testId,
}: FxDialogProps) {
  const modal = useModal({ open: openProp, defaultOpen, onOpenChange, onBeforeClose, dismissible });
  if (!modal.open || !modal.mounted) return null;

  const surfaceClass = surfaceClassName ? `fx-dialog ${surfaceClassName}` : 'fx-dialog';

  return createPortal(
    <div
      className={className ? `fx-dialog-backdrop ${className}` : 'fx-dialog-backdrop'}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && dismissible && closeOnBackdrop) modal.requestClose('backdrop');
      }}
    >
      <div
        ref={modal.surfaceRef}
        className={surfaceClass}
        role="dialog"
        aria-modal="true"
        aria-labelledby={modal.titleId}
        aria-describedby={modal.descId}
        data-size={size}
        tabIndex={-1}
        onKeyDown={modal.onKeyDown}
        data-testid={testId}
      >
        <div className="fx-dialog-header">
          <h2 id={modal.titleId} className="fx-dialog-title" data-hidden={titleHidden || undefined}>
            {title}
          </h2>
          {dismissible && (
            <button
              type="button"
              className="fx-dialog-close"
              aria-label={closeLabel}
              onClick={() => modal.requestClose('close-button')}
            >
              <FxIcon name="close" size={20} />
            </button>
          )}
        </div>
        <div id={modal.descId} className="fx-dialog-body">
          {children}
        </div>
        {footer != null && <div className="fx-dialog-footer">{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}
