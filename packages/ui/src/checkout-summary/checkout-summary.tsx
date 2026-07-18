'use client';
/**
 * FxCheckoutSummary — the order recap shown at checkout (doc 04
 * §2 "FxCheckoutSummary — Checkout Summary").
 *
 * Composes FxCartSummary in read-only mode (`editable={false}` — no steppers,
 * no remove/checkout/promo) plus shipping/payment recap sections, each with an
 * "Edit" link that jumps back to its wizard step. The host renders the actual
 * pay button through the `placeOrder` slot (payment-SDK territory).
 *
 * Layout: a sticky aside from ≥1024px (in-flow `position: sticky`, no z token);
 * on mobile a native `<details>` disclosure collapses it above the form. The
 * disclosure is SSR-valid and open by default so the axe pass sees full content
 * without effects.
 */
import { useState } from 'react';
import type { ReactNode } from 'react';
import {
  FxCartSummary,
  type CartItem,
  type CartTotals,
  type CartSummaryLabels,
} from '../cart-summary/cart-summary';
import { FxIcon } from '../icon/FxIcon';

/** One recap section — a labelled summary with a jump-to-step Edit link. */
export interface CheckoutSection {
  id: string;
  label: string;
  summary: ReactNode;
  /** Jump back to this section's wizard step. */
  onEdit: () => void;
}

/** Baked-in strings — every one a prop (§i18n). */
export interface CheckoutSummaryLabels {
  /** Heading of the collapsible disclosure on mobile. */
  title: string;
  /** Per-section "Edit" link text. */
  edit: string;
  /** Cart-summary strings passed through. */
  cart: Partial<CartSummaryLabels>;
}

const DEFAULT_LABELS: CheckoutSummaryLabels = {
  title: 'Order summary',
  edit: 'Edit',
  cart: {},
};

export interface FxCheckoutSummaryProps {
  /** Cart lines (rendered read-only). */
  items: CartItem[];
  /** Totals block (read-only). */
  totals: CartTotals;
  /** Shipping / payment recap sections with per-section Edit. */
  sections?: CheckoutSection[];
  /** Host-rendered pay button (payment-SDK territory). */
  placeOrder?: ReactNode;
  /** Optional terms / legal note above the pay button. */
  termsNote?: ReactNode;
  /** Baked-in strings. Merged over the English defaults. */
  labels?: Partial<CheckoutSummaryLabels>;
  /** Locale for Money formatting. Defaults to the runtime env locale. */
  locale?: string;
  className?: string;
}

export function FxCheckoutSummary({
  items,
  totals,
  sections = [],
  placeOrder,
  termsNote,
  labels,
  locale,
  className,
}: FxCheckoutSummaryProps) {
  const l = { ...DEFAULT_LABELS, ...labels };
  const [open, setOpen] = useState(true);
  const rootClass = ['fx-checkout-summary', className].filter(Boolean).join(' ');

  const body = (
    <div className="fx-checkout-summary-body">
      <FxCartSummary items={items} totals={totals} editable={false} labels={l.cart} locale={locale} />

      {sections.length > 0 && (
        <div className="fx-checkout-summary-sections">
          {sections.map((section) => (
            <div key={section.id} className="fx-checkout-summary-section">
              <div className="fx-checkout-summary-section-head">
                <span className="fx-checkout-summary-section-label">{section.label}</span>
                <button
                  type="button"
                  className="fx-checkout-summary-edit"
                  onClick={section.onEdit}
                >
                  <FxIcon name="edit" size={16} />
                  <span>{l.edit}</span>
                </button>
              </div>
              <div className="fx-checkout-summary-section-summary">{section.summary}</div>
            </div>
          ))}
        </div>
      )}

    </div>
  );

  return (
    <aside className={rootClass}>
      <div className="fx-checkout-summary-card">
        {/* Mobile: collapsible disclosure. Desktop CSS forces it open + sticky. */}
        <details className="fx-checkout-summary-disclosure" open={open}>
          <summary
            className="fx-checkout-summary-toggle"
            onClick={(event) => {
              event.preventDefault();
              setOpen((v) => !v);
            }}
          >
            <span className="fx-checkout-summary-title">{l.title}</span>
            <FxIcon name="chevron-down" size={20} className="fx-checkout-summary-chevron" />
          </summary>
          {body}
        </details>
        {/* Outside the disclosure on purpose: collapsing the summary on mobile
            must never hide the pay CTA. */}
        {(termsNote != null || placeOrder != null) && (
          <div className="fx-checkout-summary-place">
            {termsNote != null && <div className="fx-checkout-summary-terms">{termsNote}</div>}
            {placeOrder}
          </div>
        )}
      </div>
    </aside>
  );
}
