/**
 * Gallery derivation (FDS-4). The content layer (`content/packs.json`) authors
 * only a Brand per pack; this module turns each Brand into a complete theme the
 * exact same way Flexa Builder does — `applyBrand(defaultTheme(), brand)` from
 * @flexa/core — and emits it as a NAMED theme so all sixteen coexist on one page
 * (`[data-fx-theme="pack-<id>"]`, like the playground). Nothing here is styled by
 * hand: the whole point is that a few fields of data derive an accessible theme.
 */
import { applyBrand, type Brand } from '@flexa/core';
import { checkThemeContrast, defaultTheme, emitTheme, type Theme } from 'flexa-design-system';
import type { PackContent } from './content';

export interface DerivedPack extends PackContent {
  /** The full theme derived from the pack's brand. */
  theme: Theme;
  /** Scoped theme CSS (`[data-fx-theme="pack-<id>"]`) — inject once per card. */
  css: string;
  /** The `[data-fx-theme]` selector value the preview subtree carries. */
  scope: string;
  /** True when every guaranteed contrast pair clears WCAG AA in both schemes. */
  contrastPass: boolean;
}

export function derivePack(pack: PackContent): DerivedPack {
  const brand = pack.brand as unknown as Brand;
  const base = applyBrand(defaultTheme(), brand);
  const scope = `pack-${pack.id}`;
  const theme = { ...base, name: scope };
  return {
    ...pack,
    theme,
    css: emitTheme(theme),
    scope,
    contrastPass: checkThemeContrast(base).length === 0,
  };
}

export function deriveGallery(packs: readonly PackContent[]): DerivedPack[] {
  return packs.map(derivePack);
}

/** Unique tags in first-appearance order — mirrors the editor's filter chips. */
export function galleryTags(packs: readonly PackContent[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const p of packs) {
    for (const t of p.tags) {
      if (!seen.has(t)) {
        seen.add(t);
        out.push(t);
      }
    }
  }
  return out;
}
