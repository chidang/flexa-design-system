'use client';

/**
 * Primary site navigation with an accessible hamburger for narrow viewports.
 *
 * Desktop (≥ 52rem): the links render inline (CSS handles the layout). Mobile:
 * the links collapse behind a hamburger button — a full-width dropdown panel
 * anchored below the sticky header. The links stay in the DOM at every width
 * (SEO / no-CSS crawlers see them); only their presentation changes.
 *
 * A11y: the button carries `aria-controls` + `aria-expanded`; the menu closes
 * on Escape (returning focus to the button), on outside click, on link
 * activation, and when the viewport grows back to the desktop layout.
 */
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ThemeToggle } from './ThemeToggle';

const LINKS: readonly { href: string; label: string }[] = [
  { href: '/why/', label: 'Why FDS' },
  { href: '/guides/getting-started/', label: 'Guides' },
  { href: '/tokens/', label: 'Tokens' },
  { href: '/accessibility/', label: 'Accessibility' },
  { href: '/example/', label: 'Example' },
  { href: '/showcase/', label: 'Showcase' },
  { href: '/recipes/', label: 'Recipes' },
  { href: '/packs/', label: 'Packs' },
  { href: '/playground/', label: 'Playground' },
];

/** Monochrome brand marks — fill currentColor so they inherit the nav ink. */
function NpmIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden focusable="false">
      <path d="M1.763 0C.786 0 0 .786 0 1.763v20.474C0 23.214.786 24 1.763 24h20.474c.977 0 1.763-.786 1.763-1.763V1.763C24 .786 23.214 0 22.237 0zM5.13 5.323l13.837.019-.009 13.836h-3.464l.01-10.382h-3.456L12.04 19.17H5.113z" />
    </svg>
  );
}

function GitHubIcon() {
  return (
    <svg viewBox="0 0 16 16" width="20" height="20" fill="currentColor" aria-hidden focusable="false">
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82a7.6 7.6 0 0 1 2-.27c.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8z" />
    </svg>
  );
}

export function SiteNav({ npmUrl, repoUrl }: { npmUrl: string; repoUrl: string }) {
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  // Escape closes (focus returns to the button); an outside click closes too.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        btnRef.current?.focus();
      }
    };
    const onPointer = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('click', onPointer);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('click', onPointer);
    };
  }, [open]);

  // Reaching the desktop layout dismisses a menu left open on mobile.
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 52rem)');
    const onChange = () => {
      if (mq.matches) setOpen(false);
    };
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  const close = () => setOpen(false);

  return (
    <div className="nav-wrap" ref={wrapRef}>
      <nav id="site-menu" aria-label="Main" className={open ? 'is-open' : undefined}>
        {LINKS.map((l) => (
          <Link key={l.href} href={l.href} onClick={close}>
            {l.label}
          </Link>
        ))}
        <a href={npmUrl} className="nav-icon" aria-label="npm" onClick={close}>
          <NpmIcon />
          <span className="nav-icon-label">npm</span>
        </a>
        <a href={repoUrl} className="nav-icon" aria-label="GitHub" onClick={close}>
          <GitHubIcon />
          <span className="nav-icon-label">GitHub</span>
        </a>
      </nav>
      <div className="nav-actions">
        <ThemeToggle />
        <button
          ref={btnRef}
          type="button"
          className="nav-toggle"
          aria-label="Menu"
          aria-controls="site-menu"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          <span className="nav-toggle-bars" aria-hidden>
            <span />
            <span />
            <span />
          </span>
        </button>
      </div>
    </div>
  );
}
