/**
 * FxCard — generic content container (doc 04 §2.23); the compositional base for
 * Metric/Product/Order cards.
 *
 * Pure presentational (no hooks) → renders as an RSC in docs. Interactive cards
 * get hover elevation + pointer, but the accessible action is the **title link**
 * (a whole-card click is a pointer convenience) — the root is never
 * `role="button"`. Regions (media/header/body/footer) render only when supplied.
 */
import type { ElementType, ReactNode } from 'react';

export type CardPadding = 'none' | 'sm' | 'md' | 'lg';
export type CardElement = 'div' | 'article' | 'section' | 'a';

export interface FxCardProps {
  /** Body padding. Defaults to `md`. */
  padding?: CardPadding;
  /** Hover elevation + pointer. Requires an onClick or a header link. */
  interactive?: boolean;
  /** Selection ring (pairs with a checkbox in bulk contexts). */
  selected?: boolean;
  /** Semantic element. Defaults to `div`. */
  as?: CardElement;
  /** Full-bleed media region (top). */
  media?: ReactNode;
  /** Title text (rendered in the header). */
  title?: ReactNode;
  /** Subtitle text (rendered in the header). */
  subtitle?: ReactNode;
  /** Header-actions slot (right of the title). */
  headerActions?: ReactNode;
  /** Footer region (actions). */
  footer?: ReactNode;
  /** Body content. */
  children?: ReactNode;
  /** Whole-card link target (with `as='a'`). */
  href?: string;
  onClick?: () => void;
  className?: string;
}

export function FxCard({
  padding = 'md',
  interactive = false,
  selected = false,
  as = 'div',
  media,
  title,
  subtitle,
  headerActions,
  footer,
  children,
  href,
  onClick,
  className,
}: FxCardProps) {
  const Root: ElementType = as;
  const rootClass = [
    'fx-card',
    interactive ? 'is-interactive' : '',
    selected ? 'is-selected' : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ');
  const hasHeader = title != null || subtitle != null || headerActions != null;

  return (
    <Root
      className={rootClass}
      data-padding={padding}
      data-selected={selected || undefined}
      {...(as === 'a' ? { href } : {})}
      {...(onClick ? { onClick } : {})}
    >
      {media != null && <div className="fx-card-media">{media}</div>}
      {hasHeader && (
        <div className="fx-card-header">
          <div className="fx-card-header-text">
            {title != null && <div className="fx-card-title">{title}</div>}
            {subtitle != null && <div className="fx-card-subtitle">{subtitle}</div>}
          </div>
          {headerActions != null && <div className="fx-card-header-actions">{headerActions}</div>}
        </div>
      )}
      {children != null && <div className="fx-card-body">{children}</div>}
      {footer != null && <div className="fx-card-footer">{footer}</div>}
    </Root>
  );
}
