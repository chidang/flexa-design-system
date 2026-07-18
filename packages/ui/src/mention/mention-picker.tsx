'use client';
/**
 * FxMentionPicker — the @-mention combobox popover (doc 04 §3.8 "FxMention").
 *
 * Triggered by `@` inside a composer (Textarea / Chat / Comment). It follows the
 * FxAutocomplete listbox contract: a `role="combobox"` input drives a
 * `role="listbox"` of user rows (avatar + name + handle). `loadUsers(query)`
 * feeds the list (debounced, last-write-wins, capped at `maxResults`). Arrow
 * navigates, Enter/Tab commit the active user, Esc dismisses (returns plain
 * text). SSR-safe: the `aria-activedescendant`/`aria-controls` IDREFs and the
 * listbox itself only render after the client mount effect, so static markup
 * carries no dangling reference.
 *
 * The picker is inline (not portalled) — it is meant to be anchored under the
 * composer caret by the host; it renders its own popover box.
 */
import { useEffect, useId, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import { FxAvatar } from '../avatar/avatar';
import type { MentionUser } from './mention';

/** Baked-in strings — every one a prop with an English default (§i18n). */
export interface MentionPickerLabels {
  /** Accessible label for the picker input. */
  ariaLabel: string;
  /** Row shown while `loadUsers` is pending. */
  loading: string;
  /** Row shown when no users match. */
  empty: string;
}

export const DEFAULT_MENTION_PICKER_LABELS: MentionPickerLabels = {
  ariaLabel: 'Mention someone',
  loading: 'Searching…',
  empty: 'No people found',
};

export interface FxMentionPickerProps {
  /** Async user source for the current query (already stripped of `trigger`). */
  loadUsers: (query: string) => Promise<MentionUser[]>;
  /** The character that opens the picker (documentary; the host detects it). Defaults to `@`. */
  trigger?: string;
  /** Max rows kept from `loadUsers`. Defaults to `8`. */
  maxResults?: number;
  /** Initial query (text typed after the trigger). */
  defaultQuery?: string;
  /** Debounce for `loadUsers` (ms). Defaults to `150`. */
  debounceMs?: number;
  /** A user was committed (Enter / Tab / click). */
  onCommit?: (user: MentionUser) => void;
  /** The picker was dismissed (Esc) — the host restores plain text. */
  onDismiss?: () => void;
  /** Fired per keystroke with the current query. */
  onQueryChange?: (query: string) => void;
  /** Baked-in strings. Merged over the English defaults. */
  labels?: Partial<MentionPickerLabels>;
  className?: string;
}

export function FxMentionPicker({
  loadUsers,
  trigger = '@',
  maxResults = 8,
  defaultQuery = '',
  debounceMs = 150,
  onCommit,
  onDismiss,
  onQueryChange,
  labels,
  className,
}: FxMentionPickerProps) {
  const l = { ...DEFAULT_MENTION_PICKER_LABELS, ...labels };
  const baseId = useId();
  const listId = `${baseId}-listbox`;

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const [query, setQuery] = useState(defaultQuery);
  const [results, setResults] = useState<MentionUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reqId = useRef(0);

  const runSearch = (q: string) => {
    const id = (reqId.current += 1);
    setLoading(true);
    loadUsers(q)
      .then((res) => {
        if (id !== reqId.current) return;
        setResults(res.slice(0, maxResults));
        setActiveIndex(0);
        setLoading(false);
      })
      .catch(() => {
        if (id !== reqId.current) return;
        setResults([]);
        setLoading(false);
      });
  };

  // Initial + debounced search on query change.
  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => runSearch(query), debounceMs);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- runSearch reads latest props via closure; query is the driver
  }, [query, debounceMs]);

  const onInput = (next: string) => {
    setQuery(next);
    onQueryChange?.(next);
  };

  const commit = (user: MentionUser | undefined) => {
    if (!user) return;
    onCommit?.(user);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => (results.length === 0 ? 0 : (i + 1) % results.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => (results.length === 0 ? 0 : (i - 1 + results.length) % results.length));
    } else if (e.key === 'Enter' || e.key === 'Tab') {
      if (results.length > 0) {
        e.preventDefault();
        commit(results[activeIndex]);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onDismiss?.();
    }
  };

  const rootClass = ['fx-mention-picker', className].filter(Boolean).join(' ');
  const activeId =
    mounted && results.length > 0 ? `${baseId}-opt-${activeIndex}` : undefined;

  return (
    <div className={rootClass} data-trigger={trigger}>
      <div className="fx-mention-picker-field">
        <span className="fx-mention-picker-trigger" aria-hidden="true">
          {trigger}
        </span>
        <input
          ref={inputRef}
          className="fx-mention-picker-control"
          type="text"
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={mounted && results.length > 0}
          aria-controls={mounted ? listId : undefined}
          aria-activedescendant={activeId}
          aria-label={l.ariaLabel}
          value={query}
          onChange={(e) => onInput(e.target.value)}
          onKeyDown={onKeyDown}
        />
      </div>

      {mounted && (
        <ul className="fx-mention-picker-listbox" role="listbox" id={listId} aria-label={l.ariaLabel}>
          {loading ? (
            <li className="fx-mention-picker-status" role="option" aria-disabled="true" aria-selected="false">
              {l.loading}
            </li>
          ) : results.length === 0 ? (
            <li className="fx-mention-picker-status" role="option" aria-disabled="true" aria-selected="false">
              {l.empty}
            </li>
          ) : (
            results.map((user, idx) => {
              const isActive = idx === activeIndex;
              return (
                <li
                  key={user.id}
                  id={`${baseId}-opt-${idx}`}
                  className={['fx-mention-picker-option', isActive ? 'is-active' : ''].filter(Boolean).join(' ')}
                  role="option"
                  aria-selected={isActive}
                  data-active={isActive || undefined}
                  onMouseEnter={() => setActiveIndex(idx)}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => commit(user)}
                >
                  <FxAvatar size="xs" src={user.avatarSrc} name={user.name} alt={user.name} />
                  <span className="fx-mention-picker-option-text">
                    <span className="fx-mention-picker-option-name">{user.name}</span>
                    <span className="fx-mention-picker-option-handle">@{user.handle}</span>
                  </span>
                </li>
              );
            })
          )}
        </ul>
      )}
    </div>
  );
}
