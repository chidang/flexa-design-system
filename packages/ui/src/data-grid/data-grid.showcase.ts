/**
 * FxDataGrid showcase spec. Only SHARED unions (`density`) appear in `enums`;
 * editor-type / selectable / align unions are documented in `props` (doc rule 6).
 */
import { createElement } from 'react';
import type { ShowcaseSpec } from '../showcase-types';
import { DENSITIES } from '../enums';
import { FxEmptyState } from '../empty-state/empty-state';
import { FxDataGrid, type GridColumn } from './data-grid';

interface Task {
  id: number;
  title: string;
  owner: string;
  status: string;
  points: number;
}

const OWNERS = [
  { value: 'Ada', label: 'Ada' },
  { value: 'Ben', label: 'Ben' },
  { value: 'Cara', label: 'Cara' },
];

const COLUMNS: GridColumn<Task>[] = [
  { key: 'title', header: 'Title', sortable: true, editable: true },
  { key: 'owner', header: 'Owner', editable: { editor: 'select', options: OWNERS } },
  { key: 'status', header: 'Status', sortable: true },
  { key: 'points', header: 'Points', align: 'end', editable: { editor: 'number' } },
];

const ROWS: Task[] = [
  { id: 1, title: 'Design tokens', owner: 'Ada', status: 'In progress', points: 5 },
  { id: 2, title: 'Grid keyboard nav', owner: 'Ben', status: 'Todo', points: 8 },
  { id: 3, title: 'Sort cycle', owner: 'Cara', status: 'Done', points: 3 },
  { id: 4, title: 'Virtualization', owner: 'Ada', status: 'Todo', points: 13 },
];

const rowKey = (r: Task) => r.id;
const rowLabel = (r: Task) => r.title;
const caption = 'Sprint tasks';
const emptyState = createElement(FxEmptyState, { icon: 'grid', title: 'No tasks', size: 'sm' });

const base = { columns: COLUMNS, rows: ROWS, rowKey, rowLabel, caption, emptyState };

export const dataGridShowcase: ShowcaseSpec = {
  name: 'DataGrid',
  slug: 'data-grid',
  category: 'data',
  slice: 'U6',
  status: 'ready',
  interactive: true,
  tagline: 'Spreadsheet-class grid — keyboard cell navigation + inline editing.',
  component: FxDataGrid,
  variants: [
    { label: 'default', props: { ...base } },
    { label: 'editable cells', props: { ...base, onCellEdit: () => {} } },
    { label: 'sorted', props: { ...base, defaultSort: { key: 'title', dir: 'asc' } } },
    { label: 'selectable multi', props: { ...base, selectable: 'multi', defaultSelectedKeys: [1] } },
    { label: 'select-all (partial)', props: { ...base, selectable: 'multi', defaultSelectedKeys: [1, 2] } },
    { label: 'selectable single', props: { ...base, selectable: 'single', defaultSelectedKeys: [3] } },
    ...DENSITIES.map((density) => ({ label: `density ${density}`, props: { ...base, density } })),
    { label: 'loading', props: { ...base, loading: true } },
    { label: 'empty', props: { ...base, rows: [] } },
  ],
  enums: { density: DENSITIES },
  props: [
    { name: 'columns', type: 'GridColumn<T>[]', required: true, description: 'TableColumn concepts + editable/resizable/reorderable/pinnable.' },
    { name: 'columns[].editable', type: 'boolean | { editor: "text"|"number"|"select"|"date"; options? }', default: 'false', description: 'Inline editor spec.' },
    { name: 'rows / rowKey', type: 'T[] / (row) => Key', required: true, description: 'Row data + identity.' },
    { name: 'sort / defaultSort', type: '{ key; dir } | null', description: 'Sort state (§1.5).' },
    { name: 'selectable', type: '"none" | "multi" | "single"', default: '"none"', description: 'Row selection mode.' },
    { name: 'selectedKeys / defaultSelectedKeys', type: 'Key[]', description: 'Selection (§1.5).' },
    { name: 'density', type: '"comfortable" | "compact"', description: 'Fixed row heights per density.' },
    { name: 'caption / emptyState', type: 'string / Node', required: true, description: 'grid a11y name + zero-data surface.' },
    { name: 'labels', type: '{ selectAll; selectRow; selectionStatus; editCommitted; editFailed }', description: 'i18n strings.' },
  ],
  events: [
    { name: 'onSortChange', payload: '(sort | null)', description: 'Cycle asc → desc → null.' },
    { name: 'onSelectionChange', payload: '(keys: Key[])', description: 'Selection changed (announced).' },
    { name: 'onCellEdit', payload: '({ rowKey; columnKey; value; previous }) => void | Promise', description: 'Reject by throwing → cell reverts + error announced.' },
  ],
  keyboard: [
    { keys: 'Arrow keys', action: 'Move cell focus (single tab stop; roving focus)' },
    { keys: 'Home / End · Ctrl+Home/End', action: 'Row start/end · grid start/end' },
    { keys: 'Enter / F2', action: 'Enter edit mode; Enter commits + moves down' },
    { keys: 'Tab (editing)', action: 'Commit + move right' },
    { keys: 'Esc', action: 'Cancel edit, restore value, focus cell' },
    { keys: 'Space · Ctrl+A', action: 'Toggle row selection · select all' },
  ],
  aria: [
    { attr: 'role', value: 'grid', note: 'aria-rowcount / aria-colcount = totals.' },
    { attr: 'aria-rowindex', value: 'absolute index', note: 'On each row (header = 1).' },
    { attr: 'aria-colindex', value: 'absolute index', note: 'On each gridcell/columnheader.' },
    { attr: 'aria-sort', value: 'ascending | descending | none', note: 'On sortable columnheader.' },
    { attr: 'role', value: 'status', note: 'Selection count + edit commit/failure.' },
  ],
  contract: { doc: '04-component-bible.md', heading: 'FxDataGrid' },
};
