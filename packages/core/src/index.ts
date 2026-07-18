export type {
  Json,
  Settings,
  Breakpoint,
  HideBreakpoint,
  NodeAdvanced,
  NodeStyle,
  NodeStyleGroups,
  NodeStyleHover,
  NodeStyleState,
  FlexaNode,
  FlexaDocument,
  DocumentKind,
  ControlType,
  ControlDef,
  WhenClause,
  WhenCondition,
  PropDef,
  StyleSpec,
  StyleDecls,
  Recipe,
  A11ySpec,
  SeoSpec,
  StructuredDataSpec,
  PresetNode,
  ElementPreset,
  ElementManifest,
  FlatProps,
  RenderContext,
  RenderResult,
} from './types.js';

export { CONTROL_TYPES } from './types.js';
export { defineElement, validateManifest, manifestSchema, ManifestError, ELEMENT_CATEGORIES, type ManifestValidation } from './manifest.js';
export { ElementRegistry } from './registry.js';
// AI-readiness §1a — capability catalog: the machine-readable surface AI generates against.
export {
  capabilities,
  type CapabilitiesSnapshot,
  type CapabilityToken,
  type SectionCapability,
} from './capabilities.js';
export { ROOT_TYPE, ROOT_ID, ROOT_MANIFEST, ensureRootTree, emptyRootTree } from './root.js';
export {
  BLOCK_REF_TYPE,
  BLOCK_REF_MANIFEST,
  blockRefOf,
  expandBlocks,
  collectBlockRefs,
  buildBlockUsage,
  collectBlockDependents,
  type BlockRefSettings,
} from './blocks.js';
export { resolveDynamicTags } from './tags.js';
export {
  FORM_TYPE,
  FORM_HONEYPOT_NAME,
  FORM_FIELD_TYPES,
  collectFormFields,
  validateSubmission,
  type FormFieldKind,
  type FormFieldSpec,
  type FormSpec,
  type FormErrorCode,
  type FormValidationResult,
} from './forms.js';
export {
  matchTemplate,
  parseTemplateRule,
  type TemplateContext,
  type TemplateCondition,
  type TemplateConditionScope,
  type TemplateRule,
} from './templates.js';
export {
  MigrationRegistry,
  migrateDocument,
  DOCUMENT_SCHEMA_VERSION,
  type Migration,
  type DocumentMigration,
} from './migrate.js';
// AI-readiness §1b/§1c — document envelope schema (SSOT for `flexa schema document`).
export { documentSchema } from './document.js';
// AI-readiness (doc 11) — project envelope: the single top-level hand-off artifact
// for a whole site (documents + theme + routing + assets), validated behind one gate.
export {
  validateProject,
  migrateProject,
  resolveRoute,
  projectSchema,
  PROJECT_SCHEMA_VERSION,
  type FlexaProject,
  type ProjectRouting,
  type AssetRef,
  type ProjectMigration,
  type ProjectValidation,
} from './project.js';
export { renderDocument } from './render.js';
// Phase 6 — document-level a11y gate (heading hierarchy + required alt).
export { validateDocument, type A11yFinding } from './a11y.js';
// Phase 6 — SEO structured data (JSON-LD slot, xem 09): per-node → @graph emit.
export { collectStructuredData, emitJsonLd, type JsonLdObject } from './seo.js';
// Phase 6 — string translation (WPML/Polylang, step 2): collect + swap text settings.
export {
  collectStrings,
  applyTranslations,
  translatableKeys,
  stringName,
  type I18nString,
  type Translator,
} from './i18n.js';
// AI-readiness (doc 11 §6, project Slice A3) — asset references: the host-importer
// seam. `asset:<id>` placeholders on media controls → collect (what to fetch) / apply
// (swap to real URLs at ingest). Core never fetches media.
export {
  ASSET_REF_PREFIX,
  assetRef,
  parseAssetRef,
  assetKeys,
  collectAssetRefs,
  applyAssetUrls,
  type AssetRefUsage,
  type AssetResolver,
} from './assets.js';
export { nodeStyleToSpec, groupsToDecls, pruneNodeStyle } from './nodeStyle.js';
export { recipeToSpec } from './recipe.js';
export { evalWhen, whenRefs, unknownWhenOperators, WHEN_OPERATORS } from './controlWhen.js';

// Marketplace packaging contract (Phase 5.5 Slice 8) — 3 pack kinds (theme/
// element/preset), all data, gated by an fdsVersion semver + on-system tokens.
export {
  validatePack,
  packEnvelopeSchema,
  parseSemver,
  isCompatible,
  type Pack,
  type PackKind,
  type PackBase,
  type ThemePack,
  type ElementPack,
  type PresetPack,
  type DesignPack,
  type SitePack,
  type PresetEntry,
  type PackValidation,
  type SemVer,
} from './pack.js';

