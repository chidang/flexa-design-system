/**
 * Marketplace packaging contract (Phase 5.5 Slice 8).
 *
 * A "pack" is the unit of distribution: pure, serializable data that is safe to
 * sell and drop into any host (FDS §13). There are three live kinds, all data:
 *   - `theme`   — a token document (re-values existing FDS tokens),
 *   - `element` — element manifests (each already passes `defineElement`),
 *   - `preset`  — reusable node trees (patterns),
 * plus one RESERVED kind (AI-readiness EP-1):
 *   - `site`    — a whole multi-page site (documents + shared theme) handed off as
 *                 ONE artifact. The name and envelope are claimed so a future AI
 *                 Platform (Website Import / Prompt to Website) has a single
 *                 validated hand-off unit, but composing documents into a running
 *                 site (routing/navigation) is the HOST's job — deep validation is
 *                 deferred and `validatePack` recognizes a site pack (returning a
 *                 structured "reserved" result) rather than rejecting it as unknown.
 *
 * Every pack declares the FDS major it targets via `fdsVersion` (semver). The
 * semver contract (§15) is what makes a pack portable: a pack built for FDS v2
 * runs on ANY host that speaks the same major (and is at least as new in minor/
 * patch). Custom tokens must live in a `--fx-<vendor>-*` namespace to avoid
 * collision — but per the Slice-8 decision this contract is *on-system only*:
 * element/preset packs consume the existing semantic tokens, and a theme pack
 * may only re-value tokens that already exist (registering new vendor tokens is
 * deferred to the Phase 6 marketplace).
 *
 * This module is a DATA CONTRACT — it does NOT touch the four frozen engines and
 * adds no runtime. Element validation delegates to `validateManifest`, which
 * already carries the Slice-7 off-system token gate.
 */

import { z } from 'zod';
import { validateManifest } from './manifest.js';
import type { ElementManifest, Json, PresetNode, StyleSpec } from './types.js';
import type { Theme } from 'flexa-design-system';
import { FDS_TOKENS, FDS_VERSION } from 'flexa-design-system';
import { brandSchema, validateComponentStyles, type Brand } from './design.js';
// A site pack's payload IS a FlexaProject (doc 11 §106). `validateProject` is
// used only inside `validateSite` (a function body), so the pack.ts ↔ project.ts
// cycle resolves under ESM — project.ts likewise imports `validatePack` only
// inside its own function body.
import { validateProject, type FlexaProject } from './project.js';

export type PackKind = 'theme' | 'element' | 'preset' | 'design' | 'site';

/** Fields every pack carries regardless of kind. */
export interface PackBase {
  readonly kind: PackKind;
  /** Human-readable pack name. */
  readonly name: string;
  /** Namespace owner — lowercase, alnum, starts with a letter (`acme`, `foo2`). */
  readonly vendor: string;
  /** FDS major.minor.patch this pack targets, e.g. `2.0.0`. */
  readonly fdsVersion: string;
  /** The pack's own version (optional semver). */
  readonly version?: string;
  readonly description?: string;
}

/** A theme pack = a token document that re-values existing FDS tokens. */
export interface ThemePack extends PackBase {
  readonly kind: 'theme';
  readonly theme: Theme;
}

/** An element pack = manifests (each already valid per `defineElement`). */
export interface ElementPack extends PackBase {
  readonly kind: 'element';
  readonly elements: readonly ElementManifest[];
}

/** One named pattern in a preset pack — a portable, id-less node tree. */
export interface PresetEntry {
  readonly title: string;
  readonly tree: PresetNode;
  /**
   * Marks a site-chrome pattern (doc 17 §10, HF6): the "Choose a starting
   * layout" gallery over an empty header/footer document merges third-party
   * entries of the matching role after the built-in catalog presets. Absent =
   * an ordinary pattern (never offered as chrome). Availability needs no
   * `requires` declaration — a pack entry has no slots or degrade path, so its
   * TREE is the complete requirement list (every node type must exist on the
   * host registry, checked by the gallery).
   */
  readonly role?: 'header' | 'footer';
}

