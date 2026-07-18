/**
 * MetricCard showcase spec. The `MetricCardDelta` shape mirrors FxStatisticBlock
 * and is documented in `props` as a type string (component-local, not a shared
 * union). No `enums` map entry.
 */
import type { ShowcaseSpec } from '../showcase-types';
import { FxMetricCard } from './metric-card';

export const metricCardShowcase: ShowcaseSpec = {
  name: 'MetricCard',
  slug: 'metric-card',
  category: 'layouts',
  slice: 'U7',
  status: 'ready',
  tagline: 'Single-KPI dashboard tile — value + label + trend, read as one phrase.',
  component: FxMetricCard,
  variants: [
    { label: 'value + label', props: { label: 'Active users', value: '12,480' } },
    { label: 'Money value', props: { label: 'Revenue', value: { amount: 1240000, currency: 'USD' } } },
    { label: 'delta up (good)', props: { label: 'Signups', value: '1,204', delta: { value: 8, direction: 'up' } } },
    { label: 'delta down (bad)', props: { label: 'Refunds', value: '$1.1k', delta: { value: 12, direction: 'down' } } },
    { label: 'delta flat', props: { label: 'Sessions', value: '3,204', delta: { value: 0, direction: 'flat' } } },
    { label: 'positiveIs down', props: { label: 'Churn', value: '2.1%', delta: { value: 5, direction: 'down', positiveIs: 'down' } }, note: 'Down = good (tone success).' },
    { label: 'with caption', props: { label: 'Orders', value: '1,240', delta: { value: 4, direction: 'up' }, caption: 'vs. last 30 days' } },
    { label: 'with unit', props: { label: 'Latency', value: 214, unit: 'ms', delta: { value: 3, direction: 'down', positiveIs: 'down' } } },
    { label: 'with info', props: { label: 'MRR', value: '$48.2k', info: 'Monthly recurring revenue at period end.' } },
    { label: 'with sparkline', props: { label: 'Traffic', value: '92.4k', delta: { value: 6, direction: 'up' }, sparkline: [3, 5, 4, 7, 6, 9, 8, 11] } },
    { label: 'drill-down (interactive)', props: { label: 'Open tickets', value: 42, href: '#tickets', delta: { value: 9, direction: 'up', positiveIs: 'down' } } },
    { label: 'loading', props: { label: 'Loading', value: '—', loading: true } },
    { label: 'size sm', props: { label: 'Uptime', value: '99.9%', size: 'sm' } },
  ],
  props: [
    { name: 'label', type: 'string', required: true, description: 'Metric name.' },
    { name: 'value', type: 'string | number | Money', required: true, description: 'The KPI. Money renders locale-formatted via Intl.NumberFormat.' },
    { name: 'delta', type: '{ value: number; direction: "up" | "down" | "flat"; positiveIs?: "up" | "down" }', description: 'Trend. positiveIs maps direction → tone; default "up".' },
    { name: 'caption', type: 'string', description: 'Comparison caption, e.g. "vs. last 30 days".' },
    { name: 'sparkline', type: 'number[]', description: 'Decorative trend line (aria-hidden), primary stroke.' },
    { name: 'loading', type: 'boolean', default: 'false', description: 'Skeleton value/delta with stable dimensions.' },
    { name: 'href', type: 'string', description: 'Whole-card drill-down target (FxCard interactive).' },
    { name: 'onClick', type: '() => void', description: 'Whole-card drill-down handler.' },
    { name: 'info', type: 'string', description: 'Definition tooltip on the ⓘ trigger.' },
    { name: 'unit', type: 'string', description: 'Unit appended after the value, e.g. "ms".' },
    { name: 'locale', type: 'string', description: 'Locale for Money formatting.' },
    { name: 'size', type: "'md' | 'sm'", default: "'md'", description: 'Value size.' },
  ],
  aria: [
    { attr: '.fx-statistic-block-sr', value: 'visually-hidden sentence', note: '"{label}: {value}, {delta}% {direction} {caption}" — reads as one phrase.' },
    { attr: 'aria-hidden', value: 'true', note: 'On the sparkline and the decorative trend glyph.' },
  ],
  contract: { doc: '04-component-bible.md', heading: 'FxMetricCard — Metric Card' },
};
