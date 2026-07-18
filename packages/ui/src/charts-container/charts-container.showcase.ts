/**
 * ChartsContainer showcase spec. Legend tones reference the shared `Tone` union
 * indirectly (documented in `props` as a type string); the container standardizes
 * chrome around a host chart it never renders itself. No `enums` map entry — the
 * `legend[].tone` field is documented in `props`.
 */
import { createElement } from 'react';
import type { ShowcaseSpec } from '../showcase-types';
import { FxChartsContainer } from './charts-container';

/** A stand-in chart canvas (the kit ships no chart engine). */
const fakeChart = createElement(
  'div',
  { style: { padding: '24px', textAlign: 'center', color: 'var(--fx-color-text-muted)' } },
  'Host chart renders here',
);

/** A stand-in accessible data table alternative. */
const fakeTable = createElement(
  'table',
  null,
  createElement(
    'caption',
    null,
    'Revenue by month',
  ),
  createElement(
    'tbody',
    null,
    createElement('tr', null, createElement('th', { scope: 'row' }, 'Jan'), createElement('td', null, '$12k')),
    createElement('tr', null, createElement('th', { scope: 'row' }, 'Feb'), createElement('td', null, '$15k')),
  ),
);

export const chartsContainerShowcase: ShowcaseSpec = {
  name: 'ChartsContainer',
  slug: 'charts-container',
  category: 'layouts',
  slice: 'U7',
  status: 'ready',
  interactive: true,
  tagline: 'Standardized chrome around a host chart — legend, loading, empty, a11y table.',
  component: FxChartsContainer,
  variants: [
    { label: 'chart + legend', props: { title: 'Revenue', description: 'Last 6 months', legend: [{ label: 'Gross' }, { label: 'Net' }], canvasLabel: 'Revenue trending up over six months', children: fakeChart } },
    { label: 'with table toggle', props: { title: 'Traffic', legend: [{ label: 'Visits' }], canvasLabel: 'Traffic by month', children: fakeChart, tableAlternative: fakeTable } },
    { label: 'loading', props: { title: 'Loading', loading: true } },
    { label: 'empty', props: { title: 'Conversions', empty: { title: 'No data yet', description: 'Data appears once you have traffic.', icon: 'chart' } } },
    { label: 'all series tones', props: { title: 'Breakdown', legend: [{ label: 'A' }, { label: 'B' }, { label: 'C' }, { label: 'D' }, { label: 'E' }], canvasLabel: 'Five-series breakdown', children: fakeChart } },
  ],
  props: [
    { name: 'title', type: 'string', required: true, description: 'Panel title.' },
    { name: 'description', type: 'string', description: 'Supporting line under the title.' },
    { name: 'legend', type: '{ label: string; tone?: Tone }[]', description: 'Series legend; fixed series-order tones when tone omitted.' },
    { name: 'actions', type: 'ReactNode', description: 'Header actions slot — range select, export menu.' },
    { name: 'loading', type: 'boolean', default: 'false', description: 'Skeleton rect in the canvas.' },
    { name: 'empty', type: '{ title: string; description?: string; icon?: IconName }', description: 'Zero-data surface (renders FxEmptyState when set and not loading).' },
    { name: 'canvasLabel', type: 'string', description: 'Accessible summary for the role="img" canvas.' },
    { name: 'tableAlternative', type: 'ReactNode', description: 'Accessible data table; enables the "View as table" toggle.' },
    { name: 'showTable', type: 'boolean', description: 'Controlled table toggle state.' },
    { name: 'defaultShowTable', type: 'boolean', default: 'false', description: 'Uncontrolled initial toggle state.' },
    { name: 'tableToggleLabel', type: 'string', default: "'View as table'", description: 'Toggle label (canvas → table).' },
    { name: 'chartToggleLabel', type: 'string', default: "'View as chart'", description: 'Toggle label (table → canvas).' },
  ],
  aria: [
    { attr: 'role', value: 'img', note: 'On the canvas wrapper, with aria-label = canvasLabel (chart summary).' },
    { attr: 'aria-pressed', value: 'true | false', note: 'On the "View as table" toggle button.' },
  ],
  contract: { doc: '04-component-bible.md', heading: 'FxChartsContainer — Charts Container' },
};
