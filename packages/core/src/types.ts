/**
 * `Json`/`StyleDecls`/`StyleSpec` sống ở `flexa-design-system` (FDS standalone, doc 19 —
 * package token không phụ thuộc core); re-export tại đây giữ nguyên import
 * surface `./types.js` cho toàn bộ core/editor/adapters.
 */
import type { Json, StyleDecls, StyleSpec } from 'flexa-design-system';

export type { Json, StyleDecls, StyleSpec } from 'flexa-design-system';

export type Settings = Record<string, Json>;

export type Breakpoint = 'desktop' | 'laptop' | 'tablet' | 'mobile';

/**
 * `hideOn` bands (amendment 2026-07-10, 07 §2 — laptop follow-up):
 * - `desktop` (legacy, docs saved before laptop existed) = >1024, i.e. the
 *   UNION of `wide` + `laptop`. Its emit is untouched so old documents render
 *   byte-identical; the editor reads it as Desktop + Laptop both hidden and
 *   rewrites to the explicit tokens on the next toggle.
 * - `wide` = >1440 · `laptop` = 1025–1440 · `tablet` = 768–1024 · `mobile` = ≤767.
 * `wide` + `laptop` together emit the SAME single >1024 rule as legacy `desktop`.
 */
export type HideBreakpoint = 'desktop' | 'wide' | 'laptop' | 'tablet' | 'mobile';

/**
 * Settings cấp NODE (02 §A) — thứ mọi element đều cần, nằm ngoài schema manifest.
 * Render pipeline đọc (wrapper class + CSS display:none), không đụng engine đóng băng.
 */
export interface NodeAdvanced {
  /** Class thêm vào wrapper `.fx` — hook cho CSS global/kit, chỉ là chuỗi (portable). */
  class?: string;
  /** Ẩn node ở các dải liệt kê (media query cùng nguồn breakpoints với CSS compiler). */
  hideOn?: HideBreakpoint[];
}

/**
 * Node-level visual style (02 §A, spec 07 §2) — one "page" of style groups.
 * Closed set of known properties: plain JSON, PHP-mirrorable, no freeform CSS.
 * Group names can never collide with the breakpoint/state keys of NodeStyle.
 */
export interface NodeStyleGroups {
  /** CSS shorthand strings — same format the 'spacing' control serializes. */
  spacing?: { margin?: string; padding?: string };
  background?: { color?: string };
  border?: { width?: string; style?: string; color?: string; radius?: string };
  /** Composed into one deterministic `box-shadow` string; skipped without color. */
  shadow?: { x?: number; y?: number; blur?: number; spread?: number; color?: string; inset?: boolean };
  typography?: {
    family?: string;
    size?: number;
    weight?: number;
    lineHeight?: number;
    letterSpacing?: number;
    transform?: string;
    color?: string;
    align?: string;
  };
  size?: {
    width?: string;
    maxWidth?: string;
    minHeight?: string;
    height?: string;
    minWidth?: string;
    maxHeight?: string;
    /** CSS aspect-ratio string, e.g. "16 / 9". */
    aspectRatio?: string;
  };
  /** Neutral layout properties (Slice C) + display (Slice D — never 'none', hideOn owns that). */
  layout?: { zIndex?: number; order?: number; overflow?: string; display?: string };
  /** Offsets are emitted independently of mode (07 §2.2) — harmless with static. */
  position?: { mode?: string; top?: string; right?: string; bottom?: string; left?: string };
  /** Shown in the editor only when the parent creates a flex context (07 §2.4). */
  flexItem?: { alignSelf?: string; grow?: number; shrink?: number; basis?: string };
  /** Shown in the editor only when the parent creates a grid context (07 §2.4). */
  gridItem?: { column?: string; row?: string; justifySelf?: string; alignSelf?: string };
  /** Composed into one deterministic `filter` string; empty group is skipped. */
  effects?: {
    blur?: number;
    brightness?: number;
    contrast?: number;
    saturate?: number;
    grayscale?: number;
    hueRotate?: number;
  };
  /** Composed into deterministic `transform` (+ `transform-origin`) strings. */
  transform?: {
    translateX?: string;
    translateY?: string;
    scaleX?: number;
    scaleY?: number;
    rotate?: number;
    skewX?: number;
    skewY?: number;
    originX?: string;
    originY?: string;
  };
  /** 0..1 */
  opacity?: number;
}

/** State page — subset of groups that make sense on :hover/:active/:focus (not responsive). */
export type NodeStyleState = Pick<
  NodeStyleGroups,
  'background' | 'border' | 'shadow' | 'opacity' | 'transform'
