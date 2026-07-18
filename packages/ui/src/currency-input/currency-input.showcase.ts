/**
 * Currency Input showcase spec — Money (integer minor units) entry.
 * Only the SHARED `size` union comes from enums; `currencyDisplay` is
 * component-specific and documented as prop-table strings only.
 */
import type { ShowcaseSpec } from '../showcase-types';
import { SIZES } from '../enums';
import { FxCurrencyInput } from './currency-input';

export const currencyInputShowcase: ShowcaseSpec = {
  name: 'Currency Input',
  slug: 'currency-input',
  category: 'forms',
  slice: 'U5',
  status: 'ready',
  interactive: true,
  tagline: 'Money entry that stores integer minor units and owns the display conversion.',
  component: FxCurrencyInput,
  variants: [
    { label: 'USD', props: { 'aria-label': 'Price (USD)', currency: 'USD', defaultValue: { amount: 1999, currency: 'USD' } } },
    { label: 'EUR', props: { 'aria-label': 'Price (EUR)', currency: 'EUR', defaultValue: { amount: 129900, currency: 'EUR' } } },
    { label: 'JPY (0 minor)', props: { 'aria-label': 'Price (JPY)', currency: 'JPY', defaultValue: { amount: 4980, currency: 'JPY' } } },
    { label: 'code display', props: { 'aria-label': 'Price', currency: 'GBP', currencyDisplay: 'code', defaultValue: { amount: 2500, currency: 'GBP' } } },
    { label: 'empty', props: { 'aria-label': 'Amount', currency: 'USD', defaultValue: null } },
    { label: 'allow negative', props: { 'aria-label': 'Adjustment', currency: 'USD', allowNegative: true, defaultValue: { amount: -500, currency: 'USD' } } },
    ...SIZES.map((size) => ({
      label: `size ${size}`,
      props: { size, 'aria-label': `Size ${size}`, currency: 'USD', defaultValue: { amount: 1000, currency: 'USD' } },
    })),
    { label: 'invalid', props: { 'aria-label': 'Total', currency: 'USD', invalid: true, defaultValue: { amount: 0, currency: 'USD' } } },
    { label: 'readonly', props: { 'aria-label': 'Locked', currency: 'USD', readOnly: true, defaultValue: { amount: 9999, currency: 'USD' } } },
    { label: 'disabled', props: { 'aria-label': 'Disabled', currency: 'USD', disabled: true, defaultValue: { amount: 500, currency: 'USD' } } },
  ],
  enums: { size: SIZES },
  props: [
    { name: 'value / defaultValue', type: 'Money | null', default: '— / null', description: 'Money = { amount (minor units), currency }; null = empty.' },
    { name: 'currency', type: 'string', required: true, description: 'ISO-4217; drives symbol affix + minor-unit precision (JPY = 0).' },
    { name: 'currencyDisplay', type: "'symbol' | 'code'", default: "'symbol'", description: 'Start affix rendering (aria-hidden).' },
    { name: 'locale', type: 'string', default: 'env', description: 'Grouping / decimal formatting on blur.' },
    { name: 'allowNegative', type: 'boolean', default: 'false', description: 'Permit values below zero.' },
    { name: 'size', type: "'sm' | 'md' | 'lg'", default: "'md'", description: 'Control height (32 / 40 / 48px).' },
  ],
  events: [
    { name: 'onChange', payload: '(value: Money | null, { source })', description: 'amount is always integer minor units.' },
    { name: 'onFocus / onBlur', payload: 'FocusEvent', description: 'Grouping + parse fires on blur.' },
  ],
  keyboard: [
    { keys: 'Enter', action: 'Commit + reformat the typed value' },
  ],
  aria: [
    { attr: 'aria-invalid', value: 'true', note: 'While invalid.' },
    { attr: 'aria-hidden', value: 'true', note: 'On the symbol affix (currency announced via field label).' },
  ],
  contract: { doc: '04-component-bible.md', heading: 'FxCurrencyInput' },
};
