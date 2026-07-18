'use client';
/**
 * FxNumberInput — numeric text field extending FxInput (doc 04 §2.6).
 *
 * Deltas over FxInput: `value: number | null` (null = empty), a trailing stepper
 * group (up/down), and `role="spinbutton"` semantics via `aria-valuemin/max/now`
 * when bounded / steppers shown. Clamping to `min`/`max` and `precision`
 * formatting happen on COMMIT (blur / Enter / step), not per keystroke, so the
 * user can type freely. Controlled/uncontrolled per §1.5 (presence of `value`).
 */
import { useId, useRef, useState } from 'react';
import type { InputHTMLAttributes, KeyboardEvent } from 'react';
import type { Size } from '../enums';
import { FxIcon } from '../icon/FxIcon';

type NativeInputProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'className' | 'value' | 'defaultValue' | 'size' | 'type' | 'prefix' | 'onChange' | 'min' | 'max' | 'step'
>;

/** `{ source }` meta accompanying every value change (doc 04 §1.6). */
export interface NumberChangeMeta {
  source: 'input' | 'step' | 'clear';
}

export interface FxNumberInputProps extends NativeInputProps {
  /** Controlled value; `null` = empty (§1.5). */
  value?: number | null;
  /** Uncontrolled initial value. Defaults to `null`. */
  defaultValue?: number | null;
  /** Lower bound; clamped on commit (blur / Enter / step), not per keystroke. */
  min?: number;
  /** Upper bound; clamped on commit. */
  max?: number;
  /** Increment. Defaults to `1`. */
  step?: number;
  /** Decimal places; formats the display on blur. */
  precision?: number;
  /** Render the up/down stepper group. Defaults to `true`. */
  showSteppers?: boolean;
  /** Control height. Defaults to `md`. */
  size?: Size;
  /** `.is-invalid` + `aria-invalid`. */
  invalid?: boolean;
  /** Focusable, value not editable. */
  readOnly?: boolean;
  /** Accessible label for the increment button. i18n. */
  incrementLabel?: string;
  /** Accessible label for the decrement button. i18n. */
  decrementLabel?: string;
  /** Static leading affix (text), `aria-hidden`. */
  prefix?: string;
  /** Called on commit and per keystroke (best-effort parse). */
  onChange?: (value: number | null, meta: NumberChangeMeta) => void;
  className?: string;
}

const clampTo = (n: number, min?: number, max?: number): number => {
  let out = n;
  if (min !== undefined && out < min) out = min;
  if (max !== undefined && out > max) out = max;
  return out;
};

const format = (n: number, precision?: number): string =>
  precision !== undefined ? n.toFixed(precision) : String(n);

/** Best-effort parse of a partial entry ("", "-", "1.") → number | null. */
const parse = (text: string): number | null => {
  const trimmed = text.trim();
  if (trimmed === '') return null;
  const n = Number(trimmed);
  return Number.isFinite(n) ? n : null;
};

