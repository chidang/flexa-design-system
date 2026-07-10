/**
 * Generate `src/tokens.generated.ts` from the DTCG source of truth
 * `src/fds.tokens.json`.
 *
 * Why this exists: the package must load its tokens WITHOUT a runtime JSON
 * import. A bare `import x from './fds.tokens.json'` in the emitted ESM needs a
 * `with { type: 'json' }` import attribute on Node 20/22 — which not every
 * consumer toolchain supports, and where it does work Node 20 still prints an
 * ExperimentalWarning. Inlining the tokens as a plain TS object makes
 * `dist/index.js` import a normal JS module instead: it just works in raw Node
 * ESM, every bundler, and the browser, with zero attributes and zero warnings.
 *
 * `fds.tokens.json` stays the single source of truth (and the public
 * `flexa-design-system/fds.tokens.json` subpath export); this file is a build
 * artifact kept byte-in-sync by `tests/tokens-generated.spec.ts` (drift-lock).
 *
 * Run via `pnpm --filter flexa-design-system gen` (also runs as the first step
 * of `build`).
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const srcDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'src');
const raw = readFileSync(join(srcDir, 'fds.tokens.json'), 'utf8');

// Parse to validate it is well-formed JSON, then re-serialise deterministically.
const tokens: unknown = JSON.parse(raw);

const header =
  '// AUTO-GENERATED from fds.tokens.json — do not edit by hand.\n' +
  '// Regenerate with `pnpm --filter flexa-design-system gen` (runs in `build`).\n' +
  '//\n' +
  '// fds.tokens.json is the DTCG source of truth; this inlines it so the package\n' +
  '// imports its tokens as a plain JS module (no runtime JSON import / import\n' +
  '// attribute — works in raw Node ESM, bundlers, and the browser). Kept in sync\n' +
  '// by tests/tokens-generated.spec.ts.\n\n';

const body = `export const rawTokens: Record<string, unknown> = ${JSON.stringify(tokens, null, 2)};\n`;

writeFileSync(join(srcDir, 'tokens.generated.ts'), header + body);
// eslint-disable-next-line no-console
console.log('src/tokens.generated.ts written from fds.tokens.json');
