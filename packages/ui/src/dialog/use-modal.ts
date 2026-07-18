'use client';
/**
 * Shared modal plumbing for the overlay family (Dialog, Right Drawer,
 * Confirmation Dialog). Keeps the SSR-safe portal gate, the controlled/
 * uncontrolled open convention (§1.5), the focus trap + restore contract
 * (11 §3.3–3.4) and `Esc`/scrim close in one place so every modal surface
 * behaves identically.
 */
import { useCallback, useEffect, useId, useRef, useState } from 'react';
import type { KeyboardEvent as ReactKeyboardEvent, RefObject } from 'react';

/** Reason a modal surface reported a close (§2.43 events). */
export type CloseReason = 'esc' | 'backdrop' | 'close-button' | 'api';

export interface UseModalOptions {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean, reason: CloseReason) => void;
  /** Veto hook — return false / rejected promise to keep the surface open. */
  onBeforeClose?: () => boolean | Promise<boolean>;
  /** `false` disables Esc + scrim close (forced decision). */
  dismissible?: boolean;
}

export interface UseModal {
  /** Resolved open state (controlled `open` wins over internal state). */
  open: boolean;
  /** True once mounted on the client — gate `createPortal` on this. */
  mounted: boolean;
  /** Ref for the surface root; focus trap + initial focus target it. */
  surfaceRef: RefObject<HTMLDivElement>;
  /** Stable ids for aria-labelledby / aria-describedby wiring. */
  titleId: string;
  descId: string;
  /** Request a close; runs the veto hook then notifies the owner. */
  requestClose: (reason: CloseReason) => void;
  /** onKeyDown handler for the surface — Esc close + focus trap cycling. */
  onKeyDown: (e: ReactKeyboardEvent) => void;
}

const FOCUSABLE =
  'a[href],button:not([disabled]),textarea:not([disabled]),input:not([disabled]),select:not([disabled]),[tabindex]:not([tabindex="-1"])';

export function useModal(opts: UseModalOptions): UseModal {
  const { open: controlled, defaultOpen = false, onOpenChange, onBeforeClose, dismissible = true } = opts;
  const isControlled = controlled !== undefined;
  const [internal, setInternal] = useState(defaultOpen);
  const open = isControlled ? controlled : internal;

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const surfaceRef = useRef<HTMLDivElement>(null);
  const restoreRef = useRef<HTMLElement | null>(null);
  const baseId = useId();
  const titleId = `${baseId}-title`;
  const descId = `${baseId}-desc`;

  const requestClose = useCallback(
    (reason: CloseReason) => {
      void (async () => {
        if (onBeforeClose) {
          const ok = await onBeforeClose();
          if (!ok) return;
        }
        if (!isControlled) setInternal(false);
        onOpenChange?.(false, reason);
      })();
    },
    [onBeforeClose, isControlled, onOpenChange],
  );

  // Capture the invoker + move focus into the surface on open; restore on close.
  useEffect(() => {
    if (!open || !mounted) return;
    restoreRef.current = document.activeElement as HTMLElement | null;
    const surface = surfaceRef.current;
    if (surface) {
      const first = surface.querySelector<HTMLElement>(FOCUSABLE);
      (first ?? surface).focus();
    }
    return () => {
      restoreRef.current?.focus?.();
    };
  }, [open, mounted]);

  const onKeyDown = useCallback(
    (e: ReactKeyboardEvent) => {
      if (e.key === 'Escape' && dismissible) {
        e.stopPropagation();
        requestClose('esc');
        return;
      }
      if (e.key !== 'Tab') return;
      const surface = surfaceRef.current;
      if (!surface) return;
      const nodes = Array.from(surface.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (n) => n.offsetParent !== null || n === document.activeElement,
      );
      if (nodes.length === 0) {
        e.preventDefault();
        surface.focus();
        return;
      }
      const firstNode = nodes[0];
      const lastNode = nodes[nodes.length - 1];
      if (!firstNode || !lastNode) return;
      const active = document.activeElement;
      if (e.shiftKey && active === firstNode) {
        e.preventDefault();
        lastNode.focus();
      } else if (!e.shiftKey && active === lastNode) {
        e.preventDefault();
        firstNode.focus();
      }
    },
    [dismissible, requestClose],
  );

  return { open, mounted, surfaceRef, titleId, descId, requestClose, onKeyDown };
}