export function FxNumberInput({
  value,
  defaultValue = null,
  min,
  max,
  step = 1,
  precision,
  showSteppers = true,
  size = 'md',
  invalid = false,
  readOnly = false,
  incrementLabel = 'Increase',
  decrementLabel = 'Decrease',
  prefix,
  disabled,
  onChange,
  onFocus,
  onBlur,
  id,
  className,
  ...rest
}: FxNumberInputProps) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const inputRef = useRef<HTMLInputElement>(null);
  const [focused, setFocused] = useState(false);

  const controlled = value !== undefined;
  const initialText = defaultValue === null ? '' : format(defaultValue, precision);
  const [internalNum, setInternalNum] = useState<number | null>(defaultValue);
  const [text, setText] = useState(initialText);

  const currentNum = controlled ? (value ?? null) : internalNum;
  // In controlled mode the display tracks the incoming value except while the
  // user is mid-edit (focused); uncontrolled always follows local text.
  const display = controlled && !focused ? (value === null || value === undefined ? '' : format(value, precision)) : text;

  const commitNumber = (next: number | null, source: NumberChangeMeta['source'], displayText?: string) => {
    const clamped = next === null ? null : clampTo(next, min, max);
    // `text` backs the display whenever the field is focused (both modes), so
    // keep it in sync on every commit — step buttons/keys must show their effect.
    setText(displayText ?? (clamped === null ? '' : format(clamped, precision)));
    if (!controlled) setInternalNum(clamped);
    onChange?.(clamped, { source });
  };

  const handleType = (raw: string) => {
    // Display follows `text` while focused in both modes — always track keystrokes.
    setText(raw);
    onChange?.(parse(raw), { source: 'input' });
  };

  const stepBy = (delta: number) => {
    if (disabled || readOnly) return;
    const base = currentNum ?? (min !== undefined ? min : 0);
    commitNumber(base + delta, 'step');
    inputRef.current?.focus();
  };

  const commitOnBlur = () => {
    const parsed = parse(text);
    commitNumber(parsed, 'input');
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (disabled || readOnly) return;
    switch (event.key) {
      case 'ArrowUp':
        event.preventDefault();
        stepBy(step);
        break;
      case 'ArrowDown':
        event.preventDefault();
        stepBy(-step);
        break;
      case 'PageUp':
        event.preventDefault();
        stepBy(step * 10);
        break;
      case 'PageDown':
        event.preventDefault();
        stepBy(-step * 10);
        break;
      case 'Home':
        if (min !== undefined) {
          event.preventDefault();
          commitNumber(min, 'step');
        }
        break;
      case 'End':
        if (max !== undefined) {
          event.preventDefault();
          commitNumber(max, 'step');
        }
        break;
      case 'Enter':
        commitOnBlur();
        break;
      default:
        break;
    }
  };

  const bounded = showSteppers || min !== undefined || max !== undefined;
  const atMin = min !== undefined && currentNum !== null && currentNum <= min;
  const atMax = max !== undefined && currentNum !== null && currentNum >= max;
  const rootClass = ['fx-number-input', className].filter(Boolean).join(' ');

  return (
    <div
      className={rootClass}
      data-size={size}
      data-invalid={invalid || undefined}
      data-disabled={disabled || undefined}
      data-readonly={readOnly || undefined}
      data-focused={focused || undefined}
    >
      {prefix != null && (
        <span className="fx-number-input-affix" aria-hidden="true">
          {prefix}
        </span>
      )}
      <input
        ref={inputRef}
        id={inputId}
        className="fx-number-input-control"
        type="text"
        inputMode="decimal"
        value={display}
        disabled={disabled}
        readOnly={readOnly}
        role="spinbutton"
        aria-invalid={invalid || undefined}
        aria-valuemin={bounded && min !== undefined ? min : undefined}
        aria-valuemax={bounded && max !== undefined ? max : undefined}
        aria-valuenow={bounded && currentNum !== null ? currentNum : undefined}
        onChange={(event) => handleType(event.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={(event) => {
          setFocused(true);
          if (controlled) setText(value === null || value === undefined ? '' : format(value, precision));
          onFocus?.(event);
        }}
        onBlur={(event) => {
          setFocused(false);
          commitOnBlur();
          onBlur?.(event);
        }}
        {...rest}
      />
      {showSteppers && (
        <span className="fx-number-input-steppers">
          <button
            type="button"
            className="fx-number-input-step fx-number-input-step--up"
            aria-label={incrementLabel}
            tabIndex={-1}
            disabled={disabled || readOnly || atMax}
            onClick={() => stepBy(step)}
          >
            <FxIcon name="plus" size={16} />
          </button>
          <button
            type="button"
            className="fx-number-input-step fx-number-input-step--down"
            aria-label={decrementLabel}
            tabIndex={-1}
            disabled={disabled || readOnly || atMin}
            onClick={() => stepBy(-step)}
          >
            <FxIcon name="minus" size={16} />
          </button>
        </span>
      )}
    </div>
  );
}
