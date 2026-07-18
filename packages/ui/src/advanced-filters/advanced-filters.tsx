'use client';
/**
 * FxAdvancedFilters — structured query building (doc 04 §3.9 "FxAdvancedFilters
 * — Advanced Filters").
 *
 * A trigger Button + active-filter Chips render statically; a builder popover
 * (mounted client-side only, per rule 4) stages field/operator/value rows behind
 * an explicit Apply. AND across conditions is the only v1 combinator and is
 * stated inline. `onFilterChange` fires only on Apply / Clear — never per
 * keystroke. Chips are human-readable ("Status: is Active"); dismissing a chip
 * removes that condition and re-fires the applied set. Every string is a prop.
 */
import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { FxButton } from '../button/button';
import { FxChip } from '../chip/chip';
import { FxSelect } from '../select/select';
import { FxInput } from '../input/input';
import { FxIcon } from '../icon/FxIcon';

/** Comparison operators — serialize to doc 09 list-endpoint query params. */
export type FilterOperator =
  | 'eq'
  | 'neq'
  | 'contains'
  | 'gt'
  | 'gte'
  | 'lt'
  | 'lte'
  | 'between'
  | 'in'
  | 'is_empty'
  | 'not_empty';

/** A filterable field drawn from the collection schema (doc 09). */
export interface FilterField {
  key: string;
  label: string;
  type: 'text' | 'number' | 'money' | 'select' | 'multiselect' | 'date' | 'daterange' | 'boolean';
  /** Enum options for `select` / `multiselect`. */
  options?: { value: string; label: string }[];
  /** Allowed operators; defaults derive from `type` when omitted. */
  operators?: FilterOperator[];
}

/** One applied condition. */
export interface FilterValue {
  field: string;
  operator: FilterOperator;
  value: unknown;
}

/** Baked-in strings — every one a prop (§i18n). */
export interface AdvancedFiltersLabels {
  trigger: string;
  title: string;
  andNote: string;
  addCondition: string;
  clearAll: string;
  apply: string;
  fieldPlaceholder: string;
  operatorPlaceholder: string;
  valuePlaceholder: string;
  removeRow: string;
  /** `{field}` `{operator}` `{value}` substituted for chip removal names. */
  removeChip: string;
  booleanTrue: string;
  booleanFalse: string;
  /** Operator display words, keyed by FilterOperator. */
  operators: Record<FilterOperator, string>;
}

export const DEFAULT_ADVANCED_FILTERS_LABELS: AdvancedFiltersLabels = {
  trigger: 'Filter',
  title: 'Filters',
  andNote: 'Matches ALL of the following',
  addCondition: 'Add condition',
  clearAll: 'Clear all',
  apply: 'Apply',
  fieldPlaceholder: 'Field',
  operatorPlaceholder: 'Operator',
  valuePlaceholder: 'Value',
  removeRow: 'Remove condition',
  removeChip: 'Remove filter {field} {operator} {value}',
  booleanTrue: 'Yes',
  booleanFalse: 'No',
  operators: {
    eq: 'is',
    neq: 'is not',
    contains: 'contains',
    gt: 'greater than',
    gte: 'at least',
    lt: 'less than',
    lte: 'at most',
    between: 'between',
    in: 'is any of',
    is_empty: 'is empty',
    not_empty: 'is not empty',
  },
};

export interface FxAdvancedFiltersProps {
  /** Field & operator catalog from the collection schema (never hardcoded). */
  fields: FilterField[];
  /** Controlled applied conditions (§1.5). */
  value?: FilterValue[];
  /** Uncontrolled initial applied conditions. */
  defaultValue?: FilterValue[];
  /** Fires on Apply / Clear with the committed set. */
  onFilterChange?: (filters: FilterValue[]) => void;
  /** Maximum builder rows. Defaults to 5. */
  maxRows?: number;
  /** Baked-in strings. Merged over the English defaults. */
  labels?: Partial<AdvancedFiltersLabels>;
  className?: string;
}

