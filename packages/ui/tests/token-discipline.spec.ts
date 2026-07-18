/**
 * Gate: component CSS is token-only. Rejects hex/rgb/hsl colour literals and any
 * off-ladder px value (allowlist = canonical fixed dimensions, doc 04 / 02).
 *
 * Also the known-var gate (R1, ui-kit doc 14): every `var(--fx-…)` a stylesheet
 * references must exist — either emitted by `emitTheme(defaultTheme())` or set
 * by the component itself (its own CSS, or a sibling TSX via inline style). A
 * dangling reference is invalid-at-computed-value-time, so the property silently
 * inherits — the bug class that shipped ~175 dead typography declarations.
 */
import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defaultTheme, emitTheme } from 'flexa-design-system';
import { ALLOWED_PX, COLOR_LITERAL_RE, PX_RE } from '../src/tokens-allowlist';

const SRC = join(dirname(fileURLToPath(import.meta.url)), '..', 'src');

function cssFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...cssFiles(full));
    // styles.css is a pure @import aggregator — nothing to lint there.
    else if (entry.endsWith('.css') && entry !== 'styles.css') out.push(full);
  }
  return out;
}

/** Strip /* *​/ comments so banner/comment text never trips the literal checks. */
function stripComments(css: string): string {
  return css.replace(/\/\*[\s\S]*?\*\//g, '');
}

const FILES = cssFiles(SRC);

/** Every custom property the default theme emits (all schemes + modes). */
const EMITTED = new Set(
  [...emitTheme(defaultTheme()).matchAll(/(--fx-[a-z0-9-]+)\s*:/g)].map((m) => m[1]!),
);

/** `--fx-*` props a component defines itself: its CSS + sibling TSX inline styles. */
function localDefs(file: string): Set<string> {
  const defs = new Set<string>();
  const css = stripComments(readFileSync(file, 'utf8'));
  for (const m of css.matchAll(/(--fx-[a-zA-Z0-9-]+)\s*:/g)) defs.add(m[1]!);
  const dir = dirname(file);
  for (const entry of readdirSync(dir)) {
    if (!entry.endsWith('.tsx')) continue;
    const tsx = readFileSync(join(dir, entry), 'utf8');
    for (const m of tsx.matchAll(/['"](--fx-[a-zA-Z0-9-]+)['"]\s*:/g)) defs.add(m[1]!);
  }
  return defs;
}

describe('token-discipline', () => {
  it('finds component CSS to lint', () => {
    expect(FILES.length).toBeGreaterThan(0);
  });

  it.each(FILES)('%s uses no colour literals', (file) => {
    const css = stripComments(readFileSync(file, 'utf8'));
    const match = COLOR_LITERAL_RE.exec(css);
    expect(match, match ? `off-system colour literal "${match[0]}"` : '').toBeNull();
  });

  it.each(FILES)('%s uses only allowlisted px values', (file) => {
    const css = stripComments(readFileSync(file, 'utf8'));
    const bad: string[] = [];
    for (const m of css.matchAll(PX_RE)) {
      const n = Number(m[1]);
      if (!ALLOWED_PX.includes(n)) bad.push(`${m[0]}`);
    }
    expect(bad, bad.length ? `off-ladder px: ${bad.join(', ')}` : '').toEqual([]);
  });

  it('theme emission is non-trivial (gate sanity)', () => {
    expect(EMITTED.size).toBeGreaterThan(100);
  });

  // R2 (ui-kit doc 14): components bind the SEMANTIC tier only — type roles via
  // --fx-text-<name>-{size,weight,line-height}, weights via --fx-font-weight-*,
  // line heights via --fx-line-height-*. The ref ramp is FDS-internal (doc 01).
  it.each(FILES)('%s never binds the ref tier', (file) => {
    const css = stripComments(readFileSync(file, 'utf8'));
    const match = /var\(\s*--fx-ref-[a-z0-9-]+/.exec(css);
    expect(match, match ? `ref-tier binding "${match[0]}"` : '').toBeNull();
  });

  it.each(FILES)('%s uses font-weight tokens, not numeric literals', (file) => {
    const css = stripComments(readFileSync(file, 'utf8'));
    const match = /font-weight:\s*\d/.exec(css);
    expect(match, match ? `literal font-weight "${match[0]}"` : '').toBeNull();
  });

  // R6 (ui-kit doc 14): motion is token-bound — one-shot transitions use
  // --fx-motion-duration-{fast,normal,slow} + an easing token; continuous loops
  // bind --fx-motion-duration-loop (calc() off it is fine) and keep their own
  // reduced-motion `animation: none` gate, since the loop token is not zeroed.
  it.each(FILES)('%s uses motion duration tokens, not ms literals', (file) => {
    const css = stripComments(readFileSync(file, 'utf8'));
    const match = /\b\d+(?:\.\d+)?ms\b/.exec(css);
    expect(match, match ? `literal duration "${match[0]}"` : '').toBeNull();
  });

  it.each(FILES)('%s references only --fx vars that exist', (file) => {
    const css = stripComments(readFileSync(file, 'utf8'));
    const local = localDefs(file);
    const bad: string[] = [];
    for (const m of css.matchAll(/var\(\s*(--fx-[a-zA-Z0-9-]+)/g)) {
      const v = m[1]!;
      if (!EMITTED.has(v) && !local.has(v)) bad.push(v);
    }
    expect(bad, bad.length ? `dangling var(): ${[...new Set(bad)].join(', ')}` : '').toEqual([]);
  });
});
