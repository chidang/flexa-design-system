/**
 * FxMaintenanceBanner — ambient scheduled-maintenance notice (doc 04 §3.6).
 *
 * As Warning Banner, but the tone is `'info' | 'warning'` and it is NOT
 * dismissible while the active window holds. It is ambient rather than urgent,
 * so the root carries `role="status"` on mount (not `alert`) — announced once,
 * politely. `scheduledFor` (ISO) is rendered locale-formatted in the render body
 * (never at module top-level, so static markup stays deterministic-safe).
 *
 * Presentational (no hooks) → renders fine as a server component in docs.
 */
import type { ReactNode } from 'react';
import { FxAlert } from '../alert/alert';

export interface MaintenanceBannerLabels {
  /** Default title when none is supplied. */
  title: string;
  /** Prefix before the locale-formatted `scheduledFor` time. */
  scheduledFor: string;
}

export const DEFAULT_MAINTENANCE_BANNER_LABELS: MaintenanceBannerLabels = {
  title: 'Scheduled maintenance',
  scheduledFor: 'Scheduled for',
};

export interface FxMaintenanceBannerProps {
  /** `'info'` (default, upcoming/ambient) or `'warning'` (window active). */
  tone?: 'info' | 'warning';
  /** Override the default "Scheduled maintenance" title. */
  title?: ReactNode;
  /** The message body. */
  children?: ReactNode;
  /** ISO timestamp of the maintenance window; rendered locale-formatted. */
  scheduledFor?: string;
  /** Pin below the Top Navigation at `z.sticky`. */
  sticky?: boolean;
  /** BCP-47 locale for the `scheduledFor` time. */
  locale?: string;
  /** i18n string overrides. */
  labels?: Partial<MaintenanceBannerLabels>;
  className?: string;
  testId?: string;
}

function formatWindow(iso: string, prefix: string, locale?: string): string | null {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  const when = new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' }).format(date);
  return `${prefix} ${when}`;
}

export function FxMaintenanceBanner({
  tone = 'info',
  title,
  children,
  scheduledFor,
  sticky = true,
  locale,
  labels,
  className,
  testId,
}: FxMaintenanceBannerProps) {
  const strings = { ...DEFAULT_MAINTENANCE_BANNER_LABELS, ...labels };
  const rootClass = className ? `fx-maintenance-banner ${className}` : 'fx-maintenance-banner';
  const window = scheduledFor ? formatWindow(scheduledFor, strings.scheduledFor, locale) : null;

  const description = (
    <>
      {children}
      {window != null && <span className="fx-maintenance-banner-window">{window}</span>}
    </>
  );

  return (
    <div
      className={rootClass}
      data-tone={tone}
      data-sticky={sticky ? 'true' : undefined}
      role="status"
      data-testid={testId}
    >
      <FxAlert tone={tone} title={title ?? strings.title} description={description} dismissible={false} />
    </div>
  );
}
