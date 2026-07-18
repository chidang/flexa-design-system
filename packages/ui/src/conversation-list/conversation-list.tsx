'use client';
/**
 * FxConversationList — the inbox rail of conversations (doc 04 §3.8
 * "FxConversationList — Conversation List").
 *
 * A client island: it holds the search query and the active-selection fallback.
 * A Search Bar header filters an FxList (plain `role="list"`) of conversation
 * rows — each an Avatar (+unread dot) + participant name + a 1-line snippet +
 * relative time + an unread-count Badge. The row's primary select control is a
 * real `<button>` (`aria-current` marks the open conversation); the optional
 * archive affordance is a sibling `<button>`, so two interactive controls sit
 * side-by-side inside a non-interactive `<li>` (no interactive nesting).
 * Unread rows use `text.label` weight; every row's accessible name includes its
 * unread count (state is never colour alone). Pairs with FxChat in Split View.
 * Every baked-in string is a prop with an English default (i18n).
 */
import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { PartyRef } from '../escrow-timeline/escrow-timeline';
import { FxList } from '../list/list';
import type { ListItem } from '../list/list';
import { FxAvatar } from '../avatar/avatar';
import { FxBadge } from '../badge/badge';
import { FxSearchBar } from '../search-bar/search-bar';
import { FxIcon } from '../icon/FxIcon';

/** The last message shown in a conversation snippet. */
export interface ConversationLastMessage {
  body: string;
  at: string;
  /** True when the current user sent it (snippet gets a "You:" prefix). */
  self: boolean;
}

/** One conversation row (doc 04 §3.8). */
export interface ConversationSummary {
  id: string;
  participant: PartyRef;
  lastMessage: ConversationLastMessage;
  unreadCount: number;
  /** What the conversation is about (order / listing). */
  context?: { kind: 'order' | 'listing'; label: string };
}

export type ConversationFilter = 'all' | 'unread';

/** Baked-in strings — every one a prop with an English default (§i18n). */
export interface ConversationListLabels {
  search: string;
  /** `{count}` substituted with the unread count for the row's accessible name. */
  unreadCount: string;
  /** Snippet prefix when the last message is the current user's. */
  you: string;
  /** Accessible name for the list. */
  list: string;
  archive: string;
}

export const DEFAULT_CONVERSATION_LIST_LABELS: ConversationListLabels = {
  search: 'Search conversations',
  unreadCount: '{count} unread',
  you: 'You: ',
  list: 'Conversations',
  archive: 'Archive',
};

export interface FxConversationListProps {
  /** The conversations, newest activity first (host-ordered). */
  conversations: ConversationSummary[];
  /** Controlled active conversation key. */
  activeKey?: string;
  /** A row was activated. */
  onSelect?: (conversation: ConversationSummary) => void;
  /** A conversation was archived. */
  onArchive?: (conversation: ConversationSummary) => void;
  /** Show all or only unread. Defaults to `all`. */
  filter?: ConversationFilter;
  /** Skeleton / busy state. */
  loading?: boolean;
  /** Shown when the (filtered) list is empty. */
  emptyState?: ReactNode;
  /** Baked-in strings. Merged over the English defaults. */
  labels?: Partial<ConversationListLabels>;
  className?: string;
}

/** Compact relative-time label (falls back to the raw string). */
function relativeTime(at: string): string {
  const d = new Date(at);
  if (Number.isNaN(d.getTime())) return at;
  const diff = Date.now() - d.getTime();
  const min = Math.round(diff / 60000);
  if (min < 1) return 'now';
  if (min < 60) return `${min}m`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr}h`;
  const day = Math.round(hr / 24);
  if (day < 7) return `${day}d`;
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export function FxConversationList({
  conversations,
  activeKey,
  onSelect,
  onArchive,
  filter = 'all',
  loading = false,
  emptyState,
  labels,
  className,
}: FxConversationListProps) {
  const l = { ...DEFAULT_CONVERSATION_LIST_LABELS, ...labels };
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return conversations.filter((c) => {
      if (filter === 'unread' && c.unreadCount === 0) return false;
      if (q === '') return true;
      return (
        c.participant.name.toLowerCase().includes(q) ||
        c.lastMessage.body.toLowerCase().includes(q) ||
        (c.context?.label.toLowerCase().includes(q) ?? false)
      );
    });
  }, [conversations, filter, query]);

  const items: ListItem[] = filtered.map((c) => ({ key: c.id, title: c.participant.name }));
  const byKey = useMemo(() => {
    const m = new Map<string, ConversationSummary>();
    for (const c of filtered) m.set(c.id, c);
    return m;
  }, [filtered]);

  const renderItem = (item: ListItem): ReactNode => {
    const c = byKey.get(String(item.key));
    if (c == null) return null;
    const unread = c.unreadCount > 0;
    const snippet = `${c.lastMessage.self ? l.you : ''}${c.lastMessage.body}`;
    const unreadLabel = l.unreadCount.replace('{count}', String(c.unreadCount));
    const isActive = activeKey != null && activeKey === c.id;
    return (
      <div className="fx-conversation-list-row">
        <button
          type="button"
          className="fx-conversation-list-select"
          aria-current={isActive || undefined}
          onClick={() => onSelect?.(c)}
        >
          <span className="fx-conversation-list-avatar" data-unread={unread || undefined}>
            <FxAvatar size="md" src={c.participant.avatarSrc} name={c.participant.name} alt={c.participant.name} />
            {unread && <span className="fx-conversation-list-dot" aria-hidden="true" />}
          </span>
          <span className="fx-conversation-list-content">
            <span className="fx-conversation-list-headline">
              <span className="fx-conversation-list-name">{c.participant.name}</span>
              <span className="fx-conversation-list-time">{relativeTime(c.lastMessage.at)}</span>
            </span>
            <span className="fx-conversation-list-snippet">
              {c.context != null && (
                <span className="fx-conversation-list-context">{c.context.label}</span>
              )}
              <span className="fx-conversation-list-body">{snippet}</span>
            </span>
          </span>
          {unread && (
            <span className="fx-conversation-list-badge">
              <FxBadge tone="info" appearance="solid" count={c.unreadCount} srLabel={unreadLabel} />
            </span>
          )}
        </button>
        {onArchive != null && (
          <button
            type="button"
            className="fx-conversation-list-archive"
            aria-label={`${l.archive} — ${c.participant.name}`}
            onClick={() => onArchive(c)}
          >
            <FxIcon name="package" size={16} />
          </button>
        )}
      </div>
    );
  };

  const rootClass = ['fx-conversation-list', className].filter(Boolean).join(' ');
  const isEmpty = items.length === 0;

  return (
    <div className={rootClass} data-loading={loading || undefined}>
      <div className="fx-conversation-list-header">
        <FxSearchBar
          value={query}
          placeholder={l.search}
          ariaLabel={l.search}
          onChange={(v) => setQuery(v)}
        />
      </div>

      {isEmpty ? (
        <div className="fx-conversation-list-empty">{emptyState ?? null}</div>
      ) : (
        <FxList
          className="fx-conversation-list-items"
          items={items}
          selectable="none"
          aria-label={l.list}
          renderItem={renderItem}
        />
      )}
    </div>
  );
}
