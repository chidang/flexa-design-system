/** Pagination showcase — pure/RSC; host owns `page`, reports via onPageChange. */
import type { ShowcaseSpec } from '../showcase-types';
import { FxPagination } from './pagination';

export const paginationShowcase: ShowcaseSpec = {
  name: 'Pagination',
  slug: 'pagination',
  category: 'navigation',
  slice: 'U4',
  status: 'ready',
  interactive: false,
  tagline: 'Traverse a long collection in pages with position feedback.',
  component: FxPagination,
  variants: [
    { label: 'numbered (mid)', props: { page: 5, pageCount: 12 } },
    { label: 'numbered (first)', props: { page: 1, pageCount: 12 } },
    { label: 'numbered (last)', props: { page: 12, pageCount: 12 } },
    { label: 'with summary', props: { page: 2, pageCount: 62, total: 1204, pageSize: 20 } },
    { label: 'cursor (has more)', props: { page: 2, hasMore: true } },
    { label: 'cursor (end)', props: { page: 3, hasMore: false } },
  ],
  props: [
    { name: 'page', type: 'number', required: true, description: '1-based current page (host-owned).' },
    {
      name: 'pageCount',
      type: 'number',
      description: 'Total pages (offset mode). Omit + set hasMore for cursor mode.',
    },
    { name: 'hasMore', type: 'boolean', description: 'Cursor mode: whether a next page exists.' },
    { name: 'siblingCount', type: 'number', default: '1', description: 'Pages adjacent to current; gaps render as …' },
    { name: 'total / pageSize', type: 'number', description: 'Together enable the range summary line.' },
    {
      name: 'labels',
      type: '{ nav; prev; next; page; gotoPage; summary; perPage }',
      description: 'i18n strings; English defaults, {n}/{from}/{to}/{total} interpolated.',
    },
  ],
  events: [
    { name: 'onPageChange', payload: 'number', description: 'Requested 1-based page.' },
  ],
  keyboard: [
    { keys: 'Tab', action: 'Move between prev / page / next buttons in DOM order' },
    { keys: 'Enter · Space', action: 'Activate the focused page button' },
  ],
  aria: [
    { attr: 'aria-label', value: "labels.nav", note: 'On the nav landmark.' },
    { attr: 'aria-current', value: "'page'", note: 'On the current page button.' },
    { attr: 'aria-disabled', value: 'true', note: 'On prev/next at bounds (stay in tab order).' },
  ],
  contract: { doc: '04-component-bible.md', heading: 'FxPagination' },
};
