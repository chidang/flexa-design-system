/**
 * U13-C seller-track routes + index links (doc 15 §4 — Seller Dashboard §2.8,
 * Listings §3.12, Listing Editor §2.9, Order fulfil §2.10, Earnings §2.11).
 * OWNED by the seller track (doc 15 §5): only this track edits this file and
 * this directory. Mounted at `/screens/seller/*` — route paths are relative.
 *
 * GAPS (component-gap protocol, doc 15 §6):
 *   1. Approved-listing → search ripple. The seller Listing Editor submits into
 *      the shared moderation store, and the admin track approves it there, but
 *      the CORE `/v1/search` handler reads the static SEARCH_CARDS array and
 *      cannot see in-session approvals without editing `handlers.core.ts`
 *      (forbidden — doc 15 §5). `handlers.seller.ts` exposes
 *      `sellerApprovedSearchCards()` / `recordApprovedListing()` /
 *      `searchCardForListing()` as an append seam. CLOSED by U13-Z: the core
 *      search handler now derives approved cards straight from the moderation
 *      store (`approvedModerationCards` in handlers.core.ts), so the seam
 *      functions above are unused-but-kept for third-party composition.
 *   2. FxImageGalleryUpload needs real File objects (upload/reorder/cover). The
 *      Listing Editor media step uses a Description Textarea + a placeholder
 *      cover in the live preview instead, so fixtures stay deterministic (no
 *      binary assets). CLOSEST used: FxTextarea + FxAlert; the gallery upload is
 *      noted for a future media-backed harness.
 *   3. Order fulfil "Respond to dispute" links back to this order rather than a
 *      seller dispute evidence view (that lives in the Admin track's Dispute
 *      Detail, §2.13). CLOSEST: an FxAlert with a link; the seller evidence pane
 *      is out of this track's ownership.
 *   4. Seller Orders list (§3.13) is a support screen, not a headline in the
 *      track table; it renders the dashboard's recentOrders (≤5). A dedicated
 *      seller-orders endpoint with pagination/filters is deferred.
 */
import { Route, Routes } from 'react-router-dom';
import type { ScreenLink } from '../shared';
import { SellerDashboard } from './SellerDashboard';
import { SellerListings } from './SellerListings';
import { ListingEditor } from './ListingEditor';
import { SellerOrders } from './SellerOrders';
import { SellerOrderDetail } from './SellerOrderDetail';
import { SellerEarnings } from './SellerEarnings';
import './seller.css';

export const sellerLinks: ScreenLink[] = [
  { to: '/screens/seller', title: 'Seller Dashboard', doc: '08 §2.8', blurb: 'Attention items, metric cards, sales trend, recent orders.' },
  { to: '/screens/seller/listings', title: 'Listings', doc: '08 §3.12', blurb: 'Owner listing cards, status tabs, moderation feedback.' },
  { to: '/screens/seller/listings/new', title: 'Listing Editor', doc: '08 §2.9', blurb: 'Create wizard: details → media → pricing → review.' },
  { to: '/screens/seller/earnings', title: 'Earnings & Payouts', doc: '08 §2.11', blurb: 'Balances, transactions ledger, payout history, withdraw.' },
];

export function SellerRoutes() {
  return (
    <Routes>
      <Route index element={<SellerDashboard />} />
      <Route path="listings" element={<SellerListings />} />
      <Route path="listings/new" element={<ListingEditor />} />
      <Route path="listings/:id/edit" element={<ListingEditor />} />
      <Route path="orders" element={<SellerOrders />} />
      <Route path="orders/:id" element={<SellerOrderDetail />} />
      <Route path="earnings" element={<SellerEarnings />} />
    </Routes>
  );
}
