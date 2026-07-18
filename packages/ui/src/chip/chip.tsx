/**
 * FxChip — compact interactive token (doc 04 §2.29): selected filters, choice
 * chips, tag-input values.
 *
 * Stateless by construction — choice mode reports intent via `onChange(selected)`
 * and reflects the parent-owned `selected` prop; dismissal fires `onDismiss()`.
 * No hooks → renders as an RSC in docs. The icon-only remove affordance carries
 * an `aria-label` (`removeLabel`), per §1.7.5.
 */
import type { KeyboardEvent } from 'react';
import type { Size } from '../enums';
import { FxIcon } from '../icon/FxIcon';
import type { IconName } from '../icon/map';

export interface FxChipProps {
  /** Chip text. */
  label: string;
  /** Choice-chip mode: parent-owned pressed state (toggle). */
  selected?: boolean;
  /** Renders the remove button. */
  dismissible?: boolean;
  /** Accessible name for the remove button. `{label}` is substituted. */
  removeLabel?: string;
  /** Leading icon. */
  icon?: IconName;
  /** Height. Defaults to `md`. */
  size?: Size;
  /** Disable activation and dismissal. */
  disabled?: boolean;
  /** Fires on chip activation. */
  onClick?: () => void;
  /** Fires in choice mode with the next pressed state. */
  onChange?: (selected: boolean) => void;
  /** Fires when the remove button (or Delete/Backspace) dismisses the chip. */
  onDismiss?: () => void;
  className?: string;
}

export function FxChip({
  label,
  selected,
  dismissible = false,
  removeLabel = 'Remove {label}',
  icon,
  size = 'md',
  disabled = false,
  onClick,
  onChange,
  onDismiss,
  className,
}: FxChipProps) {
  const choice = selected !== undefined;
  const removeText = removeLabel.replace('{label}', label);
  const rootClass = [
    'fx-chip',
    selected ? 'is-selected' : '',
    disabled ? 'is-disabled' : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ');

  function activate() {
    if (disabled) return;
    onClick?.();
    if (choice) onChange?.(!selected);
  }

  function onKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (disabled) return;
    if (dismissible && (event.key === 'Delete' || event.key === 'Backspace')) {
      event.preventDefault();
      onDismiss?.();
    }
  }

  return (
    <span className={rootClass} data-size={size}>
      <button
        type="button"
        className="fx-chip-main"
        onClick={activate}
        onKeyDown={onKeyDown}
        disabled={disabled}
        aria-pressed={choice ? selected : undefined}
      >
        {icon && <FxIcon name={icon} size={16} className="fx-chip-icon" />}
        <span className="fx-chip-label">{label}</span>
      </button>
      {dismissible && (
        <button
          type="button"
          className="fx-chip-remove"
          onClick={() => !disabled && onDismiss?.()}
          disabled={disabled}
          aria-label={removeText}
        >
          <FxIcon name="close" size={16} />
        </button>
      )}
    </span>
  );
}
