# flexa-fds-lint

Off-system token linter for the [Flexa Design System](../fds). Scan any codebase
for `--fx-*` custom-property references and prove every one is a real registry
token — or find the drift.

This is the off-system gate that the FDS docs `/example` page demonstrates,
turned into a tool you can run on **your** project. The valid token set is read
from `flexa-design-system` at runtime — the linter can never disagree with the
package about what a real token is.

## CLI

```bash
fds-lint src styles            # scan files/dirs (dirs recurse)
fds-lint src --json            # machine-readable report
fds-lint src --ext=.css,.tsx   # override scanned extensions
```

Exit code is **1** when any `--fx-*` reference is not a registry token, **0**
when clean — drop it into CI to block off-system drift.

```
fds-lint · flexa-design-system v2.8.0

  ✓ src/app.css  — 12 token(s), all on-system
  ✗ src/legacy.css  — 2 off-system
      --fx-color-primry  (did you mean --fx-color-primary?)
      --fx-brand-blue

  ✗ 2 file(s), 1 with findings, 2 off-system reference(s)
```

## API

The core is pure and importable:

```ts
import { lintText, lintFiles, isKnownVar, suggestFor } from 'flexa-fds-lint';

lintText('a{color:var(--fx-color-primry)}').offSystem;
// [{ ref: '--fx-color-primry', suggestion: '--fx-color-primary' }]
```

## Why a separate package

Per the FDS distribution rules, tooling stays **out** of the `flexa-design-system`
package (which is zero-dependency). This package consumes the registry and lives
beside it — installing it never adds weight to FDS itself.
