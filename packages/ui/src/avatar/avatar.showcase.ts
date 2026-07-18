/**
 * Avatar showcase spec — image, initials, icon fallback, sizes, shapes, status.
 * Interactive (client island): the image-error fallback uses component state.
 */
import type { ShowcaseSpec } from '../showcase-types';
import { FxAvatar } from './avatar';

const SIZES = ['xs', 'sm', 'md', 'lg', 'xl'] as const;
const SHAPES = ['circle', 'square'] as const;

export const avatarShowcase: ShowcaseSpec = {
  name: 'Avatar',
  slug: 'avatar',
  category: 'display',
  slice: 'U2',
  status: 'ready',
  interactive: true,
  tagline: 'A user or entity avatar — image, initials, or icon fallback.',
  component: FxAvatar,
  variants: [
    { label: 'initials', props: { name: 'Jane Cooper', alt: 'Jane Cooper' } },
    { label: 'icon fallback', props: {} },
    { label: 'broken image → initials', props: { src: 'about:blank#missing', name: 'Wade Warren', alt: 'Wade Warren' } },
    ...SIZES.map((size) => ({ label: `size ${size}`, props: { name: 'AB', alt: 'AB', size } })),
    ...SHAPES.map((shape) => ({ label: shape, props: { name: 'CD', alt: 'CD', shape } })),
    { label: 'status online', props: { name: 'Eve', alt: 'Eve', status: 'online' } },
    { label: 'status away', props: { name: 'Fay', alt: 'Fay', status: 'away' } },
    { label: 'status offline', props: { name: 'Guy', alt: 'Guy', status: 'offline' } },
  ],
  props: [
    { name: 'src / alt', type: 'string', description: '`alt` required with `src`; empty string for decorative-in-context.' },
    { name: 'name', type: 'string', description: 'Initials fallback + deterministic background hue.' },
    { name: 'size', type: "'xs' | 'sm' | 'md' | 'lg' | 'xl'", default: "'md'", description: 'Diameter (20 / 24 / 32 / 40 / 64px).' },
    { name: 'shape', type: "'circle' | 'square'", default: "'circle'", description: 'Square uses radius.md.' },
    { name: 'status', type: "'online' | 'away' | 'offline' | null", default: 'null', description: 'Presence dot.' },
    { name: 'statusLabel', type: 'string', default: "'Online' / 'Away' / 'Offline'", description: 'Visually-hidden status name (i18n).' },
  ],
  aria: [
    { attr: 'alt', value: 'string', note: 'On the image; empty for decorative-in-context.' },
    { attr: 'aria-hidden', value: 'true', note: 'On initials when no accessible name is provided.' },
  ],
  contract: { doc: '04-component-bible.md', heading: 'FxAvatar' },
};
