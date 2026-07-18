/**
 * ProgressSummary showcase. Composes FxCard + FxProgress rows. Pure presentational
 * (no hooks) → `interactive: false`. `ProgressSummaryItem` documented in `props`.
 */
import type { ShowcaseSpec } from '../showcase-types';
import { FxProgressSummary, type ProgressSummaryItem } from './progress-summary';

const items: ProgressSummaryItem[] = [
  { id: 'p1', label: 'Onboarding', value: 8, max: 10, tone: 'success' },
  { id: 'p2', label: 'Verification', value: 3, max: 5, tone: 'info' },
  { id: 'p3', label: 'Listings', value: 2, max: 8, tone: 'warning' },
];

const linked: ProgressSummaryItem[] = [
  { id: 'l1', label: 'Profile', value: 90, tone: 'success', href: '#profile' },
  { id: 'l2', label: 'Payments', value: 40, tone: 'info', href: '#payments' },
];

export const progressSummaryShowcase: ShowcaseSpec = {
  name: 'ProgressSummary',
  slug: 'progress-summary',
  category: 'layouts',
  slice: 'U7',
  status: 'ready',
  interactive: false,
  tagline: 'A card of labelled progress bars with per-row and optional overall totals.',
  component: FxProgressSummary,
  variants: [
    { label: 'basic', props: { title: 'Setup progress', items } },
    { label: 'with overall', props: { title: 'Setup progress', items, showOverall: true } },
    { label: 'linked rows', props: { title: 'Completion', items: linked } },
    { label: 'percent format', props: { title: 'Completion', items: linked, format: '{value}%' } },
    { label: 'custom overall label', props: { title: 'Setup', items, showOverall: true, overallLabel: 'Total' } },
    { label: 'size sm', props: { title: 'Setup', items, size: 'sm' } },
    { label: 'size lg', props: { title: 'Setup', items, size: 'lg' } },
  ],
  props: [
    { name: 'title', type: 'string', required: true, description: 'Card title.' },
    { name: 'items', type: '{ id; label; value; max?; tone?; href? }[]', required: true, description: 'Progress rows. max defaults to 100; linked rows render as <a>.' },
    { name: 'showOverall', type: 'boolean', default: 'false', description: 'Aggregate value/max across items into an overall bar.' },
    { name: 'format', type: 'string', default: "'{value}/{max}'", description: 'Value template interpolated per row with {value}/{max}.' },
    { name: 'overallLabel', type: 'string', default: "'Overall'", description: 'Label for the aggregate row.' },
    { name: 'size', type: "'sm' | 'md' | 'lg'", default: "'md'", description: 'Bar height (FxProgress size).' },
  ],
  aria: [
    { attr: 'aria-labelledby', value: 'row label id', note: 'Each bar is named by its row label; linked rows carry it too.' },
    { attr: 'role', value: 'progressbar', note: 'Each FxProgress exposes aria-valuemin/max/now.' },
  ],
  contract: { doc: '04-component-bible.md', heading: 'FxProgressSummary' },
};
