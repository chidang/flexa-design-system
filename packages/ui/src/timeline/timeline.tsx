/**
 * FxTimeline — vertical ordered-list timeline (doc 04 §3.5): rail + markers +
 * content. Shipping/Escrow/Audit/Activity timelines compose this by mapping
 * domain data onto `TimelineItem`.
 *
 * Ordered-list semantics (`<ol>`) carry the chronology. State is conveyed in
 * TEXT — every item renders a visually-hidden `'{state}'` word — never by marker
 * colour alone (§1.7.7). Pure presentational; `interactive` expandable items are
 * deferred to the Accordion contract (v1 renders content inline), so no hooks are
 * needed and this stays an RSC in docs.
 */
import type { ReactNode } from 'react';
import type { Tone } from '../enums';
import { FxIcon } from '../icon/FxIcon';
import type { IconName } from '../icon/map';

export type TimelineState = 'complete' | 'current' | 'upcoming' | 'failed';

export interface TimelineItem {
  id: string;
  title: string;
  description?: string;
  /** ISO timestamp; rendered verbatim (host formats before passing). */
  at?: string;
  /** Defaults to `upcoming`. */
  state?: TimelineState;
  /** Overrides the default per-state marker glyph. */
  icon?: IconName;
  /**
   * Domain tint for `complete` items: the marker renders as a soft tone tint
   * (tone-soft fill + tone glyph) instead of the solid success paint. Other
   * states keep their state paint — progress semantics outrank the tint.
   */
  tone?: Tone;
  /** Rich content slot rendered under the description. */
  content?: ReactNode;
}

export interface TimelineLabels {
  complete: string;
  current: string;
  upcoming: string;
  failed: string;
}

export const DEFAULT_TIMELINE_LABELS: TimelineLabels = {
  complete: 'Complete',
  current: 'In progress',
  upcoming: 'Upcoming',
  failed: 'Failed',
};

/** Default marker glyph per state (item.icon overrides). */
const STATE_ICON: Record<TimelineState, IconName | undefined> = {
  complete: 'check',
  current: undefined, // plain dot + ring
  upcoming: undefined, // plain dot
  failed: 'error',
};

export interface FxTimelineProps {
  items: TimelineItem[];
  /** Layout axis. Defaults to `vertical` (only axis in v1). */
  orientation?: 'vertical';
  /** Expandable items via the Accordion contract (deferred; inline in v1). */
  interactive?: boolean;
  /** Tighter row rhythm. */
  dense?: boolean;
  /** Visually-hidden state words (i18n). */
  labels?: Partial<TimelineLabels>;
  className?: string;
}

export function FxTimeline({
  items,
  orientation = 'vertical',
  interactive = false,
  dense = false,
  labels,
  className,
}: FxTimelineProps) {
  const l = { ...DEFAULT_TIMELINE_LABELS, ...labels };
  const rootClass = className ? `fx-timeline ${className}` : 'fx-timeline';

  return (
    <ol
      className={rootClass}
      data-orientation={orientation}
      data-interactive={interactive || undefined}
      data-dense={dense || undefined}
    >
      {items.map((item) => {
        const state = item.state ?? 'upcoming';
        const glyph = item.icon ?? STATE_ICON[state];
        return (
          <li key={item.id} className="fx-timeline-item" data-state={state} data-tone={item.tone}>
            <span className="fx-timeline-rail" aria-hidden="true">
              <span className="fx-timeline-marker">
                {glyph ? (
                  <FxIcon name={glyph} size={16} className="fx-timeline-marker-icon" />
                ) : (
                  <span className="fx-timeline-marker-dot" />
                )}
              </span>
            </span>
            <div className="fx-timeline-content">
              {item.title !== '' && (
                <p className="fx-timeline-title">
                  {item.title}
                  <span className="fx-timeline-state">{l[state]}</span>
                </p>
              )}
              {item.description && (
                <p className="fx-timeline-description">{item.description}</p>
              )}
              {item.at && (
                <time className="fx-timeline-time" dateTime={item.at}>
                  {item.at}
                </time>
              )}
              {item.content && <div className="fx-timeline-slot">{item.content}</div>}
              {/* Blank-title rows still spell their state (a11y §1.7.7). */}
              {item.title === '' && l[state] !== '' && (
                <span className="fx-timeline-state">{l[state]}</span>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
