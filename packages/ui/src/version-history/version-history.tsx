'use client';
/**
 * FxVersionHistory — a document's saved revisions (doc 04 §3.8
 * "FxVersionHistory — Version History").
 *
 * A panel (or Right Drawer body) with an FxList of versions — each a version
 * label + author Avatar + time + change summary, the newest carrying a "Current"
 * Badge — plus per-item Preview / Restore actions and an optional side-by-side
 * `diff` slot. Restore always routes through an FxConfirmationDialog ("Restore
 * version {n}? Current state becomes a new version.") because it is undoable, not
 * a history rewrite — the same contract flexa-builder's own revisions UI follows.
 *
 * The confirmation dialog is a portal gated by its own SSR guard, so the static
 * a11y snapshot carries only the list. Every user-facing string is a prop.
 */
import { useState } from 'react';
import type { ReactNode } from 'react';
import type { PartyRef } from '../escrow-timeline/escrow-timeline';
import { FxList, type ListItem } from '../list/list';
import { FxAvatar } from '../avatar/avatar';
import { FxBadge } from '../badge/badge';
import { FxConfirmationDialog } from '../confirmation-dialog/confirmation-dialog';
import { FxIcon } from '../icon/FxIcon';

/** One saved revision. */
export interface Version {
  id: string;
  /** Monotonic revision number (shown as "v{number}"). */
  number: number;
  /** Optional human name for the version. */
  label?: string;
  author: PartyRef;
  /** ISO 8601 timestamp. */
  createdAt: string;
  /** Short change summary. */
  summary?: string;
}

/** Baked-in strings — every one a prop (§i18n). */
export interface VersionHistoryLabels {
  preview: string;
  restore: string;
  current: string;
  /** `{n}` → version number for the "v{n}" label. */
  versionLabel: string;
  restoreTitle: string;
  restoreDescription: string;
  restoreConfirm: string;
  cancel: string;
  empty: string;
}

export const DEFAULT_VERSION_HISTORY_LABELS: VersionHistoryLabels = {
  preview: 'Preview',
  restore: 'Restore',
  current: 'Current',
  versionLabel: 'v{n}',
  restoreTitle: 'Restore version {n}?',
  restoreDescription: 'Current state becomes a new version.',
  restoreConfirm: 'Restore',
  cancel: 'Cancel',
  empty: 'No saved versions yet.',
};

export interface FxVersionHistoryProps {
  /** Versions, newest first (as supplied). */
  versions: Version[];
  /** Which version is the current head (gets the Current Badge, no Restore). */
  currentId: string;
  /** Preview a version (host loads it read-only). */
  onPreview?: (id: string) => void;
  /** Restore a version — invoked after the confirmation dialog confirms. */
  onRestore?: (id: string) => void;
  /** Optional side-by-side diff slot rendered beside the list. */
  diff?: ReactNode;
  /** BCP-47 locale for time formatting. */
  locale?: string;
  /** Baked-in strings. Merged over the English defaults. */
  labels?: Partial<VersionHistoryLabels>;
  className?: string;
}

/** Plain relative-time label ("2h ago", "3d ago", or a date). */
function relative(iso: string, locale?: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return iso;
  const sec = Math.round((Date.now() - then) / 1000);
  const abs = Math.abs(sec);
  const rtf =
    typeof Intl !== 'undefined' && 'RelativeTimeFormat' in Intl
      ? new Intl.RelativeTimeFormat(locale, { numeric: 'auto', style: 'short' })
      : null;
  const fmt = (v: number, unit: Intl.RelativeTimeFormatUnit) => (rtf ? rtf.format(v, unit) : `${v} ${unit}`);
  const sign = sec >= 0 ? -1 : 1;
  if (abs < 60) return fmt(sign * abs, 'second');
  if (abs < 3600) return fmt(sign * Math.round(abs / 60), 'minute');
  if (abs < 86400) return fmt(sign * Math.round(abs / 3600), 'hour');
  if (abs < 604800) return fmt(sign * Math.round(abs / 86400), 'day');
  return new Date(iso).toLocaleDateString(locale, { year: 'numeric', month: 'short', day: 'numeric' });
}

function fill(template: string, n: number): string {
  return template.replace('{n}', String(n));
}

export function FxVersionHistory({
  versions,
  currentId,
  onPreview,
  onRestore,
  diff,
  locale,
  labels,
  className,
}: FxVersionHistoryProps) {
  const l = { ...DEFAULT_VERSION_HISTORY_LABELS, ...labels };
  const [pending, setPending] = useState<Version | null>(null);

  const rootClass = ['fx-version-history', className].filter(Boolean).join(' ');

  const items: ListItem[] = versions.map((v) => {
    const isCurrent = v.id === currentId;
    return {
      key: v.id,
      media: (
        <span className="fx-version-history-avatar" aria-hidden="true">
          <FxAvatar size="sm" name={v.author.name} src={v.author.avatarSrc} alt="" />
        </span>
      ),
      title: (
        <span className="fx-version-history-headline">
          <span className="fx-version-history-version">{v.label ?? fill(l.versionLabel, v.number)}</span>
          {isCurrent && (
            <FxBadge tone="success" appearance="subtle" size="sm" dot>
              {l.current}
            </FxBadge>
          )}
        </span>
      ),
      description: (
        <span className="fx-version-history-sub">
          <span className="fx-version-history-author">{v.author.name}</span>
          <span className="fx-version-history-dot" aria-hidden="true">·</span>
          <time className="fx-version-history-time" dateTime={v.createdAt}>
            {relative(v.createdAt, locale)}
          </time>
          {v.summary != null && <span className="fx-version-history-summary">{v.summary}</span>}
        </span>
      ),
      meta: (
        <span className="fx-version-history-actions">
          {onPreview && (
            <button
              type="button"
              className="fx-version-history-action"
              aria-label={`${l.preview} ${v.label ?? fill(l.versionLabel, v.number)}`}
              onClick={() => onPreview(v.id)}
            >
              <FxIcon name="eye" size={16} />
              <span className="fx-version-history-action-label">{l.preview}</span>
            </button>
          )}
          {!isCurrent && onRestore && (
            <button
              type="button"
              className="fx-version-history-action"
              aria-label={`${l.restore} ${v.label ?? fill(l.versionLabel, v.number)}`}
              onClick={() => setPending(v)}
            >
              <FxIcon name="rotate-ccw" size={16} />
              <span className="fx-version-history-action-label">{l.restore}</span>
            </button>
          )}
        </span>
      ),
    };
  });

  return (
    <div className={rootClass} data-has-diff={diff != null || undefined}>
      <div className="fx-version-history-list">
        {versions.length === 0 ? (
          <div className="fx-version-history-empty">{l.empty}</div>
        ) : (
          <FxList items={items} divided aria-label="Version history" />
        )}
      </div>

      {diff != null && <div className="fx-version-history-diff">{diff}</div>}

      <FxConfirmationDialog
        open={pending !== null}
        onOpenChange={(o) => {
          if (!o) setPending(null);
        }}
        title={pending ? fill(l.restoreTitle, pending.number) : l.restoreTitle}
        description={l.restoreDescription}
        confirmLabel={l.restoreConfirm}
        cancelLabel={l.cancel}
        onConfirm={() => {
          if (pending) onRestore?.(pending.id);
          setPending(null);
        }}
        onCancel={() => setPending(null)}
      />
    </div>
  );
}
