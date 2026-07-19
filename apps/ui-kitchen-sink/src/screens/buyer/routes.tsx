/**
 * U13-B buyer-track routes + index links (doc 15 §4 — Buyer Dashboard §2.6,
 * Orders List §3.6, Notifications §3.7, Wallet §3.9, Reviews §3.8). OWNED by
 * the buyer track (doc 15 §5): only this track edits this file and this
 * directory. Mounted at `/screens/buyer/*` — route paths here are relative.
 *
 * GAPS (doc 15 §6 — closest component used, never a CSS patch/fork):
 *  1. FxOrderCard — no per-row action slot for a stage-specific "Approve"
 *     shortcut. Its buyer action for a `delivered` order is the documented
 *     "Review" (status × perspective mapping), so the inline Approve shortcut
 *     doc 08 §3.6 asks for cannot be surfaced without a fork. Used instead: the
 *     card navigates to Order Detail (§2.5), which owns the Approve flow.
 *  2. Notifications — there is no full-page "Notification Center list" component
 *     (FxNotificationCenter is the App-Shell bell popover per doc 08 §3.7). Used
 *     instead: FxList rows (tone Badge + unread dot + time) grouped by day under
 *     FxTabs — the documented full-screen composition.
 *  3. Reviews "To review" — no dedicated "reviewable order" card (doc 08 §3.8
 *     asks for an "Order Card slim + Write a review button"). FxOrderCard's
 *     footer action is the fixed status action, not a "Write a review" CTA for a
 *     reviewable order. Used instead: FxCard with a thumbnail + title + a
 *     primary Write-a-review button.
 */
import { Route, Routes } from 'react-router-dom';
import type { ScreenLink } from '../shared';
import { BuyerDashboard } from './BuyerDashboard';
import { OrdersList } from './OrdersList';
import { Notifications } from './Notifications';
import { Wallet } from './Wallet';
import { Reviews } from './Reviews';
import './buyer.css';

export const buyerLinks: ScreenLink[] = [
  {
    to: '/screens/buyer',
    title: 'Buyer Dashboard',
    doc: '08 §2.6',
    blurb: 'Attention alerts, escrow metrics, recent orders, activity & quick links.',
  },
  {
    to: '/screens/buyer/orders',
    title: 'Orders List',
    doc: '08 §3.6',
    blurb: 'Filter by escrow stage, search, open an order (buyer view).',
  },
  {
    to: '/screens/buyer/notifications',
    title: 'Notifications',
    doc: '08 §3.7',
    blurb: 'Full-page center: day groups, tabs, mark-read, deep-links.',
  },
  {
    to: '/screens/buyer/wallet',
    title: 'Wallet & Payment Methods',
    doc: '08 §3.9',
    blurb: 'Balance, add/remove/default cards, wallet activity ledger.',
  },
  {
    to: '/screens/buyer/reviews',
    title: 'Reviews (write / manage)',
    doc: '08 §3.8',
    blurb: 'Review completed orders (flow B4); edit & delete your reviews.',
  },
];

export function BuyerRoutes() {
  return (
    <Routes>
      <Route index element={<BuyerDashboard />} />
      <Route path="orders" element={<OrdersList />} />
      <Route path="notifications" element={<Notifications />} />
      <Route path="wallet" element={<Wallet />} />
      <Route path="reviews" element={<Reviews />} />
    </Routes>
  );
}
