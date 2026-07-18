/**
 * Input showcase spec — consumed by both the kitchen-sink and fds-docs.
 * Only SHARED unions (from `enums.ts`) appear in `enums`; the component-specific
 * `type` union is documented as a prop-table string, never re-typed here.
 */
import type { ShowcaseSpec } from '../showcase-types';
import { SIZES } from '../enums';
import { FxInput } from './input';

export const inputShowcase: ShowcaseSpec = {
  name: 'Input',
  slug: 'input',
  category: 'forms',
  slice: 'U1',
  status: 'ready',
  interactive: true,
  tagline: 'Single-line text entry — the base every text-like field inherits.',
  component: FxInput,
  variants: [
    { label: 'default', props: { 'aria-label': 'Full name', placeholder: 'e.g. Jane Doe' } },
    { label: 'with value', props: { 'aria-label': 'Full name', defaultValue: 'Jane Doe' } },
    ...SIZES.map((size) => ({
      label: `size ${size}`,
      props: { size, 'aria-label': `Size ${size}`, placeholder: 'Type here' },
    })),
    { label: 'prefix', props: { 'aria-label': 'Search', prefix: 'search', placeholder: 'Search' } },
    { label: 'suffix', props: { 'aria-label': 'Weight', suffix: 'kg', defaultValue: '72' } },
    {
      label: 'clearable',
      props: { 'aria-label': 'Filter', clearable: true, defaultValue: 'draft' },
    },
    { label: 'invalid', props: { 'aria-label': 'Email', invalid: true, defaultValue: 'not-an-email' } },
    { label: 'readonly', props: { 'aria-label': 'Slug', readOnly: true, defaultValue: 'my-post' } },
    { label: 'disabled', props: { 'aria-label': 'Locked', disabled: true, defaultValue: 'Locked' } },
  ],
  enums: { size: SIZES },
  props: [
    { name: 'value / defaultValue', type: 'string', default: "— / ''", description: 'Controlled / uncontrolled value (§1.5).' },
    { name: 'type', type: "'text' | 'search'", default: "'text'", description: 'Native input type; subclasses fix their own.' },
    { name: 'size', type: "'sm' | 'md' | 'lg'", default: "'md'", description: 'Control height (32 / 40 / 48px).' },
    { name: 'invalid', type: 'boolean', default: 'false', description: 'Sets .is-invalid + aria-invalid; message is FxValidationMessage.' },
    { name: 'readOnly', type: 'boolean', default: 'false', description: 'Focusable, value not editable.' },
    { name: 'clearable', type: 'boolean', default: 'false', description: "Clear affordance; fires onChange('', {source:'clear'})." },
    { name: 'prefix / suffix', type: 'string | IconName', description: 'Static affixes, aria-hidden.' },
    { name: 'clearLabel', type: 'string', default: "'Clear'", description: 'Accessible label for the clear button (i18n).' },
  ],
  events: [
    { name: 'onChange', payload: '(value, { source })', description: 'Per keystroke and on clear.' },
    { name: 'onEnter', payload: 'string', description: 'Enter-key convenience.' },
    { name: 'onFocus / onBlur', payload: 'FocusEvent', description: 'Native focus events.' },
  ],
  keyboard: [
    { keys: 'Esc', action: 'Clears when clearable (else propagates)' },
    { keys: 'Enter', action: 'Fires onEnter with the current value' },
  ],
  aria: [
    { attr: 'aria-invalid', value: 'true', note: 'While invalid.' },
    { attr: 'aria-describedby', value: 'id', note: 'Auto-wired by FxFieldGroup to help/error ids.' },
  ],
  contract: { doc: '04-component-bible.md', heading: 'FxInput' },
};
