/**
 * Template interpreter — frozen engine #1.
 * Mustache logic-less. Canonical = mustache (TS); mirror = Mustache.php (Phase 4).
 * Template không được chứa logic — đó là guardrail, không phải hạn chế tạm.
 */

import Mustache from 'mustache';
import type { FlatProps } from '../types.js';

export function renderTemplate(template: string, props: FlatProps): string {
  // Tắt cache nội bộ theo template string là không cần — Mustache.render tự parse-cache.
  return Mustache.render(template, props);
}

/**
 * Kiểm tra template cho Tier 1: cấm {{{raw}}} và {{&raw}} trừ {{{children}}}
 * (children là HTML do chính engine sinh — nguồn tin cậy duy nhất).
 */
export function findForbiddenRawTags(template: string): string[] {
  const bad: string[] = [];
  const tripple = /\{\{\{\s*([^}\s]+)\s*\}\}\}/g;
  const amp = /\{\{\s*&\s*([^}\s]+)\s*\}\}/g;
  for (const re of [tripple, amp]) {
    let m: RegExpExecArray | null;
    while ((m = re.exec(template)) !== null) {
      const name = m[1] ?? '';
      if (name !== 'children') bad.push(name);
    }
  }
  return bad;
}
