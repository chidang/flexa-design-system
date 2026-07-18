/**
 * Progress showcase spec — determinate values, tones, sizes, indeterminate.
 */
import type { ShowcaseSpec } from '../showcase-types';
import { SIZES, TONES } from '../enums';
import { FxProgress } from './progress';

export const progressShowcase: ShowcaseSpec = {
  name: 'Progress',
  slug: 'progress',
  category: 'display',
  slice: 'U2',
  status: 'ready',
  interactive: false,
  tagline: 'A determinate or indeterminate progress bar.',
  component: FxProgress,
  variants: [
    { label: '0%', props: { value: 0, label: 'Upload progress' } },
    { label: '40%', props: { value: 40, label: 'Upload progress', showValue: true } },
    { label: '100%', props: { value: 100, tone: 'success', label: 'Complete', showValue: true } },
    { label: 'indeterminate', props: { value: null, label: 'Loading' } },
    ...TONES.map((tone) => ({ label: tone, props: { value: 65, tone, label: `${tone} progress` } })),
    ...SIZES.map((size) => ({ label: `size ${size}`, props: { value: 50, size, label: `${size} progress` } })),
  ],
  enums: { tone: TONES, size: SIZES },
  props: [
    { name: 'value', type: 'number | null', default: 'null', description: '0–100; null = indeterminate.' },
    { name: 'tone', type: "'neutral' | 'info' | 'success' | 'warning' | 'danger'", default: "'neutral'", description: 'Outcome tone (neutral/info render primary fill).' },
    { name: 'size', type: "'sm' | 'md' | 'lg'", default: "'md'", description: 'Bar height.' },
    { name: 'label', type: 'string', description: 'Accessible name (required if no visible label).' },
    { name: 'showValue', type: 'boolean', default: 'false', description: 'Render the value as % text.' },
    { name: 'formatValue', type: '(v: number) => string', default: "'{v}%'", description: 'Drives text + aria-valuetext.' },
  ],
  aria: [
    { attr: 'role', value: 'progressbar', note: 'On the track.' },
    { attr: 'aria-valuenow', value: 'number', note: 'Omitted when indeterminate.' },
    { attr: 'aria-valuemin / aria-valuemax', value: '0 / 100', note: 'Fixed bounds.' },
  ],
  contract: { doc: '04-component-bible.md', heading: 'FxProgress' },
};
