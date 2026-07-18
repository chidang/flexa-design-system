import { describe, expect, it } from 'vitest';
import {
  composeSite,
  composeSection,
  sampleSectionFill,
  sitePlanSchema,
  migrateSitePlan,
  runSitePlanMigrations,
  pruneUnknownSlots,
  stripChrome,
  SITE_PLAN_VERSION,
  SITE_SECTIONS,
  SAMPLE_IMAGE,
  ElementRegistry,
  defaultTheme,
  tokenIdToCssVar,
  FDS_VERSION,
  type DesignPack,
  type SitePlanMigration,
} from '../src/index.js';

/** A minimal valid plan — one home page, one fully-filled section. */
const minimalPlan = () => ({
  name: 'Acme Studio',
  pages: [
    {
      title: 'Home',
      path: '/',
      sections: [{ preset: 'cta-banner', copy: { headline: 'Hello', cta: 'Call us' } }],
    },
  ],
});

const emptyRegistry = () => new ElementRegistry();

function composeErrors(plan: unknown): string[] {
  const res = composeSite(plan, { registry: emptyRegistry() });
  expect(res.ok).toBe(false);
  return res.ok ? [] : res.errors;
}

describe('sitePlanSchema gate', () => {
  it('accepts a minimal valid plan', () => {
    expect(sitePlanSchema.safeParse(minimalPlan()).success).toBe(true);
  });

  it('rejects an unknown preset with a specific error', () => {
    const plan = minimalPlan();
    plan.pages[0]!.sections[0]!.preset = 'mega-hero';
    const errors = composeErrors(plan);
    expect(errors.some((e) => e.includes('unknown section preset "mega-hero"'))).toBe(true);
  });

  it('rejects a copy key that is not a declared slot', () => {
    const plan = minimalPlan();
    (plan.pages[0]!.sections[0]!.copy as Record<string, string>)['tagline'] = 'x';
    const errors = composeErrors(plan);
    expect(errors.some((e) => e.includes('has no slot "tagline"'))).toBe(true);
  });

  it('rejects a missing required slot (blank counts as missing)', () => {
    const plan = minimalPlan();
    (plan.pages[0]!.sections[0]!.copy as Record<string, string>)['cta'] = '   ';
    const errors = composeErrors(plan);
    expect(errors.some((e) => e.includes('missing required slot "cta"'))).toBe(true);
  });

  it('routes image slots to "images" and rejects them under "copy"', () => {
    const plan = {
      name: 'X',
      pages: [
        {
          title: 'Home',
          path: '/',
          sections: [
            {
              preset: 'hero-split',
              copy: { headline: 'H', primaryCta: 'Go', image: 'asset:hero' },
            },
          ],
        },
      ],
    };
    const errors = composeErrors(plan);
    expect(errors.some((e) => e.includes('is an image slot'))).toBe(true);
    // And the reverse direction: a text slot under images.
    const plan2 = {
      name: 'X',
      pages: [
        {
          title: 'Home',
          path: '/',
          sections: [
            {
              preset: 'hero-split',
              copy: { headline: 'H', primaryCta: 'Go' },
              images: { image: 'asset:hero', headline: 'nope' },
            },
          ],
        },
      ],
    };
    expect(composeErrors(plan2).some((e) => e.includes('is not an image slot'))).toBe(true);
  });

  it('enforces items presence, bounds, item slots and closed vocabularies', () => {
    const section = (items: unknown) => ({
      name: 'X',
      pages: [
        {
          title: 'Home',
          path: '/',
          sections: [{ preset: 'features-grid', copy: { items } as Record<string, unknown> }],
        },
      ],
    });
    // Missing entirely.
    const missing = {
      name: 'X',
      pages: [
        { title: 'Home', path: '/', sections: [{ preset: 'features-grid', copy: {} }] },
      ],
    };
    expect(composeErrors(missing).some((e) => e.includes('missing required items slot "items"'))).toBe(true);
    // Too few.
    expect(
      composeErrors(section([{ title: 'A', text: 'a' }])).some((e) =>
        e.includes('needs between 3 and 6 items'),
      ),
    ).toBe(true);
    // Unknown item slot.
    expect(
      composeErrors(
        section([
          { title: 'A', text: 'a', badge: 'x' },
          { title: 'B', text: 'b' },
          { title: 'C', text: 'c' },
        ]),
      ).some((e) => e.includes('items have no slot "badge"')),
    ).toBe(true);
    // Missing required item slot.
    expect(
      composeErrors(
        section([{ title: 'A' }, { title: 'B', text: 'b' }, { title: 'C', text: 'c' }]),
      ).some((e) => e.includes('missing required item slot "text"')),
    ).toBe(true);
    // Closed icon vocabulary.
    expect(
      composeErrors(
        section([
          { icon: 'sparkles', title: 'A', text: 'a' },
          { title: 'B', text: 'b' },
          { title: 'C', text: 'c' },
        ]),
      ).some((e) => e.includes('must be one of: star, check, arrow-right, heart, bolt, info')),
    ).toBe(true);
  });

  it('validates kind:list item slots as string arrays (pricing features, doc 14 §4b)', () => {
    const pricingPlan = (items: unknown) => ({
      name: 'X',
      pages: [
        { title: 'Home', path: '/', sections: [{ preset: 'pricing-tiers', copy: { items } }] },
      ],
    });
    // A list slot given a scalar string.
    expect(
      composeErrors(
        pricingPlan([
          { title: 'A', price: '9', features: 'not a list' },
          { title: 'B', price: '19' },
        ]),
      ).some((e) => e.includes('item slot "features" expects a list of strings')),
    ).toBe(true);
    // A scalar slot given a list.
    expect(
      composeErrors(
        pricingPlan([
          { title: ['A'], price: '9' },
          { title: 'B', price: '19' },
        ]),
      ).some((e) => e.includes('item slot "title" expects a string')),
    ).toBe(true);
    // A valid per-tier feature list passes the gate.
    expect(
      sitePlanSchema.safeParse(
        pricingPlan([
          { title: 'A', price: '9', features: ['One', 'Two'] },
          { title: 'B', price: '19', features: ['Three'] },
        ]),
      ).success,
    ).toBe(true);
  });

  it('rejects malformed paths and out-of-bound page counts', () => {
    const plan = minimalPlan();
    plan.pages[0]!.path = 'about';
    expect(composeErrors(plan).some((e) => e.includes('path must start with "/"'))).toBe(true);
    expect(sitePlanSchema.safeParse({ name: 'X', pages: [] }).success).toBe(false);
  });
});

