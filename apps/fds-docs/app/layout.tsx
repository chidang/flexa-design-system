import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import Link from 'next/link';
import { applyBrand } from '@flexa/core';
import { FDS_VERSION, defaultTheme, emitTheme } from 'flexa-design-system';
import { loadSite } from '../src/content';
import { SiteNav } from '../src/SiteNav';
import './globals.css';

const site = loadSite();

export const metadata: Metadata = {
  metadataBase: new URL('https://fds.sitebefy.com'),
  title: {
    default: `${site.name} — ${site.tagline}`,
    template: `%s — ${site.name}`,
  },
  description: site.description,
  openGraph: {
    siteName: site.name,
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  // The site is styled by FDS itself: the theme stylesheet is emitted at build
  // time by the same canonical emitter the package exports (dogfooding). The
  // Flexa brand cyan (#3fc7f1) drives the whole system via applyBrand — the same
  // Level-2 → token bridge the Builder uses — so every fill, button, border and
  // hover reads as the brand. (Body-link *text* uses --fx-link in globals.css,
  // since the bright cyan is a fill colour, not an AA-legible ink on white.)
  const themeCss = emitTheme(applyBrand(defaultTheme(), { primaryColor: '#3fc7f1' }));
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <style id="fds-theme" dangerouslySetInnerHTML={{ __html: themeCss }} />
      </head>
      <body>
        <header className="site-header">
          <Link href="/" className="brand">
            <span className="brand-mark" aria-hidden>
              F
            </span>
            {site.name}
            <span className="version">v{FDS_VERSION}</span>
          </Link>
          <SiteNav npmUrl={site.npmUrl} repoUrl={site.repoUrl} />
        </header>
        <main>{children}</main>
        <footer className="site-footer">
          <p>
            {site.name} · MIT · <a href={site.repoUrl}>Source on GitHub</a>
          </p>
        </footer>
      </body>
    </html>
  );
}
