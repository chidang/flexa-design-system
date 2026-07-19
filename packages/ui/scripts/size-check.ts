/**
 * Bundle-discipline gate for flexa-ui-kit (doc 16, track P-F).
 *
 * Bundles two minimal consumers of the BUILT dist (the exact files the
 * `publishConfig` exports map ships to npm) with esbuild and asserts:
 *
 *  1. Tree-shaking works: a consumer importing ONLY FxButton must not drag in
 *     unrelated components (string probes for distinctive `.fx-*` class names
 *     that only those components emit) and must stay tiny.
 *  2. Size budgets hold: minified single-component and full-kit bundles stay
 *     under thresholds chosen from measured sizes + headroom.
 *
 * Budgets (minified, peer deps `react`/`react-dom` external, real deps
 * `flexa-design-system` + `lucide-react` bundled — i.e. what a consumer
 * actually pays for the kit):
 *
 *   - single (FxButton only): measured 0.6 kB min (2026-07-19) → budget 8 kB.
 *     Generous headroom, but still an order of magnitude below any
 *     "tree-shaking broke and the barrel came along" failure mode (the full
 *     kit is ~646 kB, and even a handful of leaked components blows past 8 kB).
 *   - full (`export *` of the barrel, 133 components + lucide icons):
 *     measured 646.3 kB min / 172.6 kB gzip (2026-07-19) → budget 780 kB
 *     (~20% headroom for organic component growth; raise the number
 *     deliberately when the catalog grows, don't chase it).
 *
 * Run from the package: `pnpm --filter flexa-ui-kit run size`
 * (requires a prior `pnpm build` — the script bundles `dist/`).
 */
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';
import { build } from 'esbuild';

const SINGLE_BUDGET_BYTES = 8 * 1024;
const FULL_BUDGET_BYTES = 780 * 1024;

/**
 * Distinctive strings from components UNRELATED to FxButton. Each is a class
 * name only that component renders — if any shows up in the single-component
 * bundle, the barrel stopped tree-shaking (e.g. `sideEffects` regressed or a
 * module gained a top-level side effect).
 */
const UNRELATED_PROBES = [
  'fx-chat-composer', // FxChat
  'fx-command-palette-backdrop', // FxCommandPalette
  'fx-table-caption', // FxTable
  'fx-accordion', // FxAccordion
  'fx-avatar', // FxAvatar
];

const scriptsDir = dirname(fileURLToPath(import.meta.url));
const pkgDir = join(scriptsDir, '..');
const distIndex = join(pkgDir, 'dist', 'index.js');

interface BundleResult {
  bytes: number;
  gzipBytes: number;
  text: string;
}

async function bundle(entry: string): Promise<BundleResult> {
  const result = await build({
    stdin: { contents: entry, resolveDir: scriptsDir, loader: 'ts' },
    bundle: true,
    minify: true,
    format: 'esm',
    platform: 'browser',
    write: false,
    logLevel: 'silent',
    // Peer deps a consumer always provides; everything else (the kit,
    // flexa-design-system, lucide-react) is bundled and counted.
    external: ['react', 'react-dom', 'react/jsx-runtime'],
  });
  const text = result.outputFiles[0].text;
  const bytes = Buffer.byteLength(text);
  return { bytes, gzipBytes: gzipSync(Buffer.from(text)).length, text };
}

const kb = (n: number): string => `${(n / 1024).toFixed(1)} kB`;

async function main(): Promise<void> {
  if (!existsSync(distIndex)) {
    console.error('size-check: dist/index.js missing — run `pnpm build` first.');
    process.exit(1);
  }

  const failures: string[] = [];

  const single = await bundle(`export { FxButton } from '../dist/index.js';`);
  console.log(
    `single (FxButton): ${kb(single.bytes)} min / ${kb(single.gzipBytes)} gzip` +
      ` (budget ${kb(SINGLE_BUDGET_BYTES)} min)`,
  );
  if (single.bytes > SINGLE_BUDGET_BYTES) {
    failures.push(
      `single-component bundle ${kb(single.bytes)} exceeds budget ${kb(SINGLE_BUDGET_BYTES)}`,
    );
  }
  for (const probe of UNRELATED_PROBES) {
    if (single.text.includes(probe)) {
      failures.push(
        `tree-shaking leak: unrelated component marker "${probe}" found in the FxButton-only bundle`,
      );
    }
  }
  if (!single.text.includes('fx-button')) {
    failures.push('sanity: "fx-button" missing from the FxButton bundle — probe setup is broken');
  }

  const full = await bundle(`export * from '../dist/index.js';`);
  console.log(
    `full kit (barrel):  ${kb(full.bytes)} min / ${kb(full.gzipBytes)} gzip` +
      ` (budget ${kb(FULL_BUDGET_BYTES)} min)`,
  );
  if (full.bytes > FULL_BUDGET_BYTES) {
    failures.push(`full-kit bundle ${kb(full.bytes)} exceeds budget ${kb(FULL_BUDGET_BYTES)}`);
  }

  if (failures.length > 0) {
    console.error('\nsize-check FAILED:');
    for (const f of failures) console.error(`  - ${f}`);
    process.exit(1);
  }
  console.log('\nsize-check OK — tree-shaking intact, budgets hold.');
}

void main();
