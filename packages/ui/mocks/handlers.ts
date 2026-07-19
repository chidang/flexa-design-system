/**
 * MSW handler barrel (doc 15 U13-0). The published `flexa-ui-kit/mocks` surface
 * is unchanged: `handlers` + `resetDb`. Core (U11) endpoints live in
 * `handlers.core.ts`; each U13 track owns exactly one `handlers.<track>.ts`
 * (doc 15 §5) so parallel tracks never touch a shared handler file.
 */
import { coreHandlers } from './handlers.core';
import { buyerHandlers } from './handlers.buyer';
import { sellerHandlers } from './handlers.seller';
import { adminHandlers } from './handlers.admin';
import { messagesHandlers } from './handlers.messages';

export { resetDb, registerReset, db, recomputeCart, type Db } from './db';

export const handlers = [
  ...coreHandlers,
  ...buyerHandlers,
  ...sellerHandlers,
  ...adminHandlers,
  ...messagesHandlers,
];
