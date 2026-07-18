import { describe, expect, it } from 'vitest';
import {
  DESIGN_STATE_VERSION,
  FONT_SIZE_STEPS,
  RADIUS_PRESETS,
  SPACE_STEPS,
  applyBrand,
  brandSchema,
  checkThemeContrast,
  contrastRatio,
  defaultTheme,
  deriveSecondary,
  SECONDARY_HUE_SHIFT,
  densityValue,
  DENSITY_BOUNDS,
  LINE_HEIGHTS,
  BODY_LEADING_FLOOR,
  headingLeading,
  bodyLeading,
  emitTheme,
  fontScaleValue,
  hasToken,
  readableOn,
  relativeLuminance,
  tokenIdToCssVar,
  validateComponentStyles,
  validateDesignState,
  type Brand,
  type Theme,
} from '../src/index.js';
import fdsTokens from 'flexa-design-system/fds.tokens.json';

/** The literal value a theme's base holds for a token id (after applyBrand). */
function baseValue(theme: Theme, id: string): string | undefined {
  const cssVar = tokenIdToCssVar(id);
  const t = theme.base.find((e) => e.cssVar === cssVar);
  return t ? String(t.value) : undefined;
}

/** The value a theme's mode (e.g. `dark`) overrides for a token id, if any. */
function modeValue(theme: Theme, scheme: string, id: string): string | undefined {
  const cssVar = tokenIdToCssVar(id);
  const mode = theme.modes?.find((m) => m.scheme === scheme);
  const t = mode?.tokens.find((e) => e.cssVar === cssVar);
  return t ? String(t.value) : undefined;
}

describe('color.secondary family (FDS 2.1)', () => {
  it('adds the full secondary fg/bg family, on-system', () => {
    for (const id of ['color.secondary', 'color.on-secondary', 'color.secondary-hover', 'color.secondary-active']) {
      expect(hasToken(id)).toBe(true);
    }
  });

  it('secondary is emitted into the default theme :root', () => {
    const css = emitTheme(defaultTheme());
    expect(css).toContain('--fx-color-secondary:var(--fx-ref-neutral-600)');
    expect(css).toContain('--fx-color-on-secondary:var(--fx-ref-neutral-0)');
  });
});

describe('applyBrand — Brand -> Theme (pure token re-points, slice D3)', () => {
  it('sets primary + derives hover/active/on-primary/focus-ring', () => {
    const t = applyBrand(defaultTheme(), { primaryColor: '#6366f1' });
    expect(baseValue(t, 'color.primary')).toBe('#6366f1');
    expect(baseValue(t, 'color.focus-ring')).toBe('#6366f1');
    // hover/active are darker than the primary; on-primary is a readable literal.
    expect(baseValue(t, 'color.primary-hover')).not.toBe('#6366f1');
    expect(baseValue(t, 'color.primary-active')).not.toBe('#6366f1');
    // on-primary is the higher-contrast of the two candidates (readableOn). It may
    // still miss AA on a mid-tone brand colour — surfacing that is the D4 warning.
    const onPrimary = baseValue(t, 'color.on-primary')!;
    expect(onPrimary).toBe(readableOn('#6366f1'));
    expect(contrastRatio(onPrimary, '#6366f1')).toBeGreaterThanOrEqual(contrastRatio('#0f172a', '#6366f1'));
  });

  it('sets the secondary family from secondaryColor', () => {
    const t = applyBrand(defaultTheme(), { secondaryColor: '#14b8a6' });
    expect(baseValue(t, 'color.secondary')).toBe('#14b8a6');
    expect(baseValue(t, 'color.secondary-hover')).not.toBe('#14b8a6');
    expect(['#ffffff', '#0f172a']).toContain(baseValue(t, 'color.on-secondary'));
  });

  it('maps fonts, radius preset and container width', () => {
    const brand: Brand = {
      headingFont: "Georgia, 'Times New Roman', serif",
      bodyFont: 'system-ui, sans-serif',
      radius: 'none',
      containerWidth: '1280px',
    };
    const t = applyBrand(defaultTheme(), brand);
    expect(baseValue(t, 'font.family-heading')).toBe("Georgia, 'Times New Roman', serif");
    expect(baseValue(t, 'font.family-base')).toBe('system-ui, sans-serif');
    expect(baseValue(t, 'radius.lg')).toBe('0px');
    expect(baseValue(t, 'radius.2xl')).toBe('0px');
    expect(baseValue(t, 'size.container-lg')).toBe('1280px');
  });

  it('the md radius preset restores the canonical scale', () => {
    const t = applyBrand(defaultTheme(), { radius: 'md' });
    expect(baseValue(t, 'radius.md')).toBe(RADIUS_PRESETS.md['radius.md']);
    expect(baseValue(t, 'radius.md')).toBe('0.375rem');
  });

  it('an empty brand returns the theme unchanged', () => {
    const t = defaultTheme();
    expect(applyBrand(t, {})).toBe(t);
  });

  it('does not mutate the input theme (pure)', () => {
    const t = defaultTheme();
    const before = baseValue(t, 'color.primary');
    applyBrand(t, { primaryColor: '#ff0000' });
    expect(baseValue(t, 'color.primary')).toBe(before);
  });

  it('emitTheme surfaces the branded primary as a literal', () => {
    const css = emitTheme(applyBrand(defaultTheme(), { primaryColor: '#f97316' }));
    expect(css).toContain('--fx-color-primary:#f97316');
  });
});

