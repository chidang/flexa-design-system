'use client';
/**
 * FxFormWizard — multi-step form orchestrator (doc 04 §2.18).
 *
 * A `<nav>` step list + a `role="group"` panel (labelled by the current step) +
 * a Back/Next/Submit footer. Steps carry `data-state=complete|current|upcoming
 * |error`. The active step is controlled/uncontrolled per §1.5. Advancing runs
 * the departing step's async `validate` — invalid blocks the move (Next goes
 * `aria-busy` while it resolves). Every user-facing string is a `labels.*` prop.
 */
import { useId, useState } from 'react';
import type { ReactNode } from 'react';
import { FxButton } from '../button/button';
import { FxIcon } from '../icon/FxIcon';

/** One field-level error from a step validator. */
export interface FieldError {
  field: string;
  message: string;
}

/** Result of a step's `validate` hook. */
export interface ValidationResult {
  valid: boolean;
  errors?: FieldError[];
}

/** A single wizard step. */
export interface WizardStep {
  id: string;
  label: string;
  description?: string;
  /** Skippable — surfaces the `optional` label. */
  optional?: boolean;
  /** Gate for leaving this step forward. Invalid blocks the advance. */
  validate?: () => Promise<ValidationResult> | ValidationResult;
  /** Panel body for this step. */
  content?: ReactNode;
}

export type WizardDirection = 'next' | 'back' | 'jump';
export type WizardStepState = 'complete' | 'current' | 'upcoming' | 'error';

/** Every user-facing string — English defaults, override for i18n. */
export interface FormWizardLabels {
  back: string;
  next: string;
  submit: string;
  optional: string;
  /** Template — receives `{n}` / `{total}`. */
  stepStatus: string;
}

export const DEFAULT_FORM_WIZARD_LABELS: FormWizardLabels = {
  back: 'Back',
  next: 'Next',
  submit: 'Submit',
  optional: 'Optional',
  stepStatus: 'Step {n} of {total}',
};

export interface FxFormWizardProps {
  steps: WizardStep[];
  /** Controlled active step id (§1.5). */
  activeStep?: string;
  /** Uncontrolled initial active step id. Defaults to the first step. */
  defaultActiveStep?: string;
  /** `true`: unlock sequentially; `false`: completed/visited steps clickable. Defaults to `true`. */
  linear?: boolean;
  /** Layout. Defaults to `horizontal`. */
  orientation?: 'horizontal' | 'vertical';
  /** i18n strings. Merged over the English defaults. */
  labels?: Partial<FormWizardLabels>;
  /** Fires after the departing step's `validate` resolves valid. */
  onStepChange?: (stepId: string, direction: WizardDirection) => void;
  /** Fires from the final step's Submit. */
  onSubmit?: () => void;
  /**
   * The final step's submit affordance lives outside the wizard (e.g. a
   * checkout rail CTA) — the footer shows only Back on the last step, so the
   * screen never carries two primary CTAs at once.
   */
  hideSubmit?: boolean;
  /** Fires from a Cancel affordance (host-rendered). */
  onCancel?: () => void;
  className?: string;
}

function fill(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, k: string) => String(vars[k] ?? `{${k}}`));
}

