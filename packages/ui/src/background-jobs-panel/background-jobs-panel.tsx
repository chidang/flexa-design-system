'use client';
/**
 * FxBackgroundJobsPanel — job-level drill-down beneath the Queue Monitor
 * (doc 04 §3.9).
 *
 * An FxTable of jobs: name, a status Badge, an inline Progress bar while
 * running, attempts (`2/5`), started/duration, and per-row Retry / Cancel /
 * View-payload actions. "View payload" opens an FxRightDrawer with the JSON
 * payload and any error; Cancel routes through a Confirmation Dialog. Status →
 * tone: queued/cancelled neutral, running info, succeeded success, failed
 * danger, retrying warning. Every user-facing string is a prop.
 */
import { useState } from 'react';
import type { ReactNode } from 'react';
import type { Tone, JobStatus } from '../enums';
import { FxTable, type TableColumn, type Key } from '../table/table';
import { FxBadge } from '../badge/badge';
import { FxProgress } from '../progress/progress';
import { FxButton } from '../button/button';
import { FxIcon } from '../icon/FxIcon';
import { FxRightDrawer } from '../right-drawer/right-drawer';
import { FxConfirmationDialog } from '../confirmation-dialog/confirmation-dialog';

/** One background job's snapshot. */
export interface JobInfo {
  id: string;
  name: string;
  status: JobStatus;
  /** 0–100 while running; omitted for indeterminate work. */
  progress?: number;
  attempts: number;
  maxAttempts: number;
  /** ISO timestamps. */
  queuedAt: string;
  startedAt?: string;
  finishedAt?: string;
  /** Error message shown in the drawer for failed jobs. */
  error?: string;
  /** Structured payload rendered as a JSON block in the drawer. */
  payload?: Record<string, unknown>;
}

/** Baked-in strings — every one a prop (§i18n). */
export interface BackgroundJobsPanelLabels {
  caption: string;
  colName: string;
  colStatus: string;
  colProgress: string;
  colAttempts: string;
  colStarted: string;
  colActions: string;
  retry: string;
  cancel: string;
  viewPayload: string;
  running: string;
  drawerTitle: string;
  payloadHeading: string;
  errorHeading: string;
  noPayload: string;
  empty: string;
  cancelTitle: string;
  cancelBody: string;
  cancelConfirm: string;
  cancelDismiss: string;
}

export const DEFAULT_BACKGROUND_JOBS_PANEL_LABELS: BackgroundJobsPanelLabels = {
  caption: 'Background jobs',
  colName: 'Job',
  colStatus: 'Status',
  colProgress: 'Progress',
  colAttempts: 'Attempts',
  colStarted: 'Started',
  colActions: 'Actions',
  retry: 'Retry',
  cancel: 'Cancel',
  viewPayload: 'View payload',
  running: 'Running',
  drawerTitle: 'Job details',
  payloadHeading: 'Payload',
  errorHeading: 'Error',
  noPayload: 'No payload was captured for this job.',
  empty: 'No jobs to display.',
  cancelTitle: 'Cancel this job?',
  cancelBody: 'Cancelling stops the job. Work already done is not rolled back.',
  cancelConfirm: 'Cancel job',
  cancelDismiss: 'Keep running',
};

export interface FxBackgroundJobsPanelProps {
  jobs: JobInfo[];
  /** Fired for a failed/cancelled job's Retry action. */
  onRetry?: (id: string) => void;
  /** Fired after the Cancel Confirmation Dialog is confirmed. */
  onCancel?: (id: string) => void;
  /** Fired when a row's payload drawer opens. */
  onOpen?: (id: string) => void;
  /** Pagination slot (FxPagination), passed through to FxTable. */
  pagination?: ReactNode;
  /** Loading state, passed through to FxTable. */
  loading?: boolean;
  /** Auto-poll interval (seconds) — informational; host owns polling. */
  pollInterval?: number;
  /** Baked-in strings. Merged over the English defaults. */
  labels?: Partial<BackgroundJobsPanelLabels>;
  className?: string;
}

/** Status → outcome tone (§3.9). */
export function statusTone(status: JobStatus): Tone {
  switch (status) {
    case 'running':
      return 'info';
    case 'succeeded':
      return 'success';
    case 'failed':
      return 'danger';
    case 'retrying':
      return 'warning';
    default:
      return 'neutral';
  }
}

/** Retry is offered for terminal-but-recoverable states. */
function canRetry(status: JobStatus): boolean {
  return status === 'failed' || status === 'cancelled';
}

/** Cancel is offered while the job is still in flight. */
function canCancel(status: JobStatus): boolean {
  return status === 'queued' || status === 'running' || status === 'retrying';
}

