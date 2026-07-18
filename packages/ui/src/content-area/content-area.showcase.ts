/** Content Area showcase — the routed page body (breadcrumb + h1 + actions). */
import type { ShowcaseSpec } from '../showcase-types';
import { FxContentArea } from './content-area';

const breadcrumb = [
  { label: 'Home', href: '/' },
  { label: 'Orders', href: '/orders' },
  { label: 'Order #1024' },
];

export const contentAreaShowcase: ShowcaseSpec = {
  name: 'Content Area',
  slug: 'content-area',
  category: 'layouts',
  slice: 'U7',
  status: 'ready',
  tagline: 'The routed page body — breadcrumb, page title, actions, and content.',
  component: FxContentArea,
  variants: [
    {
      label: 'with breadcrumb',
      props: { title: 'Order #1024', breadcrumb, children: 'Page content goes here.' },
    },
    {
      label: 'plain title (full width)',
      props: { title: 'Dashboard', maxWidth: 'full', children: 'Page content goes here.' },
    },
  ],
  props: [
    { name: 'title', type: 'string', required: true, description: 'The page heading — rendered as the h1.' },
    { name: 'breadcrumb', type: 'BreadcrumbItem[]', description: 'Hierarchy trail above the title.' },
    { name: 'actions', type: 'ReactNode', description: 'Page-level buttons (host keeps at most one primary).' },
    { name: 'maxWidth', type: "'md' | 'lg' | 'xl' | 'full'", default: "'xl'", description: 'Container cap for the column.' },
    { name: 'id', type: 'string', description: 'Target id for a shell skip-link / main.' },
    { name: 'ariaLabel', type: 'string', description: 'Landmark name (defaults to title, i18n).' },
  ],
  keyboard: [
    { keys: 'Tab', action: 'Move through breadcrumb links, then actions (native)' },
  ],
  aria: [
    { attr: 'role', value: 'main', note: 'Rendered as a <main> landmark.' },
    { attr: 'tabindex', value: '-1', note: 'On the title, so route changes can move focus to it.' },
    { attr: 'aria-current', value: "'page'", note: 'On the last breadcrumb item.' },
  ],
  contract: { doc: '04-component-bible.md', heading: 'FxContentArea' },
};
