/**
 * Site catalog — the curated section presets Site Generation composes pages
 * from (14-site-generation.md §4; model: designCatalog.ts, doc 13 S6).
 *
 * Each preset maps an INTENT ('hero-split', 'faq', 'pricing-tiers'…) onto ONE
 * curated node tree built exclusively from the standard `flexa/*` elements,
 * token-first (no literal colors beyond the deliberate list). AI never sees or
 * writes node trees — it picks presets by intent and fills the DECLARED slots
 * (SG-1); `composeSite` (W2) expands the tree deterministically.
 *
 * Slot-fill mechanism (mirror of the `asset:`/i18n declared-not-guessed seams):
 * - Scalar slot: a settings value in `tree` carries the placeholder
 *   `"slot:<name>"` → the composer swaps in the copy. The same ref may appear
 *   on several settings (e.g. an image `alt` reusing the `headline` slot).
 * - `items` slot: the tree contains EXACTLY ONE exemplar subtree whose settings
 *   carry `'data-slot-repeat': '<name>'` → the composer clones it per item and
 *   fills the item-slot placeholders inside, then drops the marker. For
 *   repeater-control settings (e.g. accordion items) the exemplar is one array
 *   entry carrying the same marker key.
 * - Unfilled optional slot: `whenEmpty` decides — `'prune'` (default) removes
 *   the node carrying the placeholder (mirror `sampleTree` degrade);
 *   `'default'` drops the setting so the manifest default applies.
 * - Images stay `asset:<id>` refs (seam A3); the composer only collects them
 *   into `project.assets`.
 *
 * NOT a frozen engine. Pure data + pure walkers; nothing here renders. This
 * module is the CONTRACT (types, slot walker, closed vocabularies); the
 * authored preset data lives in `siteSections.ts`.
 */

import type { PresetNode, Settings } from './types.js';

/** Prefix marking a settings value as a slot reference (mirror `asset:`). */
export const SLOT_PREFIX = 'slot:';

/** Settings key marking a subtree (or repeater entry) as an items exemplar. */
export const SLOT_REPEAT_KEY = 'data-slot-repeat';

/** `"slot:<name>"` → `<name>`; anything else → null. Whole-value match only. */
export function parseSlotRef(value: unknown): string | null {
  if (typeof value !== 'string' || !value.startsWith(SLOT_PREFIX)) return null;
  const name = value.slice(SLOT_PREFIX.length);
  return name === '' ? null : name;
}

/** One declared fill point of a section preset. */
export interface SectionSlot {
  readonly name: string;
  /**
   * - `text`/`longtext`/`url`: a scalar string.
   * - `image`: a scalar `asset:<id>` ref or real URL (lives under `images`).
   * - `items`: a repeated group — value is `PlanItem[]` (SECTION level only).
   * - `list`: a repeated STRING (doc 14 §4b lift) — value is `string[]`. Legal
   *   ONLY as an item slot (nested inside an `items` slot's `item`): a pricing
   *   tier's feature bullets, a plan's included services… The carrying element
   *   holds a repeater whose single exemplar entry is marked with this slot name;
   *   the composer expands it once per string. Never a section-level slot.
   */
  readonly kind: 'text' | 'longtext' | 'image' | 'url' | 'items' | 'list';
  readonly required?: boolean;
  /** Closed value vocabulary (e.g. icon names) — machine-readable constraint. */
  readonly options?: readonly string[];
  /** Unfilled optional slot: prune the carrying node (default) or drop the
   *  setting so the manifest default applies. */
  readonly whenEmpty?: 'prune' | 'default';
  /** kind 'items' only: */
  readonly min?: number;
  readonly max?: number;
  readonly item?: readonly SectionSlot[];
}

/** One curated section — intent + slot contract + the node tree behind it. */
export interface SectionPreset {
  readonly id: string;
  /** One English sentence telling the AI WHEN to use this section. */
  readonly intent: string;
  /**
   * Site chrome presets (doc 14 §4b W8): a `'header'`/`'footer'` preset is NOT
   * legal inside `pages[].sections` — it is picked in `SitePlan.chrome` (site-wide
   * default, materialized as a shared block document) or as a per-page override.
   * Absent = an ordinary section.
   */
  readonly role?: 'header' | 'footer';
  readonly slots: readonly SectionSlot[];
  readonly tree: PresetNode;
  /** Composer: reverse the exemplar clone's children on every ODD item (alternating rows). */
  readonly alternateItems?: boolean;
  /** Composer: keep the exemplar column's curated span instead of dividing 12 by
   *  the item count (`'divide'` is the default behavior). */
  readonly itemSpan?: 'divide' | 'fixed';
  /**
   * Element types that MUST exist in the host registry for this preset to be
   * available (doc 14 §4b, W7). CMS-neutral by construction: it names element
   * TYPES, never plugins or hosts — any host registering a pack that provides
   * these types (elements are pure data; providers are by-name) unlocks the
   * preset unchanged. Unavailable presets are hidden from
   * `capabilities().sections` (the AI never sees them) and rejected by
   * `composeSite` with a specific error. Types listed here are exempt from the
   * demo-pack drift-lock — the providing pack's own tests lock them instead.
   */
  readonly requires?: readonly string[];
}

