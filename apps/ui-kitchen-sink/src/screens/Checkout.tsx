/**
 * U11 Checkout (doc 08 §2.4) — the four-step wizard cart → details → payment →
 * review, plus a terminal confirmation, composed entirely from flexa-ui against
 * the mock backend (`flexa-ui-kit/mocks`). Layout is `ks-*` utilities only; every
 * visual element is a flexa-ui component.
 *
 * The wizard is one FxFormWizard inside an FxWizardLayout. Its active step is
 * controlled off the route (`/screens/checkout/{cart|details|payment|review}`)
 * and `onStepChange` navigates — so the numbered header, validate-on-Continue,
 * revisitable completed steps and blocked forward-jumps all come from the
 * component. A persistent FxCheckoutSummary rail rides every step; on Review it
 * carries the guarded, idempotent Pay-now action with a rail FxLoadingOverlay.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import {
  FxWizardLayout,
  FxFormWizard,
  FxCheckoutSummary,
  FxBlankStateLayout,
  FxButton,
  FxLoadingOverlay,
  FxAlert,
  FxSkeletonLoader,
  type WizardStep,
  type ValidationResult,
  type PhoneValue,
} from 'flexa-ui-kit';
import type {
  Address,
  Cart,
  Order,
  PaymentMethod,
  ShippingOption,
  Wallet,
} from 'flexa-ui-kit/mocks';
import { api, ApiRequestError } from './api';
import { CartStep } from './checkout/CartStep';
import { DetailsStep, type DetailsErrors, type DetailsValue } from './checkout/DetailsStep';
import {
  PaymentStep,
  NEW_CARD,
  WALLET,
  type PaymentErrors,
  type PaymentValue,
} from './checkout/PaymentStep';
import { ReviewStep } from './checkout/ReviewStep';
import { Confirmation } from './checkout/Confirmation';
import { CHECKOUT_BASE, STEP_LABELS, STEP_ORDER, money, type CheckoutStep } from './checkout/shared';

/** A stable idempotency key per checkout session (generated once). */
function newIdempotencyKey(): string {
  return `chk_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

const EMPTY_PHONE: PhoneValue = { country: 'FR', number: '' };

export function Checkout() {
  const location = useLocation();
  const navigate = useNavigate();

  /* ---- data ---------------------------------------------------------------- */
  const [cart, setCart] = useState<Cart | null>(null);
  const [addresses, setAddresses] = useState<Address[] | null>(null);
  const [shippingOptions, setShippingOptions] = useState<ShippingOption[] | null>(null);
  const [methods, setMethods] = useState<PaymentMethod[] | null>(null);
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [cartBusy, setCartBusy] = useState(false);

  /* ---- lifted selections --------------------------------------------------- */
  const [details, setDetails] = useState<DetailsValue>({
    addressId: null,
    phone: EMPTY_PHONE,
    shipping: {},
  });
  const [payment, setPayment] = useState<PaymentValue>({
    method: null,
    card: { number: '', expiry: '', cvc: '' },
    saveCard: false,
  });
  const [detailsErrors, setDetailsErrors] = useState<DetailsErrors>({});
  const [paymentErrors, setPaymentErrors] = useState<PaymentErrors>({});

  /* ---- payment lifecycle --------------------------------------------------- */
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);
  const [orders, setOrders] = useState<Order[] | null>(null);
  const idempotencyKey = useRef<string>(newIdempotencyKey());

  /* ---- which step are we on (derived from the route) ----------------------- */
  const segment = location.pathname.split('/').filter(Boolean).pop() ?? 'cart';
  const currentStep: CheckoutStep = (STEP_ORDER as string[]).includes(segment)
    ? (segment as CheckoutStep)
    : 'cart';

  /* ---- loads --------------------------------------------------------------- */
  useEffect(() => {
    let live = true;
    void api.get<Cart>('/v1/cart').then((c) => {
      if (live) setCart(c);
    });
    return () => {
      live = false;
    };
  }, []);

  // Default the shipping address to the buyer's default once loaded.
  useEffect(() => {
    if (addresses === null) return;
    setDetails((d) => (d.addressId === null ? { ...d, addressId: addresses.find((a) => a.isDefault)?.id ?? addresses[0]?.id ?? null } : d));
  }, [addresses]);

  // Step 2 entry — addresses + shipping options.
  useEffect(() => {
    if (currentStep !== 'details') return;
    if (addresses === null) void api.get<{ data: Address[] }>('/v1/me/addresses').then((r) => setAddresses(r.data));
    if (shippingOptions === null) void api.get<{ data: ShippingOption[] }>('/v1/cart/shipping-options').then((r) => setShippingOptions(r.data));
  }, [currentStep, addresses, shippingOptions]);

  // Step 3 entry — saved methods + wallet.
  useEffect(() => {
    if (currentStep !== 'payment') return;
    if (methods === null) void api.get<{ data: PaymentMethod[] }>('/v1/me/payment-methods').then((r) => setMethods(r.data));
    if (wallet === null) void api.get<Wallet>('/v1/wallet').then(setWallet);
  }, [currentStep, methods, wallet]);

  // Review needs details data too if the user deep-links straight in.
  useEffect(() => {
    if (currentStep !== 'review') return;
    if (addresses === null) void api.get<{ data: Address[] }>('/v1/me/addresses').then((r) => setAddresses(r.data));
    if (shippingOptions === null) void api.get<{ data: ShippingOption[] }>('/v1/cart/shipping-options').then((r) => setShippingOptions(r.data));
    if (methods === null) void api.get<{ data: PaymentMethod[] }>('/v1/me/payment-methods').then((r) => setMethods(r.data));
  }, [currentStep, addresses, shippingOptions, methods]);

  /* ---- cart mutations ------------------------------------------------------ */
  const patchQty = useCallback((itemId: string, quantity: number) => {
    setCartBusy(true);
    void api
      .patch<Cart>(`/v1/cart/items/${itemId}`, { quantity })
      .then(setCart)
      .finally(() => setCartBusy(false));
  }, []);

  const removeItem = useCallback((itemId: string) => {
    setCartBusy(true);
    void api
      .del<Cart>(`/v1/cart/items/${itemId}`)
      .then(setCart)
      .finally(() => setCartBusy(false));
  }, []);

  /* ---- validation (gates Continue) ---------------------------------------- */
  const validateDetails = useCallback((): ValidationResult => {
    const errs: DetailsErrors = {};
    if (!details.addressId) errs.address = 'Choose a shipping address.';
    if (details.phone.number.trim() === '') errs.phone = 'Enter a contact phone number.';
    const missingShipping = (cart?.groups ?? []).some((g) => !details.shipping[g.sellerId]);
    if (missingShipping) errs.shipping = 'Choose a shipping method for every seller.';
    setDetailsErrors(errs);
    return { valid: Object.keys(errs).length === 0 };
  }, [details, cart]);

  const validatePayment = useCallback((): ValidationResult => {
    const errs: PaymentErrors = {};
    if (!payment.method) errs.method = 'Choose a payment method.';
    else if (payment.method === NEW_CARD && payment.card.number.replace(/\D/g, '').length < 12) {
      errs.card = 'Enter a valid card number.';
    }
    setPaymentErrors(errs);
    return { valid: Object.keys(errs).length === 0 };
  }, [payment]);

  /* ---- pay ----------------------------------------------------------------- */
  const pay = useCallback(() => {
    if (paying) return; // guard double-submit alongside the Idempotency-Key
    if (!validateDetails().valid) {
      navigate(`${CHECKOUT_BASE}/details`);
      return;
    }
    if (!validatePayment().valid) {
      navigate(`${CHECKOUT_BASE}/payment`);
      return;
    }
    setPaying(true);
    setPayError(null);
    void api
      .post<{ orders: Order[] }>('/v1/orders', {}, idempotencyKey.current)
      .then((res) => {
        setOrders(res.orders);
        navigate(`${CHECKOUT_BASE}/confirmation`);
      })
      .catch((err: unknown) => {
        setPayError(
          err instanceof ApiRequestError ? err.message : 'Payment could not be completed. Please try again.',
        );
      })
      .finally(() => setPaying(false));
  }, [paying, validateDetails, validatePayment, navigate]);

  /* ---- the empty-cart short-circuit --------------------------------------- */
  const cartEmpty = cart !== null && cart.groups.length === 0;

  /* ---- wizard steps -------------------------------------------------------- */
  const selectedAddress = useMemo(
    () => addresses?.find((a) => a.id === details.addressId),
    [addresses, details.addressId],
  );

  const steps: WizardStep[] = useMemo(() => {
    if (cart === null) return [];
    return [
      {
        id: 'cart',
        label: STEP_LABELS.cart,
        content: (
          <CartStep cart={cart} busy={cartBusy} onQuantityChange={patchQty} onRemove={removeItem} />
        ),
      },
      {
        id: 'details',
        label: STEP_LABELS.details,
        validate: validateDetails,
        content: (
          <DetailsStep
            cart={cart}
            addresses={addresses}
            shippingOptions={shippingOptions}
            value={details}
            errors={detailsErrors}
            onChange={setDetails}
          />
        ),
      },
      {
        id: 'payment',
        label: STEP_LABELS.payment,
        validate: validatePayment,
        content: (
          <PaymentStep
            cart={cart}
            methods={methods}
            wallet={wallet}
            value={payment}
            errors={paymentErrors}
            onChange={setPayment}
          />
        ),
      },
      {
        id: 'review',
        label: STEP_LABELS.review,
        content: (
          <div className="ks-stack" style={{ ['--ks-gap' as string]: 'var(--fx-space-5)' }}>
            {payError !== null && (
              <FxAlert
                tone="danger"
                live
                title="Payment failed"
                description={payError}
                actions={<FxButton variant="secondary" size="sm" onClick={pay}>Try again</FxButton>}
              />
            )}
            <ReviewStep
              cart={cart}
              address={selectedAddress}
              details={details}
              payment={payment}
              methods={methods ?? []}
              shippingOptions={shippingOptions ?? []}
              onEditDetails={() => navigate(`${CHECKOUT_BASE}/details`)}
              onEditPayment={() => navigate(`${CHECKOUT_BASE}/payment`)}
            />
          </div>
        ),
      },
    ];
  }, [
    cart,
    cartBusy,
    patchQty,
    removeItem,
    validateDetails,
    validatePayment,
    addresses,
    shippingOptions,
    details,
    detailsErrors,
    methods,
    wallet,
    payment,
    paymentErrors,
    payError,
    pay,
    selectedAddress,
    navigate,
  ]);

  /* ---- the persistent rail ------------------------------------------------- */
  const rail = useMemo(() => {
    if (cart === null) {
      return (
        <div className="ks-rail">
          <div className="ks-stack">
            <FxSkeletonLoader lines={4} />
          </div>
        </div>
      );
    }
    const items = cart.groups.flatMap((g) =>
      g.items.map((it) => ({
        id: it.id,
        listingId: it.listingId,
        title: it.title,
        imageUrl: it.coverUrl,
        quantity: it.quantity,
        unitPrice: it.unitPrice,
        lineTotal: it.lineTotal,
      })),
    );
    const onReview = currentStep === 'review';
    // No inline position override — .ks-rail is `position: sticky` (a containing
    // block for the FxLoadingOverlay too), so the summary tracks the scroll.
    return (
      <div className="ks-rail">
        <FxCheckoutSummary
          items={items}
          totals={{ subtotal: cart.total, total: cart.total }}
          sections={[
            {
              id: 'details',
              label: 'Shipping',
              summary: selectedAddress
                ? `${selectedAddress.recipient}, ${selectedAddress.city}`
                : 'Not set',
              onEdit: () => navigate(`${CHECKOUT_BASE}/details`),
            },
          ]}
          termsNote={
            <span className="ks-muted">Payment is held in escrow until you approve delivery.</span>
          }
          placeOrder={
            onReview ? (
              <FxButton variant="primary" size="lg" onClick={pay} disabled={paying} loading={paying}>
                Pay now {money(cart.total)}
              </FxButton>
            ) : undefined
          }
        />
        <FxLoadingOverlay visible={paying} label="Processing payment…" />
      </div>
    );
  }, [cart, currentStep, selectedAddress, navigate, pay, paying]);

  /* ---- render -------------------------------------------------------------- */
  return (
    <Routes>
      <Route index element={<Navigate to="cart" replace />} />
      <Route path="confirmation" element={<Confirmation orders={orders} />} />
      <Route
        path="*"
        element={
          <div className="ks-screen">
            {cartEmpty ? (
              <FxBlankStateLayout
                title="Your cart is empty"
                description="Browse the marketplace to find something you love, then come back to check out."
                icon="package"
                actions={
                  <FxButton variant="primary" onClick={() => navigate('/screens/search')}>
                    Browse listings
                  </FxButton>
                }
              />
            ) : (
              <FxWizardLayout
                logo={<strong>Secure checkout</strong>}
                exitLabel="Back to cart"
                // Two-column flow (form + summary rail) — the md default is a
                // single-column cap and squeezes the rail to ~245px.
                width="lg"
                onExit={() => navigate(`${CHECKOUT_BASE}/cart`)}
              >
                <div className="ks-cols">
                  <div>
                    {steps.length === 0 ? (
                      <div className="ks-stack" aria-busy="true">
                        <FxSkeletonLoader shape="text" width="40%" />
                        <FxSkeletonLoader lines={4} />
                      </div>
                    ) : (
                      <FxFormWizard
                        steps={steps}
                        activeStep={currentStep}
                        labels={{ next: 'Continue' }}
                        // One primary CTA per screen — Pay now lives in the rail.
                        hideSubmit
                        onStepChange={(stepId) => navigate(`${CHECKOUT_BASE}/${stepId}`)}
                        onSubmit={pay}
                      />
                    )}
                  </div>
                  {rail}
                </div>
              </FxWizardLayout>
            )}
          </div>
        }
      />
    </Routes>
  );
}
