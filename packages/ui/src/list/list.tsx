'use client';
/**
 * FxList — vertical item list (doc 04 §2.24).
 *
 * Two modes. Plain (`selectable='none'`) renders `role="list"` and leaves any
 * links / actions inside rows in natural DOM tab order — no roving focus, so it
 * is inert server-side. Listbox mode (`selectable='single' | 'multi'`) renders
 * `role="listbox"` with a single tab stop, roving `tabindex`, `aria-selected`,
 * `Arrow`/Home/End navigation, typeahead and Space/Enter selection (APG listbox).
 * Selection is controlled or uncontrolled (§1.5). Every user-facing string is a
 * prop with an English default (i18n).
 */
import { useCallback, useId, useRef, useState } from 'react';
import type { KeyboardEvent, ReactNode } from 'react';

export type ListKey = string | number;

/** Selection behaviour. `single`/`multi` ⇒ `role="listbox"` + `aria-selected`. */
export type ListSelectable = 'none' | 'single' | 'multi';

/** State passed to `renderItem` so custom rows can reflect selection/focus. */
export interface ListItemState {
  selected: boolean;
  active: boolean;
  disabled: boolean;
}

/** One row of the list. */
export interface ListItem {
  /** Unique key within the list. */
  key: ListKey;
  /** Primary line. Also the typeahead / a11y string when a plain string. */
  title: ReactNode;
  /** Secondary line under the title. */
  description?: ReactNode;
  /** Leading media (icon / FxAvatar / FxCheckbox). */
  media?: ReactNode;
  /** Trailing content (timestamp / FxBadge / chevron / actions). */
  meta?: ReactNode;
  /** Non-selectable, dimmed (§1.7). */
  disabled?: boolean;
  /** Turns the row into an anchor (plain mode only). */
  href?: string;
}

export interface FxListProps {
  /** The rows. */
  items: ListItem[];
  /** Selection behaviour. Defaults to `none`. */
  selectable?: ListSelectable;
  /** Controlled selection (§1.5). */
  selectedKeys?: ListKey[];
  /** Uncontrolled initial selection. */
  defaultSelectedKeys?: ListKey[];
  /** Hairline separators between rows. */
  divided?: boolean;
  /** Full custom row renderer; receives the item and its state. */
  renderItem?: (item: ListItem, state: ListItemState) => ReactNode;
  /** Accessible name for the listbox (listbox mode). */
  'aria-label'?: string;
  /** aria-labelledby id when a visible label exists. */
  'aria-labelledby'?: string;
  /** Fired on activation (Enter / click) of an enabled row. */
  onSelect?: (item: ListItem) => void;
  /** Fired when the selection set changes (listbox mode). */
  onSelectionChange?: (keys: ListKey[]) => void;
  id?: string;
  className?: string;
}

function itemText(item: ListItem): string {
  return typeof item.title === 'string' ? item.title : '';
}

