/**
 * FxKanbanBoard showcase spec. Component-specific shapes (KanbanColumn /
 * KanbanCard / CardMovePayload) are documented in `props` as type strings; only
 * the shared `tone` union (from `../enums`) appears in `enums`.
 */
import { createElement } from 'react';
import type { ShowcaseSpec } from '../showcase-types';
import { TONES } from '../enums';
import { FxKanbanBoard, type KanbanColumn, type KanbanCard } from './kanban-board';

const COLUMNS: KanbanColumn[] = [
  { id: 'todo', title: 'To do' },
  { id: 'doing', title: 'In progress' },
  { id: 'done', title: 'Done' },
];

const CARDS: KanbanCard[] = [
  { id: 'c1', columnId: 'todo', title: 'Draft escrow terms', order: 0 },
  { id: 'c2', columnId: 'todo', title: 'Design payout flow', order: 1 },
  { id: 'c3', columnId: 'doing', title: 'Wire dispute API', order: 0 },
  { id: 'c4', columnId: 'done', title: 'Ship onboarding', order: 0 },
];

const LIMITED: KanbanColumn[] = [
  { id: 'todo', title: 'Backlog', limit: 5 },
  { id: 'doing', title: 'In progress', limit: 2, tone: 'info' },
  { id: 'done', title: 'Done', tone: 'success' },
];

const OVER_CARDS: KanbanCard[] = [
  { id: 'c1', columnId: 'todo', title: 'Draft escrow terms', order: 0 },
  { id: 'd1', columnId: 'doing', title: 'Wire dispute API', order: 0 },
  { id: 'd2', columnId: 'doing', title: 'Refund edge cases', order: 1 },
  { id: 'd3', columnId: 'doing', title: 'Payout retries', order: 2 },
  { id: 'c4', columnId: 'done', title: 'Ship onboarding', order: 0 },
];

const RICH_CARDS: KanbanCard[] = [
  {
    id: 'r1',
    columnId: 'todo',
    title: 'Resolve dispute #4821',
    description: 'Buyer claims item not as described.',
    assignee: { name: 'Ada Lovelace' },
    badges: [
      { tone: 'danger', appearance: 'subtle', size: 'sm', children: 'urgent' },
      { tone: 'info', appearance: 'outline', size: 'sm', children: 'dispute' },
    ],
    order: 0,
  },
  {
    id: 'r2',
    columnId: 'doing',
    title: 'Verify seller payout',
    assignee: { name: 'Grace Hopper' },
    badges: [{ tone: 'warning', appearance: 'subtle', size: 'sm', children: 'review' }],
    order: 0,
  },
  { id: 'r3', columnId: 'done', title: 'Approve listing', order: 0 },
];

const EMPTY_COLS: KanbanColumn[] = [
  { id: 'todo', title: 'To do' },
  { id: 'doing', title: 'In progress' },
  { id: 'blocked', title: 'Blocked' },
];

const EMPTY_CARDS: KanbanCard[] = [
  { id: 'c1', columnId: 'todo', title: 'Draft escrow terms', order: 0 },
  { id: 'c3', columnId: 'doing', title: 'Wire dispute API', order: 0 },
];

const MENU_ITEMS = [
  { id: 'rename', label: 'Rename column', icon: 'edit' as const },
  { id: 'clear', label: 'Clear cards', icon: 'refresh' as const },
  { id: 'delete', label: 'Delete column', icon: 'close' as const, tone: 'danger' as const },
];

const priorityRender = (card: KanbanCard) =>
  createElement(
    'div',
    null,
    createElement('strong', { key: 't' }, card.title),
    createElement('div', { key: 'o' }, `Priority #${card.order + 1}`),
  );

