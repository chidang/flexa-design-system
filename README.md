# Flexa Design System

[![CI](https://github.com/chidang/flexa-design-system/actions/workflows/ci.yml/badge.svg)](https://github.com/chidang/flexa-design-system/actions/workflows/ci.yml)
[![npm](https://img.shields.io/npm/v/flexa-design-system.svg)](https://www.npmjs.com/package/flexa-design-system)
[![license](https://img.shields.io/npm/l/flexa-design-system.svg)](LICENSE)

A zero-runtime, WCAG-gated design token system: a DTCG token source, a 3-tier
token contract (ref → semantic → component), a theme model with light/dark/
high-contrast modes, a contrast gate, and a pure `token → var()` CSS pipeline.
Pure data + pure functions, **no dependencies**.

## Packages

| Package | npm | What |
|---|---|---|
| [`flexa-design-system`](packages/fds) | [![npm](https://img.shields.io/npm/v/flexa-design-system.svg)](https://www.npmjs.com/package/flexa-design-system) | The design system core — tokens, theme model, contrast gate, CSS emitter. |
| [`flexa-fds-export`](packages/fds-export) | [![npm](https://img.shields.io/npm/v/flexa-fds-export.svg)](https://www.npmjs.com/package/flexa-fds-export) | Resolve the registry to Style Dictionary / flat / JSON for any build pipeline. |
| [`flexa-fds-figma`](packages/fds-figma) | [![npm](https://img.shields.io/npm/v/flexa-fds-figma.svg)](https://www.npmjs.com/package/flexa-fds-figma) | Export the registry to Tokens Studio (Figma Tokens) JSON. |
| [`flexa-fds-lint`](packages/fds-lint) | [![npm](https://img.shields.io/npm/v/flexa-fds-lint.svg)](https://www.npmjs.com/package/flexa-fds-lint) | Scan a codebase's `--fx-*` references for off-system tokens. |
| [`flexa-fds-ide`](packages/fds-ide) | [![npm](https://img.shields.io/npm/v/flexa-fds-ide.svg)](https://www.npmjs.com/package/flexa-fds-ide) | Editor completions, off-system diagnostics, hover facts + a lookup CLI. |

## Develop

```bash
pnpm install
pnpm build       # emit dist/ for every package (fds drift-lock tests need it)
pnpm typecheck
pnpm test
```

## Publish

Each package publishes independently. `publishConfig` swaps dev (TS source) exports
to built `dist/` at publish time, so build first:

```bash
pnpm build
pnpm --filter flexa-design-system publish
pnpm --filter flexa-fds-export publish
pnpm --filter flexa-fds-figma publish
pnpm --filter flexa-fds-lint publish
pnpm --filter flexa-fds-ide publish
```

## License

MIT
