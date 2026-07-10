# Flexa Design System

A zero-runtime, WCAG-gated design token system: a DTCG token source, a 3-tier
token contract (ref → semantic → component), a theme model with light/dark/
high-contrast modes, a contrast gate, and a pure `token → var()` CSS pipeline.
Pure data + pure functions, **no dependencies**.

## Packages

| Package | What |
|---|---|
| [`flexa-design-system`](packages/fds) | The design system core — tokens, theme model, contrast gate, CSS emitter. |
| [`flexa-fds-export`](packages/fds-export) | Resolve the registry to Style Dictionary / flat / JSON for any build pipeline. |
| [`flexa-fds-figma`](packages/fds-figma) | Export the registry to Tokens Studio (Figma Tokens) JSON. |
| [`flexa-fds-lint`](packages/fds-lint) | Scan a codebase's `--fx-*` references for off-system tokens. |
| [`flexa-fds-ide`](packages/fds-ide) | Editor completions, off-system diagnostics, hover facts + a lookup CLI. |

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
