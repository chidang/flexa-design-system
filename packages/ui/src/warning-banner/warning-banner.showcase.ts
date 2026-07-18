/**
 * FxWarningBanner showcase spec (doc 04 §3.6). A constrained warning FxAlert —
 * variants cover message-only and message + single action + dismiss.
 */
import type { ShowcaseSpec } from '../showcase-types';
import { FxWarningBanner } from './warning-banner';

const noop = () => undefined;

export const warningBannerShowcase: ShowcaseSpec = {
  name: 'WarningBanner',
  slug: 'warning-banner',
  category: 'collaboration',
  slice: 'U9',
  status: 'ready',
  tagline: 'Full-width warning pinned above the Content Area — a nudge with one action.',
  component: FxWarningBanner,
  interactive: true,
  variants: [
    {
      label: 'action + dismiss',
      props: {
        title: 'Verify your email',
        action: '<a href="#verify">Resend link</a>',
        dismissKey: 'verify-email',
        onDismiss: noop,
      },
      children: 'Confirm your address to keep receiving payout notifications.',
    },
    {
      label: 'message only',
      props: {},
      children: 'Your payment method expires this month — update it to avoid interruptions.',
    },
  ],
  props: [
    { name: 'title', type: 'ReactNode', description: 'Optional bold lead-in line.' },
    { name: 'children', type: 'ReactNode', description: 'The message body.' },
    { name: 'action', type: 'ReactNode', description: 'A single action (button/link) in the alert action row.' },
    { name: 'sticky', type: 'boolean', default: 'true', description: 'Pin below the Top Navigation at z.sticky.' },
    { name: 'dismissKey', type: 'string', description: 'Host persistence key, echoed back on dismiss.' },
    { name: 'dismissLabel', type: 'string', default: "'Dismiss'", description: 'Accessible name for the icon-only dismiss control.' },
  ],
  events: [
    { name: 'onDismiss', payload: '(dismissKey?: string)', description: 'Fired when dismissed; presence of this handler enables the dismiss button.' },
  ],
  aria: [
    { attr: 'tone', value: "'warning'", note: 'Fixed — icon + text convey the warning, never colour alone.' },
    { attr: '.fx-alert-dismiss', value: 'aria-label', note: 'Icon-only dismiss carries an accessible name (dismissLabel).' },
  ],
  contract: { doc: '04-component-bible.md', heading: 'FxWarningBanner — Warning Banner' },
};
