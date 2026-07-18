/**
 * DatePicker showcase spec. Only the shared `size` union comes from enums.ts;
 * allowInput / weekStartsOn are component-specific and documented as prop strings.
 */
import type { ShowcaseSpec } from '../showcase-types';
import { SIZES } from '../enums';
import { FxDatePicker } from './date-picker';

export const datePickerShowcase: ShowcaseSpec = {
  name: 'DatePicker',
  slug: 'date-picker',
  category: 'forms',
  slice: 'U5',
  status: 'ready',
  interactive: true,
  tagline: 'Text field plus a calendar popover — dates cross the API as ISO strings.',
  component: FxDatePicker,
  variants: [
    { label: 'default', props: { 'aria-label': 'Start date' } },
    { label: 'with value', props: { 'aria-label': 'Start date', defaultValue: '2026-07-11' } },
    { label: 'min / max', props: { 'aria-label': 'Delivery date', min: '2026-07-01', max: '2026-07-31', defaultValue: '2026-07-15' } },
    { label: 'no typed input', props: { 'aria-label': 'Appointment', allowInput: false, defaultValue: '2026-07-20' } },
    { label: 'week starts Monday', props: { 'aria-label': 'Booking', weekStartsOn: 1, defaultValue: '2026-07-11' } },
    ...SIZES.map((size) => ({
      label: `size ${size}`,
      props: { size, 'aria-label': `Size ${size}`, defaultValue: '2026-07-11' },
    })),
    { label: 'invalid', props: { 'aria-label': 'Due date', invalid: true, defaultValue: '2026-07-11' } },
    { label: 'disabled', props: { 'aria-label': 'Locked', disabled: true, defaultValue: '2026-07-11' } },
  ],
  enums: { size: SIZES },
  props: [
    { name: 'value / defaultValue', type: 'string | null (ISO date)', default: '— / null', description: "ISO-8601 date-only (e.g. '2026-07-11'), never a Date object." },
    { name: 'min / max', type: 'string (ISO date)', description: 'Out-of-range days are aria-disabled.' },
    { name: 'isDateDisabled', type: '(iso: string) => boolean', description: 'Business rules (weekends, blackout).' },
    { name: 'weekStartsOn', type: '0–6', default: '0', description: 'Grid layout first column.' },
    { name: 'open / defaultOpen', type: 'boolean', description: 'Controlled / uncontrolled popover state (§1.5).' },
    { name: 'allowInput', type: 'boolean', default: 'true', description: 'Typed entry parsed on blur/Enter; unparseable → .is-invalid, value unchanged.' },
    { name: 'size', type: "'sm' | 'md' | 'lg'", default: "'md'", description: 'Field height (32 / 40 / 48px).' },
    { name: 'labels', type: '{ openCalendar; prevMonth; nextMonth; today; clear }', default: 'English set', description: 'i18n label set.' },
  ],
  events: [
    { name: 'onChange', payload: '(iso: string | null, meta)', description: 'On pick / typed commit / today / clear.' },
    { name: 'onOpenChange', payload: 'boolean', description: 'Popover open/close.' },
    { name: 'onMonthChange', payload: "isoMonth: '2026-07'", description: 'Visible month changed.' },
  ],
  keyboard: [
    { keys: 'Arrow', action: '±1 day / row (grid)' },
    { keys: 'Home / End', action: 'Week start / end' },
    { keys: 'PageUp / PageDown', action: '±1 month' },
    { keys: 'Shift+PageUp / PageDown', action: '±1 year' },
    { keys: 'Enter / Space', action: 'Select + close' },
    { keys: 'Esc', action: 'Close, restore focus to input' },
  ],
  aria: [
    { attr: 'aria-haspopup', value: 'dialog', note: 'On the calendar trigger button.' },
    { attr: 'role', value: 'grid', note: 'Calendar; day cells role="gridcell".' },
    { attr: 'aria-current', value: 'date', note: "Today's cell." },
  ],
  contract: { doc: '04-component-bible.md', heading: 'FxDatePicker' },
};
