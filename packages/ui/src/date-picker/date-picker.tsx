'use client';
/**
 * FxDatePicker — Date Picker (doc 04 §2.15).
 *
 * A text field (calendar icon end-affix = trigger) plus a portalled,
 * non-modal calendar popover. Dates cross the public API as ISO-8601 date
 * strings (`'2026-07-11'`, date-only local) — never `Date` objects. Controlled
 * and uncontrolled per §1.5, for both `value` and `open`. The calendar grid
 * implements the APG date-grid keyboard map. SSR-safe: the popover renders into
 * `document.body` only after mount + while open.
 *
 * Exposes calendar primitives (`Calendar`, `iso`, `parseIso`, `MONTH_NAMES`,
 * `useCalendarGrid`) that FxDateRangePicker reuses.
 */
import { useEffect, useId, useRef, useState } from 'react';
import type { KeyboardEvent, ReactNode } from 'react';
import { createPortal } from 'react-dom';
import type { Size } from '../enums';
import { FxIcon } from '../icon/FxIcon';
import { useAnchorPosition } from '../anchor';

/** ISO date string (`'YYYY-MM-DD'`, date-only local) or null when empty. */
export type IsoDate = string | null;

/** `{ source }` meta accompanying every value change (doc 04 §1.6). */
export interface DatePickerChangeMeta {
  source: 'calendar' | 'input' | 'today' | 'clear';
}

/** i18n label set for the trigger, nav and footer. */
export interface DatePickerLabels {
  openCalendar: string;
  prevMonth: string;
  nextMonth: string;
  today: string;
  clear: string;
}

export const DEFAULT_DATE_LABELS: DatePickerLabels = {
  openCalendar: 'Open calendar',
  prevMonth: 'Previous month',
  nextMonth: 'Next month',
  today: 'Today',
  clear: 'Clear',
};

export const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
] as const;

export const WEEKDAY_NAMES = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'] as const;

/** Format a local Y/M/D triple as an ISO date string, zero-padded. */
export function iso(year: number, month: number, day: number): string {
  const mm = String(month + 1).padStart(2, '0');
  const dd = String(day).padStart(2, '0');
  return `${year}-${mm}-${dd}`;
}

/** Parse `'YYYY-MM-DD'` → `{year, month, day}` (month 0-based), or null. */
export function parseIso(value: string | null | undefined): { year: number; month: number; day: number } | null {
  if (!value) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!m) return null;
  const year = Number(m[1]);
  const month = Number(m[2]) - 1;
  const day = Number(m[3]);
  if (month < 0 || month > 11 || day < 1 || day > 31) return null;
  return { year, month, day };
}

/** ISO for today (local). */
export function todayIso(): string {
  const now = new Date();
  return iso(now.getFullYear(), now.getMonth(), now.getDate());
}

/** Add `months` to `{year, month}`, normalizing the month overflow. */
function addMonths(year: number, month: number, delta: number): { year: number; month: number } {
  const total = year * 12 + month + delta;
  return { year: Math.floor(total / 12), month: ((total % 12) + 12) % 12 };
}

/** Shift an ISO date by `days`, returning a new ISO string. */
export function shiftIso(value: string, days: number): string {
  const p = parseIso(value)!;
  const d = new Date(p.year, p.month, p.day + days);
  return iso(d.getFullYear(), d.getMonth(), d.getDate());
}

/** ISO comparison — dates are lexicographically ordered by design. */
export function isoLt(a: string, b: string): boolean {
  return a < b;
}

interface CalendarDay {
  isoDate: string;
  day: number;
  outside: boolean;
}

/** Build the 6×7 day matrix for a visible month. */
export function buildMonth(year: number, month: number, weekStartsOn: number): CalendarDay[] {
  const first = new Date(year, month, 1);
  const startOffset = (first.getDay() - weekStartsOn + 7) % 7;
  const days: CalendarDay[] = [];
  for (let i = 0; i < 42; i += 1) {
    const d = new Date(year, month, 1 - startOffset + i);
    days.push({
      isoDate: iso(d.getFullYear(), d.getMonth(), d.getDate()),
      day: d.getDate(),
      outside: d.getMonth() !== month,
    });
  }
  return days;
}

