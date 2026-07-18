/**
 * List showcase spec. Component unions (`'none' | 'single' | 'multi'`) live in
 * the component file and are documented in `props` as type strings — no shared
 * enum applies, so `enums` is omitted.
 */
import type { ShowcaseSpec } from '../showcase-types';
import { FxList } from './list';

const ITEMS = [
  { key: 'inbox', title: 'Inbox', description: 'Unread messages' },
  { key: 'drafts', title: 'Drafts', description: 'Not yet sent' },
  { key: 'sent', title: 'Sent', description: 'Delivered mail' },
  { key: 'archive', title: 'Archive', description: 'Older threads', disabled: true },
];

const WITH_META = [
  { key: 'ada', title: 'Ada Lovelace', description: 'ada@example.com', meta: '2h ago' },
  { key: 'alan', title: 'Alan Turing', description: 'alan@example.com', meta: '1d ago' },
  { key: 'grace', title: 'Grace Hopper', description: 'grace@example.com', meta: '3d ago' },
];

const LINKS = [
  { key: 'home', title: 'Home', href: '#home' },
  { key: 'docs', title: 'Documentation', href: '#docs' },
  { key: 'blog', title: 'Blog', href: '#blog' },
];

export const listShowcase: ShowcaseSpec = {
  name: 'List',
  slug: 'list',
  category: 'data',
  slice: 'U6',
  status: 'ready',
  interactive: true,
  tagline: 'Vertical item list — plain, divided, or a single/multi listbox.',
  component: FxList,
  variants: [
    { label: 'plain', props: { items: ITEMS.slice(0, 3), 'aria-label': 'Folders' } },
    { label: 'divided', props: { items: ITEMS.slice(0, 3), divided: true, 'aria-label': 'Folders' } },
    { label: 'with meta', props: { items: WITH_META, divided: true, 'aria-label': 'People' } },
    { label: 'links (DOM tab order)', props: { items: LINKS, 'aria-label': 'Navigation' } },
    {
      label: 'single-select listbox',
      props: { items: ITEMS, selectable: 'single', defaultSelectedKeys: ['inbox'], 'aria-label': 'Folders' },
    },
    {
      label: 'multi-select listbox',
      props: {
        items: ITEMS,
        selectable: 'multi',
        divided: true,
        defaultSelectedKeys: ['inbox', 'sent'],
        'aria-label': 'Folders',
      },
    },
    {
      label: 'disabled item',
      props: { items: ITEMS, selectable: 'single', 'aria-label': 'Folders' },
    },
    {
      label: 'renderItem',
      props: {
        items: WITH_META,
        'aria-label': 'People',
        renderItem: (item: { title: string; meta?: string }) => `${item.title} — ${item.meta ?? ''}`,
      },
    },
  ],
  props: [
    { name: 'items', type: 'ListItem[]', required: true, description: 'ListItem = { key; title; description?; media?; meta?; disabled?; href? }.' },
    { name: 'selectable', type: "'none' | 'single' | 'multi'", default: "'none'", description: 'single/multi ⇒ role="listbox" + aria-selected.' },
    { name: 'selectedKeys / defaultSelectedKeys', type: 'Key[]', default: '— / []', description: 'Selection set (§1.5).' },
    { name: 'divided', type: 'boolean', default: 'false', description: 'Hairline separators between rows.' },
    { name: 'renderItem', type: '(item, state) => Node', description: 'Full custom row; state = { selected, active, disabled }.' },
  ],
  events: [
    { name: 'onSelect', payload: '(item: ListItem)', description: 'Row activation (Enter / click).' },
    { name: 'onSelectionChange', payload: '(keys: Key[])', description: 'Selection set changed (listbox mode).' },
  ],
  keyboard: [
    { keys: 'Tab', action: 'Plain: DOM order to links / actions. Listbox: single tab stop.' },
    { keys: '↓ / ↑', action: 'Listbox: move the roving option' },
    { keys: 'Home / End', action: 'First / last option' },
    { keys: 'Space / Enter', action: 'Select / toggle the active option' },
    { keys: 'A–Z', action: 'Typeahead on title (500ms buffer)' },
  ],
  aria: [
    { attr: 'role', value: 'list | listbox', note: 'listbox in single/multi mode.' },
    { attr: 'aria-multiselectable', value: 'true', note: 'multi mode.' },
    { attr: 'aria-selected', value: 'true | false', note: 'On options.' },
    { attr: 'tabindex', value: '0 | -1', note: 'Roving; one tab stop.' },
  ],
  contract: { doc: '04-component-bible.md', heading: 'FxList' },
};
