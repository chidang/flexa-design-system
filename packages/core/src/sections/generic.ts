/**
 * Generic building blocks (doc 14 §4 v1) — hero / features / pricing / FAQ /
 * CTA / contact and friends, ordered generic-first (the catalog contract).
 *
 * Pure authored data (one token-first node tree per preset). Order is part
 * of the contract; drift-locked by tests/siteCatalog.spec.ts and
 * element-pack-demo/tests/site-catalog.spec.ts. NOT a frozen engine.
 */

import type { SectionPreset } from '../siteCatalog.js';
import { SLOT_REPEAT_KEY } from '../siteCatalog.js';
import { BAND, MUTED, text, longtext, image, list, itemList, items, node, section, row, column, heading, textEl, button, imageEl, ICON_SLOT } from './shared.js';

export const genericSections: readonly SectionPreset[] = [
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
    id: 'pricing-with-toggle',
    intent:
      'Compare 2–4 pricing plans that each have both a monthly and a yearly price, with a Monthly/Yearly toggle above the cards that switches every card between the two amounts.',
    slots: [
      text('heading'),
      items(2, 4, [
        text('title', { required: true }),
        text('price', { required: true }),
        // The yearly price is required here — it is what the toggle switches to.
        text('priceYear', { required: true }),
        text('subtitle', { whenEmpty: 'default' }),
        list('features', { whenEmpty: 'default' }),
        text('cta', { whenEmpty: 'default' }),
        text('trial', { whenEmpty: 'default' }),
        text('featured', { options: ['true', 'false'], whenEmpty: 'default' }),
      ]),
    ],
    tree: section({}, [
      row([
        column(
          12,
          [
            heading({ text: 'slot:heading' }),
            // The toggle drives the cards via init.js scoped to its nearest
            // [data-fx] ancestor (T1b), so it MUST share one column with every
            // card — a grid inside this same column keeps them under one scope.
            node('flexa/billing-toggle', {}),
            node('flexa/grid', { columns: '3', gap: 24 }, [
              node('flexa/pricing', {
                [SLOT_REPEAT_KEY]: 'items',
                title: 'slot:title',
                price: 'slot:price',
                priceYear: 'slot:priceYear',
                subtitle: 'slot:subtitle',
                cta: 'slot:cta',
                trial: 'slot:trial',
                featured: 'slot:featured',
                // Per-tier feature bullets (doc 14 §4b lift), same as pricing-tiers.
                features: [{ [SLOT_REPEAT_KEY]: 'features', text: 'slot:features' }],
              }),
            ]),
          ],
          { align: 'center' },
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
    id: 'lead-form',
    intent:
      'A lead-capture / quote-request form — name, email, phone and website fields, a message and a privacy-consent checkbox — for enquiries where you collect business contact details.',
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
            node('flexa/form-tel', { label: 'Phone', name: 'phone' }),
            node('flexa/form-url', { label: 'Website', name: 'website' }),
            node('flexa/form-textarea', {
              label: 'How can we help?',
              name: 'message',
              required: true,
            }),
            node('flexa/form-checkbox', {
              label: 'I agree to the',
              name: 'consent',
              required: true,
              linkUrl: '/privacy',
              linkText: 'privacy policy',
            }),
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
    // Timeline (E14 atom flexa/timeline) — dated milestones as a vertical
    // sequence; generic-useful for history, roadmaps and chronologies.
    id: 'timeline',
    intent:
      'A vertical timeline of dated milestones (company history, a product roadmap or a chronology), each with a date, a title and a short description.',
    slots: [
      text('heading'),
      items(2, 8, [
        text('date', { required: true }),
        text('title', { required: true }),
        text('text'),
      ]),
    ],
    tree: section({}, [
      row([
        column(12, [
          heading({ text: 'slot:heading' }),
          node('flexa/timeline', {
            items: [
              {
                [SLOT_REPEAT_KEY]: 'items',
                date: 'slot:date',
                title: 'slot:title',
                text: 'slot:text',
              },
            ],
          }),
        ]),
      ]),
    ]),
  },
  {
    // Specifications (E14 atom flexa/definition-list) — term/value pairs as a
    // real <dl>: product specs, package contents, quick facts or a glossary.
    id: 'spec-list',
    intent:
      'A list of specifications or key details as term-and-value pairs (product specs, package contents, quick facts or a short glossary); rendered as a definition list.',
    slots: [
      text('heading'),
      items(2, 12, [
        text('term', { required: true }),
        longtext('description', { required: true }),
      ]),
    ],
    tree: section({}, [
      row([
        column(12, [
          heading({ text: 'slot:heading' }),
          node('flexa/definition-list', {
            items: [
              {
                [SLOT_REPEAT_KEY]: 'items',
                term: 'slot:term',
                description: 'slot:description',
              },
            ],
          }),
        ]),
      ]),
    ]),
  },
  {
    // Before / after (E13 atom flexa/before-after) — a drag-to-reveal image
    // comparison for renovations, retouching or results, with a lead-in above.
    id: 'before-after',
    intent:
      'A before/after image comparison the visitor drags to reveal the change (renovations, retouching, results), with a heading and short lead-in above the slider.',
    slots: [
      text('heading'),
      text('body'),
      image('before', { required: true }),
      image('after', { required: true }),
      text('beforeAlt', { required: true }),
      text('afterAlt', { required: true }),
    ],
    tree: section({}, [
      row([
        column(
          12,
          [
            heading({ text: 'slot:heading' }),
            textEl({ text: 'slot:body' }),
            node('flexa/before-after', {
              before: 'slot:before',
              after: 'slot:after',
              beforeAlt: 'slot:beforeAlt',
              afterAlt: 'slot:afterAlt',
            }),
          ],
          { align: 'center' },
        ),
      ]),
    ]),
  },
];
