'use client';
/**
 * FxRightDrawer — slide-in panel from the inline-end edge (doc 04 §2.44).
 *
 * Modal mode (default): scrim + focus trap = dialog semantics. Non-modal mode:
 * push/overlay panel, page stays interactive, `role="complementary"`, no trap.
 * SSR-safe portal gate per rule 4; slide-in respects prefers-reduced-motion.
 */
import { createPortal } from 'react-dom';
import { useCallback, useEffect, useState, type KeyboardEvent as ReactKeyboardEvent, type ReactNode } from 'react';
import { FxIcon } from '../icon/FxIcon';
import { useModal, type CloseReason } from '../dialog/use-modal';

export type DrawerSize = 'sm' | 'md' | 'lg';

export interface FxRightDrawerProps {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean, reason: CloseReason) => void;
  title: string;
  size?: DrawerSize;
  /** true: scrim + focus trap (dialog). false: complementary landmark, no trap. */
  modal?: boolean;
  dismissible?: boolean;
  closeOnBackdrop?: boolean;
  onBeforeClose?: () => boolean | Promise<boolean>;
  closeLabel?: string;
  /** Header actions slot (right of the title, before ×). */
  actions?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
  className?: string;
  testId?: string;
}

export function FxRightDrawer({
  open: openProp,
  defaultOpen,
  onOpenChange,
  title,
  size = 'md',
  modal = true,
  dismissible = true,
  closeOnBackdrop = true,
  onBeforeClose,
  closeLabel = 'Close',
  actions,
  children,
  footer,
  className,
  testId,
}: FxRightDrawerProps) {
  const m = useModal({ open: openProp, defaultOpen, onOpenChange, onBeforeClose, dismissible });

  // Non-modal: Esc closes only when focus is inside; no trap.
  const onNonModalKeyDown = useCallback(
    (e: ReactKeyboardEvent) => {
      if (e.key === 'Escape' && dismissible) {
        e.stopPropagation();
        m.requestClose('esc');
      }
    },
    [dismissible, m],
  );

  // Non-modal drawers do NOT trap focus but still move focus in on open.
  const [nmMounted, setNmMounted] = useState(false);
  useEffect(() => setNmMounted(true), []);
  useEffect(() => {
    if (modal || !m.open || !nmMounted) return;
    m.surfaceRef.current?.focus();
  }, [modal, m.open, nmMounted, m.surfaceRef]);

  if (!m.open || !m.mounted) return null;

  const panel = (
    <div
      ref={m.surfaceRef}
      className="fx-drawer"
      role={modal ? 'dialog' : 'complementary'}
      aria-modal={modal || undefined}
      aria-labelledby={m.titleId}
      aria-describedby={m.descId}
      data-side="end"
      data-size={size}
      tabIndex={-1}
      onKeyDown={modal ? m.onKeyDown : onNonModalKeyDown}
      data-testid={testId}
    >
      <div className="fx-drawer-header">
        <h2 id={m.titleId} className="fx-drawer-title">
          {title}
        </h2>
        {actions != null && <div className="fx-drawer-actions">{actions}</div>}
        {dismissible && (
          <button
            type="button"
            className="fx-drawer-close"
            aria-label={closeLabel}
            onClick={() => m.requestClose('close-button')}
          >
            <FxIcon name="close" size={20} />
          </button>
        )}
      </div>
      <div id={m.descId} className="fx-drawer-body">
        {children}
      </div>
      {footer != null && <div className="fx-drawer-footer">{footer}</div>}
    </div>
  );

  const wrapperClass = className ? `fx-drawer-mount ${className}` : 'fx-drawer-mount';

  return createPortal(
    modal ? (
      <div
        className="fx-drawer-backdrop"
        onMouseDown={(e) => {
          if (e.target === e.currentTarget && dismissible && closeOnBackdrop) m.requestClose('backdrop');
        }}
      >
        {panel}
      </div>
    ) : (
      <div className={wrapperClass} data-modal="false">
        {panel}
      </div>
    ),
    document.body,
  );
}
