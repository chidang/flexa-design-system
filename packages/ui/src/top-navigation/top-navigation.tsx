/**
 * FxTopNavigation — horizontal primary navigation bar (doc 04 §3.2).
 *
 * Pure/RSC: a static banner of destination links plus utility slots (search,
 * notifications, user). Active link carries `aria-current="page"`. Overlay
 * behaviors (the notification/user menus, the ⌘K palette) are host compositions
 * bound to the exposed trigger buttons — this component owns no open state, so it
 * server-renders and needs no client island.
 */
import type { ReactNode } from 'react';
import { FxIcon } from '../icon/FxIcon';
import type { IconName } from '../icon/map';

export interface TopNavItem {
  key: string;
  label: string;
  href: string;
  icon?: IconName;
}

export interface FxTopNavigationProps {
  items: TopNavItem[];
  /** Key of the active destination (host derives from the URL). */
  activeKey?: string;
  /** Brand slot (logo, home link). */
  brand?: ReactNode;
  /** Search slot (FxSearchBar or a ⌘K trigger). */
  search?: ReactNode;
  /** Trailing action slot (avatar menu trigger, custom buttons). */
  actions?: ReactNode;
  /** Unread notification count; renders a bell trigger when defined. */
  notificationCount?: number;
  /** Accessible name for the notification trigger. */
  notificationLabel?: string;
  /** Fires when the notification trigger is activated (host opens the menu). */
  onNotificationsClick?: () => void;
  className?: string;
}

export function FxTopNavigation({
  items,
  activeKey,
  brand,
  search,
  actions,
  notificationCount,
  notificationLabel = 'Notifications',
  onNotificationsClick,
  className,
}: FxTopNavigationProps) {
  const showBell = notificationCount !== undefined;
  const count = notificationCount ?? 0;

  return (
    <header
      className={className ? `fx-top-nav ${className}` : 'fx-top-nav'}
      // role banner is implicit on a top-level <header>, but the shell may nest it.
      role="banner"
    >
      {brand && <div className="fx-top-nav-brand">{brand}</div>}

      <nav className="fx-top-nav-links" aria-label="Primary">
        <ul className="fx-top-nav-list">
          {items.map((item) => {
            const active = item.key === activeKey;
            return (
              <li className="fx-top-nav-item" key={item.key}>
                <a
                  className="fx-top-nav-link"
                  href={item.href}
                  data-active={active || undefined}
                  aria-current={active ? 'page' : undefined}
                >
                  {item.icon && <FxIcon name={item.icon} size={16} />}
                  <span className="fx-top-nav-link-label">{item.label}</span>
                </a>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="fx-top-nav-utilities">
        {search && <div className="fx-top-nav-search">{search}</div>}
        {showBell && (
          <button
            type="button"
            className="fx-top-nav-bell"
            aria-label={
              count > 0 ? `${notificationLabel} (${count})` : notificationLabel
            }
            aria-haspopup="menu"
            onClick={onNotificationsClick}
          >
            <FxIcon name="bell" size={20} />
            {count > 0 && (
              <span className="fx-top-nav-bell-badge" aria-hidden="true">
                {count > 99 ? '99+' : count}
              </span>
            )}
          </button>
        )}
        {actions && <div className="fx-top-nav-actions">{actions}</div>}
      </div>
    </header>
  );
}
