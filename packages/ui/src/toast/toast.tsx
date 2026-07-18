'use client';
/**
 * FxToast — transient, non-blocking notification (doc 04 §2.40).
 *
 * Managed by a single per-app `.fx-toast-region` (`FxToastRegion`) that owns the
 * live region, the max-3-visible queue and the timers. Products get an
 * imperative controller via `useToast()`: `toast.show(options) → id`,
 * `toast.dismiss(id)`, `toast.update(id, options)`. Toasts never steal focus;
 * neutral/info/success announce polite (`role="status"`), warning/danger
 * assertive (`role="alert"`); danger persists until dismissed.
 *
 * SSR-safe: the region portal is gated on a client-mount flag (rule 4) so it
 * renders nothing under renderToStaticMarkup / static export.
 */
import { createPortal } from 'react-dom';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type MutableRefObject,
  type ReactNode,
} from 'react';
import { FxIcon } from '../icon/FxIcon';
import type { IconName } from '../icon/map';
import type { Tone } from '../enums';

const MAX_VISIBLE = 3;
const DEFAULT_DURATION = 5000;
const WARNING_DURATION = 8000;

/** Tone → dedicated canonical status glyph (added to the icon map for U1–U4). */
const TONE_ICON: Record<Tone, IconName> = {
  neutral: 'info',
  info: 'info',
  success: 'success',
  warning: 'warning',
  danger: 'error',
};

export type ToastDismissReason = 'timeout' | 'user' | 'action' | 'api';

export interface ToastOptions {
  tone?: Tone;
  title: string;
  description?: string;
  /** ms; `null` = persistent. Danger defaults to persistent. */
  duration?: number | null;
  action?: { label: string; onClick: () => void };
  dismissible?: boolean;
  dismissLabel?: string;
  onDismiss?: (id: string, reason: ToastDismissReason) => void;
}

interface ToastEntry extends ToastOptions {
  id: string;
}

export interface ToastController {
  show: (options: ToastOptions) => string;
  dismiss: (id: string, reason?: ToastDismissReason) => void;
  update: (id: string, options: Partial<ToastOptions>) => void;
}

const ToastContext = createContext<ToastController | null>(null);

/** Imperative toast controller. Must be used under an `<FxToastRegion>`. */
export function useToast(): ToastController {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within <FxToastRegion>');
  return ctx;
}

function resolveDuration(t: ToastEntry): number | null {
  if (t.duration !== undefined) return t.duration;
  // feedback.md §3 (binding): danger persists until dismissed; warning defaults to 8s.
  if (t.tone === 'danger') return null;
  if (t.tone === 'warning') return WARNING_DURATION;
  return DEFAULT_DURATION;
}

export interface FxToastRegionProps {
  children?: ReactNode;
  /** Accessible name for the region landmark. */
  label?: string;
}

let seq = 0;

/** Mounts the toast region + queue and provides the imperative controller. */
export function FxToastRegion({ children, label = 'Notifications' }: FxToastRegionProps) {
  const [toasts, setToasts] = useState<ToastEntry[]>([]);
  const [queue, setQueue] = useState<ToastEntry[]>([]);
  const [mounted, setMounted] = useState(false);
  const paused = useRef(false);

  useEffect(() => setMounted(true), []);

  const dismiss = useCallback((id: string, reason: ToastDismissReason = 'api') => {
    setToasts((cur) => {
      const found = cur.find((t) => t.id === id);
      found?.onDismiss?.(id, reason);
      return cur.filter((t) => t.id !== id);
    });
  }, []);

  // Promote queued toasts as visible slots free up.
  useEffect(() => {
    if (toasts.length >= MAX_VISIBLE || queue.length === 0) return;
    setQueue((q) => {
      if (q.length === 0) return q;
      const [next, ...rest] = q;
      if (next) setToasts((cur) => [next, ...cur].slice(0, MAX_VISIBLE));
      return rest;
    });
  }, [toasts.length, queue.length]);

  const show = useCallback(
    (options: ToastOptions): string => {
      const id = `fx-toast-${++seq}`;
      const entry: ToastEntry = { ...options, id };
      setToasts((cur) => {
        if (cur.length < MAX_VISIBLE) return [entry, ...cur];
        // Full stack: a danger toast evicts the oldest non-danger toast (feedback.md §5);
        // toasts are stored newest-first, so the oldest is nearest the end.
        if (entry.tone === 'danger') {
          const oldestNonDanger = [...cur].reverse().find((t) => t.tone !== 'danger');
          if (oldestNonDanger) {
            oldestNonDanger.onDismiss?.(oldestNonDanger.id, 'api');
            return [entry, ...cur.filter((t) => t.id !== oldestNonDanger.id)];
          }
        }
        setQueue((q) => [...q, entry]);
        return cur;
      });
      return id;
    },
    [],
  );

  const update = useCallback((id: string, options: Partial<ToastOptions>) => {
    setToasts((cur) => cur.map((t) => (t.id === id ? { ...t, ...options } : t)));
    setQueue((q) => q.map((t) => (t.id === id ? { ...t, ...options } : t)));
  }, []);

  const controller = useMemo<ToastController>(() => ({ show, dismiss, update }), [show, dismiss, update]);

  return (
    <ToastContext.Provider value={controller}>
      {children}
      {mounted &&
        createPortal(
          <div
            className="fx-toast-region"
            role="region"
            aria-label={label}
            onMouseEnter={() => {
              paused.current = true;
            }}
            onMouseLeave={() => {
              paused.current = false;
            }}
            onFocusCapture={() => {
              paused.current = true;
            }}
            onBlurCapture={() => {
              paused.current = false;
            }}
          >
            {toasts.map((t) => (
              <ToastItem key={t.id} toast={t} pausedRef={paused} onDismiss={dismiss} />
            ))}
          </div>,
          document.body,
        )}
    </ToastContext.Provider>
  );
}

