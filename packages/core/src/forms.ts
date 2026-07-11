/**
 * Forms v1 — server contract (08 §3, 02 §N). Hai pipeline function thuần:
 * `collectFormFields` đọc spec form từ cây ĐÃ EXPAND, `validateSubmission`
 * re-validate payload phía server và trả error CODES (không message — i18n là
 * việc của host/init.js). PHP mirror ở Phase 4, khóa bằng parity `formvalidate/`.
 *
 * Logic thuần, không I/O, chỉ import types — đổi semantics là breaking contract.
 */

import type { FlexaNode, Json } from './types.js';

export const FORM_TYPE = 'flexa/form';

/** Tên hidden field honeypot trong template form (08 §3.4). */
export const FORM_HONEYPOT_NAME = '_fx_hp';

export type FormFieldKind = 'text' | 'email' | 'textarea' | 'select' | 'checkbox' | 'radio';

/**
 * Bảng ĐÓNG `node.type → validation kind` — pack test khóa hai chiều với
 * catalog `forms` (08 §3.1). Thêm field type mới = sửa bảng này + mirror PHP.
 */
export const FORM_FIELD_TYPES: Record<string, FormFieldKind> = {
  'flexa/form-text': 'text',
  'flexa/form-email': 'email',
  'flexa/form-textarea': 'textarea',
  'flexa/form-select': 'select',
  'flexa/form-checkbox': 'checkbox',
  'flexa/form-radio': 'radio',
  // Booking atoms (doc 21 §2 T1a): thu dưới kind 'text' — input type=date/time/
  // number là UX/validation phía client, server re-validate giá trị dạng chuỗi.
  'flexa/form-date': 'text',
  'flexa/form-time': 'text',
  'flexa/form-number': 'text',
};

export interface FormFieldSpec {
  name: string;
  kind: FormFieldKind;
  label: string;
  required: boolean;
  minLength?: number;
  maxLength?: number;
  options?: string[];
}

export interface FormSpec {
  id: string;
  honeypot: boolean;
  successMessage: string;
  redirectUrl: string;
  fields: FormFieldSpec[];
}

export type FormErrorCode = 'required' | 'email' | 'minLength' | 'maxLength' | 'option' | 'spam';

export interface FormValidationResult {
  ok: boolean;
  /** Chỉ field có trong spec — key lạ trong payload không bao giờ lọt vào đây. */
  values: Record<string, Json>;
  /** Thứ tự tất định: spam trước, rồi theo thứ tự field trong spec. */
  errors: Array<{ name: string; code: FormErrorCode }>;
}

function str(v: Json | undefined, fallback: string): string {
  return typeof v === 'string' ? v : fallback;
}

function bool(v: Json | undefined, fallback: boolean): boolean {
  return typeof v === 'boolean' ? v : fallback;
}

/** Length setting: chỉ nhận số nguyên DƯƠNG — 0/thiếu nghĩa là "không giới hạn". */
function lengthOf(v: Json | undefined): number | undefined {
  return typeof v === 'number' && Number.isInteger(v) && v > 0 ? v : undefined;
}

/** Repeater `{label, value}` → danh sách value (entry không phải object bị bỏ). */
function optionValues(v: Json | undefined): string[] {
  if (!Array.isArray(v)) return [];
  const out: string[] = [];
  for (const item of v) {
    if (typeof item === 'object' && item !== null && !Array.isArray(item)) {
      const value = item['value'];
      if (typeof value === 'string') out.push(value);
    }
  }
  return out;
}

function findNode(node: FlexaNode, id: string): FlexaNode | null {
  if (node.id === id) return node;
  for (const c of node.children) {
    const hit = findNode(c, id);
    if (hit) return hit;
  }
  return null;
}

/**
 * Duyệt cây ĐÃ EXPAND (expandBlocks + resolveDynamicTags — cùng đường render
 * page), tìm node form theo id, gom field spec theo TREE ORDER (depth-first).
 * Node thiếu / sai type → null (route trả 404). Field thiếu `name` bị bỏ;
 * duplicate `name` → spec ĐẦU TIÊN thắng (08 §3.2). Fallback khi thiếu setting
 * (document cũ): `required=false`, min/maxLength bỏ, `options=[]`.
 */
