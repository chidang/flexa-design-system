'use client';
/**
 * FxSwitch — instant-effect on/off setting (doc 04 §2.13).
 *
 * A visually-hidden native `<input type="checkbox">` with `role="switch"` carries
 * semantics + keyboard (Space/Enter toggle); the track + thumb render the visual.
 * `loading` shows a thumb spinner and marks the input inert (`aria-busy`).
 * Controlled + uncontrolled per §1.5. Bare switch requires `aria-label`.
 */
import { useId, useState } from 'react';
import type { InputHTMLAttributes, ReactNode } from 'react';
import type { Size } from '../enums';

type NativeSwitchProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'className' | 'checked' | 'defaultChecked' | 'size' | 'type' | 'role' | 'onChange'
>;

/** `{ source }` meta accompanying every change (doc 04 §1.6). */
export interface SwitchChangeMeta {
  source: 'input';
}

export interface FxSwitchProps extends NativeSwitchProps {
  /** Controlled checked state (§1.5). */
  checked?: boolean;
  /** Uncontrolled initial state. */
  defaultChecked?: boolean;
  /** Track size. `sm` 32×18 / `md` 40×22. Defaults to `md`. */
  size?: Extract<Size, 'sm' | 'md'>;
  /** `.is-invalid` + `aria-invalid`. */
  invalid?: boolean;
  /** Label states the thing controlled, not the current state. */
  label?: ReactNode;
  /** Async settings toggle: thumb spinner, input inert, `aria-busy`. */
  loading?: boolean;
  onChange?: (checked: boolean, meta: SwitchChangeMeta) => void;
  className?: string;
}

export function FxSwitch({
  checked,
  defaultChecked = false,
  size = 'md',
  invalid = false,
  label,
  loading = false,
  disabled,
  onChange,
  id,
  className,
  ...rest
}: FxSwitchProps) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const [internal, setInternal] = useState(defaultChecked);

  const controlled = checked !== undefined;
  const current = controlled ? checked : internal;

  const commit = (next: boolean) => {
    if (!controlled) setInternal(next);
    onChange?.(next, { source: 'input' });
  };

  const rootClass = ['fx-switch', className].filter(Boolean).join(' ');

  return (
    <label
      className={rootClass}
      htmlFor={inputId}
      data-size={size}
      data-checked={current || undefined}
      data-invalid={invalid || undefined}
      data-disabled={disabled || undefined}
      data-loading={loading || undefined}
    >
      <span className="fx-switch-control">
        <input
          id={inputId}
          className="fx-switch-input"
          type="checkbox"
          role="switch"
          checked={current}
          disabled={disabled || loading}
          aria-checked={current}
          aria-invalid={invalid || undefined}
          aria-busy={loading || undefined}
          onChange={(event) => commit(event.target.checked)}
          {...rest}
        />
        <span className="fx-switch-track" aria-hidden="true" />
        <span className="fx-switch-thumb" aria-hidden="true">
          {loading && <span className="fx-switch-spinner" />}
        </span>
      </span>
      {label != null && <span className="fx-switch-label">{label}</span>}
    </label>
  );
}
