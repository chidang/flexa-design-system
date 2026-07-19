/**
 * Shared display helpers for the U13-B buyer screens (doc 15 §4). Owned by the
 * buyer track (lives under `src/screens/buyer/**`). Formatting only — no visual
 * markup — so screens stay compositions of flexa-ui components.
 */
import type { Money } from 'flexa-ui-kit/mocks';

/** Money → `$xx.xx` (integer minor units in), sign-aware for the wallet ledger. */
export function formatMoney(money: Money): string {
  const sign = money.amount < 0 ? '-' : '';
  return `${sign}$${(Math.abs(money.amount) / 100).toFixed(2)}`;
}

/** ISO → a short readable date (timeline/table cells take verbatim strings). */
export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/** Whole-day countdown to an ISO instant, floored at 0 (auto-release windows). */
export function daysUntil(iso: string): number {
  const ms = new Date(iso).getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / 86_400_000));
}
