/**
 * Project envelope schema (AI-readiness — doc 11-project-schema.md, Slice A1).
 *
 * `FlexaProject` is the single top-level hand-off unit for a whole website: many
 * documents + a shared theme + routing + assets, packaged as ONE piece of pure,
 * serializable, versioned data. It is the ONLY artifact an AI Platform (or any
 * tool, or a human) produces, and the ONLY thing the Builder needs to read to
 * stand up a whole site.
 *
 * Source-independence is a HARD law: `FlexaProject` carries NO field describing
 * HOW it was generated (screenshot/figma/website/prompt/html). Provenance lives
 * only in the opaque `meta` / `AssetRef.source` bags, which engines and the
 * Builder IGNORE. The Builder never imports, calls, or knows the AI Platform.
 *
 * This module is COMPOSITION, not new machinery — ~80% is the existing closed
 * contracts (`documentSchema`, `validatePack`, `validateDocument`, `Theme`
 * on-system check) gathered behind ONE no-throw gate, `validateProject`, the same
 * gates a human editor already passes. It does NOT touch the four frozen engines.
 *
 * Slice A1: envelope + `validateProject` + `migrateProject` + schema publish.
 * Slice A2: routing hoist — cross-reference `documentId` refs (home/pages/templates
 * must resolve to a real document of the right kind) + a pure static `resolveRoute`;
 * dynamic (template-kind) routing reuses the closed `matchTemplate` verbatim.
 * Slice A3: asset host-importer seam — a document may reference a declared asset by an
 * `asset:<id>` placeholder on a media control; the gate checks every reference is
 * declared in `project.assets` (via `collectAssetRefs`). Fetch/ingest/rewrite stays
 * host work (see `assets.ts` `applyAssetUrls`); core never touches media.
 */

import { z } from 'zod';
import { documentSchema } from './document.js';
import { validatePack, type ElementPack } from './pack.js';
import { validateDocument } from './a11y.js';
import { collectAssetRefs } from './assets.js';
import { collectBlockRefs } from './blocks.js';
import { ElementRegistry } from './registry.js';
import { FDS_VERSION } from 'flexa-design-system';
import type { FlexaDocument, FlexaNode, Json } from './types.js';
import type { Theme } from 'flexa-design-system';
import type { TemplateRule } from './templates.js';

/**
 * The project-FORMAT (envelope) schema version this build speaks — mirror of
 * `DOCUMENT_SCHEMA_VERSION` (`migrate.ts`). A project with no `schemaVersion` is
 * assumed to predate stamping (treated as 1). Bump when an envelope migration is
 * added below.
 */
export const PROJECT_SCHEMA_VERSION = 1;

/** A declared asset for the HOST to ingest — the Builder only reads it (§6). */
export interface AssetRef {
  /** Stable key node settings reference, e.g. `"asset:hero-1"`. */
  readonly id: string;
  /** Current URL (may be absolute, from the source). Host fetches + rewrites. */
  readonly url: string;
  /** Kind, so the host processes it correctly. */
  readonly kind?: 'image' | 'file' | 'font' | 'video';
  /** Opaque provenance for host dedupe/re-ingest (hash, figma export id…). Builder IGNORES it. */
  readonly source?: Record<string, Json>;
  readonly alt?: string;
}

/** Self-contained route table (§5) — reuses the closed `TemplateRule` contract. */
export interface ProjectRouting {
  /** documentId of the home page (route `/`). */
  readonly home?: string;
  /** Static route map: path → documentId (page-kind documents). */
  readonly pages?: readonly { path: string; documentId: string }[];
  /** Dynamic rules for template-kind documents — fed straight to `matchTemplate`. */
  readonly templates?: readonly TemplateRule[];
}

