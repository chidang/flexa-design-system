'use client';
/**
 * FxSelect — APG combobox + listbox (doc 04 §2.8).
 *
 * Custom trigger (`role="combobox"`) opens a portalled `role="listbox"` popover.
 * Keyboard focus stays on the trigger; the active option is tracked via
 * `aria-activedescendant`. SSR-safe: the popover portal mounts only after the
 * client mount effect and while open, so nothing renders server-side. Controlled
 * or uncontrolled for both `value` and `open` (§1.5). Every user-facing string is
 * a prop with a documented default (i18n).
 */
import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import type { KeyboardEvent, ReactNode } from 'react';
import { createPortal } from 'react-dom';
import type { Size } from '../enums';
import { FxIcon } from '../icon/FxIcon';
import { useAnchorPosition } from '../anchor';
import type { IconName } from '../icon/map';

/** A single selectable option. */
export interface OptionItem {
  /** Committed value (unique within the list). */
  value: string;
  /** Visible label — also used for typeahead & a11y. */
  label: string;
  /** Optional secondary line under the label. */
  description?: string;
  /** Optional leading icon. */
  icon?: IconName;
  /** Focusable-by-activedescendant but not selectable (§1.7). */
  disabled?: boolean;
}

/** A labelled group of options. */
export interface OptionGroup {
  label: string;
  options: OptionItem[];
}

/** `{ source }` meta accompanying a value change (doc 04 §1.6). */
export interface SelectChangeMeta {
  source: 'option' | 'clear';
}

export interface FxSelectProps {
  /** Options or grouped options. */
  options: OptionItem[] | OptionGroup[];
  /** Controlled value (§1.5). */
  value?: string | null;
  /** Uncontrolled initial value. */
  defaultValue?: string | null;
  /** Controlled open state (§1.5). */
  open?: boolean;
  /** Uncontrolled initial open state. */
  defaultOpen?: boolean;
  /** Placeholder shown when nothing is selected. i18n. */
  placeholder?: string;
  /** Renders the clear affordance when a value is set. */
  clearable?: boolean;
  /** `.is-invalid` + `aria-invalid`. */
  invalid?: boolean;
  /** Disable the whole control. */
  disabled?: boolean;
  /** Trigger height. Defaults to `md`. */
  size?: Size;
  /** Shown when there are no options. i18n. */
  emptyLabel?: string;
  /** Accessible label for the clear button. i18n. */
  clearLabel?: string;
  /** Accessible name for a bare trigger (no FieldGroup label). */
  'aria-label'?: string;
  /** aria-labelledby id when a visible label exists. */
  'aria-labelledby'?: string;
  /** Custom option content; `label`/`description` still drive typeahead & a11y. */
  renderOption?: (item: OptionItem) => ReactNode;
  onChange?: (value: string | null, meta: SelectChangeMeta) => void;
  onOpenChange?: (open: boolean) => void;
  id?: string;
  className?: string;
}

/** Normalize either shape into a flat DOM-ordered option list + group map. */
function toGroups(options: OptionItem[] | OptionGroup[]): OptionGroup[] {
  if (options.length === 0) return [];
  const first = options[0];
  if (first && 'options' in first) return options as OptionGroup[];
  return [{ label: '', options: options as OptionItem[] }];
}

