/**
 * FxMention — the inline @-mention token (doc 04 §3.8 "FxMention — Mention").
 *
 * An inline chip in rendered text that links to a user's profile. Pure
 * presentational (no hooks) → renders as an RSC in docs; when `interactive=false`
 * it renders a plain `<span>` (static text, e.g. inside a read-only transcript).
 * `MentionUser` is defined here and imported by chat / comment-thread /
 * mention-picker. Token bg is a primary tint, text `color.primary`, radius
 * `radius.sm`.
 *
 * The picker face lives in `mention-picker.tsx` (a client island); both are
 * re-exported from this module.
 */

/** A user that can be mentioned (doc 04 §3.8). Serialized as `@[name](userId)`. */
export interface MentionUser {
  id: string;
  name: string;
  handle: string;
  avatarSrc?: string;
}

export interface FxMentionProps {
  /** The mentioned user. */
  user: MentionUser;
  /**
   * When `true` (default) the token is a link to the user's profile; when
   * `false` it renders as static text (e.g. inside a read-only transcript).
   */
  interactive?: boolean;
  /** Profile href. Defaults to `/@{handle}`. */
  href?: string;
  className?: string;
}

/** The inline mention token. Pure (no hooks) — safe as an RSC. */
export function FxMention({ user, interactive = true, href, className }: FxMentionProps) {
  const rootClass = ['fx-mention', className].filter(Boolean).join(' ');
  const label = `@${user.name}`;
  const target = href ?? `/@${user.handle}`;
  if (!interactive) {
    return (
      <span className={rootClass} data-static="true">
        {label}
      </span>
    );
  }
  return (
    <a className={rootClass} href={target} title={`@${user.handle}`}>
      {label}
    </a>
  );
}

export { FxMentionPicker, DEFAULT_MENTION_PICKER_LABELS } from './mention-picker';
export type { FxMentionPickerProps, MentionPickerLabels } from './mention-picker';
