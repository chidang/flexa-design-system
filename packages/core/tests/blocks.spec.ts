import { describe, expect, it } from 'vitest';
import {
  BLOCK_REF_TYPE,
  buildBlockUsage,
  collectBlockDependents,
  collectBlockRefs,
  expandBlocks,
  ElementRegistry,
  renderDocument,
  ROOT_ID,
  ROOT_TYPE,
  type FlexaNode,
  type Json,
  type NodeStyle,
  type Settings,
} from '../src/index.js';

function n(id: string, type: string, settings: Settings = {}, children: FlexaNode[] = []): FlexaNode {
  return { id, type, settings, children };
}

function ref(
  id: string,
  blockId: string,
  overrides?: Record<string, Settings>,
  styleOverrides?: Record<string, NodeStyle>,
): FlexaNode {
  const settings: Settings = { blockId };
  if (overrides) settings['overrides'] = overrides;
  if (styleOverrides) settings['styleOverrides'] = styleOverrides as unknown as Json;
  return n(id, BLOCK_REF_TYPE, settings);
}

function blockDoc(children: FlexaNode[]): FlexaNode {
  return n(ROOT_ID, ROOT_TYPE, {}, children);
}

/** Block "card": một section chứa một text — đủ 2 cấp để test override/namespace. */
const card = blockDoc([n('n_sec', 'demo/section', { pad: 8 }, [n('n_txt', 'demo/text', { text: 'Hello' })])]);

