/**
 * Autocomplete showcase spec. Only SHARED unions (from `enums.ts`) appear in
 * `enums`; component-specific shapes are documented in `props` as type strings.
 */
import type { ShowcaseSpec } from '../showcase-types';
import { SIZES } from '../enums';
import { FxAutocomplete } from './autocomplete';

const FRUIT = [
  { value: 'apple', label: 'Apple' },
  { value: 'apricot', label: 'Apricot' },
  { value: 'banana', label: 'Banana' },
  { value: 'cherry', label: 'Cherry', description: 'Stone fruit' },
  { value: 'date', label: 'Date' },
];

export const autocompleteShowcase: ShowcaseSpec = {
  name: 'Autocomplete',
  slug: 'autocomplete',
  category: 'forms',
  slice: 'U5',
  status: 'ready',
  interactive: true,
  tagline: 'Editable combobox — type to filter a list, pick or free-type a value.',
  component: FxAutocomplete,
  variants: [
    { label: 'default', props: { 'aria-label': 'Fruit', options: FRUIT } },
    { label: 'open', props: { 'aria-label': 'Fruit', options: FRUIT, defaultOpen: true } },
    { label: 'with value', props: { 'aria-label': 'Fruit', options: FRUIT, defaultValue: 'apple' } },
    { label: 'free solo', props: { 'aria-label': 'Tag', options: FRUIT, freeSolo: true } },
    { label: 'clearable', props: { 'aria-label': 'Fruit', options: FRUIT, defaultValue: 'banana', clearable: true } },
    ...SIZES.map((size) => ({
      label: `size ${size}`,
      props: { size, 'aria-label': `Size ${size}`, options: FRUIT },
    })),
    { label: 'invalid', props: { 'aria-label': 'Fruit', options: FRUIT, invalid: true } },
    { label: 'disabled', props: { 'aria-label': 'Fruit', options: FRUIT, disabled: true, defaultValue: 'apple' } },
  ],
  enums: { size: SIZES },
  props: [
    { name: 'options', type: 'OptionItem[]', description: 'Static source. Mutually exclusive with loadOptions.' },
    { name: 'loadOptions', type: '(query: string) => Promise<OptionItem[]>', description: 'Async source; debounced; stale responses discarded.' },
    { name: 'debounceMs', type: 'number', default: '300', description: 'Async / onSearch debounce.' },
    { name: 'minChars', type: 'number', default: '1', description: 'Below threshold the listbox stays closed.' },
    { name: 'freeSolo', type: 'boolean', default: 'false', description: 'true: any typed text is committable; false: must pick an option.' },
    { name: 'value / defaultValue', type: 'string | null', default: '—', description: 'Committed value (option value or raw text when freeSolo).' },
    { name: 'loadingLabel / emptyLabel', type: 'string', default: "'Searching…' / 'No results'", description: 'i18n row messages.' },
    { name: 'resultsLabel', type: 'string', default: "'{count} results'", description: 'Polite count announcement (i18n).' },
  ],
  events: [
    { name: 'onChange', payload: '(value, { source })', description: 'Commit (option / free-text / clear).' },
    { name: 'onSearch', payload: 'string', description: 'Debounced input.' },
    { name: 'onSelect', payload: 'OptionItem', description: 'Option pick, before onChange.' },
    { name: 'onOpenChange', payload: 'boolean', description: 'Listbox opened / closed.' },
  ],
  keyboard: [
    { keys: '↓', action: 'Open list / move active descendant into list' },
    { keys: '↑', action: 'Move active option up' },
    { keys: 'Home / End', action: 'First / last option' },
    { keys: 'Enter', action: 'Commit active option; freeSolo commits raw text with no active' },
    { keys: 'Esc', action: 'First closes the list, second clears (if clearable)' },
  ],
  aria: [
    { attr: 'role', value: 'combobox', note: 'On the input.' },
    { attr: 'aria-autocomplete', value: 'list' },
    { attr: 'aria-expanded', value: 'true | false' },
    { attr: 'aria-controls', value: 'listbox id' },
    { attr: 'aria-busy', value: 'true', note: 'On the listbox while async pending.' },
  ],
  contract: { doc: '04-component-bible.md', heading: 'FxAutocomplete' },
};
