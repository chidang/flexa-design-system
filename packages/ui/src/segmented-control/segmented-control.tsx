'use client';
/**
 * FxSegmentedControl — an exclusive-choice toggle: a label + 2–5 options on a
 * contained track, exactly one selected (ui-kit doc 14 §11 G9). It is a
 * SELECTOR, not tabs — options carry NO panel semantics and control no
 * `tabpanel`; use FxTabs when each option owns a content region.
 *
 * ARIA pattern: WAI-ARIA **radiogroup** (APG "Radio Group"), the usual fit for
 * exclusive selection without panels — chosen over `tablist` (implies panels)
 * and over a bare button group (no built-in single-selection semantics).
 * Implementation mirrors FxRadioGroup: native `<input type="radio">` sharing
 * one `name` gives the APG keyboard model for free — Arrow keys move focus AND
 * selection (wrapping), a single tab stop (the checked radio, or the first
 * enabled when none is checked). The wrapper carries `role="radiogroup"`,
 * labelled by the rendered `label` (`aria-labelledby`) or a caller-supplied
 * `aria-label`. Controlled + uncontrolled per doc 04 §1.5.
 */
import { useId, useState } from 'react';
import type { Size } from '../enums';

/** One segment choice (doc 04 §1.9 `OptionItem` subset). */
export interface SegmentedOption {
  value: string;
  label: string;
  disabled?: boolean;
}

/** `{ source }` meta accompanying every change (doc 04 §1.6). */
export interface SegmentedChangeMeta {
  source: 'input';
}

/** Sizes: this control ships `sm | md` only (md default; no `lg` tier). */
export type SegmentedSize = Exclude<Size, 'lg'>;

export interface FxSegmentedControlProps {
  /** The choices. 2–5 recommended — more belongs in FxSelect. */
  options: SegmentedOption[];
  /** Controlled value (§1.5). */
  value?: string | null;
  /** Uncontrolled initial value. */
  defaultValue?: string | null;
  /** Visible inline label before the track (e.g. "View as"). */
  label?: string;
  /** Control size. Defaults to `md` (track heights: sm 32px, md 40px). */
  size?: SegmentedSize;
  /** Shared native name. Auto-generated when omitted. */
  name?: string;
  /** Disables the whole group; per-option via `SegmentedOption.disabled`. */
  disabled?: boolean;
  onChange?: (value: string, meta: SegmentedChangeMeta) => void;
  /** Accessible name when no visible `label` is rendered. */
  'aria-label'?: string;
  'aria-labelledby'?: string;
  id?: string;
  className?: string;
}

export function FxSegmentedControl({
  options,
  value,
  defaultValue = null,
  label,
  size = 'md',
  name,
  disabled = false,
  onChange,
  id,
  className,
  ...aria
}: FxSegmentedControlProps) {
  const autoId = useId();
  const groupName = name ?? `${autoId}-segmented`;
  const labelId = `${autoId}-label`;
  const [internal, setInternal] = useState<string | null>(defaultValue);

  const controlled = value !== undefined;
  const current = controlled ? value : internal;

  const commit = (next: string) => {
    if (!controlled) setInternal(next);
    onChange?.(next, { source: 'input' });
  };

  const labelledBy =
    aria['aria-labelledby'] ?? (label != null ? labelId : undefined);
  const rootClass = ['fx-segmented-control', className].filter(Boolean).join(' ');

  return (
    <div
      className={rootClass}
      id={id}
      data-size={size}
      data-disabled={disabled || undefined}
    >
      {label != null && (
        <span className="fx-segmented-control-label" id={labelId}>
          {label}
        </span>
      )}
      <div
        className="fx-segmented-control-track"
        role="radiogroup"
        aria-label={labelledBy == null ? aria['aria-label'] : undefined}
        aria-labelledby={labelledBy}
      >
        {options.map((option) => {
          const optId = `${autoId}-${option.value}`;
          const optDisabled = disabled || option.disabled;
          const checked = current === option.value;
          return (
            <label
              key={option.value}
              className="fx-segmented-control-option"
              htmlFor={optId}
              data-checked={checked || undefined}
              data-disabled={optDisabled || undefined}
            >
              <input
                id={optId}
                className="fx-segmented-control-input"
                type="radio"
                name={groupName}
                value={option.value}
                checked={checked}
                disabled={optDisabled}
                onChange={() => commit(option.value)}
              />
              <span className="fx-segmented-control-text">{option.label}</span>
            </label>
          );
        })}
      </div>
    </div>
  );
}
