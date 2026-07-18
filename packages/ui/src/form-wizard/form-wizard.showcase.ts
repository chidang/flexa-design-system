/**
 * FormWizard showcase — multi-step orchestration with per-step states. Steps use
 * plain string content so demos render deterministically + axe-clean. The
 * component-specific step-state / direction unions are documented as prop
 * strings, never in `enums`.
 */
import type { ShowcaseSpec } from '../showcase-types';
import { FxFormWizard, type WizardStep } from './form-wizard';

const steps: WizardStep[] = [
  { id: 'account', label: 'Account', description: 'Email & password', content: 'Account form fields go here.' },
  { id: 'profile', label: 'Profile', description: 'About you', content: 'Profile form fields go here.' },
  { id: 'billing', label: 'Billing', optional: true, content: 'Billing details go here.' },
  { id: 'review', label: 'Review', content: 'Review your details, then submit.' },
];

export const formWizardShowcase: ShowcaseSpec = {
  name: 'FormWizard',
  slug: 'form-wizard',
  category: 'forms',
  slice: 'U5',
  status: 'ready',
  interactive: true,
  tagline: 'Sequential, validated multi-step forms with a navigable step list.',
  component: FxFormWizard,
  variants: [
    { label: 'first step', props: { steps } },
    { label: 'mid (non-linear)', props: { steps, defaultActiveStep: 'billing', linear: false } },
    { label: 'last step', props: { steps, defaultActiveStep: 'review' } },
    { label: 'vertical', props: { steps, orientation: 'vertical' } },
    { label: 'custom labels', props: { steps, labels: { next: 'Continue', back: 'Previous' } } },
  ],
  props: [
    { name: 'steps', type: 'WizardStep[]', required: true, description: '{ id; label; description?; optional?; validate?; content? }.' },
    { name: 'activeStep / defaultActiveStep', type: 'string (step id)', default: '— / first', description: 'Controlled / uncontrolled active step (§1.5).' },
    { name: 'linear', type: 'boolean', default: 'true', description: 'true: sequential unlock; false: completed/visited steps clickable.' },
    { name: 'orientation', type: "'horizontal' | 'vertical'", default: "'horizontal'", description: 'Step list layout.' },
    { name: 'labels', type: '{ back; next; submit; optional; stepStatus }', default: "'Back'/'Next'/'Submit'/'Optional'/'Step {n} of {total}'", description: 'i18n.' },
    { name: 'step state', type: "'complete' | 'current' | 'upcoming' | 'error'", description: 'Per-step data-state (derived).' },
  ],
  events: [
    { name: 'onStepChange', payload: "(stepId, 'next' | 'back' | 'jump')", description: 'After the departing step validates valid.' },
    { name: 'onSubmit', payload: '—', description: 'From the final step’s Submit.' },
    { name: 'onCancel', payload: '—', description: 'From a host-rendered cancel affordance.' },
  ],
  keyboard: [
    { keys: 'Tab', action: 'Reaches navigable steps + footer buttons' },
    { keys: 'Enter', action: 'Activates a step / advances (Next is submit-type)' },
  ],
  aria: [
    { attr: 'aria-current', value: 'step', note: 'On the current step button.' },
    { attr: 'role', value: 'group', note: 'On the panel, labelled by the current step.' },
    { attr: 'aria-busy', value: 'true', note: 'On Next/Submit during async validation.' },
  ],
  contract: { doc: '04-component-bible.md', heading: 'FxFormWizard' },
};