> & {
  typography?: { color?: string };
};

/** Old alias kept for compatibility (renamed in Slice D). */
export type NodeStyleHover = NodeStyleState;

/**
 * Node-level style (02 §A): desktop values are the base; `laptop`/`tablet`/
 * `mobile` are max-width overrides matching the CSS compiler's `@responsive`
 * model (laptop added 2026-07-10, 07 §2 amendment). Prunable at every level —
 * empty objects are removed, never stored (07 §2.1).
 */
export interface NodeStyle extends NodeStyleGroups {
  laptop?: NodeStyleGroups;
  tablet?: NodeStyleGroups;
  mobile?: NodeStyleGroups;
  hover?: NodeStyleState;
  active?: NodeStyleState;
  focus?: NodeStyleState;
  transition?: { duration?: number; easing?: string };
}

/**
 * Nút của cây document — SSOT của toàn hệ thống, trung lập platform.
 * `v` là schema-version của element tại thời điểm node được tạo/migrate lần cuối;
 * thiếu nghĩa là 1. Dùng cho migration khi manifest nâng version.
 */
export interface FlexaNode {
  id: string;
  type: string;
  /** Tên hiển thị user đặt trong editor (rename) — engines render BỎ QUA field này. */
  label?: string;
  settings: Settings;
  children: FlexaNode[];
  v?: number;
  advanced?: NodeAdvanced;
  style?: NodeStyle;
  /**
   * Reserved opaque passthrough (AI-readiness §1d / EP-2) — engines render BỎ QUA
   * hoàn toàn, serialization giữ verbatim (TS↔PHP). Namespace provenance cho
   * importer & AI Platform (figma layer-id, DOM selector, prompt hash, confidence…)
   * để re-import khớp node cũ thay vì đẻ trùng. CHỈ reserve — Builder không đọc;
   * nội dung do AI Platform điền. Cùng hợp đồng với [[FlexaDocument]].meta cấp document.
   */
  meta?: Record<string, unknown>;
}

export type DocumentKind = 'page' | 'template' | 'block';

export interface FlexaDocument {
  id: string;
  kind: DocumentKind;
  title: string;
  tree: FlexaNode;
  /** Tăng mỗi lần publish — tham gia cache key ở mọi adapter. */
  version: number;
  /**
   * Schema-FORMAT version của envelope document (KHÁC `version` publish-counter ở
   * trên). Cho phép document — kể cả do AI sinh — TỰ MÔ TẢ định dạng nó nhắm tới, để
   * `migrateDocument` nâng cấp shape cũ khi contract đổi (đổi tên `tree`, thêm field
   * bắt buộc…). Thiếu = `DOCUMENT_SCHEMA_VERSION` hiện tại (back-compat). Additive:
   * engines render cây, KHÔNG đọc field này.
   */
  schemaVersion?: number;
  /**
   * Metadata cấp document (excerpt, ảnh đại diện, layout…) — field do host định
   * nghĩa qua documents.metaFields (02 §A/§G); engines render KHÔNG đọc.
   */
  meta?: Record<string, Json>;
}

// ---------------------------------------------------------------------------
// Element manifest (hợp đồng công khai — xem 03-element-manifest.md)
// ---------------------------------------------------------------------------

/**
 * Every control kind an element schema may use — the single source of truth for
 * both the `ControlType` union and the manifest zod enum (`manifest.ts`), so the
 * capability catalog (`capabilities.ts`) and the validator can never drift.
 */
export const CONTROL_TYPES = [
  'text',
  'textarea',
  'number',
  'select',
  'buttongroup',
  'toggle',
  'color',
  'spacing',
  'typography',
  'image',
  'file',
  'link',
  'repeater',
  'responsive',
] as const;

export type ControlType = (typeof CONTROL_TYPES)[number];

