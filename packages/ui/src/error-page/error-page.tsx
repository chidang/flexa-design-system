'use client';
/**
 * FxErrorPage — the full Content-Area error surface (doc 04 §3.6).
 *
 * A big status code slot sitting above an FxEmptyState (`size="lg"`): title
 * (the page `h1`), description and an actions slot (Go home / Retry / Contact
 * support). Sensible English defaults per code live in `DEFAULT_ERROR_COPY`;
 * an unknown `string` code falls back to the 500 copy. The `h1` receives focus
 * on mount (host owns document.title — this component owns presentation only).
 */
import { useEffect, useRef, type ReactNode } from 'react';
import { FxEmptyState } from '../empty-state/empty-state';

/** Canonical status codes with baked defaults; any other `string` is allowed. */
export type ErrorPageCode = 403 | 404 | 500 | 'offline' | string;

/** Default title/description per code (English; override via props). */
export const DEFAULT_ERROR_COPY: Record<
  '403' | '404' | '500' | 'offline',
  { title: string; description: string }
> = {
  '404': {
    title: 'Page not found',
    description: "The page you're looking for doesn't exist or was moved.",
  },
  '403': {
    title: 'Access denied',
    description: "You don't have permission to view this page.",
  },
  '500': {
    title: 'Something went wrong',
    description: 'An unexpected error occurred on our end. Please try again.',
  },
  offline: {
    title: "You're offline",
    description: 'Check your connection and try again — your changes are safe.',
  },
};

export interface FxErrorPageProps {
  /** Status code shown in the big code slot + default-copy key. */
  code: ErrorPageCode;
  /** Overrides the per-code default title (the page `h1`). */
  title?: ReactNode;
  /** Overrides the per-code default description. */
  description?: ReactNode;
  /** Action slot — Go home / Retry / Contact support. */
  actions?: ReactNode;
  /** Support-correlation id (rendered small + subtle). */
  requestId?: string;
  /** Request-id line prefix. */
  requestIdLabel?: string;
  className?: string;
}

function defaultCopy(code: ErrorPageCode) {
  const key = String(code) as '403' | '404' | '500' | 'offline';
  return DEFAULT_ERROR_COPY[key] ?? DEFAULT_ERROR_COPY['500'];
}

export function FxErrorPage({
  code,
  title,
  description,
  actions,
  requestId,
  requestIdLabel = 'Reference',
  className,
}: FxErrorPageProps) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  const copy = defaultCopy(code);
  const resolvedTitle = title ?? copy.title;
  const resolvedDescription = description ?? copy.description;

  const heading = (
    <h1 ref={headingRef} tabIndex={-1} className="fx-error-page-title">
      {resolvedTitle}
    </h1>
  );

  const body = (
    <>
      {resolvedDescription}
      {requestId != null && (
        <span className="fx-error-page-request-id">
          {requestIdLabel}: {requestId}
        </span>
      )}
    </>
  );

  return (
    <div className={className ? `fx-error-page ${className}` : 'fx-error-page'}>
      <p className="fx-error-page-code" aria-hidden="true">
        {String(code)}
      </p>
      <FxEmptyState size="lg" title={heading} description={body} actions={actions} />
    </div>
  );
}
