/**
 * Asset references (AI-readiness — doc 11-project-schema.md §6, project Slice A3).
 * NOT a frozen engine: a pure pipeline layer like `i18n.ts`, mirrored in PHP by a
 * gate-test (not a parity fixture).
 *
 * A project generated from a screenshot/figma/website references NEW images the host
 * has not ingested yet. Rather than leave dangling absolute URLs, a node points at a
 * DECLARED asset by a stable id: an `image`/`file` control setting holds
 * `"asset:<id>"`, and `FlexaProject.assets` declares that id (§6). The HOST importer
 * fetches each declared asset, registers it in the media library, and rewrites the
 * placeholder to the real URL — the Builder/core never fetches or processes media.
 *
 * Which settings can hold an asset ref is DECLARED, not guessed: a schema control of
 * type `image`/`file` is a media slot by construction (the mirror of i18n's text
 * controls). The `asset:` prefix distinguishes an un-ingested reference from an
 * already-real URL, so a node whose src is already a URL is left alone.
 *
 * Two pure operations the host importer composes (mirror of `collectStrings` /
 * `applyTranslations`):
 * - `collectAssetRefs` — every un-ingested asset id a document references (what to fetch).
 * - `applyAssetUrls` — return a NEW tree with each placeholder swapped to its real URL
 *   via a host-supplied `(id) => url | null` resolver; unresolved refs pass through.
 */

import type { ControlDef, ElementManifest, FlexaNode, Json } from './types.js';
import type { ElementRegistry } from './registry.js';

/** A setting value with this prefix is a reference into `FlexaProject.assets`, not a URL. */
export const ASSET_REF_PREFIX = 'asset:';

/** Build the placeholder a node setting carries for a declared asset id. */
export function assetRef(id: string): string {
  return ASSET_REF_PREFIX + id;
}

/** The declared asset id a value references, or null if it is a real URL / not a ref. */
export function parseAssetRef(value: unknown): string | null {
  if (typeof value !== 'string' || !value.startsWith(ASSET_REF_PREFIX)) return null;
  const id = value.slice(ASSET_REF_PREFIX.length);
  return id === '' ? null : id;
}

/** Media controls whose own setting value is the asset slot (siblings via pickTargets are plain). */
const ASSET_CONTROLS = new Set<ControlDef['type']>(['image', 'file']);

/** Setting keys of a manifest whose control is a media slot, in declaration order. */
export function assetKeys(manifest: ElementManifest): string[] {
  const keys: string[] = [];
  for (const [key, control] of Object.entries(manifest.schema)) {
    if (ASSET_CONTROLS.has(control.type)) keys.push(key);
  }
  return keys;
}

/** One un-ingested asset reference: which declared id, and where it lives. */
export interface AssetRefUsage {
  /** The declared asset id referenced (the part after `asset:`). */
  id: string;
  /** Node carrying the reference. */
  nodeId: string;
  /**
   * Setting key holding it — a media-control key for a top-level ref, or the
   * REPEATER key when the ref lives inside one of its entries (see `index`/`field`).
   */
  key: string;
  /** For a ref inside a repeater entry: the entry index. Absent for a top-level control. */
  index?: number;
  /** For a ref inside a repeater entry: the media field name. Absent for a top-level control. */
  field?: string;
}

/** `(declared asset id) => real URL`; null/empty leaves the placeholder untouched. */
export type AssetResolver = (id: string) => string | null | undefined;

/** One asset reference located on a node: a top-level control, or a repeater entry field. */
interface RefEntry {
  key: string;
  id: string;
  /** Present only when the ref lives inside a repeater entry. */
  index?: number;
  field?: string;
}

/** Media field names of a repeater control's item schema, in declaration order. */
function repeaterMediaFields(control: ControlDef): string[] {
  const fields = control.fields ?? {};
  const out: string[] = [];
  for (const [name, f] of Object.entries(fields)) {
    if (ASSET_CONTROLS.has(f.type)) out.push(name);
  }
  return out;
}

