/**
 * FxTable showcase spec. Only SHARED unions (from `enums.ts`) appear in `enums`;
 * component-specific unions (`selectable`, column `align`/`sticky`) are
 * documented in `props` as type strings (doc rule 6).
 */
import { createElement } from 'react';
import type { ShowcaseSpec } from '../showcase-types';
import { DENSITIES } from '../enums';
import { FxEmptyState } from '../empty-state/empty-state';
import { FxTable, type TableColumn } from './table';

interface Invoice {
  id: string;
  customer: string;
  amount: number;
  status: string;
}

const COLUMNS: TableColumn<Invoice>[] = [
  { key: 'id', header: 'Invoice' },
  { key: 'customer', header: 'Customer', sortable: true },
  { key: 'status', header: 'Status', sortable: true },
  { key: 'amount', header: 'Amount', align: 'end', sortable: true },
];

const ROWS: Invoice[] = [
  { id: 'INV-1001', customer: 'Acme Corp', amount: 1240, status: 'Paid' },
  { id: 'INV-1002', customer: 'Globex', amount: 860, status: 'Open' },
  { id: 'INV-1003', customer: 'Initech', amount: 3200, status: 'Overdue' },
  { id: 'INV-1004', customer: 'Umbrella', amount: 540, status: 'Paid' },
];

const rowKey = (r: Invoice) => r.id;
const rowLabel = (r: Invoice) => r.customer;
const caption = 'Recent invoices';
const emptyState = createElement(FxEmptyState, {
  icon: 'file',
  title: 'No invoices',
  description: 'Invoices you create will appear here.',
  size: 'sm',
});

const base = { columns: COLUMNS, rows: ROWS, rowKey, rowLabel, caption, emptyState };

export const tableShowcase: ShowcaseSpec = {
  name: 'Table',
  slug: 'table',
  category: 'data',
  slice: 'U6',
  status: 'ready',
  interactive: true,
  tagline: 'Semantic data table — sortable columns, row selection, sticky header.',
  component: FxTable,
  variants: [
    { label: 'default', props: { ...base } },
    { label: 'sorted (asc)', props: { ...base, defaultSort: { key: 'amount', dir: 'asc' } } },
    { label: 'sorted (desc)', props: { ...base, defaultSort: { key: 'customer', dir: 'desc' } } },
    { label: 'selectable multi', props: { ...base, selectable: 'multi', defaultSelectedKeys: ['INV-1001'] } },
    { label: 'select-all (partial)', props: { ...base, selectable: 'multi', defaultSelectedKeys: ['INV-1001', 'INV-1002'] } },
    { label: 'selectable single', props: { ...base, selectable: 'single', defaultSelectedKeys: ['INV-1003'] } },
    { label: 'clickable rows', props: { ...base, onRowClick: () => {} } },
    { label: 'non-sticky header', props: { ...base, stickyHeader: false } },
    ...DENSITIES.map((density) => ({
      label: `density ${density}`,
      props: { ...base, density },
    })),
    { label: 'loading (initial)', props: { ...base, rows: [], loading: true } },
    { label: 'loading (overlay)', props: { ...base, loading: true } },
    { label: 'empty', props: { ...base, rows: [] } },
  ],
  enums: { density: DENSITIES },
  props: [
    { name: 'columns', type: 'TableColumn<T>[]', required: true, description: 'TableColumn = { key; header; sortable?; align?: "start"|"end"|"center"; width?; sticky?: "start"|"end"; render? }.' },
    { name: 'rows', type: 'T[]', required: true, description: 'Row data.' },
    { name: 'rowKey', type: '(row: T) => Key', required: true, description: 'Stable per-row identity.' },
    { name: 'sort / defaultSort', type: '{ key; dir: "asc"|"desc" } | null', default: '— / null', description: 'Sort state (§1.5).' },
    { name: 'selectable', type: '"none" | "multi" | "single"', default: '"none"', description: 'Multi adds header select-all (indeterminate when partial).' },
    { name: 'selectedKeys / defaultSelectedKeys', type: 'Key[]', default: '— / []', description: 'Selection (§1.5).' },
    { name: 'onRowClick', type: '(row: T) => void', description: 'Rows become clickable; primary cell must hold a real link.' },
    { name: 'stickyHeader', type: 'boolean', default: 'true', description: 'Pins the header while scrolling.' },
    { name: 'density', type: '"comfortable" | "compact"', description: 'Compact 36px rows vs 48px comfortable.' },
    { name: 'loading', type: 'boolean', default: 'false', description: 'Initial: skeleton rows; subsequent: overlay + aria-busy.' },
    { name: 'emptyState', type: 'Node', required: true, description: 'FxEmptyState; required a11y contract.' },
    { name: 'caption', type: 'string', required: true, description: '<caption> naming the table (visually hidden allowed).' },
    { name: 'labels', type: '{ selectAll; selectRow; sortAsc; sortDesc; clearSort; loading }', description: 'i18n strings.' },
  ],
  events: [
    { name: 'onSortChange', payload: '(sort | null)', description: 'Cycle asc → desc → null.' },
    { name: 'onSelectionChange', payload: '(keys: Key[])', description: 'Selection changed.' },
    { name: 'onRowClick', payload: '(row: T)', description: 'Row activated.' },
  ],
  keyboard: [
    { keys: 'Tab', action: 'DOM order: sort buttons, row checkboxes, row links/actions' },
    { keys: 'Enter / Space', action: 'Activate the focused sort button or checkbox' },
    { keys: 'Arrow keys', action: 'Scroll the focusable container' },
  ],
  aria: [
    { attr: 'caption', value: 'table name', note: 'Visually hidden allowed.' },
    { attr: 'aria-sort', value: 'ascending | descending | none', note: 'On sortable <th>.' },
    { attr: 'aria-label', value: 'Select row {label}', note: 'Per-row checkbox.' },
    { attr: 'aria-busy', value: 'true', note: 'On container during overlay load.' },
  ],
  contract: { doc: '04-component-bible.md', heading: 'FxTable' },
};
