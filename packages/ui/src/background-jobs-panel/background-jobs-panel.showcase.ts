/**
 * FxBackgroundJobsPanel showcase spec. Rows exercise every JobStatus (§5
 * `JobStatus`) — declared as `enums: { status: JOB_STATUSES }` — including a
 * running job with an inline Progress bar and a failed job whose View-payload
 * drawer surfaces its error + payload. First variant is non-empty static
 * markup; icon-only View buttons carry aria-labels and the table has a caption.
 */
import type { ShowcaseSpec } from '../showcase-types';
import { JOB_STATUSES } from '../enums';
import { FxBackgroundJobsPanel, type JobInfo } from './background-jobs-panel';

const noop = () => undefined;

const jobs: JobInfo[] = [
  {
    id: 'j1',
    name: 'export.orders',
    status: 'running',
    progress: 62,
    attempts: 1,
    maxAttempts: 3,
    queuedAt: '2026-07-17T09:08:00Z',
    startedAt: '2026-07-17T09:09:00Z',
    payload: { format: 'csv', range: '2026-06', rows: 18422 },
  },
  {
    id: 'j2',
    name: 'email.receipt',
    status: 'succeeded',
    attempts: 1,
    maxAttempts: 5,
    queuedAt: '2026-07-17T09:00:00Z',
    startedAt: '2026-07-17T09:00:01Z',
    finishedAt: '2026-07-17T09:00:05Z',
    payload: { to: 'buyer@example.com', template: 'receipt-v2' },
  },
  {
    id: 'j3',
    name: 'payout.settle',
    status: 'failed',
    attempts: 3,
    maxAttempts: 3,
    queuedAt: '2026-07-17T08:50:00Z',
    startedAt: '2026-07-17T08:50:02Z',
    finishedAt: '2026-07-17T08:50:09Z',
    error: 'ProviderError: insufficient_balance (code 402)\n  at settlePayout (payouts.ts:88)',
    payload: { payoutId: 'p9', amount: 7480, currency: 'USD' },
  },
  {
    id: 'j4',
    name: 'index.rebuild',
    status: 'retrying',
    attempts: 2,
    maxAttempts: 5,
    queuedAt: '2026-07-17T09:05:00Z',
    startedAt: '2026-07-17T09:05:10Z',
  },
  {
    id: 'j5',
    name: 'import.catalog',
    status: 'queued',
    attempts: 0,
    maxAttempts: 3,
    queuedAt: '2026-07-17T09:11:00Z',
  },
  {
    id: 'j6',
    name: 'thumbnail.generate',
    status: 'cancelled',
    attempts: 1,
    maxAttempts: 3,
    queuedAt: '2026-07-17T08:30:00Z',
    startedAt: '2026-07-17T08:30:02Z',
    finishedAt: '2026-07-17T08:30:20Z',
  },
];

export const backgroundJobsPanelShowcase: ShowcaseSpec = {
  name: 'BackgroundJobsPanel',
  slug: 'background-jobs-panel',
  category: 'admin',
  slice: 'U10',
  status: 'ready',
  tagline: 'Job-level table with status, running progress, attempts and a payload/error drawer.',
  component: FxBackgroundJobsPanel,
  interactive: true,
  variants: [
    {
      label: 'mixed statuses',
      props: { jobs, onRetry: noop, onCancel: noop, onOpen: noop },
      note: 'Running shows inline Progress; the failed row’s eye opens the error + payload drawer.',
    },
    {
      label: 'failed job (retryable)',
      props: { jobs: [jobs[2]], onRetry: noop, onOpen: noop },
      note: 'Exhausted attempts render danger; Retry re-enqueues.',
    },
    {
      label: 'loading',
      props: { jobs: [], loading: true },
    },
    {
      label: 'empty',
      props: { jobs: [] },
    },
  ],
  props: [
    { name: 'jobs', type: 'JobInfo[]', required: true, description: 'JobInfo = { id; name; status: JobStatus; progress?; attempts; maxAttempts; queuedAt; startedAt?; finishedAt?; error?; payload? }.' },
    { name: 'onRetry', type: '(id: string) => void', description: 'Retry a failed/cancelled job (re-enqueues).' },
    { name: 'onCancel', type: '(id: string) => void', description: 'Fired after the Cancel Confirmation Dialog is confirmed.' },
    { name: 'onOpen', type: '(id: string) => void', description: 'Fired when a row’s payload drawer opens.' },
    { name: 'pagination', type: 'ReactNode', description: 'Pagination slot (FxPagination), passed through to FxTable.' },
    { name: 'loading', type: 'boolean', default: 'false', description: 'Skeleton / overlay state, passed through to FxTable.' },
    { name: 'pollInterval', type: 'number', description: 'Auto-poll interval in seconds (informational; host owns polling).' },
    { name: 'labels', type: 'Partial<BackgroundJobsPanelLabels>', description: 'i18n overrides for every column, action and drawer string.' },
  ],
  events: [
    { name: 'onRetry', payload: '(id: string)', description: 'A failed/cancelled job was retried.' },
    { name: 'onCancel', payload: '(id: string)', description: 'A job was cancelled (after confirmation).' },
    { name: 'onOpen', payload: '(id: string)', description: 'A payload drawer opened.' },
  ],
  keyboard: [
    { keys: 'Tab', action: 'Move through per-row Retry / Cancel / View-payload controls.' },
    { keys: 'Enter / Space', action: 'Activate the focused action; Cancel opens the Confirmation Dialog, View opens the drawer.' },
    { keys: 'Esc', action: 'Close the payload drawer or cancel the Confirmation Dialog.' },
  ],
  aria: [
    { attr: 'caption', value: 'Background jobs', note: 'The FxTable is named by its caption.' },
    { attr: 'aria-label', value: 'View payload: {job}', note: 'Names the icon-only View button per row.' },
    { attr: 'role="dialog"', value: 'payload drawer', note: 'Payload + error open in an FxRightDrawer (Esc closes).' },
    { attr: 'role="alertdialog"', value: 'cancel', note: 'Cancel routes through a danger Confirmation Dialog.' },
    { attr: 'Badge + dot', value: 'status', note: 'Status pairs colour with a dot (§1.7.7) — never colour alone.' },
  ],
  enums: { status: JOB_STATUSES },
  contract: { doc: '04-component-bible.md', heading: 'FxBackgroundJobsPanel — Background Jobs Panel' },
};
