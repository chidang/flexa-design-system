/**
 * U13-D Admin Dashboard (doc 08 §3.17) — platform health at a glance. Read-only
 * screen: every action navigates. Composes flexa-ui end to end against the MSW
 * mock backend (`GET /v1/admin/dashboard`): a Metric Card row of queue depths
 * (open disputes derived from the SHARED `db.orders` at escrow stage `disputed`;
 * moderation backlog from the shared `moderation.ts` store), queue Quick Links
 * with count Badges, and a Recent Activity Audit Timeline tail.
 *
 * ZERO one-off component CSS: every visual is a flexa-ui component; page framing
 * is `ks-*` (shared) + `ks-admin-*` (this track's admin.css).
 */
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FxAlert,
  FxAuditTimeline,
  FxBadge,
  FxButton,
  FxInlineError,
  FxMetricCard,
  FxRoleBadge,
  FxSkeletonLoader,
  type AuditEntry,
} from 'flexa-ui-kit';
import type { AdminAuditEntry } from 'flexa-ui-kit/mocks';
import { api, ApiRequestError } from '../api';

interface DashboardData {
  stats: {
    openDisputes: number;
    moderationBacklog: number;
    slaOverdue: number;
    auditToday: number;
  };
  recentAudit: AdminAuditEntry[];
}

/** mock audit entry → flexa-ui AuditEntry (structurally identical; cast keeps
 * the actor.kind union honest). */
function toAuditEntries(items: AdminAuditEntry[]): AuditEntry[] {
  return items.map((e) => ({ ...e, actor: { ...e.actor } }));
}

export function AdminDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ApiRequestError | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let live = true;
    setLoading(true);
    setError(null);
    api
      .get<DashboardData>('/v1/admin/dashboard')
      .then((d) => live && (setData(d), setLoading(false)))
      .catch((e) => {
        if (!live) return;
        setError(e instanceof ApiRequestError ? e : new ApiRequestError(500, null));
        setLoading(false);
      });
    return () => {
      live = false;
    };
  }, [reloadKey]);

  if (error) {
    return (
      <div className="ks-screen">
        <h1 className="ks-page-title">Admin</h1>
        <FxInlineError
          message="Couldn't load the dashboard."
          retryLabel="Retry"
          onRetry={() => setReloadKey((k) => k + 1)}
        />
      </div>
    );
  }

  return (
    <div className="ks-screen">
      <div className="ks-row ks-row-between">
        <div className="ks-stack" style={{ ['--ks-gap' as string]: 'var(--fx-space-1)' }}>
          <h1 className="ks-page-title">Admin</h1>
          <span className="ks-muted">Platform health at a glance.</span>
        </div>
        <FxRoleBadge role="admin" />
      </div>

      {/* KPI row. */}
      <div className="ks-admin-stats">
        {loading || !data ? (
          <>
            <FxMetricCard label="Open disputes" value="" loading />
            <FxMetricCard label="Moderation backlog" value="" loading />
            <FxMetricCard label="SLA overdue" value="" loading />
            <FxMetricCard label="Audit entries" value="" loading />
          </>
        ) : (
          <>
            <FxMetricCard
              label="Open disputes"
              value={data.stats.openDisputes}
              href="#/screens/admin/disputes"
              caption="Escrow stage disputed"
            />
            <FxMetricCard
              label="Moderation backlog"
              value={data.stats.moderationBacklog}
              href="#/screens/admin/moderation"
              caption="Listings pending review"
            />
            <FxMetricCard
              label="SLA overdue"
              value={data.stats.slaOverdue}
              href="#/screens/admin/disputes"
              caption="Past first-decision deadline"
            />
            <FxMetricCard label="Audit entries" value={data.stats.auditToday} caption="This session" />
          </>
        )}
      </div>

      {data && data.stats.slaOverdue > 0 && (
        <FxAlert
          tone="warning"
          title="Disputes are breaching SLA"
          description={`${data.stats.slaOverdue} dispute(s) are past their first-decision deadline. Resolve the oldest first.`}
          actions={
            <Link to="/screens/admin/disputes">
              <FxButton variant="secondary" size="sm">
                Open disputes queue
              </FxButton>
            </Link>
          }
        />
      )}

      {/* Queue quick links. */}
      <section className="ks-stack" style={{ ['--ks-gap' as string]: 'var(--fx-space-3)' }} aria-label="Queues">
        <h2 className="ks-page-title" style={{ fontSize: '1.1rem' }}>
          Queues
        </h2>
        <div className="ks-admin-links">
          <Link to="/screens/admin/disputes" className="ks-screen-link">
            <span className="ks-screen-link-doc">08 §2.12</span>
            <strong>
              Disputes Queue{' '}
              {data && <FxBadge tone={data.stats.openDisputes > 0 ? 'danger' : 'neutral'} count={data.stats.openDisputes} />}
            </strong>
            <span className="ks-muted">Triage by SLA urgency and resolve.</span>
          </Link>
          <Link to="/screens/admin/moderation" className="ks-screen-link">
            <span className="ks-screen-link-doc">08 §2.14</span>
            <strong>
              Listings Moderation{' '}
              {data && <FxBadge tone={data.stats.moderationBacklog > 0 ? 'warning' : 'neutral'} count={data.stats.moderationBacklog} />}
            </strong>
            <span className="ks-muted">Approve or reject pending listings.</span>
          </Link>
        </div>
      </section>

      {/* Recent activity — Audit Timeline tail. */}
      <section className="ks-stack" style={{ ['--ks-gap' as string]: 'var(--fx-space-3)' }} aria-label="Recent activity">
        <h2 className="ks-page-title" style={{ fontSize: '1.1rem' }}>
          Recent activity
        </h2>
        {loading || !data ? (
          <FxSkeletonLoader shape="rect" lines={4} />
        ) : (
          <FxAuditTimeline entries={toAuditEntries(data.recentAudit)} />
        )}
      </section>
    </div>
  );
}
