/**
 * Forms v1 server contract (08 §3) — collectFormFields + validateSubmission.
 * Semantics ở đây là CONTRACT parity (mirror PHP Phase 4): đổi hành vi phải
 * đổi cả spec 08 lẫn fixtures `formvalidate/`.
 */

import { describe, expect, it } from 'vitest';
import {
  collectFormFields,
  expandBlocks,
  validateSubmission,
  FORM_TYPE,
  ROOT_ID,
  ROOT_TYPE,
  type FlexaNode,
  type FormSpec,
  type Settings,
} from '../src/index.js';

function n(id: string, type: string, settings: Settings = {}, children: FlexaNode[] = []): FlexaNode {
  return { id, type, settings, children };
}

function form(id: string, settings: Settings, children: FlexaNode[]): FlexaNode {
  return n(id, FORM_TYPE, settings, children);
}

/** Contact form chuẩn: name + email + message + submit, có honeypot mặc định. */
const contact = form(
  'n_form',
  { successMessage: 'Thanks!', redirectUrl: '/thanks' },
  [
    n('n_name', 'flexa/form-text', { label: 'Name', name: 'name', required: true, minLength: 2 }),
    n('n_email', 'flexa/form-email', { label: 'Email', name: 'email', required: true }),
    n('n_msg', 'flexa/form-textarea', { label: 'Message', name: 'message', maxLength: 10 }),
    n('n_send', 'flexa/form-submit', { text: 'Send' }),
  ],
);

const tree = n(ROOT_ID, ROOT_TYPE, {}, [contact]);

describe('collectFormFields', () => {
  it('gom field theo tree order, đọc settings form, bỏ qua submit', () => {
    const spec = collectFormFields(tree, 'n_form');
    expect(spec).toEqual({
      id: 'n_form',
      honeypot: true, // default khi thiếu setting
      successMessage: 'Thanks!',
      redirectUrl: '/thanks',
      fields: [
        { name: 'name', kind: 'text', label: 'Name', required: true, minLength: 2 },
        { name: 'email', kind: 'email', label: 'Email', required: true },
        { name: 'message', kind: 'textarea', label: 'Message', required: false, maxLength: 10 },
      ],
    } satisfies FormSpec);
  });

  it('field lồng sâu trong layout (Column trong form) vẫn được gom, field NGOÀI form bị loại', () => {
    const t = n(ROOT_ID, ROOT_TYPE, {}, [
      n('n_out', 'flexa/form-text', { name: 'outside' }),
      form('n_f', {}, [
        n('n_row', 'demo/row', {}, [
          n('n_col', 'demo/column', {}, [n('n_deep', 'flexa/form-text', { name: 'deep' })]),
        ]),
      ]),
    ]);
    const spec = collectFormFields(t, 'n_f');
    expect(spec?.fields.map((f) => f.name)).toEqual(['deep']);
  });

  it('node thiếu hoặc sai type → null (route trả 404)', () => {
    expect(collectFormFields(tree, 'n_missing')).toBeNull();
    expect(collectFormFields(tree, 'n_name')).toBeNull(); // field, không phải form
  });

  it('duplicate name: spec ĐẦU TIÊN thắng; field thiếu name bị bỏ', () => {
    const t = n(ROOT_ID, ROOT_TYPE, {}, [
      form('n_f', {}, [
        n('n_a', 'flexa/form-text', { name: 'x', label: 'First' }),
        n('n_b', 'flexa/form-email', { name: 'x', label: 'Second' }),
        n('n_c', 'flexa/form-text', {}), // không name → bỏ
        n('n_d', 'flexa/form-text', { name: '  ' }), // name trắng → bỏ
      ]),
    ]);
    const spec = collectFormFields(t, 'n_f');
    expect(spec?.fields).toHaveLength(1);
    expect(spec?.fields[0]).toMatchObject({ name: 'x', kind: 'text', label: 'First' });
  });

  it('fallback document cũ: required=false, min/maxLength bỏ (kể cả 0), options=[]', () => {
    const t = n(ROOT_ID, ROOT_TYPE, {}, [
      form('n_f', {}, [
        n('n_t', 'flexa/form-text', { name: 't', minLength: 0, maxLength: 0 }),
        n('n_s', 'flexa/form-select', { name: 's' }),
      ]),
    ]);
    const spec = collectFormFields(t, 'n_f');
    expect(spec?.fields[0]).toEqual({ name: 't', kind: 'text', label: '', required: false });
    expect(spec?.fields[1]).toEqual({
      name: 's',
      kind: 'select',
      label: '',
      required: false,
      options: [],
    });
  });

  it('options: repeater {label, value} → chỉ lấy value; entry hỏng bị bỏ', () => {
    const t = n(ROOT_ID, ROOT_TYPE, {}, [
      form('n_f', {}, [
        n('n_s', 'flexa/form-radio', {
          name: 'plan',
          options: [{ label: 'Basic', value: 'basic' }, { label: 'Pro', value: 'pro' }, 'junk'],
        }),
      ]),
    ]);
    expect(collectFormFields(t, 'n_f')?.fields[0]?.options).toEqual(['basic', 'pro']);
  });

  it('form trong synced block: tìm theo id namespace sau expandBlocks', () => {
    const block = n(ROOT_ID, ROOT_TYPE, {}, [
      form('n_f', { successMessage: 'ok' }, [n('n_e', 'flexa/form-email', { name: 'email' })]),
    ]);
    const page = n(ROOT_ID, ROOT_TYPE, {}, [
      n('n_ref', 'flexa/block-ref', { blockId: 'cta' }),
    ]);
    const expanded = expandBlocks(page, { cta: block });
    const spec = collectFormFields(expanded, 'n_ref:n_f');
    expect(spec?.id).toBe('n_ref:n_f');
    expect(spec?.fields.map((f) => f.name)).toEqual(['email']);
  });
});

