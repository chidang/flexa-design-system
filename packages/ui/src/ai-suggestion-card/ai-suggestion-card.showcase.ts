/**
 * FxAiSuggestionCard showcase spec. A proposed → gated → reversible AI change:
 * the first variant renders a populated card statically (sparkle header,
 * confidence, rationale, action row). Later variants cover the applied state
 * (Applied badge + Undo), a destructive proposal, and a retry affordance.
 * `suggestion.kind` is a free string (no §5 enum).
 */
import type { ShowcaseSpec } from '../showcase-types';
import { FxAiSuggestionCard, type AiSuggestion } from './ai-suggestion-card';

const noop = () => undefined;

const suggestion: AiSuggestion = {
  id: 's1',
  kind: 'Product description',
  title: 'Rewrite for a warmer tone',
  content:
    'Handmade in small batches, each ceramic mug carries the quiet imperfections that make it one of a kind — a little wobble here, a thumbprint there.',
  confidence: 0.82,
  rationale:
    'Your current copy leads with specs. Buyers of handmade goods respond to story and craft, so this draft foregrounds provenance and texture.',
};

const destructive: AiSuggestion = {
  id: 's2',
  kind: 'Bulk edit',
  title: 'Archive 12 stale drafts',
  content: 'Move 12 listings untouched for 90+ days to the archive to declutter your catalog.',
  confidence: 0.55,
  rationale: 'These drafts have no views and no edits since April; archiving is reversible.',
};

export const aiSuggestionCardShowcase: ShowcaseSpec = {
  name: 'AiSuggestionCard',
  slug: 'ai-suggestion-card',
  category: 'ai',
  slice: 'U10',
  status: 'ready',
  tagline: 'A single AI proposal — content, confidence, rationale — that a human applies or dismisses.',
  component: FxAiSuggestionCard,
  interactive: true,
  variants: [
    {
      label: 'proposed (confidence + rationale)',
      props: { suggestion, onApply: noop, onEdit: noop, onDismiss: noop },
      note: 'Apply is async + undoable; "Why this?" discloses the rationale.',
    },
    {
      label: 'applied (Undo link)',
      props: { suggestion, applied: true, onApply: noop, onUndo: noop },
    },
    {
      label: 'destructive (warning accent)',
      props: { suggestion: destructive, destructive: true, onApply: noop, onDismiss: noop },
      note: 'Apply routes through the host’s confirmation.',
    },
    {
      label: 'with Retry',
      props: {
        suggestion: { ...suggestion, title: undefined, confidence: undefined, rationale: undefined },
        onApply: noop,
        onDismiss: noop,
        onRetry: noop,
      },
    },
  ],
  props: [
    { name: 'suggestion', type: 'AiSuggestion', required: true, description: 'AiSuggestion = { id; kind; title?; content: ReactNode|string; confidence?; rationale? }.' },
    { name: 'onApply', type: '() => void | Promise<void>', required: true, description: 'Apply the proposal; async ⇒ button loading. Always undoable.' },
    { name: 'onEdit', type: '() => void', description: 'Open the proposal for manual edit before applying.' },
    { name: 'onDismiss', type: '() => void', description: 'Discard the proposal.' },
    { name: 'onRetry', type: '() => void', description: 'Ask the model to regenerate.' },
    { name: 'applied', type: 'boolean', default: 'false', description: 'Renders the Applied badge + Undo link.' },
    { name: 'onUndo', type: '() => void', description: 'Revert an applied suggestion.' },
    { name: 'destructive', type: 'boolean', default: 'false', description: 'Warning accents; Apply routes through the host’s confirmation.' },
    { name: 'labels', type: 'Partial<AiSuggestionCardLabels>', description: 'i18n overrides (Apply/Edit/Dismiss/Why this?/Applied/Undo…).' },
  ],
  events: [
    { name: 'onApply', payload: '()', description: 'The human applied the proposal.' },
    { name: 'onUndo', payload: '()', description: 'The human reverted an applied proposal.' },
  ],
  aria: [
    { attr: 'role="status"', value: 'polite', note: 'The applied state is announced politely.' },
    { attr: 'aria-expanded', value: 'Why this?', note: 'The rationale disclosure toggles aria-expanded.' },
    { attr: 'doctrine', value: 'proposed → gated → reversible', note: 'AI attribution badge is permanent; Apply is always undoable.' },
  ],
  contract: { doc: '04-component-bible.md', heading: 'FxAiSuggestionCard — AI Suggestion Card' },
};
