/** App Shell showcase — the one shell per app (sidebar + topbar + main). */
import type { ShowcaseSpec } from '../showcase-types';
import { FxAppShell } from './app-shell';

const navigation = [
  { key: 'dashboard', label: 'Dashboard', icon: 'home' as const, href: '/', section: 'Workspace' },
  { key: 'orders', label: 'Orders', icon: 'package' as const, href: '/orders', badge: 8, section: 'Workspace' },
  { key: 'listings', label: 'Listings', icon: 'tag' as const, href: '/listings', section: 'Workspace' },
  { key: 'settings', label: 'Settings', icon: 'settings' as const, href: '/settings', section: 'System' },
];

export const appShellShowcase: ShowcaseSpec = {
  name: 'App Shell',
  slug: 'app-shell',
  category: 'layouts',
  slice: 'U7',
  status: 'ready',
  interactive: true,
  tagline: 'The one shell per app — sidebar, optional topbar, and the single main.',
  component: FxAppShell,
  variants: [
    { label: 'default', props: { navigation, activeKey: 'orders', children: 'Page content' } },
    { label: 'collapsed rail, compact', props: { navigation, activeKey: 'orders', defaultSidebarCollapsed: true, density: 'compact', children: 'Page content' } },
  ],
  props: [
    { name: 'navigation', type: 'SidebarItem[]', required: true, description: 'Sidebar destinations.' },
    { name: 'topbar', type: 'ReactNode', description: 'Banner slot above the content.' },
    { name: 'activeKey', type: 'string', description: 'Active destination key.' },
    { name: 'sidebarCollapsed / defaultSidebarCollapsed', type: 'boolean', description: 'Controlled / uncontrolled rail state.' },
    { name: 'density', type: "'comfortable' | 'compact'", default: "'comfortable'", description: 'Vertical rhythm of the shell.' },
    { name: 'skipToContentLabel', type: 'string', default: "'Skip to content'", description: 'Skip-link text — the first tab stop (i18n).' },
  ],
  events: [
    { name: 'onSidebarCollapsedChange', payload: 'boolean', description: 'Sidebar rail toggled.' },
  ],
  keyboard: [
    { keys: 'Tab', action: 'First stop is the skip link, which jumps focus to the main' },
    { keys: 'F6', action: 'Cycle landmark regions (recommended host binding)' },
  ],
  aria: [
    { attr: 'role', value: 'banner', note: 'On the topbar (when present).' },
    { attr: 'role', value: 'main', note: 'Exactly one, with a stable id targeted by the skip link.' },
    { attr: 'href', value: '#<contentId>', note: 'Skip link targets the main in the same markup.' },
  ],
  contract: { doc: '04-component-bible.md', heading: 'FxAppShell' },
};
