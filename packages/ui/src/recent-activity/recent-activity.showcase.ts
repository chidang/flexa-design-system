/**
 * RecentActivity showcase. Composes FxCard + a compact FxActivityFeed. Pure
 * presentational (no hooks) → `interactive: false`.
 */
import type { ShowcaseSpec } from '../showcase-types';
import { FxRecentActivity, type ActivityItem } from './recent-activity';

const now = Date.now();
const iso = (minsAgo: number): string => new Date(now - minsAgo * 60_000).toISOString();

const items: ActivityItem[] = [
  { id: 'r1', actor: { name: 'Ada Lovelace' }, verb: 'commented on', target: { label: 'Invoice #1042', href: '#i' }, at: iso(4), tone: 'info', icon: 'chat' },
  { id: 'r2', actor: { name: 'Grace Hopper' }, verb: 'approved', target: { label: 'Payout batch', href: '#p' }, at: iso(52), tone: 'success', icon: 'check' },
  { id: 'r3', actor: { name: 'Alan Turing' }, verb: 'flagged', target: { label: 'Dispute #77', href: '#d' }, at: iso(1500), tone: 'warning', icon: 'warning' },
  { id: 'r4', actor: { name: 'Katherine Johnson' }, verb: 'joined the team', at: iso(2900) },
  { id: 'r5', actor: { name: 'Edsger Dijkstra' }, verb: 'closed', target: { label: 'Order #88' }, at: iso(4000) },
  { id: 'r6', actor: { name: 'Barbara Liskov' }, verb: 'edited settings', at: iso(6000) },
];

export const recentActivityShowcase: ShowcaseSpec = {
  name: 'RecentActivity',
  slug: 'recent-activity',
  category: 'layouts',
  slice: 'U7',
  status: 'ready',
  interactive: false,
  tagline: 'Dashboard card of the latest few activity items with a "View all" link.',
  component: FxRecentActivity,
  variants: [
    { label: 'with view-all', props: { items, viewAllHref: '#all' } },
    { label: 'no footer', props: { items } },
    { label: 'custom title + label', props: { items, title: 'Team activity', viewAllHref: '#all', viewAllLabel: 'See everything' } },
    { label: 'limit 3', props: { items, limit: 3, viewAllHref: '#all' } },
    { label: 'loading', props: { items: [], loading: true } },
    { label: 'empty', props: { items: [], viewAllHref: '#all' }, note: 'Feed shows FxEmptyState when there are no items.' },
    { label: 'custom empty', props: { items: [], emptyState: { title: 'No activity', description: 'Check back soon.', icon: 'history' } } },
  ],
  props: [
    { name: 'items', type: 'ActivityItem[]', required: true, description: 'Activity items (sliced to limit).' },
    { name: 'limit', type: 'number', default: '5', description: 'Max items to show.' },
    { name: 'title', type: 'string', default: "'Recent activity'", description: 'Card title.' },
    { name: 'viewAllHref', type: 'string', description: '"View all" link target; omit to hide the footer.' },
    { name: 'viewAllLabel', type: 'string', default: "'View all activity'", description: '"View all" link text.' },
    { name: 'loading', type: 'boolean', default: 'false', description: 'Forwarded to the feed loading state.' },
    { name: 'emptyState', type: '{ title: string; description?: string; icon?: IconName }', description: 'Forwarded to the feed empty state.' },
    { name: 'locale', type: 'string', description: 'BCP-47 locale for date/time formatting.' },
  ],
  aria: [
    { attr: 'role', value: 'feed', note: 'The inner FxActivityFeed keeps its feed/article semantics.' },
  ],
  contract: { doc: '04-component-bible.md', heading: 'FxRecentActivity' },
};
