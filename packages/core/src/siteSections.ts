/**
 * Site catalog data — the curated `SITE_SECTIONS` presets (doc 14 §4, doc 17
 * HF2). Split from `siteCatalog.ts` so the contract (types, slot walker,
 * vocabularies) stays a short readable module and this file is pure authored
 * data: intent + slot contract + one token-first node tree per preset.
 *
 * Authoring rules live on the contract types; the drift-locks live in
 * `tests/siteCatalog.spec.ts` (order, roles, slot two-way match) and
 * `element-pack-demo/tests/site-catalog.spec.ts` (types/keys/options exist).
 * NOT a frozen engine. Trees are shared module constants — treat them as
 * immutable (the composer clones before filling).
 */

import type { PresetNode, Settings } from './types.js';
import {
  PRESET_ICONS,
  PRESET_SOCIAL,
  SLOT_REPEAT_KEY,
  type SectionPreset,
  type SectionSlot,
} from './siteCatalog.js';

/** Alternating band background — theme-driven, never a literal (doc 12/§2). */
const BAND = 'var(--fx-color-surface-alt)';

/** Deliberate literal for secondary/meta copy inside cards (token-first §2 list). */
const MUTED = '#667788';

const text = (name: string, opts: Partial<SectionSlot> = {}): SectionSlot => ({
  name,
  kind: 'text',
  ...opts,
});
const longtext = (name: string, opts: Partial<SectionSlot> = {}): SectionSlot => ({
  name,
  kind: 'longtext',
  ...opts,
});
const image = (name: string, opts: Partial<SectionSlot> = {}): SectionSlot => ({
  name,
  kind: 'image',
  ...opts,
});
/** A `kind:'list'` ITEM slot (doc 14 §4b lift): value is a string[] the carrier
 *  element's repeater expands one entry per string. Item-level only. */
const list = (name: string, opts: Partial<SectionSlot> = {}): SectionSlot => ({
  name,
  kind: 'list',
  ...opts,
});
/** An items slot under any name (chrome presets carry several). Optional items
 *  slots (`required: false`) must pair with `whenEmpty: 'prune'` — unfilled, the
 *  exemplar's carrying node is pruned instead of rendering empty. */
const itemList = (
  name: string,
  min: number,
  max: number,
  item: readonly SectionSlot[],
  opts: Partial<SectionSlot> = {},
): SectionSlot => ({
  name,
  kind: 'items',
  required: true,
  min,
  max,
  item,
  ...opts,
});
const items = (min: number, max: number, item: readonly SectionSlot[]): SectionSlot =>
  itemList('items', min, max, item);

const node = (type: string, settings: Settings = {}, children?: PresetNode[]): PresetNode => ({
  type,
  settings,
  ...(children ? { children } : {}),
});
const section = (settings: Settings, children: PresetNode[]): PresetNode =>
  node('flexa/section', settings, children);
const row = (children: PresetNode[], settings: Settings = {}): PresetNode =>
  node('flexa/row', settings, children);
const column = (span: number, children: PresetNode[], settings: Settings = {}): PresetNode =>
  node('flexa/column', { span: { desktop: span }, ...settings }, children);
const heading = (settings: Settings): PresetNode => node('flexa/heading', settings);
const textEl = (settings: Settings): PresetNode => node('flexa/text', settings);
const button = (settings: Settings): PresetNode => node('flexa/button', settings);
const imageEl = (settings: Settings): PresetNode => node('flexa/image', settings);

const ICON_SLOT: Partial<SectionSlot> = { options: PRESET_ICONS, whenEmpty: 'default' };

/**
 * The curated catalog: 20 approved sections of v1 (14-site-generation.md §4)
 * + shop-grid (W7) + site chrome — 5 headers / 6 footers (W8 + doc 17 HF2).
 * Order is part of the contract: generic building blocks first, chrome last
 * (headers before footers, the default of each role first).
 */
