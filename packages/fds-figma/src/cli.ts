#!/usr/bin/env node
// Thin fs/argv shell over the pure exporter in ./index.ts.
//
// Usage:  fds-figma [-o tokens.json]
// Writes the Tokens Studio set to stdout by default; exit 1 on a write failure.

import { writeFileSync } from 'node:fs';
import { FDS_VERSION, renderTokensStudio } from './index.js';

interface Options {
  out?: string;
}

function parseArgs(argv: string[]): Options | 'help' {
  let out: string | undefined;
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]!;
    if (arg === '--help' || arg === '-h') return 'help';
    else if (arg === '-o' || arg === '--out') {
      out = argv[++i];
      if (!out) {
        process.stderr.write('fds-figma: -o needs a file path\n');
        process.exit(2);
      }
    } else if (arg.startsWith('--out=')) {
      out = arg.slice('--out='.length);
    } else {
      process.stderr.write(`fds-figma: unknown option ${arg}\n`);
      process.exit(2);
    }
  }
  return { out };
}

function help(): void {
  process.stdout.write(
    `fds-figma · flexa-design-system v${FDS_VERSION}\n\n` +
      'Export the FDS token registry to Tokens Studio (Figma Tokens) JSON.\n' +
      'Every alias is resolved to a literal, so the set imports without the\n' +
      "plugin's own reference resolver.\n\n" +
      'Usage:\n' +
      '  fds-figma [-o tokens.json]\n\n' +
      'Load the output via the Tokens Studio plugin: Tokens → Load → From file.\n',
  );
}

function main(): void {
  const opts = parseArgs(process.argv.slice(2));
  if (opts === 'help') return help();
  const text = renderTokensStudio();
  if (opts.out) {
    try {
      writeFileSync(opts.out, text);
    } catch (err) {
      process.stderr.write(`fds-figma: cannot write ${opts.out}: ${(err as Error).message}\n`);
      process.exit(1);
    }
  } else {
    process.stdout.write(text);
  }
}

main();
