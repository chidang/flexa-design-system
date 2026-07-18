'use client';
/**
 * FxUrlInput — URL field extending FxInput (doc 04 §3.4).
 *
 * Deltas over FxInput: `type="url"`, `inputMode="url"`, and an optional
 * `protocolPrefix` (e.g. `https://`) rendered as a start-affix. The stored value
 * INCLUDES the prefix: if the user hasn't typed a scheme, the prefix is prepended
 * on commit (blur / Enter). Paste normalizes internal whitespace. The component
 * never renders validity messages itself (FieldGroup `error` sets `.is-invalid`).
 * Controlled / uncontrolled per §1.5.
 */
import { useId, useRef, useState } from 'react';
import type { InputHTMLAttributes, KeyboardEvent } from 'react';
import type { Size } from '../enums';
import { FxIcon } from '../icon/FxIcon';

type NativeInputProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'className' | 'value' | 'defaultValue' | 'size' | 'type' | 'onChange' | 'inputMode' | 'prefix'
>;

/** `{ source }` meta accompanying every value change (doc 04 §1.6). */
export interface UrlChangeMeta {
  source: 'input' | 'clear' | 'prefix';
}

export interface FxUrlInputProps extends NativeInputProps {
  /** Controlled value (§1.5). */
  value?: string;
  /** Uncontrolled initial value. */
  defaultValue?: string;
  /** Start-affix scheme prepended on commit when the user omits one, e.g. `https://`. */
  protocolPrefix?: string;
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
  onChange?: (value: string, meta: UrlChangeMeta) => void;
  /** Enter-key convenience. */
  onEnter?: (value: string) => void;
  className?: string;
}

/** Collapse internal whitespace + trim (paste hygiene). */
const normalize = (raw: string): string => raw.replace(/\s+/g, '').trim();

const hasScheme = (value: string): boolean => /^[a-z][a-z0-9+.-]*:\/\//i.test(value);

export function FxUrlInput({
  value,
  defaultValue = '',
  protocolPrefix,
  size = 'md',
  invalid = false,
  readOnly = false,
  clearable = false,
  clearLabel = 'Clear',
  disabled,
  onChange,
  onEnter,
  onFocus,
  onBlur,
  id,
  className,
  ...rest
}: FxUrlInputProps) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const inputRef = useRef<HTMLInputElement>(null);
  const [focused, setFocused] = useState(false);
  const [internal, setInternal] = useState(defaultValue);

  const controlled = value !== undefined;
  const current = controlled ? value : internal;

  const commit = (next: string, source: UrlChangeMeta['source']) => {
    if (!controlled) setInternal(next);
    onChange?.(next, { source });
  };

  // The affix shows the prefix, so the control text hides a leading matching
  // prefix to avoid displaying `https://https://…`. Typing into the control is
  // taken as "after the prefix"; the stored value re-adds it on commit.
  const stripPrefix = (v: string): string =>
    protocolPrefix && v.startsWith(protocolPrefix) ? v.slice(protocolPrefix.length) : v;

  const display = protocolPrefix != null ? stripPrefix(current) : current;

  const commitOnBlur = () => {
    const cleaned = normalize(current);
    if (protocolPrefix && cleaned !== '' && !hasScheme(cleaned)) {
      commit(`${protocolPrefix}${cleaned}`, 'prefix');
    } else if (cleaned !== current) {
      commit(cleaned, 'input');
    }
  };

  const clear = () => {
    commit('', 'clear');
    inputRef.current?.focus();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      commitOnBlur();
      onEnter?.(current);
    } else if (event.key === 'Escape' && clearable && current !== '') {
      event.preventDefault();
      clear();
    }
  };

  const showClear = clearable && current !== '' && !disabled && !readOnly;
  const rootClass = ['fx-url-input', className].filter(Boolean).join(' ');

  return (
    <div
      className={rootClass}
      data-size={size}
      data-invalid={invalid || undefined}
      data-disabled={disabled || undefined}
      data-readonly={readOnly || undefined}
      data-focused={focused || undefined}
    >
      {protocolPrefix != null && (
        <span className="fx-url-input-affix" aria-hidden="true">
          {protocolPrefix}
        </span>
      )}
      <input
        ref={inputRef}
        id={inputId}
        className="fx-url-input-control"
        type="url"
        inputMode="url"
        value={display}
        disabled={disabled}
        readOnly={readOnly}
        aria-invalid={invalid || undefined}
        onChange={(event) => commit(event.target.value, 'input')}
        onKeyDown={handleKeyDown}
        onFocus={(event) => {
          setFocused(true);
          onFocus?.(event);
        }}
        onBlur={(event) => {
          setFocused(false);
          commitOnBlur();
          onBlur?.(event);
        }}
        {...rest}
      />
      {showClear && (
        <button type="button" className="fx-url-input-clear" aria-label={clearLabel} onClick={clear}>
          <FxIcon name="close" size={16} />
        </button>
      )}
    </div>
  );
}
