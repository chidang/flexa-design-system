/**
 * FxBlankStateLayout — a full-content-area first-run / zero-data surface
 * (doc 04 §3.1).
 *
 * Centers an FxEmptyState (`size="lg"`) in the content area, proxying its
 * title/description/icon/illustration/actions. An optional "Learn more" link
 * renders below the empty state when `learnMoreHref` is set. Pure presentational
 * (no hooks) → renders as an RSC in docs.
 */
import type { ReactNode } from 'react';
import { FxEmptyState } from '../empty-state/empty-state';
import type { IconName } from '../icon/map';

export interface FxBlankStateLayoutProps {
  /** What's true (required). */
  title: ReactNode;
  /** What to do next. */
  description?: ReactNode;
  /** Canonical icon for the media slot (decorative). */
  icon?: IconName;
  /** Custom illustration for the media slot (decorative; overrides `icon`). */
  illustration?: ReactNode;
  /** Primary action slot (+ optional secondary). */
  actions?: ReactNode;
  /** When set, renders a secondary "Learn more" link below the empty state. */
  learnMoreHref?: string;
  /** Learn-more link label. */
  learnMoreLabel?: string;
  className?: string;
}

export function FxBlankStateLayout({
  title,
  description,
  icon,
  illustration,
  actions,
  learnMoreHref,
  learnMoreLabel = 'Learn more',
  className,
}: FxBlankStateLayoutProps) {
  return (
    <div className={className ? `fx-blank-state-layout ${className}` : 'fx-blank-state-layout'}>
      <FxEmptyState
        title={title}
        description={description}
        icon={icon}
        illustration={illustration}
        actions={actions}
        size="lg"
      />
      {learnMoreHref != null && (
        <a className="fx-blank-state-layout-learn-more" href={learnMoreHref}>
          {learnMoreLabel}
        </a>
      )}
    </div>
  );
}
