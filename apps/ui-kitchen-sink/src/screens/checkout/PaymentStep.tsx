/**
 * Step 3 — Payment. One FxRadioGroup over saved cards + "New card" + "Wallet"
 * (wallet disabled, with a reason, when the balance can't cover the total). New
 * card reveals card fields (FxInput in FxFieldGroup) and a save-card FxCheckbox.
 * An FxAlert states the escrow hold. Selection is lifted to the orchestrator.
 */
import {
  FxRadioGroup,
  FxFieldGroup,
  FxInput,
  FxCheckbox,
  FxAlert,
  FxSkeletonLoader,
} from 'flexa-ui-kit';
import type { Cart, PaymentMethod, Wallet } from 'flexa-ui-kit/mocks';
import { money } from './shared';

/** Sentinel method values that aren't a saved-card id. */
export const NEW_CARD = 'new-card';
export const WALLET = 'wallet';

export interface CardValue {
  number: string;
  expiry: string;
  cvc: string;
}

export interface PaymentValue {
  /** A saved-method id, or one of the {@link NEW_CARD}/{@link WALLET} sentinels. */
  method: string | null;
  card: CardValue;
  saveCard: boolean;
}

export interface PaymentErrors {
  method?: string;
  card?: string;
}

export interface PaymentStepProps {
  cart: Cart;
  methods: PaymentMethod[] | null;
  wallet: Wallet | null;
  value: PaymentValue;
  errors: PaymentErrors;
  onChange: (next: PaymentValue) => void;
}

export function PaymentStep({ cart, methods, wallet, value, errors, onChange }: PaymentStepProps) {
  if (methods === null || wallet === null) {
    return (
      <div className="ks-stack" aria-busy="true">
        <FxSkeletonLoader shape="text" width="30%" />
        <FxSkeletonLoader lines={3} />
        <FxSkeletonLoader shape="rect" height="4rem" />
      </div>
    );
  }

  const walletCovers = wallet.balance.amount >= cart.total.amount;

  const options = [
    ...methods.map((m) => ({
      value: m.id,
      label: `${m.brand} •••• ${m.last4}`,
      description: `Expires ${m.expiry}`,
    })),
    { value: NEW_CARD, label: 'New card' },
    {
      value: WALLET,
      label: `Wallet balance ${money(wallet.balance)}`,
      description: walletCovers
        ? undefined
        : 'Balance is lower than the order total — top up to use your wallet.',
      disabled: !walletCovers,
    },
  ];

  return (
    <div className="ks-stack" style={{ ['--ks-gap' as string]: 'var(--fx-space-5)' }}>
      <FxFieldGroup label="Payment method" error={errors.method} asGroup required>
        <FxRadioGroup
          options={options}
          value={value.method}
          onChange={(method) => onChange({ ...value, method })}
        />
      </FxFieldGroup>

      {value.method === NEW_CARD && (
        <div className="ks-stack" style={{ ['--ks-gap' as string]: 'var(--fx-space-4)' }}>
          <FxFieldGroup label="Card number" error={errors.card} required>
            <FxInput
              value={value.card.number}
              inputMode="numeric"
              placeholder="1234 5678 9012 3456"
              onChange={(number) => onChange({ ...value, card: { ...value.card, number } })}
            />
          </FxFieldGroup>
          <div className="ks-row" style={{ ['--ks-gap' as string]: 'var(--fx-space-4)' }}>
            <FxFieldGroup label="Expiry" required>
              <FxInput
                value={value.card.expiry}
                placeholder="MM/YY"
                onChange={(expiry) => onChange({ ...value, card: { ...value.card, expiry } })}
              />
            </FxFieldGroup>
            <FxFieldGroup label="CVC" required>
              <FxInput
                value={value.card.cvc}
                inputMode="numeric"
                placeholder="123"
                onChange={(cvc) => onChange({ ...value, card: { ...value.card, cvc } })}
              />
            </FxFieldGroup>
          </div>
          <FxCheckbox
            label="Save this card for next time"
            checked={value.saveCard}
            onChange={(saveCard) => onChange({ ...value, saveCard })}
          />
        </div>
      )}

      <FxAlert
        tone="info"
        title="Held in escrow"
        description="Payment is held in escrow until you approve delivery."
      />
    </div>
  );
}
