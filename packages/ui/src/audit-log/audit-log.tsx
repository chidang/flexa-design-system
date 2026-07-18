'use client';
/**
 * FxAuditLog — read-only, immutable audit trail (doc 04 §3.8 "FxAuditLog —
 * Audit Log").
 *
 * An FxTable specialization: columns are time (absolute UTC + a relative
 * FxTooltip), actor (Avatar + name / "System" / an API-key name), an action-code
 * Tag, a target link, an IP, and a details expander that opens an FxRightDrawer
 * listing each change as before → after. By contract the log is immutable: there
 * are NO edit/delete affordances ever — only viewing and (host-driven) export.
 *
 * Pagination + sort are server-driven: the component passes those props straight
 * through to FxTable. The drawer only mounts client-side (it is a portal gated by
 * FxRightDrawer's own SSR guard) and opens from a per-row button, so the static
 * a11y snapshot carries no drawer markup. Every user-facing string is a prop.
 */
import { useState } from 'react';
import type { ReactNode } from 'react';
import { FxTable, type TableColumn, type TableSort, type Key } from '../table/table';
import { FxTag } from '../tag/tag';
import { FxAvatar } from '../avatar/avatar';
import { FxTooltip } from '../tooltip/tooltip';
import { FxRightDrawer } from '../right-drawer/right-drawer';
import { FxIcon } from '../icon/FxIcon';

/** Who performed the action. */
export interface AuditActor {
  kind: 'user' | 'system' | 'api';
  id?: string;
  name: string;
}

/** A single field change captured on an entry. */
export interface AuditChange {
  field: string;
  before: unknown;
  after: unknown;
}

/** One immutable audit entry. */
export interface AuditEntry {
  id: string;
  /** ISO 8601 timestamp (host passes UTC). */
  at: string;
  actor: AuditActor;
  /** Dot verb-noun action code, e.g. `listing.updated` (doc 09). */
  action: string;
  target?: { kind: string; id: string; label: string; href?: string };
  ip?: string;
  changes?: AuditChange[];
}

/** Which columns to render (all shown by default, in this order). */
export type AuditColumnKey = 'time' | 'actor' | 'action' | 'target' | 'ip' | 'details';

/** Baked-in strings — every one a prop (§i18n). */
export interface AuditLogLabels {
  caption: string;
  colTime: string;
  colActor: string;
  colAction: string;
  colTarget: string;
  colIp: string;
  colDetails: string;
  system: string;
  apiKey: string;
  viewDetails: string;
  drawerTitle: string;
  before: string;
  after: string;
  noChanges: string;
  empty: string;
}

export const DEFAULT_AUDIT_LOG_LABELS: AuditLogLabels = {
  caption: 'Audit log',
  colTime: 'Time',
  colActor: 'Actor',
  colAction: 'Action',
  colTarget: 'Target',
  colIp: 'IP',
  colDetails: 'Details',
  system: 'System',
  apiKey: 'API key',
  viewDetails: 'View change details',
  drawerTitle: 'Change details',
  before: 'Before',
  after: 'After',
  noChanges: 'No field changes were recorded for this entry.',
  empty: 'No audit entries.',
};

export interface FxAuditLogProps {
  entries: AuditEntry[];
  /** Column subset to render (defaults to all six, in canonical order). */
  columns?: AuditColumnKey[];
  /** Controlled server-driven sort (§1.5), passed through to FxTable. */
  sort?: TableSort | null;
  /** Sort-change handler (server refetches). */
  onSortChange?: (sort: TableSort | null) => void;
  /** Loading state (skeleton / overlay), passed through to FxTable. */
  loading?: boolean;
  /** Pagination slot (FxPagination), passed through to FxTable. */
  pagination?: ReactNode;
  /** Fired when a row's details drawer opens. */
  onEntryOpen?: (entry: AuditEntry) => void;
  /** BCP-47 locale for time formatting. */
  locale?: string;
  /** Baked-in strings. Merged over the English defaults. */
  labels?: Partial<AuditLogLabels>;
  className?: string;
}

