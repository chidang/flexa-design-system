import { describe, expect, it } from 'vitest';
import {
  SITE_SECTIONS,
  PRESET_ICONS,
  SLOT_REPEAT_KEY,
  parseSlotRef,
  collectSlotRefs,
  capabilities,
  ElementRegistry,
  type PresetNode,
  type SectionSlot,
} from '../src/index.js';

/** All literal color strings anywhere in a preset tree's settings. */
function collectHexLiterals(tree: PresetNode): string[] {
  const found: string[] = [];
  const scan = (value: unknown): void => {
    if (typeof value === 'string') {
      for (const hit of value.match(/#[0-9a-fA-F]{3,8}\b/g) ?? []) found.push(hit);
    } else if (Array.isArray(value)) {
      value.forEach(scan);
    } else if (value !== null && typeof value === 'object') {
      Object.values(value).forEach(scan);
    }
  };
  const walk = (node: PresetNode): void => {
    scan(node.settings ?? {});
    (node.children ?? []).forEach(walk);
  };
  walk(tree);
  return found;
}

const byId = new Map(SITE_SECTIONS.map((s) => [s.id, s]));

describe('parseSlotRef', () => {
  it('parses whole-value slot refs only', () => {
    expect(parseSlotRef('slot:headline')).toBe('headline');
    expect(parseSlotRef('slot:')).toBeNull();
    expect(parseSlotRef('asset:img1')).toBeNull();
    expect(parseSlotRef('plain text')).toBeNull();
    expect(parseSlotRef(42)).toBeNull();
    expect(parseSlotRef(null)).toBeNull();
  });
});

describe('SITE_SECTIONS catalog contract', () => {
  it('ships the 56 curated presets (20 approved + comparison-table + pricing-with-toggle + timeline/spec-list/before-after E13/E14 + lead-form E12 + shop-grid W7 + real-estate T2 + restaurant T3 + appointment-booking/event-registration E12 + saas T4 + room-cards/course-cards + post-meta/post-nav E15 + chrome W8/HF2/HF4 + menu headers HF7 N3 + commerce header + logo header E11), generic first', () => {
    expect(SITE_SECTIONS.map((s) => s.id)).toEqual([
      'hero-centered',
      'hero-split',
      'features-grid',
      'services-cards',
      'about-split',
      'text-prose',
      'stats-band',
      'steps',
      'testimonials',
      'pricing-tiers',
      'pricing-with-toggle',
      'comparison-table',
      'price-list',
      'faq',
      'cta-banner',
      'contact-form',
      'contact-split',
      'lead-form',
      'team',
      'gallery',
      'logo-strip',
      'video-feature',
      'feature-alt-rows',
      'timeline',
      'spec-list',
      'before-after',
      'shop-grid',
      'property-cards',
      'search-hero',
      'dish-cards',
      'menu-list',
      'booking-form',
      'appointment-booking',
      'event-registration',
      'feature-cards-image',
      'room-cards',
      'course-cards',
      'post-meta',
      'post-nav',
      'header-basic',
      'header-cta',
      'header-centered',
      'header-topbar',
      'header-split',
      'header-minimal',
      'header-dropdown',
      'header-mega',
      'header-shop-mega',
      'header-commerce',
      'header-logo',
      'footer-columns',
      'footer-simple',
      'footer-cta',
      'footer-minimal',
      'footer-newsletter',
      'footer-legal',
    ]);
  });

  it('chrome presets carry the right role and landmark; ordinary sections carry none (W8)', () => {
    const roles = new Map(SITE_SECTIONS.map((s) => [s.id, s.role]));
    for (const id of [
      'header-basic',
      'header-cta',
      'header-centered',
      'header-topbar',
      'header-split',
      'header-minimal',
      'header-dropdown',
      'header-mega',
      'header-shop-mega',
      'header-commerce',
      'header-logo',
    ]) {
      expect(roles.get(id), id).toBe('header');
    }
    for (const id of [
      'footer-columns',
      'footer-simple',
      'footer-cta',
      'footer-minimal',
      'footer-newsletter',
      'footer-legal',
    ]) {
      expect(roles.get(id), id).toBe('footer');
    }
    for (const s of SITE_SECTIONS) {
      if (s.role === undefined) continue;
      const landmark = s.tree.settings?.['landmark'];
      expect(landmark, s.id).toBe(s.role === 'header' ? 'banner' : 'contentinfo');
    }
    for (const s of SITE_SECTIONS.filter((x) => x.role === undefined)) {
      expect(['banner', 'contentinfo']).not.toContain(s.tree.settings?.['landmark'] ?? '');
    }
  });

  it('requires lists are non-empty element types, carried by the cross-pack presets', () => {
    const withRequires = SITE_SECTIONS.filter((s) => s.requires !== undefined);
    expect(withRequires.map((s) => s.id)).toEqual([
      'shop-grid',
      'post-meta',
      'post-nav',
      'header-commerce',
      'header-logo',
    ]);
    for (const s of withRequires) {
      expect(s.requires!.length).toBeGreaterThan(0);
      for (const t of s.requires!) expect(t).toMatch(/^[a-z][a-z0-9-]*\/[a-z][a-z0-9-]*$/);
    }
    expect(SITE_SECTIONS.find((s) => s.id === 'post-meta')!.requires).toEqual([
      'wp/post-author',
      'wp/post-date',
      'wp/read-time',
      'wp/comment-count',
    ]);
    expect(SITE_SECTIONS.find((s) => s.id === 'post-nav')!.requires).toEqual(['wp/post-navigation']);
    expect(SITE_SECTIONS.find((s) => s.id === 'header-logo')!.requires).toEqual(['wp/site-logo']);
    expect(SITE_SECTIONS.find((s) => s.id === 'header-commerce')!.requires).toEqual([
      'wp/search-form',
      'woo/cart-link',
    ]);
  });

  it('every id is unique kebab-case and every intent is a non-empty sentence', () => {
    const ids = SITE_SECTIONS.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const s of SITE_SECTIONS) {
      expect(s.id).toMatch(/^[a-z][a-z0-9]*(-[a-z0-9]+)*$/);
      expect(s.intent.trim().length).toBeGreaterThan(20);
    }
  });

  it('slot declarations are well-formed', () => {
    for (const s of SITE_SECTIONS) {
      const names = s.slots.map((sl) => sl.name);
      expect(new Set(names).size).toBe(names.length);
      for (const slot of s.slots) {
        if (slot.kind === 'items') {
          // items slots are required by default; an OPTIONAL one (W8 chrome)
          // must declare prune-when-empty so no empty repeater ever renders.
          if (slot.required === false) expect(slot.whenEmpty).toBe('prune');
          else expect(slot.required).toBe(true);
          expect(slot.min).toBeGreaterThanOrEqual(1);
          expect(slot.max).toBeGreaterThanOrEqual(slot.min!);
          expect(slot.item && slot.item.length).toBeGreaterThan(0);
          const itemNames = slot.item!.map((i) => i.name);
          expect(new Set(itemNames).size).toBe(itemNames.length);
          for (const inner of slot.item!) expect(inner.kind).not.toBe('items');
        } else {
          expect(slot.min).toBeUndefined();
          expect(slot.max).toBeUndefined();
          expect(slot.item).toBeUndefined();
        }
      }
    }
  });

  it('declared slots and tree placeholders match two-way, scalar side', () => {
    for (const s of SITE_SECTIONS) {
      const refs = collectSlotRefs(s.tree);
      const declaredScalars = s.slots.filter((sl) => sl.kind !== 'items').map((sl) => sl.name);
      expect(new Set(refs.scalars), s.id).toEqual(new Set(declaredScalars));
    }
  });

  it('every items slot has exactly one exemplar whose refs match the item slots', () => {
    for (const s of SITE_SECTIONS) {
      const refs = collectSlotRefs(s.tree);
      const declaredItems = s.slots.filter(
        (sl): sl is SectionSlot & { item: readonly SectionSlot[] } => sl.kind === 'items',
      );
      expect(refs.repeats.length, s.id).toBe(declaredItems.length);
      for (const slot of declaredItems) {
        const exemplars = refs.repeats.filter((r) => r.name === slot.name);
        expect(exemplars.length, `${s.id}/${slot.name}`).toBe(1);
        // Item slots referenced elsewhere (e.g. alt reusing 'name') stay a subset
        // in one direction and cover every declared item slot in the other.
        expect(new Set(exemplars[0]!.refs)).toEqual(new Set(slot.item.map((i) => i.name)));
      }
    }
  });

  it('required item slots always exist for image carriers (a11y: alt never empty)', () => {
    // Every image-kind slot placed on a src must pair with a non-empty alt
    // source: either a required text slot reused as alt or an explicit alt slot.
    const gallery = byId.get('gallery')!;
    const galleryItems = gallery.slots.find((sl) => sl.kind === 'items')!;
    expect(galleryItems.item!.find((i) => i.name === 'alt')?.required).toBe(true);
    const logos = byId.get('logo-strip')!;
    const logoItems = logos.slots.find((sl) => sl.kind === 'items')!;
    expect(logoItems.item!.find((i) => i.name === 'alt')?.required).toBe(true);
  });

  it('icon slots carry the closed PRESET_ICONS vocabulary and default fallback', () => {
    for (const id of ['features-grid', 'services-cards']) {
      const slot = byId
        .get(id)!
        .slots.find((sl) => sl.kind === 'items')!
        .item!.find((i) => i.name === 'icon')!;
      expect(slot.options).toEqual(PRESET_ICONS);
      expect(slot.whenEmpty).toBe('default');
    }
  });

  it('bands are theme-driven and no tree carries literals beyond the deliberate list', () => {
    const bandBg = 'var(--fx-color-surface-alt)';
    expect(byId.get('stats-band')!.tree.settings?.['bg']).toBe(bandBg);
    expect(byId.get('cta-banner')!.tree.settings?.['bg']).toBe(bandBg);
    for (const s of SITE_SECTIONS) {
      const literals = collectHexLiterals(s.tree).filter((h) => h !== '#667788');
      expect(literals, s.id).toEqual([]);
    }
  });

  it('every tree is rooted in a section', () => {
    for (const s of SITE_SECTIONS) expect(s.tree.type).toBe('flexa/section');
  });
});

describe('collectSlotRefs', () => {
  it('separates scalars from exemplar item refs and dedupes reused refs', () => {
    const refs = collectSlotRefs(byId.get('hero-split')!.tree);
    // alt reuses slot:headline — deduped into one scalar entry.
    expect(refs.scalars.filter((r) => r === 'headline')).toEqual(['headline']);
    expect(refs.repeats).toEqual([]);
  });

  it('finds repeater-control exemplars (accordion faq)', () => {
    const refs = collectSlotRefs(byId.get('faq')!.tree);
    expect(refs.repeats).toEqual([{ name: 'items', refs: ['question', 'answer'] }]);
    expect(refs.scalars).toEqual(['heading']);
  });

  it('scopes refs under a subtree exemplar to the items slot (marker on a row)', () => {
    const refs = collectSlotRefs(byId.get('feature-alt-rows')!.tree);
    expect(refs.scalars).toEqual([]);
    expect(refs.repeats.length).toBe(1);
    expect(new Set(refs.repeats[0]!.refs)).toEqual(new Set(['title', 'text', 'image']));
  });

  it('folds a nested list exemplar into the enclosing items refs (pricing features, doc 14 §4b)', () => {
    // The pricing card's `features` repeater sits INSIDE the `items` exemplar; its
    // marker names an ITEM slot of that group, not a second top-level repeat.
    const refs = collectSlotRefs(byId.get('pricing-tiers')!.tree);
    expect(refs.scalars).toEqual(['heading']);
    expect(refs.repeats.length).toBe(1);
    expect(refs.repeats[0]!.name).toBe('items');
    expect(new Set(refs.repeats[0]!.refs)).toEqual(
      new Set(['title', 'price', 'subtitle', 'cta', 'trial', 'featured', 'features']),
    );
  });

  it('folds a list nested inside a repeater ENTRY into the parent items bucket (comparison rows/cells)', () => {
    // The table's `rows` is a repeater SETTING (not a subtree); each row's `cells`
    // is a repeater nested inside that entry. The nested marker names an item slot
    // of `rows`, so it stays one repeat — not a second top-level repeat.
    const refs = collectSlotRefs(byId.get('comparison-table')!.tree);
    expect(refs.scalars).toEqual(['heading']);
    expect(refs.repeats.map((r) => r.name).sort()).toEqual(['columns', 'rows']);
    const rows = refs.repeats.find((r) => r.name === 'rows')!;
    expect(rows.refs).toEqual(['cells']);
    const columns = refs.repeats.find((r) => r.name === 'columns')!;
    expect(columns.refs).toEqual(['label']);
  });
});

describe('capabilities().sections', () => {
  it('exposes id/intent/slots for every AVAILABLE preset and never the node tree', () => {
    // A registry without the commerce pack: requires-carrying presets are hidden.
    const caps = capabilities(new ElementRegistry());
    const available = SITE_SECTIONS.filter((s) => s.requires === undefined);
    expect(caps.sections).toBeDefined();
    expect(caps.sections!.length).toBe(available.length);
    caps.sections!.forEach((cap, i) => {
      expect(cap.id).toBe(available[i]!.id);
      expect(cap.intent).toBe(available[i]!.intent);
      expect(cap.slots).toEqual(available[i]!.slots);
      expect('tree' in cap).toBe(false);
    });
    // Serializable snapshot — safe for the CLI / prompt template (W3).
    expect(() => JSON.stringify(caps.sections)).not.toThrow();
  });

  it('surfaces a requires-carrying preset once the registry provides its types (W7)', () => {
    const registry = new ElementRegistry();
    // Every type any preset lists in `requires` — provide them all so the full
    // catalog surfaces (shop-grid + the cross-pack commerce header).
    for (const type of [
      'woo/product-loop',
      'woo/cart-link',
      'wp/search-form',
      'wp/post-author',
      'wp/post-date',
      'wp/read-time',
      'wp/comment-count',
      'wp/post-navigation',
      'wp/site-logo',
    ]) {
      registry.register({
        type,
        title: type,
        category: 'commerce',
        tier: 'declarative',
        version: 1,
        template: '<div></div>',
      });
    }
    const caps = capabilities(registry);
    expect(caps.sections!.length).toBe(SITE_SECTIONS.length);
    const shop = caps.sections!.find((s) => s.id === 'shop-grid');
    expect(shop?.requires).toEqual(['woo/product-loop']);
    const header = caps.sections!.find((s) => s.id === 'header-commerce');
    expect(header?.requires).toEqual(['wp/search-form', 'woo/cart-link']);
    const postMeta = caps.sections!.find((s) => s.id === 'post-meta');
    expect(postMeta?.requires).toEqual([
      'wp/post-author',
      'wp/post-date',
      'wp/read-time',
      'wp/comment-count',
    ]);
  });
});

describe('exemplar markers', () => {
  it(`uses the '${SLOT_REPEAT_KEY}' settings key`, () => {
    // Structural sanity on one node-marker preset and one repeater-marker preset.
    const services = byId.get('services-cards')!.tree;
    const grid = JSON.stringify(services);
    expect(grid).toContain(`"${SLOT_REPEAT_KEY}":"items"`);
    const faq = JSON.stringify(byId.get('faq')!.tree);
    expect(faq).toContain(`"${SLOT_REPEAT_KEY}":"items"`);
  });
});
