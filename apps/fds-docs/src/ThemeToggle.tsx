'use client';

/**
 * Light/dark toggle — dogfoods the FDS scheme contract: setting
 * `data-fx-scheme` on <html> wins over `prefers-color-scheme` (the emitted
 * auto block is guarded by `:not([data-fx-scheme])`). Removing the attribute
 * returns to the OS preference.
 */
import { useEffect, useState } from 'react';

type Choice = 'auto' | 'light' | 'dark';
const KEY = 'fds-docs-scheme';
const NEXT: Record<Choice, Choice> = { auto: 'dark', dark: 'light', light: 'auto' };
const LABEL: Record<Choice, string> = { auto: '◐ auto', dark: '● dark', light: '○ light' };

function apply(choice: Choice): void {
  if (choice === 'auto') document.documentElement.removeAttribute('data-fx-scheme');
  else document.documentElement.setAttribute('data-fx-scheme', choice);
}

export function ThemeToggle() {
  const [choice, setChoice] = useState<Choice>('auto');

  useEffect(() => {
    const saved = localStorage.getItem(KEY);
    if (saved === 'light' || saved === 'dark') {
      setChoice(saved);
      apply(saved);
    }
  }, []);

  const cycle = () => {
    const next = NEXT[choice];
    setChoice(next);
    apply(next);
    if (next === 'auto') localStorage.removeItem(KEY);
    else localStorage.setItem(KEY, next);
  };

  return (
    <button type="button" className="theme-toggle" onClick={cycle} title="Color scheme">
      {LABEL[choice]}
    </button>
  );
}
