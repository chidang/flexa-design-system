'use client';
/**
 * FxCalendar — Calendar (doc 04 §2.x "FxCalendar").
 *
 * A scheduling calendar surface with month / week / day views (the Flexa Booking
 * surface). DISTINCT from FxDatePicker's internal single-date calendar
 * (`.fx-calendar`): this is `.fx-calendar-view[data-view=…]`, it displays and
 * navigates *events*, not a value being picked.
 *
 * Reuses the date helpers (`iso`, `parseIso`, `shiftIso`, `todayIso`,
 * `buildMonth`, `MONTH_NAMES`, `WEEKDAY_NAMES`) from the date picker rather than
 * reimplementing date math, and FxTabs for the view switcher. The month grid is
 * a `role="grid"` single tab stop with roving cell focus (Arrow keys move days,
 * per the APG date-grid map). The "+N more" affordance opens an SSR-safe day
 * popover (portal gated on mount) built on `useModal`.
 *
 * Dates cross the public API as ISO strings; event `start`/`end` are ISO
 * datetimes (`'2026-07-11T09:00'`). Controlled/uncontrolled for both `view` and
 * `date` (§1.5). Every user-facing string is a prop via `labels`.
 */
import { forwardRef, useId, useRef, useState } from 'react';
import type { KeyboardEvent, ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { FxIcon } from '../icon/FxIcon';
import { FxTabs } from '../tabs/tabs';
import { useModal } from '../dialog/use-modal';
import type { Tone } from '../enums';
import {
  iso,
  parseIso,
  shiftIso,
  todayIso,
  buildMonth,
  MONTH_NAMES,
  WEEKDAY_NAMES,
} from '../date-picker/date-picker';

/** A view of the scheduling surface. */
export type CalendarView = 'month' | 'week' | 'day';

/** One scheduled event. `start`/`end` are ISO datetimes (`'YYYY-MM-DDThh:mm'`). */
export interface CalendarEvent {
  id: string;
  title: string;
  /** ISO datetime, e.g. `'2026-07-11T09:00'`. */
  start: string;
  /** ISO datetime; may equal `start` for a point event. */
  end: string;
  /** All-day events sit in the month cell header / day all-day rail. */
  allDay?: boolean;
  /** Chip colour. Defaults to `info`. */
  tone?: Tone;
  /** When set, the chip renders as a link. */
  href?: string;
}

/** i18n label set for the toolbar and overflow popover. */
export interface CalendarLabels {
  today: string;
  prev: string;
  next: string;
  /** `'+{n} more'` — `{n}` is substituted. */
  more: string;
  month: string;
  week: string;
  day: string;
  /** Accessible name for the grid (`{title}` = current period title). */
  grid: string;
  /** Accessible name for the overflow day popover. */
  dayEvents: string;
  closePopover: string;
}

export const DEFAULT_CALENDAR_LABELS: CalendarLabels = {
  today: 'Today',
  prev: 'Previous',
  next: 'Next',
  more: '+{n} more',
  month: 'Month',
  week: 'Week',
  day: 'Day',
  grid: 'Calendar',
  dayEvents: 'Events',
  closePopover: 'Close',
};

/** Hours shown in the week/day time gutter (business day). */
const GUTTER_START = 8;
const GUTTER_END = 20;

/** Extract the `'YYYY-MM-DD'` date part of an ISO datetime. */
function datePart(isoDateTime: string): string {
  return isoDateTime.slice(0, 10);
}

/** Extract the `hh:mm` part of an ISO datetime, or `''`. */
function timePart(isoDateTime: string): string {
  const t = isoDateTime.slice(11, 16);
  return /^\d{2}:\d{2}$/.test(t) ? t : '';
}

/** Minutes-since-midnight for an ISO datetime, or 0. */
function minutesOf(isoDateTime: string): number {
  const t = timePart(isoDateTime);
  if (!t) return 0;
  return Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5));
}

/** Format an `hh:mm` label for the gutter. */
function hourLabel(hour: number): string {
  return `${String(hour).padStart(2, '0')}:00`;
}

/** ISO of the first visible day of the week containing `dateIso`. */
function weekStart(dateIso: string, weekStartsOn: number): string {
  const p = parseIso(dateIso)!;
  const dow = new Date(p.year, p.month, p.day).getDay();
  return shiftIso(dateIso, -((dow - weekStartsOn + 7) % 7));
}

