/**
 * ActivityFeed showcase. Pure presentational (no hooks) → `interactive: false`.
 * `ActivityItem`/`Tone` shapes are documented in `props` as type strings
 * (Tone is a shared union but not directly a top-level prop, so no `enums` map).
 */
import type { ShowcaseSpec } from '../showcase-types';
import { FxActivityFeed, type ActivityItem } from './activity-feed';

const now = Date.now();
const iso = (minsAgo: number): string => new Date(now - minsAgo * 60_000).toISOString();

const items: ActivityItem[] = [
  {
    id: 'a1',
    actor: { name: 'Ada Lovelace' },
    verb: 'commented on',
    target: { label: 'Invoice #1042', href: '#invoice-1042' },
    at: iso(4),
    tone: 'info',
    icon: 'chat',
  },
  {
    id: 'a2',
    actor: { name: 'Grace Hopper' },
    verb: 'approved',
    target: { label: 'Payout batch', href: '#payout' },
    at: iso(52),
    tone: 'success',
    icon: 'check',
  },
  {
    id: 'a3',
    actor: { name: 'Alan Turing' },
    verb: 'flagged',
    target: { label: 'Dispute #77', href: '#dispute-77' },
    at: iso(1500),
    tone: 'warning',
    icon: 'warning',
  },
  {
    id: 'a4',
    actor: { name: 'Katherine Johnson' },
    verb: 'uploaded a new avatar',
    at: iso(2900),
  },
];

export const activityFeedShowcase: ShowcaseSpec = {
  name: 'ActivityFeed',
  slug: 'activity-feed',
  category: 'layouts',
  slice: 'U7',
  status: 'ready',
  interactive: false,
  tagline: 'Chronological activity stream — avatar + rich sentence + relative time.',
  component: FxActivityFeed,
  variants: [
    { label: 'grouped by day', props: { items } },
    { label: 'flat (no grouping)', props: { items, groupByDay: false } },
    { label: 'with load-more', props: { items: items.slice(0, 2), groupByDay: false, hasMore: true, onLoadMore: () => {} } },
    { label: 'custom more label', props: { items: items.slice(0, 2), groupByDay: false, hasMore: true, onLoadMore: () => {}, moreLabel: 'Load earlier' } },
    { label: 'loading', props: { items: [], loading: true } },
    { label: 'empty', props: { items: [] }, note: 'Renders FxEmptyState when empty & not loading.' },
    {
      label: 'custom empty state',
      props: { items: [], emptyState: { title: 'Nothing here yet', description: 'Activity from your team will appear here.', icon: 'history' } },
    },
    { label: 'single item', props: { items: items.slice(0, 1), groupByDay: false } },
  ],
  props: [
    { name: 'items', type: 'ActivityItem[]', required: true, description: 'Rows, newest first: { id; actor:{name;avatarSrc?}; verb; target?:{label;href?}; at:ISO; icon?; tone? }.' },
    { name: 'loading', type: 'boolean', default: 'false', description: 'Show a loading affordance instead of the empty state.' },
    { name: 'emptyState', type: '{ title: string; description?: string; icon?: IconName }', description: 'Rendered via FxEmptyState when empty & not loading.' },
    { name: 'onLoadMore', type: '() => void', description: 'Load-more handler (pairs with hasMore).' },
    { name: 'hasMore', type: 'boolean', default: 'false', description: 'Whether more items exist beyond the current page.' },
    { name: 'groupByDay', type: 'boolean', default: 'true', description: 'Group items under sticky calendar-day headers.' },
    { name: 'moreLabel', type: 'string', default: "'Show more'", description: 'Load-more button text.' },
    { name: 'locale', type: 'string', description: 'BCP-47 locale for date/time formatting.' },
    { name: 'label', type: 'string', default: "'Activity'", description: 'Accessible name for the feed region.' },
  ],
  events: [{ name: 'onLoadMore', payload: 'void', description: 'Fires when the load-more button is activated.' }],
  aria: [
    { attr: 'role', value: 'feed', note: 'On the root; each row is role="article" with aria-posinset/aria-setsize.' },
    { attr: 'aria-label', value: 'plain-text sentence', note: 'Each article names itself with "{actor} {verb} {target}".' },
    { attr: 'role', value: 'status', note: 'A visually-hidden polite live region announces new items.' },
    { attr: '<time dateTime>', value: 'ISO of item.at', note: 'Machine-readable timestamp with a short relative label.' },
  ],
  contract: { doc: '04-component-bible.md', heading: 'FxActivityFeed' },
};
