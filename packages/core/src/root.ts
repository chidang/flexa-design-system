/**
 * Root wrapper của document — type dựng sẵn `flexa/root` (xem 02 §A).
 * Root KHÔNG phải element người dùng: template chỉ là {{{children}}} nên frontend
 * ra đúng MỘT thẻ <div class="fx"> bao toàn trang; `parentTypes: []` khiến
 * canNest luôn từ chối → không bao giờ xuất hiện trong picker/kéo-thả.
 * Mọi ElementRegistry tự đăng ký manifest này (registry.ts).
 */

import type { FlexaNode } from './types.js';

export const ROOT_TYPE = 'flexa/root';

/** Id cố định cho root do ensureRootTree tạo — deterministic, không đụng n_xxxx. */
export const ROOT_ID = 'fx-root';

export const ROOT_MANIFEST = {
  type: ROOT_TYPE,
  title: 'Trang',
  tier: 'declarative',
  version: 1,
  schema: {},
  template: '{{{children}}}',
  parentTypes: [],
} as const;

/**
 * Migration cấu trúc: document cũ có element (vd. Section) làm root → bọc nó
 * trong node `flexa/root`. Idempotent — root đã đúng type thì trả nguyên.
 * Editor gọi lúc load; engine render không cần (render mọi cây như nhau).
 */
export function ensureRootTree(tree: FlexaNode): FlexaNode {
  if (tree.type === ROOT_TYPE) return tree;
  return { id: ROOT_ID, type: ROOT_TYPE, settings: {}, children: [tree], v: 1 };
}

/** Cây của document MỚI: chỉ node root rỗng — store dùng khi tạo document. */
export function emptyRootTree(): FlexaNode {
  return { id: ROOT_ID, type: ROOT_TYPE, settings: {}, children: [], v: 1 };
}