/** The seven ISO dates of the week containing `dateIso`. */
function weekDays(dateIso: string, weekStartsOn: number): string[] {
  const start = weekStart(dateIso, weekStartsOn);
  return [0, 1, 2, 3, 4, 5, 6].map((i) => shiftIso(start, i));
}

/** Events whose date part equals `dateIso`, ordered by start time. */
function eventsOn(events: CalendarEvent[], dateIso: string): CalendarEvent[] {
  return events
    .filter((e) => datePart(e.start) === dateIso)
    .sort((a, b) => minutesOf(a.start) - minutesOf(b.start));
}

/** The period title for the toolbar, per view. */
function periodTitle(view: CalendarView, dateIso: string, weekStartsOn: number): string {
  const p = parseIso(dateIso)!;
  if (view === 'month') return `${MONTH_NAMES[p.month]} ${p.year}`;
  if (view === 'day') return `${MONTH_NAMES[p.month]} ${p.day}, ${p.year}`;
  const days = weekDays(dateIso, weekStartsOn);
  const a = parseIso(days[0]!)!;
  const b = parseIso(days[6]!)!;
  if (a.month === b.month) return `${MONTH_NAMES[a.month]} ${a.day} – ${b.day}, ${a.year}`;
  return `${MONTH_NAMES[a.month]} ${a.day} – ${MONTH_NAMES[b.month]} ${b.day}, ${b.year}`;
}

export interface FxCalendarProps {
  /** Events to display. Defaults to `[]`. */
  events?: CalendarEvent[];
  /** Controlled view (§1.5). */
  view?: CalendarView;
  /** Uncontrolled initial view. Defaults to `'month'`. */
  defaultView?: CalendarView;
  onViewChange?: (view: CalendarView) => void;
  /** Controlled focused date, ISO `'YYYY-MM-DD'` (§1.5). */
  date?: string;
  /** Uncontrolled initial date. Defaults to today. */
  defaultDate?: string;
  onDateChange?: (date: string) => void;
  /** Fired when an event chip is activated. */
  onEventClick?: (event: CalendarEvent) => void;
  /** Fired when an empty slot / day is activated. */
  onSlotClick?: (slot: { date: string; time?: string }) => void;
  /** Custom chip content; falls back to the event title. */
  renderEvent?: (event: CalendarEvent) => ReactNode;
  /** 0 (Sunday) – 6. Defaults to `0`. */
  weekStartsOn?: number;
  /** Max event chips per month cell before "+N more". Defaults to `3`. */
  maxPerCell?: number;
  labels?: Partial<CalendarLabels>;
  className?: string;
}

/** One event chip (button or link). Shared by every view. */
function EventChip({
  event,
  render,
  onEventClick,
}: {
  event: CalendarEvent;
  render?: (event: CalendarEvent) => ReactNode;
  onEventClick?: (event: CalendarEvent) => void;
}) {
  const body = render ? render(event) : event.title;
  const time = !event.allDay ? timePart(event.start) : '';
  const content = (
    <>
      {time && <span className="fx-calendar-view-chip-time">{time}</span>}
      <span className="fx-calendar-view-chip-title">{body}</span>
    </>
  );
  const tone = event.tone ?? 'info';
  if (event.href) {
    return (
      <a
        className="fx-calendar-view-chip"
        data-tone={tone}
        href={event.href}
        onClick={() => onEventClick?.(event)}
      >
        {content}
      </a>
    );
  }
  return (
    <button
      type="button"
      className="fx-calendar-view-chip"
      data-tone={tone}
      onClick={() => onEventClick?.(event)}
    >
      {content}
    </button>
  );
}

