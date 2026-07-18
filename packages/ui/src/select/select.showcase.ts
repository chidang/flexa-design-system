/**
 * Select showcase spec. Only SHARED unions (from `enums.ts`) appear in `enums`;
 * the `options` shape is documented in `props` as a type string.
 */
import type { ShowcaseSpec } from '../showcase-types';
import { SIZES } from '../enums';
import { FxSelect } from './select';

const OPTIONS = [
  { value: 'draft', label: 'Draft' },
  { value: 'published', label: 'Published' },
  { value: 'archived', label: 'Archived' },
];

const GROUPED = [
  { label: 'Fruit', options: [
    { value: 'apple', label: 'Apple' },
    { value: 'pear', label: 'Pear', description: 'In season' },
  ] },
  { label: 'Vegetable', options: [
    { value: 'carrot', label: 'Carrot' },
    { value: 'kale', label: 'Kale', disabled: true },
  ] },
];

export const selectShowcase: ShowcaseSpec = {
  name: 'Select',
  slug: 'select',
  category: 'forms',
  slice: 'U5',
  status: 'ready',
  interactive: true,
  tagline: 'Single-choice combobox — pick one option from a portalled listbox.',
  component: FxSelect,
  variants: [
    { label: 'default', props: { 'aria-label': 'Status', options: OPTIONS } },
    { label: 'with value', props: { 'aria-label': 'Status', options: OPTIONS, defaultValue: 'published' } },
    { label: 'open', props: { 'aria-label': 'Status', options: OPTIONS, defaultOpen: true } },
    { label: 'grouped', props: { 'aria-label': 'Produce', options: GROUPED } },
    { label: 'clearable', props: { 'aria-label': 'Status', options: OPTIONS, defaultValue: 'draft', clearable: true } },
    { label: 'empty', props: { 'aria-label': 'Nothing', options: [], defaultOpen: true } },
    ...SIZES.map((size) => ({
      label: `size ${size}`,
      props: { size, 'aria-label': `Size ${size}`, options: OPTIONS },
    })),
    { label: 'invalid', props: { 'aria-label': 'Status', options: OPTIONS, invalid: true } },
    { label: 'disabled', props: { 'aria-label': 'Status', options: OPTIONS, disabled: true, defaultValue: 'draft' } },
  ],
  enums: { size: SIZES },
  props: [
    { name: 'options', type: 'OptionItem[] | OptionGroup[]', required: true, description: 'OptionGroup = { label; options: OptionItem[] }.' },
    { name: 'value / defaultValue', type: 'string | null', default: '— / null', description: 'Single select (§1.5).' },
    { name: 'open / defaultOpen', type: 'boolean', default: '— / false', description: 'Popover open state (§1.5).' },
    { name: 'placeholder', type: 'string', default: "'Select…'", description: 'Shown with no selection (i18n).' },
    { name: 'clearable', type: 'boolean', default: 'false', description: 'Renders a clear affordance when a value is set.' },
    { name: 'invalid / disabled', type: 'boolean', default: 'false', description: 'State flags, as FxInput.' },
    { name: 'size', type: "'sm' | 'md' | 'lg'", default: "'md'", description: 'Trigger height.' },
    { name: 'emptyLabel', type: 'string', default: "'No options'", description: 'Empty listbox message (i18n).' },
    { name: 'renderOption', type: '(item: OptionItem) => Node', description: 'Custom option content; label/description still drive typeahead & a11y.' },
  ],
  events: [
    { name: 'onChange', payload: '(value: string | null, { source })', description: 'Selection or clear.' },
    { name: 'onOpenChange', payload: 'boolean', description: 'Popover opened / closed.' },
  ],
  keyboard: [
    { keys: 'Enter / Space / ↓ / ↑', action: 'Closed: open; active = selected or first' },
    { keys: '↓ / ↑', action: 'Open: move active option (no wrap)' },
    { keys: 'Home / End', action: 'First / last option' },
    { keys: 'A–Z', action: 'Typeahead on label (500ms buffer)' },
    { keys: 'Enter', action: 'Select active, close, focus trigger' },
    { keys: 'Esc', action: 'Close without selecting' },
    { keys: 'Tab', action: 'Close, commit nothing, move focus' },
  ],
  aria: [
    { attr: 'role', value: 'combobox', note: 'On the trigger.' },
    { attr: 'aria-haspopup', value: 'listbox' },
    { attr: 'aria-expanded', value: 'true | false' },
    { attr: 'aria-controls', value: 'listbox id' },
    { attr: 'aria-activedescendant', value: 'active option id', note: 'Focus stays on the trigger.' },
  ],
  contract: { doc: '04-component-bible.md', heading: 'FxSelect' },
};
