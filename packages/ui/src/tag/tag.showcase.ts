/**
 * Tag showcase spec — tones plus interactive (link) and icon states.
 */
import type { ShowcaseSpec } from '../showcase-types';
import { TONES } from '../enums';
import { FxTag } from './tag';

export const tagShowcase: ShowcaseSpec = {
  name: 'Tag',
  slug: 'tag',
  category: 'display',
  slice: 'U2',
  status: 'ready',
  interactive: false,
  tagline: 'A categorical label — optionally a filter link.',
  component: FxTag,
  variants: [
    ...TONES.map((tone) => ({ label: tone, props: { tone }, children: tone })),
    { label: 'with icon', props: { icon: 'tag' as const }, children: 'Design' },
    { label: 'size sm', props: { size: 'sm' }, children: 'Draft' },
    { label: 'interactive (link)', props: { href: '#featured', tone: 'info' }, children: 'Featured' },
  ],
  enums: { tone: TONES },
  props: [
    { name: 'tone', type: "'neutral' | 'info' | 'success' | 'warning' | 'danger'", default: "'neutral'", description: 'Categorical tone.' },
    { name: 'size', type: "'sm' | 'md'", default: "'md'", description: 'Height (20 / 24px).' },
    { name: 'icon', type: 'IconName', description: 'Leading icon.' },
    { name: 'href', type: 'string', description: 'Makes the tag an interactive filter link (`<a>`).' },
    { name: 'onClick', type: '(event) => void', description: 'Makes the tag an interactive `<button>` when no href.' },
  ],
  keyboard: [
    { keys: 'Enter · Space', action: 'Activate (interactive form only).' },
    { keys: 'Tab', action: 'Move focus (interactive form only).' },
  ],
  contract: { doc: '04-component-bible.md', heading: 'FxTag' },
};
