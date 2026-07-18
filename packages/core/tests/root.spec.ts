import { describe, expect, it } from 'vitest';
import {
  ElementRegistry,
  ensureRootTree,
  renderDocument,
  ROOT_ID,
  ROOT_TYPE,
  type FlexaNode,
} from '../src/index.js';

describe('flexa/root — root wrapper của document', () => {
  it('registry mới tự có flexa/root; đăng ký lại type này bị chặn', () => {
    const r = new ElementRegistry();
    expect(r.get(ROOT_TYPE)).toBeDefined();
    expect(() =>
      r.register({ type: ROOT_TYPE, title: 'Fake', version: 1, schema: {}, template: '<div></div>' }),
    ).toThrow(/must be unique/);
  });

  it('render root = MỘT thẻ div wrapper bao children, không markup thừa', () => {
    const r = new ElementRegistry();
    r.register({
      type: 'acme/text',
      title: 'Text',
      version: 1,
      schema: { text: { type: 'text', default: '' } },
      template: '<p>{{text}}</p>',
    });
    const tree: FlexaNode = {
      id: 'root1',
      type: ROOT_TYPE,
      settings: {},
      children: [{ id: 'a', type: 'acme/text', settings: { text: 'hi' }, children: [] }],
    };
    const { html } = renderDocument(tree, r);
    expect(html).toBe(
      '<div class="fx" data-fx="root1" data-fx-type="flexa/root">' +
        '<div class="fx" data-fx="a" data-fx-type="acme/text"><p>hi</p></div>' +
        '</div>',
    );
  });

  it('ensureRootTree bọc document cũ (root là element) và idempotent', () => {
    const old: FlexaNode = { id: 'n1', type: 'acme/section', settings: {}, children: [] };
    const wrapped = ensureRootTree(old);
    expect(wrapped.type).toBe(ROOT_TYPE);
    expect(wrapped.id).toBe(ROOT_ID);
    expect(wrapped.children).toEqual([old]);
    // Đã đúng root type → trả nguyên reference (không bọc lần hai).
    expect(ensureRootTree(wrapped)).toBe(wrapped);
  });
});
