'use client';
/**
 * FxContextMenu — APG menu pattern; the engine behind overflow ("⋯") menus,
 * dropdown action menus, and right-click menus (doc 04 §2.39).
 *
 * Interactive + SSR-safe portal: renders into `document.body` only after mount
 * and while open. Controlled or uncontrolled open state (§1.5). Keyboard: Up/Down
 * roving (wrap), Home/End, Enter/Space activate, Esc closes and restores focus to
 * the trigger, Tab closes and moves on. Disabled items stay focusable (APG:
 * discoverable, not operable). The trigger is rendered inside a lightweight
 * wrapper so focus can be restored without requiring the caller to forward a ref.
 */
import { cloneElement, useCallback, useEffect, useId, useRef, useState } from 'react';
import type { KeyboardEvent, ReactElement, ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { FxIcon } from '../icon/FxIcon';
import { useAnchorPosition } from '../anchor';
import type { IconName } from '../icon/map';

export interface MenuItem {
  id: string;
  label: string;
  icon?: IconName;
  kbd?: string;
  tone?: 'danger';
  disabled?: boolean;
  type?: 'item' | 'separator' | 'label';
}

export interface FxContextMenuProps {
  items: MenuItem[];
  /** The trigger node (a button). Cloned to receive aria-haspopup/expanded. */
  trigger: ReactElement<Record<string, unknown>>;
  /** Controlled open state. */
  open?: boolean;
  /** Uncontrolled initial open state. */
  defaultOpen?: boolean;
  /** Accessible name for the menu. */
  ariaLabel?: string;
  onSelect?: (item: MenuItem) => void;
  onOpenChange?: (open: boolean) => void;
  className?: string;
}

const isActionable = (i: MenuItem) => (i.type ?? 'item') === 'item';

export function FxContextMenu({
  items,
  trigger,
  open,
  defaultOpen = false,
  ariaLabel = 'Menu',
  onSelect,
  onOpenChange,
  className,
}: FxContextMenuProps) {
  const menuId = useId();
  const controlled = open !== undefined;
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const isOpen = controlled ? open : internalOpen;

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const wrapRef = useRef<HTMLSpanElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const itemRefs = useRef<Map<string, HTMLLIElement>>(new Map());
  const popRef = useRef<HTMLDivElement>(null);
  const popStyle = useAnchorPosition(Boolean(isOpen && mounted), wrapRef, popRef, {
    align: 'end',
  });
  const [activeId, setActiveId] = useState<string | null>(null);

  const actionable = items.filter(isActionable);

  const setOpen = useCallback(
    (next: boolean) => {
      if (!controlled) setInternalOpen(next);
      onOpenChange?.(next);
    },
    [controlled, onOpenChange],
  );

  const focusTrigger = () => {
    wrapRef.current?.querySelector<HTMLElement>('button, [href], [tabindex]')?.focus();
  };

  const focusItem = (id: string) => {
    setActiveId(id);
    itemRefs.current.get(id)?.focus();
  };

  const openMenu = (toLast = false) => {
    setOpen(true);
    const target = toLast ? actionable[actionable.length - 1] : actionable[0];
    requestAnimationFrame(() => {
      if (target) focusItem(target.id);
    });
  };

  const close = (restore = true) => {
    setOpen(false);
    setActiveId(null);
    if (restore) focusTrigger();
  };

  const activate = (item: MenuItem) => {
    if (item.disabled || !isActionable(item)) return;
    onSelect?.(item);
    close();
  };

  const onListKeyDown = (e: KeyboardEvent<HTMLUListElement>) => {
    const ids = actionable.map((i) => i.id);
    if (ids.length === 0) return;
    const current = activeId ? ids.indexOf(activeId) : -1;
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        focusItem(ids[(current + 1) % ids.length]!);
        break;
      case 'ArrowUp':
        e.preventDefault();
        focusItem(ids[(current - 1 + ids.length) % ids.length]!);
        break;
      case 'Home':
        e.preventDefault();
        focusItem(ids[0]!);
        break;
      case 'End':
        e.preventDefault();
        focusItem(ids[ids.length - 1]!);
        break;
      case 'Enter':
      case ' ': {
        e.preventDefault();
        const item = items.find((i) => i.id === activeId);
        if (item) activate(item);
        break;
      }
      case 'Escape':
        e.preventDefault();
        close();
        break;
      case 'Tab':
        close(false);
        break;
      default:
        break;
    }
  };

  const triggerOnClick = trigger.props.onClick as ((e: unknown) => void) | undefined;
  const triggerProps: Record<string, unknown> = {
    'aria-haspopup': 'menu',
    'aria-expanded': isOpen,
    onClick: (e: unknown) => {
      triggerOnClick?.(e);
      if (isOpen) close(false);
      else openMenu();
    },
    onKeyDown: (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openMenu();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        openMenu(true);
      }
    },
  };
  const wiredTrigger = cloneElement(trigger, triggerProps);

  // Close on outside pointer while open.
  useEffect(() => {
    if (!isOpen) return;
    const onPointer = (e: PointerEvent) => {
      const target = e.target as Node;
      if (listRef.current?.contains(target) || wrapRef.current?.contains(target)) return;
      close(false);
    };
    document.addEventListener('pointerdown', onPointer, true);
    return () => document.removeEventListener('pointerdown', onPointer, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const menu: ReactNode =
    isOpen && mounted
      ? createPortal(
          <div
            ref={popRef}
            className={className ? `fx-context-menu ${className}` : 'fx-context-menu'}
            style={popStyle}
          >
            <ul
              ref={listRef}
              className="fx-context-menu-list"
              role="menu"
              aria-label={ariaLabel}
              id={menuId}
              onKeyDown={onListKeyDown}
            >
              {items.map((item, i) => {
                if (item.type === 'separator') {
                  return (
                    <li key={item.id || `sep-${i}`} className="fx-context-menu-separator" role="separator" />
                  );
                }
                if (item.type === 'label') {
                  return (
                    <li
                      key={item.id || `label-${i}`}
                      className="fx-context-menu-group-label"
                      role="presentation"
                    >
                      {item.label}
                    </li>
                  );
                }
                return (
                  <li
                    key={item.id}
                    ref={(el) => {
                      if (el) itemRefs.current.set(item.id, el);
                      else itemRefs.current.delete(item.id);
                    }}
                    className="fx-context-menu-item"
                    role="menuitem"
                    data-tone={item.tone}
                    aria-disabled={item.disabled || undefined}
                    tabIndex={-1}
                    onClick={() => activate(item)}
                    onMouseEnter={() => !item.disabled && setActiveId(item.id)}
                  >
                    {item.icon && (
                      <span className="fx-context-menu-item-icon">
                        <FxIcon name={item.icon} size={16} />
                      </span>
                    )}
                    <span className="fx-context-menu-item-label">{item.label}</span>
                    {item.kbd && <kbd className="fx-context-menu-item-kbd">{item.kbd}</kbd>}
                  </li>
                );
              })}
            </ul>
          </div>,
          document.body,
        )
      : null;

  return (
    <span className="fx-context-menu-trigger" ref={wrapRef}>
      {wiredTrigger}
      {menu}
    </span>
  );
}
