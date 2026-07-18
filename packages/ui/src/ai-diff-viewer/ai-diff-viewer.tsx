/**
 * FxAiDiffViewer — reviewable before/after diff for AI edits (doc 04 §3.10
 * "FxAiDiffViewer — AI Diff Viewer").
 *
 * Computes a small, pure, deterministic LCS diff (line-split, or word-split on
 * whitespace) and renders add / del rows with +/− gutters. Additions and
 * deletions carry a visually-hidden "added"/"removed" prefix so the signal is
 * never colour/strike alone (ai.md doctrine — reviewable + honest). Footer totals
 * "+N −M" live in one `role="status"` line; the no-changes case is stated plainly.
 * `unified` (single flow) is the default; `split` shows Current | Suggested panes.
 * Pure presentational (no hooks) → renders as an RSC. Every string is a prop.
 */
import { FxIcon } from '../icon/FxIcon';

/** Baked-in strings — every one a prop (§i18n). */
export interface AiDiffViewerLabels {
  current: string;
  suggested: string;
  added: string;
  removed: string;
  noChanges: string;
  unified: string;
  split: string;
  summary: string;
}

export const DEFAULT_AI_DIFF_VIEWER_LABELS: AiDiffViewerLabels = {
  current: 'Current',
  suggested: 'Suggested',
  added: 'added',
  removed: 'removed',
  noChanges: 'AI suggests no changes',
  unified: 'Unified',
  split: 'Split',
  summary: 'Changes',
};

export interface FxAiDiffViewerProps {
  before: string;
  after: string;
  /** Layout. Defaults to `unified`. */
  mode?: 'unified' | 'split';
  /** Diff granularity. Defaults to `word`. */
  granularity?: 'line' | 'word';
  /** Human summary of the change. */
  summary?: string;
  /** Field / file label shown in the header. */
  fieldLabel?: string;
  /** Render per-hunk accept/reject controls. Defaults to `false`. */
  perHunkActions?: boolean;
  /** Fires an accept/reject decision for a hunk. */
  onHunkDecision?: (hunkId: string, decision: 'accept' | 'reject') => void;
  /** i18n overrides, merged over English defaults. */
  labels?: Partial<AiDiffViewerLabels>;
  className?: string;
}

/** One diff segment: kept, added, or removed. */
interface DiffPart {
  type: 'equal' | 'add' | 'del';
  value: string;
}

/** Split source into diff tokens, keeping the separators so we can re-join. */
function tokenize(src: string, granularity: 'line' | 'word'): string[] {
  if (src === '') return [];
  if (granularity === 'line') return src.split('\n');
  // Word granularity: split on whitespace but keep the whitespace runs so joins
  // are lossless and stable.
  return src.split(/(\s+)/).filter((t) => t !== '');
}

/** Pure LCS diff over token arrays → an ordered list of parts. */
function diffTokens(a: string[], b: string[]): DiffPart[] {
  const n = a.length;
  const m = b.length;
  // LCS length table.
  const lcs: number[][] = Array.from({ length: n + 1 }, () => new Array<number>(m + 1).fill(0));
  for (let i = n - 1; i >= 0; i -= 1) {
    for (let j = m - 1; j >= 0; j -= 1) {
      const row = lcs[i]!;
      const next = lcs[i + 1]!;
      row[j] = a[i] === b[j] ? next[j + 1]! + 1 : Math.max(next[j]!, row[j + 1]!);
    }
  }
  const parts: DiffPart[] = [];
  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (a[i] === b[j]) {
      parts.push({ type: 'equal', value: a[i]! });
      i += 1;
      j += 1;
    } else if (lcs[i + 1]![j]! >= lcs[i]![j + 1]!) {
      parts.push({ type: 'del', value: a[i]! });
      i += 1;
    } else {
      parts.push({ type: 'add', value: b[j]! });
      j += 1;
    }
  }
  while (i < n) {
    parts.push({ type: 'del', value: a[i]! });
    i += 1;
  }
  while (j < m) {
    parts.push({ type: 'add', value: b[j]! });
    j += 1;
  }
  return parts;
}

