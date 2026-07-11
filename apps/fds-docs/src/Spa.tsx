'use client';

/**
 * The spa & wellness landing page, live.
 *
 * The structure below is styled entirely by `SPA_CSS` (in `spaCss.ts`, scanned at
 * build time so every value is a real `--fx-*` token). This component adds the one
 * thing a static screen can't show: recolouring the WHOLE site from a tiny brand,
 * the way a real user would.
 *
 * Three inputs → one theme. `applyBrand` derives the primary (sage) and secondary
 * (deep forest) families (hover/active/on-colours, all AA-checked); the soft-gold
 * accent re-points the `color.warning` token, its text colour derived by the SAME
 * `readableOn` contrast rule applyBrand uses — so the accent is honest, not a
 * hand-picked pair. The result is emitted as a NAMED theme, scoping its variables
 * to `[data-fx-theme="spa"]` so they never fight the docs chrome, and the page
 * re-themes instantly. Dark-mode overrides are dropped (`modes: []`) to keep the
 * marketing page light and airy, exactly as designed.
 */
import { useMemo, useState, type ReactElement } from 'react';
import { applyBrand, readableOn, type Brand } from '@flexa/core';
import { checkThemeContrast, defaultTheme, emitTheme, type Theme } from 'flexa-design-system';

export interface SpaContent {
  brand: string;
  nav: string[];
  book: string;
  topbar: { left: string; right: string };
  hero: { titleA: string; titleHi: string; titleB: string; sub: string; cta: string; art: string };
  services: {
    eyebrow: string;
    title: string;
    sub: string;
    items: { icon: string; name: string; desc: string; price: string; cta: string }[];
  };
  packages: {
    eyebrow: string;
    title: string;
    sub: string;
    items: { name: string; desc: string; price: string; popular?: boolean; cta: string }[];
  };
  rejuvenate: {
    eyebrow: string;
    title: string;
    sub: string;
    cta: string;
    art: string;
    feats: { icon: string; title: string; text: string }[];
  };
  stats: { eyebrow: string; title: string; items: { value: string; label: string }[] };
  benefits: { eyebrow: string; title: string; sub: string; items: { icon: string; title: string; text: string }[] };
  therapists: {
    eyebrow: string;
    title: string;
    sub: string;
    items: { name: string; role: string; social: string }[];
  };
  pricing: {
    eyebrow: string;
    title: string;
    sub: string;
    tabs: string[];
    rows: { name: string; time: string; price: string }[];
  };
  book2: {
    eyebrow: string;
    title: string;
    sub: string;
    fields: { label: string; value: string }[];
    submit: string;
    art: string;
  };
  testimonials: {
    eyebrow: string;
    title: string;
    sub: string;
    items: { quote: string; name: string; role: string }[];
  };
  gallery: { eyebrow: string; title: string; sub: string; items: string[] };
  cta: { title: string; sub: string; button: string; art: string };
  footer: {
    about: string;
    socials: string[];
    columns: { title: string; links: string[] }[];
    hours: { title: string; rows: string[] };
    newsletter: { title: string; sub: string; placeholder: string };
    copyright: string;
  };
}

interface Preset {
  label: string;
  p: string;
  s: string;
  a: string;
}
const PRESETS: Preset[] = [
  { label: 'Sage', p: '#6f8f6a', s: '#2e3a2b', a: '#d9a441' },
  { label: 'Blush', p: '#b3728a', s: '#3a1f2a', a: '#d9a441' },
  { label: 'Mauve', p: '#8a6d9c', s: '#2c2236', a: '#d9a441' },
  { label: 'Sand', p: '#b08856', s: '#33261a', a: '#cf9a3e' },
];

