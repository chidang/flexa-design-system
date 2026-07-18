/**
 * FxToast showcase — the presentational toast surface across tones. The live
 * queue API is `FxToastRegion` + `useToast`; the grid renders `FxToast` directly
 * so each tone shows self-contained without mounting a region.
 */
import type { ShowcaseSpec } from '../showcase-types';
import { TONES } from '../enums';
import { FxToast } from './toast';

export const toastShowcase: ShowcaseSpec = {
  name: 'FxToast',
  slug: 'toast',
  category: 'overlays',
  slice: 'U3',
  status: 'ready',
  interactive: true,
  tagline: 'Transient, non-blocking confirmation of a completed action — top-end, max 3.',
  component: FxToast,
  variants: [
    ...TONES.map((tone) => ({
      label: tone,
      props: { tone, title: `${tone[0]?.toUpperCase()}${tone.slice(1)} notice`, description: 'Listing published.' },
    })),
    {
      label: 'with action',
      props: { tone: 'success', title: 'Listing published', action: { label: 'View', onClick: () => {} } },
    },
  ],
  enums: { tone: TONES },
  props: [
    { name: 'tone', type: "'neutral' | 'info' | 'success' | 'warning' | 'danger'", default: "'neutral'", description: 'Severity + politeness.' },
    { name: 'title', type: 'string', required: true, description: 'Verb-first past-tense line.' },
    { name: 'description', type: 'string', description: '1–2 lines max.' },
    { name: 'duration', type: 'number | null', default: '5000', description: 'null = persistent; danger persists by default.' },
    { name: 'action', type: '{ label; onClick }', description: 'Exactly one; never a form or navigation-critical.' },
    { name: 'dismissible', type: 'boolean', default: 'true', description: 'Show the × control.' },
  ],
  events: [
    { name: 'onDismiss', payload: "(id, reason: 'timeout' | 'user' | 'action' | 'api')", description: 'Per toast.' },
  ],
  aria: [
    { attr: 'role', value: 'status | alert', note: 'polite for neutral/info/success; assertive for warning/danger.' },
    { attr: 'region', value: 'role="region"', note: 'The FxToastRegion landmark; toasts never take focus.' },
  ],
  contract: { doc: '04-component-bible.md', heading: 'FxToast' },
};
