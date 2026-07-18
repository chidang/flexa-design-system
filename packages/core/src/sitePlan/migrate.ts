/**
 * SitePlan migration — the upgrade seam for stored plans (mirror
 * migrateDesignState, S2). No-throw: it sits in front of sitePlanSchema on
 * every read path, so anything it cannot migrate passes through for the
 * validator to reject.
 */

import { SITE_PLAN_VERSION } from './shared.js';

/** Upgrades one plan envelope from version `from` to `from + 1`. */
export type SitePlanMigration = (plan: Record<string, unknown>) => Record<string, unknown>;

const SITE_PLAN_MIGRATIONS: ReadonlyMap<number, SitePlanMigration> = new Map();

/**
 * Run a migration chain over a candidate plan. NEVER throws — it sits in front of
 * `sitePlanSchema` on every read path, so anything it cannot migrate (garbage, a
 * missing step, a version newer than this build) passes through UNCHANGED for the
 * validator to reject with a proper message. Unlike `runDesignStateMigrations`, a
 * MISSING `schemaVersion` is treated as 1 (the plan schema keeps it optional).
 * Exported so the contract tests can drive a synthetic chain.
 */
export function runSitePlanMigrations(
  input: unknown,
  migrations: ReadonlyMap<number, SitePlanMigration>,
  targetVersion: number = SITE_PLAN_VERSION,
): unknown {
  if (typeof input !== 'object' || input === null || Array.isArray(input)) return input;
  const record = input as Record<string, unknown>;
  const raw = record.schemaVersion;
  const from = raw === undefined ? 1 : raw;
  if (typeof from !== 'number' || !Number.isInteger(from) || from < 1) return input;
  if (from >= targetVersion) return input;
  let v = from;
  let out = record;
  while (v < targetVersion) {
    const step = migrations.get(v);
    if (!step) return input;
    out = step(out);
    v += 1;
  }
  return { ...out, schemaVersion: targetVersion };
}

/** Bring a stored plan up to `SITE_PLAN_VERSION` (no-throw; see the runner). */
export function migrateSitePlan(input: unknown): unknown {
  return runSitePlanMigrations(input, SITE_PLAN_MIGRATIONS);
}
