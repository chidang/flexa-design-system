/**
 * Tag Input showcase spec. Only SHARED unions (from `enums.ts`) appear in
 * `enums`; component-specific shapes are documented in `props` as type strings.
 */
import type { ShowcaseSpec } from '../showcase-types';
import { SIZES } from '../enums';
import { FxTagInput } from './tag-input';

const SUGGESTIONS = [
  { value: 'design', label: 'design' },
  { value: 'engineering', label: 'engineering' },
  { value: 'marketing', label: 'marketing' },
  { value: 'sales', label: 'sales' },
];

export const tagInputShowcase: ShowcaseSpec = {
  name: 'Tag Input',
  slug: 'tag-input',
  category: 'forms',
  slice: 'U5',
  status: 'ready',
  interactive: true,
  tagline: 'Multi-value entry — committed values render as dismissible chips.',
  component: FxTagInput,
  variants: [
    { label: 'default', props: { 'aria-label': 'Tags' } },
    { label: 'with values', props: { 'aria-label': 'Tags', defaultValue: ['design', 'engineering'] } },
    { label: 'suggestions', props: { 'aria-label': 'Teams', suggestions: SUGGESTIONS } },
    { label: 'max tags', props: { 'aria-label': 'Tags', defaultValue: ['one', 'two'], maxTags: 2 } },
    ...SIZES.map((size) => ({
      label: `size ${size}`,
      props: { size, 'aria-label': `Size ${size}`, defaultValue: ['tag'] },
    })),
    { label: 'invalid', props: { 'aria-label': 'Tags', invalid: true, defaultValue: ['bad'] } },
    { label: 'disabled', props: { 'aria-label': 'Tags', disabled: true, defaultValue: ['locked'] } },
  ],
  enums: { size: SIZES },
  props: [
    { name: 'value / defaultValue', type: 'string[]', default: '— / []', description: 'Ordered, unique (§1.5).' },
    { name: 'suggestions / loadSuggestions', type: 'OptionItem[] | (q) => Promise<OptionItem[]>', description: 'Optional suggestion source (FxAutocomplete contract).' },
    { name: 'delimiter', type: 'RegExp | string', default: '/[,\\n]/', description: 'Typing/pasting a delimiter commits pending text.' },
    { name: 'maxTags', type: 'number', description: 'At limit the input is disabled and maxTagsLabel announced.' },
    { name: 'validateTag', type: '(raw: string) => string | null', description: 'Return normalized tag or null to reject.' },
    { name: 'allowDuplicates', type: 'boolean', default: 'false', description: 'Permit the same value more than once.' },
    { name: 'removeLabel', type: 'string', default: "'Remove {tag}'", description: 'Per-chip aria-label (i18n).' },
    { name: 'maxTagsLabel', type: 'string', default: "'Tag limit reached'", description: 'Announced at the limit (i18n).' },
  ],
  events: [
    { name: 'onChange', payload: '(values: string[], { source })', description: 'After add or remove.' },
    { name: 'onAdd', payload: 'string', description: 'Fires before the consolidated onChange.' },
    { name: 'onRemove', payload: 'string', description: 'Fires before the consolidated onChange.' },
  ],
  keyboard: [
    { keys: 'Enter / delimiter', action: 'Commit pending text' },
    { keys: 'Backspace (empty)', action: 'Focus last chip; second Backspace removes it' },
    { keys: '← / →', action: 'Traverse chips ↔ input' },
    { keys: 'Delete', action: 'Remove focused chip' },
    { keys: '↓ / ↑', action: 'Navigate suggestions (when present)' },
  ],
  aria: [
    { attr: 'role', value: 'listbox', note: 'On the chips container; chips are role=option.' },
    { attr: 'aria-activedescendant', value: 'active suggestion id' },
    { attr: 'role', value: 'status', note: 'Polite live region announces add / remove.' },
  ],
  contract: { doc: '04-component-bible.md', heading: 'FxTagInput' },
};
