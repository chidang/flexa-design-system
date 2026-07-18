/**
 * FxRoleBadge showcase spec. The first variant renders all six canonical roles
 * (static, non-interactive markup) so its a11y snapshot is non-empty; the
 * remaining variants cover appearance + size. `UserRole` is the component's own
 * shared union, surfaced via the `enums` field for the docs reference.
 */
import type { ShowcaseSpec } from '../showcase-types';
import { USER_ROLES } from '../enums';
import { FxRoleBadge } from './role-badge';

export const roleBadgeShowcase: ShowcaseSpec = {
  name: 'RoleBadge',
  slug: 'role-badge',
  category: 'admin',
  slice: 'U10',
  status: 'ready',
  tagline: 'Fixed role→tone/icon badge — the single canonical way to render a user role.',
  component: FxRoleBadge,
  variants: [
    {
      label: 'admin (danger)',
      props: { role: 'admin' },
      note: 'The six variants below enumerate every canonical role → tone/icon.',
    },
    {
      label: 'support (warning)',
      props: { role: 'support' },
    },
    {
      label: 'moderator (warning)',
      props: { role: 'moderator' },
    },
    {
      label: 'seller (info)',
      props: { role: 'seller' },
    },
    {
      label: 'buyer (neutral)',
      props: { role: 'buyer' },
    },
    {
      label: 'guest (outline)',
      props: { role: 'guest' },
    },
    {
      label: 'seller · solid',
      props: { role: 'seller', appearance: 'solid' },
    },
    {
      label: 'admin · compact',
      props: { role: 'admin', size: 'sm' },
    },
  ],
  props: [
    { name: 'role', type: "UserRole ('guest'|'buyer'|'seller'|'admin'|'support'|'moderator')", required: true, description: 'Role to render. Tone + icon come from the binding map (never hand-picked).' },
    { name: 'appearance', type: "'solid' | 'subtle' | 'outline'", default: "'subtle'", description: 'Fill treatment. Guest always renders outline.' },
    { name: 'size', type: "'sm' | 'md'", default: "'md'", description: 'Height (sm = compact, for dense table cells).' },
    { name: 'labels', type: 'Partial<RoleBadgeLabels>', description: 'Role display-name overrides (Admin / Support / Seller / Buyer / Guest / Moderator), merged over the English defaults.' },
  ],
  aria: [
    { attr: 'contract', value: 'colour + icon + label', note: 'Never colour alone (doc 04 §1.7.7) — every role carries a glyph and a text label.' },
    { attr: 'contract', value: 'canonical', note: 'The only way to render a role — screens never hand-pick role colours (doc 08).' },
  ],
  enums: { UserRole: USER_ROLES },
  contract: { doc: '04-component-bible.md', heading: 'FxRoleBadge — Role Badge' },
};
