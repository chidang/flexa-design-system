#!/usr/bin/env node
// Thin fs/argv shell over the pure exporter in ./index.ts.
//
// Usage:  fds-export [--format=style-dictionary|flat|json] [-o out.json]
// Writes to stdout by default; exit 1 on a bad option or write failure.

import { writeFileSync } from 'node:fs';
import { FDS_VERSION, renderExport, type ExportFormat } from './index.js';

const FORMATS: ReadonlySet<ExportFormat> = new Set(['style-dictionary', 'flat', 'json']);

interface Options {
  format: ExportFormat;
  out?: string;
}

function parseArgs(argv: string[]): Options | 'help' {
  let format: ExportFormat = 'style-dictionary';
  let out: string | undefined;
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]!;
    if (arg === '--help' || arg === '-h') return 'help';
    else if (arg.startsWith('--format=')) {
      const f = arg.slice('--format='.length);
      if (!FORMATS.has(f as ExportFormat)) {
        process.stderr.write(`fds-export: unknown format ${f}\n`);
        process.exit(2);
      }
      format = f as ExportFormat;
    } else if (arg === '-o' || arg === '--out') {
      out = argv[++i];
      if (!out) {
        process.stderr.write('fds-export: -o needs a file path\n');
        process.exit(2);
      }
    } else if (arg.startsWith('--out=')) {
      out = arg.slice('--out='.length);
    } else {
      process.stderr.write(`fds-export: unknown option ${arg}\n`);
      process.exit(2);
    }
  }
  return { format, out };
}

function help(): void {
  process.stdout.write(
    `fds-export · flexa-design-system v${FDS_VERSION}\n\n` +
      'Export the FDS token registry with every alias resolved to a literal.\n\n' +
      'Usage:\n' +
      '  fds-export [--format=<fmt>] [-o out.json]\n\n' +
      'Formats:\n' +
      '  style-dictionary  nested DTCG source tree (default) — feed to Style Dictionary v4\n' +
      '  flat              { "--fx-*": "<literal>" } map — for Tailwind/CSS-in-JS/JSON\n' +
      '  json              resolved-token array [{ id, cssVar, type, value }]\n',
  );
}

function main(): void {
  const opts = parseArgs(process.argv.slice(2));
  if (opts === 'help') return help();
  const text = renderExport(opts.format);
  if (opts.out) {
    try {
      writeFileSync(opts.out, text);
    } catch (err) {
      process.stderr.write(`fds-export: cannot write ${opts.out}: ${(err as Error).message}\n`);
      process.exit(1);
    }
  } else {
    process.stdout.write(text);
  }
}

main();
