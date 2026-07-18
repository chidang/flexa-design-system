/** Command Palette showcase — interactive; portal dialog + combobox listbox. */
import type { ShowcaseSpec } from '../showcase-types';
import { FxCommandPalette } from './command-palette';

const commands = [
  { id: 'new-listing', label: 'Create listing', group: 'Actions', icon: 'plus' as const, kbd: 'C' },
  { id: 'export', label: 'Export orders', group: 'Actions', icon: 'download' as const },
  { id: 'billing', label: 'Settings › Billing', group: 'Navigation', icon: 'card' as const, hint: 'Settings' },
  { id: 'payments', label: 'Payments & Refunds', group: 'Navigation', icon: 'wallet' as const },
  { id: 'order-2481', label: '#FM-2481 — refund requested', group: 'Orders', icon: 'package' as const },
];

export const commandPaletteShowcase: ShowcaseSpec = {
  name: 'Command Palette',
  slug: 'command-palette',
  category: 'navigation',
  slice: 'U4',
  status: 'ready',
  interactive: true,
  tagline: 'Keyboard-first launcher over commands, destinations, and entities.',
  component: FxCommandPalette,
  variants: [
    { label: 'open', props: { commands, defaultOpen: true } },
    { label: 'closed (default)', props: { commands, defaultOpen: false } },
  ],
  props: [
    { name: 'commands', type: 'Command[]', required: true, description: 'Indexed commands (label, group, icon, kbd, keywords, perform).' },
    { name: 'open / defaultOpen', type: 'boolean', description: 'Controlled / uncontrolled open state (§1.5).' },
    { name: 'debounceMs', type: 'number', default: '300', description: 'Debounce for onSearch.' },
    { name: 'placeholder', type: 'string', default: "'Type a command or search…'", description: 'Input hint (i18n).' },
    { name: 'emptyLabel', type: 'string', default: "'No results'", description: 'Empty-results message (i18n).' },
    { name: 'ariaLabel', type: 'string', default: "'Command palette'", description: 'Dialog accessible name (i18n).' },
  ],
  events: [
    { name: 'onSelect', payload: 'Command', description: 'Command chosen; perform() then close.' },
    { name: 'onSearch', payload: 'string', description: 'Debounced query.' },
    { name: 'onOpenChange', payload: 'boolean', description: 'Open state changed.' },
  ],
  keyboard: [
    { keys: '↑ / ↓', action: 'Move the active option (wraps)' },
    { keys: 'Enter', action: 'Select the active command' },
    { keys: 'Esc', action: 'Close and restore focus' },
    { keys: 'Tab', action: 'Trapped — the input stays focused' },
  ],
  aria: [
    { attr: 'role', value: "'dialog'", note: "aria-modal='true', labelled by ariaLabel." },
    { attr: 'role', value: "'combobox' / 'listbox' / 'option'", note: 'Input + results.' },
    { attr: 'aria-activedescendant', value: 'option id', note: 'Focus stays in the input.' },
  ],
  contract: { doc: '04-component-bible.md', heading: 'FxCommandPalette' },
};
