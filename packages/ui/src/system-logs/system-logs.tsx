'use client';
/**
 * FxSystemLogs — operator log viewer (doc 04 §3.9). A toolbar (level Chips +
 * service Select + time-range Select + live-tail Switch + search) over a
 * monospace log list.
 *
 * Rows are monospace with tabular timestamps; each carries a level Badge, an
 * optional service Tag, and the message, with an expandable JSON context block.
 * The list is `role="log"` for live-tail announcements (host throttles). Query
 * changes report through a single `onQueryChange({ levels, service, range,
 * search })`. Every user-facing string is a prop.
 */
import { useState } from 'react';
import type { Tone, LogLevel } from '../enums';
import { LOG_LEVELS } from '../enums';
import { FxChip } from '../chip/chip';
import { FxSelect, type OptionItem } from '../select/select';
import { FxSwitch } from '../switch/switch';
import { FxSearchBar } from '../search-bar/search-bar';
import { FxBadge } from '../badge/badge';
import { FxTag } from '../tag/tag';
import { FxIcon } from '../icon/FxIcon';

/** One log line. */
export interface LogEntry {
  id: string;
  /** ISO 8601 timestamp with millisecond precision (host passes UTC). */
  at: string;
  level: LogLevel;
  service?: string;
  message: string;
  /** Structured context, expanded as a JSON block. */
  context?: Record<string, unknown>;
}

/** The composite query the toolbar reports on any change. */
export interface LogQuery {
  levels: LogLevel[];
  service: string | null;
  range: string | null;
  search: string;
}

/** Baked-in strings — every one a prop (§i18n). */
export interface SystemLogsLabels {
  toolbar: string;
  levelsLegend: string;
  serviceLabel: string;
  servicePlaceholder: string;
  rangeLabel: string;
  rangePlaceholder: string;
  tail: string;
  searchLabel: string;
  searchPlaceholder: string;
  logRegion: string;
  loadOlder: string;
  expandContext: string;
  collapseContext: string;
  empty: string;
}

export const DEFAULT_SYSTEM_LOGS_LABELS: SystemLogsLabels = {
  toolbar: 'Log filters',
  levelsLegend: 'Levels',
  serviceLabel: 'Service',
  servicePlaceholder: 'All services',
  rangeLabel: 'Time range',
  rangePlaceholder: 'Time range',
  tail: 'Live tail',
  searchLabel: 'Search logs',
  searchPlaceholder: 'Search messages',
  logRegion: 'System log',
  loadOlder: 'Load older',
  expandContext: 'Show context',
  collapseContext: 'Hide context',
  empty: 'No log entries match the current filters.',
};

/** A selectable range option (host-defined windows). */
export interface LogRangeOption {
  value: string;
  label: string;
}

export interface FxSystemLogsProps {
  entries: LogEntry[];
  /** Distinct services for the service filter (value === label unless overridden). */
  services?: OptionItem[];
  /** Time-range windows (e.g. 15m / 1h / 24h). */
  ranges?: LogRangeOption[];
  /** Controlled active level filter. Defaults to all levels. */
  levels?: LogLevel[];
  /** Controlled service filter. */
  service?: string | null;
  /** Controlled range filter. */
  range?: string | null;
  /** Fired whenever any toolbar control changes, with the whole query. */
  onQueryChange?: (query: LogQuery) => void;
  /** Live-tail on/off. */
  tail?: boolean;
  onTailChange?: (tail: boolean) => void;
  /** Renders a "Load older" affordance at the top. */
  onLoadOlder?: () => void;
  /** Wrap long lines instead of horizontal scroll. Defaults to `false`. */
  wrap?: boolean;
  /** Baked-in strings. Merged over the English defaults. */
  labels?: Partial<SystemLogsLabels>;
  className?: string;
}

/** Level → outcome tone (debug neutral, info info, warning warning, error/critical danger). */
export function levelTone(level: LogLevel): Tone {
  switch (level) {
    case 'debug':
      return 'neutral';
    case 'info':
      return 'info';
    case 'warning':
      return 'warning';
    default:
      return 'danger';
  }
}

/** Millisecond-precision UTC timestamp ("09:10:04.812"). */
function stamp(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const pad = (n: number, w = 2) => String(n).padStart(w, '0');
  return `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}.${pad(d.getUTCMilliseconds(), 3)}`;
}

/** Pretty-print a context object as escaped JSON. */
function contextJson(ctx: Record<string, unknown>): string {
  try {
    return JSON.stringify(ctx, null, 2);
  } catch {
    return String(ctx);
  }
}

