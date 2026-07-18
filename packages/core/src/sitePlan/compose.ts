/**
 * composeSite — plan -> FlexaProject, pure and deterministic (SG-2), plus
 * composeSection, the editor pattern-library seam (doc 14 §4c) that shares the
 * same expandSection internals. Expands each plan section from SITE_SECTIONS,
 * fills the declared slots, and hands back a project that has ALREADY passed
 * the one-door validateProject gate (SG-3). No randomness, no I/O.
 */

import { defaultTheme } from 'flexa-design-system';
import type { Theme } from 'flexa-design-system';
import {
  SLOT_REPEAT_KEY,
  parseSlotRef,
  type SectionPreset,
  type SectionSlot,
} from '../siteCatalog.js';
import { applyBrand, type Brand } from '../design.js';
import { parseAssetRef } from '../assets.js';
import { ROOT_ID, ROOT_TYPE } from '../root.js';
import { BLOCK_REF_TYPE } from '../blocks.js';
import {
  validateProject,
  PROJECT_SCHEMA_VERSION,
  type AssetRef,
  type FlexaProject,
  type ProjectRouting,
} from '../project.js';
import type { ElementRegistry } from '../registry.js';
import type { DesignPack, ElementPack } from '../pack.js';
import type { ControlDef, FlexaDocument, FlexaNode, Json, PresetNode, Settings } from '../types.js';
import {
  PLACEHOLDER_ASSET_URL,
  PRESET_BY_ID,
  blank,
  type PlanItem,
  type PlanSection,
  type SitePlan,
} from './shared.js';
import { sitePlanSchema } from './schema.js';
import { migrateSitePlan } from './migrate.js';

export interface ComposeSiteOptions {
  /** Expansion registry: preset nodes whose type the host lacks are SKIPPED
   *  (subtree included) — the `sampleTree` degrade rule. Also drives coercion
   *  (number/toggle settings) via the manifest control types. */
  readonly registry: ElementRegistry;
  /** Element packs the composed project depends on → `project.dependencies`. */
  readonly packs?: readonly ElementPack[];
  /** Design packs `plan.packRef` may resolve against (S5 starter packs et al.). */
  readonly designPacks?: readonly DesignPack[];
  /** Injectable id generator (SG-2) — default `n => 'g' + n`, one counter per project. */
  readonly nextId?: (n: number) => string;
  /** Forwarded to the final `validateProject` gate. */
  readonly hostFdsVersion?: string;
  /**
   * How the site-wide chrome reaches the rendered page (doc 17 §9, HF5).
   *
   * - `'inline'` (default, the W8 behavior): chrome block documents are
   *   referenced from every page tree via `flexa/block-ref` — for hosts that
   *   render nothing but the document (playground, bare Next apps).
   * - `'host'`: the chrome block documents are still emitted — stamped with
   *   `meta.chromeRole` so a host importer can recognise them (WP:
   *   `Documents::save` → `Chrome::sync_for_document` + the
   *   `flexa_builder_chrome` global option) — but NO block-ref goes into the
   *   page trees: the host composes the chrome around the canvas itself
   *   (doc 16 H2). Per-page plan overrides translate to document meta the
   *   host resolver already reads: `null` → `chromeHeader`/`chromeFooter` =
   *   `'none'`; an inline section override → `'none'` (suppress the global)
   *   plus the expanded section in the page tree.
   */
  readonly chromeMode?: 'inline' | 'host';
}

export type ComposeSiteResult =
  | { ok: true; project: FlexaProject }
  | { ok: false; errors: string[] };

/** How many grid tracks an exemplar column spans per item count (12-track row).
 *  Counts that do not divide 12 keep the preset's curated span. */
const SPAN_BY_COUNT: Readonly<Record<number, number>> = { 1: 12, 2: 6, 3: 4, 4: 3, 6: 2 };

