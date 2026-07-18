/**
 * FxAuditLog showcase spec. Rows exercise every actor kind (user / system / api)
 * and an entry with a `changes` list that opens the before → after drawer. The
 * table renders server-side, so the first variant's static markup is non-empty.
 * `actor.kind` and `AuditColumnKey` are local prop-type strings (no §5 union).
 */
import type { ShowcaseSpec } from '../showcase-types';
import { FxAuditLog, type AuditEntry } from './audit-log';

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
      { field: 'tags', before: ['pottery'], after: ['pottery', 'handmade'] },
    ],
  },
  {
    id: 'e2',
    at: '2026-07-17T08:00:00Z',
    actor: { kind: 'system', name: 'System' },
    action: 'payout.settled',
    target: { kind: 'payout', id: 'p9', label: 'Payout #9', href: '#p9' },
    ip: '—',
    changes: [{ field: 'state', before: 'pending', after: 'settled' }],
  },
  {
    id: 'e3',
    at: '2026-07-16T22:30:00Z',
    actor: { kind: 'api', id: 'k_live_2', name: 'Zapier integration' },
    action: 'order.created',
    target: { kind: 'order', id: 'o1042', label: 'Order #1042', href: '#o1042' },
    ip: '198.51.100.4',
  },
];

export const auditLogShowcase: ShowcaseSpec = {
  name: 'AuditLog',
  slug: 'audit-log',
  category: 'collaboration',
  slice: 'U9',
  status: 'ready',
  tagline: 'Read-only, immutable audit trail with a before → after change drawer.',
  component: FxAuditLog,
  interactive: true,
  variants: [
    {
      label: 'user / system / api actors',
      props: { entries, onEntryOpen: noop, onSortChange: noop },
      note: 'Row 1 has a changes list — its Details eye opens the drawer.',
    },
    {
      label: 'column subset',
      props: { entries, columns: ['time', 'action', 'actor', 'details'], onEntryOpen: noop },
    },
    {
      label: 'loading',
      props: { entries: [], loading: true },
    },
    {
      label: 'empty',
      props: { entries: [] },
    },
  ],
  props: [
    { name: 'entries', type: 'AuditEntry[]', required: true, description: 'AuditEntry = { id; at; actor { kind: user|system|api; id?; name }; action; target?; ip?; changes? }.' },
    { name: 'columns', type: "AuditColumnKey[] ('time'|'actor'|'action'|'target'|'ip'|'details')", description: 'Column subset to render (defaults to all six in canonical order).' },
    { name: 'sort', type: 'TableSort | null', description: 'Controlled server-driven sort (§1.5), passed through to FxTable.' },
    { name: 'onSortChange', type: '(sort: TableSort | null) => void', description: 'Sort-change handler (server refetches).' },
    { name: 'loading', type: 'boolean', default: 'false', description: 'Skeleton / overlay state, passed through to FxTable.' },
    { name: 'pagination', type: 'ReactNode', description: 'Pagination slot (FxPagination), passed through to FxTable.' },
    { name: 'onEntryOpen', type: '(entry: AuditEntry) => void', description: 'Fired when a row’s details drawer opens.' },
    { name: 'labels', type: 'Partial<AuditLogLabels>', description: 'i18n overrides (column headers, System, API key, drawer strings…).' },
  ],
  events: [
    { name: 'onEntryOpen', payload: '(entry: AuditEntry)', description: 'A row’s change-details drawer opened.' },
    { name: 'onSortChange', payload: '(sort: TableSort | null)', description: 'A sortable column header was toggled.' },
  ],
  keyboard: [
    { keys: 'Tab', action: 'Move through time cells, target links and the Details buttons.' },
    { keys: 'Enter / Space', action: 'Open the change-details drawer from a Details button.' },
    { keys: 'Esc', action: 'Close the details drawer.' },
  ],
  aria: [
    { attr: 'contract', value: 'read-only', note: 'Immutable — no edit/delete affordances ever; export is host-driven.' },
    { attr: 'aria-label', value: 'View change details', note: 'Names the icon-only Details expander button.' },
    { attr: 'FxTooltip', value: 'relative time', note: 'The absolute-UTC time cell exposes a relative-time tooltip.' },
    { attr: 'role="dialog"', value: 'drawer', note: 'The change list opens in an FxRightDrawer (Esc closes).' },
  ],
  contract: { doc: '04-component-bible.md', heading: 'FxAuditLog — Audit Log' },
};
