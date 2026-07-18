/**
 * FxSkeletonLoader — content placeholder (doc 04 §2.32).
 *
 * Pure presentational (no hooks) → renders as an RSC in docs. Skeletons are
 * `aria-hidden`; the replaced region carries `aria-busy` + a `role="status"`
 * loading text provided by the owning surface. `text` shape with `lines`
 * renders a group; the shimmer respects `prefers-reduced-motion` in CSS.
 */
import type { CSSProperties } from 'react';

export type SkeletonShape = 'text' | 'rect' | 'circle';

export interface FxSkeletonLoaderProps {
  /** Placeholder shape. Defaults to `text`. */
  shape?: SkeletonShape;
  /** CSS length. Text defaults to a stable-random width per line. */
  width?: string;
  /** CSS length. Text defaults to `1em`. */
  height?: string;
  /** Convenience for multi-line text blocks. Defaults to 1. */
  lines?: number;
  /** Animate the shimmer. Defaults to `true` (dropped under reduced motion). */
  animated?: boolean;
  className?: string;
}

/** Deterministic per-line width so re-renders don't reflow (last line shorter). */
function lineWidth(index: number, total: number): string {
  if (index === total - 1 && total > 1) return '60%';
  const widths = ['100%', '92%', '96%', '88%'];
  return widths[index % widths.length] ?? '100%';
}

function Bar({
  shape,
  animated,
  style,
  className,
}: {
  shape: SkeletonShape;
  animated: boolean;
  style?: CSSProperties;
  className?: string;
}) {
  return (
    <span
      className={className ? `fx-skeleton ${className}` : 'fx-skeleton'}
      data-shape={shape}
      data-animated={animated || undefined}
      style={style}
      aria-hidden="true"
    />
  );
}

export function FxSkeletonLoader({
  shape = 'text',
  width,
  height,
  lines = 1,
  animated = true,
  className,
}: FxSkeletonLoaderProps) {
  if (shape === 'text' && lines > 1) {
    return (
      <span className="fx-skeleton-group" aria-hidden="true">
        {Array.from({ length: lines }, (_, i) => (
          <Bar
            key={i}
            shape="text"
            animated={animated}
            className={className}
            style={{ inlineSize: width ?? lineWidth(i, lines), blockSize: height }}
          />
        ))}
      </span>
    );
  }
  return (
    <Bar
      shape={shape}
      animated={animated}
      className={className}
      style={{ inlineSize: width, blockSize: height }}
    />
  );
}
