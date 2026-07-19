/**
 * Kitchen-sink shell (U11). Two surfaces share one live theme:
 *   • `/`        — the component workbench (every registered showcase)
 *   • `/screens` — four flagship reference screens (doc 08 §2.2–2.5) composed
 *                  end-to-end from flexa-ui against the MSW mock backend, the
 *                  proof that the kit builds real product screens with no
 *                  one-off component CSS.
 *
 * The ThemeBar state is applied once here (scoped `[data-fx-theme="kitchen"]`)
 * and both surfaces render inside it, so brand/scheme/density drive the screens
 * exactly as they drive the workbench. The same theme is mirrored onto <body> so
 * body-portaled popovers (Select/DatePicker/Autocomplete menus, dialogs, toasts)
 * — which mount outside the themed subtree — still resolve the live tokens
 * instead of rendering with bare fallbacks (transparent panels).
 */
import { useEffect, useMemo, useState } from 'react';
import { Navigate, NavLink, Route, Routes } from 'react-router-dom';
import { FxToastRegion } from 'flexa-ui-kit';
import { INITIAL_THEME, ThemeBar, themeCss, type ThemeState } from './ThemeBar';
import { ComponentsView } from './views/ComponentsView';
import { ScreensIndex } from './screens/ScreensIndex';
import { SearchResults } from './screens/SearchResults';
import { ListingDetail } from './screens/ListingDetail';
import { Checkout } from './screens/Checkout';
import { OrderDetail } from './screens/OrderDetail';
import { BuyerRoutes } from './screens/buyer/routes';
import { SellerRoutes } from './screens/seller/routes';
import { AdminRoutes } from './screens/admin/routes';
import { MessagesRoutes } from './screens/messages/routes';

const NAV = [
  { to: '/', label: 'Components', end: true },
  { to: '/screens', label: 'Screens', end: false },
];

export function App() {
  const [theme, setTheme] = useState<ThemeState>(INITIAL_THEME);
  const css = useMemo(() => themeCss(theme), [theme]);

  // Mirror the live theme onto <body> so portaled popovers (which mount at the
  // body level, outside the themed subtree) resolve the kitchen tokens.
  useEffect(() => {
    const { body } = document;
    body.dataset.fxTheme = 'kitchen';
    body.dataset.fxScheme = theme.scheme;
    return () => {
      delete body.dataset.fxTheme;
      delete body.dataset.fxScheme;
    };
  }, [theme.scheme]);

  return (
    <div className="ks-root">
      {/* Trusted by construction: emitTheme output over this page's own state. */}
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <div className="ks-topbar">
        <nav className="ks-tabs" aria-label="Workbench sections">
          {NAV.map((n) => (
            <NavLink key={n.to} to={n.to} end={n.end} className="ks-tab">
              {n.label}
            </NavLink>
          ))}
        </nav>
        <ThemeBar state={theme} onChange={setTheme} />
      </div>

      <Routes>
        <Route path="/" element={<ComponentsView scheme={theme.scheme} />} />
        <Route
          path="/screens/*"
          element={
            <div className="ks-screen-root" data-fx-theme="kitchen" data-fx-scheme={theme.scheme}>
              {/* One app-wide toast region so screens can call useToast(). */}
              <FxToastRegion>
                <Routes>
                  <Route index element={<ScreensIndex />} />
                  <Route path="search" element={<SearchResults />} />
                  <Route path="listings/:id" element={<ListingDetail />} />
                  <Route path="listings" element={<ListingDetail />} />
                  <Route path="checkout/*" element={<Checkout />} />
                  <Route path="orders/:id" element={<OrderDetail />} />
                  <Route path="orders" element={<OrderDetail />} />
                  {/* U13 persona route groups (doc 15 §3) — each track owns
                      its module; this wiring never changes again. */}
                  <Route path="buyer/*" element={<BuyerRoutes />} />
                  <Route path="seller/*" element={<SellerRoutes />} />
                  <Route path="admin/*" element={<AdminRoutes />} />
                  <Route path="messages/*" element={<MessagesRoutes />} />
                </Routes>
              </FxToastRegion>
            </div>
          }
        />
        {/* Stale in-page hashes (e.g. an old `#input` anchor) become router
            paths under the HashRouter — fall back to the workbench. */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}
