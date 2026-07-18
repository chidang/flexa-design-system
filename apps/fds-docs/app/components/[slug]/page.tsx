import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import {
  componentSlugs,
  contractUrl,
  getComponent,
  loadProse,
  taglineFor,
} from '../../../src/components';
import { ComponentDemo } from '../../../src/ComponentDemo';
import { ComponentThemeBar } from '../../../src/ComponentThemeBar';
import {
  AriaTable,
  EnumChips,
  EventsTable,
  KeyboardTable,
  PropsTable,
} from '../../../src/componentTables';
import { Blocks } from '../../../src/blocks';

interface Params {
  slug: string;
}

export function generateStaticParams(): Params[] {
  return componentSlugs().map((slug) => ({ slug }));
}

export function generateMetadata({ params }: { params: Params }): Metadata {
  const spec = getComponent(params.slug);
  if (!spec) return {};
  return { title: spec.name, description: taglineFor(spec) };
}

export default function ComponentPage({ params }: { params: Params }) {
  const spec = getComponent(params.slug);
  if (!spec) notFound();
  const prose = loadProse(spec.slug);
  const url = contractUrl(spec);

  return (
    <>
      <section>
        <h1>{spec.name}</h1>
        <p className="cx-lead">{taglineFor(spec)}</p>
        <p className="cx-meta">
          <span>since {spec.slice}</span>
          {spec.status === 'stub' ? <span className="cx-stub-tag">stub</span> : null}
          {url ? (
            <a href={url} target="_blank" rel="noreferrer">
              full contract →
            </a>
          ) : null}
        </p>
        {prose?.whenToUse ? <p>{prose.whenToUse}</p> : null}
      </section>

      <ComponentThemeBar>
        <ComponentDemo slug={spec.slug} />
      </ComponentThemeBar>

      {prose?.blocks ? <Blocks blocks={prose.blocks} /> : null}

      <EnumChips spec={spec} />
      <PropsTable spec={spec} />
      <EventsTable spec={spec} />
      <KeyboardTable spec={spec} />
      <AriaTable spec={spec} />
    </>
  );
}
