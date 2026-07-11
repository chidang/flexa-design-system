/**
 * Content layer (QĐ-19.9) — every page's copy lives in plain JSON under
 * `content/`, NOT in JSX. This module is the single seam a future CMS
 * migration swaps out: replace the `readFileSync` calls with a fetch against
 * the CMS API and every page keeps working (pages only consume the types
 * below). Loading happens at build time (static export), so output is
 * pre-rendered HTML either way.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

/** One renderable content block — the portable unit a CMS rich-text maps onto. */
export type Block =
  | { type: 'p'; text: string }
  | { type: 'h2'; text: string }
  | { type: 'h3'; text: string }
  | { type: 'code'; lang?: string; code: string }
  | { type: 'list'; items: string[] }
  | { type: 'table'; header: string[]; rows: string[][] }
  | { type: 'note'; text: string };

export interface Guide {
  slug: string;
  title: string;
  description: string;
  /** Sidebar / listing order (ascending). */
  order: number;
  blocks: Block[];
}

/**
 * The mission page ("Why FDS") — pure editorial copy rendered with the shared
 * block renderer, so it stays in the same CMS-swappable content seam as guides.
 */
export interface WhyDoc {
  title: string;
  description: string;
  blocks: Block[];
}

export interface SiteMeta {
  name: string;
  tagline: string;
  description: string;
  repoUrl: string;
  npmUrl: string;
  packageName: string;
}

/**
 * A starter-pack brand as authored in content. These are exactly the fields the
 * core `Brand` model accepts; the gallery derives a full theme from them via
 * `applyBrand`. `radius` is a `RadiusPreset` string, cast at the derivation seam.
 */
export interface PackBrand {
  primaryColor: string;
  secondaryColor: string;
  headingFont: string;
  bodyFont: string;
  radius: string;
  containerWidth: string;
}

export interface PackContent {
  id: string;
  name: string;
  group: string;
  description: string;
  tags: string[];
  personality: string;
  brand: PackBrand;
}

export interface PacksDoc {
  title: string;
  tagline: string;
  intro: string;
  principles: string[];
  curationNote: string;
  groups: { key: string; title: string; blurb: string }[];
  packs: PackContent[];
}

/**
 * The Accessibility page's editorial copy. The NUMBERS (minimums, ratios, ΔE,
 * findings) are never authored here — they are generated from the package's own
 * a11y engine in `src/a11y.ts`. This holds only the prose around them.
 */
export interface AccessibilityDoc {
  title: string;
  description: string;
  intro: string;
  standards: {
    title: string;
    blurb: string;
    items: { name: string; spec: string; blurb: string }[];
  };
  diagnostics: { title: string; clearBlurb: string; findingsBlurb: string };
  cvd: { title: string; blurb: string };
  highContrast: { title: string; blurb: string };
}

/**
 * The example dashboard's editorial copy. The token proof (which `--fx-*` the
 * page uses, and that none are off-system) is generated from the registry in
 * `src/example.ts`; this holds only the labels and sample data.
 */
export interface ExampleDoc {
  title: string;
  description: string;
  intro: string;
  appName: string;
  appTagline: string;
  exportLabel: string;
  stats: { label: string; value: string; delta: string; trend: 'up' | 'down' }[];
  panelTitle: string;
  columns: string[];
  statusLabels: Record<string, string>;
  rows: { name: string; status: string; amount: string; when: string }[];
  proofTitle: string;
  proofBlurb: string;
  tokenListTitle: string;
}

/**
 * The showcase gallery's editorial copy and sample data. The token proof (which
 * `--fx-*` each screen uses, and that none are off-system) is generated from the
 * registry in `src/showcase.tsx`; this holds only labels and sample content.
 */
export interface PricingTier {
  name: string;
  amount: string;
  per: string;
  badge?: string;
  features: string[];
  cta: string;
  featured: boolean;
}
export interface PricingContent {
  heading: string;
  sub: string;
  tiers: PricingTier[];
}
export interface LandingFeature {
  icon: string;
  title: string;
  text: string;
}
export interface LandingContent {
  eyebrow: string;
  title: string;
  sub: string;
  primaryCta: string;
  ghostCta: string;
  features: LandingFeature[];
}
export interface SignInContent {
  title: string;
  sub: string;
  emailLabel: string;
  emailPlaceholder: string;
  passwordLabel: string;
  passwordPlaceholder: string;
  submit: string;
  altLabel: string;
  alt: string;
  footPrompt: string;
  footLink: string;
}
export interface ShowcaseItemMeta {
  slug: string;
  title: string;
  blurb: string;
}

/**
 * A full travel landing page's copy and sample data. Every visible string lives
 * here behind the CMS seam; the structure and its token-only stylesheet live in
 * `src/showcase.tsx`, and the live brand recolouring in `src/TourBooking.tsx`.
 */
