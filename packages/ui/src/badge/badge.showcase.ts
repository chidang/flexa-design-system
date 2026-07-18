/**
 * Badge showcase spec — tones × appearances plus dot/icon/count states.
 * `enums` reference the shared `TONES` union (no re-typed literals).
 */
import type { ShowcaseSpec } from '../showcase-types';
import { TONES } from '../enums';
import { FxBadge } from './badge';

const APPEARANCES = ['solid', 'subtle', 'outline'] as const;

export const badgeShowcase: ShowcaseSpec = {
  name: 'Badge',
  slug: 'badge',
  category: 'display',
  slice: 'U2',
  status: 'ready',
  interactive: false,
  tagline: 'A small status descriptor — colour paired with a label, dot, or icon.',
  component: FxBadge,
  variants: [
    ...TONES.map((tone) => ({ label: tone, props: { tone }, children: tone })),
    ...APPEARANCES.map((appearance) => ({
      label: appearance,
      props: { appearance, tone: 'success' as const },
      children: 'Active',
    })),
    { label: 'with dot', props: { tone: 'success', dot: true }, children: 'Online' },
    { label: 'with icon', props: { tone: 'info', icon: 'bell' as const }, children: 'Notice' },
    { label: 'size sm', props: { size: 'sm', tone: 'warning' }, children: 'Beta' },
    {
      label: 'count',
      props: { tone: 'danger', appearance: 'solid', count: 128, srLabel: '128 unread notifications' },
    },
  ],
  enums: { tone: TONES },
  props: [
    { name: 'tone', type: "'neutral' | 'info' | 'success' | 'warning' | 'danger'", default: "'neutral'", description: 'Status tone (doc 04 §1.9).' },
    { name: 'appearance', type: "'solid' | 'subtle' | 'outline'", default: "'subtle'", description: 'Fill treatment.' },
    { name: 'size', type: "'sm' | 'md'", default: "'md'", description: 'Height (18 / 22px).' },
    { name: 'icon', type: 'IconName', description: 'Leading icon — pairs colour with a glyph (§1.7.7).' },
    { name: 'dot', type: 'boolean', default: 'false', description: 'Leading status dot.' },
    { name: 'count', type: 'number', description: 'Numeric badge; over maxCount renders `{maxCount}+`.' },
    { name: 'maxCount', type: 'number', default: '99', description: 'Cap for count.' },
    { name: 'srLabel', type: 'string', description: 'Visually-hidden expansion; required for bare counts.' },
  ],
  aria: [
    { attr: 'aria-hidden', value: 'true', note: 'On the dot and on the count when srLabel is present.' },
  ],
  contract: { doc: '04-component-bible.md', heading: 'FxBadge' },
};
