/**
 * Formatter library — tập ĐÓNG, NHỎ, ĐÓNG BĂNG (frozen engine #4).
 *
 * Cố ý KHÔNG dùng Intl/ICU: hành vi phải data-driven và tự định nghĩa để mirror
 * engine (PHP) khớp được từng ký tự và không lệch theo version ICU của môi trường.
 * Thay đổi bất kỳ hành vi nào ở đây phải kèm fixture parity (06-parity-harness.md).
 */

export type FormatterFn = (value: unknown, arg?: unknown) => string;

interface CurrencyCfg {
  symbol: string;
  decimals: number;
  thousand: string;
  decimal: string;
  position: 'before' | 'after';
  space?: boolean;
}

// Bản trình bày cố định per-currency (quyết định đóng băng — không theo locale hệ thống).
const CURRENCIES: Record<string, CurrencyCfg> = {
  USD: { symbol: '$', decimals: 2, thousand: ',', decimal: '.', position: 'before' },
  EUR: { symbol: '€', decimals: 2, thousand: '.', decimal: ',', position: 'after', space: true },
  VND: { symbol: '₫', decimals: 0, thousand: '.', decimal: ',', position: 'after', space: true },
};

function groupDigits(intPart: string, sep: string): string {
  return intPart.replace(/\B(?=(\d{3})+(?!\d))/g, sep);
}

/** Làm tròn half-up theo độ lớn (quy tắc đã chốt — mirror PHP phải cùng quy tắc). */
function toFixedHalfUp(abs: number, decimals: number): string {
  const f = 10 ** decimals;
  return (Math.round(abs * f) / f).toFixed(decimals);
}

const currency: FormatterFn = (value, arg) => {
  const num = Number(value);
  if (!Number.isFinite(num)) return '';
  const cfg = CURRENCIES[String(arg ?? 'USD')] ?? CURRENCIES['USD']!;
  const fixed = toFixedHalfUp(Math.abs(num), cfg.decimals);
  const [intPart = '0', fracPart] = fixed.split('.');
  let out = groupDigits(intPart, cfg.thousand) + (fracPart ? cfg.decimal + fracPart : '');
  out =
    cfg.position === 'before'
      ? cfg.symbol + out
      : out + (cfg.space ? ' ' : '') + cfg.symbol;
  return (num < 0 ? '-' : '') + out;
};

const number: FormatterFn = (value, arg) => {
  const num = Number(value);
  if (!Number.isFinite(num)) return '';
  if (arg === undefined || arg === null) return String(num);
  const decimals = Math.max(0, Math.trunc(Number(arg)));
  return (num < 0 ? '-' : '') + toFixedHalfUp(Math.abs(num), decimals);
};

function pad2(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

/**
 * Input là ISO 8601; format tokens: YYYY MM DD HH mm ss. Tính theo UTC —
 * timezone hiển thị là việc của data provider (pin tz trong fixture).
 */
const date: FormatterFn = (value, arg) => {
  const d = new Date(String(value));
  if (Number.isNaN(d.getTime())) return '';
  const fmt = String(arg ?? 'YYYY-MM-DD');
  return fmt
    .replace(/YYYY/g, String(d.getUTCFullYear()))
    .replace(/MM/g, pad2(d.getUTCMonth() + 1))
    .replace(/DD/g, pad2(d.getUTCDate()))
    .replace(/HH/g, pad2(d.getUTCHours()))
    .replace(/mm/g, pad2(d.getUTCMinutes()))
    .replace(/ss/g, pad2(d.getUTCSeconds()));
};

interface TruncateArg {
  length?: number;
  mode?: 'char' | 'word';
  ellipsis?: string;
}

const truncate: FormatterFn = (value, arg) => {
  const str = String(value ?? '');
  const cfg: TruncateArg = typeof arg === 'number' ? { length: arg } : ((arg ?? {}) as TruncateArg);
  const length = cfg.length ?? 100;
  const ellipsis = cfg.ellipsis ?? '…';
  // Đếm theo code point để không cắt đôi ký tự đa byte/emoji.
  const chars = Array.from(str);
  if (chars.length <= length) return str;
  let cut = chars.slice(0, length).join('');
  if (cfg.mode === 'word') {
    const lastSpace = cut.lastIndexOf(' ');
    if (lastSpace > 0) cut = cut.slice(0, lastSpace);
  }
  return cut + ellipsis;
};

const uppercase: FormatterFn = (value) => String(value ?? '').toUpperCase();
const lowercase: FormatterFn = (value) => String(value ?? '').toLowerCase();

export const FORMATTERS: Readonly<Record<string, FormatterFn>> = Object.freeze({
  currency,
  date,
  number,
  truncate,
  uppercase,
  lowercase,
});

export const FORMATTER_NAMES = Object.keys(FORMATTERS);

/**
 * Custom formatters — the GATED extension point (Phase 5).
 *
 * The frozen set above stays closed: AI and Tier-1 elements can only reference
 * those names. A HOST (a WP plugin, a Next app) may register extra formatters at
 * boot for its own hand-authored elements. The gate is threefold:
 *   1. A custom name may not shadow a frozen name (determinism of built-ins).
 *   2. It must be registered on BOTH runtimes (this TS + the PHP mirror) — the
 *      parity harness proves they match character-for-character.
 *   3. It is only known where registered. The CLI / AI generation path boots no
 *      host, so `hasFormatter` there sees the frozen set only and rejects custom
 *      names — AI can never lean on a host-specific formatter.
 */
const NAME_RE = /^[a-z][a-zA-Z0-9]*$/;
const customFormatters = new Map<string, FormatterFn>();

export function registerFormatter(name: string, fn: FormatterFn): void {
  if (!NAME_RE.test(name)) {
    throw new Error(`Invalid formatter name "${name}" — must match ${NAME_RE.source}`);
  }
  if (name in FORMATTERS) {
    throw new Error(`Cannot override built-in formatter "${name}"`);
  }
  if (customFormatters.has(name)) {
    throw new Error(`Formatter "${name}" is already registered`);
  }
  customFormatters.set(name, fn);
}

/** Frozen first, then custom — built-ins can never be shadowed. */
export function getFormatter(name: string): FormatterFn | undefined {
  return FORMATTERS[name] ?? customFormatters.get(name);
}

export function hasFormatter(name: string): boolean {
  return name in FORMATTERS || customFormatters.has(name);
}

/** All known names (frozen + custom) — for validation error messaging. */
export function listFormatters(): string[] {
  return [...FORMATTER_NAMES, ...customFormatters.keys()];
}

/** Drop all custom registrations. For host teardown and test isolation only. */
export function clearCustomFormatters(): void {
  customFormatters.clear();
}
