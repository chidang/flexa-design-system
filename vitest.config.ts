import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: [
      'packages/**/*.spec.ts',
      'adapters/**/*.spec.ts',
      'tests/**/*.spec.ts',
      // P-G (doc 16): composed-screen a11y audit — JSX specs, hence .tsx too.
      'apps/ui-kitchen-sink/src/**/*.spec.{ts,tsx}',
    ],
    environment: 'node',
  },
  // React component specs (packages/ui) render JSX under the automatic runtime;
  // no effect on the JSX-free parity/unit specs. Per-file `@vitest-environment
  // jsdom` opts individual specs into a DOM.
  esbuild: { jsx: 'automatic' },
});