export function FxCalendar(props: FxCalendarProps) {
  const {
    events = [],
    view: viewProp,
    defaultView = 'month',
    onViewChange,
    date: dateProp,
    defaultDate,
    onDateChange,
    onEventClick,
    onSlotClick,
    renderEvent,
    weekStartsOn = 0,
    maxPerCell = 3,
    labels: labelOverrides,
    className,
  } = props;

  const labels = { ...DEFAULT_CALENDAR_LABELS, ...labelOverrides };
  const baseId = useId();
  const gridRef = useRef<HTMLDivElement>(null);

  const viewControlled = viewProp !== undefined;
  const [viewInternal, setViewInternal] = useState<CalendarView>(defaultView);
  const view = viewControlled ? viewProp : viewInternal;

  const dateControlled = dateProp !== undefined;
  const [dateInternal, setDateInternal] = useState<string>(defaultDate ?? todayIso());
  const date = dateControlled ? dateProp : dateInternal;

  // Roving focus target within the month grid (defaults to the current date).
  const [focusedIso, setFocusedIso] = useState<string>(date);

  // "+N more" overflow popover — day whose full list is shown, or null.
  const [overflowDay, setOverflowDay] = useState<string | null>(null);
  const modal = useModal({
    open: overflowDay !== null,
    onOpenChange: (open) => {
      if (!open) setOverflowDay(null);
    },
  });

  const setView = (next: CalendarView) => {
    if (!viewControlled) setViewInternal(next);
    onViewChange?.(next);
  };

  const setDate = (next: string) => {
    if (!dateControlled) setDateInternal(next);
    setFocusedIso(next);
    onDateChange?.(next);
  };

  // Toolbar navigation step depends on the view.
  const step = (dir: 1 | -1) => {
    if (view === 'day') {
      setDate(shiftIso(date, dir));
    } else if (view === 'week') {
      setDate(shiftIso(date, dir * 7));
    } else {
      const p = parseIso(date)!;
      const total = p.year * 12 + p.month + dir;
      const year = Math.floor(total / 12);
      const month = ((total % 12) + 12) % 12;
      const day = Math.min(p.day, new Date(year, month + 1, 0).getDate());
      setDate(iso(year, month, day));
    }
  };

  const focusDay = (next: string) => {
    setFocusedIso(next);
    // Pull the visible month with the focus if it crossed a boundary.
    const pv = parseIso(date)!;
    const pn = parseIso(next)!;
    if (pn.year !== pv.year || pn.month !== pv.month) {
      if (!dateControlled) setDateInternal(next);
      onDateChange?.(next);
    }
    requestAnimationFrame(() => {
      gridRef.current
        ?.querySelector<HTMLElement>('.fx-calendar-view-cell[tabindex="0"]')
        ?.focus();
    });
  };

  // Month grid roving keyboard (APG date-grid map; Enter/Space = slot click).
  const onGridKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    let next: string | null = null;
    switch (e.key) {
      case 'ArrowRight': next = shiftIso(focusedIso, 1); break;
      case 'ArrowLeft': next = shiftIso(focusedIso, -1); break;
      case 'ArrowDown': next = shiftIso(focusedIso, 7); break;
      case 'ArrowUp': next = shiftIso(focusedIso, -7); break;
      case 'Home': next = weekStart(focusedIso, weekStartsOn); break;
      case 'End': next = shiftIso(weekStart(focusedIso, weekStartsOn), 6); break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        onSlotClick?.({ date: focusedIso });
        return;
      default:
        return;
    }
    e.preventDefault();
    if (next) focusDay(next);
  };

  const rootClass = ['fx-calendar-view', className].filter(Boolean).join(' ');
  const title = periodTitle(view, date, weekStartsOn);

  const viewTabs = (
    <FxTabs
      className="fx-calendar-view-tabs"
      value={view}
      onChange={(id) => setView(id as CalendarView)}
      variant="contained"
      size="sm"
      items={[
        { id: 'month', label: labels.month, content: null },
        { id: 'week', label: labels.week, content: null },
        { id: 'day', label: labels.day, content: null },
      ]}
    />
  );

  return (
    <div className={rootClass} data-view={view}>
      <div className="fx-calendar-view-toolbar">
        <div className="fx-calendar-view-nav">
          <button
            type="button"
            className="fx-calendar-view-navbtn"
            aria-label={labels.prev}
            onClick={() => step(-1)}
          >
            <FxIcon name="back" size={20} />
          </button>
          <button
            type="button"
            className="fx-calendar-view-today"
            onClick={() => setDate(todayIso())}
          >
            {labels.today}
          </button>
          <button
            type="button"
            className="fx-calendar-view-navbtn"
            aria-label={labels.next}
            onClick={() => step(1)}
          >
            <FxIcon name="chevron" size={20} />
          </button>
        </div>
        <h2 className="fx-calendar-view-title" aria-live="polite">
          {title}
        </h2>
        {viewTabs}
      </div>

      {view === 'month' && (
        <MonthGrid
          ref={gridRef}
          date={date}
          focusedIso={focusedIso}
          events={events}
          weekStartsOn={weekStartsOn}
          maxPerCell={maxPerCell}
          labels={labels}
          gridLabel={`${labels.grid}: ${title}`}
          renderEvent={renderEvent}
          onEventClick={onEventClick}
          onSlotClick={onSlotClick}
          onDayFocus={setFocusedIso}
          onGridKeyDown={onGridKeyDown}
          onShowMore={setOverflowDay}
        />
      )}

      {view === 'week' && (
        <TimeGrid
          days={weekDays(date, weekStartsOn)}
          events={events}
          gridLabel={`${labels.grid}: ${title}`}
          renderEvent={renderEvent}
          onEventClick={onEventClick}
          onSlotClick={onSlotClick}
        />
      )}

      {view === 'day' && (
        <TimeGrid
          days={[date]}
          events={events}
          gridLabel={`${labels.grid}: ${title}`}
          renderEvent={renderEvent}
          onEventClick={onEventClick}
          onSlotClick={onSlotClick}
        />
      )}

      {overflowDay !== null && modal.mounted &&
        createPortal(
          <div
            className="fx-calendar-view-popover-backdrop"
            onMouseDown={(e) => {
              if (e.target === e.currentTarget) modal.requestClose('backdrop');
            }}
          >
            <div
              ref={modal.surfaceRef}
              className="fx-calendar-view-popover"
              role="dialog"
              aria-modal="true"
              aria-labelledby={modal.titleId}
              tabIndex={-1}
              onKeyDown={modal.onKeyDown}
            >
              <div className="fx-calendar-view-popover-head">
                <h3 id={modal.titleId} className="fx-calendar-view-popover-title">
                  {(() => {
                    const p = parseIso(overflowDay)!;
                    return `${MONTH_NAMES[p.month]} ${p.day}`;
                  })()}
                </h3>
                <button
                  type="button"
                  className="fx-calendar-view-navbtn"
                  aria-label={labels.closePopover}
                  onClick={() => modal.requestClose('close-button')}
                >
                  <FxIcon name="close" size={20} />
                </button>
              </div>
              <ul className="fx-calendar-view-popover-list" aria-label={labels.dayEvents}>
                {eventsOn(events, overflowDay).map((ev) => (
                  <li key={ev.id}>
                    <EventChip event={ev} render={renderEvent} onEventClick={onEventClick} />
                  </li>
                ))}
              </ul>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}

interface MonthGridProps {
  date: string;
  focusedIso: string;
  events: CalendarEvent[];
  weekStartsOn: number;
  maxPerCell: number;
  labels: CalendarLabels;
  gridLabel: string;
  renderEvent?: (event: CalendarEvent) => ReactNode;
  onEventClick?: (event: CalendarEvent) => void;
  onSlotClick?: (slot: { date: string; time?: string }) => void;
  onDayFocus: (isoDate: string) => void;
  onGridKeyDown: (e: KeyboardEvent<HTMLDivElement>) => void;
  onShowMore: (isoDate: string) => void;
}

/** Month view — 6×7 date grid; each cell hosts up to `maxPerCell` chips. */
const MonthGrid = forwardRef<HTMLDivElement, MonthGridProps>(function MonthGrid(
  {
    date,
    focusedIso,
    events,
    weekStartsOn,
    maxPerCell,
    labels,
    gridLabel,
    renderEvent,
    onEventClick,
    onSlotClick,
    onDayFocus,
    onGridKeyDown,
    onShowMore,
  },
  ref,
) {
    const p = parseIso(date)!;
    const days = buildMonth(p.year, p.month, weekStartsOn);
    const weekdays = [
      ...WEEKDAY_NAMES.slice(weekStartsOn),
      ...WEEKDAY_NAMES.slice(0, weekStartsOn),
    ];
    const today = todayIso();
    return (
      <div
        ref={ref}
        className="fx-calendar-view-grid"
        role="grid"
        aria-label={gridLabel}
        onKeyDown={onGridKeyDown}
      >
        <div className="fx-calendar-view-weekdays" role="row">
          {weekdays.map((wd) => (
            <span key={wd} className="fx-calendar-view-weekday" role="columnheader">
              {wd}
            </span>
          ))}
        </div>
        {[0, 1, 2, 3, 4, 5].map((week) => (
          <div key={week} className="fx-calendar-view-week" role="row">
            {days.slice(week * 7, week * 7 + 7).map((cell) => {
              const dayEvents = eventsOn(events, cell.isoDate);
              const visible = dayEvents.slice(0, maxPerCell);
              const overflow = dayEvents.length - visible.length;
              const isFocus = cell.isoDate === focusedIso;
              return (
                <div
                  key={cell.isoDate}
                  className="fx-calendar-view-cell"
                  role="gridcell"
                  data-outside={cell.outside || undefined}
                  data-today={cell.isoDate === today || undefined}
                  aria-current={cell.isoDate === today ? 'date' : undefined}
                  tabIndex={isFocus ? 0 : -1}
                  onFocus={() => onDayFocus(cell.isoDate)}
                  onClick={(e) => {
                    if (e.target === e.currentTarget) onSlotClick?.({ date: cell.isoDate });
                  }}
                >
                  <span className="fx-calendar-view-daynum">{cell.day}</span>
                  <div className="fx-calendar-view-cell-events">
                    {visible.map((ev) => (
                      <EventChip
                        key={ev.id}
                        event={ev}
                        render={renderEvent}
                        onEventClick={onEventClick}
                      />
                    ))}
                    {overflow > 0 && (
                      <button
                        type="button"
                        className="fx-calendar-view-more"
                        onClick={() => onShowMore(cell.isoDate)}
                      >
                        {labels.more.replace('{n}', String(overflow))}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    );
});

/** Week/day view — a time gutter plus one column per day of positioned blocks. */
function TimeGrid({
  days,
  events,
  gridLabel,
  renderEvent,
  onEventClick,
  onSlotClick,
}: {
  days: string[];
  events: CalendarEvent[];
  gridLabel: string;
  renderEvent?: (event: CalendarEvent) => ReactNode;
  onEventClick?: (event: CalendarEvent) => void;
  onSlotClick?: (slot: { date: string; time?: string }) => void;
}) {
  const hours: number[] = [];
  for (let h = GUTTER_START; h <= GUTTER_END; h += 1) hours.push(h);
  const spanMin = (GUTTER_END - GUTTER_START) * 60;
  const today = todayIso();

  return (
    <div className="fx-calendar-view-grid" role="grid" aria-label={gridLabel}>
      <div className="fx-calendar-view-timehead" role="row">
        <span className="fx-calendar-view-gutter-corner" role="columnheader" aria-hidden="true" />
        {days.map((d) => {
          const p = parseIso(d)!;
          return (
            <span
              key={d}
              className="fx-calendar-view-dayhead"
              role="columnheader"
              data-today={d === today || undefined}
            >
              {WEEKDAY_NAMES[new Date(p.year, p.month, p.day).getDay()]} {p.day}
            </span>
          );
        })}
      </div>
      <div className="fx-calendar-view-timebody" role="row">
        <div className="fx-calendar-view-gutter" aria-hidden="true">
          {hours.map((h) => (
            <span key={h} className="fx-calendar-view-hour">
              {hourLabel(h)}
            </span>
          ))}
        </div>
        {days.map((d) => (
          <div
            key={d}
            className="fx-calendar-view-daycol"
            role="gridcell"
            onClick={(e) => {
              if (e.target === e.currentTarget) onSlotClick?.({ date: d });
            }}
          >
            {hours.map((h) => (
              <span key={h} className="fx-calendar-view-slotline" aria-hidden="true" />
            ))}
            {eventsOn(events, d)
              .filter((ev) => !ev.allDay)
              .map((ev) => {
                const startMin = Math.max(minutesOf(ev.start) - GUTTER_START * 60, 0);
                const endMin = Math.min(minutesOf(ev.end) - GUTTER_START * 60, spanMin);
                const topPct = (startMin / spanMin) * 100;
                const hPct = Math.max(((endMin - startMin) / spanMin) * 100, 3);
                return (
                  <div
                    key={ev.id}
                    className="fx-calendar-view-block"
                    data-tone={ev.tone ?? 'info'}
                    style={{ top: `${topPct}%`, height: `${hPct}%` }}
                  >
                    <EventChip event={ev} render={renderEvent} onEventClick={onEventClick} />
                  </div>
                );
              })}
          </div>
        ))}
      </div>
    </div>
  );
}
