/**
 * FxPermissionMatrix showcase spec. Permissions are grouped by domain (Orders /
 * Users / Listings), columns are roles rendered as compact FxRoleBadge headers.
 * The first (editable) variant renders a full grid of native checkboxes so its
 * static a11y snapshot is non-empty; further variants cover read-only and
 * inherited-cell rendering. `Permission` fields are local prop-type strings.
 */
import type { ShowcaseSpec } from '../showcase-types';
import { FxPermissionMatrix, type Permission } from './permission-matrix';
import type { UserRole } from '../enums';

const noop = () => undefined;

const roles: UserRole[] = ['admin', 'support', 'seller', 'buyer'];

const permissions: Permission[] = [
  { id: 'orders.view', label: 'View orders', group: 'Orders' },
  { id: 'orders.refund', label: 'Refund orders', group: 'Orders', description: 'Issues a payment reversal' },
  { id: 'orders.release', label: 'Release escrow manually', group: 'Orders' },
  { id: 'users.suspend', label: 'Suspend users', group: 'Users' },
  { id: 'users.impersonate', label: 'Impersonate users', group: 'Users' },
  { id: 'listings.approve', label: 'Approve listings', group: 'Listings' },
];

const value: Record<string, UserRole[]> = {
  'orders.view': ['admin', 'support', 'seller', 'buyer'],
  'orders.refund': ['admin', 'support'],
  'orders.release': ['admin'],
  'users.suspend': ['admin'],
  'users.impersonate': ['admin'],
  'listings.approve': ['admin', 'support'],
};

/** Support inherits escrow-release + refund from the Admin template. */
const inherited = (permissionId: string, role: UserRole): boolean =>
  role === 'support' && (permissionId === 'orders.release' || permissionId === 'users.impersonate');

export const permissionMatrixShowcase: ShowcaseSpec = {
  name: 'PermissionMatrix',
  slug: 'permission-matrix',
  category: 'admin',
  slice: 'U10',
  status: 'ready',
  tagline: 'Roles × permissions grid — view or edit what each role may do, with inheritance made visible.',
  component: FxPermissionMatrix,
  interactive: true,
  variants: [
    {
      label: 'editable',
      props: { permissions, roles, value, onChange: noop },
      note: 'Each cell is a checkbox labelled “{permission} for {role}”.',
    },
    {
      label: 'read-only',
      props: { permissions, roles, value, readOnly: true },
      note: 'Cells render check / dash icons instead of checkboxes.',
    },
    {
      label: 'inherited cells',
      props: { permissions, roles, value, inherited, onChange: noop },
      note: 'Support’s inherited grants show a dimmed inherit glyph with an “Inherited” tooltip.',
    },
  ],
  props: [
    { name: 'permissions', type: '{ id; label: string; group: string; description? }[]', required: true, description: 'Capability rows, grouped by `group` in first-seen order.' },
    { name: 'roles', type: 'UserRole[]', required: true, description: 'Role columns (left → right). Headers render as compact FxRoleBadge.' },
    { name: 'value', type: 'Record<permissionId, UserRole[]>', required: true, description: 'The roles granted each permission.' },
    { name: 'onChange', type: '(permissionId: string, role: UserRole, granted: boolean) => void', description: 'A cell was toggled (editable mode only).' },
    { name: 'readOnly', type: 'boolean', default: 'false', description: 'Audit/review mode — cells render check/dash icons, not checkboxes.' },
    { name: 'inherited', type: '(permissionId, role) => boolean', description: 'Marks inherited grants (dimmed dash-check + “Inherited” tooltip).' },
    { name: 'roleLabels', type: 'Partial<Record<UserRole, string>>', description: 'Role display-name overrides, passed to each FxRoleBadge header.' },
    { name: 'labels', type: 'Partial<PermissionMatrixLabels>', description: 'i18n overrides (caption, capability header, cell-label template, inherited/granted strings).' },
  ],
  events: [
    { name: 'onChange', payload: '(permissionId, role, granted)', description: 'A checkbox cell was toggled (staging happens in the host).' },
  ],
  keyboard: [
    { keys: 'Tab', action: 'Move through the cell checkboxes and inherited-cell affordances.' },
    { keys: 'Space', action: 'Toggle the focused cell checkbox.' },
    { keys: 'Esc', action: 'Dismiss an inherited-cell tooltip.' },
  ],
  aria: [
    { attr: 'th[scope="col"]', value: 'role headers', note: 'Each role column header is an FxRoleBadge inside a column header cell.' },
    { attr: 'th[scope="row"]', value: 'capability', note: 'Each permission label is a row header; group rows are colgroup headers.' },
    { attr: 'aria-label', value: '{permission} for {role}', note: 'Editable cell checkboxes carry an explicit accessible name.' },
    { attr: 'role="img"', value: 'read-only / inherited cells', note: 'Icon cells expose granted / not-granted / inherited as an accessible name.' },
  ],
  contract: { doc: '04-component-bible.md', heading: 'FxPermissionMatrix — Permission Matrix' },
};
