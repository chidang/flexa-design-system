/**
 * FxValidationMessage — the single message line under a field or group (doc 04 §2.19).
 *
 * Presentational (no hooks) → renders as a server component in docs. Field-level
 * tones only: danger (default) / warning / success — no `info` tone (help text is
 * FxFieldGroup's `help`). The leading icon is decorative (`aria-hidden`); tone is
 * conveyed by the text (§1.7.7). This element is NOT itself a live region — when
 * validation appears dynamically FxFieldGroup mounts it inside its `role="alert"`
 * slot so it announces once.
 */
import type { ReactNode } from 'react';
import { FxIcon } from '../icon/FxIcon';

/** Field-level tone — a component-specific subset of the status vocabulary. */
export type ValidationTone = 'danger' | 'warning' | 'success';

export interface FxValidationMessageProps {
  /** The message. Say how to fix, ≤ 1 short sentence (doc 10). */
  children?: ReactNode;
  /** Alias for `children` when passing a string. */
  message?: string;
  /** Severity. Defaults to `danger`. */
  tone?: ValidationTone;
  /** Consumed by the control's `aria-describedby` (FxFieldGroup wires this). */
  id?: string;
  className?: string;
}

export function FxValidationMessage({
  children,
  message,
  tone = 'danger',
  id,
  className,
}: FxValidationMessageProps) {
  const rootClass = ['fx-validation-message', className].filter(Boolean).join(' ');
  return (
    <p className={rootClass} id={id} data-tone={tone}>
      <span className="fx-validation-message-icon" aria-hidden="true" data-tone={tone}>
        {/* success = a real check glyph; danger/warning = an exclamation drawn in
            CSS on the tone disc. Both decorative — tone is conveyed by the text. */}
        {tone === 'success' && <FxIcon name="check" size={16} />}
      </span>
      <span className="fx-validation-message-text">{children ?? message}</span>
    </p>
  );
}
