/**
 * Generated component API — the read side of the P-A generation step (doc 16).
 *
 * `scripts/generate-component-api.mjs` runs before `next build` and extracts,
 * from `packages/ui/src/**` via the TypeScript compiler API, every component's
 * JSDoc header, its props (name / type / default / required / description) and
 * its showcase example source into `content/generated/components-api.json`.
 *
 * This module is the CMS-swappable seam for that artifact (same pattern as
 * `src/content.ts`): pages consume only the types + loaders below. The artifact
 * is gitignored; loaders return `undefined` when it has not been generated yet
 * (e.g. `next dev` before a first build), and pages fall back to the curated
 * showcase-spec tables.
 */
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

/** One extracted prop row. `default` comes from the destructured parameter. */
export interface GeneratedProp {
  name: string;
  type: string;
  required: boolean;
  description: string;
  default?: string;
}

export interface GeneratedComponentApi {
  slug: string;
  name: string;
  category: string;
  /** Exported identifier, e.g. `FxButton`. */
  component: string;
  /** Source path relative to `packages/ui/src`, e.g. `button/button.tsx`. */
  sourceFile: string;
  /** The component file's JSDoc header, split into paragraphs. */
  description: string[];
  /** Props type name, e.g. `FxButtonProps`. */
  propsType?: string;
  /** External base types (DOM attribute bags) the props type extends. */
  inherits: string[];
  props: GeneratedProp[];
  example: {
    /** Path relative to `packages/ui/src`, e.g. `button/button.showcase.ts`. */
    file: string;
    /** Full `*.showcase.ts` source — the runnable example every demo derives from. */
    source: string;
  };
}

export interface GeneratedCategory {
  id: string;
  title: string;
  blurb: string;
  components: string[];
}

interface ApiArtifact {
  categories: GeneratedCategory[];
  components: Record<string, GeneratedComponentApi>;
}

const ARTIFACT = join(process.cwd(), 'content', 'generated', 'components-api.json');

let cache: ApiArtifact | null | undefined;

function loadArtifact(): ApiArtifact | null {
  if (cache === undefined) {
    cache = existsSync(ARTIFACT)
      ? (JSON.parse(readFileSync(ARTIFACT, 'utf8')) as ApiArtifact)
      : null;
  }
  return cache;
}

/** The generated API for one component, or undefined when not (yet) generated. */
export function loadComponentApi(slug: string): GeneratedComponentApi | undefined {
  return loadArtifact()?.components[slug];
}

/** Category groups of the generated artifact (kitchen-sink order). */
export function loadGeneratedCategories(): GeneratedCategory[] {
  return loadArtifact()?.categories ?? [];
}
