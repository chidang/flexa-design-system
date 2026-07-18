'use client';
/**
 * FxCheckbox — independent boolean / one item in a multi-choice list (doc 04 §2.11).
 *
 * A visually-hidden native `<input type="checkbox">` carries all semantics and
 * keyboard behaviour (Space toggles); the `.fx-checkbox-box` renders the visual.
 * `indeterminate` is programmatic-only and set via the native `indeterminate` DOM
 * property (a ref effect) — which AT reads as "mixed" — never an `aria-checked`
 * attribute, which axe rejects on a native checkbox. It clears on the next user
 * interaction. Controlled + uncontrolled per §1.5. A bare checkbox
 * (table-row select) requires `aria-label`.
 */
import { useEffect, useId, useRef, useState } from 'react';
import type { InputHTMLAttributes, ReactNode } from 'react';
import type { Size } from '../enums';
import { FxIcon } from '../icon/FxIcon';

type NativeCheckboxProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'className' | 'checked' | 'defaultChecked' | 'size' | 'type' | 'onChange'
>;

/** `{ source }` meta accompanying every change (doc 04 §1.6). */
export interface CheckboxChangeMeta {
  source: 'input';
}

export interface FxCheckboxProps extends NativeCheckboxProps {
  /** Controlled checked state (§1.5). */
  checked?: boolean;
  /** Uncontrolled initial state. */
  defaultChecked?: boolean;
  /** Visual + `aria-checked="mixed"`; cleared by user interaction. */
  indeterminate?: boolean;
  /** Box size. Defaults to `md`. */
  size?: Size;
  /** `.is-invalid` + `aria-invalid`. */
  invalid?: boolean;
  /** Clicking the label toggles. Bare checkbox requires `aria-label`. */
  label?: ReactNode;
  /** Secondary line, wired to `aria-describedby`. */
  description?: string;
  onChange?: (checked: boolean, meta: CheckboxChangeMeta) => void;
  className?: string;
}

export function FxCheckbox({
  checked,
  defaultChecked = false,
  indeterminate = false,
  size = 'md',
  invalid = false,
  label,
  description,
  disabled,
  onChange,
  id,
  className,
  ...rest
}: FxCheckboxProps) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const descId = `${inputId}-desc`;
  const ref = useRef<HTMLInputElement>(null);
  const [internal, setInternal] = useState(defaultChecked);

  const controlled = checked !== undefined;
  const current = controlled ? checked : internal;

  // `indeterminate` is a DOM property, not an attribute.
  useEffect(() => {
    if (ref.current) ref.current.indeterminate = indeterminate;
  }, [indeterminate]);

  const commit = (next: boolean) => {
    if (!controlled) setInternal(next);
    onChange?.(next, { source: 'input' });
  };

  const rootClass = ['fx-checkbox', className].filter(Boolean).join(' ');

  return (
    <label
      className={rootClass}
      htmlFor={inputId}
      data-size={size}
      data-checked={current || undefined}
      data-indeterminate={indeterminate || undefined}
      data-invalid={invalid || undefined}
      data-disabled={disabled || undefined}
    >
      <span className="fx-checkbox-box">
        <input
          ref={ref}
          id={inputId}
          className="fx-checkbox-input"
          type="checkbox"
          checked={current}
          disabled={disabled}
          aria-invalid={invalid || undefined}
          aria-describedby={description ? descId : undefined}
          onChange={(event) => commit(event.target.checked)}
          {...rest}
        />
        <span className="fx-checkbox-mark" aria-hidden="true">
          {indeterminate ? (
            <span className="fx-checkbox-dash" />
          ) : (
            <FxIcon name="check" size={16} />
          )}
        </span>
      </span>
      {(label != null || description) && (
        <span className="fx-checkbox-text">
          {label != null && <span className="fx-checkbox-label">{label}</span>}
          {description && (
            <span className="fx-checkbox-description" id={descId}>
              {description}
            </span>
          )}
        </span>
      )}
    </label>
  );
}
