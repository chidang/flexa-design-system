'use client';
/**
 * FxCommentThread — a threaded discussion (doc 04 §3.8 "FxCommentThread —
 * Comment Thread").
 *
 * A client island: it owns the open reply/edit composer and the delete
 * confirmation. Each comment is an Avatar + author + time + body + an actions
 * row (reply / edit / delete) with nested replies one level deep (indented
 * `space.8`) and an inline reply composer (Textarea). Deleted comments render a
 * tombstone ("Comment removed"). Delete routes through FxConfirmationDialog.
 * Sort is `oldest` (default) or `newest`; nesting is capped at `maxDepth` (1).
 * Every baked-in string is a prop with an English default (i18n).
 */
import { useMemo, useState } from 'react';
import type { PartyRef } from '../escrow-timeline/escrow-timeline';
import { FxAvatar } from '../avatar/avatar';
import { FxButton } from '../button/button';
import { FxTextarea } from '../textarea/textarea';
import { FxConfirmationDialog } from '../confirmation-dialog/confirmation-dialog';

/** One comment (doc 04 §3.8). */
export interface Comment {
  id: string;
  author: PartyRef;
  body: string;
  createdAt: string;
  /** Present when the comment has been edited. */
  editedAt?: string;
  /** Parent comment id — a reply (one level deep). */
  parentId?: string;
  /** Soft-deleted → renders a tombstone. */
  deleted?: boolean;
}

export type CommentSort = 'newest' | 'oldest';

/** Baked-in strings — every one a prop with an English default (§i18n). */
export interface CommentThreadLabels {
  reply: string;
  edit: string;
  delete: string;
  save: string;
  cancel: string;
  post: string;
  edited: string;
  tombstone: string;
  replyPlaceholder: string;
  editPlaceholder: string;
  deleteTitle: string;
  deleteBody: string;
  deleteConfirm: string;
}

export const DEFAULT_COMMENT_THREAD_LABELS: CommentThreadLabels = {
  reply: 'Reply',
  edit: 'Edit',
  delete: 'Delete',
  save: 'Save',
  cancel: 'Cancel',
  post: 'Post',
  edited: 'edited',
  tombstone: 'Comment removed',
  replyPlaceholder: 'Write a reply…',
  editPlaceholder: 'Edit your comment…',
  deleteTitle: 'Delete comment?',
  deleteBody: 'This comment will be removed. This cannot be undone.',
  deleteConfirm: 'Delete',
};

export interface FxCommentThreadProps {
  /** Flat comment list; nesting is derived from `parentId`. */
  comments: Comment[];
  /** Post a reply to a comment (parentId set) or a top-level comment. */
  onReply?: (parentId: string | null, body: string) => void;
  /** Save an edit to a comment. */
  onEdit?: (id: string, body: string) => void;
  /** Delete a comment (already confirmed by the dialog). */
  onDelete?: (id: string) => void;
  /** Nesting cap. Defaults to `1` (one level of replies). */
  maxDepth?: number;
  /** Order of top-level comments. Defaults to `oldest`. */
  sort?: CommentSort;
  /** Grants edit/delete on every comment (not just the viewer's own). */
  canModerate?: boolean;
  /** The current user's id — enables edit/delete on their own comments. */
  currentUserId?: string;
  /** Baked-in strings. Merged over the English defaults. */
  labels?: Partial<CommentThreadLabels>;
  className?: string;
}

