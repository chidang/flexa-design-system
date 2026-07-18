'use client';
/**
 * FxColorPicker — Color Picker (doc 04 §3.4).
 *
 * A swatch trigger (current color + hex text) opening a portalled popover with:
 * a 2-D saturation/value pad (`role="slider"` with Arrow keys + Shift×10 and a
 * two-axis `aria-valuetext`), a hue slider (standard `role="slider"`), a hex
 * input, and an optional preset swatch radio group. Value is a literal hex
 * string — the FDS-sanctioned data-not-style case (§3.4 note): the picked color
 * is fed to the chrome via an inline CSS custom property from TSX, never written
 * as a literal in the .css. All component chrome uses `var(--fx-*)` tokens.
 * Controlled/uncontrolled for value + open (§1.5). SSR-safe portal.
 */
import { useEffect, useId, useMemo, useRef, useState } from 'react';
import type { CSSProperties, KeyboardEvent, PointerEvent } from 'react';
import { createPortal } from 'react-dom';
import type { Size } from '../enums';

/** `{ source }` meta accompanying every value change (doc 04 §1.6). */
export interface ColorPickerChangeMeta {
  source: 'pad' | 'hue' | 'input' | 'swatch';
}

export interface ColorPickerLabels {
  openPicker: string;
  saturationValue: string;
  hue: string;
  hex: string;
  swatches: string;
}

const DEFAULT_COLOR_LABELS: ColorPickerLabels = {
  openPicker: 'Choose color',
  saturationValue: 'Saturation and lightness',
  hue: 'Hue',
  hex: 'Hex color',
  swatches: 'Preset colors',
};

interface Hsv {
  h: number; // 0–360
  s: number; // 0–100
  v: number; // 0–100
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, v));
}