/** The top-level hand-off artifact for a whole website (§3). */
export interface FlexaProject {
  /** Self-describing envelope format version. Absent = `PROJECT_SCHEMA_VERSION`. */
  readonly schemaVersion?: number;
  readonly id: string;
  readonly name: string;
  /** The documents that make up the site (each a closed FlexaDocument). */
  readonly documents: readonly FlexaDocument[];
  /** Theme the site carries with itself. Absent = host default. */
  readonly theme?: Theme;
  /** Self-contained route table (§5). */
  readonly routing?: ProjectRouting;
  /** Element packs the site depends on (§2) — loaded via validatePack/registerSafe. */
  readonly dependencies?: readonly ElementPack[];
  /** Assets declared for the host to ingest (§6). The Builder does NOT fetch. */
  readonly assets?: readonly AssetRef[];
  /** Project-level provenance/host-meta — engines & Builder IGNORE it (§7). */
  readonly meta?: Record<string, Json>;
}

export type ProjectValidation =
  | { ok: true; project: FlexaProject }
  | { ok: false; errors: string[] };

// ---------------------------------------------------------------------------
// Envelope schema — the shape a future AI Platform generates against. Documents
// reuse `documentSchema` (so each document envelope is validated for free); the
// theme and dependency payloads are `unknown`/opaque here and deep-validated in
// code (matching how `validatePack` defers theme cssVars + manifests).
// ---------------------------------------------------------------------------

const jsonValue: z.ZodType<unknown> = z.lazy(() =>
  z.union([z.string(), z.number(), z.boolean(), z.null(), z.array(jsonValue), z.record(jsonValue)]),
);

const assetRefSchema = z.object({
  id: z.string().min(1),
  url: z.string().min(1),
  kind: z.enum(['image', 'file', 'font', 'video']).optional(),
  source: z.record(jsonValue).optional(),
  alt: z.string().optional(),
});

// Shape-only in A1 — reuses the closed TemplateRule field names. Semantic checks
// (documentId must resolve to a real document, matchTemplate reuse) land in A2.
const templateRuleSchema = z.object({
  documentId: z.string().min(1),
  contextType: z.string().min(1),
  conditions: z.array(z.record(jsonValue)).optional(),
  priority: z.number().optional(),
});

const routingSchema = z.object({
  home: z.string().optional(),
  pages: z.array(z.object({ path: z.string().min(1), documentId: z.string().min(1) })).optional(),
  templates: z.array(templateRuleSchema).optional(),
});

/**
 * The zod SSOT for a `FlexaProject` envelope — exported so `flexa schema project`
 * can publish it as JSON Schema. Semantic guardrails (off-system theme tokens,
 * Tier-2 dependency rejection, document a11y invariants) run in `validateProject`
 * and are NOT expressible in JSON Schema: a project that passes the schema must
 * still pass `flexa validate`.
 */
export const projectSchema = z.object({
  schemaVersion: z.number().int().min(1).optional(),
  id: z.string().min(1),
  name: z.string(),
  documents: z.array(documentSchema),
  theme: z.unknown().optional(),
  routing: routingSchema.optional(),
  dependencies: z.array(z.unknown()).optional(),
  assets: z.array(assetRefSchema).optional(),
  meta: z.record(jsonValue).optional(),
});

// ---------------------------------------------------------------------------
// Migration — mirror of `migrateDocument` (`migrate.ts`). Empty at v1: this is
// the seam so a future envelope change ships as one entry, not a refactor.
// ---------------------------------------------------------------------------

export type ProjectMigration = (project: FlexaProject) => FlexaProject;

const PROJECT_MIGRATIONS: ReadonlyMap<number, ProjectMigration> = new Map();

/**
 * Bring a project envelope up to `PROJECT_SCHEMA_VERSION`, stamping the field. A
 * missing `schemaVersion` is treated as 1 (back-compat). A version NEWER than
 * this build is a hard error — never silently downgrade (mirrors `migrateDocument`).
 */
