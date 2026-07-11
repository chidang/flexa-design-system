/**
 * Document envelope schema (AI-readiness §1b/§1c).
 *
 * The zod SSOT for the FlexaDocument *envelope* + recursive node STRUCTURE. Its
 * scope deliberately mirrors the WordPress `Storage\Validate::document` gate:
 * envelope fields + node `{id, type, settings, children}` (plus optional
 * passthrough) are checked; `settings` / `style` / `meta` are open objects — deep
 * per-element validation is the registry's job, not the storage contract's.
 *
 * Exported so `flexa schema document` can publish it as JSON Schema — the input
 * contract a future AI platform (Project Generator) generates whole documents
 * against. Includes `schemaVersion`, the self-describing envelope format version.
 */

import { z } from 'zod';

const jsonValue: z.ZodType<unknown> = z.lazy(() =>
  z.union([z.string(), z.number(), z.boolean(), z.null(), z.array(jsonValue), z.record(jsonValue)]),
);

const nodeSchema: z.ZodType<unknown> = z.lazy(() =>
  z.object({
    id: z.string().min(1),
    type: z.string().min(1),
    settings: z.record(jsonValue),
    children: z.array(nodeSchema),
    // Optional passthrough — engines/render read these but the storage contract
    // only type-checks their presence, matching the PHP mirror's scope.
    label: z.string().optional(),
    v: z.number().int().optional(),
    advanced: z.record(jsonValue).optional(),
    style: z.record(jsonValue).optional(),
    // Reserved provenance namespace (AI-readiness §1d / EP-2) — engines IGNORE it,
    // serialization preserves verbatim. Same opaque-object contract as document.meta.
    meta: z.record(jsonValue).optional(),
  }),
);

export const documentSchema = z.object({
  id: z.string().min(1),
  kind: z.enum(['page', 'template', 'block']),
  title: z.string(),
  tree: nodeSchema,
  /** Server-assigned publish counter (participates in cache keys). */
  version: z.number(),
  /** Self-describing envelope format version (AI-readiness §1c). */
  schemaVersion: z.number().int().min(1).optional(),
  meta: z.record(jsonValue).optional(),
});
