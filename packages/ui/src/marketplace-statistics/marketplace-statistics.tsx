'use client';
/**
 * FxMarketplaceStatistics — the admin-dashboard KPI band (doc 04 §commerce,
 * "FxMarketplaceStatistics — Marketplace Statistics"). Composes a responsive
 * dashboard-grid of FxMetricCards (GMV, orders, active listings, take-rate…) with
 * an FxSelect range control and an optional Charts Container slot. No new
 * primitives — a marketplace specialization of the FxStatisticsCard idea.
 *
 * Interactive only for the optional range control (`useState`); everything else is
 * presentational. Range is controlled or uncontrolled per §1.5. The band is a
 * `<section>` with an accessible name (the `title` heading, or `aria-label` when
 * headingless). Every baked string is a `labels` prop with an English default
 * (i18n). MetricCards pass through verbatim via `metrics`.
 */
import { useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import { FxMetricCard } from '../metric-card/metric-card';
import type { FxMetricCardProps } from '../metric-card/metric-card';
import { FxSelect } from '../select/select';

export interface MarketplaceRangeOption {
  value: string;
  label: string;
}

/** i18n strings — every user-facing label is overridable. */
export interface MarketplaceStatisticsLabels {
  /** Accessible name for the range FxSelect. */
  rangeLabel: string;
  /** Accessible name for the band when there is no visible `title`. */
  regionLabel: string;
}

export const DEFAULT_MARKETPLACE_STATISTICS_LABELS: MarketplaceStatisticsLabels = {
  rangeLabel: 'Range',
  regionLabel: 'Marketplace statistics',
};

export interface FxMarketplaceStatisticsProps {
  /** The KPI tiles, passed through to FxMetricCard verbatim. */
  metrics: FxMetricCardProps[];
  /** Optional visible band heading (also the accessible name). */
  title?: string;
  /** Controlled selected range value (§1.5). */
  range?: string;
  /** Uncontrolled initial range value. */
  defaultRange?: string;
  onRangeChange?: (range: string) => void;
  /** Range choices — rendered with FxSelect when present. */
  rangeOptions?: MarketplaceRangeOption[];
  /** Optional Charts Container / chart node under the KPI band. */
  chart?: ReactNode;
  /** Grid column count at the widest breakpoint. Defaults to 4. */
  columns?: number;
  /** Skeleton metrics while loading. */
  loading?: boolean;
  /** i18n labels. */
  labels?: Partial<MarketplaceStatisticsLabels>;
  className?: string;
}

export function FxMarketplaceStatistics({
  metrics,
  title,
  range,
  defaultRange,
  onRangeChange,
  rangeOptions,
  chart,
  columns = 4,
  loading = false,
  labels,
  className,
}: FxMarketplaceStatisticsProps) {
  const l = { ...DEFAULT_MARKETPLACE_STATISTICS_LABELS, ...labels };
  const controlled = range !== undefined;
  const [internal, setInternal] = useState(defaultRange ?? rangeOptions?.[0]?.value ?? null);
  const current = controlled ? range : internal;

  const onSelect = (next: string | null) => {
    if (!controlled) setInternal(next);
    if (next != null) onRangeChange?.(next);
  };

  const rootClass = className
    ? `fx-marketplace-statistics ${className}`
    : 'fx-marketplace-statistics';

  const rangeControl =
    rangeOptions != null && rangeOptions.length > 0 ? (
      <FxSelect
        options={rangeOptions}
        value={current ?? null}
        onChange={onSelect}
        size="sm"
        aria-label={l.rangeLabel}
      />
    ) : null;

  const hasHeader = title != null || rangeControl != null;

  return (
    <section
      className={rootClass}
      aria-label={title == null ? l.regionLabel : undefined}
    >
      {hasHeader && (
        <div className="fx-marketplace-statistics-header">
          {title != null && <h2 className="fx-marketplace-statistics-title">{title}</h2>}
          {rangeControl}
        </div>
      )}

      <div
        className="fx-marketplace-statistics-grid"
        data-columns={columns}
        style={{ '--fx-marketplace-statistics-columns': String(columns) } as CSSProperties}
      >
        {metrics.map((metric, i) => (
          <FxMetricCard key={metric.label || i} {...metric} loading={loading || metric.loading} />
        ))}
      </div>

      {chart != null && <div className="fx-marketplace-statistics-chart">{chart}</div>}
    </section>
  );
}
