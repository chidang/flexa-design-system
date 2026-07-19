'use client';
/**
 * FxChat — a conversation surface (doc 04 §3.8 "FxChat — Chat").
 *
 * A client island: it holds the composer buffer + attachments, watches scroll
 * position (to pin to the bottom / surface a "New messages ↓" jump button), and
 * sends on Enter. Anatomy: header (counterparty Avatar + name + context link) +
 * `.fx-chat-messages[role=log][aria-live=polite]` (day separators; per-message
 * bubbles with `[data-self]`, time and a read receipt; `kind:'system'` rows
 * render a CENTERED system event card — no bubble, no data-self, no receipt;
 * attachment cards) + a typing indicator + the composer (Textarea autoResize +
 * an attach icon-button + a send FxButton primary).
 *
 * `Enter` sends / `Shift+Enter` newline (`sendOnEnter=true`). Failed rows carry
 * a retry. When `disabled`, the composer is replaced by a locked-conversation
 * reason banner. Self bubble bg `color.primary`/`color.on-primary`; other bubble
 * `color.surface-alt`/`color.text`; radius `radius.lg`.
 *
 * G10 (doc 14 §11): a `kind:'system'` message may carry `link: {href, label}` —
 * the system event card then renders a deep-link anchor after the body.
 * G11 (doc 14 §11): `attachmentOptions` turns the attach button into a
 * fixture-safe picker — a popover listing pre-seeded attachments (no real File
 * objects); chosen ones stage as removable chips above the composer and ride
 * `onSend`'s `payload.attachments`. Without it, the attach button keeps the v1
 * `onAttach` host-picker seam unchanged.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import type { PartyRef } from '../escrow-timeline/escrow-timeline';
import { FxAvatar } from '../avatar/avatar';
import { FxButton } from '../button/button';
import { FxTextarea } from '../textarea/textarea';
import { FxIcon } from '../icon/FxIcon';
import type { IconName } from '../icon/map';

/** One attachment on a message. */
export interface ChatAttachment {
  id: string;
  name: string;
  url: string;
  /** Coarse media kind — drives the attachment card icon. */
  kind: string;
}

export type ChatMessageStatus = 'sending' | 'sent' | 'read' | 'failed';

/** One message (or system event) in the conversation. */
export interface ChatMessage {
  id: string;
  author: PartyRef;
  body: string;
  /** ISO / display timestamp. */
  at: string;
  /** `message` (a bubble) or `system` (a centered event card). Defaults to `message`. */
  kind?: 'message' | 'system';
  /** Delivery state — only meaningful on the sender's own messages. */
  status?: ChatMessageStatus;
  attachments?: ChatAttachment[];
  /** Deep-link on a `kind:'system'` event card (e.g. the order it announces). */
  link?: { href: string; label: string };
}

/** Baked-in strings — every one a prop, with English defaults (§i18n). */
export interface ChatLabels {
  send: string;
  attach: string;
  /** `{name}` substituted with the typing party name(s). */
  typing: string;
  newMessages: string;
  retry: string;
  failed: string;
  read: string;
  sending: string;
  placeholder: string;
  /** Accessible name for the messages log. */
  log: string;
  /** Accessible name for the attachment-picker popover (G11). */
  attachPicker: string;
  /** Remove a staged attachment — `{name}` substituted with the file name. */
  removeAttachment: string;
}

export const DEFAULT_CHAT_LABELS: ChatLabels = {
  send: 'Send',
  attach: 'Attach file',
  typing: '{name} is typing…',
  newMessages: 'New messages ↓',
  retry: 'Retry',
  failed: 'Not delivered',
  read: 'Read',
  sending: 'Sending…',
  placeholder: 'Write a message…',
  log: 'Conversation',
  attachPicker: 'Choose an attachment',
  removeAttachment: 'Remove {name}',
};

/** What the composer emits on send. */
export interface ChatSendPayload {
  body: string;
  attachments: ChatAttachment[];
}

