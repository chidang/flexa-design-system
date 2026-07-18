/**
 * FxCalendar showcase spec. Only the SHARED `tone` union (from `enums.ts`)
 * appears in `enums`; the `'month' | 'week' | 'day'` view union is the
 * component's own type and is documented as a type string in `props`.
 */
import type { ShowcaseSpec } from '../showcase-types';
import { TONES } from '../enums';
import { FxCalendar } from './calendar';

// A fixed anchor month so the SSR snapshot is stable (todayIso is not used here).
const DATE = '2026-07-15';

const EVENTS = [
  { id: 'e1', title: 'Standup', start: '2026-07-13T09:00', end: '2026-07-13T09:30', tone: 'info' },
  { id: 'e2', title: 'Design review', start: '2026-07-15T11:00', end: '2026-07-15T12:00', tone: 'success' },
  { id: 'e3', title: 'Client call', start: '2026-07-15T14:00', end: '2026-07-15T15:00', tone: 'warning' },
  { id: 'e4', title: 'Deploy window', start: '2026-07-15T16:00', end: '2026-07-15T17:30', tone: 'danger' },
  { id: 'e5', title: 'Retro', start: '2026-07-17T13:00', end: '2026-07-17T14:00', tone: 'info' },
];

// A day with more events than fit in a month cell → "+N more".
const CROWDED = [
  ...EVENTS,
  { id: 'e6', title: '1:1 with Sam', start: '2026-07-15T10:00', end: '2026-07-15T10:30', tone: 'info' },
  { id: 'e7', title: 'Budget sync', start: '2026-07-15T15:30', end: '2026-07-15T16:00', tone: 'success' },
];

const TONE_EVENTS = TONES.map((tone, i) => ({
  id: `t-${tone}`,
  title: `${tone} event`,
  start: `2026-07-1${3 + i}T${String(9 + i).padStart(2, '0')}:00`,
  end: `2026-07-1${3 + i}T${String(10 + i).padStart(2, '0')}:00`,
  tone,
}));

export const calendarShowcase: ShowcaseSpec = {
  name: 'FxCalendar',
  slug: 'calendar',
  category: 'data',
  slice: 'U6',
  status: 'ready',
  interactive: true,
  tagline: 'A scheduling calendar with month, week and day views of events.',
  component: FxCalendar,
  variants: [
    {
      label: 'month view with events',
      props: { defaultDate: DATE, defaultView: 'month', events: EVENTS },
    },
    {
      label: 'month with "+N more" overflow',
      props: { defaultDate: DATE, defaultView: 'month', events: CROWDED, maxPerCell: 2 },
      note: 'Cells over the cap show "+N more", which opens a day popover on mount.',
    },
    {
      label: 'week view',
      props: { defaultDate: DATE, defaultView: 'week', events: EVENTS },
    },
    {
      label: 'day view',
      props: { defaultDate: DATE, defaultView: 'day', events: EVENTS },
    },
    {
      label: 'empty (no events)',
      props: { defaultDate: DATE, defaultView: 'month', events: [] },
    },
    {
      label: 'event tones',
      props: { defaultDate: DATE, defaultView: 'week', events: TONE_EVENTS },
    },
    {
      label: 'custom renderEvent',
      props: {
        defaultDate: DATE,
        defaultView: 'month',
        events: EVENTS,
        renderEvent: (e: { title: string }) => `• ${e.title}`,
      },
      note: 'renderEvent overrides the chip body; time affix + a11y still apply.',
    },
    {
      label: 'weekStartsOn = 1 (Monday)',
      props: { defaultDate: DATE, defaultView: 'month', events: EVENTS, weekStartsOn: 1 },
    },
  ],
  enums: { tone: TONES },
  props: [
    { name: 'events', type: 'CalendarEvent[]', default: '[]', description: 'CalendarEvent = { id; title; start; end (ISO datetime); allDay?; tone?; href? }.' },
    { name: 'view / defaultView', type: "'month' | 'week' | 'day'", default: "— / 'month'", description: 'Active view (§1.5).' },
    { name: 'date / defaultDate', type: 'string (ISO)', default: '— / today', description: 'Focused date; the period the view centres on (§1.5).' },
    { name: 'onViewChange', type: '(view) => void', description: 'View switched via the toolbar Tabs.' },
    { name: 'onDateChange', type: '(date: ISO) => void', description: 'Period navigated (prev/next/today) or focus crossed a month.' },
    { name: 'onEventClick', type: '(event) => void', description: 'An event chip / block was activated.' },
    { name: 'onSlotClick', type: '({ date, time? }) => void', description: 'An empty day / slot was activated.' },
    { name: 'renderEvent', type: '(event) => ReactNode', description: 'Custom chip body; falls back to the event title.' },
    { name: 'weekStartsOn', type: 'number (0–6)', default: '0', description: 'First weekday column (0 = Sunday).' },
    { name: 'maxPerCell', type: 'number', default: '3', description: 'Chips per month cell before "+N more".' },
    { name: 'labels', type: 'Partial<CalendarLabels>', description: 'i18n: today / prev / next / more / month / week / day / grid / dayEvents / closePopover.' },
  ],
  events: [
    { name: 'onViewChange', payload: "'month' | 'week' | 'day'", description: 'View switched.' },
    { name: 'onDateChange', payload: 'string (ISO)', description: 'Focused date changed.' },
    { name: 'onEventClick', payload: 'CalendarEvent', description: 'Event activated.' },
    { name: 'onSlotClick', payload: '{ date: ISO; time?: string }', description: 'Empty slot activated.' },
  ],
  keyboard: [
    { keys: '← / →', action: 'Month grid: focus previous / next day' },
    { keys: '↑ / ↓', action: 'Month grid: focus same weekday in the previous / next week' },
    { keys: 'Home / End', action: 'Month grid: first / last day of the focused week' },
    { keys: 'Enter / Space', action: 'On a focused day: fire onSlotClick' },
    { keys: 'Tab', action: 'Single grid tab stop → into event chips within cells' },
    { keys: 'Esc', action: 'Close the "+N more" day popover' },
  ],
  aria: [
    { attr: 'role', value: 'grid', note: 'On the month / time grid; single tab stop with roving cell focus.' },
    { attr: 'role', value: 'gridcell', note: 'Day cells; event chips are buttons/links within them.' },
    { attr: 'aria-current', value: 'date', note: "On today's cell." },
    { attr: 'aria-live', value: 'polite', note: 'On the toolbar title; announces the navigated period.' },
    { attr: 'role', value: 'dialog', note: 'The "+N more" day popover (portalled on mount, focus-trapped).' },
  ],
  contract: { doc: '04-component-bible.md', heading: 'FxCalendar' },
};
