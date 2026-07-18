/**
 * FxRoleBadge — the single canonical way to render a user's role (doc 04 §3.9
 * "FxRoleBadge — Role Badge").
 *
 * An FxBadge specialization with a fixed, BINDING role→tone/icon mapping — screens
 * never hand-pick role colours (doc 08). Colour is always paired with a glyph and
 * a label so a role never relies on colour alone (doc 04 §1.7.7). Pure
 * presentational (no hooks) → renders as an RSC in docs.
 */
import type { Size, Tone, UserRole } from '../enums';
import type { IconName } from '../icon/map';
import { FxBadge, type BadgeAppearance } from '../badge/badge';

/** Fixed per-role visual spec (BINDING — doc 04 §3.9). */
interface RoleSpec {
  tone: Tone;
  icon: IconName;
  /** Guest uses an outline treatment regardless of the `appearance` prop. */
  forceOutline?: boolean;
}

/** Canonical role → tone/icon map. The table is binding; never override per-screen. */
const ROLE_SPEC: Record<UserRole, RoleSpec> = {
  admin: { tone: 'danger', icon: 'shield-check' },
  support: { tone: 'warning', icon: 'lock' },
  moderator: { tone: 'warning', icon: 'lock' },
  seller: { tone: 'info', icon: 'users' },
  buyer: { tone: 'neutral', icon: 'users' },
  guest: { tone: 'neutral', icon: 'users', forceOutline: true },
};

/** Role → display name. Every user-facing string is a prop (merged over defaults). */
export type RoleBadgeLabels = Record<UserRole, string>;

export const DEFAULT_ROLE_BADGE_LABELS: RoleBadgeLabels = {
  guest: 'Guest',
  buyer: 'Buyer',
  seller: 'Seller',
  admin: 'Admin',
  support: 'Support',
  moderator: 'Moderator',
};

export interface FxRoleBadgeProps {
  /** The role to render. Its tone + icon come from the binding map. */
  role: UserRole;
  /** Fill treatment. Defaults to `subtle` (guest always renders outline). */
  appearance?: BadgeAppearance;
  /** Height. Defaults to `md`. */
  size?: Extract<Size, 'sm' | 'md'>;
  /** Role display-name overrides. Merged over the English defaults. */
  labels?: Partial<RoleBadgeLabels>;
  className?: string;
}

export function FxRoleBadge({
  role,
  appearance = 'subtle',
  size = 'md',
  labels,
  className,
}: FxRoleBadgeProps) {
  const l = { ...DEFAULT_ROLE_BADGE_LABELS, ...labels };
  const spec = ROLE_SPEC[role];
  const rootClass = ['fx-role-badge', className].filter(Boolean).join(' ');
  return (
    <span className={rootClass} data-role={role}>
      <FxBadge
        tone={spec.tone}
        appearance={spec.forceOutline ? 'outline' : appearance}
        size={size}
        icon={spec.icon}
      >
        {l[role]}
      </FxBadge>
    </span>
  );
}
