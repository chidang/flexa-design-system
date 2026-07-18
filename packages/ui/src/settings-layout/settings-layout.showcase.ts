/**
 * FxSettingsLayout showcase — a two-pane settings shell. The `sections` shape
 * and children Node are documented in `props`; icon names are the canonical
 * IconName set (documented, not a shared enum union), so `enums` is omitted.
 */
import { createElement } from 'react';
import type { ShowcaseSpec } from '../showcase-types';
import { FxSettingsLayout, type SettingsSection } from './settings-layout';

const SECTIONS: SettingsSection[] = [
  { id: 'profile', label: 'Profile', icon: 'users', href: '#profile' },
  { id: 'account', label: 'Account', icon: 'settings', href: '#account' },
  { id: 'security', label: 'Security', icon: 'lock', href: '#security' },
  { id: 'notifications', label: 'Notifications', icon: 'bell', href: '#notifications' },
];

const content = createElement(
  'section',
  null,
  createElement('h2', { key: 'h' }, 'Profile'),
  createElement('p', { key: 'd' }, 'Update your public profile details.'),
);

export const settingsLayoutShowcase: ShowcaseSpec = {
  name: 'FxSettingsLayout',
  slug: 'settings-layout',
  category: 'layouts',
  slice: 'U7',
  status: 'ready',
  interactive: true,
  tagline: 'A two-pane settings shell with a grouped nav and a dirty-state save bar.',
  component: FxSettingsLayout,
  variants: [
    { label: 'default', props: { sections: SECTIONS, activeId: 'profile', children: content } },
    {
      label: 'dirty (save bar visible)',
      props: { sections: SECTIONS, activeId: 'account', children: content, dirty: true },
    },
    {
      label: 'custom labels',
      props: {
        sections: SECTIONS,
        activeId: 'security',
        children: content,
        dirty: true,
        saveLabel: 'Apply',
        discardLabel: 'Cancel',
        unsavedLabel: 'Pending edits not yet applied',
      },
    },
  ],
  props: [
    {
      name: 'sections',
      type: '{ id; label: string; icon?: IconName; href: string }[]',
      required: true,
      description: 'Nav links, in display order.',
    },
    { name: 'activeId', type: 'string', description: 'Active section id (its link gets aria-current="page").' },
    { name: 'children', type: 'ReactNode', required: true, description: "The active section's content." },
    { name: 'dirty', type: 'boolean', default: 'false', description: 'Unsaved changes — reveals the sticky save bar.' },
    { name: 'saveLabel', type: 'string', default: "'Save changes'", description: 'Save button label.' },
    { name: 'discardLabel', type: 'string', default: "'Discard'", description: 'Discard button label.' },
    { name: 'unsavedLabel', type: 'string', default: "'You have unsaved changes'", description: 'Announced when the save bar appears.' },
    { name: 'navAriaLabel', type: 'string', default: "'Settings'", description: 'Accessible name for the nav landmark.' },
  ],
  events: [
    { name: 'onSave', payload: '()', description: 'Save button pressed.' },
    { name: 'onDiscard', payload: '()', description: 'Discard button pressed.' },
  ],
  aria: [
    { attr: 'aria-current', value: 'page', note: 'On the active nav link.' },
    { attr: 'role', value: 'status', note: 'On the save bar; announces the unsaved-changes message.' },
    { attr: 'aria-label', value: 'Settings', note: 'On the nav landmark (navAriaLabel).' },
  ],
  contract: { doc: '04-component-bible.md', heading: 'FxSettingsLayout' },
};
