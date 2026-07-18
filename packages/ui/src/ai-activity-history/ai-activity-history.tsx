'use client';
/**
 * FxAiActivityHistory — the immutable record of past AI runs (doc 04 §3.10
 * "FxAiActivityHistory — AI Activity History").
 *
 * AI doctrine: proposed → gated → reversible; AI is never the sole actor — every
 * run names both the AI and the human who decided ("Suggested by AI · approved by
 * {name}"). An ordered list of runs (sparkle + prompt excerpt + status/decision
 * badges + confidence dots + actor + timestamp); a row expands into an
 * FxRightDrawer with the full prompt. Audit-log discipline: read-only, no edits
 * ever. Every user-facing string is a prop.
 */
import { useState } from 'react';
import type { ReactNode } from 'react';
import type { AiStatus, AiDecision, Tone } from '../enums';
import { FxBadge } from '../badge/badge';
import { FxRightDrawer } from '../right-drawer/right-drawer';
import { FxIcon } from '../icon/FxIcon';
import { FxAiConfidenceIndicator } from '../ai-confidence-indicator/ai-confidence-indicator';

/** A named party (the human who decided; `id` optional for linking). */
export interface PartyRef {
  id?: string;
  name: string;
}

/** One immutable AI run. */
export interface AiRun {
  id: string;
  prompt: string;
  status: AiStatus;
  confidence?: number;
  decision?: AiDecision;
  actor: PartyRef;
  /** ISO 8601 timestamp (host formats before passing, or a plain label). */
  at: string;
  targetLabel?: string;
}

/** Baked-in strings — every one a prop (§i18n). `{name}` → the deciding party. */
export interface AiActivityHistoryLabels {
  suggestedByAi: string;
  approvedBy: string;
  rejectedBy: string;
  undoneBy: string;
  statusIdle: string;
  statusQueued: string;
  statusGenerating: string;
  statusSucceeded: string;
  statusFailed: string;
  statusCancelled: string;
  decisionApproved: string;
  decisionRejected: string;
  decisionUndone: string;
  open: string;
  rerun: string;
  drawerTitle: string;
  promptLabel: string;
  targetLabel: string;
  empty: string;
}

export const DEFAULT_AI_ACTIVITY_HISTORY_LABELS: AiActivityHistoryLabels = {
  suggestedByAi: 'Suggested by AI',
  approvedBy: 'approved by {name}',
  rejectedBy: 'rejected by {name}',
  undoneBy: 'undone by {name}',
  statusIdle: 'Idle',
  statusQueued: 'Queued',
  statusGenerating: 'Generating',
  statusSucceeded: 'Succeeded',
  statusFailed: 'Failed',
  statusCancelled: 'Cancelled',
  decisionApproved: 'Approved',
  decisionRejected: 'Rejected',
  decisionUndone: 'Undone',
  open: 'View run details',
  rerun: 'Re-run',
  drawerTitle: 'AI run details',
  promptLabel: 'Prompt',
  targetLabel: 'Target',
  empty: 'No AI runs yet.',
};

export interface FxAiActivityHistoryProps {
  runs: AiRun[];
  onOpen?: (id: string) => void;
  onRerun?: (id: string) => void;
  /** Pagination slot (FxPagination). */
  pagination?: ReactNode;
  /** Filter controls slot (status / decision). */
  filters?: ReactNode;
  /** i18n overrides, merged over English defaults. */
  labels?: Partial<AiActivityHistoryLabels>;
  className?: string;
}

const STATUS_TONE: Record<AiStatus, Tone> = {
  idle: 'neutral',
  queued: 'neutral',
  generating: 'info',
  succeeded: 'success',
  failed: 'danger',
  cancelled: 'neutral',
};

const DECISION_TONE: Record<AiDecision, Tone> = {
  approved: 'success',
  rejected: 'neutral',
  undone: 'warning',
};

function statusText(status: AiStatus, l: AiActivityHistoryLabels): string {
  const map: Record<AiStatus, string> = {
    idle: l.statusIdle,
    queued: l.statusQueued,
    generating: l.statusGenerating,
    succeeded: l.statusSucceeded,
    failed: l.statusFailed,
    cancelled: l.statusCancelled,
  };
  return map[status];
}

function decisionText(decision: AiDecision, l: AiActivityHistoryLabels): string {
  const map: Record<AiDecision, string> = {
    approved: l.decisionApproved,
    rejected: l.decisionRejected,
    undone: l.decisionUndone,
  };
  return map[decision];
}