/** Shared calendar surface. Reused by the range picker (renders N of these). */
export interface CalendarProps {
  /** Visible month (0-based). */
  year: number;
  month: number;
  weekStartsOn: number;
  /** ISO of the keyboard-focused day (drives `tabindex`/roving focus). */
  focusedIso: string;
  /** ISO(s) marked selected. */
  isSelected: (isoDate: string) => boolean;
  /** ISO(s) painted as in-range (range picker). */
  isInRange?: (isoDate: string) => boolean;
  isDisabled: (isoDate: string) => boolean;
  gridLabel: string;
  onPick: (isoDate: string) => void;
  onDayFocus?: (isoDate: string) => void;
  onGridKeyDown: (e: KeyboardEvent<HTMLDivElement>) => void;
  weekdayNames: readonly string[];
  todayIsoValue: string;
}

export function Calendar({
  year,
  month,
  weekStartsOn,
  focusedIso,
  isSelected,
  isInRange,
  isDisabled,
  gridLabel,
  onPick,
  onDayFocus,
  onGridKeyDown,
  weekdayNames,
  todayIsoValue,
}: CalendarProps) {
  const days = buildMonth(year, month, weekStartsOn);
  const orderedWeekdays = [...weekdayNames.slice(weekStartsOn), ...weekdayNames.slice(0, weekStartsOn)];
  return (
    <div
      className="fx-calendar-grid"
      role="grid"
      aria-label={gridLabel}
      onKeyDown={onGridKeyDown}
    >
      <div className="fx-calendar-weekdays" role="row">
        {orderedWeekdays.map((wd) => (
          <span key={wd} className="fx-calendar-weekday" role="columnheader" aria-label={wd}>
            {wd}
          </span>
        ))}
      </div>
      {[0, 1, 2, 3, 4, 5].map((week) => (
        <div key={week} className="fx-calendar-week" role="row">
          {days.slice(week * 7, week * 7 + 7).map((cell) => {
            const selected = isSelected(cell.isoDate);
            const disabled = isDisabled(cell.isoDate);
            const today = cell.isoDate === todayIsoValue;
            const inRange = isInRange?.(cell.isoDate) ?? false;
            const isFocusTarget = cell.isoDate === focusedIso;
            return (
              <span key={cell.isoDate} className="fx-calendar-cell" role="gridcell" aria-selected={selected || undefined}>
                <button
                  type="button"
                  className="fx-calendar-day"
                  data-iso={cell.isoDate}
                  data-outside={cell.outside || undefined}
                  data-today={today || undefined}
                  data-selected={selected || undefined}
                  data-in-range={inRange || undefined}
                  tabIndex={isFocusTarget ? 0 : -1}
                  aria-current={today ? 'date' : undefined}
                  aria-disabled={disabled || undefined}
                  disabled={disabled}
                  onClick={() => !disabled && onPick(cell.isoDate)}
                  onFocus={() => onDayFocus?.(cell.isoDate)}
                >
                  {cell.day}
                </button>
              </span>
            );
          })}
        </div>
      ))}
    </div>
  );
}

export interface FxDatePickerProps {
  /** Controlled ISO value (§1.5). */
  value?: IsoDate;
  /** Uncontrolled initial ISO value. */
  defaultValue?: IsoDate;
  /** Out-of-range days are aria-disabled. ISO. */
  min?: string;
  max?: string;
  /** Business-rule disable (weekends, blackout). */
  isDateDisabled?: (isoDate: string) => boolean;
  /** 0 (Sunday) – 6. Defaults to `0`. */
  weekStartsOn?: number;
  /** Controlled open state. */
  open?: boolean;
  /** Uncontrolled initial open state. */
  defaultOpen?: boolean;
  /** Typed entry parsed on blur/Enter. Defaults to `true`. */
  allowInput?: boolean;
  /** Field height. Defaults to `md`. */
  size?: Size;
  /** `.is-invalid` + `aria-invalid`. */
  invalid?: boolean;
  disabled?: boolean;
  /** Placeholder for the text field. */
  placeholder?: string;
  /** Accessible name for the field (required without FieldGroup). */
  'aria-label'?: string;
  /** i18n labels for trigger / nav / footer. */
  labels?: Partial<DatePickerLabels>;
  onChange?: (value: IsoDate, meta: DatePickerChangeMeta) => void;
  onOpenChange?: (open: boolean) => void;
  onMonthChange?: (isoMonth: string) => void;
  className?: string;
}