export function FxAiDiffViewer({
  before,
  after,
  mode = 'unified',
  granularity = 'word',
  summary,
  fieldLabel,
  perHunkActions = false,
  onHunkDecision,
  labels,
  className,
}: FxAiDiffViewerProps) {
  const l = { ...DEFAULT_AI_DIFF_VIEWER_LABELS, ...labels };
  const parts = diffTokens(tokenize(before, granularity), tokenize(after, granularity));
  const adds = parts.filter((p) => p.type === 'add').length;
  const dels = parts.filter((p) => p.type === 'del').length;
  const noChanges = adds === 0 && dels === 0;

  const rootClass = ['fx-ai-diff-viewer', className].filter(Boolean).join(' ');
  const totals = `+${adds} −${dels}`;

  return (
    <div className={rootClass} data-mode={mode} data-granularity={granularity}>
      {(summary || fieldLabel) && (
        <div className="fx-ai-diff-viewer-header">
          {fieldLabel && <span className="fx-ai-diff-viewer-field">{fieldLabel}</span>}
          {summary && <span className="fx-ai-diff-viewer-summary">{summary}</span>}
          {perHunkActions && !noChanges && onHunkDecision && (
            <span className="fx-ai-diff-viewer-hunk-actions">
              <button
                type="button"
                className="fx-ai-diff-viewer-hunk-btn"
                data-decision="accept"
                onClick={() => onHunkDecision('h1', 'accept')}
              >
                <FxIcon name="check" size={16} />
                <span className="fx-ai-diff-viewer-hunk-label">{l.suggested}</span>
              </button>
              <button
                type="button"
                className="fx-ai-diff-viewer-hunk-btn"
                data-decision="reject"
                onClick={() => onHunkDecision('h1', 'reject')}
              >
                <FxIcon name="close" size={16} />
                <span className="fx-ai-diff-viewer-hunk-label">{l.current}</span>
              </button>
            </span>
          )}
        </div>
      )}

      {noChanges ? (
        <p className="fx-ai-diff-viewer-empty" role="status">
          {l.noChanges}
        </p>
      ) : mode === 'split' ? (
        <div className="fx-ai-diff-viewer-panes">
          <div className="fx-ai-diff-viewer-pane" data-side="before">
            <span className="fx-ai-diff-viewer-pane-head">{l.current}</span>
            <pre className="fx-ai-diff-viewer-code">
              {parts
                .filter((p) => p.type !== 'add')
                .map((p, idx) =>
                  p.type === 'del' ? (
                    <span className="fx-ai-diff-viewer-del" key={idx}>
                      <span className="fx-ai-diff-viewer-sr">{l.removed}: </span>
                      {p.value}
                    </span>
                  ) : (
                    <span key={idx}>{p.value}</span>
                  ),
                )}
            </pre>
          </div>
          <div className="fx-ai-diff-viewer-pane" data-side="after">
            <span className="fx-ai-diff-viewer-pane-head">{l.suggested}</span>
            <pre className="fx-ai-diff-viewer-code">
              {parts
                .filter((p) => p.type !== 'del')
                .map((p, idx) =>
                  p.type === 'add' ? (
                    <span className="fx-ai-diff-viewer-add" key={idx}>
                      <span className="fx-ai-diff-viewer-sr">{l.added}: </span>
                      {p.value}
                    </span>
                  ) : (
                    <span key={idx}>{p.value}</span>
                  ),
                )}
            </pre>
          </div>
        </div>
      ) : (
        <pre className="fx-ai-diff-viewer-code" data-flow="unified">
          {parts.map((p, idx) => {
            if (p.type === 'add') {
              return (
                <span className="fx-ai-diff-viewer-add" key={idx}>
                  <span className="fx-ai-diff-viewer-gutter" aria-hidden="true">
                    +
                  </span>
                  <span className="fx-ai-diff-viewer-sr">{l.added}: </span>
                  {p.value}
                </span>
              );
            }
            if (p.type === 'del') {
              return (
                <span className="fx-ai-diff-viewer-del" key={idx}>
                  <span className="fx-ai-diff-viewer-gutter" aria-hidden="true">
                    {'−'}
                  </span>
                  <span className="fx-ai-diff-viewer-sr">{l.removed}: </span>
                  {p.value}
                </span>
              );
            }
            return <span key={idx}>{p.value}</span>;
          })}
        </pre>
      )}

      {!noChanges && (
        <p className="fx-ai-diff-viewer-totals" role="status">
          {totals}
        </p>
      )}
    </div>
  );
}
