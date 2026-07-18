/** Breadcrumb showcase — pure/RSC hierarchy trail. */
import type { ShowcaseSpec } from '../showcase-types';
import { FxBreadcrumb } from './breadcrumb';

const trail = [
  { label: 'Orders', href: '/orders', icon: 'package' as const },
  { label: '#FM-2481', href: '/orders/2481' },
  { label: 'Dispute' },
];

const longTrail = [
  { label: 'Catalog', href: '/catalog' },
  { label: 'Audio', href: '/catalog/audio' },
  { label: 'Headphones', href: '/catalog/audio/headphones' },
  { label: 'Wireless', href: '/catalog/audio/headphones/wireless' },
  { label: 'Aurora X1' },
];

export const breadcrumbShowcase: ShowcaseSpec = {
  name: 'Breadcrumb',
  slug: 'breadcrumb',
  category: 'navigation',
  slice: 'U4',
  status: 'ready',
  interactive: false,
  tagline: 'Hierarchy trail from section root to the current page.',
  component: FxBreadcrumb,
  variants: [
    { label: 'standard', props: { items: trail } },
    { label: 'with leading icon', props: { items: trail } },
    { label: 'collapsed (maxItems=4)', props: { items: longTrail, maxItems: 4 } },
    { label: 'full (maxItems=99)', props: { items: longTrail, maxItems: 99 } },
  ],
  props: [
    {
      name: 'items',
      type: '{ label: string; href?: string; icon?: IconName }[]',
      required: true,
      description: 'Ordered trail; the last item is the current page (no href).',
    },
    {
      name: 'maxItems',
      type: 'number',
      default: '4',
      description: 'Overflow collapses middle items into an ellipsis (first + last 2 kept).',
    },
    {
      name: 'ariaLabel',
      type: 'string',
      default: "'Breadcrumb'",
      description: 'Accessible name for the nav landmark (i18n).',
    },
  ],
  aria: [
    { attr: 'aria-label', value: "'Breadcrumb'", note: 'On the nav landmark.' },
    { attr: 'aria-current', value: "'page'", note: 'On the last (current) item.' },
    { attr: 'aria-hidden', value: 'true', note: 'On separators and the ellipsis marker.' },
  ],
  keyboard: [{ keys: 'Tab', action: 'Move between ancestor links (native)' }],
  contract: { doc: '04-component-bible.md', heading: 'FxBreadcrumb' },
};
