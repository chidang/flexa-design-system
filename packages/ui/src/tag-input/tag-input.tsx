'use client';
/**
 * FxTagInput — multi-value input (doc 04 §2.10).
 *
 * Committed values render as a row of dismissible FxChips inside the field; an
 * inline `<input>` commits pending text on Enter or a delimiter. Optional
 * suggestions use the FxAutocomplete listbox contract (portalled, SSR-safe).
 * Roving tabindex gives the whole control one tab stop: focus moves between the
 * input and the chips with ArrowLeft/Right. Additions / removals are announced
 * via a polite live region. Controlled or uncontrolled `value` (§1.5). Every
 * user-facing string is a prop with a documented default (i18n).
 */
import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import { createPortal } from 'react-dom';
import type { Size } from '../enums';
import { FxChip } from '../chip/chip';
import { useAnchorPosition } from '../anchor';
import { FxIcon } from '../icon/FxIcon';
import type { OptionItem } from '../select/select';

/** `{ source }` meta accompanying a value change (doc 04 §1.6). */
export interface TagInputChangeMeta {
  source: 'add' | 'remove';
}

export interface FxTagInputProps {
  /** Controlled value — ordered, unique (§1.5). */
  value?: string[];
  /** Uncontrolled initial value. */
  defaultValue?: string[];
  /** Static suggestion source (FxAutocomplete `options` contract). */
  suggestions?: OptionItem[];
  /** Async suggestion source; debounced; last-write-wins. */
  loadSuggestions?: (query: string) => Promise<OptionItem[]>;
  /** Typing/pasting a delimiter commits pending text. */
  delimiter?: RegExp | string;
  /** At the limit the input is disabled and `maxTagsLabel` is announced. */
  maxTags?: number;
  /** Return a normalized tag, or `null` to reject (flashes `.is-invalid`). */
  validateTag?: (raw: string) => string | null;
  /** Allow the same value more than once. */
  allowDuplicates?: boolean;
  /** Debounce for async suggestions (ms). */
  debounceMs?: number;
  /** Placeholder for the inline input. i18n. */
  placeholder?: string;
  /** Per-chip remove button label; `{tag}` substituted. i18n. */
  removeLabel?: string;
  /** Empty-suggestions row text. i18n. */
  emptyLabel?: string;
  /** Announced when at the tag limit. i18n. */
  maxTagsLabel?: string;
  /** `.is-invalid` + `aria-invalid`. */
  invalid?: boolean;
  disabled?: boolean;
  size?: Size;
  /** Accessible name for the chips listbox / input. */
  'aria-label'?: string;
  'aria-labelledby'?: string;
  onChange?: (values: string[], meta: TagInputChangeMeta) => void;
  onAdd?: (tag: string) => void;
  onRemove?: (tag: string) => void;
  id?: string;
  className?: string;
}

function splitByDelimiter(raw: string, delimiter: RegExp | string): string[] {
  return raw.split(delimiter).map((s) => s.trim()).filter(Boolean);
}

