/*
 * SPA_CSS — the scanned, token-only stylesheet for the spa showcase page.
 *
 * Kept in a plain (non-client) module: the server route reads it as a real string
 * for the build-time token scan (usedTokens). Exporting it from the 'use client'
 * component module would hand the server a client-reference proxy instead of the
 * string. Scope: #sw-spa. Every design-intent value is an --fx-* token; type
 * comes from FDS base typography, so there is no font-size here.
 */
export const SPA_CSS = `
#sw-spa {
  background: var(--fx-color-bg);
  color: var(--fx-color-text);
  border: 1px solid var(--fx-color-border);
  border-radius: var(--fx-radius-xl);
  overflow: hidden;
}
#sw-spa a { color: var(--fx-color-primary); text-decoration: none; }
#sw-spa .sp-container {
  width: 100%;
  max-width: var(--fx-size-container-lg);
  margin: 0 auto;
  padding: 0 var(--fx-space-6);
}
#sw-spa .sp-eyebrow {
  display: block;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  font-weight: 600;
  color: var(--fx-color-primary);
}
#sw-spa .sp-head { max-width: 600px; margin: 0 auto var(--fx-space-12); text-align: center; }
#sw-spa .sp-head h2 { margin: var(--fx-space-3) 0; }
#sw-spa .sp-head p { margin: 0; color: var(--fx-color-text-muted); }

#sw-spa .sp-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--fx-space-2);
  padding: var(--fx-space-3) var(--fx-space-6);
  border: none;
  border-radius: var(--fx-radius-full);
  font-family: var(--fx-font-family-base);
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}
#sw-spa .sp-btn:hover { transform: translateY(-2px); }
#sw-spa .sp-btn--accent { background: var(--fx-color-warning); color: var(--fx-color-on-warning); box-shadow: var(--fx-shadow-sm); }
#sw-spa .sp-btn--primary { background: var(--fx-color-primary); color: var(--fx-color-on-primary); }
#sw-spa .sp-btn--outline { background: transparent; color: var(--fx-color-primary); border: 1.5px solid var(--fx-color-border-strong); }
#sw-spa .sp-btn--sm { padding: var(--fx-space-2) var(--fx-space-4); }
#sw-spa .sp-btn--full { width: 100%; }

#sw-spa .sp-ph {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 80px;
  border-radius: var(--fx-radius-2xl);
  color: var(--fx-color-on-primary);
  font-family: var(--fx-font-family-heading);
  font-weight: 600;
  text-align: center;
  letter-spacing: 0.02em;
  background: linear-gradient(135deg, var(--fx-color-primary), color-mix(in srgb, var(--fx-color-secondary) 70%, var(--fx-color-primary)));
}

#sw-spa .sp-price {
  font-family: var(--fx-font-family-heading);
  font-weight: 700;
  color: var(--fx-color-warning);
}

/* topbar */
#sw-spa .sp-topbar { background: var(--fx-color-secondary); color: var(--fx-color-on-secondary); }
#sw-spa .sp-topbar-inner { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: var(--fx-space-3); padding: var(--fx-space-2) var(--fx-space-6); }
#sw-spa .sp-topbar-inner span { color: color-mix(in srgb, var(--fx-color-on-secondary) 82%, transparent); }

/* header */
#sw-spa .sp-header { position: sticky; top: 0; z-index: 50; background: var(--fx-color-surface); box-shadow: var(--fx-shadow-sm); }
#sw-spa .sp-nav { display: flex; align-items: center; justify-content: space-between; gap: var(--fx-space-4); padding: var(--fx-space-4) var(--fx-space-6); }
#sw-spa .sp-brand { font-family: var(--fx-font-family-heading); font-weight: 800; letter-spacing: 0.02em; color: var(--fx-color-primary); }
#sw-spa .sp-links { display: flex; flex-wrap: wrap; gap: var(--fx-space-6); }
#sw-spa .sp-links a { color: var(--fx-color-text); font-weight: 500; }
#sw-spa .sp-links a.is-active { color: var(--fx-color-primary); }
#sw-spa .sp-burger { display: none; flex-direction: column; gap: 5px; padding: var(--fx-space-2); background: none; border: none; cursor: pointer; }
#sw-spa .sp-burger span { width: 24px; height: 3px; border-radius: var(--fx-radius-full); background: var(--fx-color-secondary); }

/* hero */
#sw-spa .sp-hero { padding: var(--fx-space-10) 0; }
#sw-spa .sp-hero-card { position: relative; }
#sw-spa .sp-hero-img {
  min-height: 520px;
  border-radius: var(--fx-radius-2xl);
  background: linear-gradient(120deg, var(--fx-color-primary), color-mix(in srgb, var(--fx-color-secondary) 60%, var(--fx-color-primary)));
}
#sw-spa .sp-hero-overlay {
  position: absolute;
  left: var(--fx-space-12);
  top: 50%;
  transform: translateY(-50%);
  max-width: 520px;
  padding: var(--fx-space-10);
  border-radius: var(--fx-radius-2xl);
  color: var(--fx-color-on-secondary);
  background: color-mix(in srgb, var(--fx-color-secondary) 78%, transparent);
  box-shadow: var(--fx-shadow-xl);
}
#sw-spa .sp-hero-overlay h1 { margin: 0 0 var(--fx-space-4); color: var(--fx-color-on-secondary); }
#sw-spa .sp-hi { color: var(--fx-color-warning); }
#sw-spa .sp-hero-overlay p { margin: 0 0 var(--fx-space-6); color: color-mix(in srgb, var(--fx-color-on-secondary) 86%, transparent); }

/* generic section */
#sw-spa .sp-section { padding: var(--fx-space-20) 0; }
#sw-spa .sp-section--alt { background: var(--fx-color-surface-alt); }

/* services */
#sw-spa .sp-svc-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--fx-space-6); }
#sw-spa .sp-svc { display: flex; flex-direction: column; padding: var(--fx-space-8); background: var(--fx-color-surface); border: 1px solid var(--fx-color-border); border-radius: var(--fx-radius-2xl); box-shadow: var(--fx-shadow-sm); }
#sw-spa .sp-svc-ic { display: flex; align-items: center; justify-content: center; width: 56px; height: 56px; margin-bottom: var(--fx-space-4); border-radius: var(--fx-radius-full); background: var(--fx-color-surface-alt); color: var(--fx-color-primary); }
#sw-spa .sp-svc b { display: block; margin-bottom: var(--fx-space-2); }
#sw-spa .sp-svc p { margin: 0 0 var(--fx-space-5); color: var(--fx-color-text-muted); flex: 1; }
#sw-spa .sp-svc-foot { display: flex; align-items: center; justify-content: space-between; gap: var(--fx-space-3); }

/* packages */
#sw-spa .sp-pkg-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--fx-space-6); }
#sw-spa .sp-pkg { padding: var(--fx-space-4); background: var(--fx-color-surface); border: 1px solid var(--fx-color-border); border-radius: var(--fx-radius-2xl); box-shadow: var(--fx-shadow-md); }
#sw-spa .sp-pkg.is-popular { border-color: var(--fx-color-warning); border-width: 2px; }
#sw-spa .sp-pkg-img { min-height: 200px; margin-bottom: var(--fx-space-4); }
#sw-spa .sp-badge { position: absolute; top: var(--fx-space-3); right: var(--fx-space-3); padding: var(--fx-space-1) var(--fx-space-3); border-radius: var(--fx-radius-full); background: var(--fx-color-warning); color: var(--fx-color-on-warning); font-weight: 600; }
#sw-spa .sp-pkg b { display: block; padding: 0 var(--fx-space-2); }
#sw-spa .sp-pkg small { display: block; padding: var(--fx-space-1) var(--fx-space-2) var(--fx-space-4); color: var(--fx-color-text-muted); }
#sw-spa .sp-pkg-foot { display: flex; align-items: center; justify-content: space-between; gap: var(--fx-space-3); padding: 0 var(--fx-space-2) var(--fx-space-2); }

/* rejuvenate split */
#sw-spa .sp-rej { display: grid; grid-template-columns: 1fr 1.1fr; gap: var(--fx-space-12); align-items: center; }
#sw-spa .sp-rej-art { min-height: 420px; }
#sw-spa .sp-rej h2 { margin: var(--fx-space-3) 0; }
#sw-spa .sp-rej > div > p { margin: 0 0 var(--fx-space-6); color: var(--fx-color-text-muted); }
#sw-spa .sp-rej-grid { display: grid; grid-template-columns: 1fr 1fr; gap: var(--fx-space-5); margin-bottom: var(--fx-space-8); }
#sw-spa .sp-rf .sp-ic { display: flex; align-items: center; justify-content: center; width: 44px; height: 44px; margin-bottom: var(--fx-space-2); border-radius: var(--fx-radius-full); background: var(--fx-color-surface-alt); color: var(--fx-color-primary); }
#sw-spa .sp-rf b { display: block; margin-bottom: var(--fx-space-1); }
#sw-spa .sp-rf small { color: var(--fx-color-text-muted); }

/* stats */
#sw-spa .sp-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: var(--fx-space-6); padding: var(--fx-space-10); border-radius: var(--fx-radius-2xl); color: var(--fx-color-on-secondary); background: linear-gradient(120deg, var(--fx-color-secondary), var(--fx-color-primary)); }
#sw-spa .sp-stat { text-align: center; }
#sw-spa .sp-stat strong { display: block; margin-bottom: var(--fx-space-1); font-family: var(--fx-font-family-heading); color: var(--fx-color-warning); }
#sw-spa .sp-stat small { color: color-mix(in srgb, var(--fx-color-on-secondary) 78%, transparent); }

/* benefits */
#sw-spa .sp-ben-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: var(--fx-space-6); }
#sw-spa .sp-ben { padding: var(--fx-space-6); background: var(--fx-color-surface); border: 1px solid var(--fx-color-border); border-radius: var(--fx-radius-xl); text-align: center; }
#sw-spa .sp-ben .sp-ic { display: inline-flex; align-items: center; justify-content: center; width: 52px; height: 52px; margin-bottom: var(--fx-space-3); border-radius: var(--fx-radius-full); background: var(--fx-color-surface-alt); color: var(--fx-color-primary); }
#sw-spa .sp-ben b { display: block; margin-bottom: var(--fx-space-1); }
#sw-spa .sp-ben small { color: var(--fx-color-text-muted); }

/* therapists */
#sw-spa .sp-ther-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--fx-space-6); }
#sw-spa .sp-ther { background: var(--fx-color-surface); border: 1px solid var(--fx-color-border); border-radius: var(--fx-radius-2xl); overflow: hidden; text-align: center; }
#sw-spa .sp-ther-img { min-height: 300px; border-radius: 0; }
#sw-spa .sp-ther b { display: block; margin-top: var(--fx-space-5); }
#sw-spa .sp-ther small { display: block; margin-top: var(--fx-space-1); color: var(--fx-color-text-muted); }
#sw-spa .sp-ther-social { padding: var(--fx-space-3) 0 var(--fx-space-6); color: var(--fx-color-primary); letter-spacing: 0.2em; }

/* pricing menu */
#sw-spa .sp-pricing { display: grid; grid-template-columns: 1fr 1.2fr; gap: var(--fx-space-12); align-items: start; }
#sw-spa .sp-pricing-left h2 { margin: var(--fx-space-3) 0; }
#sw-spa .sp-pricing-left > p { margin: 0 0 var(--fx-space-6); color: var(--fx-color-text-muted); }
#sw-spa .sp-pl-tabs { display: flex; flex-direction: column; gap: var(--fx-space-2); }
#sw-spa .sp-pl-tab { padding: var(--fx-space-3) var(--fx-space-4); border-radius: var(--fx-radius-lg); color: var(--fx-color-text-muted); font-weight: 500; cursor: pointer; }
#sw-spa .sp-pl-tab.is-active { background: var(--fx-color-surface); color: var(--fx-color-primary); box-shadow: var(--fx-shadow-sm); }
#sw-spa .sp-pricing-right { padding: var(--fx-space-4); background: var(--fx-color-surface); border: 1px solid var(--fx-color-border); border-radius: var(--fx-radius-2xl); box-shadow: var(--fx-shadow-md); }
#sw-spa .sp-price-row { display: flex; align-items: center; justify-content: space-between; gap: var(--fx-space-4); padding: var(--fx-space-4); border-bottom: 1px solid var(--fx-color-border); }
#sw-spa .sp-price-row:last-child { border-bottom: none; }
#sw-spa .sp-price-row b { display: block; }
#sw-spa .sp-price-row small { color: var(--fx-color-text-muted); }

/* booking band */
#sw-spa .sp-book { display: grid; grid-template-columns: 1fr 1.1fr; gap: var(--fx-space-10); align-items: center; padding: var(--fx-space-12); border-radius: var(--fx-radius-2xl); background: var(--fx-color-surface-alt); }
#sw-spa .sp-book-art { min-height: 440px; }
#sw-spa .sp-book-form h2 { margin: var(--fx-space-3) 0; }
#sw-spa .sp-book-form > p { margin: 0 0 var(--fx-space-6); color: var(--fx-color-text-muted); }
#sw-spa .sp-book-fields { display: grid; grid-template-columns: 1fr 1fr; gap: var(--fx-space-4); margin-bottom: var(--fx-space-6); }
#sw-spa .sp-book-fields label { display: block; margin-bottom: var(--fx-space-1); color: var(--fx-color-text-muted); }
#sw-spa .sp-book-fields input { width: 100%; padding: var(--fx-space-3); border: 1px solid var(--fx-color-border); border-radius: var(--fx-radius-md); background: var(--fx-color-surface); color: var(--fx-color-text); font-family: var(--fx-font-family-base); }
#sw-spa .sp-book-fields input:focus-visible { outline: 2px solid var(--fx-color-focus-ring); outline-offset: 1px; }

/* testimonials */
#sw-spa .sp-test-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--fx-space-6); }
#sw-spa .sp-test { position: relative; padding: var(--fx-space-8); background: var(--fx-color-surface); border: 1px solid var(--fx-color-border); border-radius: var(--fx-radius-2xl); box-shadow: var(--fx-shadow-sm); }
#sw-spa .sp-quote { display: block; margin-bottom: var(--fx-space-2); font-family: var(--fx-font-family-heading); color: var(--fx-color-primary); line-height: 1; }
#sw-spa .sp-test > p { margin: 0 0 var(--fx-space-5); color: var(--fx-color-text-muted); }
#sw-spa .sp-test-head { display: flex; align-items: center; gap: var(--fx-space-3); margin-bottom: var(--fx-space-3); }
#sw-spa .sp-av { width: 44px; height: 44px; border-radius: var(--fx-radius-full); background: linear-gradient(135deg, var(--fx-color-primary), var(--fx-color-warning)); }
#sw-spa .sp-test-head b { display: block; }
#sw-spa .sp-test-head small { color: var(--fx-color-text-muted); }
#sw-spa .sp-stars { color: var(--fx-color-warning); }

/* gallery */
#sw-spa .sp-gal-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: var(--fx-space-4); }
#sw-spa .sp-gal { min-height: 220px; }
#sw-spa .sp-gal:first-child { grid-column: span 2; grid-row: span 2; }

/* CTA band */
#sw-spa .sp-cta { display: grid; grid-template-columns: 1.3fr 1fr; gap: var(--fx-space-8); align-items: center; padding: var(--fx-space-12); border-radius: var(--fx-radius-2xl); color: var(--fx-color-on-primary); background: linear-gradient(120deg, var(--fx-color-primary), var(--fx-color-secondary)); }
#sw-spa .sp-cta h2 { margin: 0 0 var(--fx-space-2); color: var(--fx-color-on-primary); }
#sw-spa .sp-cta p { margin: 0 0 var(--fx-space-4); color: color-mix(in srgb, var(--fx-color-on-primary) 86%, transparent); }
#sw-spa .sp-cta-art { display: flex; align-items: center; justify-content: center; min-height: 180px; border-radius: var(--fx-radius-2xl); background: color-mix(in srgb, var(--fx-color-on-primary) 14%, transparent); }

/* footer */
#sw-spa .sp-footer { padding: var(--fx-space-16) 0 var(--fx-space-6); color: var(--fx-color-on-secondary); background: var(--fx-color-secondary); }
#sw-spa .sp-news { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: var(--fx-space-6); margin-bottom: var(--fx-space-12); padding-bottom: var(--fx-space-10); border-bottom: 1px solid color-mix(in srgb, var(--fx-color-on-secondary) 14%, transparent); }
#sw-spa .sp-news h3 { margin: 0 0 var(--fx-space-1); color: var(--fx-color-on-secondary); }
#sw-spa .sp-news p { margin: 0; color: color-mix(in srgb, var(--fx-color-on-secondary) 68%, transparent); }
#sw-spa .sp-news-form { display: flex; gap: var(--fx-space-2); padding: var(--fx-space-1); border-radius: var(--fx-radius-full); background: color-mix(in srgb, var(--fx-color-on-secondary) 12%, transparent); }
#sw-spa .sp-news-form input { min-width: 220px; padding: var(--fx-space-2) var(--fx-space-4); border: none; background: transparent; color: var(--fx-color-on-secondary); }
#sw-spa .sp-news-form input:focus-visible { outline: 2px solid var(--fx-color-focus-ring); }
#sw-spa .sp-foot-grid { display: grid; grid-template-columns: 1.6fr 1fr 1fr 1fr; gap: var(--fx-space-8); }
#sw-spa .sp-foot-about { color: color-mix(in srgb, var(--fx-color-on-secondary) 62%, transparent); margin: var(--fx-space-3) 0 var(--fx-space-4); }
#sw-spa .sp-socials { display: flex; gap: var(--fx-space-2); }
#sw-spa .sp-socials span { display: flex; align-items: center; justify-content: center; width: 32px; height: 32px; border-radius: var(--fx-radius-full); background: color-mix(in srgb, var(--fx-color-on-secondary) 12%, transparent); color: var(--fx-color-on-secondary); cursor: pointer; }
#sw-spa .sp-foot-col h4 { margin: 0 0 var(--fx-space-4); color: var(--fx-color-on-secondary); }
#sw-spa .sp-foot-col a { display: block; margin-bottom: var(--fx-space-2); color: color-mix(in srgb, var(--fx-color-on-secondary) 62%, transparent); }
#sw-spa .sp-foot-col p { margin: 0 0 var(--fx-space-2); color: color-mix(in srgb, var(--fx-color-on-secondary) 62%, transparent); }
#sw-spa .sp-foot-bottom { display: flex; flex-wrap: wrap; justify-content: space-between; gap: var(--fx-space-3); margin-top: var(--fx-space-10); padding-top: var(--fx-space-5); border-top: 1px solid color-mix(in srgb, var(--fx-color-on-secondary) 12%, transparent); color: color-mix(in srgb, var(--fx-color-on-secondary) 55%, transparent); }

/* responsive */
@media (max-width: 960px) {
  #sw-spa .sp-links { position: absolute; top: 0; right: 0; z-index: 60; flex-direction: column; justify-content: center; gap: var(--fx-space-6); width: min(78vw, 320px); height: 100vh; padding: var(--fx-space-10); background: var(--fx-color-secondary); transform: translateX(100%); transition: transform 0.35s ease; }
  #sw-spa .sp-links a { color: var(--fx-color-on-secondary); }
  #sw-spa .sp-links.is-open { transform: translateX(0); }
  #sw-spa .sp-burger { display: flex; z-index: 70; }
  #sw-spa .sp-book-cta { display: none; }
  #sw-spa .sp-hero-overlay { position: static; transform: none; max-width: none; margin-top: var(--fx-space-4); }
  #sw-spa .sp-rej, #sw-spa .sp-pricing, #sw-spa .sp-book, #sw-spa .sp-cta { grid-template-columns: 1fr; }
  #sw-spa .sp-svc-grid, #sw-spa .sp-pkg-grid, #sw-spa .sp-stats, #sw-spa .sp-ben-grid, #sw-spa .sp-ther-grid, #sw-spa .sp-test-grid, #sw-spa .sp-gal-grid { grid-template-columns: 1fr 1fr; }
  #sw-spa .sp-gal:first-child { grid-column: span 2; grid-row: auto; }
}
@media (max-width: 600px) {
  #sw-spa .sp-svc-grid, #sw-spa .sp-pkg-grid, #sw-spa .sp-stats, #sw-spa .sp-ben-grid, #sw-spa .sp-ther-grid, #sw-spa .sp-test-grid, #sw-spa .sp-gal-grid, #sw-spa .sp-rej-grid, #sw-spa .sp-book-fields { grid-template-columns: 1fr; }
  #sw-spa .sp-gal:first-child { grid-column: auto; }
}
`;
