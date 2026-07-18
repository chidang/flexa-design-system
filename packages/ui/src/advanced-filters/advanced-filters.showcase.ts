/**
 * FxAdvancedFilters showcase. The trigger Button + active-filter Chips render
 * statically (the builder popover is a mounted-gated client island), so the
 * first variant carries non-empty a11y markup. `FilterField.type` /
 * `FilterOperator` are local prop-type strings (no §5 shared union).
 */
import type { ShowcaseSpec } from '../showcase-types';
import { FxAdvancedFilters, type FilterField, type FilterValue } from './advanced-filters';

const noop = () => undefined;

const fields: FilterField[] = [
  {
    key: 'status',
    label: 'Status',
    type: 'select',
    options: [
      { value: 'active', label: 'Active' },
      { value: 'paused', label: 'Paused' },
      { value: 'archived', label: 'Archived' },
    ],
  },
  { key: 'name', label: 'Name', type: 'text' },
  { key: 'total', label: 'Order total', type: 'money' },
  { key: 'created', label: 'Created', type: 'date' },
  { key: 'flagged', label: 'Flagged', type: 'boolean' },
];

const applied: FilterValue[] = [
  { field: 'status', operator: 'eq', value: 'active' },
  { field: 'total', operator: 'gte', value: '50' },
];

export const advancedFiltersShowcase: ShowcaseSpec = {
  name: 'AdvancedFilters',
  slug: 'advanced-filters',
  category: 'admin',
  slice: 'U10',
  status: 'ready',
  tagline: 'Structured query building: active-filter chips + a staged AND-only builder popover.',
  component: FxAdvancedFilters,
  interactive: true,
  variants: [
    {
      label: 'applied chips',
      props: { fields, value: applied, onFilterChange: noop },
      note: 'Chips read "Status: is Active" — dismiss removes the condition; the Filter button opens the builder.',
    },
    {
      label: 'no active filters',
      props: { fields, defaultValue: [], onFilterChange: noop },
      note: 'Only the Filter trigger shows until conditions are applied.',
    },
    {
      label: 'boolean + money fields',
      props: {
        fields,
        value: [{ field: 'flagged', operator: 'eq', value: true }] as FilterValue[],
        onFilterChange: noop,
      },
    },
    {
      label: 'row cap',
      props: { fields, value: applied, maxRows: 3, onFilterChange: noop },
    },
  ],
  props: [
    { name: 'fields', type: 'FilterField[]', required: true, description: 'FilterField = { key; label; type: text|number|money|select|multiselect|date|daterange|boolean; options?; operators? } — from the collection schema.' },
    { name: 'value', type: 'FilterValue[]', description: 'Controlled applied conditions (§1.5).' },
    { name: 'defaultValue', type: 'FilterValue[]', default: '[]', description: 'Uncontrolled initial applied conditions.' },
    { name: 'onFilterChange', type: '(filters: FilterValue[]) => void', description: 'Fires on Apply / Clear — never per keystroke (draft state is internal).' },
    { name: 'maxRows', type: 'number', default: '5', description: 'Maximum builder rows.' },
    { name: 'labels', type: 'Partial<AdvancedFiltersLabels>', description: 'i18n overrides (trigger, operator words, AND note, footer buttons…).' },
  ],
  events: [
    { name: 'onFilterChange', payload: '(filters: FilterValue[])', description: 'The applied condition set changed (Apply, Clear, or chip dismissal).' },
  ],
  keyboard: [
    { keys: 'Enter / Space', action: 'Open the builder from the Filter trigger.' },
    { keys: 'Tab', action: 'Move through builder rows (field → operator → value → remove).' },
    { keys: 'Delete / Backspace', action: 'Dismiss the focused active-filter chip.' },
    { keys: 'Esc', action: 'Close the builder, discarding staged edits with no query churn.' },
  ],
  aria: [
    { attr: 'aria-haspopup', value: 'dialog', note: 'The Filter trigger opens the builder popover.' },
    { attr: 'role="dialog"', value: 'builder', note: 'The staged builder is a labelled dialog (Esc discards).' },
    { attr: 'aria-label', value: 'Remove filter …', note: 'Each chip’s remove button spells the condition it drops.' },
  ],
  contract: { doc: '04-component-bible.md', heading: 'FxAdvancedFilters — Advanced Filters' },
};
