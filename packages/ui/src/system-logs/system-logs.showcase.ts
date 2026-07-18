/**
 * FxSystemLogs showcase spec. Rows exercise every LogLevel (§5 `LogLevel`) —
 * declared as `enums: { level: LOG_LEVELS }` — with a context-carrying row that
 * expands to a JSON block. The first variant is non-empty static markup; the
 * toolbar controls are all labelled (Chips, Select aria-label, Switch label,
 * SearchBar ariaLabel), and the list is a labelled `role="log"` region.
 */
import type { ShowcaseSpec } from '../showcase-types';
import { LOG_LEVELS } from '../enums';
import { FxSystemLogs, type LogEntry } from './system-logs';

const noop = () => undefined;

const entries: LogEntry[] = [
  {
    id: 'g1',
    at: '2026-07-17T09:10:04.812Z',
    level: 'info',
    service: 'checkout',
    message: 'Order o1042 captured (amount=7480, currency=USD)',
  },
  {
    id: 'g2',
    at: '2026-07-17T09:10:05.331Z',
    level: 'debug',
    service: 'checkout',
    message: 'Provider webhook signature verified',
  },
  {
    id: 'g3',
    at: '2026-07-17T09:10:06.007Z',
    level: 'warning',
    service: 'payouts',
    message: 'Retrying payout p9 (attempt 2/5)',
    context: { payoutId: 'p9', attempt: 2, backoffMs: 4000 },
  },
  {
    id: 'g4',
    at: '2026-07-17T09:10:07.540Z',
    level: 'error',
    service: 'email',
    message: 'SMTP send failed: connection reset',
    context: { to: 'buyer@example.com', code: 'ECONNRESET', tries: 3 },
  },
  {
    id: 'g5',
    at: '2026-07-17T09:10:08.999Z',
    level: 'critical',
    service: 'db',
    message: 'Primary replica lag exceeded 30s — failing over',
  },
];

const services = [
  { value: 'checkout', label: 'checkout' },
  { value: 'payouts', label: 'payouts' },
  { value: 'email', label: 'email' },
  { value: 'db', label: 'db' },
];

const ranges = [
  { value: '15m', label: 'Last 15 min' },
  { value: '1h', label: 'Last hour' },
  { value: '24h', label: 'Last 24 hours' },
];

export const systemLogsShowcase: ShowcaseSpec = {
  name: 'SystemLogs',
  slug: 'system-logs',
  category: 'admin',
  slice: 'U10',
  status: 'ready',
  tagline: 'Monospace operator log viewer with level filters, live tail and JSON context.',
  component: FxSystemLogs,
  interactive: true,
  variants: [
    {
      label: 'levels · service · tail · search',
      props: { entries, services, ranges, onQueryChange: noop, onTailChange: noop },
      note: 'Warning/error rows expand to a JSON context block.',
    },
    {
      label: 'live tail on + load older',
      props: { entries, services, ranges, tail: true, onTailChange: noop, onLoadOlder: noop, onQueryChange: noop },
    },
    {
      label: 'wrap long lines',
      props: { entries, wrap: true, onQueryChange: noop },
    },
    {
      label: 'empty',
      props: { entries: [], onQueryChange: noop },
    },
  ],
  props: [
    { name: 'entries', type: 'LogEntry[]', required: true, description: 'LogEntry = { id; at; level: LogLevel; service?; message; context? }.' },
    { name: 'services', type: 'OptionItem[]', description: 'Distinct services for the service Select filter.' },
    { name: 'ranges', type: 'LogRangeOption[]', description: 'Time-range windows ({ value; label }).' },
    { name: 'onQueryChange', type: '(q: { levels; service; range; search }) => void', description: 'Fired on any toolbar change, with the whole query.' },
    { name: 'tail', type: 'boolean', default: 'false', description: 'Live-tail toggle state (host streams).' },
    { name: 'onTailChange', type: '(tail: boolean) => void', description: 'Live-tail switch handler.' },
    { name: 'onLoadOlder', type: '() => void', description: 'Renders + fires the "Load older" affordance.' },
    { name: 'wrap', type: 'boolean', default: 'false', description: 'Wrap long lines instead of horizontal scroll.' },
    { name: 'labels', type: 'Partial<SystemLogsLabels>', description: 'i18n overrides for every toolbar + row string.' },
  ],
  events: [
    { name: 'onQueryChange', payload: '({ levels, service, range, search })', description: 'A toolbar filter changed.' },
    { name: 'onTailChange', payload: '(tail: boolean)', description: 'Live tail was toggled.' },
    { name: 'onLoadOlder', payload: '()', description: 'Older entries requested.' },
  ],
  keyboard: [
    { keys: 'Tab', action: 'Move through level Chips, the Service/Range Selects, search, live-tail Switch and row context toggles.' },
    { keys: 'Enter / Space', action: 'Toggle the focused level Chip, live tail, or a row’s context block.' },
  ],
  aria: [
    { attr: 'role="log"', value: 'polite', note: 'The live-tail list is a labelled log region (host throttles announcements to ≥ error).' },
    { attr: 'role="toolbar"', value: 'Log filters', note: 'The filter row is a labelled toolbar.' },
    { attr: 'aria-expanded', value: 'context toggle', note: 'The per-row JSON context button reflects open/closed.' },
    { attr: 'time[datetime]', value: 'ms timestamp', note: 'Each row exposes a machine-readable timestamp.' },
  ],
  enums: { level: LOG_LEVELS },
  contract: { doc: '04-component-bible.md', heading: 'FxSystemLogs — System Logs' },
};
