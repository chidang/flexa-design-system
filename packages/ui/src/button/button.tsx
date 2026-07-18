/**
 * FxButton — the primary action control (doc 04 §2.1).
 *
 * Seed component for U0: establishes the house style every later component
 * follows — root `.fx-<name>` class, `data-*` attributes for variant/size (never
 * className modifiers), token-only CSS, every baked-in string a prop. Variant
 * and size come from the shared `enums.ts` unions, never re-typed here.
 */
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import type { Size, Variant } from '../enums';

export interface FxButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className'> {
  /** Emphasis. Defaults to `primary`. */
  variant?: Variant;
  /** Control height. Defaults to `md`. */
  size?: Size;
  /** Show a busy state; also disables activation. */
  loading?: boolean;
  /** Accessible announcement while loading. Defaults to `"Loading…"`. */
  loadingLabel?: string;
  /** Icon before the label. */
  iconStart?: ReactNode;
  /** Icon after the label. */
  iconEnd?: ReactNode;
  children?: ReactNode;
}

export function FxButton({
  variant = 'primary',
  size = 'md',
  loading = false,
  loadingLabel = 'Loading…',
  iconStart,
  iconEnd,
  children,
  type = 'button',
  disabled,
  ...rest
}: FxButtonProps) {
  return (
    <button
      // eslint-disable-next-line react/button-has-type -- `type` is a prop, defaulted above
      type={type}
      className="fx-button"
      data-variant={variant}
      data-size={size}
      data-loading={loading || undefined}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading && <span className="fx-button-spinner" aria-hidden="true" />}
      {iconStart}
      {children != null && <span className="fx-button-label">{children}</span>}
      {iconEnd}
      {loading && (
        <span className="fx-button-announce" role="status" aria-live="polite">
          {loadingLabel}
        </span>
      )}
    </button>
  );
}
