/**
 * Step 1 — Cart. Lines grouped by seller with an FxStepper for quantity and a
 * remove affordance; empty cart hands off to the FxBlankStateLayout in the
 * orchestrator. Editing recomputes totals server-side (PATCH/DELETE return the
 * fresh Cart), which the orchestrator threads back into the rail.
 */
import { FxCartSummary, FxSkeletonLoader } from 'flexa-ui-kit';
import type { Cart } from 'flexa-ui-kit/mocks';

export interface CartStepProps {
  cart: Cart | null;
  busy: boolean;
  onQuantityChange: (itemId: string, quantity: number) => void;
  onRemove: (itemId: string) => void;
}

export function CartStep({ cart, busy, onQuantityChange, onRemove }: CartStepProps) {
  if (cart === null) {
    return (
      <div className="ks-stack" aria-busy="true">
        <FxSkeletonLoader shape="text" width="40%" />
        <FxSkeletonLoader lines={4} />
        <FxSkeletonLoader lines={3} />
      </div>
    );
  }

  return (
    <div className="ks-stack" style={{ ['--ks-gap' as string]: 'var(--fx-space-5)' }} aria-busy={busy || undefined}>
      {cart.groups.map((group) => (
        <section
          key={group.sellerId}
          className="ks-stack"
          style={{ ['--ks-gap' as string]: 'var(--fx-space-3)' }}
        >
          <div className="ks-row ks-row-between">
            <strong>{group.sellerName}</strong>
          </div>
          <FxCartSummary
            items={group.items.map((it) => ({
              id: it.id,
              listingId: it.listingId,
              title: it.title,
              imageUrl: it.coverUrl,
              quantity: it.quantity,
              unitPrice: it.unitPrice,
              lineTotal: it.lineTotal,
            }))}
            totals={{ subtotal: group.subtotal, total: group.subtotal }}
            onQuantityChange={onQuantityChange}
            onRemove={onRemove}
          />
        </section>
      ))}
    </div>
  );
}