export function migrateProject(project: FlexaProject): FlexaProject {
  let v = project.schemaVersion ?? 1;
  if (v > PROJECT_SCHEMA_VERSION) {
    throw new Error(
      `Project ${project.id} has schemaVersion ${v} newer than this build (${PROJECT_SCHEMA_VERSION})`,
    );
  }
  let out = project;
  while (v < PROJECT_SCHEMA_VERSION) {
    const step = PROJECT_MIGRATIONS.get(v);
    if (!step) throw new Error(`Missing project migration v${v}→v${v + 1}`);
    out = step(out);
    v += 1;
  }
  return out.schemaVersion === PROJECT_SCHEMA_VERSION
    ? out
    : { ...out, schemaVersion: PROJECT_SCHEMA_VERSION };
}

// ---------------------------------------------------------------------------
// The one door — compose the existing gates, no "AI fast path". A project runs
// through the SAME checks a human editor already passes.
// ---------------------------------------------------------------------------

/**
 * Validate a whole project — no throw, structured errors (same shape as
 * `validatePack`). Every host loader, the CLI, and (later) the AI Platform call
 * this; nobody gets a shortcut. Composition, in order:
 *   1. `projectSchema` — envelope + each document envelope (via `documentSchema`).
 *   2. Schema-version guard (a version newer than this build is rejected).
 *   3. `dependencies[]` → `validatePack` (must be element kind) → `registerSafe`.
 *   4. `documents[]` → `validateDocument` a11y gate (error-severity blocks) against
 *      the registry built from dependencies; unresolved types are skipped.
 *   5. `theme` → on-system token check (reuses the pack theme gate).
 *   6. `assets` → unique ids (shape already checked by the schema).
 *   7. `routing` → every documentId (home/pages/templates) must resolve to a real
 *      document of the expected kind; page paths must be unique (Slice A2).
 *   8. `assets` → every `asset:<id>` a document references must be declared (Slice A3).
 */
