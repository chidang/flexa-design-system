'use client';
/**
 * FxDashboardLayout — a 12-column widget grid (doc 04 §3.1).
 *
 * An optional header slot sits above `.fx-dashboard-grid`, a `columns`-track CSS
 * grid (12 by default, gap from the `space.*` scale). Grid children set their own
 * span (3/4/6/12) via a wrapper — this component only provides the track and the
 * responsive collapse (Tablet 2-col, Mobile 1-col stack, preserving DOM order).
 * `editable` is a v1 flag (class/data hook) for a future drag-rearrange mode; no
 * real DnD ships here — `onLayoutChange` is reserved for when it does.
 */
import type { CSSProperties, ReactNode } from 'react';

/** Grid gap, restricted to the spacing steps the dashboard grid uses. */
export type DashboardGap = 'space.4' | 'space.5' | 'space.6';

const GAP_VAR: Record<DashboardGap, string> = {
  'space.4': 'var(--fx-space-4)',
  'space.5': 'var(--fx-space-5)',
  'space.6': 'var(--fx-space-6)',
};

export interface FxDashboardLayoutProps {
  /** Grid items (each wraps its own column span). */
  children: ReactNode;
  /** Optional header above the grid. */
  header?: ReactNode;
  /** Column-track count. Defaults to 12. */
  columns?: number;
  /** Grid gap token. Defaults to `space.5`. */
  gap?: DashboardGap;
  /** Enable the (v1 flag-only) drag-rearrange mode. */
  editable?: boolean;
  /** Reserved: fired when the layout changes in editable mode. */
  onLayoutChange?: (layout: unknown) => void;
  className?: string;
}

export function FxDashboardLayout({
  children,
  header,
  columns = 12,
  gap = 'space.5',
  editable = false,
  className,
}: FxDashboardLayoutProps) {
  const gridStyle: CSSProperties = {
    gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
    gap: GAP_VAR[gap],
  };
  return (
    <div
      className={className ? `fx-dashboard-layout ${className}` : 'fx-dashboard-layout'}
      data-editable={editable || undefined}
    >
      {header != null && <div className="fx-dashboard-layout-header">{header}</div>}
      <div className="fx-dashboard-grid" style={gridStyle}>
        {children}
      </div>
    </div>
  );
}
