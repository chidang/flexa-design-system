import { describe, it, expect } from 'vitest';
import {
  defaultTheme,
  emitBaseTypography,
  emitTheme,
  FDS_TOKENS,
} from 'flexa-design-system';
import {
  extractFxRefs,
  isKnownVar,
  lintFiles,
  lintText,
  suggestFor,
  FX_VARS,
} from '../src/index.js';

const REAL = FDS_TOKENS[0]!.cssVar; // e.g. --fx-color-bg

describe('FX_VARS registry', () => {
  it('is derived from the package, not hardcoded', () => {
    expect(FX_VARS.size).toBe(FDS_TOKENS.length);
    expect(FX_VARS.has('--fx-color-primary')).toBe(true);
    expect(FX_VARS.has('--fx-not-a-token')).toBe(false);
  });

  it('isKnownVar agrees with the registry', () => {
    expect(isKnownVar(REAL)).toBe(true);
    expect(isKnownVar('--fx-color-zzz')).toBe(false);
  });
});

describe('extractFxRefs', () => {
  it('dedups and sorts, ignoring non-fx custom props', () => {
    const css = `.a{color:var(--fx-color-primary);background:var(--fx-color-bg)}
      .b{border-color:var(--fx-color-primary);--brand:var(--other-thing)}`;
    expect(extractFxRefs(css)).toEqual(['--fx-color-bg', '--fx-color-primary']);
  });

  it('returns nothing when there are no fx refs', () => {
    expect(extractFxRefs('.a{color:red}')).toEqual([]);
  });
});

describe('lintText', () => {
  it('reports clean when every ref is a registry token', () => {
    const r = lintText(`x{color:var(--fx-color-primary);gap:var(--fx-space-4)}`, 'ok.css');
    expect(r.file).toBe('ok.css');
    expect(r.offSystem).toEqual([]);
    expect(r.onSystem).toEqual(['--fx-color-primary', '--fx-space-4']);
  });

  it('flags an off-system ref with a typo suggestion', () => {
    const r = lintText(`x{color:var(--fx-color-primry)}`);
    expect(r.offSystem).toEqual([{ ref: '--fx-color-primry', suggestion: '--fx-color-primary' }]);
  });

  it('flags an off-system ref with no suggestion when nothing is close', () => {
    const r = lintText(`x{color:var(--fx-totally-made-up-token-name)}`);
    expect(r.offSystem).toHaveLength(1);
    expect(r.offSystem[0]!.ref).toBe('--fx-totally-made-up-token-name');
    expect(r.offSystem[0]!.suggestion).toBeUndefined();
  });
});

describe('suggestFor is deterministic', () => {
  it('maps a near-miss to the closest real token, repeatably', () => {
    expect(suggestFor('--fx-space-44')).toBe(suggestFor('--fx-space-44'));
    expect(suggestFor('--fx-radius-mdd')).toBe('--fx-radius-md');
  });
});

describe('lintFiles aggregate', () => {
  it('counts scanned files, files with findings, and total off-system', () => {
    const report = lintFiles([
      { file: 'a.css', text: 'x{color:var(--fx-color-primary)}' },
      { file: 'b.css', text: 'x{color:var(--fx-nope-one);gap:var(--fx-nope-two)}' },
      { file: 'c.css', text: '.plain{color:red}' },
    ]);
    expect(report.filesScanned).toBe(3);
    expect(report.filesWithFindings).toBe(1);
    expect(report.offSystemCount).toBe(2);
    expect(report.clean).toBe(false);
  });

  it('is clean over token-only input', () => {
    const report = lintFiles([{ file: 'ok.css', text: `x{color:var(${REAL})}` }]);
    expect(report.clean).toBe(true);
  });
});

// Dogfood: the FDS emitters' own output must lint clean. If the linter and the
// registry ever disagreed about what a real token is, these would fail.
describe('dogfood — FDS emitters are 100% on-system', () => {
  it('emitBaseTypography() references only registry tokens', () => {
    const r = lintText(emitBaseTypography(), 'base-typography.css');
    expect(r.offSystem).toEqual([]);
    expect(r.refs.length).toBeGreaterThan(0);
  });

  it('emitTheme(defaultTheme()) defines and references only registry tokens', () => {
    const r = lintText(emitTheme(defaultTheme()), 'theme.css');
    expect(r.offSystem).toEqual([]);
    expect(r.refs.length).toBeGreaterThan(0);
  });
});
