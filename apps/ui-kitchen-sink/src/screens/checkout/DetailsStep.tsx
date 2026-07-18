/**
 * Step 2 — Details. Shipping address (saved-address FxSelect + phone via
 * FxPhoneInput, both inside FxFieldGroup for label/help/error wiring) and one
 * FxRadioGroup of shipping methods per seller group. All selections are lifted
 * to the orchestrator so Review can recap them and the wizard can gate Continue.
 */
import {
  FxFieldGroup,
  FxSelect,
  FxPhoneInput,
  FxRadioGroup,
  FxSkeletonLoader,
  type PhoneValue,
} from 'flexa-ui-kit';
import type { Address, Cart, ShippingOption } from 'flexa-ui-kit/mocks';
import { COUNTRIES, money } from './shared';

export interface DetailsValue {
  addressId: string | null;
  phone: PhoneValue;
  /** sellerId → chosen shipping-option id. */
  shipping: Record<string, string>;
}

export interface DetailsErrors {
  address?: string;
  phone?: string;
  shipping?: string;
}

export interface DetailsStepProps {
  cart: Cart;
  addresses: Address[] | null;
  shippingOptions: ShippingOption[] | null;
  value: DetailsValue;
  errors: DetailsErrors;
  onChange: (next: DetailsValue) => void;
}

export function DetailsStep({
  cart,
  addresses,
  shippingOptions,
  value,
  errors,
  onChange,
}: DetailsStepProps) {
  if (addresses === null || shippingOptions === null) {
    return (
      <div className="ks-stack" aria-busy="true">
        <FxSkeletonLoader shape="text" width="30%" />
        <FxSkeletonLoader shape="rect" height="2.5rem" />
        <FxSkeletonLoader shape="rect" height="2.5rem" />
        <FxSkeletonLoader lines={3} />
      </div>
    );
  }

  return (
    <div className="ks-stack" style={{ ['--ks-gap' as string]: 'var(--fx-space-5)' }}>
      <FxFieldGroup label="Shipping address" error={errors.address} required>
        <FxSelect
          options={addresses.map((a) => ({
            value: a.id,
            label: `${a.label} — ${a.recipient}`,
            description: `${a.line1}, ${a.postalCode} ${a.city}`,
          }))}
          value={value.addressId}
          placeholder="Choose a saved address…"
          onChange={(addressId) => onChange({ ...value, addressId })}
        />
      </FxFieldGroup>

      <FxFieldGroup label="Contact phone" help="For delivery updates." error={errors.phone} required>
        <FxPhoneInput
          countries={COUNTRIES}
          defaultCountry="FR"
          value={value.phone}
          onChange={(phone) => onChange({ ...value, phone })}
        />
      </FxFieldGroup>

      <section className="ks-stack" style={{ ['--ks-gap' as string]: 'var(--fx-space-4)' }}>
        <strong>Shipping method</strong>
        {cart.groups.map((group) => {
          const options = shippingOptions.filter((o) => o.sellerId === group.sellerId);
          return (
            <FxFieldGroup
              key={group.sellerId}
              label={group.sellerName}
              error={
                cart.groups.indexOf(group) === 0 && errors.shipping ? errors.shipping : undefined
              }
              asGroup
              required
            >
              <FxRadioGroup
                options={options.map((o) => ({
                  value: o.id,
                  label: `${o.label} — ${money(o.price)}`,
                  description: o.estimate,
                }))}
                value={value.shipping[group.sellerId] ?? null}
                onChange={(optionId) =>
                  onChange({
                    ...value,
                    shipping: { ...value.shipping, [group.sellerId]: optionId },
                  })
                }
              />
            </FxFieldGroup>
          );
        })}
      </section>
    </div>
  );
}
