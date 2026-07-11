import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { emitBaseTypography } from 'flexa-design-system';
import { loadShowcase } from '../../../src/content';
import { usedTokens } from '../../../src/example';
import { SHOWCASE_SCREENS } from '../../../src/showcase';

export const dynamic = 'error';

export function generateStaticParams(): { slug: string }[] {
  return loadShowcase().items.map((it) => ({ slug: it.slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const doc = loadShowcase();
  const meta = doc.items.find((it) => it.slug === params.slug);
  return meta
    ? { title: `${meta.title} · ${doc.title}`, description: meta.blurb }
    : { title: doc.title };
}

export default function ShowcaseScreenPage({ params }: { params: { slug: string } }) {
  const doc = loadShowcase();
  const meta = doc.items.find((it) => it.slug === params.slug);
  const screen = SHOWCASE_SCREENS[params.slug];
  if (!meta || !screen) notFound();

  const { used, unknown } = usedTokens(screen.css);
  const clean = unknown.length === 0;

  return (
    <>
      <section>
        <p>
          <Link href="/showcase/">← Showcase</Link>
        </p>
        <h1>{meta.title}</h1>
        <p>{meta.blurb}</p>
        <p
          className={clean ? 'pass' : undefined}
          style={clean ? undefined : { color: 'var(--fx-color-danger)' }}
        >
          {clean
            ? `Every colour, space, radius and shadow below is an FDS token — ${used.length} distinct, 0 off-system.`
            : `Off-system tokens found: ${unknown.join(', ')}`}
        </p>
      </section>

      <style dangerouslySetInnerHTML={{ __html: emitBaseTypography() }} />
      <style dangerouslySetInnerHTML={{ __html: screen.css }} />

      {screen.render()}

      <section>
        <h2>{doc.proofTitle}</h2>
        <p>{doc.proofBlurb}</p>
        <h3>{doc.tokenListTitle}</h3>
        <p>
          {used.map((v) => (
            <code className="token-id" key={v}>
              {v}
            </code>
          ))}
        </p>
      </section>
    </>
  );
}
