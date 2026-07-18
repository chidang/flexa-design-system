'use client';
/**
 * FxCurrencyInput — money entry extending FxNumberInput (doc 04 §2.7).
 *
 * The public value is `Money` (integer MINOR units, §1.9 / doc 09); the component
 * owns the display ↔ minor-units conversion. `currency` (ISO-4217) drives the
 * symbol affix and minor-unit precision (JPY = 0, most = 2). No steppers by
 * default. Formatting (grouping / decimals) happens on blur; a paste of a
 * formatted string ("1,234.50", "$1 234,50") is parsed locale-aware, and an
 * unparseable paste is silently rejected (input unchanged). Controlled /
 * uncontrolled per §1.5.
 */
import { useId, useRef, useState } from 'react';
import type { InputHTMLAttributes, KeyboardEvent } from 'react';
import type { Size } from '../enums';

/** A monetary amount in integer minor units of `currency` (§1.9, doc 09). */
export interface Money {
  /** Integer minor units (e.g. cents). `1234` USD = $12.34. */
  amount: number;
  /** ISO-4217 code, e.g. `USD`. */
  currency: string;
}

/** `{ source }` meta accompanying every value change (doc 04 §1.6). */
export interface CurrencyChangeMeta {
  source: 'input' | 'clear';
}

type NativeInputProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'className' | 'value' | 'defaultValue' | 'size' | 'type' | 'prefix' | 'onChange' | 'min' | 'max' | 'step'
>;

export interface FxCurrencyInputProps extends NativeInputProps {
  /** Controlled value; `null` = empty (§1.5). */
  value?: Money | null;
  /** Uncontrolled initial value. Defaults to `null`. */
  defaultValue?: Money | null;
  /** ISO-4217 code — drives symbol affix + minor-unit precision. Required. */
  currency: string;
  /** Affix rendering: the currency symbol or its code. Defaults to `symbol`. */
  currencyDisplay?: 'symbol' | 'code';
  /** Grouping / decimal locale. Defaults to the runtime env locale. */
  locale?: string;
  /** Permit values below zero. Defaults to `false`. */
  allowNegative?: boolean;
  /** Control height. Defaults to `md`. */
  size?: Size;
  /** `.is-invalid` + `aria-invalid`. */
  invalid?: boolean;
  /** Focusable, value not editable. */
  readOnly?: boolean;
  /** Called on commit with `amount` always integer minor units. */
  onChange?: (value: Money | null, meta: CurrencyChangeMeta) => void;
  className?: string;
}

/** Minor-unit exponent per ISO-4217 (only the zero/three-digit exceptions). */
const ZERO_DECIMAL = new Set(['JPY', 'KRW', 'VND', 'CLP', 'ISK', 'HUF', 'XAF', 'XOF', 'PYG', 'RWF', 'UGX', 'VUV']);
const THREE_DECIMAL = new Set(['BHD', 'IQD', 'JOD', 'KWD', 'LYD', 'OMR', 'TND']);

const minorDigits = (currency: string): number => {
  const c = currency.toUpperCase();
  if (ZERO_DECIMAL.has(c)) return 0;
  if (THREE_DECIMAL.has(c)) return 3;
  return 2;
};

const symbolFor = (currency: string, currencyDisplay: 'symbol' | 'code', locale?: string): string => {
  if (currencyDisplay === 'code') return currency.toUpperCase();
  try {
    const parts = new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      currencyDisplay: 'symbol',
    }).formatToParts(0);
    const sym = parts.find((p) => p.type === 'currency');
    return sym?.value ?? currency.toUpperCase();
  } catch {
    return currency.toUpperCase();
  }
};

const minorToMajor = (amount: number, digits: number): number => amount / 10 ** digits;

/** Format minor units for display (grouped, fixed decimals). */
const formatMoney = (amount: number, currency: string, locale: string | undefined, digits: number): string => {
  const major = minorToMajor(amount, digits);
  try {
    return new Intl.NumberFormat(locale, {
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
      useGrouping: true,
    }).format(major);
  } catch {
    return major.toFixed(digits);
  }
};

