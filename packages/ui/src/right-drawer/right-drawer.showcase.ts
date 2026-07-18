/**
 * FxRightDrawer showcase — slide-in detail/edit panel. Demos render open.
 */
import type { ShowcaseSpec } from '../showcase-types';
import { FxRightDrawer } from './right-drawer';

export const rightDrawerShowcase: ShowcaseSpec = {
  name: 'FxRightDrawer',
  slug: 'right-drawer',
  category: 'overlays',
  slice: 'U3',
  status: 'ready',
  interactive: true,
  tagline: 'Detail and edit context from the edge — without leaving the page.',
  component: FxRightDrawer,
  variants: [
    {
      label: 'modal',
      props: { defaultOpen: true, title: 'Order #1042', size: 'md' },
      children: 'Line items, buyer, and shipping for this order.',
    },
    {
      label: 'non-modal',
      props: { defaultOpen: true, title: 'Filters', modal: false, size: 'sm' },
      children: 'Narrow the list while the table stays interactive.',
    },
  ],
  props: [
    { name: 'open / defaultOpen / onOpenChange', type: '§1.5', description: 'Controlled or uncontrolled open state.' },
    { name: 'title', type: 'string', required: true, description: 'Labels the drawer.' },
    { name: 'size', type: "'sm' | 'md' | 'lg'", default: "'md'", description: '400 / 560 / 768px; full-width sheet ≤768px.' },
    { name: 'modal', type: 'boolean', default: 'true', description: 'true: scrim + focus trap. false: complementary landmark, no trap.' },
    { name: 'dismissible / closeLabel / onBeforeClose', type: 'as FxDialog', description: 'Inherited close semantics.' },
  ],
  events: [
    { name: 'onOpenChange', payload: "(open: boolean, reason)", description: 'Fires when the drawer requests to close.' },
  ],
  keyboard: [
    { keys: 'Esc', action: 'Close (modal always; non-modal when focus is inside)' },
    { keys: 'Tab · Shift+Tab', action: 'Cycle inside (modal only — trapped)' },
  ],
  aria: [
    { attr: 'role', value: 'dialog | complementary', note: 'Modal vs non-modal.' },
    { attr: 'aria-modal', value: 'true', note: 'Modal mode only.' },
  ],
  contract: { doc: '04-component-bible.md', heading: 'FxRightDrawer' },
};
