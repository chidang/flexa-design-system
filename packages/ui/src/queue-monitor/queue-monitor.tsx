'use client';
/**
 * FxQueueMonitor — ops health wall of per-queue cards (doc 04 §3.9).
 *
 * Each queue renders an FxCard with an FxMetricCard (depth + throughput
 * sparkline), oldest-pending age, a failed count, and a paused Badge; actions
 * are Pause/Resume and a "View jobs" drill-in. Depth crosses host thresholds
 * (`warnAt`/`dangerAt`) → tone. A honest freshness stamp ("Updated 12s ago") sits
 * in the header — it never hides staleness. Drain routes through a Confirmation
 * Dialog (pausing/draining is consequential). Every user-facing string is a prop.
 */
import { useState } from 'react';
import type { Tone } from '../enums';
import { FxCard } from '../card/card';
import { FxMetricCard } from '../metric-card/metric-card';
import { FxBadge } from '../badge/badge';
import { FxButton } from '../button/button';
import { FxIcon } from '../icon/FxIcon';
import { FxConfirmationDialog } from '../confirmation-dialog/confirmation-dialog';

/** Depth thresholds mapping queue depth → tone. */
export interface QueueThresholds {
  warnAt: number;
  dangerAt: number;
}

/** One queue's live snapshot. */
export interface QueueInfo {
  id: string;
  name: string;
  /** Pending job count. */
  depth: number;
  /** Age of the oldest pending job, in seconds. */
  oldestAgeSec?: number;
  /** Recent throughput (jobs/min). */
  throughputPerMin?: number;
  paused: boolean;
  failedCount: number;
  /** Optional recent throughput samples for the sparkline. */
  throughputSeries?: number[];
}

/** Queue-level action verbs. */
export type QueueAction = 'pause' | 'resume' | 'drain';

/** Baked-in strings — every one a prop (§i18n). */
export interface QueueMonitorLabels {
  region: string;
  depth: string;
  throughput: string;
  throughputUnit: string;
  oldest: string;
  failed: string;
  paused: string;
  active: string;
  pause: string;
  resume: string;
  drain: string;
  viewJobs: string;
  refreshedPrefix: string;
  empty: string;
  loading: string;
  drainTitle: string;
  drainBody: string;
  drainConfirm: string;
  cancel: string;
}

export const DEFAULT_QUEUE_MONITOR_LABELS: QueueMonitorLabels = {
  region: 'Queue monitor',
  depth: 'Depth',
  throughput: 'Throughput',
  throughputUnit: '/min',
  oldest: 'Oldest',
  failed: 'Failed',
  paused: 'Paused',
  active: 'Active',
  pause: 'Pause',
  resume: 'Resume',
  drain: 'Drain',
  viewJobs: 'View jobs',
  refreshedPrefix: 'Updated',
  empty: 'No queues to display.',
  loading: 'Loading queues…',
  drainTitle: 'Drain this queue?',
  drainBody: 'Draining discards all pending jobs in this queue. This cannot be undone.',
  drainConfirm: 'Drain queue',
  cancel: 'Cancel',
};

export interface FxQueueMonitorProps {
  queues: QueueInfo[];
  /** Fired for Pause/Resume/View-jobs; drain is confirmed first. */
  onQueueAction?: (queueId: string, action: QueueAction) => void;
  /** Fired when "View jobs" is pressed. */
  onQueueOpen?: (queueId: string) => void;
  /** Auto-poll interval (seconds) — informational; host owns polling. */
  refreshInterval?: number;
  /** Honest freshness stamp, host-formatted (e.g. "12s ago"). */
  refreshedAt?: string;
  /** Depth → tone thresholds. Defaults to warn 100 / danger 500. */
  thresholds?: QueueThresholds;
  /** Skeleton state. */
  loading?: boolean;
  /** Baked-in strings. Merged over the English defaults. */
  labels?: Partial<QueueMonitorLabels>;
  className?: string;
}

const DEFAULT_THRESHOLDS: QueueThresholds = { warnAt: 100, dangerAt: 500 };

/** Depth → tone via host thresholds. */
export function depthTone(depth: number, t: QueueThresholds): Tone {
  if (depth >= t.dangerAt) return 'danger';
  if (depth >= t.warnAt) return 'warning';
  return 'neutral';
}

/** Compact age string from seconds ("42s", "8m", "2h", "1d"). */
export function formatAge(sec: number): string {
  if (sec < 60) return `${Math.round(sec)}s`;
  if (sec < 3600) return `${Math.round(sec / 60)}m`;
  if (sec < 86400) return `${Math.round(sec / 3600)}h`;
  return `${Math.round(sec / 86400)}d`;
}

