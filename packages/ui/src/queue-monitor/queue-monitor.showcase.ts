/**
 * FxQueueMonitor showcase spec. The dashboard grid shows an active queue with a
 * throughput sparkline, a paused queue, and a depth crossing the danger
 * threshold; drain opens a Confirmation Dialog. First variant is non-empty
 * static markup; the freshness stamp reads honestly. `QueueAction` is a local
 * prop-only union documented as a type string (no §5 union).
 */
import type { ShowcaseSpec } from '../showcase-types';
import { FxQueueMonitor, type QueueInfo } from './queue-monitor';

const noop = () => undefined;

const queues: QueueInfo[] = [
  {
    id: 'q-checkout',
    name: 'checkout',
    depth: 42,
    oldestAgeSec: 8,
    throughputPerMin: 120,
    throughputSeries: [90, 110, 105, 130, 120, 118, 125],
    paused: false,
    failedCount: 0,
  },
  {
    id: 'q-email',
    name: 'email',
    depth: 640,
    oldestAgeSec: 340,
    throughputPerMin: 30,
    throughputSeries: [80, 60, 40, 35, 30, 28, 30],
    paused: false,
    failedCount: 12,
  },
  {
    id: 'q-payouts',
    name: 'payouts',
    depth: 0,
    oldestAgeSec: 0,
    throughputPerMin: 0,
    paused: true,
    failedCount: 3,
  },
];

export const queueMonitorShowcase: ShowcaseSpec = {
  name: 'QueueMonitor',
  slug: 'queue-monitor',
  category: 'admin',
  slice: 'U10',
  status: 'ready',
  tagline: 'Per-queue health cards with depth, throughput sparkline and an honest freshness stamp.',
  component: FxQueueMonitor,
  interactive: true,
  variants: [
    {
      label: 'dashboard grid',
      props: {
        queues,
        refreshedAt: '12s ago',
        refreshInterval: 30,
        onQueueAction: noop,
        onQueueOpen: noop,
      },
      note: 'email crosses the danger depth threshold; payouts is paused. Drain confirms first.',
    },
    {
      label: 'single paused queue',
      props: { queues: [queues[2]], refreshedAt: '4s ago', onQueueAction: noop, onQueueOpen: noop },
    },
    {
      label: 'loading',
      props: { queues: [], loading: true },
    },
    {
      label: 'empty',
      props: { queues: [], refreshedAt: '2s ago' },
    },
  ],
  props: [
    { name: 'queues', type: 'QueueInfo[]', required: true, description: 'QueueInfo = { id; name; depth; oldestAgeSec?; throughputPerMin?; paused; failedCount; throughputSeries? }.' },
    { name: 'onQueueAction', type: "(queueId, 'pause'|'resume'|'drain') => void", description: 'Pause/Resume fire immediately; drain is confirmed via a Confirmation Dialog first.' },
    { name: 'onQueueOpen', type: '(queueId: string) => void', description: 'Fired by "View jobs" (→ Background Jobs Panel).' },
    { name: 'refreshInterval', type: 'number', description: 'Auto-poll interval in seconds (informational; host owns polling).' },
    { name: 'refreshedAt', type: 'string', description: 'Honest freshness stamp, host-formatted (e.g. "12s ago").' },
    { name: 'thresholds', type: '{ warnAt; dangerAt }', default: '{ 100, 500 }', description: 'Depth → tone thresholds.' },
    { name: 'loading', type: 'boolean', default: 'false', description: 'Skeleton state.' },
    { name: 'labels', type: 'Partial<QueueMonitorLabels>', description: 'i18n overrides for every card + action + dialog string.' },
  ],
  events: [
    { name: 'onQueueAction', payload: "(queueId, 'pause'|'resume'|'drain')", description: 'A queue action was invoked (drain after confirmation).' },
    { name: 'onQueueOpen', payload: '(queueId: string)', description: '"View jobs" drill-in was pressed.' },
  ],
  keyboard: [
    { keys: 'Tab', action: 'Move through each card’s Pause/Resume, Drain and View jobs buttons.' },
    { keys: 'Enter / Space', action: 'Activate the focused action; Drain opens the Confirmation Dialog.' },
    { keys: 'Esc', action: 'Cancel the drain Confirmation Dialog.' },
  ],
  aria: [
    { attr: 'section[aria-label]', value: 'Queue monitor', note: 'The grid is a labelled region.' },
    { attr: 'role="alertdialog"', value: 'drain', note: 'Draining routes through a danger Confirmation Dialog.' },
    { attr: 'Badge + icon', value: 'paused / depth', note: 'Status pairs colour with an icon/dot (§1.7.7) — never colour alone.' },
    { attr: 'freshness', value: 'honest', note: 'The "Updated …" stamp never hides staleness (ops truth-telling).' },
  ],
  contract: { doc: '04-component-bible.md', heading: 'FxQueueMonitor — Queue Monitor' },
};
