/**
 * FxSavedFilters showcase. The views Select + save action + manage "⋯" trigger
 * render statically (the name Dialog / manage menu / delete Confirmation are
 * mounted-gated portals), so the first variant carries non-empty a11y markup.
 * `SavedSort.dir` is a local prop-type string (no §5 shared union).
 */
import type { ShowcaseSpec } from '../showcase-types';
import { FxSavedFilters, type SavedFilter } from './saved-filters';
import type { FilterValue } from '../advanced-filters/advanced-filters';

const noop = () => undefined;

const current: FilterValue[] = [{ field: 'status', operator: 'eq', value: 'active' }];

const views: SavedFilter[] = [
  {
    id: 'v1',
    name: 'All',
    filters: [],
    default: true,
  },
  {
    id: 'v2',
    name: 'Flagged this week',
    filters: [{ field: 'flagged', operator: 'eq', value: true }],
    sort: { key: 'created', dir: 'desc' },
    shared: true,
  },
  {
    id: 'v3',
    name: 'High-value disputes',
    filters: [{ field: 'total', operator: 'gte', value: '500' }],
    columns: ['id', 'total', 'status'],
  },
];

export const savedFiltersShowcase: ShowcaseSpec = {
  name: 'SavedFilters',
  slug: 'saved-filters',
  category: 'admin',
  slice: 'U10',
  status: 'ready',
  tagline: 'Named, reusable filter+sort+column views with save, rename, default and delete.',
  component: FxSavedFilters,
  interactive: true,
  variants: [
    {
      label: 'manage enabled',
      props: { views, activeId: 'v2', currentFilters: current, canManage: true, onActiveChange: noop, onSave: noop, onRename: noop, onDelete: noop, onSetDefault: noop },
      note: 'The ⋯ menu offers Rename / Set default / Delete; delete opens a Confirmation Dialog.',
    },
    {
      label: 'read-only (no manage)',
      props: { views, activeId: 'v1', currentFilters: current, canManage: false, onActiveChange: noop, onSave: noop },
    },
    {
      label: 'no active view',
      props: { views, activeId: null, currentFilters: current, onActiveChange: noop, onSave: noop },
    },
    {
      label: 'empty',
      props: { views: [], currentFilters: current, onSave: noop },
      note: 'Reads "No saved views yet" — filter, then Save current view.',
    },
  ],
  props: [
    { name: 'views', type: 'SavedFilter[]', required: true, description: 'SavedFilter = { id; name; filters: FilterValue[]; sort?; columns?; default?; shared? }.' },
    { name: 'activeId', type: 'string | null', description: 'Controlled active view id (§1.5).' },
    { name: 'onActiveChange', type: '(id: string | null) => void', description: 'A view was applied (or cleared).' },
    { name: 'onSave', type: '(name: string, filters: FilterValue[]) => void', description: 'Save the current filters as a new named view.' },
    { name: 'currentFilters', type: 'FilterValue[]', default: '[]', description: 'The live builder filters captured on Save.' },
    { name: 'onRename', type: '(id: string, name: string) => void', description: 'Rename a view.' },
    { name: 'onDelete', type: '(id: string) => void', description: 'Delete a view (routes through a Confirmation Dialog).' },
    { name: 'onSetDefault', type: '(id: string) => void', description: 'Mark a view as the default.' },
    { name: 'canManage', type: 'boolean', default: 'false', description: 'Whether rename / delete / set-default affordances show.' },
    { name: 'labels', type: 'Partial<SavedFiltersLabels>', description: 'i18n overrides (menu items, dialog titles, empty state…).' },
  ],
  events: [
    { name: 'onActiveChange', payload: '(id: string | null)', description: 'A saved view was applied or cleared.' },
    { name: 'onSave', payload: '(name, filters)', description: 'A new view was saved from the name Dialog.' },
    { name: 'onDelete', payload: '(id)', description: 'A view was deleted after confirmation.' },
  ],
  keyboard: [
    { keys: 'Enter / Space', action: 'Open the views Select or the manage menu.' },
    { keys: 'Up / Down', action: 'Move through the manage menu items.' },
    { keys: 'Enter', action: 'Submit the save / rename name field.' },
    { keys: 'Esc', action: 'Close the Select, menu, or dialog.' },
  ],
  aria: [
    { attr: 'aria-label', value: 'Manage views', note: 'Names the icon-only ⋯ manage trigger.' },
    { attr: 'role="menu"', value: 'manage', note: 'Rename / Set default / Delete render in an APG menu.' },
    { attr: 'role="alertdialog"', value: 'delete', note: 'Delete confirmation is a danger-tone alertdialog with the view name.' },
  ],
  contract: { doc: '04-component-bible.md', heading: 'FxSavedFilters — Saved Filters' },
};
