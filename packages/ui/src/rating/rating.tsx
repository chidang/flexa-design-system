'use client';
/**
 * FxRating — 5-star rating (doc 04 §3.5), read-only (fractional fills) or input.
 *
 * Read-only mode is a single `role="img"` with `aria-label='Rated {value} out of
 * {max}'`; fractional fills are painted with a CSS clip width and are decorative.
 * Input mode is a native radio group (`role="radiogroup"` + `<input type=radio>`
 * sharing one name) — that gives the APG model for free: Arrow keys move focus
 * AND selection over 1–max, single tab stop, each radio labelled "1 star"… .
 * Controlled + uncontrolled per §1.5. Uses `useState`/`useId` → client island.
 */
import { useId, useState } from 'react';
import { FxIcon } from '../icon/FxIcon';

export interface RatingLabels {
  /** Accessible name for the whole control (input mode radiogroup). */
  label: string;
  /** Per-star label; `{n}` = star number, `{max}` = max. */
  itemLabel: string;
  /** Read-only accessible label; `{value}` / `{max}` interpolated. */
  readLabel: string;
}

export const DEFAULT_RATING_LABELS: RatingLabels = {
  label: 'Rating',
  itemLabel: '{n} of {max} stars',
  readLabel: 'Rated {value} out of {max}',
};

function fill(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, k: string) => String(vars[k] ?? ''));
}

export interface FxRatingProps {
  /** Current rating, 0–max. Read-only allows fractional (0.1 precision). */
  value?: number;
  /** Uncontrolled initial rating (input mode). */
  defaultValue?: number;
  /** Read-only display vs interactive input. Defaults to `true`. */
  readOnly?: boolean;
  /** Fires with the picked integer 1–max (input mode). */
  onChange?: (value: number) => void;
  /** Show the numeric value beside the stars, e.g. "4.6". */
  showValue?: boolean;
  /** Show a review count, e.g. "(128)". */
  count?: number;
  /** Makes the count a plain link. */
  countHref?: string;
  /** Number of stars. Defaults to 5. */
  max?: number;
  /** Star glyph size. Defaults to 20. */
  size?: 16 | 20 | 24;
  /** i18n labels. */
  labels?: Partial<RatingLabels>;
  /** Shared native name for the radios (auto-generated when omitted). */
  name?: string;
  className?: string;
}

export function FxRating({
  value,
  defaultValue = 0,
  readOnly = true,
  onChange,
  showValue = false,
  count,
  countHref,
  max = 5,
  size = 20,
  labels,
  name,
  className,
}: FxRatingProps) {
  const l = { ...DEFAULT_RATING_LABELS, ...labels };
  const autoId = useId();
  const groupName = name ?? `${autoId}-rating`;
  const [internal, setInternal] = useState<number>(defaultValue);

  const controlled = value !== undefined;
  const current = controlled ? (value as number) : internal;

  const commit = (next: number) => {
    if (!controlled) setInternal(next);
    onChange?.(next);
  };

  const rootClass = className ? `fx-rating ${className}` : 'fx-rating';
  const stars = Array.from({ length: max }, (_, i) => i + 1);

  const countNode =
    count !== undefined ? (
      countHref ? (
        <a className="fx-rating-count" href={countHref}>
          ({count})
        </a>
      ) : (
        <span className="fx-rating-count">({count})</span>
      )
    ) : null;

  if (readOnly) {
    const clamped = Math.max(0, Math.min(current, max));
    return (
      <span className={rootClass} data-readonly="true">
        <span
          className="fx-rating-stars"
          role="img"
          aria-label={fill(l.readLabel, { value: current, max })}
        >
          {stars.map((n) => {
            // Per-star fill fraction 0–1 for the fractional overlay.
            const frac = Math.max(0, Math.min(clamped - (n - 1), 1));
            return (
              <span key={n} className="fx-rating-star" data-size={size}>
                <FxIcon name="star" size={size} className="fx-rating-star-empty" />
                <span
                  className="fx-rating-star-fill"
                  style={{ width: `${frac * 100}%` }}
                >
                  <FxIcon name="star" size={size} className="fx-rating-star-full" />
                </span>
              </span>
            );
          })}
        </span>
        {showValue && <span className="fx-rating-value">{current}</span>}
        {countNode}
      </span>
    );
  }

  return (
    <span className={rootClass} data-readonly={undefined}>
      <span
        className="fx-rating-stars"
        role="radiogroup"
        aria-label={l.label}
      >
        {stars.map((n) => {
          const checked = current === n;
          const filled = n <= current;
          return (
            <label
              key={n}
              className="fx-rating-star"
              data-size={size}
              data-filled={filled || undefined}
            >
              <input
                className="fx-rating-input"
                type="radio"
                name={groupName}
                value={n}
                checked={checked}
                onChange={() => commit(n)}
              />
              <span className="fx-rating-star-visual" aria-hidden="true">
                <FxIcon name="star" size={size} className="fx-rating-star-full" />
              </span>
              <span className="fx-rating-star-sr">{fill(l.itemLabel, { n, max })}</span>
            </label>
          );
        })}
      </span>
      {showValue && <span className="fx-rating-value">{current}</span>}
      {countNode}
    </span>
  );
}
