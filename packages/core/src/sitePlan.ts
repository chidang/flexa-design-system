/**
 * SitePlan + composeSite — Site Generation W2 (14-site-generation.md §3).
 *
 * `SitePlan` is the ONLY surface an AI (or a human, or a script) fills to get a
 * whole website (SG-1): pages picked from the curated section catalog by INTENT,
 * copy written into the DECLARED slots, images as `asset:<id>` refs or real URLs,
 * plus the S7/S5 design vocabulary (`brand` / `packRef`) — no node trees anywhere.
 *
 * `composeSite` is the pure, deterministic derivation (SG-2): it expands each
 * plan section from `SITE_SECTIONS`, fills the slot placeholders, and hands back
 * a `FlexaProject` that has ALREADY passed the existing one-door `validateProject`
 * gate (SG-3 — composing an invalid project is a composer bug, not a caller
 * problem). Id generation is injectable; there is no randomness and no I/O.
 * The Builder never depends on AI: a hand-written plan composes the same site.
 *
 * NOT a frozen engine. Pure data + pure functions, mirror of the Design Packs
 * seam (`Brand` → `applyBrand`): small data in, deterministic derivation out.
 *
 * This module is a barrel: the implementation lives in ./sitePlan/{shared,
 * schema,migrate,normalize,compose}.ts. The public @flexa/core surface is
 * unchanged — every name below was exported from here before the split.
 */

export {
  SITE_PLAN_VERSION,
  PLACEHOLDER_ASSET_URL,
  PLAN_PATH_RE,
  type PlanItem,
  type PlanSection,
  type PlanPage,
  type PlanChrome,
  type SitePlan,
  type PresetRole,
} from './sitePlan/shared.js';
export { planSectionSchemaFor, sitePlanSchema } from './sitePlan/schema.js';
export {
  runSitePlanMigrations,
  migrateSitePlan,
  type SitePlanMigration,
} from './sitePlan/migrate.js';
export {
  pruneUnknownSlots,
  stripChrome,
  type PruneUnknownSlotsResult,
  type StripChromeResult,
} from './sitePlan/normalize.js';
export {
  composeSite,
  composeSection,
  type ComposeSiteOptions,
  type ComposeSiteResult,
  type ComposeSectionOptions,
  type ComposeSectionResult,
} from './sitePlan/compose.js';
