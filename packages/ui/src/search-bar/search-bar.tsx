'use client';
/**
 * FxSearchBar — query entry for list filtering / global search (doc 04 §2.37).
 *
 * Interactive: controlled or uncontrolled value (§1.5). `onChange` fires per
 * keystroke; `onSearch` is debounced by `debounceMs`. `Enter` fires `onEnter`
 * immediately (cancelling any pending debounce); `Esc` clears then blurs. Wraps a
 * `role="search"` form landmark; the clear button carries an `aria-label`.
 */
import { useEffect, useId, useRef, useState } from 'react';
import type { ChangeEvent, KeyboardEvent } from 'react';
import { FxIcon } from '../icon/FxIcon';
import type { Size } from '../enums';

export interface FxSearchBarProps {
  /** Controlled query value. */
  value?: string;
  /** Uncontrolled initial value. */
  defaultValue?: string;
  placeholder?: string;
  /** Debounce for `onSearch` (ms). `onChange` stays per-keystroke. */
  debounceMs?: number;
  size?: Size;
  disabled?: boolean;
  /** Visual ⌘K hint chip; binding the shortcut is the host's job. */
  shortcutHint?: string | false;
  /** Accessible name for the input and search landmark. */
  ariaLabel?: string;
  /** Accessible name for the clear button. */
  clearLabel?: string;
  onChange?: (value: string) => void;
  /** Debounced. */
  onSearch?: (query: string) => void;
  /** Immediate submit (Enter). */
  onEnter?: (query: string) => void;
  className?: string;
}

export function FxSearchBar({
  value,
  defaultValue = '',
  placeholder = 'Search',
  debounceMs = 300,
  size = 'md',
  disabled,
  shortcutHint = false,
  ariaLabel = 'Search',
  clearLabel = 'Clear search',
  onChange,
  onSearch,
  onEnter,
  className,
}: FxSearchBarProps) {
  const inputId = useId();
  const controlled = value !== undefined;
  const [internal, setInternal] = useState(defaultValue);
  const query = controlled ? value : internal;
  const inputRef = useRef<HTMLInputElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const scheduleSearch = (q: string) => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      onSearch?.(q);
    }, debounceMs);
  };

  const commit = (q: string) => {
    if (!controlled) setInternal(q);
    onChange?.(q);
    scheduleSearch(q);
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => commit(e.target.value);

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (timer.current) clearTimeout(timer.current);
      onEnter?.(query);
    } else if (e.key === 'Escape') {
      if (query) {
        e.preventDefault();
        commit('');
      } else {
        inputRef.current?.blur();
      }
    }
  };

  const clear = () => {
    commit('');
    inputRef.current?.focus();
  };

  return (
    <form
      className={className ? `fx-search-bar ${className}` : 'fx-search-bar'}
      role="search"
      aria-label={ariaLabel}
      data-size={size}
      data-disabled={disabled || undefined}
      onSubmit={(e) => e.preventDefault()}
    >
      <span className="fx-search-bar-icon" aria-hidden="true">
        <FxIcon name="search" size={16} />
      </span>
      <input
        ref={inputRef}
        id={inputId}
        className="fx-search-bar-input"
        type="search"
        value={query}
        placeholder={placeholder}
        aria-label={ariaLabel}
        disabled={disabled}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
      />
      {query && !disabled && (
        <button
          type="button"
          className="fx-search-bar-clear"
          aria-label={clearLabel}
          onClick={clear}
        >
          <FxIcon name="close" size={16} />
        </button>
      )}
      {shortcutHint && (
        <kbd className="fx-search-bar-shortcut" aria-hidden="true">
          {shortcutHint}
        </kbd>
      )}
    </form>
  );
}
