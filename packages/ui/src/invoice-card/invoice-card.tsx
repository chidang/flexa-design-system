/**
 * FxInvoiceCard — a billing document summarised for review (doc 04 §3.7). An
 * FxCard whose header pairs the invoice number with an `InvoiceStatus` Badge and
 * issued/due dates, a DescriptionList of the money rows (subtotal / tax / fees /
 * total), and a footer of actions (Download PDF, optional Pay).
 *
 * Pure presentational (no hooks) → renders as an RSC in docs. Every money row is
 * Intl-formatted; the status Badge always spells its word so colour is never the
 * only signal (§1.7.7). Pay renders only when the host wires `onPay`.
 */
import { FxCard } from '../card/card';
import { FxBadge } from '../badge/badge';
import { FxButton } from '../button/button';
import { FxDescriptionList, type DescriptionListItem } from '../description-list/description-list';
import { FxIcon } from '../icon/FxIcon';
import { statusTone, formatStatusLabel } from '../status-tone';
import type { InvoiceStatus } from '../enums';
import type { Money } from '../currency-input/currency-input';

/** An invoice summary (doc 04 §3.7). */
export interface InvoiceSummary {
  id: string;
  number: string;
  status: InvoiceStatus;
  /** ISO issued date; rendered via `formatDate` or verbatim. */
  issuedAt: string;
  /** ISO due date; rendered via `formatDate` or verbatim. */
  dueAt?: string;
  subtotal: Money;
  tax: Money;
  fees?: Money;
  total: Money;
  downloadUrl: string;
}

/** i18n copy — every baked-in string has a documented default. */
export interface InvoiceCardLabels {
  issued: string;
  due: string;
  subtotal: string;
  tax: string;
  fees: string;
  total: string;
  download: string;
  pay: string;
}

export const DEFAULT_INVOICE_CARD_LABELS: InvoiceCardLabels = {
  issued: 'Issued',
  due: 'Due',
  subtotal: 'Subtotal',
  tax: 'Tax',
  fees: 'Fees',
  total: 'Total',
  download: 'Download PDF',
  pay: 'Pay',
};

export interface FxInvoiceCardProps {
  invoice: InvoiceSummary;
  /** Download handler (paired with the invoice's `downloadUrl`). */
  onDownload: (downloadUrl: string) => void;
  /** Pay handler — the Pay action renders only when supplied. */
  onPay?: () => void;
  /** Format an ISO date for display. Defaults to rendering it verbatim. */
  formatDate?: (iso: string) => string;
  /** Locale for `Money` formatting. Defaults to the runtime env locale. */
  locale?: string;
  labels?: Partial<InvoiceCardLabels>;
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

export function FxInvoiceCard({
  invoice,
  onDownload,
  onPay,
  formatDate,
  locale,
  labels,
  className,
}: FxInvoiceCardProps) {
  const l = { ...DEFAULT_INVOICE_CARD_LABELS, ...labels };
  const rootClass = className ? `fx-invoice-card ${className}` : 'fx-invoice-card';
  const fmtDate = (iso: string) => (formatDate ? formatDate(iso) : iso);

  // Money rows — total is emphasised via a data flag the CSS reads.
  const rows: DescriptionListItem[] = [
    { term: l.subtotal, detail: formatMoney(invoice.subtotal, locale) },
    { term: l.tax, detail: formatMoney(invoice.tax, locale) },
    ...(invoice.fees != null ? [{ term: l.fees, detail: formatMoney(invoice.fees, locale) }] : []),
    { term: l.total, detail: <strong className="fx-invoice-card-total">{formatMoney(invoice.total, locale)}</strong> },
  ];

  return (
    <FxCard className={rootClass} padding="md">
      <div className="fx-invoice-card-header">
        <div className="fx-invoice-card-heading">
          <span className="fx-invoice-card-number">{invoice.number}</span>
          {/* Status word always spelled — colour is only an enhancement. */}
          <FxBadge tone={statusTone(invoice.status)}>{formatStatusLabel(invoice.status)}</FxBadge>
        </div>
        <dl className="fx-invoice-card-dates">
          <div className="fx-invoice-card-date">
            <dt>{l.issued}</dt>
            <dd>
              <time dateTime={invoice.issuedAt}>{fmtDate(invoice.issuedAt)}</time>
            </dd>
          </div>
          {invoice.dueAt != null && (
            <div className="fx-invoice-card-date">
              <dt>{l.due}</dt>
              <dd>
                <time dateTime={invoice.dueAt}>{fmtDate(invoice.dueAt)}</time>
              </dd>
            </div>
          )}
        </dl>
      </div>

      <FxDescriptionList items={rows} layout="horizontal" divided className="fx-invoice-card-rows" />

      <div className="fx-invoice-card-actions">
        <FxButton
          variant="secondary"
          size="sm"
          onClick={() => onDownload(invoice.downloadUrl)}
          iconStart={<FxIcon name="download" size={16} />}
        >
          {l.download}
        </FxButton>
        {onPay != null && (
          <FxButton variant="primary" size="sm" onClick={onPay}>
            {l.pay}
          </FxButton>
        )}
      </div>
    </FxCard>
  );
}
