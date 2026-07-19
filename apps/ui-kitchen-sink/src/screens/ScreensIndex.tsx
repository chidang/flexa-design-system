/**
 * Landing for the reference screens, grouped by persona (doc 15 U13-0). Pure
 * harness navigation — the screens themselves are where the kit is exercised.
 * Infra-owned: tracks contribute links via their own `<track>/routes.tsx`
 * exports; they never edit this file (doc 15 §5).
 */
import { Link } from 'react-router-dom';
import type { ScreenLink } from './shared';
import { buyerLinks } from './buyer/routes';
import { sellerLinks } from './seller/routes';
import { adminLinks } from './admin/routes';
import { messagesLinks } from './messages/routes';

/** The U11 flagship purchase screens (doc 08 §2.2–2.5) — buyer persona. */
const PURCHASE: ScreenLink[] = [
  { to: '/screens/search', title: 'Search Results', doc: '08 §2.2', blurb: 'Filter rail, facet counts, listing grid, cursor pagination.' },
  { to: '/screens/listings', title: 'Listing Detail', doc: '08 §2.3', blurb: 'Gallery, sticky buy box, variant select, reviews, related.' },
  { to: '/screens/checkout/cart', title: 'Checkout', doc: '08 §2.4', blurb: 'Four-step wizard: cart → details → payment → review.' },
  { to: '/screens/orders', title: 'Order Detail', doc: '08 §2.5', blurb: 'Escrow timeline, stage-gated approval, shipping & activity.' },
];

interface Group {
  title: string;
  blurb: string;
  links: ScreenLink[];
  pendingSlice?: string;
}

const GROUPS: Group[] = [
  {
    title: 'Buyer',
    blurb: 'Browse → buy → track → approve. The purchase flagships plus the buyer account surfaces.',
    links: [...PURCHASE, ...buyerLinks],
    pendingSlice: buyerLinks.length === 0 ? 'U13-B' : undefined,
  },
  {
    title: 'Seller',
    blurb: 'List → moderate → fulfil → get paid. Dashboard, listing editor, fulfilment, earnings.',
    links: sellerLinks,
    pendingSlice: sellerLinks.length === 0 ? 'U13-C' : undefined,
  },
  {
    title: 'Admin',
    blurb: 'Moderation queue, dispute resolution, platform health.',
    links: adminLinks,
    pendingSlice: adminLinks.length === 0 ? 'U13-D' : undefined,
  },
  {
    title: 'Messages',
    blurb: 'Conversation list + chat pane; both sides of the same thread.',
    links: messagesLinks,
    pendingSlice: messagesLinks.length === 0 ? 'U13-E' : undefined,
  },
];

/** The cross-persona ripple loops one shared mock db makes real (doc 15 §0). */
const TOURS = [
  'Buy & fulfil: pay in Checkout → the order appears in Seller › Fulfil → mark shipped → the buyer timeline advances → approve delivery → escrow releases → Seller › Earnings grows.',
  'Dispute: open a dispute from Order Detail → resolve it in Admin › Dispute Detail → the buyer order updates.',
  'Moderation: submit a listing in Seller › Listing Editor → approve it in Admin › Moderation → it shows up in Search Results.',
];

export function ScreensIndex() {
  return (
    <div className="ks-screen">
      <header className="ks-stack" style={{ ['--ks-gap' as string]: 'var(--fx-space-2)' }}>
        <h1 className="ks-page-title">Reference screens</h1>
        <p className="ks-muted">
          Marketplace product screens composed entirely from flexa-ui against the mock backend
          (<code>flexa-ui-kit/mocks</code>). No one-off component CSS — brand/scheme/density above
          drive them live. All personas share one in-memory db, so actions ripple across screens
          within a session:
        </p>
        <ul className="ks-muted" style={{ margin: 0, paddingInlineStart: 'var(--fx-space-5)' }}>
          {TOURS.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
      </header>
      {GROUPS.map((g) => (
        <section key={g.title} className="ks-stack" style={{ ['--ks-gap' as string]: 'var(--fx-space-3)' }}>
          <div>
            <h2 className="ks-group-title">{g.title}</h2>
            <p className="ks-muted" style={{ margin: 0 }}>{g.blurb}</p>
          </div>
          {g.links.length > 0 ? (
            <div className="ks-grid-cards">
              {g.links.map((s) => (
                <Link key={s.to} to={s.to} className="ks-screen-link">
                  <span className="ks-screen-link-doc">{s.doc}</span>
                  <strong>{s.title}</strong>
                  <span className="ks-muted">{s.blurb}</span>
                </Link>
              ))}
            </div>
          ) : (
            <p className="ks-muted">Coming in slice {g.pendingSlice} (doc 15).</p>
          )}
        </section>
      ))}
    </div>
  );
}
