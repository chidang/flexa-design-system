'use client';
/**
 * FxWidget — the standard chrome every dashboard block sits in (doc 04 §3.3).
 * Composes FxCard: a header (title + optional drag handle + overflow "⋯" Context
 * Menu) over a body that hosts any dashboard content, with built-in
 * loading / error / empty states.
 *
 * Interactive because the overflow menu is an FxContextMenu (portal, SSR-safe)
 * and the retry/refresh are buttons. The drag handle carries
 * `aria-roledescription="Draggable widget"` (Dashboard Layout editable mode);
 * keyboard drag follows the Kanban contract at the layout level.
 */
import type { ReactNode } from 'react';
import { FxCard } from '../card/card';
import { FxContextMenu } from '../context-menu/context-menu';
import type { MenuItem } from '../context-menu/context-menu';
import { FxEmptyState } from '../empty-state/empty-state';
import { FxAlert } from '../alert/alert';
import { FxButton } from '../button/button';
import { FxSkeletonLoader } from '../skeleton/skeleton';
import { FxIcon } from '../icon/FxIcon';
import type { IconName } from '../icon/map';

export interface WidgetEmptyState {
  title: string;
  description?: string;
  icon?: IconName;
}

export interface FxWidgetProps {
  /** Widget title (required). */
  title: string;
  /** Dashboard content. */
  children?: ReactNode;
  /** Overflow "⋯" menu items (refresh / configure / remove …). */
  menuItems?: MenuItem[];
  onMenuSelect?: (item: MenuItem) => void;
  /** Skeleton body + `aria-busy`. */
  loading?: boolean;
  /** Inline error — renders an FxAlert (tone danger) + a retry button. */
  error?: string;
  onRetry?: () => void;
  /** Zero-data surface (FxEmptyState). */
  empty?: WidgetEmptyState;
  /** Show a drag handle (Dashboard Layout editable mode). Defaults to `false`. */
  draggable?: boolean;
  /** ISO timestamp — renders a small "Updated <relative>" caption. */
  refreshedAt?: string;
  retryLabel?: string;
  menuLabel?: string;
  /** Accessible label for the drag handle. i18n. */
  dragLabel?: string;
  className?: string;
}

/** Compact relative-time string from an ISO timestamp (e.g. "3m ago"). */
function relativeTime(iso: string): string {
  const then = Date.parse(iso);
  if (Number.isNaN(then)) return iso;
  const diffSec = Math.round((Date.now() - then) / 1000);
  const abs = Math.abs(diffSec);
  if (abs < 60) return 'just now';
  const mins = Math.round(diffSec / 60);
  if (Math.abs(mins) < 60) return `${Math.abs(mins)}m ago`;
  const hours = Math.round(mins / 60);
  if (Math.abs(hours) < 24) return `${Math.abs(hours)}h ago`;
  const days = Math.round(hours / 24);
  return `${Math.abs(days)}d ago`;
}

export function FxWidget({
  title,
  children,
  menuItems,
  onMenuSelect,
  loading = false,
  error,
  onRetry,
  empty,
  draggable = false,
  refreshedAt,
  retryLabel = 'Retry',
  menuLabel = 'Widget options',
  dragLabel = 'Drag to reorder',
  className,
}: FxWidgetProps) {
  const headerActions = (
    <div className="fx-widget-header-actions">
      {draggable && (
        <span
          className="fx-widget-drag-handle"
          aria-roledescription="Draggable widget"
          aria-label={dragLabel}
          role="button"
          tabIndex={0}
        >
          <FxIcon name="grip" size={20} />
        </span>
      )}
      {menuItems != null && menuItems.length > 0 && (
        <FxContextMenu
          items={menuItems}
          ariaLabel={menuLabel}
          onSelect={onMenuSelect}
          trigger={
            <button type="button" className="fx-widget-menu-trigger" aria-label={menuLabel}>
              <FxIcon name="more" size={20} />
            </button>
          }
        />
      )}
    </div>
  );

  let body: ReactNode;
  if (loading) {
    body = (
      <div className="fx-widget-body" aria-busy="true">
        <FxSkeletonLoader shape="text" lines={3} />
      </div>
    );
  } else if (error != null) {
    body = (
      <div className="fx-widget-body">
        <FxAlert
          tone="danger"
          description={error}
          live
          actions={
            onRetry != null ? (
              <FxButton variant="ghost" size="sm" onClick={onRetry} iconStart={<FxIcon name="refresh" size={16} />}>
                {retryLabel}
              </FxButton>
            ) : undefined
          }
        />
      </div>
    );
  } else if (empty != null) {
    body = (
      <div className="fx-widget-body">
        <FxEmptyState title={empty.title} description={empty.description} icon={empty.icon} size="sm" />
      </div>
    );
  } else {
    body = <div className="fx-widget-body">{children}</div>;
  }

  return (
    <FxCard
      padding="md"
      title={title}
      headerActions={headerActions}
      footer={
        refreshedAt != null ? (
          <span className="fx-widget-refreshed">Updated {relativeTime(refreshedAt)}</span>
        ) : undefined
      }
      className={className ? `fx-widget ${className}` : 'fx-widget'}
    >
      {body}
    </FxCard>
  );
}
