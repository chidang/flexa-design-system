/**
 * FxBreadcrumb — hierarchy trail from section root to current page (doc 04 §2.35).
 *
 * Pure/RSC: renders an ordered list of links; the last item is the current page
 * (`aria-current="page"`, not a link). No hooks — overflow collapses to a static
 * ellipsis marker (the interactive ellipsis-menu variant is a host composition
 * with FxContextMenu; keeping the base pure keeps it server-renderable).
 */
import type { ReactNode } from 'react';
import { FxIcon } from '../icon/FxIcon';
import type { IconName } from '../icon/map';

export interface BreadcrumbItem {
  label: string;
  href?: string;
  icon?: IconName;
}

export interface FxBreadcrumbProps {
  /** Ordered trail; the last item is treated as the current page. */
  items: BreadcrumbItem[];
  /** Overflow: middle items collapse into an ellipsis (first + last 2 kept). */
  maxItems?: number;
  /** Accessible name for the landmark. */
  ariaLabel?: string;
  className?: string;
}

type Rendered = BreadcrumbItem | 'ellipsis';

function collapse(items: BreadcrumbItem[], maxItems: number): Rendered[] {
  if (items.length <= maxItems) return items;
  const first = items[0];
  const lastTwo = items.slice(-2);
  return first ? [first, 'ellipsis', ...lastTwo] : [...lastTwo];
}

export function FxBreadcrumb({
  items,
  maxItems = 4,
  ariaLabel = 'Breadcrumb',
  className,
}: FxBreadcrumbProps) {
  const rendered = collapse(items, maxItems);
  const lastIndex = rendered.length - 1;

  return (
    <nav
      className={className ? `fx-breadcrumb ${className}` : 'fx-breadcrumb'}
      aria-label={ariaLabel}
    >
      <ol className="fx-breadcrumb-list">
        {rendered.map((entry, i) => {
          const isLast = i === lastIndex;
          return (
            <li className="fx-breadcrumb-item" key={entry === 'ellipsis' ? `ellipsis-${i}` : `${entry.label}-${i}`}>
              {entry === 'ellipsis' ? (
                <span className="fx-breadcrumb-ellipsis" aria-hidden="true">
                  <FxIcon name="more" size={16} />
                </span>
              ) : isLast || entry.href === undefined ? (
                <span
                  className="fx-breadcrumb-current"
                  aria-current={isLast ? 'page' : undefined}
                >
                  {crumbBody(entry)}
                </span>
              ) : (
                <a className="fx-breadcrumb-link" href={entry.href}>
                  {crumbBody(entry)}
                </a>
              )}
              {!isLast && (
                <span className="fx-breadcrumb-separator" aria-hidden="true">
                  {'›'}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

function crumbBody(item: BreadcrumbItem): ReactNode {
  return (
    <>
      {item.icon && <FxIcon name={item.icon} size={16} />}
      <span className="fx-breadcrumb-text">{item.label}</span>
    </>
  );
}
