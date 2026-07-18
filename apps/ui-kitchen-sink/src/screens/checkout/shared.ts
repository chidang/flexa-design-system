/**
 * Shared helpers for the U11 Checkout wizard (doc 08 §2.4). Money formatting per
 * the U11 rule (`$${(amount/100).toFixed(2)}`), the step vocabulary and its
 * route/label mapping, and the country list the shipping-address FxPhoneInput
 * needs. No component appearance lives here — layout stays in `ks-*` utilities.
 */
import type { Money } from 'flexa-ui-kit/mocks';
import type { CountryOption } from 'flexa-ui-kit';

/** The four wizard steps + the terminal confirmation surface. */
export type CheckoutStep = 'cart' | 'details' | 'payment' | 'review';

/** The ordered wizard step ids (drives the FxFormWizard header + validation). */
export const STEP_ORDER: CheckoutStep[] = ['cart', 'details', 'payment', 'review'];

/** Human step labels for the wizard header. */
export const STEP_LABELS: Record<CheckoutStep, string> = {
  cart: 'Cart',
  details: 'Details',
  payment: 'Payment',
  review: 'Review',
};

/** Base path all step routes hang off. */
export const CHECKOUT_BASE = '/screens/checkout';

/** U11 money rule: integer minor units → `$12.34`. Currency prefix from ISO. */
export function money(m: Money): string {
  const symbol = m.currency === 'USD' ? '$' : `${m.currency} `;
  return `${symbol}${(m.amount / 100).toFixed(2)}`;
}

/** Countries offered by the shipping-address phone field (fixture uses FR/US). */
export const COUNTRIES: CountryOption[] = [
  { code: 'FR', dial: '+33', label: 'France' },
  { code: 'US', dial: '+1', label: 'United States' },
  { code: 'GB', dial: '+44', label: 'United Kingdom' },
  { code: 'DE', dial: '+49', label: 'Germany' },
];
