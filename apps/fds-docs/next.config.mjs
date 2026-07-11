/**
 * FDS docs site (doc 19, FDS-3) — static export for GitHub Pages (QĐ-19.9).
 * `output: 'export'` pre-renders every page to HTML at build time (SEO without a
 * server). Served at the custom domain root https://fds.sitebefy.com
 * (apps/fds-docs/public/CNAME) ⇒ no basePath; DOCS_BASE_PATH is an optional
 * escape hatch for a bare project-Pages URL (chidang.github.io/flexa-builder).
 *
 * transpilePackages bắt buộc: workspace packages export thẳng .ts source
 * (không build step) — Next tự transpile khi bundle (mẫu apps/nextjs-demo).
 */

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  basePath: process.env.DOCS_BASE_PATH ?? '',
  trailingSlash: true,
  images: { unoptimized: true },
  transpilePackages: ['flexa-design-system', '@flexa/core'],
  webpack: (config) => {
    // Workspace packages viết import ESM-style `./x.js` nhưng file thật là .ts
    // (moduleResolution Bundler, không build step) — map lại cho webpack.
    config.resolve.extensionAlias = {
      ...config.resolve.extensionAlias,
      '.js': ['.ts', '.tsx', '.js'],
    };
    return config;
  },
};

export default nextConfig;
