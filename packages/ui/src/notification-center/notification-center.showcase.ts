/**
 * FxNotificationCenter showcase spec. The bell trigger renders server-side (the
 * non-modal panel mounts client-side only), so every variant's static markup is
 * non-empty. `tone` on a NotificationItem draws from the shared `Tone` union but
 * is documented as a prop type string (no local §5 union to anchor).
 */
import type { ShowcaseSpec } from '../showcase-types';
import { FxNotificationCenter, type NotificationItem } from './notification-center';

const noop = () => undefined;

const full: NotificationItem[] = [
  { id: 'n1', kind: 'order.paid', title: 'Order #1042 was paid', body: '$69.80 · Clay & Co', at: '2026-07-17T09:10:00Z', read: false, href: '#order', tone: 'success' },
  { id: 'n2', kind: 'message.created', title: 'New message from Ada', body: '“Is the mug still available?”', at: '2026-07-17T08:30:00Z', read: false, href: '#chat', tone: 'info' },
  { id: 'n3', kind: 'payout.failed', title: 'Payout failed', body: 'Update your bank details', at: '2026-07-16T18:00:00Z', read: false, href: '#payout', tone: 'danger' },
  { id: 'n4', kind: 'listing.flagged', title: 'A listing needs review', at: '2026-07-16T12:00:00Z', read: true, href: '#listing', tone: 'warning' },
  { id: 'n5', kind: 'system.digest', title: 'Weekly summary is ready', at: '2026-07-15T07:00:00Z', read: true, href: '#digest' },
];

const allRead = full.map((n) => ({ ...n, read: true }));

export const notificationCenterShowcase: ShowcaseSpec = {
  name: 'NotificationCenter',
  slug: 'notification-center',
  category: 'collaboration',
  slice: 'U9',
  status: 'ready',
  tagline: 'A bell with an unread count opening a non-modal notification popover.',
  component: FxNotificationCenter,
  interactive: true,
  variants: [
    {
      label: 'with unread',
      props: { notifications: full, unreadCount: 3, viewAllHref: '#all', settingsHref: '#settings', onItemClick: noop, onMarkAllRead: noop, onOpenChange: noop },
      note: 'Bell shows the unread count Badge; open to see All/Unread tabs.',
    },
    {
      label: 'all read',
      props: { notifications: allRead, unreadCount: 0, viewAllHref: '#all', settingsHref: '#settings', onItemClick: noop, onMarkAllRead: noop },
      note: 'No count Badge; "Mark all read" is disabled.',
    },
    {
      label: 'empty',
      props: { notifications: [], unreadCount: 0, viewAllHref: '#all', onItemClick: noop },
    },
    {
      label: 'loading more',
      props: { notifications: full, unreadCount: 3, hasMore: true, onLoadMore: noop, onItemClick: noop, viewAllHref: '#all' },
      note: 'A "Show more" button appears below the list when hasMore is set.',
    },
  ],
  props: [
    { name: 'notifications', type: 'NotificationItem[]', required: true, description: 'Rows, newest first. NotificationItem = { id; kind; title; body?; at; read; href?; tone?: Tone; actor?: PartyRef }.' },
    { name: 'unreadCount', type: 'number', required: true, description: 'Unread total — drives the bell Badge + accessible name.' },
    { name: 'onOpenChange', type: '(open: boolean) => void', description: 'Fired when the panel opens or closes.' },
    { name: 'onItemClick', type: '(item: NotificationItem) => void', description: 'A row was activated (host navigates + marks read).' },
    { name: 'onMarkAllRead', type: '() => void', description: '"Mark all read" pressed.' },
    { name: 'viewAllHref', type: 'string', description: '"View all" footer link target.' },
    { name: 'settingsHref', type: 'string', description: 'Settings link target.' },
    { name: 'onLoadMore', type: '() => void', description: 'Load-more handler — pairs with hasMore.' },
    { name: 'hasMore', type: 'boolean', default: 'false', description: 'Whether more notifications exist beyond the current page.' },
    { name: 'labels', type: 'Partial<NotificationCenterLabels>', description: 'i18n overrides (title, markAllRead, viewAll, empty, …).' },
  ],
  events: [
    { name: 'onItemClick', payload: '(item: NotificationItem)', description: 'A notification row was activated.' },
    { name: 'onMarkAllRead', payload: '()', description: '"Mark all read" pressed (disabled when unreadCount is 0).' },
    { name: 'onOpenChange', payload: '(open: boolean)', description: 'Panel opened or closed.' },
  ],
  keyboard: [
    { keys: 'Enter / Space', action: 'Toggle the panel from the bell.' },
    { keys: 'Esc', action: 'Close the panel (non-modal — no focus trap).' },
    { keys: 'Arrow ← / →', action: 'Move between the All / Unread tabs.' },
  ],
  aria: [
    { attr: 'aria-label', value: '{count} unread notifications', note: 'Names the icon-only bell trigger with the unread count.' },
    { attr: 'aria-haspopup', value: 'dialog', note: 'The bell opens a non-modal dialog panel.' },
    { attr: 'aria-controls', value: 'panel id', note: 'Only present once the panel mounts (no dangling IDREF in static markup).' },
    { attr: 'role="dialog"', value: 'non-modal', note: 'Panel is a non-modal dialog — Esc closes, page stays interactive, no focus trap.' },
  ],
  contract: { doc: '04-component-bible.md', heading: 'FxNotificationCenter — Notification Center' },
};
