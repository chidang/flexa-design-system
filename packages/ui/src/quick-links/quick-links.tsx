/**
 * FxQuickLinks — a card of navigation shortcuts (doc 04 §FxQuickLinks): a title
 * over a `ul` of icon + label + trailing-chevron link rows. Pure navigation — no
 * metrics or state. External links open in a new tab with a hidden "(opens in new
 * tab)" and an external-link glyph.
 *
 * Pure presentational (no hooks) → renders as an RSC in docs.
 */
import { FxCard } from '../card/card';
import { FxIcon } from '../icon/FxIcon';
import type { IconName } from '../icon/map';

export interface QuickLink {
  label: string;
  href: string;
  icon?: IconName;
  external?: boolean;
}

export interface FxQuickLinksProps {
  /** Card title. Defaults to `'Quick links'`. */
  title?: string;
  /** Navigation shortcuts. */
  links: QuickLink[];
  /** 1- or 2-column grid. Defaults to `1`. */
  columns?: 1 | 2;
  className?: string;
}

export function FxQuickLinks({ title = 'Quick links', links, columns = 1, className }: FxQuickLinksProps) {
  const rootClass = className ? `fx-quick-links ${className}` : 'fx-quick-links';

  return (
    <FxCard className={rootClass} title={title}>
      <ul className="fx-quick-links-list" data-columns={columns}>
        {links.map((link) => (
          <li className="fx-quick-links-item" key={link.href}>
            <a
              className="fx-quick-links-link"
              href={link.href}
              {...(link.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
            >
              {link.icon && (
                <span className="fx-quick-links-icon" aria-hidden="true">
                  <FxIcon name={link.icon} size={20} />
                </span>
              )}
              <span className="fx-quick-links-label">{link.label}</span>
              {link.external && <span className="fx-quick-links-sr">(opens in new tab)</span>}
              <span className="fx-quick-links-trailing" aria-hidden="true">
                <FxIcon name={link.external ? 'external-link' : 'chevron'} size={16} />
              </span>
            </a>
          </li>
        ))}
      </ul>
    </FxCard>
  );
}
