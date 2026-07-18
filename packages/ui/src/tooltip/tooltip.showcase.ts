/**
 * FxTooltip showcase — text-only hint on a focusable trigger. The demo island
 * supplies a button trigger via children so hover/focus reveal the hint.
 */
import { createElement } from 'react';
import type { ShowcaseSpec } from '../showcase-types';
import { FxButton } from '../button/button';
import { FxTooltip } from './tooltip';

const trigger = () => createElement(FxButton, { variant: 'secondary' }, 'Hover me');

export const tooltipShowcase: ShowcaseSpec = {
  name: 'FxTooltip',
  slug: 'tooltip',
  category: 'overlays',
  slice: 'U3',
  status: 'ready',
  interactive: true,
  tagline: 'A text-only hover and focus hint — never interactive, never load-bearing.',
  component: FxTooltip,
  variants: [
    { label: 'top', props: { content: 'Saved automatically', placement: 'top', children: trigger() } },
    { label: 'bottom', props: { content: 'Applies to all rows', placement: 'bottom', children: trigger() } },
    { label: 'end', props: { content: 'Opens in a new tab', placement: 'end', children: trigger() } },
  ],
  props: [
    { name: 'content', type: 'string', required: true, description: 'Plain text only.' },
    { name: 'placement', type: "'top' | 'bottom' | 'start' | 'end'", default: "'top'", description: 'Preferred side.' },
    { name: 'delay', type: 'number', default: '600', description: 'Open delay in ms; close is instant.' },
    { name: 'disabled', type: 'boolean', default: 'false', description: 'Suppress the tooltip.' },
  ],
  keyboard: [
    { keys: 'Focus trigger', action: 'Show tooltip' },
    { keys: 'Esc · Blur', action: 'Hide tooltip' },
  ],
  aria: [
    { attr: 'role', value: 'tooltip', note: 'On the tooltip surface.' },
    { attr: 'aria-describedby', value: 'tooltip id', note: 'Wired onto the trigger; does not replace aria-label.' },
  ],
  contract: { doc: '04-component-bible.md', heading: 'FxTooltip' },
};
