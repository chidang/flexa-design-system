'use client';
/**
 * FxPermissionMatrix — roles × permissions grid for viewing and editing what each
 * role may do (doc 04 §3.9 "FxPermissionMatrix — Permission Matrix").
 *
 * A semantic table: rows are permissions grouped by domain (group header rows),
 * columns are roles whose headers are composed with FxRoleBadge (compact). Each
 * cell is an FxCheckbox when editable (aria-label `'{permission} for {role}'`) or a
 * check/dash icon when read-only. Inherited grants render a dimmed dash-check with
 * an "Inherited" tooltip. The first column and header row are sticky. Every
 * user-facing string is a prop.
 */
import { Fragment, useMemo } from 'react';
import type { UserRole } from '../enums';
import { FxIcon } from '../icon/FxIcon';
import { FxCheckbox } from '../checkbox/checkbox';
import { FxTooltip } from '../tooltip/tooltip';
import { FxRoleBadge } from '../role-badge/role-badge';

/** One capability row in the matrix. */
export interface Permission {
  id: string;
  label: string;
  /** Domain the row is grouped under (e.g. `Orders`, `Users`). */
  group: string;
  /** Optional scope/help note shown under the label. */
  description?: string;
}

/** Baked-in strings — every one a prop (§i18n). */
export interface PermissionMatrixLabels {
  caption: string;
  /** First-column header. */
  capability: string;
  /** Tooltip on inherited grants (`{role}` is NOT interpolated here — flat text). */
  inherited: string;
  /** Visually-hidden name for a granted read-only cell. */
  granted: string;
  /** Visually-hidden name for a not-granted read-only cell. */
  notGranted: string;
  /**
   * Editable cell aria-label template. `{permission}` and `{role}` are replaced
   * with the row label and the role's display name.
   */
  cellLabel: string;
}

export const DEFAULT_PERMISSION_MATRIX_LABELS: PermissionMatrixLabels = {
  caption: 'Role permissions',
  capability: 'Capability',
  inherited: 'Inherited',
  granted: 'Granted',
  notGranted: 'Not granted',
  cellLabel: '{permission} for {role}',
};

export interface FxPermissionMatrixProps {
  /** Capability rows (grouped by `group`, in first-seen order). */
  permissions: Permission[];
  /** Role columns, left → right. Headers render as compact FxRoleBadge. */
  roles: UserRole[];
  /** permissionId → the roles that are granted it. */
  value: Record<string, UserRole[]>;
  /** A cell was toggled (editable mode only). */
  onChange?: (permissionId: string, role: UserRole, granted: boolean) => void;
  /** Read-only (audit/review) — cells render check/dash icons, not checkboxes. */
  readOnly?: boolean;
  /** Returns true when a grant is inherited (dimmed dash-check + tooltip). */
  inherited?: (permissionId: string, role: UserRole) => boolean;
  /** Role display-name overrides, passed through to each FxRoleBadge header. */
  roleLabels?: Partial<Record<UserRole, string>>;
  /** Baked-in strings. Merged over the English defaults. */
  labels?: Partial<PermissionMatrixLabels>;
  className?: string;
}

/** Preserve first-seen group order while collecting the rows under each. */
function groupRows(permissions: Permission[]): { group: string; rows: Permission[] }[] {
  const order: string[] = [];
  const byGroup = new Map<string, Permission[]>();
  for (const p of permissions) {
    let bucket = byGroup.get(p.group);
    if (!bucket) {
      bucket = [];
      byGroup.set(p.group, bucket);
      order.push(p.group);
    }
    bucket.push(p);
  }
  return order.map((group) => ({ group, rows: byGroup.get(group)! }));
}

export function FxPermissionMatrix({
  permissions,
  roles,
  value,
  onChange,
  readOnly = false,
  inherited,
  roleLabels,
  labels,
  className,
}: FxPermissionMatrixProps) {
  const l = { ...DEFAULT_PERMISSION_MATRIX_LABELS, ...labels };
  const groups = useMemo(() => groupRows(permissions), [permissions]);
  const roleName = (role: UserRole): string => roleLabels?.[role] ?? role;

  const rootClass = ['fx-permission-matrix', className].filter(Boolean).join(' ');
  const colCount = roles.length + 1;

  return (
    <div className={rootClass} data-readonly={readOnly || undefined}>
      <table className="fx-permission-matrix-table">
        <caption className="fx-permission-matrix-caption">{l.caption}</caption>
        <thead>
          <tr>
            <th scope="col" className="fx-permission-matrix-corner">
              {l.capability}
            </th>
            {roles.map((role) => (
              <th key={role} scope="col" className="fx-permission-matrix-role">
                <FxRoleBadge role={role} size="sm" labels={roleLabels} />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {groups.map(({ group, rows }) => (
            <Fragment key={group}>
              <tr className="fx-permission-matrix-group-row">
                <th scope="colgroup" colSpan={colCount} className="fx-permission-matrix-group">
                  {group}
                </th>
              </tr>
              {rows.map((perm) => {
                const granted = value[perm.id] ?? [];
                return (
                  <tr key={perm.id} className="fx-permission-matrix-row">
                    <th scope="row" className="fx-permission-matrix-cap">
                      <span className="fx-permission-matrix-cap-label">{perm.label}</span>
                      {perm.description && (
                        <span className="fx-permission-matrix-cap-desc">{perm.description}</span>
                      )}
                    </th>
                    {roles.map((role) => {
                      const isGranted = granted.includes(role);
                      const isInherited = inherited?.(perm.id, role) ?? false;
                      const cellLabel = l.cellLabel
                        .replace('{permission}', perm.label)
                        .replace('{role}', roleName(role));
                      return (
                        <td
                          key={role}
                          className="fx-permission-matrix-cell"
                          data-granted={isGranted || undefined}
                          data-inherited={isInherited || undefined}
                        >
                          {isInherited ? (
                            <FxTooltip content={l.inherited}>
                              <span
                                className="fx-permission-matrix-inherited"
                                tabIndex={0}
                                role="img"
                                aria-label={`${cellLabel} — ${l.inherited}`}
                              >
                                <FxIcon name="inherit" size={16} />
                              </span>
                            </FxTooltip>
                          ) : readOnly ? (
                            <span
                              className="fx-permission-matrix-icon"
                              role="img"
                              aria-label={`${cellLabel}: ${isGranted ? l.granted : l.notGranted}`}
                            >
                              <FxIcon name={isGranted ? 'check' : 'minus'} size={16} />
                            </span>
                          ) : (
                            <FxCheckbox
                              checked={isGranted}
                              aria-label={cellLabel}
                              onChange={(checked) => onChange?.(perm.id, role, checked)}
                            />
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}
