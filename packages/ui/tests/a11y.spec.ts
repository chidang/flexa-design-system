// @vitest-environment jsdom
/**
 * Gate: axe finds no violations across EVERY registered component's showcase
 * variants (doc 11 §testing — necessary, not sufficient; manual SR pass stays in
 * the release checklist). Driven by the registry, so a component is a11y-gated
 * the moment it registers a spec. Colour-contrast is checked by the FDS contrast
 * gate, not here (jsdom has no layout), so that one axe rule is disabled.
 *
 * Rendering is static (`renderToStaticMarkup`): overlays guard their portal on a
 * mounted flag, so they render nothing server-side (their open-state SR pass is
 * manual) — the gate still covers every non-portal surface and closed trigger.
 */
import { describe, expect, it } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { axe } from 'jest-axe';
import { FLEXA_UI_COMPONENTS } from '../src/registry';
import { FxButton } from '../src/button/button';

// jsdom has no matchMedia; components that probe it must not crash the gate.
if (!window.matchMedia) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (window as any).matchMedia = (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  });
}

const AXE_OPTS = { rules: { 'color-contrast': { enabled: false } } };

async function violations(html: string) {
  const host = document.createElement('div');
  host.innerHTML = html;
  document.body.appendChild(host);
  const results = await axe(host, AXE_OPTS);
  host.remove();
  return results.violations;
}

/** Every (component, variant) pair as a flat, individually-named case. */
const CASES = FLEXA_UI_COMPONENTS.flatMap((spec) =>
  spec.variants.map((variant, i) => ({
    id: `${spec.slug} · ${variant.label || i}`,
    spec,
    variant,
  })),
);

describe('a11y', () => {
  it.each(CASES)('$id has no axe violations', async ({ spec, variant }) => {
    const html = renderToStaticMarkup(
      createElement(spec.component, variant.props, variant.children),
    );
    // Empty markup (e.g. a closed portal-only overlay) trivially passes.
    if (!html.trim()) return;
    expect(await violations(html)).toEqual([]);
  });

  it('icon-only button needs an accessible name', async () => {
    const labelled = renderToStaticMarkup(
      createElement(FxButton, { 'aria-label': 'Close' }, createElement('span', { 'aria-hidden': true }, '×')),
    );
    expect(await violations(labelled)).toEqual([]);
  });
});