describe('migrateSitePlan', () => {
  it('passes a current-version plan through by reference', () => {
    const plan = { ...minimalPlan(), schemaVersion: SITE_PLAN_VERSION };
    expect(migrateSitePlan(plan)).toBe(plan);
  });

  it('passes garbage and newer versions through unchanged for the validator', () => {
    expect(migrateSitePlan('nope')).toBe('nope');
    expect(migrateSitePlan(null)).toBe(null);
    const newer = { schemaVersion: SITE_PLAN_VERSION + 1 };
    expect(migrateSitePlan(newer)).toBe(newer);
  });

  it('runs a synthetic chain, treating a MISSING version as 1, and stamps the target', () => {
    const migrations: ReadonlyMap<number, SitePlanMigration> = new Map([
      [1, (p) => ({ ...p, upgraded: true })],
    ]);
    const legacy = { name: 'Old' };
    const out = runSitePlanMigrations(legacy, migrations, 2) as Record<string, unknown>;
    expect(out).toEqual({ name: 'Old', upgraded: true, schemaVersion: 2 });
    // A missing step passes through unchanged (no partial upgrades).
    const gap = runSitePlanMigrations({ name: 'Old', schemaVersion: 1 }, new Map(), 3);
    expect(gap).toEqual({ name: 'Old', schemaVersion: 1 });
  });
});

