'use client';
/**
 * FxKanbanBoard — a board of columns holding draggable cards (doc 04 §3.5).
 *
 * Interactive + SSR-safe: columns are `role="group"` labelled by their header
 * (title + count Badge + column menu); cards are interactive FxCards carrying a
 * drag handle. Fully controlled — `columns`/`cards` + `onCardMove`/`onCardClick`
 * are the source of truth for positions; the only internal state is the in-flight
 * keyboard drag (lift → move → drop) and the polite live-announcement string.
 *
 * Keyboard drag protocol (APG-style): a focused card's handle takes `Space` to
 * lift; `Arrow` keys then move the lifted card within/between columns; `Space`
 * drops (committing via `onCardMove`); `Esc` cancels. When nothing is lifted,
 * `Arrow` keys navigate between cards (single roving Tab flow). Every move is
 * announced through a `role="status"` region, e.g. `'{title} moved to {column},
 * position {n}'`. The live region is portalled only after mount so static markup
 * carries no dangling IDREFs.
 */
import { useCallback, useMemo, useRef, useState } from 'react';
import type { KeyboardEvent, ReactNode } from 'react';
import { FxCard } from '../card/card';
import { FxBadge, type FxBadgeProps } from '../badge/badge';
import { FxAvatar } from '../avatar/avatar';
import { FxContextMenu, type MenuItem } from '../context-menu/context-menu';
import { FxIcon } from '../icon/FxIcon';
import type { Tone } from '../enums';

export interface KanbanColumn {
  id: string;
  title: string;
  /** WIP limit — over-limit count renders in `color.danger`. */
  limit?: number;
  /** Header accent tone. */
  tone?: Tone;
}

export interface KanbanCard {
  id: string;
  columnId: string;
  title: string;
  description?: string;
  assignee?: { name: string; avatarSrc?: string };
  badges?: FxBadgeProps[];
  /** Sort key within a column (ascending). */
  order: number;
}

export interface CardMovePayload {
  cardId: string;
  from: string;
  to: string;
  index: number;
}

export interface KanbanLabels {
  /** Column footer add-card button (per-column `{column}` interpolated). */
  addCard: string;
  /** Drag-handle button on each card (`{title}` interpolated). */
  dragHandle: string;
  /** Column overflow-menu button (`{column}` interpolated). */
  columnMenu: string;
  /** Announced when a card is lifted for keyboard drag. */
  lifted: string;
  /** Announced on every keyboard move / final drop. */
  moved: string;
  /** Announced when a drag is cancelled with Esc. */
  cancelled: string;
}

/** English defaults; every user-facing string is overridable via `labels`. */
export const DEFAULT_KANBAN_LABELS: KanbanLabels = {
  addCard: 'Add card',
  dragHandle: 'Drag {title}',
  columnMenu: '{column} options',
  lifted: '{title} lifted. Use arrow keys to move, space to drop, escape to cancel.',
  moved: '{title} moved to {column}, position {n}',
  cancelled: '{title} drag cancelled',
};

export interface FxKanbanBoardProps {
  columns: KanbanColumn[];
  cards: KanbanCard[];
  /** Overflow-menu items per column (menu shown only when non-empty). */
  columnMenuItems?: MenuItem[];
  onCardMove?: (payload: CardMovePayload) => void;
  onCardClick?: (card: KanbanCard) => void;
  onColumnMenuSelect?: (columnId: string, item: MenuItem) => void;
  onAddCard?: (columnId: string) => void;
  /** Replace default card body (title/description/assignee/badges). */
  renderCard?: (card: KanbanCard) => ReactNode;
  /** Legacy single-string add label; folded into `labels.addCard`. */
  addCardLabel?: string;
  labels?: Partial<KanbanLabels>;
  className?: string;
}

const fmt = (tpl: string, vars: Record<string, string | number>): string =>
  tpl.replace(/\{(\w+)\}/g, (_, k: string) => String(vars[k] ?? ''));

/** Cards of one column, sorted by `order`. */
function columnCards(cards: KanbanCard[], columnId: string): KanbanCard[] {
  return cards.filter((c) => c.columnId === columnId).sort((a, b) => a.order - b.order);
}

interface Lift {
  cardId: string;
  columnId: string;
  index: number;
}

