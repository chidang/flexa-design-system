'use client';
/**
 * useAnchorPosition — fixed-position coordinates for a portalled popover,
 * anchored to its trigger (the tooltip pattern, shared).
 *
 * Portalled surfaces leave their DOM context, so CSS alone cannot anchor them —
 * without measured coordinates a portalled popover lands at the end of `<body>`
 * (viewport bottom-left). Opens below the anchor, flips above when the viewport
 * bottom would clip it and there is more room above, clamps inline to the
 * viewport, and tracks scroll/resize while open.
 */
import { useCallback, useLayoutEffect, useState, type CSSProperties, type RefObject } from 'react';

export interface AnchorOptions {
  /** Gap between anchor and popover in px. Default 4. */
  gap?: number;
  /** Popover min-width follows the anchor width (select-like fields). */
  matchWidth?: boolean;
  /** Horizontal alignment against the anchor. Default 'start'. */
  align?: 'start' | 'end';
}

/** Viewport inset the popover never crosses. */
const EDGE = 8;

export function useAnchorPosition(
  open: boolean,
  anchorRef: RefObject<HTMLElement | null>,
  popoverRef: RefObject<HTMLElement | null>,
  { gap = 4, matchWidth = false, align = 'start' }: AnchorOptions = {},
): CSSProperties | undefined {
  const [style, setStyle] = useState<CSSProperties | undefined>(undefined);

  const place = useCallback(() => {
    const anchor = anchorRef.current;
    const pop = popoverRef.current;
    if (!anchor || !pop) return;
    const a = anchor.getBoundingClientRect();
    const p = pop.getBoundingClientRect();
    let top = a.bottom + gap;
    if (top + p.height > window.innerHeight - EDGE && a.top - gap - p.height > EDGE) {
      top = a.top - gap - p.height;
    }
    let left = align === 'end' ? a.right - p.width : a.left;
    left = Math.max(EDGE, Math.min(left, window.innerWidth - p.width - EDGE));
    const minWidth = matchWidth ? a.width : undefined;
    // Bail out when already placed — lets the convergence effect below settle.
    setStyle((prev) =>
      prev && prev.top === top && prev.left === left && prev.minWidth === minWidth
        ? prev
        : { position: 'fixed', top, left, ...(minWidth != null ? { minWidth } : null) },
    );
  }, [anchorRef, popoverRef, gap, matchWidth, align]);

  // Layout effect: measure + place before paint (no bottom-left flash). `style`
  // is a dependency on purpose — the first pass measures the popover BEFORE the
  // coordinates/minWidth apply (its width can change once they do), so a second
  // pass re-measures and corrects; the bail-out above stops the loop.
  useLayoutEffect(() => {
    if (!open) {
      setStyle(undefined);
      return;
    }
    place();
    window.addEventListener('scroll', place, true);
    window.addEventListener('resize', place);
    return () => {
      window.removeEventListener('scroll', place, true);
      window.removeEventListener('resize', place);
    };
  }, [open, place, style]);

  return style;
}
