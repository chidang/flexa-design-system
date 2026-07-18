'use client';
/**
 * FxWarningBanner — full-width warning pinned above the Content Area (doc 04 §3.6).
 *
 * A constrained FxAlert: tone is fixed `'warning'`, it sticks below the Top
 * Navigation at `z.sticky`, and it carries at most a single action plus an
 * optional dismiss. Dismissal is host-persisted (keyed by `dismissKey`); the
 * component only hides itself locally and fires `onDismiss` so the host can
 * remember not to show it again. Max one visible at a time is a host concern.
 */
import { useState, type ReactNode } from 'react';
import { FxAlert } from '../alert/alert';

export interface FxWarningBannerProps {
  /** Bold lead-in line (optional). */
  title?: ReactNode;
  /** The message body. */
  children?: ReactNode;
  /** A single action (button/link). Rendered in the alert's action row. */
  action?: ReactNode;
  /** Pin below the Top Navigation at `z.sticky`. */
  sticky?: boolean;
  /** Host persistence key — passed back so the host can remember the dismissal. */
  dismissKey?: string;
  /** Accessible name for the icon-only dismiss control. */
  dismissLabel?: string;
  /** Fired when dismissed; receives `dismissKey` when set. */
  onDismiss?: (dismissKey?: string) => void;
  className?: string;
  testId?: string;
}

export function FxWarningBanner({
  title,
  children,
  action,
  sticky = true,
  dismissKey,
  dismissLabel = 'Dismiss',
  onDismiss,
  className,
  testId,
}: FxWarningBannerProps) {
  const dismissible = onDismiss !== undefined;
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;

  const rootClass = className ? `fx-warning-banner ${className}` : 'fx-warning-banner';

  const handleDismiss = () => {
    setDismissed(true);
    onDismiss?.(dismissKey);
  };

  return (
    <div className={rootClass} data-sticky={sticky ? 'true' : undefined} data-testid={testId}>
      <FxAlert
        tone="warning"
        title={title}
        description={children}
        actions={action}
        dismissible={dismissible}
        dismissLabel={dismissLabel}
        onDismiss={handleDismiss}
      />
    </div>
  );
}
