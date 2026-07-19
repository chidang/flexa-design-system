/**
 * FxEscrowTimeline — the state of held funds through an escrow flow (doc 04
 * §3.7). A held-amount header (`Money` + a release-conditions note) sits above
 * an FxTimeline with one item per escrow stage; the current stage's content slot
 * holds the contextual actions the caller's `perspective` is allowed to take.
 *
 * Pure presentational (no hooks) → renders as an RSC in docs. The action set is
 * derived, not free-form: buyer → approve/dispute, seller → remind (+ release
 * when permitted), admin → release/refund. Destructive actions (dispute, refund)
 * render ghost-danger; the doc requires the host to route them through a
 * Confirmation Dialog (§4). Stage is announced politely in a visually-hidden
 * `role="status"` region, and colour is never the only signal — the stage word
 * is always spelled (§1.7.7).
 */
import type { ReactNode } from 'react';
import { FxTimeline, type TimelineItem, type TimelineState } from '../timeline/timeline';
import { FxButton } from '../button/button';
import { statusTone, formatStatusLabel } from '../status-tone';
import { ESCROW_STAGES, type EscrowStage } from '../enums';
import type { Money } from '../currency-input/currency-input';

/** A named party (buyer/seller/admin actor on an escrow event). Local to this
 *  file — Cluster C/D define their own `PartyRef`; keeping it here is fine. */
export interface PartyRef {
  id: string;
  name: string;
  avatarSrc?: string;
  href?: string;
}

/** The actions a perspective can trigger on the current stage. */
export type EscrowAction = 'approve' | 'release' | 'dispute' | 'refund' | 'remind';

/** Which side is viewing — decides which actions render. */
export type EscrowPerspective = 'buyer' | 'seller' | 'admin';

/** One recorded step of the escrow flow (doc 04 §3.7). */
export interface EscrowEvent {
  id: string;
  stage: EscrowStage;
  status: 'complete' | 'current' | 'upcoming' | 'failed';
  actor?: PartyRef;
  /** ISO timestamp; rendered verbatim (host formats before passing). */
  at?: string;
  note?: string;
}

/** i18n copy — every baked-in string has a documented default. */
export interface EscrowTimelineLabels {
  approve: string;
  release: string;
  dispute: string;
  refund: string;
  remind: string;
  heldAmount: string;
}

export const DEFAULT_ESCROW_TIMELINE_LABELS: EscrowTimelineLabels = {
  approve: 'Approve delivery',
  release: 'Release funds',
  dispute: 'Open dispute',
  refund: 'Refund buyer',
  remind: 'Send reminder',
  heldAmount: 'Amount held',
};

export interface FxEscrowTimelineProps {
  /** The recorded escrow steps (one may exist per stage). */
  events: EscrowEvent[];
  /** The current stage — its timeline item carries the action slot. */
  stage: EscrowStage;
  /** Funds in escrow. */
  amount: Money;
  /** Which side is viewing — decides which actions render. */
  perspective: EscrowPerspective;
  /** Action handler. `event` is the current stage's event when known. */
  onAction?: (action: EscrowAction, event?: EscrowEvent) => void;
  /** Force disputed styling (also implied by `stage === 'disputed'`). */
  disputed?: boolean;
  /** Whether the seller may release directly (rare; default false). */
  sellerCanRelease?: boolean;
  /** Release-conditions note shown under the held amount. */
  releaseNote?: string;
  /**
   * Inline actions slot for the current stage (doc 14 §11 G8). When provided,
   * it REPLACES the derived perspective buttons on the current stage's item —
   * e.g. an admin dispute view renders its real resolve actions (wired to the
   * host's confirm flow) inline instead of the generic release/refund pair.
   * Pass `null` to suppress the action row entirely (e.g. once resolved).
   * Additive: omit to keep the derived action set.
   */
  stageActions?: ReactNode;
  /** Locale for `Money` formatting. Defaults to the runtime env locale. */
  locale?: string;
  labels?: Partial<EscrowTimelineLabels>;
  className?: string;
}

