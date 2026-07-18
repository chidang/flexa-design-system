/**
 * FxOfflineState showcase spec. Covers both modes: banner (auto-managed from
 * navigator connectivity) and page (delegates to FxErrorPage code="offline").
 * `mode` is documented as a prop row (no shared §5 union here).
 */
import type { ShowcaseSpec } from '../showcase-types';
import { FxOfflineState } from './offline-state';

const noop = () => undefined;

export const offlineStateShowcase: ShowcaseSpec = {
  name: 'OfflineState',
  slug: 'offline-state',
  category: 'collaboration',
  slice: 'U9',
  status: 'ready',
  interactive: true,
  tagline: 'Connectivity surface — a self-managing offline banner or a full-page hard stop.',
  component: FxOfflineState,
  variants: [
    {
      label: 'banner (with retry)',
      props: { mode: 'banner', onRetry: noop },
    },
    {
      label: 'banner (no retry)',
      props: { mode: 'banner' },
    },
    {
      label: 'page (hard stop)',
      props: { mode: 'page', actions: 'Retry' },
    },
  ],
  props: [
    { name: 'mode', type: "'banner' | 'page'", required: true, description: 'banner = ambient FxAlert warning; page = full FxErrorPage code="offline".' },
    { name: 'onRetry', type: '() => void', description: 'Retry handler (host owns the actual reconnect).' },
    { name: 'retryingLabel', type: 'string', default: "'Reconnecting…'", description: 'Announced while a retry is in flight.' },
    { name: 'onlineLabel', type: 'string', default: "'Back online'", description: 'Announced politely on reconnect before the banner auto-dismisses.' },
    { name: 'labels', type: 'Partial<OfflineStateLabels>', description: 'i18n overrides for every baked string (offlineMessage/retryLabel/onlineLabel/retryingLabel).' },
    { name: 'actions', type: 'ReactNode', description: 'Page-mode recovery actions passed through to FxErrorPage.' },
  ],
  events: [
    { name: 'onRetry', payload: '()', description: 'Retry pressed in banner mode. The component sets a retrying announcement; the host performs the reconnect.' },
  ],
  aria: [
    { attr: 'role', value: 'status/alert', note: 'Banner is live (warning → role="alert"); reconnect announces "Back online" via role="status" (success alert).' },
    { attr: 'navigator.onLine', value: 'effect-only', note: 'Connectivity is read inside useEffect (SSR-safe); static render shows the banner.' },
  ],
  contract: { doc: '04-component-bible.md', heading: 'FxOfflineState — Offline State' },
};
