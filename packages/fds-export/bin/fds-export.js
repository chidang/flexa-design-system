#!/usr/bin/env node
// Re-spawn with --import tsx/esm so Node can load the TypeScript source directly.
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const tsxEsm = require.resolve('tsx/esm', { paths: [__dirname] });
const src = join(__dirname, '../src/cli.ts');

const result = spawnSync(
  process.execPath,
  ['--import', tsxEsm, src, ...process.argv.slice(2)],
  { stdio: 'inherit' },
);
process.exit(result.status ?? 0);
