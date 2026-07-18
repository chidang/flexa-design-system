'use client';
/**
 * FxAlert — inline, persistent contextual message (doc 04 §2.41).
 *
 * Not a toast (transient) and not a Validation Message (field-level). Tone
 * pairs colour with an icon + text (never colour alone, 11 §6.3). `live`
 * upgrades a dynamically-injected alert to a live region: danger/warning →
 * `role="alert"`, else `role="status"`; statically-rendered alerts have no
 * live role.
 */
import type { ReactNode } from 'react';
import { FxIcon, type FxIconProps } from '../icon/FxIcon';
import type { IconName } from '../icon/map';
import type { Tone } from '../enums';

/** Tone → dedicated canonical status glyph (added to the icon map for U1–U4). */
const TONE_ICON: Record<Tone, IconName> = {
  neutral: 'info',
  info: 'info',
  success: 'success',
  warning: 'warning',
  danger: 'error',
};

export interface FxAlertProps {
  tone?: Tone;
  title?: ReactNode;
  description: ReactNode;
  appearance?: 'subtle' | 'solid';
  dismissible?: boolean;
  /** Ghost/secondary buttons or links only. */
  actions?: ReactNode;
  /** Icon name override; omit to use the tone default. */
  icon?: IconName;
  /** true when injected after load (assigns a live role). */
  live?: boolean;
  dismissLabel?: string;
  onDismiss?: () => void;
  className?: string;
  testId?: string;
}

export function FxAlert({
  tone = 'info',
  title,
  description,
  appearance = 'subtle',
  dismissible = false,
  actions,
  icon,
  live = false,
  dismissLabel = 'Dismiss',
  onDismiss,
  className,
  testId,
}: FxAlertProps) {
  const role = live ? (tone === 'danger' || tone === 'warning' ? 'alert' : 'status') : undefined;
  const iconName = icon ?? TONE_ICON[tone];
  const iconProps: FxIconProps = { name: iconName, size: 20 };

  return (
    <div
      className={className ? `fx-alert ${className}` : 'fx-alert'}
      data-tone={tone}
      data-appearance={appearance}
      role={role}
      data-testid={testId}
    >
      <span className="fx-alert-icon">
        <FxIcon {...iconProps} />
      </span>
      <div className="fx-alert-content">
        {title != null && <div className="fx-alert-title">{title}</div>}
        <div className="fx-alert-description">{description}</div>
        {actions != null && <div className="fx-alert-actions">{actions}</div>}
      </div>
      {dismissible && (
        <button type="button" className="fx-alert-dismiss" aria-label={dismissLabel} onClick={onDismiss}>
          <FxIcon name="close" size={16} />
        </button>
      )}
    </div>
  );
}
