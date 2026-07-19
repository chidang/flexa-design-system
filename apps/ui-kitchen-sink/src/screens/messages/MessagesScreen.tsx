/**
 * U13-E Messages (buyer + seller) reference screen — the Split View two-pane
 * inbox (doc 08 §2.7, seller side §3.27, flow B5). Composes flexa-ui end to end
 * against the MSW mock backend (`flexa-ui-kit/mocks` via {@link ../api}):
 * FxConversationList (left) + FxChat (right), over the doc 09 §2.14
 * conversation/message endpoints.
 *
 * The kicker (doc 15 §4): a "View as: Buyer / Seller" segmented control flips
 * which party is `data-self` on the SAME conversation — the two-sides-of-one-
 * thread demo. The choice lives in component state only. Conversation fixtures
 * reference real order/listing/store ids so `kind:'system'` event cards deep-
 * link to real screens (`/screens/orders/:id`, `/screens/listings/:id`).
 *
 * Composer sends append to the module-scoped conversation store (POST
 * `/v1/conversations/:id/messages`); the thread on the seeded disputed order is
 * locked, so FxChat renders its locked-conversation banner instead of a composer.
 *
 * ZERO one-off component CSS: every visual is a flexa-ui component; the two-pane
 * frame is the `ks-messages-*` utilities in messages.css and the shared `ks-*`
 * helpers, with inline `var(--fx-*)` tokens only.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  FxBlankStateLayout,
  FxChat,
  FxConversationList,
  FxEmptyState,
  FxErrorPage,
  FxInlineError,
  FxSkeletonLoader,
  FxTabs,
  useToast,
  type ChatMessage,
  type ChatSendPayload,
  type ConversationSummary,
  type PartyRef,
  type TabItem,
} from 'flexa-ui-kit';
import type { Collection } from 'flexa-ui-kit/mocks';
import type { ConversationRecord, MessageRecord } from 'flexa-ui-kit/mocks';
import { api, ApiRequestError } from '../api';

/* ------------------------------------------------------------------ types */

/** Which side of every thread the viewer is — flips `data-self` (doc 15 §4). */
type ViewAs = 'buyer' | 'seller';

/* ---------------------------------------------------------------- helpers */

/** The party ref for the viewer's side of a conversation. */
function selfParty(conversation: ConversationRecord, viewAs: ViewAs): PartyRef {
  const p = viewAs === 'buyer' ? conversation.buyer : conversation.seller;
  return { id: p.id, name: p.name };
}

/** The counterparty (chat header) for the viewer's side. */
function peerParty(conversation: ConversationRecord, viewAs: ViewAs): PartyRef {
  const p = viewAs === 'buyer' ? conversation.seller : conversation.buyer;
  return { id: p.id, name: p.name };
}

/** Resolve a subject to an in-app deep-link href. */
function subjectHref(subject: ConversationRecord['subject']): string {
  return subject.kind === 'order'
    ? `#/screens/orders/${subject.id}`
    : `#/screens/listings/${subject.id}`;
}

/** The author id for a message under the current View-as party set. */
function authorFor(
  message: MessageRecord,
  conversation: ConversationRecord,
): PartyRef {
  if (message.sender === 'buyer') return { id: conversation.buyer.id, name: conversation.buyer.name };
  if (message.sender === 'seller') return { id: conversation.seller.id, name: conversation.seller.name };
  return { id: 'system', name: 'System' };
}

/**
 * Project the mock message log onto FxChat's ChatMessage[]. `system` rows keep
 * their kind (centered event cards); their deep-link is appended as a plain link
 * in the body so the card stays a single string surface. Regular rows carry the
 * real author, so FxChat resolves `data-self` against the `self` id we pass in.
 */
function toChatMessages(
  records: MessageRecord[],
  conversation: ConversationRecord,
): ChatMessage[] {
  return records.map((m) => ({
    id: m.id,
    author: authorFor(m, conversation),
    body: m.body,
    at: m.createdAt,
    kind: m.sender === 'system' ? 'system' : 'message',
    status: m.sender === 'system' ? undefined : 'read',
    attachments: m.attachments?.map((a) => ({
      id: a.id,
      name: a.fileName,
      url: a.url,
      kind: a.kind,
    })),
  }));
}

