/**
 * SitePlan candidate normalisation (doc 14 W3) — pruneUnknownSlots drops
 * invented slot keys, stripChrome removes chrome for hosts that own it. Both
 * are AI-path-only, pure, no-throw, structure-preserving; hand-written plans
 * through `flexa compose` stay strict (the gate is never relaxed, SG-3).
 */

import { PRESET_BY_ID } from './shared.js';

export interface PruneUnknownSlotsResult {
  /** The plan with unknown slot keys removed (input BY REFERENCE if nothing dropped). */
  readonly plan: unknown;
  /** Dot paths of every dropped key, e.g. `pages.1.sections.2.copy.items_note`. */
  readonly dropped: readonly string[];
}

const isPlainRecord = (v: unknown): v is Record<string, unknown> =>
  v !== null && typeof v === 'object' && !Array.isArray(v);

/**
 * Drop copy/images keys that name NO slot of their section's preset — the one
 * gate-error class that is provably harmless to remove: a key without a slot
 * has nowhere to render, so pruning it loses nothing on the page. Models keep
 * inventing such keys ("items_note" on "team") despite prompt rules, and one
 * repair round often repeats the mistake.
 *
 * Deliberately conservative: MISPLACED keys (an image slot under `copy`, item
 * counts out of bounds, missing required slots…) are real, repairable content
 * problems and pass through untouched for `sitePlanSchema` to flag. Sections
 * with an unknown preset are left whole for the same reason.
 *
 * Pure, no-throw, structure-preserving on anything it cannot navigate. This is
 * a CANDIDATE normalisation (like stripping a markdown fence), not a gate
 * change: it runs only on the AI intake path, BEFORE `composeSite`, and
 * everything that reaches the gate is still validated in full (SG-3). Plans a
 * developer hands to `flexa compose` stay strict.
 */
export function pruneUnknownSlots(input: unknown): PruneUnknownSlotsResult {
  if (!isPlainRecord(input) || !Array.isArray(input.pages)) {
    return { plan: input, dropped: [] };
  }
  const dropped: string[] = [];

  const pruneSection = (section: unknown, base: string): unknown => {
    if (!isPlainRecord(section) || typeof section['preset'] !== 'string') return section;
    const preset = PRESET_BY_ID.get(section['preset']);
    if (!preset) return section;
    const slots = new Map(preset.slots.map((s) => [s.name, s]));
    const at = (bag: string, key: string): string => `${base}.${bag}.${key}`;
    let out = section;

    if (isPlainRecord(section['copy'])) {
      const copy: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(section['copy'])) {
        const slot = slots.get(key);
        if (!slot) {
          dropped.push(at('copy', key));
          continue;
        }
        if (slot.kind === 'items' && Array.isArray(value)) {
          const itemSlots = new Set((slot.item ?? []).map((s) => s.name));
          copy[key] = value.map((item, ii) => {
            if (!isPlainRecord(item)) return item;
            const kept: Record<string, unknown> = {};
            for (const [itemKey, itemValue] of Object.entries(item)) {
              if (itemSlots.has(itemKey)) kept[itemKey] = itemValue;
              else dropped.push(`${at('copy', key)}.${ii}.${itemKey}`);
            }
            return kept;
          });
          continue;
        }
        copy[key] = value;
      }
      out = { ...out, copy };
    }

    if (isPlainRecord(section['images'])) {
      const images: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(section['images'])) {
        if (slots.has(key)) images[key] = value;
        else dropped.push(at('images', key));
      }
      out = { ...out, images };
    }

    return out;
  };

  const pages = input.pages.map((page, pi) => {
    if (!isPlainRecord(page)) return page;
    let out: Record<string, unknown> = page;
    if (Array.isArray(page.sections)) {
      out = {
        ...out,
        sections: page.sections.map((section, si) =>
          pruneSection(section, `pages.${pi}.sections.${si}`),
        ),
      };
    }
    // Per-page chrome overrides carry the same invented-key risk (W8).
    for (const key of ['header', 'footer'] as const) {
      if (isPlainRecord(out[key])) {
        out = { ...out, [key]: pruneSection(out[key], `pages.${pi}.${key}`) };
      }
    }
    return out;
  });

  let plan: Record<string, unknown> = { ...input, pages };
  if (isPlainRecord(input['chrome'])) {
    let chrome: Record<string, unknown> = input['chrome'];
    for (const key of ['header', 'footer'] as const) {
      if (isPlainRecord(chrome[key])) {
        chrome = { ...chrome, [key]: pruneSection(chrome[key], `chrome.${key}`) };
      }
    }
    plan = { ...plan, chrome };
  }

  if (dropped.length === 0) return { plan: input, dropped: [] };
  return { plan, dropped };
}

export interface StripChromeResult {
  /** The plan without chrome fields (input BY REFERENCE if nothing dropped). */
  readonly plan: unknown;
  /** Dot paths of every dropped field, e.g. `chrome` / `pages.1.header`. */
  readonly dropped: readonly string[];
}

/**
 * Remove every chrome field (site-wide `chrome`, per-page `header`/`footer`)
 * from a candidate plan. For hosts whose theme already renders the page chrome
 * (classic WordPress themes), Flexa chrome inside the content would DUPLICATE
 * the theme's header/footer — the wizard strips it before the gate. AI-path-only
 * candidate normalisation like `pruneUnknownSlots`: hand-written plans through
 * `flexa compose` keep their chrome. Pure, no-throw, structure-preserving.
 */
export function stripChrome(input: unknown): StripChromeResult {
  if (!isPlainRecord(input)) return { plan: input, dropped: [] };
  const dropped: string[] = [];
  let out: Record<string, unknown> = input;

  if ('chrome' in input) {
    const { chrome: _chrome, ...rest } = input;
    out = rest;
    dropped.push('chrome');
  }

  if (Array.isArray(out['pages'])) {
    let pagesChanged = false;
    const pages = (out['pages'] as unknown[]).map((page, pi) => {
      if (!isPlainRecord(page)) return page;
      let p: Record<string, unknown> = page;
      for (const key of ['header', 'footer'] as const) {
        if (key in p) {
          const { [key]: _drop, ...rest } = p;
          p = rest;
          dropped.push(`pages.${pi}.${key}`);
          pagesChanged = true;
        }
      }
      return p;
    });
    if (pagesChanged) out = { ...out, pages };
  }

  if (dropped.length === 0) return { plan: input, dropped: [] };
  return { plan: out, dropped };
}
