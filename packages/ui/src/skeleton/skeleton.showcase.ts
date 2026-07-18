/**
 * Skeleton Loader showcase spec — shapes and multi-line text.
 */
import type { ShowcaseSpec } from '../showcase-types';
import { FxSkeletonLoader } from './skeleton';

export const skeletonShowcase: ShowcaseSpec = {
  name: 'Skeleton Loader',
  slug: 'skeleton',
  category: 'display',
  slice: 'U2',
  status: 'ready',
  interactive: false,
  tagline: 'A content placeholder that mirrors final layout while loading.',
  component: FxSkeletonLoader,
  variants: [
    { label: 'text', props: { shape: 'text', width: '12rem' } },
    { label: 'text · 3 lines', props: { shape: 'text', lines: 3, width: '16rem' } },
    { label: 'rect', props: { shape: 'rect', width: '16rem', height: '6rem' } },
    { label: 'circle', props: { shape: 'circle', width: '2.5rem' } },
    { label: 'static', props: { shape: 'text', width: '12rem', animated: false } },
  ],
  props: [
    { name: 'shape', type: "'text' | 'rect' | 'circle'", default: "'text'", description: 'Placeholder shape.' },
    { name: 'width / height', type: 'string (CSS length)', description: 'Text defaults to stable-random widths, 1em height.' },
    { name: 'lines', type: 'number', default: '1', description: 'Multi-line text convenience.' },
    { name: 'animated', type: 'boolean', default: 'true', description: 'Shimmer; dropped under prefers-reduced-motion.' },
  ],
  aria: [
    { attr: 'aria-hidden', value: 'true', note: 'Skeletons are decorative; the surface owns the loading status.' },
  ],
  contract: { doc: '04-component-bible.md', heading: 'FxSkeletonLoader' },
};