export function collectFormFields(tree: FlexaNode, formNodeId: string): FormSpec | null {
  const form = findNode(tree, formNodeId);
  if (!form || form.type !== FORM_TYPE) return null;

  const fields: FormFieldSpec[] = [];
  const seen = new Set<string>();
  const walk = (node: FlexaNode): void => {
    const kind = FORM_FIELD_TYPES[node.type];
    if (kind) {
      const name = str(node.settings['name'], '').trim();
      if (name !== '' && !seen.has(name)) {
        seen.add(name);
        const field: FormFieldSpec = {
          name,
          kind,
          label: str(node.settings['label'], ''),
          required: bool(node.settings['required'], false),
        };
        const minLength = lengthOf(node.settings['minLength']);
        if (minLength !== undefined) field.minLength = minLength;
        const maxLength = lengthOf(node.settings['maxLength']);
        if (maxLength !== undefined) field.maxLength = maxLength;
        if (kind === 'select' || kind === 'radio') {
          field.options = optionValues(node.settings['options']);
        }
        fields.push(field);
      }
    }
    for (const c of node.children) walk(c);
  };
  for (const c of form.children) walk(c);

  return {
    id: form.id,
    honeypot: bool(form.settings['honeypot'], true),
    successMessage: str(form.settings['successMessage'], ''),
    redirectUrl: str(form.settings['redirectUrl'], ''),
    fields,
  };
}

/**
 * Email regex của WHATWG HTML spec (input type=email) — NGUYÊN VĂN, không sửa:
 * deterministic và PCRE-portable, khớp validation native phía client.
 */
const EMAIL_RE =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

/** Đếm Unicode CODE POINTS (TS `[...v].length` ↔ PHP `mb_strlen`) — bẫy parity. */
function codePointLength(v: string): number {
  return [...v].length;
}

/** Lỗi ĐẦU TIÊN của một field theo thứ tự rule cố định; null = qua. */
function fieldError(field: FormFieldSpec, raw: string | undefined): FormErrorCode | null {
  if (field.kind === 'checkbox') {
    const checked = raw === '1' || raw === 'on';
    return field.required && !checked ? 'required' : null;
  }
  const v = raw ?? '';
  const trimmed = v.trim();
  if (trimmed === '') return field.required ? 'required' : null;
  if (field.kind === 'email' && !EMAIL_RE.test(trimmed)) return 'email';
  if (field.minLength !== undefined && codePointLength(v) < field.minLength) return 'minLength';
  if (field.maxLength !== undefined && codePointLength(v) > field.maxLength) return 'maxLength';
  if (
    (field.kind === 'select' || field.kind === 'radio') &&
    field.options !== undefined &&
    field.options.length > 0 &&
    !field.options.includes(v)
  ) {
    return 'option';
  }
  return null;
}

/**
 * Re-validate payload theo spec (08 §3.2 — semantics đã khóa):
 * - Honeypot dính bẫy → duy nhất MỘT error `spam`, `values` rỗng.
 * - `required` check sau TRIM; giá trị LƯU giữ nguyên không trim.
 * - Length đếm code points, email theo EMAIL_RE (cả hai chỉ check khi có giá trị).
 * - Checkbox coerce boolean ('1'/'on' → true); select/radio membership theo options.
 * - Tối đa MỘT error mỗi field, thứ tự theo spec.fields.
 */
export function validateSubmission(
  spec: Pick<FormSpec, 'honeypot' | 'fields'>,
  payload: Record<string, string>,
): FormValidationResult {
  if (spec.honeypot) {
    const hp = payload[FORM_HONEYPOT_NAME];
    if (typeof hp === 'string' && hp !== '') {
      return { ok: false, values: {}, errors: [{ name: FORM_HONEYPOT_NAME, code: 'spam' }] };
    }
  }

  const values: Record<string, Json> = {};
  const errors: Array<{ name: string; code: FormErrorCode }> = [];
  for (const field of spec.fields) {
    const raw = payload[field.name];
    values[field.name] = field.kind === 'checkbox' ? raw === '1' || raw === 'on' : (raw ?? '');
    const code = fieldError(field, raw);
    if (code) errors.push({ name: field.name, code });
  }
  return { ok: errors.length === 0, values, errors };
}
