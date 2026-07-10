/**
 * Design Studio S1 (13-design-studio-strategy.md §3) — base typography emission.
 * The block is a CONSTANT of `var(--fx-*)` references scoped under the root
 * wrapper: any theme/brand (fontScale included) flows through the variables.
 * The exact string is the contract — the WP gate compares the PHP mirror
 * char-for-char against this same function (adapters/wordpress/tests).
 */

import { describe, expect, it } from 'vitest';
import { emitBaseTypography, emitTheme, defaultTheme, hasToken } from '../src/index.js';

const SCOPE = '[data-fx-type="flexa/root"]';

describe('emitBaseTypography', () => {
  it('emits the locked selector→bundle mapping, values as var() refs only', () => {
    const css = emitBaseTypography();
    const bundle = (family: string, size: string, weight: string, line: string) =>
      `font-family:var(--fx-font-family-${family});font-size:var(--fx-ref-font-size-${size});` +
      `font-weight:var(--fx-ref-font-weight-${weight});line-height:var(--fx-ref-line-height-${line})`;
    expect(css).toBe(
      `${SCOPE}{${bundle('base', 'base', 'regular', 'normal')}}` +
        `${SCOPE} h1{${bundle('heading', '4xl', 'bold', 'tight')}}` +
        `${SCOPE} h2{${bundle('heading', '3xl', 'bold', 'tight')}}` +
        `${SCOPE} h3{${bundle('heading', '2xl', 'semibold', 'tight')}}` +
        `${SCOPE} h4{${bundle('heading', 'xl', 'semibold', 'tight')}}` +
        `${SCOPE} h5{${bundle('heading', 'lg', 'semibold', 'tight')}}` +
        `${SCOPE} h6{${bundle('heading', 'base', 'semibold', 'tight')}}` +
        `${SCOPE} small{${bundle('base', 'sm', 'regular', 'normal')}}`,
    );
  });

  it('references only real FDS tokens (integrity: every var maps to the registry)', () => {
    const ids = [...emitBaseTypography().matchAll(/var\(--fx-([a-z0-9-]+)\)/g)].map((m) => m[1]!);
    expect(ids.length).toBeGreaterThan(0);
    for (const dashed of ids) {
      // --fx-a-b-c is ambiguous between dots and dashes; accept any split that
      // yields a registered token id (the emitter built it FROM a real id).
      const candidates = new Set<string>();
      const parts = dashed.split('-');
      for (let bits = 0; bits < 1 << (parts.length - 1); bits++) {
        let id = parts[0]!;
        for (let i = 1; i < parts.length; i++) id += bits & (1 << (i - 1)) ? '.' + parts[i] : '-' + parts[i];
        candidates.add(id);
      }
      expect([...candidates].some((id) => hasToken(id)), `no token behind --fx-${dashed}`).toBe(true);
    }
  });

  it('is constant and lives OUTSIDE emitTheme (theme output byte-identical without it)', () => {
    expect(emitBaseTypography()).toBe(emitBaseTypography());
    expect(emitTheme(defaultTheme())).not.toContain('h1{');
  });
});
