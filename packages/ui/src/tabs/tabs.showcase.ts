/** Tabs showcase — interactive; roving-tabindex APG tabs pattern. */
import type { ShowcaseSpec } from '../showcase-types';
import { FxTabs } from './tabs';

const items = [
  { id: 'details', label: 'Details', content: 'Order details panel.' },
  { id: 'escrow', label: 'Escrow', icon: 'lock' as const, content: 'Escrow status panel.' },
  { id: 'messages', label: 'Messages', badge: 3, content: 'Conversation thread.' },
  { id: 'history', label: 'History', content: 'Audit history panel.' },
];

export const tabsShowcase: ShowcaseSpec = {
  name: 'Tabs',
  slug: 'tabs',
  category: 'navigation',
  slice: 'U4',
  status: 'ready',
  interactive: true,
  tagline: 'Switch between facets of the same entity, in place.',
  component: FxTabs,
  variants: [
    { label: 'underline', props: { items, defaultValue: 'details' } },
    { label: 'contained', props: { items, variant: 'contained', defaultValue: 'details' } },
    { label: 'vertical', props: { items, orientation: 'vertical', defaultValue: 'details' } },
    { label: 'manual activation', props: { items, activation: 'manual', defaultValue: 'details' } },
    {
      label: 'with disabled tab',
      props: {
        items: [items[0], { ...items[1], disabled: true }, items[2]],
        defaultValue: 'details',
      },
    },
    { label: 'size sm', props: { items, size: 'sm', defaultValue: 'details' } },
  ],
  props: [
    { name: 'items', type: '{ id; label; icon?; badge?; disabled?; content }[]', required: true, description: 'Tabs and their panels.' },
    { name: 'value / defaultValue', type: 'string', description: 'Controlled / uncontrolled active tab id (§1.5).' },
    { name: 'variant', type: "'underline' | 'contained'", default: "'underline'", description: 'Visual treatment.' },
    { name: 'activation', type: "'auto' | 'manual'", default: "'auto'", description: 'auto = focus selects; manual = Enter/Space selects.' },
    { name: 'orientation', type: "'horizontal' | 'vertical'", default: "'horizontal'", description: 'Tablist axis.' },
    { name: 'size', type: "'sm' | 'md' | 'lg'", default: "'md'", description: 'Tab height.' },
  ],
  events: [{ name: 'onChange', payload: 'string', description: 'Newly active tab id.' }],
  keyboard: [
    { keys: 'ArrowRight / ArrowLeft (or Down/Up)', action: 'Move focus, wrapping, skipping disabled' },
    { keys: 'Home · End', action: 'Focus first / last enabled tab' },
    { keys: 'Enter · Space', action: 'Activate the tab (manual activation)' },
    { keys: 'Tab', action: 'Move from the tab to its active panel' },
  ],
  aria: [
    { attr: 'role', value: "'tablist' / 'tab' / 'tabpanel'", note: 'Per part.' },
    { attr: 'aria-selected', value: 'boolean', note: 'On the active tab.' },
    { attr: 'aria-controls / aria-labelledby', value: 'id', note: 'Tab ↔ panel wiring.' },
  ],
  contract: { doc: '04-component-bible.md', heading: 'FxTabs' },
};
