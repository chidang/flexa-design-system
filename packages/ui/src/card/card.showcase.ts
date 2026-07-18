/**
 * Card showcase spec — padding, regions, interactive, selected.
 */
import { createElement } from 'react';
import type { ShowcaseSpec } from '../showcase-types';
import { FxButton } from '../button/button';
import { FxCard } from './card';

const PADDINGS = ['none', 'sm', 'md', 'lg'] as const;
const footer = createElement(FxButton, { variant: 'secondary', size: 'sm' }, 'View');

export const cardShowcase: ShowcaseSpec = {
  name: 'Card',
  slug: 'card',
  category: 'display',
  slice: 'U2',
  status: 'ready',
  interactive: false,
  tagline: 'A generic content container — the base for metric, product, and order cards.',
  component: FxCard,
  variants: [
    {
      label: 'header + body',
      props: {
        title: 'Monthly revenue',
        subtitle: 'Last 30 days',
        children: '$48,220 across 312 orders.',
      },
    },
    {
      label: 'with footer',
      props: { title: 'Order #4821', children: 'Wade Warren · 3 items', footer },
    },
    { label: 'interactive', props: { interactive: true, title: 'Open detail', children: 'Hover for elevation.' } },
    { label: 'selected', props: { selected: true, title: 'Selected', children: 'In a bulk-select grid.' } },
    ...PADDINGS.map((padding) => ({
      label: `padding ${padding}`,
      props: { padding, title: 'Padding', children: 'Body copy.' },
    })),
  ],
  props: [
    { name: 'padding', type: "'none' | 'sm' | 'md' | 'lg'", default: "'md'", description: 'Body padding (space.3 / .4 / .6).' },
    { name: 'interactive', type: 'boolean', default: 'false', description: 'Hover elevation + pointer.' },
    { name: 'selected', type: 'boolean', default: 'false', description: 'Selection ring.' },
    { name: 'as', type: "'div' | 'article' | 'section' | 'a'", default: "'div'", description: 'Semantic element.' },
    { name: 'media / title / subtitle / headerActions / footer', type: 'ReactNode', description: 'Optional region slots.' },
  ],
  events: [
    { name: 'onClick', payload: 'event', description: 'When interactive (title link is the accessible action).' },
  ],
  aria: [
    { attr: 'aria-selected', value: 'true', note: 'When selected.' },
  ],
  contract: { doc: '04-component-bible.md', heading: 'FxCard' },
};
