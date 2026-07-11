/**
 * The showcase gallery's stylesheets and renderers.
 *
 * Each screen (pricing, landing, sign-in) has ONE stylesheet that is both
 * injected into its page and scanned by `usedTokens()` (reused from the example
 * dashboard). Every value carrying design intent is an `--fx-*` token — the
 * "build real UI with just tokens" claim widened past the dashboard to the
 * marketing/app surfaces people judge a design system by first (Track F,
 * doc 20). Type is left to FDS base typography, so there is no hand-picked
 * font-size on any screen either.
 *
 * Structure (JSX) lives here beside the CSS; copy and sample data live in
 * `content/showcase.json` behind the `content.ts` CMS seam. An off-system value
 * would surface on the page as a failure rather than drift silently.
 */
import type { ReactElement } from 'react';
import type { LandingContent, PricingContent, SignInContent } from './content';
import { loadShowcase, loadShowcaseScreen } from './content';
import { TourBooking } from './TourBooking';
import { Restaurant, type RestaurantContent } from './Restaurant';
import { RealEstate, type RealEstateContent } from './RealEstate';
import { Saas, type SaasContent } from './Saas';
import { Spa, type SpaContent } from './Spa';
import { RESTAURANT_CSS } from './restaurantCss';
import { REALESTATE_CSS } from './realEstateCss';
import { SAAS_CSS } from './saasCss';
import { SPA_CSS } from './spaCss';

/* ── Pricing ─────────────────────────────────────────────────────────────── */

export const PRICING_CSS = `
#sw-pricing { display: flex; flex-direction: column; gap: var(--fx-space-6); }
#sw-pricing .pr-intro { display: flex; flex-direction: column; gap: var(--fx-space-2); }
#sw-pricing .pr-intro h3 { margin: 0; }
#sw-pricing .pr-intro p { margin: 0; color: var(--fx-color-text-muted); }
#sw-pricing .pr-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: var(--fx-space-5);
}
#sw-pricing .pr-tier {
  display: flex;
  flex-direction: column;
  gap: var(--fx-space-4);
  background: var(--fx-color-surface);
  border: 1px solid var(--fx-color-border);
  border-radius: var(--fx-radius-xl);
  padding: var(--fx-space-6);
  box-shadow: var(--fx-shadow-sm);
}
#sw-pricing .pr-featured { border-color: var(--fx-color-primary); box-shadow: var(--fx-shadow-lg); }
#sw-pricing .pr-badge {
  align-self: flex-start;
  color: var(--fx-color-on-primary);
  background: var(--fx-color-primary);
  border-radius: var(--fx-radius-full);
  padding: 0 var(--fx-space-3);
}
#sw-pricing .pr-name { margin: 0; }
#sw-pricing .pr-price { display: flex; align-items: baseline; gap: var(--fx-space-2); }
#sw-pricing .pr-amount { margin: 0; font-family: var(--fx-font-family-heading); }
#sw-pricing .pr-per { color: var(--fx-color-text-muted); }
#sw-pricing .pr-feats {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: var(--fx-space-2);
}
#sw-pricing .pr-feats li { position: relative; padding-left: var(--fx-space-5); }
#sw-pricing .pr-feats li::before { content: "✓"; position: absolute; left: 0; color: var(--fx-color-primary); }
#sw-pricing .pr-cta {
  margin-top: auto;
  border: none;
  cursor: pointer;
  text-align: center;
  border-radius: var(--fx-radius-md);
  padding: var(--fx-space-3) var(--fx-space-5);
  color: var(--fx-color-on-primary);
  background: var(--fx-color-primary);
}
#sw-pricing .pr-cta:hover { background: var(--fx-color-primary-hover); }
#sw-pricing .pr-ghost {
  color: var(--fx-color-text);
  background: transparent;
  border: 1px solid var(--fx-color-border-strong);
}
#sw-pricing .pr-ghost:hover { background: var(--fx-color-surface-alt); }
`;

