/**
 * Drift-lock: src/tokens.generated.ts MUST equal src/fds.tokens.json.
 *
 * fds.tokens.json is the DTCG source of truth; tokens.generated.ts inlines it so
 * the package imports its tokens as a plain JS module (no runtime JSON import —
 * so the emitted ESM works in raw Node, every bundler, and the browser without a
 * `with { type: 'json' }` attribute). If the JSON is edited without regenerating
 * (`pnpm --filter flexa-design-system gen`), this fails.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { rawTokens } from '../src/tokens.generated.js';

const SRC = join(__dirname, '..', 'src');

describe('tokens.generated drift-lock', () => {
  it('inlined rawTokens deep-equals fds.tokens.json', () => {
    const fromJson = JSON.parse(readFileSync(join(SRC, 'fds.tokens.json'), 'utf8'));
    expect(rawTokens).toEqual(fromJson);
  });
});
