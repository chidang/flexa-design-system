/**
 * Template matching — chọn template cho một ngữ cảnh render (02 §I).
 * Hàm thuần, không I/O: adapter dựng TemplateContext từ routing của nó
 * (Next: route segment; WP: template_include) và cung cấp danh sách rule;
 * core chỉ quyết "rule nào thắng". PHP mirror ở Phase 4 — hành vi khóa bằng
 * parity fixtures `templatematch/` nên tie-break phải TẤT ĐỊNH với mọi thứ
 * tự input.
 */

import type { FlexaDocument, Json } from './types.js';

/** Ngữ cảnh render hiện tại — adapter dựng từ routing. `type` là chuỗi MỞ
 *  (single/archive/search/404/header/footer…): bộ giá trị do adapter quyết,
 *  core chỉ so bằng với `rule.contextType`. */
export interface TemplateContext {
  type: string;
  /** Content type của entry/collection (vd. 'page', 'post', 'product'). */
  entryType?: string;
  /** Id entry cụ thể (ngữ cảnh single). */
  entryId?: string;
  /** Taxonomy term/collection slug mà ngữ cảnh thuộc về. */
  terms?: string[];
}

export type TemplateConditionScope = 'all' | 'entryType' | 'entry' | 'term';

/** Một dòng điều kiện của rule. Include (mặc định) mở rộng phạm vi theo OR;
 *  `exclude: true` loại ngữ cảnh khớp bất kể include. */
export interface TemplateCondition {
  scope: TemplateConditionScope;
  /** Bắt buộc với scope ≠ 'all' (entryType/entry id/term slug). */
  value?: string;
  exclude?: boolean;
}

export interface TemplateRule {
  documentId: string;
  contextType: string;
  conditions?: TemplateCondition[];
  priority?: number;
}

// Specificity của condition — include khớp càng hẹp càng thắng khi cùng
// priority ("Single — category Review" thắng "Single" chung).
const SPECIFICITY: Record<TemplateConditionScope, number> = {
  all: 0,
  entryType: 1,
  term: 2,
  entry: 3,
};

const SCOPES = new Set<string>(Object.keys(SPECIFICITY));

function conditionMatches(cond: TemplateCondition, ctx: TemplateContext): boolean {
  switch (cond.scope) {
    case 'all':
      return true;
    case 'entryType':
      return cond.value !== undefined && cond.value === ctx.entryType;
    case 'entry':
      return cond.value !== undefined && cond.value === ctx.entryId;
    case 'term':
      return cond.value !== undefined && (ctx.terms ?? []).includes(cond.value);
  }
}

/**
 * Chọn rule thắng cho ngữ cảnh, hoặc null nếu không rule nào khớp.
 * Khớp = đúng contextType + (không có include nào ⇒ khớp tất, hoặc ≥1 include
 * khớp — OR) + không exclude nào khớp. Thắng theo (priority giảm dần,
 * specificity giảm dần, documentId tăng dần) — tất định với mọi thứ tự input.
 */
export function matchTemplate(
  context: TemplateContext,
  rules: TemplateRule[],
): TemplateRule | null {
  let winner: { rule: TemplateRule; priority: number; specificity: number } | null = null;

  for (const rule of rules) {
    if (rule.contextType !== context.type) continue;
    const conditions = rule.conditions ?? [];
    const includes = conditions.filter((c) => !c.exclude);
    if (includes.length > 0 && !includes.some((c) => conditionMatches(c, context))) continue;
    if (conditions.some((c) => c.exclude && conditionMatches(c, context))) continue;

    const specificity = includes.reduce(
      (max, c) => (conditionMatches(c, context) ? Math.max(max, SPECIFICITY[c.scope]) : max),
      0,
    );
    const priority = rule.priority ?? 0;
    if (
      winner === null ||
      priority > winner.priority ||
      (priority === winner.priority && specificity > winner.specificity) ||
      (priority === winner.priority &&
        specificity === winner.specificity &&
        rule.documentId < winner.rule.documentId)
    ) {
      winner = { rule, priority, specificity };
    }
  }
  return winner?.rule ?? null;
}

/**
 * Rút TemplateRule từ document `kind: 'template'` — meta do CORE định nghĩa
 * (khác meta của page, nơi host tự do): `contextType` string (thiếu/rỗng →
 * template không active → null), `priority` number (khác → 0), `conditions`
 * mảng row `{scope, value, exclude}`. Row hỏng (scope lạ, hoặc scope ≠ 'all'
 * mà thiếu value) bị BỎ — rule còn lại vẫn chạy, không chặn cả template.
 */
export function parseTemplateRule(doc: FlexaDocument): TemplateRule | null {
  if (doc.kind !== 'template') return null;
  const meta = doc.meta ?? {};
  const contextType = meta['contextType'];
  if (typeof contextType !== 'string' || contextType === '') return null;

  const rawPriority = meta['priority'];
  const priority = typeof rawPriority === 'number' && Number.isFinite(rawPriority) ? rawPriority : 0;

  const conditions: TemplateCondition[] = [];
  const rawConditions = meta['conditions'];
  if (Array.isArray(rawConditions)) {
    for (const row of rawConditions as Json[]) {
      if (typeof row !== 'object' || row === null || Array.isArray(row)) continue;
      const scope = (row as Record<string, Json>)['scope'];
      const value = (row as Record<string, Json>)['value'];
      const exclude = (row as Record<string, Json>)['exclude'];
      if (typeof scope !== 'string' || !SCOPES.has(scope)) continue;
      if (scope !== 'all' && (typeof value !== 'string' || value === '')) continue;
      conditions.push({
        scope: scope as TemplateConditionScope,
        ...(typeof value === 'string' && value !== '' ? { value } : {}),
        ...(exclude === true ? { exclude: true } : {}),
      });
    }
  }

  return {
    documentId: doc.id,
    contextType,
    ...(conditions.length > 0 ? { conditions } : {}),
    ...(priority !== 0 ? { priority } : {}),
  };
}
