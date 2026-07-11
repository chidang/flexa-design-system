/**
 * renderDocument — pipeline render thuần, MỘT NGUỒN RENDER cho mọi phía.
 * Editor preview, Next.js SSR, playground đều gọi đúng hàm này; WordPress dùng
 * bản mirror PHP tương đương (Phase 4, gác bằng parity harness).
 */

import type {
  ElementManifest,
  FlatProps,
  FlexaNode,
  Json,
  RenderContext,
  RenderResult,
  Settings,
} from './types.js';
import type { ElementRegistry } from './registry.js';
import { resolveProps } from './engines/resolver.js';
import { renderTemplate } from './engines/template.js';
import { compileCss, DEFAULT_BREAKPOINTS } from './engines/css.js';
import { nodeStyleToSpec } from './nodeStyle.js';
import { recipeToSpec } from './recipe.js';
import { resolveStyleTokens } from 'flexa-design-system';

function schemaDefaults(manifest: ElementManifest): Settings {
  const out: Settings = {};
  for (const [key, control] of Object.entries(manifest.schema)) {
    if (control.default !== undefined) out[key] = control.default as Json;
  }
  return out;
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/**
 * CSS node-level cho advanced.hideOn (02 §A) — display:none theo media query
 * cùng nguồn breakpoints với CSS compiler. 4 dải wide(>laptop)/laptop/tablet/
 * mobile; token legacy `desktop` = wide+laptop (union) — wide+laptop cùng bật
 * emit ĐÚNG MỘT rule >tablet nên document cũ byte-identical. Phủ kín trục →
 * một rule thường (không media). Emit theo thứ tự cố định lớn→nhỏ.
 */
function hideOnCss(scope: string, hideOn: string[], breakpoints: Record<string, number>): string {
  const on = new Set(hideOn);
  const wide = on.has('wide') || on.has('desktop');
  const lap = on.has('laptop') || on.has('desktop');
  if (wide && lap && on.has('tablet') && on.has('mobile')) return `${scope}{display:none}`;
  const laptop = breakpoints['laptop'] ?? DEFAULT_BREAKPOINTS['laptop'] ?? 1440;
  const tablet = breakpoints['tablet'] ?? DEFAULT_BREAKPOINTS['tablet'] ?? 1024;
  const mobile = breakpoints['mobile'] ?? DEFAULT_BREAKPOINTS['mobile'] ?? 767;
  const rules: string[] = [];
  if (wide && lap) rules.push(`@media (min-width:${tablet + 1}px){${scope}{display:none}}`);
  else if (wide) rules.push(`@media (min-width:${laptop + 1}px){${scope}{display:none}}`);
  else if (lap)
    rules.push(`@media (min-width:${tablet + 1}px) and (max-width:${laptop}px){${scope}{display:none}}`);
  if (on.has('tablet'))
    rules.push(`@media (min-width:${mobile + 1}px) and (max-width:${tablet}px){${scope}{display:none}}`);
  if (on.has('mobile')) rules.push(`@media (max-width:${mobile}px){${scope}{display:none}}`);
  return rules.join('\n');
}

interface Collector {
  css: string[];
  assetCss: Set<string>;
  assetJs: Set<string>;
  init: Array<{ nodeId: string; init: string }>;
}

function renderNode(node: FlexaNode, registry: ElementRegistry, ctx: RenderContext, col: Collector): string {
  const manifest = registry.get(node.type);
  if (!manifest) {
    // Element chưa đăng ký trên host này → placeholder rõ ràng, không vỡ trang.
    return `<div class="fx fx--missing" data-fx="${escapeHtml(node.id)}" data-fx-missing="${escapeHtml(node.type)}"></div>`;
  }

  const settings: Settings = { ...schemaDefaults(manifest), ...node.settings };
  const dynamic: FlatProps = ctx.data?.[node.id] ?? {};
  const childrenHtml = node.children.map((c) => renderNode(c, registry, ctx, col)).join('');

  const props: FlatProps = {
    ...settings,
    ...resolveProps(manifest.props, settings),
    ...dynamic,
    // children là HTML do chính engine sinh — raw tag duy nhất được phép.
    children: childrenHtml,
  };

  const inner =
    manifest.tier === 'imperative' ? '' : renderTemplate(manifest.template ?? '', props);

  const scope = `[data-fx="${node.id}"]`;
  // Bare token public ids in the style-spec become var(--fx-*) BEFORE the frozen
  // CSS compiler runs (QĐ-0, Slice 2) — the engine only ever sees var() strings.
  const css = compileCss(manifest.style && resolveStyleTokens(manifest.style), settings, {
    scope,
    breakpoints: ctx.breakpoints ?? DEFAULT_BREAKPOINTS,
  });
  if (css) col.css.push(css);

  // Variant recipe (FDS §6.1, Slice 5): data-only recipe → merged StyleSpec for
  // this node's chosen variant props → resolveStyleTokens → frozen CSS compiler.
  // Emitted AFTER manifest CSS and BEFORE node.style, so a node-level override
  // still wins by source order. Settings drive both option choice and any @refs.
  if (manifest.recipe) {
    const recipeSpec = recipeToSpec(manifest.recipe, settings);
    if (recipeSpec) {
      const recipeCss = compileCss(resolveStyleTokens(recipeSpec), settings, {
        scope,
        breakpoints: ctx.breakpoints ?? DEFAULT_BREAKPOINTS,
      });
      if (recipeCss) col.css.push(recipeCss);
    }
  }

  // Global component styles (Design Packs D7, doc 12 §3d): the host's design
  // state maps element type → StyleSpec applied to EVERY node of that type.
  // Emitted AFTER recipe and BEFORE node.style so the cascade reads
  // manifest < recipe < componentStyles < node.style (source order, same
  // specificity). No entry for this type ⇒ nothing emitted (byte-identical,
  // locked by parity fixtures). Settings arg mirrors the manifest/recipe tiers:
  // '@key' refs resolve against this node's settings.
  const componentSpec = ctx.componentStyles?.[node.type];
  if (componentSpec) {
    const componentCss = compileCss(resolveStyleTokens(componentSpec), settings, {
      scope,
      breakpoints: ctx.breakpoints ?? DEFAULT_BREAKPOINTS,
    });
    if (componentCss) col.css.push(componentCss);
  }

  // node.style (node-level, 02 §A / 07 §2): closed-set groups → StyleSpec →
  // frozen CSS compiler. Emitted AFTER manifest CSS so node style wins by
  // source order (same specificity), and BEFORE hideOn (fixed per-node order).
  // Settings arg is {} on purpose: literal values only, '@…' strings drop.
  if (node.style) {
    const spec = nodeStyleToSpec(node.style);
    if (spec) {
      const styleCss = compileCss(resolveStyleTokens(spec), {}, {
        scope,
        breakpoints: ctx.breakpoints ?? DEFAULT_BREAKPOINTS,
      });
      if (styleCss) col.css.push(styleCss);
    }
  }

  // advanced (node-level, 02 §A): hideOn → CSS display:none; class → nối vào wrapper.
  const adv = node.advanced;
  if (adv?.hideOn?.length)
    col.css.push(hideOnCss(scope, adv.hideOn, ctx.breakpoints ?? DEFAULT_BREAKPOINTS));
  const advClass = adv?.class?.trim() ? ` ${escapeHtml(adv.class.trim())}` : '';

  for (const href of manifest.assets?.css ?? []) col.assetCss.add(href);
  for (const src of manifest.assets?.js ?? []) col.assetJs.add(src);
  if (manifest.init) col.init.push({ nodeId: node.id, init: manifest.init });

  const initAttr = manifest.init ? ` data-fx-init="${escapeHtml(manifest.init)}"` : '';
  // Wrapper chuẩn: điểm scope CSS + điểm bám init.js, đồng nhất mọi runtime.
  return `<div class="fx${advClass}" data-fx="${escapeHtml(node.id)}" data-fx-type="${escapeHtml(node.type)}"${initAttr}>${inner}</div>`;
}

export function renderDocument(
  root: FlexaNode,
  registry: ElementRegistry,
  ctx: RenderContext = {},
): RenderResult {
  const col: Collector = { css: [], assetCss: new Set(), assetJs: new Set(), init: [] };
  const html = renderNode(root, registry, ctx, col);
  return {
    html,
    css: col.css.join('\n'),
    assets: { css: [...col.assetCss], js: [...col.assetJs], init: col.init },
  };
}
