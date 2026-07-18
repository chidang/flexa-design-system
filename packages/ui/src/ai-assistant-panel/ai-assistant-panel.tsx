'use client';
/**
 * FxAiAssistantPanel — a conversational AI surface for iterating on a task
 * (doc 04 §3.10 "FxAiAssistantPanel — AI Assistant Panel").
 *
 * AI doctrine: proposed → gated → reversible; AI is never the sole actor. The
 * assistant converses and may embed FxAiSuggestionCards, but nothing lands until
 * a human applies. Header (name + sparkle + context chip + clear/history menu) →
 * transcript `role="log"` (polite; streaming announced on completion, not
 * per-token) → generation-status row → FxPromptInput composer. Empty state offers
 * starter suggestion chips. `embedded` renders inline; `docked` is a portal-less
 * fixed panel. Every user-facing string is a prop.
 */
import type { ReactNode } from 'react';
import type { AiStatus } from '../enums';
import { FxIcon } from '../icon/FxIcon';
import { FxChip } from '../chip/chip';
import { FxContextMenu, type MenuItem } from '../context-menu/context-menu';
import { FxPromptInput } from '../prompt-input/prompt-input';
import { FxAiGenerationStatus } from '../ai-generation-status/ai-generation-status';
import { FxAiSuggestionCard, type AiSuggestion } from '../ai-suggestion-card/ai-suggestion-card';

/** One turn in the conversation. Assistant turns may carry a suggestion. */
export interface AiTurn {
  id: string;
  role: 'user' | 'assistant';
  content: ReactNode | string;
  at?: string;
  suggestion?: AiSuggestion;
}

/** Baked-in strings — every one a prop (§i18n). */
export interface AiAssistantPanelLabels {
  assistantName: string;
  menu: string;
  clear: string;
  history: string;
  transcriptLabel: string;
  assistantTurnLabel: string;
  userTurnLabel: string;
  emptyTitle: string;
  emptyHint: string;
  composerPlaceholder: string;
  done: string;
}

export const DEFAULT_AI_ASSISTANT_PANEL_LABELS: AiAssistantPanelLabels = {
  assistantName: 'Assistant',
  menu: 'Assistant options',
  clear: 'Clear conversation',
  history: 'View history',
  transcriptLabel: 'Conversation',
  assistantTurnLabel: 'Assistant',
  userTurnLabel: 'You',
  emptyTitle: 'How can I help?',
  emptyHint: 'Try one of these to get started.',
  composerPlaceholder: 'Ask the assistant…',
  done: 'Assistant replied',
};

export interface FxAiAssistantPanelProps {
  messages: AiTurn[];
  /** Lifecycle status (§5). Defaults to `idle`. */
  status?: AiStatus;
  onSend: (prompt: string) => void;
  onStop?: () => void;
  onClear?: () => void;
  /** Fires when the header "history" menu item is chosen. */
  onHistory?: () => void;
  /** Starter chips shown when the transcript is empty. */
  suggestions?: string[];
  /** Scope chip in the header (e.g. the current page/selection). */
  contextLabel?: string;
  onApplySuggestion?: (id: string) => void;
  onDismissSuggestion?: (id: string) => void;
  disabled?: boolean;
  disabledReason?: string;
  /** Presentation. Defaults to `embedded` (docked mounts client-side). */
  variant?: 'embedded' | 'docked';
  /** i18n overrides, merged over English defaults. */
  labels?: Partial<AiAssistantPanelLabels>;
  className?: string;
}