describe('expandBlocks', () => {
  it('thay children của ref bằng nội dung block, id namespace theo instance', () => {
    const tree = n('fx-root', ROOT_TYPE, {}, [ref('n_ref', 'card')]);
    const out = expandBlocks(tree, { card });
    const inst = out.children[0]!;
    expect(inst.type).toBe(BLOCK_REF_TYPE);
    expect(inst.children.map((c) => c.id)).toEqual(['n_ref:n_sec']);
    expect(inst.children[0]!.children[0]!.id).toBe('n_ref:n_txt');
    // Nội dung block không bị đụng vào (clone, không mutate).
    expect(card.children[0]!.id).toBe('n_sec');
  });

  it('hai instance cùng block → id khác nhau, không đụng nhau', () => {
    const tree = n('fx-root', ROOT_TYPE, {}, [ref('n_a', 'card'), ref('n_b', 'card')]);
    const out = expandBlocks(tree, { card });
    expect(out.children[0]!.children[0]!.id).toBe('n_a:n_sec');
    expect(out.children[1]!.children[0]!.id).toBe('n_b:n_sec');
  });

  it('override per-instance: patch merge vào settings theo id GỐC trong block', () => {
    const tree = n('fx-root', ROOT_TYPE, {}, [
      ref('n_a', 'card', { n_txt: { text: 'Xin chào' } }),
      ref('n_b', 'card'),
    ]);
    const out = expandBlocks(tree, { card });
    const textOf = (i: number) => out.children[i]!.children[0]!.children[0]!.settings;
    expect(textOf(0)).toEqual({ text: 'Xin chào' });
    expect(textOf(1)).toEqual({ text: 'Hello' }); // instance khác giữ nguyên
    // settings gốc trong block không bị mutate.
    expect(card.children[0]!.children[0]!.settings).toEqual({ text: 'Hello' });
  });

  it('override style per-instance: merge NÔNG theo key cấp 1 vào node.style theo id GỐC', () => {
    // Block có style sẵn: background + hover — override đổi background,
    // thêm mobile; hover của block phải còn nguyên (merge nông, không replace).
    const styled = blockDoc([
      { ...n('n_sec', 'demo/section'), style: { background: { color: '#fff' }, hover: { opacity: 0.8 } } },
    ]);
    const tree = n('fx-root', ROOT_TYPE, {}, [
      ref('n_a', 'styled', undefined, {
        n_sec: { background: { color: '#000' }, mobile: { spacing: { padding: '8px' } } },
      }),
      ref('n_b', 'styled'),
    ]);
    const out = expandBlocks(tree, { styled });
    expect(out.children[0]!.children[0]!.style).toEqual({
      background: { color: '#000' },
      hover: { opacity: 0.8 },
      mobile: { spacing: { padding: '8px' } },
    });
    // Instance khác + nguồn block giữ nguyên (không mutate).
    expect(out.children[1]!.children[0]!.style).toEqual({ background: { color: '#fff' }, hover: { opacity: 0.8 } });
    expect(styled.children[0]!.style).toEqual({ background: { color: '#fff' }, hover: { opacity: 0.8 } });
  });

  it('override style trên node CHƯA có style + đi cùng override settings', () => {
    const tree = n('fx-root', ROOT_TYPE, {}, [
      ref('n_a', 'card', { n_txt: { text: 'Xin chào' } }, { n_txt: { opacity: 0.5 } }),
    ]);
    const out = expandBlocks(tree, { card });
    const txt = out.children[0]!.children[0]!.children[0]!;
    expect(txt.settings).toEqual({ text: 'Xin chào' });
    expect(txt.style).toEqual({ opacity: 0.5 });
    // Node không bị override không mọc thêm field style.
    expect(out.children[0]!.children[0]!.style).toBeUndefined();
  });

  it('block mất → ref giữ nguyên (children rỗng), phần còn lại expand bình thường', () => {
    const tree = n('fx-root', ROOT_TYPE, {}, [ref('n_a', 'missing'), ref('n_b', 'card')]);
    const out = expandBlocks(tree, { card });
    expect(out.children[0]!.children).toEqual([]);
    expect(out.children[1]!.children).toHaveLength(1);
  });

  it('block lồng block: expand đệ quy, id prefix chồng cấp', () => {
    const inner = blockDoc([n('n_i', 'demo/text', { text: 'in' })]);
    const outer = blockDoc([n('n_wrap', 'demo/section', {}, [ref('n_iref', 'inner')])]);
    const tree = n('fx-root', ROOT_TYPE, {}, [ref('n_o', 'outer')]);
    const out = expandBlocks(tree, { inner, outer });
    const innerRef = out.children[0]!.children[0]!.children[0]!;
    expect(innerRef.id).toBe('n_o:n_iref');
    expect(innerRef.children[0]!.id).toBe('n_o:n_iref:n_i');
  });

  it('chống vòng: A→B→A dừng lại, không đệ quy vô hạn', () => {
    const a = blockDoc([n('n_a1', 'demo/section', {}, [ref('n_toB', 'b')])]);
    const b = blockDoc([n('n_b1', 'demo/section', {}, [ref('n_toA', 'a')])]);
    const tree = n('fx-root', ROOT_TYPE, {}, [ref('n_r', 'a')]);
    const out = expandBlocks(tree, { a, b });
    // a expand → b expand → ref về a bị chặn (children rỗng).
    const backRef = out.children[0]!.children[0]!.children[0]!.children[0]!.children[0]!;
    expect(backRef.settings['blockId']).toBe('a');
    expect(backRef.children).toEqual([]);
  });

  it('cây không có ref → trả về NGUYÊN reference (structural sharing)', () => {
    const tree = n('fx-root', ROOT_TYPE, {}, [n('n_x', 'demo/text', { text: 'x' })]);
    expect(expandBlocks(tree, { card })).toBe(tree);
  });

  it('renderDocument sau expand: nội dung block ra HTML, wrapper display:contents', () => {
    const registry = new ElementRegistry();
    registry.register({
      type: 'demo/text',
      title: 'Text',
      version: 1,
      schema: { text: { type: 'text', default: '' } },
      template: '<p>{{text}}</p>',
    });
    const tree = n('fx-root', ROOT_TYPE, {}, [ref('n_ref', 'note')]);
    const note = blockDoc([n('n_t', 'demo/text', { text: 'Nội dung block' })]);
    const { html, css } = renderDocument(expandBlocks(tree, { note }), registry);
    expect(html).toContain('<p>Nội dung block</p>');
    expect(html).toContain('data-fx="n_ref:n_t"');
    expect(css).toContain('[data-fx="n_ref"]{display:contents}');
  });

  it('renderDocument với style override: CSS scoped theo id namespace của instance', () => {
    const registry = new ElementRegistry();
    registry.register({
      type: 'demo/text',
      title: 'Text',
      version: 1,
      schema: { text: { type: 'text', default: '' } },
      template: '<p>{{text}}</p>',
    });
    const note = blockDoc([n('n_t', 'demo/text', { text: 'x' })]);
    const tree = n('fx-root', ROOT_TYPE, {}, [
      ref('n_a', 'note', undefined, { n_t: { background: { color: '#000' } } }),
      ref('n_b', 'note'),
    ]);
    const { css } = renderDocument(expandBlocks(tree, { note }), registry);
    expect(css).toContain('[data-fx="n_a:n_t"]{background-color:#000}');
    expect(css).not.toContain('[data-fx="n_b:n_t"]{background-color');
  });
});

