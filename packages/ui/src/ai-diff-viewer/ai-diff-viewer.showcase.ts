/**
 * FxAiDiffViewer showcase spec. Exercises word- and line-granularity diffs,
 * unified vs split layout, per-hunk actions, and the honest no-changes case. The
 * first variant renders non-empty static markup (a computed diff + totals line).
 * `mode` / `granularity` / hunk decision are local prop-type unions (no §5 enum).
 */
import type { ShowcaseSpec } from '../showcase-types';
import { FxAiDiffViewer } from './ai-diff-viewer';

const noop = () => undefined;

const before = 'Handcrafted walnut desk organizer with three compartments.';
const after = 'Handcrafted walnut desk organizer with five compartments and a pen tray.';

const beforeLines = 'Title: Walnut organizer\nPrice: $69.80\nStatus: draft';
const afterLines = 'Title: Walnut desk organizer\nPrice: $74.80\nStatus: published';

export const aiDiffViewerShowcase: ShowcaseSpec = {
  name: 'AiDiffViewer',
  slug: 'ai-diff-viewer',
  category: 'ai',
  slice: 'U10',
  status: 'ready',
  tagline: 'Reviewable before/after diff for AI edits — add/remove rows with visually-hidden prefixes.',
  component: FxAiDiffViewer,
  variants: [
    {
      label: 'word diff (unified)',
      props: { before, after, summary: 'Expanded the description', fieldLabel: 'Description' },
    },
    {
      label: 'split mode',
      props: { before, after, mode: 'split', fieldLabel: 'Description' },
    },
    {
      label: 'line granularity',
      props: { before: beforeLines, after: afterLines, granularity: 'line', fieldLabel: 'Listing fields' },
    },
    {
      label: 'per-hunk actions',
      props: { before, after, perHunkActions: true, fieldLabel: 'Description', onHunkDecision: noop },
    },
    {
      label: 'no changes',
      props: { before, after: before, fieldLabel: 'Description' },
      note: 'Honest empty state — “AI suggests no changes”.',
    },
  ],
  props: [
    { name: 'before', type: 'string', required: true, description: 'Current text.' },
    { name: 'after', type: 'string', required: true, description: 'AI-suggested text.' },
    { name: 'mode', type: "'unified' | 'split'", default: 'unified', description: 'Single flow vs Current | Suggested panes.' },
    { name: 'granularity', type: "'line' | 'word'", default: 'word', description: 'Diff resolution.' },
    { name: 'summary', type: 'string', description: 'Human summary of the change.' },
    { name: 'fieldLabel', type: 'string', description: 'Field / file label in the header.' },
    { name: 'perHunkActions', type: 'boolean', default: 'false', description: 'Render accept/reject controls.' },
    { name: 'onHunkDecision', type: "(hunkId, 'accept' | 'reject') => void", description: 'A hunk accept/reject decision.' },
    { name: 'labels', type: 'Partial<AiDiffViewerLabels>', description: 'i18n overrides (current/suggested/added/removed/no-changes…).' },
  ],
  events: [
    { name: 'onHunkDecision', payload: "(hunkId: string, decision: 'accept' | 'reject')", description: 'A per-hunk accept/reject control was pressed.' },
  ],
  aria: [
    { attr: 'sr prefix', value: 'added / removed', note: 'Each add/del carries a visually-hidden prefix — never colour/strike alone.' },
    { attr: 'role="status"', value: '+N −M', note: 'Totals summarised in one polite status line.' },
    { attr: 'no-changes', value: 'plain text', note: 'The empty case states “AI suggests no changes” honestly.' },
  ],
  contract: { doc: '04-component-bible.md', heading: 'FxAiDiffViewer — AI Diff Viewer' },
};
