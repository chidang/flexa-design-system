/**
 * Reusable block SYNCED — `flexa/block-ref` (02 §H, 04 Phase 3 bước 2).
 * Node ref tham chiếu một document `kind: 'block'` qua `settings.blockId`;
 * expandBlocks THAY children của ref bằng nội dung block TRƯỚC khi render —
 * engine render không biết gì về block (mọi cây như nhau, giữ parity).
 *
 * Logic thuần, chạy được mọi host: Next.js expand server-side, editor expand
 * cho preview, WordPress (Phase 4) mirror đúng hàm này.
 */

import type { FlexaDocument, FlexaNode, Json, NodeStyle, Settings } from './types.js';
import { ROOT_TYPE } from './root.js';

export const BLOCK_REF_TYPE = 'flexa/block-ref';

/**
 * Manifest dựng sẵn — mọi ElementRegistry tự đăng ký (type dành riêng, như
 * `flexa/root`). Wrapper của instance `display: contents` để không chen vào
 * layout của cha (block toàn Column vẫn nằm đúng grid của Row).
 * `childTypes: []`: không ai chèn tay con vào ref — children chỉ do expand sinh.
 * Ref còn sót đến lúc render (block mất / vòng tham chiếu) ra ĐÚNG một div
 * rỗng display:contents — không vỡ trang.
 */
export const BLOCK_REF_MANIFEST = {
  type: BLOCK_REF_TYPE,
  title: 'Block',
  icon: 'block',
  tier: 'declarative',
  version: 1,
  schema: {},
  template: '{{{children}}}',
  style: { '&': { display: 'contents' } },
  childTypes: [],
} as const;

/** Settings của node ref — đọc qua helper vì Settings là Json thuần. */
export interface BlockRefSettings {
  blockId: string;
  /** Override per-instance: id node GỐC trong block → patch settings (02 §H). */
  overrides?: Record<string, Settings>;
  /**
   * Override node.style per-instance (07 §2.5): id node GỐC → patch NodeStyle,
   * merge NÔNG theo key cấp 1 (group/tablet/mobile/hover/…) — cùng ngữ nghĩa
   * với `overrides` merge theo key settings. Patch phải đã prune (việc của
   * editor, như pasteStyle); core áp nguyên văn.
   */
  styleOverrides?: Record<string, NodeStyle>;
}

function isPlainObject(v: Json | undefined): v is Record<string, Json> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

/** Lọc entry hợp lệ (object thuần) của một map `id → patch` trong settings. */
function patchMapOf(raw: Json | undefined): Record<string, Record<string, Json>> | undefined {
  if (!isPlainObject(raw)) return undefined;
  const out: Record<string, Record<string, Json>> = {};
  for (const [id, patch] of Object.entries(raw)) {
    if (isPlainObject(patch)) out[id] = patch;
  }
  return out;
}

/** Đọc settings của node ref; node không phải ref hoặc thiếu blockId → null. */
export function blockRefOf(node: FlexaNode): BlockRefSettings | null {
  if (node.type !== BLOCK_REF_TYPE) return null;
  const blockId = node.settings['blockId'];
  if (typeof blockId !== 'string' || blockId === '') return null;
  const ref: BlockRefSettings = { blockId };
  const overrides = patchMapOf(node.settings['overrides']);
  if (overrides) ref.overrides = overrides;
  const styleOverrides = patchMapOf(node.settings['styleOverrides']);
  if (styleOverrides) ref.styleOverrides = styleOverrides as Record<string, NodeStyle>;
  return ref;
}

/**
 * Clone nội dung block cho MỘT instance: id namespace `${instanceId}:${idGốc}`
 * (deterministic — CSS scope/data map/init ổn định giữa các lần render, hai
 * instance không đụng id nhau), áp override settings + style theo id gốc.
 */
function instantiate(node: FlexaNode, instanceId: string, ref: BlockRefSettings): FlexaNode {
  const patch = ref.overrides?.[node.id];
  const stylePatch = ref.styleOverrides?.[node.id];
  const out: FlexaNode = {
    ...node,
    id: `${instanceId}:${node.id}`,
    settings: patch ? { ...node.settings, ...patch } : node.settings,
    children: node.children.map((c) => instantiate(c, instanceId, ref)),
  };
  if (stylePatch) out.style = node.style ? { ...node.style, ...stylePatch } : stylePatch;
  return out;
}

