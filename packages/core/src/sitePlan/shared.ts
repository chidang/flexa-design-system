/**
 * SitePlan shared vocabulary — plan format consts, the plan interfaces (the AI
 * output surface, SG-1), and the small internals every concern reuses (the
 * preset lookup, the blank test, the path grammar). Split out of sitePlan.ts so
 * schema / migrate / normalize / compose can each import just this.
 *
 * NOT a frozen engine. Pure data. See ./compose.ts for the composeSite pipeline.
 */

import { SITE_SECTIONS } from '../siteSections.js';
import type { SectionPreset } from '../siteCatalog.js';
import type { Brand, PackRef } from '../design.js';

/**
 * The plan-FORMAT version this build speaks — mirror of `DESIGN_STATE_VERSION`.
 * A plan with no `schemaVersion` is treated as 1. Bump when a plan migration is
 * added below.
 */
export const SITE_PLAN_VERSION = 1;

/**
 * The URL a composed `AssetRef` carries when the plan declared an image only as
 * an un-sourced `asset:<id>` placeholder (SG-5 — v1 plans have no stock photos).
 * A host importer treats any `placeholder:` URL as "use the bundled neutral
 * placeholder image" instead of fetching (doc 14 §5 W4).
 */
export const PLACEHOLDER_ASSET_URL = 'placeholder://auto';

/**
 * One entry of an `items` slot — item-slot name → value. A scalar slot carries a
 * string; a `kind: 'list'` item slot (doc 14 §4b lift — a pricing tier's feature
 * bullets, a plan's included services) carries a `string[]`, expanded by the
 * carrier element's repeater one entry per string.
 */
export interface PlanItem {
  readonly [slot: string]: string | readonly string[];
}

/** One section of a page: a catalog preset by id + its slot fills. */
export interface PlanSection {
  /** A `SectionPreset.id` from `SITE_SECTIONS` (e.g. `'hero-split'`). */
  readonly preset: string;
  /** Text/url/items slot fills (image-kind slots go in `images`). */
  readonly copy?: Readonly<Record<string, string | readonly PlanItem[]>>;
  /** Image-kind slot fills: `asset:<id>` refs (declared for the host) or real URLs. */
  readonly images?: Readonly<Record<string, string>>;
}

export interface PlanPage {
  readonly title: string;
  /** Request path; `'/'` becomes `routing.home`, everything else `routing.pages`. */
  readonly path: string;
  readonly sections: readonly PlanSection[];
  /** Per-page chrome override (W8): a different header for THIS page (inline,
   *  not shared), or `null` for no header here. Absent = the site-wide chrome. */
  readonly header?: PlanSection | null;
  readonly footer?: PlanSection | null;
}

/** Site-wide chrome (doc 14 §4b W8) — the global header/footer every page gets
 *  by default. Materialized by `composeSite` as SHARED block documents
 *  (`chrome-header`/`chrome-footer`) referenced from each page, so editing the
 *  header once changes the whole site. */
export interface PlanChrome {
  readonly header?: PlanSection;
  readonly footer?: PlanSection;
}

/** The whole-site plan — the single AI output surface of Site Generation (SG-1). */
export interface SitePlan {
  /** Self-describing plan format version. Absent = `SITE_PLAN_VERSION`. */
  readonly schemaVersion?: number;
  /** Business/site name → `project.name` (and the project id, slugified). */
  readonly name: string;
  /** Level-2 design choices — the S7 vocabulary reused verbatim. */
  readonly brand?: Brand;
  /** Starter design pack to seed the theme from (S5) — resolved via `designPacks`. */
  readonly packRef?: PackRef;
  /** Site-wide header/footer (W8); sections here must be chrome-role presets. */
  readonly chrome?: PlanChrome;
  readonly pages: readonly PlanPage[];
}

export type PresetRole = 'section' | 'header' | 'footer';

export const PRESET_BY_ID: ReadonlyMap<string, SectionPreset> = new Map(
  SITE_SECTIONS.map((s) => [s.id, s]),
);

export const blank = (v: string): boolean => v.trim() === '';

/** Page-path grammar — exported so the AI outline gate (doc 14 W3) checks the
 *  SAME rule the plan schema enforces instead of drifting a copy. */
export const PLAN_PATH_RE = /^\/(?:[a-z0-9-]+(?:\/[a-z0-9-]+)*)?$/;
export const PATH_RE = PLAN_PATH_RE;
