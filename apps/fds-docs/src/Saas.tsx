'use client';

/**
 * The SaaS product landing page, live.
 *
 * The structure below is styled entirely by `SAAS_CSS` (in `saasCss.ts`, scanned at build
 * time so every value is a real `--fx-*` token). This component adds the one
 * thing a static screen can't show: recolouring the WHOLE product marketing
 * site from a tiny brand, the way a real user would.
 *
 * Three inputs → one theme. `applyBrand` derives the primary and secondary
 * families (hover/active/on-colours, all AA-checked); the emerald accent
 * re-points the `color.warning` token, its text colour derived by the SAME
 * `readableOn` contrast rule applyBrand uses — so the accent is honest, not a
 * hand-picked pair. The result is emitted as a NAMED theme, scoping its
 * variables to `[data-fx-theme="saas"]` so they never fight the docs chrome,
 * and the page re-themes instantly. Dark-mode overrides are dropped
 * (`modes: []`) to keep the marketing page light, exactly as designed.
 */
import { useMemo, useState, type ReactElement } from 'react';
import { applyBrand, readableOn, type Brand } from '@flexa/core';
import { checkThemeContrast, defaultTheme, emitTheme, type Theme } from 'flexa-design-system';

export interface SaasContent {
  brand: string;
  nav: string[];
  signIn: string;
  getStarted: string;
  hero: {
    badgeTag: string;
    badgeText: string;
    titleA: string;
    titleHi: string;
    titleB: string;
    sub: string;
    ctaPrimary: string;
    ctaSecondary: string;
    panelLabel: string;
    panelRows: { label: string; value: string; done?: boolean }[];
    panelStats: { value: string; label: string }[];
  };
  trusted: { label: string; logos: string[] };
  features: {
    eyebrow: string;
    title: string;
    sub: string;
    items: { icon: string; title: string; text: string }[];
  };
  workflow: {
    eyebrow: string;
    title: string;
    sub: string;
    steps: { num: string; title: string; text: string }[];
  };
  splits: {
    eyebrow: string;
    title: string;
    sub: string;
    rows: { art: string; title: string; text: string; points: string[] }[];
  };
  metrics: {
    title: string;
    sub: string;
    items: { value: string; label: string }[];
  };
  integrations: {
    eyebrow: string;
    title: string;
    sub: string;
    items: { icon: string; name: string }[];
  };
  pricing: {
    eyebrow: string;
    title: string;
    sub: string;
    tiers: {
      name: string;
      price: string;
      per: string;
      note: string;
      features: string[];
      cta: string;
      featured?: boolean;
      badge?: string;
    }[];
  };
  testimonials: {
    eyebrow: string;
    title: string;
    sub: string;
    items: { name: string; role: string; quote: string }[];
  };
  cta: { title: string; sub: string; button: string };
  footer: {
    about: string;
    socials: string[];
    columns: { title: string; links: string[] }[];
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
  { label: 'Indigo', p: '#4f46e5', s: '#1e1b4b', a: '#22c55e' },
  { label: 'Ocean', p: '#2563eb', s: '#0f1f4b', a: '#22d3ee' },
  { label: 'Violet', p: '#7c3aed', s: '#241046', a: '#22c55e' },
  { label: 'Emerald', p: '#0d9488', s: '#0c2624', a: '#34d399' },
];

export function Saas({ c }: { c: SaasContent }): ReactElement {
  const [primary, setPrimary] = useState('#4f46e5');
  const [secondary, setSecondary] = useState('#1e1b4b');
  const [accent, setAccent] = useState('#22c55e');
  const [panelOpen, setPanelOpen] = useState(true);
  const [navOpen, setNavOpen] = useState(false);

  const theme = useMemo<Theme>(() => {
    const brand: Brand = { primaryColor: primary, secondaryColor: secondary };
    const derived = applyBrand(defaultTheme(), brand);
    // Re-point the emerald accent (color.warning) and derive its text by contrast.
    const base = derived.base.map((t) =>
      t.cssVar === '--fx-color-warning'
        ? { ...t, value: accent }
        : t.cssVar === '--fx-color-on-warning'
          ? { ...t, value: readableOn(accent) }
          : t,
    );
    return { ...derived, name: 'saas', modes: [], base };
  }, [primary, secondary, accent]);

  const css = useMemo(() => emitTheme(theme), [theme]);
  const failures = useMemo(() => checkThemeContrast(theme), [theme]);

  const applyPreset = (pre: Preset) => {
    setPrimary(pre.p);
    setSecondary(pre.s);
    setAccent(pre.a);
  };

  return (
    <div className="saas-live">
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
        <div className="sl-panel" data-fx-theme="saas">
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

      <div id="sw-saas" data-fx-theme="saas" data-fx-type="flexa/root">
        {/* header */}
        <header className="sa-header">
          <div className="sa-container sa-nav">
            <a href="#sw-saas" className="sa-brand">
              {c.brand}
            </a>
            <nav className={`sa-links${navOpen ? ' is-open' : ''}`}>
              {c.nav.map((item, i) => (
                <a key={item} href="#sw-saas" className={i === 0 ? 'is-active' : undefined}>
                  {item}
                </a>
              ))}
            </nav>
            <div className="sa-navright">
              <a href="#sw-saas" className="sa-login">
                {c.signIn}
              </a>
              <button type="button" className="sa-btn sa-btn--primary sa-btn--sm">
                {c.getStarted}
              </button>
            </div>
            <button
              type="button"
              className="sa-burger"
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
        <section className="sa-hero">
          <div className="sa-container sa-hero-inner">
            <div className="sa-hero-text">
              <span className="sa-badge">
                <span className="sa-badge-tag">{c.hero.badgeTag}</span>
                {c.hero.badgeText}
              </span>
              <h1>
                {c.hero.titleA}
                <br />
                <span className="sa-hl">{c.hero.titleHi}</span>
                <br />
                {c.hero.titleB}
              </h1>
              <p>{c.hero.sub}</p>
              <div className="sa-hero-cta">
                <button type="button" className="sa-btn sa-btn--primary">
                  {c.hero.ctaPrimary}
                </button>
                <button type="button" className="sa-btn sa-btn--outline">
                  {c.hero.ctaSecondary}
                </button>
              </div>
            </div>
            <div className="sa-hero-panel">
              <div className="sa-panel-head">
                <span className="sa-dot" />
                <span className="sa-dot" />
                <span className="sa-dot" />
                <small>{c.hero.panelLabel}</small>
              </div>
              <div className="sa-panel-rows">
                {c.hero.panelRows.map((r) => (
                  <div key={r.label} className="sa-panel-row">
                    <span>{r.label}</span>
                    <span className={r.done ? 'sa-hl-t' : undefined}>{r.value}</span>
                  </div>
                ))}
              </div>
              <div className="sa-panel-stats">
                {c.hero.panelStats.map((s) => (
                  <div key={s.label}>
                    <strong>{s.value}</strong>
                    <small>{s.label}</small>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="sa-container sa-trust">
            <span className="sa-trust-label">{c.trusted.label}</span>
            <div className="sa-trust-logos">
              {c.trusted.logos.map((l) => (
                <span key={l}>{l}</span>
              ))}
            </div>
          </div>
        </section>

        {/* features */}
        <section className="sa-section">
          <div className="sa-container">
            <div className="sa-head">
              <small className="sa-eyebrow">{c.features.eyebrow}</small>
              <h2>{c.features.title}</h2>
              <p>{c.features.sub}</p>
            </div>
            <div className="sa-feat-grid">
              {c.features.items.map((f) => (
                <div key={f.title} className="sa-feat">
                  <span className="sa-ic">{f.icon}</span>
                  <b>{f.title}</b>
                  <p>{f.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* how it works / workflow */}
        <section className="sa-section sa-section--alt">
          <div className="sa-container">
            <div className="sa-head">
              <small className="sa-eyebrow">{c.workflow.eyebrow}</small>
              <h2>{c.workflow.title}</h2>
              <p>{c.workflow.sub}</p>
            </div>
            <div className="sa-flow-grid">
              {c.workflow.steps.map((s) => (
                <div key={s.num} className="sa-flow">
                  <span className="sa-flow-num">{s.num}</span>
                  <b>{s.title}</b>
                  <p>{s.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* big feature splits */}
        <section className="sa-section">
          <div className="sa-container">
            <div className="sa-head">
              <small className="sa-eyebrow">{c.splits.eyebrow}</small>
              <h2>{c.splits.title}</h2>
              <p>{c.splits.sub}</p>
            </div>
            {c.splits.rows.map((row, i) => (
              <div key={row.title} className={`sa-split${i % 2 === 1 ? ' is-reverse' : ''}`}>
                <div className="sa-ph sa-split-art">{row.art}</div>
                <div className="sa-split-copy">
                  <h3>{row.title}</h3>
                  <p>{row.text}</p>
                  <ul className="sa-ticks">
                    {row.points.map((p) => (
                      <li key={p}>{p}</li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* metrics band (dark) */}
        <section className="sa-section" style={{ paddingTop: 0 }}>
          <div className="sa-container">
            <div className="sa-metrics">
              <div className="sa-metrics-head">
                <h2>{c.metrics.title}</h2>
                <p>{c.metrics.sub}</p>
              </div>
              <div className="sa-metrics-grid">
                {c.metrics.items.map((m) => (
                  <div key={m.label} className="sa-metric">
                    <strong>{m.value}</strong>
                    <small>{m.label}</small>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* integrations */}
        <section className="sa-section sa-section--alt">
          <div className="sa-container">
            <div className="sa-head">
              <small className="sa-eyebrow">{c.integrations.eyebrow}</small>
              <h2>{c.integrations.title}</h2>
              <p>{c.integrations.sub}</p>
            </div>
            <div className="sa-int-grid">
              {c.integrations.items.map((it) => (
                <div key={it.name} className="sa-int">
                  <span className="sa-int-ic">{it.icon}</span>
                  <b>{it.name}</b>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* pricing */}
        <section className="sa-section">
          <div className="sa-container">
            <div className="sa-head">
              <small className="sa-eyebrow">{c.pricing.eyebrow}</small>
              <h2>{c.pricing.title}</h2>
              <p>{c.pricing.sub}</p>
            </div>
            <div className="sa-price-grid">
              {c.pricing.tiers.map((t) => (
                <div key={t.name} className={`sa-price${t.featured ? ' is-featured' : ''}`}>
                  {t.badge ? <span className="sa-pop">{t.badge}</span> : null}
                  <b className="sa-price-name">{t.name}</b>
                  <div className="sa-price-amt">
                    {t.price}
                    <span>{t.per}</span>
                  </div>
                  <small className="sa-price-note">{t.note}</small>
                  <ul className="sa-price-feats">
                    {t.features.map((f) => (
                      <li key={f}>{f}</li>
                    ))}
                  </ul>
                  <button
                    type="button"
                    className={`sa-btn sa-btn--full ${t.featured ? 'sa-btn--primary' : 'sa-btn--outline'}`}
                  >
                    {t.cta}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* testimonials */}
        <section className="sa-section sa-section--alt">
          <div className="sa-container">
            <div className="sa-head">
              <small className="sa-eyebrow">{c.testimonials.eyebrow}</small>
              <h2>{c.testimonials.title}</h2>
              <p>{c.testimonials.sub}</p>
            </div>
            <div className="sa-testi-grid">
              {c.testimonials.items.map((r, i) => (
                <div key={r.name} className={`sa-testi${i === 1 ? ' is-featured' : ''}`}>
                  <div className="sa-testi-head">
                    <span className="sa-av" />
                    <div>
                      <b>{r.name}</b>
                      <small>{r.role}</small>
                    </div>
                  </div>
                  <div className="sa-stars">★★★★★</div>
                  <p>“{r.quote}”</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* final CTA band (dark) */}
        <section className="sa-section" style={{ paddingBottom: 0 }}>
          <div className="sa-container">
            <div className="sa-cta">
              <div>
                <h2>{c.cta.title}</h2>
                <p>{c.cta.sub}</p>
              </div>
              <button type="button" className="sa-btn sa-btn--accent">
                {c.cta.button}
              </button>
            </div>
          </div>
        </section>

        {/* footer */}
        <footer className="sa-footer">
          <div className="sa-container sa-foot-grid">
            <div>
              <a
                href="#sw-saas"
                className="sa-brand"
                style={{ color: 'var(--fx-color-on-secondary)' }}
              >
                {c.brand}
              </a>
              <p className="sa-foot-about">{c.footer.about}</p>
              <div className="sa-socials">
                {c.footer.socials.map((s, i) => (
                  <span key={i}>{s}</span>
                ))}
              </div>
            </div>
            {c.footer.columns.map((col) => (
              <div key={col.title} className="sa-foot-col">
                <h4>{col.title}</h4>
                {col.links.map((l) => (
                  <a key={l} href="#sw-saas">
                    {l}
                  </a>
                ))}
              </div>
            ))}
          </div>
          <div className="sa-container sa-foot-bottom">
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
.saas-live { position: relative; }
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

