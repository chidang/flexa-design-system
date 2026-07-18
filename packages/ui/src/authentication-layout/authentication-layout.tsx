'use client';
/**
 * FxAuthenticationLayout — centered auth card shell (doc 04 §3.1).
 *
 * A single `main` centers an ≈400px card (`.fx-auth-layout-card`) carrying a
 * logo slot, an `h1` title, the form slot (children), and a footer of switch-
 * mode links. An optional brand `aside` panel shows only ≥1024px. Auth errors
 * render through an FxAlert (tone danger, `live` so failed submits announce);
 * moving focus to the error is the host's job.
 */
import type { ReactNode } from 'react';
import { FxAlert } from '../alert/alert';

export interface FxAuthenticationLayoutProps {
  /** Card heading (rendered as the single `h1`). */
  title: string;
  /** Brand mark above the title. */
  logo?: ReactNode;
  /** The auth form. */
  children: ReactNode;
  /** Switch-mode links (e.g. "Create account" / "Forgot password?"). */
  footer?: ReactNode;
  /** Brand panel shown alongside the card ≥1024px. */
  aside?: ReactNode;
  /** Auth error message — rendered in a live FxAlert (tone danger). */
  error?: ReactNode;
  className?: string;
}

export function FxAuthenticationLayout({
  title,
  logo,
  children,
  footer,
  aside,
  error,
  className,
}: FxAuthenticationLayoutProps) {
  return (
    <div
      className={className ? `fx-auth-layout ${className}` : 'fx-auth-layout'}
      data-has-aside={aside != null || undefined}
    >
      <main className="fx-auth-layout-main">
        <div className="fx-auth-layout-card">
          {logo != null && <div className="fx-auth-layout-logo">{logo}</div>}
          <h1 className="fx-auth-layout-title">{title}</h1>
          {error != null && (
            <div className="fx-auth-layout-error">
              <FxAlert tone="danger" description={error} live />
            </div>
          )}
          <div className="fx-auth-layout-form">{children}</div>
          {footer != null && <div className="fx-auth-layout-footer">{footer}</div>}
        </div>
      </main>

      {aside != null && <aside className="fx-auth-layout-aside">{aside}</aside>}
    </div>
  );
}
