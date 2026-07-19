/**
 * EscrowTimeline showcase spec. The exit criteria require rendering EVERY
 * escrow stage × perspective combination, so the variant grid is generated:
 * 5 stages (`ESCROW_STAGES`) × 3 perspectives = 15 cards, plus a disputed-path
 * variant. `enums.stage` anchors the shared `ESCROW_STAGES` union;
 * `EscrowPerspective`/`EscrowAction`/`PartyRef` are component-local shapes
 * documented in `props`.
 */
import { createElement } from 'react';
import type { ShowcaseSpec } from '../showcase-types';
import { ESCROW_STAGES, type EscrowStage } from '../enums';
import { FxButton } from '../button/button';
import { FxEscrowTimeline, type EscrowEvent, type EscrowPerspective } from './escrow-timeline';

const PERSPECTIVES: EscrowPerspective[] = ['buyer', 'seller', 'admin'];

/** Held funds reused across every combo. */
const amount = { amount: 12500, currency: 'USD' } as const;

/**
 * Build the escrow events up to (and including) a given stage: earlier stages
 * are `complete`, the target stage is `current`, later stages are omitted.
 */
function eventsUpTo(stage: EscrowStage): EscrowEvent[] {
  const idx = ESCROW_STAGES.indexOf(stage);
  return ESCROW_STAGES.slice(0, idx + 1).map((s, i) => ({
    id: `ev_${s}`,
    stage: s,
    status: i < idx ? 'complete' : 'current',
    at: `2026-07-${10 + i}T12:00:00Z`,
  }));
}

/** 15 cards — every stage × perspective. */
const combos = ESCROW_STAGES.flatMap((stage) =>
  PERSPECTIVES.map((perspective) => ({
    label: `${stage} · ${perspective}`,
    props: {
      events: eventsUpTo(stage),
      stage,
      amount,
      perspective,
      releaseNote: 'Funds release automatically 3 days after delivery.',
    },
  })),
);

export const escrowTimelineShowcase: ShowcaseSpec = {
  name: 'EscrowTimeline',
  slug: 'escrow-timeline',
  category: 'commerce',
  slice: 'U8',
  status: 'ready',
  tagline: 'Held-funds escrow flow — one item per stage with perspective-scoped actions.',
  component: FxEscrowTimeline,
  variants: [
    ...combos,
    {
      label: 'disputed path (buyer)',
      props: {
        events: [
          { id: 'ev_payment_held', stage: 'payment_held', status: 'complete', at: '2026-07-10T12:00:00Z' },
          { id: 'ev_delivered', stage: 'delivered', status: 'complete', at: '2026-07-12T12:00:00Z' },
          { id: 'ev_disputed', stage: 'disputed', status: 'failed', note: 'Buyer reported item not as described.', at: '2026-07-13T09:30:00Z' },
        ],
        stage: 'disputed',
        amount,
        perspective: 'buyer',
        disputed: true,
      },
      note: 'Disputed styling tints the header; the stage word is announced politely.',
    },
    {
      label: 'seller can release',
      props: {
        events: eventsUpTo('delivered'),
        stage: 'delivered',
        amount,
        perspective: 'seller',
        sellerCanRelease: true,
      },
      note: 'Seller gets Release only when sellerCanRelease is set.',
    },
    {
      label: 'admin · inline stage actions',
      props: {
        events: eventsUpTo('disputed'),
        stage: 'disputed',
        amount,
        perspective: 'admin',
        disputed: true,
        stageActions: [
          createElement(FxButton, { key: 'refund', variant: 'primary', size: 'sm' }, 'Refund buyer'),
          createElement(FxButton, { key: 'release', variant: 'secondary', size: 'sm' }, 'Release to seller'),
          createElement(FxButton, { key: 'partial', variant: 'ghost', size: 'sm' }, 'Partial refund…'),
        ],
      },
      note: 'stageActions (G8) replaces the derived buttons on the current stage — the host wires its real resolve flow inline.',
    },
  ],
  props: [
    { name: 'events', type: 'EscrowEvent[]', required: true, description: 'Recorded steps ({ id, stage, status, actor?, at?, note? }).' },
    { name: 'stage', type: 'EscrowStage', required: true, description: 'Current stage — its item carries the action slot.' },
    { name: 'amount', type: 'Money', required: true, description: 'Funds in escrow (formatted via Intl).' },
    { name: 'perspective', type: "'buyer' | 'seller' | 'admin'", required: true, description: 'Buyer → approve/dispute, seller → remind (+release if permitted), admin → release/refund.' },
    { name: 'onAction', type: '(action: EscrowAction, event?: EscrowEvent) => void', description: 'Action handler; EscrowAction = approve | release | dispute | refund | remind.' },
    { name: 'disputed', type: 'boolean', description: 'Force disputed styling (also implied by stage === "disputed").' },
    { name: 'sellerCanRelease', type: 'boolean', default: 'false', description: 'Whether the seller may release directly.' },
    { name: 'releaseNote', type: 'string', description: 'Release-conditions note under the held amount.' },
    { name: 'stageActions', type: 'ReactNode', description: 'Inline actions for the current stage — replaces the derived perspective buttons when provided (G8).' },
    { name: 'locale', type: 'string', description: 'Locale for Money formatting.' },
    { name: 'labels', type: '{ approve; release; dispute; refund; remind; heldAmount }', description: 'i18n copy overrides.' },
  ],
  events: [
    { name: 'onAction', payload: '(action: EscrowAction, event?: EscrowEvent)', description: 'Destructive actions (dispute, refund) render ghost-danger; the host routes them through a Confirmation Dialog (§4).' },
  ],
  aria: [
    { attr: 'role="status"', value: 'polite', note: 'Visually-hidden region spelling the current stage — colour is never the only signal (§1.7.7).' },
  ],
  enums: { stage: ESCROW_STAGES },
  contract: { doc: '04-component-bible.md', heading: 'FxEscrowTimeline — Escrow Timeline' },
};
