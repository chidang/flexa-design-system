/**
 * FxPaymentStatus — a payment's outcome at a glance (doc 04 §3.7). A Badge
 * (status → tone via the shared §5 table) sits beside the amount, the method
 * (brand glyph + masked last-4) and a timestamp; a failed payment surfaces its
 * reason and — when the host wires `onRetry` — a retry action.
 *
 * Pure presentational (no hooks) → renders as an RSC in docs. Colour is never
 * the only signal (§1.7.7): the status word is always spelled inside the Badge,
 * and the failure reason is wired to that Badge with `aria-describedby` so a
 * screen reader hears "Failed — card declined" as one thought.
 */
import { FxBadge } from '../badge/badge';
import { FxButton } from '../button/button';
import { FxIcon } from '../icon/FxIcon';
import { statusTone, formatStatusLabel } from '../status-tone';
import type { PaymentStatus } from '../enums';
import type { Money } from '../currency-input/currency-input';

/** The payment method chip — brand + optional masked tail (§3.7). */
export interface PaymentMethod {
  /** Card/wallet brand, e.g. `'Visa'`. Shown as text (never colour-only). */
  brand: string;
  /** Last four digits; rendered masked as `•••• 4242`. */
  last4?: string;
  /** Overrides the composed `'{brand} •••• {last4}'` label. */
  label?: string;
}

/** A payment record (doc 04 §3.7). */
export interface PaymentInfo {
  id: string;
  status: PaymentStatus;
  amount: Money;
  method?: PaymentMethod;
  /** ISO timestamp; rendered verbatim (host formats before passing). */
  processedAt?: string;
  /** Human failure reason shown for `failed` (wired to the Badge). */
  failureReason?: string;
}

/** i18n copy — every baked-in string has a documented default. */
export interface PaymentStatusLabels {
  retry: string;
}

export const DEFAULT_PAYMENT_STATUS_LABELS: PaymentStatusLabels = {
  retry: 'Retry payment',
};

export interface FxPaymentStatusProps {
  payment: PaymentInfo;
  /** Show the formatted amount. Defaults to `true`. */
  showAmount?: boolean;
  /** Show the method chip (brand + masked last-4). Defaults to `true`. */
  showMethod?: boolean;
  /** Retry handler — the action renders only for `failed` payments. */
  onRetry?: () => void;
  /** Locale for `Money` formatting. Defaults to the runtime env locale. */
  locale?: string;
  labels?: Partial<PaymentStatusLabels>;
  className?: string;
}

/** Format a `Money` value into a locale-aware currency string. */
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

/** Composed method label — `'{brand} •••• {last4}'`, or `label` override. */
function methodLabel(method: PaymentMethod): string {
  if (method.label != null) return method.label;
  return method.last4 != null ? `${method.brand} •••• ${method.last4}` : method.brand;
}

export function FxPaymentStatus({
  payment,
  showAmount = true,
  showMethod = true,
  onRetry,
  locale,
  labels,
  className,
}: FxPaymentStatusProps) {
  const l = { ...DEFAULT_PAYMENT_STATUS_LABELS, ...labels };
  const rootClass = className ? `fx-payment-status ${className}` : 'fx-payment-status';
  const failed = payment.status === 'failed';
  const reasonId = failed && payment.failureReason != null ? `${payment.id}-reason` : undefined;

  return (
    <div className={rootClass} data-status={payment.status}>
      <div className="fx-payment-status-head">
        {/* Status word is always spelled — colour is only an enhancement. The
            Badge is described by the failure reason so both read together. */}
        <FxBadge tone={statusTone(payment.status)} aria-describedby={reasonId}>
          {formatStatusLabel(payment.status)}
        </FxBadge>
        {showAmount && (
          <span className="fx-payment-status-amount">{formatMoney(payment.amount, locale)}</span>
        )}
      </div>

      {(showMethod && payment.method != null) || payment.processedAt != null ? (
        <div className="fx-payment-status-meta">
          {showMethod && payment.method != null && (
            <span className="fx-payment-status-method">
              <FxIcon name="card" size={16} className="fx-payment-status-method-icon" />
              {methodLabel(payment.method)}
            </span>
          )}
          {payment.processedAt != null && (
            <time className="fx-payment-status-time" dateTime={payment.processedAt}>
              {payment.processedAt}
            </time>
          )}
        </div>
      ) : null}

      {failed && payment.failureReason != null && (
        <p className="fx-payment-status-reason" id={reasonId}>
          {payment.failureReason}
        </p>
      )}

      {failed && onRetry != null && (
        <div className="fx-payment-status-actions">
          <FxButton
            variant="secondary"
            size="sm"
            onClick={onRetry}
            iconStart={<FxIcon name="refresh" size={16} />}
          >
            {l.retry}
          </FxButton>
        </div>
      )}
    </div>
  );
}
