'use client';
/**
 * FxTimePicker — Time Picker (doc 04 §3.4, deltas from FxDatePicker §2.15).
 *
 * A text field whose popover is a scrollable listbox of interval options
 * (combobox + listbox, built here — NOT the Select component). Value is a 24h
 * ISO time string `'HH:mm'`. Options are generated every `step` minutes between
 * `min` and `max` and rendered per `format` ('24' → `14:30`, '12' → `2:30 PM`).
 * Typed entry parses "9am"/"14:30" on blur/Enter. Controlled/uncontrolled for
 * value + open (§1.5). `aria-activedescendant` drives listbox navigation while
 * focus stays in the input; SSR-safe portal popover.
 */
import { useEffect, useId, useMemo, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import { createPortal } from 'react-dom';
import type { Size } from '../enums';
import { FxIcon } from '../icon/FxIcon';
import { useAnchorPosition } from '../anchor';

/** 24h ISO time `'HH:mm'`, or null when empty. */
export type IsoTime = string | null;

/** `{ source }` meta accompanying every value change (doc 04 §1.6). */
export interface TimePickerChangeMeta {
  source: 'listbox' | 'input';
}

export interface TimePickerLabels {
  openList: string;
}

const DEFAULT_TIME_LABELS: TimePickerLabels = { openList: 'Open time list' };

/** Total minutes from `'HH:mm'`, or null if malformed. */
function toMinutes(value: string): number | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec(value.trim());
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h < 0 || h > 23 || min < 0 || min > 59) return null;
  return h * 60 + min;
}