/** Absolute UTC time-of-day ("09:10 UTC"), or an em dash. */
function shortTime(iso?: string): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())} UTC`;
}

/** Duration between start and finish ("4.2s", "3m", "—"). */
function duration(startedAt?: string, finishedAt?: string): string {
  if (!startedAt || !finishedAt) return '';
  const a = new Date(startedAt).getTime();
  const b = new Date(finishedAt).getTime();
  if (Number.isNaN(a) || Number.isNaN(b) || b < a) return '';
  const sec = (b - a) / 1000;
  if (sec < 60) return `${sec.toFixed(1)}s`;
  if (sec < 3600) return `${Math.round(sec / 60)}m`;
  return `${Math.round(sec / 3600)}h`;
}

/** Pretty-print an object as escaped JSON. */
function json(value: Record<string, unknown>): string {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

export function FxBackgroundJobsPanel({
  jobs,
  onRetry,
  onCancel,
  onOpen,
  pagination,
  loading = false,
  pollInterval,
  labels,
  className,
}: FxBackgroundJobsPanelProps) {
  const l = { ...DEFAULT_BACKGROUND_JOBS_PANEL_LABELS, ...labels };
  const [openJob, setOpenJob] = useState<JobInfo | null>(null);
  const [cancelling, setCancelling] = useState<JobInfo | null>(null);

  const openPayload = (job: JobInfo) => {
    setOpenJob(job);
    onOpen?.(job.id);
  };

  const columns: TableColumn<JobInfo>[] = [
    {
      key: 'name',
      header: l.colName,
      render: (j) => <span className="fx-background-jobs-panel-name">{j.name}</span>,
    },
    {
      key: 'status',
      header: l.colStatus,
      render: (j) => (
        <FxBadge tone={statusTone(j.status)} appearance="subtle" size="sm" dot>
          {j.status}
        </FxBadge>
      ),
    },
    {
      key: 'progress',
      header: l.colProgress,
      render: (j) =>
        j.status === 'running' ? (
          <FxProgress
            value={j.progress ?? null}
            tone="info"
            size="sm"
            label={`${j.name}: ${l.running}`}
            showValue={j.progress != null}
          />
        ) : (
          <span className="fx-background-jobs-panel-muted">—</span>
        ),
    },
    {
      key: 'attempts',
      header: l.colAttempts,
      align: 'end',
      render: (j) => (
        <span className="fx-background-jobs-panel-attempts" data-exhausted={j.attempts >= j.maxAttempts || undefined}>
          {j.attempts}/{j.maxAttempts}
        </span>
      ),
    },
    {
      key: 'started',
      header: l.colStarted,
      render: (j) => {
        const dur = duration(j.startedAt, j.finishedAt);
        return (
          <span className="fx-background-jobs-panel-started">
            <time dateTime={j.startedAt ?? j.queuedAt}>{shortTime(j.startedAt)}</time>
            {dur && <span className="fx-background-jobs-panel-duration">{dur}</span>}
          </span>
        );
      },
    },
    {
      key: 'actions',
      header: l.colActions,
      align: 'end',
      render: (j) => (
        <div className="fx-background-jobs-panel-actions">
          {canRetry(j.status) && (
            <FxButton
              variant="ghost"
              size="sm"
              iconStart={<FxIcon name="rotate-ccw" size={16} />}
              onClick={() => onRetry?.(j.id)}
            >
              {l.retry}
            </FxButton>
          )}
          {canCancel(j.status) && (
            <FxButton variant="ghost" size="sm" onClick={() => setCancelling(j)}>
              {l.cancel}
            </FxButton>
          )}
          <button
            type="button"
            className="fx-background-jobs-panel-view"
            aria-label={`${l.viewPayload}: ${j.name}`}
            onClick={() => openPayload(j)}
          >
            <FxIcon name="eye" size={16} />
          </button>
        </div>
      ),
    },
  ];

  const rootClass = ['fx-background-jobs-panel', className].filter(Boolean).join(' ');

  return (
    <div className={rootClass} data-poll={pollInterval ?? undefined}>
      <FxTable<JobInfo>
        columns={columns}
        rows={jobs}
        rowKey={(j) => j.id as Key}
        rowLabel={(j) => j.name}
        caption={l.caption}
        loading={loading}
        pagination={pagination}
        emptyState={<span className="fx-background-jobs-panel-empty">{l.empty}</span>}
      />

      <FxRightDrawer
        open={openJob !== null}
        onOpenChange={(o) => {
          if (!o) setOpenJob(null);
        }}
        title={openJob ? `${l.drawerTitle} · ${openJob.name}` : l.drawerTitle}
        size="md"
      >
        {openJob && (
          <div className="fx-background-jobs-panel-detail">
            {openJob.error != null && (
              <section className="fx-background-jobs-panel-error">
                <h3 className="fx-background-jobs-panel-detail-heading">{l.errorHeading}</h3>
                <pre className="fx-background-jobs-panel-error-body">{openJob.error}</pre>
              </section>
            )}
            <section>
              <h3 className="fx-background-jobs-panel-detail-heading">{l.payloadHeading}</h3>
              {openJob.payload != null && Object.keys(openJob.payload).length > 0 ? (
                <pre className="fx-background-jobs-panel-payload">{json(openJob.payload)}</pre>
              ) : (
                <p className="fx-background-jobs-panel-muted">{l.noPayload}</p>
              )}
            </section>
          </div>
        )}
      </FxRightDrawer>

      <FxConfirmationDialog
        open={cancelling !== null}
        onOpenChange={(o) => {
          if (!o) setCancelling(null);
        }}
        tone="danger"
        title={l.cancelTitle}
        description={l.cancelBody}
        confirmLabel={l.cancelConfirm}
        cancelLabel={l.cancelDismiss}
        onConfirm={() => {
          if (cancelling) onCancel?.(cancelling.id);
          setCancelling(null);
        }}
      />
    </div>
  );
}
