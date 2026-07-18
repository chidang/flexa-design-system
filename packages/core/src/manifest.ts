/**
 * defineElement — validate + đóng băng một element manifest.
 * Không side effect: trả về object thuần, serialize được (AI sinh element = sinh
 * đúng JSON này). Đây là cổng guardrail: Tier 1 sai chuẩn bị chặn ngay tại đây.
 */

import { z } from 'zod';
import type { ControlDef, ElementManifest, PresetNode, PropDef, StyleSpec } from './types.js';
import { CONTROL_TYPES } from './types.js';
import { hasFormatter } from './engines/formatters.js';
import { findForbiddenRawTags } from './engines/template.js';
import { findUnknownStyleTokens } from 'flexa-design-system';
import { whenRefs, unknownWhenOperators } from './controlWhen.js';

/**
 * Canonical element categories (15-element-system.md §3) — order here IS the
 * picker display order. `category` stays a free slug at the manifest layer
 * (third-party packs are NOT gated on it); this const only drives editor
 * labels/ordering and the first-party drift-lock tests.
 */
export const ELEMENT_CATEGORIES = [
  'layout',
  'content',
  'media',
  'interactive',
  'components',
  'navigation',
  'forms',
  'dynamic',
  'commerce',
] as const;

const jsonSchema: z.ZodType<unknown> = z.lazy(() =>
  z.union([z.string(), z.number(), z.boolean(), z.null(), z.array(jsonSchema), z.record(jsonSchema)]),
);

const controlSchema: z.ZodType<ControlDef> = z.lazy(() =>
  z.object({
    type: z.enum(CONTROL_TYPES),
    label: z.string().optional(),
    default: jsonSchema.optional(),
    options: z.array(jsonSchema).optional(),
    min: z.number().optional(),
    max: z.number().optional(),
    control: controlSchema.optional(),
    fields: z.record(controlSchema).optional(),
    pickTargets: z.record(z.string()).optional(),
    translatable: z.boolean().optional(),
    // Permissive on purpose: keep the whole `when` object as-is (so zod doesn't
    // strip it). Its semantics — sibling refs resolve, operators are known, no
    // nesting — are enforced by the validateManifest guardrails below + eval.
    when: z.record(z.string(), jsonSchema).optional(),
  }) as z.ZodType<ControlDef>,
);

// StyleSpec = selector → declaration block; values are JSON (nested @hover /
// @responsive objects included). Shared by `style` and every recipe fragment.
const styleSpecSchema = z.record(z.record(jsonSchema));

const propDefSchema: z.ZodType<PropDef> = z.union([
  z.object({ classIf: z.record(z.string()) }),
  z.object({
    value: jsonSchema,
    format: z.string().optional(),
    arg: jsonSchema.optional(),
  }),
]) as z.ZodType<PropDef>;

const presetNodeSchema: z.ZodType<PresetNode> = z.lazy(() =>
  z.object({
    type: z.string().min(1),
    settings: z.record(jsonSchema).optional(),
    children: z.array(presetNodeSchema).optional(),
  }),
) as z.ZodType<PresetNode>;

/**
 * The zod schema for an element manifest — the validation SSOT. Exported so
 * tooling (e.g. `flexa schema`) can derive a published JSON Schema from it; the
 * semantic guardrails (frozen formatters, forbidden raw tags, off-system tokens)
 * still run in `validateManifest` and are not expressible in JSON Schema.
 */
