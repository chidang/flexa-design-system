'use client';
/**
 * FxDateRangePicker — Date Range Picker (doc 04 §2.16).
 *
 * Extends FxDatePicker: reuses its calendar primitives (`Calendar`, `iso`,
 * `parseIso`, keyboard grid). Value is `{ start, end }` (ISO strings). First
 * pick sets `start`, second sets `end` (auto-swapped if earlier); intermediate
 * days paint `.is-in-range`. `onChange` fires only when the pair is complete or
 * cleared; `onPartialChange` fires on the first pick. Optional preset list and
 * 1–2 side-by-side months. Controlled/uncontrolled for value + open (§1.5),
 * SSR-safe portal popover.
 */
import { useEffect, useId, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import { createPortal } from 'react-dom';
import type { Size } from '../enums';
import { FxIcon } from '../icon/FxIcon';
import { useAnchorPosition } from '../anchor';
import {
  Calendar,
  DEFAULT_DATE_LABELS,
  MONTH_NAMES,
  WEEKDAY_NAMES,
  isoLt,
  parseIso,
  shiftIso,
  todayIso,
  type DatePickerLabels,
} from '../date-picker/date-picker';

/** An inclusive date range. Either bound may be null while a pick is pending. */
export interface DateRange {
  start: string | null;
  end: string | null;
}

/** `{ source }` meta accompanying a completed range change (doc 04 §1.6). */
export interface DateRangeChangeMeta {
  source: 'calendar' | 'preset' | 'clear';
}

export interface DateRangePreset {
  label: string;
  range: DateRange;
}

/** i18n labels — DatePicker set plus the live-region announcement. */
export interface DateRangeLabels extends DatePickerLabels {
  startSelected: string;
}

const DEFAULT_RANGE_LABELS: DateRangeLabels = {
  ...DEFAULT_DATE_LABELS,
  startSelected: 'Start date selected. Choose end date.',
};

function addMonthView(year: number, month: number, delta: number): { year: number; month: number } {
  const total = year * 12 + month + delta;
  return { year: Math.floor(total / 12), month: ((total % 12) + 12) % 12 };
}

export interface FxDateRangePickerProps {
  /** Controlled range (§1.5). */
  value?: DateRange;
  /** Uncontrolled initial range. */
  defaultValue?: DateRange;
  min?: string;
  max?: string;
  isDateDisabled?: (isoDate: string) => boolean;
  weekStartsOn?: number;
  open?: boolean;
  defaultOpen?: boolean;
  size?: Size;
  invalid?: boolean;
  disabled?: boolean;
  /** Quick-select ranges rendered beside the calendar. */
  presets?: DateRangePreset[];
  /** Side-by-side calendars. Defaults to `2`. */
  months?: 1 | 2;
  /** Range length constraints; violating end-picks disabled. */
  minDays?: number;
  maxDays?: number;
  placeholder?: string;
  'aria-label'?: string;
  labels?: Partial<DateRangeLabels>;
  /** Fires only on a complete pair or clear. */
  onChange?: (value: DateRange, meta: DateRangeChangeMeta) => void;
  /** Fires on the first (start-only) pick. */
  onPartialChange?: (value: DateRange) => void;
  onOpenChange?: (open: boolean) => void;
  className?: string;
}

const EMPTY: DateRange = { start: null, end: null };

/** Inclusive whole-day count between two ISO dates. */
function daySpan(a: string, b: string): number {
  const pa = parseIso(a)!;
  const pb = parseIso(b)!;
  const da = new Date(pa.year, pa.month, pa.day).getTime();
  const db = new Date(pb.year, pb.month, pb.day).getTime();
  return Math.round(Math.abs(db - da) / 86_400_000) + 1;
}

export function FxDateRangePicker(props: FxDateRangePickerProps) {
  const {
    value,
    defaultValue = EMPTY,
    min,
    max,
    isDateDisabled,
    weekStartsOn = 0,
    open,
    defaultOpen = false,
    size = 'md',
    invalid = false,
    disabled = false,
    presets,
    months = 2,
    minDays,
    maxDays,
    placeholder = 'YYYY-MM-DD – YYYY-MM-DD',
    labels: labelOverrides,
    onChange,
    onPartialChange,
    onOpenChange,
    className,
    'aria-label': ariaLabel,
  } = props;

  const labels = { ...DEFAULT_RANGE_LABELS, ...labelOverrides };
  const baseId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const fieldRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  const controlled = value !== undefined;
  const [internal, setInternal] = useState<DateRange>(defaultValue);
  const current = controlled ? value : internal;

  const controlledOpen = open !== undefined;
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const isOpen = controlledOpen ? open : internalOpen;

  const [mounted, setMounted] = useState(false);
  const popStyle = useAnchorPosition(Boolean(isOpen && mounted), fieldRef, popoverRef);
  useEffect(() => setMounted(true), []);

  // While `pending` holds a start with no end, we're mid-selection.
  const [pendingStart, setPendingStart] = useState<string | null>(null);
  const [hoverIso, setHoverIso] = useState<string | null>(null);
  const [announce, setAnnounce] = useState('');

  const anchor = parseIso(current.start) ?? parseIso(todayIso())!;
  const [view, setView] = useState<{ year: number; month: number }>({ year: anchor.year, month: anchor.month });
  const [focusedIso, setFocusedIso] = useState<string>(current.start ?? todayIso());

  const setOpen = (next: boolean) => {
    if (!controlledOpen) setInternalOpen(next);
    onOpenChange?.(next);
    if (!next) {
      setPendingStart(null);
      setHoverIso(null);
    }
  };

  useEffect(() => {
    if (!isOpen || !mounted) return;
    const a = parseIso(current.start) ?? parseIso(todayIso())!;
    setView({ year: a.year, month: a.month });
    setFocusedIso(current.start ?? todayIso());
    const frame = requestAnimationFrame(() => {
      popoverRef.current?.querySelector<HTMLButtonElement>('.fx-calendar-day[tabindex="0"]')?.focus();
    });
    return () => cancelAnimationFrame(frame);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, mounted]);

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

  const outOfRange = (d: string): boolean =>
    (min != null && isoLt(d, min)) || (max != null && isoLt(max, d));

  // A candidate end-day is disabled if it violates the length constraints
  // relative to the pending start.
  const violatesLength = (d: string): boolean => {
    if (pendingStart == null) return false;
    const span = daySpan(pendingStart, d);
    if (minDays != null && span < minDays) return true;
    if (maxDays != null && span > maxDays) return true;
    return false;
  };

  const dayDisabled = (d: string): boolean =>
    outOfRange(d) || (isDateDisabled?.(d) ?? false) || violatesLength(d);

  const commit = (next: DateRange, source: DateRangeChangeMeta['source']) => {
    if (!controlled) setInternal(next);
    onChange?.(next, { source });
  };

  const pickDay = (d: string) => {
    if (dayDisabled(d)) return;
    if (pendingStart == null) {
      setPendingStart(d);
      setHoverIso(d);
      setAnnounce(labels.startSelected);
      onPartialChange?.({ start: d, end: null });
      return;
    }
    // Second pick — order the pair.
    const [start, end] = isoLt(d, pendingStart) ? [d, pendingStart] : [pendingStart, d];
    setPendingStart(null);
    setHoverIso(null);
    setAnnounce('');
    commit({ start, end }, 'calendar');
    setOpen(false);
    requestAnimationFrame(() => fieldRef.current?.focus());
  };

  // Effective range shown in the grid: committed pair, or pending start + hover.
  const shown: DateRange =
    pendingStart != null
      ? (() => {
          const other = hoverIso ?? pendingStart;
          return isoLt(other, pendingStart)
            ? { start: other, end: pendingStart }
            : { start: pendingStart, end: other };
        })()
      : current;

  const isSelected = (d: string): boolean => d === shown.start || d === shown.end;
  const isInRange = (d: string): boolean =>
    shown.start != null && shown.end != null && isoLt(shown.start, d) && isoLt(d, shown.end);

  const moveFocus = (next: string) => {
    setFocusedIso(next);
    const p = parseIso(next)!;
    if (p.year !== view.year || p.month !== view.month) setView({ year: p.year, month: p.month });
    if (pendingStart != null) setHoverIso(next);
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
      case 'PageUp': {
        const p = parseIso(focusedIso)!;
        const m = addMonthView(p.year, p.month, e.shiftKey ? -12 : -1);
        next = `${m.year}-${String(m.month + 1).padStart(2, '0')}-${String(Math.min(p.day, 28)).padStart(2, '0')}`;
        break;
      }
      case 'PageDown': {
        const p = parseIso(focusedIso)!;
        const m = addMonthView(p.year, p.month, e.shiftKey ? 12 : 1);
        next = `${m.year}-${String(m.month + 1).padStart(2, '0')}-${String(Math.min(p.day, 28)).padStart(2, '0')}`;
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
        requestAnimationFrame(() => fieldRef.current?.focus());
        return;
      default:
        return;
    }
    e.preventDefault();
    if (next) moveFocus(next);
  };

  const goMonth = (delta: number) => setView((v) => addMonthView(v.year, v.month, delta));

  const applyPreset = (preset: DateRangePreset) => {
    setPendingStart(null);
    commit(preset.range, 'preset');
    setOpen(false);
    requestAnimationFrame(() => fieldRef.current?.focus());
  };

  const displayValue =
    current.start && current.end ? `${current.start} – ${current.end}` : current.start ?? '';

  const rootClass = ['fx-date-range-picker', className].filter(Boolean).join(' ');

  const monthViews = months === 2 ? [view, addMonthView(view.year, view.month, 1)] : [view];

  const popover =
    isOpen && mounted
      ? createPortal(
          <div
            ref={popoverRef}
            className="fx-date-range-picker-popover"
            role="dialog"
            aria-modal="false"
            aria-label={ariaLabel ?? labels.openCalendar}
            style={popStyle}
          >
            {presets && presets.length > 0 && (
              <ul className="fx-date-range-presets">
                {presets.map((preset) => (
                  <li key={preset.label}>
                    <button type="button" className="fx-date-range-preset" onClick={() => applyPreset(preset)}>
                      {preset.label}
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <div className="fx-date-range-calendars">
              <div className="fx-calendar-header">
                <button type="button" className="fx-calendar-prev" aria-label={labels.prevMonth} onClick={() => goMonth(-1)}>
                  <FxIcon name="back" size={20} />
                </button>
                <span className="fx-calendar-title" aria-live="polite">
                  {monthViews.map((mv) => `${MONTH_NAMES[mv.month]} ${mv.year}`).join(' – ')}
                </span>
                <button type="button" className="fx-calendar-next" aria-label={labels.nextMonth} onClick={() => goMonth(1)}>
                  <FxIcon name="chevron" size={20} />
                </button>
              </div>
              <div className="fx-date-range-months" data-months={months}>
                {monthViews.map((mv) => (
                  <div
                    key={`${mv.year}-${mv.month}`}
                    className="fx-calendar"
                    onMouseLeave={() => pendingStart != null && setHoverIso(pendingStart)}
                    onMouseOver={(e) => {
                      const btn = (e.target as HTMLElement).closest<HTMLButtonElement>('.fx-calendar-day');
                      const owned = btn?.dataset.iso;
                      if (owned && pendingStart != null) setHoverIso(owned);
                    }}
                  >
                    <Calendar
                      year={mv.year}
                      month={mv.month}
                      weekStartsOn={weekStartsOn}
                      focusedIso={focusedIso}
                      isSelected={isSelected}
                      isInRange={isInRange}
                      isDisabled={dayDisabled}
                      gridLabel={`${MONTH_NAMES[mv.month]} ${mv.year}`}
                      onPick={pickDay}
                      onDayFocus={setFocusedIso}
                      onGridKeyDown={onGridKeyDown}
                      weekdayNames={WEEKDAY_NAMES}
                      todayIsoValue={todayIso()}
                    />
                  </div>
                ))}
              </div>
              <div className="fx-calendar-footer">
                <button
                  type="button"
                  className="fx-calendar-clear-btn"
                  onClick={() => {
                    setPendingStart(null);
                    commit(EMPTY, 'clear');
                    setOpen(false);
                  }}
                >
                  {labels.clear}
                </button>
              </div>
            </div>
            <span className="fx-date-range-live" role="status" aria-live="polite">
              {announce}
            </span>
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
      data-invalid={invalid || undefined}
      data-disabled={disabled || undefined}
      id={`${baseId}-root`}
    >
      <button
        ref={fieldRef}
        type="button"
        className="fx-date-range-picker-field"
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        aria-label={ariaLabel}
        disabled={disabled}
        onClick={() => setOpen(!isOpen)}
      >
        <span className="fx-date-range-picker-value" data-empty={displayValue === '' || undefined}>
          {displayValue || placeholder}
        </span>
        <span className="fx-date-range-picker-trigger" aria-hidden="true">
          <FxIcon name="calendar" size={20} />
        </span>
      </button>
      {popover}
    </div>
  );
}
