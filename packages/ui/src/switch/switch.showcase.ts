/**
 * Switch showcase spec. `size` here is the shared `sm | md` subset — the full
 * SIZES union has an `lg` the switch does not offer, so we do not list a shared
 * enum (the two-value axis is documented in the props table).
 */
import type { ShowcaseSpec } from '../showcase-types';
import { FxSwitch } from './switch';

export const switchShowcase: ShowcaseSpec = {
  name: 'Switch',
  slug: 'switch',
  category: 'forms',
  slice: 'U1',
  status: 'ready',
  interactive: true,
  tagline: 'An instant-effect on/off setting — flip it and it applies.',
  component: FxSwitch,
  variants: [
    { label: 'off', props: { label: 'Email notifications' } },
    { label: 'on', props: { label: 'Email notifications', defaultChecked: true } },
    { label: 'size sm', props: { size: 'sm', label: 'Compact', defaultChecked: true } },
    { label: 'size md', props: { size: 'md', label: 'Default', defaultChecked: true } },
    { label: 'loading', props: { label: 'Saving…', defaultChecked: true, loading: true } },
    { label: 'invalid', props: { label: 'Accept terms', invalid: true } },
    { label: 'disabled', props: { label: 'Unavailable', disabled: true } },
    { label: 'bare (aria-label)', props: { 'aria-label': 'Maintenance mode' } },
  ],
  props: [
    { name: 'checked / defaultChecked', type: 'boolean', default: '— / false', description: 'Controlled / uncontrolled (§1.5).' },
    { name: 'label', type: 'string | Node', description: 'Names the thing controlled, not the current state.' },
    { name: 'size', type: "'sm' | 'md'", default: "'md'", description: 'Track size — sm 32×18 / md 40×22.' },
    { name: 'invalid', type: 'boolean', default: 'false', description: 'Sets .is-invalid + aria-invalid.' },
    { name: 'loading', type: 'boolean', default: 'false', description: 'Thumb spinner, input inert, aria-busy.' },
    { name: 'disabled', type: 'boolean', default: 'false', description: 'Native disabled.' },
  ],
  events: [{ name: 'onChange', payload: '(checked, { source })', description: 'Fires on toggle.' }],
  keyboard: [{ keys: 'Space · Enter', action: 'Toggle the switch' }],
  aria: [
    { attr: 'role', value: 'switch', note: 'Native checkbox + switch role.' },
    { attr: 'aria-checked', value: 'true | false', note: 'Current state.' },
    { attr: 'aria-invalid', value: 'true', note: 'When invalid.' },
    { attr: 'aria-busy', value: 'true', note: 'While loading.' },
  ],
  contract: { doc: '04-component-bible.md', heading: 'FxSwitch' },
};
