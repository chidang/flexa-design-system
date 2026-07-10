import { describe, expect, it } from 'vitest';
import {
  CONTRAST_PAIRS,
  DARK_MODE_OVERRIDES,
  HC_MODE_OVERRIDES,
  FDS_TOKENS,
  checkThemeContrast,
  checkThemeNonText,
  contrastRatio,
  defaultTheme,
  emitTheme,
  emitThemeRoot,
  getToken,
  relativeLuminance,
  tokenIdToCssVar,
  type EmitToken,
} from '../src/index.js';

describe('emitTheme — whole-theme emission (Slice 3)', () => {
  const base: EmitToken[] = [{ cssVar: '--fx-color-bg', type: 'color', value: '{ref.neutral.0}' }];

  it('emits the base set at :root for the default theme', () => {
    expect(emitTheme({ name: '', base })).toBe(
      ':root{--fx-color-bg:var(--fx-ref-neutral-0)}',
    );
    expect(emitTheme({ name: 'default', base })).toBe(
      ':root{--fx-color-bg:var(--fx-ref-neutral-0)}',
    );
  });

  it('scopes a named theme to [data-fx-theme] so themes nest', () => {
    expect(emitTheme({ name: 'promo', base })).toBe(
      '[data-fx-theme="promo"]{--fx-color-bg:var(--fx-ref-neutral-0)}',
    );
  });

  it('emits one [data-fx-scheme] block per mode', () => {
    const css = emitTheme({
      name: '',
      base,
      modes: [{ scheme: 'dark', tokens: [{ cssVar: '--fx-color-bg', type: 'color', value: '{ref.neutral.950}' }] }],
    });
    expect(css).toBe(
      ':root{--fx-color-bg:var(--fx-ref-neutral-0)}' +
        ':root[data-fx-scheme="dark"]{--fx-color-bg:var(--fx-ref-neutral-950)}',
    );
  });

  it('adds prefers-color-scheme blocks only for light/dark when autoScheme is on', () => {
    const css = emitTheme({
      name: '',
      base,
      modes: [
        { scheme: 'dark', tokens: [{ cssVar: '--fx-color-bg', type: 'color', value: '{ref.neutral.950}' }] },
        { scheme: 'hc', tokens: [{ cssVar: '--fx-color-bg', type: 'color', value: '{ref.neutral.900}' }] },
      ],
      autoScheme: true,
    });
    expect(css).toContain('@media (prefers-color-scheme:dark){:root:not([data-fx-scheme]){');
    // `hc` is not a prefers-color-scheme value, so no auto block is emitted for it.
    expect(css).not.toContain('prefers-color-scheme:hc');
  });

  it('gates reduced-motion overrides behind prefers-reduced-motion', () => {
    const css = emitTheme({
      name: '',
      base,
      reducedMotion: [{ cssVar: '--fx-motion-duration-normal', type: 'duration', value: '0s' }],
    });
    expect(css).toContain(
      '@media (prefers-reduced-motion:reduce){:root{--fx-motion-duration-normal:0s}}',
    );
  });

  it('base block is byte-identical to emitThemeRoot (shared serializer)', () => {
    expect(emitTheme({ name: '', base })).toBe(emitThemeRoot(base));
  });
});

describe('defaultTheme — the canonical theme (Slice 3)', () => {
  it('carries a full base, a dark mode, auto-scheme and reduced motion', () => {
    const t = defaultTheme();
    expect(t.name).toBe('default');
    expect(t.base.length).toBeGreaterThan(20);
    expect(t.autoScheme).toBe(true);
    expect(t.modes?.[0]?.scheme).toBe('dark');
    expect(t.reducedMotion?.length).toBeGreaterThan(0);
  });

  it('dark overrides re-point the SAME semantic names (never new vars)', () => {
    const t = defaultTheme();
    const baseVars = new Set(t.base.map((e) => e.cssVar));
    for (const e of t.modes?.[0]?.tokens ?? []) {
      expect(baseVars.has(e.cssVar)).toBe(true);
    }
    // and each override id is a real dark-map entry
    expect(Object.keys(DARK_MODE_OVERRIDES)).toContain('color.bg');
  });

  it('emits deterministically, only var()/literals into :root-likes (QĐ-0)', () => {
    const css = emitTheme(defaultTheme());
    expect(css.startsWith(':root{')).toBe(true);
    expect(css).toContain(':root[data-fx-scheme="dark"]{');
    // Semantic tokens resolve to a var() at their primitive — the alias is gone.
    expect(css).toContain('var(--fx-ref-');
    // QĐ-0: a raw `{ref.…}` token reference never leaks into the stylesheet.
    expect(css).not.toContain('{ref.');
  });
});

