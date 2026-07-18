'use client';
/**
 * FxCartSummary — the shopping-cart line items + totals + checkout panel
 * (doc 04 §2 "FxCartSummary — Cart Summary").
 *
 * A client island: the quantity steppers and promo-code field are interactive
 * (value in, callbacks out — no internal state that needs effects). Line totals,
 * subtotal/shipping/tax/discount/total live in the host; the component is
 * presentational and controlled. When `editable=false` it drops the steppers,
 * remove buttons, checkout and promo affordances, rendering a static quantity —
 * this read-only mode is exactly what FxCheckoutSummary reuses.
 *
 * A visually-hidden `role="status"` region announces the running subtotal so a
 * quantity/removal change reads politely to assistive tech.
 */
import { useState } from 'react';
import type { ReactNode } from 'react';
import type { Money } from '../currency-input/currency-input';
import { FxStepper } from '../stepper/stepper';
import { FxButton } from '../button/button';
import { FxInput } from '../input/input';
import { FxIcon } from '../icon/FxIcon';
import { FxDescriptionList } from '../description-list/description-list';
import type { DescriptionListItem } from '../description-list/description-list';

/** One cart line — a listing at a chosen quantity, with its computed line total. */
export interface CartItem {
  id: string;
  listingId: string;
  title: string;
  imageUrl?: string;
  quantity: number;
  unitPrice: Money;
  lineTotal: Money;
  /** Upper bound for the quantity stepper (stock cap). */
  maxQuantity?: number;
}

/** Cart totals — all optional except the final `total`. */
export interface CartTotals {
  subtotal: Money;
  shipping?: Money;
  tax?: Money;
  discount?: Money;
  total: Money;
}

/** Baked-in strings — every one a prop, with sensible English defaults (§i18n). */
export interface CartSummaryLabels {
  checkout: string;
  promo: string;
  apply: string;
  remove: string;
  subtotal: string;
  shipping: string;
  tax: string;
  discount: string;
  total: string;
}

const DEFAULT_LABELS: CartSummaryLabels = {
  checkout: 'Checkout',
  promo: 'Promo code',
  apply: 'Apply',
  remove: 'Remove',
  subtotal: 'Subtotal',
  shipping: 'Shipping',
  tax: 'Tax',
  discount: 'Discount',
  total: 'Total',
};

