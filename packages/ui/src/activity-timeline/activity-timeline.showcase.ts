/**
 * FxActivityTimeline showcase spec. Reuses the §3.3 `ActivityItem` shape; items
 * span multiple calendar days so the day-grouping is visible, and a `filterOf`
 * predicate buckets by verb so the filter Chips narrow the rail. No local §5
 * union to anchor — filter ids are host-defined strings.
 */
import type { ShowcaseSpec } from '../showcase-types';
import type { ActivityItem } from '../activity-feed/activity-feed';
import { FxActivityTimeline } from './activity-timeline';

const noop = () => undefined;

const ada = { name: 'Ada Lovelace', avatarSrc: 'https://picsum.photos/seed/ada/48' };
const clay = { name: 'Clay & Co' };

const items: ActivityItem[] = [
  { id: 'a1', actor: ada, verb: 'commented on', target: { label: 'Order #1042', href: '#o' }, at: '2026-07-17T09:10:00Z', tone: 'info', icon: 'chat' },
  { id: 'a2', actor: clay, verb: 'shipped', target: { label: 'Order #1042', href: '#o' }, at: '2026-07-17T08:00:00Z', tone: 'success', icon: 'package' },
  { id: 'a3', actor: ada, verb: 'paid for', target: { label: 'Order #1042', href: '#o' }, at: '2026-07-16T14:20:00Z', tone: 'success', icon: 'card' },
  { id: 'a4', actor: clay, verb: 'updated', target: { label: 'the listing', href: '#l' }, at: '2026-07-15T11:00:00Z', tone: 'info', icon: 'edit' },
];

const filters = [
  { id: 'commented on', label: 'Comments' },
  { id: 'shipped', label: 'Shipping' },
  { id: 'paid for', label: 'Payments' },
];

const filterOf = (it: ActivityItem) => it.verb;

export const activityTimelineShowcase: ShowcaseSpec = {
  name: 'ActivityTimeline',
  slug: 'activity-timeline',
  category: 'collaboration',
  slice: 'U9',
  status: 'ready',
  tagline: 'Entity-scoped actor history on a day-grouped rail, filterable by kind.',
  component: FxActivityTimeline,
  interactive: true,
  variants: [
    {
      label: 'multiple days',
      props: { items, filters, filterOf, onFilterChange: noop },
      note: 'Items span three days → each day gets its own heading + rail.',
    },
    {
      label: 'active filter (Shipping)',
      props: { items, filters, filterOf, defaultActiveFilters: ['shipped'], onFilterChange: noop },
      note: 'Only items whose verb bucket is selected remain.',
    },
    {
      label: 'load more',
      props: { items, filters, filterOf, hasMore: true, onLoadMore: noop },
    },
    {
      label: 'no filters',
      props: { items },
    },
  ],
  props: [
    { name: 'items', type: 'ActivityItem[]', required: true, description: 'Events newest-first (§3.3 shape): { id; actor { name; avatarSrc? }; verb; target?; at; icon?; tone? }.' },
    { name: 'filters', type: '{ id; label }[]', description: 'Filter chips by event kind. Omit to hide the filter row.' },
    { name: 'activeFilters', type: 'string[]', description: 'Controlled active filter ids (§1.5).' },
    { name: 'defaultActiveFilters', type: 'string[]', default: '[]', description: 'Uncontrolled initial active filter ids.' },
    { name: 'filterOf', type: '(item: ActivityItem) => string', description: 'Maps an item to a filter id so chips can narrow the list.' },
    { name: 'onFilterChange', type: '(ids: string[]) => void', description: 'Fired when the active filter set changes.' },
    { name: 'onLoadMore', type: '() => void', description: 'Load-more handler — pairs with hasMore.' },
    { name: 'hasMore', type: 'boolean', default: 'false', description: 'Whether more events exist beyond the current page.' },
    { name: 'labels', type: 'Partial<ActivityTimelineLabels>', description: 'i18n overrides (showMore, empty).' },
  ],
  events: [
    { name: 'onFilterChange', payload: '(ids: string[])', description: 'The active filter set changed.' },
    { name: 'onLoadMore', payload: '()', description: 'Load-more button pressed.' },
  ],
  keyboard: [
    { keys: 'Tab', action: 'Move through filter chips, links and the load-more button.' },
    { keys: 'Enter / Space', action: 'Toggle a filter chip.' },
  ],
  aria: [
    { attr: 'aria-label', value: 'Activity', note: 'Names the timeline section (and its filter group).' },
    { attr: 'role="group"', value: 'filters', note: 'The filter chip row is a labelled group.' },
    { attr: '<time>', value: 'dateTime', note: 'Each event carries a machine-readable relative time.' },
  ],
  contract: { doc: '04-component-bible.md', heading: 'FxActivityTimeline — Activity Timeline' },
};
