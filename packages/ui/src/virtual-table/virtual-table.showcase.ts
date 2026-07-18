/**
 * FxVirtualTable showcase spec. Reuses FxTable column/selection concepts; only
 * SHARED unions (`density`) appear in `enums`. The `'*'` select-all-matching
 * sentinel + `selectedAllExcept` are documented in `props` (doc rule 6).
 */
import { createElement } from 'react';
import type { ShowcaseSpec } from '../showcase-types';
import { DENSITIES } from '../enums';
import { FxEmptyState } from '../empty-state/empty-state';
import type { TableColumn } from '../table/table';
import { FxVirtualTable } from './virtual-table';

interface Contact {
  id: number;
  name: string;
  email: string;
  city: string;
}

const COLUMNS: TableColumn<Contact>[] = [
  { key: 'name', header: 'Name', sortable: true },
  { key: 'email', header: 'Email' },
  { key: 'city', header: 'City', sortable: true },
];

const CITIES = ['Berlin', 'Tokyo', 'Lagos', 'Lima', 'Oslo'];
const ROWS: Contact[] = Array.from({ length: 2000 }, (_, i) => ({
  id: i + 1,
  name: `Contact ${i + 1}`,
  email: `c${i + 1}@example.com`,
  city: CITIES[i % CITIES.length]!,
}));

const rowKey = (r: Contact) => r.id;
const rowLabel = (r: Contact) => r.name;
const caption = 'Contacts';
const emptyState = createElement(FxEmptyState, {
  icon: 'users',
  title: 'No contacts',
  size: 'sm',
});

const base = { columns: COLUMNS, rows: ROWS, rowKey, rowLabel, caption, emptyState };

export const virtualTableShowcase: ShowcaseSpec = {
  name: 'VirtualTable',
  slug: 'virtual-table',
  category: 'data',
  slice: 'U6',
  status: 'ready',
  interactive: true,
  tagline: 'FxTable API + row virtualization for 1k–100k rows.',
  component: FxVirtualTable,
  variants: [
    { label: 'default (2k rows)', props: { ...base } },
    { label: 'sorted', props: { ...base, defaultSort: { key: 'name', dir: 'asc' } } },
    { label: 'selectable multi', props: { ...base, selectable: 'multi', defaultSelectedKeys: [1, 2] } },
    { label: 'select-all-matching', props: { ...base, selectable: 'multi', defaultSelectedKeys: ['*'], selectedAllExcept: [3] }, note: 'onSelectionChange(["*"]) + selectedAllExcept' },
    { label: 'selectable single', props: { ...base, selectable: 'single', defaultSelectedKeys: [5] } },
    { label: 'clickable rows', props: { ...base, onRowClick: () => {} } },
    { label: 'tall viewport', props: { ...base, height: 480 } },
    ...DENSITIES.map((density) => ({ label: `density ${density}`, props: { ...base, density } })),
    { label: 'loading', props: { ...base, loading: true } },
    { label: 'empty', props: { ...base, rows: [], totalRows: 0 } },
  ],
  enums: { density: DENSITIES },
  props: [
    { name: 'columns / rows / rowKey', type: 'TableColumn<T>[] / T[] / (row) => Key', required: true, description: 'FxTable data contract.' },
    { name: 'totalRows', type: 'number', default: 'rows.length', description: 'Full dataset size when server-paged (drives aria-rowcount).' },
    { name: 'sort / defaultSort', type: '{ key; dir } | null', description: 'Sort state (§1.5).' },
    { name: 'selectable', type: '"none" | "multi" | "single"', default: '"none"', description: 'Row selection mode.' },
    { name: 'selectedKeys / defaultSelectedKeys', type: 'Key[]', description: 'Selection (§1.5). ["*"] = all-matching sentinel.' },
    { name: 'selectedAllExcept', type: 'Key[]', description: 'Server-side inverse selection when all-matching is active.' },
    { name: 'rowHeight', type: 'number', default: 'per density', description: 'Fixed row height (48 comfortable / 40 compact).' },
    { name: 'overscan', type: 'number', default: '10', description: 'Rows rendered beyond the viewport.' },
    { name: 'height', type: 'number', default: '400', description: 'Viewport height in px.' },
    { name: 'caption / emptyState', type: 'string / Node', required: true, description: 'a11y name + zero-data surface.' },
  ],
  events: [
    { name: 'onSortChange', payload: '(sort | null)', description: 'Cycle asc → desc → null.' },
    { name: 'onSelectionChange', payload: '(keys: Key[])', description: '["*"] sentinel selects all matching.' },
    { name: 'onVisibleRangeChange', payload: '({ start, end })', description: 'Rendered window changed on scroll.' },
  ],
  keyboard: [
    { keys: 'Tab', action: 'Focus header sort buttons, then the scrollable viewport' },
    { keys: 'Arrow keys / PageUp / PageDown', action: 'Scroll the viewport' },
    { keys: 'Space', action: 'Toggle the focused row checkbox' },
  ],
  aria: [
    { attr: 'role', value: 'table', note: 'Flex rows: role=row / role=cell.' },
    { attr: 'aria-rowcount', value: 'total dataset size', note: 'Not the rendered window.' },
    { attr: 'aria-rowindex', value: 'absolute index', note: 'On each rendered row.' },
    { attr: 'aria-busy', value: 'true', note: 'While loading.' },
  ],
  contract: { doc: '04-component-bible.md', heading: 'FxVirtualTable' },
};
