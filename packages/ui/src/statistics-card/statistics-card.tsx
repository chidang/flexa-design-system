'use client';
/**
 * FxStatisticsCard — multi-metric analytical block (doc 04 §3.3). Composes FxCard
 * (header + range control), a primary row of 1–4 FxMetricCards, an optional chart
 * slot, and an optional breakdown (FxDescriptionList node). This is the
 * multi-metric sibling of the single-KPI FxMetricCard.
 *
 * Interactive only for the optional range control (`useState`); everything else
 * is presentational. Range is controlled or uncontrolled per §1.5 — when
 * `rangeOptions` are given the control renders as an FxSelect.
 */
import { useState } from 'react';
import type { ReactNode } from 'react';
import { FxCard } from '../card/card';
import { FxMetricCard } from '../metric-card/metric-card';
import type { FxMetricCardProps } from '../metric-card/metric-card';
import { FxSelect } from '../select/select';

export interface StatisticsRangeOption {
  value: string;
  label: string;
}

export interface FxStatisticsCardProps {
  /** Block title (required). */
  title: string;
  /** 1–4 metrics, each rendered as an FxMetricCard in the primary row. */
  metrics: FxMetricCardProps[];
  /** Optional chart slot (a Charts Container / chart node). */
  chart?: ReactNode;
  /** Controlled selected range value (§1.5). */
  range?: string;
  /** Uncontrolled initial range value. */
  defaultRange?: string;
  onRangeChange?: (range: string) => void;
  /** Range choices — rendered with FxSelect when present. */
  rangeOptions?: StatisticsRangeOption[];
  /** Accessible label for the range control. i18n. */
  rangeLabel?: string;
  /** Optional breakdown (an FxDescriptionList node). */
  breakdown?: ReactNode;
  /** Skeleton metrics while loading. */
  loading?: boolean;
  className?: string;
}

export function FxStatisticsCard({
  title,
  metrics,
  chart,
  range,
  defaultRange,
  onRangeChange,
  rangeOptions,
  rangeLabel = 'Time range',
  breakdown,
  loading = false,
  className,
}: FxStatisticsCardProps) {
  const controlled = range !== undefined;
  const [internal, setInternal] = useState(defaultRange ?? rangeOptions?.[0]?.value ?? null);
  const current = controlled ? range : internal;

  const onSelect = (next: string | null) => {
    if (!controlled) setInternal(next);
    if (next != null) onRangeChange?.(next);
  };

  const rangeControl =
    rangeOptions != null && rangeOptions.length > 0 ? (
      <FxSelect
        options={rangeOptions}
        value={current ?? null}
        onChange={onSelect}
        size="sm"
        aria-label={rangeLabel}
      />
    ) : undefined;

  return (
    <FxCard
      padding="md"
      title={title}
      headerActions={rangeControl}
      className={className ? `fx-statistics-card ${className}` : 'fx-statistics-card'}
    >
      <div className="fx-statistics-card-metrics" data-count={Math.min(metrics.length, 4)}>
        {metrics.slice(0, 4).map((metric, i) => (
          <FxMetricCard key={metric.label || i} {...metric} loading={loading || metric.loading} />
        ))}
      </div>

      {chart != null && <div className="fx-statistics-card-chart">{chart}</div>}
      {breakdown != null && <div className="fx-statistics-card-breakdown">{breakdown}</div>}
    </FxCard>
  );
}
