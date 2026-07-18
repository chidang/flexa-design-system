'use client';
/**
 * FxSidebar — primary app navigation rail (doc 04 §2.46).
 *
 * Interactive: controlled or uncontrolled collapsed state (§1.5
 * `collapsed`/`defaultCollapsed`/`onCollapsedChange`). Items are links in DOM
 * order; the active item carries `aria-current="page"`. Collapsed = 64px icon
 * rail; expanded = 240px. The collapse toggle is a button with `aria-expanded`.
 */
import { useCallback, useState } from 'react';
import type { ReactNode } from 'react';
import { FxIcon } from '../icon/FxIcon';
import type { IconName } from '../icon/map';

export interface SidebarItem {
  key: string;
  label: string;
  icon: IconName;
  href: string;
  badge?: number;
  section?: string;
}

export interface FxSidebarProps {
  items: SidebarItem[];
  /** Key of the active destination. */
  activeKey?: string;
  /** Controlled collapsed state. */
  collapsed?: boolean;
  /** Uncontrolled initial collapsed state. */
  defaultCollapsed?: boolean;
  header?: ReactNode;
  footer?: ReactNode;
  /** Accessible name for the nav landmark. */
  ariaLabel?: string;
  collapseLabel?: string;
  expandLabel?: string;
  onNavigate?: (item: SidebarItem) => void;
  onCollapsedChange?: (collapsed: boolean) => void;
  className?: string;
}

/** Group items by their `section` while preserving first-seen order. */
export function groupBySection(
  items: SidebarItem[],
): { section: string | undefined; items: SidebarItem[] }[] {
  const groups: { section: string | undefined; items: SidebarItem[] }[] = [];
  for (const item of items) {
    const last = groups[groups.length - 1];
    if (last && last.section === item.section) last.items.push(item);
    else groups.push({ section: item.section, items: [item] });
  }
  return groups;
}

export function FxSidebar({
  items,
  activeKey,
  collapsed,
  defaultCollapsed = false,
  header,
  footer,
  ariaLabel = 'Main',
  collapseLabel = 'Collapse sidebar',
  expandLabel = 'Expand sidebar',
  onNavigate,
  onCollapsedChange,
  className,
}: FxSidebarProps) {
  const controlled = collapsed !== undefined;
  const [internal, setInternal] = useState(defaultCollapsed);
  const isCollapsed = controlled ? collapsed : internal;

  const toggle = useCallback(() => {
    const next = !isCollapsed;
    if (!controlled) setInternal(next);
    onCollapsedChange?.(next);
  }, [isCollapsed, controlled, onCollapsedChange]);

  return (
    <nav
      className={className ? `fx-sidebar ${className}` : 'fx-sidebar'}
      aria-label={ariaLabel}
      data-collapsed={isCollapsed || undefined}
    >
      {header && <div className="fx-sidebar-header">{header}</div>}

      <div className="fx-sidebar-nav">
        {groupBySection(items).map((group, gi) => (
          <div className="fx-sidebar-section" key={group.section ?? `section-${gi}`}>
            {group.section && !isCollapsed && (
              <p className="fx-sidebar-section-label">{group.section}</p>
            )}
            <ul className="fx-sidebar-list">
              {group.items.map((item) => {
                const active = item.key === activeKey;
                return (
                  <li key={item.key}>
                    <a
                      className="fx-sidebar-item"
                      href={item.href}
                      data-active={active || undefined}
                      aria-current={active ? 'page' : undefined}
                      title={isCollapsed ? item.label : undefined}
                      onClick={() => onNavigate?.(item)}
                    >
                      <span className="fx-sidebar-item-icon">
                        <FxIcon name={item.icon} size={20} />
                      </span>
                      <span className="fx-sidebar-item-label">{item.label}</span>
                      {item.badge !== undefined && item.badge > 0 && (
                        <span className="fx-sidebar-item-badge">
                          {item.badge > 99 ? '99+' : item.badge}
                        </span>
                      )}
                    </a>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>

      <div className="fx-sidebar-footer">
        {footer}
        <button
          type="button"
          className="fx-sidebar-collapse"
          aria-label={isCollapsed ? expandLabel : collapseLabel}
          aria-expanded={!isCollapsed}
          onClick={toggle}
        >
          <FxIcon name="chevron" size={20} className="fx-sidebar-collapse-icon" />
        </button>
      </div>
    </nav>
  );
}
