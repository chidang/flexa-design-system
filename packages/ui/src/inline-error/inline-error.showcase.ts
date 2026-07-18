/**
 * FxInlineError showcase spec (doc 04 §3.6). Section-scale failure surface —
 * variants cover retry, a detail line, and the compact density.
 */
import type { ShowcaseSpec } from '../showcase-types';
import { FxInlineError } from './inline-error';

const noop = () => undefined;

export const inlineErrorShowcase: ShowcaseSpec = {
  name: 'InlineError',
  slug: 'inline-error',
  category: 'collaboration',
  slice: 'U9',
  status: 'ready',
  tagline: 'A widget failed — bigger than a Validation Message, smaller than an Error Page.',
  component: FxInlineError,
  interactive: true,
  variants: [
    {
      label: 'with retry',
      props: { message: "Couldn't load your recent orders.", onRetry: noop },
    },
    {
      label: 'with detail',
      props: {
        message: 'Failed to load the activity feed.',
        detail: 'Request timed out after 30s (ref: 8f2a1c).',
        onRetry: noop,
      },
    },
    {
      label: 'compact',
      props: { message: "Chart data unavailable.", onRetry: noop, compact: true },
    },
  ],
  props: [
    { name: 'message', type: 'ReactNode', required: true, description: 'What failed and, ideally, how to recover.' },
    { name: 'detail', type: 'ReactNode', description: 'Secondary line — technical hint, request id.' },
    { name: 'onRetry', type: '() => void', description: 'Retry handler; when set the retry is a <button>.' },
    { name: 'retryHref', type: 'string', description: 'Retry link target when there is no onRetry (semantic <a>).' },
    { name: 'retryLabel', type: 'string', default: "'Try again'", description: 'Retry control label.' },
    { name: 'compact', type: 'boolean', default: 'false', description: 'Tighter padding for dense contexts.' },
  ],
  events: [
    { name: 'onRetry', payload: '()', description: 'Retry pressed. Rendered as a <button> when provided.' },
  ],
  aria: [
    { attr: 'role', value: "'alert'", note: 'Announced when it replaces content after a failed async op.' },
    { attr: 'icon', value: 'danger', note: 'Failure conveyed by the error icon + text, never colour alone.' },
  ],
  contract: { doc: '04-component-bible.md', heading: 'FxInlineError — Inline Error' },
};
