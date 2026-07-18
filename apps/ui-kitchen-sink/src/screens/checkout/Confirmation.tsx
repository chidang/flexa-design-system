/**
 * Confirmation (`/screens/checkout/confirmation`). The terminal FxSuccessPage
 * with an FxPaymentStatus (`held`) recap, a link per created order to its detail
 * screen, and a "Go to your orders" primary action. Reached only after a
 * successful POST /v1/orders; a direct visit with no orders bounces to the cart.
 */
import { Link, Navigate } from 'react-router-dom';
import { FxSuccessPage, FxPaymentStatus, FxButton, FxDescriptionList } from 'flexa-ui-kit';
import type { Order } from 'flexa-ui-kit/mocks';
import { money } from './shared';

export interface ConfirmationProps {
  orders: Order[] | null;
}

export function Confirmation({ orders }: ConfirmationProps) {
  if (orders === null || orders.length === 0) {
    return <Navigate to="/screens/checkout/cart" replace />;
  }

  const total = orders.reduce((n, o) => n + o.total.amount, 0);
  const currency = orders[0]!.total.currency;

  return (
    <div className="ks-screen">
      <FxSuccessPage
        title="Payment held in escrow"
        description={`We created ${orders.length} order${orders.length === 1 ? '' : 's'} and are holding your payment until you approve delivery.`}
        summary={
          <div className="ks-stack" style={{ ['--ks-gap' as string]: 'var(--fx-space-4)' }}>
            <FxPaymentStatus
              payment={{ id: 'confirmation', status: 'held', amount: { amount: total, currency } }}
              showMethod={false}
            />
            <FxDescriptionList
              items={orders.map((o) => ({
                term: o.sellerName,
                detail: (
                  <span className="ks-row" style={{ ['--ks-gap' as string]: 'var(--fx-space-3)' }}>
                    <Link to={`/screens/orders/${o.id}`}>{o.number}</Link>
                    <span className="ks-muted">{money(o.total)}</span>
                  </span>
                ),
              }))}
              layout="horizontal"
              divided
            />
          </div>
        }
        actions={
          <Link to="/screens/orders">
            <FxButton variant="primary">Go to your orders</FxButton>
          </Link>
        }
      />
    </div>
  );
}
