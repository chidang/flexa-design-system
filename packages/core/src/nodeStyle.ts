/**
 * Node-level style (02 §A, spec 07 §2) — pipeline layer, NOT a frozen engine.
 * Converts the closed-set `node.style` groups into a one-rule StyleSpec so the
 * frozen CSS compiler does all responsive/state/unit work. The PHP mirror
 * (Phase 4) reproduces exactly this mapping, locked by `nodestyle` parity
 * fixtures (06).
 */

import type { Json, NodeStyle, NodeStyleGroups, StyleDecls, StyleSpec } from './types.js';

/**
 * Closed property mapping — declaration order is deterministic (group order,
 * then key order below) so output is parity-stable.
 */
export function groupsToDecls(g: NodeStyleGroups): StyleDecls {
  const d: StyleDecls = {};
  if (g.spacing?.margin) d['margin'] = g.spacing.margin;
  if (g.spacing?.padding) d['padding'] = g.spacing.padding;
  if (g.background?.color) d['background-color'] = g.background.color;
  if (g.border?.width) d['border-width'] = g.border.width;
  if (g.border?.style) d['border-style'] = g.border.style;
  if (g.border?.color) d['border-color'] = g.border.color;
  if (g.border?.radius) d['border-radius'] = g.border.radius;
  // Shadow composes to one string; missing numbers default to 0, no color → skip
  // the whole group (deterministic composition, 07 §2.2).
  if (g.shadow?.color) {
    const s = g.shadow;
    const parts = `${s.x ?? 0}px ${s.y ?? 0}px ${s.blur ?? 0}px ${s.spread ?? 0}px ${s.color}`;
    d['box-shadow'] = s.inset ? `inset ${parts}` : parts;
  }
  const t = g.typography;
  if (t?.family) d['font-family'] = t.family;
  if (t?.size !== undefined) d['font-size'] = t.size;
  if (t?.weight !== undefined) d['font-weight'] = t.weight;
  if (t?.lineHeight !== undefined) d['line-height'] = t.lineHeight;
  if (t?.letterSpacing !== undefined) d['letter-spacing'] = t.letterSpacing;
  if (t?.transform) d['text-transform'] = t.transform;
  if (t?.color) d['color'] = t.color;
  if (t?.align) d['text-align'] = t.align;
  if (g.size?.width) d['width'] = g.size.width;
  if (g.size?.maxWidth) d['max-width'] = g.size.maxWidth;
  if (g.size?.minHeight) d['min-height'] = g.size.minHeight;
  if (g.size?.height) d['height'] = g.size.height;
  if (g.size?.minWidth) d['min-width'] = g.size.minWidth;
  if (g.size?.maxHeight) d['max-height'] = g.size.maxHeight;
  if (g.size?.aspectRatio) d['aspect-ratio'] = g.size.aspectRatio;
  if (g.layout?.zIndex !== undefined) d['z-index'] = g.layout.zIndex;
  if (g.layout?.order !== undefined) d['order'] = g.layout.order;
  if (g.layout?.overflow) d['overflow'] = g.layout.overflow;
  if (g.layout?.display) d['display'] = g.layout.display;
  // Position: mode and offsets are emitted independently (07 §2.2).
  if (g.position?.mode) d['position'] = g.position.mode;
  if (g.position?.top) d['top'] = g.position.top;
  if (g.position?.right) d['right'] = g.position.right;
  if (g.position?.bottom) d['bottom'] = g.position.bottom;
  if (g.position?.left) d['left'] = g.position.left;
  if (g.flexItem?.alignSelf) d['align-self'] = g.flexItem.alignSelf;
  if (g.flexItem?.grow !== undefined) d['flex-grow'] = g.flexItem.grow;
  if (g.flexItem?.shrink !== undefined) d['flex-shrink'] = g.flexItem.shrink;
  if (g.flexItem?.basis) d['flex-basis'] = g.flexItem.basis;
  if (g.gridItem?.column) d['grid-column'] = g.gridItem.column;
  if (g.gridItem?.row) d['grid-row'] = g.gridItem.row;
  if (g.gridItem?.justifySelf) d['justify-self'] = g.gridItem.justifySelf;
  if (g.gridItem?.alignSelf) d['align-self'] = g.gridItem.alignSelf;
  // Filter composes to one string, fixed order, only present keys (07 §2.3).
  if (g.effects) {
    const e = g.effects;
    const fns: string[] = [];
    if (e.blur !== undefined) fns.push(`blur(${e.blur}px)`);
    if (e.brightness !== undefined) fns.push(`brightness(${e.brightness})`);
    if (e.contrast !== undefined) fns.push(`contrast(${e.contrast})`);
    if (e.saturate !== undefined) fns.push(`saturate(${e.saturate})`);
    if (e.grayscale !== undefined) fns.push(`grayscale(${e.grayscale})`);
    if (e.hueRotate !== undefined) fns.push(`hue-rotate(${e.hueRotate}deg)`);
    if (fns.length) d['filter'] = fns.join(' ');
  }
  // Transform composes translate → scale → rotate → skew; each function is
  // emitted only when at least one of its fields is present (07 §2.3).
  if (g.transform) {
    const t = g.transform;
    const fns: string[] = [];
    if (t.translateX !== undefined || t.translateY !== undefined)
      fns.push(`translate(${t.translateX ?? '0'}, ${t.translateY ?? '0'})`);
    if (t.scaleX !== undefined || t.scaleY !== undefined)
      fns.push(`scale(${t.scaleX ?? 1}, ${t.scaleY ?? 1})`);
    if (t.rotate !== undefined) fns.push(`rotate(${t.rotate}deg)`);
    if (t.skewX !== undefined || t.skewY !== undefined)
      fns.push(`skew(${t.skewX ?? 0}deg, ${t.skewY ?? 0}deg)`);
    if (fns.length) d['transform'] = fns.join(' ');
    if (t.originX !== undefined || t.originY !== undefined)
      d['transform-origin'] = `${t.originX ?? 'center'} ${t.originY ?? 'center'}`;
  }
  if (g.opacity !== undefined) d['opacity'] = g.opacity;
  return d;
}

