/**
 * FxInlineError — section-scale failure surface (doc 04 §3.6).
 *
 * Bigger than a Validation Message (field-level), smaller than an Error Page
 * (full Content Area): it replaces a single widget that failed to load. A
 * danger-tone icon pairs with the message (colour never conveys meaning alone),
 * with an optional detail line and a retry control. It carries `role="alert"`
 * because it typically appears after a failed async op, replacing content.
 *
 * Presentational (no hooks) → renders fine as a server component in docs. When
 * `onRetry` is given the retry is a real `<button>`; otherwise `retryHref`
 * renders a semantic `<a>`.
 */
import type { ReactNode } from 'react';
import { FxIcon } from '../icon/FxIcon';

export interface FxInlineErrorProps {
  /** What failed + (ideally) how to recover. Required. */
  message: ReactNode;
  /** Secondary line — technical hint, request id, etc. */
  detail?: ReactNode;
  /** Retry handler. When set, the retry renders as a `<button>`. */
  onRetry?: () => void;
  /** Retry link target (used when there is no `onRetry`). */
  retryHref?: string;
  /** Retry control label. */
  retryLabel?: string;
  /** Tighter padding for dense contexts (inside cards, table cells). */
  compact?: boolean;
  className?: string;
  testId?: string;
}

export function FxInlineError({
  message,
  detail,
  onRetry,
  retryHref,
  retryLabel = 'Try again',
  compact = false,
  className,
  testId,
}: FxInlineErrorProps) {
  const rootClass = ['fx-inline-error', compact ? 'is-compact' : null, className]
    .filter(Boolean)
    .join(' ');
  const showRetry = onRetry !== undefined || retryHref !== undefined;

  return (
    <div className={rootClass} role="alert" data-testid={testId}>
      <span className="fx-inline-error-icon">
        <FxIcon name="error" size={compact ? 16 : 20} />
      </span>
      <div className="fx-inline-error-content">
        <p className="fx-inline-error-message">{message}</p>
        {detail != null && <p className="fx-inline-error-detail">{detail}</p>}
        {showRetry && (
          <p className="fx-inline-error-retry">
            {onRetry !== undefined ? (
              <button type="button" className="fx-inline-error-retry-action" onClick={onRetry}>
                <FxIcon name="refresh" size={16} />
                <span>{retryLabel}</span>
              </button>
            ) : (
              <a className="fx-inline-error-retry-action" href={retryHref}>
                <FxIcon name="refresh" size={16} />
                <span>{retryLabel}</span>
              </a>
            )}
          </p>
        )}
      </div>
    </div>
  );
}
