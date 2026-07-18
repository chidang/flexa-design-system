'use client';
/**
 * FxSettingsLayout — a two-pane settings shell (doc 04 §3.1).
 *
 * A vertical nav (`.fx-settings-nav`) of section links + a content column
 * (`.fx-settings-content`) hosting the active section, with a sticky save bar
 * (`.fx-settings-save-bar`) that appears ONLY when `dirty`. Nav links get
 * `aria-current="page"` on the active section. The save bar is a `role="status"`
 * live region announcing the unsaved-changes message, and carries the
 * Save/Discard FxButtons.
 */
import type { ReactNode } from 'react';
import { FxButton } from '../button/button';
import { FxIcon } from '../icon/FxIcon';
import type { IconName } from '../icon/map';

export interface SettingsSection {
  id: string;
  label: string;
  /** Optional leading icon (canonical name). */
  icon?: IconName;
  href: string;
}

export interface FxSettingsLayoutProps {
  /** Section links, in display order. */
  sections: SettingsSection[];
  /** The active section id (its link gets `aria-current="page"`). */
  activeId?: string;
  /** The active section's content (title + description + a Card of fields). */
  children: ReactNode;
  /** Unsaved changes — reveals the sticky save bar. */
  dirty?: boolean;
  onSave?: () => void;
  onDiscard?: () => void;
  saveLabel?: string;
  discardLabel?: string;
  /** Message announced when the save bar appears. */
  unsavedLabel?: string;
  /** Accessible name for the settings nav landmark. */
  navAriaLabel?: string;
  className?: string;
}

export function FxSettingsLayout({
  sections,
  activeId,
  children,
  dirty = false,
  onSave,
  onDiscard,
  saveLabel = 'Save changes',
  discardLabel = 'Discard',
  unsavedLabel = 'You have unsaved changes',
  navAriaLabel = 'Settings',
  className,
}: FxSettingsLayoutProps) {
  return (
    <div
      className={className ? `fx-settings-layout ${className}` : 'fx-settings-layout'}
      data-dirty={dirty || undefined}
    >
      <nav className="fx-settings-nav" aria-label={navAriaLabel}>
        <ul className="fx-settings-nav-list">
          {sections.map((section) => {
            const active = section.id === activeId;
            return (
              <li key={section.id}>
                <a
                  className="fx-settings-nav-link"
                  href={section.href}
                  aria-current={active ? 'page' : undefined}
                  data-active={active || undefined}
                >
                  {section.icon && (
                    <span className="fx-settings-nav-icon">
                      <FxIcon name={section.icon} size={16} />
                    </span>
                  )}
                  <span className="fx-settings-nav-label">{section.label}</span>
                </a>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="fx-settings-content">{children}</div>

      {dirty && (
        <div className="fx-settings-save-bar" role="status">
          <span className="fx-settings-save-message">{unsavedLabel}</span>
          <div className="fx-settings-save-actions">
            <FxButton variant="ghost" onClick={onDiscard}>
              {discardLabel}
            </FxButton>
            <FxButton variant="primary" onClick={onSave}>
              {saveLabel}
            </FxButton>
          </div>
        </div>
      )}
    </div>
  );
}
