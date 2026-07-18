/**
 * InvoiceCard showcase spec. Iterates `INVOICE_STATUSES` so every §5 status
 * renders with its §5 tone Badge; `enums.status` anchors that union.
 * `InvoiceSummary` is a component-local shape documented in `props`.
 */
import type { ShowcaseSpec } from '../showcase-types';
import { INVOICE_STATUSES } from '../enums';
import { FxInvoiceCard, type InvoiceSummary } from './invoice-card';

/** A base invoice reused across variants. */
const base: Omit<InvoiceSummary, 'status'> = {
  id: 'inv_1',
  number: 'INV-2026-0142',
  issuedAt: '2026-07-01',
  dueAt: '2026-07-31',
  subtotal: { amount: 48000, currency: 'USD' },
  tax: { amount: 3840, currency: 'USD' },
  fees: { amount: 500, currency: 'USD' },
  total: { amount: 52340, currency: 'USD' },
  downloadUrl: 'https://example.test/inv/142.pdf',
};

/** One card per §5 invoice status → its §5 tone. */
const statusVariants = INVOICE_STATUSES.map((status) => ({
  label: status,
  props: { invoice: { ...base, status }, onDownload: () => {} },
}));

export const invoiceCardShowcase: ShowcaseSpec = {
  name: 'InvoiceCard',
  slug: 'invoice-card',
  category: 'commerce',
  slice: 'U8',
  status: 'ready',
  tagline: 'A billing document summarised — number, status, dates, money rows, actions.',
  component: FxInvoiceCard,
  variants: [
    ...statusVariants,
    {
      label: 'open + Pay action',
      props: { invoice: { ...base, status: 'open' }, onDownload: () => {}, onPay: () => {} },
      note: 'Pay renders only when onPay is wired.',
    },
    {
      label: 'no fees',
      props: {
        invoice: { ...base, status: 'paid', fees: undefined, total: { amount: 51840, currency: 'USD' } },
        onDownload: () => {},
      },
    },
    {
      label: 'no due date',
      props: { invoice: { ...base, status: 'draft', dueAt: undefined }, onDownload: () => {} },
    },
    {
      label: 'EUR + formatted dates',
      props: {
        invoice: {
          ...base,
          status: 'overdue',
          subtotal: { amount: 20000, currency: 'EUR' },
          tax: { amount: 3800, currency: 'EUR' },
          fees: undefined,
          total: { amount: 23800, currency: 'EUR' },
        },
        onDownload: () => {},
        onPay: () => {},
        locale: 'de-DE',
      },
    },
  ],
  props: [
    { name: 'invoice', type: 'InvoiceSummary', required: true, description: 'The invoice ({ id, number, status, issuedAt, dueAt?, subtotal, tax, fees?, total, downloadUrl }).' },
    { name: 'onDownload', type: '(downloadUrl: string) => void', required: true, description: 'Download-PDF handler.' },
    { name: 'onPay', type: '() => void', description: 'Pay handler — the Pay action renders only when supplied.' },
    { name: 'formatDate', type: '(iso: string) => string', description: 'Format an ISO date; defaults to verbatim.' },
    { name: 'locale', type: 'string', description: 'Locale for Money formatting.' },
    { name: 'labels', type: '{ issued; due; subtotal; tax; fees; total; download; pay }', description: 'i18n copy overrides.' },
  ],
  events: [
    { name: 'onDownload', payload: 'downloadUrl: string', description: 'Fired by the Download PDF action.' },
    { name: 'onPay', payload: 'void', description: 'Fired by the Pay action (rendered only when wired).' },
  ],
  aria: [
    { attr: 'status text', value: 'always rendered', note: 'The Badge spells the status word — colour is never the only signal (§1.7.7).' },
  ],
  enums: { status: INVOICE_STATUSES },
  contract: { doc: '04-component-bible.md', heading: 'FxInvoiceCard — Invoice Card' },
};
