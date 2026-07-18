/**
 * FxMention showcase spec. Two faces: the inline token (`FxMention`, the primary
 * demo — renders non-empty static markup) and the picker combobox
 * (`FxMentionPicker`, documented in props/keyboard/aria). No shared §5 union —
 * `MentionUser` is documented as a type string in `props`.
 */
import type { ShowcaseSpec } from '../showcase-types';
import { FxMention } from './mention';

const ada = { id: 'u1', name: 'Ada Lovelace', handle: 'ada', avatarSrc: 'https://picsum.photos/seed/ada/64' };
const grace = { id: 'u2', name: 'Grace Hopper', handle: 'grace' };

export const mentionShowcase: ShowcaseSpec = {
  name: 'Mention',
  slug: 'mention',
  category: 'collaboration',
  slice: 'U9',
  status: 'ready',
  interactive: true,
  tagline: 'Inline @-mention token + an @-triggered user picker for composers.',
  component: FxMention,
  variants: [
    { label: 'interactive token', props: { user: ada } },
    { label: 'no avatar', props: { user: grace } },
    { label: 'custom href', props: { user: ada, href: '/people/ada' } },
    { label: 'static (read-only)', props: { user: ada, interactive: false } },
  ],
  props: [
    { name: 'user', type: 'MentionUser', required: true, description: 'MentionUser = { id; name; handle; avatarSrc? }. Token label is @name; handle exposed via title.' },
    { name: 'interactive', type: 'boolean', default: 'true', description: 'true → profile link; false → static text span.' },
    { name: 'href', type: 'string', default: "'/@{handle}'", description: 'Profile link target for the token.' },
    { name: 'loadUsers (picker)', type: '(query: string) => Promise<MentionUser[]>', required: true, description: 'FxMentionPicker: async user source for the current query.' },
    { name: 'trigger (picker)', type: 'string', default: "'@'", description: 'FxMentionPicker: the character that opens the picker.' },
    { name: 'maxResults (picker)', type: 'number', default: '8', description: 'FxMentionPicker: max rows kept from loadUsers.' },
  ],
  events: [
    { name: 'onCommit (picker)', payload: 'MentionUser', description: 'A user was committed (Enter / Tab / click).' },
    { name: 'onDismiss (picker)', payload: '()', description: 'Picker dismissed (Esc) — host restores plain text.' },
    { name: 'onQueryChange (picker)', payload: 'string', description: 'Fired per keystroke with the current query.' },
  ],
  keyboard: [
    { keys: '↑ / ↓', action: 'Move the active user in the picker list (wraps)' },
    { keys: 'Enter / Tab', action: 'Commit the active user' },
    { keys: 'Esc', action: 'Dismiss the picker (returns plain text)' },
  ],
  aria: [
    { attr: 'role', value: 'combobox', note: 'On the picker input; aria-controls/aria-activedescendant gated behind mount.' },
    { attr: 'role', value: 'listbox / option', note: 'Picker rows; active row aria-selected + data-active.' },
    { attr: 'a.fx-mention[title]', value: '@handle', note: 'Token is a real link to the profile; handle exposed via title.' },
  ],
  contract: { doc: '04-component-bible.md', heading: 'FxMention — Mention' },
};
