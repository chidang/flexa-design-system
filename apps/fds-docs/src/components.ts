/**
 * Components section data — derived at build time from the SAME registry
 * flexa-ui exports (`FLEXA_UI_COMPONENTS`), never copied. The kitchen-sink
 * workbench and this docs section share one source of truth (doc 13 §5): a
 * component appears here the moment it registers its showcase spec.
 *
 * Prose (tagline / when-to-use) is the only hand-authored per-component artifact,
 * loaded from `content/components/<slug>.json` behind the same CMS-swappable seam
 * as the rest of the site. Deep contract lives in the markdown SSOT and is
 * linked, not ported.
 */
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  FLEXA_UI_COMPONENTS,
  UI_CATEGORIES,
  componentsByCategory,
  findComponent,
  allSlugs,
  type ShowcaseSpec,
  type UiCategory,
} from 'flexa-ui-kit';
import type { Block } from './content';

export type { ShowcaseSpec, UiCategory };
export { FLEXA_UI_COMPONENTS, UI_CATEGORIES };

/** Hand-authored prose for a component (all fields optional except slug). */
export interface ComponentProse {
  slug: string;
  tagline?: string;
  whenToUse?: string;
  blocks?: Block[];
}

const PROSE_DIR = join(process.cwd(), 'content', 'components');

export function loadProse(slug: string): ComponentProse | undefined {
  const file = join(PROSE_DIR, `${slug}.json`);
  if (!existsSync(file)) return undefined;
  return JSON.parse(readFileSync(file, 'utf8')) as ComponentProse;
}

/** Every component slug — feeds `generateStaticParams`. */
export function componentSlugs(): string[] {
  return allSlugs();
}

/** One component spec by slug. */
export function getComponent(slug: string): ShowcaseSpec | undefined {
  return findComponent(slug);
}

/** Components grouped by category (empties dropped), for the index page. */
export function groupedComponents(): { category: UiCategory; items: ShowcaseSpec[] }[] {
  return componentsByCategory();
}

/** The effective one-liner: authored prose wins, spec tagline is the fallback. */
export function taglineFor(spec: ShowcaseSpec): string | undefined {
  return loadProse(spec.slug)?.tagline ?? spec.tagline;
}

// ── Deep-link into the markdown SSOT ────────────────────────────────────────
// Links point at the PUBLIC repo (the builder monorepo is private — a private
// URL would 404 for every docs visitor); `ui-kit/` is synced there with the
// packages.
const SSOT_REPO_BASE = 'https://github.com/chidang/flexa-design-system/blob/main/ui-kit';
// The bible docs live one level above this app in either repo. Present at
// author time → we compute the exact GitHub heading anchor; absent → we link
// the file without a fragment.
const UIKIT_DIR = join(process.cwd(), '..', '..', 'ui-kit');

/**
 * GitHub's heading-slug algorithm: lowercase, drop punctuation (keeping spaces
 * and hyphens), then replace EACH space with a hyphen (no collapsing — removed
 * punctuation between words leaves a double space → a double hyphen, exactly as
 * GitHub renders it, e.g. `2.1 FxButton — Button` → `21-fxbutton--button`).
 */
function githubSlug(headingText: string): string {
  return headingText
    .toLowerCase()
    .replace(/[^a-z0-9 -]/g, '')
    .trim()
    .replace(/ /g, '-');
}

/** The "full contract →" URL for a component, or undefined if it has no ref. */
export function contractUrl(spec: ShowcaseSpec): string | undefined {
  if (!spec.contract) return undefined;
  const { doc, heading } = spec.contract;
  const base = `${SSOT_REPO_BASE}/${doc}`;
  const file = join(UIKIT_DIR, doc);
  if (existsSync(file)) {
    const line = readFileSync(file, 'utf8')
      .split('\n')
      .find((l) => /^#{1,6}\s/.test(l) && l.includes(heading));
    if (line) return `${base}#${githubSlug(line.replace(/^#{1,6}\s+/, ''))}`;
  }
  return base;
}
