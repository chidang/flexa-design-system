/** Nested Sidebar showcase — interactive; disclosure groups (max 2 levels). */
import type { ShowcaseSpec } from '../showcase-types';
import { FxNestedSidebar } from './nested-sidebar';

const items = [
  { key: 'dashboard', label: 'Dashboard', icon: 'home' as const, href: '/' },
  {
    key: 'reports',
    label: 'Reports',
    icon: 'chart' as const,
    children: [
      { key: 'sales', label: 'Sales', href: '/reports/sales' },
      { key: 'payouts', label: 'Payouts', href: '/reports/payouts' },
      { key: 'traffic', label: 'Traffic', href: '/reports/traffic' },
    ],
  },
  {
    key: 'settings',
    label: 'Settings',
    icon: 'settings' as const,
    children: [
      { key: 'profile', label: 'Profile', href: '/settings/profile' },
      { key: 'security', label: 'Security', href: '/settings/security' },
      { key: 'billing', label: 'Billing', href: '/settings/billing' },
    ],
  },
];

export const nestedSidebarShowcase: ShowcaseSpec = {
  name: 'Nested Sidebar',
  slug: 'nested-sidebar',
  category: 'navigation',
  slice: 'U4',
  status: 'ready',
  interactive: true,
  tagline: 'A second navigation level for sections with sub-destinations.',
  component: FxNestedSidebar,
  variants: [
    { label: 'auto-expand active', props: { items, activeKey: 'security' } },
    { label: 'collapsed groups', props: { items, activeKey: 'dashboard', autoExpandActive: false } },
    { label: 'pre-expanded', props: { items, activeKey: 'dashboard', defaultExpandedKeys: ['reports'] } },
  ],
  props: [
    { name: 'items', type: 'NestedSidebarItem[]', required: true, description: 'Items; parents carry a `children` array.' },
    { name: 'activeKey', type: 'string', description: 'Key of the active leaf.' },
    { name: 'expandedKeys / defaultExpandedKeys', type: 'string[]', description: 'Controlled / uncontrolled open parents (§1.5).' },
    { name: 'autoExpandActive', type: 'boolean', default: 'true', description: 'Expand the ancestor of the active child on mount.' },
    { name: 'header / footer', type: 'ReactNode', description: 'Pinned slots.' },
  ],
  events: [
    { name: 'onNavigate', payload: '{ key; href? }', description: 'Leaf/link chosen.' },
    { name: 'onExpandedChange', payload: 'string[]', description: 'Open parents changed.' },
  ],
  keyboard: [
    { keys: 'Tab', action: 'Move between disclosure buttons and child links' },
    { keys: 'Enter · Space', action: 'Toggle a parent disclosure' },
  ],
  aria: [
    { attr: 'aria-expanded', value: 'boolean', note: 'On parent disclosure buttons.' },
    { attr: 'aria-controls', value: 'id', note: 'Parent → child group.' },
    { attr: 'role', value: "'group'", note: 'On the child list.' },
  ],
  contract: { doc: '04-component-bible.md', heading: 'FxNestedSidebar' },
};
