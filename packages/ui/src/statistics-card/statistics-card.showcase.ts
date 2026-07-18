/**
 * StatisticsCard showcase spec. Metrics reuse `FxMetricCardProps` (documented in
 * `props` as a type string); the range control is an FxSelect driven by
 * `rangeOptions`. No `enums` map entry.
 */
import type { ShowcaseSpec } from '../showcase-types';
import type { FxMetricCardProps } from '../metric-card/metric-card';
import { FxStatisticsCard } from './statistics-card';

const metrics: FxMetricCardProps[] = [
  { label: 'Revenue', value: '$48.2k', delta: { value: 8, direction: 'up' } },
  { label: 'Orders', value: '1,240', delta: { value: 4, direction: 'up' } },
  { label: 'Refunds', value: '$1.1k', delta: { value: 12, direction: 'down' } },
  { label: 'AOV', value: '$38.90', delta: { value: 2, direction: 'up' } },
];

export const statisticsCardShowcase: ShowcaseSpec = {
  name: 'StatisticsCard',
  slug: 'statistics-card',
  category: 'layouts',
  slice: 'U7',
  status: 'ready',
  interactive: true,
  tagline: 'Multi-metric analytical block — a row of Metric Cards + optional chart.',
  component: FxStatisticsCard,
  variants: [
    { label: 'two metrics', props: { title: 'This week', metrics: metrics.slice(0, 2) } },
    { label: 'four metrics', props: { title: 'Overview', metrics } },
    { label: 'with range control', props: { title: 'Sales', metrics: metrics.slice(0, 3), rangeOptions: [ { value: '7d', label: 'Last 7 days' }, { value: '30d', label: 'Last 30 days' }, { value: '90d', label: 'Last 90 days' } ], defaultRange: '30d' } },
    { label: 'loading', props: { title: 'Loading', metrics: metrics.slice(0, 3), loading: true } },
  ],
  props: [
    { name: 'title', type: 'string', required: true, description: 'Block title.' },
    { name: 'metrics', type: 'FxMetricCardProps[]', required: true, description: '1–4 metrics rendered as FxMetricCards in the primary row.' },
    { name: 'chart', type: 'ReactNode', description: 'Optional chart slot (a Charts Container / chart node).' },
    { name: 'range', type: 'string', description: 'Controlled selected range value.' },
    { name: 'defaultRange', type: 'string', description: 'Uncontrolled initial range value.' },
    { name: 'onRangeChange', type: '(range: string) => void', description: 'Range change handler.' },
    { name: 'rangeOptions', type: '{ value: string; label: string }[]', description: 'Range choices — rendered with FxSelect when present.' },
    { name: 'rangeLabel', type: 'string', default: "'Time range'", description: 'Accessible label for the range control.' },
    { name: 'breakdown', type: 'ReactNode', description: 'Optional breakdown (an FxDescriptionList node).' },
    { name: 'loading', type: 'boolean', default: 'false', description: 'Skeleton metrics while loading.' },
  ],
  aria: [
    { attr: 'aria-label', value: 'rangeLabel', note: 'On the range FxSelect (no visible label).' },
  ],
  contract: { doc: '04-component-bible.md', heading: 'FxStatisticsCard — Statistics Card' },
};
