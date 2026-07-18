/**
 * AvatarUpload showcase — an xl avatar preview + edit affordance + transport.
 * Static `value` (url / null) keeps demos deterministic + axe-clean; the crop
 * dialog is an interactive island, not rendered in static markup.
 */
import type { ShowcaseSpec } from '../showcase-types';
import { FxAvatarUpload } from './avatar-upload';

export const avatarUploadShowcase: ShowcaseSpec = {
  name: 'AvatarUpload',
  slug: 'avatar-upload',
  category: 'forms',
  slice: 'U5',
  status: 'ready',
  interactive: true,
  tagline: 'Profile-photo picker — avatar preview, edit overlay, optional crop-zoom.',
  component: FxAvatarUpload,
  variants: [
    { label: 'with photo', props: { value: 'https://example.com/a.jpg', name: 'Jane Doe' } },
    { label: 'initials fallback', props: { value: null, name: 'Ada Lovelace' } },
    { label: 'no crop', props: { value: null, name: 'Kai Ng', crop: false } },
    { label: 'custom labels', props: { value: null, name: 'Sam Rivera', labels: { change: 'Change avatar' } } },
    { label: 'disabled', props: { value: null, name: 'Locked User', disabled: true } },
  ],
  props: [
    { name: 'value', type: 'string | null', default: 'null', description: 'Current image url (controlled, §1.5).' },
    { name: 'name', type: 'string', description: 'Drives the initials fallback when there is no image.' },
    { name: 'onUpload', type: '(file) => Promise<{url}>', description: 'Host transport for a picked file.' },
    { name: 'onRemove', type: '() => void', description: 'Remove the current image.' },
    { name: 'crop', type: 'boolean', default: 'true', description: 'Show the crop-zoom dialog after picking.' },
    { name: 'maxSize', type: 'number (bytes)', description: 'Per-file size cap.' },
    { name: 'labels', type: '{ change; remove; cropTitle; zoom; cropCancel; cropConfirm }', default: 'English set', description: 'i18n.' },
  ],
  events: [
    { name: 'onUpload', payload: 'File', description: 'Returns the resolved url.' },
    { name: 'onRemove', payload: '—', description: 'Current photo removed.' },
    { name: 'onChange', payload: 'url | null', description: 'Resolved url after upload / null on remove.' },
  ],
  keyboard: [
    { keys: 'Enter / Space', action: 'Edit button opens the file dialog' },
    { keys: 'Esc', action: 'Closes the crop dialog' },
    { keys: 'Arrow', action: 'Adjusts the zoom range in the crop dialog' },
  ],
  aria: [
    { attr: 'aria-label', value: "'Change profile photo'", note: 'On the edit trigger (i18n via labels.change).' },
    { attr: 'role', value: 'dialog', note: 'Crop dialog is a standard modal (aria-modal).' },
    { attr: 'aria-label', value: "'Zoom'", note: 'On the native range zoom control.' },
  ],
  contract: { doc: '04-component-bible.md', heading: 'FxAvatarUpload' },
};
