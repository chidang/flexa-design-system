/**
 * FxBottomNavigation — mobile bottom tab bar (doc 04 §3.1).
 *
 * Pure/RSC: a fixed bar of 3–5 destination links (icon + label + optional badge),
 * pinned to the bottom edge with safe-area inset padding. The active item carries
 * `aria-current="page"`. Hidden ≥768px, where the sidebar takes over. Items reuse
 * the `SidebarItem` shape minus `section`.
 */
import { FxIcon } from '../icon/FxIcon';
import type { IconName } from '../icon/map';

export interface BottomNavItem {
  key: string;
  label: string;
  icon: IconName;
  href: string;
  badge?: number;
}

export interface FxBottomNavigationProps {
  /** Destinations (3–5; outside that range still renders but is clamped to 5). */
  items: BottomNavItem[];
  /** Key of the active destination. */
  activeKey?: string;
  /** Accessible name for the nav landmark. */
  ariaLabel?: string;
  /** Icon-only mode — honoured only with ≥4 items. */
  hideLabels?: boolean;
  className?: string;
}

export function FxBottomNavigation({
  items,
  activeKey,
  ariaLabel = 'Main',
  hideLabels = false,
  className,
}: FxBottomNavigationProps) {
  // Contract: 3–5 items. Render defensively rather than throw — clamp the tail.
  const shown = items.slice(0, 5);
  // Labels may only hide when there are enough items to stay recognisable.
  const labelsHidden = hideLabels && shown.length >= 4;

  return (
    <nav
      className={className ? `fx-bottom-nav ${className}` : 'fx-bottom-nav'}
      aria-label={ariaLabel}
      data-hide-labels={labelsHidden || undefined}
    >
      <ul className="fx-bottom-nav-list">
        {shown.map((item) => {
          const active = item.key === activeKey;
          const badge = item.badge !== undefined && item.badge > 0 ? item.badge : undefined;
          return (
            <li className="fx-bottom-nav-cell" key={item.key}>
              <a
                className="fx-bottom-nav-item"
                href={item.href}
                data-active={active || undefined}
                aria-current={active ? 'page' : undefined}
                aria-label={labelsHidden ? item.label : undefined}
              >
                <span className="fx-bottom-nav-icon">
                  <FxIcon name={item.icon} size={24} />
                  {badge !== undefined && (
                    <span className="fx-bottom-nav-badge" aria-hidden="true">
                      {badge > 99 ? '99+' : badge}
                    </span>
                  )}
                </span>
                {!labelsHidden && <span className="fx-bottom-nav-label">{item.label}</span>}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
