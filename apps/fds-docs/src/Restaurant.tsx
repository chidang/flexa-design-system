'use client';

/**
 * The restaurant landing page, live.
 *
 * The structure below is styled entirely by `RESTAURANT_CSS` (in `restaurantCss.ts`,
 * scanned at build time so every value is a real `--fx-*` token). This component
 * adds the one thing a static screen can't show: recolouring the WHOLE site from
 * a tiny brand, the way a real restaurateur would.
 *
 * Three inputs → one theme. `applyBrand` derives the primary and secondary
 * families (hover/active/on-colours, all AA-checked); the warm accent re-points
 * the `color.warning` token — used for prices, ratings, badges and the reserve
 * button — its text colour derived by the SAME `readableOn` contrast rule
 * applyBrand uses, so the accent is honest, not a hand-picked pair. The result is
 * emitted as a NAMED theme scoping its variables to `[data-fx-theme="restaurant"]`
 * so they never fight the docs chrome, and the page re-themes instantly.
 * Dark-mode overrides are dropped (`modes: []`) to keep the menu warm and light.
 */
import { useMemo, useState, type ReactElement } from 'react';
import { applyBrand, readableOn, type Brand } from '@flexa/core';
import { checkThemeContrast, defaultTheme, emitTheme, type Theme } from 'flexa-design-system';

export interface RestaurantContent {
  brand: string;
  nav: string[];
  reserve: string;
  hero: {
    titleA: string;
    titleHi: string;
    titleB: string;
    sub: string;
    ctaPrimary: string;
    ctaOutline: string;
    rating: string;
    ratingLabel: string;
    dishes: { icon: string; title: string; text: string }[];
    art: string;
  };
  highlights: { icon: string; title: string; text: string }[];
  popular: {
    eyebrow: string;
    title: string;
    sub: string;
    items: { icon: string; name: string; text: string; price: string; tag?: string }[];
    cta: string;
  };
  story: {
    eyebrow: string;
    title: string;
    body: string;
    points: string[];
    signature: string;
    role: string;
    art: string;
    stats: { value: string; label: string }[];
  };
  specialties: {
    eyebrow: string;
    title: string;
    sub: string;
    items: { icon: string; name: string; text: string }[];
  };
  gallery: {
    eyebrow: string;
    title: string;
    sub: string;
    items: { icon: string; label: string }[];
  };
  booking: {
    eyebrow: string;
    title: string;
    sub: string;
    fields: { label: string; value: string }[];
    submit: string;
    note: string;
  };
  reviews: {
    eyebrow: string;
    title: string;
    sub: string;
    items: { name: string; city: string; quote: string }[];
  };
  awards: { icon: string; value: string; label: string }[];
  cta: {
    title: string;
    sub: string;
    button: string;
    art: string;
  };
  footer: {
    about: string;
    socials: string[];
    columns: { title: string; links: string[] }[];
    hours: { title: string; rows: { day: string; time: string }[] };
    copyright: string;
    tagline: string;
  };
}

interface Preset {
  label: string;
  p: string;
  s: string;
  a: string;
}
const PRESETS: Preset[] = [
  { label: 'Ember', p: '#c0392b', s: '#3a1210', a: '#e2b04a' },
  { label: 'Olive', p: '#5b7a45', s: '#23300f', a: '#e2b04a' },
  { label: 'Wine', p: '#8e2d4a', s: '#2c0f18', a: '#e0a94e' },
  { label: 'Amber', p: '#b5651d', s: '#2a1a0d', a: '#e8c15a' },
];

