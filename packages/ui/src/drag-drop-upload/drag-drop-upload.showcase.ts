/**
 * DragDropUpload showcase — the dropzone-triggered flavour of FileUpload.
 * Static `UploadFile[]` values keep demos deterministic + axe-clean.
 */
import type { ShowcaseSpec } from '../showcase-types';
import { FxDragDropUpload } from './drag-drop-upload';
import type { UploadFile } from '../file-upload/file-upload';

const withFiles: UploadFile[] = [
  { id: 'a', name: 'hero.jpg', size: 2_100_000, type: 'image/jpeg', status: 'success', url: '#' },
  { id: 'b', name: 'wide.png', size: 8_400_000, type: 'image/png', status: 'error', error: 'wide.png is too large' },
];

export const dragDropUploadShowcase: ShowcaseSpec = {
  name: 'DragDropUpload',
  slug: 'drag-drop-upload',
  category: 'forms',
  slice: 'U5',
  status: 'ready',
  interactive: true,
  tagline: 'A full dropzone that opens the file dialog — drag is an enhancement.',
  component: FxDragDropUpload,
  variants: [
    { label: 'empty', props: { multiple: true } },
    { label: 'custom label', props: { multiple: true, zoneLabel: 'Add attachments' } },
    { label: 'paste enabled', props: { multiple: true, pasteTarget: true, zoneLabel: 'Upload or paste' } },
    { label: 'with files', props: { multiple: true, accept: 'image/*', value: withFiles } },
    { label: 'disabled', props: { disabled: true, zoneLabel: 'Uploads locked' } },
  ],
  props: [
    { name: '…FxFileUpload props', type: 'FxFileUploadProps', description: 'All base props (value, accept, multiple, upload, labels…).' },
    { name: 'zoneLabel', type: 'string', default: 'dropHint', description: 'Accessible name for the dropzone button (i18n).' },
    { name: 'pasteTarget', type: 'boolean', default: 'false', description: 'Accept clipboard paste of files/images while mounted.' },
  ],
  events: [
    { name: 'onChange', payload: '(files, { source })', description: 'Every list mutation.' },
    { name: 'onUpload', payload: 'File[]', description: 'Accepted picks (drop, browse, or paste).' },
  ],
  keyboard: [
    { keys: 'Enter / Space', action: 'Opens the file dialog (zone is a button)' },
    { keys: 'Tab', action: 'Reaches the zone then each file item’s actions' },
  ],
  aria: [
    { attr: 'role', value: 'button', note: 'Dropzone is a labelled button — never drag-only.' },
    { attr: 'aria-label', value: 'zoneLabel', note: 'Names the dropzone.' },
    { attr: 'aria-controls', value: 'input id', note: 'Zone controls the hidden file input.' },
  ],
  contract: { doc: '04-component-bible.md', heading: 'FxDragDropUpload' },
};
