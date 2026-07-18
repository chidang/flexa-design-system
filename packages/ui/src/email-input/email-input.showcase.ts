/**
 * Email Input showcase spec — email field with optional domain suggestions.
 * Only the SHARED `size` union comes from enums.
 */
import type { ShowcaseSpec } from '../showcase-types';
import { SIZES } from '../enums';
import { FxEmailInput } from './email-input';

const COMMON_TYPOS = {
  'gmial.com': 'gmail.com',
  'gmai.com': 'gmail.com',
  'hotmial.com': 'hotmail.com',
  'yahooo.com': 'yahoo.com',
};

export const emailInputShowcase: ShowcaseSpec = {
  name: 'Email Input',
  slug: 'email-input',
  category: 'forms',
  slice: 'U5',
  status: 'ready',
  interactive: true,
  tagline: 'Single-address email entry with optional "did you mean …?" suggestions.',
  component: FxEmailInput,
  variants: [
    { label: 'default', props: { 'aria-label': 'Email', placeholder: 'you@example.com' } },
    { label: 'with value', props: { 'aria-label': 'Email', defaultValue: 'jane@example.com' } },
    { label: 'suggestion', props: { 'aria-label': 'Email', defaultValue: 'jane@gmial.com', domainSuggestions: COMMON_TYPOS } },
    { label: 'clearable', props: { 'aria-label': 'Email', clearable: true, defaultValue: 'draft@example.com' } },
    ...SIZES.map((size) => ({
      label: `size ${size}`,
      props: { size, 'aria-label': `Size ${size}`, defaultValue: 'user@example.com' },
    })),
    { label: 'invalid', props: { 'aria-label': 'Email', invalid: true, defaultValue: 'not-an-email' } },
    { label: 'readonly', props: { 'aria-label': 'Email', readOnly: true, defaultValue: 'owner@example.com' } },
    { label: 'disabled', props: { 'aria-label': 'Email', disabled: true, defaultValue: 'locked@example.com' } },
  ],
  enums: { size: SIZES },
  props: [
    { name: 'value / defaultValue', type: 'string', default: "— / ''", description: 'Controlled / uncontrolled value (§1.5).' },
    { name: 'size', type: "'sm' | 'md' | 'lg'", default: "'md'", description: 'Control height (32 / 40 / 48px).' },
    { name: 'clearable', type: 'boolean', default: 'false', description: "Clear affordance; fires onChange('', {source:'clear'})." },
    { name: 'domainSuggestions', type: 'Record<string, string>', description: 'Typo-domain → correction; renders a dismissible inline suggestion.' },
    { name: 'suggestionLabel', type: 'string', default: "'Did you mean'", description: 'Prefix text for the suggestion (i18n).' },
    { name: 'dismissSuggestionLabel', type: 'string', default: "'Dismiss suggestion'", description: 'Label for the dismiss button (i18n).' },
    { name: 'invalid', type: 'boolean', default: 'false', description: 'Sets aria-invalid.' },
  ],
  events: [
    { name: 'onChange', payload: '(value, { source })', description: "source: 'input' | 'clear' | 'option' (suggestion accepted)." },
    { name: 'onEnter', payload: 'string', description: 'Enter-key convenience.' },
  ],
  keyboard: [
    { keys: 'Esc', action: 'Clears when clearable' },
    { keys: 'Enter', action: 'Fires onEnter with the current value' },
  ],
  aria: [
    { attr: 'aria-invalid', value: 'true', note: 'While invalid.' },
    { attr: 'aria-describedby', value: 'id', note: 'Points to the suggestion while shown.' },
  ],
  contract: { doc: '04-component-bible.md', heading: 'FxEmailInput' },
};
