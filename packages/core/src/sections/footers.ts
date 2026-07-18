/**
 * Site chrome footers (doc 14 §4b W8, doc 17 HF2) — picked in SitePlan.chrome,
 * never in pages[].sections.
 *
 * Pure authored data (one token-first node tree per preset). Order is part
 * of the contract; drift-locked by tests/siteCatalog.spec.ts and
 * element-pack-demo/tests/site-catalog.spec.ts. NOT a frozen engine.
 */

import type { SectionPreset } from '../siteCatalog.js';
import { SLOT_REPEAT_KEY, PRESET_SOCIAL } from '../siteCatalog.js';
import { BAND, MUTED, text, longtext, itemList, node, section, row, column, heading, textEl, button } from './shared.js';

export const footerSections: readonly SectionPreset[] = [
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
