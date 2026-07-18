/**
 * Site chrome headers (doc 14 §4b W8, doc 17 HF2) — picked in SitePlan.chrome,
 * never in pages[].sections. Landmarks ride the section E2 landmark setting.
 *
 * Pure authored data (one token-first node tree per preset). Order is part
 * of the contract; drift-locked by tests/siteCatalog.spec.ts and
 * element-pack-demo/tests/site-catalog.spec.ts. NOT a frozen engine.
 */

import type { SectionPreset } from '../siteCatalog.js';
import { SLOT_REPEAT_KEY } from '../siteCatalog.js';
import { MUTED, text, itemList, node, section, row, column, heading, textEl, button } from './shared.js';

export const headerSections: readonly SectionPreset[] = [
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
    // HF-commerce — the last deferred header (doc 17 §11), unblocked by
    // `woo/cart-link` (doc 15). Brand + nav + a search form + a cart link with
    // its live item count. Cross-pack by construction: the cart is woo-only and
    // the search is the WordPress dynamic element, so this preset only appears
    // where BOTH packs are present (WooCommerce is WP-only anyway, so the wp
    // requirement adds no practical limit over the woo one). Search/cart nodes
    // carry no settings — their data (search action, cart url/count) is
    // provider-driven, so only `brand` and `links` are slots.
    id: 'header-commerce',
    role: 'header',
    requires: ['wp/search-form', 'woo/cart-link'],
    intent:
      'E-commerce site header with the brand, navigation, a search form and a cart link showing the live item count; use for online stores. Requires the store (cart) and dynamic-content (search) elements.',
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
          column(3, [heading({ text: 'slot:brand', font: { size: 20, weight: 700 } })]),
          column(4, [
            node('flexa/nav', {
              label: 'Main menu',
              align: 'end',
              collapse: 'mobile',
              links: [{ [SLOT_REPEAT_KEY]: 'links', text: 'slot:label', url: 'slot:url' }],
            }),
          ]),
          column(3, [node('wp/search-form')]),
          column(2, [node('woo/cart-link')], { align: 'right' }),
        ],
        { valign: 'middle' },
      ),
    ]),
  },
  {
    // Dynamic-brand header (E11 wp/site-logo) — the real Site Logo from the
    // WordPress site identity on the left instead of a static brand heading,
    // navigation on the right. Requires the site-identity element, so it only
    // surfaces on a WP host (drift-locked in element-pack-wp).
    id: 'header-logo',
    role: 'header',
    requires: ['wp/site-logo'],
    intent:
      'Site header showing the real Site Logo (from the WordPress site identity) on the left and navigation links on the right; use to render the actual brand logo rather than a typed name. Requires the site-identity element.',
    slots: [
      itemList('links', 2, 6, [
        text('label', { required: true }),
        { name: 'url', kind: 'url', required: true },
      ]),
    ],
    tree: section({ landmark: 'banner', pad: { desktop: '16px 24px', mobile: '12px 16px' } }, [
      row(
        [
          column(4, [node('wp/site-logo', { size: 'medium' })]),
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
];
