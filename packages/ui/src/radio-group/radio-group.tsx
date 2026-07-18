'use client';
/**
 * FxRadioGroup — choose exactly one of 2–6 visible options (doc 04 §2.12).
 *
 * Native `<input type="radio">` sharing one `name` gives the APG radiogroup
 * keyboard model for free: Arrow keys move focus AND selection, wrapping, with a
 * single tab stop (the checked radio, or the first enabled when none is checked).
 * We add `role="radiogroup"` on the wrapper and `[data-orientation]`; per-option
 * disable comes from `OptionItem.disabled`. Controlled + uncontrolled per §1.5.
 * The group is labelled by FxFieldGroup (`aria-labelledby` / `aria-label`).
 */
import { useId, useState } from 'react';

/**
 * One radio choice (doc 04 §1.9 `OptionItem` subset used by the group). Defined
 * locally — the shared `types.ts` barrel is owned centrally, not by this slice.
 */
export interface RadioOption {
  value: string;
  label: string;
  description?: string;
  disabled?: boolean;
}

/** `{ source }` meta accompanying every change (doc 04 §1.6). */
export interface RadioChangeMeta {
  source: 'input';
}

export interface FxRadioGroupProps {
  /** The choices. `description` renders a secondary line. */
  options: RadioOption[];
  /** Controlled value (§1.5). */
  value?: string | null;
  /** Uncontrolled initial value. */
  defaultValue?: string | null;
  /** Layout axis. Defaults to `vertical`. */
  orientation?: 'vertical' | 'horizontal';
  /** Shared native name. Auto-generated when omitted. */
  name?: string;
  /** Disables the whole group; per-option via `OptionItem.disabled`. */
  disabled?: boolean;
  /** `.is-invalid` on offending controls (message via FxValidationMessage). */
  invalid?: boolean;
  onChange?: (value: string, meta: RadioChangeMeta) => void;
  /** Accessible name when not wrapped by FxFieldGroup. */
  'aria-label'?: string;
  'aria-labelledby'?: string;
  id?: string;
  className?: string;
}

export function FxRadioGroup({
  options,
  value,
  defaultValue = null,
  orientation = 'vertical',
  name,
  disabled = false,
  invalid = false,
  onChange,
  id,
  className,
  ...aria
}: FxRadioGroupProps) {
  const autoId = useId();
  const groupName = name ?? `${autoId}-radio`;
  const [internal, setInternal] = useState<string | null>(defaultValue);

  const controlled = value !== undefined;
  const current = controlled ? value : internal;

  const commit = (next: string) => {
    if (!controlled) setInternal(next);
    onChange?.(next, { source: 'input' });
  };

  const rootClass = ['fx-radio-group', className].filter(Boolean).join(' ');

  return (
    <div
      className={rootClass}
      role="radiogroup"
      id={id}
      data-orientation={orientation}
      data-invalid={invalid || undefined}
      data-disabled={disabled || undefined}
      aria-label={aria['aria-label']}
      aria-labelledby={aria['aria-labelledby']}
    >
      {options.map((option) => {
        const optId = `${autoId}-${option.value}`;
        const descId = `${optId}-desc`;
        const optDisabled = disabled || option.disabled;
        const checked = current === option.value;
        return (
          <label
            key={option.value}
            className="fx-radio"
            htmlFor={optId}
            data-checked={checked || undefined}
            data-disabled={optDisabled || undefined}
          >
            <span className="fx-radio-dot">
              <input
                id={optId}
                className="fx-radio-input"
                type="radio"
                name={groupName}
                value={option.value}
                checked={checked}
                disabled={optDisabled}
                aria-describedby={option.description ? descId : undefined}
                onChange={() => commit(option.value)}
              />
            </span>
            <span className="fx-radio-text">
              <span className="fx-radio-label">{option.label}</span>
              {option.description && (
                <span className="fx-radio-description" id={descId}>
                  {option.description}
                </span>
              )}
            </span>
          </label>
        );
      })}
    </div>
  );
}
