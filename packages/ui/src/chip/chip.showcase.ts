/**
 * Chip showcase spec — default, choice (selected), dismissible, icon, sizes.
 */
import type { ShowcaseSpec } from '../showcase-types';
import { SIZES } from '../enums';
import { FxChip } from './chip';

export const chipShowcase: ShowcaseSpec = {
  name: 'Chip',
  slug: 'chip',
  category: 'display',
  slice: 'U2',
  status: 'ready',
  interactive: false,
  tagline: 'A compact interactive token — filters, choices, tag-input values.',
  component: FxChip,
  variants: [
    { label: 'default', props: { label: 'All' } },
    { label: 'selected', props: { label: 'Active', selected: true } },
    { label: 'unselected', props: { label: 'Paused', selected: false } },
    { label: 'with icon', props: { label: 'Featured', icon: 'star' } },
    { label: 'dismissible', props: { label: 'Design', dismissible: true } },
    { label: 'disabled', props: { label: 'Archived', disabled: true, dismissible: true } },
    ...SIZES.map((size) => ({ label: `size ${size}`, props: { label: 'Chip', size } })),
  ],
  enums: { size: SIZES },
  props: [
    { name: 'label', type: 'string', required: true, description: 'Chip text.' },
    { name: 'selected', type: 'boolean', description: 'Choice-chip mode (parent-owned pressed state).' },
    { name: 'dismissible', type: 'boolean', default: 'false', description: 'Renders the remove button.' },
    { name: 'removeLabel', type: 'string', default: "'Remove {label}'", description: 'i18n label for the remove button.' },
    { name: 'icon', type: 'IconName', description: 'Leading icon.' },
    { name: 'size', type: "'sm' | 'md' | 'lg'", default: "'md'", description: 'Height (24 / 32 / 40px).' },
    { name: 'disabled', type: 'boolean', default: 'false', description: 'Suppress activation and dismissal.' },
  ],
  events: [
    { name: 'onClick', payload: '() => void', description: 'Chip activation.' },
    { name: 'onChange', payload: '(selected: boolean) => void', description: 'Choice mode — next pressed state.' },
    { name: 'onDismiss', payload: '() => void', description: 'Remove button or Delete/Backspace.' },
  ],
  keyboard: [
    { keys: 'Enter · Space', action: 'Activate / toggle the chip.' },
    { keys: 'Delete · Backspace', action: 'Dismiss when dismissible and focused.' },
  ],
  aria: [
    { attr: 'aria-pressed', value: 'boolean', note: 'On the chip button in choice mode.' },
    { attr: 'aria-label', value: 'string', note: 'On the remove button (from removeLabel).' },
  ],
  contract: { doc: '04-component-bible.md', heading: 'FxChip' },
};
