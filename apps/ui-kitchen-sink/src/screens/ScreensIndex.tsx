/**
 * Landing for the four flagship reference screens (doc 08 §2.2–2.5). Pure
 * harness navigation — the screens themselves are where the kit is exercised.
 */
import { Link } from 'react-router-dom';

const SCREENS = [
  { to: '/screens/search', title: 'Search Results', doc: '08 §2.2', blurb: 'Filter rail, facet counts, listing grid, cursor pagination.' },
  { to: '/screens/listings', title: 'Listing Detail', doc: '08 §2.3', blurb: 'Gallery, sticky buy box, variant select, reviews, related.' },
  { to: '/screens/checkout/cart', title: 'Checkout', doc: '08 §2.4', blurb: 'Four-step wizard: cart → details → payment → review.' },
  { to: '/screens/orders', title: 'Order Detail', doc: '08 §2.5', blurb: 'Escrow timeline, stage-gated approval, shipping & activity.' },
];

export function ScreensIndex() {
  return (
    <div className="ks-screen">
      <header className="ks-stack" style={{ ['--ks-gap' as string]: 'var(--fx-space-2)' }}>
        <h1 className="ks-page-title">Reference screens</h1>
        <p className="ks-muted">
          Flagship product screens composed entirely from flexa-ui against the mock backend
          (<code>flexa-ui/mocks</code>). No one-off component CSS — brand/scheme/density above
          drive them live.
        </p>
      </header>
      <div className="ks-grid-cards">
        {SCREENS.map((s) => (
          <Link key={s.to} to={s.to} className="ks-screen-link">
            <span className="ks-screen-link-doc">{s.doc}</span>
            <strong>{s.title}</strong>
            <span className="ks-muted">{s.blurb}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
