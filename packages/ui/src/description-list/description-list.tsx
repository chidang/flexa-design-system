/**
 * FxDescriptionList — term/detail pairs (doc 04 §3.5): detail panes, order
 * metadata, settings review.
 *
 * Pure presentational (no hooks) → renders as an RSC in docs. Semantic `<dl>` /
 * `<dt>` / `<dd>`; `layout` controls horizontal (term column) vs vertical
 * (stacked) vs grid (columns). Each row wraps its pair in a `<div>` so grid/flex
 * can target it — valid `<dl>` grouping.
 */
import type { ReactNode } from 'react';

export type DescriptionListLayout = 'horizontal' | 'vertical' | 'grid';

export interface DescriptionListItem {
  term: string;
  detail: ReactNode;
  /** Grid span (grid layout only). */
  span?: 1 | 2;
}

export interface FxDescriptionListProps {
  items: DescriptionListItem[];
  /** Defaults to `horizontal` (term column). */
  layout?: DescriptionListLayout;
  /** Grid column count (grid layout). Defaults to 1. */
  columns?: 1 | 2;
  /** Hairline separators between rows. */
  divided?: boolean;
  className?: string;
}

export function FxDescriptionList({
  items,
  layout = 'horizontal',
  columns = 1,
  divided = false,
  className,
}: FxDescriptionListProps) {
  return (
    <dl
      className={className ? `fx-description-list ${className}` : 'fx-description-list'}
      data-layout={layout}
      data-columns={layout === 'grid' ? columns : undefined}
      data-divided={divided || undefined}
    >
      {items.map((item, i) => (
        <div
          key={i}
          className="fx-description-list-row"
          data-span={layout === 'grid' && item.span ? item.span : undefined}
        >
          <dt className="fx-description-list-term">{item.term}</dt>
          <dd className="fx-description-list-detail">{item.detail}</dd>
        </div>
      ))}
    </dl>
  );
}