/** A preset/pattern pack = reusable node trees. */
export interface PresetPack extends PackBase {
  readonly kind: 'preset';
  readonly presets: readonly PresetEntry[];
}

/**
 * A design pack = a whole SITE LOOK a non-designer picks and applies (doc 12): a
 * Theme, optional site-wide component styles (elementType -> StyleSpec, gated
 * on-system), and the Level-2 `Brand` defaults it seeds. Additive kind — it does
 * NOT extend `ThemePack` (whose "token document only" meaning is referenced by
 * `validateProject`), so there is zero back-compat risk.
 */
export interface DesignPack extends PackBase {
  readonly kind: 'design';
  readonly theme: Theme;
  readonly componentStyles?: Readonly<Record<string, StyleSpec>>;
  readonly brand?: Brand;
  readonly preview?: { readonly colors?: readonly string[]; readonly thumbnail?: string };
}

/**
 * A site pack = a whole multi-page site handed off as ONE artifact for
 * distribution (AI-readiness EP-1). The reconciliation of the reserved kind
 * (doc 11 §106): the envelope carries distribution metadata (vendor/fdsVersion)
 * and its payload IS a `FlexaProject` — the top-level SSOT that already holds the
 * documents + shared theme + routing + assets. No duplication: the envelope
 * distributes, the project describes the site. `validatePack` deep-validates the
 * payload through the closed `validateProject` gate (SG-3 — never loosened).
 */
export interface SitePack extends PackBase {
  readonly kind: 'site';
  /** The whole site as ONE validated artifact. */
  readonly project: FlexaProject;
}

export type Pack = ThemePack | ElementPack | PresetPack | DesignPack | SitePack;

export type PackValidation = { ok: true; pack: Pack } | { ok: false; errors: string[] };

// ---------------------------------------------------------------------------
// Semver — a tiny, dependency-free parse + compatibility check. Only the three
// numeric parts are supported (no pre-release/build metadata); that is all the
// FDS contract needs, and it keeps a future PHP mirror trivial.
// ---------------------------------------------------------------------------

export interface SemVer {
  readonly major: number;
  readonly minor: number;
  readonly patch: number;
}

const SEMVER_RE = /^(\d+)\.(\d+)\.(\d+)$/;

/** Parse `major.minor.patch`, or null if malformed. */
export function parseSemver(v: string): SemVer | null {
  const m = SEMVER_RE.exec(v);
  if (!m) return null;
  return { major: Number(m[1]), minor: Number(m[2]), patch: Number(m[3]) };
}

/**
 * True when a pack targeting `packFds` is safe to load on a host running
 * `hostFds`: same major (the stable-contract boundary, §13) AND the host is at
 * least as new (a pack that uses a token added in 2.3 must not load on 2.1).
 */
export function isCompatible(packFds: string, hostFds: string): boolean {
  const p = parseSemver(packFds);
  const h = parseSemver(hostFds);
  if (!p || !h) return false;
  if (p.major !== h.major) return false;
  if (h.minor !== p.minor) return h.minor > p.minor;
  return h.patch >= p.patch;
}

// ---------------------------------------------------------------------------
// Envelope schema — the fields common to every pack, plus a light per-kind
// payload guard. Deep validation (manifests, theme cssVars, node trees) runs in
// code after the envelope parses.
// ---------------------------------------------------------------------------

const VENDOR_RE = /^[a-z][a-z0-9]*$/;
const NODE_TYPE_RE = /^[a-z0-9][a-z0-9-]*\/[a-z0-9][a-z0-9-]*$/;

const base = {
  name: z.string().min(1),
  vendor: z.string().regex(VENDOR_RE, 'vendor must be lowercase alphanumeric starting with a letter'),
  fdsVersion: z.string().regex(SEMVER_RE, 'fdsVersion must be semver (major.minor.patch)'),
  version: z.string().regex(SEMVER_RE, 'version must be semver (major.minor.patch)').optional(),
  description: z.string().optional(),
};

