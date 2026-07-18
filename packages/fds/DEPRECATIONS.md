# Token deprecation policy

Flexa Design System token ids are a public contract (`FDS_VERSION`). This is the
policy for retiring one — the human half of what
[`src/deprecations.ts`](src/deprecations.ts) enforces by machine.

## The promise (INV-6)

> Renaming or removing a token is a **major** change with a migration path — never
> a silent edit.

Adding a token is a minor bump and breaks nobody. Changing what a token means, or
taking one away, can break every consumer that named it. So it is gated.

## The one-major window

When a token is renamed (say `color.brand` → `color.primary`):

1. **Add** the new token in a **minor** release.
2. **Keep the old id aliased.** `color.brand` stays in `fds.tokens.json` as
   `{ "$value": "{color.primary}" }` for the rest of the current major. Existing
   `var(--fx-color-brand)` keeps resolving — nobody breaks on upgrade.
3. **Record it** in `DEPRECATIONS`:
   ```ts
   { id: 'color.brand', replacement: 'color.primary', since: '2.9.0', removeIn: '3.0.0' }
   ```
4. **Remove** the alias only in the `removeIn` **major**, alongside a migration note.

So a rename costs a consumer nothing at the moment it happens, and a whole major
cycle to act before the alias disappears.

## What the registry guarantees

`assertDeprecationsValid` runs at package load, so a dishonest entry can never
ship:

- the **replacement** must be a real token (never migrate anyone toward a phantom);
- the **deprecated id** must still be a live token (its alias must exist for the
  window — a missing id belongs in the changelog's removals, not here);
- `removeIn` must be a **strictly later major** than `since` (the window is real);
- no id is deprecated twice.

The list is **empty today** — the design system has only ever added tokens.

## Migrating consumers

The registry hands the migration to tooling — no hand-written map:

```bash
# the exact { oldId: replacement } map every deprecated token implies
node -e "process.stdout.write(JSON.stringify(require('flexa-design-system').deprecatedRenameMap()))" > renames.json

# rewrite every reference (dry-run first)
fds-codemod ./src --map renames.json
fds-codemod ./src --map renames.json --write
```

`deprecatedRenameMap()` is precisely the shape [`flexa-fds-codemod`](../fds-codemod)
consumes, and `flexa-fds-changelog` reads `removalsInMajor()` to write a major's
migration note. Deprecate once, in one place; the tools do the rest.
