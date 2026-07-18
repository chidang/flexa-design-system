/**
 * FxQuickActions — a promoted cluster of 2–6 high-value actions (doc 04 §3.2).
 *
 * Pure/RSC: a grid of card-styled buttons (or links when `href` is set). No
 * composite-widget semantics — each tile is a plain button/link, so there is no
 * state to manage and it renders on the server.
 */
import type { CSSProperties } from 'react';
import { FxIcon } from '../icon/FxIcon';
import type { IconName } from '../icon/map';
import type { Size } from '../enums';

export interface QuickAction {
  id: string;
  label: string;
  icon: IconName;
  description?: string;
  href?: string;
  onClick?: () => void;
  disabled?: boolean;
}

export interface FxQuickActionsProps {
  actions: QuickAction[];
  /** Fixed column count, or `'auto'` to flow by available width. */
  columns?: number | 'auto';
  size?: Size;
  /** Accessible name for the group landmark. */
  ariaLabel?: string;
  className?: string;
}

export function FxQuickActions({
  actions,
  columns = 'auto',
  size = 'md',
  ariaLabel = 'Quick actions',
  className,
}: FxQuickActionsProps) {
  const style: CSSProperties | undefined =
    typeof columns === 'number'
      ? ({ '--fx-quick-actions-cols': String(columns) } as CSSProperties)
      : undefined;

  return (
    <div
      className={className ? `fx-quick-actions ${className}` : 'fx-quick-actions'}
      role="group"
      aria-label={ariaLabel}
      data-size={size}
      data-columns={typeof columns === 'number' ? 'fixed' : 'auto'}
      style={style}
    >
      {actions.map((action) => {
        const body = (
          <>
            <span className="fx-quick-action-icon">
              <FxIcon name={action.icon} size={24} />
            </span>
            <span className="fx-quick-action-body">
              <span className="fx-quick-action-label">{action.label}</span>
              {action.description && (
                <span className="fx-quick-action-desc">{action.description}</span>
              )}
            </span>
          </>
        );

        if (action.href && !action.disabled) {
          return (
            <a className="fx-quick-action" href={action.href} key={action.id}>
              {body}
            </a>
          );
        }
        return (
          <button
            type="button"
            className="fx-quick-action"
            key={action.id}
            onClick={action.onClick}
            disabled={action.disabled}
            aria-disabled={action.disabled || undefined}
          >
            {body}
          </button>
        );
      })}
    </div>
  );
}
