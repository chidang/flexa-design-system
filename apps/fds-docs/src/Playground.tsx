'use client';

/**
 * Live brand playground — the whole FDS pitch in one component: Brand in,
 * accessible Theme out, pure functions only, no server. The derived theme is
 * emitted as a NAMED theme, so its variables scope to the preview subtree
 * (`[data-fx-theme="playground"]`) and never fight the site chrome.
 */
import { useMemo, useState } from 'react';
import { applyBrand, RADIUS_PRESET_IDS, type Brand, type RadiusPreset } from '@flexa/core';
import { checkThemeContrast, defaultTheme, emitTheme } from 'flexa-design-system';

const FONTS: Record<string, string> = {
  'System sans': '',
  Georgia: 'Georgia, "Times New Roman", serif',
  Verdana: 'Verdana, Geneva, sans-serif',
  'Trebuchet MS': '"Trebuchet MS", Helvetica, sans-serif',
  Monospace: 'ui-monospace, SFMono-Regular, Menlo, monospace',
};

export function Playground() {
  const [primary, setPrimary] = useState('#4f46e5');
  const [secondary, setSecondary] = useState('#0f766e');
  const [headingFont, setHeadingFont] = useState('System sans');
  const [radius, setRadius] = useState<RadiusPreset>('md');
  const [ratio, setRatio] = useState(1.2);
  const [density, setDensity] = useState(1);

  const brand: Brand = useMemo(
    () => ({
      primaryColor: primary,
      secondaryColor: secondary,
      ...(FONTS[headingFont] ? { headingFont: FONTS[headingFont] } : {}),
      radius,
      fontScale: { ratio },
      density,
    }),
    [primary, secondary, headingFont, radius, ratio, density],
  );

  const theme = useMemo(() => applyBrand(defaultTheme(), brand), [brand]);
  const css = useMemo(() => emitTheme({ ...theme, name: 'playground' }), [theme]);
  const failures = useMemo(() => checkThemeContrast(theme), [theme]);

  return (
    <div className="playground">
      {/* Trusted by construction: emitTheme output over this page's own state. */}
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <div className="playground-controls">
        <label>
          Primary color
          <input type="color" value={primary} onChange={(e) => setPrimary(e.target.value)} />
        </label>
        <label>
          Secondary color
          <input type="color" value={secondary} onChange={(e) => setSecondary(e.target.value)} />
        </label>
        <label>
          Heading font
          <select value={headingFont} onChange={(e) => setHeadingFont(e.target.value)}>
            {Object.keys(FONTS).map((f) => (
              <option key={f}>{f}</option>
            ))}
          </select>
        </label>
        <label>
          Corner radius
          <select value={radius} onChange={(e) => setRadius(e.target.value as RadiusPreset)}>
            {RADIUS_PRESET_IDS.map((r) => (
              <option key={r}>{r}</option>
            ))}
          </select>
        </label>
        <label>
          Type scale ratio · {ratio.toFixed(2)}
          <input
            type="range"
            min={1.1}
            max={1.4}
            step={0.05}
            value={ratio}
            onChange={(e) => setRatio(Number(e.target.value))}
          />
        </label>
        <label>
          Density · {density.toFixed(2)}×
          <input
            type="range"
            min={0.8}
            max={1.2}
            step={0.05}
            value={density}
            onChange={(e) => setDensity(Number(e.target.value))}
          />
        </label>
        <div className="contrast-report" role="status">
          {failures.length === 0 ? (
            <span className="pass">✓ All WCAG AA pairs pass</span>
          ) : (
            <ul>
              {failures.map((f, i) => (
                <li key={i} className="fail">
                  {f.fg} on {f.bg} ({f.scheme}): {f.ratio.toFixed(2)}:1 &lt; {f.min}:1
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="preview" data-fx-theme="playground">
        <h2>Your brand, derived</h2>
        <p>
          Body text sits on <code>color.bg</code>; this paragraph spacing follows your density.
        </p>
        <p>
          <button type="button" className="btn btn-primary">
            Primary action
          </button>{' '}
          <button
            type="button"
            className="btn"
            style={{
              background: 'var(--fx-color-secondary)',
              color: 'var(--fx-color-on-secondary)',
            }}
          >
            Secondary
          </button>{' '}
          <button type="button" className="btn btn-ghost">
            Ghost
          </button>
        </p>
        <div className="card">
          <h3>Card surface</h3>
          <p>
            Radius preset <code>{radius}</code>, shadow and border all come from re-pointed tokens
            — nothing here was styled by hand for this preview.
          </p>
        </div>
      </div>
    </div>
  );
}
