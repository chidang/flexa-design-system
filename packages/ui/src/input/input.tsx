'use client';
/**
 * FxInput — the root text-field control (doc 04 §2.4).
 *
 * Follows the seed house style: root `.fx-input` class, `data-size` attribute,
 * `.is-*`-flavoured `data-*` state hooks, token-only CSS, every baked-in string a
 * prop. Label, help and error live in FxFieldGroup (§2.20) — a bare FxInput
 * requires `aria-label` / `aria-labelledby`. Supports controlled and uncontrolled
 * modes per §1.5 (presence of `value` selects controlled).
 */
import { useId, useRef, useState } from 'react';
import type { InputHTMLAttributes, KeyboardEvent, ReactNode } from 'react';
import type { Size } from '../enums';
import { FxIcon } from '../icon/FxIcon';
import { ICON_NAMES, type IconName } from '../icon/map';

type NativeInputProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'className' | 'value' | 'defaultValue' | 'size' | 'type' | 'prefix' | 'onChange'
>;

/** `{ source }` meta accompanying every value change (doc 04 §1.6). */
export interface InputChangeMeta {
  source: 'input' | 'clear';
}

export interface FxInputProps extends NativeInputProps {
  /** Controlled value (§1.5). */
  value?: string;
  /** Uncontrolled initial value. */
  defaultValue?: string;
  /** Native type. Subclasses fix their own. Defaults to `text`. */
  type?: 'text' | 'search';
  /** Control height. Defaults to `md`. */
  size?: Size;
  /** `.is-invalid` + `aria-invalid`. Message rendering is FxValidationMessage's job. */
  invalid?: boolean;
  /** Focusable, value not editable. */
  readOnly?: boolean;
  /** Clear affordance; fires `onChange('', { source: 'clear' })`. */
  clearable?: boolean;
  /** Static leading affix (icon name or text), `aria-hidden`. */
  prefix?: string | IconName;
  /** Static trailing affix (icon name or text), `aria-hidden`. */
  suffix?: string | IconName;
  /** Accessible label for the clear button. i18n. */
  clearLabel?: string;
  /** Called per keystroke and on clear. */
  onChange?: (value: string, meta: InputChangeMeta) => void;
  /** Enter-key convenience. */
  onEnter?: (value: string) => void;
  className?: string;
}

/** A prefix/suffix value that names a registered icon renders as a glyph. */
function affix(value: string | IconName, position: 'start' | 'end'): ReactNode {
  const content = (ICON_NAMES as readonly string[]).includes(value) ? (
    <FxIcon name={value as IconName} size={16} />
  ) : (
    value
  );
  return (
    <span className={`fx-input-affix fx-input-affix--${position}`} aria-hidden="true">
      {content}
    </span>
  );
}

export function FxInput({
  value,
  defaultValue = '',
  type = 'text',
  size = 'md',
  invalid = false,
  readOnly = false,
  clearable = false,
  prefix,
  suffix,
  clearLabel = 'Clear',
  disabled,
  onChange,
  onEnter,
  onFocus,
  onBlur,
  id,
  className,
  ...rest
}: FxInputProps) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const inputRef = useRef<HTMLInputElement>(null);
  const [focused, setFocused] = useState(false);
  const [internal, setInternal] = useState(defaultValue);

  const controlled = value !== undefined;
  const current = controlled ? value : internal;

  const commit = (next: string, source: InputChangeMeta['source']) => {
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

  const showClear = clearable && current !== '' && !disabled && !readOnly;
  const rootClass = ['fx-input', className].filter(Boolean).join(' ');

  return (
    <div
      className={rootClass}
      data-size={size}
      data-invalid={invalid || undefined}
      data-disabled={disabled || undefined}
      data-readonly={readOnly || undefined}
      data-focused={focused || undefined}
    >
      {prefix != null && affix(prefix, 'start')}
      <input
        ref={inputRef}
        id={inputId}
        className="fx-input-control"
        type={type}
        value={current}
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
          onBlur?.(event);
        }}
        {...rest}
      />
      {showClear && (
        <button
          type="button"
          className="fx-input-clear"
          aria-label={clearLabel}
          onClick={clear}
        >
          <FxIcon name="close" size={16} />
        </button>
      )}
      {suffix != null && affix(suffix, 'end')}
    </div>
  );
}
