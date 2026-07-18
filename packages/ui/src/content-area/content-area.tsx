/**
 * FxContentArea — the page body of an app shell (doc 04 §3.1).
 *
 * Pure/RSC: the single `main` of a routed page. Renders an optional breadcrumb
 * trail, the page `h1` (required), an actions slot (page-level buttons; the host
 * keeps at most one primary), and the body. The title carries `tabindex="-1"` so
 * a route change can move focus to it, announcing the new page to screen readers.
 * Width is capped by a container token; `full` opts out.
 */
import type { ReactNode } from 'react';
import { FxBreadcrumb } from '../breadcrumb/breadcrumb';
import type { BreadcrumbItem } from '../breadcrumb/breadcrumb';

/** Container cap for the content column (maps to `size.container-*`). */
export type ContentAreaMaxWidth = 'md' | 'lg' | 'xl' | 'full';

export interface FxContentAreaProps {
  /** The page heading — rendered as the `h1`. Required. */
  title: string;
  /** Hierarchy trail shown above the title. */
  breadcrumb?: BreadcrumbItem[];
  /** Page-level buttons (host keeps at most one primary). */
  actions?: ReactNode;
  /** Container cap for the column. */
  maxWidth?: ContentAreaMaxWidth;
  /** Optional id so a shell skip-link / `main` can target this region. */
  id?: string;
  /** Accessible name for the `main` landmark (defaults to the title). */
  ariaLabel?: string;
  className?: string;
  /** Page body. */
  children?: ReactNode;
}

export function FxContentArea({
  title,
  breadcrumb,
  actions,
  maxWidth = 'xl',
  id,
  ariaLabel,
  className,
  children,
}: FxContentAreaProps) {
  return (
    <main
      id={id}
      className={className ? `fx-content-area ${className}` : 'fx-content-area'}
      data-max-width={maxWidth}
      aria-label={ariaLabel ?? title}
    >
      <div className="fx-content-area-inner">
        <div className="fx-content-area-header">
          {breadcrumb && breadcrumb.length > 0 && (
            <FxBreadcrumb items={breadcrumb} className="fx-content-area-breadcrumb" />
          )}
          <div className="fx-content-area-heading">
            <h1 className="fx-content-area-title" tabIndex={-1}>
              {title}
            </h1>
            {actions && <div className="fx-content-area-actions">{actions}</div>}
          </div>
        </div>

        <div className="fx-content-area-body">{children}</div>
      </div>
    </main>
  );
}
