'use client';
/**
 * FxApproveRejectPanel — the single gate through which AI proposals become real
 * (doc 04 §3.10 "FxApproveRejectPanel — Approve/Reject Panel").
 *
 * AI doctrine: proposed → gated → reversible; AI is never the sole actor. This
 * is the human decision point — approve = apply (undoable), reject = discard
 * (optionally with a reason). Both actions are async (buttons show loading) and
 * the outcome is announced politely. `role="group"` names the review context.
 * Every user-facing string is a prop.
 */
import { useState } from 'react';
import { FxButton } from '../button/button';
import { FxInput } from '../input/input';
import { FxIcon } from '../icon/FxIcon';

/** Baked-in strings — every one a prop (§i18n). `{n}` → the change count. */
export interface ApproveRejectLabels {
  groupLabel: string;
  summaryCount: string;
  viewDiff: string;
  approve: string;
  reject: string;
  rejectReasonLabel: string;
  rejectReasonPlaceholder: string;
  rejectConfirm: string;
  rejectCancel: string;
  approved: string;
  rejected: string;
}

export const DEFAULT_APPROVE_REJECT_LABELS: ApproveRejectLabels = {
  groupLabel: 'Review AI changes',
  summaryCount: 'AI proposes {n} changes',
  viewDiff: 'View diff',
  approve: 'Approve',
  reject: 'Reject',
  rejectReasonLabel: 'Reason for rejecting',
  rejectReasonPlaceholder: 'Why are you rejecting these changes?',
  rejectConfirm: 'Confirm reject',
  rejectCancel: 'Cancel',
  approved: 'Changes approved',
  rejected: 'Changes rejected',
};

export interface FxApproveRejectPanelProps {
  summary: string;
  /** When set (and no custom summary intent), surfaces "{n} changes". */
  count?: number;
  /** Async ⇒ Approve shows loading until settle. Approve = apply (undoable). */
  onApprove: () => void | Promise<void>;
  /** Async ⇒ Reject shows loading until settle. Reject = discard. */
  onReject: (reason?: string) => void | Promise<void>;
  /** Opens the diff (typically an FxAiDiffViewer in a drawer/dialog). */
  onViewDiff?: () => void;
  /** Reveal a required reason input before a reject commits. Defaults to false. */
  requireRejectReason?: boolean;
  disabled?: boolean;
  busy?: boolean;
  approveLabel?: string;
  rejectLabel?: string;
  /** Presentation. Defaults to `inline`. */
  variant?: 'inline' | 'bar';
  /** i18n overrides, merged over English defaults. */
  labels?: Partial<ApproveRejectLabels>;
  className?: string;
}

type Decision = 'approved' | 'rejected' | '';

export function FxApproveRejectPanel({
  summary,
  count,
  onApprove,
  onReject,
  onViewDiff,
  requireRejectReason = false,
  disabled = false,
  busy = false,
  approveLabel,
  rejectLabel,
  variant = 'inline',
  labels,
  className,
}: FxApproveRejectPanelProps) {
  const l = { ...DEFAULT_APPROVE_REJECT_LABELS, ...labels };
  const [approving, setApproving] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [reasonOpen, setReasonOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [decision, setDecision] = useState<Decision>('');

  const locked = disabled || busy || approving || rejecting;

  const runApprove = () => {
    if (locked) return;
    const result = onApprove();
    if (result instanceof Promise) {
      setApproving(true);
      result
        .then(() => setDecision('approved'))
        .finally(() => setApproving(false));
    } else {
      setDecision('approved');
    }
  };

  const commitReject = (value?: string) => {
    const result = onReject(value);
    if (result instanceof Promise) {
      setRejecting(true);
      result
        .then(() => setDecision('rejected'))
        .finally(() => setRejecting(false));
    } else {
      setDecision('rejected');
    }
  };

  const rejectPressed = () => {
    if (locked) return;
    if (requireRejectReason) {
      setReasonOpen(true);
      return;
    }
    commitReject();
  };

  const confirmReject = () => {
    if (locked || reason.trim() === '') return;
    commitReject(reason.trim());
    setReasonOpen(false);
  };

  const rootClass = ['fx-approve-reject-panel', className].filter(Boolean).join(' ');
  const summaryText =
    summary !== '' ? summary : count !== undefined ? l.summaryCount.replace('{n}', String(count)) : '';

  return (
    <div
      className={rootClass}
      role="group"
      aria-label={l.groupLabel}
      data-variant={variant}
      data-disabled={disabled || undefined}
    >
      <div className="fx-approve-reject-panel-row">
        <p className="fx-approve-reject-panel-summary">{summaryText}</p>
        <div className="fx-approve-reject-panel-actions">
          {onViewDiff && (
            <button
              type="button"
              className="fx-approve-reject-panel-diff"
              onClick={onViewDiff}
              disabled={locked}
            >
              <FxIcon name="eye" size={16} />
              <span>{l.viewDiff}</span>
            </button>
          )}
          <FxButton
            variant="ghost"
            onClick={rejectPressed}
            loading={rejecting}
            disabled={locked}
            iconStart={<FxIcon name="close" size={16} />}
          >
            {rejectLabel ?? l.reject}
          </FxButton>
          <FxButton
            variant="primary"
            onClick={runApprove}
            loading={approving}
            disabled={locked}
            iconStart={<FxIcon name="check" size={16} />}
          >
            {approveLabel ?? l.approve}
          </FxButton>
        </div>
      </div>

      {reasonOpen && (
        <div className="fx-approve-reject-panel-reason">
          <label className="fx-approve-reject-panel-reason-field">
            <span className="fx-approve-reject-panel-reason-label">{l.rejectReasonLabel}</span>
            <FxInput
              value={reason}
              placeholder={l.rejectReasonPlaceholder}
              aria-label={l.rejectReasonLabel}
              onChange={(next) => setReason(next)}
            />
          </label>
          <div className="fx-approve-reject-panel-reason-actions">
            <FxButton
              variant="ghost"
              size="sm"
              onClick={() => setReasonOpen(false)}
              disabled={locked}
            >
              {l.rejectCancel}
            </FxButton>
            <FxButton
              variant="danger"
              size="sm"
              onClick={confirmReject}
              loading={rejecting}
              disabled={locked || reason.trim() === ''}
            >
              {l.rejectConfirm}
            </FxButton>
          </div>
        </div>
      )}

      <span className="fx-approve-reject-panel-live" role="status" aria-live="polite">
        {decision === 'approved' ? l.approved : decision === 'rejected' ? l.rejected : ''}
      </span>
    </div>
  );
}
