'use client';
/**
 * FxLoadingOverlay — scrim + indicator over a region during an in-place op
 * (doc 04 §3.6). Not a portal: it absolutely covers its positioned parent, so
 * the parent must be `position: relative`. `delayMs` skips the flash for fast
 * ops; the overlay announces its label once via `role="status"`.
 */
import { useEffect, useState, type ReactNode } from 'react';

export interface FxLoadingOverlayProps {
  visible: boolean;
  label?: string;
  /** Frost the covered content. */
  blur?: boolean;
  /** Skip the overlay entirely for ops faster than this (ms). */
  delayMs?: number;
  /** Optional actions row (e.g. Cancel) rendered under the spinner. */
  children?: ReactNode;
  className?: string;
  testId?: string;
}

export function FxLoadingOverlay({
  visible,
  label = 'Loading…',
  blur = false,
  delayMs = 150,
  children,
  className,
  testId,
}: FxLoadingOverlayProps) {
  const [shown, setShown] = useState(false);

  useEffect(() => {
    if (!visible) {
      setShown(false);
      return;
    }
    if (delayMs <= 0) {
      setShown(true);
      return;
    }
    const t = setTimeout(() => setShown(true), delayMs);
    return () => clearTimeout(t);
  }, [visible, delayMs]);

  if (!shown) return null;

  return (
    <div
      className={className ? `fx-loading-overlay ${className}` : 'fx-loading-overlay'}
      role="status"
      aria-busy="true"
      data-blur={blur || undefined}
      data-testid={testId}
    >
      <span className="fx-loading-overlay-spinner" aria-hidden="true" />
      {label && <span className="fx-loading-overlay-label">{label}</span>}
      {children != null && <div className="fx-loading-overlay-actions">{children}</div>}
    </div>
  );
}
