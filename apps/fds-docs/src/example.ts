/**
 * The example dashboard's stylesheet and its build-time self-check.
 *
 * `EXAMPLE_CSS` is the SINGLE source that is both injected into `/example` and
 * scanned by `usedTokens()`. Every value carrying design intent (colour,
 * spacing, radius, shadow, font) is an `--fx-*` token — the page is the "build
 * real UI with just tokens" claim made concrete (Track F, doc 20). Typography
 * is left to FDS base type (`emitBaseTypography`), so there is no font-size to
 * hand-pick either.
 *
 * `usedTokens()` scans this CSS for `--fx-*` references and partitions them
 * against the package registry (`FDS_TOKENS`). `unknown` must stay empty: an
 * off-system token would surface on the page as a failure rather than drift
 * silently — dogfooding the off-system gate the linter/validator enforce.
 */
import { FDS_TOKENS } from 'flexa-design-system';

const VALID_CSS_VARS = new Set(FDS_TOKENS.map((t) => t.cssVar));

export const EXAMPLE_CSS = `
#fds-example {
  font-family: var(--fx-font-family-base);
  color: var(--fx-color-text);
  background: var(--fx-color-bg);
  border: 1px solid var(--fx-color-border);
  border-radius: var(--fx-radius-xl);
  box-shadow: var(--fx-shadow-sm);
  padding: var(--fx-space-6);
  display: flex;
  flex-direction: column;
  gap: var(--fx-space-6);
}
#fds-example .ex-top {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--fx-space-4);
  padding-bottom: var(--fx-space-4);
  border-bottom: 1px solid var(--fx-color-border);
}
#fds-example .ex-brand { font-family: var(--fx-font-family-heading); }
#fds-example .ex-sub { color: var(--fx-color-text-muted); margin-left: var(--fx-space-3); }
#fds-example .ex-btn {
  border: none;
  cursor: pointer;
  color: var(--fx-color-on-primary);
  background: var(--fx-color-primary);
  border-radius: var(--fx-radius-md);
  padding: var(--fx-space-2) var(--fx-space-5);
  font-family: var(--fx-font-family-base);
  box-shadow: var(--fx-shadow-sm);
}
#fds-example .ex-btn:hover { background: var(--fx-color-primary-hover); }
#fds-example .ex-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: var(--fx-space-4);
}
#fds-example .ex-stat {
  display: flex;
  flex-direction: column;
  gap: var(--fx-space-2);
  background: var(--fx-color-surface);
  border: 1px solid var(--fx-color-border);
  border-radius: var(--fx-radius-lg);
  padding: var(--fx-space-5);
}
#fds-example .ex-stat-label { color: var(--fx-color-text-muted); }
#fds-example .ex-stat-value { margin: 0; }
#fds-example .ex-delta { align-self: flex-start; }
#fds-example .ex-delta-up { color: var(--fx-color-success); }
#fds-example .ex-delta-down { color: var(--fx-color-danger); }
#fds-example .ex-panel {
  overflow: hidden;
  background: var(--fx-color-surface);
  border: 1px solid var(--fx-color-border);
  border-radius: var(--fx-radius-lg);
}
#fds-example .ex-panel-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--fx-space-4);
  padding: var(--fx-space-4) var(--fx-space-5);
  border-bottom: 1px solid var(--fx-color-border);
}
#fds-example .ex-panel-head h3 { margin: 0; }
#fds-example .ex-count {
  color: var(--fx-color-text-muted);
  background: var(--fx-color-surface-alt);
  border-radius: var(--fx-radius-full);
  padding: 0 var(--fx-space-3);
}
#fds-example .ex-table { width: 100%; border-collapse: collapse; }
#fds-example .ex-table th {
  text-align: left;
  font-weight: 600;
  color: var(--fx-color-text-subtle);
  background: var(--fx-color-surface-alt);
  padding: var(--fx-space-3) var(--fx-space-5);
}
#fds-example .ex-table td {
  padding: var(--fx-space-3) var(--fx-space-5);
  border-top: 1px solid var(--fx-color-border);
}
#fds-example .ex-muted { color: var(--fx-color-text-muted); }
#fds-example .ex-badge {
  display: inline-block;
  border-radius: var(--fx-radius-full);
  padding: 0 var(--fx-space-3);
}
#fds-example .ex-badge-success { color: var(--fx-color-on-success); background: var(--fx-color-success); }
#fds-example .ex-badge-warning { color: var(--fx-color-on-warning); background: var(--fx-color-warning); }
#fds-example .ex-badge-info { color: var(--fx-color-on-info); background: var(--fx-color-info); }
`;

export interface TokenUsage {
  /** Distinct `--fx-*` cssVars referenced that ARE registry tokens (sorted). */
  used: string[];
  /** Referenced `--fx-*` that are NOT registry tokens — must be empty (sorted). */
  unknown: string[];
}

export function usedTokens(css: string = EXAMPLE_CSS): TokenUsage {
  const refs = new Set(css.match(/--fx-[a-z0-9-]+/g) ?? []);
  const used: string[] = [];
  const unknown: string[] = [];
  for (const cssVar of refs) (VALID_CSS_VARS.has(cssVar) ? used : unknown).push(cssVar);
  return { used: used.sort(), unknown: unknown.sort() };
}
