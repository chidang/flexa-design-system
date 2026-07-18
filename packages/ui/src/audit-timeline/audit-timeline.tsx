'use client';
/**
 * FxAuditTimeline — vertical forensic narrative for ONE entity (doc 04 §3.9).
 *
 * Renders the SAME `AuditEntry[]` vocabulary as FxAuditLog, but as an FxTimeline
 * ("who changed what, when") instead of a flat table. Each entry maps to a
 * TimelineItem whose tone comes from the action class inferred from the verb
 * after the last dot: created→success, updated→info, deleted→danger (else info).
 * Entries group under sticky day headers (`groupByDay`), each row shows the
 * actor Avatar + an action Tag; a details button fires `onEntryOpen`. Every
 * user-facing string is a prop.
 */
import type { Tone } from '../enums';
import type { AuditEntry, AuditActor } from '../audit-log/audit-log';
import { FxTimeline, type TimelineItem } from '../timeline/timeline';
import { FxAvatar } from '../avatar/avatar';
import { FxTag } from '../tag/tag';
import { FxIcon } from '../icon/FxIcon';

/** Baked-in strings — every one a prop (§i18n). */
export interface AuditTimelineLabels {
  system: string;
  apiKey: string;
  viewDetails: string;
  loadMore: string;
  empty: string;
  today: string;
}

export const DEFAULT_AUDIT_TIMELINE_LABELS: AuditTimelineLabels = {
  system: 'System',
  apiKey: 'API key',
  viewDetails: 'View change details',
  loadMore: 'Load older',
  empty: 'No audit entries for this entity.',
  today: 'Today',
};

export interface FxAuditTimelineProps {
  /** The entity's audit entries, newest first (host-ordered). */
  entries: AuditEntry[];
  /** Fired when a row's details button is pressed. */
  onEntryOpen?: (entry: AuditEntry) => void;
  /** Group rows under day headers. Defaults to `true`. */
  groupByDay?: boolean;
  /** When more history exists, renders a "Load older" button. */
  limit?: number;
  /** Handler for the "Load older" button (host paginates). */
  onLoadMore?: () => void;
  /** BCP-47 locale for day-header formatting. */
  locale?: string;
  /** Baked-in strings. Merged over the English defaults. */
  labels?: Partial<AuditTimelineLabels>;
  className?: string;
}

/** Verb after the last dot → tone (create=success, update=info, delete=danger). */
export function actionTone(action: string): Tone {
  const verb = action.split('.').pop()?.toLowerCase() ?? '';
  if (verb.startsWith('creat') || verb.startsWith('add')) return 'success';
  if (verb.startsWith('delet') || verb.startsWith('remov') || verb.startsWith('destroy')) return 'danger';
  return 'info';
}

/** UTC day key (`YYYY-MM-DD`) used to bucket entries into day groups. */
function dayKey(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
}

/** Human day header ("17 Jul 2026", or "Today"). */
function dayLabel(iso: string, todayLabel: string, locale?: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  if (dayKey(iso) === dayKey(new Date().toISOString())) return todayLabel;
  try {
    return new Intl.DateTimeFormat(locale, {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      timeZone: 'UTC',
    }).format(d);
  } catch {
    return dayKey(iso);
  }
}

/** Absolute UTC time-of-day display ("09:10 UTC"). */
function timeOfDay(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())} UTC`;
}

export function FxAuditTimeline({
  entries,
  onEntryOpen,
  groupByDay = true,
  limit,
  onLoadMore,
  locale,
  labels,
  className,
}: FxAuditTimelineProps) {
  const l = { ...DEFAULT_AUDIT_TIMELINE_LABELS, ...labels };

  const actorName = (a: AuditActor): string =>
    a.kind === 'system' ? l.system : a.kind === 'api' ? a.name || l.apiKey : a.name;

  /** One entry → a TimelineItem carrying the actor row + action Tag + details. */
  const toItem = (e: AuditEntry): TimelineItem => {
    const tone = actionTone(e.action);
    const changeCount = e.changes?.length ?? 0;
    return {
      id: e.id,
      title: e.target ? e.target.label : e.action,
      at: timeOfDay(e.at),
      state: 'complete',
      tone,
      content: (
        <div className="fx-audit-timeline-entry">
          <span className="fx-audit-timeline-actor">
            {e.actor.kind === 'user' ? (
              <FxAvatar size="xs" name={e.actor.name} alt="" />
            ) : (
              <span className="fx-audit-timeline-actor-badge" data-kind={e.actor.kind} aria-hidden="true">
                <FxIcon name={e.actor.kind === 'system' ? 'settings' : 'users'} size={16} />
              </span>
            )}
            <span className="fx-audit-timeline-actor-name">{actorName(e.actor)}</span>
          </span>
          <FxTag tone={tone} size="sm">
            {e.action}
          </FxTag>
          {changeCount > 0 && (
            <button
              type="button"
              className="fx-audit-timeline-details-btn"
              aria-label={l.viewDetails}
              onClick={() => onEntryOpen?.(e)}
            >
              <FxIcon name="eye" size={16} />
            </button>
          )}
        </div>
      ),
    };
  };

  const rootClass = ['fx-audit-timeline', className].filter(Boolean).join(' ');

  if (entries.length === 0) {
    return (
      <div className={rootClass}>
        <p className="fx-audit-timeline-empty">{l.empty}</p>
      </div>
    );
  }

  const hasMore = limit !== undefined && entries.length >= limit && onLoadMore != null;

  const loadMore = hasMore ? (
    <div className="fx-audit-timeline-more">
      <button type="button" className="fx-audit-timeline-more-btn" onClick={onLoadMore}>
        <FxIcon name="history" size={16} />
        <span>{l.loadMore}</span>
      </button>
    </div>
  ) : null;

  if (!groupByDay) {
    return (
      <div className={rootClass}>
        <FxTimeline items={entries.map(toItem)} />
        {loadMore}
      </div>
    );
  }

  // Preserve host order; bucket contiguous runs by UTC day.
  const groups: { key: string; label: string; items: AuditEntry[] }[] = [];
  for (const e of entries) {
    const key = dayKey(e.at);
    const tail = groups[groups.length - 1];
    if (tail && tail.key === key) tail.items.push(e);
    else groups.push({ key, label: dayLabel(e.at, l.today, locale), items: [e] });
  }

  return (
    <div className={rootClass}>
      {groups.map((g) => (
        <section className="fx-audit-timeline-group" key={g.key} aria-label={g.label}>
          <h3 className="fx-audit-timeline-day">
            <FxIcon name="clock" size={16} className="fx-audit-timeline-day-icon" />
            {g.label}
          </h3>
          <FxTimeline items={g.items.map(toItem)} />
        </section>
      ))}
      {loadMore}
    </div>
  );
}
