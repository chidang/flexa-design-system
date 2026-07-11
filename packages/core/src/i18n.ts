/**
 * String translation (i18n) — Phase 6 WPML/Polylang compat, step 2. NOT a frozen
 * engine: a pipeline layer like `seo.ts`/`a11y.ts` (pure, no-throw, mirrored in PHP
 * by a gate-test, not a parity fixture).
 *
 * Which settings hold translatable text is DECLARED, not guessed: a schema control
 * of type `text`/`textarea` is free human copy by construction (headings, labels,
 * paragraphs), so those are the translatable strings — an element can opt a control
 * out with `translatable: false` (e.g. an anchor id / raw class field). We collect
 * only the text a node ACTUALLY carries (non-empty string settings), never element
 * defaults, so translation targets author content rather than placeholder copy.
 *
 * Two operations, both pure:
 * - `collectStrings` — flatten a document's translatable strings for REGISTRATION
 *   with the multilingual plugin (adapter calls pll_register_string / icl_register_string).
 * - `applyTranslations` — return a new tree with each string SWAPPED via a
 *   `(name, value) => string` translator (adapter feeds pll__ / wpml_translate_single_string).
 * The registration `name` (`${node.id}.${key}`) is stable across renders, so a
 * translation entered once keeps matching.
 */

import type { ControlDef, ElementManifest, FlexaNode } from './types.js';
import type { ElementRegistry } from './registry.js';

/** One translatable string: its stable registration name + source (untranslated) text. */
export interface I18nString {
  /** Stable id for the multilingual plugin — `${node.id}.${settingKey}`. */
  name: string;
  /** The source text the user entered (what gets translated). */
  value: string;
}

/** `(registration name, source text) => translated text`; identity leaves text unchanged. */
export type Translator = (name: string, value: string) => string;

/** Only free-text controls carry translatable copy; anything else is data/config. */
const TRANSLATABLE_CONTROLS = new Set<ControlDef['type']>(['text', 'textarea']);

function isTranslatableControl(control: ControlDef): boolean {
  return TRANSLATABLE_CONTROLS.has(control.type) && control.translatable !== false;
}

/** Setting keys of a manifest whose control is translatable text, in declaration order. */
export function translatableKeys(manifest: ElementManifest): string[] {
  const keys: string[] = [];
  for (const [key, control] of Object.entries(manifest.schema)) {
    if (isTranslatableControl(control)) keys.push(key);
  }
  return keys;
}

/** Stable registration name for a node's translatable setting (the plugin string id). */
export function stringName(nodeId: string, key: string): string {
  return `${nodeId}.${key}`;
}

/**
 * A node's translatable {key, value} pairs — only settings it actually carries as
 * non-empty text (element defaults are placeholder copy, not author content, so
 * they never register or swap). Same selection drives collect and apply.
 */
function entries(node: FlexaNode, manifest: ElementManifest): Array<{ key: string; value: string }> {
  const out: Array<{ key: string; value: string }> = [];
  for (const key of translatableKeys(manifest)) {
    const value = node.settings?.[key];
    if (typeof value === 'string' && value.trim() !== '') out.push({ key, value });
  }
  return out;
}

/**
 * Every translatable string in a document, pre-order (= DOM/visual order). Unknown
 * node types contribute nothing. Feed to the adapter's string registration.
 */
export function collectStrings(root: FlexaNode, registry: ElementRegistry): I18nString[] {
  const strings: I18nString[] = [];
  const walk = (node: FlexaNode): void => {
    const manifest = registry.get(node.type);
    if (manifest) {
      for (const { key, value } of entries(node, manifest)) {
        strings.push({ name: stringName(node.id, key), value });
      }
    }
    for (const child of node.children ?? []) walk(child);
  };
  walk(root);
  return strings;
}

/**
 * Return a NEW tree with every translatable setting replaced by `translate(name, value)`.
 * Unknown types and nodes without translatable text pass through untouched. Pure — the
 * input tree is never mutated. Run this before render on a multilingual site (the active
 * language is part of the render cache key, so translated variants cache separately).
 */
export function applyTranslations(
  root: FlexaNode,
  registry: ElementRegistry,
  translate: Translator,
): FlexaNode {
  const walk = (node: FlexaNode): FlexaNode => {
    const manifest = registry.get(node.type);
    let settings = node.settings;
    if (manifest) {
      const ent = entries(node, manifest);
      if (ent.length > 0) {
        settings = { ...node.settings };
        for (const { key, value } of ent) {
          settings[key] = translate(stringName(node.id, key), value);
        }
      }
    }
    const children = (node.children ?? []).map(walk);
    return { ...node, settings, children };
  };
  return walk(root);
}
