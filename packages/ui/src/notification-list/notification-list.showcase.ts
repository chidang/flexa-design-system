/**
 * FxNotificationList showcase spec (P-E1, ui-kit doc 14 §11 G2). The full-page
 * sibling of FxNotificationCenter — variants cover day-grouped feeds (mixed
 * tones, read/unread), a single group, custom heading level and the empty
 * state. `formatTime` is pinned in variants so the demo grid is deterministic.
 */
import type { ShowcaseSpec } from '../showcase-types';
import type { NotificationItem } from '../notification-center/notification-center';
import { FxNotificationList } from './notification-list';

const noop = () => undefined;

const item = (
  id: string,
  title: string,
  overrides: Partial<NotificationItem> = {},
): NotificationItem => ({
  id,
  kind: 'order.paid',
  title,
  body: 'Order #1042 — Ceramic mug ×2',
  at: '2026-07-15T09:05:00Z',
  read: false,
  tone: 'neutral',
  ...overrides,
});

const today = [
  item('n1', 'Escrow released', { kind: 'escrow.released', tone: 'success', body: 'Funds for order #1042 were released to Clay & Co.' }),
  item('n2', 'New message from Clay & Co', { kind: 'message.created', tone: 'info', body: '“Your parcel ships tomorrow morning.”', href: '#thread' }),
  item('n3', 'Dispute update', { kind: 'dispute.updated', tone: 'danger', body: 'The seller responded to your dispute on order #1017.' }),
];

const yesterday = [
  item('n4', 'Order delivered', { kind: 'order.delivered', tone: 'success', read: true, body: 'Order #1042 was marked delivered.' }),
  item('n5', 'Payout scheduled', { kind: 'payout.scheduled', tone: 'warning', read: true, body: 'Your refund of $12.40 arrives in 2–3 business days.' }),
  item('n6', 'Welcome to Flexa', { kind: 'account.created', read: true, body: 'Finish setting up your profile to start selling.' }),
];

const fixedTime = (iso: string) =>
  new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: 'UTC' });

export const notificationListShowcase: ShowcaseSpec = {
  name: 'NotificationList',
  slug: 'notification-list',
  category: 'collaboration',
  slice: 'P-E1',
  status: 'ready',
  tagline: 'Full-page notification feed — day-group headings over tone-badged, unread-dotted rows.',
  component: FxNotificationList,
  variants: [
    {
      label: 'day groups · mixed tones',
      props: {
        groups: [
          { label: 'Jul 15, 2026', items: today },
          { label: 'Jul 14, 2026', items: yesterday },
        ],
        formatTime: fixedTime,
        onItemClick: noop,
      },
    },
    {
      label: 'single group · unread only',
      props: {
        groups: [{ label: 'Today', items: today }],
        formatTime: fixedTime,
        onItemClick: noop,
      },
    },
    {
      label: 'heading level 3 (nested outline)',
      props: {
        groups: [{ label: 'Earlier', items: yesterday }],
        headingLevel: 3,
        formatTime: fixedTime,
      },
      note: 'Group headings fit the host page outline via headingLevel.',
    },
    {
      label: 'empty',
      props: { groups: [] },
      note: 'All-caught-up copy; the host usually swaps in a richer FxEmptyState.',
    },
  ],
  props: [
    { name: 'groups', type: 'NotificationGroup[]', required: true, description: 'NotificationGroup = { label; items: NotificationItem[] } — the feed already bucketed by the host (day groups, Today/Earlier, …). Shares NotificationItem with FxNotificationCenter.' },
    { name: 'onItemClick', type: '(item: NotificationItem) => void', description: 'A row was activated — host marks it read and deep-links.' },
    { name: 'headingLevel', type: '2 | 3 | 4', default: '2', description: 'Heading element for group labels, fitting the page outline.' },
    { name: 'formatTime', type: '(iso: string) => string', description: 'Row time label. Defaults to a locale hour:minute of item.at.' },
    { name: 'locale', type: 'string', description: 'BCP-47 locale for the default time formatting.' },
    { name: 'labels', type: 'Partial<NotificationListLabels>', description: 'i18n overrides (empty copy, unread state word, group list name).' },
  ],
  events: [
    { name: 'onItemClick', payload: '(item: NotificationItem)', description: 'Row activated (Enter / click) — navigation and mark-read stay host-side.' },
  ],
  aria: [
    { attr: 'section > h2', value: 'group label', note: 'Each group is a section headed by its label (level via headingLevel).' },
    { attr: 'ul[aria-label]', value: 'Notifications from {group}', note: 'Each group list carries an accessible name derived from its label.' },
    { attr: '.fx-notification-list-dot', value: 'visually-hidden "Unread"', note: 'Unread state lives in text, never colour alone.' },
  ],
};
