'use client';
/**
 * FxPromptInput — the specialized composer for instructing AI (doc 04 §3.10
 * "FxPromptInput — Prompt Input").
 *
 * Composes FxTextarea (auto-grow 1→6 rows) + optional attach icon button + a
 * primary send FxButton. Enter submits, Shift+Enter inserts a newline; submit is
 * disabled on empty/whitespace. While `status='generating'` the send slot becomes
 * Stop (icon + aria-label swap). Starter example chips fill the empty input. The
 * prompt is never lost — controlled-or-internal value survives error/stop
 * (ai.md doctrine). Every user-facing string is a prop.
 */
import { useState } from 'react';
import type { KeyboardEvent } from 'react';
import type { AiStatus } from '../enums';
import { FxTextarea } from '../textarea/textarea';
import { FxButton } from '../button/button';
import { FxChip } from '../chip/chip';
import { FxIcon } from '../icon/FxIcon';

/** Baked-in strings — every one a prop (§i18n). */
export interface PromptInputLabels {
  send: string;
  stop: string;
  attach: string;
  hint: string;
}

export const DEFAULT_PROMPT_INPUT_LABELS: PromptInputLabels = {
  send: 'Send',
  stop: 'Stop',
  attach: 'Attach context',
  hint: '↵ send · ⇧↵ newline',
};

export interface FxPromptInputProps {
  /** Controlled value (§1.5). */
  value?: string;
  /** Uncontrolled initial value. */
  defaultValue?: string;
  /** Fires with the trimmed-non-empty prompt on submit. */
  onSubmit: (prompt: string) => void;
  /** Fires per keystroke with the current value. */
  onChange?: (value: string) => void;
  /** Fires the Stop affordance (shown while generating). */
  onStop?: () => void;
  /** Lifecycle status (§5). Defaults to `idle`. */
  status?: AiStatus;
  /** Presentation. Defaults to `default`. */
  variant?: 'default' | 'bar' | 'hero';
  /** Placeholder text. Defaults to `Ask anything…`. */
  placeholder?: string;
  /** Character cap (counter surfaces near the limit). */
  maxLength?: number;
  /** Show the attach button. */
  attachments?: boolean;
  /** Fires when the attach button is pressed. */
  onAttach?: () => void;
  /** Starter chips shown when the input is empty (click-to-fill). */
  examples?: string[];
  /** Fires when an example chip is chosen. */
  onExample?: (ex: string) => void;
  /** Disable the composer (with a visible reason). */
  disabled?: boolean;
  /** Reason line shown while disabled. */
  disabledReason?: string;
  /** i18n overrides, merged over English defaults. */
  labels?: Partial<PromptInputLabels>;
  className?: string;
}

export function FxPromptInput({
  value,
  defaultValue = '',
  onSubmit,
  onChange,
  onStop,
  status = 'idle',
  variant = 'default',
  placeholder = 'Ask anything…',
  maxLength,
  attachments = false,
  onAttach,
  examples,
  onExample,
  disabled = false,
  disabledReason,
  labels,
  className,
}: FxPromptInputProps) {
  const l = { ...DEFAULT_PROMPT_INPUT_LABELS, ...labels };
  const controlled = value !== undefined;
  const [internal, setInternal] = useState(defaultValue);
  const current = controlled ? value : internal;

  const generating = status === 'generating';
  const isEmpty = current.trim() === '';

  const setValue = (next: string) => {
    if (!controlled) setInternal(next);
    onChange?.(next);
  };

  const submit = () => {
    if (disabled) return;
    const trimmed = current.trim();
    if (trimmed === '') return;
    onSubmit(trimmed);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      if (!generating) submit();
    }
  };

  const fillExample = (ex: string) => {
    setValue(ex);
    onExample?.(ex);
  };

  const rootClass = ['fx-prompt-input', className].filter(Boolean).join(' ');
  const showExamples = isEmpty && !disabled && examples !== undefined && examples.length > 0;
  const nearLimit = maxLength !== undefined && current.length >= Math.floor(maxLength * 0.9);

  return (
    <div className={rootClass} data-variant={variant} data-status={status} data-disabled={disabled || undefined}>
      {showExamples && (
        <div className="fx-prompt-input-examples">
          {examples.map((ex) => (
            <FxChip key={ex} label={ex} size="sm" onClick={() => fillExample(ex)} />
          ))}
        </div>
      )}

      <div className="fx-prompt-input-row">
        {attachments && (
          <button
            type="button"
            className="fx-prompt-input-attach"
            aria-label={l.attach}
            onClick={onAttach}
            disabled={disabled}
          >
            <FxIcon name="paperclip" size={20} />
          </button>
        )}

        <div className="fx-prompt-input-field">
          <FxTextarea
            className="fx-prompt-input-textarea"
            value={current}
            rows={1}
            maxRows={6}
            autoResize
            placeholder={placeholder}
            maxLength={maxLength}
            disabled={disabled}
            aria-label={placeholder}
            onChange={(next) => setValue(next)}
            onKeyDown={onKeyDown}
          />
        </div>

        {generating ? (
          <button
            type="button"
            className="fx-prompt-input-stop"
            aria-label={l.stop}
            onClick={onStop}
            disabled={disabled}
          >
            <FxIcon name="stop" size={20} />
          </button>
        ) : (
          <FxButton
            variant="primary"
            aria-label={l.send}
            disabled={disabled || isEmpty}
            onClick={submit}
            iconStart={<FxIcon name="send" size={16} />}
          />
        )}
      </div>

      <div className="fx-prompt-input-footer">
        {disabled && disabledReason ? (
          <span className="fx-prompt-input-reason">{disabledReason}</span>
        ) : (
          <span className="fx-prompt-input-hint">{l.hint}</span>
        )}
        {nearLimit && maxLength !== undefined && (
          <span className="fx-prompt-input-counter" aria-hidden="true">
            {current.length}/{maxLength}
          </span>
        )}
      </div>
    </div>
  );
}