export interface ControlDef {
  type: ControlType;
  label?: string;
  default?: Json;
  options?: Json[];
  min?: number;
  max?: number;
  /** Với type 'responsive': control được bọc bên trong. */
  control?: ControlDef;
  /** Với type 'repeater': schema của một item. */
  fields?: Record<string, ControlDef>;
  /**
   * Với type 'image'/'file': map field của MediaItem → TÊN setting anh em để
   * media picker điền kèm khi chọn (vd `{alt: 'alt', filename: 'filename'}`).
   * EDITOR-ONLY — engines bỏ qua, giá trị vẫn là settings thường trong data.
   */
  pickTargets?: Record<string, string>;
  /**
   * i18n opt-out (Phase 6, xem `i18n.ts`): control `text`/`textarea` mặc định là
   * chuỗi dịch được (WPML/Polylang thu thập + swap). Đặt `false` để loại control
   * chứa text KHÔNG-phải-nội-dung (id neo, tên class thô…). Các control khác bỏ qua.
   */
  translatable?: boolean;
  /**
   * Conditional visibility (Flatsome-style). Control chỉ HIỆN trong settings panel
   * khi điều kiện đúng với giá trị hiệu dụng của setting anh em (`settings[key] ??
   * schema[key].default`). Xem `controlWhen.ts` cho ngữ nghĩa eval.
   * EDITOR-ONLY — engines/PHP bỏ qua; control bị ẩn VẪN giữ giá trị trong data và
   * VẪN render bình thường (non-destructive). Chỉ đánh giá ở control top-level của
   * `manifest.schema`; KHÔNG hỗ trợ trên nested control (repeater.fields / responsive.control).
   */
  when?: WhenCondition;
}

/**
 * Leaf test cho MỘT sibling setting (xem `controlWhen.ts`):
 *   - array  → `in`   (value ∈ array)
 *   - object → operator clause (keys ⊆ WHEN_OPERATORS; nhiều operator = AND)
 *   - còn lại (string/number/boolean/null) → `eq`
 * Muốn eq với một object value → dùng `{ eq: {...} }` tường minh.
 */
export type WhenClause =
  | Json
  | Json[]
  | {
      eq?: Json;
      ne?: Json;
      in?: Json[];
      nin?: Json[];
      gt?: number;
      gte?: number;
      lt?: number;
      lte?: number;
      truthy?: boolean;
    };

/**
 * Điều kiện hiển thị: mỗi key (trừ `any`) = tên sibling setting → clause phải đúng;
 * tất cả AND lại. Key reserved `any` = nhóm OR: pass nếu MỘT sub-condition pass.
 *
 * LƯU Ý: `any` là key RESERVED cho nhóm OR — một setting đặt tên đúng `"any"` sẽ bị
 * hiểu là OR-group, không phải test bằng. Tránh đặt tên setting là `any`.
 */
export interface WhenCondition {
  /** Reserved OR-group — pass nếu MỘT sub-condition trong mảng pass. */
  any?: WhenCondition[];
  [setting: string]: WhenClause | WhenCondition[] | undefined;
}

/**
 * Prop-map entry — logic bị giới hạn: chỉ tham chiếu (@ref) + formatter đóng băng.
 * `{ classIf: { '@flag': 'class-name' } }` là dạng đặc biệt cho class có điều kiện.
 */
export type PropDef =
  | { value: Json; format?: string; arg?: Json }
  | { classIf: Record<string, string> };

export interface StyleRule extends StyleDecls {
  // Các key đặc biệt được CSS compiler hiểu; phần còn lại là CSS declarations.
}

/**
 * Variant recipe (FDS §6.1, Phase 5.5 Slice 5) — data-only. A component's look is
 * a set of style-spec fragments merged by the chosen variant props, NOT "just a
 * token swap": Outline/Ghost/Link differ in STRUCTURE (border on/off, bg none), so
 * each option carries a full fragment. Compiled at render time by `recipeToSpec`
 * (a pipeline layer, mirrored in PHP) → one StyleSpec → the frozen CSS compiler.
 * Every value still flows through `resolveStyleTokens` + `compileCss`, so recipes
 * stay declarative and parity-locked (QĐ-0: no runtime, compile-time only).
 */
export interface Recipe {
  /** Always-applied fragment — the component's shared skeleton. */
  base?: StyleSpec;
  /** dimension (prop name) → option value → fragment. Applied in declaration order. */
  variants?: Record<string, Record<string, StyleSpec>>;
  /**
   * Compound variants: a fragment applied ONLY when every `when` prop equals the
   * chosen option for that dimension — solves the combinatorial blow-up that a flat
   * option list can't (e.g. outline + danger needs its own border/text pairing).
   */
  compound?: Array<{ when: Record<string, string>; style: StyleSpec }>;
  /** dimension → default option, used when a prop is unset or not a known option. */
  default?: Record<string, string>;
}

