import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  // Relative base so the built app works mounted at any path — served at the
  // dev root AND under fds.sitebefy.com/kitchen-sink/ by the docs deploy.
  // Routing is hash-based (HashRouter), so no rewrite rules are needed either.
  base: './',
});
