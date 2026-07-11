'use client';

/**
 * The travel landing page, live.
 *
 * The structure below is styled entirely by `TOUR_CSS` (in `showcase.tsx`,
 * scanned at build time so every value is a real `--fx-*` token). This component
 * adds the one thing a static screen can't show: recolouring the WHOLE site from
 * a tiny brand, the way a real user would.
 *
 * Three inputs → one theme. `applyBrand` derives the primary and secondary
 * families (hover/active/on-colours, all AA-checked); the amber accent re-points
 * the `color.warning` token, its text colour derived by the SAME `readableOn`
 * contrast rule applyBrand uses — so the accent is honest, not a hand-picked
 * pair. The result is emitted as a NAMED theme, scoping its variables to
 * `[data-fx-theme="tour"]` so they never fight the docs chrome, and the page
 * re-themes instantly. Dark-mode overrides are dropped (`modes: []`) to keep the
 * marketing page light, exactly as designed.
 */
import { useMemo, useState, type ReactElement } from 'react';
import { applyBrand, readableOn, type Brand } from '@flexa/core';
import { checkThemeContrast, defaultTheme, emitTheme, type Theme } from 'flexa-design-system';
import type { TourBookingContent } from './content';

interface Preset {
  label: string;
  p: string;
  s: string;
  a: string;
}
const PRESETS: Preset[] = [
  { label: 'Ocean', p: '#1a56b8', s: '#0d2a5c', a: '#f5c518' },
  { label: 'Teal', p: '#0d9488', s: '#0c2624', a: '#f5c518' },
  { label: 'Sunset', p: '#c2410c', s: '#3a1c0a', a: '#f5b301' },
  { label: 'Violet', p: '#7c3aed', s: '#241046', a: '#f5c518' },
];

