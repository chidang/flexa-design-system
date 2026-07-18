/**
 * FxShippingTimeline — a shipment's journey (doc 04 §3.7). A carrier/tracking
 * header (carrier name + a copy-tracking-number button + an external "Track"
 * link) sits above an FxTimeline whose items are the shipment's events.
 *
 * Pure presentational (no hooks) → renders as an RSC in docs. Event → timeline
 * state is derived positionally: the newest event is `current`, earlier ones are
 * `complete`, and — when an estimated delivery is known and not yet reached — a
 * trailing `upcoming` "Estimated" item projects the ETA. The copy control is a
 * real `<button>`; the host performs the clipboard write and announces success —
 * we render an empty polite `role="status"` slot for that announcement.
 */
import { FxTimeline, type TimelineItem, type TimelineState } from '../timeline/timeline';
import { FxIcon } from '../icon/FxIcon';
import { formatStatusLabel } from '../status-tone';
import type { ShipmentStatus } from '../enums';

/** One scan/event along the shipment (doc 04 §3.7). */
export interface ShipmentEvent {
  id: string;
  status: ShipmentStatus;
  description?: string;
  location?: string;
  /** ISO timestamp; rendered verbatim (host formats before passing). */
  at: string;
}

/** A shipment record (doc 04 §3.7). */
export interface Shipment {
  id: string;
  carrier?: string;
  trackingNumber?: string;
  trackingUrl?: string;
  status: ShipmentStatus;
  /** Chronological events (host orders newest-last). */
  events: ShipmentEvent[];
  /** ISO estimated-delivery timestamp; projected as a trailing item. */
  estimatedDeliveryAt?: string;
}

/** i18n copy — every baked-in string has a documented default. */
export interface ShippingTimelineLabels {
  copy: string;
  copied: string;
  track: string;
  estimated: string;
}

export const DEFAULT_SHIPPING_TIMELINE_LABELS: ShippingTimelineLabels = {
  copy: 'Copy tracking number',
  copied: 'Tracking number copied',
  track: 'Track',
  estimated: 'Estimated',
};

export interface FxShippingTimelineProps {
  shipment: Shipment;
  /** Denser timeline rhythm. */
  compact?: boolean;
  /** Copy for the projected ETA item. Defaults to `'Estimated'`. */
  estimatedLabel?: string;
  /** Fires after the host copies `trackingNumber` to the clipboard. */
  onCopyTracking?: (trackingNumber: string) => void;
  labels?: Partial<ShippingTimelineLabels>;
  className?: string;
}

/**
 * Map events → `TimelineItem`s. Newest event = `current`, earlier = `complete`;
 * a known future ETA appends an `upcoming` projection.
 */
function toTimelineItems(shipment: Shipment, estimatedLabel: string): TimelineItem[] {
  const { events, estimatedDeliveryAt, status } = shipment;
  const lastIndex = events.length - 1;
  // A terminal shipment (delivered/returned/failed) has no "current" — its last
  // event is complete; otherwise the newest event is the one in progress.
  const terminal = status === 'delivered' || status === 'returned' || status === 'failed';

  const items: TimelineItem[] = events.map((event, i) => {
    let state: TimelineState;
    if (event.status === 'failed' || event.status === 'returned') state = 'failed';
    else if (i === lastIndex) state = terminal ? 'complete' : 'current';
    else state = 'complete';
    const location = event.location != null ? ` · ${event.location}` : '';
    return {
      id: event.id,
      title: formatStatusLabel(event.status),
      description: event.description != null ? `${event.description}${location}` : event.location,
      at: event.at,
      state,
    };
  });

  if (estimatedDeliveryAt != null && !terminal) {
    items.push({
      id: `${shipment.id}-eta`,
      title: estimatedLabel,
      at: estimatedDeliveryAt,
      state: 'upcoming',
      icon: 'clock',
    });
  }
  return items;
}

export function FxShippingTimeline({
  shipment,
  compact = false,
  estimatedLabel,
  onCopyTracking,
  labels,
  className,
}: FxShippingTimelineProps) {
  const l = { ...DEFAULT_SHIPPING_TIMELINE_LABELS, ...labels };
  const eta = estimatedLabel ?? l.estimated;
  const rootClass = className ? `fx-shipping-timeline ${className}` : 'fx-shipping-timeline';
  const items = toTimelineItems(shipment, eta);
  const { carrier, trackingNumber, trackingUrl } = shipment;
  const hasHeader = carrier != null || trackingNumber != null || trackingUrl != null;

  return (
    <section
      className={rootClass}
      data-compact={compact || undefined}
      aria-label={carrier != null ? `${carrier} shipment` : 'Shipment'}
    >
      {hasHeader && (
        <header className="fx-shipping-timeline-header">
          {carrier != null && <span className="fx-shipping-timeline-carrier">{carrier}</span>}
          {trackingNumber != null && (
            <span className="fx-shipping-timeline-tracking">
              <span className="fx-shipping-timeline-number">{trackingNumber}</span>
              <button
                type="button"
                className="fx-shipping-timeline-copy"
                aria-label={l.copy}
                onClick={onCopyTracking ? () => onCopyTracking(trackingNumber) : undefined}
              >
                <FxIcon name="copy" size={16} />
              </button>
            </span>
          )}
          {trackingUrl != null && (
            <a
              className="fx-shipping-timeline-track"
              href={trackingUrl}
              target="_blank"
              rel="noreferrer noopener"
            >
              {l.track}
              <FxIcon name="external-link" size={16} />
            </a>
          )}
        </header>
      )}

      <FxTimeline items={items} dense={compact} />

      {/* Host-driven announcement slot — the copy button writes to the clipboard
          and drops `l.copied` here for a polite screen-reader confirmation. */}
      <span className="fx-shipping-timeline-announce" role="status" aria-live="polite" />
    </section>
  );
}
