/**
 * StatisticBlock showcase spec. No shared unions drive its variants; the
 * `StatisticDelta` shape is documented in `props` as a type string
 * (component-local, not shared). No `enums` map entry.
 */
import type { ShowcaseSpec } from '../showcase-types';
import { FxStatisticBlock } from './statistic-block';

export const statisticBlockShowcase: ShowcaseSpec = {
  name: 'StatisticBlock',
  slug: 'statistic-block',
  category: 'data',
  slice: 'U6',
  status: 'ready',
  tagline: 'Unstyled inline stat primitive — value + label (+ delta) as one phrase.',
  component: FxStatisticBlock,
  variants: [
    { label: 'value + label', props: { label: 'Positive feedback', value: '98%' } },
    { label: 'delta up (good)', props: { label: 'Revenue', value: '$12.4k', delta: { value: 8, direction: 'up' } } },
    { label: 'delta down (bad)', props: { label: 'Refunds', value: '$1.1k', delta: { value: 12, direction: 'down' } } },
    { label: 'delta flat', props: { label: 'Sessions', value: '3,204', delta: { value: 0, direction: 'flat' } } },
    { label: 'positiveIs down', props: { label: 'Churn', value: '2.1%', delta: { value: 5, direction: 'down', positiveIs: 'down' } }, note: 'Down = good (tone success).' },
    { label: 'with caption', props: { label: 'Orders', value: '1,240', delta: { value: 4, direction: 'up' }, caption: 'vs. last 30 days' } },
    { label: 'align start', props: { label: 'Sales', value: '1.2k', align: 'start' } },
    { label: 'align center', props: { label: 'Sales', value: '1.2k', align: 'center' } },
    { label: 'size md', props: { label: 'Uptime', value: '99.9%', size: 'md' } },
    { label: 'size lg', props: { label: 'Uptime', value: '99.9%', size: 'lg' } },
  ],
  props: [
    { name: 'label', type: 'ReactNode', required: true, description: 'Stat name.' },
    { name: 'value', type: 'ReactNode', required: true, description: 'The stat itself, e.g. "98%".' },
    { name: 'delta', type: '{ value: number; direction: "up" | "down" | "flat"; positiveIs?: "up" | "down" }', description: 'Trend (as FxMetricCard). positiveIs maps direction → tone; default "up".' },
    { name: 'caption', type: 'ReactNode', description: 'Comparison caption, e.g. "vs. last 30 days".' },
    { name: 'align', type: "'start' | 'center'", default: "'start'", description: 'Horizontal alignment.' },
    { name: 'size', type: "'md' | 'lg'", default: "'md'", description: 'Value size.' },
    { name: 'labels', type: 'Partial<StatisticBlockLabels>', description: 'Direction words for the accessible sentence: up / down / flat.' },
  ],
  aria: [
    { attr: '.fx-statistic-block-sr', value: 'visually-hidden sentence', note: '"{label}: {value}, {delta}% {direction} {caption}" — reads as one phrase.' },
    { attr: 'aria-hidden', value: 'true', note: 'On the visible value/label/delta/caption (the sentence carries them).' },
  ],
  contract: { doc: '04-component-bible.md', heading: 'FxStatisticBlock' },
};
