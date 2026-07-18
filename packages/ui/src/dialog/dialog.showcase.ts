/**
 * FxDialog showcase — the modal surface. The demo renders open (`defaultOpen`)
 * so the docs island shows the surface; a trigger button keeps it self-contained.
 */
import type { ShowcaseSpec } from '../showcase-types';
import { FxDialog } from './dialog';

export const dialogShowcase: ShowcaseSpec = {
  name: 'FxDialog',
  slug: 'dialog',
  category: 'overlays',
  slice: 'U3',
  status: 'ready',
  interactive: true,
  tagline: 'The modal surface — trapped focus, scrim, and one open at a time.',
  component: FxDialog,
  variants: [
    {
      label: 'default',
      props: { defaultOpen: true, title: 'Edit profile', size: 'md' },
      children: 'Change your display name and avatar, then save.',
    },
    {
      label: 'sm',
      props: { defaultOpen: true, title: 'Rename list', size: 'sm' },
      children: 'Give this list a new name.',
    },
    {
      label: 'non-dismissible',
      props: { defaultOpen: true, title: 'Finish setup', dismissible: false },
      children: 'Complete the required steps to continue.',
    },
  ],
  props: [
    { name: 'open / defaultOpen / onOpenChange', type: '§1.5', description: 'Controlled or uncontrolled open state.' },
    { name: 'title', type: 'string', required: true, description: 'Labels the dialog (aria-labelledby).' },
    { name: 'size', type: "'sm' | 'md' | 'lg' | 'full'", default: "'md'", description: '440 / 560 / 768px / full-screen.' },
    { name: 'dismissible', type: 'boolean', default: 'true', description: 'false disables Esc / backdrop / ×.' },
    { name: 'closeOnBackdrop', type: 'boolean', default: 'true', description: 'Scrim click closes.' },
    { name: 'onBeforeClose', type: '() => boolean | Promise<boolean>', description: 'Veto hook (unsaved-changes guard).' },
    { name: 'closeLabel', type: 'string', default: "'Close'", description: 'i18n label for the × button.' },
  ],
  events: [
    { name: 'onOpenChange', payload: "(open: boolean, reason: 'esc' | 'backdrop' | 'close-button' | 'api')", description: 'Fires when the dialog requests to close.' },
  ],
  keyboard: [
    { keys: 'Esc', action: 'Close (unless vetoed / dismissible=false)' },
    { keys: 'Tab · Shift+Tab', action: 'Cycle focus inside (trapped)' },
  ],
  aria: [
    { attr: 'role', value: 'dialog', note: 'aria-modal="true".' },
    { attr: 'aria-labelledby', value: 'title id', note: 'Dialog title.' },
    { attr: 'aria-describedby', value: 'body id', note: 'Dialog body prose.' },
  ],
  contract: { doc: '04-component-bible.md', heading: 'FxDialog' },
};