export function FxFormWizard({
  steps,
  activeStep,
  defaultActiveStep,
  linear = true,
  orientation = 'horizontal',
  labels,
  onStepChange,
  onSubmit,
  hideSubmit = false,
  className,
}: FxFormWizardProps) {
  const autoId = useId();
  const t = { ...DEFAULT_FORM_WIZARD_LABELS, ...labels };

  const firstId = steps[0]?.id ?? '';
  const controlled = activeStep !== undefined;
  const [internal, setInternal] = useState(defaultActiveStep ?? firstId);
  const [errored, setErrored] = useState<Record<string, boolean>>({});
  const [busy, setBusy] = useState(false);

  const currentId = controlled ? activeStep : internal;
  const currentIndex = Math.max(0, steps.findIndex((s) => s.id === currentId));
  const current = steps[currentIndex];
  const isLast = currentIndex === steps.length - 1;

  const setCurrent = (id: string) => {
    if (!controlled) setInternal(id);
  };

  const goTo = async (index: number, direction: WizardDirection) => {
    const target = steps[index];
    if (!target || !current) return;

    // Validate the departing step only when moving forward.
    if (direction !== 'back' && current.validate) {
      setBusy(true);
      try {
        const result = await current.validate();
        if (!result.valid) {
          setErrored((prev) => ({ ...prev, [current.id]: true }));
          return;
        }
      } finally {
        setBusy(false);
      }
    }
    setErrored((prev) => ({ ...prev, [current.id]: false }));
    setCurrent(target.id);
    onStepChange?.(target.id, direction);
  };

  const stateOf = (index: number, id: string): WizardStepState => {
    if (errored[id]) return 'error';
    if (index === currentIndex) return 'current';
    if (index < currentIndex) return 'complete';
    return 'upcoming';
  };

  const canJump = (index: number, state: WizardStepState): boolean => {
    if (index === currentIndex) return false;
    return !linear || state === 'complete' || state === 'error';
  };

  const panelLabelId = `${autoId}-step-${currentIndex}`;
  const rootClass = ['fx-form-wizard', className].filter(Boolean).join(' ');

  return (
    <div className={rootClass} data-orientation={orientation}>
      <nav className="fx-form-wizard-steps" aria-label="Progress">
        <ol className="fx-form-wizard-steps-list">
          {steps.map((step, index) => {
            const state = stateOf(index, step.id);
            const jumpable = canJump(index, state);
            const labelId = `${autoId}-step-${index}`;
            const indicator =
              state === 'complete' ? (
                <FxIcon name="check" size={16} />
              ) : state === 'error' ? (
                <FxIcon name="warning" size={16} />
              ) : (
                <span aria-hidden="true">{index + 1}</span>
              );
            return (
              <li key={step.id} className="fx-form-wizard-step" data-state={state}>
                <button
                  type="button"
                  className="fx-form-wizard-step-button"
                  data-state={state}
                  aria-current={state === 'current' ? 'step' : undefined}
                  disabled={!jumpable}
                  onClick={() => jumpable && void goTo(index, 'jump')}
                >
                  <span className="fx-form-wizard-step-indicator" aria-hidden="true">
                    {indicator}
                  </span>
                  <span className="fx-form-wizard-step-text">
                    <span id={labelId} className="fx-form-wizard-step-label">
                      {step.label}
                      {step.optional && (
                        <span className="fx-form-wizard-step-optional"> ({t.optional})</span>
                      )}
                    </span>
                    {step.description && (
                      <span className="fx-form-wizard-step-description">{step.description}</span>
                    )}
                    <span className="fx-form-wizard-step-status">
                      {fill(t.stepStatus, { n: index + 1, total: steps.length })}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
      </nav>

      <div
        className="fx-form-wizard-panel"
        role="group"
        aria-labelledby={panelLabelId}
        tabIndex={-1}
      >
        {current?.content}
      </div>

      <div className="fx-form-wizard-footer">
        <FxButton
          variant="secondary"
          disabled={currentIndex === 0 || busy}
          onClick={() => void goTo(currentIndex - 1, 'back')}
        >
          {t.back}
        </FxButton>
        {isLast && hideSubmit ? null : isLast ? (
          <FxButton
            variant="primary"
            type="submit"
            loading={busy}
            onClick={() => {
              void (async () => {
                if (current?.validate) {
                  setBusy(true);
                  try {
                    const result = await current.validate();
                    if (!result.valid) {
                      setErrored((prev) => ({ ...prev, [current.id]: true }));
                      return;
                    }
                  } finally {
                    setBusy(false);
                  }
                }
                onSubmit?.();
              })();
            }}
          >
            {t.submit}
          </FxButton>
        ) : (
          <FxButton
            variant="primary"
            type="submit"
            loading={busy}
            onClick={() => void goTo(currentIndex + 1, 'next')}
          >
            {t.next}
          </FxButton>
        )}
      </div>
    </div>
  );
}
