'use client';
/**
 * FxAutocomplete — APG editable combobox with list autocomplete (doc 04 §2.9).
 *
 * An FxInput-style text field drives a portalled `role="listbox"` of matching
 * options (reusing the FxSelect popover contract). Static (`options`) or async
 * (`loadOptions`, debounced, last-write-wins) sources. Focus stays in the input;
 * the active option is tracked via `aria-activedescendant`. A polite `role=status`
 * region announces the result count. SSR-safe: the portal mounts only after the
 * client mount effect and while open. Controlled or uncontrolled `value`/`open`
 * (§1.5). Every user-facing string is a prop with a documented default (i18n).
 */
import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import type { KeyboardEvent, ReactNode } from 'react';
import { createPortal } from 'react-dom';
import type { Size } from '../enums';
import { FxIcon } from '../icon/FxIcon';
import { useAnchorPosition } from '../anchor';
import type { OptionItem } from '../select/select';

export type { OptionItem };

/** `{ source }` meta accompanying a commit (doc 04 §1.6). */
export interface AutocompleteChangeMeta {
  source: 'option' | 'input' | 'clear';
}

export interface FxAutocompleteProps {
  /** Static option source. Mutually exclusive with `loadOptions`. */
  options?: OptionItem[];
  /** Async source; debounced by `debounceMs`; stale responses discarded. */
  loadOptions?: (query: string) => Promise<OptionItem[]>;
  /** Committed value (option `value`, or raw text when `freeSolo`). */
  value?: string | null;
  /** Uncontrolled initial value. */
  defaultValue?: string | null;
  /** Controlled open state (§1.5). */
  open?: boolean;
  /** Uncontrolled initial open state. */
  defaultOpen?: boolean;
  /** Debounce for async / onSearch (ms). Doctrine default. */
  debounceMs?: number;
  /** Below this length the listbox stays closed. */
  minChars?: number;
  /** `true`: any typed text is committable; `false`: value must be a picked option. */
  freeSolo?: boolean;
  /** Placeholder. i18n. */
  placeholder?: string;
  /** Async pending row text. i18n. */
  loadingLabel?: string;
  /** Empty-results row text. i18n. */
  emptyLabel?: string;
  /** Result-count announcement template, `{count}` substituted. i18n. */
  resultsLabel?: string;
  /** Clear affordance. */
  clearable?: boolean;
  /** Accessible label for the clear button. i18n. */
  clearLabel?: string;
  /** `.is-invalid` + `aria-invalid`. */
  invalid?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  size?: Size;
  'aria-label'?: string;
  'aria-labelledby'?: string;
  /** Custom option content; `label`/`description` still drive a11y. */
  renderOption?: (item: OptionItem) => ReactNode;
  onChange?: (value: string | null, meta: AutocompleteChangeMeta) => void;
  onSearch?: (query: string) => void;
  onSelect?: (item: OptionItem) => void;
  onOpenChange?: (open: boolean) => void;
  id?: string;
  className?: string;
}

/** Case-insensitive substring match on label. */
function filterOptions(query: string, options: OptionItem[]): OptionItem[] {
  const q = query.trim().toLowerCase();
  if (!q) return options;
  return options.filter((o) => o.label.toLowerCase().includes(q));
}

/** Wrap the first match run in <mark> for visual highlighting. */
function highlight(label: string, query: string): ReactNode {
  const q = query.trim();
  if (!q) return label;
  const idx = label.toLowerCase().indexOf(q.toLowerCase());
  if (idx === -1) return label;
  return (
    <>
      {label.slice(0, idx)}
      <mark className="fx-autocomplete-match">{label.slice(idx, idx + q.length)}</mark>
      {label.slice(idx + q.length)}
    </>
  );
}

