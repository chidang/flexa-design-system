/**
 * FxDataManagementToolbar showcase. Passes a real FilterField[] / SavedFilter[]
 * / ToolbarColumn[] so the strip renders a full command row statically (the
 * composed overlays are mounted-gated portals). `ToolbarColumn` and the density
 * union come from shared enums / local prop types (no re-typed §5 union here).
 */
import { createElement } from 'react';
import type { ShowcaseSpec } from '../showcase-types';
import {
  FxDataManagementToolbar,
  type ToolbarColumn,
} from './data-management-toolbar';
import { FxButton } from '../button/button';
import { FxIcon } from '../icon/FxIcon';
import type { FilterField, FilterValue } from '../advanced-filters/advanced-filters';
import type { SavedFilter } from '../saved-filters/saved-filters';

const noop = () => undefined;

const filterFields: FilterField[] = [
  {
    key: 'status',
    label: 'Status',
    type: 'select',
    options: [
      { value: 'active', label: 'Active' },
      { value: 'paused', label: 'Paused' },
    ],
  },
  { key: 'name', label: 'Name', type: 'text' },
  { key: 'total', label: 'Order total', type: 'money' },
];

const filters: FilterValue[] = [{ field: 'status', operator: 'eq', value: 'active' }];

const savedFilters: SavedFilter[] = [
  { id: 'v1', name: 'All', filters: [], default: true },
  { id: 'v2', name: 'Flagged this week', filters: [], shared: true },
];

const columns: ToolbarColumn[] = [
  { key: 'id', label: 'ID', visible: true },
  { key: 'name', label: 'Name', visible: true },
  { key: 'status', label: 'Status', visible: true },
  { key: 'total', label: 'Total', visible: false },
];

const createAction = createElement(
  FxButton,
  { variant: 'primary', size: 'sm', iconStart: createElement(FxIcon, { name: 'plus', size: 16 }) },
  'Add user',
);

export const dataManagementToolbarShowcase: ShowcaseSpec = {
  name: 'DataManagementToolbar',
  slug: 'data-management-toolbar',
  category: 'admin',
  slice: 'U10',
  status: 'ready',
  tagline: 'The command strip above every admin collection: search, filters, saved views, columns, density, export.',
  component: FxDataManagementToolbar,
  interactive: true,
  variants: [
    {
      label: 'full strip',
      props: {
        search: '',
        searchPlaceholder: 'Search users…',
        onSearch: noop,
        filterFields,
        filters,
        onFilterChange: noop,
        savedFilters,
        activeSavedId: 'v2',
        canManageViews: true,
        onActiveSavedChange: noop,
        onSaveView: noop,
        columns,
        onColumnsChange: noop,
        density: 'compact',
        onDensityChange: noop,
        onExport: noop,
        onRefresh: noop,
        resultCount: 128,
        actions: createAction,
      },
      note: 'Search + Advanced Filters + Saved Filters + columns menu + density + export/refresh + create.',
    },
    {
      label: 'lite (search + filters)',
      props: {
        searchPlaceholder: 'Search listings…',
        onSearch: noop,
        filterFields,
        onFilterChange: noop,
      },
    },
    {
      label: 'comfortable density + result count',
      props: {
        onSearch: noop,
        filterFields,
        filters,
        onFilterChange: noop,
        columns,
        onColumnsChange: noop,
        density: 'comfortable',
        onDensityChange: noop,
        resultCount: 42,
      },
    },
    {
      label: 'search only',
      props: { searchPlaceholder: 'Search…', onSearch: noop },
    },
  ],
  props: [
    { name: 'search / onSearch', type: 'string / (q) => void', description: 'Controlled query + handler, passed to FxSearchBar (debounced server query).' },
    { name: 'filterFields', type: 'FilterField[]', description: 'Advanced-filters catalog; enables the filter region when set.' },
    { name: 'filters / onFilterChange', type: 'FilterValue[] / (f) => void', description: 'Applied conditions (controlled) + Apply/Clear handler.' },
    { name: 'savedFilters', type: 'SavedFilter[]', description: 'Saved views; enables the Saved Filters region when set.' },
    { name: 'columns / onColumnsChange', type: 'ToolbarColumn[] / (c) => void', description: 'Column-visibility set (checkable Context Menu).' },
    { name: 'density / onDensityChange', type: "Density / (d) => void", description: 'comfortable | compact toggle (omit handler to hide).' },
    { name: 'onExport / onRefresh', type: '() => void', description: 'Export current (filtered) results / refetch.' },
    { name: 'resultCount', type: 'number', description: 'Result total for the count line (omit to hide).' },
    { name: 'actions', type: 'ReactNode', description: 'Primary create Button slot (rightmost; at most one).' },
    { name: 'labels', type: 'Partial<DataManagementToolbarLabels>', description: 'i18n overrides (toolbar name, Columns, Density, Export…).' },
  ],
  events: [
    { name: 'onSearch', payload: '(query: string)', description: 'The search query changed (debounced server query).' },
    { name: 'onFilterChange', payload: '(filters: FilterValue[])', description: 'The applied filter set changed.' },
    { name: 'onColumnsChange', payload: '(columns: ToolbarColumn[])', description: 'A column was toggled visible/hidden.' },
    { name: 'onDensityChange', payload: '(density: Density)', description: 'The density toggle flipped.' },
  ],
  keyboard: [
    { keys: 'Tab', action: 'One tab stop enters the toolbar (APG toolbar pattern).' },
    { keys: 'Left / Right', action: 'Roving focus between the toolbar controls.' },
    { keys: 'Home / End', action: 'Jump to the first / last control.' },
  ],
  aria: [
    { attr: 'role="toolbar"', value: 'List controls', note: 'The control row is a labelled toolbar with one tab stop.' },
    { attr: 'aria-orientation', value: 'horizontal', note: 'Arrow-key roving is horizontal.' },
    { attr: 'aria-live="polite"', value: 'result count', note: 'The result-count line announces politely on change.' },
  ],
  contract: { doc: '04-component-bible.md', heading: 'FxDataManagementToolbar — Data Management Toolbar' },
};
