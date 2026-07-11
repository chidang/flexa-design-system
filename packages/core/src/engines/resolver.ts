/**
 * Prop resolver — frozen engine #3.
 * Nuốt prop-map khai báo → props phẳng từ settings, áp formatter đóng băng.
 * Không có chỗ cho logic tùy ý: mọi thứ vượt formatter → data provider của adapter.
 */

import type { FlatProps, Json, PropDef, Settings } from '../types.js';
import { getFormatter } from './formatters.js';

/** '@a.b' → settings.a.b; ref thiếu → null (nhất quán, có fixture khóa). */
export function resolveRef(value: Json, settings: Settings): Json {
  if (typeof value !== 'string' || !value.startsWith('@')) return value;
  const path = value.slice(1).split('.');
  let cur: Json = settings as Json;
  for (const key of path) {
    if (cur === null || typeof cur !== 'object' || Array.isArray(cur)) return null;
    cur = (cur as Record<string, Json>)[key] ?? null;
  }
  return cur;
}

function isTruthy(v: Json): boolean {
  // Quy tắc falsy đã chốt (khớp Mustache section): null/false/0/''/[] là falsy.
  if (v === null || v === false || v === 0 || v === '') return false;
  if (Array.isArray(v) && v.length === 0) return false;
  return true;
}

export function resolveProps(
  propMap: Record<string, PropDef> | undefined,
  settings: Settings,
): FlatProps {
  const out: FlatProps = {};
  if (!propMap) return out;

  for (const [name, def] of Object.entries(propMap)) {
    if ('classIf' in def) {
      const classes: string[] = [];
      for (const [ref, cls] of Object.entries(def.classIf)) {
        if (isTruthy(resolveRef(ref, settings))) classes.push(cls);
      }
      out[name] = classes.join(' ');
      continue;
    }

    const value = resolveRef(def.value, settings);
    if (def.format) {
      const fn = getFormatter(def.format);
      // Formatter lạ đã bị chặn từ defineElement; đây là hàng rào thứ hai.
      if (!fn) throw new Error(`Unknown formatter "${def.format}" in prop "${name}"`);
      out[name] = fn(value, def.arg === undefined ? undefined : resolveRef(def.arg, settings));
    } else {
      out[name] = value;
    }
  }
  return out;
}
