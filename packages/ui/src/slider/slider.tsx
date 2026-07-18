'use client';
/**
 * FxSlider — Slider (doc 04 §2.14).
 *
 * Single value (`number`) or range (`[number, number]` tuple → two thumbs,
 * `data-range`). Each thumb is a `role="slider"` element that owns its own
 * `aria-valuemin/max/now/valuetext` and is individually labelled — range
 * sliders MUST pass `thumbLabels` so each thumb has a name. Controlled and
 * uncontrolled per §1.5. Pointer drag + full APG keyboard map; range thumbs
 * clamp at each other and never cross.
 */
import { useCallback, useId, useRef, useState } from 'react';
import type { KeyboardEvent, PointerEvent } from 'react';
import type { Size } from '../enums';

export type SliderValue = number | [number, number];

/** `{ source }` meta accompanying every live change (doc 04 §1.6). */
export interface SliderChangeMeta {
  source: 'drag' | 'step';
}

export interface SliderMark {
  value: number;
  label?: string;
}

export interface FxSliderProps {
  /** Controlled value. Tuple = range slider (two thumbs). */
  value?: SliderValue;
  /** Uncontrolled initial value. Defaults to `min` (single). */
  defaultValue?: SliderValue;
  /** Lower bound. Defaults to `0`. */
  min?: number;
  /** Upper bound. Defaults to `100`. */
  max?: number;
  /** Step increment. Defaults to `1`. */
  step?: number;
  /** Tick marks with optional labels. */
  marks?: SliderMark[];
  /** Layout axis. Defaults to `horizontal`. */
  orientation?: 'horizontal' | 'vertical';
  /** Value bubble visibility. `auto` = while dragging/focused. Defaults to `auto`. */
  showTooltip?: 'auto' | 'always' | 'never';
  /** Thumb size. Defaults to `md`. */
  size?: Size;
  /** Disable interaction. */
  disabled?: boolean;
  /** Drives the tooltip + `aria-valuetext`. Defaults to `String`. */
  formatValue?: (v: number) => string;
  /** Accessible name for a single-thumb slider. i18n. */
  label?: string;
  /** Accessible names for the two range thumbs. Required for range sliders. i18n. */
  thumbLabels?: [string, string];
  /** Live during drag/step. */
  onChange?: (value: SliderValue, meta: SliderChangeMeta) => void;
  /** On release/commit (server calls belong here). */
  onChangeEnd?: (value: SliderValue) => void;
  className?: string;
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, v));
}

/** Snap `v` to the nearest step boundary within [min, max]. */
function snap(v: number, min: number, max: number, step: number): number {
  const snapped = Math.round((v - min) / step) * step + min;
  return clamp(snapped, min, max);
}