export interface FxCartSummaryProps {
  /** Cart lines. */
  items: CartItem[];
  /** Totals block. */
  totals: CartTotals;
  /** A line quantity changed via its stepper. */
  onQuantityChange?: (itemId: string, quantity: number) => void;
  /** A line was removed. */
  onRemove?: (itemId: string) => void;
  /** Checkout button pressed. */
  onCheckout?: () => void;
  /** Promo code submitted — resolves when the host has applied (or rejected) it. */
  onApplyPromo?: (code: string) => Promise<void>;
  /**
   * When `false`, render static quantities and hide the remove, checkout and
   * promo affordances (the read-only mode FxCheckoutSummary reuses). Defaults to
   * `true`.
   */
  editable?: boolean;
  /**
   * Quantity at/above which removal is treated as destructive. The component
   * stays presentational — this is a hint the HOST may confirm on; v1 removes
   * directly. Defaults to `0` (no threshold).
   */
  removeConfirmThreshold?: number;
  /** Shown in place of the line list when the cart is empty. */
  emptyLabel?: ReactNode;
  /** Baked-in strings. Merged over the English defaults. */
  labels?: Partial<CartSummaryLabels>;
  /** Locale for Money formatting. Defaults to the runtime env locale. */
  locale?: string;
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

export function FxCartSummary({
  items,
  totals,
  onQuantityChange,
  onRemove,
  onCheckout,
  onApplyPromo,
  editable = true,
  removeConfirmThreshold = 0,
  emptyLabel = 'Your cart is empty.',
  labels,
  locale,
  className,
}: FxCartSummaryProps) {
  const l = { ...DEFAULT_LABELS, ...labels };
  const [promo, setPromo] = useState('');
  const [applying, setApplying] = useState(false);
  const rootClass = ['fx-cart-summary', className].filter(Boolean).join(' ');

  const totalRows: DescriptionListItem[] = [
    { term: l.subtotal, detail: formatMoney(totals.subtotal, locale) },
  ];
  if (totals.shipping) totalRows.push({ term: l.shipping, detail: formatMoney(totals.shipping, locale) });
  if (totals.tax) totalRows.push({ term: l.tax, detail: formatMoney(totals.tax, locale) });
  if (totals.discount)
    totalRows.push({
      term: l.discount,
      detail: <span className="fx-cart-summary-discount">−{formatMoney(totals.discount, locale)}</span>,
    });

  const submitPromo = () => {
    if (!onApplyPromo || applying || promo.trim() === '') return;
    setApplying(true);
    void onApplyPromo(promo.trim()).finally(() => setApplying(false));
  };

  const isEmpty = items.length === 0;

  return (
    <section className={rootClass} data-editable={editable || undefined}>
      {isEmpty ? (
        <div className="fx-cart-summary-empty">{emptyLabel}</div>
      ) : (
        <ul className="fx-cart-summary-items">
          {items.map((item) => (
            <li key={item.id} className="fx-cart-summary-item">
              <div className="fx-cart-summary-thumb">
                {item.imageUrl != null ? (
                  <img src={item.imageUrl} alt={item.title} />
                ) : (
                  <span className="fx-cart-summary-thumb-fallback" aria-hidden="true">
                    <FxIcon name="image" size={20} />
                  </span>
                )}
              </div>
              <div className="fx-cart-summary-line">
                <div className="fx-cart-summary-title">{item.title}</div>
                <div className="fx-cart-summary-unit">{formatMoney(item.unitPrice, locale)}</div>
                <div className="fx-cart-summary-qty">
                  {editable ? (
                    <FxStepper
                      value={item.quantity}
                      min={1}
                      max={item.maxQuantity}
                      size="sm"
                      ariaLabel={`${item.title} quantity`}
                      onChange={(qty) => onQuantityChange?.(item.id, qty)}
                    />
                  ) : (
                    <span className="fx-cart-summary-qty-static">×{item.quantity}</span>
                  )}
                </div>
              </div>
              <div className="fx-cart-summary-line-total">{formatMoney(item.lineTotal, locale)}</div>
              {editable && (
                <button
                  type="button"
                  className="fx-cart-summary-remove"
                  aria-label={`${l.remove} ${item.title}`}
                  data-confirm={
                    removeConfirmThreshold > 0 && item.quantity >= removeConfirmThreshold
                      ? true
                      : undefined
                  }
                  onClick={() => onRemove?.(item.id)}
                >
                  <FxIcon name="close" size={16} />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      {!isEmpty && (
        <div className="fx-cart-summary-totals">
          <FxDescriptionList items={totalRows} layout="horizontal" />
          <div className="fx-cart-summary-grand">
            <span className="fx-cart-summary-grand-term">{l.total}</span>
            <span className="fx-cart-summary-grand-detail">{formatMoney(totals.total, locale)}</span>
          </div>
        </div>
      )}

      {editable && !isEmpty && (onApplyPromo != null || onCheckout != null) && (
        <div className="fx-cart-summary-actions">
          {onApplyPromo != null && (
            <div className="fx-cart-summary-promo">
              <FxInput
                className="fx-cart-summary-promo-input"
                value={promo}
                aria-label={l.promo}
                placeholder={l.promo}
                onChange={(v) => setPromo(v)}
                onEnter={submitPromo}
              />
              <FxButton
                variant="secondary"
                loading={applying}
                onClick={submitPromo}
                disabled={promo.trim() === ''}
              >
                {l.apply}
              </FxButton>
            </div>
          )}
          {/* No handler -> no affordance (§3.9 convention): grouped carts inside
              a checkout wizard surface no per-group checkout button. */}
          {onCheckout != null && (
            <div className="fx-cart-summary-checkout">
              <FxButton onClick={onCheckout}>{l.checkout}</FxButton>
            </div>
          )}
        </div>
      )}

      {/* Politely announce the running subtotal after quantity/removal changes. */}
      <span className="fx-cart-summary-sr" role="status">
        {`${l.subtotal} ${formatMoney(totals.subtotal, locale)}`}
      </span>
    </section>
  );
}
