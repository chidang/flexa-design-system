import type { Metadata } from 'next';
import { Playground } from '../../src/Playground';

export const metadata: Metadata = {
  title: 'Playground',
  description:
    'Derive a complete FDS theme from a brand — pick a color, fonts, radius, type scale and density, and watch applyBrand re-point the token system live.',
};

export default function PlaygroundPage() {
  return (
    <article>
      <h1>Playground</h1>
      <p>
        Everything below runs in your browser: <code>applyBrand</code> derives a full theme from
        your choices (hover/active shades, readable <code>on-primary</code>, whole type and spacing
        ramps), <code>emitTheme</code> emits it scoped to the preview, and{' '}
        <code>checkThemeContrast</code> reports WCAG failures live.
      </p>
      <Playground />
    </article>
  );
}