export function FxSelect({
  options,
  value,
  defaultValue = null,
  open,
  defaultOpen = false,
  placeholder = 'Select…',
  clearable = false,
  invalid = false,
  disabled = false,
  size = 'md',
  emptyLabel = 'No options',
  clearLabel = 'Clear',
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledby,
  renderOption,
  onChange,
  onOpenChange,
  id,
  className,
}: FxSelectProps) {
  const baseId = useId();
  const listId = `${baseId}-listbox`;
  const triggerId = id ?? `${baseId}-trigger`;

  const valueControlled = value !== undefined;
  const [internalValue, setInternalValue] = useState<string | null>(defaultValue);
  const current = valueControlled ? value : internalValue;

  const openControlled = open !== undefined;
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const isOpen = openControlled ? open : internalOpen;

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const [activeIndex, setActiveIndex] = useState(0);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const popRef = useRef<HTMLDivElement>(null);
  const popStyle = useAnchorPosition(Boolean(isOpen && mounted), triggerRef, popRef, {
    matchWidth: true,
  });
  const typeahead = useRef({ buffer: '', timer: null as ReturnType<typeof setTimeout> | null });

  const groups = useMemo(() => toGroups(options), [options]);
  const flat = useMemo(() => groups.flatMap((g) => g.options), [groups]);

  const selected = useMemo(
    () => flat.find((o) => o.value === current) ?? null,
    [flat, current],
  );

  const setOpen = useCallback(
    (next: boolean) => {
      if (disabled) return;
      if (!openControlled) setInternalOpen(next);
      onOpenChange?.(next);
    },
    [disabled, openControlled, onOpenChange],
  );

  // On open: point the active option at the selection (or first enabled).
  useEffect(() => {
    if (!isOpen) return;
    const selIdx = flat.findIndex((o) => o.value === current);
    const firstEnabled = flat.findIndex((o) => !o.disabled);
    setActiveIndex(selIdx >= 0 ? selIdx : firstEnabled >= 0 ? firstEnabled : 0);
  }, [isOpen, flat, current]);

  useEffect(
    () => () => {
      if (typeahead.current.timer) clearTimeout(typeahead.current.timer);
    },
    [],
  );

  const commit = (next: string | null, source: SelectChangeMeta['source']) => {
    if (!valueControlled) setInternalValue(next);
    onChange?.(next, { source });
  };

  const chooseIndex = (index: number) => {
    const opt = flat[index];
    if (!opt || opt.disabled) return;
    commit(opt.value, 'option');
    setOpen(false);
    triggerRef.current?.focus();
  };

  const step = (from: number, dir: 1 | -1) => {
    let i = from;
    for (let n = 0; n < flat.length; n += 1) {
      i += dir;
      if (i < 0 || i >= flat.length) return from;
      if (!flat[i]?.disabled) return i;
    }
    return from;
  };

  const edge = (dir: 1 | -1) => {
    if (dir === 1) {
      for (let i = 0; i < flat.length; i += 1) if (!flat[i]?.disabled) return i;
    } else {
      for (let i = flat.length - 1; i >= 0; i -= 1) if (!flat[i]?.disabled) return i;
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
    const match = flat.findIndex((o) => !o.disabled && o.label.toLowerCase().startsWith(ta.buffer));
    if (match >= 0) setActiveIndex(match);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (disabled) return;
    if (!isOpen) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        setOpen(true);
      }
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => step(i, 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => step(i, -1));
    } else if (e.key === 'Home') {
      e.preventDefault();
      setActiveIndex(edge(1));
    } else if (e.key === 'End') {
      e.preventDefault();
      setActiveIndex(edge(-1));
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      chooseIndex(activeIndex);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setOpen(false);
    } else if (e.key === 'Tab') {
      setOpen(false);
    } else if (e.key.length === 1 && !e.metaKey && !e.ctrlKey && !e.altKey) {
      runTypeahead(e.key);
    }
  };

  const clear = () => {
    commit(null, 'clear');
    triggerRef.current?.focus();
  };

  const showClear = clearable && current != null && current !== '' && !disabled;
  const activeOpt = flat[activeIndex];
  const activeId = isOpen && activeOpt ? `${baseId}-opt-${activeIndex}` : undefined;

  const rootClass = [
    'fx-select',
    isOpen ? 'is-open' : '',
    invalid ? 'is-invalid' : '',
    disabled ? 'is-disabled' : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={rootClass} data-size={size} data-open={isOpen || undefined}>
      <button
        ref={triggerRef}
        id={triggerId}
        type="button"
        className="fx-select-trigger"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={listId}
        aria-activedescendant={isOpen && mounted ? activeId : undefined}
        aria-invalid={invalid || undefined}
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledby}
        disabled={disabled}
        onClick={() => setOpen(!isOpen)}
        onKeyDown={onKeyDown}
      >
        {selected ? (
          <span className="fx-select-value">{selected.label}</span>
        ) : (
          <span className="fx-select-placeholder">{placeholder}</span>
        )}
        {showClear && (
          <span
            className="fx-select-clear"
            role="button"
            tabIndex={-1}
            aria-label={clearLabel}
            onClick={(e) => {
              e.stopPropagation();
              clear();
            }}
          >
            <FxIcon name="close" size={16} />
          </span>
        )}
        <span className="fx-select-chevron" aria-hidden="true">
          <FxIcon name="chevron-down" size={16} />
        </span>
      </button>

      {isOpen && mounted &&
        createPortal(
          <div ref={popRef} className="fx-select-popover" data-size={size} style={popStyle}>
            {flat.length === 0 ? (
              <ul className="fx-select-listbox" role="listbox" id={listId} aria-label={ariaLabel}>
                <li className="fx-select-empty" role="option" aria-disabled="true" aria-selected="false">
                  {emptyLabel}
                </li>
              </ul>
            ) : (
              <ul
                ref={listRef}
                className="fx-select-listbox"
                role="listbox"
                id={listId}
                aria-label={ariaLabel}
              >
                {groups.map((group, gi) => (
                  <li
                    key={group.label || `__g${gi}`}
                    className="fx-select-group"
                    role="presentation"
                  >
                    {group.label && (
                      <div className="fx-select-group-label" id={`${baseId}-grp-${gi}`}>
                        {group.label}
                      </div>
                    )}
                    <ul
                      className="fx-select-group-list"
                      role="group"
                      aria-labelledby={group.label ? `${baseId}-grp-${gi}` : undefined}
                    >
                      {group.options.map((opt) => {
                        const idx = flat.indexOf(opt);
                        const isSelected = opt.value === current;
                        const isActive = idx === activeIndex;
                        return (
                          <li
                            key={opt.value}
                            id={`${baseId}-opt-${idx}`}
                            className={[
                              'fx-select-option',
                              isSelected ? 'is-selected' : '',
                              isActive ? 'is-active' : '',
                            ]
                              .filter(Boolean)
                              .join(' ')}
                            role="option"
                            aria-selected={isSelected}
                            aria-disabled={opt.disabled || undefined}
                            data-active={isActive || undefined}
                            onMouseEnter={() => !opt.disabled && setActiveIndex(idx)}
                            onMouseDown={(e) => {
                              // Keep focus on the trigger.
                              e.preventDefault();
                            }}
                            onClick={() => chooseIndex(idx)}
                          >
                            {renderOption ? (
                              renderOption(opt)
                            ) : (
                              <>
                                {opt.icon && (
                                  <span className="fx-select-option-icon" aria-hidden="true">
                                    <FxIcon name={opt.icon} size={16} />
                                  </span>
                                )}
                                <span className="fx-select-option-label">
                                  {opt.label}
                                  {opt.description && (
                                    <span className="fx-select-option-description">
                                      {opt.description}
                                    </span>
                                  )}
                                </span>
                                {isSelected && (
                                  <span className="fx-select-option-check" aria-hidden="true">
                                    <FxIcon name="check" size={16} />
                                  </span>
                                )}
                              </>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  </li>
                ))}
              </ul>
            )}
          </div>,
          document.body,
        )}
    </div>
  );
}