export function FxTagInput({
  value,
  defaultValue = [],
  suggestions,
  loadSuggestions,
  delimiter = /[,\n]/,
  maxTags,
  validateTag,
  allowDuplicates = false,
  debounceMs = 300,
  placeholder = 'Add tag…',
  removeLabel = 'Remove {tag}',
  emptyLabel = 'No suggestions',
  maxTagsLabel = 'Tag limit reached',
  invalid = false,
  disabled = false,
  size = 'md',
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledby,
  onChange,
  onAdd,
  onRemove,
  id,
  className,
}: FxTagInputProps) {
  const baseId = useId();
  const listId = `${baseId}-suggestions`;
  const inputId = id ?? `${baseId}-input`;

  const controlled = value !== undefined;
  const [internal, setInternal] = useState<string[]>(defaultValue);
  const tags = controlled ? value : internal;

  const [pending, setPending] = useState('');
  const [focusIndex, setFocusIndex] = useState(-1); // -1 = input, >=0 = chip
  const [flash, setFlash] = useState(false);
  const [announce, setAnnounce] = useState('');

  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [asyncResults, setAsyncResults] = useState<OptionItem[]>([]);

  const inputRef = useRef<HTMLInputElement>(null);
  const fieldRef = useRef<HTMLDivElement>(null);
  const popRef = useRef<HTMLDivElement>(null);
  const popStyle = useAnchorPosition(Boolean(open && mounted), fieldRef, popRef, {
    matchWidth: true,
  });
  const chipRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reqId = useRef(0);
  const flashTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const atLimit = maxTags !== undefined && tags.length >= maxTags;

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
      if (flashTimer.current) clearTimeout(flashTimer.current);
    },
    [],
  );

  const suggestionResults = useMemo(() => {
    if (loadSuggestions) return asyncResults;
    const q = pending.trim().toLowerCase();
    const source = suggestions ?? [];
    const notPicked = source.filter((o) => allowDuplicates || !tags.includes(o.value));
    if (!q) return notPicked;
    return notPicked.filter((o) => o.label.toLowerCase().includes(q));
  }, [loadSuggestions, asyncResults, pending, suggestions, tags, allowDuplicates]);

  const hasSuggestions = Boolean(suggestions || loadSuggestions);

  const setTags = (next: string[], meta: TagInputChangeMeta) => {
    if (!controlled) setInternal(next);
    onChange?.(next, meta);
  };

  const flashInvalid = () => {
    setFlash(true);
    if (flashTimer.current) clearTimeout(flashTimer.current);
    flashTimer.current = setTimeout(() => setFlash(false), 400);
  };

  const addTag = (raw: string) => {
    if (atLimit) {
      setAnnounce(maxTagsLabel);
      return;
    }
    const normalized = validateTag ? validateTag(raw) : raw.trim();
    if (normalized == null || normalized === '') {
      if (raw.trim() !== '') flashInvalid();
      return;
    }
    if (!allowDuplicates && tags.includes(normalized)) {
      flashInvalid();
      return;
    }
    onAdd?.(normalized);
    setTags([...tags, normalized], { source: 'add' });
    setAnnounce(`${normalized} added`);
    setPending('');
    setOpen(false);
    setActiveIndex(-1);
  };

  const removeAt = (index: number) => {
    const tag = tags[index];
    if (tag === undefined) return;
    onRemove?.(tag);
    setTags(tags.filter((_, i) => i !== index), { source: 'remove' });
    setAnnounce(`${tag} removed`);
    // Keep roving focus sensible after removal.
    setFocusIndex((fi) => {
      if (fi < 0) return -1;
      const nextLen = tags.length - 1;
      if (nextLen === 0) return -1;
      return Math.min(fi, nextLen - 1);
    });
  };

  const setOpenGuarded = useCallback((next: boolean) => {
    if (!hasSuggestions) return;
    setOpen(next);
  }, [hasSuggestions]);

  const runSearch = (q: string) => {
    if (!loadSuggestions) return;
    const rid = (reqId.current += 1);
    loadSuggestions(q)
      .then((res) => {
        if (rid !== reqId.current) return;
        setAsyncResults(res);
      })
      .catch(() => {
        if (rid !== reqId.current) return;
        setAsyncResults([]);
      });
  };

  const onInput = (next: string) => {
    // Delimiter commits the text before it.
    const parts = splitByDelimiter(next, delimiter);
    const endsWithDelim = next.length > 0 && splitByDelimiter(next + 'x', delimiter).length > parts.length;
    if (endsWithDelim && parts.length > 0) {
      for (const p of parts) addTag(p);
      return;
    }
    setPending(next);
    setActiveIndex(-1);
    if (hasSuggestions && next.trim() !== '') {
      setOpenGuarded(true);
      if (loadSuggestions) {
        if (timer.current) clearTimeout(timer.current);
        timer.current = setTimeout(() => runSearch(next), debounceMs);
      }
    } else {
      setOpen(false);
    }
  };

  const chooseSuggestion = (opt: OptionItem | undefined) => {
    if (!opt || opt.disabled) return;
    addTag(opt.value);
    inputRef.current?.focus();
  };

  useEffect(() => {
    // >=0 focuses a chip proxy; -1 leaves focus on the input where the user put it.
    if (focusIndex >= 0) chipRefs.current[focusIndex]?.focus();
  }, [focusIndex]);

  const onInputKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (open && suggestionResults.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIndex((i) => (i + 1) % suggestionResults.length);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIndex((i) => (i - 1 + suggestionResults.length) % suggestionResults.length);
        return;
      }
      if (e.key === 'Enter' && activeIndex >= 0) {
        e.preventDefault();
        chooseSuggestion(suggestionResults[activeIndex]);
        return;
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        setOpen(false);
        return;
      }
    }
    if (e.key === 'Enter') {
      e.preventDefault();
      if (pending.trim() !== '') addTag(pending);
    } else if (e.key === 'Backspace' && pending === '' && tags.length > 0) {
      e.preventDefault();
      // First Backspace focuses last chip; user's second Backspace removes it.
      setFocusIndex(tags.length - 1);
    } else if (e.key === 'ArrowLeft' && pending === '' && tags.length > 0) {
      e.preventDefault();
      setFocusIndex(tags.length - 1);
    }
  };

  const onChipKeyDown = (e: KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      if (index > 0) setFocusIndex(index - 1);
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      if (index < tags.length - 1) setFocusIndex(index + 1);
      else {
        setFocusIndex(-1);
        inputRef.current?.focus();
      }
    } else if (e.key === 'Delete' || e.key === 'Backspace') {
      e.preventDefault();
      removeAt(index);
      if (tags.length - 1 === 0) inputRef.current?.focus();
    }
  };

  const activeId = open && activeIndex >= 0 && suggestionResults[activeIndex]
    ? `${baseId}-opt-${activeIndex}`
    : undefined;

  const rootClass = [
    'fx-tag-input',
    invalid || flash ? 'is-invalid' : '',
    disabled ? 'is-disabled' : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div ref={fieldRef} className={rootClass} data-size={size} data-open={open || undefined}>
      <ul className="fx-tag-input-chips" aria-label={ariaLabel} aria-labelledby={ariaLabelledby}>
        {tags.map((tag, index) => (
          <li
            key={`${tag}-${index}`}
            className={['fx-tag-input-chip', focusIndex === index ? 'is-active' : ''].filter(Boolean).join(' ')}
          >
            <FxChip
              label={tag}
              size={size}
              dismissible
              removeLabel={removeLabel.replace('{tag}', tag)}
              disabled={disabled}
              onDismiss={() => removeAt(index)}
            />
            {/* Roving-tabindex focus target for keyboard chip traversal. */}
            <button
              ref={(el) => {
                chipRefs.current[index] = el;
              }}
              type="button"
              className="fx-tag-input-chip-focus"
              tabIndex={focusIndex === index ? 0 : -1}
              aria-label={removeLabel.replace('{tag}', tag)}
              onKeyDown={(e) => onChipKeyDown(e, index)}
              onFocus={() => setFocusIndex(index)}
            />
          </li>
        ))}
        <li className="fx-tag-input-control-wrap">
          <input
            ref={inputRef}
            id={inputId}
            className="fx-tag-input-control"
            type="text"
            role={hasSuggestions ? 'combobox' : undefined}
            aria-autocomplete={hasSuggestions ? 'list' : undefined}
            aria-expanded={hasSuggestions ? open : undefined}
            aria-controls={hasSuggestions ? listId : undefined}
            aria-activedescendant={activeId}
            aria-invalid={invalid || undefined}
            aria-label={ariaLabel}
            aria-labelledby={ariaLabelledby}
            placeholder={placeholder}
            value={pending}
            disabled={disabled || atLimit}
            tabIndex={focusIndex === -1 ? 0 : -1}
            onChange={(e) => onInput(e.target.value)}
            onKeyDown={onInputKeyDown}
            onFocus={() => setFocusIndex(-1)}
          />
        </li>
      </ul>

      <span className="fx-tag-input-live" role="status" aria-live="polite">
        {announce}
      </span>

      {hasSuggestions && open && mounted &&
        createPortal(
          <div ref={popRef} className="fx-tag-input-popover" data-size={size} style={popStyle}>
            <ul className="fx-tag-input-listbox" role="listbox" id={listId} aria-label={ariaLabel}>
              {suggestionResults.length === 0 ? (
                <li className="fx-tag-input-empty" role="option" aria-disabled="true" aria-selected="false">
                  {emptyLabel}
                </li>
              ) : (
                suggestionResults.map((opt, idx) => {
                  const isActive = idx === activeIndex;
                  return (
                    <li
                      key={opt.value}
                      id={`${baseId}-opt-${idx}`}
                      className={['fx-tag-input-option', isActive ? 'is-active' : ''].filter(Boolean).join(' ')}
                      role="option"
                      aria-selected={isActive}
                      aria-disabled={opt.disabled || undefined}
                      data-active={isActive || undefined}
                      onMouseEnter={() => !opt.disabled && setActiveIndex(idx)}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => chooseSuggestion(opt)}
                    >
                      {opt.icon && (
                        <span className="fx-tag-input-option-icon" aria-hidden="true">
                          <FxIcon name={opt.icon} size={16} />
                        </span>
                      )}
                      <span className="fx-tag-input-option-label">{opt.label}</span>
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
