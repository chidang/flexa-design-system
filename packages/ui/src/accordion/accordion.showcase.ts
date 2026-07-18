/**
 * Accordion showcase spec. Component unions (`'default' | 'contained'`,
 * headingLevel `2–6`) live in the component file and are documented in `props`
 * as type strings — no shared enum applies, so `enums` is omitted.
 */
import type { ShowcaseSpec } from '../showcase-types';
import { FxAccordion } from './accordion';

const ITEMS = [
  { id: 'shipping', title: 'Shipping & delivery', content: 'Orders ship within two business days.' },
  { id: 'returns', title: 'Returns', subtitle: '30-day window', content: 'Return any item within 30 days for a full refund.' },
  { id: 'warranty', title: 'Warranty', content: 'All products carry a one-year limited warranty.' },
  { id: 'support', title: 'Support', content: 'Reach us any time via chat or email.', disabled: true },
];

export const accordionShowcase: ShowcaseSpec = {
  name: 'Accordion',
  slug: 'accordion',
  category: 'data',
  slice: 'U6',
  status: 'ready',
  interactive: true,
  tagline: 'Stacked expandable sections — single or multiple open, boxed or plain.',
  component: FxAccordion,
  variants: [
    { label: 'default (single)', props: { items: ITEMS.slice(0, 3), defaultOpenIds: ['shipping'] } },
    { label: 'contained', props: { items: ITEMS.slice(0, 3), variant: 'contained', defaultOpenIds: ['shipping'] } },
    { label: 'multiple open', props: { items: ITEMS.slice(0, 3), multiple: true, defaultOpenIds: ['shipping', 'warranty'] } },
    { label: 'all closed', props: { items: ITEMS.slice(0, 3) } },
    { label: 'non-collapsible (single)', props: { items: ITEMS.slice(0, 3), collapsible: false, defaultOpenIds: ['shipping'] } },
    { label: 'with subtitle', props: { items: ITEMS.slice(0, 3), defaultOpenIds: ['returns'] } },
    { label: 'disabled item', props: { items: ITEMS, variant: 'contained', defaultOpenIds: ['shipping'] } },
    { label: 'headingLevel 2', props: { items: ITEMS.slice(0, 3), headingLevel: 2, defaultOpenIds: ['shipping'] } },
  ],
  props: [
    { name: 'items', type: '{ id; title; subtitle?; content; disabled? }[]', required: true, description: 'The sections.' },
    { name: 'openIds / defaultOpenIds', type: 'string[]', default: '— / []', description: 'Open sections (§1.5).' },
    { name: 'multiple', type: 'boolean', default: 'false', description: 'false: opening one closes others.' },
    { name: 'collapsible', type: 'boolean', default: 'true', description: 'false + single mode: one item always open.' },
    { name: 'variant', type: "'default' | 'contained'", default: "'default'", description: 'Boxed per-item surface when contained.' },
    { name: 'headingLevel', type: '2 | 3 | 4 | 5 | 6', default: '3', description: 'Wrapper heading level.' },
  ],
  events: [
    { name: 'onOpenChange', payload: '(openIds: string[])', description: 'Open set changed.' },
  ],
  keyboard: [
    { keys: 'Enter / Space', action: 'Toggle the focused section' },
    { keys: '↓ / ↑', action: 'Move between triggers (wrap)' },
    { keys: 'Home / End', action: 'First / last trigger' },
  ],
  aria: [
    { attr: 'aria-expanded', value: 'true | false', note: 'On each trigger.' },
    { attr: 'aria-controls', value: 'panel id', note: 'Trigger → panel.' },
    { attr: 'role', value: 'region', note: 'On panels; dropped when > 6 items.' },
    { attr: 'hidden', value: 'true', note: 'Closed panels are hidden.' },
  ],
  contract: { doc: '04-component-bible.md', heading: 'FxAccordion' },
};
