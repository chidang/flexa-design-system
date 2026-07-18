/**
 * ShippingTimeline showcase spec. `enums.status` anchors the shared
 * `SHIPMENT_STATUSES` union — the vocabulary an event's `status` draws from.
 * One variant per status shows how each maps onto a timeline state; extra
 * variants cover the header controls, the ETA projection and the compact form.
 */
import type { ShowcaseSpec } from '../showcase-types';
import { SHIPMENT_STATUSES } from '../enums';
import { FxShippingTimeline, type Shipment } from './shipping-timeline';

/** A shipment header reused across variants. */
const meta = {
  id: 'shp_1',
  carrier: 'FedEx',
  trackingNumber: '7749 1234 5678',
  trackingUrl: 'https://example.test/track/7749',
} as const;

/** A "current" shipment whose newest event is each status in turn. */
const statusVariants = SHIPMENT_STATUSES.map((status) => ({
  label: status,
  props: {
    shipment: {
      ...meta,
      status,
      events: [
        { id: 'e1', status: 'label_created', description: 'Shipping label created', at: '2026-07-10T09:00:00Z' },
        { id: 'e2', status, description: 'Latest scan', location: 'Memphis, TN', at: '2026-07-12T14:20:00Z' },
      ],
    } as Shipment,
  },
}));

export const shippingTimelineShowcase: ShowcaseSpec = {
  name: 'ShippingTimeline',
  slug: 'shipping-timeline',
  category: 'commerce',
  slice: 'U8',
  status: 'ready',
  tagline: 'A shipment’s journey — carrier/tracking header above an event timeline.',
  component: FxShippingTimeline,
  variants: [
    ...statusVariants,
    {
      label: 'full journey + ETA',
      props: {
        shipment: {
          ...meta,
          status: 'in_transit',
          estimatedDeliveryAt: '2026-07-15T18:00:00Z',
          events: [
            { id: 'e1', status: 'label_created', description: 'Label created', at: '2026-07-10T09:00:00Z' },
            { id: 'e2', status: 'in_transit', description: 'Departed facility', location: 'Memphis, TN', at: '2026-07-12T14:20:00Z' },
            { id: 'e3', status: 'out_for_delivery', description: 'Out for delivery', location: 'Austin, TX', at: '2026-07-14T08:05:00Z' },
          ],
        } as Shipment,
      },
      note: 'Newest event = current; a trailing "Estimated" item projects the ETA.',
    },
    {
      label: 'delivered (terminal)',
      props: {
        shipment: {
          ...meta,
          status: 'delivered',
          events: [
            { id: 'e1', status: 'out_for_delivery', description: 'Out for delivery', at: '2026-07-14T08:05:00Z' },
            { id: 'e2', status: 'delivered', description: 'Left at front door', location: 'Austin, TX', at: '2026-07-14T16:40:00Z' },
          ],
        } as Shipment,
      },
    },
    {
      label: 'no header',
      props: {
        shipment: {
          id: 'shp_2',
          status: 'in_transit',
          events: [{ id: 'e1', status: 'in_transit', description: 'In transit', at: '2026-07-12T14:20:00Z' }],
        } as Shipment,
      },
    },
    {
      label: 'compact',
      props: {
        shipment: {
          ...meta,
          status: 'in_transit',
          events: [
            { id: 'e1', status: 'label_created', at: '2026-07-10T09:00:00Z' },
            { id: 'e2', status: 'in_transit', location: 'Memphis, TN', at: '2026-07-12T14:20:00Z' },
          ],
        } as Shipment,
        compact: true,
      },
    },
  ],
  props: [
    { name: 'shipment', type: 'Shipment', required: true, description: 'The shipment ({ id, carrier?, trackingNumber?, trackingUrl?, status, events, estimatedDeliveryAt? }).' },
    { name: 'compact', type: 'boolean', default: 'false', description: 'Denser timeline rhythm.' },
    { name: 'estimatedLabel', type: 'string', default: "'Estimated'", description: 'Copy for the projected ETA item.' },
    { name: 'onCopyTracking', type: '(trackingNumber: string) => void', description: 'Fires after the host copies the tracking number.' },
    { name: 'labels', type: '{ copy; copied; track; estimated }', description: 'i18n copy overrides.' },
  ],
  events: [
    { name: 'onCopyTracking', payload: 'trackingNumber: string', description: 'Host writes to the clipboard and announces "Tracking number copied".' },
  ],
  aria: [
    { attr: 'role="status"', value: 'polite', note: 'Empty visually-hidden slot; the host drops the copy confirmation here.' },
    { attr: 'aria-label', value: 'Copy tracking number', note: 'Names the icon-only copy button.' },
  ],
  enums: { status: SHIPMENT_STATUSES },
  contract: { doc: '04-component-bible.md', heading: 'FxShippingTimeline — Shipping Timeline' },
};
