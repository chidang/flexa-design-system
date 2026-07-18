'use client';
/**
 * FxAppShell — the one shell per app (doc 04 §3.1).
 *
 * Interactive: owns the sidebar collapsed state (controlled via `sidebarCollapsed`
 * / `onSidebarCollapsedChange`, or uncontrolled via `defaultSidebarCollapsed`) and
 * threads it into the composed FxSidebar. It owns the landmark structure — the
 * `banner` topbar, the sidebar's `navigation`, and exactly one `main` — plus the
 * skip link, which is the FIRST tab stop and targets the `main`'s id in the same
 * markup. `F6` cycling landmark regions is a host binding (see keyboard docs).
 */
import { useCallback, useId, useState } from 'react';
import type { ReactNode } from 'react';
import { FxSidebar } from '../sidebar/sidebar';
import type { SidebarItem } from '../sidebar/sidebar';
import type { Density } from '../enums';

export interface FxAppShellProps {
  /** Sidebar destinations. */
  navigation: SidebarItem[];
  /** Optional banner slot above the content (host drops an FxTopNavigation etc.). */
  topbar?: ReactNode;
  /** Key of the active destination (threaded to the sidebar). */
  activeKey?: string;
  /** Controlled sidebar collapsed state. */
  sidebarCollapsed?: boolean;
  /** Uncontrolled initial sidebar collapsed state. */
  defaultSidebarCollapsed?: boolean;
  /** Fires when the sidebar rail is toggled. */
  onSidebarCollapsedChange?: (collapsed: boolean) => void;
  /** Vertical rhythm of the shell. */
  density?: Density;
  /** Accessible name for the sidebar nav landmark. */
  navAriaLabel?: string;
  /** Skip-link text — the first tab stop. */
  skipToContentLabel?: string;
  className?: string;
  /** Page content (rendered inside the single `main`). */
  children?: ReactNode;
}

export function FxAppShell({
  navigation,
  topbar,
  activeKey,
  sidebarCollapsed,
  defaultSidebarCollapsed = false,
  onSidebarCollapsedChange,
  density = 'comfortable',
  navAriaLabel = 'Main',
  skipToContentLabel = 'Skip to content',
  className,
  children,
}: FxAppShellProps) {
  const controlled = sidebarCollapsed !== undefined;
  const [internal, setInternal] = useState(defaultSidebarCollapsed);
  const isCollapsed = controlled ? sidebarCollapsed : internal;

  const handleCollapsedChange = useCallback(
    (next: boolean) => {
      if (!controlled) setInternal(next);
      onSidebarCollapsedChange?.(next);
    },
    [controlled, onSidebarCollapsedChange],
  );

  // Stable id shared by the skip link (href) and the main (target).
  const contentId = `${useId()}-content`;

  return (
    <div
      className={className ? `fx-app-shell ${className}` : 'fx-app-shell'}
      data-density={density}
      data-sidebar-collapsed={isCollapsed || undefined}
    >
      <a className="fx-app-shell-skip" href={`#${contentId}`}>
        {skipToContentLabel}
      </a>

      <div className="fx-app-shell-sidebar">
        <FxSidebar
          items={navigation}
          activeKey={activeKey}
          collapsed={isCollapsed}
          onCollapsedChange={handleCollapsedChange}
          ariaLabel={navAriaLabel}
        />
      </div>

      {topbar && (
        <header className="fx-app-shell-topbar" role="banner">
          {topbar}
        </header>
      )}

      <main id={contentId} className="fx-app-shell-content" tabIndex={-1}>
        <div className="fx-app-shell-content-inner">{children}</div>
      </main>

      <div className="fx-app-shell-toast-region" aria-live="polite" />
    </div>
  );
}
