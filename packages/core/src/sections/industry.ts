/**
 * Commerce + industry presets — shop-grid (W7) and the real-estate / restaurant
 * / SaaS starters (doc 21 T2-T4). Ordered after the generic blocks.
 *
 * Pure authored data (one token-first node tree per preset). Order is part
 * of the contract; drift-locked by tests/siteCatalog.spec.ts and
 * element-pack-demo/tests/site-catalog.spec.ts. NOT a frozen engine.
 */

import type { SectionPreset } from '../siteCatalog.js';
import { SLOT_REPEAT_KEY } from '../siteCatalog.js';
import { MUTED, text, image, items, node, section, row, column, heading, textEl, imageEl } from './shared.js';

export const industrySections: readonly SectionPreset[] = [
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
    id: 'appointment-booking',
    intent:
      'An appointment / consultation booking form for a service business (salon, clinic, studio, consultancy): name, email, phone, a service dropdown, a preferred date and time and an optional note. Use for services booked by appointment; for a restaurant table reservation use booking-form.',
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
            node('flexa/form-tel', { label: 'Phone', name: 'phone', required: true }),
            node('flexa/form-select', {
              label: 'Service',
              name: 'service',
              required: true,
              placeholder: 'Choose a service…',
              options: [
                { label: 'Consultation', value: 'consultation' },
                { label: 'Standard appointment', value: 'standard' },
                { label: 'Follow-up', value: 'follow-up' },
              ],
            }),
            node('flexa/form-date', { label: 'Preferred date', name: 'date', required: true }),
            node('flexa/form-time', { label: 'Preferred time', name: 'time', required: true }),
            node('flexa/form-textarea', { label: 'Notes', name: 'notes' }),
            node('flexa/form-submit', { text: 'slot:submitLabel' }),
          ]),
        ]),
      ]),
    ]),
  },
  {
    id: 'event-registration',
    intent:
      'A registration form for a fixed event, webinar or workshop: name, email, a ticket-type dropdown, the number of attendees and a consent checkbox. Use to sign people up for a scheduled event; for a 1:1 appointment with a date/time picker use appointment-booking.',
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
            node('flexa/form-text', { label: 'Full name', name: 'name', required: true }),
            node('flexa/form-email', { label: 'Email', name: 'email', required: true }),
            node('flexa/form-select', {
              label: 'Ticket type',
              name: 'ticket',
              required: true,
              placeholder: 'Choose a ticket…',
              options: [
                { label: 'General admission', value: 'general' },
                { label: 'VIP', value: 'vip' },
                { label: 'Student', value: 'student' },
              ],
            }),
            node('flexa/form-number', {
              label: 'Number of attendees',
              name: 'attendees',
              required: true,
              min: 1,
              max: 10,
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

  /* --- Hospitality / education starters (doc 21 §3) — the same card-grid
   *     pattern as property-cards / dish-cards, with domain metadata that a
   *     generic card can't carry (per-night price + a guests/bed/size row for
   *     rooms; a duration/level badge pair for courses). Card metadata stays
   *     editable text, so one preset serves any hotel or school (doc 15 §2c). */
  {
    id: 'room-cards',
    intent:
      'A grid of hotel rooms or accommodations (3–6), each a card with a photo, the room name, a short description, a per-night price, a guests / bed / size badge row and an optional status badge (Popular, Last rooms); the rooms section of a hotel, resort or B&B home page.',
    slots: [
      text('heading'),
      items(3, 6, [
        image('image', { required: true }),
        text('name', { required: true }),
        text('description', { required: true }),
        text('price', { required: true }),
        text('guests', { required: true }),
        text('bed', { required: true }),
        text('size', { required: true }),
        // Optional status pill (Popular / Last rooms) — unfilled prunes it.
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
                imageEl({ src: 'slot:image', alt: 'slot:name' }),
                node('flexa/badge', { text: 'slot:status', tone: 'primary' }),
                heading({ text: 'slot:name', font: { size: 20, weight: 700 } }),
                textEl({ text: 'slot:description', color: MUTED }),
                heading({ text: 'slot:price', font: { size: 18, weight: 800 } }),
                // Guests / bed / size as a slim badge row — a grid of neutral pills.
                node('flexa/grid', { columns: '3', gap: 8 }, [
                  node('flexa/badge', { text: 'slot:guests', tone: 'neutral' }),
                  node('flexa/badge', { text: 'slot:bed', tone: 'neutral' }),
                  node('flexa/badge', { text: 'slot:size', tone: 'neutral' }),
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
    id: 'course-cards',
    intent:
      'A grid of courses, classes or programs (3–6), each a card with a cover image, a duration and level badge pair, the course title, a short description and a price; the courses section of an online-learning, coaching or education site. Use for priced courses with metadata; for plain image features use feature-cards-image.',
    slots: [
      text('heading'),
      text('intro'),
      items(3, 6, [
        image('image', { required: true }),
        text('title', { required: true }),
        text('description', { required: true }),
        text('duration', { required: true }),
        text('level', { required: true }),
        text('price', { required: true }),
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
              node('flexa/card', { gap: 10 }, [
                imageEl({ src: 'slot:image', alt: 'slot:title' }),
                // Duration / level as a slim badge pair above the title.
                node('flexa/grid', { columns: '2', gap: 8 }, [
                  node('flexa/badge', { text: 'slot:duration', tone: 'neutral' }),
                  node('flexa/badge', { text: 'slot:level', tone: 'neutral' }),
                ]),
                heading({ text: 'slot:title', font: { size: 20, weight: 700 } }),
                textEl({ text: 'slot:description', color: MUTED }),
                heading({ text: 'slot:price', font: { size: 18, weight: 800 } }),
              ]),
            ],
            { [SLOT_REPEAT_KEY]: 'items' },
          ),
        ],
        { depth: '1', depthHover: '3' },
      ),
    ]),
  },

  /* --- Blog / editorial (E15 wp post-meta atoms) — sections for single-post
   *     templates. Provider-driven (no slots); `requires` the WordPress dynamic
   *     atoms, so they surface only on a WP host and are drift-locked by
   *     element-pack-wp/tests/site-catalog.spec.ts. */
  {
    // Byline / meta bar — author, date, reading time and comment count laid out
    // in a wrapping grid so the chips flow in a row and stack on mobile.
    id: 'post-meta',
    intent:
      'A byline / meta bar for a single blog post: the author, the publish date, the estimated reading time and the comment count. Only for single-post templates.',
    requires: ['wp/post-author', 'wp/post-date', 'wp/read-time', 'wp/comment-count'],
    slots: [],
    tree: section({ pad: { desktop: '16px 0' } }, [
      row([
        column(12, [
          node('flexa/grid', { columns: 'auto', minWidth: 140, gap: 16 }, [
            node('wp/post-author'),
            node('wp/post-date'),
            node('wp/read-time'),
            node('wp/comment-count'),
          ]),
        ]),
      ]),
    ]),
  },
  {
    // Previous / next post navigation for the bottom of a single post. The
    // wp/post-navigation element renders the full flex nav on its own.
    id: 'post-nav',
    intent:
      'Previous / next post navigation for the bottom of a single blog post; links to the adjacent posts. Only for single-post templates.',
    requires: ['wp/post-navigation'],
    slots: [],
    tree: section({ pad: { desktop: '24px 0' } }, [
      row([column(12, [node('wp/post-navigation')])]),
    ]),
  },
];