/** Nội dung cấp 1 của một block: tree lưu dạng document (root flexa/root). */
function blockChildren(tree: FlexaNode): FlexaNode[] {
  return tree.type === ROOT_TYPE ? tree.children : [tree];
}

function expandNode(
  node: FlexaNode,
  blocks: Record<string, FlexaNode | undefined>,
  path: string[],
): FlexaNode {
  const ref = blockRefOf(node);
  if (ref) {
    const block = blocks[ref.blockId];
    // Block mất hoặc vòng tham chiếu (A→B→A): để ref rỗng — render ra div
    // display:contents trống, các instance ngoài vòng vẫn nguyên vẹn.
    if (!block || path.includes(ref.blockId)) {
      return node.children.length === 0 ? node : { ...node, children: [] };
    }
    const nested = [...path, ref.blockId];
    const children = blockChildren(block)
      .map((c) => instantiate(c, node.id, ref))
      // Block lồng block: ref bên trong đã mang id namespace nên instance con
      // prefix tiếp theo id đó — id toàn cục duy nhất ở mọi độ sâu.
      .map((c) => expandNode(c, blocks, nested));
    return { ...node, children };
  }

  let changed = false;
  const children = node.children.map((c) => {
    const next = expandNode(c, blocks, path);
    if (next !== c) changed = true;
    return next;
  });
  return changed ? { ...node, children } : node;
}

/**
 * Expand mọi `flexa/block-ref` trong cây TRƯỚC render (immutable — nhánh không
 * có ref trả về nguyên reference). Kết quả CHỈ để render; document lưu trữ vẫn
 * giữ node ref gọn (không nhân bản nội dung block vào page).
 */
export function expandBlocks(
  tree: FlexaNode,
  blocks: Record<string, FlexaNode | undefined>,
): FlexaNode {
  return expandNode(tree, blocks, []);
}

/**
 * Các blockId được tham chiếu TRỰC TIẾP trong cây (unique, theo thứ tự gặp).
 * Không nhìn xuyên vào block (chưa có tree) — adapter lặp tới khi đủ
 * (transitive) rồi mới gọi expandBlocks; cũng là nền cho `block_usage`.
 */
export function collectBlockRefs(tree: FlexaNode): string[] {
  const out = new Set<string>();
  const walk = (node: FlexaNode): void => {
    const ref = blockRefOf(node);
    if (ref) out.add(ref.blockId);
    for (const c of node.children) walk(c);
  };
  walk(tree);
  return [...out];
}

/**
 * `block_usage` (02 §H): map `blockId → documentId[]` tham chiếu TRỰC TIẾP —
 * thứ tự theo input để tất định (parity fixtures `blockusage/`). Adapter
 * persist (WP Phase 4: bảng `wp_flexa_block_usage`) hoặc tính on-demand.
 */
export function buildBlockUsage(
  docs: ReadonlyArray<Pick<FlexaDocument, 'id' | 'tree'>>,
): Record<string, string[]> {
  const usage: Record<string, string[]> = {};
  for (const doc of docs) {
    for (const blockId of collectBlockRefs(doc.tree)) {
      (usage[blockId] ??= []).push(doc.id);
    }
  }
  return usage;
}

/**
 * Mọi documentId phải render lại khi block đổi: user trực tiếp + gián tiếp qua
 * block lồng block (document dùng block cũng có thể là block). BFS chống vòng
 * (A→B→A dừng); KHÔNG gồm chính `blockId`.
 */
export function collectBlockDependents(
  blockId: string,
  usage: Record<string, string[]>,
): string[] {
  const out: string[] = [];
  const seen = new Set<string>([blockId]);
  const queue = [blockId];
  for (let i = 0; i < queue.length; i++) {
    // i < queue.length nên phần tử luôn tồn tại (noUncheckedIndexedAccess).
    for (const docId of usage[queue[i]!] ?? []) {
      if (seen.has(docId)) continue;
      seen.add(docId);
      out.push(docId);
      queue.push(docId);
    }
  }
  return out;
}
