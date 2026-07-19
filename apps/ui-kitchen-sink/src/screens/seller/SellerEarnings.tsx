/**
 * U13-C Earnings & Payouts (doc 08 §2.11, flow S6). Balances derived from the
 * shared order db (released escrows → available, held/delivered → in escrow), a
 * withdraw flow that POSTs a payout in a `processing` state, a filterable
 * transactions ledger and a payout history table. Composes flexa-ui end to end
 * against the mock backend (`flexa-ui-kit/mocks` via {@link ../api}).
 *
 * Because `available` comes from released escrows, this balance grows after the
 * buyer approves a delivered order — closing the buy→fulfil→approve→earn ripple.
 *
 * ZERO one-off component CSS: framing is `ks-*` + seller `sl-*` utilities; every
 * visual is a flexa-ui component.
 */
import { useCallback, useEffect, useState } from 'react';
import {
  FxAlert,
  FxBadge,
  FxButton,
  FxConfirmationDialog,
  FxDescriptionList,
  FxEmptyState,
  FxInlineError,
  FxSkeletonLoader,
  FxStatisticBlock,
  FxTable,
  FxTabs,
  useToast,
  type DescriptionListItem,
  type TableColumn,
  type TabItem,
  type Tone,
} from 'flexa-ui-kit';
import type { Collection, Money } from 'flexa-ui-kit/mocks';
import { api, ApiRequestError } from '../api';
import { formatMoney, formatDate } from './format';

/* ------------------------------------------------------------------ shapes */

interface Balance {
  available: Money;
  pending: Money;
  inEscrow: Money;
  lifetimePaidOut: Money;
  currency: string;
}

type TransactionType = 'sale' | 'fee' | 'refund' | 'payout';
type TransactionStatus = 'released' | 'held' | 'refunded' | 'processing' | 'sent' | 'failed';

interface SellerTransaction {
  id: string;
  type: TransactionType;
  orderNumber: string | null;
  amount: Money;
  status: TransactionStatus;
  createdAt: string;
}

type PayoutStatus = 'requested' | 'processing' | 'sent' | 'failed';

interface Payout {
  id: string;
  amount: Money;
  status: PayoutStatus;
  destinationLast4: string;
  failureCode: string | null;
  requestedAt: string;
  sentAt: string | null;
}

interface PayoutMethod {
  accountHolder: string;
  accountNumberLast4: string;
  countryCode: string;
  currency: string;
  status: 'missing' | 'pending' | 'verified' | 'rejected';
}

/* -------------------------------------------------------------- badge tones */

const TXN_STATUS_TONE: Record<TransactionStatus, Tone> = {
  released: 'success',
  sent: 'success',
  held: 'warning',
  processing: 'info',
  refunded: 'danger',
  failed: 'danger',
};

const PAYOUT_STATUS_TONE: Record<PayoutStatus, Tone> = {
  sent: 'success',
  processing: 'info',
  requested: 'neutral',
  failed: 'danger',
};

const TXN_TYPE_LABEL: Record<TransactionType, string> = {
  sale: 'Sale',
  fee: 'Fee',
  refund: 'Refund',
  payout: 'Payout',
};

/* -------------------------------------------------------------------- view */

