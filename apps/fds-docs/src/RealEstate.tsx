'use client';

/**
 * The real-estate landing page, live.
 *
 * The whole property portal below is styled entirely by `REALESTATE_CSS` (in
 * `realEstateCss.ts`, scanned at build time so every design value is a real `--fx-*` token). This
 * client island adds what a static screen cannot: recolouring the ENTIRE site
 * from a three-swatch brand, the way an agency owner would.
 *
 * Three inputs → one theme. `applyBrand` derives the primary and secondary
 * families (hover/active/on-colours, all AA-checked); the gold accent re-points
 * the `color.warning` token, its text colour derived by the SAME `readableOn`
 * rule applyBrand uses — so price tags and "For Sale" badges stay honest, not a
 * hand-picked pair. The theme is emitted NAMED, scoping its variables to
 * `[data-fx-theme="real-estate"]` so they never collide with the docs chrome.
 * Dark-mode overrides are dropped (`modes: []`) to keep the marketing page light.
 */
import { useMemo, useState, type ReactElement } from 'react';
import { applyBrand, readableOn, type Brand } from '@flexa/core';
import { checkThemeContrast, defaultTheme, emitTheme, type Theme } from 'flexa-design-system';

export interface RealEstateContent {
  brand: string;
  nav: string[];
  phone: string;
  signIn: string;
  listCta: string;
  hero: {
    eyebrow: string;
    titleA: string;
    titleHi: string;
    titleB: string;
    sub: string;
    art: string;
    popularLabel: string;
    popular: string[];
  };
  search: {
    fields: { label: string; value: string }[];
    submit: string;
  };
  stats: { icon: string; value: string; label: string }[];
  featured: {
    eyebrow: string;
    title: string;
    sub: string;
    tabs: string[];
    cta: string;
    items: {
      name: string;
      address: string;
      price: string;
      tag: string;
      beds: string;
      baths: string;
      area: string;
    }[];
  };
  types: {
    eyebrow: string;
    title: string;
    sub: string;
    items: { icon: string; name: string; count: string }[];
  };
  why: {
    eyebrow: string;
    title: string;
    sub: string;
    art: string;
    feats: { icon: string; title: string; text: string }[];
  };
  agents: {
    eyebrow: string;
    title: string;
    sub: string;
    cta: string;
    items: { name: string; role: string; listings: string; rating: string }[];
  };
  cities: {
    eyebrow: string;
    title: string;
    sub: string;
    items: { name: string; count: string }[];
  };
  reviews: {
    eyebrow: string;
    title: string;
    sub: string;
    items: { name: string; place: string; quote: string }[];
  };
  cta: {
    title: string;
    sub: string;
    primary: string;
    secondary: string;
    art: string;
  };
  footer: {
    about: string;
    socials: string[];
    columns: { title: string; links: string[] }[];
    newsletter: { title: string; sub: string; placeholder: string; cta: string };
    copyright: string;
    contact: string;
  };
}

interface Preset {
  label: string;
  p: string;
  s: string;
  a: string;
}
const PRESETS: Preset[] = [
  { label: 'Navy', p: '#0f5c8f', s: '#0b2540', a: '#e0a83e' },
  { label: 'Teal', p: '#0d8c7a', s: '#0a2c28', a: '#e0a83e' },
  { label: 'Slate', p: '#3b556e', s: '#17222e', a: '#d8a24a' },
  { label: 'Forest', p: '#2f6b4f', s: '#10261c', a: '#d8a24a' },
];

