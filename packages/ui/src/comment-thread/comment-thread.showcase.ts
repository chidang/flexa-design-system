/**
 * FxCommentThread showcase spec. Variants sweep the default (oldest-first)
 * thread with a nested reply, a tombstone (deleted comment), the `newest` sort,
 * and a moderator view exposing edit/delete on every comment. No shared §5 union
 * — the Comment shape + sort are documented as type strings in `props`.
 */
import type { ShowcaseSpec } from '../showcase-types';
import { FxCommentThread } from './comment-thread';

const noop = () => undefined;

const ada = { id: 'ada', name: 'Ada Lovelace', avatarSrc: 'https://picsum.photos/seed/ada/64', href: '#ada' };
const grace = { id: 'grace', name: 'Grace Hopper', href: '#grace' };

const comments = [
  { id: 'k1', author: ada, body: 'Does this ship internationally?', createdAt: '2026-07-12T09:00:00Z' },
  { id: 'k2', author: grace, body: 'Yes — we ship worldwide, usually 5–7 days.', createdAt: '2026-07-12T09:12:00Z', parentId: 'k1', editedAt: '2026-07-12T09:14:00Z' },
  { id: 'k3', author: ada, body: 'Perfect, ordering now.', createdAt: '2026-07-12T10:30:00Z' },
];

const withDeleted = [
  ...comments.slice(0, 2),
  { id: 'k4', author: ada, body: '', createdAt: '2026-07-12T10:31:00Z', deleted: true },
];

export const commentThreadShowcase: ShowcaseSpec = {
  name: 'CommentThread',
  slug: 'comment-thread',
  category: 'collaboration',
  slice: 'U9',
  status: 'ready',
  interactive: true,
  tagline: 'Threaded discussion — comments, one reply level, edit/delete, tombstones.',
  component: FxCommentThread,
  variants: [
    { label: 'default (oldest)', props: { comments, currentUserId: 'ada', onReply: noop, onEdit: noop, onDelete: noop } },
    { label: 'newest first', props: { comments, sort: 'newest', currentUserId: 'ada', onReply: noop } },
    { label: 'with tombstone', props: { comments: withDeleted, currentUserId: 'ada', onReply: noop, onDelete: noop } },
    { label: 'moderator', props: { comments, canModerate: true, onReply: noop, onEdit: noop, onDelete: noop } },
    { label: 'read-only', props: { comments } },
  ],
  props: [
    { name: 'comments', type: 'Comment[]', required: true, description: 'Comment = { id; author: PartyRef; body; createdAt; editedAt?; parentId?; deleted? }. deleted → tombstone.' },
    { name: 'onReply', type: '(parentId: string | null, body: string) => void', description: 'Reply posted; enables the reply action + inline composer.' },
    { name: 'onEdit', type: '(id: string, body: string) => void', description: 'Edit saved; enables the edit action on manageable comments.' },
    { name: 'onDelete', type: '(id: string) => void', description: 'Delete confirmed (routed through Confirmation Dialog).' },
    { name: 'maxDepth', type: 'number', default: '1', description: 'Nesting cap — one reply level.' },
    { name: 'sort', type: "'newest' | 'oldest'", default: "'oldest'", description: 'Order of top-level comments.' },
    { name: 'canModerate', type: 'boolean', default: 'false', description: 'Grants edit/delete on every comment.' },
    { name: 'currentUserId', type: 'string', description: 'Enables edit/delete on the viewer’s own comments.' },
    { name: 'labels', type: 'Partial<CommentThreadLabels>', description: 'i18n overrides (reply / edit / delete / tombstone …).' },
  ],
  events: [
    { name: 'onReply', payload: '(parentId, body)', description: 'Inline reply composer submitted.' },
    { name: 'onEdit', payload: '(id, body)', description: 'Inline edit composer saved.' },
    { name: 'onDelete', payload: 'id', description: 'Delete confirmed in the dialog.' },
  ],
  keyboard: [
    { keys: 'Tab', action: 'Move through author links, action buttons and composers' },
    { keys: 'Enter / Space', action: 'Activate the focused action button' },
    { keys: 'Esc', action: 'Cancel the delete confirmation dialog' },
  ],
  aria: [
    { attr: 'tombstone', value: 'text', note: 'Deleted comments render the words "Comment removed" — never a blank row.' },
    { attr: 'role', value: 'alertdialog', note: 'Delete routes through FxConfirmationDialog (danger tone, Cancel focused).' },
    { attr: 'a.fx-comment-author', value: 'profile link', note: 'Author name links to the profile when href is present.' },
  ],
  contract: { doc: '04-component-bible.md', heading: 'FxCommentThread — Comment Thread' },
};