export function Spa({ c }: { c: SpaContent }): ReactElement {
  const [primary, setPrimary] = useState('#6f8f6a');
  const [secondary, setSecondary] = useState('#2e3a2b');
  const [accent, setAccent] = useState('#d9a441');
  const [panelOpen, setPanelOpen] = useState(true);
  const [navOpen, setNavOpen] = useState(false);

  const theme = useMemo<Theme>(() => {
    const brand: Brand = { primaryColor: primary, secondaryColor: secondary };
    const derived = applyBrand(defaultTheme(), brand);
    // Re-point the soft-gold accent (color.warning) and derive its text by contrast.
    const base = derived.base.map((t) =>
      t.cssVar === '--fx-color-warning'
        ? { ...t, value: accent }
        : t.cssVar === '--fx-color-on-warning'
          ? { ...t, value: readableOn(accent) }
          : t,
    );
    return { ...derived, name: 'spa', modes: [], base };
  }, [primary, secondary, accent]);

  const css = useMemo(() => emitTheme(theme), [theme]);
  const failures = useMemo(() => checkThemeContrast(theme), [theme]);

  const applyPreset = (pre: Preset) => {
    setPrimary(pre.p);
    setSecondary(pre.s);
    setAccent(pre.a);
  };

  return (
    <div className="spa-live">
      {/* Trusted by construction: emitTheme output over this component's state. */}
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <style dangerouslySetInnerHTML={{ __html: SWITCHER_CSS }} />

      <div className={`sl-switcher${panelOpen ? ' is-open' : ''}`}>
        <button
          type="button"
          className="sl-toggle"
          aria-label="Brand colours"
          aria-expanded={panelOpen}
          onClick={() => setPanelOpen((o) => !o)}
        >
          🎨
        </button>
        <div className="sl-panel" data-fx-theme="spa">
          <p className="sl-title">Brand colours</p>
          <div className="sl-presets">
            {PRESETS.map((pre) => (
              <button
                key={pre.label}
                type="button"
                className="sl-swatch"
                aria-label={pre.label}
                title={pre.label}
                style={{ background: `linear-gradient(135deg, ${pre.p}, ${pre.a})` }}
                onClick={() => applyPreset(pre)}
              />
            ))}
          </div>
          <label className="sl-row">
            <span>Primary</span>
            <input type="color" value={primary} onChange={(e) => setPrimary(e.target.value)} />
          </label>
          <label className="sl-row">
            <span>Secondary</span>
            <input type="color" value={secondary} onChange={(e) => setSecondary(e.target.value)} />
          </label>
          <label className="sl-row">
            <span>Accent</span>
            <input type="color" value={accent} onChange={(e) => setAccent(e.target.value)} />
          </label>
          <p className={`sl-contrast${failures.length === 0 ? ' is-pass' : ''}`} role="status">
            {failures.length === 0
              ? '✓ All WCAG AA pairs pass'
              : `${failures.length} contrast pair(s) below AA`}
          </p>
        </div>
      </div>

      <div id="sw-spa" data-fx-theme="spa" data-fx-type="flexa/root">
        {/* topbar */}
        <div className="sp-topbar">
          <div className="sp-container sp-topbar-inner">
            <span>{c.topbar.left}</span>
            <span>{c.topbar.right}</span>
          </div>
        </div>

        {/* header */}
        <header className="sp-header">
          <div className="sp-container sp-nav">
            <a href="#sw-spa" className="sp-brand">
              {c.brand}
            </a>
            <nav className={`sp-links${navOpen ? ' is-open' : ''}`}>
              {c.nav.map((item, i) => (
                <a key={item} href="#sw-spa" className={i === 0 ? 'is-active' : undefined}>
                  {item}
                </a>
              ))}
            </nav>
            <button type="button" className="sp-btn sp-btn--accent sp-book-cta">
              {c.book}
            </button>
            <button
              type="button"
              className="sp-burger"
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

        {/* hero */}
        <section className="sp-hero">
          <div className="sp-container sp-hero-card">
            <div className="sp-ph sp-hero-img">{c.hero.art}</div>
            <div className="sp-hero-overlay">
              <h1>
                {c.hero.titleA}
                <br />
                <span className="sp-hi">{c.hero.titleHi}</span>
                {c.hero.titleB}
              </h1>
              <p>{c.hero.sub}</p>
              <button type="button" className="sp-btn sp-btn--accent">
                {c.hero.cta}
              </button>
            </div>
          </div>
        </section>

        {/* services */}
        <section className="sp-section">
          <div className="sp-container">
            <div className="sp-head">
              <small className="sp-eyebrow">{c.services.eyebrow}</small>
              <h2>{c.services.title}</h2>
              <p>{c.services.sub}</p>
            </div>
            <div className="sp-svc-grid">
              {c.services.items.map((s) => (
                <div key={s.name} className="sp-svc">
                  <span className="sp-svc-ic">{s.icon}</span>
                  <b>{s.name}</b>
                  <p>{s.desc}</p>
                  <div className="sp-svc-foot">
                    <span className="sp-price">{s.price}</span>
                    <button type="button" className="sp-btn sp-btn--outline sp-btn--sm">
                      {s.cta}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* packages */}
        <section className="sp-section sp-section--alt">
          <div className="sp-container">
            <div className="sp-head">
              <small className="sp-eyebrow">{c.packages.eyebrow}</small>
              <h2>{c.packages.title}</h2>
              <p>{c.packages.sub}</p>
            </div>
            <div className="sp-pkg-grid">
              {c.packages.items.map((p) => (
                <div key={p.name} className={`sp-pkg${p.popular ? ' is-popular' : ''}`}>
                  <div className="sp-ph sp-pkg-img">
                    {p.popular ? <span className="sp-badge">Popular</span> : null}
                  </div>
                  <b>{p.name}</b>
                  <small>{p.desc}</small>
                  <div className="sp-pkg-foot">
                    <span className="sp-price">{p.price}</span>
                    <button type="button" className="sp-btn sp-btn--primary sp-btn--sm">
                      {p.cta}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* rejuvenate split */}
        <section className="sp-section">
          <div className="sp-container sp-rej">
            <div className="sp-ph sp-rej-art">{c.rejuvenate.art}</div>
            <div>
              <small className="sp-eyebrow">{c.rejuvenate.eyebrow}</small>
              <h2>{c.rejuvenate.title}</h2>
              <p>{c.rejuvenate.sub}</p>
              <div className="sp-rej-grid">
                {c.rejuvenate.feats.map((f) => (
                  <div key={f.title} className="sp-rf">
                    <span className="sp-ic">{f.icon}</span>
                    <b>{f.title}</b>
                    <small>{f.text}</small>
                  </div>
                ))}
              </div>
              <button type="button" className="sp-btn sp-btn--accent">
                {c.rejuvenate.cta}
              </button>
            </div>
          </div>
        </section>

        {/* stats band */}
        <section className="sp-section" style={{ paddingTop: 0 }}>
          <div className="sp-container">
            <div className="sp-stats">
              {c.stats.items.map((s) => (
                <div key={s.label} className="sp-stat">
                  <strong>{s.value}</strong>
                  <small>{s.label}</small>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* benefits / why us */}
        <section className="sp-section sp-section--alt">
          <div className="sp-container">
            <div className="sp-head">
              <small className="sp-eyebrow">{c.benefits.eyebrow}</small>
              <h2>{c.benefits.title}</h2>
              <p>{c.benefits.sub}</p>
            </div>
            <div className="sp-ben-grid">
              {c.benefits.items.map((b) => (
                <div key={b.title} className="sp-ben">
                  <span className="sp-ic">{b.icon}</span>
                  <b>{b.title}</b>
                  <small>{b.text}</small>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* therapists */}
        <section className="sp-section">
          <div className="sp-container">
            <div className="sp-head">
              <small className="sp-eyebrow">{c.therapists.eyebrow}</small>
              <h2>{c.therapists.title}</h2>
              <p>{c.therapists.sub}</p>
            </div>
            <div className="sp-ther-grid">
              {c.therapists.items.map((t) => (
                <div key={t.name} className="sp-ther">
                  <div className="sp-ph sp-ther-img">{t.name}</div>
                  <b>{t.name}</b>
                  <small>{t.role}</small>
                  <div className="sp-ther-social">{t.social}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* pricing menu */}
        <section className="sp-section sp-section--alt">
          <div className="sp-container sp-pricing">
            <div className="sp-pricing-left">
              <small className="sp-eyebrow">{c.pricing.eyebrow}</small>
              <h2>{c.pricing.title}</h2>
              <p>{c.pricing.sub}</p>
              <div className="sp-pl-tabs">
                {c.pricing.tabs.map((t, i) => (
                  <span key={t} className={`sp-pl-tab${i === 0 ? ' is-active' : ''}`}>
                    {t}
                  </span>
                ))}
              </div>
            </div>
            <div className="sp-pricing-right">
              {c.pricing.rows.map((r) => (
                <div key={r.name} className="sp-price-row">
                  <div>
                    <b>{r.name}</b>
                    <small>{r.time}</small>
                  </div>
                  <span className="sp-price">{r.price}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* booking band */}
        <section className="sp-section">
          <div className="sp-container">
            <div className="sp-book">
              <div className="sp-ph sp-book-art">{c.book2.art}</div>
              <div className="sp-book-form">
                <small className="sp-eyebrow">{c.book2.eyebrow}</small>
                <h2>{c.book2.title}</h2>
                <p>{c.book2.sub}</p>
                <div className="sp-book-fields">
                  {c.book2.fields.map((f) => (
                    <div key={f.label}>
                      <label>{f.label}</label>
                      <input placeholder={f.value} readOnly />
                    </div>
                  ))}
                </div>
                <button type="button" className="sp-btn sp-btn--accent sp-btn--full">
                  {c.book2.submit}
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* testimonials */}
        <section className="sp-section sp-section--alt">
          <div className="sp-container">
            <div className="sp-head">
              <small className="sp-eyebrow">{c.testimonials.eyebrow}</small>
              <h2>{c.testimonials.title}</h2>
              <p>{c.testimonials.sub}</p>
            </div>
            <div className="sp-test-grid">
              {c.testimonials.items.map((t) => (
                <div key={t.name} className="sp-test">
                  <span className="sp-quote">“</span>
                  <p>{t.quote}</p>
                  <div className="sp-test-head">
                    <span className="sp-av" />
                    <div>
                      <b>{t.name}</b>
                      <small>{t.role}</small>
                    </div>
                  </div>
                  <div className="sp-stars">★★★★★</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* gallery */}
        <section className="sp-section">
          <div className="sp-container">
            <div className="sp-head">
              <small className="sp-eyebrow">{c.gallery.eyebrow}</small>
              <h2>{c.gallery.title}</h2>
              <p>{c.gallery.sub}</p>
            </div>
            <div className="sp-gal-grid">
              {c.gallery.items.map((g, i) => (
                <div key={i} className="sp-ph sp-gal">
                  {g}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA band */}
        <section className="sp-section" style={{ paddingBottom: 0 }}>
          <div className="sp-container sp-cta">
            <div>
              <h2>{c.cta.title}</h2>
              <p>{c.cta.sub}</p>
              <button type="button" className="sp-btn sp-btn--accent">
                {c.cta.button}
              </button>
            </div>
            <div className="sp-cta-art">{c.cta.art}</div>
          </div>
        </section>

        {/* footer */}
        <footer className="sp-footer">
          <div className="sp-container sp-news">
            <div>
              <h3>{c.footer.newsletter.title}</h3>
              <p>{c.footer.newsletter.sub}</p>
            </div>
            <div className="sp-news-form">
              <input placeholder={c.footer.newsletter.placeholder} readOnly />
              <button type="button" className="sp-btn sp-btn--accent">
                Sign Up
              </button>
            </div>
          </div>
          <div className="sp-container sp-foot-grid">
            <div>
              <a
                href="#sw-spa"
                className="sp-brand"
                style={{ color: 'var(--fx-color-on-secondary)' }}
              >
                {c.brand}
              </a>
              <p className="sp-foot-about">{c.footer.about}</p>
              <div className="sp-socials">
                {c.footer.socials.map((s, i) => (
                  <span key={i}>{s}</span>
                ))}
              </div>
            </div>
            <div className="sp-foot-col">
              <h4>{c.footer.hours.title}</h4>
              {c.footer.hours.rows.map((r) => (
                <p key={r}>{r}</p>
              ))}
            </div>
            {c.footer.columns.map((col) => (
              <div key={col.title} className="sp-foot-col">
                <h4>{col.title}</h4>
                {col.links.map((l) => (
                  <a key={l} href="#sw-spa">
                    {l}
                  </a>
                ))}
              </div>
            ))}
          </div>
          <div className="sp-container sp-foot-bottom">
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
.spa-live { position: relative; }
.sl-switcher { position: fixed; top: 96px; right: 0; z-index: 40; display: flex; align-items: flex-start; }
.sl-toggle { width: 44px; height: 44px; border: none; border-radius: var(--fx-radius-md) 0 0 var(--fx-radius-md); background: var(--fx-color-primary); color: var(--fx-color-on-primary); font-size: 1.15rem; cursor: pointer; box-shadow: var(--fx-shadow-lg); }
.sl-panel { position: absolute; top: 0; right: 44px; width: 216px; padding: var(--fx-space-4); background: var(--fx-color-surface); color: var(--fx-color-text); border: 1px solid var(--fx-color-border); border-radius: var(--fx-radius-lg) 0 0 var(--fx-radius-lg); box-shadow: var(--fx-shadow-xl); opacity: 0; transform: translateX(8px); pointer-events: none; transition: opacity 0.25s ease, transform 0.25s ease; }
.sl-switcher.is-open .sl-panel { opacity: 1; transform: translateX(0); pointer-events: auto; }
.sl-title { margin: 0 0 var(--fx-space-3); font-weight: 700; }
.sl-presets { display: flex; gap: var(--fx-space-2); margin-bottom: var(--fx-space-4); }
.sl-swatch { width: 36px; height: 36px; border-radius: var(--fx-radius-md); border: 2px solid var(--fx-color-border); cursor: pointer; transition: transform 0.15s ease; }
.sl-swatch:hover { transform: scale(1.08); }
.sl-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: var(--fx-space-2); color: var(--fx-color-text-muted); }
.sl-row input { width: 40px; height: 26px; padding: 0; border: none; background: none; cursor: pointer; }
.sl-contrast { margin: var(--fx-space-2) 0 0; padding-top: var(--fx-space-2); border-top: 1px solid var(--fx-color-border); color: var(--fx-color-danger); }
.sl-contrast.is-pass { color: var(--fx-color-success); }
@media (max-width: 960px) { .sl-switcher { top: 72px; } }
`;

