/**
 * FileUpload showcase — static `UploadFile[]` values so demos render
 * deterministically and axe-clean (no real transport). Component-specific
 * `status` union is documented as prop strings, never in `enums`.
 */
import type { ShowcaseSpec } from '../showcase-types';
import { FxFileUpload, type UploadFile } from './file-upload';

const oneQueued: UploadFile[] = [
  { id: 'a', name: 'contract.pdf', size: 248_000, type: 'application/pdf', status: 'queued' },
];

const uploading: UploadFile[] = [
  { id: 'b', name: 'photo.jpg', size: 1_240_000, type: 'image/jpeg', status: 'uploading', progress: 62 },
];

const mixed: UploadFile[] = [
  { id: 'c', name: 'deck.pdf', size: 3_100_000, type: 'application/pdf', status: 'success', url: '#' },
  { id: 'd', name: 'render.png', size: 5_800_000, type: 'image/png', status: 'error', error: 'render.png is too large' },
];

export const fileUploadShowcase: ShowcaseSpec = {
  name: 'FileUpload',
  slug: 'file-upload',
  category: 'forms',
  slice: 'U5',
  status: 'ready',
  interactive: true,
  tagline: 'Button-triggered upload with a managed, per-file file list.',
  component: FxFileUpload,
  variants: [
    { label: 'empty', props: {} },
    { label: 'multiple', props: { multiple: true } },
    { label: 'queued', props: { value: oneQueued } },
    { label: 'uploading', props: { value: uploading } },
    { label: 'success + error', props: { multiple: true, value: mixed } },
    { label: 'accept + size', props: { accept: 'image/*', maxSize: 5_000_000, multiple: true } },
    { label: 'disabled', props: { disabled: true, value: oneQueued } },
  ],
  props: [
    { name: 'value / defaultValue', type: 'UploadFile[]', default: '— / []', description: 'Controlled / uncontrolled list (§1.5).' },
    { name: 'accept', type: 'string', description: 'MIME/extension list; rejects surface a per-file error.' },
    { name: 'multiple', type: 'boolean', default: 'false', description: 'Allow multiple picks.' },
    { name: 'maxSize', type: 'number (bytes)', description: 'Per-file size cap.' },
    { name: 'maxFiles', type: 'number', description: 'Total file cap.' },
    { name: 'upload', type: '(file, onProgress, signal) => Promise<{id,url}>', description: 'Host transport; absent ⇒ collect-only.' },
    { name: 'labels', type: '{ browse; dropHint; retry; remove; tooLarge; wrongType; tooMany }', default: 'English set', description: 'i18n; error templates take {name} / {max}.' },
    { name: 'status (per file)', type: "'queued' | 'uploading' | 'success' | 'error'", description: 'Item state → data-status + icon/colour.' },
  ],
  events: [
    { name: 'onChange', payload: '(files, { source })', description: 'Every list mutation.' },
    { name: 'onUpload', payload: 'File[]', description: 'Accepted native picks.' },
    { name: 'onRemove', payload: 'fileId', description: 'A file was removed.' },
    { name: 'onRetry', payload: 'fileId', description: 'Retry requested on a failed file.' },
  ],
  keyboard: [
    { keys: 'Enter / Space', action: 'Trigger opens the file dialog' },
    { keys: 'Tab', action: 'Reaches each item’s retry / remove actions' },
    { keys: 'Delete / Backspace', action: 'On a focused remove button, removes the item' },
  ],
  aria: [
    { attr: 'aria-controls', value: 'input id', note: 'Trigger labels the hidden file input.' },
    { attr: 'role', value: 'list', note: 'On the file list.' },
    { attr: 'role=progressbar / aria-valuenow', value: 'per file', note: 'While uploading (FxProgress).' },
    { attr: 'aria-live', value: 'polite', note: 'Status transitions announced.' },
  ],
  contract: { doc: '04-component-bible.md', heading: 'FxFileUpload' },
};
