/**
 * Gate: rendered markup follows the class contract (doc 04 §1.2) — a root
 * `.fx-*` class, and variant/size/state expressed as `data-*`/`.is-*`, never as
 * BEM `--modifier` suffixes on the root. The button case pins the exact `data-*`
 * contract; a registry-driven sweep holds every other component to the shape.
 * Runs against static markup (no DOM needed).
 */
import { describe, expect, it } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { FLEXA_UI_COMPONENTS } from '../src/registry';
import { FxButton } from '../src/button/button';

describe('class-contract: button', () => {
  const html = renderToStaticMarkup(
    createElement(FxButton, { variant: 'secondary', size: 'lg' }, 'Label'),
  );

  it('has the root fx-button class', () => {
    expect(html).toContain('class="fx-button"');
  });

  it('contracts variant/size as data-* attributes', () => {
    expect(html).toMatch(/data-variant="secondary"/);
    expect(html).toMatch(/data-size="lg"/);
  });

  it('does not encode variant as a className modifier', () => {
    expect(html).not.toMatch(/class="fx-button[^"]*--/);
    expect(html).not.toMatch(/fx-button-secondary/);
  });
});

/** Root class attribute (the outermost element = first `class="…"`) of the first
 *  non-empty variant for each registered component. The contract governs the
 *  root; decorative sub-element naming (e.g. a directional icon) is not policed. */
const RENDERS = FLEXA_UI_COMPONENTS.map((spec) => {
  for (const v of spec.variants) {
    const html = renderToStaticMarkup(createElement(spec.component, v.props, v.children));
    if (html.trim()) return { slug: spec.slug, rootClass: html.match(/class="([^"]*)"/)?.[1] ?? '' };
  }
  return { slug: spec.slug, rootClass: '' };
});

describe('class-contract: registry sweep', () => {
  it.each(RENDERS)('$slug carries an fx- root class', ({ rootClass }) => {
    // Portal-only overlays render nothing server-side — nothing to assert.
    if (!rootClass) return;
    expect(rootClass).toMatch(/\bfx-[a-z-]+/);
  });

  it.each(RENDERS)('$slug root uses no BEM --modifier', ({ rootClass }) => {
    // A `--` in the root class token would be a contracted-variant BEM modifier.
    expect(rootClass).not.toMatch(/\bfx-[a-z-]+--[a-z]/);
  });
});
