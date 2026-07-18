/**
 * FxTopNavigationLayout — top-bar shell (doc 04 §3.1).
 *
 * Pure/RSC: a sticky header bar (host drops an FxTopNavigation into `nav`) above
 * the routed `main`. The marketing/public-facing alternative to sidebar-first
 * shells. The content column is capped by a container token; `full` opts out.
 */
import type { ReactNode } from 'react';

/** Container cap for the content column (maps to `size.container-*`). */
export type TopNavigationLayoutMaxWidth = 'lg' | 'xl' | 'full';

export interface FxTopNavigationLayoutProps {
  /** Bar content (typically an FxTopNavigation). */
  nav: ReactNode;
  /** Whether the bar sticks to the top on scroll. */
  sticky?: boolean;
  /** Container cap for the content column. */
  maxWidth?: TopNavigationLayoutMaxWidth;
  /** Optional id for the main region (skip-link target). */
  contentId?: string;
  className?: string;
  /** Routed page content. */
  children?: ReactNode;
}

export function FxTopNavigationLayout({
  nav,
  sticky = true,
  maxWidth = 'xl',
  contentId,
  className,
  children,
}: FxTopNavigationLayoutProps) {
  return (
    <div
      className={className ? `fx-top-nav-layout ${className}` : 'fx-top-nav-layout'}
      data-sticky={sticky || undefined}
      data-max-width={maxWidth}
    >
      <header className="fx-top-nav-layout-bar">{nav}</header>
      <main id={contentId} className="fx-top-nav-layout-content">
        <div className="fx-top-nav-layout-inner">{children}</div>
      </main>
    </div>
  );
}