export function TourBooking({ c }: { c: TourBookingContent }): ReactElement {
  const [primary, setPrimary] = useState('#1a56b8');
  const [secondary, setSecondary] = useState('#0d2a5c');
  const [accent, setAccent] = useState('#f5c518');
  const [panelOpen, setPanelOpen] = useState(true);
  const [navOpen, setNavOpen] = useState(false);

  const theme = useMemo<Theme>(() => {
    const brand: Brand = { primaryColor: primary, secondaryColor: secondary };
    const derived = applyBrand(defaultTheme(), brand);
    // Re-point the amber accent (color.warning) and derive its text by contrast.
    const base = derived.base.map((t) =>
      t.cssVar === '--fx-color-warning'
        ? { ...t, value: accent }
        : t.cssVar === '--fx-color-on-warning'
          ? { ...t, value: readableOn(accent) }
          : t,
    );
    return { ...derived, name: 'tour', modes: [], base };
  }, [primary, secondary, accent]);

  const css = useMemo(() => emitTheme(theme), [theme]);
  const failures = useMemo(() => checkThemeContrast(theme), [theme]);

  const applyPreset = (pre: Preset) => {
    setPrimary(pre.p);
    setSecondary(pre.s);
    setAccent(pre.a);
  };

  return (
    <div className="tour-live">
      {/* Trusted by construction: emitTheme output over this component's state. */}
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <style dangerouslySetInnerHTML={{ __html: SWITCHER_CSS }} />

      <div className={`tl-switcher${panelOpen ? ' is-open' : ''}`}>
        <button
          type="button"
          className="tl-toggle"
          aria-label="Brand colours"
          aria-expanded={panelOpen}
          onClick={() => setPanelOpen((o) => !o)}
        >
          🎨
        </button>
        <div className="tl-panel" data-fx-theme="tour">
          <p className="tl-title">Brand colours</p>
          <div className="tl-presets">
            {PRESETS.map((pre) => (
              <button
                key={pre.label}
                type="button"
                className="tl-swatch"
                aria-label={pre.label}
                title={pre.label}
                style={{ background: `linear-gradient(135deg, ${pre.p}, ${pre.a})` }}
                onClick={() => applyPreset(pre)}
              />
            ))}
          </div>
          <label className="tl-row">
            <span>Primary</span>
            <input type="color" value={primary} onChange={(e) => setPrimary(e.target.value)} />
          </label>
          <label className="tl-row">
            <span>Secondary</span>
            <input type="color" value={secondary} onChange={(e) => setSecondary(e.target.value)} />
          </label>
          <label className="tl-row">
            <span>Accent</span>
            <input type="color" value={accent} onChange={(e) => setAccent(e.target.value)} />
          </label>
          <p className={`tl-contrast${failures.length === 0 ? ' is-pass' : ''}`} role="status">
            {failures.length === 0
              ? '✓ All WCAG AA pairs pass'
              : `${failures.length} contrast pair(s) below AA`}
          </p>
        </div>
      </div>

      <div id="sw-tour" data-fx-theme="tour" data-fx-type="flexa/root">
        {/* header */}
        <header className="tb-header">
          <div className="tb-container tb-nav">
            <a href="#sw-tour" className="tb-brand">
              {c.brand}
            </a>
            <nav className={`tb-links${navOpen ? ' is-open' : ''}`}>
              {c.nav.map((item, i) => (
                <a key={item} href="#sw-tour" className={i === 0 ? 'is-active' : undefined}>
                  {item}
                </a>
              ))}
            </nav>
            <div className="tb-navright">
              <span className="tb-lang">{c.lang}</span>
              <button type="button" className="tb-btn tb-btn--accent">
                {c.signIn}
              </button>
            </div>
            <button
              type="button"
              className="tb-burger"
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
        <section className="tb-hero">
          <div className="tb-hero-bg">
            <div className="tb-container tb-hero-content">
              <h1>
                {c.hero.titleA}
                <br />
                <span className="tb-hi">{c.hero.titleHi}</span>
                {c.hero.titleB}
              </h1>
              <p>{c.hero.sub}</p>
              <button type="button" className="tb-btn tb-btn--accent">
                {c.hero.cta}
              </button>
            </div>
          </div>

          <div className="tb-container">
            <div className="tb-search">
              <div className="tb-tabs">
                {c.search.tabs.map((t, i) => (
                  <span key={t} className={`tb-tab${i === 0 ? ' is-active' : ''}`}>
                    {t}
                  </span>
                ))}
              </div>
              <div className="tb-trip">
                {c.search.trip.map((t, i) => (
                  <span key={t} className={i === 1 ? 'is-active' : undefined}>
                    {t}
                  </span>
                ))}
              </div>
              <div className="tb-fields">
                {c.search.fields.map((f) => (
                  <div key={f.label}>
                    <label>{f.label}</label>
                    <input placeholder={f.value} readOnly />
                  </div>
                ))}
                <button type="button" className="tb-btn tb-btn--accent">
                  {c.search.submit}
                </button>
              </div>
            </div>
          </div>

          <div className="tb-container tb-feats">
            {c.heroFeats.map((f) => (
              <div key={f.title} className="tb-feat">
                <span className="tb-ic">{f.icon}</span>
                <div>
                  <b>{f.title}</b>
                  <small>{f.text}</small>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* destinations */}
        <section className="tb-section">
          <div className="tb-container">
            <div className="tb-head">
              <small className="tb-eyebrow">{c.destinations.eyebrow}</small>
              <h2>{c.destinations.title}</h2>
              <p>{c.destinations.sub}</p>
            </div>
            <div className="tb-dest-grid">
              {c.destinations.items.map((d) => (
                <div key={d.name} className="tb-dest">
                  <div className="tb-ph">{d.name}</div>
                  <b>{d.name}</b>
                  <small>{d.country}</small>
                </div>
              ))}
            </div>
            <div className="tb-more">
              <button type="button" className="tb-btn tb-btn--outline">
                {c.destinations.cta}
              </button>
            </div>
          </div>
        </section>

        {/* tours */}
        <section className="tb-section tb-section--alt">
          <div className="tb-container">
            <div className="tb-head">
              <small className="tb-eyebrow">{c.tours.eyebrow}</small>
              <h2>{c.tours.title}</h2>
              <p>{c.tours.sub}</p>
            </div>
            <div className="tb-tour-grid">
              {c.tours.items.map((t) => (
                <div key={t.title} className="tb-tour">
                  <span className="tb-emoji">{t.icon}</span>
                  <b>{t.title}</b>
                  <p>{t.text}</p>
                </div>
              ))}
            </div>
            <div className="tb-more">
              <button type="button" className="tb-btn tb-btn--outline">
                {c.tours.cta}
              </button>
            </div>
          </div>
        </section>

        {/* deals */}
        <section className="tb-section">
          <div className="tb-container">
            <div className="tb-deals-wrap">
              <div className="tb-head">
                <small className="tb-eyebrow">{c.deals.eyebrow}</small>
                <h2>{c.deals.title}</h2>
                <p>{c.deals.sub}</p>
              </div>
              <div className="tb-deal-grid">
                {c.deals.items.map((d) => (
                  <div key={d.name} className="tb-deal">
                    <div className="tb-ph">
                      <span className="tb-save">{d.save}</span>
                    </div>
                    <div className="tb-deal-body">
                      <b>{d.name}</b>
                      <small>{d.nights}</small>
                      <div className="tb-deal-foot">
                        <span className="tb-price">
                          {d.price} <s>{d.was}</s>
                        </span>
                        <button type="button" className="tb-btn tb-btn--primary">
                          {c.deals.cta}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* newsletter band + stats */}
        <section className="tb-section" style={{ paddingTop: 0 }}>
          <div className="tb-container">
            <div className="tb-band">
              <div>
                <h2>
                  {c.inbox.titleA}
                  <br />
                  {c.inbox.titleB}
                </h2>
                <p>{c.inbox.sub}</p>
                <div className="tb-inbox-form">
                  <input placeholder={c.inbox.placeholder} readOnly />
                  <button type="button" className="tb-btn tb-btn--accent">
                    {c.inbox.cta}
                  </button>
                </div>
              </div>
              <div className="tb-band-art">{c.inbox.art}</div>
            </div>
            <div className="tb-stats">
              {c.inbox.stats.map((s) => (
                <div key={s.label} className="tb-stat">
                  <span>{s.icon}</span>
                  <div>
                    <strong>{s.value}</strong>
                    <small>{s.label}</small>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* packages */}
        <section className="tb-section">
          <div className="tb-container">
            <div className="tb-head">
              <small className="tb-eyebrow">{c.packages.eyebrow}</small>
              <h2>{c.packages.title}</h2>
              <p>{c.packages.sub}</p>
            </div>
            <div className="tb-pkg-grid">
              {c.packages.items.map((p) => (
                <div key={p.name} className="tb-pkg">
                  <div className="tb-ph">
                    <span className="tb-tag">{p.price}</span>
                  </div>
                  <b>{p.name}</b>
                  <small>{p.nights}</small>
                  <div className="tb-pkg-icons">{p.icons}</div>
                  <button type="button" className="tb-btn tb-btn--outline tb-btn--full">
                    {p.cta}
                  </button>
                </div>
              ))}
            </div>
            <div className="tb-impact">
              {c.packages.impact.map((s) => (
                <div key={s.label} className="tb-item">
                  <span className="tb-emoji">{s.icon}</span>
                  <div>
                    <strong>{s.value}</strong>
                    <small>{s.label}</small>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* memorable */}
        <section className="tb-section">
          <div className="tb-container tb-mem">
            <div>
              <small className="tb-eyebrow">{c.memorable.eyebrow}</small>
              <h2>{c.memorable.title}</h2>
              <p>{c.memorable.sub}</p>
              <div className="tb-mem-grid">
                {c.memorable.feats.map((f) => (
                  <div key={f.title} className="tb-mf">
                    <span className="tb-ic">{f.icon}</span>
                    <b>{f.title}</b>
                    <small>{f.text}</small>
                  </div>
                ))}
              </div>
            </div>
            <div className="tb-ph tb-mem-art">{c.memorable.art}</div>
          </div>
        </section>

        {/* reviews */}
        <section className="tb-section tb-section--alt">
          <div className="tb-container">
            <div className="tb-head">
              <small className="tb-eyebrow">{c.reviews.eyebrow}</small>
              <h2>{c.reviews.title}</h2>
              <p>{c.reviews.sub}</p>
            </div>
            <div className="tb-rev-grid">
              {c.reviews.items.map((r) => (
                <div key={r.name} className="tb-rev">
                  <div className="tb-rev-head">
                    <span className="tb-av" />
                    <div>
                      <b>{r.name}</b>
                      <small>{r.country}</small>
                    </div>
                  </div>
                  <p>“{r.quote}”</p>
                  <div className="tb-stars">★★★★★</div>
                </div>
              ))}
            </div>
            <div className="tb-more">
              <button type="button" className="tb-btn tb-btn--outline">
                {c.reviews.cta}
              </button>
            </div>
          </div>
        </section>

        {/* takeoff */}
        <section className="tb-section" style={{ paddingBottom: 0 }}>
          <div className="tb-container tb-takeoff">
            <div>
              <h2>{c.takeoff.title}</h2>
              <p>{c.takeoff.sub}</p>
              <button type="button" className="tb-btn tb-btn--accent">
                {c.takeoff.cta}
              </button>
            </div>
            <div className="tb-takeoff-art">{c.takeoff.art}</div>
          </div>
        </section>

        {/* blog */}
        <section className="tb-section">
          <div className="tb-container">
            <div className="tb-head">
              <small className="tb-eyebrow">{c.blog.eyebrow}</small>
              <h2>{c.blog.title}</h2>
              <p>{c.blog.sub}</p>
            </div>
            <div className="tb-blog-grid">
              {c.blog.items.map((b) => (
                <div key={b.title} className="tb-blog">
                  <div className="tb-ph" />
                  <small>{b.date}</small>
                  <h4>{b.title}</h4>
                  <a href="#sw-tour">Read More →</a>
                </div>
              ))}
            </div>
            <div className="tb-more">
              <button type="button" className="tb-btn tb-btn--outline">
                {c.blog.cta}
              </button>
            </div>
          </div>
        </section>

        {/* footer */}
        <footer className="tb-footer">
          <div className="tb-container tb-foot-grid">
            <div>
              <a href="#sw-tour" className="tb-brand" style={{ color: 'var(--fx-color-on-secondary)' }}>
                {c.brand}
              </a>
              <p className="tb-foot-about">{c.footer.about}</p>
              <div className="tb-socials">
                {c.footer.socials.map((s, i) => (
                  <span key={i}>{s}</span>
                ))}
              </div>
            </div>
            {c.footer.columns.map((col) => (
              <div key={col.title} className="tb-foot-col">
                <h4>{col.title}</h4>
                {col.links.map((l) => (
                  <a key={l} href="#sw-tour">
                    {l}
                  </a>
                ))}
              </div>
            ))}
            <div className="tb-foot-col">
              <h4>{c.footer.newsletter.title}</h4>
              <p>{c.footer.newsletter.sub}</p>
              <div className="tb-news">
                <input placeholder={c.footer.newsletter.placeholder} readOnly />
                <button type="button" aria-label="Subscribe">
                  ➤
                </button>
              </div>
            </div>
          </div>
          <div className="tb-container tb-foot-bottom">
            <span>{c.footer.copyright}</span>
            <span>{c.footer.pay}</span>
          </div>
        </footer>
      </div>
    </div>
  );
}

/* Control chrome — not part of the scanned page stylesheet, but token-styled all
 * the same so the panel matches the theme it drives. */
const SWITCHER_CSS = `
.tour-live { position: relative; }
.tl-switcher { position: fixed; top: 96px; right: 0; z-index: 40; display: flex; align-items: flex-start; }
.tl-toggle { width: 44px; height: 44px; border: none; border-radius: var(--fx-radius-md) 0 0 var(--fx-radius-md); background: var(--fx-color-primary); color: var(--fx-color-on-primary); font-size: 1.15rem; cursor: pointer; box-shadow: var(--fx-shadow-lg); }
.tl-panel { position: absolute; top: 0; right: 44px; width: 216px; padding: var(--fx-space-4); background: var(--fx-color-surface); color: var(--fx-color-text); border: 1px solid var(--fx-color-border); border-radius: var(--fx-radius-lg) 0 0 var(--fx-radius-lg); box-shadow: var(--fx-shadow-xl); opacity: 0; transform: translateX(8px); pointer-events: none; transition: opacity 0.25s ease, transform 0.25s ease; }
.tl-switcher.is-open .tl-panel { opacity: 1; transform: translateX(0); pointer-events: auto; }
.tl-title { margin: 0 0 var(--fx-space-3); font-weight: 700; }
.tl-presets { display: flex; gap: var(--fx-space-2); margin-bottom: var(--fx-space-4); }
.tl-swatch { width: 36px; height: 36px; border-radius: var(--fx-radius-md); border: 2px solid var(--fx-color-border); cursor: pointer; transition: transform 0.15s ease; }
.tl-swatch:hover { transform: scale(1.08); }
.tl-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: var(--fx-space-2); color: var(--fx-color-text-muted); }
.tl-row input { width: 40px; height: 26px; padding: 0; border: none; background: none; cursor: pointer; }
.tl-contrast { margin: var(--fx-space-2) 0 0; padding-top: var(--fx-space-2); border-top: 1px solid var(--fx-color-border); color: var(--fx-color-danger); }
.tl-contrast.is-pass { color: var(--fx-color-success); }
@media (max-width: 960px) { .tl-switcher { top: 72px; } }
`;