describe('composeSite (registry-independent behavior)', () => {
  it('composes a valid project deterministically even when every type degrades', () => {
    const plan = {
      ...minimalPlan(),
      pages: [
        ...minimalPlan().pages,
        {
          title: 'About',
          path: '/about',
          sections: [{ preset: 'text-prose', copy: { body: 'Our story.' } }],
        },
      ],
    };
    const a = composeSite(plan, { registry: emptyRegistry() });
    const b = composeSite(plan, { registry: emptyRegistry() });
    expect(a.ok).toBe(true);
    if (!a.ok || !b.ok) return;
    expect(JSON.stringify(a.project)).toBe(JSON.stringify(b.project));
    expect(a.project.id).toBe('acme-studio');
    expect(a.project.documents.map((d) => d.id)).toEqual(['home', 'about']);
    expect(a.project.documents.every((d) => d.kind === 'page' && d.tree.type === 'flexa/root')).toBe(true);
    // Empty registry: every section node degrades away.
    expect(a.project.documents[0]!.tree.children).toEqual([]);
    expect(a.project.routing).toEqual({ home: 'home', pages: [{ path: '/about', documentId: 'about' }] });
    expect(a.project.theme).toBeUndefined();
    expect(a.project.assets).toBeUndefined();
  });

  it('derives the theme from brand via applyBrand (and treats an empty brand as absent)', () => {
    const branded = { ...minimalPlan(), brand: { primaryColor: '#0ea5e9' } };
    const res = composeSite(branded, { registry: emptyRegistry() });
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    const primary = res.project.theme?.base.find(
      (t) => t.cssVar === tokenIdToCssVar('color.primary'),
    );
    expect(primary?.value).toBe('#0ea5e9');

    const emptyBrand = composeSite({ ...minimalPlan(), brand: {} }, { registry: emptyRegistry() });
    expect(emptyBrand.ok && emptyBrand.project.theme === undefined).toBe(true);
  });

  it('resolves packRef against designPacks — and errors when it cannot', () => {
    const pack: DesignPack = {
      kind: 'design',
      name: 'ocean',
      vendor: 'flexa',
      version: '1.0.0',
      fdsVersion: FDS_VERSION,
      theme: defaultTheme(),
    };
    const plan = { ...minimalPlan(), packRef: { vendor: 'flexa', name: 'ocean' } };
    const ok = composeSite(plan, { registry: emptyRegistry(), designPacks: [pack] });
    expect(ok.ok).toBe(true);
    if (ok.ok) {
      expect(ok.project.theme).toEqual(defaultTheme());
      expect(ok.project.meta).toEqual({ packRef: { vendor: 'flexa', name: 'ocean' } });
    }
    const missing = composeSite(plan, { registry: emptyRegistry() });
    expect(missing.ok).toBe(false);
    if (!missing.ok) {
      expect(missing.errors.some((e) => e.includes('design pack "flexa/ocean" not found'))).toBe(true);
    }
  });

  it('rejects duplicate paths and colliding document ids', () => {
    const dup = {
      name: 'X',
      pages: [
        { title: 'A', path: '/a', sections: minimalPlan().pages[0]!.sections },
        { title: 'B', path: '/a', sections: minimalPlan().pages[0]!.sections },
      ],
    };
    expect(composeErrors(dup).some((e) => e.includes('duplicate path "/a"'))).toBe(true);

    const collide = {
      name: 'X',
      pages: [
        { title: 'A', path: '/a-b', sections: minimalPlan().pages[0]!.sections },
        { title: 'B', path: '/a/b', sections: minimalPlan().pages[0]!.sections },
      ],
    };
    expect(composeErrors(collide).some((e) => e.includes('already taken by another page'))).toBe(true);
  });
});

