/**
 * Phone Input showcase spec. Only SHARED unions (from `enums.ts`) appear in
 * `enums`; component-specific shapes are documented in `props` as type strings.
 */
import type { ShowcaseSpec } from '../showcase-types';
import { SIZES } from '../enums';
import { FxPhoneInput } from './phone-input';

const COUNTRIES = [
  { code: 'US', dial: '+1', label: 'United States' },
  { code: 'GB', dial: '+44', label: 'United Kingdom' },
  { code: 'VN', dial: '+84', label: 'Vietnam' },
  { code: 'DE', dial: '+49', label: 'Germany' },
];

export const phoneInputShowcase: ShowcaseSpec = {
  name: 'Phone Input',
  slug: 'phone-input',
  category: 'forms',
  slice: 'U5',
  status: 'ready',
  interactive: true,
  tagline: 'Telephone entry — a searchable country code affix beside the number.',
  component: FxPhoneInput,
  variants: [
    { label: 'default', props: { 'aria-label': 'Phone', countries: COUNTRIES } },
    { label: 'with value', props: { 'aria-label': 'Phone', countries: COUNTRIES, defaultValue: { country: 'GB', number: '2079460000' } } },
    { label: 'default country', props: { 'aria-label': 'Phone', countries: COUNTRIES, defaultCountry: 'VN' } },
    ...SIZES.map((size) => ({
      label: `size ${size}`,
      props: { size, 'aria-label': `Size ${size}`, countries: COUNTRIES },
    })),
    { label: 'invalid', props: { 'aria-label': 'Phone', countries: COUNTRIES, invalid: true, defaultValue: { country: 'US', number: '123' } } },
    { label: 'readonly', props: { 'aria-label': 'Phone', countries: COUNTRIES, readOnly: true, defaultValue: { country: 'US', number: '+15551234567' } } },
    { label: 'disabled', props: { 'aria-label': 'Phone', countries: COUNTRIES, disabled: true, defaultValue: { country: 'US', number: '5551234567' } } },
  ],
  enums: { size: SIZES },
  props: [
    { name: 'countries', type: 'CountryOption[]', required: true, description: "CountryOption = { code: 'US'; dial: '+1'; label }." },
    { name: 'value / defaultValue', type: '{ country: string; number: string }', default: '—', description: 'Composite phone value (§1.5).' },
    { name: 'defaultCountry', type: 'string', description: 'Country selected when none is set.' },
    { name: 'formatOnBlur', type: 'boolean', default: 'true', description: 'Normalize the number toward E.164 on blur.' },
    { name: 'placeholder', type: 'string', default: "'Phone number'", description: 'Number-field placeholder (i18n).' },
    { name: 'countryLabel', type: 'string', default: "'Country code'", description: 'Accessible label for the country select (i18n).' },
    { name: 'invalid / disabled / readOnly / size', type: '—', description: 'As FxInput.' },
  ],
  events: [
    { name: 'onChange', payload: '({ country, number }, { source })', description: 'Number edit, country change, or blur format.' },
    { name: 'onCountryChange', payload: 'string', description: 'Selected country code.' },
  ],
  keyboard: [
    { keys: 'Country select', action: 'FxSelect combobox (typeahead searchable)' },
    { keys: 'Tab', action: 'Country select → number field' },
  ],
  aria: [
    { attr: 'aria-label', value: "'Country code'", note: 'Country select is individually labelled (countryLabel).' },
    { attr: 'inputMode', value: 'tel' },
    { attr: 'autoComplete', value: 'tel' },
  ],
  contract: { doc: '04-component-bible.md', heading: 'FxPhoneInput' },
};
