/**
 * FxAiGenerationStatus — the canonical AI lifecycle display (doc 04 §3.10
 * "FxAiGenerationStatus — AI Generation Status").
 *
 * Owns the streaming vocabulary (ai.md §3): idle → queued → generating →
 * succeeded / failed / cancelled. A pulsing sparkle marks live generation
 * (reduced-motion static), a `block` variant reserves shimmer placeholder lines,
 * and an optional step feed shows multi-stage pipelines. `role="status"`
 * announces transitions politely; a failure switches to `role="alert"`.
 * Stop shows while generating, Retry on failure. Pure presentational (no hooks)
 * → renders as an RSC. Every string is a prop.
 */
import type { AiStatus } from '../enums';
import { FxIcon } from '../icon/FxIcon';

/** One line in a multi-stage pipeline feed (prop-only shape). */
export interface GenerationStep {
  id: string;
  label: string;
  state: 'pending' | 'active' | 'done' | 'error';
}

/** Baked-in strings — every one a prop (§i18n). */
export interface AiGenerationStatusLabels {
  idle: string;
  queued: string;
  generating: string;
  succeeded: string;
  failed: string;
  cancelled: string;
  stop: string;
  retry: string;
}

export const DEFAULT_AI_GENERATION_STATUS_LABELS: AiGenerationStatusLabels = {
  idle: 'Idle',
  queued: 'Waiting…',
  generating: 'Generating…',
  succeeded: 'Done',
  failed: 'Failed',
  cancelled: 'Stopped',
  stop: 'Stop',
  retry: 'Retry',
};

export interface FxAiGenerationStatusProps {
  /** Lifecycle status (§5). */
  status: AiStatus;
  /** Presentation. Defaults to `inline`. */
  variant?: 'inline' | 'block' | 'button';
  /** Overrides the default per-status text. */
  label?: string;
  /** Multi-stage pipeline feed. */
  steps?: GenerationStep[];
  /** Elapsed seconds (shown while generating / after). */
  elapsedSec?: number;
  /** Fires the Stop affordance (shown while generating). */
  onStop?: () => void;
  /** Fires the Retry affordance (shown on failure). */
  onRetry?: () => void;
  /** i18n overrides, merged over English defaults. */
  labels?: Partial<AiGenerationStatusLabels>;
  className?: string;
}

const ICON_BY_STATUS: Record<AiStatus, 'sparkle' | 'clock' | 'check' | 'error' | 'stop'> = {
  idle: 'sparkle',
  queued: 'clock',
  generating: 'sparkle',
  succeeded: 'check',
  failed: 'error',
  cancelled: 'stop',
};

function statusText(status: AiStatus, l: AiGenerationStatusLabels): string {
  return l[status];
}

export function FxAiGenerationStatus({
  status,
  variant = 'inline',
  label,
  steps,
  elapsedSec,
  onStop,
  onRetry,
  labels,
  className,
}: FxAiGenerationStatusProps) {
  const l = { ...DEFAULT_AI_GENERATION_STATUS_LABELS, ...labels };
  const text = label ?? statusText(status, l);
  const generating = status === 'generating';
  const failed = status === 'failed';
  const icon = ICON_BY_STATUS[status];

  const rootClass = ['fx-ai-generation-status', className].filter(Boolean).join(' ');

  return (
    <div
      className={rootClass}
      data-status={status}
      data-variant={variant}
      role={failed ? 'alert' : 'status'}
      aria-live={failed ? 'assertive' : 'polite'}
    >
      <span className="fx-ai-generation-status-head">
        <span className="fx-ai-generation-status-icon" data-pulse={generating || undefined} aria-hidden="true">
          <FxIcon name={icon} size={16} />
        </span>
        <span className="fx-ai-generation-status-text">{text}</span>
        {typeof elapsedSec === 'number' && Number.isFinite(elapsedSec) && (
          <span className="fx-ai-generation-status-elapsed">{elapsedSec}s</span>
        )}
        {generating && onStop && (
          <button type="button" className="fx-ai-generation-status-action" data-action="stop" onClick={onStop}>
            <FxIcon name="stop" size={16} />
            <span className="fx-ai-generation-status-action-label">{l.stop}</span>
          </button>
        )}
        {failed && onRetry && (
          <button type="button" className="fx-ai-generation-status-action" data-action="retry" onClick={onRetry}>
            <FxIcon name="rotate-ccw" size={16} />
            <span className="fx-ai-generation-status-action-label">{l.retry}</span>
          </button>
        )}
      </span>

      {variant === 'block' && generating && steps === undefined && (
        <span className="fx-ai-generation-status-shimmer" aria-hidden="true">
          <span className="fx-ai-generation-status-line" />
          <span className="fx-ai-generation-status-line" />
          <span className="fx-ai-generation-status-line" />
        </span>
      )}

      {steps && steps.length > 0 && (
        <ul className="fx-ai-generation-status-steps">
          {steps.map((step) => (
            <li className="fx-ai-generation-status-step" key={step.id} data-state={step.state}>
              <span className="fx-ai-generation-status-step-mark" aria-hidden="true">
                <FxIcon
                  name={step.state === 'done' ? 'check' : step.state === 'error' ? 'error' : step.state === 'active' ? 'sparkle' : 'clock'}
                  size={16}
                />
              </span>
              <span className="fx-ai-generation-status-step-label">{step.label}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