describe('pruneUnknownSlots — AI candidate normalisation (doc 14 W3)', () => {
  /** The real-world repro: a "team" section with an invented "items_note" key. */
  const teamPlan = () => ({
    name: 'Acme Studio',
    pages: [
      {
        title: 'Home',
        path: '/',
        sections: [
          { preset: 'cta-banner', copy: { headline: 'Hello', cta: 'Call us' } },
          {
            preset: 'team',
            copy: {
              heading: 'Meet the team',
              items_note: 'We are growing!',
              items: [
                { name: 'Ann', role: 'Founder', linkedin: 'https://x' },
                { name: 'Bob', role: 'Chef' },
              ],
            },
            images: { banner: 'asset:banner' },
          },
        ],
      },
    ],
  });

  it('drops invented copy/item/images keys with full dot paths, and the plan then composes', () => {
    const { plan, dropped } = pruneUnknownSlots(teamPlan());
    expect(dropped).toEqual([
      'pages.0.sections.1.copy.items_note',
      'pages.0.sections.1.copy.items.0.linkedin',
      'pages.0.sections.1.images.banner',
    ]);
    const res = composeSite(plan, { registry: emptyRegistry() });
    expect(res.ok, res.ok ? '' : res.errors.join('\n')).toBe(true);
    // Known content survives verbatim.
    const section = (plan as ReturnType<typeof teamPlan>).pages[0]!.sections[1]!;
    expect(section.copy['heading']).toBe('Meet the team');
    expect(section.copy['items']).toEqual([
      { name: 'Ann', role: 'Founder' },
      { name: 'Bob', role: 'Chef' },
    ]);
  });

  it('does not touch misplaced keys — real content stays for the gate to flag', () => {
    const plan = {
      name: 'X',
      pages: [
        {
          title: 'Home',
          path: '/',
          sections: [
            {
              preset: 'hero-split',
              copy: { headline: 'H', primaryCta: 'Go', image: 'asset:hero' },
            },
          ],
        },
      ],
    };
    const pruned = pruneUnknownSlots(plan);
    expect(pruned.dropped).toEqual([]);
    expect(pruned.plan).toBe(plan); // nothing dropped ⇒ input by reference
    const errors = composeErrors(pruned.plan);
    expect(errors.some((e) => e.includes('put it under "images"'))).toBe(true);
  });

  it('leaves unknown presets and non-plan garbage untouched, and never mutates its input', () => {
    const unknownPreset = {
      name: 'X',
      pages: [
        { title: 'A', path: '/', sections: [{ preset: 'mega-hero', copy: { woo: 'x' } }] },
      ],
    };
    expect(pruneUnknownSlots(unknownPreset).plan).toBe(unknownPreset);
    expect(pruneUnknownSlots(null).plan).toBe(null);
    expect(pruneUnknownSlots('garbage')).toEqual({ plan: 'garbage', dropped: [] });

    const input = teamPlan();
    const before = JSON.stringify(input);
    pruneUnknownSlots(input);
    expect(JSON.stringify(input)).toBe(before);
  });
});

describe('preset availability gate (requires, doc 14 §4b W7)', () => {
  const shopPlan = () => ({
    name: 'Acme Shop',
    pages: [
      {
        title: 'Shop',
        path: '/',
        sections: [{ preset: 'shop-grid', copy: { heading: 'Our products', source: 'sale' } }],
      },
    ],
  });

  it('rejects a requires-carrying preset on a host that lacks the element, with a specific error', () => {
    const res = composeSite(shopPlan(), { registry: emptyRegistry() });
    expect(res.ok).toBe(false);
    if (res.ok) return;
    expect(
      res.errors.some((e) =>
        e.includes('requires element(s) this host does not provide: woo/product-loop'),
      ),
    ).toBe(true);
  });

  it('composes once the registry provides the required type', () => {
    const registry = emptyRegistry();
    // Minimal layout carriers — an unknown ancestor would degrade the whole subtree.
    for (const type of ['flexa/section', 'flexa/row', 'flexa/column', 'flexa/heading']) {
      registry.register({ type, title: type, version: 1, template: '<div>{{{children}}}</div>' });
    }
    registry.register({
      type: 'woo/product-loop',
      title: 'Product Loop',
      version: 1,
      schema: {
        source: { type: 'select', options: ['recent', 'featured', 'sale'], default: 'recent' },
        category: { type: 'text', default: '' },
        count: { type: 'number', default: 4, min: 1, max: 24 },
      },
      template: '<div>{{#list}}shop{{/list}}</div>',
    });
    const res = composeSite(shopPlan(), { registry });
    expect(res.ok, res.ok ? '' : res.errors.join('\n')).toBe(true);
    if (!res.ok) return;
    const walk = (n: { type: string; settings: Record<string, unknown>; children: any[] }): any[] =>
      [n, ...n.children.flatMap(walk)];
    const loop = walk(res.project.documents[0]!.tree as never).find(
      (n) => n.type === 'woo/product-loop',
    );
    expect(loop).toBeDefined();
    expect(loop.settings).toMatchObject({ source: 'sale' });
    // category/count unfilled → whenEmpty 'default' drops them (manifest defaults apply).
    expect('category' in loop.settings).toBe(false);
    expect('count' in loop.settings).toBe(false);
  });
});

