/**
 * FxAuditTimeline showcase spec. Rows reuse the FxAuditLog `AuditEntry` shape
 * (one shared vocabulary, two views) across two UTC days so the groupByDay
 * headers render; entry tones exercise create/update/delete inference. The
 * first variant is non-empty static markup. `AuditEntry` is documented as a
 * type string (imported from audit-log) — no §5 shared union here.
 */
import type { ShowcaseSpec } from '../showcase-types';
import { FxAuditTimeline } from './audit-timeline';
import type { AuditEntry } from '../audit-log/audit-log';

const noop = () => undefined;

const entries: AuditEntry[] = [
  {
    id: 'e1',
    at: '2026-07-17T09:10:00Z',
    actor: { kind: 'user', id: 'u1', name: 'Ada Lovelace' },
    action: 'listing.updated',
    target: { kind: 'listing', id: 'l42', label: 'Ceramic mug', href: '#l42' },
    ip: '203.0.113.7',
    changes: [
      { field: 'price', before: 6980, after: 7480 },
      { field: 'status', before: 'draft', after: 'published' },
    ],
  },
  {
    id: 'e2',
    at: '2026-07-17T08:00:00Z',
    actor: { kind: 'system', name: 'System' },
    action: 'payout.settled',
    target: { kind: 'payout', id: 'p9', label: 'Payout #9', href: '#p9' },
    changes: [{ field: 'state', before: 'pending', after: 'settled' }],
  },
  {
    id: 'e3',
    at: '2026-07-16T22:30:00Z',
    actor: { kind: 'api', id: 'k_live_2', name: 'Zapier integration' },
    action: 'order.created',
    target: { kind: 'order', id: 'o1042', label: 'Order #1042', href: '#o1042' },
  },
  {
    id: 'e4',
    at: '2026-07-16T18:05:00Z',
    actor: { kind: 'user', id: 'u2', name: 'Grace Hopper' },
    action: 'listing.deleted',
    target: { kind: 'listing', id: 'l7', label: 'Draft #7' },
  },
];

export const auditTimelineShowcase: ShowcaseSpec = {
  name: 'AuditTimeline',
  slug: 'audit-timeline',
  category: 'admin',
  slice: 'U10',
  status: 'ready',
  tagline: 'Vertical forensic narrative for one entity — same events as the Audit Log.',
  component: FxAuditTimeline,
  interactive: true,
  variants: [
    {
      label: 'grouped by day',
      props: { entries, onEntryOpen: noop },
      note: 'Sticky day headers; tone from action verb (created/updated/deleted).',
    },
    {
      label: 'flat (no day grouping)',
      props: { entries, groupByDay: false, onEntryOpen: noop },
    },
    {
      label: 'load older',
      props: { entries, limit: 4, onLoadMore: noop, onEntryOpen: noop },
      note: 'When more history exists, a "Load older" button appears.',
    },
    {
      label: 'empty',
      props: { entries: [] },
    },
  ],
  props: [
    { name: 'entries', type: 'AuditEntry[]', required: true, description: 'Same shape as FxAuditLog: { id; at; actor { kind: user|system|api; id?; name }; action; target?; ip?; changes? }.' },
    { name: 'onEntryOpen', type: '(entry: AuditEntry) => void', description: 'Fired when a row’s change-details button is pressed.' },
    { name: 'groupByDay', type: 'boolean', default: 'true', description: 'Bucket rows under sticky UTC day headers.' },
    { name: 'limit', type: 'number', description: 'When entries.length ≥ limit and onLoadMore is set, renders "Load older".' },
    { name: 'onLoadMore', type: '() => void', description: 'Handler for the "Load older" button (host paginates).' },
    { name: 'labels', type: 'Partial<AuditTimelineLabels>', description: 'i18n overrides (System, API key, details, load-more, empty, today).' },
  ],
  events: [
    { name: 'onEntryOpen', payload: '(entry: AuditEntry)', description: 'A row’s details button was pressed.' },
    { name: 'onLoadMore', payload: '()', description: 'The "Load older" button was pressed.' },
  ],
  keyboard: [
    { keys: 'Tab', action: 'Move through the per-entry Details buttons and the Load older button.' },
    { keys: 'Enter / Space', action: 'Activate the focused Details or Load older button.' },
  ],
  aria: [
    { attr: 'contract', value: 'read-only', note: 'Immutable narrative — no edit/delete affordances; mirrors the Audit Log vocabulary.' },
    { attr: 'ol', value: 'timeline', note: 'FxTimeline carries chronology as an ordered list; state is spelled in text.' },
    { attr: 'aria-label', value: 'View change details', note: 'Names the icon-only Details button.' },
    { attr: 'section[aria-label]', value: 'day header', note: 'Each day group is a labelled section.' },
  ],
  contract: { doc: '04-component-bible.md', heading: 'FxAuditTimeline — Audit Timeline' },
};