/** Project a conversation to the list-row summary (viewer-relative snippet). */
function toConversationSummary(
  conversation: ConversationRecord,
  lastBody: string,
  viewAs: ViewAs,
): ConversationSummary {
  const unread = viewAs === 'buyer' ? conversation.buyerUnread : conversation.sellerUnread;
  return {
    id: conversation.id,
    participant: peerParty(conversation, viewAs),
    lastMessage: { body: lastBody, at: conversation.updatedAt, self: false },
    unreadCount: unread,
    context: { kind: conversation.subject.kind, label: conversation.subject.label },
  };
}

const VIEW_AS_TABS: TabItem[] = [
  { id: 'buyer', label: 'Buyer', content: null },
  { id: 'seller', label: 'Seller', content: null },
];

/* -------------------------------------------------------------------- root */

export function MessagesScreen() {
  const { conversationId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [viewAs, setViewAs] = useState<ViewAs>('buyer');
  const [conversations, setConversations] = useState<ConversationRecord[]>([]);
  const [listError, setListError] = useState<ApiRequestError | null>(null);
  const [listLoading, setListLoading] = useState(true);

  // Per-thread message logs, cached by conversation id as the user browses.
  const [threads, setThreads] = useState<Record<string, MessageRecord[]>>({});
  const [threadLoading, setThreadLoading] = useState(false);
  const [threadError, setThreadError] = useState<ApiRequestError | null>(null);

  /** Load the conversation list (list pane). */
  const loadConversations = useCallback(async () => {
    setListLoading(true);
    setListError(null);
    try {
      const res = await api.get<Collection<ConversationRecord>>('/v1/conversations');
      setConversations(res.data);
      setListLoading(false);
    } catch (e) {
      setListError(e instanceof ApiRequestError ? e : new ApiRequestError(500, null));
      setListLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadConversations();
  }, [loadConversations]);

  const active = useMemo(
    () => conversations.find((c) => c.id === conversationId) ?? null,
    [conversations, conversationId],
  );

  /** Load a thread's messages when it becomes active (once, cached). */
  const loadThread = useCallback(async (id: string) => {
    setThreadLoading(true);
    setThreadError(null);
    try {
      const res = await api.get<Collection<MessageRecord>>(`/v1/conversations/${id}/messages`);
      setThreads((prev) => ({ ...prev, [id]: res.data }));
      setThreadLoading(false);
    } catch (e) {
      setThreadError(e instanceof ApiRequestError ? e : new ApiRequestError(500, null));
      setThreadLoading(false);
    }
  }, []);

  useEffect(() => {
    if (active == null) return;
    if (threads[active.id] != null) return;
    void loadThread(active.id);
  }, [active, threads, loadThread]);

  /** Select a conversation → route + mark read (badge clears optimistically). */
  const onSelect = useCallback(
    (summary: ConversationSummary) => {
      navigate(`/screens/messages/${summary.id}`);
      setConversations((prev) =>
        prev.map((c) =>
          c.id === summary.id
            ? { ...c, buyerUnread: viewAs === 'buyer' ? 0 : c.buyerUnread, sellerUnread: viewAs === 'seller' ? 0 : c.sellerUnread }
            : c,
        ),
      );
      void api.post(`/v1/conversations/${summary.id}/read`, { party: viewAs }).catch(() => {});
    },
    [navigate, viewAs],
  );

  /** Send from the composer → append to the thread (POST /messages). */
  const onSend = useCallback(
    async (payload: ChatSendPayload) => {
      if (active == null) return;
      try {
        const created = await api.post<MessageRecord>(
          `/v1/conversations/${active.id}/messages`,
          { body: payload.body, sender: viewAs },
        );
        setThreads((prev) => ({
          ...prev,
          [active.id]: [...(prev[active.id] ?? []), created],
        }));
        setConversations((prev) =>
          prev.map((c) => (c.id === active.id ? { ...c, updatedAt: created.createdAt } : c)),
        );
      } catch (e) {
        const code = e instanceof ApiRequestError ? e.body?.code : undefined;
        toast.show({
          tone: 'danger',
          title: 'Message not sent',
          description:
            code === 'conversation_locked'
              ? 'This conversation is locked while the dispute is reviewed.'
              : 'Something went wrong. Please try again in a moment.',
        });
      }
    },
    [active, viewAs, toast],
  );

  /* -------------------------------------------------------------- render */

  // A foreign / unknown conversation id after the list has loaded → 404.
  if (conversationId != null && !listLoading && listError == null && active == null) {
    return (
      <div className="ks-screen">
        <FxErrorPage code={404} />
      </div>
    );
  }

  const listSummaries: ConversationSummary[] = conversations.map((c) => {
    const records = threads[c.id];
    const last = records != null && records.length > 0 ? records[records.length - 1]! : null;
    return toConversationSummary(c, last?.body ?? c.subject.label, viewAs);
  });

  const activeMessages = active != null ? threads[active.id] ?? [] : [];
  const selfId = active != null ? selfParty(active, viewAs).id : '';
  const peer = active != null ? peerParty(active, viewAs) : undefined;
  const context =
    active != null
      ? { label: active.subject.label, href: subjectHref(active.subject) }
      : undefined;

  return (
    <div className="ks-screen">
      <div className="ks-row ks-row-between">
        <div className="ks-stack" style={{ ['--ks-gap' as string]: 'var(--fx-space-1)' }}>
          <h1 className="ks-page-title">Messages</h1>
          <span className="ks-muted">
            Buyer and seller conversations — the two sides of one thread.
          </span>
        </div>
        {/* View-as flips `data-self` on the SAME conversation (doc 15 §4). */}
        <div
          className="ks-stack"
          style={{ ['--ks-gap' as string]: 'var(--fx-space-1)' }}
          aria-label="View as"
        >
          <span className="ks-muted" style={{ fontSize: '0.8rem' }}>
            View as
          </span>
          <FxTabs
            items={VIEW_AS_TABS}
            variant="contained"
            size="sm"
            value={viewAs}
            onChange={(id) => setViewAs(id as ViewAs)}
          />
        </div>
      </div>

      <div className="ks-messages-split">
        {/* List pane -------------------------------------------------- */}
        <div className="ks-messages-pane">
          {listError != null ? (
            <FxInlineError
              message="We couldn't load your conversations."
              onRetry={() => void loadConversations()}
            />
          ) : listLoading ? (
            <div className="ks-stack" style={{ ['--ks-gap' as string]: 'var(--fx-space-3)' }}>
              {Array.from({ length: 6 }, (_, i) => (
                <FxSkeletonLoader key={i} shape="rect" height="3.5rem" />
              ))}
            </div>
          ) : (
            <FxConversationList
              conversations={listSummaries}
              activeKey={active?.id}
              onSelect={onSelect}
              emptyState={
                <FxEmptyState
                  icon="chat"
                  title="No messages yet"
                  description="Conversations with buyers and sellers appear here."
                  size="sm"
                />
              }
            />
          )}
        </div>

        {/* Chat pane -------------------------------------------------- */}
        <div className="ks-messages-pane">
          {active == null ? (
            <FxBlankStateLayout
              icon="chat"
              title="Select a conversation"
              description="Pick a thread on the left to read and reply."
            />
          ) : threadError != null ? (
            <FxInlineError
              message="We couldn't load this conversation."
              onRetry={() => void loadThread(active.id)}
            />
          ) : threadLoading && activeMessages.length === 0 ? (
            <div className="ks-stack" style={{ ['--ks-gap' as string]: 'var(--fx-space-3)' }}>
              {Array.from({ length: 3 }, (_, i) => (
                <FxSkeletonLoader key={i} shape="rect" height="4rem" />
              ))}
            </div>
          ) : (
            <FxChat
              key={`${active.id}-${viewAs}`}
              messages={toChatMessages(activeMessages, active)}
              self={selfId}
              peer={peer}
              context={context}
              onSend={onSend}
              disabled={active.locked ?? false}
            />
          )}
        </div>
      </div>
    </div>
  );
}
