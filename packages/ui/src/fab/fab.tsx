/**
 * FxFloatingActionButton — a single circular promoted action floating above
 * content (doc 04 §3.2).
 *
 * Pure/RSC: one primary button (standard circle or extended pill). `aria-label`
 * is mandatory (icon-only rule §1.7.5). The optional speed-dial menu and
 * hide-on-scroll behaviors are host compositions bound to this trigger — the
 * base control owns no open/scroll state, so it stays hook-free and
 * server-renderable.
 */
import { FxIcon } from '../icon/FxIcon';
import type { IconName } from '../icon/map';

export interface FxFloatingActionButtonProps {
  /** Glyph shown in the button. */
  icon: IconName;
  /** Accessible name (always required) + visible text when `extended`. */
  label: string;
  /** Render as a pill with a visible label. */
  extended?: boolean;
  /** True when a host binds a speed-dial menu to this trigger. */
  hasMenu?: boolean;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}

export function FxFloatingActionButton({
  icon,
  label,
  extended = false,
  hasMenu = false,
  onClick,
  disabled,
  className,
}: FxFloatingActionButtonProps) {
  return (
    <button
      type="button"
      className={className ? `fx-fab ${className}` : 'fx-fab'}
      data-extended={extended || undefined}
      aria-label={label}
      aria-haspopup={hasMenu ? 'menu' : undefined}
      onClick={onClick}
      disabled={disabled}
    >
      <FxIcon name={icon} size={24} />
      {extended && <span className="fx-fab-label">{label}</span>}
    </button>
  );
}