/** Compact relative-time label (falls back to the raw string). */
function relativeTime(at: string): string {
  const d = new Date(at);
  if (Number.isNaN(d.getTime())) return at;
  const diff = Date.now() - d.getTime();
  const min = Math.round(diff / 60000);
  if (min < 1) return 'just now';
  if (min < 60) return `${min}m ago`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr}h ago`;
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export function FxCommentThread({
  comments,
  onReply,
  onEdit,
  onDelete,
  maxDepth = 1,
  sort = 'oldest',
  canModerate = false,
  currentUserId,
  labels,
  className,
}: FxCommentThreadProps) {
  const l = { ...DEFAULT_COMMENT_THREAD_LABELS, ...labels };
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);

  // Build the top-level order + a parent→children map.
  const { roots, childrenOf } = useMemo(() => {
    const kids = new Map<string, Comment[]>();
    const tops: Comment[] = [];
    for (const c of comments) {
      if (c.parentId != null) {
        const arr = kids.get(c.parentId) ?? [];
        arr.push(c);
        kids.set(c.parentId, arr);
      } else {
        tops.push(c);
      }
    }
    const ordered = [...tops].sort((a, b) => {
      const av = new Date(a.createdAt).getTime();
      const bv = new Date(b.createdAt).getTime();
      return sort === 'newest' ? bv - av : av - bv;
    });
    return { roots: ordered, childrenOf: kids };
  }, [comments, sort]);

  const canManage = (c: Comment): boolean =>
    !c.deleted && (canModerate || (currentUserId != null && c.author.id === currentUserId));

  const openReply = (id: string) => {
    setEditing(null);
    setReplyTo(id);
    setDraft('');
  };
  const openEdit = (c: Comment) => {
    setReplyTo(null);
    setEditing(c.id);
    setDraft(c.body);
  };
  const closeComposer = () => {
    setReplyTo(null);
    setEditing(null);
    setDraft('');
  };

  const submitReply = (parentId: string) => {
    const body = draft.trim();
    if (body === '') return;
    onReply?.(parentId, body);
    closeComposer();
  };
  const submitEdit = (id: string) => {
    const body = draft.trim();
    if (body === '') return;
    onEdit?.(id, body);
    closeComposer();
  };

  const rootClass = ['fx-comment-thread', className].filter(Boolean).join(' ');

  const renderComment = (c: Comment, depth: number) => {
    const kids = childrenOf.get(c.id) ?? [];
    const isEditing = editing === c.id;
    const isReplying = replyTo === c.id;

    return (
      <li key={c.id} className="fx-comment" data-depth={depth}>
        <div className="fx-comment-row">
          <FxAvatar size="sm" src={c.author.avatarSrc} name={c.author.name} alt={c.author.name} />
          <div className="fx-comment-main">
            <div className="fx-comment-head">
              {c.author.href != null ? (
                <a className="fx-comment-author" href={c.author.href}>
                  {c.author.name}
                </a>
              ) : (
                <span className="fx-comment-author">{c.author.name}</span>
              )}
              <span className="fx-comment-time">{relativeTime(c.createdAt)}</span>
              {c.editedAt != null && !c.deleted && (
                <span className="fx-comment-edited">({l.edited})</span>
              )}
            </div>

            {c.deleted ? (
              <p className="fx-comment-tombstone">{l.tombstone}</p>
            ) : isEditing ? (
              <div className="fx-comment-composer">
                <FxTextarea
                  value={draft}
                  rows={2}
                  aria-label={l.editPlaceholder}
                  placeholder={l.editPlaceholder}
                  onChange={(v) => setDraft(v)}
                />
                <div className="fx-comment-composer-actions">
                  <FxButton size="sm" variant="ghost" onClick={closeComposer}>
                    {l.cancel}
                  </FxButton>
                  <FxButton size="sm" disabled={draft.trim() === ''} onClick={() => submitEdit(c.id)}>
                    {l.save}
                  </FxButton>
                </div>
              </div>
            ) : (
              <p className="fx-comment-body">{c.body}</p>
            )}

            {!c.deleted && !isEditing && (
              <div className="fx-comment-actions">
                {onReply != null && depth < maxDepth && (
                  <button type="button" className="fx-comment-action" onClick={() => openReply(c.id)}>
                    {l.reply}
                  </button>
                )}
                {onEdit != null && canManage(c) && (
                  <button type="button" className="fx-comment-action" onClick={() => openEdit(c)}>
                    {l.edit}
                  </button>
                )}
                {onDelete != null && canManage(c) && (
                  <button
                    type="button"
                    className="fx-comment-action"
                    data-tone="danger"
                    onClick={() => setPendingDelete(c.id)}
                  >
                    {l.delete}
                  </button>
                )}
              </div>
            )}

            {isReplying && (
              <div className="fx-comment-composer">
                <FxTextarea
                  value={draft}
                  rows={2}
                  aria-label={l.replyPlaceholder}
                  placeholder={l.replyPlaceholder}
                  onChange={(v) => setDraft(v)}
                />
                <div className="fx-comment-composer-actions">
                  <FxButton size="sm" variant="ghost" onClick={closeComposer}>
                    {l.cancel}
                  </FxButton>
                  <FxButton size="sm" disabled={draft.trim() === ''} onClick={() => submitReply(c.id)}>
                    {l.post}
                  </FxButton>
                </div>
              </div>
            )}
          </div>
        </div>

        {kids.length > 0 && depth < maxDepth && (
          <ul className="fx-comment-replies">
            {kids.map((k) => renderComment(k, depth + 1))}
          </ul>
        )}
      </li>
    );
  };

  return (
    <div className={rootClass}>
      <ul className="fx-comment-thread-list">{roots.map((c) => renderComment(c, 0))}</ul>

      <FxConfirmationDialog
        open={pendingDelete != null}
        onOpenChange={(o) => {
          if (!o) setPendingDelete(null);
        }}
        tone="danger"
        title={l.deleteTitle}
        description={l.deleteBody}
        confirmLabel={l.deleteConfirm}
        cancelLabel={l.cancel}
        onConfirm={() => {
          if (pendingDelete != null) onDelete?.(pendingDelete);
          setPendingDelete(null);
        }}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}
