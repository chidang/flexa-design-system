/**
 * FxOrderCard — one order in a buyer's or seller's order list (doc 04
 * §2 "FxOrderCard — Order Card").
 *
 * Composes FxCard chrome: a header (order-number link + placed date + status
 * Badge), an item-thumbnail row with a "+N" overflow, and a footer (total +
 * one primary action whose label follows the order status). The status Badge
 * always renders its text via `statusTone` + `formatStatusLabel` (§5), so the
 * colour is never used alone. Counterparty (seller for a buyer, buyer for a
 * seller) shows as an Avatar + name.
 *
 * Primary action by status (default):
 *   created            → Pay
 *   paid, in_fulfilment→ Track   (seller: Fulfil)
 *   delivered, completed→ Review (seller: View)
 *   else               → View
 * The chosen action id is passed to `onAction`.
 *
 * `actions` (ui-kit doc 14 §11 G1/G3, additive) replaces the mapped default
 * with host-provided footer content, so a stage-specific shortcut ("Approve" on
 * a delivered row, "Write a review" on a completed one) can render inline.
 * When the prop is absent the footer is byte-identical to the mapped default.
 */
import type { ReactNode } from 'react';
import type { OrderStatus, Tone } from '../enums';
import type { Money } from '../currency-input/currency-input';
import { statusTone, formatStatusLabel } from '../status-tone';
import { FxCard } from '../card/card';
import { FxBadge } from '../badge/badge';
import { FxAvatar } from '../avatar/avatar';
import { FxButton } from '../button/button';

/** A counterparty reference (buyer or seller). */
export interface PartyRef {
  id: string;
  name: string;
  avatarSrc?: string;
  href?: string;
}

/** The order shown in the card. */
export interface OrderSummary {
  id: string;
  /** Human order number, e.g. `#1042`. */
  number: string;
  /** Order detail link target. */
  href: string;
  status: OrderStatus;
  total: Money;
  /** ISO / display date the order was placed. */
  placedAt: string;
  /** Total item count (may exceed the previewed thumbnails). */
  itemCount: number;
  items: { id: string; title: string; imageUrl?: string; quantity: number }[];
  buyer?: PartyRef;
  seller?: PartyRef;
}

export type OrderPerspective = 'buyer' | 'seller';

/** The resolved primary action for a status × perspective. */
interface OrderAction {
  id: string;
  label: string;
}

/** Baked-in strings — every one a prop (§i18n). */
export interface OrderCardLabels {
  pay: string;
  track: string;
  review: string;
  view: string;
  fulfil: string;
  placedOn: string;
  itemsOverflow: (n: number) => string;
}

const DEFAULT_LABELS: OrderCardLabels = {
  pay: 'Pay',
  track: 'Track',
  review: 'Review',
  view: 'View',
  fulfil: 'Fulfil',
  placedOn: 'Placed',
  itemsOverflow: (n) => `+${n}`,
};

export interface FxOrderCardProps {
  order: OrderSummary;
  /** Which side is viewing — flips the action set + counterparty. Defaults to `buyer`. */
  perspective?: OrderPerspective;
  /** Fired with the resolved action id and the order. */
  onAction?: (action: string, order: OrderSummary) => void;
  /**
   * Overrides the status-derived footer action with host content (G1) — e.g. an
   * inline "Approve" shortcut on a delivered row, or a "Write a review" CTA on
   * a reviewable order (G3). The mapped default (and `onAction`) is skipped.
   */
  actions?: ReactNode;
  /** Baked-in strings. Merged over the English defaults. */
  labels?: Partial<OrderCardLabels>;
  /** Locale for Money formatting. Defaults to the runtime env locale. */
  locale?: string;
  className?: string;
}

/** Format a `Money` value into a locale-aware currency string (§1.8). */
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

/** The primary footer action for a status × perspective (documented mapping). */
function primaryAction(
  status: OrderStatus,
  perspective: OrderPerspective,
  l: OrderCardLabels,
): OrderAction {
  if (status === 'created') return { id: 'pay', label: l.pay };
  if (status === 'paid' || status === 'in_fulfilment') {
    return perspective === 'seller' ? { id: 'fulfil', label: l.fulfil } : { id: 'track', label: l.track };
  }
  if (status === 'delivered' || status === 'completed') {
    return perspective === 'seller' ? { id: 'view', label: l.view } : { id: 'review', label: l.review };
  }
  return { id: 'view', label: l.view };
}

/** How many thumbnails to preview before collapsing into a "+N" chip. */
const MAX_THUMBS = 4;

export function FxOrderCard({
  order,
  perspective = 'buyer',
  onAction,
  actions,
  labels,
  locale,
  className,
}: FxOrderCardProps) {
  const l = { ...DEFAULT_LABELS, ...labels };
  const cardClass = ['fx-order-card', className].filter(Boolean).join(' ');
  const tone: Tone = statusTone(order.status, perspective === 'buyer' ? 'buyer-history' : 'default');
  const statusText = formatStatusLabel(order.status);
  const action = primaryAction(order.status, perspective, l);
  const counterparty = perspective === 'buyer' ? order.seller : order.buyer;

  const shown = order.items.slice(0, MAX_THUMBS);
  const overflow = order.itemCount - shown.length;

  const header = (
    <div className="fx-order-card-header">
      <div className="fx-order-card-headline">
        <a className="fx-order-card-number" href={order.href}>
          {order.number}
        </a>
        <span className="fx-order-card-date">
          {l.placedOn} {order.placedAt}
        </span>
      </div>
      <FxBadge tone={tone} appearance="subtle" dot>
        {statusText}
      </FxBadge>
    </div>
  );

  const footer = (
    <div className="fx-order-card-footer">
      <div className="fx-order-card-total">{formatMoney(order.total, locale)}</div>
      {actions ?? (
        <FxButton
          variant={action.id === 'pay' ? 'primary' : 'secondary'}
          size="sm"
          onClick={() => onAction?.(action.id, order)}
        >
          {action.label}
        </FxButton>
      )}
    </div>
  );

  return (
    <FxCard className={cardClass} padding="md" footer={footer}>
      {header}

      <div className="fx-order-card-thumbs">
        {shown.map((item) => (
          <span key={item.id} className="fx-order-card-thumb">
            {item.imageUrl != null ? (
              <img src={item.imageUrl} alt={item.title} />
            ) : (
              <span className="fx-order-card-thumb-fallback" aria-hidden="true" />
            )}
          </span>
        ))}
        {overflow > 0 && (
          <span className="fx-order-card-thumb-more">{l.itemsOverflow(overflow)}</span>
        )}
      </div>

      {counterparty != null && (
        <div className="fx-order-card-party">
          <FxAvatar size="sm" src={counterparty.avatarSrc} name={counterparty.name} alt={counterparty.name} />
          {counterparty.href != null ? (
            <a className="fx-order-card-party-name" href={counterparty.href}>
              {counterparty.name}
            </a>
          ) : (
            <span className="fx-order-card-party-name">{counterparty.name}</span>
          )}
        </div>
      )}
    </FxCard>
  );
}
