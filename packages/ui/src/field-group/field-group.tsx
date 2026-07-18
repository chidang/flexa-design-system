'use client';
/**
 * FxFieldGroup — the labeling / help / error shell for any single control (doc 04 §2.20).
 *
 * Owns id wiring: generates a control id, sets `label[for]`, and merges
 * help/error/count ids into the child's `aria-describedby` (error id first). Error
 * REPLACES help — never both (doc 02 forms § field anatomy). The error renders an
 * FxValidationMessage inside a `role="alert"` slot so dynamic validation announces
 * once. Group-type children (RadioGroup, date range) receive `role="group"` +
 * `aria-labelledby` instead of `label[for]`.
 */
import { cloneElement, isValidElement, useId } from 'react';
import type { ReactElement, ReactNode } from 'react';
import { FxValidationMessage } from '../validation-message/validation-message';

/** The subset of control props FxFieldGroup reads/injects when wiring a child. */
interface WiredControlProps {
  id?: string;
  'aria-describedby'?: string;
  'aria-invalid'?: boolean;
  'aria-labelledby'?: string;
  invalid?: boolean;
  disabled?: boolean;
  required?: boolean;
}

export interface FxFieldGroupProps {
  /** The wrapped control. Receives id / aria-describedby / aria-invalid / disabled. */
  children: ReactNode;
  /** Visible label. */
  label: string;
  /** Renders the label visually-hidden (still wired). */
  labelHidden?: boolean;
  /** Persistent help text — hidden while an error shows. */
  help?: string;
  /** Truthy ⇒ renders FxValidationMessage in the alert slot + sets aria-invalid. */
  error?: string | false;
  /** Character counter text (e.g. `"12 / 140"`). */
  count?: string;
  /** Asterisk + aria-required; or `optionalLabel` when the form marks optionals. */
  required?: boolean;
  /** Accessible text of the required asterisk. i18n. */
  requiredLabel?: string;
  /** Shown (instead of the asterisk) when optionals are marked. i18n. */
  optionalLabel?: string;
  /** Cascades to the child control. */
  disabled?: boolean;
  /** Set for group-type controls (RadioGroup, date range) — wires role=group. */
  asGroup?: boolean;
  id?: string;
  className?: string;
}

/** Merge existing + new describedby ids (error first), de-duped, space-joined. */
function mergeDescribedBy(existing: unknown, ids: (string | false)[]): string | undefined {
  const parts = [
    ...ids.filter((v): v is string => Boolean(v)),
    ...(typeof existing === 'string' ? existing.split(/\s+/) : []),
  ];
  const unique = Array.from(new Set(parts.filter(Boolean)));
  return unique.length ? unique.join(' ') : undefined;
}

export function FxFieldGroup({
  children,
  label,
  labelHidden = false,
  help,
  error,
  count,
  required = false,
  requiredLabel = 'required',
  optionalLabel = 'Optional',
  disabled = false,
  asGroup = false,
  id,
  className,
}: FxFieldGroupProps) {
  const autoId = useId();
  const controlId = id ?? `${autoId}-control`;
  const labelId = `${autoId}-label`;
  const helpId = `${autoId}-help`;
  const errorId = `${autoId}-error`;
  const countId = `${autoId}-count`;

  const hasError = Boolean(error);
  const childEl = isValidElement(children)
    ? (children as ReactElement<WiredControlProps>)
    : null;
  const childProps: WiredControlProps = childEl?.props ?? {};

  // Error replaces help — one message slot, error wins (doc 02 forms).
  const describedBy = mergeDescribedBy(childProps['aria-describedby'], [
    hasError && errorId,
    !hasError && help ? helpId : false,
    count ? countId : false,
  ]);

  const wiring: WiredControlProps = {
    ...(asGroup ? { 'aria-labelledby': labelId } : { id: controlId }),
    'aria-describedby': describedBy,
    'aria-invalid': hasError || childProps['aria-invalid'] || undefined,
    invalid: hasError || childProps.invalid || undefined,
    disabled: disabled || childProps.disabled || undefined,
    required: required || childProps.required || undefined,
  };

  const control = childEl ? cloneElement(childEl, wiring) : children;

  const rootClass = ['fx-field-group', className].filter(Boolean).join(' ');

  return (
    <div
      className={rootClass}
      data-invalid={hasError || undefined}
      data-disabled={disabled || undefined}
      data-required={required || undefined}
    >
      <label
        className="fx-field-group-label"
        id={labelId}
        htmlFor={asGroup ? undefined : controlId}
        data-hidden={labelHidden || undefined}
      >
        <span className="fx-field-group-label-text">{label}</span>
        {required ? (
          <span className="fx-field-group-required-mark" aria-label={requiredLabel}>
            *
          </span>
        ) : (
          optionalLabel && <span className="fx-field-group-optional">{optionalLabel}</span>
        )}
      </label>

      {!hasError && help && (
        <p className="fx-field-group-help" id={helpId}>
          {help}
        </p>
      )}

      <div className="fx-field-group-control">{control}</div>

      <div className="fx-field-group-error-slot" role="alert">
        {hasError && (
          <FxValidationMessage id={errorId} tone="danger">
            {error}
          </FxValidationMessage>
        )}
      </div>

      {count && (
        <div className="fx-field-group-meta">
          <span className="fx-field-group-count" id={countId}>
            {count}
          </span>
        </div>
      )}
    </div>
  );
}
