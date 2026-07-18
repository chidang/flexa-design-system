/**
 * Number Input showcase spec — numeric field with stepper group + spinbutton.
 * Only the SHARED `size` union comes from enums; component-specific unions
 * (none here) would live as prop-table strings.
 */
import type { ShowcaseSpec } from '../showcase-types';
import { SIZES } from '../enums';
import { FxNumberInput } from './number-input';

export const numberInputShowcase: ShowcaseSpec = {
  name: 'Number Input',
  slug: 'number-input',
  category: 'forms',
  slice: 'U5',
  status: 'ready',
  interactive: true,
  tagline: 'Numeric entry with a stepper group and spinbutton semantics.',
  component: FxNumberInput,
  variants: [
    { label: 'default', props: { 'aria-label': 'Quantity', defaultValue: 1 } },
    { label: 'empty', props: { 'aria-label': 'Amount', defaultValue: null } },
    { label: 'bounded', props: { 'aria-label': 'Rating', defaultValue: 3, min: 0, max: 5 } },
    { label: 'step 5', props: { 'aria-label': 'Interval', defaultValue: 10, step: 5, min: 0 } },
    { label: 'precision 2', props: { 'aria-label': 'Weight', defaultValue: 1.5, precision: 2 } },
    { label: 'prefix', props: { 'aria-label': 'Price', defaultValue: 20, prefix: '$' } },
    { label: 'no steppers', props: { 'aria-label': 'Count', defaultValue: 42, showSteppers: false } },
    ...SIZES.map((size) => ({
      label: `size ${size}`,
      props: { size, 'aria-label': `Size ${size}`, defaultValue: 8, min: 0 },
    })),
    { label: 'invalid', props: { 'aria-label': 'Age', invalid: true, defaultValue: -1, min: 0 } },
    { label: 'readonly', props: { 'aria-label': 'Locked', readOnly: true, defaultValue: 7 } },
    { label: 'disabled', props: { 'aria-label': 'Disabled', disabled: true, defaultValue: 3 } },
  ],
  enums: { size: SIZES },
  props: [
    { name: 'value / defaultValue', type: 'number | null', default: '— / null', description: 'Controlled / uncontrolled; null = empty (§1.5).' },
    { name: 'min / max', type: 'number', description: 'Clamped on commit (blur / Enter / step), not per keystroke.' },
    { name: 'step', type: 'number', default: '1', description: 'Increment for steppers and Arrow keys.' },
    { name: 'precision', type: 'number', description: 'Decimal places; formats display on blur.' },
    { name: 'showSteppers', type: 'boolean', default: 'true', description: 'Render the up/down stepper group.' },
    { name: 'size', type: "'sm' | 'md' | 'lg'", default: "'md'", description: 'Control height (32 / 40 / 48px).' },
    { name: 'incrementLabel / decrementLabel', type: 'string', default: "'Increase' / 'Decrease'", description: 'Stepper button labels (i18n).' },
    { name: 'prefix', type: 'string', description: 'Static leading affix, aria-hidden.' },
  ],
  events: [
    { name: 'onChange', payload: '(value: number | null, { source })', description: "source: 'input' | 'step' | 'clear'." },
    { name: 'onFocus / onBlur', payload: 'FocusEvent', description: 'Commit + clamp fires on blur.' },
  ],
  keyboard: [
    { keys: 'ArrowUp / ArrowDown', action: '±step' },
    { keys: 'PageUp / PageDown', action: '±step × 10' },
    { keys: 'Home / End', action: 'min / max (when bounded)' },
    { keys: 'Enter', action: 'Commit + clamp the typed value' },
  ],
  aria: [
    { attr: 'role', value: 'spinbutton', note: 'On the native input.' },
    { attr: 'aria-valuemin / max / now', value: 'number', note: 'When bounded / steppers shown.' },
    { attr: 'aria-invalid', value: 'true', note: 'While invalid.' },
  ],
  contract: { doc: '04-component-bible.md', heading: 'FxNumberInput' },
};
