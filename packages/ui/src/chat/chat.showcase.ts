/**
 * FxChat showcase spec. The primary variant is a rich conversation — day
 * separators, self/other bubbles, a read receipt, a system event card, an
 * attachment, a typing indicator and a `failed` row with retry — which satisfies
 * the U9 exit criterion "Chat … incl. system event cards". A `disabled` variant
 * shows the locked-conversation banner. No shared §5 union — the message/status
 * shapes are documented as type strings in `props`.
 */
import type { ShowcaseSpec } from '../showcase-types';
import { FxChat } from './chat';

const noop = () => undefined;

const me = { id: 'me', name: 'Ada Lovelace', avatarSrc: 'https://picsum.photos/seed/ada/64' };
const peer = { id: 'peer', name: 'Clay & Co', avatarSrc: 'https://picsum.photos/seed/clay/64', href: '#store' };

const YESTERDAY = '2026-07-11T16:20:00Z';
const TODAY = '2026-07-12T09:00:00Z';

const richMessages = [
  { id: 'm1', author: peer, body: 'Hi Ada! Thanks for your order — packing it now.', at: YESTERDAY },
  { id: 's1', author: peer, body: 'Order #1024 was paid — escrow held.', at: YESTERDAY, kind: 'system' as const },
  { id: 'm2', author: me, body: 'Great, no rush. Could you add a gift note?', at: `${YESTERDAY.slice(0, 11)}16:25:00Z`, status: 'read' as const },
  { id: 'm3', author: peer, body: 'Of course — here is the shipping label.', at: TODAY, attachments: [{ id: 'a1', name: 'label-1024.pdf', url: '#label', kind: 'file' }] },
  { id: 'm4', author: me, body: 'Perfect, thank you!', at: `${TODAY.slice(0, 11)}09:02:00Z`, status: 'failed' as const },
];

export const chatShowcase: ShowcaseSpec = {
  name: 'Chat',
  slug: 'chat',
  category: 'collaboration',
  slice: 'U9',
  status: 'ready',
  interactive: true,
  tagline: 'A conversation surface — bubbles, day separators, system events, attachments, typing, receipts.',
  component: FxChat,
  variants: [
    {
      label: 'rich conversation',
      props: {
        messages: richMessages,
        self: 'me',
        peer,
        context: { label: 'Order #1024', href: '#order' },
        typing: [peer],
        onSend: noop,
        onRetry: noop,
      },
    },
    {
      label: 'empty',
      props: { messages: [], self: 'me', peer, onSend: noop },
    },
    {
      label: 'locked conversation',
      props: {
        messages: richMessages.slice(0, 2),
        self: 'me',
        peer,
        disabled: 'This conversation is closed — the order was completed.',
      },
    },
  ],
  props: [
    { name: 'messages', type: 'ChatMessage[]', required: true, description: "ChatMessage = { id; author: PartyRef; body; at; kind?: 'message' | 'system'; status?: 'sending' | 'sent' | 'read' | 'failed'; attachments? }." },
    { name: 'self', type: 'string', required: true, description: 'Current user id — decides which rows are data-self.' },
    { name: 'peer', type: 'PartyRef', description: 'Counterparty for the header (avatar + name + optional profile link).' },
    { name: 'context', type: '{ label; href }', description: 'Context link in the header (e.g. the order this is about).' },
    { name: 'onSend', type: '({ body, attachments }) => Promise | void', description: 'Send the composed message; a promise reflects the sending state.' },
    { name: 'onLoadOlder / hasOlder', type: '() => void / boolean', description: 'Load older history when scrolled to the top.' },
    { name: 'typing', type: 'PartyRef[]', description: 'Parties currently typing — drives the typing indicator.' },
    { name: 'disabled', type: 'string | false', default: 'false', description: 'When set, the composer is replaced by a locked-conversation reason banner.' },
    { name: 'sendOnEnter', type: 'boolean', default: 'true', description: 'Enter sends; Shift+Enter always newlines.' },
    { name: 'labels', type: 'Partial<ChatLabels>', description: 'i18n overrides (send / attach / typing / newMessages / retry …).' },
  ],
  events: [
    { name: 'onSend', payload: '({ body, attachments })', description: 'Composer submitted (Enter or Send).' },
    { name: 'onRetry', payload: 'ChatMessage', description: 'Retry pressed on a failed message.' },
    { name: 'onLoadOlder', payload: '()', description: 'Scrolled to top with hasOlder.' },
    { name: 'onAttach', payload: '()', description: 'Attach icon-button pressed (host opens the file picker).' },
  ],
  keyboard: [
    { keys: 'Enter', action: 'Send the message (sendOnEnter)' },
    { keys: 'Shift + Enter', action: 'Insert a newline in the composer' },
  ],
  aria: [
    { attr: 'role', value: 'log', note: 'On .fx-chat-messages with aria-live="polite" — appended messages announce.' },
    { attr: 'data-self', value: 'true | absent', note: 'Own messages align right; system rows carry no data-self and no receipt.' },
    { attr: 'aria-label', value: 'attach / send', note: 'The attach icon-button carries an aria-label; send is a labelled FxButton.' },
    { attr: 'role', value: 'status', note: 'The locked-conversation banner is a polite status region.' },
  ],
  contract: { doc: '04-component-bible.md', heading: 'FxChat — Chat' },
};
