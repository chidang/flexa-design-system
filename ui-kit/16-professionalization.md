# 16 — Professionalization wave (P-tracks)

> **Status: WAVE 1 BUILT (2026-07-19).** All 8 tracks landed — P-B #296 · P-A #297 ·
> P-E1 #298 · P-F #299 · P-E3 #300 · P-G #301 · P-E2 #302 · P-D #303. G1–G11 all
> closed (doc 14 §11 status block). P-Z integration per §5: barrel wiring
> (FxNotificationList), the two mock-coherence crashes P-D's loops caught (seller
> ship/deliver responses now carry `payoutPreview`; dispute resolve returns the full
> case — `applyKnownBugShims` in tools/ui-e2e is now redundant, remove it in wave 2),
> combined gates, public mirror + deploy. Wave 2 (§4) is the remaining open scope
> (+ P-G's 4 findings in `a11y-screens-findings.md`). Plan discipline: U13 pattern (doc 15) —
> disjoint file ownership → zero-conflict parallel PRs → integration slice at the end.
> Read doc 15 §9 for the agent prompt discipline; this doc is the SSOT for scope + ownership.

## 0. Goal

flexa-ui-kit is broad (133 components, 18 reference screens, 2038 tests, 5 CI gates,
npm published) but thin on the *outward-facing* surfaces that make a design system read
as professional: component docs, release discipline, browser-level regression coverage,
and the component gaps the U13 screens catalogued (doc 14 §11 G1–G11).

## 1. Tracks (wave 1 — all parallel)

| Track | Deliverable | Branch |
|---|---|---|
| **P-A** | Component reference on fds-docs: generated props/API pages for all components from TS types + showcase sources, per-category landings, nav integration. Static-export safe. | `feat/ui-pro-docs-site` |
| **P-B** | Release pipeline: changesets for `packages/ui` (+`packages/fds` if trivial), `.github/workflows/release.yml` (manual dispatch, needs `NPM_TOKEN` secret — document it), CHANGELOG backfill for 0.1.0, README badges. | `feat/ui-pro-release` |
| **P-D** | Browser test harness `tools/ui-e2e/` — standalone npm package OUTSIDE the pnpm workspace (mirror `tools/observe` precedent: Playwright never enters the monorepo lockfile). Visual snapshots of the 18 screens × light/dark + e2e drive of the three U13 ripple loops against a locally built kitchen-sink. | `feat/ui-pro-e2e` |
| **P-E1** | Buyer-domain gaps: **G1** FxOrderCard action slot · **G2** full-page notification list composition · **G3** reviewable-order card. Adopt in buyer screens; update their GAPS comments. | `feat/ui-pro-gaps-buyer` |
| **P-E2** | Admin+seller-domain gaps: **G4** FxImageGalleryUpload fixture mode · **G5** Toolbar tabs slot · **G6** Split View queue-walk (J/K) · **G7** ConfirmationDialog `confirmDisabled` + children · **G8** Escrow Timeline inline admin actions. Adopt in admin/seller screens. | `feat/ui-pro-gaps-admin` |
| **P-E3** | Messages-domain gaps: **G9** FxSegmentedControl (NEW component — this track alone touches `src/index.ts`) · **G10** FxChat system-row deep-link · **G11** chat composer attachment picker (fixture-safe). Adopt in messages screens. | `feat/ui-pro-gaps-messages` |
| **P-F** | Bundle discipline: consumer tree-shaking verification, size budget gate in CI (own workflow file), kitchen-sink chunk splitting (>500 kB warning today). | `feat/ui-pro-bundle` |
| **P-G** | Screens a11y audit: axe over all 18 composed screens (jsdom specs), wired into the root vitest run. **Report-only** — violations land as a findings table in the PR body + a `ui-kit/a11y-screens-findings.md`; fixes are wave 2 (they'd touch screens owned by E-tracks). | `feat/ui-pro-a11y-screens` |

Public-repo CI on PRs already exists (`.github/workflows/ci.yml`) — no track needed.

## 2. File-ownership matrix (conflict-freedom by construction)

| Track | Owns (only these may be edited) |
|---|---|
| P-A | `apps/fds-docs/**` (new `/components` section + generation script). Reads `packages/ui` — never edits it. |
| P-B | `.changeset/**`, root `package.json` (devDeps only), `.github/workflows/release.yml`, `packages/ui/CHANGELOG.md`, `packages/ui/README.md` + root `README.md` (badges). |
| P-D | `tools/ui-e2e/**` only. |
| P-E1 | `packages/ui/src/order-card/**`, new notification-list component dir, new reviewable-order-card (or enrich existing dirs), their showcases, `apps/ui-kitchen-sink/src/screens/buyer/**`. |
| P-E2 | `packages/ui/src/{image-gallery-upload,toolbar,split-view,confirmation-dialog,escrow-timeline}/**` (actual dir names may differ — locate first), their showcases, `apps/ui-kitchen-sink/src/screens/{admin,seller}/**`. |
| P-E3 | `packages/ui/src/segmented-control/**` (new), `packages/ui/src/chat/**`, `packages/ui/src/index.ts` (barrel append — E3 EXCLUSIVE), showcases, `apps/ui-kitchen-sink/src/screens/messages/**`. |
| P-F | `packages/ui/package.json`, `apps/ui-kitchen-sink/{vite.config.ts,package.json}`, new script under `scripts/` or `packages/ui/scripts/`, `.github/workflows/size.yml`. |
| P-G | root `vitest.config.ts` (include glob), new spec files under `apps/ui-kitchen-sink/src/screens/`, `ui-kit/a11y-screens-findings.md` (new). |

Nobody edits `ui-kit/13-implementation-roadmap.md` / `14-refinement-audit.md` / this file —
the integration slice (P-Z, orchestrator) updates docs after merges.

## 3. Shared rules (every track)

- Fresh worktree ⇒ `pnpm install` then FULL `pnpm build` before any test run
  (gitignored generated assets otherwise cause ~19 false failures).
- Gates: `pnpm typecheck` green · `pnpm exec vitest run packages/ui` from repo root
  (there is NO per-package test script — `pnpm --filter flexa-ui-kit test` silently no-ops).
  Tracks not touching `packages/ui` still run typecheck.
- Kit discipline: token-only CSS (`--fx-*`), no literals (gates enforce); one component
  per dir; `Fx` prefix / `.fx-` classes; showcase per component; additive API only —
  no breaking changes to shipped props.
- English for code/comments/commits. Commit trailer:
  `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>`.
- Branch off `origin/main`, push, open a PR to `main` with `gh pr create` — do NOT merge.

## 4. Wave 2 (after wave-1 merges; not in flight)

RTL + copy/i18n seam for component defaults · theme-builder page on fds-docs ·
`create-flexa-marketplace` starter · a11y fixes from the P-G findings.

## 5. Integration (P-Z, orchestrator)

Merge PRs (any order; trivial conflicts resolved at merge) → update docs 13/14/16 →
mirror to public repo (preserve public `packages/ui/package.json` homepage/repository
fields) → Vercel deploy → live sweep.
