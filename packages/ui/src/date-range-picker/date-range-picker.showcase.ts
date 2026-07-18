/**
 * DateRangePicker showcase spec. Only the shared `size` union comes from
 * enums.ts; months / presets are component-specific and documented as prop strings.
 */
import type { ShowcaseSpec } from '../showcase-types';
import { SIZES } from '../enums';
import { FxDateRangePicker } from './date-range-picker';

export const dateRangePickerShowcase: ShowcaseSpec = {
  name: 'DateRangePicker',
  slug: 'date-range-picker',
  category: 'forms',
  slice: 'U5',
  status: 'ready',
  interactive: true,
  tagline: 'Pick a start and end date across one or two months, with quick presets.',
  component: FxDateRangePicker,
  variants: [
    { label: 'default', props: { 'aria-label': 'Date range' } },
    { label: 'with value', props: { 'aria-label': 'Date range', defaultValue: { start: '2026-07-05', end: '2026-07-12' } } },
    { label: 'single month', props: { 'aria-label': 'Stay dates', months: 1, defaultValue: { start: '2026-07-05', end: '2026-07-09' } } },
    {
      label: 'with presets',
      props: {
        'aria-label': 'Report range',
        presets: [
          { label: 'Last 7 days', range: { start: '2026-07-05', end: '2026-07-11' } },
          { label: 'Last 30 days', range: { start: '2026-06-12', end: '2026-07-11' } },
        ],
        defaultValue: { start: '2026-07-05', end: '2026-07-11' },
      },
    },
    { label: 'min / max days', props: { 'aria-label': 'Booking', minDays: 2, maxDays: 14, defaultValue: { start: '2026-07-05', end: '2026-07-10' } } },
    ...SIZES.map((size) => ({
      label: `size ${size}`,
      props: { size, 'aria-label': `Size ${size}`, defaultValue: { start: '2026-07-05', end: '2026-07-12' } },
    })),
    { label: 'invalid', props: { 'aria-label': 'Range', invalid: true, defaultValue: { start: '2026-07-05', end: '2026-07-12' } } },
    { label: 'disabled', props: { 'aria-label': 'Locked', disabled: true, defaultValue: { start: '2026-07-05', end: '2026-07-12' } } },
  ],
  enums: { size: SIZES },
  props: [
    { name: 'value / defaultValue', type: 'DateRange', default: '{ start: null, end: null }', description: 'DateRange = { start: string | null; end: string | null } (ISO).' },
    { name: 'presets', type: '{ label: string; range: DateRange }[]', description: 'Quick-select ranges rendered beside the calendar.' },
    { name: 'months', type: '1 | 2', default: '2', description: 'Side-by-side calendars.' },
    { name: 'minDays / maxDays', type: 'number', description: 'Range length constraints; violating end-picks disabled.' },
    { name: 'weekStartsOn', type: '0–6', default: '0', description: 'Grid layout first column.' },
    { name: 'size', type: "'sm' | 'md' | 'lg'", default: "'md'", description: 'Trigger height (32 / 40 / 48px).' },
    { name: 'labels', type: '{ …DatePickerLabels; startSelected }', default: 'English set', description: 'i18n label set incl. the live-region announcement.' },
  ],
  events: [
    { name: 'onChange', payload: '(range, meta)', description: 'Fires only on a complete pair or clear/preset.' },
    { name: 'onPartialChange', payload: 'range', description: 'Fires on the first (start-only) pick.' },
    { name: 'onOpenChange', payload: 'boolean', description: 'Popover open/close.' },
  ],
  keyboard: [
    { keys: 'Arrow', action: '±1 day / row (grid)' },
    { keys: 'PageUp / PageDown', action: '±1 month' },
    { keys: 'Shift+PageUp / PageDown', action: '±1 year' },
    { keys: 'Enter / Space', action: 'Pick start, then end' },
    { keys: 'Esc', action: 'Close, restore focus to trigger' },
  ],
  aria: [
    { attr: 'aria-haspopup', value: 'dialog', note: 'On the range trigger button.' },
    { attr: 'role', value: 'grid', note: 'Each calendar; day cells role="gridcell".' },
    { attr: 'role', value: 'status', note: 'Polite live region announces "start selected".' },
  ],
  contract: { doc: '04-component-bible.md', heading: 'FxDateRangePicker' },
};
