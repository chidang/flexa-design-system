/**
 * FxMetricCard — single-KPI dashboard tile (doc 04 §2.47). Composes FxCard
 * (padding=md) and reuses FxStatisticBlock for the accessible value + label +
 * delta phrase.
 *
 * Pure presentational (no hooks) → renders as an RSC in docs. The value + delta
 * read as ONE screen-reader phrase (FxStatisticBlock owns the visually-hidden
 * sentence `'{label}: {value}, {delta}% {direction} {caption}'`). Trend is never
 * colour-only — a mandatory arrow glyph (§1.7.7) accompanies the delta, and the
 * sparkline is decorative (`aria-hidden`). Whole-card drill-down goes through
 * FxCard's interactive rules (`href`/`onClick`).
 */
import { FxCard } from '../card/card';
import { FxStatisticBlock } from '../statistic-block/statistic-block';
import { FxIcon } from '../icon/FxIcon';
import type { Money } from '../currency-input/currency-input';

/** Trend indicator — same shape shared with FxStatisticBlock (§2.47). */
export interface MetricCardDelta {
  value: number;
  direction: 'up' | 'down' | 'flat';
  /** Which direction reads as "good" → tone. Defaults to `'up'`. */
  positiveIs?: 'up' | 'down';
}

export interface FxMetricCardProps {
  /** Metric name (required). */
  label: string;
  /** The KPI. `Money` renders locale-formatted via Intl.NumberFormat (§1.8). */
  value: string | number | Money;
  /** Trend indicator. `positiveIs` maps direction → tone; default `'up'`. */
  delta?: MetricCardDelta;
  /** Comparison caption, e.g. `'vs. last 30 days'`. */
  caption?: string;
  /** Decorative trend line — rendered as a tiny inline SVG (`aria-hidden`). */
  sparkline?: number[];
  /** Skeleton value/delta with stable dimensions. */
  loading?: boolean;
  /** Whole-card drill-down target (FxCard interactive). */
  href?: string;
  /** Whole-card drill-down handler (FxCard interactive). */
  onClick?: () => void;
  /** Definition tooltip shown on the ⓘ trigger. */
  info?: string;
  /** Unit appended after the value, e.g. `'ms'`. */
  unit?: string;
  /** Locale for `Money` formatting. Defaults to the runtime env locale. */
  locale?: string;
  /** Value size. `sm` renders a smaller heading. Defaults to `md`. */
  size?: 'md' | 'sm';
  className?: string;
}

/** A value is `Money` when it carries an integer `amount` + ISO `currency`. */
function isMoney(v: string | number | Money): v is Money {
  return typeof v === 'object' && v !== null && 'amount' in v && 'currency' in v;
}

/** Format a `Money` value into a locale-aware currency string. */
function formatMoney(money: Money, locale?: string): string {
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: money.currency,
    }).format(money.amount / 100);
  } catch {
    return String(money.amount);
  }
}

/** The rendered display value (Money → formatted, else as-is). */
function displayValue(value: string | number | Money, locale?: string): string | number {
  return isMoney(value) ? formatMoney(value, locale) : value;
}

/** Directional glyph — never colour-only, the arrow carries the trend (§1.7.7). */
function trendIcon(direction: 'up' | 'down' | 'flat') {
  if (direction === 'up') return <FxIcon name="trending-up" size={16} />;
  if (direction === 'down') return <FxIcon name="trending-down" size={16} />;
  return <FxIcon name="minus" size={16} />;
}

/** A tiny decorative sparkline polyline (`color.primary` stroke). */
function Sparkline({ points }: { points: number[] }) {
  if (points.length < 2) return null;
  const w = 64;
  const h = 20;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const span = max - min || 1;
  const coords = points
    .map((p, i) => {
      const x = (i / (points.length - 1)) * w;
      const y = h - ((p - min) / span) * h;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');
  return (
    <svg
      className="fx-metric-card-sparkline"
      viewBox={`0 0 ${w} ${h}`}
      width={w}
      height={h}
      aria-hidden="true"
      focusable="false"
    >
      <polyline points={coords} fill="none" strokeWidth={2} vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

export function FxMetricCard({
  label,
  value,
  delta,
  caption,
  sparkline,
  loading = false,
  href,
  onClick,
  info,
  unit,
  locale,
  size = 'md',
  className,
}: FxMetricCardProps) {
  const interactive = href != null || onClick != null;
  const cardClass = className ? `fx-metric-card ${className}` : 'fx-metric-card';

  if (loading) {
    return (
      <FxCard
        padding="md"
        as={href != null ? 'a' : 'div'}
        href={href}
        onClick={onClick}
        interactive={interactive}
        className={cardClass}
      >
        <div className="fx-metric-card-loading" aria-hidden="true" data-size={size}>
          <span className="fx-metric-card-skeleton fx-metric-card-skeleton-label" />
          <span className="fx-metric-card-skeleton fx-metric-card-skeleton-value" />
          <span className="fx-metric-card-skeleton fx-metric-card-skeleton-delta" />
        </div>
      </FxCard>
    );
  }

  const shown = displayValue(value, locale);
  const valueNode = (
    <>
      {shown}
      {unit != null && <span className="fx-metric-card-unit">{unit}</span>}
    </>
  );

  return (
    <FxCard
      padding="md"
      as={href != null ? 'a' : 'div'}
      href={href}
      onClick={onClick}
      interactive={interactive}
      className={cardClass}
    >
      <div className="fx-metric-card-inner">
        {/* Plain-string label keeps the FxStatisticBlock sr sentence clean; the
            optional ⓘ definition trigger sits alongside as its own control. */}
        <FxStatisticBlock
          label={label}
          value={valueNode}
          delta={delta}
          caption={caption}
          size={size === 'sm' ? 'md' : 'lg'}
        />
        {info != null && (
          <button type="button" className="fx-metric-card-info" title={info} aria-label={info}>
            <FxIcon name="info" size={16} />
          </button>
        )}
        {delta && (
          <span className="fx-metric-card-delta-icon" data-trend={delta.direction} aria-hidden="true">
            {trendIcon(delta.direction)}
          </span>
        )}
        {sparkline != null && sparkline.length > 1 && <Sparkline points={sparkline} />}
      </div>
    </FxCard>
  );
}