/**
 * Expand a `SitePlan` into a complete, ALREADY-VALIDATED `FlexaProject`.
 *
 * Pipeline: `migrateSitePlan` → `sitePlanSchema` → per page: clone each preset
 * tree, expand `items` exemplars (one clone per item; column spans divided by
 * count, `alternateItems` rows reversed on odd items), fill `slot:` placeholders
 * (registry-driven number/toggle coercion), apply `whenEmpty` (`prune` drops the
 * carrying node — and any container the pruning emptied; `default` drops the
 * setting), skip nodes whose type the registry lacks (degrade), collect
 * `asset:<id>` image refs into `project.assets` (un-sourced refs get
 * `PLACEHOLDER_ASSET_URL`), derive the theme (`packRef` base → `applyBrand`),
 * build routing from paths — then run the untouched `validateProject` (SG-3).
 */
export function composeSite(input: unknown, opts: ComposeSiteOptions): ComposeSiteResult {
  const parsed = sitePlanSchema.safeParse(migrateSitePlan(input));
  if (!parsed.success) {
    return {
      ok: false,
      errors: parsed.error.issues.map((i) => `${i.path.join('.') || '<root>'}: ${i.message}`),
    };
  }
  const plan = parsed.data as SitePlan;
  const errors: string[] = [];

  // --- Theme: packRef base (resolved via opts.designPacks) + applyBrand. -----
  let baseTheme: Theme | undefined;
  if (plan.packRef) {
    const ref = plan.packRef;
    const found = (opts.designPacks ?? []).find(
      (p) => p.vendor === ref.vendor && p.name === ref.name,
    );
    if (found) baseTheme = found.theme;
    else {
      errors.push(
        `packRef: design pack "${ref.vendor}/${ref.name}" not found — supply it via composeSite designPacks`,
      );
    }
  }
  const hasBrand = plan.brand !== undefined && Object.values(plan.brand).some((v) => v !== undefined);
  const theme = hasBrand ? applyBrand(baseTheme ?? defaultTheme(), plan.brand as Brand) : baseTheme;

  // --- Documents. ------------------------------------------------------------
  let counter = 0;
  const nextId = opts.nextId ?? ((n: number) => `g${n}`);
  const genId = (): string => nextId(++counter);
  const assets = new Map<string, AssetRef>();
  const addImageValue = (value: string): void => {
    const id = parseAssetRef(value);
    if (id !== null && !assets.has(id)) {
      assets.set(id, { id, url: PLACEHOLDER_ASSET_URL, kind: 'image' });
    }
  };

  const documents: FlexaDocument[] = [];
  const usedDocIds = new Set<string>();
  const routingPages: { path: string; documentId: string }[] = [];
  let home: string | undefined;
  const seenPaths = new Set<string>();

  const missingRequires = (preset: SectionPreset): string[] =>
    (preset.requires ?? []).filter((t) => opts.registry.get(t) === undefined);
  const expandCtx = (where: string): ExpandContext => ({
    registry: opts.registry,
    genId,
    addImageValue,
    error: (msg) => errors.push(`${where}: ${msg}`),
  });

  // --- Chrome (W8): the site-wide header/footer become SHARED block documents;
  // each page references them via flexa/block-ref, so one edit changes the site.
  // In 'host' chrome mode (HF5) the documents are emitted with meta.chromeRole
  // instead — the host renders them around the canvas, no in-page refs.
  const hostChrome = opts.chromeMode === 'host';
  const chromeDocs: FlexaDocument[] = [];
  const chromeBlockId: { header?: string; footer?: string } = {};
  const buildChromeDoc = (slot: 'header' | 'footer', sec: PlanSection | undefined): void => {
    if (!sec) return;
    const where = `chrome.${slot} (${sec.preset})`;
    const preset = PRESET_BY_ID.get(sec.preset)!;
    const missing = missingRequires(preset);
    if (missing.length > 0) {
      errors.push(
        `${where}: preset requires element(s) this host does not provide: ${missing.join(', ')}`,
      );
      return;
    }
    const built = expandSection(preset, sec, expandCtx(where));
    if (!built) return; // fully degraded on this registry — no chrome, like any section
    const docId = `chrome-${slot}`;
    chromeDocs.push({
      id: docId,
      kind: 'block',
      title: slot === 'header' ? 'Header' : 'Footer',
      tree: { id: ROOT_ID, type: ROOT_TYPE, settings: {}, children: [built], v: 1 },
      version: 0,
      ...(hostChrome ? { meta: { chromeRole: slot } } : {}),
    });
    chromeBlockId[slot] = docId;
    usedDocIds.add(docId); // reserved — a page path colliding with it must rename
  };
  buildChromeDoc('header', plan.chrome?.header);
  buildChromeDoc('footer', plan.chrome?.footer);

  plan.pages.forEach((page, pageIndex) => {
    if (seenPaths.has(page.path)) {
      errors.push(`pages[${pageIndex}]: duplicate path "${page.path}"`);
      return;
    }
    seenPaths.add(page.path);
    const docId = docIdForPath(page.path);
    if (usedDocIds.has(docId)) {
      errors.push(
        `pages[${pageIndex}]: path "${page.path}" produces document id "${docId}" already taken by another page — rename the path`,
      );
      return;
    }
    usedDocIds.add(docId);

    const children: FlexaNode[] = [];
    // 'host' chrome mode: explicit per-page picks travel as document meta in
    // the vocabulary the host resolver already reads (doc 16 H2 Chrome::pick).
    const pageMeta: Record<string, string> = {};

    // Chrome per page (W8): absent = the site-wide block ref; a PlanSection =
    // an inline, page-local override; null = no chrome on this page.
    const chromeChild = (
      slot: 'header' | 'footer',
      override: PlanSection | null | undefined,
    ): FlexaNode | null => {
      const metaKey = slot === 'header' ? 'chromeHeader' : 'chromeFooter';
      if (override === null) {
        // Host mode renders the global chrome AROUND the canvas — an explicit
        // "no {slot} here" must reach the host as meta; inline mode simply
        // omits the ref.
        if (hostChrome) pageMeta[metaKey] = 'none';
        return null;
      }
      if (override !== undefined) {
        // Inline page-local override — in host mode the global must be
        // suppressed too, or the page would render BOTH chromes.
        if (hostChrome) pageMeta[metaKey] = 'none';
        const where = `pages[${pageIndex}].${slot} (${override.preset})`;
        const preset = PRESET_BY_ID.get(override.preset)!;
        const missing = missingRequires(preset);
        if (missing.length > 0) {
          errors.push(
            `${where}: preset requires element(s) this host does not provide: ${missing.join(', ')}`,
          );
          return null;
        }
        return expandSection(preset, override, expandCtx(where));
      }
      if (hostChrome) return null; // the global option carries it — no in-page ref
      const blockId = chromeBlockId[slot];
      if (blockId === undefined) return null;
      return { id: genId(), type: BLOCK_REF_TYPE, settings: { blockId }, children: [], v: 1 };
    };

    const headerNode = chromeChild('header', page.header);
    if (headerNode) children.push(headerNode);

    page.sections.forEach((section, sectionIndex) => {
      const where = `pages[${pageIndex}].sections[${sectionIndex}] (${section.preset})`;
      const preset = PRESET_BY_ID.get(section.preset)!;
      // Availability gate (doc 14 §4b W7): a `requires`-carrying preset is only
      // legal on hosts whose registry provides those types — degrading it like an
      // ordinary missing element would silently ship an empty section instead of
      // telling the caller (and the repair loop) what is actually wrong.
      const missing = missingRequires(preset);
      if (missing.length > 0) {
        errors.push(
          `${where}: preset requires element(s) this host does not provide: ${missing.join(', ')}`,
        );
        return;
      }
      const built = expandSection(preset, section, expandCtx(where));
      if (built) children.push(built);
    });

    const footerNode = chromeChild('footer', page.footer);
    if (footerNode) children.push(footerNode);

    documents.push({
      id: docId,
      kind: 'page',
      title: page.title,
      tree: { id: ROOT_ID, type: ROOT_TYPE, settings: {}, children, v: 1 },
      version: 0,
      ...(Object.keys(pageMeta).length > 0 ? { meta: pageMeta } : {}),
    });
    if (page.path === '/') home = docId;
    else routingPages.push({ path: page.path, documentId: docId });
  });

  if (errors.length > 0) return { ok: false, errors };

  const routing: ProjectRouting = {
    ...(home !== undefined ? { home } : {}),
    ...(routingPages.length > 0 ? { pages: routingPages } : {}),
  };

  const project: FlexaProject = {
    schemaVersion: PROJECT_SCHEMA_VERSION,
    id: slugify(plan.name),
    name: plan.name,
    // Chrome blocks first (W8) — a host importer creates them before the pages
    // that reference them.
    documents: [...chromeDocs, ...documents],
    ...(theme !== undefined ? { theme } : {}),
    routing,
    ...(opts.packs && opts.packs.length > 0 ? { dependencies: opts.packs } : {}),
    ...(assets.size > 0 ? { assets: [...assets.values()] } : {}),
    // Provenance for the host: which starter pack seeded the look (a W4 importer
    // can rebuild the DesignState packRef from it). Builder/engines IGNORE meta.
    ...(plan.packRef
      ? {
          meta: {
            packRef: {
              vendor: plan.packRef.vendor,
              name: plan.packRef.name,
              ...(plan.packRef.version !== undefined ? { version: plan.packRef.version } : {}),
            },
          },
        }
      : {}),
  };

  // SG-3: the composer eats its own gate — an invalid composition is OUR bug (or
  // a degrade consequence the caller must see), never a silently-shipped project.
  const gate = validateProject(project, opts.hostFdsVersion);
  if (!gate.ok) {
    return { ok: false, errors: gate.errors.map((e) => `validateProject: ${e}`) };
  }
  return { ok: true, project: gate.project };
}

