/** Search Bar showcase — interactive; debounced onSearch, Esc clears-then-blurs. */
import type { ShowcaseSpec } from '../showcase-types';
import { FxSearchBar } from './search-bar';

export const searchBarShowcase: ShowcaseSpec = {
  name: 'Search Bar',
  slug: 'search-bar',
  category: 'navigation',
  slice: 'U4',
  status: 'ready',
  interactive: true,
  tagline: 'Query entry for list filtering and global search.',
  component: FxSearchBar,
  variants: [
    { label: 'default', props: { placeholder: 'Search orders…' } },
    { label: 'with value', props: { defaultValue: 'refund #2481', placeholder: 'Search orders…' } },
    { label: 'shortcut hint', props: { placeholder: 'Search…', shortcutHint: '⌘K' } },
    { label: 'size sm', props: { size: 'sm', placeholder: 'Search…' } },
    { label: 'disabled', props: { placeholder: 'Search…', disabled: true } },
  ],
  props: [
    { name: 'value / defaultValue', type: 'string', description: 'Controlled / uncontrolled query (§1.5).' },
    { name: 'placeholder', type: 'string', default: "'Search'", description: 'Empty-field hint (i18n).' },
    { name: 'debounceMs', type: 'number', default: '300', description: 'Debounce for onSearch; onChange stays per-keystroke.' },
    { name: 'size', type: "'sm' | 'md' | 'lg'", default: "'md'", description: 'Field height.' },
    { name: 'shortcutHint', type: 'string | false', default: 'false', description: 'Visual kbd hint (host binds the shortcut).' },
    { name: 'ariaLabel', type: 'string', default: "'Search'", description: 'Accessible name (i18n).' },
    { name: 'clearLabel', type: 'string', default: "'Clear search'", description: 'Clear button accessible name (i18n).' },
  ],
  events: [
    { name: 'onChange', payload: 'string', description: 'Per keystroke.' },
    { name: 'onSearch', payload: 'string', description: 'Debounced by debounceMs.' },
    { name: 'onEnter', payload: 'string', description: 'Immediate submit; cancels pending debounce.' },
  ],
  keyboard: [
    { keys: 'Enter', action: 'Fire onEnter immediately (cancel pending debounce)' },
    { keys: 'Esc', action: 'Clear the query, then blur when already empty' },
  ],
  aria: [
    { attr: 'role', value: "'search'", note: 'On the wrapping form landmark.' },
    { attr: 'aria-label', value: 'ariaLabel', note: 'On the input.' },
  ],
  contract: { doc: '04-component-bible.md', heading: 'FxSearchBar' },
};
