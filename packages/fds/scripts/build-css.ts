/**
 * Emit the distributable CSS artifacts to dist/ (FDS-2, doc 19) — the CDN /
 * copy-paste consumption path for sites that do NOT run Flexa Builder:
 *
 *   - dist/theme.css           — `emitTheme(defaultTheme())`: base `:root` vars +
 *     `:root[data-fx-scheme="dark"]` overrides + `prefers-color-scheme` auto block
 *     + `prefers-reduced-motion` block. Linking this file gives a page the whole
 *     FDS variable surface (`--fx-*`).
 *   - dist/base-typography.css — `emitBaseTypography()`: constant element rules
 *     (h1–h6/body/small) driven entirely by those vars, scoped under
 *     `[data-fx-type="flexa/root"]` (add that attribute to your content wrapper).
 *
 * Bytes come from the same canonical, parity-locked emitters every Flexa runtime
 * uses — the published CSS can never drift from the package's JS API. The
 * artifacts drift-lock spec (tests/artifacts.spec.ts) enforces exactly that.
 */

import { mkdirSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { FDS_VERSION, defaultTheme, emitBaseTypography, emitTheme } from '../src/index.js';

const dist = join(dirname(fileURLToPath(import.meta.url)), '..', 'dist');
mkdirSync(dist, { recursive: true });

const banner = (file: string): string =>
  `/*! Flexa Design System v${FDS_VERSION} — ${file} | MIT | https://github.com/chidang/flexa-builder */\n`;

const theme = banner('theme.css') + emitTheme(defaultTheme()) + '\n';
writeFileSync(join(dist, 'theme.css'), theme);
console.log(`theme.css: ${theme.length} bytes`);

const typography = banner('base-typography.css') + emitBaseTypography() + '\n';
writeFileSync(join(dist, 'base-typography.css'), typography);
console.log(`base-typography.css: ${typography.length} bytes`);
