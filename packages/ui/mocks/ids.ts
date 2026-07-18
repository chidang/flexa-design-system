/**
 * Deterministic ULID minting for fixtures (doc 09 §1.4: 26-char Crockford
 * base32, lexically sortable by creation time). These are NOT real ULIDs — no
 * timestamp/randomness — but they satisfy the shape rules P10 (doc 12) requires:
 * exactly 26 chars from the Crockford alphabet, and monotonically increasing so
 * a sort by `id` matches insertion (== creation) order, like real ULIDs.
 *
 * A module-level counter keeps ids stable across a run without `Math.random`,
 * so kitchen-sink screenshots and any mock-backed tests stay reproducible.
 */

/** Crockford base32 alphabet (no I, L, O, U). */
const CROCKFORD = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';

let counter = 0;

/** Encode a non-negative integer as a right-padded 26-char Crockford string. */
function encode(n: number): string {
  let out = '';
  let v = n;
  while (v > 0) {
    out = CROCKFORD[v % 32] + out;
    v = Math.floor(v / 32);
  }
  // Left side is a fixed prefix so ids look plausible; the counter lives in the
  // low bytes, giving lexical order == creation order across the whole run.
  return ('0FX' + out.padStart(23, '0')).slice(0, 26);
}

/** Mint the next deterministic id. Optionally namespaced for readability. */
export function ulid(): string {
  counter += 1;
  return encode(counter);
}

/** Reset the counter — used by fixture rebuilds and determinism tests. */
export function resetIds(): void {
  counter = 0;
}
