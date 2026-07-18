'use client';
/**
 * FxStepper — compact quantity control (doc 04 §3.4).
 *
 * A grouped − / value / + control for small integers (cart lines, guest counts).
 * Distinct from FxNumberInput (a full form field) and Form Wizard steps. The
 * value carries `role="spinbutton"` with `aria-valuemin/max/now`; buttons repeat
 * on hold and disable (`aria-disabled`, still focusable) at their bound. The
 * value is read-only by default; `editable` promotes it to a typeable input.
 * Controlled / uncontrolled per §1.5.
 */
import { useEffect, useId, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import type { Size } from '../enums';
import { FxIcon } from '../icon/FxIcon';

/** `{ source }` meta accompanying every value change (doc 04 §1.6). */
export interface StepperChangeMeta {
  source: 'step' | 'input';
}

export interface FxStepperProps {
  /** Controlled value (§1.5). */
  value?: number;
  /** Uncontrolled initial value. Defaults to `min`. */
  defaultValue?: number;
  /** Lower bound. Defaults to `0`. */
  min?: number;
  /** Upper bound. */
  max?: number;
  /** Increment. Defaults to `1`. */
  step?: number;
  /** Promote the value to a typeable input. Defaults to `false`. */
  editable?: boolean;
  /** Control height. Defaults to `md`. */
  size?: Size;
  disabled?: boolean;
  /** Accessible label for the whole control (spinbutton name). */
  ariaLabel?: string;
  /** Accessible label for the increment button. i18n. */
  incrementLabel?: string;
  /** Accessible label for the decrement button. i18n. */
  decrementLabel?: string;
  onChange?: (value: number, meta: StepperChangeMeta) => void;
  className?: string;
}

const clampTo = (n: number, min: number, max?: number): number => {
  let out = n < min ? min : n;
  if (max !== undefined && out > max) out = max;
  return out;
};

export function FxStepper({
  value,
  defaultValue,
  min = 0,
  max,
  step = 1,
  editable = false,
  size = 'md',
  disabled,
  ariaLabel,
  incrementLabel = 'Increase',
  decrementLabel = 'Decrease',
  onChange,
  className,
}: FxStepperProps) {
  const valueId = useId();
  const initial = clampTo(defaultValue ?? min, min, max);
  const controlled = value !== undefined;
  const [internal, setInternal] = useState(initial);
  const current = controlled ? clampTo(value, min, max) : internal;

  const repeat = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(
    () => () => {
      if (repeat.current) clearInterval(repeat.current);
    },
    [],
  );

  const commit = (next: number, source: StepperChangeMeta['source']) => {
    const clamped = clampTo(next, min, max);
    if (!controlled) setInternal(clamped);
    onChange?.(clamped, { source });
  };

  const nudge = (delta: number) => commit(current + delta, 'step');

  const startRepeat = (delta: number) => {
    if (disabled) return;
    nudge(delta);
    if (repeat.current) clearInterval(repeat.current);
    repeat.current = setInterval(() => {
      setInternal((prev) => {
        const next = clampTo(prev + delta, min, max);
        onChange?.(next, { source: 'step' });
        return next;
      });
    }, 120);
  };

  const stopRepeat = () => {
    if (repeat.current) {
      clearInterval(repeat.current);
      repeat.current = null;
    }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (disabled) return;
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      nudge(step);
    } else if (event.key === 'ArrowDown') {
      event.preventDefault();
      nudge(-step);
    } else if (event.key === 'Home') {
      event.preventDefault();
      commit(min, 'step');
    } else if (event.key === 'End' && max !== undefined) {
      event.preventDefault();
      commit(max, 'step');
    }
  };

  const atMin = current <= min;
  const atMax = max !== undefined && current >= max;
  const rootClass = ['fx-stepper', className].filter(Boolean).join(' ');

  return (
    <div className={rootClass} data-size={size} data-disabled={disabled || undefined}>
      <button
        type="button"
        className="fx-stepper-decrement"
        aria-label={decrementLabel}
        aria-disabled={atMin || disabled || undefined}
        disabled={disabled}
        onPointerDown={() => !atMin && startRepeat(-step)}
        onPointerUp={stopRepeat}
        onPointerLeave={stopRepeat}
      >
        <FxIcon name="minus" size={16} />
      </button>
      {editable ? (
        <input
          id={valueId}
          className="fx-stepper-value fx-stepper-value--editable"
          type="text"
          inputMode="numeric"
          value={String(current)}
          disabled={disabled}
          role="spinbutton"
          aria-label={ariaLabel}
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuenow={current}
          onChange={(event) => {
            const n = Number(event.target.value.trim());
            if (Number.isFinite(n)) commit(n, 'input');
          }}
          onKeyDown={handleKeyDown}
        />
      ) : (
        <span
          className="fx-stepper-value"
          role="spinbutton"
          tabIndex={disabled ? -1 : 0}
          aria-label={ariaLabel}
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuenow={current}
          aria-disabled={disabled || undefined}
          onKeyDown={handleKeyDown}
        >
          {current}
        </span>
      )}
      <button
        type="button"
        className="fx-stepper-increment"
        aria-label={incrementLabel}
        aria-disabled={atMax || disabled || undefined}
        disabled={disabled}
        onPointerDown={() => !atMax && startRepeat(step)}
        onPointerUp={stopRepeat}
        onPointerLeave={stopRepeat}
      >
        <FxIcon name="plus" size={16} />
      </button>
    </div>
  );
}
