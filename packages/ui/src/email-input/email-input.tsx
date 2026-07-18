'use client';
/**
 * FxEmailInput — email field extending FxInput (doc 04 §3.4).
 *
 * Deltas over FxInput: `type="email"`, `inputMode="email"`,
 * `autoComplete="email"`, and an optional inline "did you mean …?" suggestion.
 * `domainSuggestions` maps a typo domain → its correction; when the current
 * entry's domain matches, a dismissible suggestion button appears and accepting
 * it fires `onChange(corrected, { source: 'option' })`. Multiple-address entry is
 * FxTagInput, not this control. Controlled / uncontrolled per §1.5.
 */
import { useId, useRef, useState } from 'react';
import type { InputHTMLAttributes, KeyboardEvent } from 'react';
import type { Size } from '../enums';
import { FxIcon } from '../icon/FxIcon';

type NativeInputProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'className' | 'value' | 'defaultValue' | 'size' | 'type' | 'onChange' | 'autoComplete' | 'inputMode'
>;

/** `{ source }` meta accompanying every value change (doc 04 §1.6). */
export interface EmailChangeMeta {
  source: 'input' | 'clear' | 'option';
}

export interface FxEmailInputProps extends NativeInputProps {
  /** Controlled value (§1.5). */
  value?: string;
  /** Uncontrolled initial value. */
  defaultValue?: string;
  /** Control height. Defaults to `md`. */
  size?: Size;
  /** `.is-invalid` + `aria-invalid`. */
  invalid?: boolean;
  /** Focusable, value not editable. */
  readOnly?: boolean;
  /** Clear affordance; fires `onChange('', { source: 'clear' })`. */
  clearable?: boolean;
  /** Accessible label for the clear button. i18n. */
  clearLabel?: string;
  /** Typo-domain → correction map, e.g. `{ 'gmial.com': 'gmail.com' }`. */
  domainSuggestions?: Record<string, string>;
  /** Prefix for the inline suggestion, e.g. "Did you mean". i18n. */
  suggestionLabel?: string;
  /** Accessible label for dismissing the suggestion. i18n. */
  dismissSuggestionLabel?: string;
  onChange?: (value: string, meta: EmailChangeMeta) => void;
  /** Enter-key convenience. */
  onEnter?: (value: string) => void;
  className?: string;
}

/** Return the corrected address if the current domain has a suggestion. */
const suggest = (value: string, map: Record<string, string>): string | null => {
  const at = value.lastIndexOf('@');
  if (at < 0) return null;
  const local = value.slice(0, at);
  const domain = value.slice(at + 1).toLowerCase();
  const fix = map[domain];
  if (!fix || fix === domain) return null;
  return `${local}@${fix}`;
};

export function FxEmailInput({
  value,
  defaultValue = '',
  size = 'md',
  invalid = false,
  readOnly = false,
  clearable = false,
  clearLabel = 'Clear',
  domainSuggestions,
  suggestionLabel = 'Did you mean',
  dismissSuggestionLabel = 'Dismiss suggestion',
  disabled,
  onChange,
  onEnter,
  onFocus,
  onBlur,
  id,
  className,
  ...rest
}: FxEmailInputProps) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const suggestionId = `${inputId}-suggestion`;
  const inputRef = useRef<HTMLInputElement>(null);
  const [focused, setFocused] = useState(false);
  const [internal, setInternal] = useState(defaultValue);
  const [dismissed, setDismissed] = useState<string | null>(null);

  const controlled = value !== undefined;
  const current = controlled ? value : internal;

  const commit = (next: string, source: EmailChangeMeta['source']) => {
    if (!controlled) setInternal(next);
    onChange?.(next, { source });
  };

  const clear = () => {
    commit('', 'clear');
    inputRef.current?.focus();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      onEnter?.(current);
    } else if (event.key === 'Escape' && clearable && current !== '') {
      event.preventDefault();
      clear();
    }
  };

  const corrected = domainSuggestions ? suggest(current, domainSuggestions) : null;
  const showSuggestion = corrected !== null && corrected !== dismissed && !disabled && !readOnly;
  const showClear = clearable && current !== '' && !disabled && !readOnly;
  const rootClass = ['fx-email-input', className].filter(Boolean).join(' ');

  return (
    <div className={rootClass} data-size={size}>
      <div
        className="fx-email-input-field"
        data-invalid={invalid || undefined}
        data-disabled={disabled || undefined}
        data-readonly={readOnly || undefined}
        data-focused={focused || undefined}
      >
        <input
          ref={inputRef}
          id={inputId}
          className="fx-email-input-control"
          type="email"
          inputMode="email"
          autoComplete="email"
          value={current}
          disabled={disabled}
          readOnly={readOnly}
          aria-invalid={invalid || undefined}
          aria-describedby={showSuggestion ? suggestionId : undefined}
          onChange={(event) => commit(event.target.value, 'input')}
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
        {showClear && (
          <button type="button" className="fx-email-input-clear" aria-label={clearLabel} onClick={clear}>
            <FxIcon name="close" size={16} />
          </button>
        )}
      </div>
      {showSuggestion && corrected && (
        <p id={suggestionId} className="fx-email-input-suggestion">
          {suggestionLabel}{' '}
          <button
            type="button"
            className="fx-email-input-suggestion-accept"
            onClick={() => {
              setDismissed(null);
              commit(corrected, 'option');
              inputRef.current?.focus();
            }}
          >
            {corrected}
          </button>
          <button
            type="button"
            className="fx-email-input-suggestion-dismiss"
            aria-label={dismissSuggestionLabel}
            onClick={() => setDismissed(corrected)}
          >
            <FxIcon name="close" size={16} />
          </button>
        </p>
      )}
    </div>
  );
}
