/*
 * REALESTATE_CSS — the scanned, token-only stylesheet for the real-estate showcase page.
 *
 * Kept in a plain (non-client) module: the server route reads it as a real string
 * for the build-time token scan (usedTokens). Exporting it from the 'use client'
 * component module would hand the server a client-reference proxy instead of the
 * string. Scope: #sw-real-estate. Every design-intent value is an --fx-* token; type
 * comes from FDS base typography, so there is no font-size here.
 */
export const REALESTATE_CSS = `
#sw-real-estate {
  background: var(--fx-color-bg);
  color: var(--fx-color-text);
  border: 1px solid var(--fx-color-border);
  border-radius: var(--fx-radius-xl);
  overflow: hidden;
}
#sw-real-estate a { color: var(--fx-color-primary); text-decoration: none; }
#sw-real-estate .re-container {
  width: 100%;
  max-width: var(--fx-size-container-lg);
  margin: 0 auto;
  padding: 0 var(--fx-space-6);
}
#sw-real-estate .re-eyebrow {
  display: block;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-weight: 600;
  color: var(--fx-color-primary);
}
#sw-real-estate .re-eyebrow--light { color: var(--fx-color-warning); }
#sw-real-estate .re-head { max-width: 560px; margin: 0 auto var(--fx-space-8); text-align: center; }
#sw-real-estate .re-head h2 { margin: var(--fx-space-2) 0 var(--fx-space-3); }
#sw-real-estate .re-head p { margin: 0; color: var(--fx-color-text-muted); }
#sw-real-estate .re-head-row { display: flex; align-items: flex-end; justify-content: space-between; gap: var(--fx-space-4); margin-bottom: var(--fx-space-8); }
#sw-real-estate .re-head-row h2 { margin: var(--fx-space-2) 0 var(--fx-space-2); }
#sw-real-estate .re-head-row p { margin: 0; color: var(--fx-color-text-muted); }

#sw-real-estate .re-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--fx-space-2);
  padding: var(--fx-space-3) var(--fx-space-5);
  border: none;
  border-radius: var(--fx-radius-md);
  font-family: var(--fx-font-family-base);
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}
#sw-real-estate .re-btn:hover { transform: translateY(-2px); }
#sw-real-estate .re-btn--primary { background: var(--fx-color-primary); color: var(--fx-color-on-primary); box-shadow: var(--fx-shadow-sm); }
#sw-real-estate .re-btn--primary:hover { background: var(--fx-color-primary-hover); }
#sw-real-estate .re-btn--accent { background: var(--fx-color-warning); color: var(--fx-color-on-warning); box-shadow: var(--fx-shadow-sm); }
#sw-real-estate .re-btn--outline { background: transparent; color: var(--fx-color-primary); border: 1.5px solid var(--fx-color-border-strong); }
#sw-real-estate .re-btn--ghost { background: transparent; color: var(--fx-color-text); border: 1px solid var(--fx-color-border); }
#sw-real-estate .re-btn--onsec { background: transparent; color: var(--fx-color-on-secondary); border: 1.5px solid color-mix(in srgb, var(--fx-color-on-secondary) 40%, transparent); }
#sw-real-estate .re-btn--full { width: 100%; }

#sw-real-estate .re-ph {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 80px;
  border-radius: var(--fx-radius-lg);
  color: var(--fx-color-on-primary);
  font-weight: 600;
  text-align: center;
  background: linear-gradient(135deg, var(--fx-color-primary), var(--fx-color-secondary));
}

/* header */
#sw-real-estate .re-header { position: sticky; top: 0; z-index: 50; background: var(--fx-color-surface); box-shadow: var(--fx-shadow-sm); }
#sw-real-estate .re-nav { display: flex; align-items: center; justify-content: space-between; gap: var(--fx-space-4); padding: var(--fx-space-4) var(--fx-space-6); }
#sw-real-estate .re-brand { font-family: var(--fx-font-family-heading); font-weight: 800; color: var(--fx-color-primary); }
#sw-real-estate .re-links { display: flex; flex-wrap: wrap; gap: var(--fx-space-5); }
#sw-real-estate .re-links a { color: var(--fx-color-text); font-weight: 500; }
#sw-real-estate .re-links a.is-active { color: var(--fx-color-primary); }
#sw-real-estate .re-navright { display: flex; align-items: center; gap: var(--fx-space-3); }
#sw-real-estate .re-phone { color: var(--fx-color-text-muted); font-weight: 500; }
#sw-real-estate .re-burger { display: none; flex-direction: column; gap: 5px; padding: var(--fx-space-2); background: none; border: none; cursor: pointer; }
#sw-real-estate .re-burger span { width: 24px; height: 3px; border-radius: var(--fx-radius-full); background: var(--fx-color-secondary); }

/* hero */
#sw-real-estate .re-hero { padding: var(--fx-space-10) 0 var(--fx-space-6); }
#sw-real-estate .re-hero-card { position: relative; border-radius: var(--fx-radius-2xl); overflow: hidden; }
#sw-real-estate .re-hero-art { min-height: 480px; border-radius: 0; }
#sw-real-estate .re-hero-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: var(--fx-space-3);
  padding: var(--fx-space-12);
  color: var(--fx-color-on-secondary);
  background: linear-gradient(105deg, color-mix(in srgb, var(--fx-color-secondary) 88%, transparent), color-mix(in srgb, var(--fx-color-secondary) 20%, transparent));
}
#sw-real-estate .re-hero-overlay h1 { max-width: 560px; margin: var(--fx-space-1) 0 var(--fx-space-2); color: var(--fx-color-on-secondary); }
#sw-real-estate .re-hi { color: var(--fx-color-warning); }
#sw-real-estate .re-hero-overlay > p { max-width: 460px; margin: 0 0 var(--fx-space-4); color: color-mix(in srgb, var(--fx-color-on-secondary) 84%, transparent); }

/* search bar */
#sw-real-estate .re-search {
  display: grid;
  grid-template-columns: 1.6fr 1fr 1fr auto;
  gap: var(--fx-space-2);
  max-width: 720px;
  padding: var(--fx-space-2);
  background: var(--fx-color-surface);
  border-radius: var(--fx-radius-lg);
  box-shadow: var(--fx-shadow-xl);
}
#sw-real-estate .re-field { display: flex; flex-direction: column; padding: var(--fx-space-1) var(--fx-space-2); }
#sw-real-estate .re-field label { margin-bottom: var(--fx-space-1); color: var(--fx-color-text-muted); }
#sw-real-estate .re-field input { width: 100%; border: none; background: transparent; color: var(--fx-color-text); font-family: var(--fx-font-family-base); }
#sw-real-estate .re-field input:focus-visible { outline: 2px solid var(--fx-color-focus-ring); outline-offset: 2px; }
#sw-real-estate .re-search-btn { align-self: stretch; }

/* popular chips */
#sw-real-estate .re-popular { display: flex; flex-wrap: wrap; align-items: center; gap: var(--fx-space-2); margin-top: var(--fx-space-3); }
#sw-real-estate .re-popular-label { color: color-mix(in srgb, var(--fx-color-on-secondary) 80%, transparent); font-weight: 500; }
#sw-real-estate .re-chip { padding: var(--fx-space-1) var(--fx-space-3); border-radius: var(--fx-radius-full); background: color-mix(in srgb, var(--fx-color-on-secondary) 16%, transparent); color: var(--fx-color-on-secondary); }

/* generic section */
#sw-real-estate .re-section { padding: var(--fx-space-16) 0; }
#sw-real-estate .re-section--tight { padding: var(--fx-space-10) 0; }
#sw-real-estate .re-section--alt { background: var(--fx-color-surface-alt); }

/* stats */
#sw-real-estate .re-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: var(--fx-space-5); padding: var(--fx-space-6); background: var(--fx-color-surface); border: 1px solid var(--fx-color-border); border-radius: var(--fx-radius-xl); box-shadow: var(--fx-shadow-md); }
#sw-real-estate .re-stat { display: flex; align-items: center; justify-content: center; gap: var(--fx-space-3); }
#sw-real-estate .re-stat-ic { display: flex; align-items: center; justify-content: center; width: 48px; height: 48px; border-radius: var(--fx-radius-md); background: var(--fx-color-surface-alt); color: var(--fx-color-primary); }
#sw-real-estate .re-stat strong { display: block; font-family: var(--fx-font-family-heading); color: var(--fx-color-primary); }
#sw-real-estate .re-stat small { color: var(--fx-color-text-muted); }

/* tabs */
#sw-real-estate .re-tabs { display: flex; flex-wrap: wrap; justify-content: center; gap: var(--fx-space-2); margin-bottom: var(--fx-space-8); }
#sw-real-estate .re-tab { padding: var(--fx-space-2) var(--fx-space-4); border-radius: var(--fx-radius-full); background: var(--fx-color-surface-alt); color: var(--fx-color-text-muted); font-weight: 500; cursor: pointer; }
#sw-real-estate .re-tab.is-active { background: var(--fx-color-primary); color: var(--fx-color-on-primary); }

/* property cards */
#sw-real-estate .re-prop-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--fx-space-6); }
#sw-real-estate .re-prop { background: var(--fx-color-surface); border: 1px solid var(--fx-color-border); border-radius: var(--fx-radius-lg); overflow: hidden; box-shadow: var(--fx-shadow-sm); transition: transform 0.15s ease, box-shadow 0.15s ease; }
#sw-real-estate .re-prop:hover { transform: translateY(-4px); box-shadow: var(--fx-shadow-lg); }
#sw-real-estate .re-prop-img { min-height: 200px; border-radius: 0; align-items: flex-start; justify-content: space-between; padding: var(--fx-space-3); }
#sw-real-estate .re-tag { padding: var(--fx-space-1) var(--fx-space-3); border-radius: var(--fx-radius-sm); background: var(--fx-color-warning); color: var(--fx-color-on-warning); font-weight: 700; }
#sw-real-estate .re-price { padding: var(--fx-space-1) var(--fx-space-3); border-radius: var(--fx-radius-sm); background: var(--fx-color-surface); color: var(--fx-color-primary); font-family: var(--fx-font-family-heading); font-weight: 700; }
#sw-real-estate .re-prop-body { padding: var(--fx-space-4); }
#sw-real-estate .re-prop-body b { display: block; font-family: var(--fx-font-family-heading); }
#sw-real-estate .re-prop-body small { display: block; margin-top: var(--fx-space-1); color: var(--fx-color-text-muted); }
#sw-real-estate .re-meta { display: flex; flex-wrap: wrap; gap: var(--fx-space-3); margin: var(--fx-space-3) 0 var(--fx-space-4); padding-top: var(--fx-space-3); border-top: 1px solid var(--fx-color-border); color: var(--fx-color-text-muted); }

/* property types */
#sw-real-estate .re-type-grid { display: grid; grid-template-columns: repeat(6, 1fr); gap: var(--fx-space-4); }
#sw-real-estate .re-type { display: flex; flex-direction: column; align-items: center; gap: var(--fx-space-1); padding: var(--fx-space-6) var(--fx-space-3); background: var(--fx-color-surface); border: 1px solid var(--fx-color-border); border-radius: var(--fx-radius-lg); text-align: center; transition: transform 0.15s ease, border-color 0.15s ease; }
#sw-real-estate .re-type:hover { transform: translateY(-4px); border-color: var(--fx-color-primary); }
#sw-real-estate .re-type-ic { display: flex; align-items: center; justify-content: center; width: 56px; height: 56px; margin-bottom: var(--fx-space-2); border-radius: var(--fx-radius-full); background: var(--fx-color-surface-alt); color: var(--fx-color-primary); }
#sw-real-estate .re-type b { font-family: var(--fx-font-family-heading); }
#sw-real-estate .re-type small { color: var(--fx-color-text-muted); }

/* why choose us */
#sw-real-estate .re-why { display: grid; grid-template-columns: 1.1fr 1fr; gap: var(--fx-space-12); align-items: center; }
#sw-real-estate .re-why h2 { margin: var(--fx-space-2) 0 var(--fx-space-3); }
#sw-real-estate .re-why > div > p { margin: 0 0 var(--fx-space-6); color: var(--fx-color-text-muted); }
#sw-real-estate .re-why-grid { display: grid; grid-template-columns: 1fr 1fr; gap: var(--fx-space-5); }
#sw-real-estate .re-wf .re-ic { display: flex; align-items: center; justify-content: center; width: 44px; height: 44px; margin-bottom: var(--fx-space-2); border-radius: var(--fx-radius-md); background: var(--fx-color-surface-alt); color: var(--fx-color-primary); }
#sw-real-estate .re-wf b { display: block; margin-bottom: var(--fx-space-1); font-family: var(--fx-font-family-heading); }
#sw-real-estate .re-wf small { color: var(--fx-color-text-muted); }
#sw-real-estate .re-why-art { min-height: 380px; }

/* agents */
#sw-real-estate .re-agent-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: var(--fx-space-5); }
#sw-real-estate .re-agent { display: flex; flex-direction: column; align-items: center; gap: var(--fx-space-1); padding: var(--fx-space-6); background: var(--fx-color-surface); border: 1px solid var(--fx-color-border); border-radius: var(--fx-radius-lg); text-align: center; }
#sw-real-estate .re-av { width: 72px; height: 72px; margin-bottom: var(--fx-space-3); border-radius: var(--fx-radius-full); background: linear-gradient(135deg, var(--fx-color-primary), var(--fx-color-warning)); }
#sw-real-estate .re-agent b { font-family: var(--fx-font-family-heading); }
#sw-real-estate .re-agent small { color: var(--fx-color-text-muted); }
#sw-real-estate .re-agent-stats { display: flex; flex-wrap: wrap; justify-content: center; gap: var(--fx-space-3); margin-top: var(--fx-space-2); color: var(--fx-color-text-muted); }
#sw-real-estate .re-agent-rate { color: var(--fx-color-warning); }

/* cities */
#sw-real-estate .re-city-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: var(--fx-space-5); }
#sw-real-estate .re-city { position: relative; border-radius: var(--fx-radius-lg); overflow: hidden; }
#sw-real-estate .re-city-img { min-height: 220px; border-radius: 0; }
#sw-real-estate .re-city b { position: absolute; left: var(--fx-space-4); bottom: var(--fx-space-6); color: var(--fx-color-on-primary); font-family: var(--fx-font-family-heading); }
#sw-real-estate .re-city small { position: absolute; left: var(--fx-space-4); bottom: var(--fx-space-3); color: color-mix(in srgb, var(--fx-color-on-primary) 85%, transparent); }

/* testimonials */
#sw-real-estate .re-rev-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--fx-space-5); }
#sw-real-estate .re-rev { padding: var(--fx-space-6); background: var(--fx-color-surface); border: 1px solid var(--fx-color-border); border-radius: var(--fx-radius-lg); box-shadow: var(--fx-shadow-sm); }
#sw-real-estate .re-rev .re-stars { color: var(--fx-color-warning); margin-bottom: var(--fx-space-3); }
#sw-real-estate .re-rev > p { margin: 0 0 var(--fx-space-4); color: var(--fx-color-text-muted); }
#sw-real-estate .re-rev-head { display: flex; align-items: center; gap: var(--fx-space-3); }
#sw-real-estate .re-rev-head .re-av { width: 44px; height: 44px; margin: 0; }
#sw-real-estate .re-rev-head b { display: block; font-family: var(--fx-font-family-heading); }
#sw-real-estate .re-rev-head small { color: var(--fx-color-text-muted); }

/* CTA band */
#sw-real-estate .re-cta { display: grid; grid-template-columns: 1.4fr 1fr; gap: var(--fx-space-8); align-items: center; padding: var(--fx-space-12); border-radius: var(--fx-radius-2xl); color: var(--fx-color-on-secondary); background: linear-gradient(120deg, var(--fx-color-secondary), var(--fx-color-primary)); }
#sw-real-estate .re-cta h2 { margin: 0 0 var(--fx-space-2); color: var(--fx-color-on-secondary); }
#sw-real-estate .re-cta > div > p { margin: 0 0 var(--fx-space-5); color: color-mix(in srgb, var(--fx-color-on-secondary) 84%, transparent); }
#sw-real-estate .re-cta-actions { display: flex; flex-wrap: wrap; gap: var(--fx-space-3); }
#sw-real-estate .re-cta-art { display: flex; align-items: center; justify-content: center; min-height: 180px; border-radius: var(--fx-radius-lg); background: color-mix(in srgb, var(--fx-color-on-secondary) 14%, transparent); }

/* footer */
#sw-real-estate .re-footer { padding: var(--fx-space-16) 0 var(--fx-space-6); color: var(--fx-color-on-secondary); background: var(--fx-color-secondary); }
#sw-real-estate .re-foot-grid { display: grid; grid-template-columns: 1.6fr 1fr 1fr 1.3fr; gap: var(--fx-space-8); }
#sw-real-estate .re-foot-about { color: color-mix(in srgb, var(--fx-color-on-secondary) 62%, transparent); margin: var(--fx-space-3) 0 var(--fx-space-4); }
#sw-real-estate .re-socials { display: flex; gap: var(--fx-space-2); }
#sw-real-estate .re-socials span { display: flex; align-items: center; justify-content: center; width: 32px; height: 32px; border-radius: var(--fx-radius-full); background: color-mix(in srgb, var(--fx-color-on-secondary) 12%, transparent); color: var(--fx-color-on-secondary); cursor: pointer; }
#sw-real-estate .re-foot-col h4 { margin: 0 0 var(--fx-space-4); color: var(--fx-color-on-secondary); }
#sw-real-estate .re-foot-col a { display: block; margin-bottom: var(--fx-space-2); color: color-mix(in srgb, var(--fx-color-on-secondary) 62%, transparent); }
#sw-real-estate .re-foot-col p { color: color-mix(in srgb, var(--fx-color-on-secondary) 62%, transparent); margin: 0 0 var(--fx-space-3); }
#sw-real-estate .re-news { display: flex; padding: var(--fx-space-1); border-radius: var(--fx-radius-md); background: color-mix(in srgb, var(--fx-color-on-secondary) 12%, transparent); }
#sw-real-estate .re-news input { flex: 1; padding: var(--fx-space-2) var(--fx-space-3); border: none; background: transparent; color: var(--fx-color-on-secondary); font-family: var(--fx-font-family-base); }
#sw-real-estate .re-news input:focus-visible { outline: 2px solid var(--fx-color-focus-ring); }
#sw-real-estate .re-news button { width: 40px; border: none; border-radius: var(--fx-radius-sm); background: var(--fx-color-warning); color: var(--fx-color-on-warning); cursor: pointer; }
#sw-real-estate .re-foot-contact { margin-top: var(--fx-space-4); }
#sw-real-estate .re-foot-bottom { display: flex; flex-wrap: wrap; justify-content: space-between; gap: var(--fx-space-3); margin-top: var(--fx-space-10); padding-top: var(--fx-space-5); border-top: 1px solid color-mix(in srgb, var(--fx-color-on-secondary) 12%, transparent); color: color-mix(in srgb, var(--fx-color-on-secondary) 55%, transparent); }

/* responsive */
@media (max-width: 960px) {
  #sw-real-estate .re-links { position: absolute; top: 0; right: 0; z-index: 60; flex-direction: column; justify-content: center; gap: var(--fx-space-6); width: min(78vw, 320px); height: 100vh; padding: var(--fx-space-10); background: var(--fx-color-secondary); transform: translateX(100%); transition: transform 0.35s ease; }
  #sw-real-estate .re-links a { color: var(--fx-color-on-secondary); }
  #sw-real-estate .re-links.is-open { transform: translateX(0); }
  #sw-real-estate .re-burger { display: flex; z-index: 70; }
  #sw-real-estate .re-phone { display: none; }
  #sw-real-estate .re-hero-overlay { padding: var(--fx-space-6); }
  #sw-real-estate .re-search { grid-template-columns: 1fr 1fr; }
  #sw-real-estate .re-search-btn { grid-column: 1 / -1; }
  #sw-real-estate .re-head-row { flex-direction: column; align-items: flex-start; }
  #sw-real-estate .re-why, #sw-real-estate .re-cta { grid-template-columns: 1fr; }
  #sw-real-estate .re-stats, #sw-real-estate .re-prop-grid, #sw-real-estate .re-type-grid, #sw-real-estate .re-why-grid, #sw-real-estate .re-agent-grid, #sw-real-estate .re-city-grid, #sw-real-estate .re-rev-grid, #sw-real-estate .re-foot-grid { grid-template-columns: 1fr 1fr; }
}
@media (max-width: 600px) {
  #sw-real-estate .re-search { grid-template-columns: 1fr; }
  #sw-real-estate .re-stats, #sw-real-estate .re-prop-grid, #sw-real-estate .re-type-grid, #sw-real-estate .re-why-grid, #sw-real-estate .re-agent-grid, #sw-real-estate .re-city-grid, #sw-real-estate .re-rev-grid, #sw-real-estate .re-foot-grid { grid-template-columns: 1fr; }
}
`;
