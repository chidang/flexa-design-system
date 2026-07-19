/**
 * U13-D admin-track routes + index links (doc 15 §4 — Admin Dashboard §3.17,
 * Listings Moderation §2.14, Disputes Queue §2.12, Dispute Detail §2.13).
 * OWNED by the admin track (doc 15 §5): only this track edits this file and
 * this directory. Mounted at `/screens/admin/*` — route paths are relative.
 *
 * GAPS (doc 15 §6 — closest component + what we did instead):
 *  • Data Management Toolbar `tabs` region — CLOSED by P-E2 (G5): the toolbar
 *    grew a `tabs` slot and Listings Moderation renders Pending / All view
 *    tabs in it. Reported-review moderation stays out — no review-report shape
 *    exists in the shared fixtures.
 *  • Split View queue-walk — CLOSED by P-E2 (G6): `onQueuePrev`/`onQueueNext`
 *    add J/K keyboard momentum + a visible Previous/Next pair; Listings
 *    Moderation walks its queue with them (doc 08 §2.14 interaction 2).
 *  • Confirmation Dialog — CLOSED by P-E2 (G7): `confirmDisabled` + children
 *    landed; the Partial-refund flow (amount input + split preview + gated
 *    confirm, doc 08 §2.13 interaction 1) now uses Confirmation Dialog.
 *  • Escrow Timeline inline admin actions — CLOSED by P-E2 (G8): `stageActions`
 *    slot replaces the derived (previously inert) admin buttons; Dispute Detail
 *    renders its real resolve actions inline on the disputed stage. The
 *    separate Resolution region is KEPT — the mandatory rationale reads better
 *    next to its own action row (§2.13 wireframe).
 *  • Audit Log vs. Audit Timeline — the dashboard "recent activity" uses Audit
 *    Timeline (compact, entity-agnostic); a full sortable Audit Log table
 *    wasn't needed for this track's screens.
 */
import { Route, Routes } from 'react-router-dom';
import { ScreenNotFound, type ScreenLink } from '../shared';
import { AdminDashboard } from './AdminDashboard';
import { ListingsModeration } from './ListingsModeration';
import { DisputesQueue } from './DisputesQueue';
import { DisputeDetail } from './DisputeDetail';
import './admin.css';

export const adminLinks: ScreenLink[] = [
  { to: '/screens/admin', title: 'Admin Dashboard', doc: '08 §3.17', blurb: 'Queue-depth stat cards, SLA alerts, recent audit tail.' },
  { to: '/screens/admin/moderation', title: 'Listings Moderation', doc: '08 §2.14', blurb: 'Toolbar + queue table; approve / reject with reason (flow A1).' },
  { to: '/screens/admin/disputes', title: 'Disputes Queue', doc: '08 §2.12', blurb: 'SLA countdown, priority sort, KPI metric cards.' },
];

export function AdminRoutes() {
  return (
    <Routes>
      <Route index element={<AdminDashboard />} />
      <Route path="moderation" element={<ListingsModeration />} />
      <Route path="disputes" element={<DisputesQueue />} />
      <Route path="disputes/:id" element={<DisputeDetail />} />
      <Route path="*" element={<ScreenNotFound />} />
    </Routes>
  );
}
