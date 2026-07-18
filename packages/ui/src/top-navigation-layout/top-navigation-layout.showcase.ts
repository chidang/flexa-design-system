/** Top Navigation Layout showcase — sticky top bar above the routed main. */
import type { ShowcaseSpec } from '../showcase-types';
import { FxTopNavigationLayout } from './top-navigation-layout';

export const topNavigationLayoutShowcase: ShowcaseSpec = {
  name: 'Top Navigation Layout',
  slug: 'top-navigation-layout',
  category: 'layouts',
  slice: 'U7',
  status: 'ready',
  tagline: 'A sticky top bar above the routed page — the top-nav-first app shell.',
  component: FxTopNavigationLayout,
  variants: [
    { label: 'default (xl)', props: { nav: 'Navigation bar', children: 'Page content' } },
    { label: 'full width, non-sticky', props: { sticky: false, maxWidth: 'full', nav: 'Navigation bar', children: 'Page content' } },
  ],
  props: [
    { name: 'nav', type: 'ReactNode', required: true, description: 'Bar content (usually an FxTopNavigation).' },
    { name: 'sticky', type: 'boolean', default: 'true', description: 'Bar sticks to the top on scroll.' },
    { name: 'maxWidth', type: "'lg' | 'xl' | 'full'", default: "'xl'", description: 'Container cap for the content column.' },
    { name: 'contentId', type: 'string', description: 'Skip-link target id for the main region.' },
    { name: 'children', type: 'ReactNode', description: 'Routed page content.' },
  ],
  aria: [
    { attr: 'role', value: 'banner', note: 'The bar is a top-level <header>.' },
    { attr: 'role', value: 'main', note: 'The content region is a <main>.' },
  ],
  contract: { doc: '04-component-bible.md', heading: 'FxTopNavigationLayout' },
};
