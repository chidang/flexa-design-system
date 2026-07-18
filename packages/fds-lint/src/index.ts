// Off-system token linter — the pure core.
//
// This is the `usedTokens()` idea from the docs `/example` page turned into a
// tool consumers can run on THEIR codebase: scan text for `--fx-*` references
// and partition them against the FDS registry. Anything not a registry token is
// "off-system" — the exact drift the design system exists to prevent.
//
// The valid set is read from `flexa-design-system` (never hardcoded), so this
// linter can never disagree with the package about what a real token is.

import { FDS_TOKENS, FDS_VERSION } from 'flexa-design-system';

export { FDS_VERSION };

/**
 * Every CSS custom property the FDS registry owns, e.g. `--fx-color-primary`.
 * Typography composites are emitted per-property (FDS 2.10), so their KNOWN vars
 * are the `-size/-weight/-line-height` longhands — the bare composite name is
 * never defined and referencing it is exactly the drift this linter catches.
 */
export const FX_VARS: ReadonlySet<string> = new Set(
  FDS_TOKENS.flatMap((t) =>
    t.type === 'typography'
      ? [`${t.cssVar}-size`, `${t.cssVar}-weight`, `${t.cssVar}-line-height`]
      : [t.cssVar],
  ),
);

/**
 * Matches an FDS custom-property reference: `--fx-` + kebab segments. Deliberately
 * broad — it catches BOTH definitions (`--fx-x: …`) and uses (`var(--fx-x)`), because
 * an off-system name is a mistake wherever it appears.
 */
export const FX_VAR_RE = /--fx-[a-z0-9-]+/g;

export interface OffSystem {
  /** The offending `--fx-*` reference. */
  readonly ref: string;
  /** Closest real token, when one is near enough to be a plausible typo fix. */
  readonly suggestion?: string;
}

export interface FileReport {
  readonly file: string;
  /** Distinct `--fx-*` references found, sorted. */
  readonly refs: readonly string[];
  /** References that ARE registry tokens. */
  readonly onSystem: readonly string[];
  /** References that are NOT — the linter's findings. */
  readonly offSystem: readonly OffSystem[];
}

export interface LintReport {
  readonly files: readonly FileReport[];
  readonly filesScanned: number;
  readonly filesWithFindings: number;
  readonly offSystemCount: number;
  /** True when nothing off-system was found across all files. */
  readonly clean: boolean;
}

/** True when `ref` is a real FDS token custom property. */
export function isKnownVar(ref: string): boolean {
  return FX_VARS.has(ref);
}

/** Distinct `--fx-*` references in `text`, sorted for deterministic output. */
export function extractFxRefs(text: string): string[] {
  const found = new Set(text.match(FX_VAR_RE) ?? []);
  return [...found].sort();
}

/** Classic Levenshtein distance — small, pure, no deps. */
function editDistance(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  let prev = Array.from({ length: n + 1 }, (_, j) => j);
  let curr = new Array<number>(n + 1);
  for (let i = 1; i <= m; i++) {
    curr[0] = i;
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(
        (prev[j] ?? 0) + 1,
        (curr[j - 1] ?? 0) + 1,
        (prev[j - 1] ?? 0) + cost,
      );
    }
    [prev, curr] = [curr, prev];
  }
  return prev[n] ?? 0;
}

/**
 * Nearest known token to `ref`, when close enough to suggest as a typo fix.
 * Threshold scales with length so short names don't over-match. Deterministic:
 * smallest distance wins, ties broken lexically.
 */
export function suggestFor(ref: string): string | undefined {
  const budget = Math.max(2, Math.floor(ref.length / 3));
  let best: string | undefined;
  let bestDist = Infinity;
  for (const known of FX_VARS) {
    const d = editDistance(ref, known);
    if (d < bestDist || (d === bestDist && best !== undefined && known < best)) {
      bestDist = d;
      best = known;
    }
  }
  return best !== undefined && bestDist <= budget ? best : undefined;
}

/** Lint one blob of text (a file's contents). Never throws. */
export function lintText(text: string, file = '<input>'): FileReport {
  const refs = extractFxRefs(text);
  const onSystem: string[] = [];
  const offSystem: OffSystem[] = [];
  for (const ref of refs) {
    if (isKnownVar(ref)) {
      onSystem.push(ref);
    } else {
      const suggestion = suggestFor(ref);
      offSystem.push(suggestion === undefined ? { ref } : { ref, suggestion });
    }
  }
  return { file, refs, onSystem, offSystem };
}

/** Aggregate lint over many named blobs. Order is preserved from `inputs`. */
export function lintFiles(inputs: ReadonlyArray<{ file: string; text: string }>): LintReport {
  const files = inputs.map(({ file, text }) => lintText(text, file));
  const filesWithFindings = files.filter((f) => f.offSystem.length > 0).length;
  const offSystemCount = files.reduce((n, f) => n + f.offSystem.length, 0);
  return {
    files,
    filesScanned: files.length,
    filesWithFindings,
    offSystemCount,
    clean: offSystemCount === 0,
  };
}
