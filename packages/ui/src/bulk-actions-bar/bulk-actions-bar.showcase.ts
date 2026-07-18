/**
 * FxBulkActionsBar showcase spec. No shared unions are used, so `enums` is
 * omitted; the `BulkAction` / `tone: 'danger'` shapes are documented in `props`.
 */
import type { ShowcaseSpec } from '../showcase-types';
import { FxBulkActionsBar } from './bulk-actions-bar';

const ACTIONS = [
  { id: 'export', label: 'Export', icon: 'download' as const },
  { id: 'tag', label: 'Tag', icon: 'tag' as const },
  { id: 'archive', label: 'Archive', icon: 'package' as const },
  { id: 'delete', label: 'Delete', icon: 'close' as const, tone: 'danger' as const },
];

const MANY = [
  ...ACTIONS,
  { id: 'duplicate', label: 'Duplicate', icon: 'plus' as const },
  { id: 'move', label: 'Move', icon: 'external-link' as const },
];

const noop = () => {};

export const bulkActionsBarShowcase: ShowcaseSpec = {
  name: 'BulkActionsBar',
  slug: 'bulk-actions-bar',
  category: 'data',
  slice: 'U6',
  status: 'ready',
  interactive: true,
  tagline: 'Selection toolbar — count, select-all-matching, actions + overflow.',
  component: FxBulkActionsBar,
  variants: [
    { label: 'default (3 selected)', props: { selectedCount: 3, actions: ACTIONS, onAction: noop, onClearSelection: noop } },
    { label: 'with destructive', props: { selectedCount: 5, actions: ACTIONS, onAction: noop, onClearSelection: noop }, note: 'Delete = danger' },
    { label: 'select-all-matching', props: { selectedCount: 25, totalCount: 1240, actions: ACTIONS, onAction: noop, onClearSelection: noop, onSelectAllMatching: noop }, note: 'Virtual Table "*" contract' },
    { label: 'all matching selected', props: { selectedCount: 1240, totalCount: 1240, actions: ACTIONS, onAction: noop, onClearSelection: noop, onSelectAllMatching: noop, allMatchingSelected: true } },
    { label: 'overflow menu', props: { selectedCount: 8, actions: MANY, onAction: noop, onClearSelection: noop }, note: '4 inline + overflow' },
    { label: 'disabled action', props: { selectedCount: 2, actions: [{ id: 'export', label: 'Export', icon: 'download', disabled: true }, ...ACTIONS.slice(1)], onAction: noop, onClearSelection: noop } },
    { label: 'single selected', props: { selectedCount: 1, actions: ACTIONS, onAction: noop, onClearSelection: noop } },
    { label: 'hidden (no selection)', props: { selectedCount: 0, actions: ACTIONS, onAction: noop, onClearSelection: noop }, note: 'Renders nothing' },
  ],
  props: [
    { name: 'selectedCount', type: 'number', required: true, description: 'Selection size. The bar renders only when > 0.' },
    { name: 'totalCount', type: 'number', description: 'Total matching count — enables "Select all {total}".' },
    { name: 'actions', type: '{ id; label; icon?; tone?: "danger"; disabled? }[]', required: true, description: 'First `maxInline` render inline; the rest go to overflow.' },
    { name: 'maxInline', type: 'number', default: '4', description: 'Max inline buttons before overflow.' },
    { name: 'onAction', type: '(id) => void | Promise', required: true, description: 'Async drives a per-action busy state.' },
    { name: 'onClearSelection', type: '() => void', required: true, description: 'Clear × affordance.' },
    { name: 'onSelectAllMatching', type: '() => void', description: 'Virtual Table "*" select-all-matching contract.' },
    { name: 'allMatchingSelected', type: 'boolean', default: 'false', description: 'Hides the select-all affordance when the full set is selected.' },
    { name: 'labels', type: '{ selected; selectAll; clear; toolbar; more }', description: 'i18n strings.' },
  ],
  events: [
    { name: 'onAction', payload: '(id: string)', description: 'Action clicked; destructive should gate a Confirmation Dialog.' },
    { name: 'onClearSelection', payload: '()', description: 'Clear the selection.' },
    { name: 'onSelectAllMatching', payload: '()', description: 'Select every matching row (server-side).' },
  ],
  keyboard: [
    { keys: 'Tab / Shift+Tab', action: 'Move between toolbar controls' },
    { keys: 'Enter / Space', action: 'Activate the focused action' },
  ],
  aria: [
    { attr: 'role', value: 'toolbar', note: 'Labelled by the selection count.' },
    { attr: 'role', value: 'status', note: 'Count changes announce politely.' },
    { attr: 'aria-haspopup', value: 'menu', note: 'On the overflow trigger.' },
    { attr: 'aria-busy', value: 'true', note: 'On the action running its async handler.' },
  ],
  contract: { doc: '04-component-bible.md', heading: 'FxBulkActionsBar' },
};