export function FxSystemLogs({
  entries,
  services = [],
  ranges = [],
  levels,
  service = null,
  range = null,
  onQueryChange,
  tail = false,
  onTailChange,
  onLoadOlder,
  wrap = false,
  labels,
  className,
}: FxSystemLogsProps) {
  const l = { ...DEFAULT_SYSTEM_LOGS_LABELS, ...labels };

  const levelsControlled = levels !== undefined;
  const [internalLevels, setInternalLevels] = useState<LogLevel[]>([...LOG_LEVELS]);
  const activeLevels = levelsControlled ? levels! : internalLevels;

  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const emit = (patch: Partial<LogQuery>) => {
    onQueryChange?.({
      levels: activeLevels,
      service,
      range,
      search: '',
      ...patch,
    });
  };

  const toggleLevel = (level: LogLevel, on: boolean) => {
    const next = on
      ? [...LOG_LEVELS].filter((x) => x === level || activeLevels.includes(x))
      : activeLevels.filter((x) => x !== level);
    if (!levelsControlled) setInternalLevels(next);
    emit({ levels: next });
  };

  const toggleContext = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const rangeOptions: OptionItem[] = ranges.map((r) => ({ value: r.value, label: r.label }));

  const rootClass = ['fx-system-logs', className].filter(Boolean).join(' ');

  return (
    <div className={rootClass} data-wrap={wrap || undefined}>
      <div className="fx-system-logs-toolbar" role="toolbar" aria-label={l.toolbar}>
        <fieldset className="fx-system-logs-levels">
          <legend className="fx-system-logs-legend">{l.levelsLegend}</legend>
          {LOG_LEVELS.map((level) => (
            <FxChip
              key={level}
              label={level}
              selected={activeLevels.includes(level)}
              size="sm"
              onChange={(on) => toggleLevel(level, on)}
            />
          ))}
        </fieldset>

        <div className="fx-system-logs-selects">
          {services.length > 0 && (
            <FxSelect
              options={services}
              value={service}
              clearable
              size="sm"
              aria-label={l.serviceLabel}
              placeholder={l.servicePlaceholder}
              onChange={(next) => emit({ service: next })}
            />
          )}
          {rangeOptions.length > 0 && (
            <FxSelect
              options={rangeOptions}
              value={range}
              size="sm"
              aria-label={l.rangeLabel}
              placeholder={l.rangePlaceholder}
              onChange={(next) => emit({ range: next })}
            />
          )}
        </div>

        <div className="fx-system-logs-search">
          <FxSearchBar
            size="sm"
            ariaLabel={l.searchLabel}
            placeholder={l.searchPlaceholder}
            onSearch={(q) => emit({ search: q })}
          />
        </div>

        <FxSwitch
          size="sm"
          checked={tail}
          label={l.tail}
          onChange={(next) => onTailChange?.(next)}
        />
      </div>

      {onLoadOlder != null && (
        <div className="fx-system-logs-older">
          <button type="button" className="fx-system-logs-older-btn" onClick={onLoadOlder}>
            <FxIcon name="history" size={16} />
            <span>{l.loadOlder}</span>
          </button>
        </div>
      )}

      <div className="fx-system-logs-region" role="log" aria-label={l.logRegion} aria-live="polite">
      <ol className="fx-system-logs-list">
        {entries.length === 0 ? (
          <li className="fx-system-logs-empty">{l.empty}</li>
        ) : (
          entries.map((e) => {
            const open = expanded.has(e.id);
            const hasContext = e.context != null && Object.keys(e.context).length > 0;
            return (
              <li key={e.id} className="fx-system-logs-row" data-level={e.level}>
                <div className="fx-system-logs-line">
                  <time className="fx-system-logs-time" dateTime={e.at}>
                    {stamp(e.at)}
                  </time>
                  <FxBadge tone={levelTone(e.level)} size="sm" appearance="subtle">
                    {e.level}
                  </FxBadge>
                  {e.service != null && (
                    <FxTag tone="neutral" size="sm">
                      {e.service}
                    </FxTag>
                  )}
                  <span className="fx-system-logs-message">{e.message}</span>
                  {hasContext && (
                    <button
                      type="button"
                      className="fx-system-logs-toggle"
                      aria-expanded={open}
                      aria-label={open ? l.collapseContext : l.expandContext}
                      onClick={() => toggleContext(e.id)}
                    >
                      <FxIcon name="chevron-down" size={16} />
                    </button>
                  )}
                </div>
                {hasContext && open && (
                  <pre className="fx-system-logs-context">{contextJson(e.context!)}</pre>
                )}
              </li>
            );
          })
        )}
      </ol>
      </div>
    </div>
  );
}
