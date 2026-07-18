/**
 * FxStatisticBlock — the unstyled inline stat primitive (doc 04 §3.5) that
 * FxMetricCard wraps in a Card: a `value` + `label` (+ optional `delta`) that
 * read as ONE accessible phrase.
 *
 * Pure presentational (no hooks) → renders as an RSC in docs. The visible layout
 * is decorative: the whole block carries a visually-hidden sentence
 * `'{label}: {value}, {delta} {direction} {caption}'` so screen readers hear a
 * single coherent stat (same ARIA-sentence rule as Metric Card, §2.47). Trend is
 * never colour-only — the direction word ("up"/"down") lives in that sentence and
 * the sign is spelled in text, not left to the CSS arrow.
 */
import type { ReactNode } from 'react';
import type { Tone } from '../enums';

/**
 * Delta shape mirrors FxMetricCard (§2.47). `positiveIs` maps a raw direction to
 * a good/bad tone (e.g. churn: `down` = good). Defaults to `'up'` = good.
 */
export interface StatisticDelta {
  value: number;
  direction: 'up' | 'down' | 'flat';
  positiveIs?: 'up' | 'down';
}

export interface StatisticBlockLabels {
  /** Spoken direction words folded into the accessible sentence. */
  up: string;
  down: string;
  flat: string;
}

export const DEFAULT_STATISTIC_BLOCK_LABELS: StatisticBlockLabels = {
  up: 'up',
  down: 'down',
  flat: 'no change',
};

export interface FxStatisticBlockProps {
  /** Stat name, e.g. `'Positive feedback'`. */
  label: ReactNode;
  /** The stat itself, e.g. `'98%'` or `1234`. */
  value: ReactNode;
  /** Optional trend indicator (as FxMetricCard). */
  delta?: StatisticDelta;
  /** Comparison caption, e.g. `'vs. last 30 days'`. */
  caption?: ReactNode;
  /** Horizontal alignment of the stack. Defaults to `start`. */
  align?: 'start' | 'center';
  /** Value size. Defaults to `md`. */
  size?: 'md' | 'lg';
  /** Direction words for the accessible sentence (i18n). */
  labels?: Partial<StatisticBlockLabels>;
  className?: string;
}

function trendTone(delta: StatisticDelta): Tone {
  if (delta.direction === 'flat') return 'neutral';
  const positiveIs = delta.positiveIs ?? 'up';
  const good = delta.direction === positiveIs;
  return good ? 'success' : 'danger';
}

export function FxStatisticBlock({
  label,
  value,
  delta,
  caption,
  align = 'start',
  size = 'md',
  labels,
  className,
}: FxStatisticBlockProps) {
  const l = { ...DEFAULT_STATISTIC_BLOCK_LABELS, ...labels };
  const directionWord = delta ? l[delta.direction] : undefined;
  const rootClass = className ? `fx-statistic-block ${className}` : 'fx-statistic-block';

  return (
    <div className={rootClass} data-align={align} data-size={size}>
      {/* One coherent accessible sentence — the visible parts are aria-hidden. */}
      <span className="fx-statistic-block-sr">
        {label}
        {': '}
        {value}
        {delta ? `, ${delta.value}% ${directionWord}` : ''}
        {caption ? ` ${typeof caption === 'string' ? caption : ''}` : ''}
      </span>

      <span className="fx-statistic-block-value" aria-hidden="true">
        {value}
      </span>
      <span className="fx-statistic-block-label" aria-hidden="true">
        {label}
      </span>
      {delta && (
        <span
          className="fx-statistic-block-delta"
          data-tone={trendTone(delta)}
          data-trend={delta.direction}
          aria-hidden="true"
        >
          <span className="fx-statistic-block-delta-sign">
            {delta.direction === 'up' ? '↑' : delta.direction === 'down' ? '↓' : '→'}
          </span>
          {delta.value}%
        </span>
      )}
      {caption && (
        <span className="fx-statistic-block-caption" aria-hidden="true">
          {caption}
        </span>
      )}
    </div>
  );
}
