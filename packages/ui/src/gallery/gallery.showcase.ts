/**
 * Gallery showcase spec. `images` (with required `alt`) and the `labels` shape
 * are documented in `props` as type strings; no shared-union `enums` apply.
 */
import type { ShowcaseSpec } from '../showcase-types';
import { FxGallery } from './gallery';

const IMAGES = [
  { id: 'a', src: 'https://picsum.photos/id/1015/800/600', alt: 'River between mountains under a cloudy sky' },
  { id: 'b', src: 'https://picsum.photos/id/1016/800/600', alt: 'Aerial view of a winding canyon road' },
  { id: 'c', src: 'https://picsum.photos/id/1018/800/600', alt: 'Snow-capped peaks over a still lake' },
  { id: 'd', src: 'https://picsum.photos/id/1019/800/600', alt: 'Forest ridge fading into morning fog' },
];

const CAPTIONED = IMAGES.map((img, i) => ({
  ...img,
  caption: `Plate ${i + 1} — field study`,
}));

export const galleryShowcase: ShowcaseSpec = {
  name: 'FxGallery',
  slug: 'gallery',
  category: 'data',
  slice: 'U6',
  status: 'ready',
  interactive: true,
  tagline: 'Image carousel — stage, prev/next, thumbnail listbox, optional fullscreen lightbox.',
  component: FxGallery,
  variants: [
    { label: 'default (stage + thumbs)', props: { images: IMAGES } },
    { label: 'at index 2', props: { images: IMAGES, defaultIndex: 2 } },
    { label: 'single image (no nav)', props: { images: [IMAGES[0]] } },
    { label: 'lightbox disabled', props: { images: IMAGES, lightbox: false } },
    { label: 'loop off', props: { images: IMAGES, loop: false } },
    { label: 'with captions', props: { images: CAPTIONED } },
  ],
  props: [
    { name: 'images', type: '{ id; src: string; alt: string; caption? }[]', required: true, description: 'Ordered images; alt is required on every image.' },
    { name: 'index / defaultIndex', type: 'number', default: '— / 0', description: 'Active image (§1.5 controlled/uncontrolled).' },
    { name: 'lightbox', type: 'boolean', default: 'true', description: 'Enables the fullscreen lightbox dialog.' },
    { name: 'loop', type: 'boolean', default: 'true', description: 'Wrap around at the ends.' },
    { name: 'labels', type: 'Partial<GalleryLabels>', default: 'DEFAULT_GALLERY_LABELS', description: '{ prev; next; fullscreen; counter="{n} of {total}"; close } (i18n).' },
  ],
  events: [
    { name: 'onIndexChange', payload: '(index: number)', description: 'Fires when the active image changes.' },
  ],
  keyboard: [
    { keys: '← / →', action: 'Stage: previous / next image' },
    { keys: '← / → / ↑ / ↓', action: 'Thumbnails: move the active option (roving)' },
    { keys: 'Home / End', action: 'Thumbnails: first / last image' },
    { keys: 'Enter / Space', action: 'Thumbnails: select the active image' },
    { keys: 'Esc', action: 'Lightbox: close (dialog)' },
  ],
  aria: [
    { attr: 'role', value: 'group', note: 'Stage; aria-roledescription="carousel".' },
    { attr: 'role', value: 'listbox', note: 'Thumbnail strip (roving tabindex).' },
    { attr: 'aria-activedescendant', value: 'active thumbnail id' },
    { attr: 'role', value: 'status', note: 'Counter announces index changes.' },
    { attr: 'role', value: 'dialog', note: 'Lightbox (aria-modal="true"); portal gated on mount.' },
  ],
  contract: { doc: '04-component-bible.md', heading: 'FxGallery' },
};