export const manifestSchema = z
  .object({
    type: z
      .string()
      .regex(/^[a-z0-9][a-z0-9-]*\/[a-z0-9][a-z0-9-]*$/, 'type must be vendor/name (kebab-case)'),
    title: z.string().min(1),
    category: z.string().optional(),
    icon: z.string().optional(),
    keywords: z.array(z.string().min(1)).optional(),
    tier: z.enum(['declarative', 'imperative']).default('declarative'),
    version: z.number().int().min(1).default(1),
    schema: z.record(controlSchema).default({}),
    props: z.record(propDefSchema).optional(),
    // Required for declarative; optional for imperative (host provides render_frontend instead).
    template: z.string().optional(),
    style: styleSpecSchema.optional(),
    // Variant recipe (Slice 5) — data-only fragments merged by chosen props.
    recipe: z
      .object({
        base: styleSpecSchema.optional(),
        variants: z.record(z.record(styleSpecSchema)).optional(),
        compound: z
          .array(z.object({ when: z.record(z.string()), style: styleSpecSchema }))
          .optional(),
        default: z.record(z.string()).optional(),
      })
      .optional(),
    // Required for imperative — host must declare cache policy (Tier 1 always cacheable).
    cache: z.object({ cacheable: z.boolean() }).optional(),
    data: z.string().optional(),
    init: z.string().optional(),
    assets: z
      .object({ css: z.array(z.string()).optional(), js: z.array(z.string()).optional() })
      .optional(),
    a11y: z
      .object({
        role: z.string().optional(),
        requiresAlt: z.boolean().optional(),
        heading: z.object({ level: z.number().int().min(1).max(6).optional(), levelFrom: z.string().min(1).optional() }).optional(),
        image: z.object({ srcSetting: z.string().min(1), altSetting: z.string().min(1) }).optional(),
        imageItems: z
          .object({ setting: z.string().min(1), srcField: z.string().min(1), altField: z.string().min(1) })
          .optional(),
        landmark: z.string().min(1).optional(),
        landmarkFrom: z.string().min(1).optional(),
      })
      .optional(),
    // SEO structured-data (Phase 6, xem 09) — schema.org @type + property→setting map.
    // Slice 5: `role` bật page-level composition; `type` optional (part kế thừa @type primary).
    seo: z
      .object({
        structuredData: z
          .object({
            type: z.string().min(1).optional(),
            role: z.enum(['self', 'primary', 'part']).optional(),
            props: z.record(z.string().min(1)),
            // E2: list-valued property từ repeater (BreadcrumbList itemListElement…).
            items: z
              .object({
                prop: z.string().min(1),
                setting: z.string().min(1),
                type: z.string().min(1),
                props: z.record(z.string().min(1)),
              })
              .optional(),
          })
          .refine((s) => s.role === 'part' || (typeof s.type === 'string' && s.type.length > 0), {
            message: 'structuredData.type is required unless role is "part"',
            path: ['type'],
          })
          .optional(),
      })
      .optional(),
    childTypes: z.array(z.string().min(1)).optional(),
    parentTypes: z.array(z.string().min(1)).optional(),
    childrenDisplay: z.enum(['flex', 'grid']).optional(),
    presets: z
      .array(
        z.object({
          title: z.string().min(1),
          settings: z.record(jsonSchema).optional(),
          children: z.array(presetNodeSchema).optional(),
        }),
      )
      .optional(),
  })
  .superRefine((data, ctx) => {
    if (data.tier === 'declarative' && data.template === undefined) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['template'], message: 'required for declarative elements' });
    }
    if (data.tier === 'imperative' && data.cache === undefined) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['cache'], message: 'required for imperative elements (must declare cacheable policy)' });
    }
  });

export class ManifestError extends Error {
  constructor(type: string, message: string) {
    super(`Element "${type}": ${message}`);
    this.name = 'ManifestError';
  }
}

export type ManifestValidation =
  | { ok: true; manifest: ElementManifest }
  | { ok: false; errors: string[] };

/**
 * Pure validation — no throw. Used by `flexa validate` CLI and `registerSafe`.
 * Returns structured errors suitable for display or iteration by AI.
 */
