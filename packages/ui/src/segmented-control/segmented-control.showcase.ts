/**
 * FxSegmentedControl showcase spec. Variants cover both sizes, the visible
 * label, a disabled option, and the fully disabled group. No `enums` entry: the
 * size union here is the deliberate `sm | md` subset (no `lg` tier), not the
 * shared three-step `SIZES` union. Specified by ui-kit doc 14 §11 (gap G9) —
 * the Messages "View as: Buyer / Seller" toggle that previously leaned on
 * FxTabs `contained` with empty panels.
 */
import type { ShowcaseSpec } from '../showcase-types';
import { FxSegmentedControl } from './segmented-control';

const noop = () => undefined;

const VIEW_AS = [
  { value: 'buyer', label: 'Buyer' },
  { value: 'seller', label: 'Seller' },
];

const RANGES = [
  { value: '7d', label: '7 days' },
  { value: '30d', label: '30 days' },
  { value: '90d', label: '90 days' },
  { value: 'all', label: 'All time', disabled: true },
];

export const segmentedControlShowcase: ShowcaseSpec = {
  name: 'Segmented Control',
  slug: 'segmented-control',
  category: 'forms',
  slice: 'P-E3',
  status: 'ready',
  interactive: true,
  tagline: 'An exclusive-choice toggle — label + 2–5 options, one selected, no panels.',
  component: FxSegmentedControl,
  variants: [
    {
      label: 'with label (md)',
      props: { label: 'View as', options: VIEW_AS, defaultValue: 'buyer', onChange: noop },
    },
    {
      label: 'sm',
      props: { label: 'View as', options: VIEW_AS, defaultValue: 'seller', size: 'sm', onChange: noop },
    },
    {
      label: 'disabled option',
      props: { 'aria-label': 'Date range', options: RANGES, defaultValue: '30d', onChange: noop },
      note: 'No visible label — the group carries an aria-label instead.',
    },
    {
      label: 'disabled group',
      props: { label: 'View as', options: VIEW_AS, defaultValue: 'buyer', disabled: true },
    },
  ],
  props: [
    { name: 'options', type: 'SegmentedOption[]', required: true, description: 'SegmentedOption = { value; label; disabled? }. 2–5 recommended — more belongs in FxSelect.' },
    { name: 'value / defaultValue', type: 'string | null', description: 'Controlled / uncontrolled selection (doc 04 §1.5).' },
    { name: 'label', type: 'string', description: 'Visible inline label before the track; also the accessible group name.' },
    { name: 'size', type: "'sm' | 'md'", default: "'md'", description: 'Track heights: sm 32px, md 40px. No lg tier.' },
    { name: 'disabled', type: 'boolean', default: 'false', description: 'Disables the whole group; per-option via SegmentedOption.disabled.' },
    { name: 'name', type: 'string', description: 'Shared native radio name. Auto-generated when omitted.' },
    { name: 'aria-label / aria-labelledby', type: 'string', description: 'Accessible group name when no visible label is rendered.' },
  ],
  events: [
    { name: 'onChange', payload: "(value, { source: 'input' })", description: 'Selection changed (click or Arrow keys).' },
  ],
  keyboard: [
    { keys: 'Tab', action: 'Move into the group — a single tab stop (the checked option)' },
    { keys: 'Arrow keys', action: 'Move focus AND selection between options, wrapping (APG radiogroup)' },
  ],
  aria: [
    { attr: 'role', value: 'radiogroup', note: 'Exclusive selection with no panels — NOT a tablist; options control no tabpanel.' },
    { attr: 'aria-labelledby', value: 'label id', note: 'The rendered label names the group; aria-label when label is omitted.' },
    { attr: 'data-checked', value: 'true | absent', note: 'Checked option is the raised surface card; native radio carries checked state.' },
  ],
  contract: { doc: '14-refinement-audit.md', heading: 'U13 screen-composition gaps' },
};