export const SITE_SECTIONS: readonly SectionPreset[] = [
  {
    id: 'hero-centered',
    intent:
      'Opening section with one large centered message; use at the top of a page when there is no hero image.',
    slots: [
      text('headline', { required: true }),
      text('subhead'),
      text('primaryCta', { required: true }),
      text('secondaryCta'),
    ],
    tree: section({ pad: { desktop: '96px 24px', mobile: '64px 20px' } }, [
      row([
        column(
          12,
          [
            heading({
              text: 'slot:headline',
              font: { size: 44, weight: 700, lineHeight: 1.15 },
            }),
            textEl({ text: 'slot:subhead' }),
            button({ label: 'slot:primaryCta' }),
            button({ label: 'slot:secondaryCta' }),
          ],
          { align: 'center' },
        ),
      ]),
    ]),
  },
  {
    id: 'hero-split',
    intent:
      'Opening section with the message on the left and a large illustrative image on the right; the default hero when an image is available.',
    slots: [
      text('headline', { required: true }),
      text('subhead'),
      text('primaryCta', { required: true }),
      image('image', { required: true }),
    ],
    tree: section({ pad: { desktop: '80px 24px', mobile: '56px 20px' } }, [
      row(
        [
          column(6, [
            heading({
              text: 'slot:headline',
              font: { size: 40, weight: 700, lineHeight: 1.15 },
            }),
            textEl({ text: 'slot:subhead' }),
            button({ label: 'slot:primaryCta' }),
          ]),
          column(6, [imageEl({ src: 'slot:image', alt: 'slot:headline' })]),
        ],
        { valign: 'middle' },
      ),
    ]),
  },
  {
    id: 'features-grid',
    intent:
      'A grid of 3–6 short selling points or capabilities, each with an icon, a title and one line of copy.',
    slots: [
      text('heading'),
      items(3, 6, [
        text('icon', ICON_SLOT),
        text('title', { required: true }),
        text('text', { required: true }),
      ]),
    ],
    tree: section({}, [
      row([
        column(
          12,
          [
            heading({ text: 'slot:heading' }),
            node('flexa/grid', { columns: '3', gap: 30 }, [
              node('flexa/iconbox', {
                [SLOT_REPEAT_KEY]: 'items',
                icon: 'slot:icon',
                title: 'slot:title',
                text: 'slot:text',
              }),
            ]),
          ],
          { align: 'center' },
        ),
      ]),
    ]),
  },
  {
    id: 'services-cards',
    intent:
      'The main services or offerings, one raised card per service with an icon, a title and a short description.',
    slots: [
      text('heading'),
      text('intro'),
      items(3, 6, [
        text('icon', ICON_SLOT),
        text('title', { required: true }),
        text('text', { required: true }),
      ]),
    ],
    tree: section({}, [
      row([
        column(12, [heading({ text: 'slot:heading' }), textEl({ text: 'slot:intro' })], {
          align: 'center',
        }),
      ]),
      row(
        [
          column(
            4,
            [
              node('flexa/card', {}, [
                node('flexa/icon', { name: 'slot:icon', size: 32 }),
                heading({ text: 'slot:title', font: { size: 20, weight: 700 } }),
                textEl({ text: 'slot:text' }),
              ]),
            ],
            { [SLOT_REPEAT_KEY]: 'items' },
          ),
        ],
        { depth: '1', depthHover: '3' },
      ),
    ]),
  },
  {
    id: 'about-split',
    intent:
      'Introduce the business or team with an image beside a few paragraphs; use once per site, typically on the home or about page.',
    slots: [
      text('heading', { required: true }),
      longtext('body', { required: true }),
      image('image'),
      text('cta'),
    ],
    tree: section({}, [
      row(
        [
          column(6, [imageEl({ src: 'slot:image', alt: 'slot:heading' })]),
          column(6, [
            heading({ text: 'slot:heading' }),
            textEl({ text: 'slot:body' }),
            button({ label: 'slot:cta' }),
          ]),
        ],
        { valign: 'middle' },
      ),
    ]),
  },
  {
    id: 'text-prose',
    intent:
      'Plain long-form text (a story, policy or detailed explanation) with an optional heading; no imagery.',
    slots: [text('heading'), longtext('body', { required: true })],
    tree: section({}, [
      row([column(12, [heading({ text: 'slot:heading' }), textEl({ text: 'slot:body' })])]),
    ]),
  },
  {
    id: 'stats-band',
    intent:
      'A full-width band of 2–4 impressive numbers (years of experience, customers served) with short labels.',
    slots: [
      items(2, 4, [text('value', { required: true }), text('label', { required: true })]),
    ],
    tree: section({ bg: BAND }, [
      row([
        column(
          4,
          [
            heading({ text: 'slot:value', font: { size: 40, weight: 700 } }),
            textEl({ text: 'slot:label', color: MUTED }),
          ],
          { align: 'center', [SLOT_REPEAT_KEY]: 'items' },
        ),
      ]),
    ]),
  },
  {
    id: 'steps',
    intent:
      'A "how we work" process in 3–4 sequential steps, each with a title and one line of explanation.',
    slots: [
      text('heading'),
      items(3, 4, [text('title', { required: true }), text('text', { required: true })]),
    ],
    tree: section({}, [
      row([column(12, [heading({ text: 'slot:heading' })], { align: 'center' })]),
      row([
        column(
          4,
          [
            node('flexa/iconbox', {
              icon: 'check',
              title: 'slot:title',
              text: 'slot:text',
            }),
          ],
          { [SLOT_REPEAT_KEY]: 'items' },
        ),
      ]),
    ]),
  },
  {
    id: 'testimonials',
    intent:
      'Customer quotes (1–3) building trust, each with the customer name, role and an optional star rating.',
    slots: [
      text('heading'),
      items(1, 3, [
        longtext('quote', { required: true }),
        text('name', { required: true }),
        text('role'),
        // Star rating 1–5; unfilled = the rating row is pruned (no fake stars).
        text('rating', { options: ['1', '2', '3', '4', '5'], whenEmpty: 'prune' }),
      ]),
    ],
    tree: section({}, [
      row([column(12, [heading({ text: 'slot:heading' })], { align: 'center' })]),
      row([
        column(
          4,
          [
            node('flexa/card', {}, [
              node('flexa/rating', { value: 'slot:rating', size: 18 }),
              node('flexa/quote', { text: 'slot:quote' }),
              heading({ text: 'slot:name', font: { size: 16, weight: 700 } }),
              textEl({ text: 'slot:role', color: MUTED }),
            ]),
          ],
          { [SLOT_REPEAT_KEY]: 'items' },
        ),
      ]),
    ]),
  },
  {
    id: 'pricing-tiers',
    intent:
      'Compare 2–4 pricing plans side by side, each with a per-plan list of included features; mark exactly one plan as featured when there is a recommended option.',
    slots: [
      text('heading'),
      items(2, 4, [
        text('title', { required: true }),
        text('price', { required: true }),
        text('subtitle', { whenEmpty: 'default' }),
        // Per-tier feature bullets (doc 14 §4b lift): each plan lists its OWN
        // included features — a list of short strings, not a shared column.
        list('features', { whenEmpty: 'default' }),
        text('cta', { whenEmpty: 'default' }),
        text('trial', { whenEmpty: 'default' }),
        text('featured', { options: ['true', 'false'], whenEmpty: 'default' }),
      ]),
    ],
    tree: section({}, [
      row([column(12, [heading({ text: 'slot:heading' })], { align: 'center' })]),
      row([
        column(
          4,
          [
            node('flexa/pricing', {
              title: 'slot:title',
              price: 'slot:price',
              subtitle: 'slot:subtitle',
              cta: 'slot:cta',
              trial: 'slot:trial',
              featured: 'slot:featured',
              // One exemplar entry expanded per string of the `features` list slot.
              features: [{ [SLOT_REPEAT_KEY]: 'features', text: 'slot:features' }],
            }),
          ],
          { [SLOT_REPEAT_KEY]: 'items' },
        ),
      ]),
    ]),
  },
  {
    id: 'comparison-table',
    intent:
      'Compare options feature by feature in a table: header columns for the plans/products and one row per feature with a cell under each column. The first column labels the feature; each row lists one cell per column in order.',
    slots: [
      text('heading'),
      // Header labels: the first is the feature-column header (often blank or
      // "Features"), then one per option being compared.
      itemList('columns', 2, 6, [text('label', { required: true })]),
      // Each row is a feature: a list of cells, one string per column IN ORDER
      // (doc 14 §4b lift — a row is a list-of-strings the table expands per cell).
      itemList('rows', 1, 15, [list('cells', { required: true })]),
    ],
    tree: section({}, [
      row([
        column(12, [
          heading({ text: 'slot:heading' }),
          node('flexa/table', {
            striped: true,
            // One exemplar column, expanded per `columns` item.
            columns: [{ [SLOT_REPEAT_KEY]: 'columns', label: 'slot:label' }],
            // One exemplar row; its `cells` repeater expands per string of the
            // row's `cells` list slot (a repeater nested inside a repeater entry).
            rows: [
              {
                [SLOT_REPEAT_KEY]: 'rows',
                cells: [{ [SLOT_REPEAT_KEY]: 'cells', text: 'slot:cells' }],
              },
            ],
          }),
        ]),
      ]),
    ]),
  },
  {
    id: 'price-list',
    intent:
      'A simple list of 3–12 named prices (menu items, individual services) without plan comparison.',
    slots: [
      text('heading'),
      items(3, 12, [
        text('name', { required: true }),
        text('price', { required: true }),
        text('note'),
      ]),
    ],
    tree: section({}, [
      row([
        column(12, [
          heading({ text: 'slot:heading' }),
          node('flexa/grid', { columns: '2', gap: 20 }, [
            node('flexa/card', { [SLOT_REPEAT_KEY]: 'items', gap: 4 }, [
              heading({ text: 'slot:name', font: { size: 18, weight: 600 } }),
              textEl({ text: 'slot:price' }),
              textEl({ text: 'slot:note', color: MUTED }),
            ]),
          ]),
        ]),
      ]),
    ]),
  },
  {
    id: 'faq',
    intent: 'Frequently asked questions (3–10) as an expandable accordion.',
    slots: [
      text('heading'),
      items(3, 10, [
        text('question', { required: true }),
        longtext('answer', { required: true }),
      ]),
    ],
    tree: section({}, [
      row([
        column(12, [
          heading({ text: 'slot:heading' }),
          node('flexa/accordion', {
            single: true,
            items: [
              {
                [SLOT_REPEAT_KEY]: 'items',
                title: 'slot:question',
                content: 'slot:answer',
                open: false,
              },
            ],
          }),
        ]),
      ]),
    ]),
  },
  {
    id: 'cta-banner',
    intent:
      'A closing call-to-action band near the end of a page: one line and one button on an alternate background.',
    slots: [text('headline', { required: true }), text('cta', { required: true })],
    tree: section({ bg: BAND, pad: { desktop: '64px 24px' } }, [
      row([
        column(
          12,
          [
            heading({ text: 'slot:headline', font: { size: 32, weight: 700 } }),
            button({ label: 'slot:cta' }),
          ],
          { align: 'center' },
        ),
      ]),
    ]),
  },
  {
    id: 'contact-form',
    intent: 'A standard contact form (name, email, message) with a heading and optional intro.',
    slots: [
      text('heading', { required: true }),
      text('intro'),
      text('submitLabel', { whenEmpty: 'default' }),
    ],
    tree: section({}, [
      row([
        column(12, [
          heading({ text: 'slot:heading' }),
          textEl({ text: 'slot:intro' }),
          node('flexa/form', {}, [
            node('flexa/form-text', { label: 'Name', name: 'name', required: true }),
            node('flexa/form-email', { label: 'Email', name: 'email', required: true }),
            node('flexa/form-textarea', { label: 'Message', name: 'message', required: true }),
            node('flexa/form-submit', { text: 'slot:submitLabel' }),
          ]),
        ]),
      ]),
    ]),
  },
  {
    id: 'contact-split',
    intent:
      'Contact form beside practical information (address, opening hours, phone) and an optional embedded map; the default contact-page section.',
    slots: [
      text('heading', { required: true }),
      longtext('info', { required: true }),
      text('submitLabel', { whenEmpty: 'default' }),
      // Paste-in embed URL (Google Maps Share→Embed / OSM); unfilled = no map.
      { name: 'mapUrl', kind: 'url', whenEmpty: 'prune' },
    ],
    tree: section({}, [
      row([
        column(5, [
          heading({ text: 'slot:heading' }),
          textEl({ text: 'slot:info' }),
          node('flexa/map-embed', { url: 'slot:mapUrl', height: 240 }),
        ]),
        column(7, [
          node('flexa/form', {}, [
            node('flexa/form-text', { label: 'Name', name: 'name', required: true }),
            node('flexa/form-email', { label: 'Email', name: 'email', required: true }),
            node('flexa/form-textarea', { label: 'Message', name: 'message', required: true }),
            node('flexa/form-submit', { text: 'slot:submitLabel' }),
          ]),
        ]),
      ]),
    ]),
  },
  {
    id: 'team',
    intent: 'Introduce 2–4 team members with photo, name and role.',
    slots: [
      text('heading'),
      items(2, 4, [image('photo'), text('name', { required: true }), text('role')]),
    ],
    tree: section({}, [
      row([column(12, [heading({ text: 'slot:heading' })], { align: 'center' })]),
      row([
        column(
          4,
          [
            node('flexa/card', { align: 'center' }, [
              imageEl({ src: 'slot:photo', alt: 'slot:name' }),
              heading({ text: 'slot:name', font: { size: 20, weight: 700 } }),
              textEl({ text: 'slot:role', color: MUTED }),
            ]),
          ],
          { [SLOT_REPEAT_KEY]: 'items' },
        ),
      ]),
    ]),
  },
  {
    id: 'gallery',
    intent:
      'A grid of 3–8 photos showing work, products or the venue; photos open in a lightbox.',
    slots: [
      text('heading'),
      items(3, 8, [image('image', { required: true }), text('alt', { required: true })]),
    ],
    // Carried by the flexa/gallery element (E3) — progressive lightbox for free;
    // the items exemplar is one entry of its `images` repeater (the faq pattern).
    tree: section({}, [
      row([
        column(12, [
          heading({ text: 'slot:heading' }),
          node('flexa/gallery', {
            images: [{ [SLOT_REPEAT_KEY]: 'items', src: 'slot:image', alt: 'slot:alt' }],
          }),
        ]),
      ]),
    ]),
  },
  {
    id: 'logo-strip',
    intent:
      'A slim strip of 3–6 partner, client or certification logos as social proof; alt is the partner name.',
    slots: [items(3, 6, [image('image', { required: true }), text('alt', { required: true })])],
    // Logos keep their slim curated span — dividing 12 by a low count would blow
    // each cell up to a third of the row.
    itemSpan: 'fixed',
    tree: section({}, [
      row(
        [
          column(2, [imageEl({ src: 'slot:image', alt: 'slot:alt' })], {
            [SLOT_REPEAT_KEY]: 'items',
          }),
        ],
        { valign: 'middle' },
      ),
    ]),
  },
  {
    id: 'video-feature',
    intent: 'An introduction or product video (MP4 URL) with a heading and a short lead-in.',
    slots: [
      text('heading'),
      text('body'),
      { name: 'videoUrl', kind: 'url', required: true },
    ],
    tree: section({}, [
      row([
        column(
          12,
          [
            heading({ text: 'slot:heading' }),
            textEl({ text: 'slot:body' }),
            node('flexa/video', { src: 'slot:videoUrl' }),
          ],
          { align: 'center' },
        ),
      ]),
    ]),
  },
  {
    id: 'feature-alt-rows',
    intent:
      'Tell a story in 2–3 alternating image-beside-text rows, one feature or benefit per row.',
    alternateItems: true,
    slots: [
      items(2, 3, [
        text('title', { required: true }),
        text('text', { required: true }),
        image('image', { required: true }),
      ]),
    ],
    tree: section({}, [
      row(
        [
          column(6, [
            heading({ text: 'slot:title', font: { size: 28, weight: 700 } }),
            textEl({ text: 'slot:text' }),
          ]),
          column(6, [imageEl({ src: 'slot:image', alt: 'slot:title' })]),
        ],
        { valign: 'middle', [SLOT_REPEAT_KEY]: 'items' },
      ),
    ]),
  },
  {
    id: 'shop-grid',
    intent:
      'A grid of products pulled live from the online store (recent, featured or on sale, optionally one category); only for sites that sell products.',
    // Commerce carrier — one preset, variants through options (doc 14 §4b W7).
    requires: ['woo/product-loop'],
    slots: [
      text('heading'),
      text('source', { options: ['recent', 'featured', 'sale'], whenEmpty: 'default' }),
      text('category', { whenEmpty: 'default' }),
      text('count', { whenEmpty: 'default' }),
    ],
    tree: section({}, [
      row([
        column(12, [
          heading({ text: 'slot:heading' }),
          node('woo/product-loop', {
            source: 'slot:source',
            category: 'slot:category',
            count: 'slot:count',
          }),
        ]),
      ]),
    ]),
  },

  /* --- Industry starters (doc 21 §3) — ordinary sections composed from the
   *     standard atoms; the rich "property card" is a PRESET, not a composite
   *     element (doc 15 §2c freeze). Card metadata (beds/baths/sqft/status) is
   *     editable text, so the same card serves any listing. */
  {
    id: 'property-cards',
    intent:
      'A grid of property or real-estate listings (3–6), each a card with a photo, the address, the price, a beds/baths/size stat row and an optional status badge (For sale, For rent, New).',
    slots: [
      text('heading'),
      items(3, 6, [
        image('image', { required: true }),
        text('address', { required: true }),
        text('price', { required: true }),
        text('beds', { required: true }),
        text('baths', { required: true }),
        text('sqft', { required: true }),
        // Optional status pill (For sale / For rent / Sold) — unfilled prunes it.
        text('status', { whenEmpty: 'prune' }),
      ]),
    ],
    tree: section({}, [
      row([column(12, [heading({ text: 'slot:heading' })], { align: 'center' })]),
      row(
        [
          column(
            4,
            [
              node('flexa/card', { gap: 8 }, [
                imageEl({ src: 'slot:image', alt: 'slot:address' }),
                node('flexa/badge', { text: 'slot:status', tone: 'primary' }),
                heading({ text: 'slot:address', font: { size: 20, weight: 700 } }),
                heading({ text: 'slot:price', font: { size: 18, weight: 800 } }),
                // Beds/baths/size as a slim badge row — a grid of neutral pills.
                node('flexa/grid', { columns: '3', gap: 8 }, [
                  node('flexa/badge', { text: 'slot:beds', tone: 'neutral' }),
                  node('flexa/badge', { text: 'slot:baths', tone: 'neutral' }),
                  node('flexa/badge', { text: 'slot:sqft', tone: 'neutral' }),
                ]),
              ]),
            ],
            { [SLOT_REPEAT_KEY]: 'items' },
          ),
        ],
        { depth: '1', depthHover: '3' },
      ),
    ]),
  },
  {
    id: 'search-hero',
    intent:
      'A prominent search bar at the top of a listings site: a heading, a short lead-in and a row of dropdown filters (type, bedrooms, price) with a search button; the opening section of a real-estate or directory home page.',
    slots: [
      text('headline', { required: true }),
      text('subhead'),
      text('submitLabel', { required: true }),
    ],
    tree: section({ pad: { desktop: '72px 24px', mobile: '48px 20px' } }, [
      row([
        column(
          12,
          [
            heading({
              text: 'slot:headline',
              font: { size: 40, weight: 700, lineHeight: 1.15 },
            }),
            textEl({ text: 'slot:subhead' }),
            // Curated filter dropdowns (static options — the user rewires the
            // target after import; the form is the search bar's structure).
            node('flexa/form', {}, [
              node('flexa/form-select', {
                label: 'Property type',
                name: 'type',
                placeholder: 'Any type',
                options: [
                  { label: 'House', value: 'house' },
                  { label: 'Apartment', value: 'apartment' },
                  { label: 'Condo', value: 'condo' },
                  { label: 'Land', value: 'land' },
                ],
              }),
              node('flexa/form-select', {
                label: 'Bedrooms',
                name: 'beds',
                placeholder: 'Any',
                options: [
                  { label: '1+', value: '1' },
                  { label: '2+', value: '2' },
                  { label: '3+', value: '3' },
                  { label: '4+', value: '4' },
                ],
              }),
              node('flexa/form-select', {
                label: 'Price range',
                name: 'price',
                placeholder: 'Any price',
                options: [
                  { label: 'Up to $250k', value: '0-250000' },
                  { label: '$250k–$500k', value: '250000-500000' },
                  { label: '$500k–$1M', value: '500000-1000000' },
                  { label: '$1M+', value: '1000000-' },
                ],
              }),
              node('flexa/form-submit', { text: 'slot:submitLabel' }),
            ]),
          ],
          { align: 'center' },
        ),
      ]),
    ]),
  },
  {
    id: 'dish-cards',
    intent:
      'A grid of signature dishes or menu highlights (3–6), each a card with a photo, the dish name, a short description and its price; the featured-food section of a restaurant or cafe home page.',
    slots: [
      text('heading'),
      items(3, 6, [
        image('image', { required: true }),
        text('name', { required: true }),
        text('description', { required: true }),
        text('price', { required: true }),
      ]),
    ],
    tree: section({}, [
      row([column(12, [heading({ text: 'slot:heading' })], { align: 'center' })]),
      row(
        [
          column(
            4,
            [
              node('flexa/card', { gap: 8 }, [
                imageEl({ src: 'slot:image', alt: 'slot:name' }),
                heading({ text: 'slot:name', font: { size: 20, weight: 700 } }),
                textEl({ text: 'slot:description', color: MUTED }),
                node('flexa/badge', { text: 'slot:price', tone: 'primary' }),
              ]),
            ],
            { [SLOT_REPEAT_KEY]: 'items' },
          ),
        ],
        { depth: '1', depthHover: '3' },
      ),
    ]),
  },
  {
    id: 'menu-list',
    intent:
      'A restaurant or cafe menu: 4–12 named items in two columns, each with an optional short description and a price; text-only, no photos.',
    slots: [
      text('heading'),
      items(4, 12, [
        text('name', { required: true }),
        text('description'),
        text('price', { required: true }),
      ]),
    ],
    tree: section({}, [
      row([
        column(12, [
          heading({ text: 'slot:heading' }),
          node('flexa/grid', { columns: '2', gap: 20 }, [
            node('flexa/card', { [SLOT_REPEAT_KEY]: 'items', gap: 4 }, [
              heading({ text: 'slot:name', font: { size: 18, weight: 600 } }),
              textEl({ text: 'slot:description', color: MUTED }),
              heading({ text: 'slot:price', font: { size: 16, weight: 700 } }),
            ]),
          ]),
        ]),
      ]),
    ]),
  },
  {
    id: 'booking-form',
    intent:
      'A table-reservation form: a heading, an optional intro line and fields for name, date, time and party size with a submit button; the booking section of a restaurant or venue.',
    slots: [
      text('heading', { required: true }),
      text('intro'),
      text('submitLabel', { whenEmpty: 'default' }),
    ],
    tree: section({}, [
      row([
        column(12, [
          heading({ text: 'slot:heading' }),
          textEl({ text: 'slot:intro' }),
          node('flexa/form', {}, [
            node('flexa/form-text', { label: 'Name', name: 'name', required: true }),
            node('flexa/form-date', { label: 'Date', name: 'date', required: true }),
            node('flexa/form-time', { label: 'Time', name: 'time', required: true }),
            node('flexa/form-number', {
              label: 'Party size',
              name: 'guests',
              required: true,
              min: 1,
              max: 20,
            }),
            node('flexa/form-submit', { text: 'slot:submitLabel' }),
          ]),
        ]),
      ]),
    ]),
  },
  {
    id: 'feature-cards-image',
    intent:
      'A grid of 3–6 product features or benefits, each a card with a screenshot or illustration on top, a title and a short paragraph; the feature section of a SaaS or app home page. Use when features have imagery; for icon-only features use features-grid or services-cards.',
    slots: [
      text('heading'),
      text('intro'),
      items(3, 6, [
        image('image', { required: true }),
        text('title', { required: true }),
        text('text', { required: true }),
      ]),
    ],
    tree: section({}, [
      row([
        column(12, [heading({ text: 'slot:heading' }), textEl({ text: 'slot:intro' })], {
          align: 'center',
        }),
      ]),
      row(
        [
          column(
            4,
            [
              node('flexa/card', { gap: 12 }, [
                imageEl({ src: 'slot:image', alt: 'slot:title' }),
                heading({ text: 'slot:title', font: { size: 20, weight: 700 } }),
                textEl({ text: 'slot:text', color: MUTED }),
              ]),
            ],
            { [SLOT_REPEAT_KEY]: 'items' },
          ),
        ],
        { depth: '1', depthHover: '3' },
      ),
    ]),
  },

  /* --- Site chrome (doc 14 §4b W8) — picked in `SitePlan.chrome`, never in
   *     `pages[].sections`. Landmarks ride the section's E2 `landmark` setting,
   *     so the a11y gate covers banner/contentinfo uniqueness by construction. */
  {
    id: 'header-basic',
    role: 'header',
    intent:
      'Site header with the brand name on the left and navigation links on the right; the default header.',
    slots: [
      text('brand', { required: true }),
      itemList('links', 2, 6, [
        text('label', { required: true }),
        { name: 'url', kind: 'url', required: true },
      ]),
    ],
    tree: section({ landmark: 'banner', pad: { desktop: '16px 24px', mobile: '12px 16px' } }, [
      row(
        [
          column(4, [heading({ text: 'slot:brand', font: { size: 20, weight: 700 } })]),
          column(8, [
            node('flexa/nav', {
              label: 'Main menu',
              align: 'end',
              collapse: 'mobile',
              links: [{ [SLOT_REPEAT_KEY]: 'links', text: 'slot:label', url: 'slot:url' }],
            }),
          ]),
        ],
        { valign: 'middle' },
      ),
    ]),
  },
  {
    id: 'header-cta',
    role: 'header',
    intent:
      'Site header with brand, navigation links and a prominent call-to-action button; use when one action (book, buy, contact) matters most.',
    slots: [
      text('brand', { required: true }),
      itemList('links', 2, 5, [
        text('label', { required: true }),
        { name: 'url', kind: 'url', required: true },
      ]),
      text('cta', { required: true }),
      { name: 'ctaUrl', kind: 'url', required: true },
    ],
    tree: section({ landmark: 'banner', pad: { desktop: '16px 24px', mobile: '12px 16px' } }, [
      row(
        [
          column(3, [heading({ text: 'slot:brand', font: { size: 20, weight: 700 } })]),
          column(6, [
            node('flexa/nav', {
              label: 'Main menu',
              align: 'end',
              collapse: 'mobile',
              links: [{ [SLOT_REPEAT_KEY]: 'links', text: 'slot:label', url: 'slot:url' }],
            }),
          ]),
          column(3, [button({ label: 'slot:cta', url: 'slot:ctaUrl' })], { align: 'right' }),
        ],
        { valign: 'middle' },
      ),
    ]),
  },
  {
    id: 'header-centered',
    role: 'header',
    intent:
      'Site header with the brand name centered on its own line and the navigation centered below it; an elegant, editorial look.',
    slots: [
      text('brand', { required: true }),
      itemList('links', 2, 6, [
        text('label', { required: true }),
        { name: 'url', kind: 'url', required: true },
      ]),
    ],
    tree: section({ landmark: 'banner', pad: { desktop: '20px 24px 12px', mobile: '12px 16px' } }, [
      row([
        column(12, [heading({ text: 'slot:brand', font: { size: 22, weight: 700 } })], {
          align: 'center',
        }),
      ]),
      row([
        column(12, [
          node('flexa/nav', {
            label: 'Main menu',
            align: 'center',
            collapse: 'mobile',
            links: [{ [SLOT_REPEAT_KEY]: 'links', text: 'slot:label', url: 'slot:url' }],
          }),
        ]),
      ]),
    ]),
  },
  {
    id: 'header-topbar',
    role: 'header',
    intent:
      'Site header with a slim announcement or contact line above the brand-and-navigation row; use when one short notice (offer, hours, phone) should always be visible.',
    slots: [
      text('notice', { required: true }),
      text('brand', { required: true }),
      itemList('links', 2, 6, [
        text('label', { required: true }),
        { name: 'url', kind: 'url', required: true },
      ]),
    ],
    tree: section({ landmark: 'banner', pad: { desktop: '8px 24px 16px', mobile: '8px 16px' } }, [
      row([column(12, [textEl({ text: 'slot:notice', color: MUTED })], { align: 'center' })]),
      row(
        [
          column(4, [heading({ text: 'slot:brand', font: { size: 20, weight: 700 } })]),
          column(8, [
            node('flexa/nav', {
              label: 'Main menu',
              align: 'end',
              collapse: 'mobile',
              links: [{ [SLOT_REPEAT_KEY]: 'links', text: 'slot:label', url: 'slot:url' }],
            }),
          ]),
        ],
        { valign: 'middle' },
      ),
    ]),
  },
  {
    id: 'header-split',
    role: 'header',
    intent:
      'Site header with the brand name centered between two navigation groups (links left and right); a boutique, symmetrical look that works best with 2–3 links per side.',
    slots: [
      text('brand', { required: true }),
      itemList('linksLeft', 1, 3, [
        text('label', { required: true }),
        { name: 'url', kind: 'url', required: true },
      ]),
      itemList('linksRight', 1, 3, [
        text('label', { required: true }),
        { name: 'url', kind: 'url', required: true },
      ]),
    ],
    tree: section({ landmark: 'banner', pad: { desktop: '16px 24px', mobile: '12px 16px' } }, [
      row(
        [
          column(4, [
            node('flexa/nav', {
              label: 'Primary menu',
              links: [{ [SLOT_REPEAT_KEY]: 'linksLeft', text: 'slot:label', url: 'slot:url' }],
            }),
          ]),
          column(4, [heading({ text: 'slot:brand', font: { size: 20, weight: 700 } })], {
            align: 'center',
          }),
          column(4, [
            node('flexa/nav', {
              label: 'Secondary menu',
              align: 'end',
              links: [{ [SLOT_REPEAT_KEY]: 'linksRight', text: 'slot:label', url: 'slot:url' }],
            }),
          ]),
        ],
        { valign: 'middle' },
      ),
    ]),
  },
  {
    // HF4 — defer của HF2 mở khoá bởi nav collapse: menu trốn sau burger ở MỌI
    // viewport ('always'), content chiếm sân khấu. header-split KHÔNG collapse
    // (curated): 2 nav = 2 burger vô lý, 2–3 link/bên wrap ổn trên mobile.
    id: 'header-minimal',
    role: 'header',
    intent:
      'Compact site header with only the brand name and a burger button that opens the navigation in an offcanvas panel; use for portfolios and landing-style sites where content should dominate.',
    slots: [
      text('brand', { required: true }),
      itemList('links', 2, 8, [
        text('label', { required: true }),
        { name: 'url', kind: 'url', required: true },
      ]),
    ],
    tree: section({ landmark: 'banner', pad: { desktop: '16px 24px', mobile: '12px 16px' } }, [
      row(
        [
          column(8, [heading({ text: 'slot:brand', font: { size: 20, weight: 700 } })]),
          column(4, [
            node('flexa/nav', {
              label: 'Main menu',
              align: 'end',
              collapse: 'always',
              links: [{ [SLOT_REPEAT_KEY]: 'links', text: 'slot:label', url: 'slot:url' }],
            }),
          ]),
        ],
        { valign: 'middle' },
      ),
    ]),
  },
  {
    // HF7 N3 — menu header presets (doc 17 §13). The menu itself is CURATED
    // LITERAL content (a real, editable dropdown/mega), only `brand` is a slot:
    // a dropdown/mega is a per-item structure, and the composer's one-exemplar
    // repeater fill would clone the SAME submenu onto every top link (and the
    // drift-lock forbids `items` nested in `items` — only string `list`). A
    // literal starter menu is the honest, low-risk fit — the author edits links
    // in the builder; the intent tells the AI what the preset is.
    id: 'header-dropdown',
    role: 'header',
    intent:
      'Site header whose navigation has a dropdown submenu (one level) under a top link; use when a section of the site (products, services) has several sub-pages worth grouping under one menu item.',
    slots: [text('brand', { required: true })],
    tree: section({ landmark: 'banner', pad: { desktop: '16px 24px', mobile: '12px 16px' } }, [
      row(
        [
          column(4, [heading({ text: 'slot:brand', font: { size: 20, weight: 700 } })]),
          column(8, [
            node('flexa/nav', {
              label: 'Main menu',
              align: 'end',
              collapse: 'mobile',
              links: [
                { text: 'Home', url: '#' },
                {
                  text: 'Products',
                  url: '#',
                  children: [
                    { text: 'Overview', url: '#' },
                    { text: 'Features', url: '#' },
                    { text: 'Pricing', url: '#' },
                  ],
                },
                { text: 'About', url: '#' },
                { text: 'Contact', url: '#' },
              ],
            }),
          ]),
        ],
        { valign: 'middle' },
      ),
    ]),
  },
  {
    id: 'header-mega',
    role: 'header',
    intent:
      'Site header whose navigation opens a full-width mega menu — several columns of grouped links — under one top link; use when many pages need to be shown at once, organised into groups.',
    slots: [text('brand', { required: true })],
    tree: section({ landmark: 'banner', pad: { desktop: '16px 24px', mobile: '12px 16px' } }, [
      row(
        [
          column(4, [heading({ text: 'slot:brand', font: { size: 20, weight: 700 } })]),
          column(8, [
            node('flexa/nav', {
              label: 'Main menu',
              align: 'end',
              collapse: 'mobile',
              links: [
                { text: 'Home', url: '#' },
                {
                  text: 'Solutions',
                  url: '#',
                  columns: [
                    {
                      heading: 'By use case',
                      links: [
                        { text: 'Marketing', url: '#' },
                        { text: 'Sales', url: '#' },
                        { text: 'Support', url: '#' },
                      ],
                    },
                    {
                      heading: 'By industry',
                      links: [
                        { text: 'Retail', url: '#' },
                        { text: 'Finance', url: '#' },
                        { text: 'Healthcare', url: '#' },
                      ],
                    },
                    {
                      heading: 'Resources',
                      links: [
                        { text: 'Docs', url: '#' },
                        { text: 'Guides', url: '#' },
                        { text: 'Blog', url: '#' },
                      ],
                    },
                  ],
                },
                { text: 'Pricing', url: '#' },
                { text: 'Contact', url: '#' },
              ],
            }),
          ]),
        ],
        { valign: 'middle' },
      ),
    ]),
  },
  {
    id: 'header-shop-mega',
    role: 'header',
    intent:
      'E-commerce site header whose Shop link opens a mega menu of product categories organised in columns; use for online stores that need to expose many category links from the header. Links only — product cards or images belong in a section.',
    slots: [text('brand', { required: true })],
    tree: section({ landmark: 'banner', pad: { desktop: '16px 24px', mobile: '12px 16px' } }, [
      row(
        [
          column(3, [heading({ text: 'slot:brand', font: { size: 20, weight: 700 } })]),
          column(9, [
            node('flexa/nav', {
              label: 'Shop menu',
              align: 'end',
              collapse: 'mobile',
              links: [
                {
                  text: 'Shop',
                  url: '#',
                  columns: [
                    {
                      heading: 'Women',
                      links: [
                        { text: 'Dresses', url: '#' },
                        { text: 'Tops', url: '#' },
                        { text: 'Shoes', url: '#' },
                        { text: 'Accessories', url: '#' },
                      ],
                    },
                    {
                      heading: 'Men',
                      links: [
                        { text: 'Shirts', url: '#' },
                        { text: 'Trousers', url: '#' },
                        { text: 'Shoes', url: '#' },
                        { text: 'Accessories', url: '#' },
                      ],
                    },
                    {
                      heading: 'Home & Living',
                      links: [
                        { text: 'Kitchen', url: '#' },
                        { text: 'Bedding', url: '#' },
                        { text: 'Decor', url: '#' },
                      ],
                    },
                    {
                      heading: 'More',
                      links: [
                        { text: 'New in', url: '#' },
                        { text: 'Popular', url: '#' },
                        { text: 'Sale', url: '#' },
                      ],
                    },
                  ],
                },
                { text: 'Deals', url: '#' },
                { text: 'Contact', url: '#' },
              ],
            }),
          ]),
        ],
        { valign: 'middle' },
      ),
    ]),
  },
  {
    id: 'footer-columns',
    role: 'footer',
    intent:
      'Site footer with a short about blurb, quick links, optional social icons and a copyright line; the default footer.',
    slots: [
      longtext('about', { required: true }),
      itemList('links', 2, 6, [
        text('label', { required: true }),
        { name: 'url', kind: 'url', required: true },
      ]),
      itemList(
        'social',
        1,
        6,
        [
          text('network', { required: true, options: PRESET_SOCIAL }),
          { name: 'url', kind: 'url', required: true },
        ],
        { required: false, whenEmpty: 'prune' },
      ),
      text('copyright', { required: true }),
    ],
    tree: section(
      { landmark: 'contentinfo', bg: BAND, pad: { desktop: '48px 24px 24px' } },
      [
        row([
          column(7, [textEl({ text: 'slot:about' })]),
          column(5, [
            node('flexa/nav', {
              label: 'Footer',
              direction: 'column',
              gap: 8,
              links: [{ [SLOT_REPEAT_KEY]: 'links', text: 'slot:label', url: 'slot:url' }],
            }),
          ]),
        ]),
        row([
          column(
            12,
            [
              node('flexa/social-icons', {
                links: [{ [SLOT_REPEAT_KEY]: 'social', network: 'slot:network', url: 'slot:url' }],
              }),
              textEl({ text: 'slot:copyright', color: MUTED }),
            ],
            { align: 'center' },
          ),
        ]),
      ],
    ),
  },
  {
    id: 'footer-simple',
    role: 'footer',
    intent: 'A slim one-line footer: copyright text and optional social icons, centered.',
    slots: [
      text('copyright', { required: true }),
      itemList(
        'social',
        1,
        6,
        [
          text('network', { required: true, options: PRESET_SOCIAL }),
          { name: 'url', kind: 'url', required: true },
        ],
        { required: false, whenEmpty: 'prune' },
      ),
    ],
    tree: section({ landmark: 'contentinfo', pad: { desktop: '24px' } }, [
      row([
        column(
          12,
          [
            node('flexa/social-icons', {
              links: [{ [SLOT_REPEAT_KEY]: 'social', network: 'slot:network', url: 'slot:url' }],
            }),
            textEl({ text: 'slot:copyright', color: MUTED }),
          ],
          { align: 'center' },
        ),
      ]),
    ]),
  },
  {
    id: 'footer-cta',
    role: 'footer',
    intent:
      'Site footer opening with a large closing call-to-action (headline and button) above the quick links and copyright; use when every page should end with the primary action.',
    slots: [
      text('headline', { required: true }),
      text('cta', { required: true }),
      { name: 'ctaUrl', kind: 'url', required: true },
      itemList('links', 2, 6, [
        text('label', { required: true }),
        { name: 'url', kind: 'url', required: true },
      ]),
      text('copyright', { required: true }),
    ],
    tree: section({ landmark: 'contentinfo', bg: BAND, pad: { desktop: '64px 24px 24px' } }, [
      row([
        column(
          12,
          [
            heading({ text: 'slot:headline', font: { size: 32, weight: 700 } }),
            button({ label: 'slot:cta', url: 'slot:ctaUrl' }),
          ],
          { align: 'center' },
        ),
      ]),
      row([
        column(12, [
          node('flexa/nav', {
            label: 'Footer',
            align: 'center',
            links: [{ [SLOT_REPEAT_KEY]: 'links', text: 'slot:label', url: 'slot:url' }],
          }),
        ]),
      ]),
      row([column(12, [textEl({ text: 'slot:copyright', color: MUTED })], { align: 'center' })]),
    ]),
  },
  {
    id: 'footer-minimal',
    role: 'footer',
    intent:
      'A single-row footer with the brand name, a few links and the copyright side by side; the quietest footer.',
    slots: [
      text('brand', { required: true }),
      itemList('links', 2, 5, [
        text('label', { required: true }),
        { name: 'url', kind: 'url', required: true },
      ]),
      text('copyright', { required: true }),
    ],
    tree: section({ landmark: 'contentinfo', pad: { desktop: '20px 24px' } }, [
      row(
        [
          column(3, [heading({ text: 'slot:brand', font: { size: 16, weight: 700 } })]),
          column(6, [
            node('flexa/nav', {
              label: 'Footer',
              align: 'center',
              gap: 16,
              links: [{ [SLOT_REPEAT_KEY]: 'links', text: 'slot:label', url: 'slot:url' }],
            }),
          ]),
          column(3, [textEl({ text: 'slot:copyright', color: MUTED })], { align: 'right' }),
        ],
        { valign: 'middle' },
      ),
    ]),
  },
  {
    id: 'footer-newsletter',
    role: 'footer',
    intent:
      'Site footer with an email subscribe form (heading, short pitch, email field) beside the quick links; use when growing a mailing list matters.',
    slots: [
      text('heading', { required: true }),
      longtext('pitch', { whenEmpty: 'prune' }),
      text('submitLabel', { whenEmpty: 'default' }),
      itemList('links', 2, 6, [
        text('label', { required: true }),
        { name: 'url', kind: 'url', required: true },
      ]),
      text('copyright', { required: true }),
    ],
    tree: section({ landmark: 'contentinfo', bg: BAND, pad: { desktop: '48px 24px 24px' } }, [
      row([
        column(7, [
          heading({ text: 'slot:heading', font: { size: 24, weight: 700 } }),
          textEl({ text: 'slot:pitch' }),
          node('flexa/form', {}, [
            node('flexa/form-email', { label: 'Email', name: 'email', required: true }),
            node('flexa/form-submit', { text: 'slot:submitLabel' }),
          ]),
        ]),
        column(5, [
          node('flexa/nav', {
            label: 'Footer',
            direction: 'column',
            gap: 8,
            links: [{ [SLOT_REPEAT_KEY]: 'links', text: 'slot:label', url: 'slot:url' }],
          }),
        ]),
      ]),
      row([column(12, [textEl({ text: 'slot:copyright', color: MUTED })], { align: 'center' })]),
    ]),
  },
  {
    id: 'footer-legal',
    role: 'footer',
    intent:
      'Site footer for organisations that need a legal row: quick links and social icons on top, copyright beside privacy/terms links below.',
    slots: [
      itemList('links', 2, 6, [
        text('label', { required: true }),
        { name: 'url', kind: 'url', required: true },
      ]),
      itemList('legalLinks', 1, 4, [
        text('label', { required: true }),
        { name: 'url', kind: 'url', required: true },
      ]),
      itemList(
        'social',
        1,
        6,
        [
          text('network', { required: true, options: PRESET_SOCIAL }),
          { name: 'url', kind: 'url', required: true },
        ],
        { required: false, whenEmpty: 'prune' },
      ),
      text('copyright', { required: true }),
    ],
    tree: section({ landmark: 'contentinfo', pad: { desktop: '32px 24px 20px' } }, [
      row(
        [
          column(6, [
            node('flexa/nav', {
              label: 'Footer',
              gap: 16,
              links: [{ [SLOT_REPEAT_KEY]: 'links', text: 'slot:label', url: 'slot:url' }],
            }),
          ]),
          column(
            6,
            [
              node('flexa/social-icons', {
                links: [{ [SLOT_REPEAT_KEY]: 'social', network: 'slot:network', url: 'slot:url' }],
              }),
            ],
            { align: 'right' },
          ),
        ],
        { valign: 'middle' },
      ),
      row(
        [
          column(6, [textEl({ text: 'slot:copyright', color: MUTED })]),
          column(6, [
            node('flexa/nav', {
              label: 'Legal',
              align: 'end',
              gap: 16,
              links: [{ [SLOT_REPEAT_KEY]: 'legalLinks', text: 'slot:label', url: 'slot:url' }],
            }),
          ]),
        ],
        { valign: 'middle' },
      ),
    ]),
  },
];
