/** Floating Action Button showcase — pure/RSC single promoted action. */
import type { ShowcaseSpec } from '../showcase-types';
import { FxFloatingActionButton } from './fab';

export const fabShowcase: ShowcaseSpec = {
  name: 'Floating Action Button',
  slug: 'fab',
  category: 'navigation',
  slice: 'U4',
  status: 'ready',
  interactive: false,
  tagline: "The screen's one dominant creation action, floating above content.",
  component: FxFloatingActionButton,
  variants: [
    { label: 'standard', props: { icon: 'plus', label: 'New listing' } },
    { label: 'extended', props: { icon: 'plus', label: 'New listing', extended: true } },
    { label: 'with menu', props: { icon: 'plus', label: 'Create', hasMenu: true } },
    { label: 'disabled', props: { icon: 'plus', label: 'New listing', disabled: true } },
  ],
  props: [
    { name: 'icon', type: 'IconName', required: true, description: 'Glyph shown in the button.' },
    { name: 'label', type: 'string', required: true, description: 'Accessible name; visible text when extended.' },
    { name: 'extended', type: 'boolean', default: 'false', description: 'Render as a labelled pill.' },
    { name: 'hasMenu', type: 'boolean', default: 'false', description: 'Sets aria-haspopup when a host binds a speed-dial menu.' },
    { name: 'disabled', type: 'boolean', default: 'false', description: 'Disable activation.' },
  ],
  events: [{ name: 'onClick', payload: 'void', description: 'Fires on activation.' }],
  keyboard: [
    { keys: 'Tab', action: 'Focus the button (in normal tab order)' },
    { keys: 'Enter · Space', action: 'Activate' },
  ],
  aria: [
    { attr: 'aria-label', value: 'label', note: 'Mandatory — icon-only control.' },
    { attr: 'aria-haspopup', value: "'menu'", note: 'When hasMenu (speed-dial trigger).' },
  ],
  contract: { doc: '04-component-bible.md', heading: 'FxFloatingActionButton' },
};
