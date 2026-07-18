'use client';
/**
 * FxTooltip — text-only hover/focus hint (doc 04 §2.45).
 *
 * Wraps a single trigger element, wires `aria-describedby` → the tooltip id, and
 * shows on hover AND focus; hides on Esc, blur, pointer-leave. The tooltip is
 * never focusable and never carries interactive content. SSR-safe portal gate
 * per rule 4; fade honours prefers-reduced-motion via CSS.
 */
import { createPortal } from 'react-dom';
import {
  cloneElement,
  isValidElement,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type FocusEvent as ReactFocusEvent,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent as ReactMouseEvent,
  type ReactElement,
} from 'react';

export type TooltipPlacement = 'top' | 'bottom' | 'start' | 'end';

export interface FxTooltipProps {
  /** Plain text only. Never interactive content. */
  content: string;
  placement?: TooltipPlacement;
  /** Open delay in ms (close is instant). */
  delay?: number;
  disabled?: boolean;
  /** Exactly one focusable trigger element. */
  children: ReactElement;
}

interface Coords {
  top: number;
  left: number;
}

export function FxTooltip({ content, placement = 'top', delay = 600, disabled = false, children }: FxTooltipProps) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [coords, setCoords] = useState<Coords>({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLElement | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => setMounted(true), []);
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const position = useCallback(() => {
    const el = triggerRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const gap = 8;
    let top = r.top;
    let left = r.left;
    if (placement === 'top') {
      top = r.top - gap;
      left = r.left + r.width / 2;
    } else if (placement === 'bottom') {
      top = r.bottom + gap;
      left = r.left + r.width / 2;
    } else if (placement === 'start') {
      top = r.top + r.height / 2;
      left = r.left - gap;
    } else {
      top = r.top + r.height / 2;
      left = r.right + gap;
    }
    setCoords({ top, left });
  }, [placement]);

  const show = useCallback(() => {
    if (disabled) return;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      position();
      setOpen(true);
    }, delay);
  }, [disabled, delay, position]);

  const hide = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    setOpen(false);
  }, []);

  if (!isValidElement(children)) return children;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- trigger is an arbitrary element
  const childProps = children.props as Record<string, any>;
  const described = [childProps['aria-describedby'], open ? id : undefined].filter(Boolean).join(' ') || undefined;

  const trigger = cloneElement(children as ReactElement<Record<string, unknown>>, {
    ref: (node: HTMLElement | null) => {
      triggerRef.current = node;
      const r = (children as { ref?: unknown }).ref;
      if (typeof r === 'function') r(node);
      else if (r && typeof r === 'object') (r as { current: HTMLElement | null }).current = node;
    },
    'aria-describedby': described,
    onMouseEnter: (e: ReactMouseEvent) => {
      childProps.onMouseEnter?.(e);
      show();
    },
    onMouseLeave: (e: ReactMouseEvent) => {
      childProps.onMouseLeave?.(e);
      hide();
    },
    onFocus: (e: ReactFocusEvent) => {
      childProps.onFocus?.(e);
      position();
      setOpen(true);
    },
    onBlur: (e: ReactFocusEvent) => {
      childProps.onBlur?.(e);
      hide();
    },
    onKeyDown: (e: ReactKeyboardEvent) => {
      childProps.onKeyDown?.(e);
      if (e.key === 'Escape') hide();
    },
  });

  return (
    <>
      {trigger}
      {open &&
        mounted &&
        createPortal(
          <div
            id={id}
            role="tooltip"
            className="fx-tooltip"
            data-placement={placement}
            style={{ position: 'fixed', top: coords.top, left: coords.left }}
          >
            {content}
          </div>,
          document.body,
        )}
    </>
  );
}
