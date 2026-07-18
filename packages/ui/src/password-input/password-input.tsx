'use client';
/**
 * FxPasswordInput — password field extending FxInput (doc 04 §3.4).
 *
 * Deltas over FxInput: native `type="password"` with a trailing visibility
 * toggle (`.fx-password-input-toggle`, `eye`/`eye-off`, `aria-pressed`,
 * `aria-label` `showLabel`/`hideLabel`) that is NEVER disabled; a required
 * `autoComplete` (`current-password` | `new-password`); and an optional strength
 * meter (`strengthMeter`) rendered via FxProgress with a `role="status"` label.
 * The value itself is never announced. Controlled / uncontrolled per §1.5.
 */
import { useId, useRef, useState } from 'react';
import type { InputHTMLAttributes, KeyboardEvent } from 'react';
import type { Size } from '../enums';
import { FxIcon } from '../icon/FxIcon';
import { FxProgress } from '../progress/progress';
import type { Tone } from '../enums';

type NativeInputProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'className' | 'value' | 'defaultValue' | 'size' | 'type' | 'onChange' | 'autoComplete'
>;

/** `{ source }` meta accompanying every value change (doc 04 §1.6). */
export interface PasswordChangeMeta {
  source: 'input';
}

/** Strength read-out for `strengthMeter`. */
export interface PasswordStrength {
  /** 0 (weakest) – 4 (strongest). */
  score: 0 | 1 | 2 | 3 | 4;
  /** Human label, announced politely (e.g. "Strong"). */
  label: string;
}

export interface FxPasswordInputProps extends NativeInputProps {
  /** Controlled value (§1.5). */
  value?: string;
  /** Uncontrolled initial value. */
  defaultValue?: string;
  /** Required — reveals intent to browsers/managers. */
  autoComplete: 'current-password' | 'new-password';
  /** Control height. Defaults to `md`. */
  size?: Size;
  /** `.is-invalid` + `aria-invalid`. */
  invalid?: boolean;
  /** Focusable, value not editable. */
  readOnly?: boolean;
  /** Accessible label for the toggle while hidden. i18n. */
  showLabel?: string;
  /** Accessible label for the toggle while visible. i18n. */
  hideLabel?: string;
  /** Derive a strength read-out from the current value → renders a meter. */
  strengthMeter?: (value: string) => PasswordStrength;
  onChange?: (value: string, meta: PasswordChangeMeta) => void;
  /** Enter-key convenience. */
  onEnter?: (value: string) => void;
  className?: string;
}

/** Score → progress tone (danger → success). */
const SCORE_TONE: Record<PasswordStrength['score'], Tone> = {
  0: 'danger',
  1: 'danger',
  2: 'warning',
  3: 'info',
  4: 'success',
};

export function FxPasswordInput({
  value,
  defaultValue = '',
  autoComplete,
  size = 'md',
  invalid = false,
  readOnly = false,
  showLabel = 'Show password',
  hideLabel = 'Hide password',
  strengthMeter,
  disabled,
  onChange,
  onEnter,
  onFocus,
  onBlur,
  id,
  className,
  ...rest
}: FxPasswordInputProps) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const inputRef = useRef<HTMLInputElement>(null);
  const [focused, setFocused] = useState(false);
  const [visible, setVisible] = useState(false);
  const [internal, setInternal] = useState(defaultValue);

  const controlled = value !== undefined;
  const current = controlled ? value : internal;

  const commit = (next: string) => {
    if (!controlled) setInternal(next);
    onChange?.(next, { source: 'input' });
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') onEnter?.(current);
  };

  const strength = strengthMeter && current !== '' ? strengthMeter(current) : null;
  const rootClass = ['fx-password-input', className].filter(Boolean).join(' ');

  return (
    <div className={rootClass} data-size={size}>
      <div
        className="fx-password-input-field"
        data-invalid={invalid || undefined}
        data-disabled={disabled || undefined}
        data-readonly={readOnly || undefined}
        data-focused={focused || undefined}
      >
        <input
          ref={inputRef}
          id={inputId}
          className="fx-password-input-control"
          type={visible ? 'text' : 'password'}
          value={current}
          autoComplete={autoComplete}
          disabled={disabled}
          readOnly={readOnly}
          aria-invalid={invalid || undefined}
          onChange={(event) => commit(event.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={(event) => {
            setFocused(true);
            onFocus?.(event);
          }}
          onBlur={(event) => {
            setFocused(false);
            onBlur?.(event);
          }}
          {...rest}
        />
        <button
          type="button"
          className="fx-password-input-toggle"
          aria-label={visible ? hideLabel : showLabel}
          aria-pressed={visible}
          onClick={() => {
            setVisible((v) => !v);
            inputRef.current?.focus();
          }}
        >
          <FxIcon name={visible ? 'eye-off' : 'eye'} size={16} />
        </button>
      </div>
      {strength && (
        <div className="fx-password-input-strength">
          <FxProgress
            value={(strength.score / 4) * 100}
            tone={SCORE_TONE[strength.score]}
            size="sm"
            label={strength.label}
          />
          <span className="fx-password-input-strength-label" role="status">
            {strength.label}
          </span>
        </div>
      )}
    </div>
  );
}
