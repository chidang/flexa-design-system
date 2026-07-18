/**
 * ImageGalleryUpload showcase — a reorderable grid of images with a cover badge
 * on the first tile + an add-tile. Static `UploadFile[]` (with urls) keeps the
 * grid deterministic + axe-clean.
 */
import type { ShowcaseSpec } from '../showcase-types';
import { FxImageGalleryUpload } from './image-gallery-upload';
import type { UploadFile } from '../file-upload/file-upload';

const gallery: UploadFile[] = [
  { id: '1', name: 'front.jpg', size: 900_000, type: 'image/jpeg', status: 'success', url: 'https://example.com/1.jpg' },
  { id: '2', name: 'kitchen.jpg', size: 820_000, type: 'image/jpeg', status: 'success', url: 'https://example.com/2.jpg' },
  { id: '3', name: 'yard.jpg', size: 760_000, type: 'image/jpeg', status: 'success', url: 'https://example.com/3.jpg' },
];

const uploading: UploadFile[] = [
  { id: '1', name: 'front.jpg', size: 900_000, type: 'image/jpeg', status: 'success', url: 'https://example.com/1.jpg' },
  { id: '2', name: 'wip.jpg', size: 1_400_000, type: 'image/jpeg', status: 'uploading', progress: 45 },
];

export const imageGalleryUploadShowcase: ShowcaseSpec = {
  name: 'ImageGalleryUpload',
  slug: 'image-gallery-upload',
  category: 'forms',
  slice: 'U5',
  status: 'ready',
  interactive: true,
  tagline: 'Reorderable image grid — first tile is the cover; add-tile appends more.',
  component: FxImageGalleryUpload,
  variants: [
    { label: 'empty', props: {} },
    { label: 'with images', props: { value: gallery } },
    { label: 'uploading', props: { value: uploading } },
    { label: 'not reorderable', props: { value: gallery, reorderable: false } },
    { label: 'custom cover label', props: { value: gallery, galleryLabels: { coverBadge: 'Main' } } },
    { label: 'disabled', props: { value: gallery, disabled: true } },
  ],
  props: [
    { name: 'value / defaultValue', type: 'UploadFile[]', default: '— / []', description: 'Controlled / uncontrolled list; index 0 = cover.' },
    { name: 'accept', type: 'string', default: "'image/*'", description: 'Accepted image types.' },
    { name: 'maxFiles', type: 'number', default: '10', description: 'Total image cap; hides the add-tile at the limit.' },
    { name: 'reorderable', type: 'boolean', default: 'true', description: 'Enable the drag handle + keyboard reorder.' },
    { name: 'onReorder', type: '(ids: string[]) => void', description: 'New id order after a reorder settles.' },
    { name: 'galleryLabels', type: '{ remove; reorder; coverBadge; moved; lifted; dropped; cancelled }', default: 'English set', description: 'i18n; move templates take {name}/{n}/{total}.' },
    { name: 'status (per item)', type: "'queued' | 'uploading' | 'success' | 'error'", description: 'Item state → data-status.' },
  ],
  events: [
    { name: 'onChange', payload: '(files, { source })', description: 'Add / remove / reorder mutations.' },
    { name: 'onReorder', payload: 'string[]', description: 'The new id order.' },
  ],
  keyboard: [
    { keys: 'Space / Enter', action: 'Lift the focused item, then drop it' },
    { keys: 'Arrow', action: 'Move a lifted item one position' },
    { keys: 'Esc', action: 'Cancel the reorder' },
  ],
  aria: [
    { attr: 'role', value: 'list', note: 'On the image grid.' },
    { attr: 'aria-pressed', value: 'true', note: 'On the drag handle while an item is lifted.' },
    { attr: 'aria-live', value: 'polite', note: "Moves announced ('{name} moved to position {n} of {total}')." },
  ],
  contract: { doc: '04-component-bible.md', heading: 'FxImageGalleryUpload' },
};