export interface FxChatProps {
  /** The conversation, oldest → newest. */
  messages: ChatMessage[];
  /** Current user id — decides which messages are `data-self`. */
  self: string;
  /** Counterparty for the header. */
  peer?: PartyRef;
  /** Optional context link (e.g. the order this conversation is about). */
  context?: { label: string; href: string };
  /** Send a composed message. Returning a promise lets the host reflect status. */
  onSend?: (payload: ChatSendPayload) => Promise<void> | void;
  /** Retry a failed message. */
  onRetry?: (message: ChatMessage) => void;
  /** Load older history (infinite scroll up). */
  onLoadOlder?: () => void;
  /** More history exists above. */
  hasOlder?: boolean;
  /** Parties currently typing. */
  typing?: PartyRef[];
  /** Attach button pressed — the host opens a file picker; v1 has no built-in input. */
  onAttach?: () => void;
  /**
   * Fixture-safe attachment picker (G11): pre-seeded attachments the attach
   * button offers in a popover — no real File objects. Chosen ones stage as
   * removable chips and ride `onSend`'s `payload.attachments`. When set, the
   * picker takes over the attach button (`onAttach` is not called).
   */
  attachmentOptions?: ChatAttachment[];
  /** When set, the composer is replaced by a locked-conversation reason banner. */
  disabled?: string | false;
  /** Enter sends (Shift+Enter always newlines). Defaults to `true`. */
  sendOnEnter?: boolean;
  /** Baked-in strings. Merged over the English defaults. */
  labels?: Partial<ChatLabels>;
  /** Locale for the day-separator / time formatting. */
  locale?: string;
  className?: string;
}

/** Attachment-kind → canonical icon. */
function attachmentIcon(kind: string): IconName {
  if (kind === 'image') return 'image';
  if (kind === 'video') return 'video';
  if (kind === 'audio') return 'music';
  return 'file';
}

/** A stable day bucket key from a timestamp (falls back to the raw string). */
function dayKey(at: string): string {
  const d = new Date(at);
  return Number.isNaN(d.getTime()) ? at : d.toISOString().slice(0, 10);
}

/** Human day separator label. */
function dayLabel(at: string, locale?: string): string {
  const d = new Date(at);
  if (Number.isNaN(d.getTime())) return at;
  return d.toLocaleDateString(locale, { weekday: 'long', month: 'short', day: 'numeric' });
}

/** Short time label for a message. */
function timeLabel(at: string, locale?: string): string {
  const d = new Date(at);
  if (Number.isNaN(d.getTime())) return at;
  return d.toLocaleTimeString(locale, { hour: 'numeric', minute: '2-digit' });
}

/** Compose the typing-indicator sentence from the parties. */
function typingText(template: string, parties: PartyRef[]): string {
  const names =
    parties.length === 1
      ? parties[0]?.name ?? ''
      : parties.length === 2
        ? `${parties[0]?.name} and ${parties[1]?.name}`
        : `${parties[0]?.name} and ${parties.length - 1} others`;
  return template.replace('{name}', names);
}

