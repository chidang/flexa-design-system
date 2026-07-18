/**
 * FxAiActivityHistory showcase spec. The immutable record of AI runs: the first
 * variant renders a static list with a run of each decision (approved / rejected
 * / undone) plus a failed run — every one naming both the AI and the human who
 * decided. A row expands into an FxRightDrawer (client-only, so absent from the
 * static snapshot). `status` and `decision` are the shared §5 enums.
 */
import type { ShowcaseSpec } from '../showcase-types';
import { AI_STATUSES, AI_DECISIONS } from '../enums';
import { FxAiActivityHistory, type AiRun } from './ai-activity-history';

const noop = () => undefined;

const runs: AiRun[] = [
  {
    id: 'r1',
    prompt: 'Rewrite the hero headline to be punchier',
    status: 'succeeded',
    confidence: 0.86,
    decision: 'approved',
    actor: { id: 'u1', name: 'Ada' },
    at: '2026-07-17 09:12',
    targetLabel: 'Home · Hero',
  },
  {
    id: 'r2',
    prompt: 'Generate 5 alternative pricing sections',
    status: 'succeeded',
    confidence: 0.61,
    decision: 'rejected',
    actor: { id: 'u2', name: 'Grace' },
    at: '2026-07-17 08:40',
    targetLabel: 'Pricing',
  },
  {
    id: 'r3',
    prompt: 'Archive stale draft listings',
    status: 'succeeded',
    confidence: 0.72,
    decision: 'undone',
    actor: { id: 'u1', name: 'Ada' },
    at: '2026-07-16 17:05',
  },
  {
    id: 'r4',
    prompt: 'Draft an about page from my logo',
    status: 'failed',
    actor: { id: 'u3', name: 'Linus' },
    at: '2026-07-16 15:22',
  },
];

export const aiActivityHistoryShowcase: ShowcaseSpec = {
  name: 'AiActivityHistory',
  slug: 'ai-activity-history',
  category: 'ai',
  slice: 'U10',
  status: 'ready',
  tagline: 'An immutable record of AI runs — each naming the AI and the human who decided.',
  component: FxAiActivityHistory,
  interactive: true,
  variants: [
    {
      label: 'runs (approved / rejected / undone / failed)',
      props: { runs, onOpen: noop, onRerun: noop },
      note: 'AI is never sole actor — every run shows "Suggested by AI · {decision} by {name}".',
    },
    {
      label: 'no re-run',
      props: { runs: runs.slice(0, 2), onOpen: noop },
    },
    {
      label: 'empty',
      props: { runs: [] },
    },
  ],
  props: [
    { name: 'runs', type: 'AiRun[]', required: true, description: 'AiRun = { id; prompt; status; confidence?; decision?; actor: PartyRef; at; targetLabel? }.' },
    { name: 'onOpen', type: '(id: string) => void', description: 'A run’s detail drawer opened.' },
    { name: 'onRerun', type: '(id: string) => void', description: 'Re-run the same prompt.' },
    { name: 'pagination', type: 'ReactNode', description: 'Pagination slot (FxPagination).' },
    { name: 'filters', type: 'ReactNode', description: 'Filter controls slot (status / decision).' },
    { name: 'labels', type: 'Partial<AiActivityHistoryLabels>', description: 'i18n overrides (status/decision/actor/drawer strings…).' },
  ],
  events: [
    { name: 'onOpen', payload: '(id: string)', description: 'A run’s detail drawer opened.' },
    { name: 'onRerun', payload: '(id: string)', description: 'The re-run affordance was pressed.' },
  ],
  aria: [
    { attr: 'contract', value: 'read-only', note: 'Immutable — no edit affordances ever (Audit-log discipline).' },
    { attr: 'aria-label', value: 'View run details', note: 'Names the prompt-excerpt expand button.' },
    { attr: 'role="dialog"', value: 'drawer', note: 'The full prompt opens in an FxRightDrawer (Esc closes).' },
  ],
  enums: { status: AI_STATUSES, decision: AI_DECISIONS },
  contract: { doc: '04-component-bible.md', heading: 'FxAiActivityHistory — AI Activity History' },
};
