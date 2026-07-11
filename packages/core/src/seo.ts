/**
 * SEO structured-data (JSON-LD) — Phase 6, xem 09-seo-structured-data.md. NOT a
 * frozen engine: a pipeline layer like `a11y.ts`/`recipe.ts` (pure, no-throw,
 * mirrored in PHP by a gate-test, not a parity fixture).
 *
 * Elements DECLARE schema.org semantics in the manifest (`seo.structuredData`);
 * this walks a document tree and emits ONE `<script type="application/ld+json">`
 * collecting each declaring node's object into a schema.org `@graph`
 * (per-node model — page-level composition is deferred; see 09 §3/§8).
 */

import type {
  ElementManifest,
  FlexaNode,
  Json,
  RenderContext,
  Settings,
  StructuredDataSpec,
} from './types.js';
import type { ElementRegistry } from './registry.js';

/** One schema.org object in the graph — always carries `@type`. */
export type JsonLdObject = Record<string, Json>;

const SCHEMA_ORG_CONTEXT = 'https://schema.org';

/** Schema-control defaults, same shape render.ts feeds the pipeline. */
function schemaDefaults(manifest: ElementManifest): Settings {
  const out: Settings = {};
  for (const [key, control] of Object.entries(manifest.schema)) {
    if (control.default !== undefined) out[key] = control.default as Json;
  }
  return out;
}

/** Empty string / null / undefined don't count — same rule as the a11y gate. */
function isNonEmpty(v: Json | undefined): boolean {
  return typeof v === 'string' ? v.trim() !== '' : v !== undefined && v !== null;
}

/** Fixed, referenceable @id for the page's primary entity (no node.id leaked). */
const PRIMARY_ID = '#primary';

/** Resolve a declaring node's props to non-empty values, keyed in declaration order. */
function resolveProps(
  node: FlexaNode,
  manifest: ElementManifest,
  props: Record<string, string>,
  ctx: RenderContext,
): Record<string, Json> {
  const settings: Settings = {
    ...schemaDefaults(manifest),
    ...node.settings,
    ...(ctx.data?.[node.id] ?? {}),
  };
  const out: Record<string, Json> = {};
  // Declaration order is preserved — it drives the JSON key order (parity).
  for (const [schemaProp, settingName] of Object.entries(props)) {
    const value = settings[settingName];
    if (isNonEmpty(value)) out[schemaProp] = value as Json;
  }
  return out;
}

/**
 * Resolve a list-valued property from a repeater setting (E2 — unlocks
 * BreadcrumbList, deferred in 09). Each repeater entry becomes
 * `{'@type': items.type, position: n, …mapped non-empty fields}`; `position` is
 * 1-based and ALWAYS emitted (schema.org ItemList semantics — the shape this
 * contract exists for). Entries with zero mapped fields are skipped; an empty
 * result list means the property is not emitted at all.
 */
function resolveItems(
  node: FlexaNode,
  manifest: ElementManifest,
  items: NonNullable<StructuredDataSpec['items']>,
  ctx: RenderContext,
): Record<string, Json> {
  const settings: Settings = {
    ...schemaDefaults(manifest),
    ...node.settings,
    ...(ctx.data?.[node.id] ?? {}),
  };
  const raw = settings[items.setting];
  if (!Array.isArray(raw)) return {};
  const list: JsonLdObject[] = [];
  for (const entry of raw) {
    if (entry === null || typeof entry !== 'object' || Array.isArray(entry)) continue;
    const fields = entry as Record<string, Json>;
    const mapped: Record<string, Json> = {};
    for (const [entryProp, fieldName] of Object.entries(items.props)) {
      const value = fields[fieldName];
      if (isNonEmpty(value)) mapped[entryProp] = value as Json;
    }
    if (Object.keys(mapped).length === 0) continue;
    list.push({ '@type': items.type, position: list.length + 1, ...mapped });
  }
  if (list.length === 0) return {};
  return { [items.prop]: list };
}

