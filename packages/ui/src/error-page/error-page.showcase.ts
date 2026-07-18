/**
 * FxErrorPage showcase spec. One variant per canonical code (403/404/500/
 * offline) plus a custom string code, sweeping actions + requestId. `code` and
 * the copy defaults are documented as prop rows (no shared §5 union here).
 */
import type { ShowcaseSpec } from '../showcase-types';
import { FxErrorPage } from './error-page';

export const errorPageShowcase: ShowcaseSpec = {
  name: 'ErrorPage',
  slug: 'error-page',
  category: 'collaboration',
  slice: 'U9',
  status: 'ready',
  interactive: true,
  tagline: 'Full-page error surface with a status-code slot and recovery actions.',
  component: FxErrorPage,
  variants: [
    {
      label: '404 · not found',
      props: {
        code: 404,
        actions: 'Go home',
        requestId: 'req_9f2c81',
      },
    },
    {
      label: '403 · access denied',
      props: { code: 403, actions: 'Contact support' },
    },
    {
      label: '500 · server error',
      props: { code: 500, actions: 'Retry', requestId: 'req_5a10bd' },
    },
    {
      label: 'offline',
      props: { code: 'offline', actions: 'Retry' },
    },
    {
      label: 'custom code + copy',
      props: {
        code: '429',
        title: 'Too many requests',
        description: 'Please slow down and try again in a moment.',
        actions: 'Retry',
      },
    },
  ],
  props: [
    { name: 'code', type: "403 | 404 | 500 | 'offline' | string", required: true, description: 'Status shown in the big code slot; also the default-copy key. Unknown strings fall back to 500 copy.' },
    { name: 'title', type: 'ReactNode', description: 'Overrides the per-code default title (the page h1). Defaults from DEFAULT_ERROR_COPY.' },
    { name: 'description', type: 'ReactNode', description: 'Overrides the per-code default description.' },
    { name: 'actions', type: 'ReactNode', description: 'Recovery slot — Go home / Retry / Contact support.' },
    { name: 'requestId', type: 'string', description: 'Support-correlation id, rendered text.body-sm color.text-subtle.' },
    { name: 'requestIdLabel', type: 'string', default: "'Reference'", description: 'Prefix for the request-id line.' },
  ],
  aria: [
    { attr: 'h1', value: 'title', note: 'Exactly one h1 = the title; receives focus on mount (tabIndex=-1).' },
    { attr: '.fx-error-page-code', value: 'aria-hidden', note: 'The big code is decorative; the h1 carries the accessible name.' },
  ],
  contract: { doc: '04-component-bible.md', heading: 'FxErrorPage — Error Page' },
};