export function RealEstate({ c }: { c: RealEstateContent }): ReactElement {
  const [primary, setPrimary] = useState('#0f5c8f');
  const [secondary, setSecondary] = useState('#0b2540');
  const [accent, setAccent] = useState('#e0a83e');
  const [panelOpen, setPanelOpen] = useState(true);
  const [navOpen, setNavOpen] = useState(false);

  const theme = useMemo<Theme>(() => {
    const brand: Brand = { primaryColor: primary, secondaryColor: secondary };
    const derived = applyBrand(defaultTheme(), brand);
    // Re-point the gold accent (color.warning) and derive its text by contrast.
    const base = derived.base.map((t) =>
      t.cssVar === '--fx-color-warning'
        ? { ...t, value: accent }
        : t.cssVar === '--fx-color-on-warning'
          ? { ...t, value: readableOn(accent) }
          : t,
    );
    return { ...derived, name: 'real-estate', modes: [], base };
  }, [primary, secondary, accent]);

  const css = useMemo(() => emitTheme(theme), [theme]);
  const failures = useMemo(() => checkThemeContrast(theme), [theme]);

  const applyPreset = (pre: Preset) => {
    setPrimary(pre.p);
    setSecondary(pre.s);
    setAccent(pre.a);
  };

  return (
    <div className="re-live">
      {/* Trusted by construction: emitTheme output over this component's state. */}
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <style dangerouslySetInnerHTML={{ __html: SWITCHER_CSS }} />

      <div className={`rl-switcher${panelOpen ? ' is-open' : ''}`}>
        <button
          type="button"
          className="rl-toggle"
          aria-label="Brand colours"
          aria-expanded={panelOpen}
          onClick={() => setPanelOpen((o) => !o)}
        >
          🎨
        </button>
        <div className="rl-panel" data-fx-theme="real-estate">
          <p className="rl-title">Brand colours</p>
          <div className="rl-presets">
            {PRESETS.map((pre) => (
              <button
                key={pre.label}
                type="button"
                className="rl-swatch"
                aria-label={pre.label}
                title={pre.label}
                style={{ background: `linear-gradient(135deg, ${pre.p}, ${pre.a})` }}
                onClick={() => applyPreset(pre)}
              />
            ))}
          </div>
          <label className="rl-row">
            <span>Primary</span>
            <input type="color" value={primary} onChange={(e) => setPrimary(e.target.value)} />
          </label>
          <label className="rl-row">
            <span>Secondary</span>
            <input type="color" value={secondary} onChange={(e) => setSecondary(e.target.value)} />
          </label>
          <label className="rl-row">
            <span>Accent</span>
            <input type="color" value={accent} onChange={(e) => setAccent(e.target.value)} />
          </label>
          <p className={`rl-contrast${failures.length === 0 ? ' is-pass' : ''}`} role="status">
            {failures.length === 0
              ? '✓ All WCAG AA pairs pass'
              : `${failures.length} contrast pair(s) below AA`}
          </p>
        </div>
      </div>

      <div id="sw-real-estate" data-fx-theme="real-estate" data-fx-type="flexa/root">
        {/* header */}
        <header className="re-header">
          <div className="re-container re-nav">
            <a href="#sw-real-estate" className="re-brand">
              {c.brand}
            </a>
            <nav className={`re-links${navOpen ? ' is-open' : ''}`}>
              {c.nav.map((item, i) => (
                <a key={item} href="#sw-real-estate" className={i === 0 ? 'is-active' : undefined}>
                  {item}
                </a>
              ))}
            </nav>
            <div className="re-navright">
              <span className="re-phone">{c.phone}</span>
              <button type="button" className="re-btn re-btn--ghost">
                {c.signIn}
              </button>
              <button type="button" className="re-btn re-btn--primary">
                {c.listCta}
              </button>
            </div>
            <button
              type="button"
              className="re-burger"
              aria-label="Menu"
              aria-expanded={navOpen}
              onClick={() => setNavOpen((o) => !o)}
            >
              <span />
              <span />
              <span />
            </button>
          </div>
        </header>

        {/* hero + search */}
        <section className="re-hero">
          <div className="re-container">
            <div className="re-hero-card">
              <div className="re-ph re-hero-art">{c.hero.art}</div>
              <div className="re-hero-overlay">
                <small className="re-eyebrow re-eyebrow--light">{c.hero.eyebrow}</small>
                <h1>
                  {c.hero.titleA}
                  <br />
                  <span className="re-hi">{c.hero.titleHi}</span>
                  {c.hero.titleB}
                </h1>
                <p>{c.hero.sub}</p>
                <div className="re-search">
                  {c.search.fields.map((f) => (
                    <div key={f.label} className="re-field">
                      <label>{f.label}</label>
                      <input placeholder={f.value} readOnly />
                    </div>
                  ))}
                  <button type="button" className="re-btn re-btn--primary re-search-btn">
                    {c.search.submit}
                  </button>
                </div>
                <div className="re-popular">
                  <span className="re-popular-label">{c.hero.popularLabel}</span>
                  {c.hero.popular.map((p) => (
                    <span key={p} className="re-chip">
                      {p}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* quick stats */}
        <section className="re-section re-section--tight">
          <div className="re-container">
            <div className="re-stats">
              {c.stats.map((s) => (
                <div key={s.label} className="re-stat">
                  <span className="re-stat-ic">{s.icon}</span>
                  <div>
                    <strong>{s.value}</strong>
                    <small>{s.label}</small>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* featured listings */}
        <section className="re-section">
          <div className="re-container">
            <div className="re-head">
              <small className="re-eyebrow">{c.featured.eyebrow}</small>
              <h2>{c.featured.title}</h2>
              <p>{c.featured.sub}</p>
            </div>
            <div className="re-tabs">
              {c.featured.tabs.map((t, i) => (
                <span key={t} className={`re-tab${i === 0 ? ' is-active' : ''}`}>
                  {t}
                </span>
              ))}
            </div>
            <div className="re-prop-grid">
              {c.featured.items.map((p) => (
                <div key={p.name} className="re-prop">
                  <div className="re-ph re-prop-img">
                    <span className="re-tag">{p.tag}</span>
                    <span className="re-price">{p.price}</span>
                  </div>
                  <div className="re-prop-body">
                    <b>{p.name}</b>
                    <small>{p.address}</small>
                    <div className="re-meta">
                      <span>🛏 {p.beds}</span>
                      <span>🛁 {p.baths}</span>
                      <span>📐 {p.area}</span>
                    </div>
                    <button type="button" className="re-btn re-btn--outline re-btn--full">
                      {c.featured.cta}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* property types */}
        <section className="re-section re-section--alt">
          <div className="re-container">
            <div className="re-head">
              <small className="re-eyebrow">{c.types.eyebrow}</small>
              <h2>{c.types.title}</h2>
              <p>{c.types.sub}</p>
            </div>
            <div className="re-type-grid">
              {c.types.items.map((t) => (
                <div key={t.name} className="re-type">
                  <span className="re-type-ic">{t.icon}</span>
                  <b>{t.name}</b>
                  <small>{t.count}</small>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* why choose us */}
        <section className="re-section">
          <div className="re-container re-why">
            <div>
              <small className="re-eyebrow">{c.why.eyebrow}</small>
              <h2>{c.why.title}</h2>
              <p>{c.why.sub}</p>
              <div className="re-why-grid">
                {c.why.feats.map((f) => (
                  <div key={f.title} className="re-wf">
                    <span className="re-ic">{f.icon}</span>
                    <b>{f.title}</b>
                    <small>{f.text}</small>
                  </div>
                ))}
              </div>
            </div>
            <div className="re-ph re-why-art">{c.why.art}</div>
          </div>
        </section>

        {/* top agents */}
        <section className="re-section re-section--alt">
          <div className="re-container">
            <div className="re-head-row">
              <div>
                <small className="re-eyebrow">{c.agents.eyebrow}</small>
                <h2>{c.agents.title}</h2>
                <p>{c.agents.sub}</p>
              </div>
              <button type="button" className="re-btn re-btn--outline">
                {c.agents.cta}
              </button>
            </div>
            <div className="re-agent-grid">
              {c.agents.items.map((a) => (
                <div key={a.name} className="re-agent">
                  <span className="re-av" />
                  <b>{a.name}</b>
                  <small>{a.role}</small>
                  <div className="re-agent-stats">
                    <span>🏠 {a.listings}</span>
                    <span className="re-agent-rate">⭐ {a.rating}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* neighbourhoods / cities */}
        <section className="re-section">
          <div className="re-container">
            <div className="re-head">
              <small className="re-eyebrow">{c.cities.eyebrow}</small>
              <h2>{c.cities.title}</h2>
              <p>{c.cities.sub}</p>
            </div>
            <div className="re-city-grid">
              {c.cities.items.map((n) => (
                <div key={n.name} className="re-city">
                  <div className="re-ph re-city-img">{n.name}</div>
                  <b>{n.name}</b>
                  <small>{n.count}</small>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* testimonials */}
        <section className="re-section re-section--alt">
          <div className="re-container">
            <div className="re-head">
              <small className="re-eyebrow">{c.reviews.eyebrow}</small>
              <h2>{c.reviews.title}</h2>
              <p>{c.reviews.sub}</p>
            </div>
            <div className="re-rev-grid">
              {c.reviews.items.map((r) => (
                <div key={r.name} className="re-rev">
                  <div className="re-stars">★★★★★</div>
                  <p>“{r.quote}”</p>
                  <div className="re-rev-head">
                    <span className="re-av" />
                    <div>
                      <b>{r.name}</b>
                      <small>{r.place}</small>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA band */}
        <section className="re-section">
          <div className="re-container">
            <div className="re-cta">
              <div>
                <h2>{c.cta.title}</h2>
                <p>{c.cta.sub}</p>
                <div className="re-cta-actions">
                  <button type="button" className="re-btn re-btn--accent">
                    {c.cta.primary}
                  </button>
                  <button type="button" className="re-btn re-btn--onsec">
                    {c.cta.secondary}
                  </button>
                </div>
              </div>
              <div className="re-cta-art">{c.cta.art}</div>
            </div>
          </div>
        </section>

        {/* footer */}
        <footer className="re-footer">
          <div className="re-container re-foot-grid">
            <div>
              <a
                href="#sw-real-estate"
                className="re-brand"
                style={{ color: 'var(--fx-color-on-secondary)' }}
              >
                {c.brand}
              </a>
              <p className="re-foot-about">{c.footer.about}</p>
              <div className="re-socials">
                {c.footer.socials.map((s, i) => (
                  <span key={i}>{s}</span>
                ))}
              </div>
            </div>
            {c.footer.columns.map((col) => (
              <div key={col.title} className="re-foot-col">
                <h4>{col.title}</h4>
                {col.links.map((l) => (
                  <a key={l} href="#sw-real-estate">
                    {l}
                  </a>
                ))}
              </div>
            ))}
            <div className="re-foot-col">
              <h4>{c.footer.newsletter.title}</h4>
              <p>{c.footer.newsletter.sub}</p>
              <div className="re-news">
                <input placeholder={c.footer.newsletter.placeholder} readOnly />
                <button type="button" aria-label={c.footer.newsletter.cta}>
                  ➤
                </button>
              </div>
              <p className="re-foot-contact">{c.footer.contact}</p>
            </div>
          </div>
          <div className="re-container re-foot-bottom">
            <span>{c.footer.copyright}</span>
          </div>
        </footer>
      </div>
    </div>
  );
}

/* Control chrome — not part of the scanned page stylesheet, but token-styled all
 * the same so the panel matches the theme it drives. */
const SWITCHER_CSS = `
.re-live { position: relative; }
.rl-switcher { position: fixed; top: 96px; right: 0; z-index: 40; display: flex; align-items: flex-start; }
.rl-toggle { width: 44px; height: 44px; border: none; border-radius: var(--fx-radius-md) 0 0 var(--fx-radius-md); background: var(--fx-color-primary); color: var(--fx-color-on-primary); font-size: 1.15rem; cursor: pointer; box-shadow: var(--fx-shadow-lg); }
.rl-panel { position: absolute; top: 0; right: 44px; width: 216px; padding: var(--fx-space-4); background: var(--fx-color-surface); color: var(--fx-color-text); border: 1px solid var(--fx-color-border); border-radius: var(--fx-radius-lg) 0 0 var(--fx-radius-lg); box-shadow: var(--fx-shadow-xl); opacity: 0; transform: translateX(8px); pointer-events: none; transition: opacity 0.25s ease, transform 0.25s ease; }
.rl-switcher.is-open .rl-panel { opacity: 1; transform: translateX(0); pointer-events: auto; }
.rl-title { margin: 0 0 var(--fx-space-3); font-weight: 700; }
.rl-presets { display: flex; gap: var(--fx-space-2); margin-bottom: var(--fx-space-4); }
.rl-swatch { width: 36px; height: 36px; border-radius: var(--fx-radius-md); border: 2px solid var(--fx-color-border); cursor: pointer; transition: transform 0.15s ease; }
.rl-swatch:hover { transform: scale(1.08); }
.rl-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: var(--fx-space-2); color: var(--fx-color-text-muted); }
.rl-row input { width: 40px; height: 26px; padding: 0; border: none; background: none; cursor: pointer; }
.rl-contrast { margin: var(--fx-space-2) 0 0; padding-top: var(--fx-space-2); border-top: 1px solid var(--fx-color-border); color: var(--fx-color-danger); }
.rl-contrast.is-pass { color: var(--fx-color-success); }
@media (max-width: 960px) { .rl-switcher { top: 72px; } }
`;

