import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

/**
 * flexa-ui-kit component dirs that OTHER component dirs import (the internal
 * dependency layer). They form one chunk so the remaining leaf components can
 * be split alphabetically without chunk cycles (leaf dirs have no edges to
 * each other by construction). Regenerate after adding cross-component
 * imports, from packages/ui/src:
 *   grep -rEho "from '\.\./[^/']+/" --include='*.ts*' . | sort -u
 * A stale list only reprints Rollup's circular-chunk hint — it never breaks
 * the build.
 */
const KIT_SHARED_DIRS = new Set([
  'activity-feed', 'advanced-filters', 'ai-confidence-indicator',
  'ai-generation-status', 'ai-suggestion-card', 'alert', 'audit-log',
  'avatar', 'badge', 'breadcrumb', 'button', 'card', 'cart-summary',
  'checkbox', 'chip', 'confirmation-dialog', 'context-menu',
  'currency-input', 'date-picker', 'description-list', 'dialog',
  'drag-drop-upload', 'empty-state', 'error-page', 'escrow-timeline',
  'file-upload', 'gallery', 'icon', 'input', 'list', 'metric-card',
  'product-card', 'progress', 'prompt-input', 'rating', 'right-drawer',
  'role-badge', 'saved-filters', 'search-bar', 'select', 'sidebar',
  'skeleton', 'statistic-block', 'stepper', 'switch', 'table', 'tabs',
  'tag', 'textarea', 'timeline', 'tooltip', 'validation-message',
]);

export default defineConfig({
  plugins: [react()],
  // Relative base so the built app works mounted at any path — served at the
  // dev root AND under fds.sitebefy.com/kitchen-sink/ by the docs deploy.
  // Routing is hash-based (HashRouter), so no rewrite rules are needed either.
  base: './',
  build: {
    rollupOptions: {
      output: {
        // Split the single >1 MB chunk into stable cache groups (doc 16, P-F):
        // react vendor / msw mock backend / flexa core+fds / lucide icons /
        // the kit itself. The kit alone is >500 kB minified (133 components +
        // showcases), so it splits into the shared dependency layer
        // (kit-shared) plus two alphabetical halves of the leaf components —
        // all under Rollup's 500 kB warning, no chunk cycles. App code stays
        // in the entry chunk. All chunks are referenced relatively, so the
        // `base: './'` subpath deploy and the relative MSW worker URL are
        // unaffected.
        manualChunks(id: string): string | undefined {
          if (/node_modules\/(react|react-dom|scheduler|react-router|react-router-dom|@remix-run)\//.test(id)) {
            return 'vendor';
          }
          if (/node_modules\/(msw|@mswjs|@bundled-es-modules|@open-draft|@inquirer|outvariant|strict-event-emitter|until-async|graphql|headers-polyfill|is-node-process|path-to-regexp|cookie|statuses)\//.test(id)) {
            return 'msw';
          }
          // Workspace packages resolve to real paths outside node_modules —
          // match them by path segment so the kit leaves the entry chunk too.
          const kitDir = /\/packages\/ui\/src\/([^/]+)\//.exec(id);
          if (kitDir) {
            if (KIT_SHARED_DIRS.has(kitDir[1])) return 'kit-shared';
            return kitDir[1] < 'n' ? 'kit-a' : 'kit-b';
          }
          if (id.includes('/packages/ui/')) {
            // Top-level src files: the barrel (index) and showcase registry
            // import every dir — keep them with the entry to stay acyclic;
            // the small shared leaves (enums, status-tone, anchor, showcase
            // helpers) join the shared chunk.
            return /\/src\/(index|registry)\.ts$/.test(id) ? undefined : 'kit-shared';
          }
          if (/\/packages\/(fds|core)\//.test(id)) return 'flexa-core';
          // Remaining node_modules (lucide-react icons + small utils).
          if (id.includes('node_modules')) return 'icons';
          return undefined;
        },
      },
    },
  },
});
