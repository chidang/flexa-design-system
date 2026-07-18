/**
 * Field Group showcase spec. Wraps a real control (FxInput) so the demos show the
 * label / help / error wiring end to end. No shared-union `enums`.
 *
 * NOTE: variants pass a rendered child via `children`. The ShowcaseVariant type
 * types `children` as `string` for the common text case; FieldGroup is the one
 * spec that renders an element child, so the workbench renders it through the
 * generic `props`/children spread the same way.
 */
import { createElement } from 'react';
import type { ShowcaseSpec } from '../showcase-types';
import { FxInput } from '../input/input';
import { FxFieldGroup } from './field-group';

const field = (props: Record<string, unknown> = {}) =>
  createElement(FxInput, { placeholder: 'Type here', ...props });

export const fieldGroupShowcase: ShowcaseSpec = {
  name: 'Field Group',
  slug: 'field-group',
  category: 'forms',
  slice: 'U1',
  status: 'ready',
  interactive: true,
  tagline: 'The label / help / error shell that wraps every single control.',
  component: FxFieldGroup,
  variants: [
    { label: 'label + help', props: { label: 'Email', help: "We'll never share it.", children: field() } },
    { label: 'required', props: { label: 'Full name', required: true, children: field() } },
    { label: 'error (replaces help)', props: { label: 'Price', help: 'In USD.', error: 'Enter a price of at least $1.', children: field({ defaultValue: '0' }) } },
    { label: 'label hidden', props: { label: 'Search', labelHidden: true, children: field({ prefix: 'search' }) } },
    { label: 'with counter', props: { label: 'Bio', count: '18 / 140', children: field({ defaultValue: 'Frontend engineer' }) } },
    { label: 'disabled', props: { label: 'Locked', disabled: true, children: field({ defaultValue: 'Locked' }) } },
  ],
  props: [
    { name: 'label', type: 'string', required: true, description: 'Visible label. labelHidden renders it visually-hidden (still wired).' },
    { name: 'labelHidden', type: 'boolean', default: 'false', description: 'Visually-hidden label.' },
    { name: 'help', type: 'string', description: 'Persistent help — hidden while an error shows.' },
    { name: 'error', type: 'string | false', description: 'Truthy ⇒ FxValidationMessage in the alert slot + aria-invalid.' },
    { name: 'required', type: 'boolean', default: 'false', description: 'Asterisk + aria-required; or optionalLabel when optionals are marked.' },
    { name: 'requiredLabel / optionalLabel', type: 'string', default: "'required' / 'Optional'", description: 'i18n.' },
    { name: 'count', type: 'string', description: 'Character-counter text in the meta slot.' },
    { name: 'asGroup', type: 'boolean', default: 'false', description: 'For group controls — wires role=group + aria-labelledby instead of label[for].' },
    { name: 'disabled', type: 'boolean', default: 'false', description: 'Cascades to the child control.' },
  ],
  aria: [
    { attr: 'label[for]', value: 'control id', note: 'Single controls; group controls get aria-labelledby.' },
    { attr: 'aria-describedby', value: 'help / error / count ids', note: 'Error id first; error replaces help.' },
    { attr: 'role', value: 'alert', note: 'On the error slot — announces dynamic validation once.' },
  ],
  contract: { doc: '04-component-bible.md', heading: 'FxFieldGroup' },
};
