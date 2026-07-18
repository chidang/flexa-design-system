/**
 * FxConversationList showcase spec. Variants sweep the default inbox, the
 * `unread` filter, an active selection, an archivable list and an empty state.
 * No shared §5 union — the summary shape + filter are documented as type strings
 * in `props`.
 */
import type { ShowcaseSpec } from '../showcase-types';
import { FxConversationList } from './conversation-list';

const noop = () => undefined;

const now = Date.now();
const ago = (min: number) => new Date(now - min * 60000).toISOString();

const conversations = [
  {
    id: 'c1',
    participant: { id: 'p1', name: 'Clay & Co', avatarSrc: 'https://picsum.photos/seed/clay/64' },
    lastMessage: { body: 'Here is the shipping label for your order.', at: ago(4), self: false },
    unreadCount: 2,
    context: { kind: 'order' as const, label: '#1024' },
  },
  {
    id: 'c2',
    participant: { id: 'p2', name: 'Grace Hopper' },
    lastMessage: { body: 'Sounds good, thanks!', at: ago(90), self: true },
    unreadCount: 0,
    context: { kind: 'listing' as const, label: 'Ceramic mug' },
  },
  {
    id: 'c3',
    participant: { id: 'p3', name: 'Support', avatarSrc: 'https://picsum.photos/seed/support/64' },
    lastMessage: { body: 'Your dispute has been resolved in your favour.', at: ago(60 * 30), self: false },
    unreadCount: 1,
  },
];

export const conversationListShowcase: ShowcaseSpec = {
  name: 'ConversationList',
  slug: 'conversation-list',
  category: 'collaboration',
  slice: 'U9',
  status: 'ready',
  interactive: true,
  tagline: 'The inbox rail — searchable conversation rows with unread counts + snippets.',
  component: FxConversationList,
  variants: [
    { label: 'default', props: { conversations, onSelect: noop } },
    { label: 'active row', props: { conversations, activeKey: 'c1', onSelect: noop } },
    { label: 'filter: unread', props: { conversations, filter: 'unread', onSelect: noop } },
    { label: 'archivable', props: { conversations, onSelect: noop, onArchive: noop } },
    { label: 'empty', props: { conversations: [], emptyState: 'No conversations yet.' } },
  ],
  props: [
    { name: 'conversations', type: 'ConversationSummary[]', required: true, description: "ConversationSummary = { id; participant: PartyRef; lastMessage: { body; at; self }; unreadCount; context?: { kind: 'order' | 'listing'; label } }." },
    { name: 'activeKey', type: 'string', description: 'Currently open conversation (single-select listbox).' },
    { name: 'onSelect', type: '(conversation: ConversationSummary) => void', description: 'A row was activated.' },
    { name: 'onArchive', type: '(conversation: ConversationSummary) => void', description: 'When set, each row gets an archive button.' },
    { name: 'filter', type: "'all' | 'unread'", default: "'all'", description: 'Show all rows or only unread.' },
    { name: 'loading', type: 'boolean', default: 'false', description: 'Busy / skeleton state.' },
    { name: 'emptyState', type: 'ReactNode', description: 'Shown when the filtered list is empty.' },
    { name: 'labels', type: 'Partial<ConversationListLabels>', description: 'i18n overrides (search / unreadCount / you …).' },
  ],
  events: [
    { name: 'onSelect', payload: 'ConversationSummary', description: 'Row activated (Enter / click).' },
    { name: 'onArchive', payload: 'ConversationSummary', description: 'Archive button pressed.' },
  ],
  keyboard: [
    { keys: 'Tab', action: 'Move between the select + archive buttons of each row' },
    { keys: 'Enter / Space', action: 'Open the focused conversation (or archive it)' },
  ],
  aria: [
    { attr: 'role', value: 'list / listitem', note: 'Rows are a plain list; each holds a real select button (aria-current on the open one) and an optional archive button — no interactive nesting.' },
    { attr: 'aria-label', value: 'includes unread count', note: 'Unread rows carry a Badge with a visually-hidden "{count} unread" label.' },
    { attr: 'role', value: 'search', note: 'The header Search Bar is a search landmark.' },
  ],
  contract: { doc: '04-component-bible.md', heading: 'FxConversationList — Conversation List' },
};
