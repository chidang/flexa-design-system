import type { Metadata } from 'next';
import { Blocks } from '../../src/blocks';
import { loadWhy } from '../../src/content';

const doc = loadWhy();

export const metadata: Metadata = {
  title: doc.title,
  description: doc.description,
};

export default function WhyPage() {
  return (
    <article>
      <h1>{doc.title}</h1>
      <p>{doc.description}</p>
      <Blocks blocks={doc.blocks} />
    </article>
  );
}
