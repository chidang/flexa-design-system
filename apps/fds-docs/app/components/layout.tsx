import type { ReactNode } from 'react';
// flexa-ui's token-only component CSS. It only ever matches `.fx-*` elements,
// which exist solely inside these demos, so it cannot leak into the docs chrome
// — the class namespace IS the scope. Theme *variables* are scoped separately
// via `[data-fx-theme="components"]` (ComponentThemeBar).
import 'flexa-ui-kit/styles.css';
import './components.css';

export default function ComponentsLayout({ children }: { children: ReactNode }) {
  return <div className="components-section">{children}</div>;
}
