/**
 * Radio Group showcase spec. No shared-union `enums` (orientation is a
 * component-specific literal — documented only in the props table).
 */
import type { ShowcaseSpec } from '../showcase-types';
import { FxRadioGroup } from './radio-group';

const PLANS = [
  { value: 'starter', label: 'Starter', description: '$0 / month · for trying things out' },
  { value: 'pro', label: 'Pro', description: '$29 / month · for growing teams' },
  { value: 'enterprise', label: 'Enterprise', description: 'Custom · advanced controls' },
];

export const radioGroupShowcase: ShowcaseSpec = {
  name: 'Radio Group',
  slug: 'radio-group',
  category: 'forms',
  slice: 'U1',
  status: 'ready',
  interactive: true,
  tagline: 'Choose exactly one of 2–6 visible, mutually exclusive options.',
  component: FxRadioGroup,
  variants: [
    {
      label: 'vertical (default)',
      props: {
        'aria-label': 'Plan',
        options: [
          { value: 'a', label: 'Option A' },
          { value: 'b', label: 'Option B' },
          { value: 'c', label: 'Option C' },
        ],
        defaultValue: 'a',
      },
    },
    {
      label: 'horizontal',
      props: {
        'aria-label': 'Size',
        orientation: 'horizontal',
        options: [
          { value: 's', label: 'Small' },
          { value: 'm', label: 'Medium' },
          { value: 'l', label: 'Large' },
        ],
        defaultValue: 'm',
      },
    },
    { label: 'with descriptions', props: { 'aria-label': 'Plan', options: PLANS, defaultValue: 'pro' } },
    {
      label: 'per-option disabled',
      props: {
        'aria-label': 'Speed',
        options: [
          { value: 'std', label: 'Standard' },
          { value: 'exp', label: 'Express', disabled: true },
        ],
        defaultValue: 'std',
      },
    },
    {
      label: 'group disabled',
      props: {
        'aria-label': 'Locked',
        disabled: true,
        options: [
          { value: 'x', label: 'One' },
          { value: 'y', label: 'Two' },
        ],
        defaultValue: 'x',
      },
    },
    {
      label: 'invalid',
      props: {
        'aria-label': 'Required choice',
        invalid: true,
        options: [
          { value: '1', label: 'Yes' },
          { value: '2', label: 'No' },
        ],
      },
    },
  ],
  props: [
    { name: 'options', type: 'RadioOption[]', required: true, description: '{ value, label, description?, disabled? }.' },
    { name: 'value / defaultValue', type: 'string | null', default: '— / null', description: 'Controlled / uncontrolled (§1.5).' },
    { name: 'orientation', type: "'vertical' | 'horizontal'", default: "'vertical'", description: 'Layout axis.' },
    { name: 'name', type: 'string', default: 'auto', description: 'Shared native radio name.' },
    { name: 'disabled', type: 'boolean', default: 'false', description: 'Disables the whole group.' },
    { name: 'invalid', type: 'boolean', default: 'false', description: 'Danger border on the dots.' },
  ],
  events: [{ name: 'onChange', payload: '(value, { source })', description: 'Fires on selection.' }],
  keyboard: [
    { keys: 'ArrowDown · ArrowRight', action: 'Move to + select next (wraps, skips disabled)' },
    { keys: 'ArrowUp · ArrowLeft', action: 'Move to + select previous (wraps)' },
    { keys: 'Tab', action: 'Enter/leave the group — one tab stop (checked or first)' },
  ],
  aria: [
    { attr: 'role', value: 'radiogroup', note: 'Labelled by FxFieldGroup.' },
    { attr: 'aria-checked', value: 'true | false', note: 'Native radios carry selection.' },
  ],
  contract: { doc: '04-component-bible.md', heading: 'FxRadioGroup' },
};
