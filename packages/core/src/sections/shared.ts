/**
 * Shared authoring vocabulary for the site catalog presets — band/muted
 * literals, the slot builders (text/longtext/image/list/items), and the
 * PresetNode builders (node/section/row/column + element shorthands). Split
 * out of siteSections.ts so each preset-group module imports just this. Pure
 * data helpers; NOT a frozen engine.
 */

import type { PresetNode, Settings } from '../types.js';
import { PRESET_ICONS, type SectionSlot } from '../siteCatalog.js';

/** Alternating band background — theme-driven, never a literal (doc 12/§2). */
export const BAND = 'var(--fx-color-surface-alt)';

/** Deliberate literal for secondary/meta copy inside cards (token-first §2 list). */
export const MUTED = '#667788';

export const text = (name: string, opts: Partial<SectionSlot> = {}): SectionSlot => ({
  name,
  kind: 'text',
  ...opts,
});
export const longtext = (name: string, opts: Partial<SectionSlot> = {}): SectionSlot => ({
  name,
  kind: 'longtext',
  ...opts,
});
export const image = (name: string, opts: Partial<SectionSlot> = {}): SectionSlot => ({
  name,
  kind: 'image',
  ...opts,
});
/** A `kind:'list'` ITEM slot (doc 14 §4b lift): value is a string[] the carrier
 *  element's repeater expands one entry per string. Item-level only. */
export const list = (name: string, opts: Partial<SectionSlot> = {}): SectionSlot => ({
  name,
  kind: 'list',
  ...opts,
});
/** An items slot under any name (chrome presets carry several). Optional items
 *  slots (`required: false`) must pair with `whenEmpty: 'prune'` — unfilled, the
 *  exemplar's carrying node is pruned instead of rendering empty. */
export const itemList = (
  name: string,
  min: number,
  max: number,
  item: readonly SectionSlot[],
  opts: Partial<SectionSlot> = {},
): SectionSlot => ({
  name,
  kind: 'items',
  required: true,
  min,
  max,
  item,
  ...opts,
});
export const items = (min: number, max: number, item: readonly SectionSlot[]): SectionSlot =>
  itemList('items', min, max, item);

export const node = (type: string, settings: Settings = {}, children?: PresetNode[]): PresetNode => ({
  type,
  settings,
  ...(children ? { children } : {}),
});
export const section = (settings: Settings, children: PresetNode[]): PresetNode =>
  node('flexa/section', settings, children);
export const row = (children: PresetNode[], settings: Settings = {}): PresetNode =>
  node('flexa/row', settings, children);
export const column = (span: number, children: PresetNode[], settings: Settings = {}): PresetNode =>
  node('flexa/column', { span: { desktop: span }, ...settings }, children);
export const heading = (settings: Settings): PresetNode => node('flexa/heading', settings);
export const textEl = (settings: Settings): PresetNode => node('flexa/text', settings);
export const button = (settings: Settings): PresetNode => node('flexa/button', settings);
export const imageEl = (settings: Settings): PresetNode => node('flexa/image', settings);

export const ICON_SLOT: Partial<SectionSlot> = { options: PRESET_ICONS, whenEmpty: 'default' };
