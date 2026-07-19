/**
 * U13-D admin-track routes + index links (doc 15 §4 — Admin Dashboard §3.17,
 * Listings Moderation §2.14, Disputes Queue §2.12, Dispute Detail §2.13).
 * OWNED by the admin track (doc 15 §5): only this track edits this file and
 * this directory. Mounted at `/screens/admin/*` — route paths are relative.
 *
 * GAPS (doc 15 §6 — closest component + what we did instead):
 *  • Data Management Toolbar — has no `tabs` region, so the Listings Moderation
 *    "Pending / Reported / All" Tabs (doc 08 §2.14) aren't rendered; the queue
 *    shows pending-first ordering with decided items appended, plus a header
 *    pending-count Badge. Reported-review moderation is out of this track's
 *    fixtures (no review-report shape in the shared mock).
 *  • Right Drawer for review (doc 08 §2.14 wireframe) — used Split View instead
 *    (a persistent right pane, which the §2.14 Desktop/Wide delta itself calls
 *    for). Split View has no "queue-walk J/K next/prev" affordance, so keyboard
 *    queue momentum (doc 08 §2.14 interaction 2) isn't wired.
 *  • Confirmation Dialog — has no `confirmDisabled` prop and takes no children,
 *    so the Partial-refund flow (amount input + split preview + gated confirm,
 *    doc 08 §2.13 interaction 1) uses FxDialog with a manually-disabled confirm
 *    button; full refund / release still use Confirmation Dialog.
 *  • Escrow Timeline — `perspective="admin"` renders the stages but exposes no
 *    admin resolve actions inline; the resolution Card owns those buttons
 *    instead (matches the §2.13 wireframe's separate Resolution region).
 *  • Audit Log vs. Audit Timeline — the dashboard "recent activity" uses Audit
 *    Timeline (compact, entity-agnostic); a full sortable Audit Log table
 *    wasn't needed for this track's screens.
 */
import { Route, Routes } from 'react-router-dom';
import type { ScreenLink } from '../shared';
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
    </Routes>
  );
}