/* ------------------------------------------------------------------------- *
 * Slot walker — shared by the W1 contract tests and the W2 composer.
 * ------------------------------------------------------------------------- */

/** Every slot reference found in a preset tree, split by repeat context. */
export interface SlotRefs {
  /** Scalar refs outside any exemplar (deduplicated, first-appearance order). */
  readonly scalars: readonly string[];
  /** One entry PER EXEMPLAR found (order of appearance) with the item refs inside. */
  readonly repeats: ReadonlyArray<{ readonly name: string; readonly refs: readonly string[] }>;
}

function refsInValue(value: unknown, sink: (name: string) => void): void {
  const ref = parseSlotRef(value);
  if (ref !== null) sink(ref);
}

/**
 * Walk a preset tree and collect every slot placeholder. Refs inside an
 * exemplar (subtree marked `data-slot-repeat`, or a marked repeater entry)
 * belong to that items slot; everything else is a scalar of the section.
 */
export function collectSlotRefs(tree: PresetNode): SlotRefs {
  const scalars: string[] = [];
  const repeats: Array<{ name: string; refs: string[] }> = [];

  /**
   * Walk a settings VALUE, sending scalar refs to `sink`. Arrays are repeater
   * settings: a marked entry is an exemplar. At the SECTION context (`ctx` null)
   * a marker opens a NEW repeat bucket; a marker already inside a repeat is a
   * nested exemplar (doc 14 §4b lift) — its name folds into the enclosing bucket
   * and its inner refs keep flowing there (a pricing tier's `features`, a table
   * row's `cells`). Fully recursive, so a list nested inside a repeater entry is
   * reached the same as one nested in a subtree.
   */
  const walkValue = (value: unknown, sink: (name: string) => void, ctx: string[] | null): void => {
    refsInValue(value, sink);
    if (!Array.isArray(value)) return;
    for (const item of value) {
      if (item === null || typeof item !== 'object' || Array.isArray(item)) {
        refsInValue(item, sink);
        continue;
      }
      const record = item as Record<string, unknown>;
      const marker = record[SLOT_REPEAT_KEY];
      let itemSink = sink;
      let itemCtx = ctx;
      if (typeof marker === 'string' && marker !== '') {
        if (ctx !== null) {
          sink(marker); // nested exemplar — its name is an item slot of the enclosing group
        } else {
          const entry = { name: marker, refs: [] as string[] };
          repeats.push(entry);
          itemSink = (name) => {
            if (!entry.refs.includes(name)) entry.refs.push(name);
          };
          itemCtx = entry.refs;
        }
      }
      for (const [k, v] of Object.entries(record)) {
        if (k === SLOT_REPEAT_KEY) continue;
        walkValue(v, itemSink, itemCtx);
      }
    }
  };

  const walk = (node: PresetNode, repeat: string[] | null): void => {
    const settings: Settings = node.settings ?? {};
    let ctx = repeat;

    const marker = settings[SLOT_REPEAT_KEY];
    if (typeof marker === 'string' && marker !== '') {
      if (ctx !== null) {
        // Nested subtree exemplar: a marker on a node INSIDE an items exemplar
        // names an item slot of that group, not a new section repeat.
        if (!ctx.includes(marker)) ctx.push(marker);
      } else {
        const entry = { name: marker, refs: [] as string[] };
        repeats.push(entry);
        ctx = entry.refs;
      }
    }

    const sink = (name: string): void => {
      const bucket = ctx ?? scalars;
      if (!bucket.includes(name)) bucket.push(name);
    };

    for (const [key, value] of Object.entries(settings)) {
      if (key === SLOT_REPEAT_KEY) continue;
      walkValue(value, sink, ctx);
    }

    for (const child of node.children ?? []) walk(child, ctx);
  };

  walk(tree, null);
  return { scalars, repeats };
}

/* ------------------------------------------------------------------------- *
 * Closed vocabularies — the catalog data itself lives in `siteSections.ts`.
 * ------------------------------------------------------------------------- */

/**
 * The closed icon vocabulary presets (and AI, via slot `options`) may use —
 * a curated copy of the demo pack's glyph set, drift-locked by the pack tests.
 */
export const PRESET_ICONS = ['star', 'check', 'arrow-right', 'heart', 'bolt', 'info'] as const;

/**
 * The closed social-network vocabulary chrome presets (and AI, via slot
 * `options`) may use — a curated copy of the demo pack's `SOCIAL_GLYPHS` set,
 * drift-locked by the pack tests (mirror of `PRESET_ICONS`).
 */
export const PRESET_SOCIAL = [
  'facebook',
  'x',
  'instagram',
  'linkedin',
  'youtube',
  'email',
] as const;