describe('WCAG contrast math + CI gate (Slice 3, §3.2)', () => {
  it('computes known luminance/ratio anchors', () => {
    expect(relativeLuminance('#ffffff')).toBeCloseTo(1, 5);
    expect(relativeLuminance('#000000')).toBeCloseTo(0, 5);
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 1);
    expect(contrastRatio('#ffffff', '#ffffff')).toBeCloseTo(1, 5);
    // supports #rgb shorthand
    expect(contrastRatio('#fff', '#000')).toBeCloseTo(21, 1);
  });

  it('the default theme passes AA on every guaranteed pair in every scheme', () => {
    const failures = checkThemeContrast(defaultTheme());
    expect(failures, JSON.stringify(failures)).toEqual([]);
  });

  it('flags a pair that dips below its minimum', () => {
    // A deliberately broken theme: text-muted set to a too-light grey on white.
    const broken = {
      name: '',
      base: [
        { cssVar: '--fx-color-bg', type: 'color', value: '#ffffff' },
        { cssVar: '--fx-color-surface', type: 'color', value: '#ffffff' },
        { cssVar: '--fx-color-text', type: 'color', value: '#000000' },
        { cssVar: '--fx-color-text-muted', type: 'color', value: '#cccccc' },
      ] as EmitToken[],
    };
    const failures = checkThemeContrast(broken);
    expect(failures.some((f) => f.fg === 'color.text-muted')).toBe(true);
  });

  it('exposes the guaranteed pair list', () => {
    expect(CONTRAST_PAIRS.length).toBeGreaterThan(0);
    expect(CONTRAST_PAIRS.every((p) => p.min >= 4.5)).toBe(true);
  });
});

describe('high-contrast mode — prefers-contrast: more (Track D, doc 20)', () => {
  /** Follow `{alias}` through the registry to a literal hex. */
  const deref = (value: unknown): string | null => {
    let v = value;
    for (let i = 0; i < 12 && typeof v === 'string' && v.startsWith('{'); i += 1) {
      v = getToken(v.slice(1, -1))?.value;
    }
    return typeof v === 'string' ? v : null;
  };
  /** Effective value map for a scheme = light base overlaid with the overrides. */
  const scheme = (overrides: Record<string, string>): Map<string, string> => {
    const m = new Map<string, string>();
    for (const t of FDS_TOKENS) {
      const hex = deref(t.value);
      if (hex) m.set(t.cssVar, hex);
    }
    for (const [id, value] of Object.entries(overrides)) {
      const hex = deref(value);
      if (hex) m.set(tokenIdToCssVar(id), hex);
    }
    return m;
  };
  const ratio = (vals: Map<string, string>, fg: string, bg: string): number =>
    contrastRatio(vals.get(tokenIdToCssVar(fg)) as string, vals.get(tokenIdToCssVar(bg)) as string);

  const AAA = 7;
  const light = scheme({});
  const hc = scheme(HC_MODE_OVERRIDES);
  /** Pairs whose fg/bg are re-pointed by hc reach AAA; status fills keep their AA .600. */
  const neutralBrandPairs = CONTRAST_PAIRS.filter(
    (p) => p.fg in HC_MODE_OVERRIDES || p.bg in HC_MODE_OVERRIDES,
  );

  it('re-points neutral/brand pairs to WCAG AAA (7:1)', () => {
    expect(neutralBrandPairs.length).toBeGreaterThan(0);
    for (const p of neutralBrandPairs) {
      expect(ratio(hc, p.fg, p.bg), `${p.fg} on ${p.bg}`).toBeGreaterThanOrEqual(AAA);
    }
  });

  it('never regresses any guaranteed pair below its light value, and still clears AA everywhere', () => {
    const failures = checkThemeContrast(defaultTheme());
    expect(failures, JSON.stringify(failures)).toEqual([]); // AA in base + dark + hc
    for (const p of CONTRAST_PAIRS) {
      expect(ratio(hc, p.fg, p.bg)).toBeGreaterThanOrEqual(ratio(light, p.fg, p.bg) - 1e-9);
    }
  });

  it('keeps the focus ring and fills perceivable (non-text 3:1) in hc', () => {
    // hc rides the default theme, so the non-text gate walks it too — must stay clear.
    expect(checkThemeNonText(defaultTheme())).toEqual([]);
  });

  it('auto-applies hc under prefers-contrast scoped to the light scheme (never onto dark)', () => {
    const css = emitTheme(defaultTheme());
    // explicit opt-in block for every mode…
    expect(css).toContain(':root[data-fx-scheme="hc"]{');
    // …plus the auto rule, gated so a dark viewer keeps dark (no light values on dark bg).
    expect(css).toContain('@media (prefers-contrast:more) and (prefers-color-scheme:light){:root:not([data-fx-scheme]){');
    expect(css).toContain('@media (prefers-color-scheme:dark){');
  });
});
