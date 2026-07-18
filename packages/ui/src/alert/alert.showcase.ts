/**
 * FxAlert showcase — inline persistent message across tones + appearances.
 */
import type { ShowcaseSpec } from '../showcase-types';
import { TONES } from '../enums';
import { FxAlert } from './alert';

export const alertShowcase: ShowcaseSpec = {
  name: 'FxAlert',
  slug: 'alert',
  category: 'overlays',
  slice: 'U3',
  status: 'ready',
  interactive: true,
  tagline: 'A persistent, region-scoped message — bound to the content it sits within.',
  component: FxAlert,
  variants: [
    ...TONES.map((tone) => ({
      label: tone,
      props: {
        tone,
        title: `${tone[0]?.toUpperCase()}${tone.slice(1)} notice`,
        description: 'A short, contextual message about the content nearby.',
      },
    })),
    {
      label: 'solid + actions',
      props: {
        tone: 'danger',
        appearance: 'solid',
        title: 'Payouts are paused',
        description: 'Verify your bank account to resume payouts.',
      },
    },
    {
      label: 'dismissible',
      props: { tone: 'info', description: 'This tip can be dismissed for the session.', dismissible: true },
    },
  ],
  enums: { tone: TONES },
  props: [
    { name: 'tone', type: "'neutral' | 'info' | 'success' | 'warning' | 'danger'", default: "'info'", description: 'Severity; pairs colour with icon + text.' },
    { name: 'title / description', type: 'string | Node', default: '— / required', description: 'Heading and body.' },
    { name: 'appearance', type: "'subtle' | 'solid'", default: "'subtle'", description: 'Tinted surface vs solid fill.' },
    { name: 'dismissible', type: 'boolean', default: 'false', description: 'Session-scoped × (advisory content only).' },
    { name: 'actions', type: 'Node', description: 'Ghost/secondary buttons or links only.' },
    { name: 'live', type: 'boolean', default: 'false', description: 'Injected after load: danger/warning → alert, else status.' },
  ],
  events: [{ name: 'onDismiss', payload: '() => void', description: 'Fires when the × is activated.' }],
  aria: [
    { attr: 'role', value: 'status | alert | none', note: 'Only when live; tone decides politeness.' },
  ],
  contract: { doc: '04-component-bible.md', heading: 'FxAlert' },
};
