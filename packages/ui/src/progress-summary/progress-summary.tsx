/**
 * FxProgressSummary — a card of labelled progress rows (doc 04 §FxProgressSummary):
 * each row is a label + an FxProgress bar + a `{done}/{total}` value; an optional
 * overall bar aggregates across rows. Linked rows are plain `<a>`.
 *
 * Pure presentational (no hooks) → renders as an RSC in docs. Each bar is named by
 * its row label via `aria-labelledby` (no visible-label duplication).
 */
import type { Size, Tone } from '../enums';
import { FxCard } from '../card/card';
import { FxProgress } from '../progress/progress';

export interface ProgressSummaryItem {
  id: string;
  label: string;
  value: number;
  /** Denominator for this row. Defaults to `100`. */
  max?: number;
  tone?: Tone;
  href?: string;
}

export interface FxProgressSummaryProps {
  /** Card title. */
  title: string;
  /** Progress rows. */
  items: ProgressSummaryItem[];
  /** Aggregate value/max across items into an overall bar. Defaults to `false`. */
  showOverall?: boolean;
  /** Value template, interpolated per row with `{value}`/`{max}`. Defaults to `'{value}/{max}'`. */
  format?: string;
  /** Label for the aggregate row. Defaults to `'Overall'`. */
  overallLabel?: string;
  /** Bar height. Defaults to `md`. */
  size?: Size;
  className?: string;
}

function interpolate(template: string, value: number, max: number): string {
  return template.replaceAll('{value}', String(value)).replaceAll('{max}', String(max));
}

function pct(value: number, max: number): number {
  if (max <= 0) return 0;
  return Math.max(0, Math.min(100, (value / max) * 100));
}

function Row({
  item,
  format,
  size,
}: {
  item: ProgressSummaryItem;
  format: string;
  size: Size;
}) {
  const max = item.max ?? 100;
  const labelId = `fx-progress-summary-${item.id}`;
  const valueText = interpolate(format, item.value, max);
  const inner = (
    <>
      <div className="fx-progress-summary-head">
        <span className="fx-progress-summary-label" id={labelId}>
          {item.label}
        </span>
        <span className="fx-progress-summary-value">{valueText}</span>
      </div>
      <FxProgress value={pct(item.value, max)} tone={item.tone} size={size} label={item.label} />
    </>
  );

  if (item.href) {
    return (
      <a className="fx-progress-summary-item is-linked" href={item.href} aria-labelledby={labelId}>
        {inner}
      </a>
    );
  }
  return <div className="fx-progress-summary-item">{inner}</div>;
}

export function FxProgressSummary({
  title,
  items,
  showOverall = false,
  format = '{value}/{max}',
  overallLabel = 'Overall',
  size = 'md',
  className,
}: FxProgressSummaryProps) {
  const rootClass = className ? `fx-progress-summary ${className}` : 'fx-progress-summary';
  const totalValue = items.reduce((sum, i) => sum + i.value, 0);
  const totalMax = items.reduce((sum, i) => sum + (i.max ?? 100), 0);

  return (
    <FxCard className={rootClass} title={title}>
      <div className="fx-progress-summary-list">
        {items.map((item) => (
          <Row key={item.id} item={item} format={format} size={size} />
        ))}
        {showOverall && items.length > 0 && (
          <div className="fx-progress-summary-item is-overall">
            <div className="fx-progress-summary-head">
              <span className="fx-progress-summary-label" id="fx-progress-summary-overall">
                {overallLabel}
              </span>
              <span className="fx-progress-summary-value">
                {interpolate(format, totalValue, totalMax)}
              </span>
            </div>
            <FxProgress value={pct(totalValue, totalMax)} tone="info" size={size} label={overallLabel} />
          </div>
        )}
      </div>
    </FxCard>
  );
}