/**
 * The zod schema for a distribution pack envelope — exported so tooling (e.g.
 * `flexa schema`) can publish it as JSON Schema. Per-kind payloads are `unknown`
 * here; their deep validation (manifests, theme cssVars, preset trees) runs in
 * `validatePack` and is documented, not encoded in the envelope schema.
 */
export const packEnvelopeSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('theme'), ...base, theme: z.unknown() }),
  z.object({ kind: z.literal('element'), ...base, elements: z.array(z.unknown()) }),
  z.object({
    kind: z.literal('preset'),
    ...base,
    presets: z.array(
      z.object({
        title: z.string().min(1),
        tree: z.unknown(),
        role: z.enum(['header', 'footer']).optional(),
      }),
    ),
  }),
  z.object({
    kind: z.literal('design'),
    ...base,
    theme: z.unknown(),
    componentStyles: z.record(z.string(), z.unknown()).optional(),
    brand: brandSchema.optional(),
    preview: z
      .object({ colors: z.array(z.string()).optional(), thumbnail: z.string().optional() })
      .optional(),
  }),
  // Payload is a FlexaProject (EP-1) — deep-validated by `validateProject`.
  z.object({ kind: z.literal('site'), ...base, project: z.unknown() }),
]);

/** The set of CSS custom properties the design system owns — the on-system frontier. */
const KNOWN_CSS_VARS: ReadonlySet<string> = new Set(FDS_TOKENS.map((e) => e.cssVar));

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

/**
 * Validate a distribution pack — no throw, structured errors. `flexa validate`
 * and any host loader call this. Element manifests delegate to `validateManifest`
 * (so the Slice-7 token gate applies); theme packs are held to on-system tokens;
 * preset trees are checked structurally.
 */
export function validatePack(input: unknown, hostFdsVersion: string = FDS_VERSION): PackValidation {
  const parsed = packEnvelopeSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      errors: parsed.error.issues.map((i) => `${i.path.join('.') || '<root>'}: ${i.message}`),
    };
  }
  const env = parsed.data;
  const errors: string[] = [];

  // Semver contract — same major, host at least as new.
  if (!isCompatible(env.fdsVersion, hostFdsVersion)) {
    errors.push(
      `pack targets FDS ${env.fdsVersion} but host is FDS ${hostFdsVersion} — incompatible (major must match and host must be at least as new)`,
    );
  }

  if (env.kind === 'element') validateElements(env.elements, errors);
  else if (env.kind === 'theme') validateTheme(env.theme, errors);
  else if (env.kind === 'preset') validatePresets(env.presets, errors);
  else if (env.kind === 'design') validateDesign(env.theme, env.componentStyles, errors);
  else validateSite(env.project, hostFdsVersion, errors); // kind === 'site'

  if (errors.length > 0) return { ok: false, errors };
  return { ok: true, pack: input as Pack };
}

/**
 * A site pack's payload is deep-validated through the closed `validateProject`
 * gate (doc 11 §106, EP-1 realized): the same one-door gate a whole-site hand-off
 * already passes (each document's envelope + a11y, dependency packs, on-system
 * theme, routing cross-refs, asset integrity). The gate is NEVER loosened because
 * the artifact arrived as a distribution pack (SG-3); errors are surfaced under a
 * `site.project` prefix so the source is unambiguous.
 */
function validateSite(project: unknown, hostFdsVersion: string, errors: string[]): void {
  const result = validateProject(project, hostFdsVersion);
  if (!result.ok) {
    for (const e of result.errors) errors.push(`site.project: ${e}`);
  }
}