describe('collectBlockRefs', () => {
  it('gom blockId unique, tìm sâu trong cây', () => {
    const tree = n('fx-root', ROOT_TYPE, {}, [
      n('n_s', 'demo/section', {}, [ref('n_1', 'card'), ref('n_2', 'hero')]),
      ref('n_3', 'card'),
    ]);
    expect(collectBlockRefs(tree)).toEqual(['card', 'hero']);
  });

  it('ref thiếu blockId bị bỏ qua', () => {
    const bad = n('n_bad', BLOCK_REF_TYPE, {});
    expect(collectBlockRefs(n('fx-root', ROOT_TYPE, {}, [bad]))).toEqual([]);
  });
});

describe('block usage / dependents (02 §H)', () => {
  const doc = (id: string, children: FlexaNode[]) => ({ id, tree: blockDoc(children) });

  it('buildBlockUsage: map blockId → documentId[] trực tiếp, thứ tự theo input', () => {
    const docs = [
      doc('page-1', [ref('n_1', 'block-a')]),
      doc('page-2', [ref('n_2', 'block-b'), ref('n_3', 'block-a')]),
      doc('page-3', []),
    ];
    expect(buildBlockUsage(docs)).toEqual({
      'block-a': ['page-1', 'page-2'],
      'block-b': ['page-2'],
    });
  });

  it('cùng block xuất hiện 2 lần trong một document → đếm MỘT lần', () => {
    const docs = [doc('page-1', [ref('n_1', 'block-a'), ref('n_2', 'block-a')])];
    expect(buildBlockUsage(docs)).toEqual({ 'block-a': ['page-1'] });
  });

  it('collectBlockDependents: transitive qua block lồng block (BFS)', () => {
    // block-outer nhúng block-inner; page-1 nhúng block-outer → đổi inner
    // phải render lại CẢ outer lẫn page-1.
    const usage = buildBlockUsage([
      doc('block-outer', [ref('n_1', 'block-inner')]),
      doc('page-1', [ref('n_2', 'block-outer')]),
    ]);
    expect(collectBlockDependents('block-inner', usage)).toEqual(['block-outer', 'page-1']);
  });

  it('chống vòng: A→B→A không lặp vô hạn, không lặp phần tử', () => {
    const usage = buildBlockUsage([
      doc('block-a', [ref('n_1', 'block-b')]),
      doc('block-b', [ref('n_2', 'block-a')]),
      doc('page-1', [ref('n_3', 'block-a')]),
    ]);
    // usage: block-b ← block-a(doc); block-a ← block-b(doc) + page-1.
    expect(collectBlockDependents('block-a', usage)).toEqual(['block-b', 'page-1']);
  });

  it('block không ai dùng → []', () => {
    const usage = buildBlockUsage([doc('page-1', [ref('n_1', 'block-a')])]);
    expect(collectBlockDependents('block-nobody', usage)).toEqual([]);
  });
});
