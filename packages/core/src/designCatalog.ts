/**
 * Design catalog — the Level-3 LIVE component-style sections as PURE DATA
 * (13-design-studio-strategy.md, S6; model: 12-design-packs.md D7/DS5).
 *
 * Moved here from the editor so machines can reach it: an AI platform (or the
 * CLI) asking "what componentStyles choices are legal?" reads this catalog from
 * `capabilities().design` instead of spelunking editor source. The editor
 * re-imports it — behaviour is unchanged.
 *
 * A live section maps a friendly control set onto ONE `componentStyles` entry
 * (element type → StyleSpec) — the site-wide tier the render pipeline emits after
 * recipe / before node.style on every runtime (TS + PHP, parity-locked). Controls
 * are CHOICE BUNDLES, not a CSS editor (NT-3): each choice is a fixed,
 * property-disjoint declaration bundle; the first choice of every control is the
 * element's own default (empty bundle — emits nothing), so all-defaults collapses
 * to NO entry and output stays byte-identical.
 *
 * NOT a frozen engine. Data + two pure projections (`sectionSpec` /
 * `sectionChoices`); nothing here renders.
 */

import type { StyleSpec } from './types.js';

/** One selectable look — a fixed CSS declaration bundle (empty = element default). */
export interface StyleChoice {
  readonly id: string;
  readonly label: string;
  readonly decls: Readonly<Record<string, string | number>>;
}

/** One live control. `choices[0]` MUST be the empty-bundle default. */
export interface LiveControl {
  readonly key: string;
  readonly label: string;
  readonly ui: 'select' | 'btngroup' | 'toggle';
  readonly choices: readonly StyleChoice[];
}

/**
 * One live Level-3 section — writes the SAME spec to `componentStyles[type]` for
 * every listed element type (DS5: one "Forms" section styles all field kinds —
 * they share the carrying class, so one bundle fits all).
 */
export interface LiveSection {
  readonly id: string;
  readonly label: string;
  readonly preview: 'buttons' | 'blocks';
  readonly elementTypes: readonly string[];
  /** Every declaration lands on this selector inside the element scope. */
  readonly selector: string;
  readonly controls: readonly LiveControl[];
}

/** Toggle = a two-choice control: off (default, empty) / on (the bundle). */
function toggle(decls: Readonly<Record<string, string | number>>): readonly StyleChoice[] {
  return [
    { id: 'off', label: 'Off', decls: {} },
    { id: 'on', label: 'On', decls },
  ];
}

/** Corner rounding via the FDS radius scale (bare token ids → var(--fx-radius-*)). */
const RADIUS_CHOICES: readonly StyleChoice[] = [
  { id: 'default', label: 'Default', decls: {} },
  { id: 'none', label: 'None', decls: { 'border-radius': '0px' } },
  { id: 'sm', label: 'S', decls: { 'border-radius': 'radius.sm' } },
  { id: 'md', label: 'M', decls: { 'border-radius': 'radius.md' } },
  { id: 'lg', label: 'L', decls: { 'border-radius': 'radius.lg' } },
  { id: 'xl', label: 'XL', decls: { 'border-radius': 'radius.xl' } },
];

/**
 * The live sections shipped with the standard hosts. Sections exist only for
 * element types that ship there (`flexa/button`, `flexa/card`, `flexa/heading`,
 * the form fields); an entry for a type a host doesn't register is inert by
 * pipeline design.
 */