interface ToastItemProps {
  toast: ToastEntry;
  pausedRef: MutableRefObject<boolean>;
  onDismiss: (id: string, reason: ToastDismissReason) => void;
}

function ToastItem({ toast, pausedRef, onDismiss }: ToastItemProps) {
  const duration = resolveDuration(toast);
  const assertive = toast.tone === 'warning' || toast.tone === 'danger';
  const dismissible = toast.dismissible ?? true;
  const iconName = TONE_ICON[toast.tone ?? 'neutral'];

  // Auto-dismiss timer that pauses while the region is hovered/focused.
  useEffect(() => {
    if (duration == null) return;
    const start = Date.now();
    let remaining = duration;
    let handle: ReturnType<typeof setTimeout>;
    const tick = () => {
      if (pausedRef.current) {
        handle = setTimeout(tick, 120);
        return;
      }
      const elapsed = Date.now() - start;
      remaining = duration - elapsed;
      if (remaining <= 0) onDismiss(toast.id, 'timeout');
      else handle = setTimeout(tick, Math.min(remaining, 120));
    };
    handle = setTimeout(tick, Math.min(remaining, 120));
    return () => clearTimeout(handle);
  }, [duration, toast.id, pausedRef, onDismiss]);

  return (
    <div className="fx-toast" data-tone={toast.tone ?? 'neutral'} role={assertive ? 'alert' : 'status'}>
      <span className="fx-toast-icon">
        <FxIcon name={iconName} size={20} />
      </span>
      <div className="fx-toast-content">
        <div className="fx-toast-title">{toast.title}</div>
        {toast.description && <div className="fx-toast-description">{toast.description}</div>}
      </div>
      {toast.action && (
        <button
          type="button"
          className="fx-toast-action"
          onClick={() => {
            toast.action?.onClick();
            onDismiss(toast.id, 'action');
          }}
        >
          {toast.action.label}
        </button>
      )}
      {dismissible && (
        <button
          type="button"
          className="fx-toast-dismiss"
          aria-label={toast.dismissLabel ?? 'Dismiss'}
          onClick={() => onDismiss(toast.id, 'user')}
        >
          <FxIcon name="close" size={16} />
        </button>
      )}
    </div>
  );
}

/**
 * FxToast — a single presentational toast surface. The imperative queue
 * (`FxToastRegion` + `useToast`) is the primary API; this render component is
 * exported for the showcase and for hosts that render toasts declaratively.
 */
export interface FxToastProps extends ToastOptions {
  className?: string;
  testId?: string;
}

export function FxToast({
  tone = 'neutral',
  title,
  description,
  action,
  dismissible = true,
  dismissLabel = 'Dismiss',
  className,
  testId,
}: FxToastProps) {
  const assertive = tone === 'warning' || tone === 'danger';
  return (
    <div
      className={className ? `fx-toast ${className}` : 'fx-toast'}
      data-tone={tone}
      role={assertive ? 'alert' : 'status'}
      data-testid={testId}
    >
      <span className="fx-toast-icon">
        <FxIcon name={TONE_ICON[tone]} size={20} />
      </span>
      <div className="fx-toast-content">
        <div className="fx-toast-title">{title}</div>
        {description && <div className="fx-toast-description">{description}</div>}
      </div>
      {action && (
        <button type="button" className="fx-toast-action" onClick={action.onClick}>
          {action.label}
        </button>
      )}
      {dismissible && (
        <button type="button" className="fx-toast-dismiss" aria-label={dismissLabel}>
          <FxIcon name="close" size={16} />
        </button>
      )}
    </div>
  );
}
