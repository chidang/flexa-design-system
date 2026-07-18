/**
 * FxAiGenerationStatus showcase spec. Walks the full lifecycle (queued →
 * generating → succeeded / failed / cancelled), the inline/block/button variants,
 * the step feed, and the Stop / Retry affordances. The first variant renders
 * non-empty static markup (a `role="status"` line). `status` is the shared
 * `AiStatus` §5 enum; `variant` / step `state` are local prop-type unions.
 */
import type { ShowcaseSpec } from '../showcase-types';
import { AI_STATUSES } from '../enums';
import { FxAiGenerationStatus, type GenerationStep } from './ai-generation-status';

const noop = () => undefined;

const steps: GenerationStep[] = [
  { id: 's1', label: 'Reading your catalog', state: 'done' },
  { id: 's2', label: 'Drafting copy', state: 'active' },
  { id: 's3', label: 'Checking tone', state: 'pending' },
];

export const aiGenerationStatusShowcase: ShowcaseSpec = {
  name: 'AiGenerationStatus',
  slug: 'ai-generation-status',
  category: 'ai',
  slice: 'U10',
  status: 'ready',
  tagline: 'The canonical AI lifecycle display: queued → generating → done / failed / stopped.',
  component: FxAiGenerationStatus,
  variants: [
    {
      label: 'generating + Stop',
      props: { status: 'generating', elapsedSec: 3, onStop: noop },
    },
    { label: 'queued', props: { status: 'queued' } },
    { label: 'succeeded', props: { status: 'succeeded', elapsedSec: 8 } },
    {
      label: 'failed + Retry (role=alert)',
      props: { status: 'failed', onRetry: noop },
    },
    { label: 'cancelled', props: { status: 'cancelled' } },
    {
      label: 'block variant (shimmer)',
      props: { status: 'generating', variant: 'block', onStop: noop },
    },
    {
      label: 'button variant',
      props: { status: 'generating', variant: 'button', elapsedSec: 5, onStop: noop },
    },
    {
      label: 'multi-stage step feed',
      props: { status: 'generating', steps, onStop: noop },
    },
  ],
  props: [
    { name: 'status', type: 'AiStatus', required: true, description: 'Lifecycle status (§5): idle|queued|generating|succeeded|failed|cancelled.' },
    { name: 'variant', type: "'inline' | 'block' | 'button'", default: 'inline', description: 'Presentation; block reserves shimmer placeholder lines.' },
    { name: 'label', type: 'string', description: 'Overrides the default per-status text.' },
    { name: 'steps', type: 'GenerationStep[]', description: '{ id; label; state: pending|active|done|error } pipeline feed.' },
    { name: 'elapsedSec', type: 'number', description: 'Elapsed seconds display.' },
    { name: 'onStop', type: '() => void', description: 'Stop affordance (shown while generating).' },
    { name: 'onRetry', type: '() => void', description: 'Retry affordance (shown on failure).' },
    { name: 'labels', type: 'Partial<AiGenerationStatusLabels>', description: 'i18n overrides (per-status text, Stop, Retry).' },
  ],
  events: [
    { name: 'onStop', payload: '()', description: 'The Stop button was pressed while generating.' },
    { name: 'onRetry', payload: '()', description: 'The Retry button was pressed after a failure.' },
  ],
  aria: [
    { attr: 'role="status"', value: 'polite', note: 'Announces lifecycle transitions politely.' },
    { attr: 'role="alert"', value: 'on failure', note: 'A failed generation switches to an assertive alert.' },
    { attr: 'prefers-reduced-motion', value: 'static', note: 'The sparkle pulse and shimmer fall back to static.' },
  ],
  enums: { status: AI_STATUSES },
  contract: { doc: '04-component-bible.md', heading: 'FxAiGenerationStatus — AI Generation Status' },
};
