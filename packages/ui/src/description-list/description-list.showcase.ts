/**
 * Description List showcase spec — layouts, divided, grid columns.
 */
import type { ShowcaseSpec } from '../showcase-types';
import { FxDescriptionList } from './description-list';

const orderItems = [
  { term: 'Order', detail: '#4821' },
  { term: 'Customer', detail: 'Wade Warren' },
  { term: 'Total', detail: '$96.50' },
  { term: 'Status', detail: 'Paid' },
];

export const descriptionListShowcase: ShowcaseSpec = {
  name: 'Description List',
  slug: 'description-list',
  category: 'display',
  slice: 'U2',
  status: 'ready',
  interactive: false,
  tagline: 'Term/detail pairs for detail panes, order metadata, and settings review.',
  component: FxDescriptionList,
  variants: [
    { label: 'horizontal', props: { items: orderItems } },
    { label: 'vertical', props: { items: orderItems, layout: 'vertical' } },
    { label: 'divided', props: { items: orderItems, divided: true } },
    { label: 'grid · 2 columns', props: { items: orderItems, layout: 'grid', columns: 2 } },
  ],
  props: [
    { name: 'items', type: '{ term: string; detail: Node; span?: 1 | 2 }[]', required: true, description: 'Term/detail pairs.' },
    { name: 'layout', type: "'horizontal' | 'vertical' | 'grid'", default: "'horizontal'", description: 'Horizontal = term column.' },
    { name: 'columns', type: '1 | 2', default: '1', description: 'Grid column count (grid layout).' },
    { name: 'divided', type: 'boolean', default: 'false', description: 'Hairline separators between rows.' },
  ],
  contract: { doc: '04-component-bible.md', heading: 'FxDescriptionList' },
};