export interface IconFeature {
  icon: string;
  title: string;
  text: string;
}
export interface Stat {
  icon: string;
  value: string;
  label: string;
}
export interface TourBookingContent {
  brand: string;
  nav: string[];
  lang: string;
  signIn: string;
  hero: { titleA: string; titleHi: string; titleB: string; sub: string; cta: string };
  search: {
    tabs: string[];
    trip: string[];
    fields: { label: string; value: string }[];
    submit: string;
  };
  heroFeats: IconFeature[];
  destinations: {
    eyebrow: string;
    title: string;
    sub: string;
    items: { name: string; country: string }[];
    cta: string;
  };
  tours: { eyebrow: string; title: string; sub: string; items: IconFeature[]; cta: string };
  deals: {
    eyebrow: string;
    title: string;
    sub: string;
    items: { name: string; nights: string; price: string; was: string; save: string }[];
    cta: string;
  };
  inbox: {
    titleA: string;
    titleB: string;
    sub: string;
    placeholder: string;
    cta: string;
    art: string;
    stats: Stat[];
  };
  packages: {
    eyebrow: string;
    title: string;
    sub: string;
    items: { price: string; name: string; nights: string; icons: string; cta: string }[];
    impact: Stat[];
  };
  memorable: {
    eyebrow: string;
    title: string;
    sub: string;
    feats: IconFeature[];
    art: string;
  };
  reviews: {
    eyebrow: string;
    title: string;
    sub: string;
    items: { name: string; country: string; quote: string }[];
    cta: string;
  };
  takeoff: { title: string; sub: string; cta: string; art: string };
  blog: {
    eyebrow: string;
    title: string;
    sub: string;
    items: { date: string; title: string }[];
    cta: string;
  };
  footer: {
    about: string;
    socials: string[];
    columns: { title: string; links: string[] }[];
    newsletter: { title: string; sub: string; placeholder: string };
    copyright: string;
    pay: string;
  };
}

export interface ShowcaseDoc {
  title: string;
  description: string;
  intro: string;
  proofTitle: string;
  proofBlurb: string;
  tokenListTitle: string;
  items: ShowcaseItemMeta[];
  pricing: PricingContent;
  landing: LandingContent;
  signIn: SignInContent;
  tourBooking: TourBookingContent;
}

const CONTENT_DIR = join(process.cwd(), 'content');

export function loadSite(): SiteMeta {
  return JSON.parse(readFileSync(join(CONTENT_DIR, 'site.json'), 'utf8')) as SiteMeta;
}

export function loadWhy(): WhyDoc {
  return JSON.parse(readFileSync(join(CONTENT_DIR, 'why.json'), 'utf8')) as WhyDoc;
}

export function loadGuides(): Guide[] {
  const dir = join(CONTENT_DIR, 'guides');
  const guides = readdirSync(dir)
    .filter((f) => f.endsWith('.json'))
    .map((f) => JSON.parse(readFileSync(join(dir, f), 'utf8')) as Guide);
  return guides.sort((a, b) => a.order - b.order);
}

export function loadGuide(slug: string): Guide | undefined {
  return loadGuides().find((g) => g.slug === slug);
}

export function loadPacks(): PacksDoc {
  return JSON.parse(readFileSync(join(CONTENT_DIR, 'packs.json'), 'utf8')) as PacksDoc;
}

export function loadAccessibility(): AccessibilityDoc {
  return JSON.parse(
    readFileSync(join(CONTENT_DIR, 'accessibility.json'), 'utf8'),
  ) as AccessibilityDoc;
}

export function loadExample(): ExampleDoc {
  return JSON.parse(readFileSync(join(CONTENT_DIR, 'example.json'), 'utf8')) as ExampleDoc;
}

export function loadShowcase(): ShowcaseDoc {
  return JSON.parse(readFileSync(join(CONTENT_DIR, 'showcase.json'), 'utf8')) as ShowcaseDoc;
}

/**
 * A full-page showcase screen's copy, loaded from its own JSON file under
 * `content/showcase/<slug>.json`. Each large landing page keeps its content in a
 * dedicated file (so the pages stay independent and the gallery's shared
 * `showcase.json` holds only the item list + the small screens). The content
 * interface for each such page lives beside its component in `src/<Name>.tsx`.
 */
export function loadShowcaseScreen<T>(slug: string): T {
  return JSON.parse(
    readFileSync(join(CONTENT_DIR, 'showcase', `${slug}.json`), 'utf8'),
  ) as T;
}

/**
 * The recipe explorer's page copy. The recipes themselves (data) and the CSS
 * they generate live in `src/recipes.ts`; this holds only the surrounding prose.
 */
export interface RecipesDoc {
  title: string;
  description: string;
  intro: string;
  dataSummary: string;
  cssTitle: string;
  proofTitle: string;
  proofBlurb: string;
}

export function loadRecipes(): RecipesDoc {
  return JSON.parse(readFileSync(join(CONTENT_DIR, 'recipes.json'), 'utf8')) as RecipesDoc;
}
