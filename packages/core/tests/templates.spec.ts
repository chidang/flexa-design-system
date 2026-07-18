/**
 * Template matching (02 §I) — thuật toán chọn rule + parse meta từ document
 * kind 'template'. Tie-break phải TẤT ĐỊNH (priority → specificity →
 * documentId) với mọi thứ tự input — hành vi này PHP mirror ở Phase 4.
 */

import { describe, expect, it } from 'vitest';
import {
  emptyRootTree,
  matchTemplate,
  parseTemplateRule,
  type FlexaDocument,
  type TemplateContext,
  type TemplateRule,
} from '../src/index.js';

const rule = (documentId: string, extra: Partial<TemplateRule> = {}): TemplateRule => ({
  documentId,
  contextType: 'single',
  ...extra,
});

const ctx = (extra: Partial<TemplateContext> = {}): TemplateContext => ({
  type: 'single',
  entryType: 'page',
  entryId: 'about-us',
  terms: ['news'],
  ...extra,
});

describe('matchTemplate', () => {
  it('filters by contextType; no conditions matches every context of that type', () => {
    const rules = [rule('a'), rule('b', { contextType: 'archive' })];
    expect(matchTemplate(ctx(), rules)?.documentId).toBe('a');
    expect(matchTemplate(ctx({ type: 'archive' }), rules)?.documentId).toBe('b');
    expect(matchTemplate(ctx({ type: '404' }), rules)).toBeNull();
  });

  it('includes are OR — one matching include is enough', () => {
    const r = rule('a', {
      conditions: [
        { scope: 'entryType', value: 'product' },
        { scope: 'term', value: 'news' },
      ],
    });
    expect(matchTemplate(ctx(), [r])?.documentId).toBe('a');
    expect(matchTemplate(ctx({ terms: [] }), [r])).toBeNull();
  });

  it('exclude wins over include', () => {
    const r = rule('a', {
      conditions: [
        { scope: 'entryType', value: 'page' },
        { scope: 'entry', value: 'about-us', exclude: true },
      ],
    });
    expect(matchTemplate(ctx(), [r])).toBeNull();
    expect(matchTemplate(ctx({ entryId: 'other' }), [r])?.documentId).toBe('a');
  });

  it('higher priority wins regardless of specificity', () => {
    const rules = [
      rule('specific', { conditions: [{ scope: 'entry', value: 'about-us' }] }),
      rule('generic', { priority: 10 }),
    ];
    expect(matchTemplate(ctx(), rules)?.documentId).toBe('generic');
  });

  it('same priority → specificity of the MATCHED include breaks the tie (entry > term > entryType > all)', () => {
    const all = rule('t-all');
    const byType = rule('t-type', { conditions: [{ scope: 'entryType', value: 'page' }] });
    const byTerm = rule('t-term', { conditions: [{ scope: 'term', value: 'news' }] });
    const byEntry = rule('t-entry', { conditions: [{ scope: 'entry', value: 'about-us' }] });
    expect(matchTemplate(ctx(), [all, byType, byTerm, byEntry])?.documentId).toBe('t-entry');
    expect(matchTemplate(ctx({ entryId: 'x' }), [all, byType, byTerm, byEntry])?.documentId).toBe('t-term');
    expect(matchTemplate(ctx({ entryId: 'x', terms: [] }), [all, byType, byTerm])?.documentId).toBe('t-type');
    // Include KHÔNG khớp không được cộng specificity (chỉ include đã khớp mới tính).
    const mixed = rule('t-mixed', {
      conditions: [
        { scope: 'entry', value: 'other' },
        { scope: 'entryType', value: 'page' },
      ],
    });
    // include 'entry' không khớp → specificity của t-mixed vẫn là 1 (bằng t-type)
    // → rơi về documentId asc: 't-mixed' < 't-type'.
    expect(matchTemplate(ctx({ entryId: 'x', terms: [] }), [byType, mixed])?.documentId).toBe('t-mixed');
  });

  it('full tie → documentId ascending, independent of input order', () => {
    const a = rule('alpha');
    const b = rule('beta');
    expect(matchTemplate(ctx(), [b, a])?.documentId).toBe('alpha');
    expect(matchTemplate(ctx(), [a, b])?.documentId).toBe('alpha');
  });

  it('term matches via ctx.terms membership; missing terms → no match', () => {
    const r = rule('a', { conditions: [{ scope: 'term', value: 'news' }] });
    expect(matchTemplate(ctx({ terms: ['blog', 'news'] }), [r])?.documentId).toBe('a');
    expect(matchTemplate(ctx({ terms: undefined }), [r])).toBeNull();
  });
});

describe('parseTemplateRule', () => {
  const doc = (meta: FlexaDocument['meta'], kind: FlexaDocument['kind'] = 'template'): FlexaDocument => ({
    id: 'tpl-1',
    kind,
    title: 'T',
    tree: emptyRootTree(),
    version: 1,
    meta,
  });

  it('non-template kind or missing/empty contextType → null (inactive)', () => {
    expect(parseTemplateRule(doc({ contextType: 'single' }, 'page'))).toBeNull();
    expect(parseTemplateRule(doc({}))).toBeNull();
    expect(parseTemplateRule(doc({ contextType: '' }))).toBeNull();
    expect(parseTemplateRule(doc(undefined))).toBeNull();
  });

  it('parses contextType/priority/conditions; non-number priority → 0 (omitted)', () => {
    const r = parseTemplateRule(
      doc({
        contextType: 'single',
        priority: 5,
        conditions: [{ scope: 'entryType', value: 'page', exclude: false }],
      }),
    );
    expect(r).toEqual({
      documentId: 'tpl-1',
      contextType: 'single',
      priority: 5,
      conditions: [{ scope: 'entryType', value: 'page' }],
    });
    const noPrio = parseTemplateRule(doc({ contextType: 'single', priority: 'high' }));
    expect(noPrio).toEqual({ documentId: 'tpl-1', contextType: 'single' });
  });

  it('drops malformed condition rows, keeps valid ones', () => {
    const r = parseTemplateRule(
      doc({
        contextType: 'archive',
        conditions: [
          { scope: 'weird', value: 'x' }, // scope lạ
          { scope: 'entry' }, // thiếu value với scope ≠ all
          { scope: 'term', value: '' }, // value rỗng
          'not-an-object',
          { scope: 'all' },
          { scope: 'entry', value: 'post-9', exclude: true },
        ],
      }),
    );
    expect(r?.conditions).toEqual([
      { scope: 'all' },
      { scope: 'entry', value: 'post-9', exclude: true },
    ]);
  });
});