/** Minutes since midnight → `'HH:mm'`. */
function fromMinutes(total: number): string {
  const h = Math.floor(total / 60) % 24;
  const m = total % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/** Render `'HH:mm'` per display format. */
export function formatTime(value: string, format: '12' | '24'): string {
  const mins = toMinutes(value);
  if (mins == null) return value;
  if (format === '24') return fromMinutes(mins);
  const h24 = Math.floor(mins / 60);
  const m = mins % 60;
  const period = h24 < 12 ? 'AM' : 'PM';
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${h12}:${String(m).padStart(2, '0')} ${period}`;
}

/**
 * Parse loose human input to `'HH:mm'`: "9am", "9:30 pm", "14:30", "1430", "9".
 * Returns null if unparseable.
 */
export function parseTime(raw: string): string | null {
  const s = raw.trim().toLowerCase();
  if (s === '') return null;
  const m = /^(\d{1,2})(?::?(\d{2}))?\s*(am|pm)?$/.exec(s);
  if (!m) return null;
  let h = Number(m[1]);
  const min = m[2] != null ? Number(m[2]) : 0;
  const period = m[3];
  if (min > 59) return null;
  if (period === 'am') {
    if (h === 12) h = 0;
    else if (h > 12) return null;
  } else if (period === 'pm') {
    if (h < 12) h += 12;
    else if (h > 12) return null;
  }
  if (h > 23) return null;
  return fromMinutes(h * 60 + min);
}

export interface FxTimePickerProps {
  /** Controlled `'HH:mm'` value (§1.5). */
  value?: IsoTime;
  /** Uncontrolled initial value. */
  defaultValue?: IsoTime;
  /** Interval in minutes between options. Defaults to `30`. */
  step?: number;
  /** Lower / upper option bounds, `'HH:mm'`. Default `'00:00'` / `'23:59'`. */
  min?: string;
  max?: string;
  /** Display format. Defaults to `'24'`. */
  format?: '12' | '24';
  /** Typed entry parsed on blur/Enter. Defaults to `true`. */
  allowInput?: boolean;
  open?: boolean;
  defaultOpen?: boolean;
  size?: Size;
  invalid?: boolean;
  disabled?: boolean;
  placeholder?: string;
  'aria-label'?: string;
  labels?: Partial<TimePickerLabels>;
  onChange?: (value: IsoTime, meta: TimePickerChangeMeta) => void;
  onOpenChange?: (open: boolean) => void;
  className?: string;
}

export function FxTimePicker(props: FxTimePickerProps) {
  const {
    value,
    defaultValue = null,
    step = 30,
    min = '00:00',
    max = '23:59',
    format = '24',
    allowInput = true,
    open,
    defaultOpen = false,
    size = 'md',
    invalid = false,
    disabled = false,
    placeholder = 'HH:mm',
    labels: labelOverrides,
    onChange,
    onOpenChange,
    className,
    'aria-label': ariaLabel,
  } = props;

  const labels = { ...DEFAULT_TIME_LABELS, ...labelOverrides };
  const baseId = useId();
  const listId = `${baseId}-list`;
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const controlled = value !== undefined;
  const [internal, setInternal] = useState<IsoTime>(defaultValue);
  const currentValue = controlled ? value : internal;

  const controlledOpen = open !== undefined;
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const isOpen = controlledOpen ? open : internalOpen;

  const [mounted, setMounted] = useState(false);
  const popStyle = useAnchorPosition(Boolean(isOpen && mounted), inputRef, listRef, { matchWidth: true });
  useEffect(() => setMounted(true), []);

  const [draft, setDraft] = useState('');
  const [typedInvalid, setTypedInvalid] = useState(false);

  const options = useMemo(() => {
    const lo = toMinutes(min) ?? 0;
    const hi = toMinutes(max) ?? 1439;
    const list: string[] = [];
    for (let t = lo; t <= hi; t += step) list.push(fromMinutes(t));
    return list;
  }, [min, max, step]);

  const [activeIndex, setActiveIndex] = useState(0);

  const setOpen = (next: boolean) => {
    if (!controlledOpen) setInternalOpen(next);
    onOpenChange?.(next);
  };

  // On open, seed the active option to the current value (or first), scroll to it.
  useEffect(() => {
    if (!isOpen || !mounted) return;
    const idx = currentValue ? options.indexOf(currentValue) : -1;
    const start = idx >= 0 ? idx : 0;
    setActiveIndex(start);
    const frame = requestAnimationFrame(() => {
      listRef.current?.querySelector<HTMLElement>('[data-active="true"]')?.scrollIntoView({ block: 'center' });
    });
    return () => cancelAnimationFrame(frame);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, mounted]);

  useEffect(() => {
    if (!isOpen || !mounted) return;
    const onDocPointer = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node) && !listRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('pointerdown', onDocPointer);
    return () => document.removeEventListener('pointerdown', onDocPointer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, mounted]);

  const commit = (next: IsoTime, source: TimePickerChangeMeta['source']) => {
    if (!controlled) setInternal(next);
    onChange?.(next, { source });
  };

  const choose = (time: string) => {
    commit(time, 'listbox');
    setDraft('');
    setTypedInvalid(false);
    setOpen(false);
    requestAnimationFrame(() => inputRef.current?.focus());
  };

  const scrollActiveIntoView = (idx: number) => {
    requestAnimationFrame(() => {
      const el = listRef.current?.querySelector<HTMLElement>(`#${CSS.escape(`${baseId}-opt-${idx}`)}`);
      el?.scrollIntoView({ block: 'nearest' });
    });
  };

  const applyTyped = () => {
    if (!allowInput || draft === '') {
      setDraft('');
      return;
    }
    const parsed = parseTime(draft);
    if (parsed) {
      commit(parsed, 'input');
      setTypedInvalid(false);
      setDraft('');
    } else {
      setTypedInvalid(true);
    }
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!isOpen) {
        setOpen(true);
        return;
      }
      setActiveIndex((i) => {
        const next = options.length ? (i + 1) % options.length : 0;
        scrollActiveIntoView(next);
        return next;
      });
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (!isOpen) {
        setOpen(true);
        return;
      }
      setActiveIndex((i) => {
        const next = options.length ? (i - 1 + options.length) % options.length : 0;
        scrollActiveIntoView(next);
        return next;
      });
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (isOpen && options[activeIndex]) choose(options[activeIndex]!);
      else applyTyped();
    } else if (e.key === 'Escape') {
      if (isOpen) {
        e.preventDefault();
        setOpen(false);
      }
    } else if (e.key === 'Home' && isOpen) {
      e.preventDefault();
      setActiveIndex(0);
      scrollActiveIntoView(0);
    } else if (e.key === 'End' && isOpen) {
      e.preventDefault();
      const last = options.length - 1;
      setActiveIndex(last);
      scrollActiveIntoView(last);
    }
  };

  const displayValue =
    draft !== '' ? draft : currentValue ? formatTime(currentValue, format) : '';
  const fieldInvalid = invalid || typedInvalid;
  const activeId = isOpen && options[activeIndex] ? `${baseId}-opt-${activeIndex}` : undefined;

  const rootClass = ['fx-time-picker', className].filter(Boolean).join(' ');

  const popover =
    isOpen && mounted
      ? createPortal(
          <ul
            ref={listRef}
            className="fx-time-picker-listbox"
            role="listbox"
            id={listId}
            aria-label={ariaLabel ?? labels.openList}
            style={popStyle}
          >
            {options.map((time, index) => {
              const selected = time === currentValue;
              const active = index === activeIndex;
              return (
                <li
                  key={time}
                  id={`${baseId}-opt-${index}`}
                  className="fx-time-picker-option"
                  role="option"
                  aria-selected={selected}
                  data-active={active || undefined}
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={() => choose(time)}
                >
                  {formatTime(time, format)}
                </li>
              );
            })}
          </ul>,
          document.body,
        )
      : null;

  return (
    <div
      ref={rootRef}
      className={rootClass}
      data-size={size}
      data-open={isOpen || undefined}
      data-invalid={fieldInvalid || undefined}
      data-disabled={disabled || undefined}
    >
      <div className="fx-time-picker-field">
        <input
          ref={inputRef}
          className="fx-time-picker-input"
          type="text"
          role="combobox"
          aria-expanded={isOpen}
          aria-controls={listId}
          aria-activedescendant={activeId}
          aria-autocomplete="list"
          aria-haspopup="listbox"
          aria-label={ariaLabel}
          aria-invalid={fieldInvalid || undefined}
          value={displayValue}
          placeholder={placeholder}
          disabled={disabled}
          readOnly={!allowInput}
          onChange={(e) => allowInput && setDraft(e.target.value)}
          onBlur={applyTyped}
          onKeyDown={onKeyDown}
        />
        <button
          type="button"
          className="fx-time-picker-trigger"
          aria-label={labels.openList}
          tabIndex={-1}
          disabled={disabled}
          onClick={() => setOpen(!isOpen)}
        >
          <FxIcon name="clock" size={20} />
        </button>
      </div>
      {popover}
    </div>
  );
}
