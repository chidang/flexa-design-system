/** Context Menu showcase — interactive; APG menu pattern in an SSR-safe portal. */
import { createElement } from 'react';
import type { ShowcaseSpec } from '../showcase-types';
import { FxContextMenu } from './context-menu';

const trigger = createElement(
  'button',
  { type: 'button', className: 'fx-button', 'data-variant': 'secondary', 'data-size': 'md' },
  'Actions',
);

const items = [
  { id: 'edit', label: 'Edit', icon: 'edit' as const, kbd: '⏎' },
  { id: 'duplicate', label: 'Duplicate', icon: 'package' as const, kbd: '⌘D' },
  { id: 'export', label: 'Export…', icon: 'download' as const },
  { id: 'sep', label: '', type: 'separator' as const },
  { id: 'delete', label: 'Delete…', icon: 'close' as const, tone: 'danger' as const },
];

export const contextMenuShowcase: ShowcaseSpec = {
  name: 'Context Menu',
  slug: 'context-menu',
  category: 'navigation',
  slice: 'U4',
  status: 'ready',
  interactive: true,
  tagline: 'A contextual action list — the engine behind ⋯ and dropdown menus.',
  component: FxContextMenu,
  variants: [
    { label: 'dropdown', props: { trigger, items } },
    {
      label: 'with disabled item',
      props: {
        trigger,
        items: [items[0], { ...items[1], disabled: true }, items[2], items[3], items[4]],
      },
    },
    {
      label: 'with group label',
      props: {
        trigger,
        items: [{ id: 'g', label: 'Manage', type: 'label' as const }, ...items],
      },
    },
  ],
  props: [
    { name: 'items', type: 'MenuItem[]', required: true, description: 'Menu entries (item / separator / label; danger tone).' },
    { name: 'trigger', type: 'ReactElement', required: true, description: 'The trigger button; cloned to receive menu wiring.' },
    { name: 'open / defaultOpen', type: 'boolean', description: 'Controlled / uncontrolled open state (§1.5).' },
    { name: 'ariaLabel', type: 'string', default: "'Menu'", description: 'Accessible name for the menu (i18n).' },
  ],
  events: [
    { name: 'onSelect', payload: 'MenuItem', description: 'Item activated (closes the menu).' },
    { name: 'onOpenChange', payload: 'boolean', description: 'Open state changed.' },
  ],
  keyboard: [
    { keys: 'Enter · Space · ↓', action: 'Open from trigger, focus first item (↑ = last)' },
    { keys: '↑ / ↓', action: 'Move focus, wrapping (roving tabindex)' },
    { keys: 'Home · End', action: 'Focus first / last item' },
    { keys: 'Enter · Space', action: 'Activate the focused item' },
    { keys: 'Esc', action: 'Close and restore focus to the trigger' },
    { keys: 'Tab', action: 'Close and move on' },
  ],
  aria: [
    { attr: 'role', value: "'menu' / 'menuitem'", note: 'On the list and items.' },
    { attr: 'aria-haspopup', value: "'menu'", note: 'On the trigger.' },
    { attr: 'aria-expanded', value: 'boolean', note: 'On the trigger.' },
    { attr: 'aria-disabled', value: 'true', note: 'On disabled items (stay focusable).' },
  ],
  contract: { doc: '04-component-bible.md', heading: 'FxContextMenu' },
};
