/**
 * FxEmptyState — the zero-data / no-results surface (doc 04 §2.33).
 *
 * Pure presentational (no hooks) → renders as an RSC in docs. Title says what's
 * true; description says what to do (copy rules, doc 10). Media is decorative
 * (`aria-hidden`). When replacing async content, mount inside the surface's
 * `role="status"` context so the transition announces.
 */
import type { ReactNode } from 'react';
import { FxIcon } from '../icon/FxIcon';
import type { IconName } from '../icon/map';

export type EmptyStateSize = 'sm' | 'md' | 'lg';

export interface FxEmptyStateProps {
  /** What's true (required). */
  title: ReactNode;
  /** What to do next. */
  description?: ReactNode;
  /** Canonical icon for the media slot (decorative). */
  icon?: IconName;
  /** Custom illustration for the media slot (decorative; overrides `icon`). */
  illustration?: ReactNode;
  /** Action slot — primary FxButton (+ optional secondary/link). */
  actions?: ReactNode;
  /** Density. `sm` inline/table · `md` panel · `lg` full-page. Defaults to `md`. */
  size?: EmptyStateSize;
  className?: string;
}

export function FxEmptyState({
  title,
  description,
  icon,
  illustration,
  actions,
  size = 'md',
  className,
}: FxEmptyStateProps) {
  const media = illustration ?? (icon ? <FxIcon name={icon} size={24} /> : null);
  return (
    <div className={className ? `fx-empty-state ${className}` : 'fx-empty-state'} data-size={size}>
      {media && (
        <div className="fx-empty-state-media" aria-hidden="true">
          {media}
        </div>
      )}
      {/* div, not p: title/description accept block content (FxErrorPage passes
          its own <h1>), and an element inside <p> is invalid nesting — the
          browser force-closes the <p>, breaking the DOM. Styling is class-based
          so the element swap is invisible. */}
      <div className="fx-empty-state-title">{title}</div>
      {description != null && <div className="fx-empty-state-description">{description}</div>}
      {actions != null && <div className="fx-empty-state-actions">{actions}</div>}
    </div>
  );
}
