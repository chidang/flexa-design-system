/**
 * FxBlankStateLayout showcase — a full-content-area blank state proxying
 * FxEmptyState. Icon names are the canonical IconName set (documented in
 * `props`, not a shared enum union), so `enums` is omitted.
 */
import { createElement } from 'react';
import type { ShowcaseSpec } from '../showcase-types';
import { FxButton } from '../button/button';
import { FxBlankStateLayout } from './blank-state-layout';

const action = createElement(FxButton, { variant: 'primary' }, 'Create listing');

export const blankStateLayoutShowcase: ShowcaseSpec = {
  name: 'FxBlankStateLayout',
  slug: 'blank-state-layout',
  category: 'layouts',
  slice: 'U7',
  status: 'ready',
  interactive: false,
  tagline: 'A full-content-area first-run surface centered on a large empty state.',
  component: FxBlankStateLayout,
  variants: [
    {
      label: 'default',
      props: {
        title: 'No listings yet',
        description: 'Create your first listing to start selling.',
        icon: 'package',
      },
    },
    {
      label: 'with primary action',
      props: {
        title: 'No listings yet',
        description: 'Create your first listing to start selling.',
        icon: 'package',
        actions: action,
      },
    },
    {
      label: 'with Learn more link',
      props: {
        title: 'No orders yet',
        description: 'Orders will appear here once buyers check out.',
        icon: 'card',
        learnMoreHref: '#docs',
      },
    },
    {
      label: 'custom Learn more label',
      props: {
        title: 'Nothing here',
        icon: 'info',
        learnMoreHref: '#help',
        learnMoreLabel: 'Read the guide',
      },
    },
  ],
  props: [
    { name: 'title', type: 'ReactNode', required: true, description: "What's true." },
    { name: 'description', type: 'ReactNode', description: 'What to do next.' },
    { name: 'icon', type: 'IconName', description: 'Decorative media icon.' },
    { name: 'illustration', type: 'ReactNode', description: 'Custom media illustration (overrides icon).' },
    { name: 'actions', type: 'ReactNode', description: 'Primary action slot (+ optional secondary).' },
    { name: 'learnMoreHref', type: 'string', description: 'When set, renders a secondary Learn-more link below.' },
    { name: 'learnMoreLabel', type: 'string', default: "'Learn more'", description: 'Learn-more link label.' },
  ],
  contract: { doc: '04-component-bible.md', heading: 'FxBlankStateLayout' },
};