export function SellerEarnings() {
  const toast = useToast();

  const [balance, setBalance] = useState<Balance | null>(null);
  const [transactions, setTransactions] = useState<SellerTransaction[] | null>(null);
  const [payouts, setPayouts] = useState<Payout[] | null>(null);
  const [method, setMethod] = useState<PayoutMethod | null>(null);
  const [error, setError] = useState<ApiRequestError | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);

  useEffect(() => {
    let live = true;
    setError(null);
    setBalance(null);
    setTransactions(null);
    setPayouts(null);
    void api
      .get<Balance>('/v1/me/store/balance')
      .then((b) => live && setBalance(b))
      .catch((e) => live && setError(e instanceof ApiRequestError ? e : new ApiRequestError(500, null)));
    void api
      .get<Collection<SellerTransaction>>('/v1/seller/transactions')
      .then((r) => live && setTransactions(r.data))
      .catch(() => live && setTransactions([]));
    void api
      .get<Collection<Payout>>('/v1/payouts')
      .then((r) => live && setPayouts(r.data))
      .catch(() => live && setPayouts([]));
    void api
      .get<PayoutMethod>('/v1/me/store/payout-method')
      .then((m) => live && setMethod(m))
      .catch(() => {});
    return () => {
      live = false;
    };
  }, [reloadKey]);

  const withdraw = useCallback(async () => {
    if (!balance) return;
    setWithdrawing(true);
    try {
      await api.post('/v1/payouts', { amount: balance.available }, `payout-${balance.available.amount}`);
      toast.show({
        tone: 'success',
        title: 'Payout requested',
        description: `${formatMoney(balance.available)} is on its way to your bank.`,
      });
      setWithdrawOpen(false);
      setReloadKey((k) => k + 1);
    } catch (e) {
      const code = e instanceof ApiRequestError ? e.body?.code : undefined;
      toast.show({
        tone: 'danger',
        title: 'Could not request a payout',
        description:
          code === 'insufficient_funds'
            ? 'The amount is above your available balance.'
            : code === 'state_conflict'
              ? 'Add a verified payout account first.'
              : 'Please try again in a moment.',
      });
    } finally {
      setWithdrawing(false);
    }
  }, [balance, toast]);

  /* ---- balances row ------------------------------------------------------ */
  const balancesRow = balance ? (
    <div className="sl-balance-row">
      <div className="ks-stack" style={{ ['--ks-gap' as string]: 'var(--fx-space-3)' }}>
        <FxStatisticBlock label="Available" value={formatMoney(balance.available)} size="lg" caption="USD" />
        <FxButton
          variant="primary"
          onClick={() => setWithdrawOpen(true)}
          disabled={balance.available.amount <= 0}
        >
          Withdraw
        </FxButton>
      </div>
      <FxStatisticBlock label="Held in escrow" value={formatMoney(balance.inEscrow)} size="lg" caption="USD" />
      <FxStatisticBlock label="Paid out (lifetime)" value={formatMoney(balance.lifetimePaidOut)} size="lg" caption="USD" />
    </div>
  ) : (
    <div className="sl-balance-row">
      {Array.from({ length: 3 }, (_, i) => (
        <FxSkeletonLoader key={i} shape="rect" height="7rem" />
      ))}
    </div>
  );

  /* ---- transactions table ------------------------------------------------ */
  const txnColumns: TableColumn<SellerTransaction>[] = [
    { key: 'createdAt', header: 'Date', render: (r) => formatDate(r.createdAt) },
    { key: 'orderNumber', header: 'Order', render: (r) => r.orderNumber ?? '—' },
    { key: 'type', header: 'Type', render: (r) => TXN_TYPE_LABEL[r.type] },
    { key: 'amount', header: 'Amount', align: 'end', render: (r) => formatMoney(r.amount) },
    {
      key: 'status',
      header: 'Status',
      render: (r) => <FxBadge tone={TXN_STATUS_TONE[r.status]}>{r.status}</FxBadge>,
    },
  ];

  const transactionsTab = transactions ? (
    <FxTable
      caption="Transactions ledger"
      columns={txnColumns}
      rows={transactions}
      rowKey={(r) => r.id}
      emptyState={
        <FxEmptyState
          title="No transactions yet"
          description="They appear here with your first sale."
          icon="wallet"
          size="sm"
        />
      }
    />
  ) : (
    <FxSkeletonLoader shape="rect" lines={6} />
  );

  /* ---- payouts table ----------------------------------------------------- */
  const payoutColumns: TableColumn<Payout>[] = [
    { key: 'requestedAt', header: 'Requested', render: (r) => formatDate(r.requestedAt) },
    { key: 'amount', header: 'Amount', align: 'end', render: (r) => formatMoney(r.amount) },
    { key: 'destinationLast4', header: 'Destination', render: (r) => `•••• ${r.destinationLast4}` },
    {
      key: 'status',
      header: 'Status',
      render: (r) => <FxBadge tone={PAYOUT_STATUS_TONE[r.status]}>{r.status}</FxBadge>,
    },
    { key: 'sentAt', header: 'Sent', render: (r) => (r.sentAt ? formatDate(r.sentAt) : '—') },
  ];

  const payoutsTab = payouts ? (
    <FxTable
      caption="Payout history"
      columns={payoutColumns}
      rows={payouts}
      rowKey={(r) => r.id}
      emptyState={<FxEmptyState title="No payouts yet" icon="bank" size="sm" />}
    />
  ) : (
    <FxSkeletonLoader shape="rect" lines={6} />
  );

  /* ---- method tab -------------------------------------------------------- */
  const methodItems: DescriptionListItem[] = method
    ? [
        { term: 'Account holder', detail: method.accountHolder },
        { term: 'Account', detail: `•••• ${method.accountNumberLast4}` },
        { term: 'Country', detail: method.countryCode },
        { term: 'Currency', detail: method.currency },
        { term: 'Status', detail: <FxBadge tone={method.status === 'verified' ? 'success' : 'warning'}>{method.status}</FxBadge> },
      ]
    : [];

  const methodTab = method ? (
    <div className="ks-stack" style={{ ['--ks-gap' as string]: 'var(--fx-space-4)' }}>
      <FxDescriptionList items={methodItems} layout="horizontal" divided />
      <div>
        <FxButton variant="secondary" disabled>
          Replace payout account
        </FxButton>
      </div>
    </div>
  ) : (
    <FxSkeletonLoader shape="rect" lines={4} />
  );

  const tabs: TabItem[] = [
    { id: 'transactions', label: 'Transactions', content: transactionsTab },
    { id: 'payouts', label: 'Payouts', content: payoutsTab },
    { id: 'method', label: 'Method', content: methodTab },
  ];

  if (error) {
    return (
      <div className="ks-screen">
        <h1 className="ks-page-title">Earnings & payouts</h1>
        <FxInlineError
          message="We couldn't load your earnings."
          detail={error.body?.requestId}
          onRetry={() => setReloadKey((k) => k + 1)}
        />
      </div>
    );
  }

  return (
    <div className="ks-screen">
      <h1 className="ks-page-title">Earnings & payouts</h1>

      {balancesRow}

      {balance && balance.available.amount <= 0 && (
        <FxAlert
          tone="info"
          title="Nothing to withdraw yet"
          description="Funds become available once a buyer approves a delivered order and escrow releases."
        />
      )}

      <FxTabs items={tabs} />

      {/* Withdraw confirmation (§2.11 interaction 1). */}
      <FxConfirmationDialog
        open={withdrawOpen}
        onOpenChange={setWithdrawOpen}
        tone="default"
        title="Withdraw available balance?"
        description={
          balance
            ? `${formatMoney(balance.available)} will be sent to your account ending ${method?.accountNumberLast4 ?? '••••'}. Payouts usually settle in 1–2 business days.`
            : ''
        }
        confirmLabel="Request payout"
        onConfirm={withdraw}
      />
    </div>
  );
}