// ---------------------------------------------------------------------------
// Section expansion internals.
// ---------------------------------------------------------------------------

interface ExpandContext {
  readonly registry: ElementRegistry;
  readonly genId: () => string;
  readonly addImageValue: (value: string) => void;
  readonly error: (message: string) => void;
}

/** A scalar slot value resolved in the current (section or item) fill context. */
type Resolve = (name: string) => { spec: SectionSlot; value: string | undefined } | null;

/** A `kind:'list'` item slot resolved in the current fill context (item level).
 *  Returns the string list to expand a repeater exemplar over, or null when the
 *  name is not a list slot here (doc 14 §4b lift). */
type ListResolve = (name: string) => { spec: SectionSlot; list: readonly string[] } | null;

function expandSection(
  preset: SectionPreset,
  section: PlanSection,
  ctx: ExpandContext,
): FlexaNode | null {
  const slotByName = new Map(preset.slots.map((s) => [s.name, s]));
  const copy = section.copy ?? {};
  const images = section.images ?? {};

  const sectionResolve: Resolve = (name) => {
    const spec = slotByName.get(name);
    if (!spec || spec.kind === 'items') return null;
    const raw = spec.kind === 'image' ? images[name] : copy[name];
    const value = typeof raw === 'string' && !blank(raw) ? raw : undefined;
    return { spec, value };
  };

  // Null when the exemplar marker names something that is not an items slot —
  // impossible for the shipped catalog (W1 locks markers ↔ slot specs), guarded
  // so a drifting preset degrades loudly instead of crashing. An unfilled
  // OPTIONAL items slot (W8 chrome) resolves to an EMPTY list: the exemplar
  // expands to zero items and its carrying node prunes.
  const itemsOf = (name: string): readonly PlanItem[] | null => {
    const v = copy[name];
    if (Array.isArray(v)) return v;
    const spec = slotByName.get(name);
    return spec?.kind === 'items' && spec.required === false ? [] : null;
  };
  const itemResolve = (itemsName: string, item: PlanItem): Resolve => {
    const spec = slotByName.get(itemsName);
    const byName = new Map((spec?.item ?? []).map((s) => [s.name, s]));
    return (name) => {
      const itemSpec = byName.get(name);
      if (!itemSpec) return null;
      const raw = item[name];
      // A `list` item slot is not a scalar here — it resolves via itemListOf.
      const value = typeof raw === 'string' && !blank(raw) ? raw : undefined;
      return { spec: itemSpec, value };
    };
  };
  /** The list resolver for a fill context. Section level has no list slots; an
   *  item context resolves its `kind:'list'` slots (unfilled → empty list). */
  const itemListOf = (itemsName: string, item: PlanItem): ListResolve => {
    const spec = slotByName.get(itemsName);
    const byName = new Map((spec?.item ?? []).map((s) => [s.name, s]));
    return (name) => {
      const itemSpec = byName.get(name);
      if (!itemSpec || itemSpec.kind !== 'list') return null;
      const raw = item[name];
      return { spec: itemSpec, list: Array.isArray(raw) ? raw : [] };
    };
  };
  const noList: ListResolve = () => null;

  /** Fill one settings entry's placeholder. Returns `'prune'` when the carrying
   *  node must go, `'drop'` when only the setting goes, or the resolved value. */
  const fillValue = (
    nodeType: string,
    key: string,
    value: Json,
    resolve: Resolve,
    control: ControlDef | undefined,
  ): { action: 'keep'; value: Json } | { action: 'drop' } | { action: 'prune' } => {
    const ref = parseSlotRef(value);
    // Literal curated value: deep-clone it — preset trees are SHARED module
    // constants and the composed project must never alias into them.
    if (ref === null) return { action: 'keep', value: cloneJson(value) };
    const resolved = resolve(ref);
    if (resolved === null) {
      // Cannot happen for the shipped catalog (W1 locks refs ↔ slot specs); guard
      // against a future preset drifting from its own contract.
      ctx.error(`preset "${preset.id}" references undeclared slot "${ref}" (${nodeType}.${key})`);
      return { action: 'drop' };
    }
    if (resolved.value === undefined) {
      return resolved.spec.whenEmpty === 'default' ? { action: 'drop' } : { action: 'prune' };
    }
    if (resolved.spec.kind === 'image') ctx.addImageValue(resolved.value);
    const coerced = coerce(resolved.value, control);
    if (coerced === null) {
      ctx.error(
        `slot "${ref}" must be a ${control?.type === 'toggle' ? 'boolean ("true"/"false")' : 'number'} for ${nodeType}.${key} (got "${resolved.value}")`,
      );
      return { action: 'drop' };
    }
    return { action: 'keep', value: coerced };
  };

  /**
   * Expand one repeater setting (array of entries) against the current fill
   * context. A marked entry is an exemplar: the marker names a SECTION items
   * slot (one filled entry per plan item) or, failing that, a `kind:'list'` slot
   * of the current item context (one entry per string — doc 14 §4b lift). This
   * is fully recursive via `fillSettings`, so a list nested inside a repeater
   * ENTRY (a comparison-table row's `cells`) expands the same way one nested in a
   * SUBTREE item (a pricing tier's `features`) does. Returns the expanded array
   * plus a `prune` flag raised when an OPTIONAL items slot is left unfilled (the
   * carrying node must go — no empty repeater, W8 chrome).
   */
  const expandArray = (
    nodeType: string,
    key: string,
    value: readonly Json[],
    fields: Record<string, ControlDef>,
    resolve: Resolve,
    listOf: ListResolve,
  ): { items: Json[]; prune: boolean } => {
    const items: Json[] = [];
    let prune = false;
    for (const entry of value) {
      if (entry === null || typeof entry !== 'object' || Array.isArray(entry)) {
        items.push(cloneJson(entry as Json));
        continue;
      }
      const record = entry as Record<string, Json>;
      const marker = record[SLOT_REPEAT_KEY];
      if (typeof marker === 'string' && marker !== '') {
        const planItems = itemsOf(marker);
        if (planItems === null) {
          // Not a SECTION items slot — a `kind:'list'` slot of the current item
          // context (a tier's feature bullets, a table row's cells).
          const listed = listOf(marker);
          if (listed === null) {
            ctx.error(
              `preset "${preset.id}" marks an exemplar for undeclared items/list slot "${marker}"`,
            );
            continue;
          }
          // List exemplar: one filled entry per string. An empty list leaves an
          // empty repeater (no bullets/cells) — never the manifest default, never
          // pruning the carrying element.
          for (const str of listed.list) {
            const strResolve: Resolve = (name) =>
              name === marker
                ? { spec: listed.spec, value: blank(str) ? undefined : str }
                : resolve(name);
            items.push(fillSettings(nodeType, `${key}.`, record, fields, strResolve, listOf).settings);
          }
          continue;
        }
        // Optional items slot left unfilled → the carrying node prunes.
        if (planItems.length === 0) {
          prune = true;
          continue;
        }
        // Items exemplar: one filled entry per plan item. `fillSettings` recurses,
        // so a `kind:'list'` field of the item (a row's `cells`) expands here too.
        for (const item of planItems) {
          items.push(
            fillSettings(
              nodeType,
              `${key}.`,
              record,
              fields,
              itemResolve(marker, item),
              itemListOf(marker, item),
            ).settings,
          );
        }
      } else {
        items.push(fillSettings(nodeType, `${key}.`, record, fields, resolve, listOf).settings);
      }
    }
    return { items, prune };
  };

  /**
   * Fill one settings object (a node's settings or a repeater entry's record)
   * against a fill context. Scalar placeholders resolve via `fillValue`; array
   * settings recurse through `expandArray`. Returns the filled settings plus a
   * `prune` flag — a required scalar slot left unfilled (`whenEmpty` default) or
   * an empty optional items slot means the carrying NODE must go. Inside a
   * repeater entry (no node to drop) callers ignore `prune`; a pruned scalar has
   * already been left out of the settings, so the field simply vanishes.
   */
  const fillSettings = (
    nodeType: string,
    keyPrefix: string,
    source: Settings,
    schema: Record<string, ControlDef>,
    resolve: Resolve,
    listOf: ListResolve,
  ): { settings: Settings; prune: boolean } => {
    const settings: Settings = {};
    let prune = false;
    for (const [key, value] of Object.entries(source)) {
      if (key === SLOT_REPEAT_KEY) continue;
      if (Array.isArray(value)) {
        const fields: Record<string, ControlDef> = schema[key]?.fields ?? {};
        const r = expandArray(nodeType, `${keyPrefix}${key}`, value, fields, resolve, listOf);
        settings[key] = r.items;
        if (r.prune) prune = true;
        continue;
      }
      const res = fillValue(nodeType, `${keyPrefix}${key}`, value, resolve, schema[key]);
      if (res.action === 'keep') settings[key] = res.value;
      else if (res.action === 'prune') prune = true;
    }
    return { settings, prune };
  };

  const build = (node: PresetNode, resolve: Resolve, listOf: ListResolve): FlexaNode | null => {
    const manifest = ctx.registry.get(node.type);
    if (!manifest) return null; // degrade — host lacks this element (sampleTree rule)

    const schema: Record<string, ControlDef> = manifest.schema ?? {};
    const { settings, prune } = fillSettings(node.type, '', node.settings ?? {}, schema, resolve, listOf);
    if (prune) return null;

    const children: FlexaNode[] = [];
    for (const child of node.children ?? []) {
      const marker = child.settings?.[SLOT_REPEAT_KEY];
      if (typeof marker === 'string' && marker !== '') {
        // Subtree exemplar: one clone per plan item.
        const planItems = itemsOf(marker);
        if (planItems === null) {
          ctx.error(`preset "${preset.id}" marks an exemplar for undeclared items slot "${marker}"`);
          continue;
        }
        planItems.forEach((item, index) => {
          const clone = build(child, itemResolve(marker, item), itemListOf(marker, item));
          if (!clone) return;
          if (child.type === 'flexa/column' && preset.itemSpan !== 'fixed') {
            const span = SPAN_BY_COUNT[planItems.length];
            const orig = clone.settings.span;
            if (span !== undefined && orig !== null && typeof orig === 'object' && !Array.isArray(orig)) {
              clone.settings.span = { ...orig, desktop: span };
            }
          }
          if (preset.alternateItems && index % 2 === 1) clone.children.reverse();
          children.push(clone);
        });
        continue;
      }
      const built = build(child, resolve, listOf);
      if (built) children.push(built);
    }

    // Cascade prune: a container whose curated children ALL went away (pruned
    // optional slots or degraded types) carries nothing — drop it too.
    if ((node.children?.length ?? 0) > 0 && children.length === 0) return null;

    return { id: ctx.genId(), type: node.type, settings, children, v: 1 };
  };

  return build(preset.tree, sectionResolve, noList);
}