export function FxAiAssistantPanel({
  messages,
  status = 'idle',
  onSend,
  onStop,
  onClear,
  onHistory,
  suggestions,
  contextLabel,
  onApplySuggestion,
  onDismissSuggestion,
  disabled = false,
  disabledReason,
  variant = 'embedded',
  labels,
  className,
}: FxAiAssistantPanelProps) {
  const l = { ...DEFAULT_AI_ASSISTANT_PANEL_LABELS, ...labels };
  const empty = messages.length === 0;
  const generating = status === 'generating' || status === 'queued';

  const menuItems: MenuItem[] = [
    { id: 'clear', label: l.clear, icon: 'rotate-ccw' },
    { id: 'history', label: l.history, icon: 'history' },
  ];

  const onMenuSelect = (item: MenuItem) => {
    if (item.id === 'clear') onClear?.();
    else if (item.id === 'history') onHistory?.();
  };

  const rootClass = ['fx-ai-assistant-panel', className].filter(Boolean).join(' ');

  return (
    <section className={rootClass} data-variant={variant} aria-label={l.assistantName}>
      <header className="fx-ai-assistant-panel-header">
        <span className="fx-ai-assistant-panel-brand">
          <span className="fx-ai-assistant-panel-sparkle" aria-hidden="true">
            <FxIcon name="sparkle" size={20} />
          </span>
          <span className="fx-ai-assistant-panel-name">{l.assistantName}</span>
        </span>
        {contextLabel != null && contextLabel !== '' && (
          <span className="fx-ai-assistant-panel-context">
            <FxChip label={contextLabel} size="sm" icon="eye" />
          </span>
        )}
        {(onClear || onHistory) && (
          <FxContextMenu
            items={menuItems}
            ariaLabel={l.menu}
            onSelect={onMenuSelect}
            trigger={
              <button type="button" className="fx-ai-assistant-panel-menu" aria-label={l.menu}>
                <FxIcon name="more" size={20} />
              </button>
            }
          />
        )}
      </header>

      <div
        className="fx-ai-assistant-panel-transcript"
        role="log"
        aria-live="polite"
        aria-label={l.transcriptLabel}
      >
        {empty ? (
          <div className="fx-ai-assistant-panel-empty">
            <span className="fx-ai-assistant-panel-empty-sparkle" aria-hidden="true">
              <FxIcon name="sparkle" size={24} />
            </span>
            <p className="fx-ai-assistant-panel-empty-title">{l.emptyTitle}</p>
            {suggestions !== undefined && suggestions.length > 0 && (
              <>
                <p className="fx-ai-assistant-panel-empty-hint">{l.emptyHint}</p>
                <div className="fx-ai-assistant-panel-starters">
                  {suggestions.map((s) => (
                    <FxChip key={s} label={s} size="sm" onClick={() => onSend(s)} />
                  ))}
                </div>
              </>
            )}
          </div>
        ) : (
          <ol className="fx-ai-assistant-panel-turns">
            {messages.map((turn) => (
              <li
                key={turn.id}
                className="fx-ai-assistant-panel-turn"
                data-role={turn.role}
              >
                <span className="fx-ai-assistant-panel-turn-role">
                  {turn.role === 'assistant' ? (
                    <span className="fx-ai-assistant-panel-turn-sparkle" aria-hidden="true">
                      <FxIcon name="sparkle" size={16} />
                    </span>
                  ) : null}
                  <span className="fx-ai-assistant-panel-turn-author">
                    {turn.role === 'assistant' ? l.assistantTurnLabel : l.userTurnLabel}
                  </span>
                </span>
                <div className="fx-ai-assistant-panel-bubble">
                  <div className="fx-ai-assistant-panel-bubble-content">{turn.content}</div>
                  {turn.suggestion && (
                    <div className="fx-ai-assistant-panel-suggestion">
                      <FxAiSuggestionCard
                        suggestion={turn.suggestion}
                        onApply={() => onApplySuggestion?.(turn.suggestion!.id)}
                        onDismiss={
                          onDismissSuggestion
                            ? () => onDismissSuggestion(turn.suggestion!.id)
                            : undefined
                        }
                      />
                    </div>
                  )}
                </div>
                {turn.at != null && turn.at !== '' && (
                  <time className="fx-ai-assistant-panel-turn-time" dateTime={turn.at}>
                    {turn.at}
                  </time>
                )}
              </li>
            ))}
          </ol>
        )}
      </div>

      {generating && (
        <div className="fx-ai-assistant-panel-status">
          <FxAiGenerationStatus status={status} onStop={onStop} />
        </div>
      )}

      <div className="fx-ai-assistant-panel-composer">
        <FxPromptInput
          onSubmit={onSend}
          onStop={onStop}
          status={status}
          placeholder={l.composerPlaceholder}
          disabled={disabled}
          disabledReason={disabledReason}
        />
      </div>
    </section>
  );
}
