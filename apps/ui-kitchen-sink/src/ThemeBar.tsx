/**
 * Workbench theme controls — scheme / brand / density, exactly the FDS pattern
 * from apps/fds-docs Playground: state → applyBrand → emitTheme as a NAMED theme
 * so its vars scope to `[data-fx-theme="kitchen"]` and never fight the chrome.
 * The parent applies the emitted CSS + the scheme attribute to the preview area.
 */
import { applyBrand } from '@flexa/core';
import { defaultTheme, emitTheme } from 'flexa-design-system';

export type Scheme = 'light' | 'dark';

export interface ThemeState {
  scheme: Scheme;
  primary: string;
  density: number;
}

export const INITIAL_THEME: ThemeState = { scheme: 'light', primary: '#4f46e5', density: 1 };

/** The scoped CSS for the current controls (trusted: emitTheme over our state). */
export function themeCss(state: ThemeState): string {
  const theme = applyBrand(defaultTheme(), { primaryColor: state.primary, density: state.density });
  return emitTheme({ ...theme, name: 'kitchen' });
}

export function ThemeBar({
  state,
  onChange,
}: {
  state: ThemeState;
  onChange: (next: ThemeState) => void;
}) {
  return (
    <div className="ks-themebar">
      <strong className="ks-brand">flexa-ui</strong>
      <label>
        Scheme
        <select
          value={state.scheme}
          onChange={(e) => onChange({ ...state, scheme: e.target.value as Scheme })}
        >
          <option value="light">light</option>
          <option value="dark">dark</option>
        </select>
      </label>
      <label>
        Primary
        <input
          type="color"
          value={state.primary}
          onChange={(e) => onChange({ ...state, primary: e.target.value })}
        />
      </label>
      <label>
        Density · {state.density.toFixed(2)}×
        <input
          type="range"
          min={0.8}
          max={1.2}
          step={0.05}
          value={state.density}
          onChange={(e) => onChange({ ...state, density: Number(e.target.value) })}
        />
      </label>
    </div>
  );
}
