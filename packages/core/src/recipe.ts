/**
 * Variant recipe engine (FDS §6.1, spec 07 · Phase 5.5 Slice 5) — a PIPELINE
 * layer, NOT a frozen engine. Merges a component's declarative recipe fragments
 * (`base` + the fragment for each chosen variant option + matching compound
 * variants) into one StyleSpec, which the render pipeline then runs through
 * `resolveStyleTokens` + the frozen CSS compiler (QĐ-0). All data → engine
 * frozen. The PHP mirror (`Recipe::toSpec`) reproduces this exactly, locked by
 * the `recipe` parity fixtures (06).
 */

import type { Json, Recipe, Settings, StyleSpec } from './types.js';

function isPlainObject(v: unknown): v is Record<string, Json> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

/**
 * Deep-merge `source` into `target`, mutating `target` (which is always a fresh
 * accumulator — never a shared recipe object). Two plain objects merge key-by-key
 * (so nested `@hover`/`@responsive` blocks combine); anything else replaces, with
 * `source` winning. Insertion order is preserved (existing keys keep their slot,
 * new keys append) — the same object semantics PHP's stdClass gives, so output is
 * declaration-order-identical across runtimes.
 */
function mergeInto(target: Record<string, Json>, source: Record<string, Json>): void {
  for (const [key, sv] of Object.entries(source)) {
    if (isPlainObject(sv)) {
      const tv = target[key];
      const dst = isPlainObject(tv) ? tv : (target[key] = {});
      mergeInto(dst, sv);
    } else {
      target[key] = sv;
    }
  }
}

/**
 * Resolve the recipe for a node's settings into a single StyleSpec, or null when
 * nothing would be emitted. The chosen option for each dimension is the setting
 * value when it names a known option, else the recipe's default for that
 * dimension. Fragments apply in a deterministic order — base, then each variant
 * dimension in declaration order, then compound variants in array order — so the
 * result is parity-stable.
 */
export function recipeToSpec(recipe: Recipe, settings: Settings): StyleSpec | null {
  const variants = recipe.variants ?? {};
  const defaults = recipe.default ?? {};

  // Which option is active per dimension (only dimensions that resolve to a real
  // option participate — an unknown value with no default drops out entirely).
  const chosen: Record<string, string> = {};
  for (const dim of Object.keys(variants)) {
    const options = variants[dim];
    const raw = settings[dim];
    const key = raw === null || raw === undefined ? undefined : String(raw);
    const sel =
      key !== undefined && Object.prototype.hasOwnProperty.call(options, key)
        ? key
        : defaults[dim];
    if (sel !== undefined && Object.prototype.hasOwnProperty.call(options, sel)) {
      chosen[dim] = sel;
    }
  }

  const result: Record<string, Json> = {};
  if (recipe.base) mergeInto(result, recipe.base);
  for (const dim of Object.keys(variants)) {
    const sel = chosen[dim];
    const frag = sel !== undefined ? variants[dim]?.[sel] : undefined;
    if (frag) mergeInto(result, frag);
  }
  for (const rule of recipe.compound ?? []) {
    let match = true;
    for (const [dim, opt] of Object.entries(rule.when)) {
      if (chosen[dim] !== opt) {
        match = false;
        break;
      }
    }
    if (match && rule.style) mergeInto(result, rule.style);
  }

  return Object.keys(result).length ? (result as StyleSpec) : null;
}
