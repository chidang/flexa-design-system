'use client';
/**
 * FxAiSuggestionCard — a single AI proposal, presented for review (doc 04 §3.10
 * "FxAiSuggestionCard — AI Suggestion Card").
 *
 * AI doctrine: a suggestion is proposed → gated → reversible; AI is never the
 * sole actor. This card frames one proposal (sparkle-accented FxCard) with its
 * content slot, optional confidence + rationale disclosure, and an action row
 * where a human Applies / Edits / Dismisses. Apply is async (button loading) and
 * always undoable (one history entry); once applied an Applied badge + Undo link
 * remain. The AI attribution badge is permanent. Every string is a prop.
 */
import { useState } from 'react';
import type { ReactNode } from 'react';
import { FxCard } from '../card/card';
import { FxBadge } from '../badge/badge';
import { FxButton } from '../button/button';
import { FxIcon } from '../icon/FxIcon';
import { FxAiConfidenceIndicator } from '../ai-confidence-indicator/ai-confidence-indicator';

/** One AI proposal. `content` is a slot — text or a passed Node (e.g. a diff). */
export interface AiSuggestion {
  id: string;
  kind: string;
  title?: string;
  content: ReactNode | string;
  confidence?: number;
  rationale?: string;
}

/** Baked-in strings — every one a prop (§i18n). */
export interface AiSuggestionCardLabels {
  attribution: string;
  apply: string;
  edit: string;
  dismiss: string;
  retry: string;
  why: string;
  applied: string;
  undo: string;
  appliedAnnounce: string;
}

export const DEFAULT_AI_SUGGESTION_CARD_LABELS: AiSuggestionCardLabels = {
  attribution: 'AI suggestion',
  apply: 'Apply',
  edit: 'Edit',
  dismiss: 'Dismiss',
  retry: 'Retry',
  why: 'Why this?',
  applied: 'Applied',
  undo: 'Undo',
  appliedAnnounce: 'Suggestion applied',
};

export interface FxAiSuggestionCardProps {
  suggestion: AiSuggestion;
  /** Async ⇒ Apply shows loading until the returned promise settles. Undoable. */
  onApply: () => void | Promise<void>;
  onEdit?: () => void;
  onDismiss?: () => void;
  onRetry?: () => void;
  /** Renders the Applied badge + Undo link. */
  applied?: boolean;
  onUndo?: () => void;
  /** Warning accents; Apply routes through the host's confirmation (host gates). */
  destructive?: boolean;
  /** i18n overrides, merged over English defaults. */
  labels?: Partial<AiSuggestionCardLabels>;
  className?: string;
}

export function FxAiSuggestionCard({
  suggestion,
  onApply,
  onEdit,
  onDismiss,
  onRetry,
  applied = false,
  onUndo,
  destructive = false,
  labels,
  className,
}: FxAiSuggestionCardProps) {
  const l = { ...DEFAULT_AI_SUGGESTION_CARD_LABELS, ...labels };
  const [busy, setBusy] = useState(false);
  const [rationaleOpen, setRationaleOpen] = useState(false);

  const apply = () => {
    if (busy || applied) return;
    const result = onApply();
    if (result instanceof Promise) {
      setBusy(true);
      result.finally(() => setBusy(false));
    }
  };

  const tone = destructive ? 'warning' : 'info';
  const rootClass = [
    'fx-ai-suggestion-card',
    destructive ? 'is-destructive' : '',
    applied ? 'is-applied' : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <FxCard className={rootClass}>
      <div className="fx-ai-suggestion-card-head">
        <span className="fx-ai-suggestion-card-sparkle" aria-hidden="true">
          <FxIcon name="sparkle" size={16} />
        </span>
        <span className="fx-ai-suggestion-card-heading">
          {suggestion.title != null && (
            <span className="fx-ai-suggestion-card-title">{suggestion.title}</span>
          )}
          <span className="fx-ai-suggestion-card-kind">{suggestion.kind}</span>
        </span>
        <FxBadge tone={tone} appearance="subtle" size="sm" icon="sparkle">
          {l.attribution}
        </FxBadge>
      </div>

      <div className="fx-ai-suggestion-card-content">{suggestion.content}</div>

      {typeof suggestion.confidence === 'number' && (
        <div className="fx-ai-suggestion-card-confidence">
          <FxAiConfidenceIndicator value={suggestion.confidence} size="sm" />
        </div>
      )}

      {suggestion.rationale != null && suggestion.rationale !== '' && (
        <div className="fx-ai-suggestion-card-rationale">
          <button
            type="button"
            className="fx-ai-suggestion-card-why"
            aria-expanded={rationaleOpen}
            onClick={() => setRationaleOpen((o) => !o)}
          >
            <FxIcon
              name="chevron-down"
              size={16}
              className="fx-ai-suggestion-card-why-icon"
            />
            <span>{l.why}</span>
          </button>
          {rationaleOpen && (
            <p className="fx-ai-suggestion-card-rationale-text">{suggestion.rationale}</p>
          )}
        </div>
      )}

      <div className="fx-ai-suggestion-card-actions">
        {applied ? (
          <>
            <FxBadge tone="success" appearance="subtle" size="sm" icon="check">
              {l.applied}
            </FxBadge>
            {onUndo && (
              <button type="button" className="fx-ai-suggestion-card-undo" onClick={onUndo}>
                <FxIcon name="rotate-ccw" size={16} />
                <span>{l.undo}</span>
              </button>
            )}
          </>
        ) : (
          <>
            <FxButton
              variant="primary"
              size="sm"
              loading={busy}
              onClick={apply}
              iconStart={<FxIcon name="check" size={16} />}
            >
              {l.apply}
            </FxButton>
            {onEdit && (
              <FxButton
                variant="ghost"
                size="sm"
                onClick={onEdit}
                iconStart={<FxIcon name="edit" size={16} />}
              >
                {l.edit}
              </FxButton>
            )}
            {onDismiss && (
              <FxButton
                variant="ghost"
                size="sm"
                onClick={onDismiss}
                iconStart={<FxIcon name="close" size={16} />}
              >
                {l.dismiss}
              </FxButton>
            )}
            {onRetry && (
              <FxButton
                variant="ghost"
                size="sm"
                onClick={onRetry}
                iconStart={<FxIcon name="rotate-ccw" size={16} />}
              >
                {l.retry}
              </FxButton>
            )}
          </>
        )}
      </div>

      <span className="fx-ai-suggestion-card-live" role="status" aria-live="polite">
        {applied ? l.appliedAnnounce : ''}
      </span>
    </FxCard>
  );
}
