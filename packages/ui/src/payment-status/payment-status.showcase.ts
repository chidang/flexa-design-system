/**
 * PaymentStatus showcase spec. Iterates the shared `PAYMENT_STATUSES` union so
 * every §5 status renders with its §5 tone; `enums.status` anchors that union.
 * `PaymentMethod`/`PaymentInfo` are component-local shapes documented in `props`.
 */
import type { ShowcaseSpec } from '../showcase-types';
import { PAYMENT_STATUSES } from '../enums';
import { FxPaymentStatus, type PaymentInfo } from './payment-status';

/** A base payment record every status variant reuses. */
const base: Omit<PaymentInfo, 'status'> = {
  id: 'pay_1',
  amount: { amount: 4820, currency: 'USD' },
  method: { brand: 'Visa', last4: '4242' },
  processedAt: '2026-07-14T10:32:00Z',
};

/** One card per §5 payment status → its §5 tone. */
const statusVariants = PAYMENT_STATUSES.map((status) => ({
  label: status,
  props: { payment: { ...base, status } },
}));

export const paymentStatusShowcase: ShowcaseSpec = {
  name: 'PaymentStatus',
  slug: 'payment-status',
  category: 'commerce',
  slice: 'U8',
  status: 'ready',
  tagline: 'A payment outcome at a glance — status Badge, amount, method and timestamp.',
  component: FxPaymentStatus,
  variants: [
    ...statusVariants,
    {
      label: 'failed + reason + retry',
      props: {
        payment: {
          ...base,
          status: 'failed',
          failureReason: 'Card declined — insufficient funds.',
        },
        onRetry: () => {},
      },
      note: 'Reason wired to the Badge via aria-describedby; retry only for failed.',
    },
    {
      label: 'amount hidden',
      props: { payment: { ...base, status: 'processing' }, showAmount: false },
    },
    {
      label: 'method hidden',
      props: { payment: { ...base, status: 'released' }, showMethod: false },
    },
    {
      label: 'method label override',
      props: {
        payment: { ...base, status: 'held', method: { brand: 'PayPal', label: 'PayPal wallet' } },
      },
    },
    {
      label: 'partial refund',
      props: { payment: { ...base, status: 'partially_refunded', amount: { amount: 2000, currency: 'EUR' } } },
    },
  ],
  props: [
    { name: 'payment', type: 'PaymentInfo', required: true, description: 'The payment record ({ id, status, amount: Money, method?, processedAt?, failureReason? }).' },
    { name: 'showAmount', type: 'boolean', default: 'true', description: 'Show the formatted amount.' },
    { name: 'showMethod', type: 'boolean', default: 'true', description: 'Show the method chip (brand + masked last-4).' },
    { name: 'onRetry', type: '() => void', description: 'Retry handler — renders only for failed payments.' },
    { name: 'locale', type: 'string', description: 'Locale for Money formatting.' },
    { name: 'labels', type: '{ retry }', description: 'i18n copy overrides.' },
  ],
  events: [
    { name: 'onRetry', payload: 'void', description: 'Fired by the retry action (failed payments only).' },
  ],
  aria: [
    { attr: 'aria-describedby', value: 'reason id', note: 'The status Badge is described by the failure reason so they read together.' },
    { attr: 'status text', value: 'always rendered', note: 'The Badge spells the status word — colour is never the only signal (§1.7.7).' },
  ],
  enums: { status: PAYMENT_STATUSES },
  contract: { doc: '04-component-bible.md', heading: 'FxPaymentStatus — Payment Status' },
};
