/**
 * FxSplitView showcase — a resizable master-detail shell. Component-specific
 * shapes (list/detail are arbitrary Nodes) are documented in `props`; the only
 * shared vocabulary is none (collapse is a component-local union), so `enums` is
 * omitted per the shared-union rule.
 */
import { createElement } from 'react';
import type { ShowcaseSpec } from '../showcase-types';
import { FxSplitView } from './split-view';

const list = createElement(
  'div',
  { style: { padding: '12px' } },
  createElement('strong', { key: 'h' }, 'Conversations'),
  createElement('p', { key: 'a' }, 'Ada Lovelace'),
  createElement('p', { key: 'g' }, 'Grace Hopper'),
);

const detail = createElement(
  'div',
  { style: { padding: '12px' } },
  createElement('h2', { key: 'h' }, 'Ada Lovelace'),
  createElement('p', { key: 'b' }, 'Select a conversation to read the thread.'),
);

export const splitViewShowcase: ShowcaseSpec = {
  name: 'FxSplitView',
  slug: 'split-view',
  category: 'layouts',
  slice: 'U7',
  status: 'ready',
  interactive: true,
  tagline: 'A resizable master-detail two-pane shell with a draggable separator.',
  component: FxSplitView,
  variants: [
    { label: 'default (list 320px)', props: { list, detail } },
    { label: 'wide list', props: { list, detail, defaultListWidth: 400 } },
    { label: 'narrow list', props: { list, detail, defaultListWidth: 280 } },
    { label: 'collapsed to list (mobile)', props: { list, detail, collapsed: 'list' } },
    { label: 'collapsed to detail (back button)', props: { list, detail, collapsed: 'detail' } },
  ],
  props: [
    { name: 'list', type: 'ReactNode', required: true, description: 'Master pane content.' },
    { name: 'detail', type: 'ReactNode', required: true, description: 'Detail pane content.' },
    {
      name: 'listWidth',
      type: 'number',
      description: 'Controlled list width (px). Omit for uncontrolled (tracks internally).',
    },
    { name: 'defaultListWidth', type: 'number', default: '320', description: 'Initial px width when uncontrolled.' },
    { name: 'minListWidth', type: 'number', default: '280', description: 'Lower clamp (px).' },
    { name: 'maxListWidth', type: 'number', default: '400', description: 'Upper clamp (px).' },
    {
      name: 'collapsed',
      type: "'none' | 'list' | 'detail'",
      default: "'none'",
      description: 'Mobile single-pane view; detail shows a back button.',
    },
    { name: 'separatorLabel', type: 'string', default: "'Resize panes'", description: 'Accessible name for the separator.' },
    { name: 'backLabel', type: 'string', default: "'Back'", description: 'Detail-pane back button label (collapsed).' },
  ],
  events: [
    { name: 'onListWidthChange', payload: '(width: number)', description: 'Fired on every drag/keyboard resize.' },
    { name: 'onBack', payload: '()', description: 'Mobile back button pressed / Enter on the separator.' },
  ],
  keyboard: [
    { keys: 'Tab', action: 'Focus the resize separator' },
    { keys: '← / →', action: 'Resize the list pane in 16px steps' },
    { keys: 'Enter', action: 'Toggle the collapsed pane (surfaces via onBack)' },
  ],
  aria: [
    { attr: 'role', value: 'separator', note: 'On the resize handle.' },
    { attr: 'aria-orientation', value: 'vertical', note: 'Vertical divider between panes.' },
    { attr: 'aria-valuenow', value: '<px>', note: 'Current list width; with aria-valuemin/max.' },
  ],
  contract: { doc: '04-component-bible.md', heading: 'FxSplitView' },
};
