/**
 * CSS compiler — frozen engine #2.
 * Nuốt style-spec khai báo + settings → CSS scoped. Lo responsive (breakpoint →
 * media query), container query (`@container` → `@container (min-width)`), state
 * (@hover/@focus/@active → pseudo), unit cho số trần.
 *
 * Output có format chuẩn hóa (thứ tự khai báo, media query desktop→tablet→mobile,
 * container query min-width tăng dần) để mirror engine dễ khớp và fixture parity
 * ổn định.
 */

import type { Json, Settings, StyleSpec } from '../types.js';
import { resolveRef } from './resolver.js';

export interface CssCompileOptions {
  /** Selector scope của element, vd. '[data-fx="n_a1"]'. Rỗng = không scope. */
  scope?: string;
  /** breakpoint name → max-width px; thứ tự emit theo width giảm dần. */
  breakpoints?: Record<string, number>;
  /** container-size name → min-width px; thứ tự emit theo width tăng dần (mobile-first). */
  container?: Record<string, number>;
}

// laptop thêm 2026-07-10 (07 §2 amendment) — mở rộng additive qua parity harness:
// spec cũ không có key 'laptop' trong @responsive (key lạ bị skip) nên output cũ
// byte-identical; fixture css/responsive-laptop.json khóa ngưỡng + thứ tự emit.
export const DEFAULT_BREAKPOINTS: Record<string, number> = {
  laptop: 1440,
  tablet: 1024,
  mobile: 767,
};

// Container-size keys → min-width px, khớp token `size.container-*` (bỏ `full`,
// không phải ngưỡng). Container query là mobile-first: base = nhỏ nhất, container
// rộng ra → override, nên emit min-width theo width tăng dần (ngưỡng lớn thắng).
export const DEFAULT_CONTAINER_SIZES: Record<string, number> = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
};

const STATE_KEYS: Record<string, string> = {
  '@hover': ':hover',
  '@focus': ':focus',
  '@active': ':active',
};

// Các CSS prop nhận số trần không đơn vị; số trần ở prop khác được hiểu là px.
// Custom property (--*) cũng nhận số thô — giá trị dùng trong calc()/var().
const UNITLESS = new Set([
  'opacity', 'z-index', 'font-weight', 'line-height', 'flex', 'flex-grow',
  'flex-shrink', 'order', 'zoom',
]);

function cssValue(prop: string, value: Json): string | null {
  if (value === null || value === undefined || value === '' || value === false) return null;
  if (typeof value === 'number') {
    return UNITLESS.has(prop) || prop.startsWith('--') ? String(value) : `${value}px`;
  }
  if (typeof value === 'string') return value;
  return null; // object/array không phải giá trị CSS hợp lệ
}

function scopeSelector(selector: string, scope: string): string {
  if (!scope) return selector;
  // '&' = chính wrapper của element; còn lại là descendant.
  if (selector === '&') return scope;
  if (selector.startsWith('&')) return scope + selector.slice(1);
  return `${scope} ${selector}`;
}

function compileDecls(decls: Record<string, Json>, settings: Settings): string {
  const parts: string[] = [];
  for (const [prop, raw] of Object.entries(decls)) {
    if (prop.startsWith('@')) continue;
    const value = cssValue(prop, resolveRef(raw, settings));
    if (value !== null) parts.push(`${prop}:${value}`);
  }
  return parts.join(';');
}

export function compileCss(
  spec: StyleSpec | undefined,
  settings: Settings,
  opts: CssCompileOptions = {},
): string {
  if (!spec) return '';
  const scope = opts.scope ?? '';
  const breakpoints = opts.breakpoints ?? DEFAULT_BREAKPOINTS;
  const container = opts.container ?? DEFAULT_CONTAINER_SIZES;

  const rules: string[] = [];
  // media rules gom theo breakpoint để mỗi breakpoint chỉ có một @media block.
  const mediaRules = new Map<string, string[]>();
  // container rules gom theo container-size để mỗi size chỉ có một @container block.
  const containerRules = new Map<string, string[]>();

  for (const [selector, rule] of Object.entries(spec)) {
    const scoped = scopeSelector(selector, scope);

    const base = compileDecls(rule, settings);
    if (base) rules.push(`${scoped}{${base}}`);

    for (const [key, pseudo] of Object.entries(STATE_KEYS)) {
      const stateDecls = rule[key];
      if (stateDecls && typeof stateDecls === 'object' && !Array.isArray(stateDecls)) {
        const body = compileDecls(stateDecls as Record<string, Json>, settings);
        if (body) rules.push(`${scoped}${pseudo}{${body}}`);
      }
    }

    const responsive = rule['@responsive'];
    if (responsive && typeof responsive === 'object' && !Array.isArray(responsive)) {
      for (const [bp, bpDecls] of Object.entries(responsive as Record<string, Json>)) {
        if (!(bp in breakpoints)) continue;
        if (!bpDecls || typeof bpDecls !== 'object' || Array.isArray(bpDecls)) continue;
        const body = compileDecls(bpDecls as Record<string, Json>, settings);
        if (!body) continue;
        const list = mediaRules.get(bp) ?? [];
        list.push(`${scoped}{${body}}`);
        mediaRules.set(bp, list);
      }
    }

    const cq = rule['@container'];
    if (cq && typeof cq === 'object' && !Array.isArray(cq)) {
      for (const [size, sizeDecls] of Object.entries(cq as Record<string, Json>)) {
        if (!(size in container)) continue;
        if (!sizeDecls || typeof sizeDecls !== 'object' || Array.isArray(sizeDecls)) continue;
        const body = compileDecls(sizeDecls as Record<string, Json>, settings);
        if (!body) continue;
        const list = containerRules.get(size) ?? [];
        list.push(`${scoped}{${body}}`);
        containerRules.set(size, list);
      }
    }
  }

  // Emit @media theo width giảm dần (desktop base → tablet → mobile) — thứ tự
  // ổn định là một quyết định đóng băng, có fixture khóa.
  const orderedBps = Object.entries(breakpoints).sort((a, b) => b[1] - a[1]);
  for (const [bp, width] of orderedBps) {
    const list = mediaRules.get(bp);
    if (list?.length) rules.push(`@media (max-width:${width}px){${list.join('')}}`);
  }

  // Emit @container theo width tăng dần (mobile-first, ngưỡng lớn thắng cascade) —
  // đặt sau @media, cũng là quyết định đóng băng có fixture khóa.
  const orderedSizes = Object.entries(container).sort((a, b) => a[1] - b[1]);
  for (const [size, width] of orderedSizes) {
    const list = containerRules.get(size);
    if (list?.length) rules.push(`@container (min-width:${width}px){${list.join('')}}`);
  }

  return rules.join('\n');
}
