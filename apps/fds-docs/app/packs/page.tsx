import type { Metadata } from 'next';
import Link from 'next/link';
import { loadPacks } from '../../src/content';
import { deriveGallery, type DerivedPack } from '../../src/packs';
import { Inline } from '../../src/blocks';

export const metadata: Metadata = {
  title: 'Starter packs',
  description:
    'Sixteen brand personalities on one core design system — each a full, WCAG-checked theme derived live from a tiny brand by applyBrand. Generic and industry packs, previewed in both light and dark.',
};

/** A live preview of one derived theme, scoped by its own emitted stylesheet. */
function PackCard({ pack }: { pack: DerivedPack }) {
  const { brand } = pack;
  return (
    <article className="pack-card">
      {/* Trusted by construction: the shipped emitter over build-time data. */}
      <style dangerouslySetInnerHTML={{ __html: pack.css }} />
      <div className="pack-preview" data-fx-theme={pack.scope}>
        <div className="pack-preview-head">
          <h3>{pack.name}</h3>
          <span className="pack-personality">{pack.personality}</span>
        </div>
        <p className="pack-desc">{pack.description}</p>
        <div className="pack-actions">
          <button type="button" className="btn btn-primary">
            Primary
          </button>
          <button
            type="button"
            className="btn"
            style={{
              background: 'var(--fx-color-secondary)',
              color: 'var(--fx-color-on-secondary)',
            }}
          >
            Secondary
          </button>
          <button type="button" className="btn btn-ghost">
            Ghost
          </button>
        </div>
        <div className="pack-surface card">
          <strong>Card surface</strong>
          <p>Border, radius and shadow all re-pointed from this brand.</p>
        </div>
      </div>
      <footer className="pack-meta">
        <div className="pack-swatches" aria-hidden>
          <span className="swatch" style={{ background: brand.primaryColor }} />
          <span className="swatch" style={{ background: brand.secondaryColor }} />
        </div>
        <dl className="pack-recipe">
          <div>
            <dt>Primary</dt>
            <dd className="token-id">{brand.primaryColor}</dd>
          </div>
          <div>
            <dt>Radius</dt>
            <dd className="token-id">{brand.radius}</dd>
          </div>
        </dl>
        <span className={`pack-a11y ${pack.contrastPass ? 'pass' : 'fail'}`}>
          {pack.contrastPass ? '✓ AA' : '⚠ AA'}
        </span>
      </footer>
      <div className="pack-tags">
        {pack.tags.map((t) => (
          <span key={t} className="pack-tag">
            {t}
          </span>
        ))}
      </div>
    </article>
  );
}

export default function PacksPage() {
  const doc = loadPacks();
  const gallery = deriveGallery(doc.packs);
  return (
    <article>
      <h1>{doc.title}</h1>
      <p className="hero p">
        <Inline text={doc.intro} />
      </p>

      <section>
        <h2>The philosophy</h2>
        <p>{doc.tagline}</p>
        <ul>
          {doc.principles.map((p, i) => (
            <li key={i}>
              <Inline text={p} />
            </li>
          ))}
        </ul>
        <aside className="note">{doc.curationNote}</aside>
      </section>

      {doc.groups.map((group) => {
        const packs = gallery.filter((p) => p.group === group.key);
        if (packs.length === 0) return null;
        return (
          <section key={group.key}>
            <h2>
              {group.title}{' '}
              <span className="tier-badge">{packs.length} packs</span>
            </h2>
            <p>{group.blurb}</p>
            <div className="pack-grid">
              {packs.map((p) => (
                <PackCard key={p.id} pack={p} />
              ))}
            </div>
          </section>
        );
      })}

      <section>
        <h2>Make your own</h2>
        <p>
          Every pack above is just a <code>Brand</code> passed through{' '}
          <code>applyBrand</code>. Change a color and watch a fresh, contrast-checked theme derive
          in the <Link href="/playground/">playground</Link>, or read{' '}
          <Link href="/guides/brand-derivation/">how brand derivation works</Link>.
        </p>
      </section>
    </article>
  );
}