export function FxDatePicker(props: FxDatePickerProps) {
  const {
    value,
    defaultValue = null,
    min,
    max,
    isDateDisabled,
    weekStartsOn = 0,
    open,
    defaultOpen = false,
    allowInput = true,
    size = 'md',
    invalid = false,
    disabled = false,
    placeholder = 'YYYY-MM-DD',
    labels: labelOverrides,
    onChange,
    onOpenChange,
    onMonthChange,
    className,
    'aria-label': ariaLabel,
  } = props;

  const labels = { ...DEFAULT_DATE_LABELS, ...labelOverrides };
  const baseId = useId();
  const gridId = `${baseId}-grid`;
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  const controlled = value !== undefined;
  const [internal, setInternal] = useState<IsoDate>(defaultValue);
  const currentValue = controlled ? value : internal;

  const controlledOpen = open !== undefined;
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const isOpen = controlledOpen ? open : internalOpen;

  const [mounted, setMounted] = useState(false);
  const popStyle = useAnchorPosition(Boolean(isOpen && mounted), rootRef, popoverRef);
  useEffect(() => setMounted(true), []);

  const [draft, setDraft] = useState('');
  const [typedInvalid, setTypedInvalid] = useState(false);

  // Visible month + roving focus target derive from the current value or today.
  const anchor = parseIso(currentValue) ?? parseIso(todayIso())!;
  const [view, setView] = useState<{ year: number; month: number }>({ year: anchor.year, month: anchor.month });
  const [focusedIso, setFocusedIso] = useState<string>(currentValue ?? todayIso());

  const setOpen = (next: boolean) => {
    if (!controlledOpen) setInternalOpen(next);
    onOpenChange?.(next);
  };

  const setView2 = (next: { year: number; month: number }) => {
    setView(next);
    onMonthChange?.(`${next.year}-${String(next.month + 1).padStart(2, '0')}`);
  };

  // On open, sync the view + focus to the current value (or today) and move
  // focus into the grid on the next frame.
  useEffect(() => {
    if (!isOpen || !mounted) return;
    const a = parseIso(currentValue) ?? parseIso(todayIso())!;
    setView({ year: a.year, month: a.month });
    setFocusedIso(currentValue ?? todayIso());
    const frame = requestAnimationFrame(() => {
      popoverRef.current?.querySelector<HTMLButtonElement>('.fx-calendar-day[tabindex="0"]')?.focus();
    });
    return () => cancelAnimationFrame(frame);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, mounted]);

  // Dismiss on outside pointer.
  useEffect(() => {
    if (!isOpen || !mounted) return;
    const onDocPointer = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node) && !popoverRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('pointerdown', onDocPointer);
    return () => document.removeEventListener('pointerdown', onDocPointer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, mounted]);

  const commit = (next: IsoDate, source: DatePickerChangeMeta['source']) => {
    if (!controlled) setInternal(next);
    onChange?.(next, { source });
  };

  const outOfRange = (isoDate: string): boolean =>
    (min != null && isoLt(isoDate, min)) || (max != null && isoLt(max, isoDate));

  const dayDisabled = (isoDate: string): boolean =>
    outOfRange(isoDate) || (isDateDisabled?.(isoDate) ?? false);

  const pickDay = (isoDate: string) => {
    if (dayDisabled(isoDate)) return;
    commit(isoDate, 'calendar');
    setDraft('');
    setTypedInvalid(false);
    setOpen(false);
    requestAnimationFrame(() => inputRef.current?.focus());
  };

  const moveFocus = (next: string) => {
    setFocusedIso(next);
    const p = parseIso(next)!;
    if (p.year !== view.year || p.month !== view.month) setView2({ year: p.year, month: p.month });
    requestAnimationFrame(() => {
      popoverRef.current?.querySelector<HTMLButtonElement>('.fx-calendar-day[tabindex="0"]')?.focus();
    });
  };

  const onGridKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    let next: string | null = null;
    switch (e.key) {
      case 'ArrowRight': next = shiftIso(focusedIso, 1); break;
      case 'ArrowLeft': next = shiftIso(focusedIso, -1); break;
      case 'ArrowDown': next = shiftIso(focusedIso, 7); break;
      case 'ArrowUp': next = shiftIso(focusedIso, -7); break;
      case 'Home': {
        const dow = new Date(parseIso(focusedIso)!.year, parseIso(focusedIso)!.month, parseIso(focusedIso)!.day).getDay();
        next = shiftIso(focusedIso, -((dow - weekStartsOn + 7) % 7));
        break;
      }
      case 'End': {
        const dow = new Date(parseIso(focusedIso)!.year, parseIso(focusedIso)!.month, parseIso(focusedIso)!.day).getDay();
        next = shiftIso(focusedIso, 6 - ((dow - weekStartsOn + 7) % 7));
        break;
      }
      case 'PageUp': {
        const p = parseIso(focusedIso)!;
        const m = addMonths(p.year, p.month, e.shiftKey ? -12 : -1);
        next = iso(m.year, m.month, Math.min(p.day, 28));
        break;
      }
      case 'PageDown': {
        const p = parseIso(focusedIso)!;
        const m = addMonths(p.year, p.month, e.shiftKey ? 12 : 1);
        next = iso(m.year, m.month, Math.min(p.day, 28));
        break;
      }
      case 'Enter':
      case ' ':
        e.preventDefault();
        pickDay(focusedIso);
        return;
      case 'Escape':
        e.preventDefault();
        setOpen(false);
        requestAnimationFrame(() => inputRef.current?.focus());
        return;
      default:
        return;
    }
    e.preventDefault();
    if (next) moveFocus(next);
  };

  const goMonth = (delta: number) => {
    const m = addMonths(view.year, view.month, delta);
    setView2(m);
  };

  const applyTyped = () => {
    if (!allowInput || draft === '') {
      setDraft('');
      return;
    }
    const parsed = parseIso(draft);
    if (parsed && !dayDisabled(draft)) {
      commit(draft, 'input');
      setTypedInvalid(false);
      setDraft('');
    } else {
      setTypedInvalid(true);
    }
  };

  const displayValue = draft !== '' ? draft : currentValue ?? '';
  const fieldInvalid = invalid || typedInvalid;

  const rootClass = ['fx-date-picker', className].filter(Boolean).join(' ');

  const popover: ReactNode =
    isOpen && mounted
      ? createPortal(
          <div
            ref={popoverRef}
            className="fx-date-picker-popover"
            role="dialog"
            aria-modal="false"
            aria-label={ariaLabel ?? labels.openCalendar}
            style={popStyle}
          >
            <div className="fx-calendar">
              <div className="fx-calendar-header">
                <button type="button" className="fx-calendar-prev" aria-label={labels.prevMonth} onClick={() => goMonth(-1)}>
                  <FxIcon name="back" size={20} />
                </button>
                <span className="fx-calendar-title" aria-live="polite">
                  {MONTH_NAMES[view.month]} {view.year}
                </span>
                <button type="button" className="fx-calendar-next" aria-label={labels.nextMonth} onClick={() => goMonth(1)}>
                  <FxIcon name="chevron" size={20} />
                </button>
              </div>
              <Calendar
                year={view.year}
                month={view.month}
                weekStartsOn={weekStartsOn}
                focusedIso={focusedIso}
                isSelected={(d) => d === currentValue}
                isDisabled={dayDisabled}
                gridLabel={`${MONTH_NAMES[view.month]} ${view.year}`}
                onPick={pickDay}
                onDayFocus={setFocusedIso}
                onGridKeyDown={onGridKeyDown}
                weekdayNames={WEEKDAY_NAMES}
                todayIsoValue={todayIso()}
              />
              <div className="fx-calendar-footer">
                <button type="button" className="fx-calendar-today-btn" onClick={() => pickDay(todayIso())}>
                  {labels.today}
                </button>
                <button
                  type="button"
                  className="fx-calendar-clear-btn"
                  onClick={() => {
                    commit(null, 'clear');
                    setDraft('');
                    setOpen(false);
                  }}
                >
                  {labels.clear}
                </button>
              </div>
            </div>
          </div>,
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
      id={gridId}
    >
      <div className="fx-date-picker-field">
        <input
          ref={inputRef}
          className="fx-date-picker-input"
          type="text"
          value={displayValue}
          placeholder={placeholder}
          disabled={disabled}
          readOnly={!allowInput}
          aria-label={ariaLabel}
          aria-invalid={fieldInvalid || undefined}
          onChange={(e) => allowInput && setDraft(e.target.value)}
          onBlur={applyTyped}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              applyTyped();
            }
          }}
        />
        <button
          type="button"
          className="fx-date-picker-trigger"
          aria-label={labels.openCalendar}
          aria-haspopup="dialog"
          aria-expanded={isOpen}
          disabled={disabled}
          onClick={() => setOpen(!isOpen)}
        >
          <FxIcon name="calendar" size={20} />
        </button>
      </div>
      {popover}
    </div>
  );
}