describe('validateSubmission', () => {
  const spec = collectFormFields(tree, 'n_form')!;

  it('payload hợp lệ: ok=true, values giữ nguyên KHÔNG trim, key lạ bị bỏ', () => {
    const r = validateSubmission(spec, {
      name: '  An  ',
      email: 'an@example.com',
      message: 'hi',
      hack: 'ignored',
    });
    expect(r).toEqual({
      ok: true,
      values: { name: '  An  ', email: 'an@example.com', message: 'hi' },
      errors: [],
    });
  });

  it('required: rỗng sau trim = thiếu; field vắng trong payload cũng là thiếu', () => {
    const r = validateSubmission(spec, { name: '   ', message: '' });
    expect(r.ok).toBe(false);
    expect(r.errors).toEqual([
      { name: 'name', code: 'required' },
      { name: 'email', code: 'required' },
    ]);
    expect(r.values).toEqual({ name: '   ', email: '', message: '' });
  });

  it('email: regex WHATWG, chỉ check khi có giá trị', () => {
    const bad = validateSubmission(spec, { name: 'An', email: 'not-an-email' });
    expect(bad.errors).toEqual([{ name: 'email', code: 'email' }]);
    const ok = validateSubmission(spec, { name: 'An', email: 'a.b+c@sub.example.co' });
    expect(ok.ok).toBe(true);
  });

  it('length đếm CODE POINTS (multibyte không bị đếm đôi như UTF-16 units)', () => {
    // '𝒜' (U+1D49C) = 2 UTF-16 units nhưng 1 code point.
    const one = validateSubmission(spec, { name: '𝒜', email: 'a@b.co' });
    expect(one.errors).toEqual([{ name: 'name', code: 'minLength' }]);
    const two = validateSubmission(spec, { name: '𝒜𝒜', email: 'a@b.co' });
    expect(two.ok).toBe(true);
    // maxLength 10: '💜'.repeat(11) = 22 UTF-16 units, 11 code points → fail đúng.
    const over = validateSubmission(spec, { name: 'An', email: 'a@b.co', message: '💜'.repeat(11) });
    expect(over.errors).toEqual([{ name: 'message', code: 'maxLength' }]);
    expect(validateSubmission(spec, { name: 'An', email: 'a@b.co', message: '💜'.repeat(10) }).ok).toBe(true);
  });

  it('select/radio: membership theo options khi non-empty; rỗng qua nếu không required', () => {
    const s: Pick<FormSpec, 'honeypot' | 'fields'> = {
      honeypot: false,
      fields: [
        { name: 'plan', kind: 'select', label: '', required: false, options: ['basic', 'pro'] },
        { name: 'free', kind: 'radio', label: '', required: false, options: [] },
      ],
    };
    expect(validateSubmission(s, { plan: 'hacked' }).errors).toEqual([
      { name: 'plan', code: 'option' },
    ]);
    expect(validateSubmission(s, { plan: 'pro' }).ok).toBe(true);
    expect(validateSubmission(s, {}).ok).toBe(true); // rỗng, không required
    expect(validateSubmission(s, { free: 'anything' }).ok).toBe(true); // options=[] → bỏ check
  });

  it('checkbox: coerce boolean; required mà false → required', () => {
    const s: Pick<FormSpec, 'honeypot' | 'fields'> = {
      honeypot: false,
      fields: [{ name: 'agree', kind: 'checkbox', label: '', required: true }],
    };
    expect(validateSubmission(s, { agree: '1' })).toEqual({
      ok: true,
      values: { agree: true },
      errors: [],
    });
    expect(validateSubmission(s, { agree: 'on' }).values['agree']).toBe(true);
    const missing = validateSubmission(s, {});
    expect(missing.values['agree']).toBe(false);
    expect(missing.errors).toEqual([{ name: 'agree', code: 'required' }]);
  });

  it('honeypot: dính bẫy → MỘT error spam duy nhất, values rỗng; tắt thì bỏ qua', () => {
    const spammed = validateSubmission(spec, { name: '', email: 'x', _fx_hp: 'bot' });
    expect(spammed).toEqual({
      ok: false,
      values: {},
      errors: [{ name: '_fx_hp', code: 'spam' }],
    });
    // _fx_hp rỗng/vắng → validate bình thường.
    expect(validateSubmission(spec, { name: 'An', email: 'a@b.co', _fx_hp: '' }).ok).toBe(true);
    // honeypot=false → payload có _fx_hp vẫn không bị coi là spam.
    const off = validateSubmission({ ...spec, honeypot: false }, {
      name: 'An',
      email: 'a@b.co',
      _fx_hp: 'bot',
    });
    expect(off.ok).toBe(true);
    expect(off.values).not.toHaveProperty('_fx_hp');
  });

  it('thứ tự errors tất định theo thứ tự field trong spec, tối đa một error mỗi field', () => {
    const r = validateSubmission(spec, { name: 'A', email: 'bad', message: 'x'.repeat(11) });
    expect(r.errors).toEqual([
      { name: 'name', code: 'minLength' },
      { name: 'email', code: 'email' },
      { name: 'message', code: 'maxLength' },
    ]);
  });
});