/**
 * Coerce a plan string into the type the target control expects (registry-driven):
 * `number` → number, `toggle` → boolean. Returns null when the string cannot be
 * coerced (a compose error). Every other control keeps the string.
 */
function coerce(value: string, control: ControlDef | undefined): Json | null {
  if (control?.type === 'number') {
    const n = Number(value.trim());
    return Number.isFinite(n) ? n : null;
  }
  if (control?.type === 'toggle') {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return null;
  }
  return value;
}

function cloneJson(value: Json): Json {
  if (value === null || typeof value !== 'object') return value;
  if (Array.isArray(value)) return value.map(cloneJson);
  const out: { [key: string]: Json } = {};
  for (const [k, v] of Object.entries(value)) out[k] = cloneJson(v);
  return out;
}

function slugify(name: string): string {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return slug === '' ? 'site' : slug;
}

function docIdForPath(path: string): string {
  const trimmed = path.replace(/^\/+|\/+$/g, '');
  return trimmed === '' ? 'home' : trimmed.replace(/\//g, '-');
}

// ---------------------------------------------------------------------------
// composeSection + sample fills — the editor pattern-library seam (doc 14 §4c).
//
// The catalog is not only an AI surface: the editor exposes every available
// preset as an insertable PATTERN (doc 15 §1 Element → Component → Pattern).
// `composeSection` expands ONE preset with ONE fill through the same
// `expandSection` internals `composeSite` uses — same slot semantics, same
// degrade rule, same whenEmpty behavior — and `sampleSectionFill` provides the
// curated, deterministic sample copy that makes an inserted pattern look real
// instead of lorem-ipsum. No zod runs here: fills come from trusted callers
// (the shipped samples, locked by tests); expandSection still surfaces every
// contract violation through `errors`.
// ---------------------------------------------------------------------------

export interface ComposeSectionOptions {
  /** Expansion registry — missing types degrade (skip), `requires` gates hard. */
  readonly registry: ElementRegistry;
  /**
   * Injectable id generator — default `n => 's' + n`, one counter per call.
   * Callers inserting the node into an EXISTING document must inject their own
   * generator (the default is only unique within a single call).
   */
  readonly nextId?: (n: number) => string;
}

export interface ComposeSectionResult {
  /** Null when the preset is unavailable or the whole tree degraded/pruned away. */
  readonly node: FlexaNode | null;
  readonly errors: readonly string[];
}

/**
 * Expand ONE section preset with ONE fill into a `FlexaNode` — the pattern-
 * library counterpart of `composeSite` (which owns pages/routing/theme/assets).
 * Image values are used VERBATIM: pass real URLs (or data URIs); `asset:<id>`
 * refs are not collected anywhere because there is no project envelope here.
 */
export function composeSection(
  preset: SectionPreset,
  section: PlanSection,
  opts: ComposeSectionOptions,
): ComposeSectionResult {
  const missing = (preset.requires ?? []).filter((t) => opts.registry.get(t) === undefined);
  if (missing.length > 0) {
    return {
      node: null,
      errors: [`preset requires element(s) this host does not provide: ${missing.join(', ')}`],
    };
  }
  const errors: string[] = [];
  let counter = 0;
  const nextId = opts.nextId ?? ((n: number) => `s${n}`);
  const node = expandSection(preset, section, {
    registry: opts.registry,
    genId: () => nextId(++counter),
    addImageValue: () => {}, // no project envelope — image values stay verbatim
    error: (msg) => errors.push(msg),
  });
  return { node, errors };
}
