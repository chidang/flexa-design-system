import { describe, expect, it } from 'vitest';
import {
  defaultTheme,
  emitTheme,
  emitWpTheme,
  wpPresetVar,
  wpThemeJson,
  type EmitToken,
} from '../src/index.js';

describe('wpPresetVar — ref primitive -> WP preset var (Slice 4)', () => {
  it('maps every color hue ramp to --wp--preset--color--<hue>-<step>', () => {
    expect(wpPresetVar('--fx-ref-brand-600')).toBe('--wp--preset--color--brand-600');
    expect(wpPresetVar('--fx-ref-neutral-0')).toBe('--wp--preset--color--neutral-0');
    expect(wpPresetVar('--fx-ref-neutral-950')).toBe('--wp--preset--color--neutral-950');
    expect(wpPresetVar('--fx-ref-danger-500')).toBe('--wp--preset--color--danger-500');
  });

  it('maps the spacing ramp to --wp--preset--spacing--<n>', () => {
    expect(wpPresetVar('--fx-ref-space-4')).toBe('--wp--preset--spacing--4');
    expect(wpPresetVar('--fx-ref-space-0')).toBe('--wp--preset--spacing--0');
  });

  it('returns null for primitives WP does not own (radius/shadow/motion/z)', () => {
    expect(wpPresetVar('--fx-ref-radius-md')).toBeNull();
    expect(wpPresetVar('--fx-ref-shadow-sm')).toBeNull();
    expect(wpPresetVar('--fx-ref-duration-fast')).toBeNull();
    expect(wpPresetVar('--fx-ref-z-modal')).toBeNull();
  });

  it('returns null for semantic vars (only ref.* primitives bridge)', () => {
    expect(wpPresetVar('--fx-color-primary')).toBeNull();
    expect(wpPresetVar('--fx-space-4')).toBeNull();
  });
});

describe('emitWpTheme — WP-aliased :root (Slice 4)', () => {
  it('wraps a color primitive literal as var(--wp--preset--color--…, <literal>)', () => {
    const base: EmitToken[] = [{ cssVar: '--fx-ref-brand-600', type: 'color', value: '#2563eb' }];
    expect(emitWpTheme({ name: '', base })).toBe(
      ':root{--fx-ref-brand-600:var(--wp--preset--color--brand-600,#2563eb)}',
    );
  });

  it('wraps a spacing primitive literal as var(--wp--preset--spacing--…, <literal>)', () => {
    const base: EmitToken[] = [{ cssVar: '--fx-ref-space-4', type: 'dimension', value: '1rem' }];
    expect(emitWpTheme({ name: '', base })).toBe(
      ':root{--fx-ref-space-4:var(--wp--preset--spacing--4,1rem)}',
    );
  });

  it('leaves non-preset primitives and every alias exactly as emitTheme does', () => {
    const base: EmitToken[] = [
      { cssVar: '--fx-ref-radius-md', type: 'dimension', value: '0.375rem' },
      { cssVar: '--fx-color-primary', type: 'color', value: '{ref.brand.600}' },
    ];
    // Only color/space PRIMITIVE literals differ from emitTheme; these do not.
    expect(emitWpTheme({ name: '', base })).toBe(emitTheme({ name: '', base }));
    expect(emitWpTheme({ name: '', base })).toBe(
      ':root{--fx-ref-radius-md:0.375rem;--fx-color-primary:var(--fx-ref-brand-600)}',
    );
  });

  it('preserves mode/autoScheme/scoped structure identically to emitTheme', () => {
    const wp = emitWpTheme(defaultTheme());
    // Same block skeleton (semantics point at --fx-ref-*), only primitive literals wrapped.
    expect(wp).toContain(':root{');
    expect(wp).toContain(':root[data-fx-scheme="dark"]{');
    expect(wp).toContain('@media (prefers-color-scheme:dark)');
    expect(wp).toContain('var(--wp--preset--color--');
    // A semantic color still resolves through the fx-ref chain, never a wp preset directly.
    expect(wp).toContain('--fx-color-primary:var(--fx-ref-brand-');
  });
});

describe('wpThemeJson — theme.json settings fragment (Slice 4)', () => {
  const tj = wpThemeJson();

  it('is a v2 settings fragment with color/spacing/typography/layout', () => {
    expect(tj.version).toBe(2);
    expect(tj.settings.color.palette.length).toBeGreaterThan(0);
    expect(tj.settings.spacing.spacingSizes.length).toBeGreaterThan(0);
    expect(tj.settings.typography.fontSizes.length).toBeGreaterThan(0);
  });

  it('exports the ref color ramp as literal-valued palette presets', () => {
    const brand600 = tj.settings.color.palette.find((p) => p.slug === 'brand-600');
    expect(brand600).toEqual({ slug: 'brand-600', name: 'Brand 600', color: '#2563eb' });
    const neutral0 = tj.settings.color.palette.find((p) => p.slug === 'neutral-0');
    expect(neutral0?.color).toMatch(/^#/);
  });

  it('resolves aliased spacing/typography sizes to their underlying literals', () => {
    const space4 = tj.settings.spacing.spacingSizes.find((p) => p.slug === '4');
    expect(space4).toEqual({ slug: '4', name: 'Space 4', size: '1rem' });
    const headingXl = tj.settings.typography.fontSizes.find((p) => p.slug === 'heading-xl');
    expect(headingXl?.name).toBe('Heading Xl');
    expect(headingXl?.size).toMatch(/rem$/);
  });

  it('maps container tokens onto layout content/wide sizes', () => {
    expect(tj.settings.layout.contentSize).toBe('1024px');
    expect(tj.settings.layout.wideSize).toBe('1280px');
  });

  it('every palette slug lines up with a wpPresetVar target (bridge is consistent)', () => {
    for (const p of tj.settings.color.palette) {
      expect(wpPresetVar(`--fx-ref-${p.slug}`)).toBe(`--wp--preset--color--${p.slug}`);
    }
  });
});
