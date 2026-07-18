/**
 * Conditional control visibility (`ControlDef.when`) — Flatsome-style. Pure so the
 * show/hide rules are testable apart from the editor DOM. EDITOR-ONLY metadata:
 * never read by the frozen engines or the PHP adapter — a hidden control's value
 * is still stored and still renders.
 *
 * A control shows when its `when` condition passes against SIBLING settings'
 * EFFECTIVE values (`settings[key] ?? schema[key].default`), which the caller
 * assembles and passes in as `values`.
 */

import type { Json, WhenClause, WhenCondition } from './types.js';

/** Operator keys of an object clause — the closed vocabulary the gate enforces. */
export const WHEN_OPERATORS = ['eq', 'ne', 'in', 'nin', 'gt', 'gte', 'lt', 'lte', 'truthy'] as const;
type WhenOperator = (typeof WHEN_OPERATORS)[number];
const OPERATOR_SET: ReadonlySet<string> = new Set(WHEN_OPERATORS);

/** Structural equality for JSON values (primitives, arrays, plain objects). */
function jsonEq(a: Json | undefined, b: Json | undefined): boolean {
  if (a === b) return true;
  if (a === null || b === null || typeof a !== 'object' || typeof b !== 'object') return false;
  if (Array.isArray(a) || Array.isArray(b)) {
    if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) return false;
    return a.every((v, i) => jsonEq(v as Json, b[i] as Json));
  }
  const ao = a as Record<string, Json>;
  const bo = b as Record<string, Json>;
  const ak = Object.keys(ao);
  const bk = Object.keys(bo);
  if (ak.length !== bk.length) return false;
  return ak.every((k) => k in bo && jsonEq(ao[k], bo[k]));
}

/** True when `clause` is an operator-clause object (non-null, non-array object). */
function isOperatorClause(clause: WhenClause): clause is Record<WhenOperator, Json> {
  return typeof clause === 'object' && clause !== null && !Array.isArray(clause);
}

/** Evaluate ONE clause against a sibling's effective value. */
function evalClause(clause: WhenClause, value: Json | undefined): boolean {
  if (Array.isArray(clause)) return clause.some((v) => jsonEq(value, v as Json));
  if (isOperatorClause(clause)) {
    const c = clause as {
      eq?: Json; ne?: Json; in?: Json[]; nin?: Json[];
      gt?: number; gte?: number; lt?: number; lte?: number; truthy?: boolean;
    };
    if ('eq' in c && !jsonEq(value, c.eq)) return false;
    if ('ne' in c && jsonEq(value, c.ne)) return false;
    if ('in' in c && !(c.in ?? []).some((v) => jsonEq(value, v as Json))) return false;
    if ('nin' in c && (c.nin ?? []).some((v) => jsonEq(value, v as Json))) return false;
    if ('gt' in c && !(typeof value === 'number' && value > (c.gt as number))) return false;
    if ('gte' in c && !(typeof value === 'number' && value >= (c.gte as number))) return false;
    if ('lt' in c && !(typeof value === 'number' && value < (c.lt as number))) return false;
    if ('lte' in c && !(typeof value === 'number' && value <= (c.lte as number))) return false;
    if ('truthy' in c && Boolean(value) !== Boolean(c.truthy)) return false;
    return true;
  }
  return jsonEq(value, clause as Json); // scalar → eq
}

/**
 * Evaluate a whole condition. `undefined` → always visible. Every key ANDs:
 * `any` is an OR-group over sub-conditions; any other key tests that sibling.
 */
export function evalWhen(
  cond: WhenCondition | undefined,
  values: Record<string, Json | undefined>,
): boolean {
  if (!cond) return true;
  for (const [key, clause] of Object.entries(cond)) {
    if (clause === undefined) continue;
    if (key === 'any') {
      const group = clause as WhenCondition[];
      if (!group.some((sub) => evalWhen(sub, values))) return false;
      continue;
    }
    if (!evalClause(clause as WhenClause, values[key])) return false;
  }
  return true;
}

/**
 * Every sibling setting name a condition references (recursing into `any`).
 * Used by `validateManifest` to reject `when` pointing at a non-existent setting.
 */
export function whenRefs(cond: WhenCondition | undefined): string[] {
  if (!cond) return [];
  const refs: string[] = [];
  for (const [key, clause] of Object.entries(cond)) {
    if (clause === undefined) continue;
    if (key === 'any') {
      for (const sub of clause as WhenCondition[]) refs.push(...whenRefs(sub));
    } else {
      refs.push(key);
    }
  }
  return refs;
}

/**
 * Operator keys used in a condition that are NOT in the closed vocabulary
 * (typo catcher, e.g. `gth` for `gt`). Recurses into `any` groups.
 */
export function unknownWhenOperators(cond: WhenCondition | undefined): string[] {
  if (!cond) return [];
  const bad: string[] = [];
  for (const [key, clause] of Object.entries(cond)) {
    if (clause === undefined) continue;
    if (key === 'any') {
      for (const sub of clause as WhenCondition[]) bad.push(...unknownWhenOperators(sub));
    } else if (isOperatorClause(clause as WhenClause)) {
      for (const op of Object.keys(clause as object)) {
        if (!OPERATOR_SET.has(op)) bad.push(op);
      }
    }
  }
  return bad;
}
