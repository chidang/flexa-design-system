/**
 * FxDashboardLayout showcase — a 12-col widget grid rendering FxCard children as
 * grid items (each wrapping its own span). The `gap` prop is a component-local
 * token-choice union documented in `props`, not a shared enum, so `enums` is
 * omitted.
 */
import { createElement } from 'react';
import type { ShowcaseSpec } from '../showcase-types';
import { FxCard } from '../card/card';
import { FxDashboardLayout } from './dashboard-layout';

/** A grid item = a span wrapper around an FxCard. */
function widget(span: number, title: string, key: string) {
  return createElement(
    'div',
    { key, style: { gridColumn: `span ${span}` } },
    createElement(FxCard, { title, padding: 'md' }, `${span}-col widget`),
  );
}

const items = [
  widget(3, 'Revenue', 'a'),
  widget(3, 'Orders', 'b'),
  widget(3, 'Refunds', 'c'),
  widget(3, 'Payouts', 'd'),
  widget(6, 'Sales trend', 'e'),
  widget(6, 'Recent activity', 'f'),
  widget(12, 'Disputes queue', 'g'),
];

const header = createElement('h2', null, 'Dashboard');

export const dashboardLayoutShowcase: ShowcaseSpec = {
  name: 'FxDashboardLayout',
  slug: 'dashboard-layout',
  category: 'layouts',
  slice: 'U7',
  status: 'ready',
  interactive: false,
  tagline: 'A 12-column dashboard grid; children set their own 3/4/6/12 span.',
  component: FxDashboardLayout,
  variants: [
    { label: 'default (12-col, gap space.5)', props: { header, children: items } },
    { label: 'tighter gap (space.4)', props: { header, children: items, gap: 'space.4' } },
    { label: 'roomier gap (space.6)', props: { header, children: items, gap: 'space.6' } },
    { label: 'editable mode (flag)', props: { header, children: items, editable: true } },
    { label: 'no header', props: { children: items } },
  ],
  props: [
    { name: 'children', type: 'ReactNode', required: true, description: 'Grid items; each wraps its own column span.' },
    { name: 'header', type: 'ReactNode', description: 'Optional header above the grid.' },
    { name: 'columns', type: 'number', default: '12', description: 'Column-track count.' },
    {
      name: 'gap',
      type: "'space.4' | 'space.5' | 'space.6'",
      default: "'space.5'",
      description: 'Grid gap token.',
    },
    { name: 'editable', type: 'boolean', default: 'false', description: 'Drag-rearrange mode flag (v1: class/data only).' },
  ],
  events: [
    { name: 'onLayoutChange', payload: '(layout)', description: 'Reserved — fired when the layout changes in editable mode.' },
  ],
  contract: { doc: '04-component-bible.md', heading: 'FxDashboardLayout' },
};
