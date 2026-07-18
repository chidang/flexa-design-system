/**
 * FxSuccessPage showcase spec. Sweeps the summary Card slot + announced
 * autoAdvance countdown, plus a minimal title-only variant. `autoAdvance` is
 * documented as a prop row (no shared §5 union).
 */
import { createElement } from 'react';
import type { ShowcaseSpec } from '../showcase-types';
import { FxCard } from '../card/card';
import { FxSuccessPage } from './success-page';

const orderSummary = createElement(
  FxCard,
  { title: 'Order #1042', subtitle: 'Paid · Jul 17, 2026' },
  'Ceramic mug × 2, Tea towel × 1 — $69.80',
);

export const successPageShowcase: ShowcaseSpec = {
  name: 'SuccessPage',
  slug: 'success-page',
  category: 'collaboration',
  slice: 'U9',
  status: 'ready',
  interactive: true,
  tagline: 'Terminal success surface — success mark, summary recap, next-step actions.',
  component: FxSuccessPage,
  variants: [
    {
      label: 'with summary + actions',
      props: {
        title: 'Payment complete',
        description: "Thanks — we've emailed your receipt.",
        summary: orderSummary,
        actions: 'View order',
      },
    },
    {
      label: 'with auto-advance countdown',
      props: {
        title: "You're all set",
        description: 'Redirecting you to your dashboard.',
        autoAdvance: { href: '#dashboard', afterMs: 5000, label: 'Continue now ({n}s)' },
      },
    },
    {
      label: 'minimal (title only)',
      props: { title: 'Saved' },
    },
  ],
  props: [
    { name: 'title', type: 'string', required: true, description: 'Confirmation headline (the page h1).' },
    { name: 'description', type: 'ReactNode', description: 'Supporting sentence.' },
    { name: 'summary', type: 'ReactNode', description: 'Summary Card slot (e.g. an order recap).' },
    { name: 'actions', type: 'ReactNode', description: 'Primary next-step + secondary actions.' },
    { name: 'autoAdvance', type: '{ href: string; afterMs: number; label: string }', description: 'Announced countdown → auto-navigate; `{n}` in label is replaced with seconds left.' },
  ],
  aria: [
    { attr: 'h1', value: 'title', note: 'Exactly one h1 = the success title.' },
    { attr: '.fx-success-page-icon', value: 'aria-hidden', note: 'The success mark is decorative; the h1 carries the meaning.' },
    { attr: 'role', value: 'status', note: 'The auto-advance countdown line politely announces the imminent redirect.' },
  ],
  contract: { doc: '04-component-bible.md', heading: 'FxSuccessPage — Success Page' },
};