describe('chrome plan surface (doc 14 §4b W8)', () => {
  const chromePlan = () => ({
    name: 'Acme Studio',
    chrome: {
      header: {
        preset: 'header-basic',
        copy: {
          brand: 'Acme',
          links: [
            { label: 'Home', url: '/' },
            { label: 'Contact', url: '/contact' },
          ],
        },
      },
      footer: { preset: 'footer-simple', copy: { copyright: '© Acme' } },
    },
    pages: [
      {
        title: 'Home',
        path: '/',
        sections: [{ preset: 'cta-banner', copy: { headline: 'Hello', cta: 'Call us' } }],
      },
    ],
  });

  it('accepts global chrome and validates its slots like any section', () => {
    expect(sitePlanSchema.safeParse(chromePlan()).success).toBe(true);
    const missingBrand = chromePlan();
    (missingBrand.chrome.header.copy as Record<string, unknown>)['brand'] = '';
    const res = sitePlanSchema.safeParse(missingBrand);
    expect(res.success).toBe(false);
  });

  it('rejects a chrome preset inside pages[].sections with a role error', () => {
    const plan = chromePlan();
    (plan.pages[0]!.sections as unknown[]).push({
      preset: 'header-basic',
      copy: { brand: 'X', links: [{ label: 'A', url: '/' }, { label: 'B', url: '/b' }] },
    });
    const errors = composeErrors(plan);
    expect(errors.some((e) => e.includes('is a header preset'))).toBe(true);
  });

  it('rejects a non-chrome preset under chrome, and a footer preset as header', () => {
    const wrongKind = chromePlan();
    (wrongKind.chrome as Record<string, unknown>)['header'] = {
      preset: 'faq',
      copy: { items: [] },
    };
    expect(composeErrors(wrongKind).some((e) => e.includes('"faq" is not a header preset'))).toBe(
      true,
    );

    const swapped = chromePlan();
    (swapped.chrome as Record<string, unknown>)['header'] = {
      preset: 'footer-simple',
      copy: { copyright: '©' },
    };
    expect(
      composeErrors(swapped).some((e) => e.includes('"footer-simple" is not a header preset')),
    ).toBe(true);
  });

  it('accepts per-page overrides including null (= no chrome on that page)', () => {
    const plan = chromePlan() as Record<string, unknown>;
    (plan['pages'] as Array<Record<string, unknown>>)[0]!['header'] = null;
    expect(sitePlanSchema.safeParse(plan).success).toBe(true);
  });

  it('pruneUnknownSlots also prunes invented keys inside chrome and page overrides', () => {
    const plan = chromePlan() as Record<string, unknown>;
    const chrome = plan['chrome'] as Record<string, Record<string, unknown>>;
    (chrome['header']!['copy'] as Record<string, unknown>)['tagline'] = 'x';
    const { dropped } = pruneUnknownSlots(plan);
    expect(dropped).toEqual(['chrome.header.copy.tagline']);
  });
});