function validateElements(elements: readonly unknown[], errors: string[]): void {
  const seen = new Set<string>();
  elements.forEach((raw, i) => {
    // AI/marketplace guard: element packs are Tier 1 only (Tier 2 needs a
    // host-provided render callable that cannot ship as data).
    if (isObject(raw) && raw['tier'] === 'imperative') {
      errors.push(`elements[${i}]: Tier 2 (imperative) elements cannot be distributed in a pack`);
      return;
    }
    const result = validateManifest(raw);
    if (!result.ok) {
      const label = isObject(raw) && typeof raw['type'] === 'string' ? raw['type'] : `elements[${i}]`;
      for (const e of result.errors) errors.push(`${label}: ${e}`);
      return;
    }
    const type = result.manifest.type;
    if (seen.has(type)) errors.push(`elements[${i}]: duplicate element type "${type}" in pack`);
    seen.add(type);
  });
}

function validateTheme(theme: unknown, errors: string[]): void {
  if (!isObject(theme)) {
    errors.push('theme: must be an object');
    return;
  }
  if (theme['base'] === undefined) errors.push('theme.base: required');

  const cssVars: string[] = [];
  const pushTokens = (arr: unknown, where: string): void => {
    if (arr === undefined) return;
    if (!Array.isArray(arr)) {
      errors.push(`theme.${where}: must be an array of tokens`);
      return;
    }
    arr.forEach((t, i) => {
      if (!isObject(t) || typeof t['cssVar'] !== 'string') {
        errors.push(`theme.${where}[${i}]: token must have a string cssVar`);
        return;
      }
      cssVars.push(t['cssVar']);
    });
  };

  pushTokens(theme['base'], 'base');
  const modes = theme['modes'];
  if (modes !== undefined) {
    if (!Array.isArray(modes)) errors.push('theme.modes: must be an array');
    else modes.forEach((mode, i) => pushTokens(isObject(mode) ? mode['tokens'] : undefined, `modes[${i}].tokens`));
  }
  pushTokens(theme['reducedMotion'], 'reducedMotion');

  const offSystem = [...new Set(cssVars.filter((v) => !KNOWN_CSS_VARS.has(v)))].sort();
  if (offSystem.length > 0) {
    errors.push(
      `theme references off-system CSS vars not in the FDS registry: ${offSystem.join(', ')} — a theme pack may only re-value existing tokens; custom vendor tokens (--fx-<vendor>-*) are deferred to Phase 6`,
    );
  }
}

/**
 * A design pack reuses the theme gate (same on-system cssVar frontier as a theme
 * pack) and the shared component-styles gate (each spec must be on-system). Brand
 * is already validated by the envelope schema (`brandSchema`).
 */
function validateDesign(theme: unknown, componentStyles: unknown, errors: string[]): void {
  validateTheme(theme, errors);
  validateComponentStyles(componentStyles, errors);
}

function validatePresets(presets: readonly { title: string; tree?: unknown }[], errors: string[]): void {
  presets.forEach((p, i) => walkPresetNode(p.tree, `presets[${i}].tree`, errors));
}

function walkPresetNode(node: unknown, where: string, errors: string[]): void {
  if (!isObject(node)) {
    errors.push(`${where}: node must be an object`);
    return;
  }
  if (typeof node['type'] !== 'string' || !NODE_TYPE_RE.test(node['type'])) {
    errors.push(`${where}.type: must be a "vendor/name" element type`);
  }
  if (node['settings'] !== undefined && !isPlainJson(node['settings'])) {
    errors.push(`${where}.settings: must be plain JSON data`);
  }
  const children = node['children'];
  if (children !== undefined) {
    if (!Array.isArray(children)) errors.push(`${where}.children: must be an array`);
    else children.forEach((c, i) => walkPresetNode(c, `${where}.children[${i}]`, errors));
  }
}

/** True when `v` is a JSON-serializable value (no functions, undefined, symbols). */
function isPlainJson(v: unknown): v is Json {
  if (v === null) return true;
  const t = typeof v;
  if (t === 'string' || t === 'number' || t === 'boolean') return true;
  if (Array.isArray(v)) return v.every(isPlainJson);
  if (isObject(v)) return Object.values(v).every(isPlainJson);
  return false;
}
