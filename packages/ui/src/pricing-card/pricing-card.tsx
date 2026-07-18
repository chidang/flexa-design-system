/**
 * FxPricingCard — a single plan tier in a pricing table (doc 04 §2.50). Composes
 * FxCard + FxBadge + FxButton over a plan descriptor: name, price/period, a
 * feature list, a CTA, and an optional footnote.
 *
 * Pure presentational (no hooks) → renders as an RSC in docs. The featured tier
 * elevates with a `color.primary` ring + Badge (the `.is-featured` state lives on
 * the root, never as a BEM modifier token). Excluded features never rely on
 * strike or colour: each carries visually-hidden "not included" text alongside a
 * `close`/`minus` glyph (§1.7.7); included features use `check`. `current` renders
 * the CTA disabled with a "Current plan" label.
 */
import { FxCard } from '../card/card';
import { FxBadge } from '../badge/badge';
import { FxButton } from '../button/button';
import { FxIcon } from '../icon/FxIcon';
import type { Money } from '../currency-input/currency-input';

/** Billing cadence — drives the period suffix beside the price. */
export type PricingPeriod = 'month' | 'year' | 'one_time';

/** One feature row — `included` decides the glyph + hidden state. */
export interface PricingFeature {
  label: string;
  included: boolean;
}

/** The plan a tile renders. */
export interface PricingPlan {
  id: string;
  /** Plan name, e.g. "Pro". */
  name: string;
  /** Price (§1.9 minor units). */
  price: Money;
  /** Billing cadence for the period suffix. */
  period: PricingPeriod;
  /** Feature rows (included + excluded). */
  features: PricingFeature[];
  /** CTA button label. */
  ctaLabel: string;
  /** Elevate this tier (primary ring + Badge). */
  featured?: boolean;
  /** Badge text for the featured tier, e.g. "Most popular". */
  badge?: string;
}

/** Baked-in strings, overridable for i18n (labels pattern, §1.4). */
export interface PricingCardLabels {
  /** Suffix for `period: 'month'`. */
  perMonth: string;
  /** Suffix for `period: 'year'`. */
  perYear: string;
  /** Suffix for `period: 'one_time'`. */
  oneTime: string;
  /** Visually-hidden text on excluded feature rows. */
  notIncluded: string;
  /** CTA label + status shown when `current`. */
  currentPlan: string;
}

export const DEFAULT_PRICING_CARD_LABELS: PricingCardLabels = {
  perMonth: '/mo',
  perYear: '/yr',
  oneTime: 'one-time',
  notIncluded: 'not included',
  currentPlan: 'Current plan',
};

export interface FxPricingCardProps {
  /** The plan to render (required). */
  plan: PricingPlan;
  /** Fires with the plan id when the CTA is activated. */
  onSelect?: (planId: string) => void;
  /** Fine-print shown under the CTA, e.g. "Billed annually. Cancel anytime.". */
  footnote?: string;
  /** Marks this as the subscriber's active plan — CTA disabled + "Current plan". */
  current?: boolean;
  /** Locale for `Money` formatting. Defaults to the runtime env locale. */
  locale?: string;
  /** i18n labels. */
  labels?: Partial<PricingCardLabels>;
  className?: string;
}

/** Format a `Money` value into a locale-aware currency string (§1.8). */
function formatMoney(money: Money, locale?: string): string {
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: money.currency,
    }).format(money.amount / 100);
  } catch {
    return String(money.amount);
  }
}

/** The period suffix for a cadence. */
function periodSuffix(period: PricingPeriod, l: PricingCardLabels): string {
  if (period === 'month') return l.perMonth;
  if (period === 'year') return l.perYear;
  return l.oneTime;
}

export function FxPricingCard({
  plan,
  onSelect,
  footnote,
  current = false,
  locale,
  labels,
  className,
}: FxPricingCardProps) {
  const l = { ...DEFAULT_PRICING_CARD_LABELS, ...labels };
  const rootClass = [
    'fx-pricing-card',
    plan.featured ? 'is-featured' : '',
    current ? 'is-current' : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <FxCard padding="lg" className={rootClass}>
      <div className="fx-pricing-card-inner">
        <div className="fx-pricing-card-head">
          <h3 className="fx-pricing-card-name">{plan.name}</h3>
          {plan.featured && plan.badge != null && (
            <FxBadge tone="info" appearance="solid" size="sm">
              {plan.badge}
            </FxBadge>
          )}
        </div>

        <p className="fx-pricing-card-price">
          <span className="fx-pricing-card-amount">{formatMoney(plan.price, locale)}</span>
          <span className="fx-pricing-card-period">{periodSuffix(plan.period, l)}</span>
        </p>

        <ul className="fx-pricing-card-features">
          {plan.features.map((f, i) => (
            <li
              key={`${f.label}-${i}`}
              className="fx-pricing-card-feature"
              data-included={f.included || undefined}
            >
              <span className="fx-pricing-card-feature-icon" aria-hidden="true">
                <FxIcon name={f.included ? 'check' : 'close'} size={16} />
              </span>
              <span className="fx-pricing-card-feature-label">{f.label}</span>
              {!f.included && <span className="fx-pricing-card-sr"> ({l.notIncluded})</span>}
            </li>
          ))}
        </ul>

        <div className="fx-pricing-card-cta">
          <FxButton
            variant={plan.featured ? 'primary' : 'secondary'}
            disabled={current}
            aria-disabled={current || undefined}
            onClick={() => !current && onSelect?.(plan.id)}
          >
            {current ? l.currentPlan : plan.ctaLabel}
          </FxButton>
        </div>

        {footnote != null && <p className="fx-pricing-card-footnote">{footnote}</p>}
      </div>
    </FxCard>
  );
}
