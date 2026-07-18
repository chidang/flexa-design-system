'use client';
/**
 * FxChartsContainer — standardized chrome around a host-provided chart (doc 04
 * §3.3). The kit ships NO chart engine: this container owns the header (title +
 * legend + actions), loading (skeleton rect), empty state, and the a11y escape
 * hatch — the canvas carries `role="img"` + an `aria-label` summary, plus an
 * optional "View as table" toggle that swaps the canvas for an accessible data
 * table.
 *
 * Interactive only for the table toggle (a `useState`); everything else is
 * presentational. Controlled or uncontrolled toggle state per §1.5.
 */
import { useState } from 'react';
import type { ReactNode } from 'react';
import { FxCard } from '../card/card';
import { FxEmptyState } from '../empty-state/empty-state';
import { FxSkeletonLoader } from '../skeleton/skeleton';
import { FxButton } from '../button/button';
import type { IconName } from '../icon/map';
import type { Tone } from '../enums';

/** Fixed series order — legend swatches map to these tones (§3.3). */
const SERIES_TONES: readonly Tone[] = ['neutral', 'info', 'success', 'warning', 'danger'];

export interface ChartLegendEntry {
  label: string;
  /** Series tone. Defaults to the fixed series order by position. */
  tone?: Tone;
}

export interface ChartsEmptyState {
  title: string;
  description?: string;
  icon?: IconName;
}

export interface FxChartsContainerProps {
  /** Panel title (required). */
  title: string;
  /** Optional supporting line under the title. */
  description?: string;
  /** Series legend (fixed series-order tones when `tone` omitted). */
  legend?: ChartLegendEntry[];
  /** Header actions slot — range select, export menu, etc. */
  actions?: ReactNode;
  /** Skeleton rect in the canvas. */
  loading?: boolean;
  /** Zero-data surface (rendered when set and not loading). */
  empty?: ChartsEmptyState;
  /** The host-provided chart canvas. */
  children?: ReactNode;
  /** Accessible summary of the chart for the `role="img"` canvas. */
  canvasLabel?: string;
  /** An accessible data-table alternative; enables the "View as table" toggle. */
  tableAlternative?: ReactNode;
  /** Controlled: show the table instead of the canvas. */
  showTable?: boolean;
  /** Uncontrolled initial toggle state. Defaults to `false`. */
  defaultShowTable?: boolean;
  onShowTableChange?: (showTable: boolean) => void;
  tableToggleLabel?: string;
  chartToggleLabel?: string;
  className?: string;
}

export function FxChartsContainer({
  title,
  description,
  legend,
  actions,
  loading = false,
  empty,
  children,
  canvasLabel,
  tableAlternative,
  showTable,
  defaultShowTable = false,
  onShowTableChange,
  tableToggleLabel = 'View as table',
  chartToggleLabel = 'View as chart',
  className,
}: FxChartsContainerProps) {
  const controlled = showTable !== undefined;
  const [internal, setInternal] = useState(defaultShowTable);
  const isTable = controlled ? showTable : internal;

  const toggle = () => {
    const next = !isTable;
    if (!controlled) setInternal(next);
    onShowTableChange?.(next);
  };

  const showEmpty = empty != null && !loading;
  const canToggle = tableAlternative != null && !loading && !showEmpty;

  const headerActions = (
    <div className="fx-charts-container-header-actions">
      {canToggle && (
        <FxButton variant="ghost" size="sm" onClick={toggle} aria-pressed={isTable}>
          {isTable ? chartToggleLabel : tableToggleLabel}
        </FxButton>
      )}
      {actions}
    </div>
  );

  return (
    <FxCard
      padding="md"
      title={title}
      subtitle={description}
      headerActions={headerActions}
      className={className ? `fx-charts-container ${className}` : 'fx-charts-container'}
    >
      {legend != null && legend.length > 0 && (
        <ul className="fx-charts-container-legend">
          {legend.map((entry, i) => (
            <li
              key={entry.label}
              className="fx-charts-container-legend-item"
              data-tone={entry.tone ?? SERIES_TONES[i % SERIES_TONES.length]}
            >
              <span className="fx-charts-container-legend-swatch" aria-hidden="true" />
              {entry.label}
            </li>
          ))}
        </ul>
      )}

      {showEmpty ? (
        <FxEmptyState
          title={empty.title}
          description={empty.description}
          icon={empty.icon ?? 'chart'}
          size="md"
        />
      ) : loading ? (
        <div className="fx-charts-container-canvas" data-loading="true">
          <FxSkeletonLoader shape="rect" height="240px" />
        </div>
      ) : isTable && tableAlternative != null ? (
        <div className="fx-charts-container-table">{tableAlternative}</div>
      ) : (
        <div className="fx-charts-container-canvas" role="img" aria-label={canvasLabel ?? title}>
          {children}
        </div>
      )}
    </FxCard>
  );
}
