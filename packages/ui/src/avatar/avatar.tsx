'use client';
/**
 * FxAvatar — user/entity avatar (doc 04 §2.30).
 *
 * Fallback chain: image → (load error) initials → icon. The error fallback needs
 * component state (`useState`), so this is a client island (`'use client'`); its
 * showcase sets `interactive: true`. Initials get a deterministic background from
 * a name hash mapped onto the 5 tone fills — no new colour literals (§2.30).
 * Non-interactive by itself; wrap in a button/link for actions.
 */
import { useState } from 'react';
import { FxIcon } from '../icon/FxIcon';

export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type AvatarShape = 'circle' | 'square';
export type AvatarStatus = 'online' | 'away' | 'offline';

/** Tone buckets the name hash maps onto (no new literals — reuses §1.9 fills). */
const HUES = ['info', 'success', 'warning', 'danger', 'primary'] as const;

const DEFAULT_STATUS_LABELS: Record<AvatarStatus, string> = {
  online: 'Online',
  away: 'Away',
  offline: 'Offline',
};

export interface FxAvatarProps {
  /** Image source. */
  src?: string;
  /** Alt text — required with `src` (empty string for decorative-in-context). */
  alt?: string;
  /** Name — drives initials fallback and the deterministic background hue. */
  name?: string;
  /** Diameter. Defaults to `md`. */
  size?: AvatarSize;
  /** Circle or squircle. Defaults to `circle`. */
  shape?: AvatarShape;
  /** Presence dot. */
  status?: AvatarStatus | null;
  /** Accessible name for the status dot (visually hidden). */
  statusLabel?: string;
  className?: string;
}

/** First + last grapheme of a name, uppercased. */
function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '';
  const first = [...(parts[0] ?? '')][0] ?? '';
  const last = parts.length > 1 ? [...(parts[parts.length - 1] ?? '')][0] ?? '' : '';
  return (first + last).toUpperCase();
}

/** Stable hash → one of the 5 tone buckets. */
function hueOf(name: string): (typeof HUES)[number] {
  let h = 0;
  for (let i = 0; i < name.length; i += 1) h = (h * 31 + name.charCodeAt(i)) | 0;
  return HUES[Math.abs(h) % HUES.length] ?? 'primary';
}

export function FxAvatar({
  src,
  alt = '',
  name,
  size = 'md',
  shape = 'circle',
  status = null,
  statusLabel,
  className,
}: FxAvatarProps) {
  const [errored, setErrored] = useState(false);
  const showImage = src !== undefined && !errored;
  const initials = name ? initialsOf(name) : '';
  const hue = name ? hueOf(name) : 'primary';
  const resolvedStatusLabel = status ? statusLabel ?? DEFAULT_STATUS_LABELS[status] : undefined;

  return (
    <span
      className={className ? `fx-avatar ${className}` : 'fx-avatar'}
      data-size={size}
      data-shape={shape}
    >
      {showImage ? (
        <img
          className="fx-avatar-image"
          src={src}
          alt={alt}
          onError={() => setErrored(true)}
        />
      ) : initials ? (
        <span className="fx-avatar-initials" data-hue={hue} aria-hidden={alt ? undefined : true}>
          {initials}
        </span>
      ) : (
        <span className="fx-avatar-icon">
          <FxIcon name="users" size={16} label={alt || undefined} />
        </span>
      )}
      {status && (
        <span className="fx-avatar-status" data-status={status}>
          <span className="fx-avatar-status-label">{resolvedStatusLabel}</span>
        </span>
      )}
    </span>
  );
}
