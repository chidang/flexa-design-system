/**
 * Validation Message showcase spec. Tone is a component-specific literal union
 * (danger | warning | success) — documented in the props table, NOT in `enums`
 * (only shared unions from enums.ts belong there).
 */
import type { ShowcaseSpec } from '../showcase-types';
import { FxValidationMessage } from './validation-message';

export const validationMessageShowcase: ShowcaseSpec = {
  name: 'Validation Message',
  slug: 'validation-message',
  category: 'forms',
  slice: 'U1',
  status: 'ready',
  interactive: false,
  tagline: 'The one message line under a field — error, warning, or success.',
  component: FxValidationMessage,
  variants: [
    { label: 'danger (default)', props: { tone: 'danger' }, children: 'Enter a price of at least $1.' },
    { label: 'warning', props: { tone: 'warning' }, children: 'This address looks unusually long.' },
    { label: 'success', props: { tone: 'success' }, children: 'Domain verified.' },
  ],
  props: [
    { name: 'children / message', type: 'string | Node', required: true, description: 'The message; say how to fix, ≤ 1 short sentence.' },
    { name: 'tone', type: "'danger' | 'warning' | 'success'", default: "'danger'", description: 'Field-level severity (no info tone).' },
    { name: 'id', type: 'string', default: 'auto', description: "Consumed by the control's aria-describedby (FieldGroup wires it)." },
  ],
  aria: [
    { attr: 'aria-hidden', value: 'true', note: 'On the icon — tone is conveyed by text.' },
    { attr: 'role', value: 'alert', note: 'Only when FxFieldGroup mounts it dynamically in its alert slot.' },
  ],
  contract: { doc: '04-component-bible.md', heading: 'FxValidationMessage' },
};
