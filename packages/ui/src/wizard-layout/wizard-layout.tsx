'use client';
/**
 * FxWizardLayout — a distraction-free shell for a multi-step flow (doc 04 §3.1).
 *
 * No Sidebar, no Top Navigation: a minimal header (logo slot + a ghost
 * "Save & exit" button) sits above a centered column (`size.container-md`) that
 * hosts the wizard (an FxFormWizard) plus an optional footer slot. Exiting mid-
 * flow surfaces an unsaved-changes concern — this component simply calls
 * `onExit`; the HOST is responsible for confirming (e.g. an FxDialog veto)
 * before actually navigating away.
 */
import type { ReactNode } from 'react';
import { FxButton } from '../button/button';

export interface FxWizardLayoutProps {
  /** The wizard (typically an FxFormWizard) rendered in the centered column. */
  children: ReactNode;
  /** Brand mark rendered at the header start. */
  logo?: ReactNode;
  /** Called when "Save & exit" is pressed. The host confirms unsaved changes. */
  onExit?: () => void;
  /** Exit button label. */
  exitLabel?: string;
  /** Reserved: show step progress context (host wizard renders its own steps). */
  showSteps?: boolean;
  /**
   * Column cap (`size.container-*`). `md` keeps the focused single-column
   * default; `lg`/`xl` fit flows that carry a persistent side rail (checkout's
   * form + summary).
   */
  width?: 'md' | 'lg' | 'xl';
  /** Optional footer content below the wizard column. */
  footerSlot?: ReactNode;
  className?: string;
}

export function FxWizardLayout({
  children,
  logo,
  onExit,
  exitLabel = 'Save & exit',
  showSteps = true,
  width = 'md',
  footerSlot,
  className,
}: FxWizardLayoutProps) {
  return (
    <div
      className={className ? `fx-wizard-layout ${className}` : 'fx-wizard-layout'}
      data-show-steps={showSteps || undefined}
      data-width={width}
    >
      <header className="fx-wizard-layout-header">
        <div className="fx-wizard-layout-logo">{logo}</div>
        <div className="fx-wizard-layout-exit">
          <FxButton variant="ghost" onClick={onExit}>
            {exitLabel}
          </FxButton>
        </div>
      </header>

      <main className="fx-wizard-layout-main">
        <div className="fx-wizard-layout-column">{children}</div>
      </main>

      {footerSlot != null && <footer className="fx-wizard-layout-footer">{footerSlot}</footer>}
    </div>
  );
}
