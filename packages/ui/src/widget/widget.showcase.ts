/**
 * Widget showcase spec. `menuItems` reuse the shared `MenuItem` shape from
 * FxContextMenu (documented in `props` as a type string). The overflow menu is
 * portal-gated, so it renders nothing server-side — the a11y gate covers the
 * labelled trigger + drag handle. No `enums` map entry.
 */
import { createElement } from 'react';
import type { ShowcaseSpec } from '../showcase-types';
import { FxWidget } from './widget';

const body = createElement(
  'p',
  { style: { margin: 0 } },
  'Any dashboard content sits inside the widget body.',
);

const menuItems = [
  { id: 'refresh', label: 'Refresh', icon: 'refresh' as const },
  { id: 'configure', label: 'Configure', icon: 'settings' as const },
  { id: 'sep', type: 'separator' as const, label: '' },
  { id: 'remove', label: 'Remove', icon: 'close' as const, tone: 'danger' as const },
];

export const widgetShowcase: ShowcaseSpec = {
  name: 'Widget',
  slug: 'widget',
  category: 'layouts',
  slice: 'U7',
  status: 'ready',
  interactive: true,
  tagline: 'Standard dashboard-block chrome — header, overflow menu, built-in states.',
  component: FxWidget,
  variants: [
    { label: 'basic', props: { title: 'Sales', children: body } },
    { label: 'with menu', props: { title: 'Traffic', menuItems, children: body } },
    { label: 'draggable', props: { title: 'Pinned', draggable: true, menuItems, children: body } },
    { label: 'refreshed at', props: { title: 'Live feed', refreshedAt: new Date(Date.now() - 3 * 60_000).toISOString(), children: body } },
    { label: 'loading', props: { title: 'Loading', loading: true } },
    { label: 'error + retry', props: { title: 'Revenue', error: 'Could not load data.', onRetry: () => {} } },
    { label: 'empty', props: { title: 'Tasks', empty: { title: 'Nothing here yet', description: 'New tasks will appear in this widget.', icon: 'check' } } },
  ],
  props: [
    { name: 'title', type: 'string', required: true, description: 'Widget title.' },
    { name: 'children', type: 'ReactNode', description: 'Dashboard content (the widget body).' },
    { name: 'menuItems', type: 'MenuItem[]', description: 'Overflow "⋯" menu items (refresh / configure / remove).' },
    { name: 'onMenuSelect', type: '(item: MenuItem) => void', description: 'Menu selection handler.' },
    { name: 'loading', type: 'boolean', default: 'false', description: 'Skeleton body + aria-busy.' },
    { name: 'error', type: 'string', description: 'Inline error — renders an FxAlert (danger) + retry when onRetry given.' },
    { name: 'onRetry', type: '() => void', description: 'Retry handler for the error state.' },
    { name: 'empty', type: '{ title: string; description?: string; icon?: IconName }', description: 'Zero-data surface (FxEmptyState).' },
    { name: 'draggable', type: 'boolean', default: 'false', description: 'Show a drag handle (Dashboard Layout editable mode).' },
    { name: 'refreshedAt', type: 'string', description: 'ISO timestamp — renders an "Updated <relative>" caption.' },
    { name: 'retryLabel', type: 'string', default: "'Retry'", description: 'Retry button label.' },
    { name: 'menuLabel', type: 'string', default: "'Widget options'", description: 'Accessible label for the overflow menu + trigger.' },
    { name: 'dragLabel', type: 'string', default: "'Drag to reorder'", description: 'Accessible label for the drag handle.' },
  ],
  aria: [
    { attr: 'aria-roledescription', value: 'Draggable widget', note: 'On the drag handle (Dashboard Layout editable mode).' },
    { attr: 'aria-busy', value: 'true', note: 'On the body while loading.' },
    { attr: 'aria-label', value: 'menuLabel', note: 'On the overflow "⋯" trigger button.' },
  ],
  contract: { doc: '04-component-bible.md', heading: 'FxWidget — Widget' },
};
