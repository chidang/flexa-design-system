/**
 * U13-B Wallet & Payment Methods (doc 08 §3.9, flow B6). Balance header
 * (Statistic Block) over Tabs: Payment methods | Wallet activity. Methods are a
 * List of card rows with a Context Menu (make default / remove) and an "Add
 * payment method" Dialog; activity is a Table of the wallet ledger with a
 * Payment Status Badge and a linked order. All mutations go through the buyer
 * handlers (`POST/PATCH/DELETE /me/payment-methods`); the list GET is the core
 * handler, so the screen applies each mutation's result optimistically.
 *
 * ZERO one-off component CSS: composed from flexa-ui; framing via `ks-*` +
 * `buyer.css`.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  FxBadge,
  FxButton,
  FxCard,
  FxConfirmationDialog,
  FxContextMenu,
  FxDialog,
  FxEmptyState,
  FxFieldGroup,
  FxIcon,
  FxInlineError,
  FxInput,
  FxList,
  FxSelect,
  FxSkeletonLoader,
  FxStatisticBlock,
  FxTable,
  FxTabs,
  formatStatusLabel,
  statusTone,
  useToast,
  type ListItem,
  type OptionItem,
  type TableColumn,
  type TabItem,
} from 'flexa-ui-kit';
import type {
  Collection,
  PaymentMethod,
  Wallet as WalletBalance,
  WalletTransaction,
} from 'flexa-ui-kit/mocks';
import { ADD_METHOD_BRANDS } from 'flexa-ui-kit/mocks';
import { api, ApiRequestError } from '../api';
import { formatDate, formatMoney } from './format';

/* ------------------------------------------------------------- add-method form */

const BRAND_OPTIONS: OptionItem[] = ADD_METHOD_BRANDS.map((b) => ({ value: b, label: b }));

interface AddForm {
  brand: string;
  last4: string;
  expiry: string;
}

const EMPTY_FORM: AddForm = { brand: ADD_METHOD_BRANDS[0], last4: '', expiry: '' };

/* -------------------------------------------------------------------- root */

