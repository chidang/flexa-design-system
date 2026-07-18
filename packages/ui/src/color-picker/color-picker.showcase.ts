/**
 * ColorPicker showcase spec. Only the shared `size` union comes from enums.ts.
 * The picked hex value is data (a literal), not a style token — see §3.4 note.
 */
import type { ShowcaseSpec } from '../showcase-types';
import { SIZES } from '../enums';
import { FxColorPicker } from './color-picker';

export const colorPickerShowcase: ShowcaseSpec = {
  name: 'ColorPicker',
  slug: 'color-picker',
  category: 'forms',
  slice: 'U5',
  status: 'ready',
  interactive: true,
  tagline: 'Swatch trigger plus a saturation/value pad, hue slider, hex field and presets.',
  component: FxColorPicker,
  variants: [
    { label: 'default', props: { label: 'Brand color' } },
    { label: 'with value', props: { label: 'Accent', defaultValue: '#4f46e5' } },
    {
      label: 'with swatches',
      props: {
        label: 'Palette',
        defaultValue: '#ef4444',
        swatches: ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899'],
      },
    },
    ...SIZES.map((size) => ({
      label: `size ${size}`,
      props: { size, label: `Size ${size}`, defaultValue: '#10b981' },
    })),
    { label: 'disabled', props: { label: 'Locked', disabled: true, defaultValue: '#3b82f6' } },
  ],
  enums: { size: SIZES },
  props: [
    { name: 'value / defaultValue', type: 'string (hex)', default: "— / '#000000'", description: 'Picked color as a literal hex (data, not style — §3.4 note).' },
    { name: 'swatches', type: 'string[]', description: 'Preset colors rendered as a radio group.' },
    { name: 'open / defaultOpen', type: 'boolean', description: 'Controlled / uncontrolled popover state (§1.5).' },
    { name: 'size', type: "'sm' | 'md' | 'lg'", default: "'md'", description: 'Trigger height (32 / 40 / 48px).' },
    { name: 'label', type: 'string', required: true, description: 'Accessible name — required for AT.' },
    { name: 'labels', type: '{ openPicker; saturationValue; hue; hex; swatches }', default: 'English set', description: 'i18n label set.' },
  ],
  events: [
    { name: 'onChange', payload: '(value, { source })', description: 'On pad/hue/input/swatch change.' },
    { name: 'onOpenChange', payload: 'boolean', description: 'Popover open/close.' },
  ],
  keyboard: [
    { keys: 'Arrow (pad)', action: '±1 saturation/value; Shift = ×10' },
    { keys: 'Arrow (hue)', action: '±1°; Shift = ×10; Home/End = 0/360' },
    { keys: 'Enter (hex)', action: 'Commit typed hex' },
  ],
  aria: [
    { attr: 'role', value: 'slider', note: '2-D SL pad (both axes) + hue slider.' },
    { attr: 'aria-valuetext', value: "'Saturation 40%, Lightness 60%'", note: 'Two-axis pad description.' },
    { attr: 'role', value: 'radiogroup', note: 'Preset swatches.' },
  ],
  contract: { doc: '04-component-bible.md', heading: 'FxColorPicker' },
};