/**
 * NodeStyle → StyleSpec with a single `'&'` rule:
 * `{ '&': { ...base, '@hover': {...}, '@responsive': { laptop, tablet, mobile } } }`.
 * Returns null when nothing would be emitted. The caller compiles it with an
 * EMPTY settings object — values are literals; user strings starting with '@'
 * degrade to dropped declarations inside the compiler (safe by construction).
 */
export function nodeStyleToSpec(style: NodeStyle): StyleSpec | null {
  const base = groupsToDecls(style);
  // transition: emitted only with a duration; easing defaults to 'ease'.
  if (style.transition?.duration !== undefined) {
    base['transition'] = `all ${style.transition.duration}ms ${style.transition.easing ?? 'ease'}`;
  }

  // States — all three keys pre-exist in the frozen compiler's STATE_KEYS;
  // output order (hover → focus → active) is the engine's, not this object's.
  for (const state of ['hover', 'active', 'focus'] as const) {
    const page = style[state];
    if (!page) continue;
    const decls = groupsToDecls(page);
    if (Object.keys(decls).length) base[`@${state}`] = decls;
  }

  const responsive: Record<string, StyleDecls> = {};
  for (const bp of ['laptop', 'tablet', 'mobile'] as const) {
    const page = style[bp];
    if (!page) continue;
    const decls = groupsToDecls(page);
    if (Object.keys(decls).length) responsive[bp] = decls;
  }
  if (Object.keys(responsive).length) base['@responsive'] = responsive as Json;

  return Object.keys(base).length ? { '&': base } : null;
}

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function pruneObject(obj: Record<string, unknown>): Record<string, unknown> | undefined {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value === undefined || value === null || value === '') continue;
    if (isPlainObject(value)) {
      const nested = pruneObject(value);
      if (nested) out[key] = nested;
    } else {
      out[key] = value;
    }
  }
  return Object.keys(out).length ? out : undefined;
}

/**
 * Drops empty keys at every level (undefined/null/'' and objects that become
 * empty); returns undefined when nothing remains — the caller then removes the
 * `style` field entirely (same contract as `advanced`). Non-mutating. Never
 * stores `undefined` inside the result, so JSON round-trip snapshots are safe.
 */
export function pruneNodeStyle(style: NodeStyle): NodeStyle | undefined {
  return pruneObject(style as Record<string, unknown>) as NodeStyle | undefined;
}
