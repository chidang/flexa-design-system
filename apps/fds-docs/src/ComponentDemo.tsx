'use client';
/**
 * Demo grid for one component — every showcase variant rendered from the spec.
 *
 * A **client island**: a ShowcaseSpec holds non-serializable values (the
 * `component` itself, plus handler props like `onClick`/`onDismiss` in some
 * variants), so it cannot cross the server→client boundary. The server page
 * therefore passes only the `slug` (a string); this island re-resolves the spec
 * from the same `flexa-ui` registry and renders entirely client-side. Interactive
 * components hydrate here; overlays render closed during static prerender (their
 * portal is mounted-guarded) and open on interaction in the browser.
 */
import { createElement } from 'react';
import { findComponent } from 'flexa-ui-kit';

export function ComponentDemo({ slug }: { slug: string }) {
  const spec = findComponent(slug);
  if (!spec) return null;
  return (
    <div className="cx-grid">
      {spec.variants.map((v, i) => (
        <div className="cx-cell" key={v.label || i}>
          <div className="cx-instance">
            {createElement(spec.component, { ...v.props }, v.children)}
          </div>
          <span className="cx-cell-label">{v.label}</span>
          {v.note ? <span className="cx-cell-note">{v.note}</span> : null}
        </div>
      ))}
    </div>
  );
}
