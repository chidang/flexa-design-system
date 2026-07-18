/** Sidebar Layout showcase — generic two-pane shell (fixed aside + fluid main). */
import type { ShowcaseSpec } from '../showcase-types';
import { FxSidebarLayout } from './sidebar-layout';

export const sidebarLayoutShowcase: ShowcaseSpec = {
  name: 'Sidebar Layout',
  slug: 'sidebar-layout',
  category: 'layouts',
  slice: 'U7',
  status: 'ready',
  tagline: 'A fixed-width start pane beside a fluid main column.',
  component: FxSidebarLayout,
  variants: [
    { label: 'default (256px aside)', props: { aside: 'Navigation', children: 'Main content' } },
    { label: 'narrow aside (208px)', props: { asideWidth: 'sm', aside: 'Navigation', children: 'Main content' } },
  ],
  props: [
    { name: 'aside', type: 'ReactNode', required: true, description: 'Start pane content (usually an FxSidebar).' },
    { name: 'asideWidth', type: "'sm' | 'md'", default: "'md'", description: 'Fixed pane width (208 / 256px).' },
    { name: 'collapsible', type: 'boolean', default: 'true', description: 'Aside narrows to an icon rail at the tablet breakpoint.' },
    { name: 'stickyAside', type: 'boolean', default: 'true', description: 'Aside sticks while the main column scrolls.' },
    { name: 'children', type: 'ReactNode', description: 'Fluid main column.' },
  ],
  aria: [
    { attr: '—', value: '—', note: 'Not a landmark; children bring their own roles.' },
  ],
  contract: { doc: '04-component-bible.md', heading: 'FxSidebarLayout' },
};