describe('stripChrome (doc 14 §4b W8 — hosts whose theme owns the chrome)', () => {
  it('removes site chrome and page overrides, reporting dot paths', () => {
    const plan = {
      name: 'X',
      chrome: { header: { preset: 'header-basic', copy: {} } },
      pages: [
        { title: 'Home', path: '/', sections: [], header: null },
        { title: 'B', path: '/b', sections: [], footer: { preset: 'footer-simple', copy: {} } },
      ],
    };
    const res = stripChrome(plan);
    expect(res.dropped).toEqual(['chrome', 'pages.0.header', 'pages.1.footer']);
    const out = res.plan as Record<string, unknown>;
    expect('chrome' in out).toBe(false);
    const pages = out['pages'] as Array<Record<string, unknown>>;
    expect('header' in pages[0]!).toBe(false);
    expect('footer' in pages[1]!).toBe(false);
  });

  it('returns the input by reference when there is nothing to strip', () => {
    const plan = minimalPlan();
    expect(stripChrome(plan).plan).toBe(plan);
    expect(stripChrome(null).plan).toBe(null);
  });
});

describe('composeSection + sampleSectionFill (doc 14 §4c — editor pattern library)', () => {
  const URL = 'https://example.com/sample.png';

  it('every catalog preset ships a sample fill that passes the REAL plan gate', () => {
    for (const preset of SITE_SECTIONS) {
      const fill = sampleSectionFill(preset, URL);
      // Embed the fill where the plan schema expects this preset's role, with a
      // minimal page so the envelope itself is valid.
      const page = {
        title: 'Home',
        path: '/',
        sections: [{ preset: 'cta-banner', copy: { headline: 'Hello', cta: 'Call us' } }],
      };
      const plan =
        preset.role === 'header'
          ? { name: 'X', chrome: { header: fill }, pages: [page] }
          : preset.role === 'footer'
            ? { name: 'X', chrome: { footer: fill }, pages: [page] }
            : { name: 'X', pages: [{ ...page, sections: [fill] }] };
      const parsed = sitePlanSchema.safeParse(plan);
      const issues = parsed.success
        ? []
        : parsed.error.issues.map((i) => `${preset.id}: ${i.path.join('.')}: ${i.message}`);
      expect(issues).toEqual([]);
    }
  });

  it('swaps every SAMPLE_IMAGE sentinel for the given URL (bags and items)', () => {
    for (const preset of SITE_SECTIONS) {
      const fill = sampleSectionFill(preset, URL);
      expect(JSON.stringify(fill)).not.toContain(SAMPLE_IMAGE);
    }
    const hero = SITE_SECTIONS.find((s) => s.id === 'hero-split')!;
    expect(sampleSectionFill(hero, URL).images).toEqual({ image: URL });
    const team = SITE_SECTIONS.find((s) => s.id === 'team')!;
    const items = sampleSectionFill(team, URL).copy!['items'] as Array<Record<string, string>>;
    expect(items.every((i) => i['photo'] === URL)).toBe(true);
  });

  it('composeSection gates missing requires with a specific error', () => {
    const shop = SITE_SECTIONS.find((s) => s.id === 'shop-grid')!;
    const res = composeSection(shop, sampleSectionFill(shop, URL), {
      registry: emptyRegistry(),
    });
    expect(res.node).toBeNull();
    expect(res.errors.some((e) => e.includes('woo/product-loop'))).toBe(true);
  });

  it('composes deterministically on a minimal registry with injected ids', () => {
    const registry = new ElementRegistry();
    for (const type of [
      'flexa/section',
      'flexa/row',
      'flexa/column',
      'flexa/heading',
      'flexa/text',
      'flexa/button',
    ]) {
      registry.register({ type, title: type, version: 1, template: '<div>{{{children}}}</div>' });
    }
    const hero = SITE_SECTIONS.find((s) => s.id === 'hero-centered')!;
    const fill = sampleSectionFill(hero, URL);
    const a = composeSection(hero, fill, { registry, nextId: (n) => `p${n}` });
    const b = composeSection(hero, fill, { registry, nextId: (n) => `p${n}` });
    expect(a.errors).toEqual([]);
    expect(a.node).not.toBeNull();
    expect(a.node!.id).toMatch(/^p\d+$/); // injected generator (ids are post-order)
    expect(a).toEqual(b);
    expect(JSON.stringify(a.node)).not.toContain('slot:');
  });
});
