/**
 * FxTag — categorical label (doc 04 §2.28). Inert by default; becomes an
 * interactive filter affordance when `href` or `onClick` is given (then renders
 * a native `<a>`/`<button>`, so keyboard/focus come for free). Unlike FxBadge
 * (status, inert) and FxChip (dismissible input artifact).
 *
 * Pure presentational (no hooks) → renders as an RSC in docs.
 */
import type { MouseEventHandler, ReactNode } from 'react';
import type { Tone } from '../enums';
import { FxIcon } from '../icon/FxIcon';
import type { IconName } from '../icon/map';

export interface FxTagProps {
  /** Categorical tone. Defaults to `neutral`. */
  tone?: Tone;
  /** Height. Defaults to `md`. */
  size?: 'sm' | 'md';
  /** Leading icon. */
  icon?: IconName;
  /** Filter-link target; renders the tag as an interactive `<a>`. */
  href?: string;
  /** Renders the tag as an interactive `<button>` (when no `href`). */
  onClick?: MouseEventHandler<HTMLAnchorElement & HTMLButtonElement>;
  children?: ReactNode;
  className?: string;
}

export function FxTag({ tone = 'neutral', size = 'md', icon, href, onClick, children, className }: FxTagProps) {
  const inner = (
    <>
      {icon && <FxIcon name={icon} size={16} className="fx-tag-icon" />}
      {children != null && <span className="fx-tag-label">{children}</span>}
    </>
  );

  if (href !== undefined) {
    return (
      <a
        className={className ? `fx-tag is-interactive ${className}` : 'fx-tag is-interactive'}
        data-tone={tone}
        data-size={size}
        href={href}
        onClick={onClick}
      >
        {inner}
      </a>
    );
  }
  if (onClick !== undefined) {
    return (
      <button
        type="button"
        className={className ? `fx-tag is-interactive ${className}` : 'fx-tag is-interactive'}
        data-tone={tone}
        data-size={size}
        onClick={onClick}
      >
        {inner}
      </button>
    );
  }
  return (
    <span className={className ? `fx-tag ${className}` : 'fx-tag'} data-tone={tone} data-size={size}>
      {inner}
    </span>
  );
}