export function Restaurant({ c }: { c: RestaurantContent }): ReactElement {
  const [primary, setPrimary] = useState('#c0392b');
  const [secondary, setSecondary] = useState('#3a1210');
  const [accent, setAccent] = useState('#e2b04a');
  const [panelOpen, setPanelOpen] = useState(true);
  const [navOpen, setNavOpen] = useState(false);

  const theme = useMemo<Theme>(() => {
    const brand: Brand = { primaryColor: primary, secondaryColor: secondary };
    const derived = applyBrand(defaultTheme(), brand);
    // Re-point the warm accent (color.warning) and derive its text by contrast.
    const base = derived.base.map((t) =>
      t.cssVar === '--fx-color-warning'
        ? { ...t, value: accent }
        : t.cssVar === '--fx-color-on-warning'
          ? { ...t, value: readableOn(accent) }
          : t,
    );
    return { ...derived, name: 'restaurant', modes: [], base };
  }, [primary, secondary, accent]);

  const css = useMemo(() => emitTheme(theme), [theme]);
  const failures = useMemo(() => checkThemeContrast(theme), [theme]);

  const applyPreset = (pre: Preset) => {
    setPrimary(pre.p);
    setSecondary(pre.s);
    setAccent(pre.a);
  };

  return (
    <div className="rst-live">
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
        <div className="rl-panel" data-fx-theme="restaurant">
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

      <div id="sw-restaurant" data-fx-theme="restaurant" data-fx-type="flexa/root">
        {/* header */}
        <header className="rs-header">
          <div className="rs-container rs-nav">
            <a href="#sw-restaurant" className="rs-brand">
              {c.brand}
            </a>
            <nav className={`rs-links${navOpen ? ' is-open' : ''}`}>
              {c.nav.map((item, i) => (
                <a key={item} href="#sw-restaurant" className={i === 0 ? 'is-active' : undefined}>
                  {item}
                </a>
              ))}
            </nav>
            <div className="rs-navright">
              <button type="button" className="rs-btn rs-btn--accent">
                {c.reserve}
              </button>
            </div>
            <button
              type="button"
              className="rs-burger"
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
        <section className="rs-hero">
          <div className="rs-container rs-hero-inner">
            <div className="rs-hero-text">
              <h1>
                {c.hero.titleA}
                <span className="rs-hi">{c.hero.titleHi}</span>
                <br />
                {c.hero.titleB}
              </h1>
              <p>{c.hero.sub}</p>
              <div className="rs-hero-cta">
                <button type="button" className="rs-btn rs-btn--primary">
                  {c.hero.ctaPrimary}
                </button>
                <button type="button" className="rs-btn rs-btn--outline">
                  {c.hero.ctaOutline}
                </button>
              </div>
              <div className="rs-hero-rating">
                <span className="rs-stars">★★★★★</span>
                <strong>{c.hero.rating}</strong>
                <small>{c.hero.ratingLabel}</small>
              </div>
              <div className="rs-hero-dishes">
                {c.hero.dishes.map((d) => (
                  <div key={d.title} className="rs-hd">
                    <span className="rs-hd-img">{d.icon}</span>
                    <div>
                      <b>{d.title}</b>
                      <small>{d.text}</small>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="rs-ph rs-hero-img">{c.hero.art}</div>
          </div>
        </section>

        {/* highlights strip */}
        <section className="rs-strip">
          <div className="rs-container rs-strip-grid">
            {c.highlights.map((h) => (
              <div key={h.title} className="rs-high">
                <span className="rs-ic">{h.icon}</span>
                <div>
                  <b>{h.title}</b>
                  <small>{h.text}</small>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* popular menu grid */}
        <section className="rs-section" id="menu">
          <div className="rs-container">
            <div className="rs-head">
              <small className="rs-eyebrow">{c.popular.eyebrow}</small>
              <h2>{c.popular.title}</h2>
              <p>{c.popular.sub}</p>
            </div>
            <div className="rs-dish-grid">
              {c.popular.items.map((d) => (
                <div key={d.name} className="rs-dish">
                  <div className="rs-ph rs-dish-img">
                    <span className="rs-dish-emoji">{d.icon}</span>
                    {d.tag ? <span className="rs-tag">{d.tag}</span> : null}
                  </div>
                  <div className="rs-dish-body">
                    <b>{d.name}</b>
                    <small>{d.text}</small>
                    <div className="rs-dish-foot">
                      <span className="rs-price">{d.price}</span>
                      <button type="button" className="rs-btn rs-btn--primary rs-btn--sm">
                        {c.popular.cta}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* our story / chef split */}
        <section className="rs-section rs-section--alt">
          <div className="rs-container rs-story">
            <div className="rs-ph rs-story-art">{c.story.art}</div>
            <div className="rs-story-text">
              <small className="rs-eyebrow">{c.story.eyebrow}</small>
              <h2>{c.story.title}</h2>
              <p>{c.story.body}</p>
              <ul className="rs-points">
                {c.story.points.map((p) => (
                  <li key={p}>
                    <span className="rs-check">✓</span>
                    {p}
                  </li>
                ))}
              </ul>
              <div className="rs-sign">
                <b>{c.story.signature}</b>
                <small>{c.story.role}</small>
              </div>
              <div className="rs-story-stats">
                {c.story.stats.map((s) => (
                  <div key={s.label} className="rs-sstat">
                    <strong>{s.value}</strong>
                    <small>{s.label}</small>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* specialties / categories */}
        <section className="rs-section">
          <div className="rs-container">
            <div className="rs-head">
              <small className="rs-eyebrow">{c.specialties.eyebrow}</small>
              <h2>{c.specialties.title}</h2>
              <p>{c.specialties.sub}</p>
            </div>
            <div className="rs-spec-grid">
              {c.specialties.items.map((s) => (
                <div key={s.name} className="rs-spec">
                  <span className="rs-emoji">{s.icon}</span>
                  <b>{s.name}</b>
                  <p>{s.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* gallery grid */}
        <section className="rs-section rs-section--alt">
          <div className="rs-container">
            <div className="rs-head">
              <small className="rs-eyebrow">{c.gallery.eyebrow}</small>
              <h2>{c.gallery.title}</h2>
              <p>{c.gallery.sub}</p>
            </div>
            <div className="rs-gal-grid">
              {c.gallery.items.map((g, i) => (
                <div key={i} className={`rs-ph rs-gal rs-gal--${i}`}>
                  <span className="rs-gal-emoji">{g.icon}</span>
                  <span className="rs-gal-label">{g.label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* reservation / booking band */}
        <section className="rs-section" id="reserve">
          <div className="rs-container">
            <div className="rs-book">
              <div className="rs-book-head">
                <small className="rs-eyebrow rs-eyebrow--light">{c.booking.eyebrow}</small>
                <h2>{c.booking.title}</h2>
                <p>{c.booking.sub}</p>
              </div>
              <div className="rs-book-form">
                <div className="rs-book-fields">
                  {c.booking.fields.map((f) => (
                    <div key={f.label} className="rs-field">
                      <label>{f.label}</label>
                      <input placeholder={f.value} readOnly />
                    </div>
                  ))}
                </div>
                <button type="button" className="rs-btn rs-btn--accent rs-btn--full">
                  {c.booking.submit}
                </button>
                <small className="rs-book-note">{c.booking.note}</small>
              </div>
            </div>
          </div>
        </section>

        {/* reviews */}
        <section className="rs-section">
          <div className="rs-container">
            <div className="rs-head">
              <small className="rs-eyebrow">{c.reviews.eyebrow}</small>
              <h2>{c.reviews.title}</h2>
              <p>{c.reviews.sub}</p>
            </div>
            <div className="rs-rev-grid">
              {c.reviews.items.map((r) => (
                <div key={r.name} className="rs-rev">
                  <div className="rs-stars">★★★★★</div>
                  <p>“{r.quote}”</p>
                  <div className="rs-rev-head">
                    <span className="rs-av" />
                    <div>
                      <b>{r.name}</b>
                      <small>{r.city}</small>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* awards strip */}
        <section className="rs-section rs-section--tight">
          <div className="rs-container">
            <div className="rs-awards">
              {c.awards.map((a) => (
                <div key={a.label} className="rs-award">
                  <span className="rs-emoji">{a.icon}</span>
                  <div>
                    <strong>{a.value}</strong>
                    <small>{a.label}</small>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA band */}
        <section className="rs-section" style={{ paddingBottom: 0 }}>
          <div className="rs-container rs-cta">
            <div>
              <h2>{c.cta.title}</h2>
              <p>{c.cta.sub}</p>
              <button type="button" className="rs-btn rs-btn--accent">
                {c.cta.button}
              </button>
            </div>
            <div className="rs-cta-art">{c.cta.art}</div>
          </div>
        </section>

        {/* footer */}
        <footer className="rs-footer">
          <div className="rs-container rs-foot-grid">
            <div>
              <a
                href="#sw-restaurant"
                className="rs-brand"
                style={{ color: 'var(--fx-color-on-secondary)' }}
              >
                {c.brand}
              </a>
              <p className="rs-foot-about">{c.footer.about}</p>
              <div className="rs-socials">
                {c.footer.socials.map((s, i) => (
                  <span key={i}>{s}</span>
                ))}
              </div>
            </div>
            {c.footer.columns.map((col) => (
              <div key={col.title} className="rs-foot-col">
                <h4>{col.title}</h4>
                {col.links.map((l) => (
                  <a key={l} href="#sw-restaurant">
                    {l}
                  </a>
                ))}
              </div>
            ))}
            <div className="rs-foot-col">
              <h4>{c.footer.hours.title}</h4>
              {c.footer.hours.rows.map((h) => (
                <div key={h.day} className="rs-hour">
                  <span>{h.day}</span>
                  <span className="rs-hour-time">{h.time}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="rs-container rs-foot-bottom">
            <span>{c.footer.copyright}</span>
            <span>{c.footer.tagline}</span>
          </div>
        </footer>
      </div>
    </div>
  );
}

/* Control chrome — not part of the scanned page stylesheet, but token-styled all
 * the same so the panel matches the theme it drives. */
const SWITCHER_CSS = `
.rst-live { position: relative; }
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
