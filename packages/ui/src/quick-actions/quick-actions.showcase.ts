/** Quick Actions showcase — pure/RSC grid of card-styled action tiles. */
import type { ShowcaseSpec } from '../showcase-types';
import { FxQuickActions } from './quick-actions';

const actions = [
  { id: 'listing', label: 'Create listing', icon: 'plus' as const, description: 'List a new product for sale' },
  { id: 'withdraw', label: 'Withdraw funds', icon: 'wallet' as const, description: 'Move your balance to your bank' },
  { id: 'invite', label: 'Invite a teammate', icon: 'users' as const, description: 'Add a seller to your workspace' },
  { id: 'report', label: 'View reports', icon: 'chart' as const, description: 'Sales and payout analytics' },
];

export const quickActionsShowcase: ShowcaseSpec = {
  name: 'Quick Actions',
  slug: 'quick-actions',
  category: 'navigation',
  slice: 'U4',
  status: 'ready',
  interactive: false,
  tagline: 'A promoted cluster of the highest-value actions for the context.',
  component: FxQuickActions,
  variants: [
    { label: 'auto columns', props: { actions } },
    { label: '2 columns', props: { actions, columns: 2 } },
    { label: 'compact size', props: { actions, size: 'sm' } },
    {
      label: 'with disabled',
      props: {
        actions: [actions[0], { ...actions[1], disabled: true }, actions[2]],
      },
    },
  ],
  props: [
    { name: 'actions', type: 'QuickAction[]', required: true, description: '2–6 promoted actions (icon + label + optional description).' },
    { name: 'columns', type: "number | 'auto'", default: "'auto'", description: 'Fixed column count or width-driven flow.' },
    { name: 'size', type: "'sm' | 'md' | 'lg'", default: "'md'", description: 'Tile padding density.' },
    { name: 'ariaLabel', type: 'string', default: "'Quick actions'", description: 'Accessible name for the group (i18n).' },
  ],
  keyboard: [
    { keys: 'Tab', action: 'Move between action tiles (native)' },
    { keys: 'Enter · Space', action: 'Activate the focused tile' },
  ],
  aria: [
    { attr: 'role', value: "'group'", note: 'On the tile container.' },
    { attr: 'aria-disabled', value: 'true', note: 'On disabled tiles.' },
  ],
  contract: { doc: '04-component-bible.md', heading: 'FxQuickActions' },
};