/**
 * A node's un-ingested asset references — every `asset:<id>` placeholder on a media
 * slot (a real URL is already ingested). Covers BOTH top-level media controls AND
 * media fields inside a repeater's entries (e.g. a gallery's `images[].src`), so the
 * host importer/preview resolve nested images too, not just top-level ones. Schema
 * declaration order; within a repeater, entry order then media-field order. Same
 * selection drives collect and apply.
 */
function refEntries(node: FlexaNode, manifest: ElementManifest): RefEntry[] {
  const out: RefEntry[] = [];
  for (const [key, control] of Object.entries(manifest.schema)) {
    if (ASSET_CONTROLS.has(control.type)) {
      const id = parseAssetRef(node.settings?.[key]);
      if (id !== null) out.push({ key, id });
      continue;
    }
    if (control.type !== 'repeater') continue;
    const mediaFields = repeaterMediaFields(control);
    if (mediaFields.length === 0) continue;
    const list = node.settings?.[key];
    if (!Array.isArray(list)) continue;
    list.forEach((entry, index) => {
      if (!entry || typeof entry !== 'object' || Array.isArray(entry)) return;
      const e = entry as Record<string, Json>;
      for (const field of mediaFields) {
        const id = parseAssetRef(e[field]);
        if (id !== null) out.push({ key, id, index, field });
      }
    });
  }
  return out;
}

/**
 * Every un-ingested asset reference in a document, pre-order (= DOM/visual order).
 * Unknown node types contribute nothing. Feed to the host importer so it knows which
 * declared assets to fetch, and to the project gate to check each id is declared.
 */
export function collectAssetRefs(root: FlexaNode, registry: ElementRegistry): AssetRefUsage[] {
  const uses: AssetRefUsage[] = [];
  const walk = (node: FlexaNode): void => {
    const manifest = registry.get(node.type);
    if (manifest) {
      for (const ent of refEntries(node, manifest)) {
        const use: AssetRefUsage = { id: ent.id, nodeId: node.id, key: ent.key };
        if (ent.index !== undefined) {
          use.index = ent.index;
          use.field = ent.field;
        }
        uses.push(use);
      }
    }
    for (const child of node.children ?? []) walk(child);
  };
  walk(root);
  return uses;
}

/**
 * Return a NEW tree with every asset placeholder replaced by its ingested URL via
 * `resolve(id)`. A resolver returning null/undefined/'' leaves the placeholder in
 * place (the asset was not ingested — the project gate reports it). Unknown types and
 * nodes with no media ref pass through. Pure — the input tree is never mutated. The
 * host importer runs this ONCE at ingest, then persists the rewritten document.
 */
export function applyAssetUrls(
  root: FlexaNode,
  registry: ElementRegistry,
  resolve: AssetResolver,
): FlexaNode {
  const walk = (node: FlexaNode): FlexaNode => {
    const manifest = registry.get(node.type);
    let settings = node.settings;
    if (manifest) {
      const ent = refEntries(node, manifest);
      if (ent.length > 0) {
        settings = { ...node.settings };
        for (const e of ent) {
          const url = resolve(e.id);
          if (url == null || url === '') continue;
          if (e.index === undefined) {
            settings[e.key] = url;
          } else {
            // Nested repeater field: clone the array + the target entry so the
            // input tree stays pure (the shallow settings copy still aliases them).
            const list = settings[e.key];
            if (!Array.isArray(list)) continue;
            const arr = list.slice();
            const entry = arr[e.index];
            if (!entry || typeof entry !== 'object' || Array.isArray(entry)) continue;
            arr[e.index] = { ...(entry as Record<string, Json>), [e.field as string]: url };
            settings[e.key] = arr;
          }
        }
      }
    }
    const children = (node.children ?? []).map(walk);
    return { ...node, settings, children };
  };
  return walk(root);
}
