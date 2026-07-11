/*
 * RESTAURANT_CSS — the scanned, token-only stylesheet for the restaurant showcase page.
 *
 * Kept in a plain (non-client) module: the server route reads it as a real string
 * for the build-time token scan (usedTokens). Exporting it from the 'use client'
 * component module would hand the server a client-reference proxy instead of the
 * string. Scope: #sw-restaurant. Every design-intent value is an --fx-* token; type
 * comes from FDS base typography, so there is no font-size here.
 */
export const RESTAURANT_CSS = `
#sw-restaurant {
  background: var(--fx-color-bg);
  color: var(--fx-color-text);
  border: 1px solid var(--fx-color-border);
  border-radius: var(--fx-radius-xl);
  overflow: hidden;
}
#sw-restaurant a { color: var(--fx-color-primary); text-decoration: none; }
#sw-restaurant .rs-container {
  width: 100%;
  max-width: var(--fx-size-container-lg);
  margin: 0 auto;
  padding: 0 var(--fx-space-6);
}
#sw-restaurant .rs-eyebrow {
  display: block;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-weight: 600;
  color: var(--fx-color-primary);
}
#sw-restaurant .rs-eyebrow--light { color: var(--fx-color-warning); }
#sw-restaurant .rs-head { max-width: 560px; margin: 0 auto var(--fx-space-10); text-align: center; }
#sw-restaurant .rs-head h2 { margin: var(--fx-space-2) 0 var(--fx-space-3); }
#sw-restaurant .rs-head p { margin: 0; color: var(--fx-color-text-muted); }

#sw-restaurant .rs-btn {
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
#sw-restaurant .rs-btn:hover { transform: translateY(-2px); }
#sw-restaurant .rs-btn--accent { background: var(--fx-color-warning); color: var(--fx-color-on-warning); box-shadow: var(--fx-shadow-sm); }
#sw-restaurant .rs-btn--primary { background: var(--fx-color-primary); color: var(--fx-color-on-primary); box-shadow: var(--fx-shadow-sm); }
#sw-restaurant .rs-btn--outline { background: transparent; color: var(--fx-color-primary); border: 2px solid var(--fx-color-border-strong); }
#sw-restaurant .rs-btn--sm { padding: var(--fx-space-2) var(--fx-space-4); }
#sw-restaurant .rs-btn--full { width: 100%; }

#sw-restaurant .rs-ph {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 80px;
  border-radius: var(--fx-radius-lg);
  color: var(--fx-color-on-primary);
  font-weight: 600;
  text-align: center;
  background: linear-gradient(135deg, var(--fx-color-primary), color-mix(in srgb, var(--fx-color-warning) 60%, var(--fx-color-secondary)));
}

/* header */
#sw-restaurant .rs-header { position: sticky; top: 0; z-index: 50; background: var(--fx-color-surface); box-shadow: var(--fx-shadow-sm); }
#sw-restaurant .rs-nav { display: flex; align-items: center; justify-content: space-between; gap: var(--fx-space-4); padding: var(--fx-space-4) var(--fx-space-6); }
#sw-restaurant .rs-brand { font-family: var(--fx-font-family-heading); font-weight: 800; color: var(--fx-color-primary); }
#sw-restaurant .rs-links { display: flex; flex-wrap: wrap; gap: var(--fx-space-5); }
#sw-restaurant .rs-links a { color: var(--fx-color-text); font-weight: 500; }
#sw-restaurant .rs-links a.is-active { color: var(--fx-color-primary); }
#sw-restaurant .rs-navright { display: flex; align-items: center; gap: var(--fx-space-4); }
#sw-restaurant .rs-burger { display: none; flex-direction: column; gap: 5px; padding: var(--fx-space-2); background: none; border: none; cursor: pointer; }
#sw-restaurant .rs-burger span { width: 24px; height: 3px; border-radius: var(--fx-radius-full); background: var(--fx-color-secondary); }

/* hero */
#sw-restaurant .rs-hero {
  background:
    linear-gradient(160deg, color-mix(in srgb, var(--fx-color-secondary) 10%, transparent), transparent 55%),
    var(--fx-color-surface-alt);
}
#sw-restaurant .rs-hero-inner { display: grid; grid-template-columns: 1.1fr 0.9fr; gap: var(--fx-space-10); align-items: center; padding: var(--fx-space-16) 0; }
#sw-restaurant .rs-hero-text h1 { margin: 0 0 var(--fx-space-4); font-family: var(--fx-font-family-heading); }
#sw-restaurant .rs-hi { color: var(--fx-color-primary); }
#sw-restaurant .rs-hero-text p { max-width: 440px; margin: 0 0 var(--fx-space-6); color: var(--fx-color-text-muted); }
#sw-restaurant .rs-hero-cta { display: flex; flex-wrap: wrap; gap: var(--fx-space-3); margin-bottom: var(--fx-space-6); }
#sw-restaurant .rs-hero-rating { display: flex; align-items: center; gap: var(--fx-space-2); margin-bottom: var(--fx-space-6); }
#sw-restaurant .rs-hero-rating strong { font-family: var(--fx-font-family-heading); }
#sw-restaurant .rs-hero-rating small { color: var(--fx-color-text-muted); }
#sw-restaurant .rs-stars { color: var(--fx-color-warning); letter-spacing: 0.05em; }
#sw-restaurant .rs-hero-dishes { display: grid; grid-template-columns: 1fr 1fr; gap: var(--fx-space-4); }
#sw-restaurant .rs-hd { display: flex; align-items: center; gap: var(--fx-space-3); padding: var(--fx-space-3); background: var(--fx-color-surface); border: 1px solid var(--fx-color-border); border-radius: var(--fx-radius-lg); }
#sw-restaurant .rs-hd-img { display: flex; align-items: center; justify-content: center; flex-shrink: 0; width: 44px; height: 44px; border-radius: var(--fx-radius-full); background: var(--fx-color-surface-alt); }
#sw-restaurant .rs-hd b { display: block; }
#sw-restaurant .rs-hd small { color: var(--fx-color-text-muted); }
#sw-restaurant .rs-hero-img { min-height: 380px; }

/* highlights strip */
#sw-restaurant .rs-strip { padding: var(--fx-space-8) 0; background: var(--fx-color-secondary); color: var(--fx-color-on-secondary); }
#sw-restaurant .rs-strip-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: var(--fx-space-6); }
#sw-restaurant .rs-high { display: flex; align-items: center; gap: var(--fx-space-3); }
#sw-restaurant .rs-high .rs-ic { display: flex; align-items: center; justify-content: center; flex-shrink: 0; width: 46px; height: 46px; border-radius: var(--fx-radius-full); background: color-mix(in srgb, var(--fx-color-on-secondary) 12%, transparent); color: var(--fx-color-warning); }
#sw-restaurant .rs-high b { display: block; }
#sw-restaurant .rs-high small { color: color-mix(in srgb, var(--fx-color-on-secondary) 72%, transparent); }

/* generic section */
#sw-restaurant .rs-section { padding: var(--fx-space-16) 0; }
#sw-restaurant .rs-section--alt { background: var(--fx-color-surface-alt); }
#sw-restaurant .rs-section--tight { padding: var(--fx-space-10) 0; }

/* popular dishes */
#sw-restaurant .rs-dish-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: var(--fx-space-5); }
#sw-restaurant .rs-dish { background: var(--fx-color-surface); border: 1px solid var(--fx-color-border); border-radius: var(--fx-radius-lg); overflow: hidden; box-shadow: var(--fx-shadow-sm); transition: transform 0.15s ease, box-shadow 0.15s ease; }
#sw-restaurant .rs-dish:hover { transform: translateY(-4px); box-shadow: var(--fx-shadow-md); }
#sw-restaurant .rs-dish-img { min-height: 160px; border-radius: 0; }
#sw-restaurant .rs-dish-emoji { color: var(--fx-color-on-primary); }
#sw-restaurant .rs-tag { position: absolute; top: var(--fx-space-3); left: var(--fx-space-3); padding: var(--fx-space-1) var(--fx-space-3); border-radius: var(--fx-radius-full); background: var(--fx-color-warning); color: var(--fx-color-on-warning); font-weight: 600; }
#sw-restaurant .rs-dish-body { padding: var(--fx-space-4); }
#sw-restaurant .rs-dish-body b { display: block; font-family: var(--fx-font-family-heading); }
#sw-restaurant .rs-dish-body small { display: block; margin-top: var(--fx-space-1); color: var(--fx-color-text-muted); }
#sw-restaurant .rs-dish-foot { display: flex; align-items: center; justify-content: space-between; margin-top: var(--fx-space-4); }
#sw-restaurant .rs-price { font-family: var(--fx-font-family-heading); font-weight: 700; color: var(--fx-color-warning); }

/* story / chef split */
#sw-restaurant .rs-story { display: grid; grid-template-columns: 0.9fr 1.1fr; gap: var(--fx-space-12); align-items: center; }
#sw-restaurant .rs-story-art { min-height: 420px; }
#sw-restaurant .rs-story-text h2 { margin: var(--fx-space-2) 0 var(--fx-space-3); font-family: var(--fx-font-family-heading); }
#sw-restaurant .rs-story-text > p { margin: 0 0 var(--fx-space-5); color: var(--fx-color-text-muted); }
#sw-restaurant .rs-points { list-style: none; margin: 0 0 var(--fx-space-6); padding: 0; }
#sw-restaurant .rs-points li { display: flex; align-items: center; gap: var(--fx-space-3); margin-bottom: var(--fx-space-3); }
#sw-restaurant .rs-check { display: flex; align-items: center; justify-content: center; flex-shrink: 0; width: 26px; height: 26px; border-radius: var(--fx-radius-full); background: var(--fx-color-primary); color: var(--fx-color-on-primary); font-weight: 700; }
#sw-restaurant .rs-sign { margin-bottom: var(--fx-space-6); }
#sw-restaurant .rs-sign b { display: block; font-family: var(--fx-font-family-heading); color: var(--fx-color-primary); }
#sw-restaurant .rs-sign small { color: var(--fx-color-text-muted); }
#sw-restaurant .rs-story-stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--fx-space-5); padding-top: var(--fx-space-5); border-top: 1px solid var(--fx-color-border); }
#sw-restaurant .rs-sstat strong { display: block; font-family: var(--fx-font-family-heading); color: var(--fx-color-primary); }
#sw-restaurant .rs-sstat small { color: var(--fx-color-text-muted); }

/* specialties */
#sw-restaurant .rs-spec-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--fx-space-5); }
#sw-restaurant .rs-spec { padding: var(--fx-space-8) var(--fx-space-6); background: var(--fx-color-surface); border: 1px solid var(--fx-color-border); border-radius: var(--fx-radius-xl); text-align: center; }
#sw-restaurant .rs-spec .rs-emoji { display: flex; align-items: center; justify-content: center; width: 64px; height: 64px; margin: 0 auto var(--fx-space-4); border-radius: var(--fx-radius-full); background: var(--fx-color-surface-alt); color: var(--fx-color-primary); }
#sw-restaurant .rs-spec b { display: block; margin-bottom: var(--fx-space-2); font-family: var(--fx-font-family-heading); }
#sw-restaurant .rs-spec p { margin: 0; color: var(--fx-color-text-muted); }

/* gallery */
#sw-restaurant .rs-gal-grid { display: grid; grid-template-columns: repeat(4, 1fr); grid-auto-rows: 160px; gap: var(--fx-space-4); }
#sw-restaurant .rs-gal { flex-direction: column; gap: var(--fx-space-2); border-radius: var(--fx-radius-lg); }
#sw-restaurant .rs-gal--0 { grid-row: span 2; }
#sw-restaurant .rs-gal--3 { grid-column: span 2; }
#sw-restaurant .rs-gal-emoji { color: var(--fx-color-on-primary); }
#sw-restaurant .rs-gal-label { color: color-mix(in srgb, var(--fx-color-on-primary) 88%, transparent); font-weight: 600; }

/* booking band */
#sw-restaurant .rs-book { padding: var(--fx-space-12); border-radius: var(--fx-radius-2xl); color: var(--fx-color-on-secondary); background: linear-gradient(135deg, var(--fx-color-secondary), color-mix(in srgb, var(--fx-color-primary) 55%, var(--fx-color-secondary))); }
#sw-restaurant .rs-book-head { max-width: 560px; margin: 0 auto var(--fx-space-8); text-align: center; }
#sw-restaurant .rs-book-head h2 { margin: var(--fx-space-2) 0 var(--fx-space-3); color: var(--fx-color-on-secondary); }
#sw-restaurant .rs-book-head p { margin: 0; color: color-mix(in srgb, var(--fx-color-on-secondary) 80%, transparent); }
#sw-restaurant .rs-book-form { max-width: 720px; margin: 0 auto; }
#sw-restaurant .rs-book-fields { display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--fx-space-4); margin-bottom: var(--fx-space-4); }
#sw-restaurant .rs-field label { display: block; margin-bottom: var(--fx-space-1); color: color-mix(in srgb, var(--fx-color-on-secondary) 80%, transparent); }
#sw-restaurant .rs-field input { width: 100%; padding: var(--fx-space-3); border: none; border-radius: var(--fx-radius-md); background: var(--fx-color-surface); color: var(--fx-color-text); font-family: var(--fx-font-family-base); }
#sw-restaurant .rs-field input:focus-visible { outline: 2px solid var(--fx-color-focus-ring); outline-offset: 1px; }
#sw-restaurant .rs-book-note { display: block; margin-top: var(--fx-space-3); text-align: center; color: color-mix(in srgb, var(--fx-color-on-secondary) 70%, transparent); }

/* reviews */
#sw-restaurant .rs-rev-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--fx-space-5); }
#sw-restaurant .rs-rev { padding: var(--fx-space-6); background: var(--fx-color-surface); border: 1px solid var(--fx-color-border); border-radius: var(--fx-radius-lg); box-shadow: var(--fx-shadow-sm); }
#sw-restaurant .rs-rev .rs-stars { margin-bottom: var(--fx-space-3); }
#sw-restaurant .rs-rev p { margin: 0 0 var(--fx-space-4); color: var(--fx-color-text); }
#sw-restaurant .rs-rev-head { display: flex; align-items: center; gap: var(--fx-space-3); }
#sw-restaurant .rs-av { width: 44px; height: 44px; border-radius: var(--fx-radius-full); background: linear-gradient(135deg, var(--fx-color-primary), var(--fx-color-warning)); }
#sw-restaurant .rs-rev-head b { display: block; font-family: var(--fx-font-family-heading); }
#sw-restaurant .rs-rev-head small { color: var(--fx-color-text-muted); }

/* awards */
#sw-restaurant .rs-awards { display: grid; grid-template-columns: repeat(4, 1fr); gap: var(--fx-space-5); padding: var(--fx-space-8); border-radius: var(--fx-radius-2xl); background: var(--fx-color-surface); border: 1px solid var(--fx-color-border); box-shadow: var(--fx-shadow-md); }
#sw-restaurant .rs-award { display: flex; align-items: center; justify-content: center; gap: var(--fx-space-3); }
#sw-restaurant .rs-award .rs-emoji { color: var(--fx-color-warning); }
#sw-restaurant .rs-award strong { display: block; font-family: var(--fx-font-family-heading); color: var(--fx-color-primary); }
#sw-restaurant .rs-award small { color: var(--fx-color-text-muted); }

/* CTA band */
#sw-restaurant .rs-cta { display: grid; grid-template-columns: 1.3fr 1fr; gap: var(--fx-space-6); align-items: center; padding: var(--fx-space-12); border-radius: var(--fx-radius-2xl); color: var(--fx-color-on-primary); background: linear-gradient(120deg, var(--fx-color-primary), var(--fx-color-secondary)); }
#sw-restaurant .rs-cta h2 { margin: 0 0 var(--fx-space-2); font-family: var(--fx-font-family-heading); color: var(--fx-color-on-primary); }
#sw-restaurant .rs-cta p { margin: 0 0 var(--fx-space-5); color: color-mix(in srgb, var(--fx-color-on-primary) 85%, transparent); }
#sw-restaurant .rs-cta-art { display: flex; align-items: center; justify-content: center; min-height: 160px; border-radius: var(--fx-radius-lg); background: color-mix(in srgb, var(--fx-color-on-primary) 14%, transparent); }

/* footer */
#sw-restaurant .rs-footer { padding: var(--fx-space-16) 0 var(--fx-space-6); color: var(--fx-color-on-secondary); background: var(--fx-color-secondary); }
#sw-restaurant .rs-foot-grid { display: grid; grid-template-columns: 1.6fr 1fr 1fr 1.3fr; gap: var(--fx-space-8); }
#sw-restaurant .rs-foot-about { color: color-mix(in srgb, var(--fx-color-on-secondary) 64%, transparent); margin: var(--fx-space-3) 0 var(--fx-space-4); }
#sw-restaurant .rs-socials { display: flex; gap: var(--fx-space-2); }
#sw-restaurant .rs-socials span { display: flex; align-items: center; justify-content: center; width: 32px; height: 32px; border-radius: var(--fx-radius-full); background: color-mix(in srgb, var(--fx-color-on-secondary) 12%, transparent); color: var(--fx-color-on-secondary); cursor: pointer; }
#sw-restaurant .rs-foot-col h4 { margin: 0 0 var(--fx-space-4); color: var(--fx-color-on-secondary); font-family: var(--fx-font-family-heading); }
#sw-restaurant .rs-foot-col a { display: block; margin-bottom: var(--fx-space-2); color: color-mix(in srgb, var(--fx-color-on-secondary) 64%, transparent); }
#sw-restaurant .rs-hour { display: flex; justify-content: space-between; gap: var(--fx-space-3); margin-bottom: var(--fx-space-2); color: color-mix(in srgb, var(--fx-color-on-secondary) 64%, transparent); }
#sw-restaurant .rs-hour-time { color: var(--fx-color-warning); }
#sw-restaurant .rs-foot-bottom { display: flex; flex-wrap: wrap; justify-content: space-between; gap: var(--fx-space-3); margin-top: var(--fx-space-10); padding-top: var(--fx-space-5); border-top: 1px solid color-mix(in srgb, var(--fx-color-on-secondary) 12%, transparent); color: color-mix(in srgb, var(--fx-color-on-secondary) 55%, transparent); }

/* responsive */
@media (max-width: 960px) {
  #sw-restaurant .rs-links { position: absolute; top: 0; right: 0; z-index: 60; flex-direction: column; justify-content: center; gap: var(--fx-space-6); width: min(78vw, 320px); height: 100vh; padding: var(--fx-space-10); background: var(--fx-color-secondary); transform: translateX(100%); transition: transform 0.35s ease; }
  #sw-restaurant .rs-links a { color: var(--fx-color-on-secondary); }
  #sw-restaurant .rs-links.is-open { transform: translateX(0); }
  #sw-restaurant .rs-burger { display: flex; z-index: 70; }
  #sw-restaurant .rs-hero-inner, #sw-restaurant .rs-story, #sw-restaurant .rs-cta { grid-template-columns: 1fr; }
  #sw-restaurant .rs-strip-grid, #sw-restaurant .rs-dish-grid, #sw-restaurant .rs-spec-grid, #sw-restaurant .rs-gal-grid, #sw-restaurant .rs-book-fields, #sw-restaurant .rs-rev-grid, #sw-restaurant .rs-awards, #sw-restaurant .rs-foot-grid { grid-template-columns: 1fr 1fr; }
  #sw-restaurant .rs-gal-grid { grid-auto-rows: 150px; }
  #sw-restaurant .rs-gal--0 { grid-row: auto; }
  #sw-restaurant .rs-gal--3 { grid-column: auto; }
}
@media (max-width: 600px) {
  #sw-restaurant .rs-hero-dishes, #sw-restaurant .rs-strip-grid, #sw-restaurant .rs-dish-grid, #sw-restaurant .rs-spec-grid, #sw-restaurant .rs-gal-grid, #sw-restaurant .rs-book-fields, #sw-restaurant .rs-story-stats, #sw-restaurant .rs-rev-grid, #sw-restaurant .rs-awards, #sw-restaurant .rs-foot-grid { grid-template-columns: 1fr; }
}
`;
