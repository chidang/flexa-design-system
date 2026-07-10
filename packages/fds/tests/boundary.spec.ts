/**
 * Lint ranh giới FDS (doc 19): `flexa-design-system` là package chia sẻ được — data
 * (DTCG source) + pure functions, ZERO runtime dependency, zero platform API.
 * Chặt hơn cả core boundary: không được có `dependencies` NÀO (kể cả core —
 * chiều phụ thuộc là core → fds, không bao giờ ngược lại).
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { FDS_VERSION } from '../src/index.js';

const FDS_DIR = join(__dirname, '..');
const FORBIDDEN_IMPORTS = /from\s+['"](react|react-dom|next|vue|zod|@wordpress\/|@flexa\/|node:)/;

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    return statSync(p).isDirectory() ? walk(p) : p.endsWith('.ts') ? [p] : [];
  });
}

describe('fds boundary (standalone, zero dependency)', () => {
  it('package.json has no runtime dependencies at all', () => {
    const pkg = JSON.parse(readFileSync(join(FDS_DIR, 'package.json'), 'utf8'));
    expect(Object.keys(pkg.dependencies ?? {})).toEqual([]);
  });

  // The published npm version IS the FDS_VERSION contract (doc 19 QĐ-19.5): the
  // semver consumers pin must equal the constant every banner/pack-compat check
  // reads. They drifted once (2.7.0 package.json vs 2.8.0 constant) — lock it.
  it('package.json version equals FDS_VERSION', () => {
    const pkg = JSON.parse(readFileSync(join(FDS_DIR, 'package.json'), 'utf8'));
    expect(pkg.version).toBe(FDS_VERSION);
  });

  it('src imports no platform API, no zod, no other @flexa package', () => {
    for (const file of walk(join(FDS_DIR, 'src'))) {
      const content = readFileSync(file, 'utf8');
      expect(FORBIDDEN_IMPORTS.test(content), `import lạ trong ${file}`).toBe(false);
    }
  });
});