export function FxList({
  items,
  selectable = 'none',
  selectedKeys,
  defaultSelectedKeys = [],
  divided = false,
  renderItem,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledby,
  onSelect,
  onSelectionChange,
  id,
  className,
}: FxListProps) {
  const baseId = useId();
  const listId = id ?? baseId;
  const isListbox = selectable !== 'none';

  const selControlled = selectedKeys !== undefined;
  const [internalSel, setInternalSel] = useState<ListKey[]>(defaultSelectedKeys);
  const selected = selControlled ? selectedKeys : internalSel;

  const [activeIndex, setActiveIndex] = useState(() =>
    items.findIndex((it) => !it.disabled),
  );
  const optionRefs = useRef<Map<number, HTMLLIElement>>(new Map());
  const typeahead = useRef({ buffer: '', timer: null as ReturnType<typeof setTimeout> | null });

  const commitSelection = useCallback(
    (next: ListKey[]) => {
      if (!selControlled) setInternalSel(next);
      onSelectionChange?.(next);
    },
    [selControlled, onSelectionChange],
  );

  const toggle = (item: ListItem) => {
    if (item.disabled) return;
    onSelect?.(item);
    if (!isListbox) return;
    if (selectable === 'single') {
      commitSelection([item.key]);
    } else {
      const has = selected.includes(item.key);
      commitSelection(has ? selected.filter((k) => k !== item.key) : [...selected, item.key]);
    }
  };

  const focusIndex = (index: number) => {
    setActiveIndex(index);
    optionRefs.current.get(index)?.focus();
  };

  const step = (from: number, dir: 1 | -1) => {
    let i = from;
    for (let n = 0; n < items.length; n += 1) {
      i += dir;
      if (i < 0 || i >= items.length) return from;
      if (!items[i]?.disabled) return i;
    }
    return from;
  };

  const edge = (dir: 1 | -1) => {
    if (dir === 1) {
      for (let i = 0; i < items.length; i += 1) if (!items[i]?.disabled) return i;
    } else {
      for (let i = items.length - 1; i >= 0; i -= 1) if (!items[i]?.disabled) return i;
    }
    return activeIndex;
  };

  const runTypeahead = (char: string) => {
    const ta = typeahead.current;
    if (ta.timer) clearTimeout(ta.timer);
    ta.buffer += char.toLowerCase();
    ta.timer = setTimeout(() => {
      ta.buffer = '';
    }, 500);
    const match = items.findIndex(
      (it) => !it.disabled && itemText(it).toLowerCase().startsWith(ta.buffer),
    );
    if (match >= 0) focusIndex(match);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLLIElement>, index: number) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      focusIndex(step(index, 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      focusIndex(step(index, -1));
    } else if (e.key === 'Home') {
      e.preventDefault();
      focusIndex(edge(1));
    } else if (e.key === 'End') {
      e.preventDefault();
      focusIndex(edge(-1));
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      const item = items[index];
      if (item) toggle(item);
    } else if (e.key.length === 1 && !e.metaKey && !e.ctrlKey && !e.altKey) {
      runTypeahead(e.key);
    }
  };

  const rootClass = ['fx-list', className].filter(Boolean).join(' ');
  // The active tab-stop is the first enabled row (or the first selected one).
  const tabIndexOwner = (() => {
    const firstSelected = items.findIndex((it) => !it.disabled && selected.includes(it.key));
    if (firstSelected >= 0) return firstSelected;
    return items.findIndex((it) => !it.disabled);
  })();

  return (
    <ul
      className={rootClass}
      id={listId}
      role={isListbox ? 'listbox' : 'list'}
      aria-multiselectable={selectable === 'multi' || undefined}
      aria-label={ariaLabel}
      aria-labelledby={ariaLabelledby}
      data-divided={divided || undefined}
      data-selectable={isListbox ? selectable : undefined}
    >
      {items.map((item, index) => {
        const isSelected = isListbox && selected.includes(item.key);
        const isActive = index === activeIndex;
        const state: ListItemState = {
          selected: isSelected,
          active: isActive,
          disabled: !!item.disabled,
        };
        const rowClass = [
          'fx-list-item',
          isSelected ? 'is-selected' : '',
          isActive && isListbox ? 'is-active' : '',
          item.disabled ? 'is-disabled' : '',
        ]
          .filter(Boolean)
          .join(' ');

        const body = renderItem ? (
          renderItem(item, state)
        ) : (
          <>
            {item.media != null && <span className="fx-list-item-media">{item.media}</span>}
            <span className="fx-list-item-content">
              <span className="fx-list-item-title">{item.title}</span>
              {item.description != null && (
                <span className="fx-list-item-description">{item.description}</span>
              )}
            </span>
            {item.meta != null && <span className="fx-list-item-meta">{item.meta}</span>}
          </>
        );

        if (isListbox) {
          return (
            <li
              key={item.key}
              ref={(el) => {
                if (el) optionRefs.current.set(index, el);
                else optionRefs.current.delete(index);
              }}
              className={rowClass}
              role="option"
              aria-selected={isSelected}
              aria-disabled={item.disabled || undefined}
              tabIndex={item.disabled ? undefined : index === tabIndexOwner ? 0 : -1}
              data-active={isActive || undefined}
              onFocus={() => setActiveIndex(index)}
              onClick={() => toggle(item)}
              onKeyDown={(e) => onKeyDown(e, index)}
            >
              {body}
            </li>
          );
        }

        return (
          <li key={item.key} className={rowClass}>
            {item.href && !item.disabled ? (
              <a
                className="fx-list-item-link"
                href={item.href}
                onClick={() => onSelect?.(item)}
              >
                {body}
              </a>
            ) : (
              body
            )}
          </li>
        );
      })}
    </ul>
  );
}
