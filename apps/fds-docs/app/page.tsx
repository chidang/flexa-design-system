import Link from 'next/link';
import { FDS_TOKENS, FDS_VERSION } from 'flexa-design-system';
import { loadGuides, loadSite } from '../src/content';

export default function HomePage() {
  const site = loadSite();
  const guides = loadGuides();
  return (
    <>
      <section className="hero">
        <h1>{site.tagline}</h1>
        <p>{site.description}</p>
        <div className="hero-actions">
          <Link className="btn btn-primary" href="/guides/getting-started/">
            Get started
          </Link>
          <Link className="btn btn-ghost" href="/tokens/">
            Browse {FDS_TOKENS.length} tokens
          </Link>
        </div>
      </section>

      <pre>
        <code>{`npm install ${site.packageName}   # v${FDS_VERSION}\n\n<link rel="stylesheet" href="https://unpkg.com/${site.packageName}/dist/theme.css">`}</code>
      </pre>

      <section>
        <h2>Not Tailwind, not shadcn</h2>
        <p>
          No utility classes, no component source to copy. FDS is the layer underneath: a strict
          token vocabulary (<code>--fx-*</code>), pure functions that derive complete themes from a
          brand, and validation gates that make generated design safe. Its closest relatives are
          Radix Colors + Open Props + Style Dictionary — in one dependency-free package.{' '}
          <Link href="/why/">Why FDS, and when to use it →</Link>
        </p>
      </section>

      <section>
        <h2>Guides</h2>
        <div className="card-grid">
          <Link className="card" href="/why/">
            <h3>Why FDS</h3>
            <p>
              The mission in one page — what FDS is for, the problem it solves, how it differs from
              Tailwind and friends, and when to reach for it.
            </p>
          </Link>
          {guides.map((g) => (
            <Link key={g.slug} className="card" href={`/guides/${g.slug}/`}>
              <h3>{g.title}</h3>
              <p>{g.description}</p>
            </Link>
          ))}
          <Link className="card" href="/example/">
            <h3>Example dashboard</h3>
            <p>
              A working analytics dashboard styled entirely from FDS tokens — its stylesheet
              scanned at build time so every value is proven on-system, none off.
            </p>
          </Link>
          <Link className="card" href="/showcase/">
            <h3>Showcase</h3>
            <p>
              Pricing, a landing hero and a sign-in — the marketing and app screens people judge a
              design system by, each built from tokens alone and scanned on-system.
            </p>
          </Link>
          <Link className="card" href="/recipes/">
            <h3>Recipes</h3>
            <p>
              Button, badge, alert and card as copy-paste CSS — generated from token recipes by the
              same engine the renderer runs, so the snippet is exactly what the system emits.
            </p>
          </Link>
          <Link className="card" href="/accessibility/">
            <h3>Accessibility</h3>
            <p>
              Four standards, gated not advised — WCAG 2 text and non-text, APCA, and a
              colour-vision axis — measured live from the default theme by the same engine CI runs.
            </p>
          </Link>
          <Link className="card" href="/packs/">
            <h3>Starter packs</h3>
            <p>
              Sixteen brand personalities on one core system — each a full theme derived live from
              a tiny brand, previewed in place.
            </p>
          </Link>
          <Link className="card" href="/playground/">
            <h3>Playground</h3>
            <p>
              Pick a brand color, fonts and a radius feel — watch a complete, contrast-checked
              theme derive live in your browser.
            </p>
          </Link>
        </div>
      </section>
    </>
  );
}
