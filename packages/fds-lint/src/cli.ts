#!/usr/bin/env node
// Thin fs/argv shell over the pure linter in ./index.ts.
//
// Usage:  fds-lint <path…> [--json] [--ext=.css,.ts]
// Exit 1 when any off-system --fx-* reference is found, else 0.

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { extname, join } from 'node:path';
import { FDS_VERSION, lintFiles, type LintReport } from './index.js';

const DEFAULT_EXTS = ['.css', '.scss', '.sass', '.less', '.ts', '.tsx', '.js', '.jsx', '.html', '.vue', '.svelte'];
const SKIP_DIRS = new Set(['node_modules', '.git', 'dist', 'out', '.next', 'build', 'coverage']);

interface Options {
  paths: string[];
  json: boolean;
  exts: string[];
}

function parseArgs(argv: string[]): Options | 'help' {
  const paths: string[] = [];
  let json = false;
  let exts = DEFAULT_EXTS;
  for (const arg of argv) {
    if (arg === '--help' || arg === '-h') return 'help';
    else if (arg === '--json') json = true;
    else if (arg.startsWith('--ext=')) {
      exts = arg
        .slice('--ext='.length)
        .split(',')
        .map((e) => (e.startsWith('.') ? e : `.${e}`))
        .filter(Boolean);
    } else if (arg.startsWith('-')) {
      process.stderr.write(`fds-lint: unknown option ${arg}\n`);
      process.exit(2);
    } else {
      paths.push(arg);
    }
  }
  return { paths, json, exts };
}

function collectFiles(root: string, exts: string[], out: string[]): void {
  let st: ReturnType<typeof statSync>;
  try {
    st = statSync(root);
  } catch {
    process.stderr.write(`fds-lint: cannot read ${root}\n`);
    return;
  }
  if (st.isDirectory()) {
    for (const name of readdirSync(root).sort()) {
      if (SKIP_DIRS.has(name)) continue;
      collectFiles(join(root, name), exts, out);
    }
  } else if (exts.includes(extname(root))) {
    out.push(root);
  }
}

function printHelp(): void {
  process.stdout.write(
    [
      `fds-lint · flexa-design-system v${FDS_VERSION}`,
      '',
      'Scan a codebase for off-system --fx-* token references.',
      '',
      'Usage:  fds-lint <path…> [--json] [--ext=.css,.ts]',
      '',
      '  <path…>      files or directories to scan (directories recurse)',
      '  --json       machine-readable report on stdout',
      `  --ext=…      comma list of extensions (default: ${DEFAULT_EXTS.join(',')})`,
      '  --help, -h   this help',
      '',
      'Exit code 1 when any --fx-* reference is not a registry token.',
      '',
    ].join('\n'),
  );
}

function printHuman(report: LintReport): void {
  const out = process.stdout;
  out.write(`fds-lint · flexa-design-system v${FDS_VERSION}\n\n`);
  for (const f of report.files) {
    if (f.offSystem.length === 0) {
      out.write(`  ✓ ${f.file}  — ${f.onSystem.length} token(s), all on-system\n`);
    } else {
      out.write(`  ✗ ${f.file}  — ${f.offSystem.length} off-system\n`);
      for (const o of f.offSystem) {
        const hint = o.suggestion ? `  (did you mean ${o.suggestion}?)` : '';
        out.write(`      ${o.ref}${hint}\n`);
      }
    }
  }
  out.write('\n');
  if (report.clean) {
    out.write(
      `  ✓ ${report.filesScanned} file(s), 0 off-system — every --fx-* reference is a registry token\n`,
    );
  } else {
    out.write(
      `  ✗ ${report.filesScanned} file(s), ${report.filesWithFindings} with findings, ${report.offSystemCount} off-system reference(s)\n`,
    );
  }
}

const parsed = parseArgs(process.argv.slice(2));
if (parsed === 'help' || parsed.paths.length === 0) {
  printHelp();
  process.exit(parsed === 'help' ? 0 : 2);
}

const targets: string[] = [];
for (const p of parsed.paths) collectFiles(p, parsed.exts, targets);

if (targets.length === 0) {
  process.stderr.write('fds-lint: no matching files\n');
  process.exit(0);
}

const report = lintFiles(
  targets.map((file) => ({ file, text: readFileSync(file, 'utf8') })),
);

if (parsed.json) {
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
} else {
  printHuman(report);
}

process.exit(report.clean ? 0 : 1);