function actorLine(run: AiRun, l: AiActivityHistoryLabels): string {
  const template =
    run.decision === 'approved'
      ? l.approvedBy
      : run.decision === 'rejected'
        ? l.rejectedBy
        : run.decision === 'undone'
          ? l.undoneBy
          : null;
  const by = template ? template.replace('{name}', run.actor.name) : null;
  return by ? `${l.suggestedByAi} · ${by}` : l.suggestedByAi;
}

export function FxAiActivityHistory({
  runs,
  onOpen,
  onRerun,
  pagination,
  filters,
  labels,
  className,
}: FxAiActivityHistoryProps) {
  const l = { ...DEFAULT_AI_ACTIVITY_HISTORY_LABELS, ...labels };
  const [openRun, setOpenRun] = useState<AiRun | null>(null);

  const open = (run: AiRun) => {
    setOpenRun(run);
    onOpen?.(run.id);
  };

  const rootClass = ['fx-ai-activity-history', className].filter(Boolean).join(' ');

  return (
    <div className={rootClass}>
      {filters != null && <div className="fx-ai-activity-history-filters">{filters}</div>}

      {runs.length === 0 ? (
        <p className="fx-ai-activity-history-empty">{l.empty}</p>
      ) : (
        <ol className="fx-ai-activity-history-list">
          {runs.map((run) => (
            <li key={run.id} className="fx-ai-activity-history-item" data-status={run.status}>
              <span className="fx-ai-activity-history-rail" aria-hidden="true">
                <span className="fx-ai-activity-history-marker">
                  <FxIcon name="sparkle" size={16} />
                </span>
              </span>
              <div className="fx-ai-activity-history-content">
                <div className="fx-ai-activity-history-head">
                  <button
                    type="button"
                    className="fx-ai-activity-history-prompt"
                    aria-label={l.open}
                    onClick={() => open(run)}
                  >
                    {run.prompt}
                  </button>
                  <div className="fx-ai-activity-history-badges">
                    <FxBadge tone={STATUS_TONE[run.status]} appearance="subtle" size="sm">
                      {statusText(run.status, l)}
                    </FxBadge>
                    {run.decision && (
                      <FxBadge tone={DECISION_TONE[run.decision]} appearance="subtle" size="sm">
                        {decisionText(run.decision, l)}
                      </FxBadge>
                    )}
                    {typeof run.confidence === 'number' && (
                      <FxAiConfidenceIndicator
                        value={run.confidence}
                        variant="dots"
                        size="sm"
                        showLabel={false}
                      />
                    )}
                  </div>
                </div>
                <div className="fx-ai-activity-history-meta">
                  <span className="fx-ai-activity-history-actor">{actorLine(run, l)}</span>
                  {run.targetLabel != null && run.targetLabel !== '' && (
                    <span className="fx-ai-activity-history-target">{run.targetLabel}</span>
                  )}
                  <time className="fx-ai-activity-history-time" dateTime={run.at}>
                    {run.at}
                  </time>
                  {onRerun && (
                    <button
                      type="button"
                      className="fx-ai-activity-history-rerun"
                      onClick={() => onRerun(run.id)}
                    >
                      <FxIcon name="rotate-ccw" size={16} />
                      <span>{l.rerun}</span>
                    </button>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ol>
      )}

      {pagination != null && <div className="fx-ai-activity-history-pagination">{pagination}</div>}

      <FxRightDrawer
        open={openRun !== null}
        onOpenChange={(o) => {
          if (!o) setOpenRun(null);
        }}
        title={l.drawerTitle}
        size="sm"
      >
        {openRun && (
          <dl className="fx-ai-activity-history-detail">
            <div className="fx-ai-activity-history-detail-row">
              <dt className="fx-ai-activity-history-detail-label">{l.promptLabel}</dt>
              <dd className="fx-ai-activity-history-detail-value">{openRun.prompt}</dd>
            </div>
            {openRun.targetLabel != null && openRun.targetLabel !== '' && (
              <div className="fx-ai-activity-history-detail-row">
                <dt className="fx-ai-activity-history-detail-label">{l.targetLabel}</dt>
                <dd className="fx-ai-activity-history-detail-value">{openRun.targetLabel}</dd>
              </div>
            )}
            <div className="fx-ai-activity-history-detail-row">
              <dt className="fx-ai-activity-history-detail-label">{l.suggestedByAi}</dt>
              <dd className="fx-ai-activity-history-detail-value">{actorLine(openRun, l)}</dd>
            </div>
          </dl>
        )}
      </FxRightDrawer>
    </div>
  );
}