export function FxKanbanBoard({
  columns,
  cards,
  columnMenuItems,
  onCardMove,
  onCardClick,
  onColumnMenuSelect,
  onAddCard,
  renderCard,
  addCardLabel,
  labels,
  className,
}: FxKanbanBoardProps) {
  const L: KanbanLabels = {
    ...DEFAULT_KANBAN_LABELS,
    ...(addCardLabel ? { addCard: addCardLabel } : {}),
    ...labels,
  };

  const [lift, setLift] = useState<Lift | null>(null);
  const [announce, setAnnounce] = useState('');
  const cardRefs = useRef<Map<string, HTMLButtonElement>>(new Map());

  const byColumn = useMemo(() => {
    const m = new Map<string, KanbanCard[]>();
    for (const col of columns) m.set(col.id, columnCards(cards, col.id));
    return m;
  }, [columns, cards]);

  const focusCard = useCallback((cardId: string) => {
    // Defer so a just-committed move (parent re-render) settles first.
    requestAnimationFrame(() => cardRefs.current.get(cardId)?.focus());
  }, []);

  const commitMove = useCallback(
    (cardId: string, from: string, to: string, index: number, title: string, colTitle: string) => {
      onCardMove?.({ cardId, from, to, index });
      setAnnounce(fmt(L.moved, { title, column: colTitle, n: index + 1 }));
    },
    [onCardMove, L.moved],
  );

  const titleFor = useCallback((id: string) => cards.find((c) => c.id === id)?.title ?? '', [cards]);
  const colTitleFor = useCallback(
    (id: string) => columns.find((c) => c.id === id)?.title ?? '',
    [columns],
  );

  /** Move the lifted card one step; returns the new lift + announces. */
  const stepLift = useCallback(
    (l: Lift, dir: 'up' | 'down' | 'left' | 'right'): Lift => {
      const colIdx = columns.findIndex((c) => c.id === l.columnId);
      if (dir === 'up' || dir === 'down') {
        const list = byColumn.get(l.columnId) ?? [];
        const next = dir === 'up' ? l.index - 1 : l.index + 1;
        // exclude the lifted card itself from the count
        const bound = list.filter((c) => c.id !== l.cardId).length;
        const clamped = Math.max(0, Math.min(bound, next));
        if (clamped === l.index) return l;
        const moved = { ...l, index: clamped };
        commitMove(l.cardId, l.columnId, l.columnId, clamped, titleFor(l.cardId), l.columnId ? colTitleFor(l.columnId) : '');
        return moved;
      }
      const nextCol = columns[dir === 'left' ? colIdx - 1 : colIdx + 1];
      if (!nextCol) return l;
      const targetList = (byColumn.get(nextCol.id) ?? []).filter((c) => c.id !== l.cardId);
      const idx = Math.min(l.index, targetList.length);
      const moved: Lift = { cardId: l.cardId, columnId: nextCol.id, index: idx };
      commitMove(l.cardId, l.columnId, nextCol.id, idx, titleFor(l.cardId), nextCol.title);
      return moved;
    },
    [byColumn, columns, commitMove, titleFor, colTitleFor],
  );

  /** Move focus between cards when NOT dragging. */
  const navigateCard = useCallback(
    (card: KanbanCard, dir: 'up' | 'down' | 'left' | 'right') => {
      const colIdx = columns.findIndex((c) => c.id === card.columnId);
      const list = byColumn.get(card.columnId) ?? [];
      const here = list.findIndex((c) => c.id === card.id);
      if (dir === 'up' || dir === 'down') {
        const next = list[dir === 'up' ? here - 1 : here + 1];
        if (next) focusCard(next.id);
        return;
      }
      const nextCol = columns[dir === 'left' ? colIdx - 1 : colIdx + 1];
      if (!nextCol) return;
      const nextList = byColumn.get(nextCol.id) ?? [];
      const target = nextList[Math.min(here, nextList.length - 1)];
      if (target) focusCard(target.id);
    },
    [byColumn, columns, focusCard],
  );

  const onHandleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLButtonElement>, card: KanbanCard) => {
      const key = e.key;
      const dir =
        key === 'ArrowUp'
          ? 'up'
          : key === 'ArrowDown'
            ? 'down'
            : key === 'ArrowLeft'
              ? 'left'
              : key === 'ArrowRight'
                ? 'right'
                : null;

      if (key === ' ' || key === 'Spacebar') {
        e.preventDefault();
        if (lift && lift.cardId === card.id) {
          // drop
          setAnnounce(fmt(L.moved, { title: card.title, column: colTitleFor(lift.columnId), n: lift.index + 1 }));
          setLift(null);
        } else {
          const list = byColumn.get(card.columnId) ?? [];
          const index = list.findIndex((c) => c.id === card.id);
          setLift({ cardId: card.id, columnId: card.columnId, index });
          setAnnounce(fmt(L.lifted, { title: card.title }));
        }
        return;
      }

      if (key === 'Escape' && lift && lift.cardId === card.id) {
        e.preventDefault();
        setLift(null);
        setAnnounce(fmt(L.cancelled, { title: card.title }));
        focusCard(card.id);
        return;
      }

      if (dir) {
        e.preventDefault();
        if (lift && lift.cardId === card.id) {
          const moved = stepLift(lift, dir);
          setLift(moved);
          focusCard(card.id);
        } else {
          navigateCard(card, dir);
        }
      }
    },
    [lift, byColumn, colTitleFor, stepLift, navigateCard, focusCard, L],
  );

  return (
    <div className={className ? `fx-kanban ${className}` : 'fx-kanban'}>
      {columns.map((col) => {
        const list = byColumn.get(col.id) ?? [];
        const count = list.length;
        const over = col.limit !== undefined && count > col.limit;
        const headerId = `fx-kanban-h-${col.id}`;
        const countLabel =
          col.limit !== undefined ? `${count} of ${col.limit} cards` : `${count} cards`;
        return (
          <section
            key={col.id}
            className="fx-kanban-column"
            role="group"
            aria-labelledby={headerId}
            data-tone={col.tone ?? undefined}
            data-over-limit={over || undefined}
          >
            <div className="fx-kanban-column-header">
              <h3 className="fx-kanban-column-title" id={headerId}>
                {col.title}
              </h3>
              <span className="fx-kanban-count">
                <FxBadge
                  tone={over ? 'danger' : 'neutral'}
                  appearance="subtle"
                  size="sm"
                  count={count}
                  srLabel={countLabel}
                />
              </span>
              {columnMenuItems && columnMenuItems.length > 0 && (
                <FxContextMenu
                  items={columnMenuItems}
                  ariaLabel={fmt(L.columnMenu, { column: col.title })}
                  onSelect={(item) => onColumnMenuSelect?.(col.id, item)}
                  trigger={
                    <button
                      type="button"
                      className="fx-kanban-column-menu"
                      aria-label={fmt(L.columnMenu, { column: col.title })}
                    >
                      <FxIcon name="more" size={16} />
                    </button>
                  }
                />
              )}
            </div>

            <div className="fx-kanban-column-body">
              {list.map((card) => {
                const isLifted = lift?.cardId === card.id;
                return (
                  <div
                    key={card.id}
                    className="fx-kanban-card"
                    data-lifted={isLifted || undefined}
                  >
                    <FxCard
                      interactive
                      as="article"
                      padding="sm"
                      onClick={onCardClick ? () => onCardClick(card) : undefined}
                    >
                      <div className="fx-kanban-card-top">
                        <button
                          type="button"
                          className="fx-kanban-card-handle"
                          aria-label={fmt(L.dragHandle, { title: card.title })}
                          aria-pressed={isLifted || undefined}
                          ref={(el) => {
                            if (el) cardRefs.current.set(card.id, el);
                            else cardRefs.current.delete(card.id);
                          }}
                          onKeyDown={(e) => onHandleKeyDown(e, card)}
                        >
                          <FxIcon name="grip" size={16} />
                        </button>
                        {renderCard ? (
                          <div className="fx-kanban-card-content">{renderCard(card)}</div>
                        ) : (
                          <div className="fx-kanban-card-content">
                            <div className="fx-kanban-card-title">{card.title}</div>
                            {card.description && (
                              <p className="fx-kanban-card-desc">{card.description}</p>
                            )}
                          </div>
                        )}
                      </div>
                      {!renderCard && (card.badges?.length || card.assignee) && (
                        <div className="fx-kanban-card-meta">
                          {card.badges && card.badges.length > 0 && (
                            <div className="fx-kanban-card-badges">
                              {card.badges.map((b, i) => (
                                <FxBadge key={i} {...b} />
                              ))}
                            </div>
                          )}
                          {card.assignee && (
                            <FxAvatar
                              size="xs"
                              name={card.assignee.name}
                              src={card.assignee.avatarSrc}
                              alt={card.assignee.name}
                            />
                          )}
                        </div>
                      )}
                    </FxCard>
                  </div>
                );
              })}
            </div>

            <div className="fx-kanban-column-footer">
              <button
                type="button"
                className="fx-kanban-add"
                onClick={onAddCard ? () => onAddCard(col.id) : undefined}
              >
                <FxIcon name="plus" size={16} />
                <span>{fmt(L.addCard, { column: col.title })}</span>
              </button>
            </div>
          </section>
        );
      })}

      <div className="fx-kanban-live" role="status" aria-live="polite">
        {announce}
      </div>
    </div>
  );
}