/** Normalize a loose hex to `#rrggbb`, or null if invalid. */
export function normalizeHex(raw: string): string | null {
  let s = raw.trim().toLowerCase();
  if (!s.startsWith('#')) s = `#${s}`;
  if (/^#[0-9a-f]{3}$/.test(s)) {
    const [, r, g, b] = s;
    return `#${r}${r}${g}${g}${b}${b}`;
  }
  if (/^#[0-9a-f]{6}$/.test(s)) return s;
  return null;
}

/** `#rrggbb` → HSV. */
export function hexToHsv(hex: string): Hsv {
  const norm = normalizeHex(hex) ?? '#000000';
  const r = parseInt(norm.slice(1, 3), 16) / 255;
  const g = parseInt(norm.slice(3, 5), 16) / 255;
  const b = parseInt(norm.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  let h = 0;
  if (d !== 0) {
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
    if (h < 0) h += 360;
  }
  const s = max === 0 ? 0 : d / max;
  return { h: Math.round(h), s: Math.round(s * 100), v: Math.round(max * 100) };
}

/** HSV → `#rrggbb`. */
export function hsvToHex({ h, s, v }: Hsv): string {
  const sf = s / 100;
  const vf = v / 100;
  const c = vf * sf;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = vf - c;
  let r = 0;
  let g = 0;
  let b = 0;
  if (h < 60) [r, g, b] = [c, x, 0];
  else if (h < 120) [r, g, b] = [x, c, 0];
  else if (h < 180) [r, g, b] = [0, c, x];
  else if (h < 240) [r, g, b] = [0, x, c];
  else if (h < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  const toHex = (n: number) =>
    Math.round((n + m) * 255)
      .toString(16)
      .padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export interface FxColorPickerProps {
  /** Controlled hex value (§1.5). */
  value?: string;
  /** Uncontrolled initial hex value. Defaults to `#000000`. */
  defaultValue?: string;
  /** Preset swatches (radio group). */
  swatches?: string[];
  open?: boolean;
  defaultOpen?: boolean;
  size?: Size;
  disabled?: boolean;
  /** Accessible name — required for AT. */
  label: string;
  labels?: Partial<ColorPickerLabels>;
  onChange?: (value: string, meta: ColorPickerChangeMeta) => void;
  onOpenChange?: (open: boolean) => void;
  className?: string;
}

export function FxColorPicker(props: FxColorPickerProps) {
  const {
    value,
    defaultValue = '#000000',
    swatches,
    open,
    defaultOpen = false,
    size = 'md',
    disabled = false,
    label,
    labels: labelOverrides,
    onChange,
    onOpenChange,
    className,
  } = props;

  const labels = { ...DEFAULT_COLOR_LABELS, ...labelOverrides };
  const baseId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const padRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const controlled = value !== undefined;
  const [internal, setInternal] = useState(defaultValue);
  const currentHex = normalizeHex(controlled ? value : internal) ?? '#000000';

  const controlledOpen = open !== undefined;
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const isOpen = controlledOpen ? open : internalOpen;

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const [draft, setDraft] = useState('');

  // HSV mirrors the hex so hue can be adjusted at 0 saturation without losing it.
  const hsv = useMemo(() => hexToHsv(currentHex), [currentHex]);
  const [hue, setHue] = useState(hsv.h);
  useEffect(() => {
    // Keep the hue slider in sync when the value changes externally.
    if (hsv.s > 0 || hsv.v > 0) setHue(hsv.h);
  }, [hsv.h, hsv.s, hsv.v]);

  const setOpen = (next: boolean) => {
    if (!controlledOpen) setInternalOpen(next);
    onOpenChange?.(next);
  };

  useEffect(() => {
    if (!isOpen || !mounted) return;
    const onDocPointer = (e: globalThis.PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node) && !popoverRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('pointerdown', onDocPointer);
    return () => document.removeEventListener('pointerdown', onDocPointer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, mounted]);

  const commit = (nextHex: string, source: ColorPickerChangeMeta['source']) => {
    if (!controlled) setInternal(nextHex);
    onChange?.(nextHex, { source });
  };

  const setSv = (s: number, v: number, source: ColorPickerChangeMeta['source']) => {
    commit(hsvToHex({ h: hue, s: clamp(s, 0, 100), v: clamp(v, 0, 100) }), source);
  };

  const setHueValue = (h: number) => {
    const next = clamp(h, 0, 360);
    setHue(next);
    commit(hsvToHex({ h: next, s: hsv.s, v: hsv.v }), 'hue');
  };

  const svFromPointer = (clientX: number, clientY: number) => {
    const pad = padRef.current;
    if (!pad) return;
    const rect = pad.getBoundingClientRect();
    const s = clamp((clientX - rect.left) / rect.width, 0, 1) * 100;
    const v = (1 - clamp((clientY - rect.top) / rect.height, 0, 1)) * 100;
    setSv(s, v, 'pad');
  };

  const onPadPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (disabled) return;
    dragging.current = true;
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
    svFromPointer(e.clientX, e.clientY);
  };
  const onPadPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (dragging.current) svFromPointer(e.clientX, e.clientY);
  };
  const onPadPointerUp = () => {
    dragging.current = false;
  };

  const onPadKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const d = e.shiftKey ? 10 : 1;
    let s = hsv.s;
    let v = hsv.v;
    switch (e.key) {
      case 'ArrowRight': s += d; break;
      case 'ArrowLeft': s -= d; break;
      case 'ArrowUp': v += d; break;
      case 'ArrowDown': v -= d; break;
      default: return;
    }
    e.preventDefault();
    setSv(s, v, 'pad');
  };

  const onHueKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const d = e.shiftKey ? 10 : 1;
    switch (e.key) {
      case 'ArrowRight':
      case 'ArrowUp': setHueValue(hue + d); break;
      case 'ArrowLeft':
      case 'ArrowDown': setHueValue(hue - d); break;
      case 'Home': setHueValue(0); break;
      case 'End': setHueValue(360); break;
      default: return;
    }
    e.preventDefault();
  };

  const applyHex = () => {
    const norm = normalizeHex(draft);
    if (norm) {
      commit(norm, 'input');
      setHue(hexToHsv(norm).h);
    }
    setDraft('');
  };

  const rootClass = ['fx-color-picker', className].filter(Boolean).join(' ');
  // Picked value + the pure-hue color + the SL-pad gradient corners are DATA fed
  // into chrome as CSS custom properties from TSX (never literals in the .css —
  // §3.4 note). The pad gradient is composed entirely from these props.
  const hueColor = hsvToHex({ h: hue, s: 100, v: 100 });
  const swatchStyle = { '--fx-cp-value': currentHex } as CSSProperties;
  const padStyle = {
    '--fx-cp-hue-color': hueColor,
    '--fx-cp-white': '#ffffff',
    '--fx-cp-black': '#000000',
    '--fx-cp-transparent': 'rgba(0, 0, 0, 0)',
  } as CSSProperties;
  const hueThumbStyle = { left: `${(hue / 360) * 100}%` } as CSSProperties;
  // The rainbow hue track is a fixed 7-stop gradient built from data (hex stops
  // from the color engine), applied inline so no color literal lives in the .css.
  const hueStops = [0, 60, 120, 180, 240, 300, 360]
    .map((h) => hsvToHex({ h, s: 100, v: 100 }))
    .join(', ');
  const hueTrackStyle = { background: `linear-gradient(to right, ${hueStops})` } as CSSProperties;
  const padThumbStyle = {
    left: `${hsv.s}%`,
    top: `${100 - hsv.v}%`,
    '--fx-cp-value': currentHex,
  } as CSSProperties;

  const popover =
    isOpen && mounted
      ? createPortal(
          <div
            ref={popoverRef}
            className="fx-color-picker-popover"
            role="dialog"
            aria-modal="false"
            aria-label={labels.openPicker}
          >
            <div
              ref={padRef}
              className="fx-color-picker-area"
              role="slider"
              tabIndex={disabled ? -1 : 0}
              aria-label={labels.saturationValue}
              aria-valuetext={`Saturation ${hsv.s}%, Lightness ${hsv.v}%`}
              style={padStyle}
              onPointerDown={onPadPointerDown}
              onPointerMove={onPadPointerMove}
              onPointerUp={onPadPointerUp}
              onPointerCancel={onPadPointerUp}
              onKeyDown={onPadKeyDown}
            >
              <span className="fx-color-picker-area-thumb" style={padThumbStyle} aria-hidden="true" />
            </div>

            <div
              className="fx-color-picker-hue"
              role="slider"
              tabIndex={disabled ? -1 : 0}
              aria-label={labels.hue}
              aria-valuemin={0}
              aria-valuemax={360}
              aria-valuenow={hue}
              aria-valuetext={`Hue ${hue} degrees`}
              style={hueTrackStyle}
              onKeyDown={onHueKeyDown}
              onPointerDown={(e) => {
                if (disabled) return;
                const rect = e.currentTarget.getBoundingClientRect();
                setHueValue(((e.clientX - rect.left) / rect.width) * 360);
              }}
            >
              <span className="fx-color-picker-hue-thumb" style={hueThumbStyle} aria-hidden="true" />
            </div>

            <div className="fx-color-picker-controls">
              <span className="fx-color-picker-preview" style={swatchStyle} aria-hidden="true" />
              <input
                className="fx-color-picker-input"
                type="text"
                aria-label={labels.hex}
                value={draft !== '' ? draft : currentHex}
                onChange={(e) => setDraft(e.target.value)}
                onBlur={applyHex}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    applyHex();
                  }
                }}
              />
            </div>

            {swatches && swatches.length > 0 && (
              <div className="fx-color-picker-swatches" role="radiogroup" aria-label={labels.swatches}>
                {swatches.map((hex) => {
                  const norm = normalizeHex(hex) ?? '#000000';
                  const checked = norm === currentHex;
                  return (
                    <button
                      key={hex}
                      type="button"
                      className="fx-color-picker-swatch"
                      role="radio"
                      aria-checked={checked}
                      aria-label={norm}
                      style={{ '--fx-cp-value': norm } as CSSProperties}
                      onClick={() => {
                        commit(norm, 'swatch');
                        setHue(hexToHsv(norm).h);
                      }}
                    />
                  );
                })}
              </div>
            )}
          </div>,
          document.body,
        )
      : null;

  return (
    <div
      ref={rootRef}
      className={rootClass}
      data-size={size}
      data-open={isOpen || undefined}
      data-disabled={disabled || undefined}
    >
      <button
        ref={triggerRef}
        type="button"
        className="fx-color-picker-trigger"
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        aria-label={label}
        disabled={disabled}
        onClick={() => setOpen(!isOpen)}
        id={`${baseId}-trigger`}
      >
        <span className="fx-color-picker-trigger-swatch" style={swatchStyle} aria-hidden="true" />
        <span className="fx-color-picker-trigger-value">{currentHex}</span>
      </button>
      {popover}
    </div>
  );
}
