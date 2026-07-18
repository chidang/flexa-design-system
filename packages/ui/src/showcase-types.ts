/**
 * ShowcaseSpec — the single data source that BOTH the kitchen-sink workbench
 * (doc 13 D-5) and the public fds-docs "Components" section (doc 13 §5) derive
 * every demo from. A component authors one `<name>.showcase.ts` exporting a
 * `ShowcaseSpec`; there is no competing docs-only demo mechanism.
 *
 * `enums` must reference the component's OWN exported unions (from `enums.ts`),
 * never re-typed literals — `tests/showcase-registry.spec.ts` checks the anchor
 * resolves in the SSOT and that slugs are unique; `enum-drift.spec.ts` keeps the
 * unions honest against doc 04.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- demo grid spreads
// heterogeneous per-component props; each spec's own `props`/`enums` document them.
import type { ComponentType } from 'react';

/** One documented prop row (transcribed from the component's doc 04 contract). */
export interface PropRow {
  name: string;
  type: string;
  default?: string;
  required?: boolean;
  description: string;
}

/** One documented event/callback row. */
export interface EventRow {
  name: string;
  payload: string;
  description: string;
}

/** One keyboard-interaction row (APG map, doc 11). */
export interface KeyboardRow {
  keys: string;
  action: string;
}

/** One ARIA contract row. */
export interface AriaRow {
  attr: string;
  value: string;
  note?: string;
}

/** A single rendered permutation in the demo grid. */
export interface ShowcaseVariant {
  /** Short label shown above the rendered instance. */
  label: string;
  /** Props spread onto the component. */
  props: Record<string, unknown>;
  /** Text children when the component accepts them. */
  children?: string;
  /** Optional caption under the instance. */
  note?: string;
}

/** Deep-link into the markdown SSOT (bible docs stay authoritative). */
export interface ContractRef {
  /** File under `ui-kit/`, e.g. `04-component-bible.md`. */
  doc: string;
  /** A heading substring that must appear in `doc` (slug derived from it). */
  heading: string;
}

export interface ShowcaseSpec {
  /** Canonical component name, e.g. `Button`. */
  name: string;
  /** URL slug, e.g. `button`. Unique across the registry. */
  slug: string;
  /** `UI_CATEGORIES` id this component belongs to. */
  category: string;
  /** Slice that shipped it, e.g. `U1`. */
  slice: string;
  /** Fallback one-liner when no `content/components/<slug>.json` prose exists. */
  tagline?: string;
  /** `stub` during U0; `ready` once fully built to its 04 contract. */
  status?: 'stub' | 'ready';
  /** True when the demo needs a client island (hooks/portals) in fds-docs. */
  interactive?: boolean;
  /** The component to render in demos. */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  component: ComponentType<any>;
  /** All applicable states × variants × sizes. */
  variants: ShowcaseVariant[];
  props?: PropRow[];
  events?: EventRow[];
  keyboard?: KeyboardRow[];
  aria?: AriaRow[];
  /** Enum name → its canonical values (must be the component's own union). */
  enums?: Record<string, readonly string[]>;
  contract?: ContractRef;
}

/** A component category (the 10 sections of the inventory, README). */
export interface UiCategory {
  id: string;
  title: string;
  blurb: string;
}
