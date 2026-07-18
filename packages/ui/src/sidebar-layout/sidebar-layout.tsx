/**
 * FxSidebarLayout — generic two-pane shell (doc 04 §3.1).
 *
 * Pure/RSC: a fixed-width start pane (the `aside` slot) beside a fluid main
 * column. Not itself a landmark — the children bring their own roles (App Shell
 * and Settings Layout compose it). Responsive class hooks: at the tablet
 * breakpoint the aside narrows to an icon rail; on mobile it becomes an
 * off-canvas drawer (visuals kept simple — hosts wire the drawer toggle).
 */
import type { ReactNode } from 'react';

/** Fixed width of the start pane (`sm` 208px / `md` 256px). */
export type SidebarLayoutAsideWidth = 'sm' | 'md';

export interface FxSidebarLayoutProps {
  /** Start pane content (typically an FxSidebar). */
  aside: ReactNode;
  /** Fixed width of the start pane. */
  asideWidth?: SidebarLayoutAsideWidth;
  /** Whether the aside may collapse to a rail at the tablet breakpoint. */
  collapsible?: boolean;
  /** Whether the aside sticks while the main column scrolls. */
  stickyAside?: boolean;
  className?: string;
  /** Fluid main column. */
  children?: ReactNode;
}

export function FxSidebarLayout({
  aside,
  asideWidth = 'md',
  collapsible = true,
  stickyAside = true,
  className,
  children,
}: FxSidebarLayoutProps) {
  return (
    <div
      className={className ? `fx-sidebar-layout ${className}` : 'fx-sidebar-layout'}
      data-aside-width={asideWidth}
      data-collapsible={collapsible || undefined}
      data-sticky-aside={stickyAside || undefined}
    >
      <div className="fx-sidebar-layout-aside">{aside}</div>
      <div className="fx-sidebar-layout-main">{children}</div>
    </div>
  );
}
