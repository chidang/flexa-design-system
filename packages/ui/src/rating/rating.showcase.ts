/**
 * Rating showcase spec. No shared unions drive its variants; sizes are the fixed
 * icon ladder (16/20/24), documented in `props` as a type string. No `enums` map
 * entry. Input-mode variants set `interactive` at the spec level.
 */
import type { ShowcaseSpec } from '../showcase-types';
import { FxRating } from './rating';

export const ratingShowcase: ShowcaseSpec = {
  name: 'Rating',
  slug: 'rating',
  category: 'data',
  slice: 'U6',
  status: 'ready',
  interactive: true,
  tagline: '5-star rating — read-only (fractional) or an input radio group.',
  component: FxRating,
  variants: [
    { label: 'read-only fractional', props: { value: 4.6 } },
    { label: 'with value', props: { value: 4.6, showValue: true } },
    { label: 'with value + count', props: { value: 4.6, showValue: true, count: 128 } },
    { label: 'count link', props: { value: 3.5, count: 42, countHref: '#reviews' } },
    { label: 'zero', props: { value: 0 } },
    { label: 'input mode', props: { readOnly: false, defaultValue: 3 } },
    { label: 'input empty', props: { readOnly: false } },
    { label: 'size 16', props: { value: 4, size: 16 } },
    { label: 'size 20', props: { value: 4, size: 20 } },
    { label: 'size 24', props: { value: 4, size: 24 } },
    { label: 'max 10', props: { value: 7.5, max: 10 } },
  ],
  props: [
    { name: 'value / defaultValue', type: 'number', default: '— / 0', description: '0–max. Read-only allows fractional (0.1 precision); input picks integers (§1.5).' },
    { name: 'readOnly', type: 'boolean', default: 'true', description: 'Read-only image vs interactive radio group.' },
    { name: 'showValue', type: 'boolean', default: 'false', description: 'Show the numeric value, e.g. "4.6".' },
    { name: 'count / countHref', type: 'number / string', description: 'Review count; becomes a plain link when countHref is set.' },
    { name: 'max', type: 'number', default: '5', description: 'Number of stars.' },
    { name: 'size', type: '16 | 20 | 24', default: '20', description: 'Star glyph size.' },
    { name: 'label / itemLabel', type: 'string', default: "'Rating' / '{n} of {max} stars'", description: 'Group and per-star accessible names (i18n).' },
  ],
  events: [
    { name: 'onChange', payload: '(value: number)', description: 'Picked integer 1–max (input mode).' },
  ],
  keyboard: [
    { keys: '← / → / ↑ / ↓', action: 'Input mode: move focus AND selection over 1–max (radio group).' },
    { keys: 'Tab', action: 'Single tab stop (the checked star, or first when empty).' },
  ],
  aria: [
    { attr: 'role', value: 'img', note: 'Read-only mode; aria-label = "Rated {value} out of {max}".' },
    { attr: 'role', value: 'radiogroup', note: 'Input mode; each star is a radio labelled "1 star"… .' },
    { attr: 'data-readonly', value: 'true', note: 'On the root in read-only mode.' },
  ],
  contract: { doc: '04-component-bible.md', heading: 'FxRating' },
};