function Pricing({ c }: { c: PricingContent }): ReactElement {
  return (
    <div id="sw-pricing" data-fx-type="flexa/root">
      <div className="pr-intro">
        <h3>{c.heading}</h3>
        <p>{c.sub}</p>
      </div>
      <div className="pr-grid">
        {c.tiers.map((t) => (
          <div className={`pr-tier${t.featured ? ' pr-featured' : ''}`} key={t.name}>
            {t.badge ? <span className="pr-badge">{t.badge}</span> : null}
            <h4 className="pr-name">{t.name}</h4>
            <div className="pr-price">
              <h3 className="pr-amount">{t.amount}</h3>
              {t.per ? <span className="pr-per">{t.per}</span> : null}
            </div>
            <ul className="pr-feats">
              {t.features.map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>
            <button type="button" className={t.featured ? 'pr-cta' : 'pr-cta pr-ghost'}>
              {t.cta}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Landing hero ────────────────────────────────────────────────────────── */

export const LANDING_CSS = `
#sw-landing { display: flex; flex-direction: column; gap: var(--fx-space-10); }
#sw-landing .ld-hero {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--fx-space-5);
  background: var(--fx-color-surface);
  border: 1px solid var(--fx-color-border);
  border-radius: var(--fx-radius-2xl);
  padding: var(--fx-space-12) var(--fx-space-8);
  box-shadow: var(--fx-shadow-md);
}
#sw-landing .ld-eyebrow { color: var(--fx-color-primary); font-weight: 600; }
#sw-landing .ld-title { margin: 0; max-width: 26ch; }
#sw-landing .ld-sub { margin: 0; max-width: 52ch; color: var(--fx-color-text-muted); }
#sw-landing .ld-actions { display: flex; flex-wrap: wrap; gap: var(--fx-space-3); }
#sw-landing .ld-btn {
  border: none;
  cursor: pointer;
  border-radius: var(--fx-radius-md);
  padding: var(--fx-space-3) var(--fx-space-6);
  color: var(--fx-color-on-primary);
  background: var(--fx-color-primary);
}
#sw-landing .ld-btn:hover { background: var(--fx-color-primary-hover); }
#sw-landing .ld-ghost { color: var(--fx-color-text); background: var(--fx-color-surface-alt); }
#sw-landing .ld-ghost:hover { background: var(--fx-color-surface); }
#sw-landing .ld-feats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--fx-space-4);
}
#sw-landing .ld-feat {
  display: flex;
  flex-direction: column;
  gap: var(--fx-space-2);
  background: var(--fx-color-surface);
  border: 1px solid var(--fx-color-border);
  border-radius: var(--fx-radius-lg);
  padding: var(--fx-space-5);
}
#sw-landing .ld-icon {
  display: inline-grid;
  place-items: center;
  width: 2rem;
  height: 2rem;
  border-radius: var(--fx-radius-md);
  color: var(--fx-color-on-secondary);
  background: var(--fx-color-secondary);
}
#sw-landing .ld-feat h4 { margin: 0; }
#sw-landing .ld-feat p { margin: 0; color: var(--fx-color-text-muted); }
`;

function Landing({ c }: { c: LandingContent }): ReactElement {
  return (
    <div id="sw-landing" data-fx-type="flexa/root">
      <div className="ld-hero">
        <span className="ld-eyebrow">{c.eyebrow}</span>
        <h2 className="ld-title">{c.title}</h2>
        <p className="ld-sub">{c.sub}</p>
        <div className="ld-actions">
          <button type="button" className="ld-btn">
            {c.primaryCta}
          </button>
          <button type="button" className="ld-btn ld-ghost">
            {c.ghostCta}
          </button>
        </div>
      </div>
      <div className="ld-feats">
        {c.features.map((f) => (
          <div className="ld-feat" key={f.title}>
            <span className="ld-icon" aria-hidden>
              {f.icon}
            </span>
            <h4>{f.title}</h4>
            <p>{f.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Sign-in ─────────────────────────────────────────────────────────────── */

export const SIGNIN_CSS = `
#sw-signin {
  display: flex;
  justify-content: center;
  padding: var(--fx-space-8) var(--fx-space-4);
  background: var(--fx-color-surface-alt);
  border-radius: var(--fx-radius-xl);
}
#sw-signin .si-card {
  width: 100%;
  max-width: 24rem;
  display: flex;
  flex-direction: column;
  gap: var(--fx-space-5);
  background: var(--fx-color-surface);
  border: 1px solid var(--fx-color-border);
  border-radius: var(--fx-radius-xl);
  padding: var(--fx-space-8);
  box-shadow: var(--fx-shadow-lg);
}
#sw-signin .si-head { display: flex; flex-direction: column; gap: var(--fx-space-2); text-align: center; }
#sw-signin .si-head h3 { margin: 0; }
#sw-signin .si-head p { margin: 0; color: var(--fx-color-text-muted); }
#sw-signin .si-field { display: flex; flex-direction: column; gap: var(--fx-space-2); }
#sw-signin .si-label { color: var(--fx-color-text-subtle); }
#sw-signin .si-input {
  font-family: var(--fx-font-family-base);
  color: var(--fx-color-text);
  background: var(--fx-color-bg);
  border: 1px solid var(--fx-color-border-strong);
  border-radius: var(--fx-radius-md);
  padding: var(--fx-space-3) var(--fx-space-4);
}
#sw-signin .si-input:focus {
  outline: 2px solid var(--fx-color-focus-ring);
  outline-offset: 1px;
  border-color: var(--fx-color-primary);
}
#sw-signin .si-submit {
  border: none;
  cursor: pointer;
  border-radius: var(--fx-radius-md);
  padding: var(--fx-space-3) var(--fx-space-5);
  color: var(--fx-color-on-primary);
  background: var(--fx-color-primary);
}
#sw-signin .si-submit:hover { background: var(--fx-color-primary-hover); }
#sw-signin .si-divider { display: flex; align-items: center; gap: var(--fx-space-3); color: var(--fx-color-text-muted); }
#sw-signin .si-divider::before,
#sw-signin .si-divider::after { content: ""; flex: 1; height: 1px; background: var(--fx-color-border); }
#sw-signin .si-alt {
  border: 1px solid var(--fx-color-border-strong);
  cursor: pointer;
  border-radius: var(--fx-radius-md);
  padding: var(--fx-space-3) var(--fx-space-5);
  color: var(--fx-color-text);
  background: var(--fx-color-surface);
}
#sw-signin .si-alt:hover { background: var(--fx-color-surface-alt); }
#sw-signin .si-foot { text-align: center; color: var(--fx-color-text-muted); }
#sw-signin .si-foot a { color: var(--fx-color-primary); text-decoration: none; }
`;

function SignIn({ c }: { c: SignInContent }): ReactElement {
  return (
    <div id="sw-signin" data-fx-type="flexa/root">
      <div className="si-card">
        <div className="si-head">
          <h3>{c.title}</h3>
          <p>{c.sub}</p>
        </div>
        <label className="si-field">
          <span className="si-label">{c.emailLabel}</span>
          <input className="si-input" type="email" placeholder={c.emailPlaceholder} readOnly />
        </label>
        <label className="si-field">
          <span className="si-label">{c.passwordLabel}</span>
          <input className="si-input" type="password" placeholder={c.passwordPlaceholder} readOnly />
        </label>
        <button type="button" className="si-submit">
          {c.submit}
        </button>
        <div className="si-divider">{c.altLabel}</div>
        <button type="button" className="si-alt">
          {c.alt}
        </button>
        <p className="si-foot">
          {c.footPrompt} <a href="#">{c.footLink}</a>
        </p>
      </div>
    </div>
  );
}

/* ── Travel landing page ─────────────────────────────────────────────────────
 *
 * A full marketing homepage — the surface most people judge a design system by.
 * Every colour, space, radius and shadow below is an `--fx-*` token; type comes
 * from FDS base typography (no hand-picked font-size), so the ONLY hand-written
 * values are structural (breakpoints, min-heights, grid tracks). The markup and
 * the live three-colour brand recolouring live in `TourBooking.tsx`; this
 * stylesheet is what the build-time scanner reads, so a pixel-faithful clone of
 * a real travel template is proven to be 100% on-system.
 *
 * Three brand roles map onto real tokens: primary (links, eyebrows, outlines),
 * secondary (the dark hero/footer/impact bands), and the amber accent — the
 * `color.warning` status token, doubling as the marketing accent on the CTAs,
 * its text colour derived by the same contrast rule `applyBrand` uses.
 */
export const TOUR_CSS = `
#sw-tour {
  background: var(--fx-color-bg);
  color: var(--fx-color-text);
  border: 1px solid var(--fx-color-border);
  border-radius: var(--fx-radius-xl);
  overflow: hidden;
}
#sw-tour a { color: var(--fx-color-primary); text-decoration: none; }
#sw-tour .tb-container {
  width: 100%;
  max-width: var(--fx-size-container-lg);
  margin: 0 auto;
  padding: 0 var(--fx-space-6);
}
#sw-tour .tb-eyebrow {
  display: block;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-weight: 600;
  color: var(--fx-color-primary);
}
#sw-tour .tb-center { text-align: center; }
#sw-tour .tb-head { max-width: 560px; margin: 0 auto var(--fx-space-10); text-align: center; }
#sw-tour .tb-head h2 { margin: var(--fx-space-2) 0 var(--fx-space-3); }
#sw-tour .tb-head p { margin: 0; color: var(--fx-color-text-muted); }
#sw-tour .tb-more { margin-top: var(--fx-space-8); text-align: center; }

#sw-tour .tb-btn {
  display: inline-flex;
  align-items: center;
  gap: var(--fx-space-2);
  padding: var(--fx-space-3) var(--fx-space-6);
  border: none;
  border-radius: var(--fx-radius-md);
  font-family: var(--fx-font-family-base);
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}
#sw-tour .tb-btn:hover { transform: translateY(-2px); }
#sw-tour .tb-btn--accent { background: var(--fx-color-warning); color: var(--fx-color-on-warning); box-shadow: var(--fx-shadow-sm); }
#sw-tour .tb-btn--primary { background: var(--fx-color-primary); color: var(--fx-color-on-primary); }
#sw-tour .tb-btn--outline { background: transparent; color: var(--fx-color-primary); border: 1.5px solid var(--fx-color-border-strong); }
#sw-tour .tb-btn--full { width: 100%; justify-content: center; }

#sw-tour .tb-ph {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 80px;
  border-radius: var(--fx-radius-lg);
  color: var(--fx-color-on-primary);
  font-weight: 600;
  text-align: center;
  background: linear-gradient(135deg, var(--fx-color-primary), color-mix(in srgb, var(--fx-color-warning) 68%, var(--fx-color-primary)));
}

/* header */
#sw-tour .tb-header { position: sticky; top: 0; z-index: 50; background: var(--fx-color-surface); box-shadow: var(--fx-shadow-sm); }
#sw-tour .tb-nav { display: flex; align-items: center; justify-content: space-between; gap: var(--fx-space-4); padding: var(--fx-space-4) var(--fx-space-6); }
#sw-tour .tb-brand { font-family: var(--fx-font-family-heading); font-weight: 800; color: var(--fx-color-primary); }
#sw-tour .tb-links { display: flex; flex-wrap: wrap; gap: var(--fx-space-5); }
#sw-tour .tb-links a { color: var(--fx-color-text); font-weight: 500; }
#sw-tour .tb-links a.is-active { color: var(--fx-color-primary); }
#sw-tour .tb-navright { display: flex; align-items: center; gap: var(--fx-space-4); }
#sw-tour .tb-lang { color: var(--fx-color-text-muted); }
#sw-tour .tb-burger { display: none; flex-direction: column; gap: 5px; padding: var(--fx-space-2); background: none; border: none; cursor: pointer; }
#sw-tour .tb-burger span { width: 24px; height: 3px; border-radius: var(--fx-radius-full); background: var(--fx-color-secondary); }

/* hero */
#sw-tour .tb-hero { padding-bottom: var(--fx-space-10); }
#sw-tour .tb-hero-bg {
  display: flex;
  align-items: center;
  min-height: 420px;
  background:
    linear-gradient(115deg, color-mix(in srgb, var(--fx-color-secondary) 84%, transparent), color-mix(in srgb, var(--fx-color-primary) 32%, transparent)),
    linear-gradient(135deg, var(--fx-color-primary), color-mix(in srgb, var(--fx-color-primary) 45%, white));
}
#sw-tour .tb-hero-content { padding: var(--fx-space-10) 0; color: var(--fx-color-on-secondary); }
#sw-tour .tb-hero-content h1 { max-width: 540px; margin: 0 0 var(--fx-space-4); color: var(--fx-color-on-secondary); }
#sw-tour .tb-hi { color: var(--fx-color-warning); }
#sw-tour .tb-hero-content p { max-width: 400px; margin: 0 0 var(--fx-space-6); color: color-mix(in srgb, var(--fx-color-on-secondary) 85%, transparent); }

/* search box */
#sw-tour .tb-search {
  position: relative;
  z-index: 2;
  margin-top: calc(-1 * var(--fx-space-12));
  padding: var(--fx-space-5);
  background: var(--fx-color-surface);
  border-radius: var(--fx-radius-xl);
  box-shadow: var(--fx-shadow-xl);
}
#sw-tour .tb-tabs { display: flex; flex-wrap: wrap; gap: var(--fx-space-2); padding-bottom: var(--fx-space-3); margin-bottom: var(--fx-space-3); border-bottom: 1px solid var(--fx-color-border); }
#sw-tour .tb-tab { padding: var(--fx-space-2) var(--fx-space-3); border-radius: var(--fx-radius-md); color: var(--fx-color-text-muted); font-weight: 500; cursor: pointer; }
#sw-tour .tb-tab.is-active { background: var(--fx-color-surface-alt); color: var(--fx-color-primary); }
#sw-tour .tb-trip { display: flex; gap: var(--fx-space-4); margin-bottom: var(--fx-space-4); }
#sw-tour .tb-trip span { color: var(--fx-color-text-muted); cursor: pointer; }
#sw-tour .tb-trip .is-active { color: var(--fx-color-primary); font-weight: 600; }
#sw-tour .tb-fields { display: grid; grid-template-columns: repeat(5, 1fr) auto; gap: var(--fx-space-3); align-items: end; }
#sw-tour .tb-fields label { display: block; margin-bottom: var(--fx-space-1); color: var(--fx-color-text-muted); }
#sw-tour .tb-fields input { width: 100%; padding: var(--fx-space-3); border: 1px solid var(--fx-color-border); border-radius: var(--fx-radius-md); background: var(--fx-color-surface); color: var(--fx-color-text); font-family: var(--fx-font-family-base); }
#sw-tour .tb-fields input:focus-visible { outline: 2px solid var(--fx-color-focus-ring); outline-offset: 1px; }

/* hero feature strip */
#sw-tour .tb-feats { display: grid; grid-template-columns: repeat(4, 1fr); gap: var(--fx-space-4); margin-top: var(--fx-space-8); }
#sw-tour .tb-feat { display: flex; align-items: center; gap: var(--fx-space-3); }
#sw-tour .tb-feat .tb-ic { display: flex; align-items: center; justify-content: center; flex-shrink: 0; width: 42px; height: 42px; border-radius: var(--fx-radius-md); background: var(--fx-color-surface-alt); color: var(--fx-color-primary); }
#sw-tour .tb-feat b { display: block; }
#sw-tour .tb-feat small { color: var(--fx-color-text-muted); }

/* generic section */
#sw-tour .tb-section { padding: var(--fx-space-16) 0; }
#sw-tour .tb-section--alt { background: var(--fx-color-surface-alt); }

/* destinations */
#sw-tour .tb-dest-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: var(--fx-space-4); }
#sw-tour .tb-dest { position: relative; border-radius: var(--fx-radius-lg); overflow: hidden; }
#sw-tour .tb-dest .tb-ph { min-height: 220px; border-radius: 0; }
#sw-tour .tb-dest b { position: absolute; left: var(--fx-space-3); bottom: var(--fx-space-6); color: var(--fx-color-on-primary); font-family: var(--fx-font-family-heading); }
#sw-tour .tb-dest small { position: absolute; left: var(--fx-space-3); bottom: var(--fx-space-3); color: color-mix(in srgb, var(--fx-color-on-primary) 85%, transparent); }

/* tours */
#sw-tour .tb-tour-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: var(--fx-space-4); }
#sw-tour .tb-tour { padding: var(--fx-space-6) var(--fx-space-4); background: var(--fx-color-surface); border: 1px solid var(--fx-color-border); border-radius: var(--fx-radius-lg); text-align: center; }
#sw-tour .tb-tour .tb-emoji { display: block; margin-bottom: var(--fx-space-3); }
#sw-tour .tb-tour b { display: block; margin-bottom: var(--fx-space-1); }
#sw-tour .tb-tour p { margin: 0; color: var(--fx-color-text-muted); }

/* deals */
#sw-tour .tb-deals-wrap { padding: var(--fx-space-12); background: var(--fx-color-surface-alt); border-radius: var(--fx-radius-2xl); }
#sw-tour .tb-deal-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--fx-space-5); }
#sw-tour .tb-deal { background: var(--fx-color-surface); border-radius: var(--fx-radius-lg); overflow: hidden; box-shadow: var(--fx-shadow-md); }
#sw-tour .tb-deal .tb-ph { min-height: 150px; border-radius: 0; }
#sw-tour .tb-save { position: absolute; top: var(--fx-space-3); left: var(--fx-space-3); padding: var(--fx-space-1) var(--fx-space-3); border-radius: var(--fx-radius-sm); background: var(--fx-color-warning); color: var(--fx-color-on-warning); font-weight: 600; }
#sw-tour .tb-deal-body { padding: var(--fx-space-4); }
#sw-tour .tb-deal-body b { display: block; }
#sw-tour .tb-deal-body small { color: var(--fx-color-text-muted); }
#sw-tour .tb-deal-foot { display: flex; align-items: center; justify-content: space-between; margin-top: var(--fx-space-3); }
#sw-tour .tb-price { font-family: var(--fx-font-family-heading); font-weight: 700; color: var(--fx-color-primary); }
#sw-tour .tb-price s { color: var(--fx-color-text-subtle); font-weight: 400; }

/* newsletter band + stats */
#sw-tour .tb-band {
  display: grid;
  grid-template-columns: 1.4fr 1fr;
  gap: var(--fx-space-6);
  align-items: center;
  padding: var(--fx-space-12);
  border-radius: var(--fx-radius-2xl);
  color: var(--fx-color-on-secondary);
  background: linear-gradient(135deg, var(--fx-color-secondary), var(--fx-color-primary));
}
#sw-tour .tb-band h2 { margin: 0 0 var(--fx-space-2); color: var(--fx-color-on-secondary); }
#sw-tour .tb-band p { margin: 0 0 var(--fx-space-4); color: color-mix(in srgb, var(--fx-color-on-secondary) 82%, transparent); }
#sw-tour .tb-inbox-form { display: flex; gap: var(--fx-space-2); max-width: 440px; padding: var(--fx-space-1); background: var(--fx-color-surface); border-radius: var(--fx-radius-md); }
#sw-tour .tb-inbox-form input { flex: 1; padding: var(--fx-space-3); border: none; border-radius: var(--fx-radius-sm); background: transparent; color: var(--fx-color-text); font-family: var(--fx-font-family-base); }
#sw-tour .tb-inbox-form input:focus-visible { outline: 2px solid var(--fx-color-focus-ring); }
#sw-tour .tb-band-art { display: flex; align-items: center; justify-content: center; min-height: 160px; border-radius: var(--fx-radius-lg); background: color-mix(in srgb, var(--fx-color-on-secondary) 14%, transparent); }
#sw-tour .tb-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: var(--fx-space-5); margin-top: var(--fx-space-5); padding: var(--fx-space-6); background: var(--fx-color-surface); border: 1px solid var(--fx-color-border); border-radius: var(--fx-radius-xl); }
#sw-tour .tb-stat { display: flex; align-items: center; justify-content: center; gap: var(--fx-space-3); }
#sw-tour .tb-stat strong { display: block; font-family: var(--fx-font-family-heading); }
#sw-tour .tb-stat small { color: var(--fx-color-text-muted); }

/* packages */
#sw-tour .tb-pkg-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--fx-space-5); }
#sw-tour .tb-pkg { padding: var(--fx-space-3); background: var(--fx-color-surface); border: 1px solid var(--fx-color-border); border-radius: var(--fx-radius-xl); box-shadow: var(--fx-shadow-md); }
#sw-tour .tb-pkg .tb-ph { min-height: 170px; margin-bottom: var(--fx-space-3); }
#sw-tour .tb-tag { position: absolute; top: var(--fx-space-3); left: var(--fx-space-3); padding: var(--fx-space-1) var(--fx-space-3); border-radius: var(--fx-radius-md); background: var(--fx-color-surface); color: var(--fx-color-primary); font-family: var(--fx-font-family-heading); font-weight: 700; }
#sw-tour .tb-pkg b { display: block; padding: 0 var(--fx-space-1); }
#sw-tour .tb-pkg small { display: block; padding: 0 var(--fx-space-1); color: var(--fx-color-text-muted); }
#sw-tour .tb-pkg-icons { padding: var(--fx-space-2) var(--fx-space-1) var(--fx-space-3); color: var(--fx-color-text-muted); }
#sw-tour .tb-impact { display: grid; grid-template-columns: repeat(4, 1fr); gap: var(--fx-space-5); margin-top: var(--fx-space-8); padding: var(--fx-space-6); border-radius: var(--fx-radius-xl); color: var(--fx-color-on-secondary); background: var(--fx-color-secondary); }
#sw-tour .tb-impact .tb-item { display: flex; align-items: center; gap: var(--fx-space-3); }
#sw-tour .tb-impact .tb-emoji { color: var(--fx-color-warning); }
#sw-tour .tb-impact strong { display: block; font-family: var(--fx-font-family-heading); }
#sw-tour .tb-impact small { color: color-mix(in srgb, var(--fx-color-on-secondary) 68%, transparent); }

/* memorable */
#sw-tour .tb-mem { display: grid; grid-template-columns: 1.2fr 1fr; gap: var(--fx-space-12); align-items: center; }
#sw-tour .tb-mem h2 { margin: var(--fx-space-2) 0 var(--fx-space-3); }
#sw-tour .tb-mem > div > p { color: var(--fx-color-text-muted); margin: 0 0 var(--fx-space-6); }
#sw-tour .tb-mem-grid { display: grid; grid-template-columns: 1fr 1fr; gap: var(--fx-space-5); }
#sw-tour .tb-mf .tb-ic { display: flex; align-items: center; justify-content: center; width: 44px; height: 44px; margin-bottom: var(--fx-space-2); border-radius: var(--fx-radius-md); background: var(--fx-color-surface-alt); }
#sw-tour .tb-mf b { display: block; margin-bottom: var(--fx-space-1); }
#sw-tour .tb-mf small { color: var(--fx-color-text-muted); }
#sw-tour .tb-mem-art { min-height: 340px; }

/* reviews */
#sw-tour .tb-rev-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--fx-space-5); }
#sw-tour .tb-rev { padding: var(--fx-space-6); background: var(--fx-color-surface); border: 1px solid var(--fx-color-border); border-radius: var(--fx-radius-lg); }
#sw-tour .tb-rev-head { display: flex; align-items: center; gap: var(--fx-space-3); margin-bottom: var(--fx-space-3); }
#sw-tour .tb-av { width: 44px; height: 44px; border-radius: var(--fx-radius-full); background: linear-gradient(135deg, var(--fx-color-primary), var(--fx-color-warning)); }
#sw-tour .tb-rev-head b { display: block; }
#sw-tour .tb-rev-head small { color: var(--fx-color-text-muted); }
#sw-tour .tb-rev p { margin: 0 0 var(--fx-space-3); color: var(--fx-color-text-muted); }
#sw-tour .tb-stars { color: var(--fx-color-warning); }

/* takeoff */
#sw-tour .tb-takeoff { display: grid; grid-template-columns: 1.3fr 1fr; gap: var(--fx-space-6); align-items: center; padding: var(--fx-space-12); border-radius: var(--fx-radius-2xl); color: var(--fx-color-on-primary); background: linear-gradient(120deg, var(--fx-color-primary), var(--fx-color-secondary)); }
#sw-tour .tb-takeoff h2 { margin: 0 0 var(--fx-space-2); color: var(--fx-color-on-primary); }
#sw-tour .tb-takeoff p { margin: 0 0 var(--fx-space-4); color: color-mix(in srgb, var(--fx-color-on-primary) 85%, transparent); }
#sw-tour .tb-takeoff-art { display: flex; align-items: center; justify-content: center; min-height: 150px; border-radius: var(--fx-radius-lg); background: color-mix(in srgb, var(--fx-color-on-primary) 14%, transparent); }

/* blog */
#sw-tour .tb-blog-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--fx-space-5); }
#sw-tour .tb-blog { background: var(--fx-color-surface); border: 1px solid var(--fx-color-border); border-radius: var(--fx-radius-lg); overflow: hidden; }
#sw-tour .tb-blog .tb-ph { min-height: 170px; border-radius: 0; }
#sw-tour .tb-blog small { display: block; padding: var(--fx-space-3) var(--fx-space-4) 0; color: var(--fx-color-text-muted); }
#sw-tour .tb-blog h4 { margin: 0; padding: var(--fx-space-1) var(--fx-space-4); }
#sw-tour .tb-blog a { display: inline-block; padding: 0 var(--fx-space-4) var(--fx-space-4); font-weight: 600; }

/* footer */
#sw-tour .tb-footer { padding: var(--fx-space-16) 0 var(--fx-space-6); color: var(--fx-color-on-secondary); background: var(--fx-color-secondary); }
#sw-tour .tb-foot-grid { display: grid; grid-template-columns: 1.6fr 1fr 1fr 1fr 1.3fr; gap: var(--fx-space-8); }
#sw-tour .tb-foot-about { color: color-mix(in srgb, var(--fx-color-on-secondary) 62%, transparent); margin: var(--fx-space-3) 0 var(--fx-space-4); }
#sw-tour .tb-socials { display: flex; gap: var(--fx-space-2); }
#sw-tour .tb-socials span { display: flex; align-items: center; justify-content: center; width: 32px; height: 32px; border-radius: var(--fx-radius-full); background: color-mix(in srgb, var(--fx-color-on-secondary) 12%, transparent); color: var(--fx-color-on-secondary); cursor: pointer; }
#sw-tour .tb-foot-col h4 { margin: 0 0 var(--fx-space-4); color: var(--fx-color-on-secondary); }
#sw-tour .tb-foot-col a { display: block; margin-bottom: var(--fx-space-2); color: color-mix(in srgb, var(--fx-color-on-secondary) 62%, transparent); }
#sw-tour .tb-foot-col p { color: color-mix(in srgb, var(--fx-color-on-secondary) 62%, transparent); margin: 0 0 var(--fx-space-3); }
#sw-tour .tb-news { display: flex; padding: var(--fx-space-1); border-radius: var(--fx-radius-md); background: color-mix(in srgb, var(--fx-color-on-secondary) 12%, transparent); }
#sw-tour .tb-news input { flex: 1; padding: var(--fx-space-2) var(--fx-space-3); border: none; background: transparent; color: var(--fx-color-on-secondary); }
#sw-tour .tb-news button { width: 40px; border: none; border-radius: var(--fx-radius-sm); background: var(--fx-color-warning); color: var(--fx-color-on-warning); cursor: pointer; }
#sw-tour .tb-foot-bottom { display: flex; flex-wrap: wrap; justify-content: space-between; gap: var(--fx-space-3); margin-top: var(--fx-space-10); padding-top: var(--fx-space-5); border-top: 1px solid color-mix(in srgb, var(--fx-color-on-secondary) 12%, transparent); color: color-mix(in srgb, var(--fx-color-on-secondary) 55%, transparent); }

/* responsive */
@media (max-width: 960px) {
  #sw-tour .tb-links { position: absolute; top: 0; right: 0; z-index: 60; flex-direction: column; justify-content: center; gap: var(--fx-space-6); width: min(78vw, 320px); height: 100vh; padding: var(--fx-space-10); background: var(--fx-color-secondary); transform: translateX(100%); transition: transform 0.35s ease; }
  #sw-tour .tb-links a { color: var(--fx-color-on-secondary); }
  #sw-tour .tb-links.is-open { transform: translateX(0); }
  #sw-tour .tb-burger { display: flex; z-index: 70; }
  #sw-tour .tb-lang { display: none; }
  #sw-tour .tb-fields { grid-template-columns: 1fr 1fr; }
  #sw-tour .tb-band, #sw-tour .tb-mem, #sw-tour .tb-takeoff { grid-template-columns: 1fr; }
  #sw-tour .tb-feats, #sw-tour .tb-dest-grid, #sw-tour .tb-tour-grid, #sw-tour .tb-deal-grid, #sw-tour .tb-stats, #sw-tour .tb-pkg-grid, #sw-tour .tb-impact, #sw-tour .tb-mem-grid, #sw-tour .tb-rev-grid, #sw-tour .tb-blog-grid, #sw-tour .tb-foot-grid { grid-template-columns: 1fr 1fr; }
}
@media (max-width: 600px) {
  #sw-tour .tb-fields, #sw-tour .tb-feats, #sw-tour .tb-dest-grid, #sw-tour .tb-tour-grid, #sw-tour .tb-deal-grid, #sw-tour .tb-stats, #sw-tour .tb-pkg-grid, #sw-tour .tb-impact, #sw-tour .tb-mem-grid, #sw-tour .tb-rev-grid, #sw-tour .tb-blog-grid, #sw-tour .tb-foot-grid { grid-template-columns: 1fr; }
}
`;

/* ── Registry ────────────────────────────────────────────────────────────── */

export interface ShowcaseScreen {
  slug: string;
  css: string;
  /** Each screen loads its own content (from `showcase.json` or its per-slug file). */
  render: () => ReactElement;
  /** Full landing pages carry a fixed floating recolour panel — shown as a teaser
   * link in the gallery index rather than rendered inline (the panel would overlap
   * the grid), but rendered in full on their own `/showcase/<slug>` page. */
  full?: boolean;
}

/** Slug → (stylesheet + renderer). Order is the gallery order. */
export const SHOWCASE_SCREENS: Record<string, ShowcaseScreen> = {
  'tour-booking': {
    slug: 'tour-booking',
    css: TOUR_CSS,
    full: true,
    render: () => <TourBooking c={loadShowcase().tourBooking} />,
  },
  restaurant: {
    slug: 'restaurant',
    css: RESTAURANT_CSS,
    full: true,
    render: () => <Restaurant c={loadShowcaseScreen<RestaurantContent>('restaurant')} />,
  },
  'real-estate': {
    slug: 'real-estate',
    css: REALESTATE_CSS,
    full: true,
    render: () => <RealEstate c={loadShowcaseScreen<RealEstateContent>('real-estate')} />,
  },
  saas: {
    slug: 'saas',
    css: SAAS_CSS,
    full: true,
    render: () => <Saas c={loadShowcaseScreen<SaasContent>('saas')} />,
  },
  spa: {
    slug: 'spa',
    css: SPA_CSS,
    full: true,
    render: () => <Spa c={loadShowcaseScreen<SpaContent>('spa')} />,
  },
  pricing: { slug: 'pricing', css: PRICING_CSS, render: () => <Pricing c={loadShowcase().pricing} /> },
  landing: { slug: 'landing', css: LANDING_CSS, render: () => <Landing c={loadShowcase().landing} /> },
  'sign-in': {
    slug: 'sign-in',
    css: SIGNIN_CSS,
    render: () => <SignIn c={loadShowcase().signIn} />,
  },
};
