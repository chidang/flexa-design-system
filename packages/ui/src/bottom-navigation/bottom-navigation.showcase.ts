/** Bottom Navigation showcase — mobile fixed tab bar (3–5 destinations). */
import type { ShowcaseSpec } from '../showcase-types';
import { FxBottomNavigation } from './bottom-navigation';

const items = [
  { key: 'home', label: 'Home', icon: 'home' as const, href: '/' },
  { key: 'search', label: 'Search', icon: 'search' as const, href: '/search' },
  { key: 'orders', label: 'Orders', icon: 'package' as const, href: '/orders', badge: 4 },
  { key: 'messages', label: 'Messages', icon: 'chat' as const, href: '/messages', badge: 12 },
  { key: 'account', label: 'Account', icon: 'users' as const, href: '/account' },
];

export const bottomNavigationShowcase: ShowcaseSpec = {
  name: 'Bottom Navigation',
  slug: 'bottom-navigation',
  category: 'layouts',
  slice: 'U7',
  status: 'ready',
  tagline: 'A fixed mobile tab bar of 3–5 destinations; hidden once the sidebar takes over.',
  component: FxBottomNavigation,
  variants: [
    { label: 'labelled (5 items)', props: { items, activeKey: 'orders' } },
    { label: 'icon-only', props: { items, activeKey: 'orders', hideLabels: true } },
  ],
  props: [
    { name: 'items', type: 'BottomNavItem[]', required: true, description: '3–5 destinations (icon + label + optional badge).' },
    { name: 'activeKey', type: 'string', description: 'Key of the active item.' },
    { name: 'ariaLabel', type: 'string', default: "'Main'", description: 'Nav landmark name (i18n).' },
    { name: 'hideLabels', type: 'boolean', default: 'false', description: 'Icon-only mode; honoured only with ≥4 items.' },
  ],
  keyboard: [
    { keys: 'Tab', action: 'Move between destination links (native)' },
  ],
  aria: [
    { attr: 'aria-label', value: 'ariaLabel', note: 'On the nav landmark.' },
    { attr: 'aria-current', value: "'page'", note: 'On the active item.' },
  ],
  contract: { doc: '04-component-bible.md', heading: 'FxBottomNavigation' },
};
