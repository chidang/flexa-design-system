# flexa-fds-figma

[![npm](https://img.shields.io/npm/v/flexa-fds-figma.svg)](https://www.npmjs.com/package/flexa-fds-figma)
[![downloads](https://img.shields.io/npm/dm/flexa-fds-figma.svg)](https://www.npmjs.com/package/flexa-fds-figma)
[![license](https://img.shields.io/npm/l/flexa-fds-figma.svg)](LICENSE)

Export the [Flexa Design System](../fds) token registry to **Tokens Studio**
(the _Figma Tokens_ / Tokens Studio for Figma plugin) JSON — so designers can
import the design system into Figma and work from the same tokens as code.

Tokens Studio loads a nested JSON set of `{ value, type }` leaves, where `type`
is one of the plugin's own token-type names (`color`, `spacing`,
`borderRadius`, `boxShadow`, `typography`, …). This package produces exactly
that shape from the FDS registry, with every `{alias}` already **resolved to a
concrete literal** (via [`flexa-fds-export`](../fds-export)) so the set imports
without relying on the plugin's own reference resolver.

## CLI

```bash
fds-figma                 # Tokens Studio set → stdout
fds-figma -o tokens.json  # write the file to load into the plugin
```

In Figma: open **Tokens Studio → Tokens → Load → From file** and pick the
generated JSON.

## API

```ts
import { toTokensStudio, tokensStudioType } from 'flexa-fds-figma';

toTokensStudio().color.primary;   // { value: '#4f46e5', type: 'color' }
toTokensStudio().space['4'];      // { value: '1rem',   type: 'spacing' }
```

## Type mapping

DTCG `color` / `fontFamily` / `fontWeight` / `shadow` / `typography` map to their
Tokens Studio equivalents directly. DTCG `dimension` and `number` carry no
unit-of-meaning, so their Tokens Studio type is inferred from the token's id
group — the same grouping the CSS layer uses:

| FDS group | Tokens Studio type |
| --- | --- |
| `space.*` | `spacing` |
| `radius.*` | `borderRadius` |
| `border.*`, `ref.border-width` | `borderWidth` |
| `ref.font-size.*` | `fontSizes` |
| `size.*`, `bp.*` | `sizing` |
| `ref.line-height.*` | `lineHeights` |
| `opacity.*` | `opacity` |

Motion (`cubicBezier`, `duration`) and bare numbers (`z.*`) have no Tokens Studio
primitive, so they import as `other` — still editable in-plugin.

## Why a separate package

Per the FDS distribution rules, tooling stays **out** of the zero-dependency
`flexa-design-system` package. This consumes the registry and lives beside it —
installing it never adds weight to FDS itself.

## Trust

`figma.spec.ts` asserts one leaf per registry token, that every `value` equals
the resolved literal from `flexa-fds-export` (which itself dogfoods against the
frozen CSS emitter), and that no unresolved `{alias}` or `var()` survives.

## Deferred

v1 emits **resolved literals** for maximum import robustness. Preserving the FDS
alias graph as editable Tokens Studio references (`{ref.brand.600}`, so a
designer edits the primitive and semantics follow) is a future enhancement.
