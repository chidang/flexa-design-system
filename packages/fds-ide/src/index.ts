// flexa-fds-ide — editor/IDE support core for Flexa Design System tokens.
//
// Pure, deterministic functions an editor extension (or terminal CLI) calls to
// help authors write token-first values: completions for a partial token id,
// diagnostics that flag an *off-system* token (a reserved-namespace id that is
// not a real token — the same rule the AI validate gate enforces), and hover
// facts for a known token. Resolved literals come from `flexa-fds-export`, so
// what an editor shows matches what the frozen CSS emitter renders.
//
// This package deliberately holds NO editor host code (no vscode API) — that
// thin, non-gate-able shell lives outside the monorepo and calls these.

import { resolvedTokens, type ResolvedToken } from 'flexa-fds-export';
import {
  FDS_TOKENS,
  FDS_VERSION,
  hasToken,
  isTokenNamespace,
  type TokenEntry,
  type TokenType,
} from 'flexa-design-system';

export { FDS_VERSION };

const RESOLVED: ReadonlyMap<string, ResolvedToken> = new Map(
  resolvedTokens().map((t) => [t.id, t]),
);

/** Compact, display-ready resolved value (composite → one-line JSON). */
function displayValue(id: string): string {
  const r = RESOLVED.get(id);
  if (!r) return '';
  return typeof r.value === 'string' ? r.value : JSON.stringify(r.value);
}

/** Editor-facing facts about one token, ready for a completion item or hover. */
export interface TokenInfo {
  readonly id: string;
  readonly cssVar: string;
  readonly type: TokenType;
  readonly tier: TokenEntry['tier'];
  /** Resolved literal (or one-line JSON for a composite). */
  readonly value: string;
  readonly description?: string;
}

function infoOf(e: TokenEntry): TokenInfo {
  return {
    id: e.id,
    cssVar: e.cssVar,
    type: e.type,
    tier: e.tier,
    value: displayValue(e.id),
    ...(e.description ? { description: e.description } : {}),
  };
}

/** Every registry token as editor facts, in registry order. */
export function tokenInfos(): readonly TokenInfo[] {
  return FDS_TOKENS.map(infoOf);
}

/** Facts for one token id, or null when it is not a token. */
export function describeToken(id: string): TokenInfo | null {
  const e = FDS_TOKENS.find((t) => t.id === id);
  return e ? infoOf(e) : null;
}

// ---------------------------------------------------------------------------
// Completion
// ---------------------------------------------------------------------------

export interface TokenCompletion extends TokenInfo {
  /** Match strength: 0 = id starts with query, 1 = a dot-segment starts with it, 2 = id contains it. */
  readonly rank: 0 | 1 | 2;
}

function rankOf(id: string, q: string): 0 | 1 | 2 | -1 {
  if (q === '') return 0;
  if (id.startsWith(q)) return 0;
  if (id.split('.').some((s) => s.startsWith(q))) return 1;
  if (id.includes(q)) return 2;
  return -1;
}

/**
 * Complete a partial token id. Ranks whole-id prefixes first, then per-segment
 * prefixes, then substring hits; ties break by id ascending. Case-insensitive.
 * An empty query returns every token (rank 0) in id order — up to `limit`.
 */
export function completeToken(query: string, limit = 50): readonly TokenCompletion[] {
  const q = query.trim().toLowerCase();
  const out: TokenCompletion[] = [];
  for (const e of FDS_TOKENS) {
    const rank = rankOf(e.id.toLowerCase(), q);
    if (rank === -1) continue;
    out.push({ ...infoOf(e), rank });
  }
  out.sort((a, b) => a.rank - b.rank || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  return out.slice(0, limit);
}

// ---------------------------------------------------------------------------
// Suggestions (typo repair) + diagnostics
// ---------------------------------------------------------------------------

/** Levenshtein edit distance — pure, used only to rank typo repairs. */
function editDistance(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  let prev = Array.from({ length: n + 1 }, (_, j) => j);
  let curr = new Array<number>(n + 1);
  for (let i = 1; i <= m; i++) {
    curr[0] = i;
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(prev[j]! + 1, curr[j - 1]! + 1, prev[j - 1]! + cost);
    }
    [prev, curr] = [curr, prev];
  }
  return prev[n]!;
}

/**
 * Nearest real token ids to a likely-misspelled id, best first. Restricted to
 * the same reserved namespace (first dot-segment) so a `color.` typo is repaired
 * with colours, not spacing. Ranks by edit distance, then id ascending.
 */
export function suggestTokens(id: string, limit = 5): readonly string[] {
  const first = id.split('.')[0] ?? id;
  const target = id.toLowerCase();
  return FDS_TOKENS.filter((e) => e.id === first || e.id.startsWith(first + '.'))
    .map((e) => ({ id: e.id, d: editDistance(e.id.toLowerCase(), target) }))
    .sort((a, b) => a.d - b.d || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0))
    .slice(0, limit)
    .map((c) => c.id);
}

export type Severity = 'error' | 'warning';

export interface TokenDiagnostic {
  readonly severity: Severity;
  readonly message: string;
  /** Nearest real token ids, best first (may be empty). */
  readonly suggestions: readonly string[];
}

/**
 * Diagnose one token id as written in a token-first value. Returns null for a
 * real token (fine) OR a plain literal whose first segment is not a reserved
 * token namespace (a `#fff` / `1rem` / third-party value — not ours to judge).
 * Flags an off-system id: a reserved-namespace path that resolves to nothing —
 * mirroring the AI validate gate, which rejects the same ids.
 */
export function diagnoseToken(id: string): TokenDiagnostic | null {
  if (hasToken(id)) return null;
  const first = id.split('.')[0] ?? id;
  if (!isTokenNamespace(first)) return null;
  const suggestions = suggestTokens(id, 5);
  const hint = suggestions.length ? ` Did you mean "${suggestions[0]}"?` : '';
  return {
    severity: 'error',
    message: `Unknown token "${id}" in reserved namespace "${first}".${hint}`,
    suggestions,
  };
}
