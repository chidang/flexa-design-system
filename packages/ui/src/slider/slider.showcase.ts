/**
 * Slider showcase spec. Only the shared `size` union comes from enums.ts;
 * orientation / showTooltip are component-specific and documented as prop strings.
 */
import type { ShowcaseSpec } from '../showcase-types';
import { SIZES } from '../enums';
import { FxSlider } from './slider';

export const sliderShowcase: ShowcaseSpec = {
  name: 'Slider',
  slug: 'slider',
  category: 'forms',
  slice: 'U5',
  status: 'ready',
  interactive: true,
  tagline: 'Pick a number — or a range — by dragging along a track.',
  component: FxSlider,
  variants: [
    { label: 'default', props: { label: 'Volume', defaultValue: 40 } },
    { label: 'with marks', props: { label: 'Quality', defaultValue: 50, marks: [{ value: 0, label: '0' }, { value: 50, label: '50' }, { value: 100, label: '100' }] } },
    {
      label: 'range',
      props: { thumbLabels: ['Minimum price', 'Maximum price'], defaultValue: [20, 80] },
    },
    { label: 'step 10', props: { label: 'Rating', min: 0, max: 100, step: 10, defaultValue: 30 } },
    { label: 'tooltip always', props: { label: 'Opacity', defaultValue: 65, showTooltip: 'always' } },
    { label: 'vertical', props: { label: 'Level', orientation: 'vertical', defaultValue: 45 } },
    ...SIZES.map((size) => ({
      label: `size ${size}`,
      props: { size, label: `Size ${size}`, defaultValue: 50 },
    })),
    { label: 'disabled', props: { label: 'Locked', defaultValue: 50, disabled: true } },
  ],
  enums: { size: SIZES },
  props: [
    { name: 'value / defaultValue', type: 'number | [number, number]', default: 'min', description: 'Tuple = range slider (two thumbs, data-range).' },
    { name: 'min / max / step', type: 'number', default: '0 / 100 / 1', description: 'Bounds and increment.' },
    { name: 'marks', type: '{ value: number; label?: string }[]', description: 'Tick marks with optional labels.' },
    { name: 'orientation', type: "'horizontal' | 'vertical'", default: "'horizontal'", description: 'Layout axis.' },
    { name: 'showTooltip', type: "'auto' | 'always' | 'never'", default: "'auto'", description: 'auto = while dragging/focused.' },
    { name: 'size', type: "'sm' | 'md' | 'lg'", default: "'md'", description: 'Thumb size (16 / 20 / 24px).' },
    { name: 'formatValue', type: '(v: number) => string', default: 'String', description: 'Drives tooltip + aria-valuetext.' },
    { name: 'label / thumbLabels', type: 'string / [string, string]', description: 'Range sliders must label each thumb.' },
  ],
  events: [
    { name: 'onChange', payload: "(value, { source: 'drag' | 'step' })", description: 'Live during drag/keyboard step.' },
    { name: 'onChangeEnd', payload: 'value', description: 'On release/commit (server calls belong here).' },
  ],
  keyboard: [
    { keys: 'Arrow', action: '±step (per focused thumb)' },
    { keys: 'PageUp / PageDown', action: '±step×10' },
    { keys: 'Home / End', action: 'min / max' },
  ],
  aria: [
    { attr: 'role', value: 'slider', note: 'Each thumb; range = two thumbs.' },
    { attr: 'aria-valuenow / aria-valuetext', value: 'number / string', note: 'Live value + formatted text.' },
    { attr: 'aria-orientation', value: 'horizontal | vertical', note: 'Matches layout axis.' },
  ],
  contract: { doc: '04-component-bible.md', heading: 'FxSlider' },
};
