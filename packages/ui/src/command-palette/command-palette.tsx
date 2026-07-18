'use client';
/**
 * FxCommandPalette — ⌘K modal combobox over a command index (doc 04 §2.38).
 *
 * Interactive + SSR-safe portal: renders into `document.body` only after mount
 * and while open. Controlled or uncontrolled open state (§1.5). A dialog
 * (`aria-modal`) wraps a combobox input + `role="listbox"` of results;
 * `aria-activedescendant` drives keyboard navigation while focus stays in the
 * input. `onSearch` is debounced by `debounceMs`. Up/Down move the active option
 * (wrap), Enter selects, Esc closes and restores focus to the previously focused
 * element. Focus is trapped in the dialog.
 */
import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import { createPortal } from 'react-dom';
import { FxIcon } from '../icon/FxIcon';
import type { IconName } from '../icon/map';

export interface Command {
  id: string;
  label: string;
  group?: string;
  icon?: IconName;
  hint?: string;
  kbd?: string;
  keywords?: string[];
  disabled?: boolean;
  perform?: () => void | Promise<void>;
}

export interface FxCommandPaletteProps {
  commands: Command[];
  /** Controlled open state. */
  open?: boolean;
  /** Uncontrolled initial open state. */
  defaultOpen?: boolean;
  /** Debounce for `onSearch` (ms). */
  debounceMs?: number;
  placeholder?: string;
  emptyLabel?: string;
  /** Accessible name for the dialog. */
  ariaLabel?: string;
  onSelect?: (command: Command) => void;
  onSearch?: (query: string) => void;
  onOpenChange?: (open: boolean) => void;
  className?: string;
}

/** Substring match over label + keywords (score >0 keeps the command). */
export function defaultFilter(query: string, cmd: Command): number {
  const q = query.trim().toLowerCase();
  if (!q) return 1;
  const hay = [cmd.label, ...(cmd.keywords ?? [])].join(' ').toLowerCase();
  const idx = hay.indexOf(q);
  if (idx === -1) return 0;
  return idx === 0 ? 2 : 1;
}