export function validateManifest(input: unknown): ManifestValidation {
  const parsed = manifestSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      errors: parsed.error.issues.map((i) => `${i.path.join('.') || '<root>'}: ${i.message}`),
    };
  }
  const m = parsed.data as ElementManifest;
  const errors: string[] = [];

  if (m.tier === 'declarative') {
    // Guardrail Tier 1: formatter phải thuộc tập đóng băng (hoặc custom formatter
    // đã được host đăng ký trên runtime này — CLI/AI không boot host nên chỉ thấy
    // tập frozen, tự động chặn formatter tùy biến).
    for (const [name, def] of Object.entries(m.props ?? {})) {
      if ('format' in def && def.format && !hasFormatter(def.format)) {
        errors.push(`props.${name}: unknown formatter "${def.format}" — only frozen or host-registered formatters are allowed`);
      }
    }
    // Guardrail Tier 1: cấm raw interpolation trừ {{{children}}}.
    const raw = findForbiddenRawTags(m.template ?? '');
    if (raw.length > 0) {
      errors.push(`template: contains raw tags forbidden in Tier 1: ${raw.join(', ')} (only {{{children}}} is allowed)`);
    }
  }

  // Guardrail (both tiers): every token referenced in style/recipe must be a
  // known FDS token. Off-system tokens — typos or custom ids the host would have
  // to register — are rejected, the same "CLI/AI can't boot host, so only the
  // standard set is visible" gate as custom formatters (Slice 7). style & recipe
  // fragments flow through the token pipeline in both tiers, so the gate is
  // tier-independent.
  const unknownTokens = new Set<string>();
  for (const spec of collectStyleSpecs(m)) {
    for (const id of findUnknownStyleTokens(spec)) unknownTokens.add(id);
  }
  if (unknownTokens.size > 0) {
    errors.push(
      `style/recipe references unknown design tokens: ${[...unknownTokens].sort().join(', ')} — only tokens in the Flexa design system are allowed`,
    );
  }

  // Guardrail: `when` conditional visibility (controlWhen.ts). Evaluated only for
  // top-level schema controls, against sibling settings — so every referenced key
  // must be a real sibling, operators must be in the closed set, and `when` must
  // not sit on a nested control (where eval never runs). Loud errors beat a
  // control that silently never shows.
  const topKeys = new Set(Object.keys(m.schema));
  for (const [name, def] of Object.entries(m.schema)) {
    if (def.when) {
      for (const ref of whenRefs(def.when)) {
        if (ref === name) {
          errors.push(`schema.${name}.when references itself "${ref}"`);
        } else if (!topKeys.has(ref)) {
          errors.push(`schema.${name}.when references unknown setting "${ref}"`);
        }
      }
      for (const op of unknownWhenOperators(def.when)) {
        errors.push(`schema.${name}.when uses unknown operator "${op}"`);
      }
    }
    for (const nested of nestedControls(def)) {
      if (nested.when) {
        errors.push(`schema.${name}: when is not supported on nested controls (repeater.fields / responsive.control)`);
        break;
      }
    }
  }

  if (errors.length > 0) return { ok: false, errors };
  return { ok: true, manifest: Object.freeze(m) };
}

/** Every control nested inside a control (repeater item fields, responsive wrapper). */
function nestedControls(def: ControlDef): ControlDef[] {
  const out: ControlDef[] = [];
  if (def.control) out.push(def.control, ...nestedControls(def.control));
  if (def.fields) for (const f of Object.values(def.fields)) out.push(f, ...nestedControls(f));
  return out;
}

/** Every StyleSpec a manifest carries — `style` plus all recipe fragments. */
function collectStyleSpecs(m: ElementManifest): StyleSpec[] {
  const specs: StyleSpec[] = [];
  if (m.style) specs.push(m.style);
  const r = m.recipe;
  if (r) {
    if (r.base) specs.push(r.base);
    for (const group of Object.values(r.variants ?? {})) {
      for (const frag of Object.values(group)) specs.push(frag);
    }
    for (const c of r.compound ?? []) specs.push(c.style);
  }
  return specs;
}

export function defineElement(input: unknown): ElementManifest {
  const result = validateManifest(input);
  if (!result.ok) {
    const type =
      typeof input === 'object' && input !== null && 'type' in input
        ? String((input as { type: unknown }).type)
        : '<unknown>';
    throw new ManifestError(type, result.errors.join('; '));
  }
  return result.manifest;
}
