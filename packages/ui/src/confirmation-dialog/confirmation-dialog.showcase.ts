/**
 * FxConfirmationDialog showcase — blocking decision. Demos render open so the
 * docs island shows the surface; keep them self-contained.
 */
import { createElement } from 'react';
import type { ShowcaseSpec } from '../showcase-types';
import { FxConfirmationDialog } from './confirmation-dialog';

/** G7 custom body — a field the host validates; confirm stays gated meanwhile. */
const refundBody = createElement(
  'label',
  { className: 'fx-confirmation-dialog-field' },
  createElement('span', { key: 'l', className: 'fx-confirmation-dialog-field-label' }, 'Refund amount'),
  createElement('input', {
    key: 'i',
    className: 'fx-confirmation-dialog-input',
    type: 'text',
    inputMode: 'decimal',
    placeholder: '0.00',
    defaultValue: '',
  }),
);

export const confirmationDialogShowcase: ShowcaseSpec = {
  name: 'FxConfirmationDialog',
  slug: 'confirmation-dialog',
  category: 'overlays',
  slice: 'U3',
  status: 'ready',
  interactive: true,
  tagline: 'A blocking decision — Cancel is the safe default, Confirm names the verb.',
  component: FxConfirmationDialog,
  variants: [
    {
      label: 'default',
      props: {
        defaultOpen: true,
        title: 'Publish this listing?',
        description: 'It becomes visible to buyers immediately.',
        confirmLabel: 'Publish',
      },
    },
    {
      label: 'danger',
      props: {
        defaultOpen: true,
        tone: 'danger',
        title: 'Delete “Vintage lamp”?',
        description: 'This removes the listing and its 12 reviews. This can’t be undone.',
        confirmLabel: 'Delete listing',
      },
    },
    {
      label: 'type-to-confirm',
      props: {
        defaultOpen: true,
        tone: 'danger',
        title: 'Delete organization?',
        description: 'All data is permanently removed.',
        confirmLabel: 'Delete organization',
        requireInput: 'acme',
        requireInputLabel: 'Type “acme” to confirm',
      },
    },
    {
      label: 'custom body + gated confirm',
      props: {
        defaultOpen: true,
        title: 'Partial refund',
        description: 'Refund part of the order; the remainder is released to the seller.',
        confirmLabel: 'Issue partial refund',
        confirmDisabled: true,
        children: refundBody,
      },
      note: 'children render below the description (G7); confirmDisabled keeps Confirm gated until the host validates the input.',
    },
  ],
  props: [
    { name: 'open / onOpenChange', type: '§1.5', required: true, description: 'Controlled open state.' },
    { name: 'title', type: 'string', required: true, description: 'A question, not a statement.' },
    { name: 'description', type: 'string | Node', required: true, description: 'The consequence.' },
    { name: 'tone', type: "'default' | 'danger'", default: "'default'", description: 'danger ⇒ confirm variant="danger" + icon.' },
    { name: 'confirmLabel / cancelLabel', type: 'string', default: "'Confirm' / 'Cancel'", description: 'i18n. Never Yes/No.' },
    { name: 'requireInput', type: 'string', description: 'Type-to-confirm; confirm disabled until exact match.' },
    { name: 'confirmDisabled', type: 'boolean', default: 'false', description: 'Externally gate the confirm button (e.g. until a valid amount is entered).' },
    { name: 'children', type: 'ReactNode', description: 'Custom body content below the description — fields/previews the decision needs.' },
  ],
  events: [
    { name: 'onConfirm', payload: '() => void | Promise<void>', description: 'Async: confirm loads, dialog stays open until resolve; reject keeps it open.' },
    { name: 'onCancel', payload: '() => void', description: 'Also fired by Esc / backdrop / close.' },
  ],
  keyboard: [
    { keys: 'Esc', action: 'Cancel' },
    { keys: 'Tab · Shift+Tab', action: 'Cycle focus inside (trapped)' },
  ],
  aria: [
    { attr: 'role', value: 'alertdialog', note: 'aria-modal, labelled + described.' },
    { attr: 'initial focus', value: 'Cancel (danger) / Confirm', note: 'Safe action for destructive dialogs.' },
  ],
  contract: { doc: '04-component-bible.md', heading: 'FxConfirmationDialog' },
};
