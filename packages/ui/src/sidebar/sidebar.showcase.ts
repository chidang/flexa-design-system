/** Sidebar showcase — interactive; collapsible primary navigation rail. */
import type { ShowcaseSpec } from '../showcase-types';
import { FxSidebar } from './sidebar';

const items = [
  { key: 'dashboard', label: 'Dashboard', icon: 'home' as const, href: '/', section: 'Workspace' },
  { key: 'orders', label: 'Orders', icon: 'package' as const, href: '/orders', badge: 12, section: 'Workspace' },
  { key: 'listings', label: 'Listings', icon: 'tag' as const, href: '/listings', section: 'Workspace' },
  { key: 'messages', label: 'Messages', icon: 'chat' as const, href: '/messages', badge: 3, section: 'Workspace' },
  { key: 'settings', label: 'Settings', icon: 'settings' as const, href: '/settings', section: 'System' },
];

export const sidebarShowcase: ShowcaseSpec = {
  name: 'Sidebar',
  slug: 'sidebar',
  category: 'navigation',
  slice: 'U4',
  status: 'ready',
  interactive: true,
  tagline: 'The persistent vertical navigation backbone of an app shell.',
  component: FxSidebar,
  variants: [
    { label: 'expanded', props: { items, activeKey: 'orders' } },
    { label: 'collapsed (rail)', props: { items, activeKey: 'orders', defaultCollapsed: true } },
  ],
  props: [
    { name: 'items', type: 'SidebarItem[]', required: true, description: 'Destinations (icon mandatory for rail mode).' },
    { name: 'activeKey', type: 'string', description: 'Key of the active item.' },
    { name: 'collapsed / defaultCollapsed', type: 'boolean', description: 'Controlled / uncontrolled rail state (§1.5).' },
    { name: 'header / footer', type: 'ReactNode', description: 'Pinned top and bottom slots.' },
    { name: 'ariaLabel', type: 'string', default: "'Main'", description: 'Nav landmark name (i18n).' },
    { name: 'collapseLabel / expandLabel', type: 'string', description: "'Collapse sidebar' / 'Expand sidebar' (i18n)." },
  ],
  events: [
    { name: 'onNavigate', payload: 'SidebarItem', description: 'Before route change.' },
    { name: 'onCollapsedChange', payload: 'boolean', description: 'Rail toggled.' },
  ],
  keyboard: [
    { keys: 'Tab', action: 'Move between item links and the collapse toggle (native)' },
    { keys: 'Enter · Space', action: 'Activate the collapse toggle' },
  ],
  aria: [
    { attr: 'aria-label', value: 'ariaLabel', note: 'On the nav landmark.' },
    { attr: 'aria-current', value: "'page'", note: 'On the active item.' },
    { attr: 'aria-expanded', value: 'boolean', note: 'On the collapse toggle.' },
  ],
  contract: { doc: '04-component-bible.md', heading: 'FxSidebar' },
};
