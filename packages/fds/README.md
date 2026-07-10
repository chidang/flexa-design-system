# Flexa Design System (FDS)

[![npm](https://img.shields.io/npm/v/flexa-design-system.svg)](https://www.npmjs.com/package/flexa-design-system)
[![downloads](https://img.shields.io/npm/dm/flexa-design-system.svg)](https://www.npmjs.com/package/flexa-design-system)
[![minzipped](https://img.shields.io/bundlephobia/minzip/flexa-design-system.svg)](https://bundlephobia.com/package/flexa-design-system)
[![license](https://img.shields.io/npm/l/flexa-design-system.svg)](./LICENSE)

A **zero-runtime, WCAG-gated design token system**. FDS is the design foundation of
Flexa Builder, packaged so any project — with or without Flexa — can use it: pure
data (a DTCG token source) plus pure functions (theme emission, token resolution,
contrast checking). No framework, no runtime, no dependencies.

FDS is **not** a utility-class framework (Tailwind) and **not** a component source
library (shadcn). Its closest relatives are Radix Colors + Open Props + Style
Dictionary: a CSS-variables token layer with a strict naming contract, plus the
pipeline that turns token references into `var(--fx-*)` strings at build time.

## Install

```sh
npm install flexa-design-system
```

Or use the CSS directly, no build step:

```html
<link rel="stylesheet" href="https://unpkg.com/flexa-design-system/dist/theme.css">
<link rel="stylesheet" href="https://unpkg.com/flexa-design-system/dist/base-typography.css">
```

## The 30-second tour

Three token tiers — only the bottom one holds raw values:

| Tier | CSS prefix | Public id | Role |
|---|---|---|---|
| Primitive (`ref`) | `--fx-ref-*` | `ref.brand.600` | Raw scales; only tier with literals |
| Semantic | `--fx-*` | `color.primary`, `space.4` | Intent-named aliases — what you use |
| Component | `--fx-c-*` | `c.button.radius` | Narrow aliases for one component |

Re-theming = re-pointing aliases. Elements only ever read semantic tokens, so a
theme swap never touches a component.

```css
/* theme.css gives you the whole variable surface */
.card {
  background: var(--fx-color-surface);
  color: var(--fx-color-text);
  padding: var(--fx-space-6);
  border-radius: var(--fx-radius-lg);
  box-shadow: var(--fx-shadow-md);
}
```

Dark mode is one attribute — every `X` / `on-X` pair is contrast-checked (WCAG 2.2
AA) in CI, so it stays readable:

```html
<html data-fx-scheme="dark">
```

## JS API

Everything is a pure function over the token registry.

```ts
import {
  FDS_TOKENS, FDS_VERSION, hasToken, getToken, tokenIdToCssVar,
  defaultTheme, emitTheme, emitBaseTypography,
  resolveStyleTokens, checkThemeContrast,
} from 'flexa-design-system';

tokenIdToCssVar('color.on-primary');   // '--fx-color-on-primary'
hasToken('space.4');                   // true

// Emit a complete theme stylesheet (light + dark + prefers-* blocks):
const css = emitTheme(defaultTheme());

// Rewrite bare token ids inside a style spec into var() strings
// (this is how Flexa keeps its CSS compiler token-agnostic):
resolveStyleTokens({ '.btn': { background: 'color.primary' } }, hasToken);
// → { '.btn': { background: 'var(--fx-color-primary)' } }

// Gate a custom theme against the WCAG pairs:
checkThemeContrast(myTheme); // [] means every pair passes AA
```

WordPress bridge (`emitWpTheme`, `wpThemeJson`) aliases FDS semantic vars onto
`--wp--preset--*` so FDS sits on top of `theme.json` instead of fighting it.

## Design token source (DTCG)

The single source of truth is a
[W3C Design Tokens (DTCG)](https://www.designtokens.org/) document. Consume it
with your own pipeline (Style Dictionary etc.):

```ts
import tokens from 'flexa-design-system/fds.tokens.json';
```

Every TS constant, CSS artifact, and the PHP mirror inside Flexa Builder is
generated from this file — outputs never drift from the source.

## Versioning

The package version **is** the token-contract version (`FDS_VERSION`, semver):
adding tokens is a minor bump; renaming or removing a semantic token is a major
bump. Anything built against FDS `2.x` keeps working on every `2.x` host.

## License

MIT
