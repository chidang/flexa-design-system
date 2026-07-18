'use client';
/**
 * FxTabs — same-page facet switching (doc 04 §2.34, APG tabs pattern).
 *
 * Interactive: roving-tabindex tablist (one Tab stop), controlled or uncontrolled
 * active tab (§1.5 `value`/`defaultValue`). `activation='auto'` selects on focus;
 * `'manual'` selects on Enter/Space. Arrow keys wrap and skip disabled tabs;
 * Home/End jump to ends; Tab from the tab moves to the active panel.
 */
import { useCallback, useId, useRef, useState } from 'react';
import type { KeyboardEvent, ReactNode } from 'react';
import { FxIcon } from '../icon/FxIcon';
import type { IconName } from '../icon/map';
import type { Size } from '../enums';

export interface TabItem {
  id: string;
  label: string;
  icon?: IconName;
  badge?: number;
  disabled?: boolean;
  content: ReactNode;
}

export interface FxTabsProps {
  items: TabItem[];
  /** Controlled active tab id. */
  value?: string;
  /** Uncontrolled initial active tab id (defaults to first enabled). */
  defaultValue?: string;
  variant?: 'underline' | 'contained';
  /** `auto` = focus selects; `manual` = Enter/Space selects. */
  activation?: 'auto' | 'manual';
  orientation?: 'horizontal' | 'vertical';
  size?: Size;
  onChange?: (id: string) => void;
  className?: string;
}

function firstEnabled(items: TabItem[]): string | undefined {
  return items.find((t) => !t.disabled)?.id ?? items[0]?.id;
}

export function FxTabs({
  items,
  value,
  defaultValue,
  variant = 'underline',
  activation = 'auto',
  orientation = 'horizontal',
  size = 'md',
  onChange,
  className,
}: FxTabsProps) {
  const baseId = useId();
  const controlled = value !== undefined;
  const [internal, setInternal] = useState<string | undefined>(
    () => defaultValue ?? firstEnabled(items),
  );
  const active = controlled ? value : internal;
  const tabRefs = useRef<Map<string, HTMLButtonElement>>(new Map());

  const select = useCallback(
    (id: string) => {
      if (!controlled) setInternal(id);
      onChange?.(id);
    },
    [controlled, onChange],
  );

  const enabledIds = items.filter((t) => !t.disabled).map((t) => t.id);

  const focusTab = (id: string) => {
    const el = tabRefs.current.get(id);
    el?.focus();
    if (activation === 'auto') select(id);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>, currentId: string) => {
    const forward = orientation === 'horizontal' ? 'ArrowRight' : 'ArrowDown';
    const back = orientation === 'horizontal' ? 'ArrowLeft' : 'ArrowUp';
    const idx = enabledIds.indexOf(currentId);
    if (idx === -1) return;

    if (e.key === forward) {
      e.preventDefault();
      focusTab(enabledIds[(idx + 1) % enabledIds.length]!);
    } else if (e.key === back) {
      e.preventDefault();
      focusTab(enabledIds[(idx - 1 + enabledIds.length) % enabledIds.length]!);
    } else if (e.key === 'Home') {
      e.preventDefault();
      focusTab(enabledIds[0]!);
    } else if (e.key === 'End') {
      e.preventDefault();
      focusTab(enabledIds[enabledIds.length - 1]!);
    } else if ((e.key === 'Enter' || e.key === ' ') && activation === 'manual') {
      e.preventDefault();
      select(currentId);
    }
  };

  return (
    <div
      className={className ? `fx-tabs ${className}` : 'fx-tabs'}
      data-variant={variant}
      data-size={size}
      data-orientation={orientation}
    >
      <div
        className="fx-tabs-list"
        role="tablist"
        aria-orientation={orientation}
      >
        {items.map((tab) => {
          const isActive = tab.id === active;
          return (
            <button
              type="button"
              key={tab.id}
              ref={(el) => {
                if (el) tabRefs.current.set(tab.id, el);
                else tabRefs.current.delete(tab.id);
              }}
              className="fx-tabs-tab"
              role="tab"
              id={`${baseId}-tab-${tab.id}`}
              aria-controls={`${baseId}-panel-${tab.id}`}
              aria-selected={isActive}
              aria-disabled={tab.disabled || undefined}
              data-active={isActive || undefined}
              tabIndex={isActive ? 0 : -1}
              disabled={tab.disabled}
              onClick={() => !tab.disabled && select(tab.id)}
              onKeyDown={(e) => onKeyDown(e, tab.id)}
            >
              {tab.icon && (
                <span className="fx-tabs-tab-icon">
                  <FxIcon name={tab.icon} size={16} />
                </span>
              )}
              <span className="fx-tabs-tab-label">{tab.label}</span>
              {tab.badge !== undefined && (
                <span className="fx-tabs-tab-badge">{tab.badge}</span>
              )}
            </button>
          );
        })}
      </div>

      {items.map((tab) => {
        const isActive = tab.id === active;
        return (
          <div
            key={tab.id}
            className="fx-tabs-panel"
            role="tabpanel"
            id={`${baseId}-panel-${tab.id}`}
            aria-labelledby={`${baseId}-tab-${tab.id}`}
            tabIndex={0}
            hidden={!isActive}
          >
            {isActive && tab.content}
          </div>
        );
      })}
    </div>
  );
}