export function FxChat({
  messages,
  self,
  peer,
  context,
  onSend,
  onRetry,
  onLoadOlder,
  hasOlder = false,
  typing = [],
  onAttach,
  attachmentOptions,
  disabled = false,
  sendOnEnter = true,
  labels,
  locale,
  className,
}: FxChatProps) {
  const l = { ...DEFAULT_CHAT_LABELS, ...labels };
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [pinned, setPinned] = useState(true);
  // G11 fixture-safe picker state: staged attachments + popover visibility.
  const [staged, setStaged] = useState<ChatAttachment[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const attachRef = useRef<HTMLButtonElement>(null);

  // Pin to the bottom when new messages arrive and the user hasn't scrolled up.
  useEffect(() => {
    if (!pinned) return;
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, typing, pinned]);

  const onScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 48;
    setPinned(nearBottom);
    if (el.scrollTop < 48 && hasOlder) onLoadOlder?.();
  };

  const jumpToBottom = () => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
    setPinned(true);
  };

  const submit = () => {
    const body = draft.trim();
    if ((body === '' && staged.length === 0) || sending) return;
    const result = onSend?.({ body, attachments: staged });
    setDraft('');
    setStaged([]);
    if (result instanceof Promise) {
      setSending(true);
      void result.finally(() => setSending(false));
    }
  };

  /** G11 picker: stage a pre-seeded attachment and close the popover. */
  const stageAttachment = (a: ChatAttachment) => {
    setStaged((prev) => (prev.some((s) => s.id === a.id) ? prev : [...prev, a]));
    setPickerOpen(false);
    attachRef.current?.focus();
  };

  const onAttachPress = () => {
    if (attachmentOptions != null) setPickerOpen((open) => !open);
    else onAttach?.();
  };

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (sendOnEnter && e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  // Group messages into day buckets so day separators render once per day.
  const groups = useMemo(() => {
    const out: { day: string; label: string; items: ChatMessage[] }[] = [];
    for (const m of messages) {
      const key = dayKey(m.at);
      const last = out[out.length - 1];
      if (last && last.day === key) last.items.push(m);
      else out.push({ day: key, label: dayLabel(m.at, locale), items: [m] });
    }
    return out;
  }, [messages, locale]);

  const rootClass = ['fx-chat', className].filter(Boolean).join(' ');

  return (
    <section className={rootClass} data-disabled={disabled ? true : undefined}>
      {peer != null && (
        <header className="fx-chat-header">
          <FxAvatar size="sm" src={peer.avatarSrc} name={peer.name} alt={peer.name} />
          <div className="fx-chat-header-text">
            {peer.href != null ? (
              <a className="fx-chat-peer-name" href={peer.href}>
                {peer.name}
              </a>
            ) : (
              <span className="fx-chat-peer-name">{peer.name}</span>
            )}
            {context != null && (
              <a className="fx-chat-context" href={context.href}>
                {context.label}
              </a>
            )}
          </div>
        </header>
      )}

      <div
        ref={scrollRef}
        className="fx-chat-messages"
        role="log"
        aria-live="polite"
        aria-label={l.log}
        onScroll={onScroll}
      >
        {groups.map((group) => (
          <div key={group.day} className="fx-chat-day">
            <div className="fx-chat-day-sep">
              <span className="fx-chat-day-label">{group.label}</span>
            </div>
            {group.items.map((m) => {
              if (m.kind === 'system') {
                return (
                  <div key={m.id} className="fx-chat-system" role="note">
                    <span className="fx-chat-system-body">{m.body}</span>
                    {m.link != null && (
                      <a className="fx-chat-system-link" href={m.link.href}>
                        {m.link.label}
                      </a>
                    )}
                    <span className="fx-chat-system-time">{timeLabel(m.at, locale)}</span>
                  </div>
                );
              }
              const isSelf = m.author.id === self;
              const failed = m.status === 'failed';
              return (
                <div key={m.id} className="fx-chat-message" data-self={isSelf || undefined}>
                  {!isSelf && (
                    <FxAvatar size="xs" src={m.author.avatarSrc} name={m.author.name} alt={m.author.name} />
                  )}
                  <div className="fx-chat-bubble-wrap">
                    <div className="fx-chat-bubble" data-failed={failed || undefined}>
                      {m.body !== '' && <p className="fx-chat-body">{m.body}</p>}
                      {m.attachments != null && m.attachments.length > 0 && (
                        <ul className="fx-chat-attachments">
                          {m.attachments.map((a) => (
                            <li key={a.id} className="fx-chat-attachment">
                              <span className="fx-chat-attachment-icon" aria-hidden="true">
                                <FxIcon name={attachmentIcon(a.kind)} size={16} />
                              </span>
                              <a className="fx-chat-attachment-name" href={a.url}>
                                {a.name}
                              </a>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                    <div className="fx-chat-meta">
                      <span className="fx-chat-time">{timeLabel(m.at, locale)}</span>
                      {isSelf && m.status === 'read' && (
                        <span className="fx-chat-receipt" data-status="read">
                          <FxIcon name="check" size={16} />
                          <span className="fx-chat-receipt-label">{l.read}</span>
                        </span>
                      )}
                      {isSelf && m.status === 'sending' && (
                        <span className="fx-chat-receipt" data-status="sending">
                          {l.sending}
                        </span>
                      )}
                      {failed && (
                        <span className="fx-chat-failed">
                          <span className="fx-chat-failed-label">{l.failed}</span>
                          <button
                            type="button"
                            className="fx-chat-retry"
                            onClick={() => onRetry?.(m)}
                          >
                            {l.retry}
                          </button>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ))}

        {typing.length > 0 && (
          <div className="fx-chat-typing" aria-hidden="true">
            <span className="fx-chat-typing-dots">
              <span />
              <span />
              <span />
            </span>
            <span className="fx-chat-typing-text">{typingText(l.typing, typing)}</span>
          </div>
        )}
      </div>

      {!pinned && (
        <button type="button" className="fx-chat-jump" onClick={jumpToBottom}>
          {l.newMessages}
        </button>
      )}

      {disabled ? (
        <div className="fx-chat-locked" role="status">
          <FxIcon name="lock" size={16} className="fx-chat-locked-icon" />
          <span>{disabled}</span>
        </div>
      ) : (
        <div className="fx-chat-composer-area">
          {staged.length > 0 && (
            <ul className="fx-chat-staged">
              {staged.map((a) => (
                <li key={a.id} className="fx-chat-staged-item">
                  <span className="fx-chat-staged-icon" aria-hidden="true">
                    <FxIcon name={attachmentIcon(a.kind)} size={16} />
                  </span>
                  <span className="fx-chat-staged-name">{a.name}</span>
                  <button
                    type="button"
                    className="fx-chat-staged-remove"
                    aria-label={l.removeAttachment.replace('{name}', a.name)}
                    onClick={() => setStaged((prev) => prev.filter((s) => s.id !== a.id))}
                  >
                    <FxIcon name="close" size={16} />
                  </button>
                </li>
              ))}
            </ul>
          )}
          <div className="fx-chat-composer">
            <div className="fx-chat-attach-wrap">
              <button
                ref={attachRef}
                type="button"
                className="fx-chat-attach"
                aria-label={l.attach}
                aria-expanded={attachmentOptions != null ? pickerOpen : undefined}
                onClick={onAttachPress}
              >
                <FxIcon name="paperclip" size={20} />
              </button>
              {pickerOpen && attachmentOptions != null && (
                <div
                  className="fx-chat-attach-menu"
                  role="group"
                  aria-label={l.attachPicker}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') {
                      setPickerOpen(false);
                      attachRef.current?.focus();
                    }
                  }}
                >
                  {attachmentOptions.map((a) => (
                    <button
                      key={a.id}
                      type="button"
                      className="fx-chat-attach-option"
                      disabled={staged.some((s) => s.id === a.id)}
                      onClick={() => stageAttachment(a)}
                    >
                      <span className="fx-chat-attach-option-icon" aria-hidden="true">
                        <FxIcon name={attachmentIcon(a.kind)} size={16} />
                      </span>
                      <span className="fx-chat-attach-option-name">{a.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <FxTextarea
              className="fx-chat-input"
              value={draft}
              rows={1}
              maxRows={6}
              aria-label={l.placeholder}
              placeholder={l.placeholder}
              onChange={(v) => setDraft(v)}
              onKeyDown={onKeyDown}
            />
            <FxButton
              variant="primary"
              loading={sending}
              disabled={draft.trim() === '' && staged.length === 0}
              iconStart={<FxIcon name="send" size={16} />}
              onClick={submit}
            >
              {l.send}
            </FxButton>
          </div>
        </div>
      )}
    </section>
  );
}