export function validateProject(
  input: unknown,
  hostFdsVersion: string = FDS_VERSION,
): ProjectValidation {
  const parsed = projectSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      errors: parsed.error.issues.map((i) => `${i.path.join('.') || '<root>'}: ${i.message}`),
    };
  }
  const env = parsed.data;
  const errors: string[] = [];

  // (2) Version guard — the no-throw mirror of `migrateProject`.
  const sv = env.schemaVersion ?? 1;
  if (sv > PROJECT_SCHEMA_VERSION) {
    errors.push(`project schemaVersion ${sv} is newer than this build (${PROJECT_SCHEMA_VERSION})`);
  }

  // (3) Dependencies → validate as element packs, then register for the a11y gate.
  const registry = new ElementRegistry();
  (env.dependencies ?? []).forEach((dep, i) => {
    const res = validatePack(dep, hostFdsVersion);
    if (!res.ok) {
      for (const e of res.errors) errors.push(`dependencies[${i}]: ${e}`);
      return;
    }
    if (res.pack.kind !== 'element') {
      errors.push(`dependencies[${i}]: must be an element pack (got "${res.pack.kind}")`);
      return;
    }
    for (const m of res.pack.elements) registry.registerSafe(m);
  });

  // (4) Documents → unique ids + a11y gate (error-severity blocks; warnings do not).
  const seenDocIds = new Set<string>();
  env.documents.forEach((doc, i) => {
    if (seenDocIds.has(doc.id)) errors.push(`documents[${i}]: duplicate document id "${doc.id}"`);
    seenDocIds.add(doc.id);
    const blocking = validateDocument(doc.tree as FlexaNode, registry).filter(
      (f) => f.severity === 'error',
    );
    for (const f of blocking) errors.push(`documents[${i}] (${doc.id}): [${f.code}] ${f.message}`);
  });

  // (5) Theme → on-system tokens. Reuse the pack theme gate verbatim by wrapping the
  // theme in a self-compatible theme pack (avoids duplicating the token frontier).
  if (env.theme !== undefined) {
    const themeRes = validatePack(
      { kind: 'theme', name: env.name, vendor: 'project', fdsVersion: hostFdsVersion, theme: env.theme },
      hostFdsVersion,
    );
    if (!themeRes.ok) for (const e of themeRes.errors) errors.push(`theme: ${e}`);
  }

  // (6) Assets → unique ids (AssetRef shape already enforced by the schema).
  const seenAssetIds = new Set<string>();
  (env.assets ?? []).forEach((a, i) => {
    if (seenAssetIds.has(a.id)) errors.push(`assets[${i}]: duplicate asset id "${a.id}"`);
    seenAssetIds.add(a.id);
  });

  // (7) Routing → every documentId must resolve to a real document of the right
  // kind (static routes → page; template rules → template); paths must be unique.
  if (env.routing) {
    const kindById = new Map(env.documents.map((d) => [d.id, d.kind]));
    const checkRef = (id: string, where: string, expected: 'page' | 'template'): void => {
      const k = kindById.get(id);
      if (k === undefined) {
        errors.push(`${where}: documentId "${id}" does not match any document in the project`);
      } else if (k !== expected) {
        errors.push(`${where}: documentId "${id}" is a "${k}" document but a "${expected}" is required`);
      }
    };
    if (env.routing.home !== undefined) checkRef(env.routing.home, 'routing.home', 'page');
    const seenPaths = new Set<string>();
    (env.routing.pages ?? []).forEach((p, i) => {
      if (seenPaths.has(p.path)) errors.push(`routing.pages[${i}]: duplicate path "${p.path}"`);
      seenPaths.add(p.path);
      checkRef(p.documentId, `routing.pages[${i}]`, 'page');
    });
    (env.routing.templates ?? []).forEach((t, i) =>
      checkRef(t.documentId, `routing.templates[${i}]`, 'template'),
    );
  }

  // (8) Asset references → every `asset:<id>` a document references (on an image/file
  // control of a KNOWN type) must be DECLARED in project.assets, so the host importer
  // has something to ingest. Refs on unresolved types are skipped (like the a11y gate).
  const declaredAssets = new Set((env.assets ?? []).map((a) => a.id));
  env.documents.forEach((doc, i) => {
    for (const use of collectAssetRefs(doc.tree as FlexaNode, registry)) {
      if (!declaredAssets.has(use.id)) {
        errors.push(
          `documents[${i}] (${doc.id}): node "${use.nodeId}" references asset "${use.id}" (setting "${use.key}") not declared in project.assets`,
        );
      }
    }
  });

  // (9) Block references (W8) → every `flexa/block-ref` must resolve to a
  // block-kind document CARRIED by the project. A FlexaProject is self-contained
  // (doc 11): a ref into some host's block table would be meaningless after
  // import, so it is an integrity error — mirror of the routing cross-ref (7).
  const docKindById = new Map(env.documents.map((d) => [d.id, d.kind]));
  env.documents.forEach((doc, i) => {
    for (const blockId of collectBlockRefs(doc.tree as FlexaNode)) {
      const kind = docKindById.get(blockId);
      if (kind === undefined) {
        errors.push(
          `documents[${i}] (${doc.id}): block-ref "${blockId}" does not match any document in the project`,
        );
      } else if (kind !== 'block') {
        errors.push(
          `documents[${i}] (${doc.id}): block-ref "${blockId}" is a "${kind}" document but a "block" is required`,
        );
      }
    }
  });

  if (errors.length > 0) return { ok: false, errors };
  return { ok: true, project: input as FlexaProject };
}

/**
 * Resolve a STATIC request path to its documentId using the project's routing
 * table — pure, no I/O. An explicit `pages` entry wins; `/` falls back to `home`.
 * Returns null when nothing matches (or there is no routing).
 *
 * DYNAMIC (template-kind) routing is deliberately NOT here: the host builds a
 * `TemplateContext` from its request and calls the closed `matchTemplate(context,
 * project.routing?.templates ?? [])` verbatim — the project only DESCRIBES the
 * rule table; the host APPLIES it (no orchestration pulled into core, doc §5).
 */
export function resolveRoute(routing: ProjectRouting | undefined, path: string): string | null {
  if (!routing) return null;
  const exact = (routing.pages ?? []).find((p) => p.path === path);
  if (exact) return exact.documentId;
  if (path === '/' && routing.home !== undefined) return routing.home;
  return null;
}
