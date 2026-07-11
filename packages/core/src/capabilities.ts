/**
 * Capability catalog (AI-readiness §1a).
 *
 * A pure, deterministic, JSON-serializable snapshot of everything an author —
 * human or a future AI platform — may reference when producing a document:
 * the design-system version, the control kinds, the frozen formatters, the FDS
 * tokens, and every registered element manifest.
 *
 * This is the *capability surface* AI generates against. It is DERIVED from the
 * same registries the engines and validator use (`FDS_TOKENS`, `FORMATTER_NAMES`,
 * `CONTROL_TYPES`, the element registry), so it can never drift from what the
 * Builder actually accepts. It touches no frozen engine and adds no runtime — it
 * only reads existing data and returns plain JSON.
 */

import type { ElementManifest } from './types.js';
import { CONTROL_TYPES } from './types.js';
import type { ElementRegistry } from './registry.js';
import { FORMATTER_NAMES } from './engines/formatters.js';
import { FDS_TOKENS, FDS_VERSION } from 'flexa-design-system';
import {
  DESIGN_STATE_VERSION,
  DENSITY_BOUNDS,
  FONT_SCALE_BOUNDS,
  RADIUS_PRESET_IDS,
  brandSchema,
} from './design.js';
import { DESIGN_LIVE_SECTIONS, type LiveSection } from './designCatalog.js';
import { type SectionSlot } from './siteCatalog.js';
import { SITE_SECTIONS } from './siteSections.js';

/** One token as exposed in the catalog — the public, resolution-free facts. */
export interface CapabilityToken {
  readonly id: string;
  readonly cssVar: string;
  readonly type: string;
  readonly tier: 'primitive' | 'semantic' | 'component';
}

/**
 * The design-generation surface (doc 13 S6): everything an AI needs to fill a
 * `DesignPack`/`DesignState` — the Brand fields it may set, the preset/bound
 * vocabulary, and the FULL componentStyles choice space (the live sections).
 */
export interface DesignCapabilities {
  /** The DesignState envelope version this Builder speaks. */
  readonly designStateVersion: number;
  /** Every optional `Brand` field name (derived from the zod schema). */
  readonly brandFields: readonly string[];
  /** Legal `Brand.radius` preset ids. */
  readonly radiusPresets: readonly string[];
  /** Accepted `Brand.fontScale` ranges: [min, max] per knob. */
  readonly fontScale: {
    readonly base: readonly [number, number];
    readonly ratio: readonly [number, number];
  };
  /** Accepted `Brand.density` range: [min, max] (doc 13 S9). */
  readonly density: readonly [number, number];
  /** The componentStyles choice space — the live sections, verbatim. */
  readonly liveSections: readonly LiveSection[];
}

/**
 * One section preset as exposed to machines (doc 14 §3d): the intent + slot
 * contract WITHOUT the node tree — AI picks sections and fills slots; it never
 * sees or writes nodes (SG-1).
 */
export interface SectionCapability {
  readonly id: string;
  readonly intent: string;
  /** Chrome presets (doc 14 §4b W8): legal only in `SitePlan.chrome` or a
   *  page-level header/footer override — never inside `pages[].sections`. */
  readonly role?: 'header' | 'footer';
  readonly slots: readonly SectionSlot[];
  /** Element types this section needs (doc 14 §4b W7). Present on THIS host by
   *  construction — sections whose requirements the registry does not satisfy
   *  are filtered out of the snapshot entirely, so the AI never sees them. */
  readonly requires?: readonly string[];
}

/** The machine-readable capability surface AI generates against. */
export interface CapabilitiesSnapshot {
  /** The FDS contract semver this Builder speaks (matches a pack's `fdsVersion`). */
  readonly fdsVersion: string;
  /** Every control kind an element schema may use, sorted. */
  readonly controlTypes: readonly string[];
  /** The frozen formatter names available to Tier-1 prop maps, sorted. */
  readonly formatters: readonly string[];
  /** Every FDS design token, sorted by id. */
  readonly tokens: readonly CapabilityToken[];
  /** Every registered element manifest (already pure data), sorted by type. */
  readonly elements: readonly ElementManifest[];
  /** The design-generation surface (optional-typed for older consumers). */
  readonly design?: DesignCapabilities;
  /** The site-generation surface (doc 14 W1; optional-typed for older consumers). */
  readonly sections?: readonly SectionCapability[];
}

const sorted = (xs: readonly string[]): string[] => [...xs].sort();

/**
 * Build the capability catalog for a given registry. Deterministic: identical
 * inputs always yield identical, stably-ordered output (safe to diff / snapshot).
 */
export function capabilities(registry: ElementRegistry): CapabilitiesSnapshot {
  return {
    fdsVersion: FDS_VERSION,
    controlTypes: sorted(CONTROL_TYPES),
    // Only the frozen set — custom formatters are host-runtime and not portable.
    formatters: sorted(FORMATTER_NAMES),
    tokens: FDS_TOKENS.map((t) => ({
      id: t.id,
      cssVar: t.cssVar,
      type: t.type,
      tier: t.tier,
    })),
    elements: [...registry.list()].sort((a, b) => (a.type < b.type ? -1 : a.type > b.type ? 1 : 0)),
    design: {
      designStateVersion: DESIGN_STATE_VERSION,
      brandFields: sorted(Object.keys(brandSchema.shape)),
      radiusPresets: [...RADIUS_PRESET_IDS],
      fontScale: {
        base: [...FONT_SCALE_BOUNDS.base],
        ratio: [...FONT_SCALE_BOUNDS.ratio],
      },
      density: [...DENSITY_BOUNDS],
      liveSections: DESIGN_LIVE_SECTIONS,
    },
    // Availability-gated (W7): the surface only advertises sections THIS host
    // can actually compose — same no-drift doctrine as the rest of the snapshot.
    sections: SITE_SECTIONS.filter((s) =>
      (s.requires ?? []).every((t) => registry.get(t) !== undefined),
    ).map(({ id, intent, role, slots, requires }) => ({
      id,
      intent,
      ...(role !== undefined ? { role } : {}),
      slots,
      ...(requires !== undefined ? { requires } : {}),
    })),
  };
}
