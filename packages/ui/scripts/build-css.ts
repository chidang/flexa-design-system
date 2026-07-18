/**
 * Emit the distributable CSS artifact `dist/styles.css` — the concatenation of
 * every component's token-only stylesheet, in the same order as `src/styles.css`.
 * The CDN / copy-paste path for consumers who don't bundle from source.
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { UI_VERSION } from '../src/index.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(root, 'dist');
mkdirSync(dist, { recursive: true });

// Derive the file list (and order) from src/styles.css itself — the single
// source of truth for which component stylesheets ship. Adding a component's
// @import there automatically flows into the distributable artifact.
const aggregator = readFileSync(join(root, 'src/styles.css'), 'utf8');
const files = [...aggregator.matchAll(/@import\s+'(\.\/[^']+)'/g)].map((m) => join('src', m[1]));
const banner = `/*! flexa-ui-kit v${UI_VERSION} — styles.css | MIT | https://github.com/chidang/flexa-builder */\n`;
const css = banner + files.map((f) => readFileSync(join(root, f), 'utf8')).join('\n') + '\n';

writeFileSync(join(dist, 'styles.css'), css);
console.log(`styles.css: ${css.length} bytes`);
