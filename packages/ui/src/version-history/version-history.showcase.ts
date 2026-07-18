/**
 * FxVersionHistory showcase spec. The version list renders server-side (only the
 * Restore confirmation dialog is a portal), so every variant's static markup is
 * non-empty. Restore routes through a Confirmation Dialog; a `diff` slot variant
 * shows the two-column layout. No local §5 union to anchor.
 */
import type { ShowcaseSpec } from '../showcase-types';
import { createElement } from 'react';
import { FxVersionHistory, type Version } from './version-history';

const noop = () => undefined;

const ada = { id: 'u1', name: 'Ada Lovelace', avatarSrc: 'https://picsum.photos/seed/ada/48' };
const clay = { id: 'u2', name: 'Clay & Co' };

const versions: Version[] = [
  { id: 'v5', number: 5, author: ada, createdAt: '2026-07-17T09:10:00Z', summary: 'Reworded the hero copy' },
  { id: 'v4', number: 4, author: clay, createdAt: '2026-07-16T16:00:00Z', summary: 'Swapped the header image' },
  { id: 'v3', number: 3, label: 'Launch draft', author: ada, createdAt: '2026-07-15T11:00:00Z', summary: 'Initial layout' },
];

const diff = createElement('div', { style: { fontSize: '0.875rem' } }, 'Side-by-side diff renders here');

export const versionHistoryShowcase: ShowcaseSpec = {
  name: 'VersionHistory',
  slug: 'version-history',
  category: 'collaboration',
  slice: 'U9',
  status: 'ready',
  tagline: 'Saved revisions with per-item Preview / Restore and an optional diff.',
  component: FxVersionHistory,
  interactive: true,
  variants: [
    {
      label: 'current + past',
      props: { versions, currentId: 'v5', onPreview: noop, onRestore: noop },
      note: 'v5 is current (Badge, no Restore); older versions offer Preview + Restore.',
    },
    {
      label: 'with diff slot',
      props: { versions, currentId: 'v5', onPreview: noop, onRestore: noop, diff },
      note: 'A diff slot switches to a two-column layout beside the list.',
    },
    {
      label: 'preview only',
      props: { versions, currentId: 'v5', onPreview: noop },
    },
    {
      label: 'empty',
      props: { versions: [], currentId: '' },
    },
  ],
  props: [
    { name: 'versions', type: 'Version[]', required: true, description: 'Newest first. Version = { id; number; label?; author: PartyRef; createdAt; summary? }.' },
    { name: 'currentId', type: 'string', required: true, description: 'The current head — gets the Current Badge and no Restore action.' },
    { name: 'onPreview', type: '(id: string) => void', description: 'Preview a version (host loads it read-only).' },
    { name: 'onRestore', type: '(id: string) => void', description: 'Restore a version — invoked after the confirmation dialog confirms.' },
    { name: 'diff', type: 'ReactNode', description: 'Optional side-by-side diff slot rendered beside the list.' },
    { name: 'labels', type: 'Partial<VersionHistoryLabels>', description: 'i18n overrides (preview, restore, current, restore dialog copy…).' },
  ],
  events: [
    { name: 'onPreview', payload: '(id: string)', description: 'A version’s Preview action was pressed.' },
    { name: 'onRestore', payload: '(id: string)', description: 'Restore confirmed via the Confirmation Dialog.' },
  ],
  keyboard: [
    { keys: 'Tab', action: 'Move through Preview / Restore buttons per row.' },
    { keys: 'Enter / Space', action: 'Activate an action; Restore opens the confirmation dialog.' },
    { keys: 'Esc', action: 'Cancel the Restore confirmation dialog.' },
  ],
  aria: [
    { attr: 'aria-label', value: 'Restore v{n}', note: 'Names each icon+label Restore / Preview button with its version.' },
    { attr: 'FxBadge', value: 'Current', note: 'The current head is marked with a text Badge — not colour alone.' },
    { attr: 'role="alertdialog"', value: 'restore', note: 'Restore routes through a Confirmation Dialog (undoable, never a history rewrite).' },
  ],
  contract: { doc: '04-component-bible.md', heading: 'FxVersionHistory — Version History' },
};
