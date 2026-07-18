'use client';
/**
 * FxNestedSidebar — FxSidebar with one level of expandable groups (doc 04 §3.2).
 *
 * Interactive: parent rows are disclosure buttons (`aria-expanded` + `aria-controls`)
 * revealing an indented nested list of child links; max two levels. Expanded keys are
 * controlled or uncontrolled (§1.5 `expandedKeys`/`defaultExpandedKeys`), and the
 * ancestor chain of the active child auto-expands on mount when `autoExpandActive`.
 */
import { useCallback, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { FxIcon } from '../icon/FxIcon';
import type { IconName } from '../icon/map';

export interface NestedSidebarItem {
  key: string;
  label: string;
  icon: IconName;
  href?: string;
  badge?: number;
  section?: string;
  children?: { key: string; label: string; href: string; badge?: number }[];
}

export interface FxNestedSidebarProps {
  items: NestedSidebarItem[];
  activeKey?: string;
  /** Controlled expanded parent keys. */
  expandedKeys?: string[];
  /** Uncontrolled initial expanded parent keys. */
  defaultExpandedKeys?: string[];
  /** Expand the parent of the active child on mount. */
  autoExpandActive?: boolean;
  header?: ReactNode;
  footer?: ReactNode;
  ariaLabel?: string;
  onNavigate?: (item: { key: string; href?: string }) => void;
  onExpandedChange?: (keys: string[]) => void;
  className?: string;
}

/** Keys of parents whose children include the active key. */
export function activeAncestors(items: NestedSidebarItem[], activeKey: string | undefined): string[] {
  if (!activeKey) return [];
  return items
    .filter((it) => it.children?.some((c) => c.key === activeKey))
    .map((it) => it.key);
}

export function FxNestedSidebar({
  items,
  activeKey,
  expandedKeys,
  defaultExpandedKeys,
  autoExpandActive = true,
  header,
  footer,
  ariaLabel = 'Main',
  onNavigate,
  onExpandedChange,
  className,
}: FxNestedSidebarProps) {
  const controlled = expandedKeys !== undefined;
  const initial = useMemo(() => {
    const seed = new Set(defaultExpandedKeys ?? []);
    if (autoExpandActive) activeAncestors(items, activeKey).forEach((k) => seed.add(k));
    return seed;
    // eslint-disable-next-line react-hooks/exhaustive-deps -- seed once on mount
  }, []);
  const [internal, setInternal] = useState<Set<string>>(initial);
  const expanded = controlled ? new Set(expandedKeys) : internal;

  const toggle = useCallback(
    (key: string) => {
      const next = new Set(controlled ? expandedKeys : internal);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      if (!controlled) setInternal(next);
      onExpandedChange?.([...next]);
    },
    [controlled, expandedKeys, internal, onExpandedChange],
  );

  return (
    <nav
      className={className ? `fx-sidebar fx-nested-sidebar ${className}` : 'fx-sidebar fx-nested-sidebar'}
      aria-label={ariaLabel}
    >
      {header && <div className="fx-sidebar-header">{header}</div>}

      <div className="fx-sidebar-nav">
        <ul className="fx-sidebar-list">
          {items.map((item) => {
            const hasChildren = !!item.children?.length;
            const isExpanded = expanded.has(item.key);
            const groupId = `fx-nested-${item.key}`;
            const active = item.key === activeKey;
            const childActive = item.children?.some((c) => c.key === activeKey);

            if (!hasChildren) {
              return (
                <li key={item.key}>
                  <a
                    className="fx-sidebar-item"
                    href={item.href}
                    data-active={active || undefined}
                    aria-current={active ? 'page' : undefined}
                    onClick={() => onNavigate?.({ key: item.key, href: item.href })}
                  >
                    <span className="fx-sidebar-item-icon">
                      <FxIcon name={item.icon} size={20} />
                    </span>
                    <span className="fx-sidebar-item-label">{item.label}</span>
                  </a>
                </li>
              );
            }

            return (
              <li key={item.key}>
                <button
                  type="button"
                  className="fx-sidebar-item fx-sidebar-item-toggle"
                  data-active={childActive || undefined}
                  aria-expanded={isExpanded}
                  aria-controls={groupId}
                  onClick={() => toggle(item.key)}
                >
                  <span className="fx-sidebar-item-icon">
                    <FxIcon name={item.icon} size={20} />
                  </span>
                  <span className="fx-sidebar-item-label">{item.label}</span>
                  <FxIcon
                    name="chevron"
                    size={16}
                    className="fx-sidebar-item-chevron"
                  />
                </button>
                <ul
                  id={groupId}
                  className="fx-sidebar-subitems"
                  hidden={!isExpanded}
                >
                  {item.children!.map((child) => {
                    const cActive = child.key === activeKey;
                    return (
                      <li key={child.key}>
                        <a
                          className="fx-sidebar-subitem"
                          href={child.href}
                          data-active={cActive || undefined}
                          aria-current={cActive ? 'page' : undefined}
                          onClick={() => onNavigate?.({ key: child.key, href: child.href })}
                        >
                          <span className="fx-sidebar-item-label">{child.label}</span>
                          {child.badge !== undefined && child.badge > 0 && (
                            <span className="fx-sidebar-item-badge">
                              {child.badge > 99 ? '99+' : child.badge}
                            </span>
                          )}
                        </a>
                      </li>
                    );
                  })}
                </ul>
              </li>
            );
          })}
        </ul>
      </div>

      {footer && <div className="fx-sidebar-footer">{footer}</div>}
    </nav>
  );
}
