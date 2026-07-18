/**
 * MarketplaceStatistics showcase spec. `metrics` reuses `FxMetricCardProps`
 * (documented in `props` as a type string); the range control is an FxSelect
 * driven by `rangeOptions`. No `enums` map entry — the axes are structural.
 */
import type { ShowcaseSpec } from '../showcase-types';
import type { FxMetricCardProps } from '../metric-card/metric-card';
import { FxMarketplaceStatistics } from './marketplace-statistics';

const metrics: FxMetricCardProps[] = [
  { label: 'GMV', value: { amount: 482_000_00, currency: 'USD' }, delta: { value: 8, direction: 'up' }, caption: 'vs. last 30 days' },
  { label: 'Orders', value: '12,480', delta: { value: 4, direction: 'up' } },
  { label: 'Active listings', value: '3,204', delta: { value: 2, direction: 'down' } },
  { label: 'Take rate', value: '8.5%', delta: { value: 0, direction: 'flat' } },
];

const rangeOptions = [
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: '90d', label: 'Last 90 days' },
];

export const marketplaceStatisticsShowcase: ShowcaseSpec = {
  name: 'MarketplaceStatistics',
  slug: 'marketplace-statistics',
  category: 'commerce',
  slice: 'U8',
  status: 'ready',
  interactive: true,
  tagline: 'An admin-dashboard KPI band — a responsive grid of Metric Cards with a range selector.',
  component: FxMarketplaceStatistics,
  variants: [
    { label: '4 metrics', props: { title: 'Marketplace overview', metrics } },
    { label: 'with range', props: { title: 'Marketplace overview', metrics, rangeOptions, defaultRange: '30d' } },
    { label: 'loading', props: { title: 'Marketplace overview', metrics, loading: true } },
  ],
  props: [
    { name: 'metrics', type: 'FxMetricCardProps[]', required: true, description: 'The KPI tiles, passed through to FxMetricCard verbatim.' },
    { name: 'title', type: 'string', description: 'Optional visible band heading (also the accessible name).' },
    { name: 'range', type: 'string', description: 'Controlled selected range value.' },
    { name: 'defaultRange', type: 'string', description: 'Uncontrolled initial range value.' },
    { name: 'onRangeChange', type: '(range: string) => void', description: 'Range change handler.' },
    { name: 'rangeOptions', type: '{ value: string; label: string }[]', description: 'Range choices — rendered with FxSelect when present.' },
    { name: 'chart', type: 'ReactNode', description: 'Optional Charts Container / chart node under the KPI band.' },
    { name: 'columns', type: 'number', default: '4', description: 'Grid column count at the widest breakpoint (collapses to 2 at 1024px, 1 at 640px).' },
    { name: 'loading', type: 'boolean', default: 'false', description: 'Skeleton metrics while loading.' },
    { name: 'labels', type: 'Partial<MarketplaceStatisticsLabels>', description: 'i18n label overrides (rangeLabel, regionLabel).' },
  ],
  aria: [
    { attr: 'aria-label', value: 'regionLabel', note: 'On the <section> band when there is no visible title.' },
    { attr: 'aria-label', value: 'rangeLabel', note: 'On the range FxSelect (no visible label).' },
  ],
  contract: { doc: '04-component-bible.md', heading: 'FxMarketplaceStatistics — Marketplace Statistics' },
};
