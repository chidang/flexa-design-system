/**
 * FxPricingCard showcase spec. `PricingPlan`/`PricingCardLabels` are
 * component-local shapes (documented in `props` as type strings); `period` is a
 * component-local literal union, not a §5 status — so no `enums` map entry.
 */
import type { ShowcaseSpec } from '../showcase-types';
import { FxPricingCard } from './pricing-card';
import type { PricingPlan } from './pricing-card';

const starter: PricingPlan = {
  id: 'starter',
  name: 'Starter',
  price: { amount: 0, currency: 'USD' },
  period: 'month',
  ctaLabel: 'Get started',
  features: [
    { label: '1 project', included: true },
    { label: 'Community support', included: true },
    { label: 'Custom domain', included: false },
    { label: 'Team seats', included: false },
  ],
};

const pro: PricingPlan = {
  id: 'pro',
  name: 'Pro',
  price: { amount: 2900, currency: 'USD' },
  period: 'month',
  ctaLabel: 'Choose Pro',
  featured: true,
  badge: 'Most popular',
  features: [
    { label: 'Unlimited projects', included: true },
    { label: 'Priority support', included: true },
    { label: 'Custom domain', included: true },
    { label: 'Team seats', included: false },
  ],
};

const business: PricingPlan = {
  id: 'business',
  name: 'Business',
  price: { amount: 29000, currency: 'USD' },
  period: 'year',
  ctaLabel: 'Choose Business',
  features: [
    { label: 'Everything in Pro', included: true },
    { label: 'SSO & SAML', included: true },
    { label: 'Team seats', included: true },
    { label: 'Dedicated manager', included: true },
  ],
};

export const pricingCardShowcase: ShowcaseSpec = {
  name: 'PricingCard',
  slug: 'pricing-card',
  category: 'commerce',
  slice: 'U8',
  status: 'ready',
  tagline: 'A single pricing-table tier — plan, price/period, features and CTA.',
  component: FxPricingCard,
  variants: [
    { label: 'standard tier', props: { plan: starter, onSelect: () => {} } },
    { label: 'featured tier', props: { plan: pro, onSelect: () => {} }, note: 'Primary ring + "Most popular" Badge; featured CTA is primary.' },
    { label: 'annual period', props: { plan: business, onSelect: () => {} } },
    { label: 'one-time price', props: { plan: { ...business, id: 'lifetime', name: 'Lifetime', period: 'one_time', ctaLabel: 'Buy once' }, onSelect: () => {} } },
    { label: 'with footnote', props: { plan: pro, footnote: 'Billed annually. Cancel anytime.', onSelect: () => {} } },
    { label: 'current plan', props: { plan: pro, current: true }, note: 'CTA reads "Current plan" and is disabled.' },
  ],
  props: [
    { name: 'plan', type: '{ id; name: string; price: Money; period: "month" | "year" | "one_time"; features: { label: string; included: boolean }[]; ctaLabel: string; featured?: boolean; badge?: string }', required: true, description: 'The plan tier to render.' },
    { name: 'onSelect', type: '(planId: string) => void', description: 'Fires with the plan id when the CTA is activated.' },
    { name: 'footnote', type: 'string', description: 'Fine-print shown under the CTA.' },
    { name: 'current', type: 'boolean', default: 'false', description: 'Marks the subscriber\'s active plan — CTA disabled + "Current plan".' },
    { name: 'locale', type: 'string', description: 'Locale for Money formatting.' },
    { name: 'labels', type: 'Partial<PricingCardLabels>', description: 'i18n overrides: perMonth / perYear / oneTime / notIncluded / currentPlan.' },
  ],
  events: [
    { name: 'onSelect', payload: 'planId: string', description: 'Fired when the CTA is activated (suppressed while `current`).' },
  ],
  aria: [
    { attr: 'FxButton[disabled]', value: 'current', note: 'When `current`, the CTA is disabled and labelled "Current plan".' },
    { attr: '.fx-pricing-card-sr', value: 'visually-hidden', note: '"(not included)" follows each excluded feature so exclusion is never strike/colour-only (§1.7.7).' },
  ],
  contract: { doc: '04-component-bible.md', heading: 'FxPricingCard — Pricing Card' },
};
