/**
 * FxAiAssistantPanel showcase spec. A conversational AI surface where nothing
 * lands until a human applies. The first variant is `embedded` with a populated
 * transcript (user + assistant turns, one embedding an AI Suggestion Card) so the
 * static markup is non-empty — the docked/portal-free fixed variant is never
 * first. Later variants cover the empty state (starter chips) and streaming.
 * `status` is the shared `AiStatus` §5 enum; `variant`/turn `role` are local.
 */
import type { ShowcaseSpec } from '../showcase-types';
import { AI_STATUSES } from '../enums';
import { FxAiAssistantPanel, type AiTurn } from './ai-assistant-panel';

const noop = () => undefined;

const messages: AiTurn[] = [
  {
    id: 't1',
    role: 'user',
    content: 'Make my About page sound more approachable.',
    at: '10:02',
  },
  {
    id: 't2',
    role: 'assistant',
    content: 'Here’s a warmer rewrite of your opening paragraph — apply it if you like it.',
    at: '10:02',
    suggestion: {
      id: 'sug1',
      kind: 'About page',
      title: 'Warmer opening',
      content:
        'We’re a small team who love making things by hand — and we’d rather show you than tell you.',
      confidence: 0.78,
      rationale: 'Shorter sentences and first-person voice read as friendlier than the current copy.',
    },
  },
];

export const aiAssistantPanelShowcase: ShowcaseSpec = {
  name: 'AiAssistantPanel',
  slug: 'ai-assistant-panel',
  category: 'ai',
  slice: 'U10',
  status: 'ready',
  tagline: 'A conversational AI surface — assistant proposes, a human applies.',
  component: FxAiAssistantPanel,
  interactive: true,
  variants: [
    {
      label: 'embedded (populated transcript)',
      props: {
        messages,
        contextLabel: 'About page',
        onSend: noop,
        onClear: noop,
        onHistory: noop,
        onApplySuggestion: noop,
        onDismissSuggestion: noop,
      },
      note: 'Assistant turn embeds an AI Suggestion Card; nothing lands until applied.',
    },
    {
      label: 'empty (starter chips)',
      props: {
        messages: [],
        suggestions: ['Write a hero headline', 'Suggest 3 section ideas', 'Improve my SEO title'],
        onSend: noop,
      },
    },
    {
      label: 'streaming',
      props: { messages, status: 'generating', onSend: noop, onStop: noop },
    },
    {
      label: 'disabled (with reason)',
      props: {
        messages,
        disabled: true,
        disabledReason: 'Connect an AI provider in Settings to use the assistant.',
        onSend: noop,
      },
    },
  ],
  props: [
    { name: 'messages', type: 'AiTurn[]', required: true, description: 'AiTurn = { id; role: user|assistant; content: ReactNode|string; at?; suggestion? }.' },
    { name: 'status', type: 'AiStatus', default: "'idle'", description: 'Lifecycle status (§5); drives the generation-status row + composer.' },
    { name: 'onSend', type: '(prompt: string) => void', required: true, description: 'Composer submit / starter-chip pick.' },
    { name: 'onStop', type: '() => void', description: 'Stop generation.' },
    { name: 'onClear', type: '() => void', description: 'Clear the conversation (header menu).' },
    { name: 'suggestions', type: 'string[]', description: 'Starter chips shown when the transcript is empty.' },
    { name: 'contextLabel', type: 'string', description: 'Scope chip in the header.' },
    { name: 'onApplySuggestion', type: '(id: string) => void', description: 'Apply an embedded suggestion.' },
    { name: 'onDismissSuggestion', type: '(id: string) => void', description: 'Dismiss an embedded suggestion.' },
    { name: 'disabled', type: 'boolean', default: 'false', description: 'Disable the composer (with a visible reason).' },
    { name: 'variant', type: "'embedded' | 'docked'", default: 'embedded', description: 'Inline vs a fixed inline-end panel.' },
    { name: 'labels', type: 'Partial<AiAssistantPanelLabels>', description: 'i18n overrides (name/menu/empty/composer strings…).' },
  ],
  events: [
    { name: 'onSend', payload: '(prompt: string)', description: 'A prompt was submitted.' },
    { name: 'onApplySuggestion', payload: '(id: string)', description: 'An embedded suggestion was applied.' },
  ],
  aria: [
    { attr: 'role="log"', value: 'polite', note: 'Streaming is announced on completion, not per-token.' },
    { attr: 'no avatar', value: 'assistant turns', note: 'Assistant turns are marked by the sparkle glyph, never a human avatar.' },
    { attr: 'doctrine', value: 'assistant proposes', note: 'Embedded suggestions require a human apply.' },
  ],
  enums: { status: AI_STATUSES },
  contract: { doc: '04-component-bible.md', heading: 'FxAiAssistantPanel — AI Assistant Panel' },
};
