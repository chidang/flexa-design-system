/**
 * Empty State showcase spec — sizes, with/without media and actions.
 */
import { createElement } from 'react';
import type { ShowcaseSpec } from '../showcase-types';
import { FxButton } from '../button/button';
import { FxEmptyState } from './empty-state';

const SIZES = ['sm', 'md', 'lg'] as const;
const action = createElement(FxButton, { variant: 'primary' }, 'Add product');

export const emptyStateShowcase: ShowcaseSpec = {
  name: 'Empty State',
  slug: 'empty-state',
  category: 'display',
  slice: 'U2',
  status: 'ready',
  interactive: false,
  tagline: 'The zero-data surface — what is true, and what to do next.',
  component: FxEmptyState,
  variants: [
    {
      label: 'with icon + action',
      props: {
        icon: 'package',
        title: 'No products yet',
        description: 'Add your first product to start selling.',
        actions: action,
      },
    },
    {
      label: 'no results',
      props: {
        icon: 'search',
        title: 'No results found',
        description: 'Try a different search or clear your filters.',
      },
    },
    { label: 'title only', props: { title: 'Nothing here' } },
    ...SIZES.map((size) => ({
      label: `size ${size}`,
      props: { size, icon: 'grid' as const, title: 'No items', description: 'Nothing to show.' },
    })),
  ],
  enums: { size: SIZES },
  props: [
    { name: 'title', type: 'ReactNode', required: true, description: "What's true." },
    { name: 'description', type: 'ReactNode', description: 'What to do next.' },
    { name: 'icon / illustration', type: 'IconName / ReactNode', description: 'Decorative media slot.' },
    { name: 'actions', type: 'ReactNode', description: 'Primary FxButton (+ optional secondary/link).' },
    { name: 'size', type: "'sm' | 'md' | 'lg'", default: "'md'", description: 'Density (inline / panel / full-page).' },
  ],
  aria: [
    { attr: 'aria-hidden', value: 'true', note: 'On the media slot (decorative).' },
  ],
  contract: { doc: '04-component-bible.md', heading: 'FxEmptyState' },
};
