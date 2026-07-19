/**
 * Shared display helpers for the seller screens (doc 15 §4). Money and date
 * formatting only — no component styling. Money is integer minor units in.
 */
import type { Money } from 'flexa-ui-kit/mocks';

/** Money → `$xx.xx`; negative amounts render with a leading minus (ledger). */
export function formatMoney(money: Money): string {
  const sign = money.amount < 0 ? '-' : '';
  return `${sign}$${(Math.abs(money.amount) / 100).toFixed(2)}`;
}

/** ISO → a short readable date. */
export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}
