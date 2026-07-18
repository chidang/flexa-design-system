/**
 * Textarea showcase spec. Extends FxInput; documents deltas. Only SHARED unions
 * appear in `enums`.
 */
import type { ShowcaseSpec } from '../showcase-types';
import { SIZES } from '../enums';
import { FxTextarea } from './textarea';

export const textareaShowcase: ShowcaseSpec = {
  name: 'Textarea',
  slug: 'textarea',
  category: 'forms',
  slice: 'U1',
  status: 'ready',
  interactive: true,
  tagline: 'Multi-line free text — descriptions, messages, notes.',
  component: FxTextarea,
  variants: [
    { label: 'default', props: { 'aria-label': 'Description', placeholder: 'Add a description…' } },
    { label: 'with value', props: { 'aria-label': 'Notes', defaultValue: 'A short note that spans\na couple of lines.' } },
    ...SIZES.map((size) => ({ label: `size ${size}`, props: { size, 'aria-label': `Size ${size}` } })),
    { label: 'fixed rows (5)', props: { 'aria-label': 'Bio', rows: 5, autoResize: false } },
    { label: 'invalid', props: { 'aria-label': 'Message', invalid: true, defaultValue: '' } },
    { label: 'readonly', props: { 'aria-label': 'Log', readOnly: true, defaultValue: 'Read-only content.' } },
    { label: 'disabled', props: { 'aria-label': 'Locked', disabled: true, defaultValue: 'Locked' } },
  ],
  enums: { size: SIZES },
  props: [
    { name: 'value / defaultValue', type: 'string', default: "— / ''", description: 'Controlled / uncontrolled value (§1.5).' },
    { name: 'rows', type: 'number', default: '3', description: 'Initial rows.' },
    { name: 'autoResize', type: 'boolean', default: 'true', description: 'Grows with content between rows and maxRows.' },
    { name: 'maxRows', type: 'number', default: '8', description: 'Upper bound for auto-resize.' },
    { name: 'resize', type: "'none' | 'vertical'", default: "'vertical'", description: 'Manual resize handle (ignored when autoResize).' },
    { name: 'invalid', type: 'boolean', default: 'false', description: 'Sets .is-invalid + aria-invalid.' },
    { name: 'size', type: "'sm' | 'md' | 'lg'", default: "'md'", description: 'Font/padding scale.' },
  ],
  events: [
    { name: 'onChange', payload: '(value, { source })', description: 'Per keystroke.' },
    { name: 'onFocus / onBlur', payload: 'FocusEvent', description: 'Native focus events.' },
  ],
  keyboard: [{ keys: 'Enter', action: 'Inserts a newline (never submits)' }],
  aria: [
    { attr: 'aria-invalid', value: 'true', note: 'While invalid.' },
    { attr: 'aria-describedby', value: 'id', note: 'Auto-wired by FxFieldGroup.' },
  ],
  contract: { doc: '04-component-bible.md', heading: 'FxTextarea' },
};
