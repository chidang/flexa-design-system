'use client';
/**
 * FxPhoneInput — Phone Input (doc 04 §3.4).
 *
 * FxInput deltas (`inputMode="tel"`, `autoComplete="tel"`) with a start-affix
 * country FxSelect (searchable via the select's typeahead). Value is
 * `{ country, number }`; on blur (when `formatOnBlur`) the number is normalized
 * toward E.164 using the selected country's dial prefix. Controlled or
 * uncontrolled `value` (§1.5). Every user-facing string is a prop with a
 * documented default (i18n). The country select carries its own accessible
 * label (`countryLabel`), so the control needs no extra wrapper.
 */
import { useId, useMemo, useState } from 'react';
import type { Size } from '../enums';
import { FxSelect, type OptionItem } from '../select/select';

/** One selectable country dialling code. */
export interface CountryOption {
  /** ISO country code, e.g. `'US'`. */
  code: string;
  /** Dial prefix, e.g. `'+1'`. */
  dial: string;
  /** Display label, e.g. `'United States'`. */
  label: string;
}

/** The composite phone value. */
export interface PhoneValue {
  country: string;
  number: string;
}

/** `{ source }` meta accompanying a value change (doc 04 §1.6). */
export interface PhoneChangeMeta {
  source: 'input' | 'country' | 'format';
}

export interface FxPhoneInputProps {
  /** Available countries (required). */
  countries: CountryOption[];
  /** Controlled value (§1.5). */
  value?: PhoneValue;
  /** Uncontrolled initial value. */
  defaultValue?: PhoneValue;
  /** Country selected when none is set. */
  defaultCountry?: string;
  /** Normalize the number toward E.164 on blur. */
  formatOnBlur?: boolean;
  /** Number-field placeholder. i18n. */
  placeholder?: string;
  /** Accessible label for the country select. i18n. */
  countryLabel?: string;
  /** Empty-list message for the country select. i18n. */
  emptyLabel?: string;
  /** `.is-invalid` + `aria-invalid`. */
  invalid?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  size?: Size;
  /** Accessible label for the number field. */
  'aria-label'?: string;
  'aria-labelledby'?: string;
  onChange?: (value: PhoneValue, meta: PhoneChangeMeta) => void;
  onCountryChange?: (code: string) => void;
  id?: string;
  className?: string;
}

/** Strip everything but digits (E.164 keeps only the leading + from the dial). */
function digitsOnly(raw: string): string {
  return raw.replace(/[^\d]/g, '');
}

/** Compose an E.164-ish string: dial prefix + national digits. */
function toE164(dial: string, national: string): string {
  const nat = digitsOnly(national);
  if (nat === '') return '';
  return `${dial}${nat}`;
}

export function FxPhoneInput({
  countries,
  value,
  defaultValue,
  defaultCountry,
  formatOnBlur = true,
  placeholder = 'Phone number',
  countryLabel = 'Country code',
  emptyLabel = 'No countries',
  invalid = false,
  disabled = false,
  readOnly = false,
  size = 'md',
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledby,
  onChange,
  onCountryChange,
  id,
  className,
}: FxPhoneInputProps) {
  const autoId = useId();
  const inputId = id ?? `${autoId}-number`;

  const firstCode = defaultCountry ?? countries[0]?.code ?? '';
  const controlled = value !== undefined;
  const [internal, setInternal] = useState<PhoneValue>(
    defaultValue ?? { country: firstCode, number: '' },
  );
  const current = controlled ? value : internal;

  const countryOptions = useMemo<OptionItem[]>(
    () => countries.map((c) => ({ value: c.code, label: `${c.dial} ${c.code}`, description: c.label })),
    [countries],
  );

  const dialOf = (code: string): string =>
    countries.find((c) => c.code === code)?.dial ?? '';

  const commit = (next: PhoneValue, source: PhoneChangeMeta['source']) => {
    if (!controlled) setInternal(next);
    onChange?.(next, { source });
  };

  const onNumber = (raw: string) => {
    commit({ ...current, number: raw }, 'input');
  };

  const onCountry = (code: string | null) => {
    const next = code ?? '';
    onCountryChange?.(next);
    commit({ ...current, country: next }, 'country');
  };

  const onBlurNumber = () => {
    if (!formatOnBlur || readOnly || disabled) return;
    const dial = dialOf(current.country);
    const normalized = toE164(dial, current.number);
    if (normalized !== '' && normalized !== current.number) {
      commit({ ...current, number: normalized }, 'format');
    }
  };

  const rootClass = [
    'fx-phone-input',
    invalid ? 'is-invalid' : '',
    disabled ? 'is-disabled' : '',
    readOnly ? 'is-readonly' : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={rootClass} data-size={size} data-invalid={invalid || undefined}>
      <div className="fx-phone-input-country">
        <FxSelect
          options={countryOptions}
          value={current.country || null}
          size={size}
          disabled={disabled}
          emptyLabel={emptyLabel}
          aria-label={countryLabel}
          onChange={onCountry}
        />
      </div>
      <input
        id={inputId}
        className="fx-phone-input-control"
        type="tel"
        inputMode="tel"
        autoComplete="tel"
        placeholder={placeholder}
        value={current.number}
        disabled={disabled}
        readOnly={readOnly}
        aria-invalid={invalid || undefined}
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledby}
        onChange={(e) => onNumber(e.target.value)}
        onBlur={onBlurNumber}
      />
    </div>
  );
}