export function FxAutocomplete({
  options,
  loadOptions,
  value,
  defaultValue = null,
  open,
  defaultOpen = false,
  debounceMs = 300,
  minChars = 1,
  freeSolo = false,
  placeholder = 'Search…',
  loadingLabel = 'Searching…',
  emptyLabel = 'No results',
  resultsLabel = '{count} results',
  clearable = false,
  clearLabel = 'Clear',
  invalid = false,
  disabled = false,
  readOnly = false,
  size = 'md',
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledby,
  renderOption,
  onChange,
  onSearch,
  onSelect,
  onOpenChange,
  id,
  className,
}: FxAutocompleteProps) {
  const baseId = useId();
  const listId = `${baseId}-listbox`;
  const inputId = id ?? `${baseId}-input`;

  const valueControlled = value !== undefined;
  const [internalValue, setInternalValue] = useState<string | null>(defaultValue);
  const committed = valueControlled ? value : internalValue;

  // The editable text buffer (mirrors committed value on select/clear).
  const [query, setQuery] = useState(defaultValue ?? '');
  useEffect(() => {
    if (valueControlled) setQuery(value ?? '');
  }, [valueControlled, value]);

  const openControlled = open !== undefined;
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const isOpen = openControlled ? open : internalOpen;

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const [activeIndex, setActiveIndex] = useState(-1);
  const [loading, setLoading] = useState(false);
  const [asyncResults, setAsyncResults] = useState<OptionItem[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const popRef = useRef<HTMLDivElement>(null);
  const popStyle = useAnchorPosition(Boolean(isOpen && mounted), inputRef, popRef, {
    matchWidth: true,
  });
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reqId = useRef(0);

  const setOpen = useCallback(
    (next: boolean) => {
      if (!openControlled) setInternalOpen(next);
      onOpenChange?.(next);
    },
    [openControlled, onOpenChange],
  );

  const results = useMemo(() => {
    if (loadOptions) return asyncResults;
    return filterOptions(query, options ?? []);
  }, [loadOptions, asyncResults, query, options]);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const runSearch = (q: string) => {
    onSearch?.(q);
    if (!loadOptions) return;
    const id = (reqId.current += 1);
    setLoading(true);
    loadOptions(q)
      .then((res) => {
        // Last-write-wins: drop stale responses.
        if (id !== reqId.current) return;
        setAsyncResults(res);
        setLoading(false);
      })
      .catch(() => {
        if (id !== reqId.current) return;
        setAsyncResults([]);
        setLoading(false);
      });
  };

  const onInput = (next: string) => {
    setQuery(next);
    setActiveIndex(-1);
    const shouldOpen = next.trim().length >= minChars;
    setOpen(shouldOpen);
    if (timer.current) clearTimeout(timer.current);
    if (shouldOpen) {
      timer.current = setTimeout(() => runSearch(next), debounceMs);
    }
  };

  const commit = (next: string | null, source: AutocompleteChangeMeta['source']) => {
    if (!valueControlled) setInternalValue(next);
    onChange?.(next, { source });
  };

  const choose = (opt: OptionItem | undefined) => {
    if (!opt || opt.disabled) return;
    onSelect?.(opt);
    commit(opt.value, 'option');
    setQuery(opt.label);
    setOpen(false);
    inputRef.current?.focus();
  };

  const step = (from: number, dir: 1 | -1) => {
    let i = from;
    for (let n = 0; n < results.length; n += 1) {
      i += dir;
      if (i < 0) return -1;
      if (i >= results.length) return results.length - 1;
      if (!results[i]?.disabled) return i;
    }
    return from;
  };

  const clear = () => {
    setQuery('');
    commit(null, 'clear');
    setOpen(false);
    inputRef.current?.focus();
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!isOpen && query.trim().length >= minChars) {
        setOpen(true);
        return;
      }
      setActiveIndex((i) => step(i, 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (isOpen) setActiveIndex((i) => step(i, -1));
    } else if (e.key === 'Home' && isOpen) {
      e.preventDefault();
      setActiveIndex(results.findIndex((o) => !o.disabled));
    } else if (e.key === 'End' && isOpen) {
      e.preventDefault();
      for (let i = results.length - 1; i >= 0; i -= 1)
        if (!results[i]?.disabled) {
          setActiveIndex(i);
          break;
        }
    } else if (e.key === 'Enter') {
      if (isOpen && activeIndex >= 0) {
        e.preventDefault();
        choose(results[activeIndex]);
      } else if (freeSolo && query.trim() !== '') {
        e.preventDefault();
        commit(query, 'input');
        setOpen(false);
      }
    } else if (e.key === 'Escape') {
      if (isOpen) {
        e.preventDefault();
        setOpen(false);
      } else if (clearable && query !== '') {
        e.preventDefault();
        clear();
      }
    }
  };

  const showClear = clearable && query !== '' && !disabled && !readOnly;
  const activeOpt = results[activeIndex];
  const activeId = isOpen && activeIndex >= 0 && activeOpt ? `${baseId}-opt-${activeIndex}` : undefined;
  const countText = resultsLabel.replace('{count}', String(results.length));

  const rootClass = [
    'fx-autocomplete',
    isOpen ? 'is-open' : '',
    invalid ? 'is-invalid' : '',
    disabled ? 'is-disabled' : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={rootClass} data-size={size} data-open={isOpen || undefined}>
      <div className="fx-autocomplete-field" data-size={size}>
        <span className="fx-autocomplete-search-icon" aria-hidden="true">
          <FxIcon name="search" size={16} />
        </span>
        <input
          ref={inputRef}
          id={inputId}
          className="fx-autocomplete-control"
          type="text"
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={isOpen && mounted}
          aria-controls={listId}
          aria-activedescendant={isOpen && mounted ? activeId : undefined}
          aria-invalid={invalid || undefined}
          aria-label={ariaLabel}
          aria-labelledby={ariaLabelledby}
          placeholder={placeholder}
          value={query}
          disabled={disabled}
          readOnly={readOnly}
          onChange={(e) => onInput(e.target.value)}
          onKeyDown={onKeyDown}
        />
        {showClear && (
          <button
            type="button"
            className="fx-autocomplete-clear"
            aria-label={clearLabel}
            onClick={clear}
          >
            <FxIcon name="close" size={16} />
          </button>
        )}
      </div>

      <span className="fx-autocomplete-status" role="status" aria-live="polite">
        {isOpen && !loading ? countText : ''}
      </span>

      {isOpen && mounted &&
        createPortal(
          <div ref={popRef} className="fx-autocomplete-popover" data-size={size} style={popStyle}>
            <ul
              className="fx-autocomplete-listbox"
              role="listbox"
              id={listId}
              aria-label={ariaLabel}
              aria-busy={loading || undefined}
            >
              {loading ? (
                <li className="fx-autocomplete-loading" role="option" aria-disabled="true" aria-selected="false">
                  {loadingLabel}
                </li>
              ) : results.length === 0 ? (
                <li className="fx-autocomplete-empty" role="option" aria-disabled="true" aria-selected="false">
                  {emptyLabel}
                </li>
              ) : (
                results.map((opt, idx) => {
                  const isSelected = opt.value === committed;
                  const isActive = idx === activeIndex;
                  return (
                    <li
                      key={opt.value}
                      id={`${baseId}-opt-${idx}`}
                      className={[
                        'fx-autocomplete-option',
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
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => choose(opt)}
                    >
                      {renderOption ? (
                        renderOption(opt)
                      ) : (
                        <>
                          {opt.icon && (
                            <span className="fx-autocomplete-option-icon" aria-hidden="true">
                              <FxIcon name={opt.icon} size={16} />
                            </span>
                          )}
                          <span className="fx-autocomplete-option-label">
                            {highlight(opt.label, query)}
                            {opt.description && (
                              <span className="fx-autocomplete-option-description">
                                {opt.description}
                              </span>
                            )}
                          </span>
                        </>
                      )}
                    </li>
                  );
                })
              )}
            </ul>
          </div>,
          document.body,
        )}
    </div>
  );
}
