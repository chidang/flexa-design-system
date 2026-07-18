/**
 * The component workbench — renders EVERY component's states × variants × sizes
 * straight from `FLEXA_UI_COMPONENTS`, the same registry the fds-docs Components
 * section consumes, so the workbench and the public docs can never drift. This
 * was the whole of the kitchen sink before U11 added the reference screens; it
 * now lives at the `/` route inside the shell.
 *
 * A handful of components demo an OPEN overlay (dialog, drawer, command palette),
 * a `position: fixed` surface (fab, bottom nav, bulk-actions bar), or a full-page
 * 100vh composition (app shell, layouts, error/success pages). In a render-
 * everything grid those escape their cell and pile up at the viewport, so we gate
 * them behind a launcher: the cell shows a "Preview" button and the demo opens —
 * one at a time — in a themed full-screen surface (Esc or the bar closes it).
 */
import { createElement, useEffect, useRef, useState } from 'react';
import {
  componentsByCategory,
  showcaseCellKind,
  showcaseGridCols,
  showcaseLaunch,
  type ShowcaseSpec,
} from 'flexa-ui-kit';
import type { Scheme } from '../ThemeBar';

type Variant = ShowcaseSpec['variants'][number];

// Placement hints (launcher / wide / readable / fixed columns) come from the
// shared showcase-layout source in flexa-ui-kit, so the docs Components grid
// classifies identically.
function gridClass(slug: string) {
  const cols = showcaseGridCols(slug);
  return cols ? `ks-grid ks-grid-${cols}` : 'ks-grid';
}

function cellClass(slug: string) {
  const kind = showcaseCellKind(slug);
  return kind === 'default' ? 'ks-cell' : `ks-cell ks-cell-${kind}`;
}

interface Preview {
  spec: ShowcaseSpec;
  variant: Variant;
}

function instance(spec: ShowcaseSpec, variant: Variant) {
  return createElement(spec.component, { ...variant.props }, variant.children);
}

function VariantCell({
  spec,
  variant,
  onLaunch,
}: {
  spec: ShowcaseSpec;
  variant: Variant;
  onLaunch: (p: Preview) => void;
}) {
  const launch = showcaseLaunch(spec.slug);
  return (
    <div className={cellClass(spec.slug)}>
      <div className="ks-stage">
        {launch ? (
          <button type="button" className="ks-launch" onClick={() => onLaunch({ spec, variant })}>
            ▶ Preview
          </button>
        ) : (
          instance(spec, variant)
        )}
      </div>
      <span className="ks-cell-label">{variant.label}</span>
      {variant.note ? <span className="ks-cell-note">{variant.note}</span> : null}
    </div>
  );
}

function ComponentSection({ spec, onLaunch }: { spec: ShowcaseSpec; onLaunch: (p: Preview) => void }) {
  return (
    <section className="ks-component" id={spec.slug}>
      <header className="ks-component-head">
        <h2>{spec.name}</h2>
        <span className="ks-slice">{spec.slice}</span>
        {spec.status === 'stub' ? <span className="ks-stub">stub</span> : null}
      </header>
      {spec.tagline ? <p className="ks-tagline">{spec.tagline}</p> : null}
      <div className={gridClass(spec.slug)}>
        {spec.variants.map((v) => (
          <VariantCell key={v.label} spec={spec} variant={v} onLaunch={onLaunch} />
        ))}
      </div>
    </section>
  );
}

export function ComponentsView({ scheme }: { scheme: Scheme }) {
  const groups = componentsByCategory();
  const [preview, setPreview] = useState<Preview | null>(null);
  const [active, setActive] = useState('');
  const navRef = useRef<HTMLElement>(null);

  const slugs = groups.flatMap((g) => g.items).map((c) => c.slug);
  const slugKey = slugs.join(',');

  // Scrollspy — the active section is the last one whose top has crossed the
  // reading line. A scroll listener beats IntersectionObserver here: sections
  // can be taller than the viewport, so "which top last crossed the line" is
  // the only signal that never goes silent mid-section.
  useEffect(() => {
    let raf = 0;
    const measure = () => {
      raf = 0;
      // Reading line sits just below the sticky theme bar + section scroll-margin.
      const line = 90;
      let current = slugs[0] ?? '';
      for (const slug of slugs) {
        const el = document.getElementById(slug);
        if (!el) continue;
        if (el.getBoundingClientRect().top <= line) current = slug;
        else break;
      }
      // Pinned to the bottom: the last section is the one on screen even if
      // it's too short for its top to ever reach the line.
      const doc = document.documentElement;
      if (window.innerHeight + window.scrollY >= doc.scrollHeight - 2) {
        current = slugs[slugs.length - 1] ?? current;
      }
      setActive(current);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(measure);
    };
    measure();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      cancelAnimationFrame(raf);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slugKey]);

  // The nav scrolls independently — keep the active link in view as the page
  // scrolls past sections. Adjust nav.scrollTop directly: scrollIntoView also
  // scrolls the WINDOW, which cancels an in-flight smooth scroll from a nav click.
  useEffect(() => {
    const nav = navRef.current;
    if (!active || !nav) return;
    const link = nav.querySelector(`[data-slug="${CSS.escape(active)}"]`);
    if (!(link instanceof HTMLElement)) return;
    const top = link.offsetTop;
    const bottom = top + link.offsetHeight;
    if (top < nav.scrollTop) nav.scrollTop = top;
    else if (bottom > nav.scrollTop + nav.clientHeight) nav.scrollTop = bottom - nav.clientHeight;
  }, [active]);

  // Esc closes an open preview. (Body-level theming for portaled overlays is
  // handled app-wide in App.tsx, so the preview surface needs no theme juggling.)
  useEffect(() => {
    if (!preview) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setPreview(null);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [preview]);

  return (
    <div className="ks-body">
      <nav className="ks-nav" aria-label="Components" ref={navRef}>
        {groups.map((g) => (
          <div key={g.category.id} className="ks-nav-group">
            <span className="ks-nav-title">{g.category.title}</span>
            {g.items.map((c) => (
              // Scroll to the section directly — under the HashRouter an
              // `href="#slug"` would be read as a route, not an in-page anchor.
              <button
                key={c.slug}
                type="button"
                className="ks-nav-link"
                data-slug={c.slug}
                aria-current={active === c.slug ? 'true' : undefined}
                onClick={() =>
                  document.getElementById(c.slug)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                }
              >
                {c.name}
              </button>
            ))}
          </div>
        ))}
      </nav>
      <main className="ks-main" data-fx-theme="kitchen" data-fx-scheme={scheme}>
        {groups
          .flatMap((g) => g.items)
          .map((spec) => (
            <ComponentSection key={spec.slug} spec={spec} onLaunch={setPreview} />
          ))}
      </main>

      {preview ? (
        <div
          className="ks-preview"
          data-fx-theme="kitchen"
          data-fx-scheme={scheme}
          role="dialog"
          aria-label={`${preview.spec.name} preview`}
        >
          <div className="ks-preview-bar">
            <span className="ks-preview-title">
              {preview.spec.name} · {preview.variant.label}
            </span>
            <button type="button" className="ks-preview-close" onClick={() => setPreview(null)}>
              ✕ Close preview
            </button>
          </div>
          <div className="ks-preview-stage">{instance(preview.spec, preview.variant)}</div>
        </div>
      ) : null}
    </div>
  );
}
