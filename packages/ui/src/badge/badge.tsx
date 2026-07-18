/**
 * FxBadge — status descriptor (doc 04 §2.27). Non-interactive, no focus.
 *
 * Tone follows §1.9: solid = `color.<tone>` fill; subtle = tone tint; outline =
 * tone-coloured border. Per §1.7.7 a toned badge should pair colour with an icon
 * or dot — `icon`/`dot` provide that; bare numeric counts carry `srLabel`.
 * Pure presentational (no hooks) → renders as an RSC in docs.
 */
import type { HTMLAttributes, ReactNode } from 'react';
import type { Tone } from '../enums';
import { FxIcon } from '../icon/FxIcon';
import type { IconName } from '../icon/map';

export type BadgeAppearance = 'solid' | 'subtle' | 'outline';

export interface FxBadgeProps extends Omit<HTMLAttributes<HTMLSpanElement>, 'className'> {
  /** Status tone. Defaults to `neutral`. */
  tone?: Tone;
  /** Fill treatment. Defaults to `subtle`. */
  appearance?: BadgeAppearance;
  /** Height. Defaults to `md`. */
  size?: 'sm' | 'md';
  /** Leading icon (pairs colour with a glyph per §1.7.7). */
  icon?: IconName;
  /** Show a leading status dot. */
  dot?: boolean;
  /** Numeric badge (notifications). Values above `maxCount` render `{maxCount}+`. */
  count?: number;
  /** Cap for `count`. Defaults to 99. */
  maxCount?: number;
  /** Visually-hidden expansion — required for bare numeric badges. */
  srLabel?: string;
  children?: ReactNode;
}

export function FxBadge({
  tone = 'neutral',
  appearance = 'subtle',
  size = 'md',
  icon,
  dot = false,
  count,
  maxCount = 99,
  srLabel,
  children,
  ...rest
}: FxBadgeProps) {
  const countText =
    count === undefined ? undefined : count > maxCount ? `${maxCount}+` : String(count);
  return (
    <span
      className="fx-badge"
      data-tone={tone}
      data-appearance={appearance}
      data-size={size}
      {...rest}
    >
      {dot && <span className="fx-badge-dot" aria-hidden="true" />}
      {icon && <FxIcon name={icon} size={16} className="fx-badge-icon" />}
      {children != null && <span className="fx-badge-label">{children}</span>}
      {countText !== undefined && (
        <span className="fx-badge-count" aria-hidden={srLabel ? true : undefined}>
          {countText}
        </span>
      )}
      {srLabel && <span className="fx-badge-sr">{srLabel}</span>}
    </span>
  );
}