/** Operators a field type exposes when it doesn't declare its own. */
const OPERATORS_BY_TYPE: Record<FilterField['type'], FilterOperator[]> = {
  text: ['contains', 'eq', 'neq', 'is_empty', 'not_empty'],
  number: ['eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'between'],
  money: ['eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'between'],
  select: ['eq', 'neq'],
  multiselect: ['in'],
  date: ['eq', 'gt', 'lt', 'between'],
  daterange: ['between'],
  boolean: ['eq'],
};

/** Operators with no value control (unary predicates). */
const UNARY_OPERATORS: ReadonlySet<FilterOperator> = new Set(['is_empty', 'not_empty']);

function operatorsFor(field: FilterField): FilterOperator[] {
  return field.operators && field.operators.length > 0 ? field.operators : OPERATORS_BY_TYPE[field.type];
}

/** A single builder row (draft, before Apply). */
interface DraftRow {
  id: string;
  field: string | null;
  operator: FilterOperator | null;
  value: unknown;
}

let rowSeq = 0;
const nextRowId = () => `afr-${(rowSeq += 1)}`;

function toDraft(filters: FilterValue[]): DraftRow[] {
  return filters.map((f) => ({ id: nextRowId(), field: f.field, operator: f.operator, value: f.value }));
}

/** Format a stored value for a human-readable chip. */
function formatValue(field: FilterField | undefined, v: unknown, l: AdvancedFiltersLabels): string {
  if (v === null || v === undefined || v === '') return '—';
  if (typeof v === 'boolean') return v ? l.booleanTrue : l.booleanFalse;
  if (Array.isArray(v)) {
    return v
      .map((one) => field?.options?.find((o) => o.value === one)?.label ?? String(one))
      .join(', ');
  }
  const opt = field?.options?.find((o) => o.value === v);
  return opt ? opt.label : String(v);
}

/** Whole chip label: "Status: is Active". */
function chipLabel(f: FilterValue, fields: FilterField[], l: AdvancedFiltersLabels): string {
  const field = fields.find((x) => x.key === f.field);
  const fieldLabel = field?.label ?? f.field;
  const opWord = l.operators[f.operator];
  if (UNARY_OPERATORS.has(f.operator)) return `${fieldLabel}: ${opWord}`;
  return `${fieldLabel}: ${opWord} ${formatValue(field, f.value, l)}`;
}

export function FxAdvancedFilters({
  fields,
  value,
  defaultValue = [],
  onFilterChange,
  maxRows = 5,
  labels,
  className,
}: FxAdvancedFiltersProps) {
  const l = { ...DEFAULT_ADVANCED_FILTERS_LABELS, ...labels };
  const baseId = useId();
  const panelId = `${baseId}-panel`;

  const controlled = value !== undefined;
  const [internal, setInternal] = useState<FilterValue[]>(defaultValue);
  const applied = controlled ? value : internal;

  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const [rows, setRows] = useState<DraftRow[]>([]);
  const wrapRef = useRef<HTMLDivElement>(null);

  const fieldOptions = useMemo(
    () => fields.map((f) => ({ value: f.key, label: f.label })),
    [fields],
  );

  const openBuilder = () => {
    const seed = applied.length > 0 ? toDraft(applied) : [{ id: nextRowId(), field: null, operator: null, value: undefined as unknown }];
    setRows(seed);
    setOpen(true);
  };

  const closeBuilder = () => setOpen(false);

  // Outside-click / Esc discard staged edits with no query churn.
  useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', onPointer, true);
    return () => document.removeEventListener('pointerdown', onPointer, true);
  }, [open]);

  const commit = (next: FilterValue[]) => {
    if (!controlled) setInternal(next);
    onFilterChange?.(next);
  };

  const patchRow = (id: string, patch: Partial<DraftRow>) =>
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, ...patch } : r)));

  const setRowField = (id: string, key: string | null) => {
    const field = fields.find((f) => f.key === key);
    const ops = field ? operatorsFor(field) : [];
    patchRow(id, { field: key, operator: ops[0] ?? null, value: field?.type === 'multiselect' ? [] : undefined });
  };

  const addRow = () =>
    setRows((rs) => (rs.length >= maxRows ? rs : [...rs, { id: nextRowId(), field: null, operator: null, value: undefined }]));

  const removeRow = (id: string) => setRows((rs) => rs.filter((r) => r.id !== id));

  const applyRows = () => {
    const next: FilterValue[] = rows
      .filter((r): r is DraftRow & { field: string; operator: FilterOperator } => r.field != null && r.operator != null)
      .filter((r) => UNARY_OPERATORS.has(r.operator) || (r.value !== undefined && r.value !== '' && !(Array.isArray(r.value) && r.value.length === 0)))
      .map((r) => ({ field: r.field, operator: r.operator, value: UNARY_OPERATORS.has(r.operator) ? null : r.value }));
    commit(next);
    closeBuilder();
  };

  const clearAll = () => {
    setRows([{ id: nextRowId(), field: null, operator: null, value: undefined }]);
    commit([]);
    closeBuilder();
  };

  const removeChip = (index: number) => {
    const next = applied.filter((_, i) => i !== index);
    commit(next);
  };

  const rootClass = ['fx-advanced-filters', className].filter(Boolean).join(' ');
  const panelAvailable = mounted && open;

  return (
    <div className={rootClass} ref={wrapRef}>
      <div className="fx-advanced-filters-bar">
        <FxButton
          variant="secondary"
          size="sm"
          iconStart={<FxIcon name="filter" size={16} />}
          aria-haspopup="dialog"
          aria-expanded={open}
          aria-controls={panelAvailable ? panelId : undefined}
          onClick={() => (open ? closeBuilder() : openBuilder())}
        >
          {l.trigger}
          {applied.length > 0 && <span className="fx-advanced-filters-count">{applied.length}</span>}
        </FxButton>

        {applied.length > 0 && (
          <ul className="fx-advanced-filters-chips">
            {applied.map((f, i) => {
              const field = fields.find((x) => x.key === f.field);
              const label = chipLabel(f, fields, l);
              const removeText = l.removeChip
                .replace('{field}', field?.label ?? f.field)
                .replace('{operator}', l.operators[f.operator])
                .replace('{value}', formatValue(field, f.value, l));
              return (
                <li className="fx-advanced-filters-chip" key={`${f.field}-${i}`}>
                  <FxChip
                    label={label}
                    dismissible
                    size="sm"
                    removeLabel={removeText}
                    onClick={openBuilder}
                    onDismiss={() => removeChip(i)}
                  />
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {panelAvailable && (
        <div
          className="fx-advanced-filters-popover"
          id={panelId}
          role="dialog"
          aria-label={l.title}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              e.stopPropagation();
              closeBuilder();
            }
          }}
        >
          <div className="fx-advanced-filters-head">
            <h2 className="fx-advanced-filters-heading">{l.title}</h2>
            <p className="fx-advanced-filters-and">{l.andNote}</p>
          </div>

          <div className="fx-advanced-filters-rows">
            {rows.map((row) => {
              const field = fields.find((f) => f.key === row.field);
              const ops = field ? operatorsFor(field) : [];
              const unary = row.operator != null && UNARY_OPERATORS.has(row.operator);
              return (
                <div className="fx-advanced-filters-row" key={row.id}>
                  <FxSelect
                    className="fx-advanced-filters-field"
                    options={fieldOptions}
                    value={row.field}
                    placeholder={l.fieldPlaceholder}
                    aria-label={l.fieldPlaceholder}
                    onChange={(v) => setRowField(row.id, v)}
                  />
                  <FxSelect
                    className="fx-advanced-filters-op"
                    options={ops.map((o) => ({ value: o, label: l.operators[o] }))}
                    value={row.operator}
                    placeholder={l.operatorPlaceholder}
                    aria-label={l.operatorPlaceholder}
                    disabled={!field}
                    onChange={(v) => patchRow(row.id, { operator: (v as FilterOperator) ?? null })}
                  />
                  <div className="fx-advanced-filters-value">
                    {field && !unary && renderValueControl(field, row, patchRow, l)}
                  </div>
                  <button
                    type="button"
                    className="fx-advanced-filters-remove"
                    aria-label={l.removeRow}
                    onClick={() => removeRow(row.id)}
                  >
                    <FxIcon name="close" size={16} />
                  </button>
                </div>
              );
            })}
          </div>

          <div className="fx-advanced-filters-add">
            <button
              type="button"
              className="fx-advanced-filters-add-btn"
              onClick={addRow}
              disabled={rows.length >= maxRows}
            >
              <FxIcon name="plus" size={16} />
              <span>{l.addCondition}</span>
            </button>
          </div>

          <div className="fx-advanced-filters-footer">
            <FxButton variant="ghost" size="sm" onClick={clearAll}>
              {l.clearAll}
            </FxButton>
            <FxButton variant="primary" size="sm" onClick={applyRows}>
              {l.apply}
            </FxButton>
          </div>
        </div>
      )}
    </div>
  );
}

/** Per-type value control. Kept pragmatic: text/number/money → Input, enums →
 *  Select, boolean → Select, multiselect → repeated choice Select (single pick
 *  appended). Between shows two number inputs. */
function renderValueControl(
  field: FilterField,
  row: DraftRow,
  patchRow: (id: string, patch: Partial<DraftRow>) => void,
  l: AdvancedFiltersLabels,
) {
  const set = (v: unknown) => patchRow(row.id, { value: v });

  if (field.type === 'select' || field.type === 'multiselect') {
    const opts = (field.options ?? []).map((o) => ({ value: o.value, label: o.label }));
    if (field.type === 'multiselect') {
      const arr = Array.isArray(row.value) ? (row.value as string[]) : [];
      return (
        <FxSelect
          options={opts}
          value={arr[arr.length - 1] ?? null}
          placeholder={l.valuePlaceholder}
          aria-label={l.valuePlaceholder}
          onChange={(v) => set(v == null ? [] : Array.from(new Set([...arr, v])))}
        />
      );
    }
    return (
      <FxSelect
        options={opts}
        value={typeof row.value === 'string' ? row.value : null}
        placeholder={l.valuePlaceholder}
        aria-label={l.valuePlaceholder}
        onChange={(v) => set(v)}
      />
    );
  }

  if (field.type === 'boolean') {
    return (
      <FxSelect
        options={[
          { value: 'true', label: l.booleanTrue },
          { value: 'false', label: l.booleanFalse },
        ]}
        value={row.value === true ? 'true' : row.value === false ? 'false' : null}
        placeholder={l.valuePlaceholder}
        aria-label={l.valuePlaceholder}
        onChange={(v) => set(v === 'true' ? true : v === 'false' ? false : undefined)}
      />
    );
  }

  const between = row.operator === 'between';
  const isNumeric = field.type === 'number' || field.type === 'money';

  if (between) {
    const pair = Array.isArray(row.value) ? (row.value as unknown[]) : [];
    return (
      <div className="fx-advanced-filters-between">
        <FxInput
          size="sm"
          value={pair[0] != null ? String(pair[0]) : ''}
          aria-label={`${field.label} from`}
          inputMode={isNumeric ? 'decimal' : undefined}
          onChange={(v) => set([v, pair[1] ?? ''])}
        />
        <span className="fx-advanced-filters-dash" aria-hidden="true">
          –
        </span>
        <FxInput
          size="sm"
          value={pair[1] != null ? String(pair[1]) : ''}
          aria-label={`${field.label} to`}
          inputMode={isNumeric ? 'decimal' : undefined}
          onChange={(v) => set([pair[0] ?? '', v])}
        />
      </div>
    );
  }

  return (
    <FxInput
      size="sm"
      value={typeof row.value === 'string' ? row.value : row.value != null ? String(row.value) : ''}
      placeholder={l.valuePlaceholder}
      aria-label={`${field.label} ${l.valuePlaceholder}`}
      inputMode={isNumeric ? 'decimal' : undefined}
      onChange={(v) => set(v)}
    />
  );
}
