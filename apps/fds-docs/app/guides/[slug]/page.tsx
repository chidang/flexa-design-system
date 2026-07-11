import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Blocks } from '../../../src/blocks';
import { loadGuide, loadGuides } from '../../../src/content';

interface Params {
  slug: string;
}

export function generateStaticParams(): Params[] {
  return loadGuides().map((g) => ({ slug: g.slug }));
}

export function generateMetadata({ params }: { params: Params }): Metadata {
  const guide = loadGuide(params.slug);
  return guide ? { title: guide.title, description: guide.description } : {};
}

export default function GuidePage({ params }: { params: Params }) {
  const guide = loadGuide(params.slug);
  if (!guide) notFound();
  const guides = loadGuides();
  return (
    <div className="guide-layout">
      <nav className="guide-nav" aria-label="Guides">
        {guides.map((g) => (
          <Link
            key={g.slug}
            href={`/guides/${g.slug}/`}
            aria-current={g.slug === guide.slug ? 'page' : undefined}
          >
            {g.title}
          </Link>
        ))}
      </nav>
      <article>
        <h1>{guide.title}</h1>
        <p>{guide.description}</p>
        <Blocks blocks={guide.blocks} />
      </article>
    </div>
  );
}
