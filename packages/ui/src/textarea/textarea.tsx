'use client';
/**
 * FxTextarea — multi-line text entry (doc 04 §2.5).
 *
 * Extends FxInput's contract with deltas only: `rows`/`autoResize`/`maxRows`/
 * `resize`, no affixes, no `clearable`. `Enter` inserts a newline (never submits).
 * Root `.fx-textarea`, control `.fx-textarea-control`. Controlled + uncontrolled
 * per §1.5. Bare textarea requires `aria-label` / `aria-labelledby`.
 */
import { useEffect, useId, useRef, useState } from 'react';
import type { TextareaHTMLAttributes } from 'react';
import type { Size } from '../enums';

type NativeTextareaProps = Omit<
  TextareaHTMLAttributes<HTMLTextAreaElement>,
  'className' | 'value' | 'defaultValue' | 'rows' | 'onChange'
>;

/** `{ source }` meta accompanying every value change (doc 04 §1.6). */
export interface TextareaChangeMeta {
  source: 'input';
}

export interface FxTextareaProps extends NativeTextareaProps {
  /** Controlled value (§1.5). */
  value?: string;
  /** Uncontrolled initial value. */
  defaultValue?: string;
  /** Control height/font. Defaults to `md`. */
  size?: Size;
  /** Initial rows. Defaults to `3`. */
  rows?: number;
  /** Grows with content between `rows` and `maxRows`. Defaults to `true`. */
  autoResize?: boolean;
  /** Upper bound for auto-resize. Defaults to `8`. */
  maxRows?: number;
  /** Manual resize handle (ignored when `autoResize`). Defaults to `vertical`. */
  resize?: 'none' | 'vertical';
  /** `.is-invalid` + `aria-invalid`. */
  invalid?: boolean;
  /** Focusable, value not editable. */
  readOnly?: boolean;
  /** Called per keystroke. */
  onChange?: (value: string, meta: TextareaChangeMeta) => void;
  className?: string;
}

export function FxTextarea({
  value,
  defaultValue = '',
  size = 'md',
  rows = 3,
  autoResize = true,
  maxRows = 8,
  resize = 'vertical',
  invalid = false,
  readOnly = false,
  disabled,
  onChange,
  onFocus,
  onBlur,
  id,
  className,
  ...rest
}: FxTextareaProps) {
  const autoId = useId();
  const textareaId = id ?? autoId;
  const ref = useRef<HTMLTextAreaElement>(null);
  const [focused, setFocused] = useState(false);
  const [internal, setInternal] = useState(defaultValue);

  const controlled = value !== undefined;
  const current = controlled ? value : internal;

  // Auto-resize: measure scrollHeight, clamp to maxRows via line-height.
  // useEffect (not useLayoutEffect) keeps SSR/static prerender warning-free.
  useEffect(() => {
    if (!autoResize) return;
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    const line = parseFloat(getComputedStyle(el).lineHeight) || 20;
    const max = line * maxRows;
    el.style.height = `${Math.min(el.scrollHeight, max)}px`;
    el.style.overflowY = el.scrollHeight > max ? 'auto' : 'hidden';
  }, [current, autoResize, maxRows]);

  const commit = (next: string) => {
    if (!controlled) setInternal(next);
    onChange?.(next, { source: 'input' });
  };

  const rootClass = ['fx-textarea', className].filter(Boolean).join(' ');
  const effectiveResize = autoResize ? 'none' : resize;

  return (
    <div
      className={rootClass}
      data-size={size}
      data-invalid={invalid || undefined}
      data-disabled={disabled || undefined}
      data-readonly={readOnly || undefined}
      data-focused={focused || undefined}
      data-resize={effectiveResize}
    >
      <textarea
        ref={ref}
        id={textareaId}
        className="fx-textarea-control"
        rows={rows}
        value={current}
        disabled={disabled}
        readOnly={readOnly}
        aria-invalid={invalid || undefined}
        onChange={(event) => commit(event.target.value)}
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
    </div>
  );
}
