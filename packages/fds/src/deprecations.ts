/**
 * Flexa Design System — the deprecation registry (Track H, doc 20).
 *
 * INV-6 semver says renaming or removing a token is a MAJOR change with a
 * migration path — never a silent edit. This module is the machine-readable half
 * of that promise: the single source of truth for which tokens are on their way
 * out, what replaces them, and when they will be removed.
 *
 * The policy (see DEPRECATIONS.md) is "keep the old token one major, aliased":
 * when a token is renamed, its old id stays in the registry for the rest of the
 * current major as an `{new.id}` alias, and gets an entry here. Consumers keep
 * working; a build-time warning and `flexa-fds-codemod --map <deprecatedRenameMap>`
 * move them onto the new id before the removal major lands.
 *
 * Everything here is DATA + PURE FUNCTIONS. It holds no registry of its own —
 * `index.ts` runs `assertDeprecationsValid` against the real token set at load,
 * so a malformed or dishonest entry can never ship (an empty list passes
 * trivially, which is the honest state today: nothing has been deprecated yet).
 */

/** One token scheduled for removal, with its successor and timeline. */
export interface TokenDeprecation {
  /** The deprecated token id — still a live registry token during its window. */
  readonly id: string;
  /** The token id consumers should move to. Must be a real token. */
  readonly replacement: string;
  /** The FDS version this token was deprecated in (semver, informational). */
  readonly since: string;
  /** The FDS MAJOR version the token will be removed in — strictly a later major than `since`. */
  readonly removeIn: string;
  /** Optional human note explaining the rename. */
  readonly note?: string;
}

/**
 * The live deprecation list. EMPTY today — the design system has only ever added
 * tokens (INV-6), so nothing is deprecated. When a token is renamed, add its
 * entry here in the same major that introduces the replacement + alias.
 */
export const DEPRECATIONS: readonly TokenDeprecation[] = [];

/** Thrown when a deprecation entry is malformed — a build-time invariant. */
export class DeprecationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DeprecationError';
  }
}

/** Leading integer of a semver string, or NaN if it has none. */
function majorOf(version: string): number {
  const head = version.split('.')[0] ?? '';
  return /^\d+$/.test(head) ? Number(head) : NaN;
}

/**
 * Validate a deprecation list against the live token set. Throws on the first
 * dishonest entry so a bad deprecation can never ship:
 *
 *   - `replacement` must be a real token (never point consumers at a phantom),
 *   - `id` must still be a real token (the policy keeps it aliased for its window;
 *     a missing id means the alias was already dropped — that belongs in the
 *     changelog's removals, not the live deprecation list),
 *   - `id` !== `replacement` (a no-op deprecation is meaningless),
 *   - `removeIn` must be a strictly later MAJOR than `since` (removal is always a
 *     future major — the whole point of the one-major window),
 *   - no id may be deprecated twice.
 */
export function assertDeprecationsValid(
  list: readonly TokenDeprecation[],
  isKnownToken: (id: string) => boolean,
): void {
  const seen = new Set<string>();
  for (const d of list) {
    if (seen.has(d.id)) {
      throw new DeprecationError(`Token "${d.id}" is deprecated more than once`);
    }
    seen.add(d.id);
    if (d.id === d.replacement) {
      throw new DeprecationError(`Deprecation of "${d.id}" points at itself`);
    }
    if (!isKnownToken(d.replacement)) {
      throw new DeprecationError(
        `Deprecation of "${d.id}" replaces it with "${d.replacement}", which is not a registry token`,
      );
    }
    if (!isKnownToken(d.id)) {
      throw new DeprecationError(
        `Deprecated token "${d.id}" is not in the registry — a deprecated token must stay aliased for its window`,
      );
    }
    const sinceMajor = majorOf(d.since);
    const removeMajor = majorOf(d.removeIn);
    if (Number.isNaN(sinceMajor) || Number.isNaN(removeMajor)) {
      throw new DeprecationError(
        `Deprecation of "${d.id}" has an unparseable version (since "${d.since}", removeIn "${d.removeIn}")`,
      );
    }
    if (removeMajor <= sinceMajor) {
      throw new DeprecationError(
        `Deprecation of "${d.id}" removes it in ${d.removeIn}, not a later major than since ${d.since}`,
      );
    }
  }
}

/**
 * The rename map a deprecation list implies: `{ [oldId]: replacement }`. This is
 * exactly the shape `flexa-fds-codemod` consumes, so a consumer can migrate off
 * every deprecated token in one command without hand-writing a map.
 */
export function renameMap(list: readonly TokenDeprecation[]): Record<string, string> {
  const map: Record<string, string> = {};
  for (const d of list) map[d.id] = d.replacement;
  return map;
}

/** The deprecations scheduled for removal in a given major (feeds a major's migration note). */
export function removalsInMajor(
  list: readonly TokenDeprecation[],
  major: number,
): readonly TokenDeprecation[] {
  return list.filter((d) => majorOf(d.removeIn) === major);
}

/** True when `id` is a deprecated token. */
export function isDeprecated(id: string): boolean {
  return DEPRECATIONS.some((d) => d.id === id);
}

/** The deprecation entry for `id`, or undefined if it is not deprecated. */
export function deprecationOf(id: string): TokenDeprecation | undefined {
  return DEPRECATIONS.find((d) => d.id === id);
}

/** The live rename map (`{ oldId: replacement }`) for every currently deprecated token. */
export function deprecatedRenameMap(): Record<string, string> {
  return renameMap(DEPRECATIONS);
}
