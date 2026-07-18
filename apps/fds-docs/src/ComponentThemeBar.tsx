'use client';

/**
 * The one client island in the Components section: a scheme/brand toggle that
 * recolours the demo live, reusing the exact FDS pattern from Playground
 * (applyBrand → emitTheme as a NAMED theme). Its variables scope to
 * `[data-fx-theme="components"]`, so the demo restyles without touching the docs
 * chrome. The demo grid (a server component) is passed in as `children`.
 */
import { useMemo, useState, type ReactNode } from 'react';
import { applyBrand } from '@flexa/core';
import { defaultTheme, emitTheme } from 'flexa-design-system';

export function ComponentThemeBar({ children }: { children: ReactNode }) {
  const [scheme, setScheme] = useState<'light' | 'dark'>('light');
  const [primary, setPrimary] = useState('#4f46e5');

  const css = useMemo(
    () => emitTheme({ ...applyBrand(defaultTheme(), { primaryColor: primary }), name: 'components' }),
    [primary],
  );

  return (
    <div className="cx-demo">
      {/* Trusted by construction: emitTheme output over this component's state. */}
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <div className="cx-toolbar">
        <label>
          Scheme
          <select value={scheme} onChange={(e) => setScheme(e.target.value as 'light' | 'dark')}>
            <option value="light">light</option>
            <option value="dark">dark</option>
          </select>
        </label>
        <label>
          Primary
          <input type="color" value={primary} onChange={(e) => setPrimary(e.target.value)} />
        </label>
      </div>
      <div className="cx-stage" data-fx-theme="components" data-fx-scheme={scheme}>
        {children}
      </div>
    </div>
  );
}
