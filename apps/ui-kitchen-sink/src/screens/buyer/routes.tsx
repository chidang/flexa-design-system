/**
 * U13-B buyer-track routes + index links (doc 15 §4 — Buyer Dashboard §2.6,
 * Orders List §3.6, Notifications §3.7, Wallet §3.9, Reviews §3.8). OWNED by
 * the buyer track (doc 15 §5): only this track edits this file and this
 * directory. Mounted at `/screens/buyer/*` — route paths here are relative.
 *
 * GAPS (doc 15 §6 protocol) — ALL CLOSED by P-E1 (ui-kit doc 16 §1, doc 14 §11):
 *  1. G1 CLOSED — FxOrderCard grew an `actions` slot; OrdersList surfaces the
 *     §3.6 inline "Approve" shortcut on delivered rows (shared §2.5 dialog).
 *  2. G2 CLOSED — new FxNotificationList (day-group headings + tone-icon rows,
 *     shared NotificationItem shape); Notifications composes it under FxTabs.
 *  3. G3 CLOSED — the §3.8 reviewable-order card is FxOrderCard with a
 *     "Write a review" CTA in the G1 `actions` slot (doc 14 §11's resolution).
 */
import { Route, Routes } from 'react-router-dom';
import { ScreenNotFound, type ScreenLink } from '../shared';
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
      <Route path="*" element={<ScreenNotFound />} />
    </Routes>
  );
}
