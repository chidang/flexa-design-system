import type { Metadata } from 'next';
import Link from 'next/link';
import { emitBaseTypography } from 'flexa-design-system';
import { loadShowcase } from '../../src/content';
import { SHOWCASE_SCREENS } from '../../src/showcase';

export function generateMetadata(): Metadata {
  const doc = loadShowcase();
  return { title: doc.title, description: doc.description };
}

/* Gallery chrome — a bordered frame around each live preview. Site chrome, so
   it uses tokens like the rest of the docs shell (not part of a proven screen). */
const GALLERY_CSS = `
.sw-gallery { display: flex; flex-direction: column; gap: var(--fx-space-12); }
.sw-item { display: flex; flex-direction: column; gap: var(--fx-space-3); }
.sw-item > h2 { margin: 0; }
.sw-item > p { margin: 0; color: var(--fx-color-text-muted); }
.sw-frame {
  overflow: hidden;
  background: var(--fx-color-bg);
  border: 1px solid var(--fx-color-border);
  border-radius: var(--fx-radius-lg);
  padding: var(--fx-space-6);
}
.sw-teaser {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--fx-space-4);
  background: var(--fx-color-surface-alt);
  font-weight: 600;
}
`;

export default function ShowcaseIndexPage() {
  const doc = loadShowcase();
  return (
    <>
      <section>
        <h1>{doc.title}</h1>
        <p>{doc.intro}</p>
      </section>

      <style dangerouslySetInnerHTML={{ __html: emitBaseTypography() }} />
      <style dangerouslySetInnerHTML={{ __html: GALLERY_CSS }} />
      {doc.items.map((it) => {
        const screen = SHOWCASE_SCREENS[it.slug];
        return screen ? (
          <style key={it.slug} dangerouslySetInnerHTML={{ __html: screen.css }} />
        ) : null;
      })}

      <div className="sw-gallery">
        {doc.items.map((it) => {
          const screen = SHOWCASE_SCREENS[it.slug];
          if (!screen) return null;
          return (
            <section className="sw-item" key={it.slug}>
              <h2>
                <Link href={`/showcase/${it.slug}/`}>{it.title}</Link>
              </h2>
              <p>{it.blurb}</p>
              {screen.full ? (
                <div className="sw-frame sw-teaser">
                  <span>🎨 Full, live, recolourable landing page</span>
                  <Link href={`/showcase/${it.slug}/`}>Open the live page →</Link>
                </div>
              ) : (
                <>
                  <div className="sw-frame">{screen.render()}</div>
                  <p>
                    <Link href={`/showcase/${it.slug}/`}>
                      View {it.title.toLowerCase()} screen →
                    </Link>
                  </p>
                </>
              )}
            </section>
          );
        })}
      </div>

      <section>
        <h2>More</h2>
        <p>
          The <Link href="/example/">Example dashboard</Link> is the first screen of this set — a
          working analytics view built the same way. Or open the{' '}
          <Link href="/playground/">Playground</Link> to reskin every screen live by changing the
          brand.
        </p>
      </section>
    </>
  );
}
