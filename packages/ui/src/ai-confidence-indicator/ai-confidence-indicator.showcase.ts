/**
 * FxAiConfidenceIndicator showcase spec. Covers all three bands (low/medium/high),
 * the badge/dots/inline variants, and the info-tooltip escape hatch. The first
 * variant renders non-empty static markup (a `role="img"` meter + band label).
 * `ConfidenceBand`/`variant`/`size` are local prop-type unions (no §5 enum).
 */
import type { ShowcaseSpec } from '../showcase-types';
import { FxAiConfidenceIndicator } from './ai-confidence-indicator';

export const aiConfidenceIndicatorShowcase: ShowcaseSpec = {
  name: 'AiConfidenceIndicator',
  slug: 'ai-confidence-indicator',
  category: 'ai',
  slice: 'U10',
  status: 'ready',
  tagline: 'Qualitative model-confidence meter — low / medium / high bands, never a bare percentage.',
  component: FxAiConfidenceIndicator,
  interactive: true,
  variants: [
    {
      label: 'high (badge)',
      props: { value: 0.92, explanation: 'Based on 4 matching signals in your catalog.' },
    },
    { label: 'medium (badge)', props: { value: 0.6 } },
    { label: 'low (badge)', props: { value: 0.2 } },
    { label: 'dots variant', props: { value: 0.82, variant: 'dots' } },
    { label: 'inline variant', props: { value: 0.5, variant: 'inline' } },
    { label: 'small, no label', props: { value: 0.9, size: 'sm', showLabel: false } },
    {
      label: 'custom bands',
      props: { value: 0.7, bands: { low: 0.5, medium: 0.9 } },
      note: 'value 0.7 with bands {low:0.5, medium:0.9} → medium.',
    },
    { label: 'non-finite → nothing', props: { value: Number.NaN }, note: 'Renders nothing for a non-finite value.' },
  ],
  props: [
    { name: 'value', type: 'number', required: true, description: 'Model confidence 0..1. Non-finite → renders nothing.' },
    { name: 'bands', type: '{ low: number; medium: number }', default: '{ low: 0.4, medium: 0.75 }', description: '<low = low, <medium = medium, else high.' },
    { name: 'variant', type: "'badge' | 'dots' | 'inline'", default: 'badge', description: 'Meter presentation.' },
    { name: 'size', type: "'sm' | 'md'", default: 'md', description: 'Meter size.' },
    { name: 'showLabel', type: 'boolean', default: 'true', description: 'Render the visible band label.' },
    { name: 'explanation', type: 'string', description: 'Tooltip text (how confidence was computed).' },
    { name: 'labels', type: 'Partial<AiConfidenceLabels>', description: 'i18n overrides (low/medium/high band labels + percent template).' },
  ],
  aria: [
    { attr: 'role="img"', value: '{band label} ({percent}%)', note: 'The meter carries the full accessible name — band + exact percent.' },
    { attr: 'never color-only', value: 'label / tooltip', note: 'A visible band label (or the info tooltip) always accompanies colour.' },
    { attr: 'aria-label', value: 'Confidence {percent}%', note: 'Names the info-tooltip trigger button.' },
  ],
  contract: { doc: '04-component-bible.md', heading: 'FxAiConfidenceIndicator — AI Confidence Indicator' },
};