export interface A11ySpec {
  role?: string;
  requiresAlt?: boolean;
  /**
   * Element render một heading — `validateDocument` (a11y.ts) đọc level để enforce
   * "h1 đơn" + heading hierarchy. `level` = cố định (vd demo heading luôn h2);
   * `levelFrom` = tên setting chứa level (`'h2'` hoặc `2`), vd `wp/post-title` { levelFrom: 'level' }.
   */
  heading?: { level?: number; levelFrom?: string };
  /**
   * Element render một image — enforce alt khi src có. `srcSetting`/`altSetting` là
   * TÊN setting để validator biết chỗ đọc. (Legacy `requiresAlt:true` = convention
   * mặc định `{ srcSetting:'src', altSetting:'alt' }`.)
   */
  image?: { srcSetting: string; altSetting: string };
  /**
   * Element render một DANH SÁCH ảnh từ repeater (vd flexa/gallery) — enforce alt
   * TỪNG entry (mirror `image` nhưng cho entry lồng). `setting` = TÊN setting repeater;
   * `srcField`/`altField` = tên field TRONG mỗi entry. Entry có src non-empty nhưng
   * alt rỗng ⇒ finding `missing-alt` (kèm số thứ tự entry trong message).
   */
  imageItems?: { setting: string; srcField: string; altField: string };
  /**
   * Element render một ARIA landmark (`<main>`, `<nav>`, `<header>`…) — `validateDocument`
   * enforce "landmark duy nhất" cho các role phải là 1 trên trang (`main`/`banner`/`contentinfo`).
   * Giá trị = ARIA role (`'main'`, `'nav'`, `'banner'`, `'contentinfo'`…). Role lặp hợp lệ
   * (`nav`, `complementary`, `region`…) khai được nhưng không bị gate uniqueness.
   */
  landmark?: string;
  /**
   * Landmark role đến từ SETTING (mirror `heading.levelFrom` — E2, doc 15 §6): giá trị
   * = TÊN setting chứa role (vd flexa/section `{ landmarkFrom: 'landmark' }`). Setting
   * rỗng/vắng ⇒ node không phải landmark. `landmark` tĩnh (nếu khai) thắng.
   */
  landmarkFrom?: string;
}

/**
 * SEO structured-data (JSON-LD) khai báo trong manifest (Phase 6, xem 09) — element
 * DECLARE semantics schema.org, core `seo.ts` WALK cây → emit `<script type="application/ld+json">`.
 * Data thuần, KHÔNG engine đóng băng (tầng pipeline như A11ySpec).
 */
export interface StructuredDataSpec {
  /**
   * schema.org @type của object, vd 'Article', 'ImageObject'. BẮT BUỘC cho
   * `role` 'self'/'primary'; BỎ QUA khi 'part' (part kế thừa @type của primary).
   */
  type?: string;
  /**
   * Page-level composition (Phase 6 Slice 5, xem 09 §3/§4). Mặc định `'self'` =
   * mỗi node tự sinh một object rời (per-node model của Slice 4, back-compat):
   * - `'self'`   → object schema.org độc lập trong `@graph`.
   * - `'primary'`→ node thành THỰC THỂ TRANG (nhận `@id:'#primary'`); part gộp property vào.
   *   Nhiều primary/trang → primary sau degrade thành 'self'.
   * - `'part'`   → CHỈ góp property vào primary (điền chỗ còn trống, pre-order); KHÔNG emit rời.
   *   Không có primary trên trang ⇒ part inert (bỏ).
   */
  role?: 'self' | 'primary' | 'part';
  /** property schema.org → TÊN setting (hoặc dynamic-prop provider) để đọc giá trị. */
  props: Record<string, string>;
  /**
   * List-valued property từ một REPEATER (E2, doc 15 §6 — mở khoá BreadcrumbList, defer 09):
   * `settings[setting]` (mảng entry repeater) → `prop` = danh sách object
   * `{'@type': type, position: n, …entry props}`. `position` 1-based LUÔN emit (ngữ
   * nghĩa schema.org ItemList mà contract này phục vụ); entry-prop rỗng bị bỏ (cùng
   * luật isNonEmpty), entry 0 prop bị bỏ, danh sách rỗng ⇒ prop không emit. Danh sách
   * nối SAU các prop scalar (thứ tự key ổn định cho parity).
   */
  items?: {
    /** property schema.org nhận danh sách, vd 'itemListElement'. */
    prop: string;
    /** TÊN setting repeater chứa các entry. */
    setting: string;
    /** schema.org @type của TỪNG entry, vd 'ListItem'. */
    type: string;
    /** entry-property schema.org → TÊN FIELD trong repeater. */
    props: Record<string, string>;
  };
}

export interface SeoSpec {
  structuredData?: StructuredDataSpec;
}

