/** Top Navigation showcase — pure/RSC banner of links + utility slots. */
import type { ShowcaseSpec } from '../showcase-types';
import { FxTopNavigation } from './top-navigation';

const items = [
  { key: 'home', label: 'Home', href: '/' },
  { key: 'browse', label: 'Browse', href: '/browse' },
  { key: 'sell', label: 'Sell', href: '/sell' },
  { key: 'pricing', label: 'Pricing', href: '/pricing' },
];

export const topNavigationShowcase: ShowcaseSpec = {
  name: 'Top Navigation',
  slug: 'top-navigation',
  category: 'navigation',
  slice: 'U4',
  status: 'ready',
  interactive: false,
  tagline: 'Horizontal primary navigation for content-first surfaces.',
  component: FxTopNavigation,
  variants: [
    { label: 'links', props: { items, activeKey: 'browse' } },
    { label: 'with notifications', props: { items, activeKey: 'home', notificationCount: 3 } },
    { label: 'notifications overflow', props: { items, activeKey: 'home', notificationCount: 128 } },
  ],
  props: [
    { name: 'items', type: 'TopNavItem[]', required: true, description: 'Destination links (2–6 recommended).' },
    { name: 'activeKey', type: 'string', description: 'Key of the current destination.' },
    { name: 'brand / search / actions', type: 'ReactNode', description: 'Logo, search, and trailing action slots.' },
    { name: 'notificationCount', type: 'number', description: 'Unread count; renders a bell trigger when defined.' },
    {
      name: 'notificationLabel',
      type: 'string',
      default: "'Notifications'",
      description: 'Accessible name for the bell trigger (i18n).',
    },
    { name: 'onNotificationsClick', type: '() => void', description: 'Host opens the notifications menu.' },
  ],
  events: [
    { name: 'onNotificationsClick', payload: 'void', description: 'Bell trigger activated.' },
  ],
  keyboard: [{ keys: 'Tab', action: 'Move across links and utility triggers (native)' }],
  aria: [
    { attr: 'role', value: "'banner'", note: 'On the top bar header.' },
    { attr: 'aria-current', value: "'page'", note: 'On the active link.' },
    { attr: 'aria-haspopup', value: "'menu'", note: 'On the notification trigger.' },
  ],
  contract: { doc: '04-component-bible.md', heading: 'FxTopNavigation' },
};