export const DESIGN_LIVE_SECTIONS: readonly LiveSection[] = [
  {
    id: 'buttons',
    label: 'Buttons',
    preview: 'buttons',
    elementTypes: ['flexa/button'],
    selector: '.btn',
    controls: [
      {
        key: 'style',
        label: 'Style',
        ui: 'select',
        choices: [
          { id: 'solid', label: 'Solid', decls: {} },
          {
            id: 'outline',
            label: 'Outline',
            decls: {
              'background-color': 'transparent',
              color: 'color.primary',
              border: '1px solid currentColor',
            },
          },
          {
            id: 'soft',
            label: 'Soft',
            decls: {
              'background-color': 'color.surface-alt',
              color: 'color.primary',
            },
          },
        ],
      },
      { key: 'radius', label: 'Radius', ui: 'btngroup', choices: RADIUS_CHOICES },
      {
        key: 'shadow',
        label: 'Shadow',
        ui: 'toggle',
        choices: toggle({ 'box-shadow': '0 2px 8px rgba(15, 23, 42, 0.18)' }),
      },
      {
        key: 'uppercase',
        label: 'Uppercase label',
        ui: 'toggle',
        choices: toggle({ 'text-transform': 'uppercase', 'letter-spacing': '0.04em' }),
      },
    ],
  },
  {
    id: 'cards',
    label: 'Cards',
    preview: 'blocks',
    elementTypes: ['flexa/card'],
    selector: '&',
    controls: [
      {
        key: 'border',
        label: 'Border',
        ui: 'select',
        choices: [
          { id: 'default', label: 'Default', decls: {} },
          { id: 'none', label: 'None', decls: { 'border-style': 'none' } },
        ],
      },
      {
        key: 'shadow',
        label: 'Shadow',
        ui: 'select',
        choices: [
          { id: 'none', label: 'None', decls: {} },
          { id: 'soft', label: 'Soft', decls: { 'box-shadow': '0 1px 3px rgba(15, 23, 42, 0.1)' } },
          {
            id: 'raised',
            label: 'Raised',
            decls: { 'box-shadow': '0 12px 32px rgba(15, 23, 42, 0.16)' },
          },
        ],
      },
      { key: 'radius', label: 'Radius', ui: 'btngroup', choices: RADIUS_CHOICES },
    ],
  },
  {
    // DS5 — carried by the demo heading (`.hd`). Controls are property-disjoint:
    // case (text-transform/letter-spacing), weight (font-weight), accent (color).
    id: 'headings',
    label: 'Headings',
    preview: 'blocks',
    elementTypes: ['flexa/heading'],
    selector: '.hd',
    controls: [
      {
        key: 'case',
        label: 'Letter case',
        ui: 'select',
        choices: [
          { id: 'default', label: 'Default', decls: {} },
          {
            id: 'uppercase',
            label: 'Uppercase',
            decls: { 'text-transform': 'uppercase', 'letter-spacing': '0.03em' },
          },
        ],
      },
      {
        key: 'weight',
        label: 'Weight',
        ui: 'btngroup',
        choices: [
          { id: 'default', label: 'Default', decls: {} },
          { id: 'medium', label: '500', decls: { 'font-weight': 500 } },
          { id: 'bold', label: '700', decls: { 'font-weight': 700 } },
          { id: 'heavy', label: '800', decls: { 'font-weight': 800 } },
        ],
      },
      {
        key: 'accent',
        label: 'Primary colour',
        ui: 'toggle',
        choices: toggle({ color: 'color.primary' }),
      },
    ],
  },
  {
    // DS5 — all field kinds share the `.ff-in` input class, so ONE section
    // writes the same spec to each type (the submit button stays with Buttons'
    // philosophy: it has its own colour settings per node).
    id: 'forms',
    label: 'Forms',
    preview: 'blocks',
    elementTypes: [
      'flexa/form-text',
      'flexa/form-email',
      'flexa/form-textarea',
      'flexa/form-select',
    ],
    selector: '.ff-in',
    controls: [
      {
        key: 'style',
        label: 'Field style',
        ui: 'select',
        choices: [
          { id: 'default', label: 'Default', decls: {} },
          {
            id: 'filled',
            label: 'Filled',
            decls: { 'background-color': 'color.surface-alt', 'border-color': 'transparent' },
          },
        ],
      },
      {
        key: 'size',
        label: 'Field size',
        ui: 'btngroup',
        choices: [
          { id: 'default', label: 'Default', decls: {} },
          { id: 'compact', label: 'Compact', decls: { padding: '6px 10px' } },
          { id: 'spacious', label: 'Spacious', decls: { padding: '12px 14px' } },
        ],
      },
      { key: 'radius', label: 'Radius', ui: 'btngroup', choices: RADIUS_CHOICES },
    ],
  },
];

/** Control key → selected choice id. */
export type SectionChoices = Readonly<Record<string, string>>;

/**
 * Build the StyleSpec a section's choices produce. All-defaults → undefined so
 * the caller DELETES the componentStyles entry (no entry ⇒ byte-identical output).
 */
export function sectionSpec(section: LiveSection, choices: SectionChoices): StyleSpec | undefined {
  const decls: Record<string, string | number> = {};
  for (const control of section.controls) {
    const picked = control.choices.find((c) => c.id === choices[control.key]);
    if (picked) Object.assign(decls, picked.decls);
  }
  if (Object.keys(decls).length === 0) return undefined;
  return { [section.selector]: decls };
}

/**
 * Derive the selected choice ids back from a persisted spec. A non-default choice
 * is selected iff its every declaration is present verbatim; nothing matches →
 * the default. Deterministic because controls are property-disjoint by design.
 */
export function sectionChoices(
  section: LiveSection,
  spec: StyleSpec | undefined,
): Record<string, string> {
  const decls = (spec?.[section.selector] ?? {}) as Record<string, unknown>;
  const out: Record<string, string> = {};
  for (const control of section.controls) {
    const hit = control.choices
      .slice(1)
      .find((c) => Object.entries(c.decls).every(([k, v]) => decls[k] === v));
    out[control.key] = hit?.id ?? control.choices[0]!.id;
  }
  return out;
}
