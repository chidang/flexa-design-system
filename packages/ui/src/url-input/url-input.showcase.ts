/**
 * URL Input showcase spec — URL field with optional protocol prefix affix.
 * Only the SHARED `size` union comes from enums.
 */
import type { ShowcaseSpec } from '../showcase-types';
import { SIZES } from '../enums';
import { FxUrlInput } from './url-input';

export const urlInputShowcase: ShowcaseSpec = {
  name: 'URL Input',
  slug: 'url-input',
  category: 'forms',
  slice: 'U5',
  status: 'ready',
  interactive: true,
  tagline: 'URL entry with an optional protocol prefix folded into the stored value.',
  component: FxUrlInput,
  variants: [
    { label: 'default', props: { 'aria-label': 'Website', placeholder: 'https://example.com' } },
    { label: 'protocol prefix', props: { 'aria-label': 'Website', protocolPrefix: 'https://', defaultValue: 'flexa.dev' } },
    { label: 'with value', props: { 'aria-label': 'Website', defaultValue: 'https://acme.test/pricing' } },
    { label: 'clearable', props: { 'aria-label': 'Link', clearable: true, defaultValue: 'https://acme.test' } },
    ...SIZES.map((size) => ({
      label: `size ${size}`,
      props: { size, 'aria-label': `Size ${size}`, protocolPrefix: 'https://', defaultValue: 'example.com' },
    })),
    { label: 'invalid', props: { 'aria-label': 'Website', invalid: true, defaultValue: 'not a url' } },
    { label: 'readonly', props: { 'aria-label': 'Website', readOnly: true, defaultValue: 'https://acme.test' } },
    { label: 'disabled', props: { 'aria-label': 'Website', disabled: true, defaultValue: 'https://acme.test' } },
  ],
  enums: { size: SIZES },
  props: [
    { name: 'value / defaultValue', type: 'string', default: "— / ''", description: 'Controlled / uncontrolled value (§1.5).' },
    { name: 'protocolPrefix', type: 'string', description: 'Start-affix scheme (e.g. https://); prepended on commit, stored value includes it.' },
    { name: 'size', type: "'sm' | 'md' | 'lg'", default: "'md'", description: 'Control height (32 / 40 / 48px).' },
    { name: 'clearable', type: 'boolean', default: 'false', description: "Clear affordance; fires onChange('', {source:'clear'})." },
    { name: 'invalid', type: 'boolean', default: 'false', description: 'Sets aria-invalid (message is FieldGroup error).' },
    { name: 'clearLabel', type: 'string', default: "'Clear'", description: 'Accessible label for the clear button (i18n).' },
  ],
  events: [
    { name: 'onChange', payload: '(value, { source })', description: "source: 'input' | 'clear' | 'prefix' (scheme prepended)." },
    { name: 'onEnter', payload: 'string', description: 'Enter-key convenience (commits + normalizes first).' },
  ],
  keyboard: [
    { keys: 'Esc', action: 'Clears when clearable' },
    { keys: 'Enter', action: 'Commits (adds prefix / normalizes) then fires onEnter' },
  ],
  aria: [
    { attr: 'aria-invalid', value: 'true', note: 'While invalid.' },
    { attr: 'aria-hidden', value: 'true', note: 'On the protocol affix.' },
  ],
  contract: { doc: '04-component-bible.md', heading: 'FxUrlInput' },
};