export function FxCommandPalette({
  commands,
  open,
  defaultOpen = false,
  debounceMs = 300,
  placeholder = 'Type a command or search…',
  emptyLabel = 'No results',
  ariaLabel = 'Command palette',
  onSelect,
  onSearch,
  onOpenChange,
  className,
}: FxCommandPaletteProps) {
  const baseId = useId();
  const controlled = open !== undefined;
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const isOpen = controlled ? open : internalOpen;

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const surfaceRef = useRef<HTMLDivElement>(null);
  const restoreRef = useRef<HTMLElement | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const setOpen = useCallback(
    (next: boolean) => {
      if (!controlled) setInternalOpen(next);
      onOpenChange?.(next);
    },
    [controlled, onOpenChange],
  );

  const results = useMemo(
    () =>
      commands
        .map((cmd) => ({ cmd, score: defaultFilter(query, cmd) }))
        .filter((r) => r.score > 0)
        .sort((a, b) => b.score - a.score)
        .map((r) => r.cmd),
    [commands, query],
  );

  const groups = useMemo(() => {
    const map = new Map<string, Command[]>();
    for (const cmd of results) {
      const g = cmd.group ?? '';
      const list = map.get(g);
      if (list) list.push(cmd);
      else map.set(g, [cmd]);
    }
    return [...map.entries()].map(([group, cmds]) => ({ group, cmds }));
  }, [results]);

  // Flat option order matches DOM order for activedescendant math.
  const flat = useMemo(() => groups.flatMap((g) => g.cmds), [groups]);

  // On open: capture focus origin, focus the input, reset state.
  useEffect(() => {
    if (isOpen) {
      restoreRef.current = document.activeElement as HTMLElement | null;
      setQuery('');
      setActiveIndex(0);
      requestAnimationFrame(() => inputRef.current?.focus());
    } else {
      restoreRef.current?.focus?.();
    }
  }, [isOpen]);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const scheduleSearch = (q: string) => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => onSearch?.(q), debounceMs);
  };

  const close = () => setOpen(false);

  const choose = (cmd: Command | undefined) => {
    if (!cmd || cmd.disabled) return;
    onSelect?.(cmd);
    // Contract: perform runs, then the palette closes (unless perform throws).
    Promise.resolve(cmd.perform?.())
      .then(() => close())
      .catch(() => {
        /* keep open; error surfacing is the host's job */
      });
  };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => (flat.length ? (i + 1) % flat.length : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => (flat.length ? (i - 1 + flat.length) % flat.length : 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      choose(flat[activeIndex]);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      close();
    } else if (e.key === 'Tab') {
      // Trap: the input is the only tab stop.
      e.preventDefault();
    }
  };

  if (!isOpen || !mounted) return null;

  const activeId = flat[activeIndex] ? `${baseId}-opt-${flat[activeIndex]!.id}` : undefined;

  return createPortal(
    <div
      className="fx-command-palette-backdrop"
      onPointerDown={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <div
        ref={surfaceRef}
        className={className ? `fx-command-palette ${className}` : 'fx-command-palette'}
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel}
        onKeyDown={onKeyDown}
      >
        <div className="fx-command-palette-field">
          <span className="fx-command-palette-search-icon" aria-hidden="true">
            <FxIcon name="search" size={20} />
          </span>
          <input
            ref={inputRef}
            className="fx-command-palette-input"
            type="text"
            role="combobox"
            aria-expanded="true"
            aria-controls={`${baseId}-list`}
            aria-activedescendant={activeId}
            aria-autocomplete="list"
            placeholder={placeholder}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActiveIndex(0);
              scheduleSearch(e.target.value);
            }}
          />
        </div>

        {flat.length === 0 ? (
          <p className="fx-command-palette-empty" role="status">
            {emptyLabel}
          </p>
        ) : (
          <ul className="fx-command-palette-list" role="listbox" id={`${baseId}-list`} aria-label={ariaLabel}>
            {groups.map(({ group, cmds }) => (
              <li key={group || '__ungrouped'} className="fx-command-palette-group" role="presentation">
                {group && (
                  <div className="fx-command-palette-group-label" id={`${baseId}-group-${group}`}>
                    {group}
                  </div>
                )}
                <ul className="fx-command-palette-group-list" role="group" aria-labelledby={group ? `${baseId}-group-${group}` : undefined}>
                  {cmds.map((cmd) => {
                    const flatIdx = flat.indexOf(cmd);
                    const active = flatIdx === activeIndex;
                    return (
                      <li
                        key={cmd.id}
                        id={`${baseId}-opt-${cmd.id}`}
                        className="fx-command-palette-item"
                        role="option"
                        aria-selected={active}
                        aria-disabled={cmd.disabled || undefined}
                        data-active={active || undefined}
                        onMouseEnter={() => setActiveIndex(flatIdx)}
                        onClick={() => choose(cmd)}
                      >
                        {cmd.icon && (
                          <span className="fx-command-palette-item-icon">
                            <FxIcon name={cmd.icon} size={16} />
                          </span>
                        )}
                        <span className="fx-command-palette-item-label">{cmd.label}</span>
                        {cmd.hint && <span className="fx-command-palette-item-hint">{cmd.hint}</span>}
                        {cmd.kbd && <kbd className="fx-command-palette-item-kbd">{cmd.kbd}</kbd>}
                      </li>
                    );
                  })}
                </ul>
              </li>
            ))}
          </ul>
        )}

        <div className="fx-command-palette-footer" aria-hidden="true">
          <span>↑↓ navigate</span>
          <span>↵ select</span>
          <span>esc close</span>
        </div>
      </div>
    </div>,
    document.body,
  );
}
