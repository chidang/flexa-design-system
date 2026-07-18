/**
 * FxProgress — determinate/indeterminate progress bar (doc 04 §2.31).
 *
 * Pure presentational (no hooks) → renders as an RSC in docs. `role="progressbar"`
 * with `aria-valuemin/max/now`; `value === null` is indeterminate and omits
 * `aria-valuenow`. Tone shifts the fill for outcome colouring; `neutral`/`info`
 * render the primary fill.
 */
import type { Size, Tone } from '../enums';

export interface FxProgressProps {
  /** 0–100, or `null` for indeterminate. Defaults to `null`. */
  value?: number | null;
  /** Outcome tone for the fill. Defaults to `neutral` (primary fill). */
  tone?: Tone;
  /** Bar height. Defaults to `md`. */
  size?: Size;
  /** Accessible name (required when there is no visible label). */
  label?: string;
  /** Render the value as `%` text. */
  showValue?: boolean;
  /** Formats the value text + `aria-valuetext`. Defaults to `{v}%`. */
  formatValue?: (value: number) => string;
  className?: string;
}

const clamp = (v: number): number => Math.max(0, Math.min(100, v));

export function FxProgress({
  value = null,
  tone = 'neutral',
  size = 'md',
  label,
  showValue = false,
  formatValue = (v) => `${Math.round(v)}%`,
  className,
}: FxProgressProps) {
  const indeterminate = value === null;
  const pct = indeterminate ? 0 : clamp(value);
  const valueText = indeterminate ? undefined : formatValue(pct);

  return (
    <div className={className ? `fx-progress ${className}` : 'fx-progress'} data-tone={tone} data-size={size}>
      <div
        className={indeterminate ? 'fx-progress-track is-indeterminate' : 'fx-progress-track'}
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={indeterminate ? undefined : Math.round(pct)}
        aria-valuetext={valueText}
        aria-label={label}
      >
        <div className="fx-progress-fill" style={{ inlineSize: indeterminate ? undefined : `${pct}%` }} />
      </div>
      {showValue && !indeterminate && <span className="fx-progress-value">{valueText}</span>}
    </div>
  );
}
