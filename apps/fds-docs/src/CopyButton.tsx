'use client';

/**
 * A tiny copy-to-clipboard button for the recipe CSS snippets — the one bit of
 * client JS the recipe explorer needs (a copy affordance is the whole point of
 * a "copy this CSS" page). Falls back silently where the clipboard API is
 * unavailable; the `<pre>` stays selectable regardless.
 */
import { useState } from 'react';

export function CopyButton({ text, label = 'Copy' }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  const onClick = () => {
    void navigator.clipboard?.writeText(text).then(
      () => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      },
      () => undefined,
    );
  };
  return (
    <button type="button" className="rx-copy" onClick={onClick} aria-live="polite">
      {copied ? 'Copied ✓' : label}
    </button>
  );
}
