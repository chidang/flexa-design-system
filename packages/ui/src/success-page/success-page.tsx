'use client';
/**
 * FxSuccessPage — the terminal success surface (doc 04 §3.6).
 *
 * Centered success icon (`color.success`, 48px) + the page `h1` + description
 * + an optional summary Card slot (e.g. an order recap) + actions (primary
 * next-step + secondary). `autoAdvance` runs an announced countdown
 * (`role="status"`) then navigates on its own; the announcement lets AT users
 * know a redirect is imminent, and a manual link is always available.
 */
import { useEffect, useState, type ReactNode } from 'react';
import { FxIcon } from '../icon/FxIcon';

/** Auto-navigate after a delay, with a live-announced countdown + manual link. */
export interface SuccessAutoAdvance {
  /** Destination. */
  href: string;
  /** Delay before navigating, in milliseconds. */
  afterMs: number;
  /** Link label + countdown template; `{n}` is replaced with seconds left. */
  label: string;
}

export interface FxSuccessPageProps {
  /** Confirmation headline (the page `h1`, required). */
  title: string;
  /** Supporting sentence. */
  description?: ReactNode;
  /** Summary Card slot (e.g. order recap). */
  summary?: ReactNode;
  /** Actions — primary next-step + secondary. */
  actions?: ReactNode;
  /** Announced countdown → auto-navigate on completion. */
  autoAdvance?: SuccessAutoAdvance;
  className?: string;
}

/** Replace the first `{n}` token in a label with the seconds remaining. */
function formatCountdown(label: string, seconds: number): string {
  return label.includes('{n}') ? label.replace('{n}', String(seconds)) : label;
}

export function FxSuccessPage({
  title,
  description,
  summary,
  actions,
  autoAdvance,
  className,
}: FxSuccessPageProps) {
  const [remaining, setRemaining] = useState(
    autoAdvance ? Math.ceil(autoAdvance.afterMs / 1000) : 0,
  );

  useEffect(() => {
    if (!autoAdvance) return;
    setRemaining(Math.ceil(autoAdvance.afterMs / 1000));
    const tick = setInterval(() => {
      setRemaining((n) => (n > 0 ? n - 1 : 0));
    }, 1000);
    const advance = setTimeout(() => {
      window.location.assign(autoAdvance.href);
    }, autoAdvance.afterMs);
    return () => {
      clearInterval(tick);
      clearTimeout(advance);
    };
  }, [autoAdvance]);

  return (
    <div className={className ? `fx-success-page ${className}` : 'fx-success-page'}>
      <div className="fx-success-page-icon" aria-hidden="true">
        <FxIcon name="success" size={24} />
      </div>
      <h1 className="fx-success-page-title">{title}</h1>
      {description != null && <p className="fx-success-page-description">{description}</p>}
      {summary != null && <div className="fx-success-page-summary">{summary}</div>}
      {actions != null && <div className="fx-success-page-actions">{actions}</div>}
      {autoAdvance && (
        <p className="fx-success-page-advance" role="status">
          <a className="fx-success-page-advance-link" href={autoAdvance.href}>
            {formatCountdown(autoAdvance.label, remaining)}
          </a>
        </p>
      )}
    </div>
  );
}
