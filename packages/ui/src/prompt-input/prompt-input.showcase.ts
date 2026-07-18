/**
 * FxPromptInput showcase spec. Covers the empty state with example chips, the
 * generating state (send → Stop swap), attachments, the disabled-with-reason
 * state, and the hero/bar variants. The first variant renders non-empty static
 * markup (textarea + send button + hint). `status` is the shared `AiStatus` §5
 * enum; `variant` is a local prop-type union.
 */
import type { ShowcaseSpec } from '../showcase-types';
import { AI_STATUSES } from '../enums';
import { FxPromptInput } from './prompt-input';

const noop = () => undefined;
const examples = ['Write a product description', 'Suggest 5 tags', 'Make it more concise'];

export const promptInputShowcase: ShowcaseSpec = {
  name: 'PromptInput',
  slug: 'prompt-input',
  category: 'ai',
  slice: 'U10',
  status: 'ready',
  tagline: 'The AI composer — Enter submits, Shift+Enter newline; the prompt is never lost.',
  component: FxPromptInput,
  interactive: true,
  variants: [
    {
      label: 'empty + example chips',
      props: { onSubmit: noop, examples, onExample: noop, placeholder: 'Describe what to write…' },
    },
    {
      label: 'with attachments',
      props: { defaultValue: 'Rewrite the intro', onSubmit: noop, attachments: true, onAttach: noop },
    },
    {
      label: 'generating (send → Stop)',
      props: { defaultValue: 'Draft a launch email', onSubmit: noop, status: 'generating', onStop: noop },
    },
    {
      label: 'disabled + reason',
      props: { onSubmit: noop, disabled: true, disabledReason: 'You have used all generations for today.' },
    },
    {
      label: 'hero variant',
      props: { onSubmit: noop, variant: 'hero', placeholder: 'Describe the site you want…', examples, onExample: noop },
    },
    {
      label: 'bar variant + counter',
      props: { defaultValue: 'Summarize this order', onSubmit: noop, variant: 'bar', maxLength: 24 },
    },
  ],
  props: [
    { name: 'value / defaultValue', type: 'string', description: 'Controlled or uncontrolled prompt text.' },
    { name: 'onSubmit', type: '(prompt: string) => void', required: true, description: 'Fires with the trimmed-non-empty prompt.' },
    { name: 'onChange', type: '(value: string) => void', description: 'Fires per keystroke.' },
    { name: 'onStop', type: '() => void', description: 'Stop affordance (shown while generating).' },
    { name: 'status', type: 'AiStatus', default: 'idle', description: 'Lifecycle status (§5); generating swaps send → Stop.' },
    { name: 'variant', type: "'default' | 'bar' | 'hero'", default: 'default', description: 'Presentation.' },
    { name: 'placeholder', type: 'string', default: 'Ask anything…', description: 'Task-specific placeholder.' },
    { name: 'maxLength', type: 'number', description: 'Character cap (counter near the limit).' },
    { name: 'attachments', type: 'boolean', description: 'Show the attach button (+ onAttach).' },
    { name: 'examples', type: 'string[]', description: 'Starter chips shown when empty (+ onExample).' },
    { name: 'disabled', type: 'boolean', description: 'Disable with a visible disabledReason line.' },
    { name: 'labels', type: 'Partial<PromptInputLabels>', description: 'i18n overrides (send / stop / attach / hint).' },
  ],
  events: [
    { name: 'onSubmit', payload: '(prompt: string)', description: 'Enter (no Shift) or the Send button, on non-empty input.' },
    { name: 'onStop', payload: '()', description: 'The Stop button was pressed while generating.' },
    { name: 'onExample', payload: '(ex: string)', description: 'An example chip filled the input.' },
  ],
  keyboard: [
    { keys: 'Enter', action: 'Submit the prompt (disabled on empty/whitespace).' },
    { keys: 'Shift+Enter', action: 'Insert a newline.' },
  ],
  aria: [
    { attr: 'aria-label', value: 'Send / Stop', note: 'The icon-only send/stop control carries a swapped accessible name.' },
    { attr: 'disabled', value: 'reason line', note: 'Disabled state always shows a visible reason, never silent.' },
  ],
  enums: { status: AI_STATUSES },
  contract: { doc: '04-component-bible.md', heading: 'FxPromptInput — Prompt Input' },
};
