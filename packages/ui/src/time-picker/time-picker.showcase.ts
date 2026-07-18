/**
 * TimePicker showcase spec. Only the shared `size` union comes from enums.ts;
 * format / allowInput are component-specific and documented as prop strings.
 */
import type { ShowcaseSpec } from '../showcase-types';
import { SIZES } from '../enums';
import { FxTimePicker } from './time-picker';

export const timePickerShowcase: ShowcaseSpec = {
  name: 'TimePicker',
  slug: 'time-picker',
  category: 'forms',
  slice: 'U5',
  status: 'ready',
  interactive: true,
  tagline: "Pick a time from an interval listbox — value is a 24h 'HH:mm' string.",
  component: FxTimePicker,
  variants: [
    { label: 'default', props: { 'aria-label': 'Start time' } },
    { label: 'with value', props: { 'aria-label': 'Start time', defaultValue: '14:30' } },
    { label: '12-hour format', props: { 'aria-label': 'Meeting time', format: '12', defaultValue: '14:30' } },
    { label: 'step 15', props: { 'aria-label': 'Slot', step: 15, defaultValue: '09:15' } },
    { label: 'min / max', props: { 'aria-label': 'Office hours', min: '09:00', max: '17:00', step: 60, defaultValue: '12:00' } },
    { label: 'no typed input', props: { 'aria-label': 'Alarm', allowInput: false, defaultValue: '07:00' } },
    ...SIZES.map((size) => ({
      label: `size ${size}`,
      props: { size, 'aria-label': `Size ${size}`, defaultValue: '14:30' },
    })),
    { label: 'invalid', props: { 'aria-label': 'Time', invalid: true, defaultValue: '14:30' } },
    { label: 'disabled', props: { 'aria-label': 'Locked', disabled: true, defaultValue: '14:30' } },
  ],
  enums: { size: SIZES },
  props: [
    { name: 'value / defaultValue', type: "string | null ('HH:mm')", default: '— / null', description: '24h ISO time, e.g. \'14:30\'.' },
    { name: 'step', type: 'number (minutes)', default: '30', description: 'Interval between listbox options.' },
    { name: 'min / max', type: "string ('HH:mm')", default: "'00:00' / '23:59'", description: 'Option bounds.' },
    { name: 'format', type: "'12' | '24'", default: "'24'", description: "Display format ('2:30 PM' vs '14:30')." },
    { name: 'allowInput', type: 'boolean', default: 'true', description: 'Typed entry parses "9am"/"14:30" on blur/Enter.' },
    { name: 'open / defaultOpen', type: 'boolean', description: 'Controlled / uncontrolled popover state (§1.5).' },
    { name: 'size', type: "'sm' | 'md' | 'lg'", default: "'md'", description: 'Field height (32 / 40 / 48px).' },
    { name: 'labels', type: '{ openList }', default: 'English set', description: 'i18n label set.' },
  ],
  events: [
    { name: 'onChange', payload: '(value, { source })', description: 'On listbox pick or typed commit.' },
    { name: 'onOpenChange', payload: 'boolean', description: 'Popover open/close.' },
  ],
  keyboard: [
    { keys: 'ArrowDown / ArrowUp', action: 'Open / move active option (wrap)' },
    { keys: 'Home / End', action: 'First / last option' },
    { keys: 'Enter', action: 'Select active option or commit typed entry' },
    { keys: 'Esc', action: 'Close the listbox' },
  ],
  aria: [
    { attr: 'role', value: 'combobox', note: 'On the input; popover role="listbox".' },
    { attr: 'aria-activedescendant', value: 'option id', note: 'Focus stays in input while navigating.' },
    { attr: 'aria-expanded', value: 'true | false', note: 'Reflects popover state.' },
  ],
  contract: { doc: '04-component-bible.md', heading: 'FxTimePicker' },
};
