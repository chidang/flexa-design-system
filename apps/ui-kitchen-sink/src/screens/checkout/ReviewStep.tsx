/**
 * Step 4 — Review & confirm. Recaps the chosen address and payment method in an
 * FxDescriptionList (each with a jump-back Edit), lists each seller's order
 * group with its shipping estimate, and previews the terminal FxPaymentStatus
 * (will be `held`). The Pay-now button + full summary live in the orchestrator's
 * rail; this body is the read-back.
 */
import { FxDescriptionList, FxPaymentStatus, FxAlert, FxButton } from 'flexa-ui-kit';
import type { Address, Cart, PaymentMethod, ShippingOption } from 'flexa-ui-kit/mocks';
import { NEW_CARD, WALLET, type PaymentValue } from './PaymentStep';
import type { DetailsValue } from './DetailsStep';
import { money } from './shared';

export interface ReviewStepProps {
  cart: Cart;
  address: Address | undefined;
  details: DetailsValue;
  payment: PaymentValue;
  methods: PaymentMethod[];
  shippingOptions: ShippingOption[];
  onEditDetails: () => void;
  onEditPayment: () => void;
}

/** A short human label for the selected payment method. */
function paymentLabel(payment: PaymentValue, methods: PaymentMethod[]): string {
  if (payment.method === WALLET) return 'Wallet balance';
  if (payment.method === NEW_CARD) {
    const tail = payment.card.number.replace(/\D/g, '').slice(-4);
    return tail ? `New card •••• ${tail}` : 'New card';
  }
  const saved = methods.find((m) => m.id === payment.method);
  return saved ? `${saved.brand} •••• ${saved.last4}` : 'Card';
}

export function ReviewStep({
  cart,
  address,
  details,
  payment,
  methods,
  shippingOptions,
  onEditDetails,
  onEditPayment,
}: ReviewStepProps) {
  const shipTo = address
    ? `${address.recipient}, ${address.line1}, ${address.postalCode} ${address.city} · ${details.phone.number || address.phone}`
    : '—';

  return (
    <div className="ks-stack" style={{ ['--ks-gap' as string]: 'var(--fx-space-5)' }}>
      <div className="ks-stack" style={{ ['--ks-gap' as string]: 'var(--fx-space-3)' }}>
        <div className="ks-row ks-row-between">
          <strong>Ship to</strong>
          <FxButton variant="ghost" size="sm" onClick={onEditDetails}>
            Edit
          </FxButton>
        </div>
        <div className="ks-row ks-row-between">
          <strong>Payment</strong>
          <FxButton variant="ghost" size="sm" onClick={onEditPayment}>
            Edit
          </FxButton>
        </div>
        <FxDescriptionList
          items={[
            { term: 'Ship to', detail: shipTo },
            { term: 'Payment', detail: paymentLabel(payment, methods) },
          ]}
          layout="horizontal"
          divided
        />
      </div>

      <section className="ks-stack" style={{ ['--ks-gap' as string]: 'var(--fx-space-4)' }}>
        <strong>Order groups</strong>
        {cart.groups.map((group, i) => {
          const chosen = shippingOptions.find((o) => o.id === details.shipping[group.sellerId]);
          const items = group.items.reduce((n, it) => n + it.quantity, 0);
          return (
            <FxDescriptionList
              key={group.sellerId}
              items={[
                {
                  term: `Order group ${i + 1} — ${group.sellerName}`,
                  detail: `${items} item${items === 1 ? '' : 's'} · ${money(group.subtotal)}`,
                },
                {
                  term: 'Shipping',
                  detail: chosen ? `${chosen.label} · ${chosen.estimate}` : 'Select a method',
                },
              ]}
              layout="horizontal"
            />
          );
        })}
      </section>

      <section className="ks-stack" style={{ ['--ks-gap' as string]: 'var(--fx-space-3)' }}>
        <strong>Payment status preview</strong>
        <FxPaymentStatus
          payment={{
            id: 'preview',
            status: 'held',
            amount: cart.total,
            method: { brand: paymentLabel(payment, methods) },
          }}
          showMethod
        />
      </section>

      <FxAlert
        tone="info"
        title="Held in escrow"
        description="Payment is held in escrow until you approve delivery."
      />
    </div>
  );
}
