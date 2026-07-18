/**
 * Button showcase spec — consumed by both the kitchen-sink and fds-docs.
 * `enums` reference the shared unions directly (no re-typed literals).
 */
import type { ShowcaseSpec } from '../showcase-types';
import { SIZES, VARIANTS } from '../enums';
import { FxButton } from './button';

export const buttonShowcase: ShowcaseSpec = {
  name: 'Button',
  slug: 'button',
  category: 'forms',
  slice: 'U1',
  status: 'ready',
  interactive: false,
  tagline: 'The primary action control — one clear emphasis per view.',
  component: FxButton,
  variants: [
    ...VARIANTS.map((variant) => ({
      label: variant,
      props: { variant },
      children: 'Button',
    })),
    ...SIZES.map((size) => ({
      label: `size ${size}`,
      props: { size },
      children: 'Button',
    })),
    { label: 'disabled', props: { disabled: true }, children: 'Button' },
    { label: 'loading', props: { loading: true }, children: 'Saving…' },
  ],
  enums: { variant: VARIANTS, size: SIZES },
  props: [
    {
      name: 'variant',
      type: "'primary' | 'secondary' | 'ghost' | 'danger'",
      default: "'primary'",
      description: 'Emphasis. One primary action per view.',
    },
    {
      name: 'size',
      type: "'sm' | 'md' | 'lg'",
      default: "'md'",
      description: 'Control height (32 / 40 / 48px).',
    },
    {
      name: 'loading',
      type: 'boolean',
      default: 'false',
      description: 'Busy state; shows a spinner, disables activation and sets aria-busy.',
    },
    {
      name: 'loadingLabel',
      type: 'string',
      default: "'Loading…'",
      description: 'Accessible announcement (polite live region) while loading.',
    },
    {
      name: 'iconStart / iconEnd',
      type: 'ReactNode',
      description: 'Optional leading/trailing icon.',
    },
  ],
  events: [
    { name: 'onClick', payload: 'MouseEvent', description: 'Fires on activation (unless disabled/loading).' },
  ],
  keyboard: [
    { keys: 'Enter · Space', action: 'Activate the button' },
    { keys: 'Tab', action: 'Move focus to/from the button' },
  ],
  aria: [
    { attr: 'aria-busy', value: 'true', note: 'While loading.' },
    { attr: 'disabled', value: 'boolean', note: 'Native disabled attribute; removes from tab order.' },
  ],
  contract: { doc: '04-component-bible.md', heading: 'FxButton' },
};
