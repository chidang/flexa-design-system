/**
 * FxLoadingOverlay showcase — region-scoped busy state. Demos set delayMs:0 so
 * the overlay renders immediately in the grid; in real use it covers a
 * position:relative container.
 */
import type { ShowcaseSpec } from '../showcase-types';
import { FxLoadingOverlay } from './loading-overlay';

export const loadingOverlayShowcase: ShowcaseSpec = {
  name: 'FxLoadingOverlay',
  slug: 'loading-overlay',
  category: 'overlays',
  slice: 'U3',
  status: 'ready',
  interactive: true,
  tagline: 'Scrim + spinner over a region that is briefly unusable during a mutation.',
  component: FxLoadingOverlay,
  variants: [
    { label: 'default', props: { visible: true, delayMs: 0, label: 'Applying to 14 items…' } },
    { label: 'blur', props: { visible: true, delayMs: 0, blur: true, label: 'Recalculating total…' } },
  ],
  props: [
    { name: 'visible', type: 'boolean', required: true, description: 'Show the overlay (after delayMs).' },
    { name: 'label', type: 'string', default: "'Loading…'", description: 'Announced once; states what is happening.' },
    { name: 'blur', type: 'boolean', default: 'false', description: 'Frost the covered content.' },
    { name: 'delayMs', type: 'number', default: '150', description: 'Skip the flash for fast ops.' },
  ],
  aria: [
    { attr: 'role', value: 'status', note: 'aria-busy="true"; announces the label once.' },
  ],
  contract: { doc: '04-component-bible.md', heading: 'FxLoadingOverlay' },
};
