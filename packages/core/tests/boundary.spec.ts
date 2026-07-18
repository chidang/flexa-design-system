/**
 * Lint ranh giới core (PRIME DIRECTIVE 5): @flexa/core zero platform dependency.
 * Test này là gate CI — thêm dependency/import platform vào core sẽ đỏ ở đây.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const CORE_DIR = join(__dirname, '..');
// 'flexa-design-system' is the extracted token layer (doc 19) — itself dependency-free
// and platform-free, gated by its own boundary spec in packages/fds/tests.
const ALLOWED_DEPS = new Set(['flexa-design-system', 'mustache', 'zod']);
const FORBIDDEN_IMPORTS = /from\s+['"](react|react-dom|next|vue|@wordpress\/|node:)/;

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    return statSync(p).isDirectory() ? walk(p) : p.endsWith('.ts') ? [p] : [];
  });
}

describe('core boundary (zero platform)', () => {
  it('package.json chỉ chứa dependencies trong whitelist', () => {
    const pkg = JSON.parse(readFileSync(join(CORE_DIR, 'package.json'), 'utf8'));
    for (const dep of Object.keys(pkg.dependencies ?? {})) {
      expect(ALLOWED_DEPS.has(dep), `dependency lạ trong core: ${dep}`).toBe(true);
    }
  });

  it('src không import react/next/vue/wordpress/node API', () => {
    for (const file of walk(join(CORE_DIR, 'src'))) {
      const content = readFileSync(file, 'utf8');
      expect(FORBIDDEN_IMPORTS.test(content), `import platform trong ${file}`).toBe(false);
    }
  });
});
