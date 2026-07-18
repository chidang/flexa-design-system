/**
 * Site catalog data — the curated `SITE_SECTIONS` presets (doc 14 §4, doc 17
 * HF2). Split from `siteCatalog.ts` so the contract (types, slot walker,
 * vocabularies) stays a short readable module and this file is pure authored
 * data: intent + slot contract + one token-first node tree per preset.
 *
 * Authoring rules live on the contract types; the drift-locks live in
 * `tests/siteCatalog.spec.ts` (order, roles, slot two-way match) and
 * `element-pack-demo/tests/site-catalog.spec.ts` (types/keys/options exist).
 * NOT a frozen engine. Trees are shared module constants — treat them as
 * immutable (the composer clones before filling).
 *
 * This module is a barrel: the presets live in ./sections/{generic,industry,
 * headers,footers}.ts and the authoring helpers in ./sections/shared.ts. The
 * @flexa/core surface is unchanged — SITE_SECTIONS is re-exported here in the
 * same contract order.
 */

import type { SectionPreset } from './siteCatalog.js';
import { genericSections } from './sections/generic.js';
import { industrySections } from './sections/industry.js';
import { headerSections } from './sections/headers.js';
import { footerSections } from './sections/footers.js';

/**
 * The curated catalog: 20 approved sections of v1 (14-site-generation.md §4)
 * + shop-grid (W7) + site chrome — 5 headers / 6 footers (W8 + doc 17 HF2).
 * Order is part of the contract: generic building blocks first, chrome last
 * (headers before footers, the default of each role first).
 */
export const SITE_SECTIONS: readonly SectionPreset[] = [
  ...genericSections,
  ...industrySections,
  ...headerSections,
  ...footerSections,
];