// Design Packs (Phase 6, doc 12) — site-look model: Brand -> Theme (applyBrand),
// the persisted DesignState, and the shared component-styles gate. Data + pure fns.
export {
  applyBrand,
  readableOn,
  deriveSecondary,
  SECONDARY_HUE_SHIFT,
  extractBrandColors,
  pickBrandColors,
  brandFromLogo,
  type LogoBrandColors,
  type WeightedColor,
  brandSchema,
  validateDesignState,
  validateComponentStyles,
  RADIUS_PRESETS,
  RADIUS_PRESET_IDS,
  FONT_SCALE_DEFAULTS,
  FONT_SIZE_STEPS,
  fontScaleValue,
  FONT_SCALE_BOUNDS,
  DENSITY_BOUNDS,
  DENSITY_DEFAULT,
  SPACE_STEPS,
  densityValue,
  LINE_HEIGHTS,
  BODY_LEADING_FLOOR,
  HEADING_LEADING,
  BODY_LEADING_K,
  headingLeading,
  bodyLeading,
  DESIGN_STATE_VERSION,
  migrateDesignState,
  runDesignStateMigrations,
  type DesignStateMigration,
  type Brand,
  type FontScale,
  type RadiusPreset,
  type DesignState,
  type PackRef,
  type DesignStateValidation,
} from './design.js';

// Design catalog (doc 13 S6) — the Level-3 live-section choice space as pure
// data + its two projections, readable by capabilities()/CLI/AI and the editor.
export {
  DESIGN_LIVE_SECTIONS,
  sectionSpec,
  sectionChoices,
  type LiveSection,
  type LiveControl,
  type StyleChoice,
  type SectionChoices,
} from './designCatalog.js';

// Site catalog (doc 14 W1) — the curated section presets Site Generation
// composes pages from: the contract + slot walker (siteCatalog.ts) and the
// authored preset data (siteSections.ts).
export {
  PRESET_ICONS,
  PRESET_SOCIAL,
  SLOT_PREFIX,
  SLOT_REPEAT_KEY,
  parseSlotRef,
  collectSlotRefs,
  type SectionPreset,
  type SectionSlot,
  type SlotRefs,
} from './siteCatalog.js';
export { SITE_SECTIONS } from './siteSections.js';

// Site plan + composer (doc 14 W2) — the single AI output surface (SG-1) and the
// pure derivation that expands it into an already-validated FlexaProject (SG-2/3).
export {
  composeSite,
  composeSection,
  sitePlanSchema,
  planSectionSchemaFor,
  type PresetRole,
  migrateSitePlan,
  runSitePlanMigrations,
  pruneUnknownSlots,
  stripChrome,
  SITE_PLAN_VERSION,
  PLACEHOLDER_ASSET_URL,
  PLAN_PATH_RE,
  type SitePlan,
  type PlanPage,
  type PlanChrome,
  type PlanSection,
  type PlanItem,
  type SitePlanMigration,
  type PruneUnknownSlotsResult,
  type StripChromeResult,
  type ComposeSiteOptions,
  type ComposeSiteResult,
  type ComposeSectionOptions,
  type ComposeSectionResult,
} from './sitePlan.js';
export { SAMPLE_IMAGE, sampleSectionFill } from './siteSamples.js';

// Design System tokens (Phase 5.5 Slice 0) — DATA + grammar only; no engine touch,
// no value resolution (tokens become var(--fx-*) via the Slice 1 pipeline).
export {
  FDS_TOKENS,
  TOKEN_IDS,
  FDS_VERSION,
  hasToken,
  isTokenNamespace,
  TOKEN_NAMESPACES,
  tokenType,
  getToken,
  tokenIdToCssVar,
  TokenError,
  type TokenType,
  type TokenEntry,
  type TokenValue,
} from 'flexa-design-system';
// Slice 1 — parity-locked token pipeline (QĐ-0): refs -> var(--fx-*), theme :root.
export { resolveTokenRefs, emitThemeRoot, type EmitToken } from 'flexa-design-system';
// Slice 2 — bare-public-id resolution over a StyleSpec, run before compileCss.
export { resolveStyleTokens, resolveStyleTokenValue } from 'flexa-design-system';
// Slice 7 — off-system token gate (flexa validate + host manifest loader).
export { findUnknownStyleTokens } from 'flexa-design-system';
// Slice 3 — theme model: multi-mode emission, the default theme, contrast gate.
export { emitTheme, type Theme, type ThemeMode } from 'flexa-design-system';
// Design Studio S1 (doc 13 §3) — constant var()-driven element rules for Flexa content.
export { emitBaseTypography } from 'flexa-design-system';
export { defaultTheme, DARK_MODE_OVERRIDES } from 'flexa-design-system';
export {
  contrastRatio,
  relativeLuminance,
  checkThemeContrast,
  CONTRAST_PAIRS,
  AA_NORMAL,
  type ContrastFailure,
} from 'flexa-design-system';
// Slice 4 — WordPress theme.json bridge: WP-aliased emit + settings fragment.
export {
  wpPresetVar,
  emitWpTheme,
  wpThemeJson,
  type WpPreset,
  type WpThemeJson,
} from 'flexa-design-system';

// Engines — export cho parity harness và editor (scoped re-render); per-element
// KHÔNG BAO GIỜ gọi thẳng vào đây.
export { renderTemplate, findForbiddenRawTags } from './engines/template.js';
export { compileCss, DEFAULT_BREAKPOINTS, type CssCompileOptions } from './engines/css.js';
export { resolveProps, resolveRef } from './engines/resolver.js';
export {
  FORMATTERS,
  FORMATTER_NAMES,
  registerFormatter,
  getFormatter,
  hasFormatter,
  listFormatters,
  clearCustomFormatters,
  type FormatterFn,
} from './engines/formatters.js';
