/**
 * QuickLinks showcase. Composes FxCard + link rows. Pure presentational (no hooks)
 * → `interactive: false`. `QuickLink` documented in `props`.
 */
import type { ShowcaseSpec } from '../showcase-types';
import { FxQuickLinks, type QuickLink } from './quick-links';

const links: QuickLink[] = [
  { label: 'Dashboard', href: '#dashboard', icon: 'home' },
  { label: 'Orders', href: '#orders', icon: 'package' },
  { label: 'Payouts', href: '#payouts', icon: 'wallet' },
  { label: 'Settings', href: '#settings', icon: 'settings' },
];

const withExternal: QuickLink[] = [
  { label: 'Help center', href: 'https://example.com/help', icon: 'info', external: true },
  { label: 'Status page', href: 'https://status.example.com', icon: 'chart', external: true },
  { label: 'Profile', href: '#profile', icon: 'users' },
];

export const quickLinksShowcase: ShowcaseSpec = {
  name: 'QuickLinks',
  slug: 'quick-links',
  category: 'layouts',
  slice: 'U7',
  status: 'ready',
  interactive: false,
  tagline: 'A card of icon + label navigation shortcuts with trailing chevrons.',
  component: FxQuickLinks,
  variants: [
    { label: '1 column', props: { links } },
    { label: '2 columns', props: { links, columns: 2 } },
    { label: 'with external links', props: { links: withExternal }, note: 'External rows open in a new tab with an external-link glyph.' },
    { label: 'custom title', props: { title: 'Shortcuts', links } },
    { label: 'no icons', props: { links: links.map((l) => ({ label: l.label, href: l.href })) } },
    { label: 'single link', props: { links: [links[0]!] } },
  ],
  props: [
    { name: 'title', type: 'string', default: "'Quick links'", description: 'Card title.' },
    { name: 'links', type: '{ label: string; href: string; icon?: IconName; external?: boolean }[]', required: true, description: 'Navigation shortcuts.' },
    { name: 'columns', type: '1 | 2', default: '1', description: '1- or 2-column grid.' },
  ],
  aria: [
    { attr: 'target/rel', value: '_blank / noopener noreferrer', note: 'On external links, with a visually-hidden "(opens in new tab)".' },
    { attr: 'aria-hidden', value: 'true', note: 'On the leading icon and trailing chevron/external glyph.' },
  ],
  contract: { doc: '04-component-bible.md', heading: 'FxQuickLinks' },
};
