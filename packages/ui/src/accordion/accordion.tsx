'use client';
/**
 * FxAccordion — stacked expandable sections (doc 04 §2.25, APG accordion).
 *
 * Each item is a `h{headingLevel}` wrapping a `button.fx-accordion-trigger`
 * carrying `aria-expanded` + `aria-controls`; its panel is `role="region"
 * aria-labelledby` and is hidden via the `hidden` attribute when closed. When
 * there are more than 6 items the region role is dropped (too many landmarks).
 * `multiple=false` closes siblings when opening; `collapsible=false` in single
 * mode keeps one item always open. Open state is controlled or uncontrolled
 * (§1.5). Keyboard: Enter/Space toggle; ArrowUp/Down move between triggers
 * (wrap); Home/End jump to ends.
 */
import { useCallback, useId, useRef, useState } from 'react';
import type { KeyboardEvent, ReactNode } from 'react';
import { FxIcon } from '../icon/FxIcon';

/** Visual style. `contained` boxes each item on its own surface. */
export type AccordionVariant = 'default' | 'contained';

/** Wrapper heading level for each item header. */
export type AccordionHeadingLevel = 2 | 3 | 4 | 5 | 6;

/** One accordion section. */
export interface AccordionItem {
  /** Unique id — used for open state and `aria-controls`. */
  id: string;
  /** Header text. */
  title: ReactNode;
  /** Secondary header line. */
  subtitle?: ReactNode;
  /** Panel body. */
  content: ReactNode;
  /** Non-togglable, dimmed. */
  disabled?: boolean;
}

export interface FxAccordionProps {
  /** The sections. */
  items: AccordionItem[];
  /** Controlled open ids (§1.5). */
  openIds?: string[];
  /** Uncontrolled initial open ids. */
  defaultOpenIds?: string[];
  /** Allow multiple sections open at once. Defaults to `false`. */
  multiple?: boolean;
  /** When `false` in single mode, one section is always open. Defaults to `true`. */
  collapsible?: boolean;
  /** Visual variant. Defaults to `default`. */
  variant?: AccordionVariant;
  /** Wrapper heading level. Defaults to `3`. */
  headingLevel?: AccordionHeadingLevel;
  /** Fired whenever the open set changes. */
  onOpenChange?: (openIds: string[]) => void;
  className?: string;
}

export function FxAccordion({
  items,
  openIds,
  defaultOpenIds = [],
  multiple = false,
  collapsible = true,
  variant = 'default',
  headingLevel = 3,
  onOpenChange,
  className,
}: FxAccordionProps) {
  const baseId = useId();
  const controlled = openIds !== undefined;
  const [internalOpen, setInternalOpen] = useState<string[]>(defaultOpenIds);
  const open = controlled ? openIds : internalOpen;
  const triggerRefs = useRef<Map<string, HTMLButtonElement>>(new Map());

  const Heading = `h${headingLevel}` as const;
  // APG: drop region landmarks once there are more than six panels.
  const useRegion = items.length <= 6;

  const commit = useCallback(
    (next: string[]) => {
      if (!controlled) setInternalOpen(next);
      onOpenChange?.(next);
    },
    [controlled, onOpenChange],
  );

  const toggle = (item: AccordionItem) => {
    if (item.disabled) return;
    const isOpen = open.includes(item.id);
    if (multiple) {
      commit(isOpen ? open.filter((id) => id !== item.id) : [...open, item.id]);
      return;
    }
    if (isOpen) {
      commit(collapsible ? [] : open);
    } else {
      commit([item.id]);
    }
  };

  const enabledIds = items.filter((it) => !it.disabled).map((it) => it.id);

  const focusTrigger = (id: string) => {
    triggerRefs.current.get(id)?.focus();
  };

  const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>, id: string) => {
    const idx = enabledIds.indexOf(id);
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (idx >= 0) focusTrigger(enabledIds[(idx + 1) % enabledIds.length]!);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (idx >= 0) focusTrigger(enabledIds[(idx - 1 + enabledIds.length) % enabledIds.length]!);
    } else if (e.key === 'Home') {
      e.preventDefault();
      if (enabledIds[0]) focusTrigger(enabledIds[0]);
    } else if (e.key === 'End') {
      e.preventDefault();
      const last = enabledIds[enabledIds.length - 1];
      if (last) focusTrigger(last);
    }
  };

  const rootClass = ['fx-accordion', className].filter(Boolean).join(' ');

  return (
    <div className={rootClass} data-variant={variant}>
      {items.map((item) => {
        const isOpen = open.includes(item.id);
        const triggerId = `${baseId}-trigger-${item.id}`;
        const panelId = `${baseId}-panel-${item.id}`;
        const itemClass = [
          'fx-accordion-item',
          isOpen ? 'is-open' : '',
          item.disabled ? 'is-disabled' : '',
        ]
          .filter(Boolean)
          .join(' ');

        return (
          <div key={item.id} className={itemClass} data-open={isOpen || undefined}>
            <Heading className="fx-accordion-header">
              <button
                ref={(el) => {
                  if (el) triggerRefs.current.set(item.id, el);
                  else triggerRefs.current.delete(item.id);
                }}
                type="button"
                className="fx-accordion-trigger"
                id={triggerId}
                aria-expanded={isOpen}
                aria-controls={panelId}
                aria-disabled={item.disabled || undefined}
                disabled={item.disabled}
                onClick={() => toggle(item)}
                onKeyDown={(e) => onKeyDown(e, item.id)}
              >
                <span className="fx-accordion-heading-text">
                  <span className="fx-accordion-title">{item.title}</span>
                  {item.subtitle != null && (
                    <span className="fx-accordion-subtitle">{item.subtitle}</span>
                  )}
                </span>
                <span className="fx-accordion-chevron" aria-hidden="true">
                  <FxIcon name="chevron" size={16} />
                </span>
              </button>
            </Heading>
            <div
              className="fx-accordion-panel"
              id={panelId}
              role={useRegion ? 'region' : undefined}
              aria-labelledby={useRegion ? triggerId : undefined}
              hidden={!isOpen}
            >
              <div className="fx-accordion-panel-inner">{item.content}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
