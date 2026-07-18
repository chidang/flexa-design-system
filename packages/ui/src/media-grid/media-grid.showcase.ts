/**
 * Media Grid showcase spec. The `MediaItem` shape and `MediaKind` union are
 * documented in `props` as type strings (rule 6 — local unions do NOT go in the
 * shared `enums` map); no shared-union `enums` apply.
 */
import type { ShowcaseSpec } from '../showcase-types';
import { FxMediaGrid, type MediaItem } from './media-grid';

const ITEMS: MediaItem[] = [
  { id: '1', name: 'hero-banner.jpg', kind: 'image', thumbnailUrl: 'https://picsum.photos/id/1015/240/180', url: '/media/hero-banner.jpg', size: 482_113, createdAt: '2026-07-01T09:00:00Z' },
  { id: '2', name: 'promo-clip.mp4', kind: 'video', url: '/media/promo-clip.mp4', size: 18_402_331, createdAt: '2026-07-02T10:30:00Z' },
  { id: '3', name: 'jingle.mp3', kind: 'audio', url: '/media/jingle.mp3', size: 3_204_112, createdAt: '2026-07-03T14:15:00Z' },
  { id: '4', name: 'brand-guidelines.pdf', kind: 'file', url: '/media/brand-guidelines.pdf', size: 1_048_576, createdAt: '2026-07-04T08:45:00Z' },
  { id: '5', name: 'gallery-02.png', kind: 'image', thumbnailUrl: 'https://picsum.photos/id/1018/240/180', url: '/media/gallery-02.png', size: 921_344, createdAt: '2026-07-05T11:20:00Z' },
  { id: '6', name: 'contract.docx', kind: 'file', url: '/media/contract.docx', size: 65_536, createdAt: '2026-07-06T16:05:00Z' },
];

const ACTIONS = () => [
  { id: 'open', label: 'Open', icon: 'external-link' as const },
  { id: 'download', label: 'Download', icon: 'download' as const },
  { id: 'sep', label: '', type: 'separator' as const },
  { id: 'delete', label: 'Delete', icon: 'close' as const, tone: 'danger' as const },
];

export const mediaGridShowcase: ShowcaseSpec = {
  name: 'FxMediaGrid',
  slug: 'media-grid',
  category: 'data',
  slice: 'U6',
  status: 'ready',
  interactive: true,
  tagline: 'File-manager tile grid — selection, type icons and a per-item context menu.',
  component: FxMediaGrid,
  variants: [
    { label: 'mixed kinds', props: { items: ITEMS } },
    { label: 'with actions menu', props: { items: ITEMS, itemActions: ACTIONS } },
    { label: 'selectable (multi)', props: { items: ITEMS, selectable: 'multi' } },
    { label: 'selected', props: { items: ITEMS, selectable: 'multi', defaultSelectedKeys: ['1', '4'] } },
    { label: 'custom columns (3)', props: { items: ITEMS, columns: 3 } },
    { label: 'loading', props: { items: [], loading: true } },
    { label: 'empty', props: { items: [] } },
  ],
  props: [
    { name: 'items', type: 'MediaItem[]', required: true, description: 'MediaItem = { id; name; kind; thumbnailUrl?; url; size; createdAt }.' },
    { name: 'kind', type: "'image' | 'video' | 'audio' | 'file'", description: 'Per-item media kind (drives the type icon).' },
    { name: 'selectable', type: "'none' | 'multi'", default: "'none'", description: 'Selection mode.' },
    { name: 'selectedKeys / defaultSelectedKeys', type: 'string[]', default: '— / []', description: 'Selected item ids (§1.5).' },
    { name: 'columns', type: "'auto' | number", default: "'auto'", description: "'auto' fills at min tile 160px; a number fixes the count." },
    { name: 'loading', type: 'boolean', default: 'false', description: 'Renders skeleton tiles.' },
    { name: 'emptyState', type: 'ReactNode', description: 'Custom zero-data surface (defaults to FxEmptyState).' },
    { name: 'labels', type: 'Partial<MediaGridLabels>', default: 'DEFAULT_MEDIA_GRID_LABELS', description: '{ select="Select {name}"; actions="Actions for {name}" } (i18n).' },
  ],
  events: [
    { name: 'onSelectionChange', payload: '(keys: string[])', description: 'Next full selection set.' },
    { name: 'onItemOpen', payload: '(item: MediaItem)', description: 'Tile opened (Enter / double-click).' },
    { name: 'onItemAction', payload: '(item: MediaItem, action: MenuItem)', description: 'Per-item context-menu action selected.' },
  ],
  keyboard: [
    { keys: '← / → / ↑ / ↓', action: 'Move the focused cell (2-D roving, single tab stop)' },
    { keys: 'Home / End', action: 'First / last tile' },
    { keys: 'Space', action: 'Toggle selection (when selectable)' },
    { keys: 'Enter', action: 'Open the focused item' },
  ],
  aria: [
    { attr: 'role', value: 'grid', note: 'Single tab stop.' },
    { attr: 'role', value: 'gridcell', note: 'One per tile; roving tabindex.' },
    { attr: 'aria-selected', value: 'true | false', note: 'On tiles when selectable.' },
    { attr: 'aria-label', value: 'labelled selection checkbox + actions trigger' },
  ],
  contract: { doc: '04-component-bible.md', heading: 'FxMediaGrid' },
};