export function FxQueueMonitor({
  queues,
  onQueueAction,
  onQueueOpen,
  refreshInterval,
  refreshedAt,
  thresholds = DEFAULT_THRESHOLDS,
  loading = false,
  labels,
  className,
}: FxQueueMonitorProps) {
  const l = { ...DEFAULT_QUEUE_MONITOR_LABELS, ...labels };
  const [draining, setDraining] = useState<QueueInfo | null>(null);

  const rootClass = ['fx-queue-monitor', className].filter(Boolean).join(' ');

  const header = (
    <div className="fx-queue-monitor-header">
      <h3 className="fx-queue-monitor-heading">
        <FxIcon name="activity" size={20} className="fx-queue-monitor-heading-icon" />
        {l.region}
      </h3>
      {refreshedAt != null && (
        <p className="fx-queue-monitor-freshness">
          <FxIcon name="clock" size={16} />
          <span>
            {l.refreshedPrefix} {refreshedAt}
            {refreshInterval != null && <span className="fx-queue-monitor-interval"> · {refreshInterval}s</span>}
          </span>
        </p>
      )}
    </div>
  );

  if (loading) {
    return (
      <section className={rootClass} aria-label={l.region} aria-busy="true">
        {header}
        <div className="fx-queue-monitor-grid">
          {Array.from({ length: 3 }, (_, i) => (
            <FxMetricCard key={`sk-${i}`} label={l.depth} value="" loading />
          ))}
        </div>
        <span className="fx-queue-monitor-status" role="status">
          {l.loading}
        </span>
      </section>
    );
  }

  if (queues.length === 0) {
    return (
      <section className={rootClass} aria-label={l.region}>
        {header}
        <p className="fx-queue-monitor-empty">{l.empty}</p>
      </section>
    );
  }

  return (
    <section className={rootClass} aria-label={l.region}>
      {header}
      <ul className="fx-queue-monitor-grid">
        {queues.map((q) => (
          <li key={q.id} className="fx-queue-monitor-item">
            <FxCard
              padding="md"
              className="fx-queue-monitor-card"
              title={<span className="fx-queue-monitor-name">{q.name}</span>}
              headerActions={
                <FxBadge
                  tone={q.paused ? 'neutral' : 'success'}
                  appearance="subtle"
                  size="sm"
                  icon={q.paused ? 'pause' : 'play'}
                >
                  {q.paused ? l.paused : l.active}
                </FxBadge>
              }
              footer={
                <div className="fx-queue-monitor-actions">
                  {q.paused ? (
                    <FxButton variant="secondary" size="sm" onClick={() => onQueueAction?.(q.id, 'resume')}>
                      {l.resume}
                    </FxButton>
                  ) : (
                    <FxButton variant="secondary" size="sm" onClick={() => onQueueAction?.(q.id, 'pause')}>
                      {l.pause}
                    </FxButton>
                  )}
                  <FxButton variant="ghost" size="sm" onClick={() => setDraining(q)}>
                    {l.drain}
                  </FxButton>
                  <FxButton variant="ghost" size="sm" onClick={() => onQueueOpen?.(q.id)}>
                    {l.viewJobs}
                  </FxButton>
                </div>
              }
            >
              <div className="fx-queue-monitor-metrics">
                <FxMetricCard
                  size="sm"
                  label={l.depth}
                  value={q.depth}
                  sparkline={q.throughputSeries}
                  caption={
                    q.throughputPerMin != null
                      ? `${q.throughputPerMin}${l.throughputUnit}`
                      : undefined
                  }
                />
                <dl className="fx-queue-monitor-stats">
                  <div className="fx-queue-monitor-stat">
                    <dt>{l.oldest}</dt>
                    <dd data-stale={q.oldestAgeSec != null && q.oldestAgeSec >= 60 ? true : undefined}>
                      {q.oldestAgeSec != null ? formatAge(q.oldestAgeSec) : '—'}
                    </dd>
                  </div>
                  <div className="fx-queue-monitor-stat">
                    <dt>{l.failed}</dt>
                    <dd>
                      {q.failedCount > 0 ? (
                        <FxBadge tone="danger" appearance="subtle" size="sm" icon="warning">
                          {q.failedCount}
                        </FxBadge>
                      ) : (
                        '0'
                      )}
                    </dd>
                  </div>
                  <div className="fx-queue-monitor-stat">
                    <dt>{l.depth}</dt>
                    <dd>
                      <FxBadge tone={depthTone(q.depth, thresholds)} appearance="subtle" size="sm" dot>
                        {q.depth}
                      </FxBadge>
                    </dd>
                  </div>
                </dl>
              </div>
            </FxCard>
          </li>
        ))}
      </ul>

      <FxConfirmationDialog
        open={draining !== null}
        onOpenChange={(o) => {
          if (!o) setDraining(null);
        }}
        tone="danger"
        title={l.drainTitle}
        description={l.drainBody}
        confirmLabel={l.drainConfirm}
        cancelLabel={l.cancel}
        onConfirm={() => {
          if (draining) onQueueAction?.(draining.id, 'drain');
          setDraining(null);
        }}
      />
    </section>
  );
}
