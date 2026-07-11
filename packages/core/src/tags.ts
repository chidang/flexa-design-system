/**
 * Dynamic tags — `{{entry.title}}` trong GIÁ TRỊ CHUỖI của settings (02 §I).
 * resolveDynamicTags chạy TRƯỚC render giống expandBlocks: engines không biết
 * tag là gì (mọi cây như nhau — giữ parity); map `tags` do adapter/host quyết
 * định — namespace chuẩn là `entry` {id, title, url} trên MỌI host (Next demo
 * lẫn WordPress) để document portable; host mở rộng thêm namespace nếu muốn.
 *
 * Tag không resolve được (namespace lạ, path đứt, giá trị không scalar) → GIỮ
 * NGUYÊN literal: editor chưa có entry preview vẫn thấy tag, không mất dữ liệu.
 * Giá trị thay vào là text thuần trong settings — Mustache escape lúc
 * interpolate như mọi settings khác (không mở lỗ raw HTML).
 */

import type { FlexaNode, Json, Settings } from './types.js';

// Cùng dấu {{ }} với Mustache nhưng sống ở SETTINGS, không phải template —
// hai thế giới không gặp nhau (settings chỉ pre-pass này đọc dạng tag).
const TAG_RE = /\{\{\s*([\w-]+(?:\.[\w-]+)*)\s*\}\}/g;

function lookup(tags: Record<string, Json>, path: string): Json | undefined {
  let cur: Json | undefined = tags as Json;
  for (const key of path.split('.')) {
    if (typeof cur !== 'object' || cur === null || Array.isArray(cur)) return undefined;
    cur = (cur as Record<string, Json>)[key];
  }
  return cur;
}

function resolveString(s: string, tags: Record<string, Json>): string {
  return s.replace(TAG_RE, (literal, path: string) => {
    const v = lookup(tags, path);
    if (typeof v === 'string') return v;
    if (typeof v === 'number' || typeof v === 'boolean') return String(v);
    return literal;
  });
}

/** Resolve đệ quy mọi chuỗi trong Json — nhánh không đổi trả về nguyên reference. */
function resolveJson(value: Json, tags: Record<string, Json>): Json {
  if (typeof value === 'string') return resolveString(value, tags);
  if (Array.isArray(value)) {
    let changed = false;
    const next = value.map((item) => {
      const r = resolveJson(item, tags);
      if (r !== item) changed = true;
      return r;
    });
    return changed ? next : value;
  }
  if (typeof value === 'object' && value !== null) {
    let changed = false;
    const next: Record<string, Json> = {};
    for (const [k, v] of Object.entries(value)) {
      const r = resolveJson(v, tags);
      next[k] = r;
      if (r !== v) changed = true;
    }
    return changed ? next : value;
  }
  return value;
}

function resolveNode(node: FlexaNode, tags: Record<string, Json>): FlexaNode {
  const settings = resolveJson(node.settings, tags) as Settings;
  let changed = settings !== node.settings;
  const children = node.children.map((c) => {
    const next = resolveNode(c, tags);
    if (next !== c) changed = true;
    return next;
  });
  return changed ? { ...node, settings, children } : node;
}

/**
 * Thay dynamic tag trong settings của cả cây (immutable — nhánh không có tag
 * trả về nguyên reference, structural sharing cho diff của editor). Kết quả
 * CHỈ để render; document lưu trữ vẫn giữ tag để entry khác điền giá trị khác.
 */
export function resolveDynamicTags(tree: FlexaNode, tags: Record<string, Json>): FlexaNode {
  // Không có namespace nào → mọi tag đều giữ literal, cây không đổi.
  if (Object.keys(tags).length === 0) return tree;
  return resolveNode(tree, tags);
}
