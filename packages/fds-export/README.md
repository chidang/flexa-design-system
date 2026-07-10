# flexa-fds-export

Export the [Flexa Design System](../fds) token registry with every alias
**resolved to a concrete literal** — ready for Style Dictionary, Tailwind, native
mobile themes, or any JSON-driven build pipeline.

The `flexa-design-system` package gives you tokens two ways, and neither is what
an external build wants:

- the **raw registry** (`FDS_TOKENS`), whose semantic values are still `{alias}`
  references (`color.primary` → `{ref.brand.600}`), and
- **CSS** (`emitTheme`), where those aliases stay `var(--fx-*)` so themes can
  re-point them at runtime.

This package resolves the alias chain and hands you flat, concrete values. It
reads the token set from `flexa-design-system` at runtime — it can never disagree
with the package about what a token is worth.

## CLI

```bash
fds-export                         # Style Dictionary DTCG tree (default) → stdout
fds-export --format=flat           # { "--fx-*": "<literal>" } map
fds-export --format=json           # [{ id, cssVar, type, value }]
fds-export --format=flat -o tokens.json
```

`style-dictionary` output is a DTCG source tree you can point Style Dictionary v4
straight at, with the FDS aliases already resolved — so its platform transforms
(SCSS, iOS, Android, JS) run without needing FDS's own resolver.

## API

The core is pure and importable:

```ts
import { toFlatTokens, toStyleDictionary, resolvedTokens } from 'flexa-fds-export';

toFlatTokens()['--fx-color-primary'];   // '#4f46e5'  (alias chain followed)
toStyleDictionary().color.primary;      // { $value: '#4f46e5', $type: 'color' }
```

Typography composites have no single CSS value, so they are omitted from the flat
map (matching the FDS emitter) and kept as a resolved field map in the DTCG tree.

## Why a separate package

Per the FDS distribution rules, tooling stays **out** of the zero-dependency
`flexa-design-system` package. This package consumes the registry and lives
beside it — installing it never adds weight to FDS itself.

## Trust

An `export.spec.ts` dogfood test follows the `var()` chain of the FDS emitter's
own output (`emitThemeRoot(FDS_TOKENS)`) and asserts every flat value agrees — so
this exporter can never silently drift from the canonical CSS.
