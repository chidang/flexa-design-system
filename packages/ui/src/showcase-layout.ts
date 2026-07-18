/**
 * Presentation hints for showcase surfaces — how a registry-driven demo grid
 * (the kitchen-sink workbench, the fds-docs Components pages) should place each
 * component's variants. One shared source: these sets started life inside the
 * kitchen-sink view; the docs grid shipped without them and big components
 * (chat, AI panels, tables, 100vh layouts, open overlays) escaped their cells
 * and piled up. Pure data + tiny lookups — no React, no DOM.
 */

/** Slugs whose demo escapes a grid cell (open overlay / `position: fixed` /
 *  full-page 100vh composition) — render behind a "Preview" launcher that opens
 *  the variant in a full-screen surface, one at a time. */
export const SHOWCASE_LAUNCH: ReadonlySet<string> = new Set([
  // Open overlays + fixed surfaces (visible the moment they mount).
  'dialog',
  'confirmation-dialog',
  'command-palette',
  'right-drawer',
  'context-menu',
  'loading-overlay',
  'toast',
  'fab',
  'bulk-actions-bar',
  'bottom-navigation',
  'ai-assistant-panel',
  // Full-page (100vh) compositions that dominate the grid.
  'app-shell',
  'authentication-layout',
  'blank-state-layout',
  'settings-layout',
  'top-navigation-layout',
  'wizard-layout',
  'sidebar-layout',
  'error-page',
  'offline-state',
  'success-page',
]);

/** Slugs whose demo needs the full row — wide multi-step / table / board / feed
 *  surfaces overlap when squeezed into a narrow grid cell. */
export const SHOWCASE_WIDE: ReadonlySet<string> = new Set([
  'form-wizard',
  'table',
  'data-grid',
  'virtual-table',
  'kanban-board',
  'charts-container',
  'permission-matrix',
  'audit-log',
  'audit-timeline',
  'activity-timeline',
  'system-logs',
  'background-jobs-panel',
  'queue-monitor',
  'version-history',
  'chat',
  'comment-thread',
  'conversation-list',
  'notification-center',
  'top-navigation',
  'data-management-toolbar',
  'advanced-filters',
  'marketplace-statistics',
  'calendar',
  'nested-sidebar',
  'split-view',
  'maintenance-banner',
  'dashboard-layout',
  'warning-banner',
  'saved-filters',
]);

/** Slugs whose demo is a content card/banner that reads badly when squeezed into
 *  a narrow grid cell (text wraps a word per line, absolute badges overlap). Each
 *  variant gets its own row at a comfortable reading width. */
export const SHOWCASE_READABLE: ReadonlySet<string> = new Set([
  'ai-suggestion-card',
  'alert',
  'description-list',
  'tabs',
  'breadcrumb',
  'pagination',
  'search-bar',
  'review-card',
  'seller-card',
  'buyer-card',
  'file-upload',
  'drag-drop-upload',
  'avatar-upload',
  'image-gallery-upload',
  'empty-state',
  'quick-actions',
  'accordion',
  'gallery',
  'media-grid',
  'statistics-card',
  'progress-summary',
  'inline-error',
]);

/** Slugs whose variants want a fixed column count (desktop) stepping down on
 *  smaller viewports, instead of the auto-fill narrow columns. */
export const SHOWCASE_GRID_COLS: ReadonlyMap<string, 2 | 3 | 4> = new Map([
  ['prompt-input', 2],
  ['ai-diff-viewer', 2],
  ['rating', 4],
  ['tree', 3],
  ['widget', 3],
  ['activity-feed', 3],
  ['recent-activity', 3],
  ['quick-links', 3],
  ['product-card', 3],
  ['listing-card', 3],
  ['pricing-card', 3],
  ['order-card', 3],
  ['invoice-card', 3],
  ['cart-summary', 3],
  ['checkout-summary', 3],
  ['payment-status', 3],
  ['shipping-timeline', 3],
  ['escrow-timeline', 3],
  ['ai-generation-status', 3],
  ['ai-confidence-indicator', 3],
  ['approve-reject-panel', 3],
  ['ai-activity-history', 3],
]);

/** True when the slug's variants must open behind a full-screen launcher. */
export function showcaseLaunch(slug: string): boolean {
  return SHOWCASE_LAUNCH.has(slug);
}

export type ShowcaseCellKind = 'default' | 'wide' | 'readable';

/** Cell placement for one component's variants. */
export function showcaseCellKind(slug: string): ShowcaseCellKind {
  if (SHOWCASE_WIDE.has(slug)) return 'wide';
  if (SHOWCASE_READABLE.has(slug)) return 'readable';
  return 'default';
}

/** Fixed desktop column count for the slug's grid, if it wants one. */
export function showcaseGridCols(slug: string): 2 | 3 | 4 | undefined {
  return SHOWCASE_GRID_COLS.get(slug);
}
