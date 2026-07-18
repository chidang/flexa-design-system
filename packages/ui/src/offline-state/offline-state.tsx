'use client';
/**
 * FxOfflineState — the connectivity surface (doc 04 §3.6). Two modes:
 *
 * - **banner**: an FxAlert `tone="warning"` ("You're offline — changes will sync
 *   when reconnected") with a retry action. Detection wiring is the host's, but
 *   this component may read `navigator.onLine` + the `online`/`offline` events
 *   to auto-manage itself: it hides while online, and on reconnect it politely
 *   announces "Back online" before auto-dismissing. All `navigator`/`window`
 *   access is inside `useEffect` (SSR-safe; the a11y gate static-renders this).
 * - **page**: delegates to `<FxErrorPage code="offline" />` for a hard stop.
 */
import { useEffect, useState, type ReactNode } from 'react';
import { FxAlert } from '../alert/alert';
import { FxErrorPage } from '../error-page/error-page';

export type OfflineStateMode = 'banner' | 'page';

/** User-facing strings for the banner + announcements (English defaults). */
export interface OfflineStateLabels {
  /** Banner description while offline. */
  offlineMessage: string;
  /** Retry action label. */
  retryLabel: string;
  /** Announced (and briefly shown) on reconnect. */
  onlineLabel: string;
  /** Announced while a retry is in flight. */
  retryingLabel: string;
}

export const DEFAULT_OFFLINE_STATE_LABELS: OfflineStateLabels = {
  offlineMessage: "You're offline — changes will sync when reconnected.",
  retryLabel: 'Retry',
  onlineLabel: 'Back online',
  retryingLabel: 'Reconnecting…',
};

export interface FxOfflineStateProps {
  /** `banner` (ambient) or `page` (hard stop). */
  mode: OfflineStateMode;
  /** Retry handler (host owns the actual reconnect). */
  onRetry?: () => void;
  /** Retry-in-flight announcement (banner). */
  retryingLabel?: string;
  /** Reconnect announcement (banner). */
  onlineLabel?: string;
  /** i18n overrides for every baked string. */
  labels?: Partial<OfflineStateLabels>;
  /** Page-mode: recovery actions passed through to FxErrorPage. */
  actions?: ReactNode;
  className?: string;
}

export function FxOfflineState({
  mode,
  onRetry,
  retryingLabel,
  onlineLabel,
  labels,
  actions,
  className,
}: FxOfflineStateProps) {
  const copy: OfflineStateLabels = {
    ...DEFAULT_OFFLINE_STATE_LABELS,
    ...labels,
    ...(retryingLabel != null ? { retryingLabel } : {}),
    ...(onlineLabel != null ? { onlineLabel } : {}),
  };

  const rootClass = className ? `fx-offline-state ${className}` : 'fx-offline-state';

  if (mode === 'page') {
    return (
      <div className={rootClass} data-mode="page">
        <FxErrorPage code="offline" description={copy.offlineMessage} actions={actions} />
      </div>
    );
  }

  return (
    <div className={rootClass} data-mode="banner">
      <OfflineBanner copy={copy} onRetry={onRetry} />
    </div>
  );
}

/** Banner mode. Auto-manages visibility from navigator connectivity events. */
function OfflineBanner({
  copy,
  onRetry,
}: {
  copy: OfflineStateLabels;
  onRetry?: () => void;
}) {
  // Undefined until mount → SSR/static render shows the banner (a page always
  // renders content); the effect corrects it to the real connectivity state.
  const [offline, setOffline] = useState<boolean | undefined>(undefined);
  const [reconnected, setReconnected] = useState(false);
  const [retrying, setRetrying] = useState(false);

  useEffect(() => {
    setOffline(!navigator.onLine);
    const goOffline = () => {
      setOffline(true);
      setReconnected(false);
      setRetrying(false);
    };
    const goOnline = () => {
      setOffline(false);
      setRetrying(false);
      // Announce "Back online" briefly, then dismiss.
      setReconnected(true);
      const t = setTimeout(() => setReconnected(false), 3000);
      cleanups.push(() => clearTimeout(t));
    };
    const cleanups: Array<() => void> = [];
    window.addEventListener('offline', goOffline);
    window.addEventListener('online', goOnline);
    return () => {
      window.removeEventListener('offline', goOffline);
      window.removeEventListener('online', goOnline);
      cleanups.forEach((fn) => fn());
    };
  }, []);

  const handleRetry = () => {
    setRetrying(true);
    onRetry?.();
  };

  // Reconnect confirmation (polite).
  if (offline === false) {
    if (!reconnected) return null;
    return <FxAlert tone="success" live description={copy.onlineLabel} />;
  }

  // offline === true, or undefined during SSR/static render (default to shown).
  return (
    <FxAlert
      tone="warning"
      live={offline === true}
      description={retrying ? copy.retryingLabel : copy.offlineMessage}
      actions={
        onRetry != null ? (
          <button type="button" className="fx-offline-state-retry" onClick={handleRetry}>
            {copy.retryLabel}
          </button>
        ) : undefined
      }
    />
  );
}
