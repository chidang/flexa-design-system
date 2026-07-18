/**
 * Password Input showcase spec — visibility toggle + optional strength meter.
 * Only the SHARED `size` union comes from enums; `autoComplete` is
 * component-specific and documented as prop-table strings only.
 */
import type { ShowcaseSpec } from '../showcase-types';
import { SIZES } from '../enums';
import { FxPasswordInput, type PasswordStrength } from './password-input';

/** Tiny demo scorer (length-based) — real hosts pass their own zxcvbn etc. */
const demoStrength = (value: string): PasswordStrength => {
  const score = Math.min(4, Math.floor(value.length / 3)) as PasswordStrength['score'];
  const label = ['Very weak', 'Weak', 'Fair', 'Good', 'Strong'][score] ?? 'Very weak';
  return { score, label };
};

export const passwordInputShowcase: ShowcaseSpec = {
  name: 'Password Input',
  slug: 'password-input',
  category: 'forms',
  slice: 'U5',
  status: 'ready',
  interactive: true,
  tagline: 'Password field with a visibility toggle and optional strength meter.',
  component: FxPasswordInput,
  variants: [
    { label: 'sign in', props: { 'aria-label': 'Password', autoComplete: 'current-password', placeholder: '••••••••' } },
    { label: 'with value', props: { 'aria-label': 'Password', autoComplete: 'current-password', defaultValue: 'hunter2!' } },
    { label: 'new + strength', props: { 'aria-label': 'New password', autoComplete: 'new-password', defaultValue: 'Corr3ct-Horse', strengthMeter: demoStrength } },
    ...SIZES.map((size) => ({
      label: `size ${size}`,
      props: { size, 'aria-label': `Size ${size}`, autoComplete: 'current-password', defaultValue: 'secret1' },
    })),
    { label: 'invalid', props: { 'aria-label': 'Password', autoComplete: 'current-password', invalid: true, defaultValue: 'x' } },
    { label: 'readonly', props: { 'aria-label': 'Password', autoComplete: 'current-password', readOnly: true, defaultValue: 'locked12' } },
    { label: 'disabled', props: { 'aria-label': 'Password', autoComplete: 'current-password', disabled: true, defaultValue: 'nope1234' } },
  ],
  enums: { size: SIZES },
  props: [
    { name: 'value / defaultValue', type: 'string', default: "— / ''", description: 'Controlled / uncontrolled value (§1.5).' },
    { name: 'autoComplete', type: "'current-password' | 'new-password'", required: true, description: 'Reveals intent to browsers / password managers.' },
    { name: 'size', type: "'sm' | 'md' | 'lg'", default: "'md'", description: 'Control height (32 / 40 / 48px).' },
    { name: 'showLabel / hideLabel', type: 'string', default: "'Show password' / 'Hide password'", description: 'Toggle labels (i18n).' },
    { name: 'strengthMeter', type: '(value) => { score: 0–4; label: string }', description: 'Renders a tone-shifted meter + polite label.' },
    { name: 'invalid', type: 'boolean', default: 'false', description: 'Sets aria-invalid.' },
  ],
  events: [
    { name: 'onChange', payload: '(value, { source })', description: 'Per keystroke.' },
    { name: 'onEnter', payload: 'string', description: 'Enter-key convenience.' },
  ],
  keyboard: [
    { keys: 'Enter', action: 'Fires onEnter with the current value' },
  ],
  aria: [
    { attr: 'aria-pressed', value: 'true | false', note: 'On the visibility toggle.' },
    { attr: 'role', value: 'status', note: 'On the strength label (polite announce).' },
    { attr: 'aria-invalid', value: 'true', note: 'While invalid.' },
  ],
  contract: { doc: '04-component-bible.md', heading: 'FxPasswordInput' },
};