export function FxSlider({
  value,
  defaultValue,
  min = 0,
  max = 100,
  step = 1,
  marks,
  orientation = 'horizontal',
  showTooltip = 'auto',
  size = 'md',
  disabled = false,
  formatValue = String,
  label,
  thumbLabels,
  onChange,
  onChangeEnd,
  className,
}: FxSliderProps) {
  const baseId = useId();
  const trackRef = useRef<HTMLDivElement>(null);
  const dragging = useRef<number | null>(null);

  const controlled = value !== undefined;
  const initial: SliderValue = defaultValue ?? min;
  const [internal, setInternal] = useState<SliderValue>(initial);
  const current = controlled ? value : internal;

  const isRange = Array.isArray(current);
  const [focusedThumb, setFocusedThumb] = useState<number | null>(null);

  // Normalize to a two-slot array for uniform maths; single sliders use slot 0.
  const values: number[] = isRange ? [...(current as [number, number])] : [current as number];

  const commit = useCallback(
    (next: number[], meta: SliderChangeMeta) => {
      const outgoing: SliderValue = isRange ? [next[0]!, next[1]!] : next[0]!;
      if (!controlled) setInternal(outgoing);
      onChange?.(outgoing, meta);
    },
    [controlled, isRange, onChange],
  );

  const commitEnd = useCallback(
    (next: number[]) => {
      const outgoing: SliderValue = isRange ? [next[0]!, next[1]!] : next[0]!;
      onChangeEnd?.(outgoing);
    },
    [isRange, onChangeEnd],
  );

  /** Move thumb `index` to `raw`, clamping to bounds and the sibling thumb. */
  const moveThumb = (index: number, raw: number, meta: SliderChangeMeta) => {
    const next = [...values];
    let bounded = snap(raw, min, max, step);
    if (isRange) {
      if (index === 0) bounded = Math.min(bounded, next[1]!);
      else bounded = Math.max(bounded, next[0]!);
    }
    if (next[index] === bounded) return;
    next[index] = bounded;
    commit(next, meta);
  };

  /** Convert a pointer position to a value along the track. */
  const valueFromPointer = (clientX: number, clientY: number): number => {
    const track = trackRef.current;
    if (!track) return min;
    const rect = track.getBoundingClientRect();
    const ratio =
      orientation === 'vertical'
        ? 1 - (clientY - rect.top) / rect.height
        : (clientX - rect.left) / rect.width;
    return min + clamp(ratio, 0, 1) * (max - min);
  };

  const nearestThumb = (v: number): number => {
    if (!isRange) return 0;
    return Math.abs(v - values[0]!) <= Math.abs(v - values[1]!) ? 0 : 1;
  };

  const onTrackPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (disabled) return;
    const v = valueFromPointer(e.clientX, e.clientY);
    const index = nearestThumb(v);
    dragging.current = index;
    setFocusedThumb(index);
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    moveThumb(index, v, { source: 'drag' });
  };

  const onThumbPointerDown = (index: number) => (e: PointerEvent<HTMLDivElement>) => {
    if (disabled) return;
    e.stopPropagation();
    dragging.current = index;
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
  };

  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (dragging.current === null) return;
    moveThumb(dragging.current, valueFromPointer(e.clientX, e.clientY), { source: 'drag' });
  };

  const onPointerUp = () => {
    if (dragging.current === null) return;
    dragging.current = null;
    commitEnd(values);
  };

  const onThumbKeyDown = (index: number) => (e: KeyboardEvent<HTMLDivElement>) => {
    if (disabled) return;
    const big = step * 10;
    let raw: number | null = null;
    switch (e.key) {
      case 'ArrowRight':
      case 'ArrowUp':
        raw = values[index]! + step;
        break;
      case 'ArrowLeft':
      case 'ArrowDown':
        raw = values[index]! - step;
        break;
      case 'PageUp':
        raw = values[index]! + big;
        break;
      case 'PageDown':
        raw = values[index]! - big;
        break;
      case 'Home':
        raw = min;
        break;
      case 'End':
        raw = max;
        break;
      default:
        return;
    }
    e.preventDefault();
    moveThumb(index, raw, { source: 'step' });
    // Keyboard steps commit immediately (no drag release).
    const next = [...values];
    let bounded = snap(raw, min, max, step);
    if (isRange) {
      if (index === 0) bounded = Math.min(bounded, next[1]!);
      else bounded = Math.max(bounded, next[0]!);
    }
    next[index] = bounded;
    commitEnd(next);
  };

  const pct = (v: number) => ((v - min) / (max - min)) * 100;

  const fillStart = isRange ? pct(values[0]!) : 0;
  const fillEnd = isRange ? pct(values[1]!) : pct(values[0]!);

  const tooltipFor = (index: number) =>
    showTooltip === 'always' || (showTooltip === 'auto' && focusedThumb === index);

  const thumbName = (index: number): string | undefined =>
    isRange ? thumbLabels?.[index] : label;

  const rootClass = ['fx-slider', className].filter(Boolean).join(' ');

  return (
    <div
      className={rootClass}
      data-orientation={orientation}
      data-range={isRange || undefined}
      data-size={size}
      data-disabled={disabled || undefined}
    >
      <div
        ref={trackRef}
        className="fx-slider-track"
        onPointerDown={onTrackPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <div
          className="fx-slider-fill"
          style={
            orientation === 'vertical'
              ? { bottom: `${fillStart}%`, top: `${100 - fillEnd}%` }
              : { left: `${fillStart}%`, right: `${100 - fillEnd}%` }
          }
        />
        {values.map((v, index) => (
          <div
            key={index}
            className="fx-slider-thumb"
            role="slider"
            tabIndex={disabled ? -1 : 0}
            aria-valuemin={min}
            aria-valuemax={max}
            aria-valuenow={v}
            aria-valuetext={formatValue(v)}
            aria-orientation={orientation}
            aria-label={thumbName(index)}
            aria-disabled={disabled || undefined}
            style={
              orientation === 'vertical'
                ? { bottom: `${pct(v)}%` }
                : { left: `${pct(v)}%` }
            }
            onPointerDown={onThumbPointerDown(index)}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            onKeyDown={onThumbKeyDown(index)}
            onFocus={() => setFocusedThumb(index)}
            onBlur={() => setFocusedThumb((f) => (f === index ? null : f))}
          >
            {tooltipFor(index) && (
              <span className="fx-slider-tooltip" role="presentation">
                {formatValue(v)}
              </span>
            )}
          </div>
        ))}
      </div>
      {marks && marks.length > 0 && (
        <div className="fx-slider-marks" aria-hidden="true">
          {marks.map((mark) => (
            <span
              key={mark.value}
              className="fx-slider-mark"
              style={
                orientation === 'vertical'
                  ? { bottom: `${pct(mark.value)}%` }
                  : { left: `${pct(mark.value)}%` }
              }
            >
              {mark.label != null && (
                <span className="fx-slider-mark-label" id={`${baseId}-mark-${mark.value}`}>
                  {mark.label}
                </span>
              )}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