/** Node spec khai báo trong preset — không có id (editor sinh id mới lúc chèn). */
export interface PresetNode {
  type: string;
  settings?: Settings;
  children?: PresetNode[];
  /**
   * Node-level style carried into the tree on insert (export/import — doc 22 EX1).
   * Additive/optional: catalog & marketplace presets that omit it are byte-identical
   * to before. `validatePack` runs the same on-system token gate node.style runs
   * everywhere else, so an imported preset can never smuggle an off-system token.
   */
  style?: NodeStyle;
  /** Editor rename carried into the inserted node (export/import — doc 22 EX1). */
  label?: string;
}

/**
 * Preset của element — chọn trong picker chèn nguyên cụm node.
 * `settings` là settings cho chính element được chèn.
 */
export interface ElementPreset {
  title: string;
  settings?: Settings;
  children?: PresetNode[];
}

export interface ElementManifest {
  type: string;
  title: string;
  category?: string;
  icon?: string;
  /**
   * Palette search synonyms (lowercase) — thuần metadata cho editor picker,
   * engine/render không đọc. Không lặp lại title/type (search đã khớp chúng).
   */
  keywords?: string[];
  tier: 'declarative' | 'imperative';
  version: number;
  schema: Record<string, ControlDef>;
  props?: Record<string, PropDef>;
  /**
   * Template Mustache logic-less, dạng CHUỖI. Core không đọc file (platform-free);
   * việc resolve './x.mustache' → string là của adapter/bundler.
   * Bắt buộc với Tier 1 (declarative); tùy chọn với Tier 2 (host tự render).
   */
  template?: string;
  /**
   * Cache policy — BẮT BUỘC với Tier 2. Host áp dụng; Tier 1 luôn cacheable nên không cần.
   * cacheable: false → host bypass render cache cho node này (dữ liệu cực-động,
   * phụ thuộc request, v.v.).
   */
  cache?: { cacheable: boolean };
  style?: StyleSpec;
  /**
   * Variant recipe (FDS §6.1, Slice 5) — data-only. Compiled per node by the props
   * the node has chosen (see `Recipe`); emitted after `style`, before `node.style`.
   */
  recipe?: Recipe;
  /** TÊN data provider — adapter map tên này sang hàm server của nó. */
  data?: string;
  /** ID của init script — host resolve & nạp; cùng một file chạy editor lẫn frontend. */
  init?: string;
  assets?: { css?: string[]; js?: string[] };
  a11y?: A11ySpec;
  /**
   * SEO structured-data (Phase 6, xem 09) — element khai schema.org semantics; core
   * `collectStructuredData`/`emitJsonLd` (`seo.ts`, KHÔNG engine đóng băng) walk cây → JSON-LD.
   */
  seo?: SeoSpec;
  /**
   * Ràng buộc cấu trúc cây (editor enforce, engine render bỏ qua — xem 03 §2b):
   * childTypes = con trực tiếp chỉ được là các type này;
   * parentTypes = element này chỉ được đặt trong các type cha này.
   */
  childTypes?: string[];
  parentTypes?: string[];
  /**
   * Formatting context tại vị trí {{{children}}} trong template (03 §2b) —
   * khai báo vì không suy được từ CSS ({{{children}}} có thể nằm trong div con).
   * Editor dùng để hiện/ẩn group Flex Item / Grid Item; render bỏ qua.
   */
  childrenDisplay?: 'flex' | 'grid';
  /** Presets hiện ở bước 2 của picker khi thêm element (xem 03 §2b). */
  presets?: ElementPreset[];
}

// ---------------------------------------------------------------------------
// Render pipeline
// ---------------------------------------------------------------------------

export type FlatProps = Record<string, Json>;

export interface RenderContext {
  /** props động đã resolve bởi data provider, theo node id. */
  data?: Record<string, FlatProps>;
  /** breakpoints của global kit (px, max-width). */
  breakpoints?: Record<string, number>;
  /**
   * Global component styles (Design Packs D7, doc 12 §3d): element type →
   * StyleSpec áp cho MỌI node của type đó, emit sau recipe / trước node.style
   * (cascade: manifest < recipe < componentStyles < node.style). Không có entry
   * cho type ⇒ output byte-identical (khóa bởi parity fixtures).
   */
  componentStyles?: Record<string, StyleSpec>;
}

export interface RenderResult {
  html: string;
  css: string;
  assets: {
    css: string[];
    js: string[];
    /** init cần chạy: node id → init script id. */
    init: Array<{ nodeId: string; init: string }>;
  };
}
