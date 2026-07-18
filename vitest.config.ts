import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['packages/**/*.spec.ts'],
    environment: 'node',
  },
  // React component specs (packages/ui) render JSX under the automatic runtime;
  // no effect on the JSX-free token/tool specs. Per-file `@vitest-environment
  // jsdom` opts individual specs into a DOM.
  esbuild: { jsx: 'automatic' },
});