/** Absolute UTC display string ("2026-07-17 09:10 UTC"). */
function absoluteUtc(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())} UTC`;
}

/** Plain relative-time label for the tooltip ("2h ago", "3d ago", or a date). */
function relative(iso: string, locale?: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return iso;
  const sec = Math.round((Date.now() - then) / 1000);
  const abs = Math.abs(sec);
  const rtf =
    typeof Intl !== 'undefined' && 'RelativeTimeFormat' in Intl
      ? new Intl.RelativeTimeFormat(locale, { numeric: 'auto', style: 'short' })
      : null;
  const fmt = (v: number, unit: Intl.RelativeTimeFormatUnit) => (rtf ? rtf.format(v, unit) : `${v} ${unit}`);
  const sign = sec >= 0 ? -1 : 1;
  if (abs < 60) return fmt(sign * abs, 'second');
  if (abs < 3600) return fmt(sign * Math.round(abs / 60), 'minute');
  if (abs < 86400) return fmt(sign * Math.round(abs / 3600), 'hour');
  return fmt(sign * Math.round(abs / 86400), 'day');
}

/** Render an unknown change value as a compact, escaped string. */
function renderValue(v: unknown): string {
  if (v === null || v === undefined) return '—';
  if (typeof v === 'string') return v;
  if (typeof v === 'number' || typeof v === 'boolean') return String(v);
  try {
    return JSON.stringify(v);
  } catch {
    return String(v);
  }
}

const DEFAULT_COLUMNS: AuditColumnKey[] = ['time', 'actor', 'action', 'target', 'ip', 'details'];

export function FxAuditLog({
  entries,
  columns = DEFAULT_COLUMNS,
  sort,
  onSortChange,
  loading = false,
  pagination,
  onEntryOpen,
  locale,
  labels,
  className,
}: FxAuditLogProps) {
  const l = { ...DEFAULT_AUDIT_LOG_LABELS, ...labels };
  const [openEntry, setOpenEntry] = useState<AuditEntry | null>(null);

  const openDetails = (entry: AuditEntry) => {
    setOpenEntry(entry);
    onEntryOpen?.(entry);
  };

  const actorName = (a: AuditActor): string =>
    a.kind === 'system' ? l.system : a.kind === 'api' ? a.name || l.apiKey : a.name;

  const allColumns: Record<AuditColumnKey, TableColumn<AuditEntry>> = {
    time: {
      key: 'time',
      header: l.colTime,
      sortable: true,
      render: (e) => (
        <FxTooltip content={relative(e.at, locale)}>
          <time className="fx-audit-log-time" dateTime={e.at} tabIndex={0}>
            {absoluteUtc(e.at)}
          </time>
        </FxTooltip>
      ),
    },
    actor: {
      key: 'actor',
      header: l.colActor,
      render: (e) => (
        <span className="fx-audit-log-actor">
          {e.actor.kind === 'user' ? (
            <FxAvatar size="xs" name={e.actor.name} alt="" />
          ) : (
            <span className="fx-audit-log-actor-badge" data-kind={e.actor.kind} aria-hidden="true">
              <FxIcon name={e.actor.kind === 'system' ? 'settings' : 'lock'} size={16} />
            </span>
          )}
          <span className="fx-audit-log-actor-name">{actorName(e.actor)}</span>
        </span>
      ),
    },
    action: {
      key: 'action',
      header: l.colAction,
      render: (e) => (
        <FxTag tone="neutral" size="sm">
          {e.action}
        </FxTag>
      ),
    },
    target: {
      key: 'target',
      header: l.colTarget,
      render: (e) =>
        e.target ? (
          e.target.href ? (
            <a className="fx-audit-log-target" href={e.target.href}>
              {e.target.label}
            </a>
          ) : (
            <span className="fx-audit-log-target">{e.target.label}</span>
          )
        ) : (
          <span className="fx-audit-log-empty-cell">—</span>
        ),
    },
    ip: {
      key: 'ip',
      header: l.colIp,
      render: (e) => <span className="fx-audit-log-ip">{e.ip ?? '—'}</span>,
    },
    details: {
      key: 'details',
      header: l.colDetails,
      align: 'end',
      render: (e) =>
        e.changes && e.changes.length > 0 ? (
          <button
            type="button"
            className="fx-audit-log-details-btn"
            aria-label={l.viewDetails}
            onClick={() => openDetails(e)}
          >
            <FxIcon name="eye" size={16} />
          </button>
        ) : (
          <span className="fx-audit-log-empty-cell">—</span>
        ),
    },
  };

  const tableColumns = columns.map((k) => allColumns[k]);
  const rootClass = ['fx-audit-log', className].filter(Boolean).join(' ');

  return (
    <div className={rootClass}>
      <FxTable<AuditEntry>
        columns={tableColumns}
        rows={entries}
        rowKey={(e) => e.id as Key}
        caption={l.caption}
        sort={sort}
        onSortChange={onSortChange}
        loading={loading}
        pagination={pagination}
        emptyState={<span className="fx-audit-log-empty">{l.empty}</span>}
      />

      <FxRightDrawer
        open={openEntry !== null}
        onOpenChange={(o) => {
          if (!o) setOpenEntry(null);
        }}
        title={l.drawerTitle}
        size="sm"
      >
        {openEntry && (openEntry.changes?.length ?? 0) > 0 ? (
          <dl className="fx-audit-log-changes">
            {openEntry.changes!.map((c) => (
              <div className="fx-audit-log-change" key={c.field}>
                <dt className="fx-audit-log-field">{c.field}</dt>
                <dd className="fx-audit-log-diff">
                  <span className="fx-audit-log-before">
                    <span className="fx-audit-log-diff-label">{l.before}</span>
                    <code className="fx-audit-log-value">{renderValue(c.before)}</code>
                  </span>
                  <span className="fx-audit-log-arrow" aria-hidden="true">
                    <FxIcon name="chevron" size={16} />
                  </span>
                  <span className="fx-audit-log-after">
                    <span className="fx-audit-log-diff-label">{l.after}</span>
                    <code className="fx-audit-log-value">{renderValue(c.after)}</code>
                  </span>
                </dd>
              </div>
            ))}
          </dl>
        ) : (
          <p className="fx-audit-log-no-changes">{l.noChanges}</p>
        )}
      </FxRightDrawer>
    </div>
  );
}
