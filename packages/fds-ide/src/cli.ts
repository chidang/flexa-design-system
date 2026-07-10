#!/usr/bin/env node
// Thin argv shell over the pure IDE-support core in ./index.ts — a terminal
// window into the same completions/diagnostics an editor extension would use.
//
// Usage:
//   fds-ide complete [query]   list matching token ids (id  type  value)
//   fds-ide describe <id>      hover facts for one token
//   fds-ide check <id>         off-system diagnostic (exit 1 when flagged)

import {
  FDS_VERSION,
  completeToken,
  describeToken,
  diagnoseToken,
} from './index.js';

function help(): void {
  process.stdout.write(
    `fds-ide · flexa-design-system v${FDS_VERSION}\n\n` +
      'Editor-support lookups over the FDS token registry.\n\n' +
      'Usage:\n' +
      '  fds-ide complete [query]   token ids matching a partial id\n' +
      '  fds-ide describe <id>      resolved facts for one token\n' +
      '  fds-ide check <id>         flag an off-system token (exit 1)\n',
  );
}

function complete(query: string): void {
  const rows = completeToken(query);
  for (const c of rows) {
    process.stdout.write(`${c.id}\t${c.type}\t${c.value}\n`);
  }
}

function describe(id: string): void {
  const info = describeToken(id);
  if (!info) {
    process.stderr.write(`fds-ide: "${id}" is not a token\n`);
    process.exit(1);
  }
  process.stdout.write(
    `${info.id}\n` +
      `  css   ${info.cssVar}\n` +
      `  type  ${info.type}\n` +
      `  tier  ${info.tier}\n` +
      `  value ${info.value}\n` +
      (info.description ? `  desc  ${info.description}\n` : ''),
  );
}

function check(id: string): void {
  const diag = diagnoseToken(id);
  if (!diag) {
    process.stdout.write(`ok\t${id}\n`);
    return;
  }
  process.stderr.write(`${diag.severity}: ${diag.message}\n`);
  process.exit(1);
}

function main(): void {
  const [cmd, ...rest] = process.argv.slice(2);
  switch (cmd) {
    case undefined:
    case '--help':
    case '-h':
    case 'help':
      return help();
    case 'complete':
      return complete(rest[0] ?? '');
    case 'describe':
    case 'check': {
      const id = rest[0];
      if (!id) {
        process.stderr.write(`fds-ide: ${cmd} needs a token id\n`);
        process.exit(2);
      }
      return cmd === 'describe' ? describe(id) : check(id);
    }
    default:
      process.stderr.write(`fds-ide: unknown command "${cmd}"\n`);
      process.exit(2);
  }
}

main();
