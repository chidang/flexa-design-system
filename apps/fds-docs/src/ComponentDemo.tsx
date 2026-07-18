'use client';
/**
 * Demo grid for one component — every showcase variant rendered from the spec.
 *
 * A **client island**: a ShowcaseSpec holds non-serializable values (the
 * `component` itself, plus handler props like `onClick`/`onDismiss` in some
 * variants), so it cannot cross the server→client boundary. The server page
 * therefore passes only the `slug` (a string); this island re-resolves the spec
 * from the same `flexa-ui-kit` registry and renders entirely client-side.
 *
 * Placement comes from the shared showcase-layout source in `flexa-ui-kit`
 * (same classification as the kitchen-sink workbench): components whose demo
 * escapes a grid cell (open overlays, `position: fixed` surfaces, 100vh page
 * compositions) open behind a "Preview" launcher in a full-screen surface; wide
 * surfaces take the full row; content cards get a readable row. The launcher
 * overlay renders INSIDE the themed stage subtree, so it resolves the live
 * `[data-fx-theme="components"]` variables (fixed positioning doesn't change
 * DOM ancestry).
 */
import { createElement, useEffect, useState } from 'react';
import {
  findComponent,
  showcaseCellKind,
  showcaseGridCols,
  showcaseLaunch,
  type ShowcaseSpec,
} from 'flexa-ui-kit';

type Variant = ShowcaseSpec['variants'][number];

function instance(spec: ShowcaseSpec, variant: Variant) {
  return createElement(spec.component, { ...variant.props }, variant.children);
}

export function ComponentDemo({ slug }: { slug: string }) {
  const spec = findComponent(slug);
  const [preview, setPreview] = useState<Variant | null>(null);

  // Esc closes an open preview.
  useEffect(() => {
    if (!preview) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setPreview(null);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [preview]);

  if (!spec) return null;

  const launch = showcaseLaunch(spec.slug);
  const kind = showcaseCellKind(spec.slug);
  const cols = showcaseGridCols(spec.slug);
  const gridClass = cols ? `cx-grid cx-grid-${cols}` : 'cx-grid';
  const cellClass = kind === 'default' ? 'cx-cell' : `cx-cell cx-cell-${kind}`;

  return (
    <div className={gridClass}>
      {spec.variants.map((v, i) => (
        <div className={cellClass} key={v.label || i}>
          <div className="cx-instance">
            {launch ? (
              <button type="button" className="cx-launch" onClick={() => setPreview(v)}>
                ▶ Preview
              </button>
            ) : (
              instance(spec, v)
            )}
          </div>
          <span className="cx-cell-label">{v.label}</span>
          {v.note ? <span className="cx-cell-note">{v.note}</span> : null}
        </div>
      ))}

      {preview ? (
        <div className="cx-preview" role="dialog" aria-label={`${spec.name} preview`}>
          <div className="cx-preview-bar">
            <span className="cx-preview-title">
              {spec.name} · {preview.label}
            </span>
            <button type="button" className="cx-preview-close" onClick={() => setPreview(null)}>
              ✕ Close preview
            </button>
          </div>
          <div className="cx-preview-stage">{instance(spec, preview)}</div>
        </div>
      ) : null}
    </div>
  );
}