/**
 * Parse a possibly-formatted string to major-unit number, locale-tolerant.
 * Strips currency symbols/spaces; treats the LAST separator group as decimal.
 * Returns `null` when nothing numeric remains.
 */
const parseAmount = (text: string): number | null => {
  let s = text.replace(/[^\d.,-]/g, '').trim();
  if (s === '' || s === '-') return null;
  const neg = s.startsWith('-');
  s = s.replace(/-/g, '');
  const lastComma = s.lastIndexOf(',');
  const lastDot = s.lastIndexOf('.');
  const decimalSep = lastComma > lastDot ? ',' : lastDot > lastComma ? '.' : '';
  let normalized: string;
  if (decimalSep === '') {
    normalized = s.replace(/[.,]/g, '');
  } else {
    const groupSep = decimalSep === ',' ? '.' : ',';
    normalized = s.split(groupSep).join('').replace(decimalSep, '.');
  }
  const n = Number(normalized);
  if (!Number.isFinite(n)) return null;
  return neg ? -n : n;
};

const majorToMinor = (major: number, digits: number): number => Math.round(major * 10 ** digits);

export function FxCurrencyInput({
  value,
  defaultValue = null,
  currency,
  currencyDisplay = 'symbol',
  locale,
  allowNegative = false,
  size = 'md',
  invalid = false,
  readOnly = false,
  disabled,
  onChange,
  onFocus,
  onBlur,
  id,
  className,
  ...rest
}: FxCurrencyInputProps) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const inputRef = useRef<HTMLInputElement>(null);
  const [focused, setFocused] = useState(false);
  const digits = minorDigits(currency);

  const controlled = value !== undefined;
  const initialText = defaultValue == null ? '' : formatMoney(defaultValue.amount, currency, locale, digits);
  const [internal, setInternal] = useState<Money | null>(defaultValue);
  const [text, setText] = useState(initialText);

  const currentMoney = controlled ? (value ?? null) : internal;
  const formatted = currentMoney == null ? '' : formatMoney(currentMoney.amount, currency, locale, digits);
  // While editing, show raw text; otherwise the grouped/formatted value.
  const display = focused ? text : formatted;

  const clampNeg = (amount: number): number => (!allowNegative && amount < 0 ? 0 : amount);

  const commit = (raw: string) => {
    const major = parseAmount(raw);
    // Unparseable non-empty paste/typing is silently rejected (input unchanged).
    if (major === null && raw.trim() !== '') return;
    const money: Money | null = major === null ? null : { amount: clampNeg(majorToMinor(major, digits)), currency };
    if (!controlled) {
      setInternal(money);
      setText(money == null ? '' : formatMoney(money.amount, currency, locale, digits));
    }
    onChange?.(money, { source: 'input' });
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') commit(text);
  };

  const symbol = symbolFor(currency, currencyDisplay, locale);
  const rootClass = ['fx-currency-input', className].filter(Boolean).join(' ');

  return (
    <div
      className={rootClass}
      data-size={size}
      data-invalid={invalid || undefined}
      data-disabled={disabled || undefined}
      data-readonly={readOnly || undefined}
      data-focused={focused || undefined}
    >
      <span className="fx-currency-input-affix" aria-hidden="true">
        {symbol}
      </span>
      <input
        ref={inputRef}
        id={inputId}
        className="fx-currency-input-control"
        type="text"
        inputMode="decimal"
        value={display}
        disabled={disabled}
        readOnly={readOnly}
        aria-invalid={invalid || undefined}
        onChange={(event) => setText(event.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={(event) => {
          setFocused(true);
          setText(currentMoney == null ? '' : String(minorToMajor(currentMoney.amount, digits)));
          onFocus?.(event);
        }}
        onBlur={(event) => {
          setFocused(false);
          commit(text);
          onBlur?.(event);
        }}
        {...rest}
      />
    </div>
  );
}