/** Format a `Money` value into a locale-aware currency string. */
function formatMoney(money: Money, locale?: string): string {
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: money.currency,
    }).format(money.amount / 100);
  } catch {
    return String(money.amount);
  }
}

/** The ordered actions a perspective may take (doc 04 §3.7 mapping). */
function actionsFor(perspective: EscrowPerspective, sellerCanRelease: boolean): EscrowAction[] {
  if (perspective === 'buyer') return ['approve', 'dispute'];
  if (perspective === 'seller') return sellerCanRelease ? ['remind', 'release'] : ['remind'];
  return ['release', 'refund']; // admin
}

/** Destructive actions render ghost-danger and are host-confirmed (§4). */
const DESTRUCTIVE: ReadonlySet<EscrowAction> = new Set<EscrowAction>(['dispute', 'refund']);

export function FxEscrowTimeline({
  events,
  stage,
  amount,
  perspective,
  onAction,
  disputed,
  sellerCanRelease = false,
  releaseNote,
  stageActions,
  locale,
  labels,
  className,
}: FxEscrowTimelineProps) {
  const l = { ...DEFAULT_ESCROW_TIMELINE_LABELS, ...labels };
  const isDisputed = disputed || stage === 'disputed';
  const rootClass = className ? `fx-escrow-timeline ${className}` : 'fx-escrow-timeline';

  const byStage = new Map(events.map((e) => [e.stage, e]));
  const currentEvent = byStage.get(stage);
  const actions = actionsFor(perspective, sellerCanRelease);

  // The action slot lives on the current stage's timeline item. A provided
  // stageActions slot (G8) replaces the derived perspective buttons; an
  // explicit null suppresses the action row.
  const actionSlot = stageActions !== undefined ? (
    stageActions === null ? undefined : (
      <div className="fx-escrow-timeline-actions">{stageActions}</div>
    )
  ) : actions.length > 0 ? (
      <div className="fx-escrow-timeline-actions">
        {actions.map((action) => (
          <FxButton
            key={action}
            variant={DESTRUCTIVE.has(action) ? 'ghost' : 'primary'}
            size="sm"
            data-danger={DESTRUCTIVE.has(action) || undefined}
            onClick={onAction ? () => onAction(action, currentEvent) : undefined}
          >
            {l[action]}
          </FxButton>
        ))}
      </div>
    ) : undefined;

  // One timeline item per canonical stage, in §5 order. Item state comes from the
  // matching event; the current stage carries the action slot + any note.
  const items: TimelineItem[] = ESCROW_STAGES.map((s) => {
    const event = byStage.get(s);
    const isCurrent = s === stage;
    let state: TimelineState = event?.status ?? 'upcoming';
    if (isCurrent && state === 'upcoming') state = 'current';
    return {
      id: event?.id ?? `stage-${s}`,
      title: formatStatusLabel(s),
      description: event?.note,
      at: event?.at,
      state,
      tone: statusTone(s),
      content: isCurrent ? actionSlot : undefined,
    };
  });

  return (
    <section
      className={rootClass}
      data-disputed={isDisputed || undefined}
      data-perspective={perspective}
      aria-label="Escrow status"
    >
      <header className="fx-escrow-timeline-header">
        <div className="fx-escrow-timeline-amount">
          <span className="fx-escrow-timeline-amount-label">{l.heldAmount}</span>
          <span className="fx-escrow-timeline-amount-value">{formatMoney(amount, locale)}</span>
        </div>
        {releaseNote != null && (
          <p className="fx-escrow-timeline-note">{releaseNote}</p>
        )}
      </header>

      <FxTimeline items={items} />

      {/* Polite stage announcement — the stage word is spelled here for SR users. */}
      <span className="fx-escrow-timeline-announce" role="status" aria-live="polite">
        {formatStatusLabel(stage)}
      </span>
    </section>
  );
}