export const kanbanBoardShowcase: ShowcaseSpec = {
  name: 'FxKanbanBoard',
  slug: 'kanban-board',
  category: 'data',
  slice: 'U6',
  status: 'ready',
  interactive: true,
  tagline: 'A board of columns holding draggable cards with a keyboard drag protocol.',
  component: FxKanbanBoard,
  variants: [
    { label: 'default 3-column board', props: { columns: COLUMNS, cards: CARDS } },
    { label: 'columns with count badge', props: { columns: LIMITED, cards: CARDS } },
    { label: 'over-limit column (danger count)', props: { columns: LIMITED, cards: OVER_CARDS } },
    {
      label: 'cards with assignee + badges',
      props: { columns: COLUMNS, cards: RICH_CARDS },
    },
    { label: 'empty column', props: { columns: EMPTY_COLS, cards: EMPTY_CARDS } },
    {
      label: 'column overflow menu',
      props: { columns: COLUMNS, cards: CARDS, columnMenuItems: MENU_ITEMS },
    },
    {
      label: 'renderCard override',
      props: { columns: COLUMNS, cards: CARDS, renderCard: priorityRender },
    },
    {
      label: 'custom labels',
      props: {
        columns: COLUMNS,
        cards: CARDS,
        labels: { addCard: 'New task' },
      },
    },
  ],
  enums: { tone: TONES },
  props: [
    {
      name: 'columns',
      type: '{ id; title: string; limit?: number; tone?: Tone }[]',
      required: true,
      description: 'Ordered columns; over-limit count renders in color.danger.',
    },
    {
      name: 'cards',
      type: 'KanbanCard[]',
      required: true,
      description:
        'KanbanCard = { id; columnId; title; description?; assignee?: { name; avatarSrc? }; badges?: FxBadgeProps[]; order }. Controlled — the source of truth for positions.',
    },
    {
      name: 'columnMenuItems',
      type: 'MenuItem[]',
      description: 'Overflow-menu items per column; the "⋯" menu shows only when non-empty.',
    },
    {
      name: 'renderCard',
      type: '(card: KanbanCard) => ReactNode',
      description: 'Replace the default card body (title/description/assignee/badges).',
    },
    { name: 'addCardLabel', type: 'string', default: "'Add card'", description: 'Column footer add-button label (folded into labels.addCard).' },
    {
      name: 'labels',
      type: 'Partial<KanbanLabels>',
      default: 'DEFAULT_KANBAN_LABELS',
      description:
        'Every user-facing string: addCard, dragHandle, columnMenu, lifted, moved, cancelled (English defaults; {title}/{column}/{n} interpolated).',
    },
  ],
  events: [
    { name: 'onCardMove', payload: '({ cardId, from, to, index })', description: 'A card was dropped into a column at an index.' },
    { name: 'onCardClick', payload: '(card: KanbanCard)', description: 'A card was activated.' },
    { name: 'onColumnMenuSelect', payload: '(columnId, item: MenuItem)', description: 'A column overflow-menu item was chosen.' },
    { name: 'onAddCard', payload: '(columnId: string)', description: 'The column footer add-button was pressed.' },
  ],
  keyboard: [
    { keys: 'Tab', action: 'Move between card drag-handles (single logical flow)' },
    { keys: 'Space', action: 'On a handle: lift the card (or drop it if already lifted)' },
    { keys: '↑ / ↓', action: 'Lifted: move within column · idle: focus prev/next card' },
    { keys: '← / →', action: 'Lifted: move to adjacent column · idle: focus card across columns' },
    { keys: 'Esc', action: 'Cancel the in-flight drag, restoring the original position' },
  ],
  aria: [
    { attr: 'role', value: 'group', note: 'On each column, labelled by its header (aria-labelledby).' },
    { attr: 'aria-label', value: 'Drag {title}', note: 'On each card drag-handle button.' },
    { attr: 'aria-pressed', value: 'true', note: 'On a handle while its card is lifted.' },
    { attr: 'role', value: 'status', note: 'Polite live region announcing moves/drops/cancel.' },
  ],
  contract: { doc: '04-component-bible.md', heading: 'FxKanbanBoard' },
};
