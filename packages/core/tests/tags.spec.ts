import { describe, expect, it } from 'vitest';
import {
  ElementRegistry,
  renderDocument,
  resolveDynamicTags,
  type FlexaNode,
  type Json,
  type Settings,
} from '../src/index.js';

function n(id: string, type: string, settings: Settings = {}, children: FlexaNode[] = []): FlexaNode {
  return { id, type, settings, children };
}

const ENTRY: Record<string, Json> = {
  entry: {
    id: 'about-us',
    title: 'Về chúng tôi',
    views: 42,
    published: true,
    field: { city: 'Đà Nẵng' },
    meta: null,
  },
};

describe('resolveDynamicTags', () => {
  it('thay tag trong settings string, giữ text xung quanh, nhiều tag một chuỗi', () => {
    const tree = n('a', 't', { text: 'Trang {{entry.title}} — id {{ entry.id }}' });
    const out = resolveDynamicTags(tree, ENTRY);
    expect(out.settings['text']).toBe('Trang Về chúng tôi — id about-us');
  });

  it('dot-path sâu + number/boolean stringify', () => {
    const tree = n('a', 't', {
      city: '{{entry.field.city}}',
      views: 'Lượt xem: {{entry.views}}',
      pub: '{{entry.published}}',
    });
    const out = resolveDynamicTags(tree, ENTRY);
    expect(out.settings).toEqual({ city: 'Đà Nẵng', views: 'Lượt xem: 42', pub: 'true' });
  });

  it('tag không resolve được → GIỮ NGUYÊN literal (namespace lạ, path đứt, non-scalar, null)', () => {
    const tree = n('a', 't', {
      other: '{{post.title}}', // namespace không có trong map
      broken: '{{entry.nope.x}}', // path đứt
      object: '{{entry.field}}', // trỏ vào object
      nil: '{{entry.meta}}', // null
    });
    const out = resolveDynamicTags(tree, ENTRY);
    expect(out.settings).toEqual({
      other: '{{post.title}}',
      broken: '{{entry.nope.x}}',
      object: '{{entry.field}}',
      nil: '{{entry.meta}}',
    });
  });

  it('resolve sâu vào settings lồng (repeater array + object)', () => {
    const tree = n('a', 't', {
      items: [{ title: '{{entry.title}}' }, { title: 'Tĩnh' }],
      cfg: { label: '{{entry.id}}' },
    });
    const out = resolveDynamicTags(tree, ENTRY);
    expect(out.settings['items']).toEqual([{ title: 'Về chúng tôi' }, { title: 'Tĩnh' }]);
    expect(out.settings['cfg']).toEqual({ label: 'about-us' });
  });

  it('structural sharing: cây không có tag → nguyên reference; nhánh không đổi giữ reference', () => {
    const plain = n('a', 't', { text: 'tĩnh' }, [n('b', 't', { x: 1 })]);
    expect(resolveDynamicTags(plain, ENTRY)).toBe(plain);
    // Map rỗng → shortcut, không duyệt.
    const tagged = n('a', 't', { text: '{{entry.title}}' });
    expect(resolveDynamicTags(tagged, {})).toBe(tagged);

    const mixed = n('root', 'r', {}, [
      n('keep', 't', { text: 'tĩnh' }),
      n('change', 't', { text: '{{entry.title}}' }),
    ]);
    const out = resolveDynamicTags(mixed, ENTRY);
    expect(out).not.toBe(mixed);
    expect(out.children[0]).toBe(mixed.children[0]);
    expect(out.children[1]).not.toBe(mixed.children[1]);
    // Nguồn không bị mutate.
    expect(mixed.children[1]!.settings['text']).toBe('{{entry.title}}');
  });

  it('giá trị entry chứa HTML vẫn bị Mustache escape lúc render (không mở lỗ raw)', () => {
    const registry = new ElementRegistry();
    registry.register({
      type: 'demo/text',
      title: 'Text',
      version: 1,
      schema: { text: { type: 'text', default: '' } },
      template: '<p>{{text}}</p>',
    });
    const tree = n('a', 'demo/text', { text: '{{entry.title}}' });
    const resolved = resolveDynamicTags(tree, { entry: { title: '<b>XSS</b>' } });
    const { html } = renderDocument(resolved, registry);
    expect(html).toContain('&lt;b&gt;XSS&lt;&#x2F;b&gt;');
    expect(html).not.toContain('<b>XSS</b>');
  });
});
