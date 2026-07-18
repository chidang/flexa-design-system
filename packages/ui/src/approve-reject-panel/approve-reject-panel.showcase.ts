/**
 * FxApproveRejectPanel showcase spec. The single gate on an AI proposal: the
 * first variant renders a populated static panel (summary + View diff + Reject +
 * Approve). Later variants cover the count-driven summary, the required-reason
 * reject flow, the bar variant, and a busy state. `variant` is a local prop-type
 * union (no §5 enum).
 */
import type { ShowcaseSpec } from '../showcase-types';
import { FxApproveRejectPanel } from './approve-reject-panel';

const noop = () => undefined;

export const approveRejectPanelShowcase: ShowcaseSpec = {
  name: 'ApproveRejectPanel',
  slug: 'approve-reject-panel',
  category: 'ai',
  slice: 'U10',
  status: 'ready',
  tagline: 'The single human gate: approve = apply (undoable), reject = discard.',
  component: FxApproveRejectPanel,
  interactive: true,
  variants: [
    {
      label: 'summary + View diff',
      props: {
        summary: 'AI proposes 8 changes across 3 sections',
        onApprove: noop,
        onReject: noop,
        onViewDiff: noop,
      },
      note: 'Approve/Reject are async; decision is announced politely.',
    },
    {
      label: 'count-driven summary',
      props: { summary: '', count: 4, onApprove: noop, onReject: noop },
    },
    {
      label: 'require reject reason',
      props: {
        summary: 'AI proposes 2 changes to your pricing',
        requireRejectReason: true,
        onApprove: noop,
        onReject: noop,
        onViewDiff: noop,
      },
      note: 'Reject reveals a required note before it commits.',
    },
    {
      label: 'bar variant',
      props: {
        summary: 'AI proposes 12 changes',
        variant: 'bar',
        onApprove: noop,
        onReject: noop,
        onViewDiff: noop,
      },
    },
    {
      label: 'busy',
      props: { summary: 'AI proposes 3 changes', busy: true, onApprove: noop, onReject: noop },
    },
  ],
  props: [
    { name: 'summary', type: 'string', required: true, description: 'Summary line; empty falls back to the count-driven "{n} changes".' },
    { name: 'count', type: 'number', description: 'Change count for the fallback summary.' },
    { name: 'onApprove', type: '() => void | Promise<void>', required: true, description: 'Approve = apply (undoable). Async ⇒ button loading.' },
    { name: 'onReject', type: '(reason?: string) => void | Promise<void>', required: true, description: 'Reject = discard, optionally with a reason. Async ⇒ button loading.' },
    { name: 'onViewDiff', type: '() => void', description: 'Open the diff (typically FxAiDiffViewer).' },
    { name: 'requireRejectReason', type: 'boolean', default: 'false', description: 'Reveal a required reason input before a reject commits.' },
    { name: 'disabled', type: 'boolean', default: 'false', description: 'Disable the whole gate.' },
    { name: 'busy', type: 'boolean', default: 'false', description: 'External busy state (locks both actions).' },
    { name: 'approveLabel', type: 'string', default: "'Approve'", description: 'Override the approve button text.' },
    { name: 'rejectLabel', type: 'string', default: "'Reject'", description: 'Override the reject button text.' },
    { name: 'variant', type: "'inline' | 'bar'", default: 'inline', description: 'Card footer vs sticky footer bar.' },
    { name: 'labels', type: 'Partial<ApproveRejectLabels>', description: 'i18n overrides (summary/approve/reject/reason strings…).' },
  ],
  events: [
    { name: 'onApprove', payload: '()', description: 'The proposal was approved (apply).' },
    { name: 'onReject', payload: '(reason?: string)', description: 'The proposal was rejected (discard), with an optional reason.' },
  ],
  aria: [
    { attr: "role=\"group\"", value: 'Review AI changes', note: 'Names the review context.' },
    { attr: 'role="status"', value: 'polite', note: "Announces 'Changes approved' / 'Changes rejected'." },
    { attr: 'doctrine', value: 'the single gate', note: 'AI proposals become real only through a human decision here.' },
  ],
  contract: { doc: '04-component-bible.md', heading: 'FxApproveRejectPanel — Approve/Reject Panel' },
};
