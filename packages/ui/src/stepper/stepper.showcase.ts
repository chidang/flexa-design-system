/**
 * Stepper showcase spec — compact quantity control.
 * Only the SHARED `size` union comes from enums.
 */
import type { ShowcaseSpec } from '../showcase-types';
import { SIZES } from '../enums';
import { FxStepper } from './stepper';

export const stepperShowcase: ShowcaseSpec = {
  name: 'Stepper',
  slug: 'stepper',
  category: 'forms',
  slice: 'U5',
  status: 'ready',
  interactive: true,
  tagline: 'A compact − / value / + control for small quantities.',
  component: FxStepper,
  variants: [
    { label: 'default', props: { ariaLabel: 'Quantity', defaultValue: 1, min: 0 } },
    { label: 'bounded', props: { ariaLabel: 'Guests', defaultValue: 2, min: 1, max: 8 } },
    { label: 'at min', props: { ariaLabel: 'Quantity', defaultValue: 0, min: 0, max: 10 } },
    { label: 'at max', props: { ariaLabel: 'Seats', defaultValue: 8, min: 0, max: 8 } },
    { label: 'step 2', props: { ariaLabel: 'Pairs', defaultValue: 4, step: 2, min: 0 } },
    { label: 'editable', props: { ariaLabel: 'Quantity', defaultValue: 3, min: 0, max: 99, editable: true } },
    ...SIZES.map((size) => ({
      label: `size ${size}`,
      props: { size, ariaLabel: `Size ${size}`, defaultValue: 2, min: 0 },
    })),
    { label: 'disabled', props: { ariaLabel: 'Disabled', defaultValue: 1, min: 0, disabled: true } },
  ],
  enums: { size: SIZES },
  props: [
    { name: 'value / defaultValue', type: 'number', default: '— / min', description: 'Controlled / uncontrolled value (§1.5).' },
    { name: 'min / max', type: 'number', default: '0 / —', description: 'Bounds; the respective button disables at its bound.' },
    { name: 'step', type: 'number', default: '1', description: 'Increment for buttons and Arrow keys.' },
    { name: 'editable', type: 'boolean', default: 'false', description: 'Promote the value to a typeable input.' },
    { name: 'size', type: "'sm' | 'md' | 'lg'", default: "'md'", description: 'Control height (32 / 40 / 48px).' },
    { name: 'ariaLabel', type: 'string', description: 'Accessible name for the spinbutton.' },
    { name: 'incrementLabel / decrementLabel', type: 'string', default: "'Increase' / 'Decrease'", description: 'Button labels (i18n).' },
  ],
  events: [
    { name: 'onChange', payload: '(value: number, { source })', description: "source: 'step' | 'input'." },
  ],
  keyboard: [
    { keys: 'ArrowUp / ArrowDown', action: '±step (focus the value)' },
    { keys: 'Home / End', action: 'min / max' },
  ],
  aria: [
    { attr: 'role', value: 'spinbutton', note: 'On the value.' },
    { attr: 'aria-valuemin / max / now', value: 'number', note: 'Reflect bounds + current.' },
    { attr: 'aria-disabled', value: 'true', note: 'On a button at its bound (still focusable).' },
  ],
  contract: { doc: '04-component-bible.md', heading: 'FxStepper' },
};
