/**
 * U13-E messages-track routes + index links (doc 15 §4 — Messages §2.7 +
 * seller side §3.27, flow B5). OWNED by the messages track (doc 15 §5): only
 * this track edits this file and this directory. Mounted at
 * `/screens/messages/*` — route paths are relative.
 *
 * GAPS (doc 15 §6 — closest component used, no CSS patch, no fork):
 * - "View as: Buyer / Seller" segmented control: the kit has no
 *   FxSegmentedControl. Used FxTabs (`variant="contained"`, `size="sm"`, empty
 *   `content`) as the closest control — it renders a segmented pill group and
 *   drives selection. GAP: a dedicated FxSegmentedControl (label + N options,
 *   no panel) would fit the "toggle, not tabbed panels" intent better.
 * - FxChat has no built-in system-event deep-LINK: `kind:'system'` rows render
 *   a plain centered body string (no anchor). We surface the order/listing
 *   deep-link via the chat header `context` link (every thread carries one) and
 *   keep the milestone text in the system card body. GAP: FxChat could accept
 *   an optional `href`/`link` on a system message for a clickable event card.
 * - FxChat composer has no attachment picker in v1 (`onAttach` opens a host
 *   picker; none here). Attachment CARDS still render from fixtures on seeded
 *   messages, which is what the screen needs to demo. No workaround needed.
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
