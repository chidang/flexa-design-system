import type { Metadata } from 'next';
import Link from 'next/link';
import { groupedComponents, taglineFor } from '../../src/components';

export const metadata: Metadata = {
  title: 'Components',
  description: 'The flexa-ui component kit — accessible, token-only React components built on FDS.',
};

export default function ComponentsIndex() {
  const groups = groupedComponents();
  return (
    <>
      <section>
        <h1>Components</h1>
        <p>
          <strong>flexa-ui</strong> — accessible React components built on the Flexa Design System.
          Token-only CSS, one component per file, WCAG-gated. Every demo below is generated from the
          component&apos;s showcase spec; the deep contract lives in the markdown bible and is linked.
        </p>
      </section>

      <div className="cx-index-groups">
        {groups.map(({ category, items }) => (
          <section key={category.id}>
            <h2 className="cx-cat-title">{category.title}</h2>
            <p className="cx-cat-blurb">{category.blurb}</p>
            <div className="cx-cards">
              {items.map((spec) => (
                <Link key={spec.slug} href={`/components/${spec.slug}/`} className="cx-card">
                  <h3>{spec.name}</h3>
                  <p>{taglineFor(spec)}</p>
                  <div className="cx-card-meta">
                    {spec.slice}
                    {spec.status === 'stub' ? ' · stub' : ''}
                  </div>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>
    </>
  );
}