describe('applyBrand — auto dark-tune (Track C, doc 20)', () => {
  it('re-tints the dark scheme primary family lighter, with a readable on-colour', () => {
    const t = applyBrand(defaultTheme(), { primaryColor: '#4f46e5' });
    const darkPrimary = modeValue(t, 'dark', 'color.primary')!;
    expect(darkPrimary).toMatch(/^#[0-9a-f]{6}$/);
    // Brand goes LIGHTER on a dark ground (mixed toward white).
    expect(relativeLuminance(darkPrimary)).toBeGreaterThan(relativeLuminance('#4f46e5'));
    // hover/active lighten further still (the light scheme's darken, reversed).
    expect(relativeLuminance(modeValue(t, 'dark', 'color.primary-hover')!)).toBeGreaterThan(
      relativeLuminance(darkPrimary),
    );
    expect(relativeLuminance(modeValue(t, 'dark', 'color.primary-active')!)).toBeGreaterThan(
      relativeLuminance(modeValue(t, 'dark', 'color.primary-hover')!),
    );
    // on-primary + focus-ring track the re-tinted dark base.
    expect(modeValue(t, 'dark', 'color.on-primary')).toBe(readableOn(darkPrimary));
    expect(modeValue(t, 'dark', 'color.focus-ring')).toBe(darkPrimary);
  });

  it('re-tints the dark scheme secondary family from an explicit secondary', () => {
    const t = applyBrand(defaultTheme(), { secondaryColor: '#14b8a6' });
    const darkSecondary = modeValue(t, 'dark', 'color.secondary')!;
    expect(darkSecondary).toMatch(/^#[0-9a-f]{6}$/);
    expect(relativeLuminance(darkSecondary)).toBeGreaterThan(relativeLuminance('#14b8a6'));
    expect(modeValue(t, 'dark', 'color.on-secondary')).toBe(readableOn(darkSecondary));
  });

  it('keeps the dark scheme AA-clear when a brand re-tints it (gate, PR-4)', () => {
    // The whole point of the contrast-safe lift (`darkTint`): auto dark-tune never
    // introduces a failure — even for a mid-luminance accent that a fixed lift alone
    // would strand in the WCAG dead zone (#9016a3). Each colour drives both families.
    for (const c of ['#4f46e5', '#0ea5e9', '#16a34a', '#dc2626', '#f97316', '#7c3aed', '#9016a3']) {
      const theme = applyBrand(defaultTheme(), { primaryColor: c, secondaryColor: c });
      expect(checkThemeContrast(theme), c).toEqual([]);
    }
  });

  it('leaves a light-only theme (no dark mode) untouched', () => {
    const lightOnly: Theme = { name: 'x', base: defaultTheme().base };
    const t = applyBrand(lightOnly, { primaryColor: '#4f46e5' });
    expect(t.modes).toBeUndefined();
    expect(baseValue(t, 'color.primary')).toBe('#4f46e5');
  });

  it('does not mutate the input theme modes (pure)', () => {
    const t = defaultTheme();
    const before = modeValue(t, 'dark', 'color.primary');
    applyBrand(t, { primaryColor: '#ff0000' });
    expect(modeValue(t, 'dark', 'color.primary')).toBe(before);
  });
});

describe('deriveSecondary — auto secondary accent from primary (Track C, doc 20)', () => {
  it('has a controlled hue shift and is deterministic', () => {
    expect(SECONDARY_HUE_SHIFT).toBe(150);
    expect(deriveSecondary('#4f46e5')).toBe(deriveSecondary('#4f46e5'));
  });

  it('rotates the hue into a different valid hex', () => {
    const secondary = deriveSecondary('#4f46e5'); // indigo -> warm amber
    expect(secondary).toMatch(/^#[0-9a-f]{6}$/);
    expect(secondary).not.toBe('#4f46e5');
    expect(secondary).toBe('#e59f46');
  });

  it('passes a non-hex value through unchanged (mirrors darken)', () => {
    expect(deriveSecondary('var(--x)')).toBe('var(--x)');
  });

  it('yields a matching grey for a greyscale primary (no hue to rotate)', () => {
    expect(deriveSecondary('#808080')).toBe('#808080');
  });

  it('applyBrand auto-derives the whole secondary family from a primary alone', () => {
    const t = applyBrand(defaultTheme(), { primaryColor: '#4f46e5' });
    const secondary = deriveSecondary('#4f46e5');
    expect(baseValue(t, 'color.secondary')).toBe(secondary);
    expect(baseValue(t, 'color.secondary-hover')).not.toBe(secondary); // darkened toward black
    // on-secondary is the higher-contrast candidate — the same guarantee as on-primary.
    const onSecondary = baseValue(t, 'color.on-secondary')!;
    expect(onSecondary).toBe(readableOn(secondary));
    expect(contrastRatio(onSecondary, secondary)).toBeGreaterThanOrEqual(contrastRatio('#0f172a', secondary));
  });

  it('lets an explicit secondaryColor win over the derived one', () => {
    const t = applyBrand(defaultTheme(), { primaryColor: '#4f46e5', secondaryColor: '#14b8a6' });
    expect(baseValue(t, 'color.secondary')).toBe('#14b8a6');
    expect(baseValue(t, 'color.secondary')).not.toBe(deriveSecondary('#4f46e5'));
  });

  it('leaves the theme default secondary when the brand names neither colour', () => {
    const base = defaultTheme();
    const before = baseValue(base, 'color.secondary');
    const t = applyBrand(base, { radius: 'md' });
    expect(baseValue(t, 'color.secondary')).toBe(before);
  });

  it('derives an AA-readable secondary pair for representative brand primaries (gate, PR-4)', () => {
    // Preserving S/L keeps the accent contrast-equivalent to the primary, so
    // readableOn lands AA for realistic saturated brand colours — the derivation
    // never weakens the contrast gate that already covers the secondary pair.
    for (const primary of ['#4f46e5', '#0ea5e9', '#16a34a', '#dc2626', '#f97316', '#7c3aed']) {
      const secondary = deriveSecondary(primary);
      const ratio = contrastRatio(readableOn(secondary), secondary);
      expect(ratio, `${primary} -> ${secondary}`).toBeGreaterThanOrEqual(4.5);
    }
  });
});

describe('applyBrand — fontScale (typography scale, DS3)', () => {
  it('re-points the whole ref.font-size ramp from base × ratio^exp', () => {
    const t = applyBrand(defaultTheme(), { fontScale: { base: 1, ratio: 1.2 } });
    expect(baseValue(t, 'ref.font-size.base')).toBe('1rem');
    expect(baseValue(t, 'ref.font-size.lg')).toBe('1.2rem');
    // 1.2^6 = 2.985984 → rounded to 3 decimals
    expect(baseValue(t, 'ref.font-size.5xl')).toBe('2.986rem');
    // Down-steps shrink below the base.
    expect(baseValue(t, 'ref.font-size.sm')).toBe('0.833rem');
    // Every step is a registered token (the ramp never invents ids).
    for (const step of FONT_SIZE_STEPS) {
      expect(hasToken(`ref.font-size.${step.id}`)).toBe(true);
    }
  });

  it('defaults fill missing fields; the UI previews with the same math', () => {
    const t = applyBrand(defaultTheme(), { fontScale: {} });
    expect(baseValue(t, 'ref.font-size.base')).toBe(fontScaleValue({}, 0));
    expect(baseValue(t, 'ref.font-size.5xl')).toBe(fontScaleValue({}, 6));
  });

  it('a brand without fontScale leaves the shipped ramp untouched', () => {
    const before = baseValue(defaultTheme(), 'ref.font-size.5xl');
    const t = applyBrand(defaultTheme(), { primaryColor: '#f97316' });
    expect(baseValue(t, 'ref.font-size.5xl')).toBe(before);
  });

  it('brandSchema gates the fontScale shape (additive, DesignState-safe)', () => {
    expect(brandSchema.safeParse({ fontScale: { base: 1.125, ratio: 1.25 } }).success).toBe(true);
    expect(brandSchema.safeParse({ fontScale: { ratio: 2.5 } }).success).toBe(false);
    expect(brandSchema.safeParse({ fontScale: { steps: 9 } }).success).toBe(false);
    const state = {
      schemaVersion: DESIGN_STATE_VERSION,
      theme: defaultTheme(),
      brand: { fontScale: { base: 1, ratio: 1.333 } },
    };
    expect(validateDesignState(state).ok).toBe(true);
  });
});

describe('applyBrand — density (spacing scale, S9)', () => {
  it('re-points the whole ref.space ramp by one multiplier (except space.0)', () => {
    const t = applyBrand(defaultTheme(), { density: 1.15 });
    expect(baseValue(t, 'ref.space.4')).toBe('1.15rem');
    // 0.75 × 1.15 = 0.8624999… in binary float → rounds to 0.862 (deterministic)
    expect(baseValue(t, 'ref.space.3')).toBe('0.862rem');
    expect(baseValue(t, 'ref.space.24')).toBe('6.9rem');
    // space.0 stays untouched — zero scales to zero.
    expect(baseValue(t, 'ref.space.0')).toBe(baseValue(defaultTheme(), 'ref.space.0'));
    // Every step is a registered token (the ramp never invents ids).
    for (const step of SPACE_STEPS) {
      expect(hasToken(`ref.space.${step.id}`)).toBe(true);
    }
  });

  it('density 1 re-derives the shipped values; the UI previews with the same math', () => {
    const t = applyBrand(defaultTheme(), { density: 1 });
    for (const step of SPACE_STEPS) {
      expect(baseValue(t, `ref.space.${step.id}`)).toBe(densityValue(1, step.rem));
      expect(baseValue(t, `ref.space.${step.id}`)).toBe(`${step.rem}rem`);
    }
  });

  it('a brand without density leaves the shipped ramp untouched', () => {
    const before = baseValue(defaultTheme(), 'ref.space.4');
    const t = applyBrand(defaultTheme(), { primaryColor: '#f97316' });
    expect(baseValue(t, 'ref.space.4')).toBe(before);
  });

  it('brandSchema gates the density bounds (additive, DesignState-safe)', () => {
    expect(brandSchema.safeParse({ density: 0.85 }).success).toBe(true);
    expect(brandSchema.safeParse({ density: 0.5 }).success).toBe(false);
    expect(brandSchema.safeParse({ density: 1.5 }).success).toBe(false);
    expect(brandSchema.safeParse({ density: '1' }).success).toBe(false);
    const state = {
      schemaVersion: DESIGN_STATE_VERSION,
      theme: defaultTheme(),
      brand: { density: 1.15 },
    };
    expect(validateDesignState(state).ok).toBe(true);
  });

  it('SPACE_STEPS never drifts from the fds.tokens.json SSOT', () => {
    const ramp = (fdsTokens as unknown as { ref: { space: Record<string, { $value: string }> } })
      .ref.space;
    // The table covers every shipped step except 0, in the SSOT's order
    // ($-prefixed keys are DTCG metadata, not steps).
    expect(SPACE_STEPS.map((s) => s.id)).toEqual(
      Object.keys(ramp).filter((id) => id !== '0' && !id.startsWith('$')),
    );
    for (const step of SPACE_STEPS) {
      expect(`${step.rem}rem`).toBe(ramp[step.id]!.$value);
    }
  });
});

describe('applyBrand — line-height maturity (Track C, doc 20)', () => {
  it('the default type scale keeps the shipped heading leading (identity)', () => {
    // ratio 1.2 is the default → tight stays 1.2, so a plain fontScale never
    // silently shifts the shipped rhythm.
    expect(headingLeading({ ratio: 1.2 })).toBe(LINE_HEIGHTS.tight);
    expect(headingLeading({})).toBe(LINE_HEIGHTS.tight);
    const t = applyBrand(defaultTheme(), { fontScale: { base: 1, ratio: 1.2 } });
    expect(baseValue(t, 'ref.line-height.tight')).toBe(String(LINE_HEIGHTS.tight));
  });

  it('a steeper ratio tightens heading leading; a gentler ratio loosens it', () => {
    const steep = applyBrand(defaultTheme(), { fontScale: { ratio: 1.5 } });
    const gentle = applyBrand(defaultTheme(), { fontScale: { ratio: 1.1 } });
    const steepV = Number(baseValue(steep, 'ref.line-height.tight'));
    const gentleV = Number(baseValue(gentle, 'ref.line-height.tight'));
    expect(steepV).toBeLessThan(LINE_HEIGHTS.tight);
    expect(gentleV).toBeGreaterThan(LINE_HEIGHTS.tight);
  });

  it('heading leading is clamped to a sane display range for extreme ratios', () => {
    // A dramatic scale would drive leading below 1.0 without the floor.
    expect(headingLeading({ ratio: 2 })).toBe(1.05);
    expect(headingLeading({ ratio: 1 })).toBeLessThanOrEqual(1.35);
    expect(headingLeading({ ratio: 1 })).toBeGreaterThan(LINE_HEIGHTS.tight);
  });

  it('the default density keeps the shipped body leading (identity)', () => {
    expect(bodyLeading(1, LINE_HEIGHTS.normal)).toBe(LINE_HEIGHTS.normal);
    expect(bodyLeading(1, LINE_HEIGHTS.relaxed)).toBe(LINE_HEIGHTS.relaxed);
    const t = applyBrand(defaultTheme(), { density: 1 });
    expect(baseValue(t, 'ref.line-height.normal')).toBe(String(LINE_HEIGHTS.normal));
    expect(baseValue(t, 'ref.line-height.relaxed')).toBe(String(LINE_HEIGHTS.relaxed));
  });

  it('airy density breathes body leading looser', () => {
    const t = applyBrand(defaultTheme(), { density: 1.2 });
    expect(Number(baseValue(t, 'ref.line-height.normal'))).toBeGreaterThan(LINE_HEIGHTS.normal);
    expect(Number(baseValue(t, 'ref.line-height.relaxed'))).toBeGreaterThan(LINE_HEIGHTS.relaxed);
  });

  it('compact density never tightens body leading below the WCAG 1.4.12 floor', () => {
    // Sweep the whole accepted density range: body leading stays AA-legible.
    for (let d = DENSITY_BOUNDS[0]; d <= DENSITY_BOUNDS[1] + 1e-9; d += 0.05) {
      expect(bodyLeading(d, LINE_HEIGHTS.normal)).toBeGreaterThanOrEqual(BODY_LEADING_FLOOR);
      expect(bodyLeading(d, LINE_HEIGHTS.relaxed)).toBeGreaterThanOrEqual(BODY_LEADING_FLOOR);
    }
    // The most compact setting clamps body `normal` right at the floor.
    const t = applyBrand(defaultTheme(), { density: DENSITY_BOUNDS[0] });
    expect(baseValue(t, 'ref.line-height.normal')).toBe(String(BODY_LEADING_FLOOR));
  });

  it('the two levers are independent: fontScale owns heading leading, density owns body', () => {
    // fontScale alone leaves body leading at the shipped value…
    const typeOnly = applyBrand(defaultTheme(), { fontScale: { ratio: 1.6 } });
    expect(baseValue(typeOnly, 'ref.line-height.normal')).toBe(
      baseValue(defaultTheme(), 'ref.line-height.normal'),
    );
    // …and density alone leaves heading leading at the shipped value.
    const spaceOnly = applyBrand(defaultTheme(), { density: 1.2 });
    expect(baseValue(spaceOnly, 'ref.line-height.tight')).toBe(
      baseValue(defaultTheme(), 'ref.line-height.tight'),
    );
  });

  it('LINE_HEIGHTS never drifts from the fds.tokens.json SSOT', () => {
    const ramp = (
      fdsTokens as unknown as { ref: { 'line-height': Record<string, { $value: number }> } }
    ).ref['line-height'];
    expect(LINE_HEIGHTS.tight).toBe(ramp.tight!.$value);
    expect(LINE_HEIGHTS.normal).toBe(ramp.normal!.$value);
    expect(LINE_HEIGHTS.relaxed).toBe(ramp.relaxed!.$value);
  });
});

describe('readableOn — picks the higher-contrast text colour', () => {
  it('white on a dark fill, dark text on a light fill', () => {
    expect(readableOn('#111827')).toBe('#ffffff');
    expect(readableOn('#fde047')).toBe('#0f172a'); // bright yellow -> dark text
  });
});

describe('validateComponentStyles — shared on-system gate', () => {
  it('accepts an on-system spec keyed by element type', () => {
    const errors: string[] = [];
    validateComponentStyles({ 'flexa/button': { '&': { color: 'color.primary' } } }, errors);
    expect(errors).toEqual([]);
  });

  it('rejects a bad type key and an off-system token', () => {
    const errors: string[] = [];
    validateComponentStyles({ Button: { '&': { color: 'color.nope' } } }, errors);
    expect(errors.length).toBe(2);
    expect(errors.join(' ')).toContain('not a valid element type');
    expect(errors.join(' ')).toContain('color.nope');
  });
});

describe('validateDesignState — no-throw, structured (slice D3)', () => {
  const good = {
    schemaVersion: DESIGN_STATE_VERSION,
    theme: applyBrand(defaultTheme(), { primaryColor: '#6366f1' }),
    brand: { primaryColor: '#6366f1', radius: 'lg' as const },
    packRef: { vendor: 'flexa', name: 'Modern', version: '1.0.0' },
    componentStyles: { 'flexa/button': { '&': { color: 'color.primary' } } },
  };

  it('accepts a well-formed state', () => {
    const res = validateDesignState(good);
    expect(res.ok).toBe(true);
  });

  it('rejects a wrong schemaVersion', () => {
    const res = validateDesignState({ ...good, schemaVersion: 2 });
    expect(res.ok).toBe(false);
  });

  it('rejects an off-system component style', () => {
    const res = validateDesignState({
      ...good,
      componentStyles: { 'flexa/button': { '&': { color: 'color.ghost' } } },
    });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.errors.join(' ')).toContain('color.ghost');
  });

  it('rejects a non-hex brand colour via the envelope schema', () => {
    const res = validateDesignState({ ...good, brand: { primaryColor: 'red' } });
    expect(res.ok).toBe(false);
  });

  it('rejects a theme that is not an object with a base', () => {
    const res = validateDesignState({ schemaVersion: 1, theme: { name: 'x' } });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.errors.join(' ')).toContain('theme.base');
  });
});
