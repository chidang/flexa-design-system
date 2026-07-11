/*
 * SAAS_CSS — the scanned, token-only stylesheet for the saas showcase page.
 *
 * Kept in a plain (non-client) module: the server route reads it as a real string
 * for the build-time token scan (usedTokens). Exporting it from the 'use client'
 * component module would hand the server a client-reference proxy instead of the
 * string. Scope: #sw-saas. Every design-intent value is an --fx-* token; type
 * comes from FDS base typography, so there is no font-size here.
 */
export const SAAS_CSS = `
#sw-saas {
  background: var(--fx-color-bg);
  color: var(--fx-color-text);
  border: 1px solid var(--fx-color-border);
  border-radius: var(--fx-radius-xl);
  overflow: hidden;
}
#sw-saas a { color: var(--fx-color-primary); text-decoration: none; }
#sw-saas .sa-container {
  width: 100%;
  max-width: var(--fx-size-container-lg);
  margin: 0 auto;
  padding: 0 var(--fx-space-6);
}
#sw-saas .sa-eyebrow {
  display: block;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-weight: 600;
  color: var(--fx-color-primary);
}
#sw-saas .sa-head { max-width: 620px; margin: 0 auto var(--fx-space-10); text-align: center; }
#sw-saas .sa-head h2 { margin: var(--fx-space-2) 0 var(--fx-space-3); }
#sw-saas .sa-head p { margin: 0; color: var(--fx-color-text-muted); }

#sw-saas .sa-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--fx-space-2);
  padding: var(--fx-space-3) var(--fx-space-6);
  border: none;
  border-radius: var(--fx-radius-md);
  font-family: var(--fx-font-family-base);
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}
#sw-saas .sa-btn:hover { transform: translateY(-2px); }
#sw-saas .sa-btn--sm { padding: var(--fx-space-2) var(--fx-space-4); }
#sw-saas .sa-btn--primary { background: var(--fx-color-primary); color: var(--fx-color-on-primary); box-shadow: var(--fx-shadow-sm); }
#sw-saas .sa-btn--primary:hover { background: var(--fx-color-primary-hover); }
#sw-saas .sa-btn--accent { background: var(--fx-color-warning); color: var(--fx-color-on-warning); box-shadow: var(--fx-shadow-sm); }
#sw-saas .sa-btn--outline { background: transparent; color: var(--fx-color-primary); border: 1.5px solid var(--fx-color-border-strong); }
#sw-saas .sa-btn--full { width: 100%; }

#sw-saas .sa-ph {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 80px;
  border-radius: var(--fx-radius-lg);
  color: var(--fx-color-on-primary);
  font-weight: 600;
  text-align: center;
  background: linear-gradient(135deg, var(--fx-color-primary), color-mix(in srgb, var(--fx-color-warning) 60%, var(--fx-color-primary)));
}

/* header */
#sw-saas .sa-header { position: sticky; top: 0; z-index: 50; background: var(--fx-color-surface); box-shadow: var(--fx-shadow-sm); }
#sw-saas .sa-nav { display: flex; align-items: center; justify-content: space-between; gap: var(--fx-space-4); padding: var(--fx-space-4) var(--fx-space-6); }
#sw-saas .sa-brand { font-family: var(--fx-font-family-heading); font-weight: 800; color: var(--fx-color-primary); }
#sw-saas .sa-links { display: flex; flex-wrap: wrap; gap: var(--fx-space-5); }
#sw-saas .sa-links a { color: var(--fx-color-text); font-weight: 500; }
#sw-saas .sa-links a.is-active { color: var(--fx-color-primary); }
#sw-saas .sa-navright { display: flex; align-items: center; gap: var(--fx-space-4); }
#sw-saas .sa-login { color: var(--fx-color-text); font-weight: 500; }
#sw-saas .sa-burger { display: none; flex-direction: column; gap: var(--fx-space-1); padding: var(--fx-space-2); background: none; border: none; cursor: pointer; }
#sw-saas .sa-burger span { width: 24px; height: 3px; border-radius: var(--fx-radius-full); background: var(--fx-color-secondary); }

/* hero */
#sw-saas .sa-hero { padding: var(--fx-space-16) 0 var(--fx-space-12); }
#sw-saas .sa-hero-inner { display: grid; grid-template-columns: 1.05fr 0.95fr; gap: var(--fx-space-10); align-items: center; }
#sw-saas .sa-badge { display: inline-flex; align-items: center; gap: var(--fx-space-2); padding: var(--fx-space-1) var(--fx-space-3) var(--fx-space-1) var(--fx-space-1); border-radius: var(--fx-radius-full); background: var(--fx-color-surface-alt); color: var(--fx-color-text-muted); font-weight: 500; }
#sw-saas .sa-badge-tag { padding: var(--fx-space-1) var(--fx-space-2); border-radius: var(--fx-radius-full); background: var(--fx-color-warning); color: var(--fx-color-on-warning); font-weight: 700; letter-spacing: 0.05em; }
#sw-saas .sa-hero-text h1 { margin: var(--fx-space-5) 0 var(--fx-space-4); }
#sw-saas .sa-hl { color: var(--fx-color-primary); }
#sw-saas .sa-hero-text > p { max-width: 460px; margin: 0 0 var(--fx-space-6); color: var(--fx-color-text-muted); }
#sw-saas .sa-hero-cta { display: flex; flex-wrap: wrap; gap: var(--fx-space-3); }

/* hero product panel */
#sw-saas .sa-hero-panel { padding: var(--fx-space-4); border-radius: var(--fx-radius-2xl); background: var(--fx-color-surface); border: 1px solid var(--fx-color-border); box-shadow: var(--fx-shadow-xl); }
#sw-saas .sa-panel-head { display: flex; align-items: center; gap: var(--fx-space-2); padding-bottom: var(--fx-space-3); margin-bottom: var(--fx-space-4); border-bottom: 1px solid var(--fx-color-border); }
#sw-saas .sa-panel-head .sa-dot { width: 10px; height: 10px; border-radius: var(--fx-radius-full); background: var(--fx-color-border-strong); }
#sw-saas .sa-panel-head small { margin-left: auto; color: var(--fx-color-text-muted); }
#sw-saas .sa-panel-rows { display: flex; flex-direction: column; gap: var(--fx-space-2); margin-bottom: var(--fx-space-4); }
#sw-saas .sa-panel-row { display: flex; align-items: center; justify-content: space-between; padding: var(--fx-space-3); border-radius: var(--fx-radius-md); background: var(--fx-color-surface-alt); }
#sw-saas .sa-panel-row .sa-hl-t { color: var(--fx-color-warning); font-weight: 700; }
#sw-saas .sa-panel-stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--fx-space-2); }
#sw-saas .sa-panel-stats > div { padding: var(--fx-space-3); border-radius: var(--fx-radius-md); background: var(--fx-color-surface-alt); text-align: center; }
#sw-saas .sa-panel-stats strong { display: block; font-family: var(--fx-font-family-heading); color: var(--fx-color-primary); }
#sw-saas .sa-panel-stats small { color: var(--fx-color-text-muted); }

/* trust row */
#sw-saas .sa-trust { margin-top: var(--fx-space-12); padding-top: var(--fx-space-8); border-top: 1px solid var(--fx-color-border); text-align: center; }
#sw-saas .sa-trust-label { display: block; margin-bottom: var(--fx-space-5); color: var(--fx-color-text-muted); }
#sw-saas .sa-trust-logos { display: flex; flex-wrap: wrap; align-items: center; justify-content: center; gap: var(--fx-space-8); color: var(--fx-color-text-subtle); font-family: var(--fx-font-family-heading); font-weight: 700; }

/* generic section */
#sw-saas .sa-section { padding: var(--fx-space-16) 0; }
#sw-saas .sa-section--alt { background: var(--fx-color-surface-alt); }

/* features */
#sw-saas .sa-feat-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--fx-space-5); }
#sw-saas .sa-feat { padding: var(--fx-space-6); background: var(--fx-color-surface); border: 1px solid var(--fx-color-border); border-radius: var(--fx-radius-lg); }
#sw-saas .sa-feat .sa-ic { display: flex; align-items: center; justify-content: center; width: 48px; height: 48px; margin-bottom: var(--fx-space-4); border-radius: var(--fx-radius-md); background: var(--fx-color-surface-alt); color: var(--fx-color-primary); }
#sw-saas .sa-feat b { display: block; margin-bottom: var(--fx-space-2); }
#sw-saas .sa-feat p { margin: 0; color: var(--fx-color-text-muted); }

/* workflow steps */
#sw-saas .sa-flow-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: var(--fx-space-5); }
#sw-saas .sa-flow { position: relative; padding: var(--fx-space-6); background: var(--fx-color-surface); border: 1px solid var(--fx-color-border); border-radius: var(--fx-radius-lg); }
#sw-saas .sa-flow-num { display: flex; align-items: center; justify-content: center; width: 40px; height: 40px; margin-bottom: var(--fx-space-4); border-radius: var(--fx-radius-full); background: var(--fx-color-primary); color: var(--fx-color-on-primary); font-family: var(--fx-font-family-heading); font-weight: 700; }
#sw-saas .sa-flow b { display: block; margin-bottom: var(--fx-space-2); }
#sw-saas .sa-flow p { margin: 0; color: var(--fx-color-text-muted); }

/* big feature splits */
#sw-saas .sa-split { display: grid; grid-template-columns: 1fr 1fr; gap: var(--fx-space-12); align-items: center; margin-top: var(--fx-space-10); }
#sw-saas .sa-split.is-reverse .sa-split-art { order: 2; }
#sw-saas .sa-split-art { min-height: 300px; }
#sw-saas .sa-split-copy h3 { margin: 0 0 var(--fx-space-3); }
#sw-saas .sa-split-copy > p { margin: 0 0 var(--fx-space-5); color: var(--fx-color-text-muted); }
#sw-saas .sa-ticks { display: flex; flex-direction: column; gap: var(--fx-space-3); margin: 0; padding: 0; list-style: none; }
#sw-saas .sa-ticks li { position: relative; padding-left: var(--fx-space-8); color: var(--fx-color-text); }
#sw-saas .sa-ticks li::before { content: "✓"; position: absolute; left: 0; display: flex; align-items: center; justify-content: center; width: 24px; height: 24px; border-radius: var(--fx-radius-full); background: var(--fx-color-warning); color: var(--fx-color-on-warning); font-weight: 700; }

/* metrics band (dark) */
#sw-saas .sa-metrics { display: grid; grid-template-columns: 1fr 1.6fr; gap: var(--fx-space-10); align-items: center; padding: var(--fx-space-12); border-radius: var(--fx-radius-2xl); color: var(--fx-color-on-secondary); background: linear-gradient(135deg, var(--fx-color-secondary), var(--fx-color-primary)); }
#sw-saas .sa-metrics-head h2 { margin: 0 0 var(--fx-space-2); color: var(--fx-color-on-secondary); }
#sw-saas .sa-metrics-head p { margin: 0; color: color-mix(in srgb, var(--fx-color-on-secondary) 78%, transparent); }
#sw-saas .sa-metrics-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--fx-space-6); }
#sw-saas .sa-metric strong { display: block; font-family: var(--fx-font-family-heading); color: var(--fx-color-warning); }
#sw-saas .sa-metric small { color: color-mix(in srgb, var(--fx-color-on-secondary) 72%, transparent); }

/* integrations */
#sw-saas .sa-int-grid { display: grid; grid-template-columns: repeat(6, 1fr); gap: var(--fx-space-4); }
#sw-saas .sa-int { display: flex; flex-direction: column; align-items: center; gap: var(--fx-space-2); padding: var(--fx-space-5); background: var(--fx-color-surface); border: 1px solid var(--fx-color-border); border-radius: var(--fx-radius-lg); text-align: center; }
#sw-saas .sa-int-ic { display: flex; align-items: center; justify-content: center; width: 44px; height: 44px; border-radius: var(--fx-radius-md); background: var(--fx-color-surface-alt); }
#sw-saas .sa-int b { color: var(--fx-color-text); }

/* pricing */
#sw-saas .sa-price-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--fx-space-5); align-items: start; }
#sw-saas .sa-price { position: relative; display: flex; flex-direction: column; padding: var(--fx-space-8) var(--fx-space-6); background: var(--fx-color-surface); border: 1px solid var(--fx-color-border); border-radius: var(--fx-radius-xl); box-shadow: var(--fx-shadow-sm); }
#sw-saas .sa-price.is-featured { border: 2px solid var(--fx-color-primary); box-shadow: var(--fx-shadow-lg); }
#sw-saas .sa-pop { position: absolute; top: 0; right: var(--fx-space-6); transform: translateY(-50%); padding: var(--fx-space-1) var(--fx-space-4); border-radius: var(--fx-radius-full); background: var(--fx-color-warning); color: var(--fx-color-on-warning); font-weight: 700; }
#sw-saas .sa-price-name { display: block; margin-bottom: var(--fx-space-2); color: var(--fx-color-text-muted); text-transform: uppercase; letter-spacing: 0.06em; }
#sw-saas .sa-price-amt { font-family: var(--fx-font-family-heading); font-weight: 800; color: var(--fx-color-text); }
#sw-saas .sa-price-amt span { color: var(--fx-color-text-muted); font-family: var(--fx-font-family-base); font-weight: 500; }
#sw-saas .sa-price-note { display: block; margin: var(--fx-space-2) 0 var(--fx-space-5); color: var(--fx-color-text-muted); }
#sw-saas .sa-price-feats { display: flex; flex-direction: column; gap: var(--fx-space-3); margin: 0 0 var(--fx-space-6); padding: var(--fx-space-5) 0 0; border-top: 1px solid var(--fx-color-border); list-style: none; }
#sw-saas .sa-price-feats li { position: relative; padding-left: var(--fx-space-6); color: var(--fx-color-text); }
#sw-saas .sa-price-feats li::before { content: "✓"; position: absolute; left: 0; color: var(--fx-color-warning); font-weight: 700; }
#sw-saas .sa-price .sa-btn { margin-top: auto; }

/* testimonials */
#sw-saas .sa-testi-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--fx-space-5); }
#sw-saas .sa-testi { padding: var(--fx-space-6); background: var(--fx-color-surface); border: 1px solid var(--fx-color-border); border-radius: var(--fx-radius-lg); }
#sw-saas .sa-testi.is-featured { color: var(--fx-color-on-secondary); background: var(--fx-color-secondary); border-color: var(--fx-color-secondary); }
#sw-saas .sa-testi-head { display: flex; align-items: center; gap: var(--fx-space-3); margin-bottom: var(--fx-space-4); }
#sw-saas .sa-av { width: 44px; height: 44px; border-radius: var(--fx-radius-full); background: linear-gradient(135deg, var(--fx-color-primary), var(--fx-color-warning)); }
#sw-saas .sa-testi-head b { display: block; }
#sw-saas .sa-testi-head small { color: var(--fx-color-text-muted); }
#sw-saas .sa-testi.is-featured .sa-testi-head small { color: color-mix(in srgb, var(--fx-color-on-secondary) 72%, transparent); }
#sw-saas .sa-stars { margin-bottom: var(--fx-space-3); color: var(--fx-color-warning); }
#sw-saas .sa-testi p { margin: 0; color: var(--fx-color-text-muted); }
#sw-saas .sa-testi.is-featured p { color: color-mix(in srgb, var(--fx-color-on-secondary) 88%, transparent); }

/* final CTA band (dark) */
#sw-saas .sa-cta { display: grid; grid-template-columns: 1.6fr auto; gap: var(--fx-space-6); align-items: center; padding: var(--fx-space-12); border-radius: var(--fx-radius-2xl); color: var(--fx-color-on-secondary); background: var(--fx-color-secondary); }
#sw-saas .sa-cta h2 { margin: 0 0 var(--fx-space-2); color: var(--fx-color-on-secondary); }
#sw-saas .sa-cta p { margin: 0; color: color-mix(in srgb, var(--fx-color-on-secondary) 80%, transparent); }

/* footer */
#sw-saas .sa-footer { padding: var(--fx-space-16) 0 var(--fx-space-6); color: var(--fx-color-on-secondary); background: var(--fx-color-secondary); }
#sw-saas .sa-foot-grid { display: grid; grid-template-columns: 2fr 1fr 1fr 1fr; gap: var(--fx-space-8); }
#sw-saas .sa-foot-about { color: color-mix(in srgb, var(--fx-color-on-secondary) 62%, transparent); margin: var(--fx-space-3) 0 var(--fx-space-4); max-width: 320px; }
#sw-saas .sa-socials { display: flex; gap: var(--fx-space-2); }
#sw-saas .sa-socials span { display: flex; align-items: center; justify-content: center; width: 32px; height: 32px; border-radius: var(--fx-radius-full); background: color-mix(in srgb, var(--fx-color-on-secondary) 12%, transparent); color: var(--fx-color-on-secondary); cursor: pointer; }
#sw-saas .sa-foot-col h4 { margin: 0 0 var(--fx-space-4); color: var(--fx-color-on-secondary); }
#sw-saas .sa-foot-col a { display: block; margin-bottom: var(--fx-space-2); color: color-mix(in srgb, var(--fx-color-on-secondary) 62%, transparent); }
#sw-saas .sa-foot-bottom { display: flex; flex-wrap: wrap; justify-content: space-between; gap: var(--fx-space-3); margin-top: var(--fx-space-10); padding-top: var(--fx-space-5); border-top: 1px solid color-mix(in srgb, var(--fx-color-on-secondary) 12%, transparent); color: color-mix(in srgb, var(--fx-color-on-secondary) 55%, transparent); }

/* responsive */
@media (max-width: 960px) {
  #sw-saas .sa-links { position: absolute; top: 0; right: 0; z-index: 60; flex-direction: column; justify-content: center; gap: var(--fx-space-6); width: min(78vw, 320px); height: 100vh; padding: var(--fx-space-10); background: var(--fx-color-secondary); transform: translateX(100%); transition: transform 0.35s ease; }
  #sw-saas .sa-links a { color: var(--fx-color-on-secondary); }
  #sw-saas .sa-links.is-open { transform: translateX(0); }
  #sw-saas .sa-burger { display: flex; z-index: 70; }
  #sw-saas .sa-login { display: none; }
  #sw-saas .sa-hero-inner, #sw-saas .sa-metrics, #sw-saas .sa-cta { grid-template-columns: 1fr; }
  #sw-saas .sa-split, #sw-saas .sa-split.is-reverse { grid-template-columns: 1fr; gap: var(--fx-space-6); }
  #sw-saas .sa-split.is-reverse .sa-split-art { order: 0; }
  #sw-saas .sa-cta { text-align: center; }
  #sw-saas .sa-feat-grid, #sw-saas .sa-flow-grid, #sw-saas .sa-metrics-grid, #sw-saas .sa-int-grid, #sw-saas .sa-price-grid, #sw-saas .sa-testi-grid, #sw-saas .sa-foot-grid { grid-template-columns: 1fr 1fr; }
}
@media (max-width: 600px) {
  #sw-saas .sa-hero-text h1 br { display: none; }
  #sw-saas .sa-feat-grid, #sw-saas .sa-flow-grid, #sw-saas .sa-metrics-grid, #sw-saas .sa-int-grid, #sw-saas .sa-price-grid, #sw-saas .sa-testi-grid, #sw-saas .sa-foot-grid, #sw-saas .sa-panel-stats { grid-template-columns: 1fr; }
}
`;
