'use client';
/**
 * FxSplitView — master-detail two-pane shell (doc 04 §3.1).
 *
 * A resizable list pane (`.fx-split-view-list`) + a draggable separator
 * (`role="separator"`) + a detail pane (`.fx-split-view-detail`). Width is
 * controlled OR uncontrolled: pass `listWidth` (px) + `onListWidthChange` to own
 * it, else it defaults to `defaultListWidth` and tracks internally. The mouse
 * path is a pointer drag on the separator; the keyboard path resizes in 16px
 * steps with `Arrow` keys, and `Enter` toggles the collapsed pane.
 *
 * `collapsed` drives the mobile single-pane view (one of `'none' | 'list' |
 * 'detail'`); when the detail pane is showing on mobile, a back button surfaces
 * to return to the list. The separator carries the full range ARIA
 * (`aria-valuenow/min/max`), so assistive tech reads the current width.
 */
import { useCallback, useRef, useState } from 'react';
import type { KeyboardEvent, PointerEvent, ReactNode } from 'react';
import { FxIcon } from '../icon/FxIcon';

/** Which pane is shown when the layout collapses to one column (mobile). */
export type SplitViewCollapsed = 'none' | 'list' | 'detail';

export interface FxSplitViewProps {
  /** Master pane content (list). */
  list: ReactNode;
  /** Detail pane content. */
  detail: ReactNode;
  /** Controlled list width in px. Omit for uncontrolled. */
  listWidth?: number;
  /** Initial list width in px when uncontrolled. Defaults to 320. */
  defaultListWidth?: number;
  /** Fired on every resize (drag or keyboard) with the new px width. */
  onListWidthChange?: (width: number) => void;
  /** Lower clamp for the list pane, px. Defaults to 280. */
  minListWidth?: number;
  /** Upper clamp for the list pane, px. Defaults to 400. */
  maxListWidth?: number;
  /** Collapse to a single pane (mobile). Defaults to `'none'`. */
  collapsed?: SplitViewCollapsed;
  /** Accessible name for the resize separator. */
  separatorLabel?: string;
  /** Back button label shown in the detail pane when collapsed to detail. */
  backLabel?: string;
  /** Fired when the mobile back button is pressed (return to list). */
  onBack?: () => void;
  className?: string;
}

/** Keyboard resize increment (px). */
const STEP = 16;

const clamp = (n: number, lo: number, hi: number): number => Math.max(lo, Math.min(hi, n));

export function FxSplitView({
  list,
  detail,
  listWidth,
  defaultListWidth = 320,
  onListWidthChange,
  minListWidth = 280,
  maxListWidth = 400,
  collapsed = 'none',
  separatorLabel = 'Resize panes',
  backLabel = 'Back',
  onBack,
  className,
}: FxSplitViewProps) {
  const controlled = listWidth !== undefined;
  const [internal, setInternal] = useState(() =>
    clamp(defaultListWidth, minListWidth, maxListWidth),
  );
  const width = clamp(controlled ? listWidth! : internal, minListWidth, maxListWidth);
  const dragging = useRef(false);

  const setWidth = useCallback(
    (next: number) => {
      const w = clamp(Math.round(next), minListWidth, maxListWidth);
      if (!controlled) setInternal(w);
      onListWidthChange?.(w);
    },
    [controlled, minListWidth, maxListWidth, onListWidthChange],
  );

  const rootRef = useRef<HTMLDivElement>(null);

  const onPointerDown = useCallback((e: PointerEvent<HTMLDivElement>) => {
    dragging.current = true;
    e.currentTarget.setPointerCapture(e.pointerId);
  }, []);

  const onPointerMove = useCallback(
    (e: PointerEvent<HTMLDivElement>) => {
      if (!dragging.current) return;
      const rect = rootRef.current?.getBoundingClientRect();
      if (!rect) return;
      setWidth(e.clientX - rect.left);
    },
    [setWidth],
  );

  const onPointerUp = useCallback((e: PointerEvent<HTMLDivElement>) => {
    dragging.current = false;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
  }, []);

  const onKeyDown = useCallback(
    (e: KeyboardEvent<HTMLDivElement>) => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setWidth(width - STEP);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        setWidth(width + STEP);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        // Toggle the collapse hint via back affordance; hosts own the state, so
        // surface it through onBack (the sole collapse-toggle callback here).
        onBack?.();
      }
    },
    [width, setWidth, onBack],
  );

  const showList = collapsed !== 'detail';
  const showDetail = collapsed !== 'list';
  const showSeparator = collapsed === 'none';

  return (
    <div
      ref={rootRef}
      className={className ? `fx-split-view ${className}` : 'fx-split-view'}
      data-collapsed={collapsed !== 'none' ? collapsed : undefined}
    >
      {showList && (
        <div className="fx-split-view-list" style={{ width: `${width}px` }}>
          {list}
        </div>
      )}

      {showSeparator && (
        <div
          className="fx-split-view-separator"
          role="separator"
          aria-orientation="vertical"
          aria-label={separatorLabel}
          aria-valuenow={width}
          aria-valuemin={minListWidth}
          aria-valuemax={maxListWidth}
          tabIndex={0}
          onKeyDown={onKeyDown}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
        />
      )}

      {showDetail && (
        <div className="fx-split-view-detail">
          {collapsed === 'detail' && (
            <button type="button" className="fx-split-view-back" onClick={onBack}>
              <FxIcon name="back" size={16} />
              <span>{backLabel}</span>
            </button>
          )}
          {detail}
        </div>
      )}
    </div>
  );
}
