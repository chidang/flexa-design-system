/**
 * Checkbox showcase spec. Only SHARED unions appear in `enums`.
 */
import type { ShowcaseSpec } from '../showcase-types';
import { SIZES } from '../enums';
import { FxCheckbox } from './checkbox';

export const checkboxShowcase: ShowcaseSpec = {
  name: 'Checkbox',
  slug: 'checkbox',
  category: 'forms',
  slice: 'U1',
  status: 'ready',
  interactive: true,
  tagline: 'A boolean fact that takes effect on submit — or one item in a list.',
  component: FxCheckbox,
  variants: [
    { label: 'unchecked', props: { label: 'Send me product updates' } },
    { label: 'checked', props: { label: 'Send me product updates', defaultChecked: true } },
    { label: 'indeterminate', props: { label: 'Select all', indeterminate: true } },
    { label: 'with description', props: { label: 'Email notifications', description: 'Weekly digest of account activity.' } },
    ...SIZES.map((size) => ({ label: `size ${size}`, props: { size, label: `Size ${size}`, defaultChecked: true } })),
    { label: 'invalid', props: { label: 'Accept terms', invalid: true } },
    { label: 'disabled', props: { label: 'Unavailable', disabled: true } },
    { label: 'bare (aria-label)', props: { 'aria-label': 'Select row' } },
  ],
  enums: { size: SIZES },
  props: [
    { name: 'checked / defaultChecked', type: 'boolean', default: '— / false', description: 'Controlled / uncontrolled (§1.5).' },
    { name: 'indeterminate', type: 'boolean', default: 'false', description: 'Visual + aria-checked="mixed"; programmatic only.' },
    { name: 'label', type: 'string | Node', description: 'Clicking toggles. Bare checkbox requires aria-label.' },
    { name: 'description', type: 'string', description: 'Secondary line, wired to aria-describedby.' },
    { name: 'size', type: "'sm' | 'md' | 'lg'", default: "'md'", description: 'Box size (16 / 20 / 24px).' },
    { name: 'invalid', type: 'boolean', default: 'false', description: 'Sets .is-invalid + aria-invalid.' },
  ],
  events: [{ name: 'onChange', payload: '(checked, { source })', description: 'Fires on toggle.' }],
  keyboard: [{ keys: 'Space', action: 'Toggle the checkbox' }],
  aria: [
    { attr: 'aria-checked', value: 'true | false | mixed', note: '"mixed" when indeterminate.' },
    { attr: 'aria-describedby', value: 'id', note: 'When description is set.' },
  ],
  contract: { doc: '04-component-bible.md', heading: 'FxCheckbox' },
};