/**
 * Walk the tree in pre-order (= DOM/visual order) and build the schema.org graph.
 * Each declaring node's `role` (see StructuredDataSpec, default 'self') decides shape:
 * - 'self'    → one standalone object in the graph (per-node model, Slice 4).
 * - 'primary' → the FIRST such node becomes the page entity (gets `@id:'#primary'`);
 *   a later 'primary' degrades to 'self'.
 * - 'part'    → contributes props into the primary, filling only slots still empty
 *   (primary's own props win, then earlier parts win — pre-order). No primary ⇒ inert.
 * A node whose props all resolve empty is skipped; a primary left with only `@type`+`@id`
 * (no real props, even after parts) is dropped too — same "no noise" rule as 'self'.
 */
export function collectStructuredData(
  root: FlexaNode,
  registry: ElementRegistry,
  ctx: RenderContext = {},
): JsonLdObject[] {
  const graph: JsonLdObject[] = [];
  let primaryObj: JsonLdObject | null = null;
  // Parts may appear before the primary in pre-order → merge them after the walk.
  const pendingParts: Array<Record<string, Json>> = [];

  const walk = (node: FlexaNode): void => {
    const manifest = registry.get(node.type);
    const spec = manifest?.seo?.structuredData;
    if (manifest && spec) {
      const role = spec.role ?? 'self';
      // Scalar props first, then the list-valued prop (stable key order for parity).
      const resolved: Record<string, Json> = {
        ...resolveProps(node, manifest, spec.props, ctx),
        ...(spec.items ? resolveItems(node, manifest, spec.items, ctx) : {}),
      };
      if (role === 'part') {
        pendingParts.push(resolved);
      } else if (role === 'primary' && primaryObj === null) {
        // Create the page entity even with 0 own props — parts may fill it; a still-empty
        // primary is pruned after the walk.
        primaryObj = { '@type': spec.type ?? '', '@id': PRIMARY_ID, ...resolved };
        graph.push(primaryObj);
      } else {
        // 'self', or a second 'primary' degrading to standalone.
        if (Object.keys(resolved).length > 0) {
          graph.push({ '@type': spec.type ?? '', ...resolved });
        }
      }
    }
    for (const child of node.children ?? []) walk(child);
  };
  walk(root);

  // Merge parts into the primary — fill only slots still empty (first-non-empty-wins).
  if (primaryObj !== null) {
    const target: Record<string, Json> = primaryObj;
    for (const part of pendingParts) {
      for (const [prop, value] of Object.entries(part)) {
        if (!Object.prototype.hasOwnProperty.call(target, prop)) target[prop] = value as Json;
      }
    }
    // Drop a primary that never gained a real prop (only @type/@id) — no noise.
    const hasRealProp = Object.keys(primaryObj).some((k) => k !== '@type' && k !== '@id');
    if (!hasRealProp) {
      const at = graph.indexOf(primaryObj);
      if (at !== -1) graph.splice(at, 1);
    }
  }

  return graph;
}

/**
 * Escape a serialized JSON string for safe embedding inside a `<script>` element:
 * neutralize `</script>` breakouts (`<`,`>`,`&`) and the JS line separators
 * U+2028/U+2029. Applied identically in the PHP mirror so output stays char-parity.
 */
function escapeForScript(json: string): string {
  return json
    .replace(/</g, '\\u003C')
    .replace(/>/g, '\\u003E')
    .replace(/&/g, '\\u0026')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
}

/**
 * Emit the whole document's structured data as a `<script type="application/ld+json">`
 * string, or `''` when nothing declares structured data. Envelope is always
 * `{@context, @graph}` (even for a single object) — deterministic, simple to mirror.
 */
export function emitJsonLd(
  root: FlexaNode,
  registry: ElementRegistry,
  ctx: RenderContext = {},
): string {
  const graph = collectStructuredData(root, registry, ctx);
  if (graph.length === 0) return '';
  const doc = { '@context': SCHEMA_ORG_CONTEXT, '@graph': graph };
  const json = escapeForScript(JSON.stringify(doc));
  return `<script type="application/ld+json">${json}</script>`;
}
