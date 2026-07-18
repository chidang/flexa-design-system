/**
 * Timeline showcase spec. Only SHARED unions (from `enums.ts`) appear in `enums`;
 * the `TimelineItem`/`TimelineState` shapes are documented in `props` as type
 * strings (component-local, not shared).
 */
import type { ShowcaseSpec } from '../showcase-types';
import { TONES } from '../enums';
import { FxTimeline } from './timeline';

const RELEASE = [
  { id: '1', title: 'Order placed', description: 'Payment authorised.', state: 'complete', at: '2026-02-01 09:12' },
  { id: '2', title: 'Packed', description: 'Ready to ship.', state: 'complete', at: '2026-02-01 14:40' },
  { id: '3', title: 'In transit', description: 'On the way to you.', state: 'current', at: '2026-02-02 08:00' },
  { id: '4', title: 'Delivered', state: 'upcoming' },
];

const AUDIT = [
  { id: '1', title: 'Signed in', state: 'complete', at: '09:00', icon: 'lock' as const },
  { id: '2', title: 'Charge declined', description: 'Insufficient funds.', state: 'failed', at: '09:04' },
  { id: '3', title: 'Retry scheduled', state: 'current', at: '09:05' },
];

export const timelineShowcase: ShowcaseSpec = {
  name: 'Timeline',
  slug: 'timeline',
  category: 'data',
  slice: 'U6',
  status: 'ready',
  tagline: 'Vertical ordered-list timeline — a rail of state markers with content.',
  component: FxTimeline,
  variants: [
    { label: 'default', props: { items: RELEASE } },
    { label: 'complete', props: { items: [{ id: 'a', title: 'Task done', state: 'complete', at: 'Yesterday' }] } },
    { label: 'current', props: { items: [{ id: 'a', title: 'Running now', state: 'current', at: 'Just now' }] } },
    { label: 'upcoming', props: { items: [{ id: 'a', title: 'Scheduled', state: 'upcoming' }] } },
    { label: 'failed', props: { items: [{ id: 'a', title: 'Payment failed', description: 'Card declined.', state: 'failed', at: '2m ago' }] } },
    { label: 'with timestamps', props: { items: RELEASE } },
    { label: 'with icons', props: { items: AUDIT } },
    { label: 'dense', props: { items: RELEASE, dense: true } },
    {
      label: 'with content slot',
      props: {
        items: [
          { id: '1', title: 'Comment added', state: 'complete', at: 'Mon', content: 'Looks good to me — shipping today.' },
          { id: '2', title: 'Review', state: 'current' },
        ],
      },
    },
  ],
  enums: { tone: TONES },
  props: [
    { name: 'items', type: 'TimelineItem[]', required: true, description: 'TimelineItem = { id; title; description?; at?; state?; icon?; tone?; content? }.' },
    { name: 'state (per item)', type: "'complete' | 'current' | 'upcoming' | 'failed'", default: "'upcoming'", description: 'Marker treatment; also spoken as a visually-hidden word.' },
    { name: 'orientation', type: "'vertical'", default: "'vertical'", description: 'Layout axis (only vertical in v1).' },
    { name: 'interactive', type: 'boolean', default: 'false', description: 'Expandable items via the Accordion contract (deferred; inline in v1).' },
    { name: 'dense', type: 'boolean', default: 'false', description: 'Tighter row rhythm.' },
    { name: 'labels', type: 'Partial<TimelineLabels>', description: "Visually-hidden state words (i18n): complete / current / upcoming / failed." },
  ],
  keyboard: [
    { keys: '—', action: 'Read-only in v1; interactive (Accordion) deferred.' },
  ],
  aria: [
    { attr: 'element', value: 'ol', note: 'Ordered-list semantics carry chronology.' },
    { attr: 'data-state', value: 'complete | current | upcoming | failed', note: 'On each .fx-timeline-item.' },
    { attr: '.fx-timeline-state', value: 'visually-hidden state word', note: 'State conveyed in text, not colour alone.' },
  ],
  contract: { doc: '04-component-bible.md', heading: 'FxTimeline' },
};