export function Wallet() {
  const toast = useToast();
  const [methods, setMethods] = useState<PaymentMethod[] | null>(null);
  const [balance, setBalance] = useState<WalletBalance | null>(null);
  const [transactions, setTransactions] = useState<WalletTransaction[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ApiRequestError | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState<AddForm>(EMPTY_FORM);
  const [addBusy, setAddBusy] = useState(false);
  const [removeId, setRemoveId] = useState<string | null>(null);

  useEffect(() => {
    let live = true;
    setLoading(true);
    setError(null);
    (async () => {
      try {
        const [m, w] = await Promise.all([
          api.get<Collection<PaymentMethod>>('/v1/me/payment-methods'),
          api.get<WalletBalance>('/v1/wallet'),
        ]);
        if (!live) return;
        setMethods(m.data);
        setBalance(w);
        setLoading(false);
        void api
          .get<Collection<WalletTransaction>>('/v1/wallet/transactions')
          .then((t) => live && setTransactions(t.data))
          .catch(() => {});
      } catch (e) {
        if (!live) return;
        setError(e instanceof ApiRequestError ? e : new ApiRequestError(500, null));
        setLoading(false);
      }
    })();
    return () => {
      live = false;
    };
  }, [reloadKey]);

  const setDefault = useCallback(
    async (id: string) => {
      try {
        await api.patch<PaymentMethod>(`/v1/me/payment-methods/${id}`, { isDefault: true });
        setMethods((prev) => (prev ?? []).map((m) => ({ ...m, isDefault: m.id === id })));
        toast.show({ tone: 'success', title: 'Default updated' });
      } catch {
        toast.show({ tone: 'danger', title: 'Could not set default', description: 'Please try again.' });
      }
    },
    [toast],
  );

  const remove = useCallback(async () => {
    if (!removeId) return;
    try {
      await api.del(`/v1/me/payment-methods/${removeId}`);
      setMethods((prev) => (prev ?? []).filter((m) => m.id !== removeId));
      toast.show({ tone: 'success', title: 'Payment method removed' });
    } catch (e) {
      const code = e instanceof ApiRequestError ? e.body?.code : undefined;
      toast.show({
        tone: 'danger',
        title: 'Could not remove card',
        description:
          code === 'state_conflict'
            ? 'Set another card as default before removing this one.'
            : 'Please try again in a moment.',
      });
      throw e;
    } finally {
      setRemoveId(null);
    }
  }, [removeId, toast]);

  const submitAdd = useCallback(async () => {
    setAddBusy(true);
    try {
      const created = await api.post<PaymentMethod>('/v1/me/payment-methods', form);
      setMethods((prev) => [...(prev ?? []), created]);
      setAddOpen(false);
      setForm(EMPTY_FORM);
      toast.show({ tone: 'success', title: 'Payment method added' });
    } catch {
      toast.show({ tone: 'danger', title: 'Could not add card', description: 'Please try again.' });
    } finally {
      setAddBusy(false);
    }
  }, [form, toast]);

  const last4Valid = /^\d{4}$/.test(form.last4);
  const expiryValid = /^\d{2}\/\d{2}$/.test(form.expiry);

  /* --------------------------------------------------- methods tab body --- */

  const methodsBody = (() => {
    if ((methods ?? []).length === 0) {
      return (
        <FxEmptyState
          title="No saved payment methods"
          description="Add a card to check out faster next time."
          icon="card"
          actions={
            <FxButton variant="primary" onClick={() => setAddOpen(true)}>
              Add payment method
            </FxButton>
          }
        />
      );
    }
    const rows: ListItem[] = (methods ?? []).map((m) => ({
      key: m.id,
      title: `${m.brand} •••• ${m.last4}`,
      description: `Expires ${m.expiry}`,
      media: <FxIcon name="card" size={20} />,
      meta: (
        <span className="bx-method-meta">
          {m.isDefault && (
            <FxBadge tone="success" size="sm" appearance="subtle">
              Default
            </FxBadge>
          )}
          <FxContextMenu
            ariaLabel={`Actions for ${m.brand} ending ${m.last4}`}
            trigger={
              <FxButton variant="ghost" size="sm" aria-label="Card actions">
                <FxIcon name="more" size={20} />
              </FxButton>
            }
            items={[
              { id: 'default', label: 'Make default', icon: 'check', disabled: m.isDefault },
              { id: 'remove', label: 'Remove', icon: 'trash', tone: 'danger' },
            ]}
            onSelect={(item) => {
              if (item.id === 'default') void setDefault(m.id);
              if (item.id === 'remove') setRemoveId(m.id);
            }}
          />
        </span>
      ),
    }));
    return (
      <div className="ks-stack" style={{ ['--ks-gap' as string]: 'var(--fx-space-4)' }}>
        <FxList items={rows} divided aria-label="Saved payment methods" />
        <div className="ks-row">
          <FxButton variant="secondary" onClick={() => setAddOpen(true)}>
            Add payment method
          </FxButton>
        </div>
      </div>
    );
  })();

  /* --------------------------------------------------- activity tab body -- */

  const txColumns: TableColumn<WalletTransaction>[] = [
    { key: 'createdAt', header: 'Date', render: (t) => formatDate(t.createdAt) },
    { key: 'description', header: 'Description' },
    {
      key: 'amount',
      header: 'Amount',
      align: 'end',
      render: (t) => (
        <span className={t.amount.amount < 0 ? 'ks-muted' : undefined}>{formatMoney(t.amount)}</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (t) => (
        <FxBadge tone={statusTone(t.status, 'buyer-history')} appearance="subtle" size="sm">
          {formatStatusLabel(t.status)}
        </FxBadge>
      ),
    },
    {
      key: 'order',
      header: 'Order',
      render: (t) =>
        t.orderId ? (
          <a className="bx-link" href={`#/screens/orders/${t.orderId}`}>
            {t.orderNumber}
          </a>
        ) : (
          <span className="ks-muted">—</span>
        ),
    },
  ];

  const activityBody =
    transactions == null ? (
      <FxSkeletonLoader shape="rect" height="12rem" />
    ) : (
      <FxTable
        columns={txColumns}
        rows={transactions}
        rowKey={(t) => t.id}
        caption="Wallet activity"
        emptyState={
          <FxEmptyState title="No wallet activity yet" description="Charges and refunds appear here." icon="wallet" />
        }
      />
    );

  const tabs: TabItem[] = useMemo(
    () => [
      { id: 'methods', label: 'Payment methods', content: methodsBody },
      { id: 'activity', label: 'Wallet activity', content: activityBody },
    ],
    // methodsBody/activityBody rebuild each render — fine for the harness.
    [methodsBody, activityBody],
  );

  if (loading) {
    return (
      <div className="ks-screen">
        <FxSkeletonLoader shape="text" width="12rem" />
        <FxSkeletonLoader shape="rect" height="6rem" />
        <FxSkeletonLoader shape="rect" lines={3} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="ks-screen">
        <h1 className="ks-page-title">Wallet</h1>
        <FxInlineError
          message="We couldn't load your wallet."
          detail={error.body?.requestId}
          onRetry={() => setReloadKey((k) => k + 1)}
        />
      </div>
    );
  }

  return (
    <div className="ks-screen">
      <h1 className="ks-page-title">Wallet & payment methods</h1>

      <FxCard padding="lg">
        <FxStatisticBlock
          label="Wallet balance"
          value={balance ? formatMoney(balance.balance) : '—'}
          size="lg"
          caption="Credits from refunds are applied at checkout"
        />
      </FxCard>

      <FxTabs items={tabs} />

      {/* Add payment method (doc 08 §3.9 — provider-hosted fields in real life). */}
      <FxDialog
        open={addOpen}
        onOpenChange={(o) => {
          setAddOpen(o);
          if (!o) setForm(EMPTY_FORM);
        }}
        title="Add payment method"
        footer={
          <>
            <FxButton variant="secondary" onClick={() => setAddOpen(false)} disabled={addBusy}>
              Cancel
            </FxButton>
            <FxButton
              variant="primary"
              onClick={submitAdd}
              loading={addBusy}
              disabled={!last4Valid || !expiryValid}
            >
              Add card
            </FxButton>
          </>
        }
      >
        <div className="ks-stack" style={{ ['--ks-gap' as string]: 'var(--fx-space-4)' }}>
          <FxFieldGroup label="Card brand">
            <FxSelect
              options={BRAND_OPTIONS}
              value={form.brand}
              onChange={(v) => v && setForm((f) => ({ ...f, brand: v }))}
            />
          </FxFieldGroup>
          <FxFieldGroup label="Last 4 digits" help="For display only — the mock never stores card data.">
            <FxInput
              value={form.last4}
              onChange={(v) => setForm((f) => ({ ...f, last4: v.replace(/\D/g, '').slice(0, 4) }))}
              placeholder="4242"
              inputMode="numeric"
            />
          </FxFieldGroup>
          <FxFieldGroup label="Expiry (MM/YY)">
            <FxInput
              value={form.expiry}
              onChange={(v) => setForm((f) => ({ ...f, expiry: v.slice(0, 5) }))}
              placeholder="08/28"
            />
          </FxFieldGroup>
        </div>
      </FxDialog>

      {/* Remove confirmation (doc 08 §3.9 — Confirmation Dialog). */}
      <FxConfirmationDialog
        open={removeId != null}
        onOpenChange={(o) => !o && setRemoveId(null)}
        tone="danger"
        title="Remove this payment method?"
        description="You can add it again later. This won't affect any active orders."
        confirmLabel="Remove card"
        onConfirm={remove}
      />
    </div>
  );
}
