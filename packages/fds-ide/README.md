# flexa-fds-ide

[![npm](https://img.shields.io/npm/v/flexa-fds-ide.svg)](https://www.npmjs.com/package/flexa-fds-ide)
[![downloads](https://img.shields.io/npm/dm/flexa-fds-ide.svg)](https://www.npmjs.com/package/flexa-fds-ide)
[![license](https://img.shields.io/npm/l/flexa-fds-ide.svg)](LICENSE)

Editor/IDE support core for the [Flexa Design System](../fds) tokens — the pure
functions an editor extension (or your terminal) calls to write token-first
values with confidence: **completions** for a partial token id, **diagnostics**
that flag an _off-system_ token, and **hover facts** for a known token.

Resolved literals come from [`flexa-fds-export`](../fds-export), so what an
editor shows (`space.4 → 1rem`, `color.primary → #2563eb`) matches what the
frozen CSS emitter renders. Nothing here talks to a specific editor API — that
thin, non-testable shell lives outside the monorepo and calls these.

## CLI

```bash
fds-ide complete color.pri   # id  type  value, best matches first
fds-ide describe space.4     # resolved facts for one token
fds-ide check color.primry   # off-system diagnostic (exit 1 when flagged)
```

```
$ fds-ide check color.primry
error: Unknown token "color.primry" in reserved namespace "color". Did you mean "color.primary"?
```

## API

```ts
import { completeToken, describeToken, diagnoseToken } from 'flexa-fds-ide';

completeToken('color.pri');   // [{ id:'color.primary', type:'color', value:'#2563eb', rank:0, … }, …]
describeToken('space.4');     // { id, cssVar:'--fx-space-4', type:'dimension', tier:'semantic', value:'1rem' }
diagnoseToken('color.primry');// { severity:'error', message:'…', suggestions:['color.primary', …] }
diagnoseToken('color.primary')// null  — a real token is fine
diagnoseToken('1rem');        // null  — a plain literal, not ours to judge
```

`completeToken` ranks whole-id prefixes first, then per-segment prefixes, then
substring hits (ties break by id) — so both `color.pri` and a bare `primary`
surface `color.primary`.

## Off-system diagnostic

A value in a token-first control is either a **real token**, a **plain literal**
(`#fff`, `1rem`, a third-party `myplugin.brand`), or a **mistake**: an id whose
first segment is a reserved token namespace (`color`, `space`, `ref`, …) that
resolves to nothing. `diagnoseToken` flags exactly the third case — the same rule
the AI validate gate enforces — and offers the nearest real ids as repairs
(same-namespace, ranked by edit distance).

## Why a separate package

Per the FDS distribution rules, tooling stays **out** of the zero-dependency
`flexa-design-system` package. This consumes the registry and lives beside it —
installing it never adds weight to FDS itself.

## Trust

`ide.spec.ts` locks the behaviour: every completion/hover `value` equals the
resolved literal from `flexa-fds-export` (which itself dogfoods against the
frozen CSS emitter), no unresolved `{alias}` or `var()` ever surfaces, and the
off-system diagnostic passes real tokens + plain literals while flagging bogus
reserved-namespace ids.

## Deferred

The VS Code **extension host** (activation, completion/diagnostic/hover
providers wired to the editor API) is a thin shell that can't be unit-tested in
the monorepo — it belongs outside, calling this core. Only the pure lookups live
here, where they are gate-covered.
