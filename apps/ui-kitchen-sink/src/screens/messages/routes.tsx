/**
 * U13-E messages-track routes + index links (doc 15 §4 — Messages §2.7 +
 * seller side §3.27, flow B5). OWNED by the messages track (doc 15 §5): only
 * this track edits this file and this directory. Mounted at
 * `/screens/messages/*` — route paths are relative.
 *
 * GAPS (doc 15 §6 — closest component used, no CSS patch, no fork):
 * All three messages-track gaps closed by the P-E3 professionalization slice
 * (doc 14 §11 / doc 16):
 * - G9 CLOSED: "View as: Buyer / Seller" now uses the dedicated
 *   FxSegmentedControl (label + N options, radiogroup semantics, no panels) —
 *   the FxTabs `contained` empty-panel workaround is gone.
 * - G10 CLOSED: `kind:'system'` messages carry `link: {href, label}` — event
 *   cards deep-link to the real order/listing screen (fixtures' `linkTo`).
 * - G11 CLOSED: the composer attach button surfaces the fixture-safe
 *   attachment picker (`attachmentOptions`, no real File objects); staged
 *   picks ride the send payload and render as attachment cards.
 */
import { Route, Routes } from 'react-router-dom';
import { ScreenNotFound, type ScreenLink } from '../shared';
import { MessagesScreen } from './MessagesScreen';
import './messages.css';

export const messagesLinks: ScreenLink[] = [
  {
    to: '/screens/messages',
    title: 'Messages',
    doc: '08 §2.7 · §3.27 · flow B5',
    blurb:
      'Two-pane inbox: Conversation List + Chat. "View as: Buyer / Seller" flips both sides of one thread; system cards deep-link to real orders/listings.',
  },
];

export function MessagesRoutes() {
  return (
    <Routes>
      <Route index element={<MessagesScreen />} />
      <Route path=":conversationId" element={<MessagesScreen />} />
      <Route path="*" element={<ScreenNotFound />} />
    </Routes>
  );
}
